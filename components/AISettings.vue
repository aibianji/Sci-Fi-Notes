<template>
  <div class="ai-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🤖</span> AI 辅助设置
    </h3>
    
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm">启用 AI 辅助功能</label>
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
          <label class="block text-sm mb-1">API 密钥</label>
          <input 
            v-model="config.apiKey" 
            type="password"
            placeholder="输入 OpenAI API 密钥..."
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">API 端点</label>
          <input 
            v-model="config.apiEndpoint" 
            type="text"
            placeholder="API 端点 URL..."
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">语言</label>
          <select 
            v-model="config.language" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          >
            <option value="zh-CN">中文 (简体)</option>
            <option value="zh-TW">中文 (繁体)</option>
            <option value="en-US">英语</option>
            <option value="ja-JP">日语</option>
            <option value="ko-KR">韩语</option>
          </select>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">自动分类便签</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.autoCategorizationEnabled" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.autoCategorizationEnabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">自动生成摘要</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.autoSummarizationEnabled" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.autoSummarizationEnabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">AI 辅助功能</h4>
      
      <div class="bg-gray-900 rounded p-2 text-xs space-y-1">
        <div class="mb-2">
          <span class="block text-blue-300 mb-1">便签内容生成</span>
          <div class="flex">
            <input 
              v-model="promptText" 
              type="text"
              placeholder="输入提示..."
              class="flex-1 bg-gray-800 text-blue-100 border border-blue-800 rounded-l p-1 text-xs focus:outline-none focus:border-blue-500"
              :disabled="!config.enabled || !config.apiKey || aiProcessing"
            />
            <button 
              @click="generateContent" 
              class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded-r border border-blue-600 text-xs"
              :disabled="!config.enabled || !config.apiKey || !promptText || aiProcessing"
            >
              生成
            </button>
          </div>
          <div v-if="generatedContent" class="mt-2 p-2 bg-gray-800 rounded border border-blue-900 max-h-20 overflow-y-auto">
            {{ generatedContent }}
            <div class="flex justify-end mt-1">
              <button 
                @click="copyToClipboard(generatedContent)" 
                class="text-blue-400 hover:text-blue-300 text-xs"
              >
                复制
                class="text-blue-400 hover:text-blue-300 text-xs"
              >
                复制
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <span class="block text-blue-300 mb-1">便签摘要生成</span>
          <button 
            @click="testSummarization" 
            class="w-full bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
            :disabled="!config.enabled || !config.apiKey || aiProcessing"
          >
            测试摘要功能
          </button>
        </div>
        
        <div>
          <span class="block text-blue-300 mb-1">便签分类测试</span>
          <button 
            @click="testCategorization" 
            class="w-full bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
            :disabled="!config.enabled || !config.apiKey || aiProcessing"
          >
            测试分类功能
          </button>
        </div>
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
import { defineComponent, ref, onMounted } from 'vue';
import { 
  aiConfig, 
  defaultAIConfig, 
  saveAIConfig, 
  AIConfig,
  aiProcessing,
  suggestNoteContent,
  summarizeNote,
  autocategorizeNote
} from '../services/ai-service';
import { sendDesktopNotification } from '../services/windows-service';

export default defineComponent({
  name: 'AISettings',
  emits: ['close', 'update:config', 'use-content'],
  setup(props, { emit }) {
    const config = ref<AIConfig>({ ...aiConfig.value });
    const promptText = ref('');
    const generatedContent = ref('');
    
    // 更新配置
    const updateConfig = () => {
      // 更新全局配置
      aiConfig.value = { ...config.value };
      
      // 保存配置到本地存储
      saveAIConfig();
      
      // 通知父组件
      emit('update:config', config.value);
    };
    
    // 重置配置
    const resetConfig = () => {
      config.value = { ...defaultAIConfig };
      updateConfig();
    };
    
    // 生成便签内容
    const generateContent = async () => {
      if (!promptText.value) return;
      
      try {
        const content = await suggestNoteContent(promptText.value);
        if (content) {
          generatedContent.value = content;
        }
      } catch (error) {
        console.error('Failed to generate content:', error);
      }
    };
    
    // 测试摘要功能
    const testSummarization = async () => {
      const testContent = `这是一个测试便签内容，用于测试AI摘要功能。这个便签包含了一些随机的信息，比如今天的天气很好，我计划下午去公园散步，然后晚上回来完成工作报告。明天上午还有一个重要的会议需要准备。希望这个测试能够成功生成一个简短而准确的摘要。`;
      
      try {
        const summary = await summarizeNote(testContent, 30);
        if (summary) {
          sendDesktopNotification('摘要测试成功', `原文(${testContent.length}字符) -> 摘要(${summary.length}字符): ${summary}`);
        }
      } catch (error) {
        console.error('Summarization test failed:', error);
      }
    };
    
    // 测试分类功能
    const testCategorization = async () => {
      const testContent = `需要准备下周一的项目会议，整理PPT和演示材料。联系张经理确认会议时间和参会人员。`;
      const testCategories = ['工作', '个人', '学习', '娱乐', '购物'];
      
      try {
        const category = await autocategorizeNote(testContent, testCategories);
        if (category) {
          sendDesktopNotification('分类测试成功', `内容被自动分类为: ${category}`);
        } else {
          sendDesktopNotification('分类测试结果', '无法确定合适的分类');
        }
      } catch (error) {
        console.error('Categorization test failed:', error);
      }
    };
    
    // 复制到剪贴板
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          sendDesktopNotification('已复制', '内容已复制到剪贴板');
        })
        .catch(err => {
          console.error('Failed to copy text:', err);
        });
    };
    
    // 使用生成的内容
    const useGeneratedContent = () => {
      if (generatedContent.value) {
        emit('use-content', generatedContent.value);
        sendDesktopNotification('已应用', '生成的内容已应用到便签');
      }
    };
    
    onMounted(() => {
      // 确保配置是最新的
      config.value = { ...aiConfig.value };
    });
    
    return {
      config,
      promptText,
      generatedContent,
      aiProcessing,
      updateConfig,
      resetConfig,
      generateContent,
      testSummarization,
      testCategorization,
      copyToClipboard,
      useGeneratedContent
    };
  }
});
</script>

