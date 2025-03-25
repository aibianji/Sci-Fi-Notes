<template>
  <div class="app-container">
    <StickyNotesApp />
    <div v-if="showSettings" class="settings-overlay" @click.self="closeSettings">
      <SciShortcutManager class="settings-panel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StickyNotesApp from './components/StickyNotesApp.vue';
import SciShortcutManager from './components/SciShortcutManager/index.vue';
import { useNoteStore } from './store/noteStore';

const showSettings = ref(false);
const noteStore = useNoteStore();

onMounted(() => {
  // 加载便签数据
  noteStore.loadNotes();
  
  // 监听快捷键打开设置
  window.addEventListener('keydown', handleKeyDown);
  
  // 如果在Tauri环境中，监听显示窗口事件
  if (window.__TAURI__) {
    window.__TAURI__.event.listen('show-window', () => {
      // 应用被全局快捷键唤醒时可执行特定逻辑
      console.log('应用被全局快捷键唤醒');
    });
  }
});

// 处理快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+K 打开设置
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    showSettings.value = true;
  }
  
  // Esc 关闭设置
  if (e.key === 'Escape' && showSettings.value) {
    closeSettings();
  }
};

// 关闭设置面板
const closeSettings = () => {
  showSettings.value = false;
};
</script>

<style scoped lang="scss">
.app-container {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.settings-panel {
  transform: translateY(0);
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

