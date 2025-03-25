<template>
  <div class="voice-command-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-96">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🎤</span> 语音命令设置
    </h3>
    
    <div class="mb-4">
      <div class="mb-3">
        <label class="flex items-center text-sm">
          <input 
            type="checkbox" 
            v-model="config.enabled" 
            class="mr-2 accent-blue-500"
          />
          启用语音命令
        </label>
      </div>
      
      <div v-if="config.enabled" class="space-y-3">
        <div>
          <label class="block text-xs text-blue-400 mb-1">语言</label>
          <select 
            v-model="config.language" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs"
          >
            <option value="zh-CN">中文 (简体)</option>
            <option value="en-US">English (US)</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-blue-400 mb-1">命令前缀</label>
          <input 
            type="text" 
            v-model="config.commandPrefix" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs"
            placeholder="例如：便签"
          />
        </div>
        
        <div>
          <label class="block text-xs text-blue-400 mb-1">灵敏度: {{ config.sensitivity }}</label>
          <input 
            type="range" 
            v-model.number="config.sensitivity" 
            min="1" 
            max="10" 
            class="w-full accent-blue-500"
          />
        </div>
        
        <div>
          <label class="flex items-center text-xs">
            <input 
              type="checkbox" 
              v-model="config.continuousListening" 
              class="mr-2 accent-blue-500"
            />
            持续监听
          </label>
        </div>
        
        <div>
          <label class="block text-xs text-blue-400 mb-1">命令列表</label>
          <div class="max-h-40 overflow-y-auto border border-blue-900 rounded">
            <div 
              v-for="command in config.commands" 
              :key="command.id"
              class="p-2 border-b border-blue-900 last:border-b-0"
            >
              <div class="flex items-center justify-between">
                <div>
                  <label class="flex items-center text-xs">
                    <input 
                      type="checkbox" 
                      v-model="command.enabled" 
                      class="mr-2 accent-blue-500"
                    />
                    {{ command.phrase }}
                  </label>
                </div>
                <div class="text-xs text-blue-400">{{ getActionName(command.action) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <button 
            @click="testVoiceCommand" 
            class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs w-full"
          >
            测试语音命令
          </button>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetToDefaults" 
        class="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置默认
      </button>
      
      <div>
        <button 
          @click="$emit('close')" 
          class="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs mr-2"
        >
          取消
        </button>
        <button 
          @click="saveChanges" 
          class="bg-blue-700 hover:bg-blue-600 text-blue-100 px-3 py-1 rounded border border-blue-600 text-xs"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, onMounted } from 'vue';
import { VoiceCommandConfig, defaultVoiceCommandConfig } from '../services/voice-service';

export default defineComponent({
  name: 'VoiceCommandSettings',
  emits: ['close', 'update:config'],
  setup(props, { emit }) {
    // 配置
    const config = reactive<VoiceCommandConfig>({ ...defaultVoiceCommandConfig });
    
    // 获取操作名称
    const getActionName = (action: string): string => {
      const actionMap: Record<string, string> = {
        'create': '创建',
        'delete': '删除',
        'save': '保存',
        'search': '搜索',
        'setPriorityHigh': '设置高优先级'
      };
      
      return actionMap[action] || action;
    };
    
    // 测试语音命令
    const testVoiceCommand = () => {
      // 这里可以实现测试逻辑
      alert('请说出命令，例如：' + config.commandPrefix + ' ' + config.commands[0].phrase);
    };
    
    // 重置为默认值
    const resetToDefaults = () => {
      Object.assign(config, defaultVoiceCommandConfig);
    };
    
    // 保存更改
    const saveChanges = () => {
      emit('update:config', { ...config });
      emit('close');
    };
    
    return {
      config,
      getActionName,
      testVoiceCommand,
      resetToDefaults,
      saveChanges
    };
  }
});
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #3a506b;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a6b8a;
}
</style>

