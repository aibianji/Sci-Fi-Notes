// 类型定义
export interface Note {
  id: string
  content: string
  timestamp: Date
  color: string
  priority: "low" | "medium" | "high" | "critical"
  categoryId: string | null
  attachments?: string[]
  tags?: string[]
}

export interface Category {
  id: string
  name: string
  color: string
}

// 本地存储服务
class StorageService {
  private readonly NOTES_KEY = "sci-fi-notes"
  private readonly CATEGORIES_KEY = "sci-fi-categories"

  // 获取所有便签
  getNotes(): Note[] {
    const notesJson = localStorage.getItem(this.NOTES_KEY)
    if (!notesJson) return []

    try {
      const notes = JSON.parse(notesJson)
      // 转换时间戳为Date对象
      return notes.map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
      }))
    } catch (error) {
      console.error("Failed to parse notes:", error)
      return []
    }
  }

  // 保存所有便签
  saveNotes(notes: Note[]): void {
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes))
  }

  // 获取所有分类
  getCategories(): Category[] {
    const categoriesJson = localStorage.getItem(this.CATEGORIES_KEY)
    if (!categoriesJson) return []

    try {
      return JSON.parse(categoriesJson)
    } catch (error) {
      console.error("Failed to parse categories:", error)
      return []
    }
  }

  // 保存所有分类
  saveCategories(categories: Category[]): void {
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories))
  }

  // 添加便签
  addNote(note: Note): Note {
    const notes = this.getNotes()
    notes.push(note)
    this.saveNotes(notes)
    return note
  }

  // 更新便签
  updateNote(updatedNote: Note): Note {
    const notes = this.getNotes()
    const index = notes.findIndex((note) => note.id === updatedNote.id)

    if (index !== -1) {
      notes[index] = updatedNote
      this.saveNotes(notes)
    }

    return updatedNote
  }

  // 删除便签
  deleteNote(noteId: string): void {
    const notes = this.getNotes()
    const filteredNotes = notes.filter((note) => note.id !== noteId)
    this.saveNotes(filteredNotes)
  }

  // 添加分类
  addCategory(category: Category): Category {
    const categories = this.getCategories()
    categories.push(category)
    this.saveCategories(categories)
    return category
  }

  // 更新分类
  updateCategory(updatedCategory: Category): Category {
    const categories = this.getCategories()
    const index = categories.findIndex((category) => category.id === updatedCategory.id)

    if (index !== -1) {
      categories[index] = updatedCategory
      this.saveCategories(categories)
    }

    return updatedCategory
  }

  // 删除分类
  deleteCategory(categoryId: string): void {
    const categories = this.getCategories()
    const filteredCategories = categories.filter((category) => category.id !== categoryId)
    this.saveCategories(filteredCategories)

    // 更新使用此分类的便签
    const notes = this.getNotes()
    const updatedNotes = notes.map((note) => {
      if (note.categoryId === categoryId) {
        return { ...note, categoryId: null }
      }
      return note
    })

    this.saveNotes(updatedNotes)
  }
}

// 导出单例
export const storageService = new StorageService()

