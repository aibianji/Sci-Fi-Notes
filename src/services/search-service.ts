import type { Note, Category } from "./storage-service"

// 搜索选项
export interface SearchOptions {
  query: string
  caseSensitive: boolean
  matchWholeWord: boolean
  useRegex: boolean
  searchInCategories: boolean
  categoryFilter: string | null
  priorityFilter: string | null
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

// 搜索结果
export interface SearchResult {
  note: Note
  score: number
  matches: {
    field: string
    text: string
    positions: [number, number][]
  }[]
}

// 默认搜索选项
export const defaultSearchOptions: SearchOptions = {
  query: "",
  caseSensitive: false,
  matchWholeWord: false,
  useRegex: false,
  searchInCategories: true,
  categoryFilter: null,
  priorityFilter: null,
  dateRange: {
    from: null,
    to: null,
  },
}

// 搜索便签
export function searchNotes(notes: Note[], categories: Category[], options: SearchOptions): SearchResult[] {
  if (!options.query.trim()) {
    return []
  }

  // 过滤便签
  let filteredNotes = [...notes]

  // 按分类过滤
  if (options.categoryFilter) {
    filteredNotes = filteredNotes.filter((note) => note.categoryId === options.categoryFilter)
  }

  // 按优先级过滤
  if (options.priorityFilter) {
    filteredNotes = filteredNotes.filter((note) => note.priority === options.priorityFilter)
  }

  // 按日期范围过滤
  if (options.dateRange.from) {
    filteredNotes = filteredNotes.filter((note) => new Date(note.timestamp) >= options.dateRange.from!)
  }

  if (options.dateRange.to) {
    filteredNotes = filteredNotes.filter((note) => new Date(note.timestamp) <= options.dateRange.to!)
  }

  // 准备搜索
  let searchRegex: RegExp

  try {
    if (options.useRegex) {
      searchRegex = new RegExp(options.query, options.caseSensitive ? "g" : "gi")
    } else {
      let query = options.query

      // 转义正则表达式特殊字符
      query = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

      // 全字匹配
      if (options.matchWholeWord) {
        query = `\\b${query}\\b`
      }

      searchRegex = new RegExp(query, options.caseSensitive ? "g" : "gi")
    }
  } catch (error) {
    console.error("Invalid regex:", error)
    return []
  }

  // 搜索结果
  const results: SearchResult[] = []

  // 搜索便签
  for (const note of filteredNotes) {
    const matches: SearchResult["matches"] = []
    let score = 0

    // 搜索内容
    const contentMatches = findMatches(note.content, searchRegex)
    if (contentMatches.length > 0) {
      matches.push({
        field: "content",
        text: note.content,
        positions: contentMatches,
      })

      score += contentMatches.length * 2 // 内容匹配权重更高
    }

    // 搜索分类
    if (options.searchInCategories && note.categoryId) {
      const category = categories.find((c) => c.id === note.categoryId)
      if (category) {
        const categoryMatches = findMatches(category.name, searchRegex)
        if (categoryMatches.length > 0) {
          matches.push({
            field: "category",
            text: category.name,
            positions: categoryMatches,
          })

          score += categoryMatches.length
        }
      }
    }

    // 如果有匹配，添加到结果
    if (matches.length > 0) {
      results.push({
        note,
        score,
        matches,
      })
    }
  }

  // 按匹配度排序
  return results.sort((a, b) => b.score - a.score)
}

// 查找匹配位置
function findMatches(text: string, regex: RegExp): [number, number][] {
  const matches: [number, number][] = []

  // 重置正则表达式
  regex.lastIndex = 0

  let match
  while ((match = regex.exec(text)) !== null) {
    matches.push([match.index, match.index + match[0].length])

    // 防止无限循环
    if (regex.lastIndex === match.index) {
      regex.lastIndex++
    }
  }

  return matches
}

// 获取匹配上下文
export function getMatchContext(
  text: string,
  position: [number, number],
  contextLength = 30,
): { text: string; highlightStart: number; highlightEnd: number } {
  const [start, end] = position

  // 计算上下文范围
  const contextStart = Math.max(0, start - contextLength)
  const contextEnd = Math.min(text.length, end + contextLength)

  // 调整高亮位置
  const highlightStart = start - contextStart
  const highlightEnd = end - contextStart

  // 提取上下文
  const contextText = text.substring(contextStart, contextEnd)

  return {
    text: contextText,
    highlightStart,
    highlightEnd,
  }
}

