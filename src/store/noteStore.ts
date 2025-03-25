import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export const useNoteStore = defineStore('notes', () => {
  // 便签数据
  const notes = ref<Note[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性获取排序后的便签
  const sortedNotes = computed(() => {
    return [...notes.value].sort((a, b) => {
      // 优先显示固定便签
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // 按更新时间排序（新的在前）
      return b.updatedAt - a.updatedAt;
    });
  });

  // 固定的便签
  const pinnedNotes = computed(() => {
    return notes.value.filter(note => note.isPinned);
  });

  // 未固定的便签
  const unpinnedNotes = computed(() => {
    return notes.value.filter(note => !note.isPinned);
  });

  // 搜索便签
  const searchNotes = (query: string) => {
    if (!query.trim()) {
      return sortedNotes.value;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    return sortedNotes.value.filter(note => 
      note.title.toLowerCase().includes(lowerCaseQuery) || 
      note.content.toLowerCase().includes(lowerCaseQuery)
    );
  };

  // 从本地存储加载便签数据
  const loadNotes = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      if (window.__TAURI__) {
        // 使用Tauri的fs API读取便签数据
        const { invoke } = window.__TAURI__;
        const data = await invoke('read_notes_data');
        notes.value = JSON.parse(data as string) as Note[];
      } else {
        // 浏览器环境用localStorage
        const storedNotes = localStorage.getItem('sci-notes');
        if (storedNotes) {
          notes.value = JSON.parse(storedNotes);
        }
      }
    } catch (err) {
      console.error('加载便签失败:', err);
      error.value = '无法加载便签数据';
    } finally {
      isLoading.value = false;
    }
  };

  // 保存便签数据到本地存储
  const saveNotes = async () => {
    try {
      if (window.__TAURI__) {
        // 使用Tauri的fs API保存便签数据
        const { invoke } = window.__TAURI__;
        await invoke('save_notes_data', { 
          notes: JSON.stringify(notes.value) 
        });
      } else {
        // 浏览器环境用localStorage
        localStorage.setItem('sci-notes', JSON.stringify(notes.value));
      }
    } catch (err) {
      console.error('保存便签失败:', err);
      error.value = '无法保存便签数据';
    }
  };

  // 添加新便签
  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = Date.now();
    const newNote: Note = {
      id: `note-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      ...noteData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    notes.value.push(newNote);
    await saveNotes();
    return newNote;
  };

  // 更新便签
  const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    const index = notes.value.findIndex(note => note.id === id);
    if (index === -1) {
      error.value = '便签不存在';
      return null;
    }
    
    notes.value[index] = {
      ...notes.value[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    await saveNotes();
    return notes.value[index];
  };

  // 删除便签
  const deleteNote = async (id: string) => {
    const index = notes.value.findIndex(note => note.id === id);
    if (index === -1) {
      error.value = '便签不存在';
      return false;
    }
    
    notes.value.splice(index, 1);
    await saveNotes();
    return true;
  };

  // 切换便签固定状态
  const togglePinNote = async (id: string) => {
    const note = notes.value.find(note => note.id === id);
    if (!note) {
      error.value = '便签不存在';
      return false;
    }
    
    note.isPinned = !note.isPinned;
    await saveNotes();
    return note.isPinned;
  };

  return {
    notes,
    isLoading,
    error,
    sortedNotes,
    pinnedNotes,
    unpinnedNotes,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    searchNotes
  };
}); 