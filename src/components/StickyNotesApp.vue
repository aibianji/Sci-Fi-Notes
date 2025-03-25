<!-- 科幻风格便签应用主组件 -->
<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { createPinia } from 'pinia'
import SciNoteList from './SciNoteList/index.vue'
import SciNoteEditor from './SciNoteEditor/index.vue'
import SciShortcutManager from './SciShortcutManager/index.vue'
import { useNoteStore } from '@/stores/noteStore'

// 组件状态
const currentView = ref<'list' | 'editor' | 'shortcuts'>('list')
const activeNoteId = ref<string | null>(null)
const isNewNote = ref(false)
const showShortcuts = ref(false)
const isSettingsLoaded = ref(false)
const settings = ref({
  autoStart: false,
  newNoteShortcut: 'CommandOrControl+Alt+N'
})
const errorMessage = ref<string | null>(null)

// 初始化 pinia
const pinia = createPinia()
provide('pinia', pinia)

// 注入 store
const noteStore = useNoteStore()

// 视图切换处理
const switchToList = () => {
  // 切换到列表视图，保留当前选择的视图类型（活跃/归档/回收站）
  currentView.value = 'list'
  activeNoteId.value = null
}

const openEditor = (noteId?: string) => {
  if (noteId) {
    activeNoteId.value = noteId
    isNewNote.value = false
  } else {
    activeNoteId.value = null
    isNewNote.value = true
    // 如果创建新便签，确保切换到活跃便签视图
    noteStore.setCurrentView('active')
  }
  currentView.value = 'editor'
}

const createNewNote = () => {
  openEditor()
}

const editNote = (noteId: string) => {
  openEditor(noteId)
}

const handleNoteSaved = (noteId: string) => {
  activeNoteId.value = noteId
  switchToList()
}

const closeEditor = () => {
  switchToList()
}

// 快捷键设置
const toggleShortcutsView = () => {
  showShortcuts.value = !showShortcuts.value
}

// 全局快捷键注释
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl+N: 新建便签
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    createNewNote()
  }
  
  // Ctrl+F: 搜索便签 - 自定义搜索
  if (event.ctrlKey && event.key === 'f') {
    event.preventDefault() // 阻止浏览器默认搜索
    // 触发应用内搜索功能
    if (currentView.value === 'list') {
      const listComponent = document.querySelector('.list-view');
      if (listComponent) {
        // 触发搜索便签
        const searchInput = listComponent.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    }
  }
  
  // Ctrl+K: 快捷键设置
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    toggleShortcutsView()
  }
  
  // Esc: 返回列表
  if (event.key === 'Escape' && currentView.value !== 'list') {
    event.preventDefault()
    switchToList()
  }
}

// 窗口控制函数 - 修复版
const minimizeWindow = async () => {
  try {
    // 方法1：直接API调用
    if (window.__TAURI__?.window?.appWindow) {
      await window.__TAURI__.window.appWindow.minimize();
      console.log("窗口已最小化");
      return;
    }
    
    // 方法2：通过invoke调用
    if (window.__TAURI__?.invoke) {
      await window.__TAURI__.invoke('minimize_window');
      console.log("窗口已最小化 (通过invoke)");
      return;
    }
    
    console.error("找不到可用的Tauri窗口API");
  } catch (error) {
    console.error("最小化窗口失败:", error);
  }
};

const closeWindow = async () => {
  try {
    // 方法1：直接API调用
    if (window.__TAURI__?.window?.appWindow) {
      await window.__TAURI__.window.appWindow.hide();
      console.log("窗口已隐藏");
      return;
    }
    
    // 方法2：通过invoke调用
    if (window.__TAURI__?.invoke) {
      await window.__TAURI__.invoke('hide_window');
      console.log("窗口已隐藏 (通过invoke)");
      return;
    }
    
    console.error("找不到可用的Tauri窗口API");
  } catch (error) {
    console.error("隐藏窗口失败:", error);
  }
};

// 开启设置界面
const showSettings = () => {
  toggleShortcutsView();
};

// 初始化应用设置
const initAppSettings = async () => {
  try {
    isSettingsLoaded.value = false
    
    // 检查是否启用开机自启
    if (window.__TAURI__) {
      const { invoke } = window.__TAURI__
      const autostartEnabled = await invoke('is_autostart_enabled') as boolean
      settings.value.autoStart = autostartEnabled
    }
    
    // 加载用户设置
    const savedSettings = localStorage.getItem('sci-notes-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        settings.value = { ...settings.value, ...parsedSettings }
      } catch (e) {
        console.error('解析设置失败', e)
      }
    }
    
    // 注册全局快捷键
    await registerGlobalShortcuts()
    
    // 加载便签数据和分类
    const noteStore = useNoteStore()
    noteStore.loadNotes()
    
    isSettingsLoaded.value = true
  } catch (error) {
    console.error('初始化应用设置失败', error)
    errorMessage.value = '应用设置初始化失败'
  }
}

// 注册全局快捷键
const registerGlobalShortcuts = async () => {
  if (window.__TAURI__) {
    const { invoke } = window.__TAURI__
    
    try {
      // 注册新建便签快捷键
      await invoke('update_global_shortcut', {
        shortcut: settings.value.newNoteShortcut || 'CommandOrControl+Alt+N'
      })
      
      // 监听全局快捷键事件 - 当按下快捷键时创建新便签
      const { listen } = window.__TAURI__.event
      listen('create-new-note', () => {
        createNewNote()
      })
      
      console.log('全局快捷键注册成功')
    } catch (error) {
      console.error('注册全局快捷键失败', error)
      errorMessage.value = '注册全局快捷键失败'
    }
  }
}

// 当短信设置变更时更新注册的快捷键
const updateGlobalShortcuts = async () => {
  if (window.__TAURI__) {
    const { invoke } = window.__TAURI__
    
    try {
      await invoke('update_global_shortcut', {
        shortcut: settings.value.newNoteShortcut
      })
      
      console.log('全局快捷键更新成功')
      saveSettings()
    } catch (error) {
      console.error('更新全局快捷键失败', error)
      errorMessage.value = '更新全局快捷键失败'
    }
  }
}

// 保存设置到本地存储
const saveSettings = () => {
  try {
    localStorage.setItem('sci-notes-settings', JSON.stringify(settings.value))
    console.log('设置已保存')
  } catch (error) {
    console.error('保存设置失败', error)
    errorMessage.value = '保存设置失败'
  }
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 加载便签数据
  noteStore.loadNotes()
  
  // 监听来自Rust的全局快捷键事件
  try {
    // 确保window.__TAURI__存在并且event和listen也存在
    if (window.__TAURI__ && window.__TAURI__.event && typeof window.__TAURI__.event.listen === 'function') {
      window.__TAURI__.event.listen('create-new-note', () => {
        console.log('收到创建新便签的全局事件');
        createNewNote();
      });
    }
  } catch (error) {
    console.error('注册全局事件监听器失败', error);
  }
  
  // 测试窗口API是否可用
  console.log('Tauri窗口API检测:');
  if (window.__TAURI__) {
    console.log('- window.__TAURI__: 可用');
    if (window.__TAURI__.window) {
      console.log('- window.__TAURI__.window: 可用');
      if (window.__TAURI__.window.appWindow) {
        console.log('- window.__TAURI__.window.appWindow: 可用');
      } else {
        console.log('- window.__TAURI__.window.appWindow: 不可用');
      }
    } else {
      console.log('- window.__TAURI__.window: 不可用');
    }
    if (window.__TAURI__.invoke) {
      console.log('- window.__TAURI__.invoke: 可用');
    } else {
      console.log('- window.__TAURI__.invoke: 不可用');
    }
  } else {
    console.log('- window.__TAURI__: 不可用');
  }
  
  // 为了避免内存泄漏，需要清理事件监听器
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    
    // 取消Tauri事件监听
    if (window.__TAURI__?.event && typeof window.__TAURI__.event.listen === 'function') {
      window.__TAURI__.event.listen('create-new-note', () => {}).then(unlisten => unlisten());
    }
  }
})
</script>

<template>
  <div class="sci-app-container">
    <!-- 自定义窗口标题栏 - 使用data-tauri-drag-region使其可拖动 -->
    <div class="window-titlebar" data-tauri-drag-region>
      <div class="window-title" data-tauri-drag-region>科幻便签</div>
      <div class="window-controls">
        <button class="window-control-button minimize" @click="minimizeWindow" title="最小化到托盘">
          <span class="control-icon">_</span>
        </button>
        <button class="window-control-button close" @click="closeWindow" title="关闭窗口">
          <span class="control-icon">✕</span>
        </button>
      </div>
      
      <div class="app-controls">
        <button class="app-control-button" @click="showSettings" title="设置">
          <span class="control-icon">⚙️</span>
        </button>
      </div>
    </div>
    
    <!-- 应用主内容 -->
    <div class="main-content">
      <!-- 科幻宇宙背景 -->
      <div class="sci-fi-background">
        <div class="stars"></div>
        <div class="twinkling"></div>
      </div>
      
      <!-- 主内容区 -->
      <div class="app-container">
        <!-- 快捷键设置模态框 -->
        <div
          class="shortcuts-modal"
          v-if="showShortcuts"
          @click.self="toggleShortcutsView"
        >
          <div class="modal-content">
            <SciShortcutManager />
            <button class="close-modal-btn" @click="toggleShortcutsView">关闭</button>
          </div>
        </div>
        
        <!-- 便签列表视图 -->
        <div v-if="currentView === 'list'" class="list-view">
          <SciNoteList 
            @edit-note="editNote"
            @create-note="createNewNote"
          />
        </div>
        
        <!-- 便签编辑器视图 -->
        <div v-else-if="currentView === 'editor'" class="editor-view">
          <SciNoteEditor
            :noteId="activeNoteId || ''"
            :isNew="isNewNote"
            @save-note="handleNoteSaved"
            @close-editor="closeEditor"
          />
        </div>
      </div>
      
      <!-- 悬浮工具栏 -->
      <div class="floating-toolbar">
        <button 
          class="toolbar-btn"
          title="返回列表"
          @click="switchToList"
          v-if="currentView !== 'list'"
        >
          <span class="list-icon"></span>
        </button>
        
        <button 
          class="toolbar-btn"
          title="新建便签 (Ctrl+N)"
          @click="createNewNote"
        >
          <span class="new-icon"></span>
        </button>
        
        <button
          class="toolbar-btn"
          title="快捷键设置 (Ctrl+K)"
          @click="toggleShortcutsView"
        >
          <span class="settings-icon"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sci-app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.window-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  background: linear-gradient(90deg, rgba(13, 17, 23, 0.7) 0%, rgba(10, 25, 47, 0.9) 100%);
  user-select: none;
  -webkit-app-region: drag;
  
  .window-title {
    color: var(--neon-cyan);
    font-size: 14px;
    font-weight: 500;
    text-shadow: 0 0 5px rgba(0, 212, 255, 0.7);
  }
  
  .window-controls {
    display: flex;
    -webkit-app-region: no-drag;
    
    .window-control-button {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
      margin-left: 4px;
      transition: all 0.2s ease;
      cursor: pointer;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &.minimize:hover {
        color: var(--neon-cyan);
      }
      
      &.close:hover {
        background-color: rgba(255, 0, 0, 0.7);
        color: white;
      }
    }
  }
  
  .app-controls {
    position: absolute;
    right: 80px;
    -webkit-app-region: no-drag;
    
    .app-control-button {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--neon-cyan);
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow: auto;
}

.sticky-notes-app {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 科幻背景
.sci-fi-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #0A192F;
  z-index: -1;
  overflow: hidden;
  
  .stars {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/png;base64,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') repeat top center;
  }
  
  .twinkling {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, 
                  rgba(10, 25, 47, 0) 0%,
                  rgba(10, 25, 47, 0.3) 50%, 
                  rgba(10, 25, 47, 0.5) 100%);
    animation: twinkling 10s infinite;
  }
  
  @keyframes twinkling {
    0% {opacity: 0.2;}
    50% {opacity: 0.4;}
    100% {opacity: 0.2;}
  }
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  z-index: 1;
}

.list-view,
.editor-view {
  flex: 1;
  animation: fadeIn 0.4s ease-out;
}

.floating-toolbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.toolbar-btn {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: rgba(0, 212, 255, 0.2);
  border: 1px solid var(--neon-cyan, #00D4FF);
  color: white;
  cursor: pointer;
  position: relative;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: rgba(255, 0, 212, 0.2);
    border-color: var(--neon-magenta, #FF00D4);
    box-shadow: 0 0 15px rgba(255, 0, 212, 0.5);
  }
  
  .list-icon,
  .new-icon,
  .settings-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      background-color: white;
    }
  }
  
  .list-icon {
    &::before {
      width: 20px;
      height: 2px;
      top: 5px;
      left: 0;
    }
    
    &::after {
      width: 20px;
      height: 2px;
      top: 13px;
      left: 0;
    }
    
    &::before,
    &::after {
      box-shadow: 0 8px 0 white;
    }
  }
  
  .new-icon {
    &::before {
      width: 20px;
      height: 2px;
      top: 9px;
      left: 0;
    }
    
    &::after {
      width: 2px;
      height: 20px;
      top: 0;
      left: 9px;
    }
  }
  
  .settings-icon {
    border: 2px solid white;
    border-radius: 50%;
    
    &::before {
      width: 6px;
      height: 6px;
      top: 5px;
      left: 5px;
      border: 2px solid white;
      border-radius: 50%;
      background-color: transparent;
    }
  }
}

.shortcuts-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
  overflow: hidden;
  
  .modal-content {
    width: 90%;
    max-width: 800px;
    position: relative;
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .close-modal-btn {
    position: absolute;
    bottom: -50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: transparent;
    border: 1px solid var(--neon-cyan, #00D4FF);
    color: var(--neon-cyan, #00D4FF);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background-color: var(--neon-magenta, #FF00D4);
      border-color: var(--neon-magenta, #FF00D4);
      color: white;
      box-shadow: 0 0 15px rgba(255, 0, 212, 0.5);
    }
  }
}

@keyframes fadeIn {
  from {opacity: 0;}
  to {opacity: 1;}
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>

