import { Note, Category } from './storage-service';

// 搜索选项
export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
  searchInCategories: boolean;
  categoryFilter: string | null;
  priorityFilter: string | null;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

// 搜索结果
export interface SearchResult {
  note: Note;
  matches: {
    field: 'content' | 'category';
    text: string;
    positions: [number, number][];
  }[];
  score: number;
}

// 默认搜索选项
export const defaultSearchOptions: SearchOptions = {
  query: '',
  caseSensitive: false,
  matchWholeWord: false,
  useRegex: false,
  searchInCategories: true,
  categoryFilter: null,
  priorityFilter: null,
  dateRange: {
    from: null,
    to: null
  }
};

// 执行搜索
export function searchNotes(
  notes: Note[], 
  categories: Category[], 
  options: SearchOptions
): SearchResult[] {
  if (!options.query.trim() && !options.categoryFilter && !options.priorityFilter && !options.dateRange.from && !options.dateRange.to) {
    return [];
  }
  
  // 准备搜索正则表达式
  let searchRegex: RegExp;
  try {
    if (options.useRegex) {
      searchRegex = new RegExp(options.query, options.caseSensitive ? 'g' : 'gi');
    } else {
      const escapedQuery = escapeRegExp(options.query);
      const pattern = options.matchWholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
      searchRegex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }
  } catch (error) {
    console.error('Invalid regex:', error);
    // 如果正则表达式无效，使用简单的字符串搜索
    const escapedQuery = escapeRegExp(options.query);
    searchRegex = new RegExp(escapedQuery, options.caseSensitive ? 'g' : 'gi');
  }
  
  // 过滤和排序结果
  const results: SearchResult[] = [];
  
  for (const note of notes) {
    // 应用过滤器
    if (options.categoryFilter && note.categoryId !== options.categoryFilter) {
      continue;
    }
    
    if (options.priorityFilter && note.priority !== options.priorityFilter) {
      continue;
    }
    
    if (options.dateRange.from && new Date(note.timestamp) < options.dateRange.from) {
      continue;
    }
    
    if (options.dateRange.to) {
      const endDate = new Date(options.dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      if (new Date(note.timestamp) > endDate) {
        continue;
      }
    }
    
    // 如果没有查询文本但有过滤器，添加到结果
    if (!options.query.trim()) {
      results.push({
        note,
        matches: [],
        score: 1
      });
      continue;
    }
    
    // 搜索内容
    const contentMatches: [number, number][] = [];
    let match;
    
    if (note.content) {
      // 重置正则表达式的 lastIndex
      searchRegex.lastIndex = 0;
      
      while ((match = searchRegex.exec(note.content)) !== null) {
        contentMatches.push([match.index, match.index + match[0].length]);
      }
    }
    
    // 搜索分类
    const categoryMatches: [number, number][] = [];
    if (options.searchInCategories && note.categoryId) {
      const category = categories.find(c => c.id === note.categoryId);
      if (category) {
        // 重置正则表达式的 lastIndex
        searchRegex.lastIndex = 0;
        
        while ((match = searchRegex.exec(category.name)) !== null) {
          categoryMatches.push([match.index, match.index + match[0].length]);
        }
      }
    }
    
    // 如果有匹配，添加到结果
    if (contentMatches.length > 0 || categoryMatches.length > 0) {
      const matches = [];
      
      if (contentMatches.length > 0) {
        matches.push({
          field: 'content' as const,
          text: note.content || '',
          positions: contentMatches
        });
      }
      
      if (categoryMatches.length > 0) {
        const category = categories.find(c => c.id === note.categoryId);
        if (category) {
          matches.push({
            field: 'category' as const,
            text: category.name,
            positions: categoryMatches
          });
        }
      }
      
      // 计算得分（匹配数量）
      const score = contentMatches.length * 2 + categoryMatches.length;
      
      results.push({
        note,
        matches,
        score
      });
    }
  }
  
  // 按得分排序
  return results.sort((a, b) => b.score - a.score);
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 获取匹配的上下文
export function getMatchContext(text: string, position: [number, number], contextSize: number = 30): string {
  const [start, end] = position;
  
  let contextStart = Math.max(0, start - contextSize);
  let contextEnd = Math.min(text.length, end + contextSize);
  
  // 调整上下文以避免截断单词
  if (contextStart > 0) {
    while (contextStart > 0 && !/\s/.test(text[contextStart])) {
      contextStart--;
    }
  }
  
  if (contextEnd < text.length) {
    while (contextEnd < text.length && !/\s/.test(text[contextEnd])) {
      contextEnd++;
    }
  }
  
  // 添加省略号
  const prefix = contextStart > 0 ? '...' : '';
  const suffix = contextEnd < text.length ? '...' : '';
  
  // 提取上下文
  const context = text.substring(contextStart, contextEnd);
  
  // 调整匹配位置
  const highlightStart = start - contextStart;
  const highlightEnd = end - contextStart;
  
  // 返回带有高亮的上下文
  return {
    text: prefix + context + suffix,
    highlightStart: prefix.length + highlightStart,
    highlightEnd: prefix.length + highlightEnd
  };
}

