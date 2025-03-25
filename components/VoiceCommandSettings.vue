<template>
  <div class="voice-command-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🎤</span> 语音命令设置
    </h3>
    
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm">启用语音命令</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enabled" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div v-if="config.enabled" class="space-y-3">
        <div>
          <label class="block text-sm mb-1">语言</label>
          <select 
            v-model="config.language" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          >
            <option value="zh-CN">中文 (简体)</option>
            <option value="zh-TW">中文 (繁体)</option>
            <option value="en-US">英语 (美国)</option>
            <option value="en-GB">英语 (英国)</option>
            <option value="ja-JP">日语</option>
            <option value="ko-KR">韩语</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm mb-1">命令前缀</label>
          <input 
            v-model="config.commandPrefix" 
            type="text"
            placeholder="例如：电脑、系统、助手..."
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
          <p class="text-xs text-blue-400 mt-1">
            说出前缀后再说命令，例如"{{ config.commandPrefix }}新建便签"
          </p>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">连续监听</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.continuousListening" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.continuousListening ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">显示反馈通知</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.showFeedback" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.showFeedback ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">可用语音命令</h4>
      
      <div class="bg-gray-900 rounded p-2 text-xs space-y-1 max-h-40 overflow-y-auto">
        <div v-for="(command, index) in availableCommands" :key="index" class="flex justify-between">
          <span class="text-blue-300">{{ command.command }}</span>
          <span class="text-gray-400">{{ command.description }}</span>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">语音识别状态</h4>
      
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm">状态:</span>
        <span 
          class="text-sm"
          :class="voiceRecognitionActive ? 'text-green-400' : 'text-red-400'"
        >
          {{ voiceRecognitionActive ? '监听中' : '已停止' }}
        </span>
      </div>
      
      <div v-if="voiceRecognitionActive" class="mb-2">
        <span class="text-sm">最后识别:</span>
        <div class="bg-gray-900 rounded p-2 text-xs mt-1">
          {{ lastRecognizedText || '(无)' }}
        </div>
      </div>
      
      <div class="flex justify-between">
        <button 
          @click="toggleRecognition" 
          class="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs"
          :disabled="!config.enabled"
        >
          {{ voiceRecognitionActive ? '停止监听' : '开始监听' }}
        </button>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetConfig" 
        class="flex-1 mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置设置
      </button>
      <button 
        @click="$emit('close')" 
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { 
  voiceConfig, 
  defaultVoiceConfig, 
  saveVoiceConfig, 
  VoiceCommandConfig,
  voiceRecognitionActive,
  lastRecognizedText,
  toggleVoiceRecognition,
  updateVoiceRecognitionConfig
} from '../services/voice-service';

export default defineComponent({
  name: 'VoiceCommandSettings',
  emits: ['close', 'update:config'],
  setup(props, { emit }) {
    const config = ref<VoiceCommandConfig>({ ...voiceConfig.value });
    
    // 可用命令列表
    const availableCommands = [
      { command: '新建便签', description: '创建新便签' },
      { command: '删除便签', description: '删除当前便签' },
      { command: '编辑便签', description: '编辑当前便签' },
      { command: '保存便签', description: '保存当前编辑' },
      { command: '切换模式', description: '切换紧凑/展开模式' },
      { command: '显示设置', description: '打开设置面板' },
      { command: '显示主题', description: '打开主题设置' },
      { command: '显示分类', description: '打开分类管理' },
      { command: '显示筛选', description: '打开筛选面板' },
      { command: '导出数据', description: '导出便签数据' },
      { command: '导入数据', description: '导入便签数据' },
      { command: '最小化', description: '最小化到系统托盘' },
      { command: '帮助', description: '显示帮助信息' }
    ];
    
    // 更新配置
    const updateConfig = () => {
      // 更新全局配置
      voiceConfig.value = { ...config.value };
      
      // 保存配置到本地存储
      saveVoiceConfig();
      
      // 更新语音识别配置
      updateVoiceRecognitionConfig();
      
      // 通知父组件
      emit('update:config', config.value);
    };
    
    // 重置配置
    const resetConfig = () => {
      config.value = { ...defaultVoiceConfig };
      updateConfig();
    };
    
    // 切换语音识别
    const toggleRecognition = () => {
      toggleVoiceRecognition();
    };
    
    onMounted(() => {
      // 确保配置是最新的
      config.value = { ...voiceConfig.value };
    });
    
    return {
      config,
      availableCommands,
      voiceRecognitionActive,
      lastRecognizedText,
      updateConfig,
      resetConfig,
      toggleRecognition
    };
  }
});
</script>

