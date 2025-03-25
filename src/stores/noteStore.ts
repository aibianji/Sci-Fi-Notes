// @ts-ignore
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
  status: 'active' | 'archived' | 'recycled'
  images?: string[]
  categoryIds: string[] // 多分类标签
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  count?: number // 便签计数
}

export type NoteViewType = 'active' | 'archived' | 'recycled'

// 使用 setup 风格的 Pinia store 定义
export const useNoteStore = defineStore('noteStore', () => {
  // 状态定义
  const notes = ref<Note[]>([])
  const categories = ref<Category[]>([])
  const activeNoteId = ref<string | null>(null)
  const searchQuery = ref('')
  const currentView = ref<NoteViewType>('active')
  const activeCategoryId = ref<string | null>(null)

  // 初始化默认分类
  const initDefaultCategories = () => {
    if (categories.value.length === 0) {
      const timestamp = new Date().toISOString()
      categories.value = [
        {
          id: 'category-text',
          name: '文字',
          color: '#00D4FF', // 霓虹青蓝
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: 'category-image',
          name: '图片',
          color: '#FF00D4', // 霓虹紫红
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
      saveCategories()
    }
  }

  // 计算属性
  const sortedNotes = computed(() => {
    return [...notes.value]
      .filter((note: Note) => {
        // 先按状态过滤
        let statusMatch = true
        if (currentView.value === 'active') {
          statusMatch = note.status === 'active'
        } else if (currentView.value === 'archived') {
          statusMatch = note.status === 'archived'
        } else if (currentView.value === 'recycled') {
          statusMatch = note.status === 'recycled'
        }

        // 再按分类过滤（如果有选择分类）
        let categoryMatch = true
        if (activeCategoryId.value && note.status === 'active') {
          categoryMatch = note.categoryIds.includes(activeCategoryId.value)
        }

        return statusMatch && categoryMatch
      })
      .sort((a: Note, b: Note) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  })

  const filteredNotes = computed(() => {
    if (!searchQuery.value) return sortedNotes.value
    
    const query = searchQuery.value.toLowerCase()
    return sortedNotes.value.filter((note: Note) => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  })

  const getNote = (id: string) => {
    return notes.value.find((note: Note) => note.id === id)
  }

  const notesCount = computed(() => {
    return {
      active: notes.value.filter((note: Note) => note.status === 'active').length,
      archived: notes.value.filter((note: Note) => note.status === 'archived').length,
      recycled: notes.value.filter((note: Note) => note.status === 'recycled').length,
    }
  })

  // 获取分类列表（带每个分类的便签数量）
  const categoriesWithCount = computed(() => {
    return categories.value.map(category => {
      const count = notes.value.filter(
        note => note.status === 'active' && note.categoryIds.includes(category.id)
      ).length
      
      return {
        ...category,
        count
      }
    })
  })

  // 根据便签检测图片分类
  const detectImageCategory = (note: Note) => {
    // 如果便签已经有图片分类，则不操作
    if (note.categoryIds.includes('category-image')) return

    // 检查便签内容是否包含图片标签
    const hasImageTag = note.content.includes('<img')
    // 如果有图片数组且不为空
    const hasImages = note.images && note.images.length > 0

    if ((hasImageTag || hasImages) && !note.categoryIds.includes('category-image')) {
      note.categoryIds.push('category-image')
    }
  }

  // Actions
  function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'categoryIds'>) {
    const id = Date.now().toString()
    const timestamp = new Date().toISOString()
    
    // 默认添加到"文字"分类，如果有图片则自动添加到"图片"分类
    const categoryIds = ['category-text']
    const newNote = {
      ...note,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active' as const,
      categoryIds
    }
    
    // 检测是否包含图片，如是则添加图片分类
    detectImageCategory(newNote)
    
    notes.value.push(newNote)
    saveNotes()
    return id
  }
  
  function updateNote(id: string, updates: Partial<Note>) {
    const noteIndex = notes.value.findIndex((note: Note) => note.id === id)
    if (noteIndex !== -1) {
      const updatedNote = {
        ...notes.value[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // 检测是否包含图片
      detectImageCategory(updatedNote)
      
      notes.value[noteIndex] = updatedNote
      saveNotes()
    }
  }
  
  function deleteNote(id: string) {
    const noteIndex = notes.value.findIndex((note: Note) => note.id === id)
    if (noteIndex !== -1) {
      notes.value[noteIndex].status = 'recycled'
      notes.value[noteIndex].updatedAt = new Date().toISOString()
      saveNotes()
    }
  }
  
  function permanentlyDeleteNote(id: string) {
    const noteIndex = notes.value.findIndex((note: Note) => note.id === id)
    if (noteIndex !== -1) {
      notes.value.splice(noteIndex, 1)
      saveNotes()
    }
  }
  
  function archiveNote(id: string) {
    const noteIndex = notes.value.findIndex((note: Note) => note.id === id)
    if (noteIndex !== -1 && notes.value[noteIndex].status === 'active') {
      notes.value[noteIndex].status = 'archived'
      notes.value[noteIndex].updatedAt = new Date().toISOString()
      saveNotes()
    }
  }
  
  function restoreNote(id: string) {
    const noteIndex = notes.value.findIndex((note: Note) => note.id === id)
    if (noteIndex !== -1 && (notes.value[noteIndex].status === 'archived' || notes.value[noteIndex].status === 'recycled')) {
      notes.value[noteIndex].status = 'active'
      notes.value[noteIndex].updatedAt = new Date().toISOString()
      saveNotes()
    }
  }
  
  function emptyRecycleBin() {
    notes.value = notes.value.filter((note: Note) => note.status !== 'recycled')
    saveNotes()
  }
  
  function setCurrentView(view: NoteViewType) {
    currentView.value = view
  }
  
  function setActiveNote(id: string | null) {
    activeNoteId.value = id
  }
  
  function togglePinNote(id: string) {
    const note = notes.value.find((note: Note) => note.id === id)
    if (note && note.status === 'active') {
      note.pinned = !note.pinned
      saveNotes()
    }
  }
  
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  // 分类相关操作
  function addCategory(name: string, color: string = '#00D4FF') {
    const id = `category-${Date.now()}`
    const timestamp = new Date().toISOString()
    
    const newCategory: Category = {
      id,
      name,
      color,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    
    categories.value.push(newCategory)
    saveCategories()
    return id
  }
  
  function updateCategory(id: string, updates: Partial<Category>) {
    const categoryIndex = categories.value.findIndex(cat => cat.id === id)
    if (categoryIndex !== -1) {
      categories.value[categoryIndex] = {
        ...categories.value[categoryIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveCategories()
    }
  }
  
  function deleteCategory(id: string) {
    // 默认分类不能删除
    if (id === 'category-text' || id === 'category-image') {
      return false
    }
    
    // 从分类列表中删除
    categories.value = categories.value.filter(cat => cat.id !== id)
    
    // 从所有便签中移除此分类ID
    notes.value.forEach(note => {
      if (note.categoryIds.includes(id)) {
        note.categoryIds = note.categoryIds.filter(catId => catId !== id)
      }
    })
    
    saveCategories()
    saveNotes()
    return true
  }
  
  function addNoteToCategory(noteId: string, categoryId: string) {
    const note = notes.value.find(note => note.id === noteId)
    if (note && !note.categoryIds.includes(categoryId)) {
      note.categoryIds.push(categoryId)
      note.updatedAt = new Date().toISOString()
      saveNotes()
    }
  }
  
  function removeNoteFromCategory(noteId: string, categoryId: string) {
    const note = notes.value.find(note => note.id === noteId)
    if (note && note.categoryIds.includes(categoryId)) {
      // 确保至少保留一个分类
      if (note.categoryIds.length > 1) {
        note.categoryIds = note.categoryIds.filter(id => id !== categoryId)
        note.updatedAt = new Date().toISOString()
        saveNotes()
      }
    }
  }
  
  function setActiveCategory(categoryId: string | null) {
    activeCategoryId.value = categoryId
  }
  
  function loadNotes() {
    try {
      // 加载便签
      const savedNotes = localStorage.getItem('sci-fi-notes')
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes) as Note[]
        
        notes.value = parsedNotes.map((note: any) => ({
          ...note,
          status: note.status || 'active',
          categoryIds: note.categoryIds || ['category-text'],
        }))
      }
      
      // 加载分类
      const savedCategories = localStorage.getItem('sci-fi-categories')
      if (savedCategories) {
        categories.value = JSON.parse(savedCategories) as Category[]
      } else {
        initDefaultCategories()
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      initDefaultCategories()
    }
  }
  
  function saveNotes() {
    try {
      localStorage.setItem('sci-fi-notes', JSON.stringify(notes.value))
    } catch (error) {
      console.error('保存便签失败:', error)
    }
  }
  
  function saveCategories() {
    try {
      localStorage.setItem('sci-fi-categories', JSON.stringify(categories.value))
    } catch (error) {
      console.error('保存分类失败:', error)
    }
  }

  return {
    // 状态
    notes,
    categories,
    activeNoteId,
    activeCategoryId,
    searchQuery,
    currentView,
    // 计算属性
    sortedNotes,
    filteredNotes,
    notesCount,
    categoriesWithCount,
    // 便签操作
    getNote,
    addNote,
    updateNote,
    deleteNote,
    permanentlyDeleteNote,
    archiveNote,
    restoreNote,
    emptyRecycleBin,
    setCurrentView,
    setActiveNote,
    togglePinNote,
    setSearchQuery,
    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    addNoteToCategory,
    removeNoteFromCategory,
    setActiveCategory,
    // 数据
    loadNotes,
    saveNotes,
    saveCategories
  }
}) 