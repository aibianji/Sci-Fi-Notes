<template>
  <div class="advanced-search bg-gray-800 border border-blue-700 rounded-md p-4 w-96">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🔍</span> 高级搜索
    </h3>
    
    <div class="mb-4">
      <div class="mb-3">
        <div class="flex">
          <input 
            v-model="searchOptions.query" 
            type="text"
            placeholder="搜索便签..."
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded-l p-2 text-sm focus:outline-none focus:border-blue-500"
            @keyup.enter="search"
          />
          <button 
            @click="search" 
            class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded-r border border-blue-600 text-sm"
          >
            搜索
          </button>
        </div>
      </div>
      
      <div class="mb-3">
        <div class="flex flex-wrap gap-2">
          <label class="flex items-center text-xs">
            <input 
              type="checkbox" 
              v-model="searchOptions.caseSensitive" 
              class="mr-1 accent-blue-500"
            />
            区分大小写
          </label>
          <label class="flex items-center text-xs">
            <input 
              type="checkbox" 
              v-model="searchOptions.matchWholeWord" 
              class="mr-1 accent-blue-500"
            />
            全字匹配
          </label>
          <label class="flex items-center text-xs">
            <input 
              type="checkbox" 
              v-model="searchOptions.useRegex" 
              class="mr-1 accent-blue-500"
            />
            使用正则表达式
          </label>
          <label class="flex items-center text-xs">
            <input 
              type="checkbox" 
              v-model="searchOptions.searchInCategories" 
              class="mr-1 accent-blue-500"
            />
            搜索分类
          </label>
        </div>
      </div>
      
      <div class="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-blue-400 mb-1">分类</label>
          <select 
            v-model="searchOptions.categoryFilter" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option :value="null">所有分类</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-blue-400 mb-1">优先级</label>
          <select 
            v-model="searchOptions.priorityFilter" 
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          >
            <option :value="null">所有优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">紧急</option>
          </select>
        </div>
      </div>
      
      <div class="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-blue-400 mb-1">开始日期</label>
          <input 
            v-model="fromDateString" 
            type="date"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs text-blue-400 mb-1">结束日期</label>
          <input 
            v-model="toDateString" 
            type="date"
            class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2 flex justify-between">
        <span>搜索结果 ({{ searchResults.length }})</span>
        <button 
          v-if="searchResults.length > 0" 
          @click="clearResults" 
          class="text-xs text-red-400 hover:text-red-300"
        >
          清除结果
        </button>
      </h4>
      
      <div v-if="searching" class="text-center py-4">
        <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        <p class="text-xs text-blue-400 mt-2">搜索中...</p>
      </div>
      
      <div v-else-if="searchResults.length === 0" class="text-center text-xs text-blue-400 my-4">
        {{ hasSearched ? '没有找到匹配的便签' : '输入关键词开始搜索' }}
      </div>
      
      <div v-else class="max-h-60 overflow-y-auto">
        <div 
          v-for="result in searchResults" 
          :key="result.note.id"
          class="mb-2 p-2 bg-gray-900 rounded border border-blue-900 hover:border-blue-700 cursor-pointer"
          @click="selectNote(result.note.id)"
        >
          <div class="flex justify-between items-start mb-1">
            <div class="flex items-center">
              <span 
                class="inline-block w-2 h-2 rounded-full mr-1"
                :class="getPriorityDotClass(result.note.priority)"
              ></span>
              <span v-if="result.note.categoryId" class="mr-1">
                <span 
                  class="inline-block w-2 h-2 rounded-full mr-1"
                  :style="{ backgroundColor: getCategoryColor(result.note.categoryId) }"
                ></span>
              </span>
              <span class="text-xs text-blue-300">{{ formatDate(result.note.timestamp) }}</span>
            </div>
            <span class="text-xs text-blue-400">匹配度: {{ result.score }}</span>
          </div>
          
          <div v-for="(match, index) in result.matches" :key="index" class="mb-1">
            <div v-if="match.field === 'content'" class="text-xs">
              <span class="text-blue-400">内容: </span>
              <span v-html="highlightMatch(match)"></span>
            </div>
            <div v-else-if="match.field === 'category'" class="text-xs">
              <span class="text-blue-400">分类: </span>
              <span v-html="highlightMatch(match)"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetSearch" 
        class="flex-1 mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置搜索
      </button>
      <button 
        @click="$emit('close')" 
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { 
  searchNotes, 
  SearchOptions, 
  SearchResult, 
  defaultSearchOptions,
  getMatchContext
} from '../services/search-service';
import { Note, Category } from '../services/storage-service';

export default defineComponent({
  name: 'AdvancedSearch',
  props: {
    notes: {
      type: Array as () => Note[],
      required: true
    },
    categories: {
      type: Array as () => Category[],
      required: true
    }
  },
  emits: ['close', 'select-note'],
  setup(props, { emit }) {
    const searchOptions = ref<SearchOptions>({ ...defaultSearchOptions });
    const searchResults = ref<SearchResult[]>([]);
    const searching = ref(false);
    const hasSearched = ref(false);
    
    // 日期字符串
    const fromDateString = ref('');
    const toDateString = ref('');
    
    // 监听日期字符串变化
    watch(fromDateString, (newValue) => {
      searchOptions.value.dateRange.from = newValue ? new Date(newValue) : null;
    });
    
    watch(toDateString, (newValue) => {
      searchOptions.value.dateRange.to = newValue ? new Date(newValue) : null;
    });
    
    // 执行搜索
    const search = async () => {
      searching.value = true;
      
      try {
        // 模拟搜索延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        
        searchResults.value = searchNotes(
          props.notes,
          props.categories,
          searchOptions.value
        );
        
        hasSearched.value = true;
      } finally {
        searching.value = false;
      }
    };
    
    // 重置搜索
    const resetSearch = () => {
      searchOptions.value = { ...defaultSearchOptions };
      fromDateString.value = '';
      toDateString.value = '';
      searchResults.value = [];
      hasSearched.value = false;
    };
    
    // 清除结果
    const clearResults = () => {
      searchResults.value = [];
    };
    
    // 选择便签
    const selectNote = (noteId: string) => {
      emit('select-note', noteId);
    };
    
    // 获取分类颜色
    const getCategoryColor = (categoryId: string): string => {
      const category = props.categories.find(c => c.id === categoryId);
      return category ? category.color : '#3a506b';
    };
    
    // 获取优先级点的类名
    const getPriorityDotClass = (priority: string): string => {
      switch (priority) {
        case 'low': return 'bg-blue-500';
        case 'medium': return 'bg-blue-400';
        case 'high': return 'bg-orange-400';
        case 'critical': return 'bg-red-400';
        default: return 'bg-blue-500';
      }
    };
    
    // 格式化日期
    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString();
    };
    
    // 高亮匹配
    const highlightMatch = (match: { text: string; positions: [number, number][] }): string => {
      if (match.positions.length === 0) return match.text;
      
      // 获取第一个匹配的上下文
      const context = getMatchContext(match.text, match.positions[0]);
      
      // 高亮匹配文本
      const { text, highlightStart, highlightEnd } = context;
      
      return text.substring(0, highlightStart) +
        `<span class="bg-blue-900 text-blue-100">${text.substring(highlightStart, highlightEnd)}</span>` +
        text.substring(highlightEnd);
    };
    
    return {
      searchOptions,
      searchResults,
      searching,
      hasSearched,
      fromDateString,
      toDateString,
      search,
      resetSearch,
      clearResults,
      selectNote,
      getCategoryColor,
      getPriorityDotClass,
      formatDate,
      highlightMatch
    };
  }
});
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #3a506b;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a6b8a;
}
</style>

