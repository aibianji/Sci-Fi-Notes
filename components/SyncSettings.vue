<template>
  <div class="sync-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🔄</span> 云同步设置
    </h3>
    
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm">启用云同步</label>
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
          <label class="block text-sm mb-1">同步提供商</label>
          <select 
            v-model="config.provider" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          >
            <option value="dropbox">Dropbox</option>
            <option value="google-drive">Google Drive</option>
            <option value="onedrive">OneDrive</option>
            <option value="webdav">WebDAV</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <div v-if="config.provider === 'custom'">
          <label class="block text-sm mb-1">自定义端点</label>
          <input 
            v-model="config.customEndpoint" 
            type="text"
            placeholder="https://example.com/api/sync"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div v-if="config.provider === 'webdav' || config.provider === 'custom'">
          <label class="block text-sm mb-1">用户名</label>
          <input 
            v-model="config.username" 
            type="text"
            placeholder="用户名"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div v-if="config.provider === 'webdav' || config.provider === 'custom'">
          <label class="block text-sm mb-1">密码</label>
          <input 
            v-model="config.password" 
            type="password"
            placeholder="密码"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div v-if="config.provider !== 'webdav' && config.provider !== 'custom'">
          <label class="block text-sm mb-1">访问令牌</label>
          <input 
            v-model="config.token" 
            type="password"
            placeholder="访问令牌"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            @change="updateConfig"
          />
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">自动同步</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.autoSync" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.autoSync ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div v-if="config.autoSync">
          <label class="block text-sm mb-1">同步间隔 (分钟): {{ config.syncInterval }}</label>
          <input 
            v-model="config.syncInterval" 
            type="range" 
            min="5" 
            max="120" 
            step="5"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">启动时同步</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.syncOnStartup" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.syncOnStartup ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">数据变更时同步</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.syncOnChange" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.syncOnChange ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">同步状态</h4>
      
      <div class="bg-gray-900 rounded p-2 text-xs">
        <div class="flex justify-between mb-1">
          <span>状态:</span>
          <span 
            :class="{
              'text-green-400': status.lastSyncResult === 'success',
              'text-red-400': status.lastSyncResult === 'error',
              'text-yellow-400': status.lastSyncResult === 'conflict',
              'text-blue-400': status.syncing
            }"
          >
            {{ getSyncStatusText() }}
          </span>
        </div>
        
        <div class="flex justify-between mb-1">
          <span>上次同步:</span>
          <span>{{ getLastSyncTimeText() }}</span>
        </div>
        
        <div v-if="status.errorMessage" class="mb-1 text-red-400">
          错误: {{ status.errorMessage }}
        </div>
        
        <div v-if="status.syncing" class="mb-1">
          <div class="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              class="bg-blue-500 h-1.5 rounded-full" 
              :style="{ width: `${status.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between mb-3">
      <button 
        @click="syncNow" 
        class="flex-1 mr-2 bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs"
        :disabled="!config.enabled || status.syncing"
      >
        立即同步
      </button>
      <button 
        @click="resetConfig" 
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置设置
      </button>
    </div>
    
    <button 
      @click="$emit('close')" 
      class="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
    >
      关闭
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { 
  syncConfig, 
  defaultSyncConfig, 
  saveSyncConfig, 
  SyncConfig,
  syncStatus,
  syncData
} from '../services/sync-service';

export default defineComponent({
  name: 'SyncSettings',
  emits: ['close', 'update:config', 'sync'],
  setup(props, { emit }) {
    const config = ref<SyncConfig>({ ...syncConfig.value });
    const status = ref(syncStatus.value);
    
    // 获取同步状态文本
    const getSyncStatusText = () => {
      if (status.value.syncing) {
        return '同步中...';
      }
      
      switch (status.value.lastSyncResult) {
        case 'success':
          return '同步成功';
        case 'error':
          return '同步失败';
        case 'conflict':
          return '同步冲突';
        default:
          return '未同步';
      }
    };
    
    // 获取上次同步时间文本
    const getLastSyncTimeText = () => {
      if (!config.value.lastSyncTime) {
        return '从未同步';
      }
      
      return new Date(config.value.lastSyncTime).toLocaleString();
    };
    
    // 更新配置
    const updateConfig = () => {
      // 更新全局配置
      syncConfig.value = { ...config.value };
      
      // 保存配置到本地存储
      saveSyncConfig();
      
      // 通知父组件
      emit('update:config', config.value);
    };
    
    // 重置配置
    const resetConfig = () => {
      config.value = { ...defaultSyncConfig };
      updateConfig();
    };
    
    // 立即同步
    const syncNow = () => {
      emit('sync');
    };
    
    onMounted(() => {
      // 确保配置是最新的
      config.value = { ...syncConfig.value };
    });
    
    return {
      config,
      status,
      getSyncStatusText,
      getLastSyncTimeText,
      updateConfig,
      resetConfig,
      syncNow
    };
  }
});
</script>

