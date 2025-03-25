<template>
  <div class="app-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">⚙</span> 应用设置
    </h3>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">常规设置</h4>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">开机自启动</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="settings.autoStart" 
            class="sr-only"
            @change="updateSettings"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="settings.autoStart ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">最小化到托盘</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="settings.minimizeToTray" 
            class="sr-only"
            @change="updateSettings"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="settings.minimizeToTray ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">自动检查更新</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="settings.autoUpdate" 
            class="sr-only"
            @change="updateSettings"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="settings.autoUpdate ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">便签设置</h4>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">默认便签颜色</label>
        <div class="flex">
          <input 
            v-model="settings.defaultNoteColor" 
            type="color"
            class="w-8 h-8 rounded mr-2 bg-transparent border-0"
          />
          <input 
            v-model="settings.defaultNoteColor" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">默认优先级</label>
        <select 
          v-model="settings.defaultPriority" 
          class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          @change="updateSettings"
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">紧急</option>
        </select>
      </div>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">默认透明度</label>
        <div class="flex items-center">
          <input 
            v-model="settings.defaultOpacity" 
            type="range" 
            min="30" 
            max="100" 
            step="5"
            class="w-full mr-2"
            @change="updateSettings"
          />
          <span class="text-xs w-8 text-right">{{ settings.defaultOpacity }}%</span>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">高级设置</h4>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用性能监控 (F2)</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="settings.enablePerformanceMonitor" 
            class="sr-only"
            @change="updateSettings"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="settings.enablePerformanceMonitor ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用动画效果</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="settings.enableAnimations" 
            class="sr-only"
            @change="updateSettings"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="settings.enableAnimations ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">数据存储位置</label>
        <div class="flex">
          <input 
            v-model="settings.dataPath" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
            readonly
          />
          <button 
            @click="openDataFolder" 
            class="ml-2 bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
          >
            打开
          </button>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="checkForUpdates" 
        class="flex-1 mr-2 bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs"
      >
        检查更新
      </button>
      <button 
        @click="resetSettings" 
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
import { open } from '@tauri-apps/api/shell';
import { appDataDir } from '@tauri-apps/api/path';
import { setAutoStart } from '../services/windows-service';
import { checkForUpdates as checkUpdates } from '../services/update-service';
import { sendDesktopNotification } from '../services/windows-service';

interface AppSettings {
  autoStart: boolean;
  minimizeToTray: boolean;
  autoUpdate: boolean;
  defaultNoteColor: string;
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
  defaultOpacity: number;
  enablePerformanceMonitor: boolean;
  enableAnimations: boolean;
  dataPath: string;
}

export default defineComponent({
  name: 'AppSettings',
  emits: ['close', 'update:settings'],
  setup(props, { emit }) {
    // 默认设置
    const defaultSettings: AppSettings = {
      autoStart: false,
      minimizeToTray: true,
      autoUpdate: true,
      defaultNoteColor: '#1a1a2e',
      defaultPriority: 'medium',
      defaultOpacity: 100,
      enablePerformanceMonitor: false,
      enableAnimations: true,
      dataPath: ''
    };
    
    const settings = ref<AppSettings>({ ...defaultSettings });
    
    // 加载设置
    const loadSettings = async () => {
      const savedSettings = localStorage.getItem('sci-fi-notes-app-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          settings.value = { ...defaultSettings, ...parsed };
        } catch (e) {
          console.error('Failed to parse app settings', e);
        }
      }
      
      // 获取数据存储路径
      try {
        settings.value.dataPath = await appDataDir();
      } catch (e) {
        console.error('Failed to get app data directory', e);
        settings.value.dataPath = '未知';
      }
    };
    
    // 更新设置
    const updateSettings = async () => {
      // 保存到本地存储
      localStorage.setItem('sci-fi-notes-app-settings', JSON.stringify(settings.value));
      
      // 应用设置
      if (settings.value.autoStart !== undefined) {
        await setAutoStart(settings.value.autoStart);
      }
      
      // 通知父组件
      emit('update:settings', settings.value);
    };
    
    // 重置设置
    const resetSettings = () => {
      settings.value = { ...defaultSettings, dataPath: settings.value.dataPath };
      updateSettings();
    };
    
    // 打开数据文件夹
    const openDataFolder = async () => {
      try {
        await open(settings.value.dataPath);
      } catch (e) {
        console.error('Failed to open data folder', e);
        sendDesktopNotification('错误', '无法打开数据文件夹');
      }
    };
    
    // 检查更新
    const checkForUpdates = async () => {
      await checkUpdates();
    };
    
    onMounted(() => {
      loadSettings();
    });
    
    return {
      settings,
      updateSettings,
      resetSettings,
      openDataFolder,
      checkForUpdates
    };
  }
});
</script>

