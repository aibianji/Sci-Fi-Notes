<!-- SciNoteList 组件 -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useNoteStore, type NoteViewType, type Category } from '@/stores/noteStore'
import type { Note } from '@/stores/noteStore'

interface Props {
  showSearch?: boolean;
}

// 定义组件事件
const emit = defineEmits<{
  (event: 'edit-note', noteId: string): void;
  (event: 'create-note'): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  showSearch: true
})

// 注入 store
const noteStore = useNoteStore()

// 组件状态
const searchText = ref('')
const draggedNoteId = ref<string | null>(null)
const dropTarget = ref<string | null>(null)
const animatingNotes = ref<string[]>([])
const showCategorySelector = ref(false)

// 右键菜单状态
const showContextMenu = ref(false)
const showAreaContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTargetId = ref<string | null>(null)
const showNewCategoryInput = ref(false)
const newCategoryName = ref('')

// 为空白区域添加右键菜单
const showBlankAreaContextMenu = ref(false)
const blankAreaContextMenuPosition = ref({ x: 0, y: 0 })

// 计算属性
const filteredNotes = computed(() => noteStore.filteredNotes)
const notesCount = computed(() => noteStore.notesCount)
const currentView = computed(() => noteStore.currentView)
const categories = computed(() => noteStore.categoriesWithCount)
const activeCategory = computed(() => noteStore.activeCategoryId)

// 搜索状态
const isSearching = ref(false)

// 搜索笔记
const handleSearch = () => {
  noteStore.setSearchQuery(searchText.value)
}

// 清除搜索
const clearSearch = () => {
  searchText.value = ''
  noteStore.setSearchQuery('')
}

// 编辑便签
const editNote = (noteId: string) => {
  emit('edit-note', noteId)
}

// 删除便签
const deleteNote = (noteId: string) => {
  if (currentView.value === 'recycled') {
    if (confirm('确定要永久删除该便签吗？此操作不可撤销。')) {
      noteStore.permanentlyDeleteNote(noteId)
    }
  } else {
    noteStore.deleteNote(noteId)
  }
}

// 固定便签
const togglePin = (noteId: string) => {
  noteStore.togglePinNote(noteId)
  noteStore.saveNotes()
  
  // 添加到动画列表
  animatingNotes.value.push(noteId)
  
  // 动画结束后移除
  setTimeout(() => {
    const index = animatingNotes.value.indexOf(noteId)
    if (index !== -1) {
      animatingNotes.value.splice(index, 1)
    }
  }, 500)
}

// 归档和恢复操作
const archiveNote = (noteId: string) => {
  noteStore.archiveNote(noteId)
}

const restoreNote = (noteId: string) => {
  noteStore.restoreNote(noteId)
}

// 清空回收站
const emptyRecycleBin = () => {
  if (confirm('确定要清空回收站吗？此操作将永久删除所有回收站中的便签，不可撤销。')) {
    noteStore.emptyRecycleBin()
  }
}

// 切换视图
const switchView = (view: NoteViewType) => {
  noteStore.setCurrentView(view)
}

// 切换分类
const switchCategory = (categoryId: string | null) => {
  noteStore.setActiveCategory(categoryId)
}

// 新建便签
const createNewNote = () => {
  if (currentView.value !== 'active') {
    noteStore.setCurrentView('active')
  }
  emit('create-note')
}

// 添加新分类
const addCategory = async () => {
  if (newCategoryName.value.trim()) {
    const categoryId = noteStore.addCategory(newCategoryName.value.trim());
    
    // 如果是从右键菜单创建的分类，自动将便签移至新分类
    if (showContextMenu.value && contextMenuTargetId.value) {
      moveNoteToCategory(contextMenuTargetId.value, categoryId);
    }
    
    newCategoryName.value = '';
    showNewCategoryInput.value = false;
    
    // 如果新创建的是上下文菜单，等待DOM更新后聚焦新的分类输入框
    await nextTick();
    const inputEl = document.querySelector('.new-category-input input') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
    }
  }
}

// 移动便签到分类
const moveNoteToCategory = (noteId: string, categoryId: string) => {
  noteStore.addNoteToCategory(noteId, categoryId)
  hideContextMenus()
}

// 从分类中移除便签
const removeNoteFromCategory = (noteId: string, categoryId: string) => {
  noteStore.removeNoteFromCategory(noteId, categoryId)
}

// 开始拖拽
const startDrag = (noteId: string, event: DragEvent) => {
  draggedNoteId.value = noteId
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', noteId)
  }
}

// 拖拽结束
const endDrag = () => {
  draggedNoteId.value = null
  dropTarget.value = null
}

// 拖拽进入
const dragEnter = (noteId: string) => {
  if (noteId !== draggedNoteId.value) {
    dropTarget.value = noteId
  }
}

// 拖拽离开
const dragLeave = () => {
  dropTarget.value = null
}

// 允许放置
const allowDrop = (event: DragEvent) => {
  event.preventDefault()
}

// 处理放置
const handleDrop = (targetNoteId: string, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedNoteId.value && draggedNoteId.value !== targetNoteId) {
    // 这里应该实现便签顺序的调整逻辑
    // 由于我们使用的是基于时间排序，这里需要修改便签的时间戳
    // 或者在 store 中添加额外的序号字段来控制顺序
    console.log(`Dragged note ${draggedNoteId.value} onto note ${targetNoteId}`)
  }
  
  draggedNoteId.value = null
  dropTarget.value = null
}

// 处理便签右键菜单
const handleNoteContextMenu = (noteId: string, event: MouseEvent) => {
  event.preventDefault()
  
  // 获取窗口尺寸
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 计算右键菜单位置
  let x = event.clientX;
  let y = event.clientY;
  
  // 假设菜单的最大宽度和高度
  const menuWidth = 200; // 估计值
  const menuHeight = 300; // 估计值
  
  // 检查是否超出屏幕右侧
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth - 10;
  }
  
  // 检查是否超出屏幕底部
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight - 10;
  }
  
  contextMenuPosition.value = {
    x,
    y
  }
  
  contextMenuTargetId.value = noteId
  showContextMenu.value = true
  showAreaContextMenu.value = false
}

// 隐藏所有上下文菜单
const hideContextMenus = () => {
  showContextMenu.value = false
  showAreaContextMenu.value = false
  showNewCategoryInput.value = false
  showBlankAreaContextMenu.value = false
}

// 区域点击检测
const handleDocumentClick = (event: MouseEvent) => {
  // 检查是否点击在菜单外部
  const contextMenuElement = document.querySelector('.context-menu')
  if (contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
    hideContextMenus()
  }
}

// 处理空白区域右键菜单
const handleBlankAreaContextMenu = (event: MouseEvent) => {
  // 阻止默认右键菜单
  event.preventDefault()
  
  // 检查点击是否在便签上，如果是则不显示空白区域菜单
  if ((event.target as HTMLElement).closest('.note-card')) {
    return
  }
  
  // 获取窗口尺寸
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 计算右键菜单位置
  let x = event.clientX;
  let y = event.clientY;
  
  // 假设菜单的最大宽度和高度
  const menuWidth = 200; // 估计值
  const menuHeight = 220; // 估计值
  
  // 检查是否超出屏幕右侧
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth - 10;
  }
  
  // 检查是否超出屏幕底部
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight - 10;
  }
  
  // 定位菜单
  blankAreaContextMenuPosition.value = {
    x,
    y
  }
  
  // 显示菜单
  showBlankAreaContextMenu.value = true
  
  // 添加点击外部关闭菜单
  document.addEventListener('click', closeBlankAreaContextMenu, { once: true })
}

// 原始的空区域右键菜单处理(保持兼容)
const handleAreaContextMenu = (event: MouseEvent) => {
  handleBlankAreaContextMenu(event)
}

// 关闭空白区域右键菜单
const closeBlankAreaContextMenu = () => {
  showBlankAreaContextMenu.value = false
}

// 搜索便签
const searchNotes = () => {
  isSearching.value = true
  searchText.value = '' // 清空，让用户输入新的搜索词
  nextTick(() => {
    const searchInput = document.querySelector('.search-input') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  })
  closeBlankAreaContextMenu()
}

// 刷新页面
const refreshPage = () => {
  // 重新加载便签数据
  noteStore.loadNotes()
  // 提示用户已刷新
  alert('便签数据已刷新')
  closeBlankAreaContextMenu()
}

// 屏幕截图
const takeScreenshot = async () => {
  closeBlankAreaContextMenu()
  
  try {
    if (window.__TAURI__?.invoke) {
      const result = await window.__TAURI__.invoke('capture_screenshot') as { path: string, filename: string }
      console.log('截图保存成功:', result.path)
      
      // 创建新的图片便签
      const newNote = {
        id: '',
        title: '截图便签',
        content: `<p><img src="tauri://localhost/${result.path}" alt="截图" style="max-width:100%;margin:8px 0;" /></p>`,
        color: '#0A192F',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        status: 'active' as const,
        categoryIds: ['image'] // 添加到图片分类
      }
      
      noteStore.addNote(newNote)
      alert('截图已保存为新便签')
    } else {
      throw new Error('Tauri API 不可用')
    }
  } catch (error) {
    console.error('截图失败:', error)
    alert('截图失败: ' + (error as Error).message)
  }
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 删除分类
const deleteCategory = (categoryId: string) => {
  if (confirm('确定要删除此分类吗？该分类下的便签将被自动移至默认分类。')) {
    const result = noteStore.deleteCategory(categoryId);
    if (result) {
      // 如果当前正在查看被删除的分类，切换到全部便签视图
      if (activeCategory.value === categoryId) {
        switchCategory(null);
      }
    } else {
      alert('无法删除默认分类');
    }
  }
}

// 监听
onMounted(() => {
  // 添加右键菜单事件监听
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('contextmenu', handleAreaContextMenu as EventListener)
  document.querySelector('.note-grid-container')?.addEventListener('contextmenu', handleBlankAreaContextMenu as EventListener)
  
  // 监听新建分类输入框的显示状态
  watch(showNewCategoryInput, (visible) => {
    if (visible) {
      nextTick(() => {
        // 根据是哪种输入框来获取正确的元素
        const contextMenuInput = document.querySelector('.new-category-input input') as HTMLInputElement;
        const floatingInput = document.querySelector('.floating-input input') as HTMLInputElement;
        const categoryInput = document.querySelector('.new-category-input-container input') as HTMLInputElement;
        
        if (contextMenuInput) contextMenuInput.focus();
        else if (floatingInput) floatingInput.focus();
        else if (categoryInput) categoryInput.focus();
      });
    }
  });
  
  noteStore.loadNotes()
})

onUnmounted(() => {
  // 移除右键菜单事件监听
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('contextmenu', handleAreaContextMenu as EventListener)
  document.querySelector('.note-grid-container')?.removeEventListener('contextmenu', handleBlankAreaContextMenu as EventListener)
  document.removeEventListener('click', closeBlankAreaContextMenu)
})

// 监听搜索
watch(searchText, (newValue: string) => {
  if (newValue === '') {
    noteStore.setSearchQuery('')
  }
})
</script>

<template>
  <div class="sci-note-list">
    <!-- 视图切换选项卡 -->
    <div class="view-tabs">
      <button 
        class="view-tab" 
        :class="{ active: currentView === 'active' }"
        @click="switchView('active')"
      >
        <span class="tab-icon active-icon"></span>
        活跃便签 <span class="count-badge">{{ notesCount.active }}</span>
      </button>
      <button 
        class="view-tab" 
        :class="{ active: currentView === 'archived' }"
        @click="switchView('archived')"
      >
        <span class="tab-icon archive-icon"></span>
        归档 <span class="count-badge">{{ notesCount.archived }}</span>
      </button>
      <button 
        class="view-tab" 
        :class="{ active: currentView === 'recycled' }"
        @click="switchView('recycled')"
      >
        <span class="tab-icon recycle-icon"></span>
        回收站 <span class="count-badge">{{ notesCount.recycled }}</span>
      </button>
    </div>
    
    <!-- 分类选择器 -->
    <div class="category-selector" v-if="currentView === 'active'">
      <div class="category-header">
        <h3>分类</h3>
        <div class="category-header-actions">
          <button 
            class="add-category-btn"
            @click="showNewCategoryInput = true"
            title="添加新分类"
          >
            <span>+</span>
          </button>
          <button 
            class="toggle-categories-btn"
            @click="showCategorySelector = !showCategorySelector"
            :class="{ active: showCategorySelector }"
          >
            <span class="icon">{{ showCategorySelector ? '▲' : '▼' }}</span>
          </button>
        </div>
      </div>
      
      <div class="category-list" v-if="showCategorySelector">
        <!-- 新建分类输入框 -->
        <div class="new-category-input-container" v-if="showNewCategoryInput">
          <input 
            type="text" 
            v-model="newCategoryName" 
            placeholder="输入分类名称"
            @keydown.enter="addCategory"
            @keydown.esc="showNewCategoryInput = false"
            ref="newCategoryInputRef"
          />
          <div class="new-category-actions">
            <button @click="addCategory" class="confirm-btn">添加</button>
            <button @click="showNewCategoryInput = false" class="cancel-btn">取消</button>
          </div>
        </div>
        
        <button 
          class="category-btn"
          :class="{ active: activeCategory === null }"
          @click="switchCategory(null)"
        >
          <span class="badge all-badge"></span>
          全部便签
          <span class="count">{{ notesCount.active }}</span>
        </button>
        
        <button 
          v-for="category in categories"
          :key="category.id"
          class="category-btn"
          :class="{ active: activeCategory === category.id }"
          @click="switchCategory(category.id)"
        >
          <span 
            class="badge"
            :style="{ backgroundColor: category.color }"
          ></span>
          {{ category.name }}
          <span class="count">{{ category.count }}</span>
          
          <!-- 删除分类按钮 - 不显示在默认分类上 -->
          <button 
            v-if="category.id !== 'category-text' && category.id !== 'category-image'"
            class="delete-category-btn" 
            title="删除分类"
            @click.stop="deleteCategory(category.id)"
          >
            ×
          </button>
        </button>
      </div>
    </div>
    
    <!-- 列表顶部操作栏 -->
    <div class="list-header">
      <!-- 搜索框 -->
      <div class="search-bar" :class="{ active: isSearching }">
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="搜索便签..." 
          class="search-input"
          @input="handleSearch"
          @focus="isSearching = true"
          @blur="isSearching = false"
        />
        <button 
          class="search-clear" 
          v-if="searchText" 
          @click="clearSearch"
        >
          ×
        </button>
        <button 
          class="search-button" 
          @click="handleSearch"
        >
          <span class="search-icon"></span>
        </button>
      </div>
      
      <!-- 创建新便签按钮 -->
      <button 
        class="create-button"
        @click="createNewNote"
      >
        新建便签
      </button>
    </div>
    
    <div class="note-grid" v-if="filteredNotes.length > 0">
      <div 
        v-for="note in filteredNotes" 
        :key="note.id"
        class="note-card"
        :class="{
          'note-card--pinned': note.pinned,
          'note-card--dragging': draggedNoteId === note.id,
          'note-card--drop-target': dropTarget === note.id,
          'animate-in': animatingNotes.includes(note.id)
        }"
        :style="{ 
          '--note-color': note.color || 'var(--primary-dark)',
          cursor: draggedNoteId ? 'grabbing' : 'grab' 
        }"
        draggable="true"
        @dragstart="startDrag(note.id, $event)"
        @dragend="endDrag"
        @dragenter="dragEnter(note.id)"
        @dragleave="dragLeave"
        @contextmenu="handleNoteContextMenu(note.id, $event)"
      >
        <div class="note-card__header">
          <h3 class="note-card__title">{{ note.title }}</h3>
          
          <div class="note-card__actions">
            <button 
              class="action-btn edit-btn"
              @click="editNote(note.id)"
              title="编辑便签"
            >
              <span class="action-icon">✎</span>
            </button>
            
            <button 
              class="action-btn pin-btn"
              @click="togglePin(note.id)"
              :title="note.pinned ? '取消固定' : '固定便签'"
              v-if="currentView === 'active'"
            >
              <span class="action-icon">📌</span>
            </button>
            
            <button 
              class="action-btn"
              :class="currentView === 'active' ? 'archive-btn' : 'restore-btn'"
              v-if="currentView !== 'recycled'"
              @click="currentView === 'active' ? archiveNote(note.id) : restoreNote(note.id)"
              :title="currentView === 'active' ? '归档便签' : '恢复便签'"
            >
              <span class="action-icon">{{ currentView === 'active' ? '📥' : '♻️' }}</span>
            </button>
            
            <button 
              class="action-btn delete-btn"
              @click="deleteNote(note.id)"
              :title="currentView === 'recycled' ? '永久删除' : '移至回收站'"
            >
              <span class="action-icon">🗑</span>
            </button>
          </div>
        </div>
        
        <div class="note-card__content">
          <p v-html="note.content"></p>
        </div>
        
        <div class="note-card__footer">
          <div class="note-categories" v-if="note.categoryIds && note.categoryIds.length > 0">
            <span 
              v-for="catId in note.categoryIds" 
              :key="catId"
              class="category-tag"
              :style="{ 
                borderColor: categories.find((c: Category) => c.id === catId)?.color || '#555' 
              }"
            >
              {{ categories.find((c: Category) => c.id === catId)?.name || '未知' }}
            </span>
          </div>
          <span class="note-card__date">{{ formatDate(note.updatedAt) }}</span>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <div v-if="searchText" class="empty-search">
        <p>没有找到匹配的便签</p>
        <button @click="clearSearch" class="reset-search-btn">清除搜索</button>
      </div>
      <div v-else-if="currentView === 'active'" class="empty-notes">
        <p>还没有便签，开始创建吧</p>
        <button @click="createNewNote" class="create-first-note-btn">创建第一个便签</button>
      </div>
      <div v-else-if="currentView === 'archived'" class="empty-archive">
        <p>归档为空</p>
        <p class="empty-hint">将便签归档以整理您的工作空间</p>
      </div>
      <div v-else-if="currentView === 'recycled'" class="empty-recycle">
        <p>回收站为空</p>
      </div>
    </div>
    
    <!-- 便签右键菜单 -->
    <div 
      v-if="showContextMenu && contextMenuTargetId"
      class="context-menu"
      :style="{ 
        top: `${contextMenuPosition.y}px`, 
        left: `${contextMenuPosition.x}px`
      }"
    >
      <div class="menu-item" @click="editNote(contextMenuTargetId)">
        <span class="menu-icon">✎</span>
        <span>编辑便签</span>
      </div>
      
      <div 
        v-if="currentView === 'active'"
        class="menu-item" 
        @click="archiveNote(contextMenuTargetId)"
      >
        <span class="menu-icon">📥</span>
        <span>归档便签</span>
      </div>
      
      <div 
        v-if="currentView === 'archived' || currentView === 'recycled'"
        class="menu-item" 
        @click="restoreNote(contextMenuTargetId)"
      >
        <span class="menu-icon">♻️</span>
        <span>恢复便签</span>
      </div>
      
      <div 
        class="menu-item danger" 
        @click="deleteNote(contextMenuTargetId)"
      >
        <span class="menu-icon">🗑</span>
        <span>{{ currentView === 'recycled' ? '永久删除' : '删除便签' }}</span>
      </div>
      
      <div v-if="currentView === 'active'" class="menu-separator"></div>
      
      <!-- 移动分类子菜单 -->
      <div v-if="currentView === 'active'" class="submenu">
        <div class="menu-item has-submenu">
          <span class="menu-icon">🏷️</span>
          <span>移动分类</span>
          <span class="arrow">▶</span>
          
          <div class="submenu-content">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="menu-item"
              @click="moveNoteToCategory(contextMenuTargetId, category.id)"
            >
              <span 
                class="category-dot"
                :style="{ backgroundColor: category.color }"
              ></span>
              <span>{{ category.name }}</span>
            </div>
            
            <div class="menu-separator"></div>
            
            <!-- 新建分类 -->
            <div v-if="!showNewCategoryInput" class="menu-item" @click="showNewCategoryInput = true">
              <span class="menu-icon">+</span>
              <span>新建分类</span>
            </div>
            
            <div v-else class="new-category-input">
              <input 
                type="text" 
                v-model="newCategoryName" 
                placeholder="输入分类名"
                @keydown.enter="addCategory"
                @keydown.esc="showNewCategoryInput = false"
              />
              <div class="new-category-input-actions">
                <button @click="addCategory" class="add-btn">添加</button>
                <button @click="showNewCategoryInput = false" class="cancel-btn">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空白区域右键菜单 -->
    <div 
      v-if="showBlankAreaContextMenu" 
      class="context-menu blank-area-menu"
      :style="{
        top: `${blankAreaContextMenuPosition.y}px`,
        left: `${blankAreaContextMenuPosition.x}px`,
      }"
    >
      <div class="menu-item" @click="createNewNote">
        <span class="menu-icon">📝</span>
        <span>新建便签</span>
      </div>
      
      <div class="menu-item" @click="searchNotes">
        <span class="menu-icon">🔍</span>
        <span>搜索便签</span>
      </div>
      
      <div class="menu-item" @click="refreshPage">
        <span class="menu-icon">🔄</span>
        <span>刷新页面</span>
      </div>
      
      <div class="menu-separator"></div>
      
      <div class="menu-item" @click="takeScreenshot">
        <span class="menu-icon">📷</span>
        <span>屏幕截图</span>
      </div>
    </div>
    
    <!-- 新建分类输入框 -->
    <div 
      v-if="showNewCategoryInput && !showContextMenu"
      class="floating-input"
      :style="{ 
        top: `${contextMenuPosition.y}px`, 
        left: `${contextMenuPosition.x}px`
      }"
    >
      <input 
        type="text" 
        v-model="newCategoryName" 
        placeholder="输入分类名称"
        @keydown.enter="addCategory"
      />
      <div class="floating-actions">
        <button @click="addCategory" class="confirm-btn">添加</button>
        <button @click="hideContextMenus" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sci-note-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
  padding: var(--space-md);
}

.view-tabs {
  display: flex;
  margin-bottom: 16px;
  background: rgba(13, 17, 23, 0.5);
  border-radius: 8px;
  padding: 4px;
  
  .view-tab {
    flex: 1;
    padding: 10px 16px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.1);
    }
    
    &.active {
      background: rgba(0, 212, 255, 0.2);
      color: var(--neon-cyan);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }
    
    .tab-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      position: relative;
    }
    
    .count-badge {
      background: rgba(255, 255, 255, 0.15);
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 4px;
    }
  }
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--neon-cyan);
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    margin: 0;
  }
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
  
  .search-input {
    width: 100%;
    padding: 10px 14px;
    padding-right: 40px;
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--neon-cyan);
    border-radius: var(--border-radius-md);
    color: var(--text-primary);
    transition: all 0.3s var(--ease-default);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    
    &:focus {
      border-color: var(--neon-magenta);
      box-shadow: 0 0 15px rgba(255, 0, 212, 0.4);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
  }
  
  .search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    height: 24px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    
    &:hover {
      color: var(--neon-magenta);
      background-color: rgba(255, 0, 212, 0.1);
    }
  }
}

.header-actions {
  display: flex;
  gap: 12px;
  
  .new-note-btn,
  .empty-bin-btn {
    height: 40px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .new-note-btn {
    background: rgba(0, 212, 255, 0.2);
    color: var(--neon-cyan);
    border: 1px solid var(--neon-cyan);
    
    &:hover {
      background: rgba(0, 212, 255, 0.3);
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
    }
    
    .btn-icon {
      font-size: 18px;
    }
  }
  
  .empty-bin-btn {
    background: rgba(255, 59, 48, 0.2);
    color: rgba(255, 59, 48, 0.9);
    border: 1px solid rgba(255, 59, 48, 0.5);
    
    &:hover {
      background: rgba(255, 59, 48, 0.3);
      box-shadow: 0 0 15px rgba(255, 59, 48, 0.3);
    }
  }
}

.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.note-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.5);
  transition: all 0.3s var(--ease-default);
  cursor: grab;
  position: relative;
  
  &:hover {
    box-shadow: 0 0 0 1px var(--neon-cyan), 0 8px 24px rgba(0, 0, 0, 0.7);
    transform: translateY(-4px);
    
    .note-card__actions {
      opacity: 1;
    }
  }
  
  &--pinned {
    box-shadow: 0 0 0 1px var(--neon-magenta), 0 8px 24px rgba(0, 0, 0, 0.5);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      border-style: solid;
      border-width: 0 20px 20px 0;
      border-color: transparent var(--neon-magenta) transparent transparent;
    }
  }
  
  &--dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }
  
  &--drop-target {
    box-shadow: 0 0 0 2px var(--neon-magenta), 0 0 30px rgba(255, 0, 212, 0.7);
  }
  
  &--animating {
    animation: noteCardAnimation 0.5s var(--ease-default);
  }
  
  &__header {
    padding: var(--space-md);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--neon-cyan);
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
    flex: 1;
    word-break: break-word;
  }
  
  &__actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s var(--ease-default);
  }
  
  &__content {
    padding: var(--space-md);
    flex: 1;
    color: var(--text-primary);
    
    p {
      margin: 0;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.5;
    }
  }
  
  &__footer {
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
  }
  
  &__date {
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
  
  &.edit-btn:hover {
    color: var(--neon-cyan);
  }
  
  &.pin-btn:hover {
    color: var(--warning);
  }
  
  &.delete-btn:hover {
    color: var(--error);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl) 0;
  text-align: center;
  
  &__icon {
    font-size: 48px;
    margin-bottom: var(--space-md);
    opacity: 0.6;
  }
  
  &__title {
    font-size: 24px;
    color: var(--neon-cyan);
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
    margin: 0;
  }
  
  &__message {
    font-size: 16px;
    color: var(--text-secondary);
    max-width: 400px;
    margin: 0;
  }
  
  &__btn {
    margin-top: var(--space-md);
    padding: 10px 20px;
    background-color: var(--neon-cyan);
    color: var(--primary-dark);
    border: none;
    border-radius: var(--border-radius-md);
    font-weight: 500;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
    transition: all 0.3s var(--ease-default);
    
    &:hover {
      background-color: var(--neon-magenta);
      box-shadow: 0 0 20px rgba(255, 0, 212, 0.6);
    }
  }
}

@keyframes noteCardAnimation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

// 添加分类相关样式
.category-selector {
  margin-bottom: 16px;
  
  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--neon-cyan);
    }
    
    .category-header-actions {
      display: flex;
      gap: 8px;
    }
    
    .add-category-btn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid var(--neon-cyan, #00D4FF);
      background-color: rgba(0, 212, 255, 0.1);
      color: var(--neon-cyan, #00D4FF);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(0, 212, 255, 0.2);
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
      }
    }
    
    .toggle-categories-btn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background-color: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--neon-cyan, #00D4FF);
        color: var(--neon-cyan, #00D4FF);
      }
      
      &.active {
        border-color: var(--neon-cyan, #00D4FF);
        color: var(--neon-cyan, #00D4FF);
        background-color: rgba(0, 212, 255, 0.1);
      }
    }
  }
  
  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    animation: slideDown 0.3s ease-out;
    
    .category-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.4);
        border-color: var(--neon-cyan);
      }
      
      &.active {
        background: rgba(0, 212, 255, 0.1);
        border-color: var(--neon-cyan);
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
      }
      
      .badge {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }
      
      .all-badge {
        background: linear-gradient(45deg, var(--neon-cyan), var(--neon-magenta));
      }
      
      .count {
        background: rgba(0, 0, 0, 0.3);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 12px;
      }
    }
  }
}

.note-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  
  .category-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid;
    white-space: nowrap;
  }
}

// 右键菜单样式
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  background: rgba(10, 25, 47, 0.95);
  border: 1px solid var(--neon-cyan);
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  padding: 4px 0;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.2s ease-out;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    position: relative;
    
    &:hover {
      background: rgba(0, 212, 255, 0.1);
    }
    
    &.danger:hover {
      background: rgba(255, 59, 48, 0.1);
      color: rgba(255, 59, 48, 0.9);
    }
    
    .menu-icon {
      margin-right: 8px;
      width: 16px;
      text-align: center;
    }
    
    .arrow {
      margin-left: auto;
      font-size: 10px;
    }
    
    &.has-submenu {
      &:hover .submenu-content {
        display: block;
      }
    }
  }
  
  .menu-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 4px 0;
  }
  
  .submenu {
    position: relative;
    
    .submenu-content {
      display: none;
      position: absolute;
      left: 100%;
      top: 0;
      min-width: 160px;
      background: rgba(10, 25, 47, 0.95);
      border: 1px solid var(--neon-cyan);
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
      padding: 4px 0;
      z-index: 1001;
      backdrop-filter: blur(10px);
      
      .category-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 8px;
      }
    }
  }
  
  .new-category-input {
    padding: 8px;
    display: flex;
    gap: 4px;
    
    input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--neon-cyan);
      border-radius: 4px;
      color: white;
      padding: 4px 8px;
      
      &:focus {
        outline: none;
        box-shadow: 0 0 5px var(--neon-magenta);
      }
    }
    
    button {
      background: var(--neon-cyan);
      color: var(--primary-dark);
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      
      &:hover {
        background: var(--neon-magenta);
      }
    }
  }
}

.floating-input {
  position: fixed;
  z-index: 1000;
  background: rgba(10, 25, 47, 0.95);
  border: 1px solid var(--neon-cyan);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  width: 240px;
  animation: fadeIn 0.2s ease-out;
  
  input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--neon-cyan);
    border-radius: 4px;
    color: white;
    padding: 8px 12px;
    margin-bottom: 8px;
    
    &:focus {
      outline: none;
      box-shadow: 0 0 8px var(--neon-magenta);
    }
  }
  
  .floating-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    
    button {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      
      &.confirm-btn {
        background: var(--neon-cyan);
        color: var(--primary-dark);
        
        &:hover {
          background: var(--neon-magenta);
        }
      }
      
      &.cancel-btn {
        background: rgba(0, 0, 0, 0.3);
        color: var(--text-primary);
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.blank-area-menu {
  background-color: var(--primary-dark, #0A192F);
  border: 1px solid var(--neon-cyan, #00D4FF);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  z-index: 1000;
  min-width: 180px;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: rgba(0, 212, 255, 0.2);
    }
    
    .menu-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
  }
  
  .menu-separator {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 5px 0;
  }
}

.create-button {
  background-color: var(--neon-cyan, #00D4FF);
  color: var(--primary-dark, #0A192F);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: var(--neon-magenta, #FF00D4);
    box-shadow: 0 0 15px rgba(255, 0, 212, 0.5);
  }
}

.empty-state__button {
  background-color: var(--neon-cyan, #00D4FF);
  color: var(--primary-dark, #0A192F);
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: var(--neon-magenta, #FF00D4);
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(255, 0, 212, 0.6);
  }
}

.category-btn {
  position: relative; // 确保相对定位以便放置删除按钮
  
  .delete-category-btn {
    position: absolute;
    right: -6px;
    top: -6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: rgba(255, 59, 48, 0.9);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1;
    
    &:hover {
      background-color: rgb(255, 59, 48);
    }
  }
  
  &:hover .delete-category-btn {
    opacity: 1;
  }
}

.new-category-input-container {
  margin-bottom: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 8px;
  border: 1px solid var(--neon-cyan, #00D4FF);
  
  input {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 212, 255, 0.3);
    background-color: rgba(0, 0, 0, 0.2);
    color: white;
    margin-bottom: 8px;
    
    &:focus {
      border-color: var(--neon-cyan, #00D4FF);
      outline: none;
    }
  }
  
  .new-category-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    
    button {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      
      &.confirm-btn {
        background-color: var(--neon-cyan, #00D4FF);
        color: #0A192F;
        border: none;
        
        &:hover {
          background-color: rgba(0, 212, 255, 0.8);
        }
      }
      
      &.cancel-btn {
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        
        &:hover {
          border-color: rgba(255, 255, 255, 0.5);
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}

.new-category-input {
  padding: 8px;
  width: 100%;
  
  input {
    width: 100%;
    padding: 6px;
    border-radius: 4px;
    border: 1px solid var(--neon-cyan, #00D4FF);
    background-color: rgba(0, 0, 0, 0.3);
    color: white;
    outline: none;
    margin-bottom: 5px;
  }
  
  .new-category-input-actions {
    display: flex;
    justify-content: space-between;
    
    button {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      
      &.add-btn {
        background-color: var(--neon-cyan, #00D4FF);
        border: none;
        color: var(--primary-dark, #0A192F);
      }
      
      &.cancel-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}
</style> 