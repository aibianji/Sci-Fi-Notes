<!-- SciShortcutManager 组件 -->
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'

interface Shortcut {
  id: string;
  name: string;
  key: string;
  description: string;
  systemConflict?: boolean;
}

// 默认快捷键设置
const defaultShortcuts: Shortcut[] = [
  { id: 'create-note', name: '新建便签', key: 'Ctrl+N', description: '创建一个新的便签' },
  { id: 'save-note', name: '保存便签', key: 'Ctrl+S', description: '保存当前便签' },
  { id: 'delete-note', name: '删除便签', key: 'Ctrl+D', description: '删除当前便签' },
  { id: 'search-notes', name: '搜索便签', key: 'Ctrl+F', description: '搜索便签内容' },
  { id: 'shortcut-settings', name: '快捷键设置', key: 'Ctrl+K', description: '打开快捷键设置面板' }
]

const shortcuts = reactive<Shortcut[]>(JSON.parse(JSON.stringify(defaultShortcuts)))
const activeShortcutId = ref<string | null>(null)
const isCapturing = ref(false)
const capturedKeys = ref<string[]>([])
const errorMessage = ref('')
const globalShortcutKey = ref('Ctrl+Alt+N')
const autoStartEnabled = ref(false)

// 检测快捷键冲突
const checkConflict = (shortcutKey: string): boolean => {
  // 这里应该是调用系统 API 检测冲突，目前使用模拟数据
  const systemHotkeys = ['Ctrl+A', 'Ctrl+C', 'Ctrl+V', 'Alt+Tab']
  return systemHotkeys.includes(shortcutKey)
}

// 保存应用内快捷键
const saveShortcuts = async () => {
  try {
    localStorage.setItem('sci-fi-shortcuts', JSON.stringify(shortcuts))
    errorMessage.value = ''
    
    // 通知后端新的快捷键设置已更新
    if (window.__TAURI__?.invoke) {
      await window.__TAURI__.invoke('update_app_shortcuts', { shortcuts: shortcuts });
    }
  } catch (error) {
    errorMessage.value = '保存快捷键设置失败'
    console.error('保存快捷键设置失败:', error);
  }
}

// 修改全局快捷键
const updateGlobalShortcut = async () => {
  try {
    if (window.__TAURI__?.invoke) {
      await window.__TAURI__.invoke('update_global_shortcut', { shortcut: globalShortcutKey.value });
      // 保存到本地存储
      localStorage.setItem('sci-fi-global-shortcut', globalShortcutKey.value);
    }
  } catch (error) {
    errorMessage.value = '更新全局快捷键失败'
    console.error('更新全局快捷键失败:', error);
  }
}

// 切换开机自启动
const toggleAutoStart = async () => {
  try {
    if (window.__TAURI__?.invoke) {
      await window.__TAURI__.invoke('toggle_autostart', { enabled: autoStartEnabled.value });
    }
  } catch (error) {
    console.error('切换开机自启动失败:', error);
    // 恢复状态
    autoStartEnabled.value = !autoStartEnabled.value;
  }
}

// 恢复默认快捷键
const resetDefaults = () => {
  Object.assign(shortcuts, JSON.parse(JSON.stringify(defaultShortcuts)))
  globalShortcutKey.value = 'Ctrl+Alt+N'
  saveShortcuts()
  updateGlobalShortcut()
}

// 启动快捷键捕获
const startCapture = (id: string) => {
  activeShortcutId.value = id
  isCapturing.value = true
  capturedKeys.value = []
  errorMessage.value = ''

  // 焦点到捕获区域
  setTimeout(() => {
    const el = document.getElementById(`shortcut-input-${id}`)
    if (el) el.focus()
  }, 50)
}

// 启动全局快捷键捕获
const startGlobalCapture = () => {
  activeShortcutId.value = 'global'
  isCapturing.value = true
  capturedKeys.value = []
  errorMessage.value = ''

  // 焦点到捕获区域
  setTimeout(() => {
    const el = document.getElementById('global-shortcut-input')
    if (el) el.focus()
  }, 50)
}

// 处理按键捕获
const handleKeyCapture = (event: KeyboardEvent) => {
  if (!isCapturing.value) return
  
  event.preventDefault()
  capturedKeys.value = []
  
  // 捕获修饰键
  if (event.ctrlKey) capturedKeys.value.push('Ctrl')
  if (event.shiftKey) capturedKeys.value.push('Shift')
  if (event.altKey) capturedKeys.value.push('Alt')
  
  // 捕获常规键
  const key = event.key
  if (
    key !== 'Control' && 
    key !== 'Shift' && 
    key !== 'Alt' && 
    key !== 'Meta' &&
    !capturedKeys.value.includes(key)
  ) {
    capturedKeys.value.push(key.length === 1 ? key.toUpperCase() : key)
  }
  
  // 如果有有效的组合键
  if (capturedKeys.value.length > 1 || (capturedKeys.value.length === 1 && !['Ctrl', 'Shift', 'Alt'].includes(capturedKeys.value[0]))) {
    applyShortcut()
  }
}

// 应用捕获的快捷键
const applyShortcut = () => {
  if (!activeShortcutId.value || capturedKeys.value.length === 0) return
  
  const newShortcut = capturedKeys.value.join('+')
  
  if (activeShortcutId.value === 'global') {
    // 应用全局快捷键
    globalShortcutKey.value = newShortcut
    updateGlobalShortcut()
  } else {
    // 应用应用内快捷键
    const activeShortcut = shortcuts.find(s => s.id === activeShortcutId.value)
    
    if (activeShortcut) {
      // 检查冲突
      const conflict = checkConflict(newShortcut)
      
      activeShortcut.key = newShortcut
      activeShortcut.systemConflict = conflict
      
      if (conflict) {
        errorMessage.value = `警告: "${newShortcut}" 与系统快捷键冲突`
      } else {
        errorMessage.value = ''
      }
      
      saveShortcuts()
    }
  }
  
  isCapturing.value = false
  activeShortcutId.value = null
}

// 取消捕获
const cancelCapture = () => {
  isCapturing.value = false
  activeShortcutId.value = null
  capturedKeys.value = []
}

// 检查开机自启动状态
const checkAutoStartStatus = async () => {
  try {
    if (window.__TAURI__?.invoke) {
      const enabled = await window.__TAURI__.invoke('is_autostart_enabled');
      autoStartEnabled.value = !!enabled;
    }
  } catch (error) {
    console.error('检查开机自启动状态失败:', error);
  }
}

// 挂载时加载已保存的快捷键
onMounted(async () => {
  try {
    // 加载应用内快捷键
    const savedShortcuts = localStorage.getItem('sci-fi-shortcuts')
    if (savedShortcuts) {
      const parsed = JSON.parse(savedShortcuts)
      Object.assign(shortcuts, parsed)
    }
    
    // 加载全局快捷键
    const savedGlobalShortcut = localStorage.getItem('sci-fi-global-shortcut')
    if (savedGlobalShortcut) {
      globalShortcutKey.value = savedGlobalShortcut
    }
    
    // 检查开机自启动状态
    await checkAutoStartStatus()
  } catch (error) {
    console.error('加载快捷键设置失败:', error)
  }

  // 添加全局键盘事件监听
  window.addEventListener('keydown', handleKeyCapture)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyCapture)
})
</script>

<template>
  <div class="sci-shortcut-manager">
    <div class="shortcut-header">
      <h2>快捷键与设置</h2>
      <div class="header-line"></div>
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <div class="settings-section">
      <h3>应用设置</h3>
      
      <!-- 开机自启动设置 -->
      <div class="setting-item">
        <div class="setting-title">开机自启动</div>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="autoStartEnabled" @change="toggleAutoStart">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      
      <!-- 全局快捷键设置 -->
      <div class="setting-item">
        <div class="setting-title">快速创建便签</div>
        <div class="setting-control shortcut-input-container">
          <div 
            id="global-shortcut-input"
            class="shortcut-input"
            :class="{ 'capturing': isCapturing && activeShortcutId === 'global' }"
            @click="startGlobalCapture"
            tabindex="0"
          >
            {{ isCapturing && activeShortcutId === 'global' ? 
               (capturedKeys.length > 0 ? capturedKeys.join('+') : '按下组合键...') : 
               globalShortcutKey }}
          </div>
          <button class="shortcut-reset-btn" @click="startGlobalCapture">
            修改
          </button>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>应用内快捷键</h3>
      
      <div class="shortcut-list">
        <div 
          v-for="shortcut in shortcuts" 
          :key="shortcut.id" 
          class="shortcut-item"
          :class="{ 'conflict': shortcut.systemConflict }"
        >
          <div class="shortcut-info">
            <div class="shortcut-name">{{ shortcut.name }}</div>
            <div class="shortcut-description">{{ shortcut.description }}</div>
          </div>
          
          <div class="shortcut-control">
            <div 
              :id="`shortcut-input-${shortcut.id}`"
              class="shortcut-input"
              :class="{ 'capturing': isCapturing && activeShortcutId === shortcut.id }"
              @click="startCapture(shortcut.id)"
              tabindex="0"
            >
              {{ isCapturing && activeShortcutId === shortcut.id ? 
                 (capturedKeys.length > 0 ? capturedKeys.join('+') : '按下组合键...') : 
                 shortcut.key }}
            </div>
            <button class="shortcut-reset-btn" @click="startCapture(shortcut.id)">
              修改
            </button>
          </div>
        </div>
      </div>
      
      <div class="shortcut-actions">
        <button class="reset-all-btn" @click="resetDefaults">恢复默认设置</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sci-shortcut-manager {
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(10, 25, 47, 0.95) 100%);
  border-radius: 8px;
  padding: 24px;
  color: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 212, 255, 0.5);
    }
  }
  
  .shortcut-header {
    margin-bottom: 24px;
    
    h2 {
      color: var(--neon-cyan, #00D4FF);
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 12px 0;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      text-align: center;
    }
    
    .header-line {
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(0, 212, 255, 0) 0%, 
        rgba(0, 212, 255, 0.7) 50%, 
        rgba(0, 212, 255, 0) 100%);
    }
  }
  
  .error-message {
    background-color: rgba(255, 0, 0, 0.2);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 16px;
    color: #ff6b6b;
  }
  
  .settings-section {
    margin-bottom: 32px;
    
    h3 {
      color: var(--neon-magenta, #FF00D4);
      font-size: 18px;
      margin: 0 0 16px 0;
      text-shadow: 0 0 8px rgba(255, 0, 212, 0.5);
      border-bottom: 1px solid rgba(255, 0, 212, 0.3);
      padding-bottom: 6px;
    }
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .setting-title {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .setting-control {
      display: flex;
      align-items: center;
    }
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    
    input {
      opacity: 0;
      width: 0;
      height: 0;
      
      &:checked + .slider {
        background-color: var(--neon-cyan, #00D4FF);
        
        &:before {
          transform: translateX(26px);
        }
      }
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.2);
      transition: .4s;
      border-radius: 34px;
      
      &:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
    }
  }
  
  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border-left: 3px solid var(--neon-cyan, #00D4FF);
    
    &.conflict {
      border-left-color: #ff6b6b;
    }
  }
  
  .shortcut-info {
    flex: 1;
    
    .shortcut-name {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .shortcut-description {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  .shortcut-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .shortcut-input {
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 212, 255, 0.5);
    border-radius: 4px;
    padding: 6px 12px;
    min-width: 100px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.4);
      border-color: var(--neon-cyan, #00D4FF);
    }
    
    &.capturing {
      background-color: rgba(255, 0, 212, 0.1);
      border-color: var(--neon-magenta, #FF00D4);
      box-shadow: 0 0 15px rgba(255, 0, 212, 0.3);
      animation: pulse 1.5s infinite;
    }
  }
  
  .shortcut-reset-btn {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: var(--neon-cyan, #00D4FF);
      color: var(--neon-cyan, #00D4FF);
    }
  }
  
  .shortcut-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
  
  .reset-all-btn {
    background-color: rgba(255, 0, 212, 0.1);
    border: 1px solid var(--neon-magenta, #FF00D4);
    color: var(--neon-magenta, #FF00D4);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: rgba(255, 0, 212, 0.2);
      box-shadow: 0 0 10px rgba(255, 0, 212, 0.4);
    }
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 5px rgba(255, 0, 212, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(255, 0, 212, 0.8);
    }
    100% {
      box-shadow: 0 0 5px rgba(255, 0, 212, 0.5);
    }
  }
}
</style> 