import { ref } from 'vue';
import { sendDesktopNotification } from './windows-service';

// 语音命令配置
export interface VoiceCommandConfig {
  enabled: boolean;
  language: string;
  commandPrefix: string;
  continuousListening: boolean;
  showFeedback: boolean;
}

// 默认配置
export const defaultVoiceConfig: VoiceCommandConfig = {
  enabled: false,
  language: 'zh-CN',
  commandPrefix: '电脑',
  continuousListening: false,
  showFeedback: true
};

// 当前配置
export const voiceConfig = ref<VoiceCommandConfig>({ ...defaultVoiceConfig });

// 语音识别状态
export const voiceRecognitionActive = ref(false);
export const lastRecognizedText = ref('');

// 语音识别实例
let recognition: any = null;
let commandHandlers: Map<string, () => void> = new Map();

// 加载配置
export function loadVoiceConfig(): void {
  const savedConfig = localStorage.getItem('sci-fi-notes-voice');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      voiceConfig.value = { ...defaultVoiceConfig, ...parsed };
    } catch (e) {
      console.error('Failed to parse voice config', e);
    }
  }
}

// 保存配置
export function saveVoiceConfig(): void {
  localStorage.setItem('sci-fi-notes-voice', JSON.stringify(voiceConfig.value));
}

// 初始化语音识别
export function initVoiceRecognition(commands: Map<string, () => void>): void {
  // 检查浏览器支持
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return;
  }
  
  // 保存命令处理函数
  commandHandlers = commands;
  
  // 创建语音识别实例
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  // 配置语音识别
  recognition.continuous = voiceConfig.value.continuousListening;
  recognition.interimResults = false;
  recognition.lang = voiceConfig.value.language;
  
  // 处理识别结果
  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim().toLowerCase();
    lastRecognizedText.value = transcript;
    
    // 检查命令前缀
    const prefix = voiceConfig.value.commandPrefix.toLowerCase();
    if (transcript.startsWith(prefix)) {
      const command = transcript.substring(prefix.length).trim();
      processCommand(command);
    }
  };
  
  // 处理错误
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    voiceRecognitionActive.value = false;
  };
  
  // 处理结束
  recognition.onend = () => {
    voiceRecognitionActive.value = false;
    
    // 如果启用了连续监听，则重新开始
    if (voiceConfig.value.enabled && voiceConfig.value.continuousListening) {
      startVoiceRecognition();
    }
  };
}

// 开始语音识别
export function startVoiceRecognition(): void {
  if (!recognition || voiceRecognitionActive.value) return;
  
  try {
    recognition.start();
    voiceRecognitionActive.value = true;
    
    if (voiceConfig.value.showFeedback) {
      sendDesktopNotification('语音识别已启动', '请说出命令...');
    }
  } catch (e) {
    console.error('Failed to start speech recognition:', e);
  }
}

// 停止语音识别
export function stopVoiceRecognition(): void {
  if (!recognition || !voiceRecognitionActive.value) return;
  
  try {
    recognition.stop();
    voiceRecognitionActive.value = false;
    
    if (voiceConfig.value.showFeedback) {
      sendDesktopNotification('语音识别已停止', '');
    }
  } catch (e) {
    console.error('Failed to stop speech recognition:', e);
  }
}

// 切换语音识别
export function toggleVoiceRecognition(): void {
  if (voiceRecognitionActive.value) {
    stopVoiceRecognition();
  } else {
    startVoiceRecognition();
  }
}

// 处理语音命令
function processCommand(command: string): void {
  console.log('Processing voice command:', command);
  
  // 检查是否有匹配的命令
  for (const [cmdPattern, handler] of commandHandlers.entries()) {
    if (command.includes(cmdPattern)) {
      handler();
      
      if (voiceConfig.value.showFeedback) {
        sendDesktopNotification('执行命令', `"${command}"`);
      }
      
      return;
    }
  }
  
  // 没有匹配的命令
  if (voiceConfig.value.showFeedback) {
    sendDesktopNotification('未知命令', `"${command}"`);
  }
}

// 更新语音识别配置
export function updateVoiceRecognitionConfig(): void {
  if (!recognition) return;
  
  recognition.continuous = voiceConfig.value.continuousListening;
  recognition.lang = voiceConfig.value.language;
  
  // 如果启用了语音识别，则重新启动
  if (voiceConfig.value.enabled) {
    if (voiceRecognitionActive.value) {
      stopVoiceRecognition();
    }
    startVoiceRecognition();
  } else {
    stopVoiceRecognition();
  }
}

