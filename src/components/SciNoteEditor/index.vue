<!-- SciNoteEditor 组件 -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useNoteStore } from '@/stores/noteStore'
import type { Category } from '@/stores/noteStore'

// 定义组件 Props
interface Props {
  noteId?: string;
  isNew?: boolean;
}

// 定义组件事件
const emit = defineEmits<{
  (event: 'save-note', noteId: string): void;
  (event: 'close-editor'): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  noteId: '',
  isNew: false
})

// 组件状态
const noteTitle = ref('')
const noteContent = ref('')
const noteColor = ref('#0A192F')
const isDragging = ref(false)
const showClipboardPrompt = ref(false)
const clipboardContent = ref('')
const lastClipboardContent = ref('')
const editorRef = ref<HTMLDivElement | null>(null)
const titleInputRef = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)
const saveSuccess = ref(false)
const isFullscreen = ref(false)
const showColorPicker = ref(false)
const contentArea = ref<HTMLDivElement | null>(null)
const note = ref<any>({ updatedAt: Date.now(), isPinned: false })
const imageInputRef = ref<HTMLInputElement | null>(null)
const isImageUploading = ref(false)
const showImagePrompt = ref(false)
const capturedImage = ref<string | null>(null)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

// 分类相关状态
const selectedCategories = ref<string[]>(['category-text'])
const showCategoryDropdown = ref(false)

// 注入 store
const noteStore = useNoteStore()

// 颜色列表
const colorOptions = [
  { id: 'dark-blue', value: '#0A192F', label: '深空蓝' },
  { id: 'carbon-black', value: '#0D1117', label: '炭黑' },
  { id: 'neon-blue', value: '#003366', label: '霓虹蓝' },
  { id: 'cyber-purple', value: '#2D0066', label: '赛博紫' },
  { id: 'terminal-green', value: '#003300', label: '终端绿' }
]

// 获取分类列表
const categories = computed(() => noteStore.categoriesWithCount)

// 选择或取消选择分类
const toggleCategory = (categoryId: string) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index === -1) {
    selectedCategories.value.push(categoryId)
  } else if (selectedCategories.value.length > 1) {
    // 确保至少有一个分类被选中
    selectedCategories.value.splice(index, 1)
  }
}

// 检查分类是否被选中
const isCategorySelected = (categoryId: string) => {
  return selectedCategories.value.includes(categoryId)
}

// 获取分类名称
const getCategoryName = (categoryId: string) => {
  const category = categories.value.find((c: Category) => c.id === categoryId)
  return category ? category.name : '未知分类'
}

// 初始化编辑器内容
const initEditor = async () => {
  if (props.noteId && !props.isNew) {
    const foundNote = noteStore.notes.find((n: any) => n.id === props.noteId)
    if (foundNote) {
      noteTitle.value = foundNote.title
      noteContent.value = foundNote.content
      noteColor.value = foundNote.color || '#0A192F'
      note.value = foundNote
      
      // 加载分类
      if (foundNote.categoryIds && foundNote.categoryIds.length > 0) {
        selectedCategories.value = [...foundNote.categoryIds]
      }
      
      // 为富文本编辑器设置HTML内容
      if (contentArea.value) {
        contentArea.value.innerHTML = foundNote.content;
      }
    }
  }
  
  // 如果是新便签，聚焦到标题输入框
  if (props.isNew) {
    await nextTick()
    titleInputRef.value?.focus()
  }
}

// 保存便签前从富文本编辑器更新内容
const updateContentFromEditor = () => {
  if (contentArea.value) {
    noteContent.value = contentArea.value.innerHTML;
    
    // 提取图片链接保存到note对象
    if (props.noteId && !props.isNew) {
      const imgTags = contentArea.value.querySelectorAll('img');
      const imageUrls: string[] = [];
      
      imgTags.forEach(img => {
        if (img.src) {
          imageUrls.push(img.src);
        }
      });
      
      // 如果是更新现有便签，也更新图片数组
      const existingNote = noteStore.getNote(props.noteId);
      if (existingNote) {
        existingNote.images = imageUrls;
      }
    }
  }
}

// 保存便签
const saveNote = async () => {
  if (!noteTitle.value.trim()) {
    alert('请输入便签标题')
    return
  }
  
  // 先从编辑器更新内容
  updateContentFromEditor();
  
  isSaving.value = true
  
  try {
    // 如果是新便签，创建一个新的
    if (props.isNew || !props.noteId) {
      // 提取图片链接
      const imgTags = contentArea.value?.querySelectorAll('img') || [];
      const imageUrls: string[] = [];
      
      imgTags.forEach(img => {
        if (img.src) {
          imageUrls.push(img.src);
        }
      });
      
      const newNoteId = noteStore.addNote({
        title: noteTitle.value,
        content: noteContent.value,
        color: noteColor.value,
        images: imageUrls,
        categoryIds: selectedCategories.value // 添加所选分类
      });
      saveSuccess.value = true
      
      setTimeout(() => {
        emit('save-note', newNoteId)
      }, 800)
    } 
    // 否则更新现有便签
    else {
      // 提取图片链接
      const imgTags = contentArea.value?.querySelectorAll('img') || [];
      const imageUrls: string[] = [];
      
      imgTags.forEach(img => {
        if (img.src) {
          imageUrls.push(img.src);
        }
      });
      
      noteStore.updateNote(props.noteId, {
        title: noteTitle.value,
        content: noteContent.value,
        color: noteColor.value,
        images: imageUrls,
        categoryIds: selectedCategories.value // 更新所选分类
      })
      saveSuccess.value = true
      
      setTimeout(() => {
        emit('save-note', props.noteId)
      }, 800)
    }
    
    // 保存所有便签到本地存储
    noteStore.saveNotes()
  } catch (error) {
    console.error('保存便签失败:', error)
  } finally {
    setTimeout(() => {
      isSaving.value = false
      saveSuccess.value = false
    }, 1000)
  }
}

// 开启拖拽
const startDrag = (event: MouseEvent) => {
  // 如果点击的是按钮或按钮内部的元素，不启动拖拽
  if (event.target instanceof HTMLElement &&
     (event.target.closest('.minimize-btn') || 
      event.target.closest('.close-btn'))) {
    return;
  }
  
  // 只在点击标题栏空白处时启动拖拽
  if (event.target === event.currentTarget) {
    isDragging.value = true
  }
}

// 最小化窗口
const minimizeWindow = async () => {
  try {
    // 由于类型问题，使用any类型绕过TypeScript检查
    const tauriWindow = (window as any).__TAURI__?.window;
    
    // 使用旧的Tauri window API
    if (tauriWindow?.getCurrent) {
      await tauriWindow.getCurrent().minimize();
      console.log("窗口已最小化(通过getCurrent)");
      return;
    }
    
    // 使用新的Tauri appWindow API
    if (tauriWindow?.appWindow) {
      await tauriWindow.appWindow.minimize();
      console.log("窗口已最小化");
      return;
    }
    
    // 使用invoke API
    if ((window as any).__TAURI__?.invoke) {
      await (window as any).__TAURI__.invoke('minimize_window');
      console.log("窗口已最小化(通过invoke)");
      return;
    }
    
    console.error("找不到可用的Tauri窗口API");
    alert('无法最小化窗口，未找到Tauri API');
  } catch (error) {
    console.error('最小化窗口失败:', error);
    alert('最小化窗口失败，请重试');
  }
};

// 关闭编辑器
const closeEditor = () => {
  try {
    console.log("关闭编辑器被触发");
    
    // 如果有未保存的内容或正在保存，提示用户
    if (isSaving.value) {
      if (!confirm('便签正在保存中，确定要关闭吗？')) {
        return;
      }
    } else if (props.isNew || contentArea.value?.innerHTML !== noteContent.value) {
      if (!confirm('有未保存的内容，确定要关闭吗？')) {
        return;
      }
    }
    
    // 发送关闭事件给父组件
    emit('close-editor');
  } catch (error) {
    console.error('关闭编辑器出错:', error);
    // 确保即使出错也能关闭
    emit('close-editor');
  }
};

// 监听剪贴板
const checkClipboard = async () => {
  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName
    })
    
    if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
      const text = await navigator.clipboard.readText()
      
      // 只有当剪贴板有内容、与当前内容不同，且与上次检测的内容不同时才显示提示
      if (text && text.length > 0 && 
          noteContent.value !== text && 
          lastClipboardContent.value !== text) {
        clipboardContent.value = text
        lastClipboardContent.value = text // 更新上次检测内容
        showClipboardPrompt.value = true
        
        // 5秒后自动隐藏提示
        setTimeout(() => {
          showClipboardPrompt.value = false
        }, 5000)
      }
    }
  } catch (error) {
    console.error('读取剪贴板失败:', error)
  }
}

// 粘贴剪贴板内容
const pasteFromClipboard = () => {
  if (contentArea.value) {
    // 在光标位置插入文本
    document.execCommand('insertText', false, clipboardContent.value);
    updateContentFromEditor(); // 更新内容
  }
  showClipboardPrompt.value = false
  lastClipboardContent.value = clipboardContent.value // 更新上次使用的内容
}

// 截图功能（使用Tauri API）
const captureScreenshot = async () => {
  try {
    // 检查Tauri API是否可用
    if (window.__TAURI__) {
      showImagePrompt.value = true;
      // 调用Rust后端的截图命令
      const result = await window.__TAURI__.invoke<{ path: string, filename: string }>('capture_screenshot');
      
      if (result && result.path) {
        // 将截图作为数据URL插入
        const imgTag = `<img src="tauri://localhost/${result.path}" alt="Screenshot" style="max-width:100%;margin:8px 0;" />`;
        
        if (contentArea.value) {
          document.execCommand('insertHTML', false, imgTag);
          updateContentFromEditor();
        }
      }
    } else {
      alert('截图功能需要在Tauri环境中运行');
    }
  } catch (error) {
    console.error('截图失败:', error);
    alert('截图功能出错：' + (error as Error).message);
  } finally {
    showImagePrompt.value = false;
  }
}

// 打开文件选择器上传图片
const openImageUploader = () => {
  imageInputRef.value?.click();
}

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  
  try {
    // 显示加载提示
    isImageUploading.value = true;
    
    // 确保contentArea存在并聚焦
    if (contentArea.value) {
      contentArea.value.focus();
    }
    
    // 准备 FileReader
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        isImageUploading.value = false;
        return;
      }
      
      // 获取图片数据URL
      const imageData = e.target.result as string;
      
      // 将图片插入到编辑器中
      const img = document.createElement('img');
      img.src = imageData;
      img.alt = '上传的图片';
      img.style.maxWidth = '100%';
      img.style.margin = '8px 0';
      
      if (contentArea.value) {
        // 清除图像上传框
        input.value = '';
        
        // 插入图片到光标位置
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          
          // 创建包含图片的p标签
          const p = document.createElement('p');
          p.appendChild(img);
          range.insertNode(p);
          
          // 移动光标到图片后面
          range.setStartAfter(p);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // 没有光标位置就添加到内容末尾（保证图片在contentArea内部）
          const p = document.createElement('p');
          p.appendChild(img);
          contentArea.value.appendChild(p);
        }
        
        // 更新内容
        updateContentFromEditor();
        
        // 确保note.value.images存在
        if (!note.value.images) {
          note.value.images = [];
        }
        
        // 图片便签标记
        if (!note.value.images.includes('image')) {
          note.value.images.push('image');
        }
      }
      
      // 隐藏加载提示
      isImageUploading.value = false;
    };
    
    reader.onerror = () => {
      console.error('读取图片失败');
      isImageUploading.value = false;
      alert('读取图片失败，请重试');
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('图片上传失败', error);
    isImageUploading.value = false;
    alert('图片上传失败: ' + (error as Error).message);
  }
};

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  // 检查剪贴板数据
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;
  
  // 确保contentArea存在并聚焦
  if (contentArea.value) {
    contentArea.value.focus();
  }
  
  // 检查是否包含图片
  const items = clipboardData.items;
  let hasImage = false;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      hasImage = true;
      event.preventDefault(); // 阻止默认粘贴行为
      
      // 显示加载提示
      isImageUploading.value = true;
      
      // 从剪贴板获取图片
      const blob = items[i].getAsFile();
      if (!blob) {
        isImageUploading.value = false;
        continue;
      }
      
      // 读取图片数据
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target || !e.target.result) return;
        
        // 获取图片数据URL
        const imageData = e.target.result as string;
        
        // 将图片插入到编辑器中
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = '粘贴的图片';
        img.style.maxWidth = '100%';
        img.style.margin = '8px 0';
        
        if (contentArea.value) {
          // 插入图片到光标位置
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // 创建包含图片的p标签
            const p = document.createElement('p');
            p.appendChild(img);
            range.insertNode(p);
            
            // 移动光标到图片后面
            range.setStartAfter(p);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // 没有光标位置就添加到内容末尾（创建新段落）
            const p = document.createElement('p');
            p.appendChild(img);
            contentArea.value.appendChild(p);
          }
          
          // 更新内容
          updateContentFromEditor();
          
          // 确保note.value.images存在
          if (!note.value.images) {
            note.value.images = [];
          }
          
          // 图片便签标记
          if (!note.value.images.includes('image')) {
            note.value.images.push('image');
          }
        }
        
        // 隐藏加载提示
        isImageUploading.value = false;
      };
      
      reader.onerror = () => {
        console.error('读取剪贴板图片失败');
        isImageUploading.value = false;
        alert('读取剪贴板图片失败，请重试');
      };
      
      reader.readAsDataURL(blob);
      break;
    }
  }
};

// 处理按键
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl+S 保存便签
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    saveNote()
  }
  
  // Esc 关闭编辑器
  if (event.key === 'Escape') {
    event.preventDefault()
    closeEditor()
  }
}

// 处理内容区域右键菜单
const handleContextMenu = (event: MouseEvent) => {
  // 阻止默认的浏览器右键菜单
  event.preventDefault();
  
  // 获取窗口尺寸
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 估计菜单尺寸
  const menuWidth = 180;
  const menuHeight = 120;
  
  // 计算菜单位置
  let x = event.clientX;
  let y = event.clientY;
  
  // 调整位置避免超出屏幕
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth - 5;
  }
  
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight - 5;
  }
  
  // 设置自定义菜单的位置
  contextMenuPosition.value = {
    x,
    y
  };
  
  // 显示自定义菜单
  showContextMenu.value = true;
  
  // 点击其他区域时隐藏菜单
  const handleOutsideClick = () => {
    showContextMenu.value = false;
    document.removeEventListener('click', handleOutsideClick);
  };
  
  // 延迟添加事件监听，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
};

// 关闭分类下拉框
const closeCategoryDropdown = (event: MouseEvent) => {
  // 如果点击的不是下拉框本身及其子元素
  if (showCategoryDropdown.value && 
      event.target instanceof HTMLElement && 
      !event.target.closest('.dropdown')) {
    showCategoryDropdown.value = false;
  }
}

// 生命周期钩子
onMounted(() => {
  // 确保note.value有images属性
  if (!note.value) {
    note.value = { images: [], updatedAt: Date.now(), isPinned: false };
  } else if (!note.value.images) {
    note.value.images = [];
  }
  
  // 初始化编辑器内容
  initEditor();
  
  // 添加事件监听
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', closeCategoryDropdown); // 添加关闭分类下拉框的点击监听
  
  if (contentArea.value) {
    // 添加右键菜单事件监听
    contentArea.value.addEventListener('contextmenu', handleContextMenu);
    // 添加剪贴板事件监听
    contentArea.value.addEventListener('paste', handlePaste);
  }
  
  // 定期检查剪贴板
  const clipboardInterval = setInterval(checkClipboard, 3000);
  
  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', closeCategoryDropdown); // 移除事件监听
    clearInterval(clipboardInterval);
    
    if (contentArea.value) {
      contentArea.value.removeEventListener('contextmenu', handleContextMenu);
      contentArea.value.removeEventListener('paste', handlePaste);
    }
  });
});

// 监听 noteId 变化
watch(() => props.noteId, () => {
  if (props.noteId) {
    initEditor()
  }
})

// 字数统计
const wordCount = computed(() => {
  // 去除HTML标签后计算文本长度
  const div = document.createElement('div');
  div.innerHTML = noteContent.value;
  return div.textContent?.trim().length || 0;
});

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 聚焦内容区域
const focusContent = () => {
  if (contentArea.value) {
    contentArea.value.focus();
  }
};

// 切换便签固定状态
const togglePin = async () => {
  if (props.noteId) {
    note.value.isPinned = !note.value.isPinned;
    await noteStore.togglePinNote(props.noteId);
  }
};

// 切换全屏模式
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 选择颜色
const selectColor = (color: string) => {
  noteColor.value = color;
  showColorPicker.value = false;
};
</script>

<template>
  <div 
    class="sci-note-editor" 
    :style="{ backgroundColor: noteColor }"
    ref="editorRef"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <!-- 标题栏 -->
    <div 
      class="editor-header"
      @mousedown="startDrag"
    >
      <h3>{{ props.isNew ? '新建便签' : '编辑便签' }}</h3>
      
      <div class="window-controls">
        <button class="minimize-btn" title="最小化" @click.stop="minimizeWindow">
          <span></span>
        </button>
        <button class="close-btn" title="关闭" @click.stop="closeEditor">
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
    
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <label for="note-color">背景:</label>
        <select 
          id="note-color" 
          v-model="noteColor" 
          class="color-select"
        >
          <option 
            v-for="option in colorOptions" 
            :key="option.id" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <!-- 添加分类选择 -->
      <div class="toolbar-group category-selector">
        <label>分类:</label>
        <div class="dropdown">
          <div 
            class="dropdown-toggle"
            @click.stop="showCategoryDropdown = !showCategoryDropdown"
          >
            <div class="selected-categories">
              <span v-if="selectedCategories.length === 0">选择分类</span>
              <div v-else class="category-tags">
                <span 
                  v-for="catId in selectedCategories.slice(0, 2)" 
                  :key="catId"
                  class="category-tag"
                >
                  {{ getCategoryName(catId) }}
                </span>
                <span v-if="selectedCategories.length > 2" class="more-tag">
                  +{{ selectedCategories.length - 2 }}
                </span>
              </div>
            </div>
            <span class="dropdown-arrow">▼</span>
          </div>
          
          <div class="dropdown-menu" v-if="showCategoryDropdown" @click.stop>
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="dropdown-item"
              :class="{ 'selected': isCategorySelected(category.id) }"
              @click="toggleCategory(category.id)"
            >
              <span 
                class="category-color" 
                :style="{ backgroundColor: category.color }"
              ></span>
              <span class="category-name">{{ category.name }}</span>
              <span class="check-icon" v-if="isCategorySelected(category.id)">✓</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn image-btn" @click="openImageUploader" title="添加图片">
          <i class="image-icon"></i>
          <span>图片</span>
        </button>
        
        <button class="toolbar-btn screenshot-btn" @click="captureScreenshot" title="截图">
          <i class="screenshot-icon"></i>
          <span>截图</span>
        </button>
        
        <!-- 隐藏的图片上传输入框 -->
        <input 
          type="file" 
          ref="imageInputRef" 
          class="hidden-input" 
          accept="image/*" 
          @change="handleImageUpload"
        />
      </div>
    </div>
    
    <!-- 编辑区域 -->
    <div class="editor-content">
      <input 
        type="text" 
        v-model="noteTitle" 
        class="note-title-input" 
        placeholder="输入标题..." 
        ref="titleInputRef"
        @keydown.enter="focusContent"
      />
      
      <!-- 使用contenteditable div代替textarea支持富文本 -->
      <div 
        class="note-content-input" 
        contenteditable="true" 
        ref="contentArea"
        :style="{ backgroundColor: `${noteColor}10` }"
        @paste="handlePaste"
        placeholder="输入便签内容..."
      ></div>
    </div>
    
    <!-- 右键上下文菜单 -->
    <div 
      v-if="showContextMenu"
      class="context-menu"
      :style="{ 
        top: `${contextMenuPosition.y}px`, 
        left: `${contextMenuPosition.x}px` 
      }"
    >
      <ul>
        <li @click="captureScreenshot">
          <i class="screenshot-icon-small"></i> 全局截图
        </li>
        <li @click="openImageUploader">
          <i class="image-icon-small"></i> 插入图片
        </li>
        <li @click="document.execCommand('paste')">
          <i class="paste-icon-small"></i> 粘贴
        </li>
      </ul>
    </div>
    
    <!-- 剪贴板提示 -->
    <div 
      class="clipboard-prompt"
      v-if="showClipboardPrompt"
    >
      <p>检测到剪贴板内容</p>
      <div class="clipboard-actions">
        <button @click="pasteFromClipboard">粘贴</button>
        <button @click="showClipboardPrompt = false">忽略</button>
      </div>
    </div>
    
    <!-- 图片上传/截图处理中提示 -->
    <div 
      class="image-prompt"
      v-if="isImageUploading || showImagePrompt"
    >
      <p>{{ isImageUploading ? '正在处理图片...' : '正在截图...' }}</p>
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="editor-footer">
      <div class="status-info">
        <span class="word-count">{{ wordCount }} 字</span>
        <span class="update-time">{{ formatTime(note.updatedAt) }}</span>
      </div>
      
      <div class="action-buttons">
        <button 
          class="control-button" 
          :class="{ 'active': note.isPinned }" 
          @click="togglePin"
          title="固定便签"
        >
          <span class="icon">📌</span>
        </button>
        
        <button 
          class="control-button" 
          @click="toggleFullscreen"
          title="全屏编辑"
        >
          <span class="icon">{{ isFullscreen ? '🔍-' : '🔍+' }}</span>
        </button>
        
        <div class="color-selector">
          <button 
            class="color-button current-color" 
            @click="showColorPicker = !showColorPicker"
            :style="{ backgroundColor: noteColor }"
          ></button>
          
          <div class="color-picker" v-if="showColorPicker">
            <button 
              v-for="color in colorOptions" 
              :key="color.id"
              class="color-option"
              :style="{ backgroundColor: color.value }"
              @click="selectColor(color.value)"
            ></button>
          </div>
        </div>
      </div>
      
      <button 
        class="save-button" 
        @click="saveNote"
        :disabled="isSaving"
      >
        <span v-if="isSaving && !saveSuccess">保存中...</span>
        <span v-else-if="saveSuccess">已保存</span>
        <span v-else>保存便签</span>
      </button>
      
      <span class="keyboard-shortcut">按 Ctrl+S 保存 / Esc 关闭</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sci-note-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 
    0 0 0 1px rgba(0, 212, 255, 0.3),
    0 0 15px rgba(0, 212, 255, 0.5);
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  
  &:hover {
    box-shadow: 
      0 0 0 1px rgba(0, 212, 255, 0.5),
      0 0 25px rgba(0, 212, 255, 0.8);
  }
  
  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
    height: 100vh;
    width: 100vw;
  }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.3);
  cursor: grab;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--neon-cyan, #00D4FF);
  }
}

.window-controls {
  display: flex;
  gap: 8px;
  
  button {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    position: relative;
    
    &.minimize-btn {
      background-color: #FFC107;
      
      span {
        position: absolute;
        top: 7px;
        left: 3px;
        width: 10px;
        height: 2px;
        background-color: rgba(0, 0, 0, 0.5);
      }
    }
    
    &.close-btn {
      background-color: #F44336;
      
      span {
        position: absolute;
        top: 7px;
        left: 3px;
        width: 10px;
        height: 2px;
        background-color: rgba(0, 0, 0, 0.5);
        
        &:first-child {
          transform: rotate(45deg);
        }
        
        &:last-child {
          transform: rotate(-45deg);
        }
      }
    }
  }
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.color-select {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: var(--neon-cyan, #00D4FF);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
  
  option {
    background-color: #0D1117;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 0, 212, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: rgba(255, 0, 212, 0.1);
    border-color: var(--neon-magenta, #FF00D4);
    box-shadow: 0 0 10px rgba(255, 0, 212, 0.3);
  }
  
  &.image-btn {
    border-color: rgba(0, 212, 255, 0.3);
    
    &:hover {
      background-color: rgba(0, 212, 255, 0.1);
      border-color: var(--neon-cyan, #00D4FF);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }
  }
  
  .image-icon {
    display: inline-block;
    width: 14px;
    height: 12px;
    border: 1px solid currentColor;
    border-radius: 2px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 8px;
      height: 5px;
      border-radius: 50% 50% 0 0;
      background-color: currentColor;
    }
  }
  
  .screenshot-icon {
    display: inline-block;
    width: 14px;
    height: 12px;
    border: 1px solid currentColor;
    border-radius: 2px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 4px;
      height: 4px;
      background-color: currentColor;
      border-radius: 50%;
    }
  }
}

.hidden-input {
  display: none;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.1);
}

.note-title-input {
  background-color: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--neon-cyan, #00D4FF);
  font-size: 18px;
  font-weight: 500;
  padding: 8px 4px;
  margin-bottom: 16px;
  outline: none;
  
  &:focus {
    border-bottom-color: var(--neon-cyan, #00D4FF);
    box-shadow: 0 4px 8px -4px rgba(0, 212, 255, 0.5);
  }
  
  &::placeholder {
    color: rgba(0, 212, 255, 0.4);
  }
}

.note-content-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.6;
  padding: 8px 4px;
  outline: none;
  min-height: 200px;
  overflow-y: auto;
  
  &:empty:before {
    content: attr(placeholder);
    color: rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }
  
  &:focus {
    outline: none;
  }
  
  img {
    display: block;
    max-width: 100%;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.clipboard-prompt,
.image-prompt {
  position: absolute;
  bottom: 70px;
  left: 16px;
  right: 16px;
  background-color: rgba(0, 212, 255, 0.1);
  border: 1px solid var(--neon-cyan, #00D4FF);
  border-radius: 4px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  animation: slideUp 0.3s ease-out;
  
  p {
    margin: 0;
    color: var(--neon-cyan, #00D4FF);
    font-size: 14px;
  }
}

.image-prompt {
  background-color: rgba(255, 0, 212, 0.1);
  border-color: var(--neon-magenta, #FF00D4);
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  
  p {
    color: var(--neon-magenta, #FF00D4);
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 0, 212, 0.3);
    border-top: 2px solid var(--neon-magenta, #FF00D4);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}

.clipboard-actions {
  display: flex;
  gap: 8px;
  
  button {
    background-color: transparent;
    border: 1px solid var(--neon-cyan, #00D4FF);
    color: var(--neon-cyan, #00D4FF);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: rgba(0, 212, 255, 0.2);
    }
    
    &:first-child {
      background-color: var(--neon-cyan, #00D4FF);
      color: #0A192F;
      
      &:hover {
        background-color: #00c4ef;
      }
    }
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.save-button {
  background-color: var(--neon-cyan, #00D4FF);
  border: none;
  color: #0A192F;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  
  &:hover:not(:disabled) {
    background-color: var(--neon-magenta, #FF00D4);
    box-shadow: 0 0 15px rgba(255, 0, 212, 0.5);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.keyboard-shortcut {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  
  .word-count {
    font-size: 12px;
    color: var(--neon-cyan, #00D4FF);
  }
  
  .update-time {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .control-button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: rgba(0, 212, 255, 0.1);
      border-color: var(--neon-cyan, #00D4FF);
    }
    
    &.active {
      background-color: rgba(255, 0, 212, 0.1);
      border-color: var(--neon-magenta, #FF00D4);
      color: var(--neon-magenta, #FF00D4);
    }
  }
  
  .color-selector {
    position: relative;
    
    .current-color {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      
      &:hover {
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }
    }
    
    .color-picker {
      position: absolute;
      bottom: 40px;
      right: 0;
      background-color: rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      padding: 8px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      width: 110px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.2s;
      
      .color-option {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
      }
    }
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
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

/* 添加右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: var(--primary-dark, #0A192F);
  border: 1px solid var(--neon-cyan, #00D4FF);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  padding: 0;
  z-index: 9999;
  min-width: 150px;
  font-size: 14px;
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #fff;
      
      &:hover {
        background-color: rgba(0, 212, 255, 0.2);
      }
      
      i {
        margin-right: 8px;
        width: 16px;
        height: 16px;
        display: inline-block;
        position: relative;
      }
      
      .screenshot-icon-small {
        &::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 8px;
          border: 1px solid rgba(0, 212, 255, 0.8);
          top: 3px;
          left: 1px;
        }
        
        &::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: rgba(255, 0, 212, 0.8);
          border-radius: 50%;
          bottom: 0;
          right: 0;
        }
      }
      
      .image-icon-small {
        &::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 10px;
          border: 1px solid rgba(0, 212, 255, 0.8);
          top: 2px;
          left: 1px;
          border-radius: 2px;
        }
        
        &::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: rgba(255, 0, 212, 0.8);
          border-radius: 50%;
          top: 4px;
          left: 3px;
        }
      }
      
      .paste-icon-small {
        &::before {
          content: '';
          position: absolute;
          width: 10px;
          height: 12px;
          border: 1px solid rgba(0, 212, 255, 0.8);
          top: 1px;
          left: 3px;
        }
        
        &::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 3px;
          border: 1px solid rgba(0, 212, 255, 0.8);
          top: 0;
          left: 1px;
        }
      }
    }
  }
}

/* 添加分类选择下拉框样式 */
.category-selector {
  position: relative;
  
  .dropdown {
    position: relative;
    width: 150px;
    
    .dropdown-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--neon-cyan, #00D4FF);
      }
      
      .selected-categories {
        flex: 1;
        display: flex;
        overflow: hidden;
        color: white;
        font-size: 14px;
        
        .category-tags {
          display: flex;
          gap: 4px;
          overflow: hidden;
          
          .category-tag {
            padding: 2px 4px;
            background-color: rgba(0, 212, 255, 0.1);
            border-radius: 2px;
            font-size: 12px;
            white-space: nowrap;
          }
          
          .more-tag {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
      
      .dropdown-arrow {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        margin-left: 4px;
      }
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background-color: var(--primary-dark, #0A192F);
      border: 1px solid var(--neon-cyan, #00D4FF);
      border-radius: 4px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
      margin-top: 4px;
      z-index: 10;
      
      .dropdown-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: rgba(0, 212, 255, 0.1);
        }
        
        &.selected {
          background-color: rgba(0, 212, 255, 0.2);
        }
        
        .category-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .category-name {
          flex: 1;
          color: white;
          font-size: 14px;
        }
        
        .check-icon {
          color: var(--neon-cyan, #00D4FF);
          font-size: 14px;
        }
      }
    }
  }
}
</style> 