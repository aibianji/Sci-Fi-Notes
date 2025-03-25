<template>
  <div class="markdown-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">📝</span> Markdown 设置
    </h3>
    
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm">启用 Markdown</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enabled" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div v-if="config.enabled" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm">语法高亮</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.syntaxHighlighting" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.syntaxHighlighting ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">自动链接</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.autoLinks" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.autoLinks ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">任务列表</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.taskLists" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.taskLists ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">表格</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.tables" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.tables ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <label class="text-sm">安全过滤</label>
          <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
            <input 
              type="checkbox" 
              v-model="config.sanitize" 
              class="sr-only"
              @change="updateConfig"
            />
            <span 
              class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
              :class="config.sanitize ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">Markdown 预览</h4>
      
      <div class="bg-gray-900 rounded p-2 text-xs">
        <div class="mb-2">
          <textarea 
            v-model="markdownExample" 
            class="w-full bg-gray-800 text-blue-100 border border-blue-800 rounded p-2 text-xs focus:outline-none focus:border-blue-500"
            rows="5"
          ></textarea>
        </div>
        
        <div class="border-t border-blue-900 pt-2">
          <h5 class="text-xs text-blue-400 mb-1">渲染结果:</h5>
          <div 
            class="markdown-preview bg-gray-800 rounded p-2 max-h-40 overflow-y-auto"
            v-html="renderedMarkdown"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">Markdown 工具栏</h4>
      
      <div class="bg-gray-900 rounded p-2 flex flex-wrap gap-1">
        <button 
          v-for="(item, index) in toolbarItems" 
          :key="index"
          @click="insertMarkdown(item.markdown)"
          class="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-blue-300 rounded border border-blue-800 text-xs"
          :title="item.title"
        >
          {{ item.icon }}
        </button>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetConfig" 
        class="flex-1 mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置设置
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
import { defineComponent, ref, computed, onMounted } from 'vue';
import { 
  defaultMarkdownConfig, 
  MarkdownConfig, 
  markdownToHtml,
  getMarkdownToolbarItems,
  loadMarkdownConfig,
  saveMarkdownConfig
} from '../services/markdown-service';

export default defineComponent({
  name: 'MarkdownSettings',
  emits: ['close', 'update:config', 'insert-markdown'],
  setup(props, { emit }) {
    const config = ref<MarkdownConfig>({ ...defaultMarkdownConfig });
    const markdownExample = ref(`# Markdown 示例
    
**粗体** 和 *斜体* 文本

- 无序列表项
- 另一个列表项

1. 有序列表
2. 第二项

> 引用文本

\`行内代码\`

[链接](https://example.com)

| 表格 | 示例 |
| ---- | ---- |
| 内容 | 内容 |

- [x] 已完成任务
- [ ] 未完成任务`);
    
    // 工具栏项
    const toolbarItems = getMarkdownToolbarItems();
    
    // 渲染的 Markdown
    const renderedMarkdown = computed(() => {
      return markdownToHtml(markdownExample.value, config.value);
    });
    
    // 更新配置
    const updateConfig = () => {
      // 保存配置到本地存储
      saveMarkdownConfig(config.value);
      
      // 通知父组件
      emit('update:config', config.value);
    };
    
    // 重置配置
    const resetConfig = () => {
      config.value = { ...defaultMarkdownConfig };
      updateConfig();
    };
    
    // 插入 Markdown
    const insertMarkdown = (markdown: string) => {
      emit('insert-markdown', markdown);
    };
    
    onMounted(() => {
      // 加载配置
      const savedConfig = loadMarkdownConfig();
      config.value = savedConfig;
    });
    
    return {
      config,
      markdownExample,
      toolbarItems,
      renderedMarkdown,
      updateConfig,
      resetConfig,
      insertMarkdown
    };
  }
});
</script>

<style scoped>
.markdown-preview :deep(h1) {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #63b3ed;
}

.markdown-preview :deep(h2) {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.4rem;
  color: #4299e1;
}

.markdown-preview :deep(h3) {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #3182ce;
}

.markdown-preview :deep(p) {
  margin-bottom: 0.5rem;
}

.markdown-preview :deep(ul), .markdown-preview :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.2rem;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid #4299e1;
  padding-left: 0.5rem;
  color: #a0aec0;
  margin: 0.5rem 0;
}

.markdown-preview :deep(code) {
  background-color: #1a202c;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-preview :deep(pre) {
  background-color: #1a202c;
  padding: 0.5rem;
  border-radius: 3px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-preview :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-preview :deep(a) {
  color: #4299e1;
  text-decoration: underline;
}

.markdown-preview :deep(hr) {
  border: 0;
  border-top: 1px solid #2d3748;
  margin: 0.5rem 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}

.markdown-preview :deep(th), .markdown-preview :deep(td) {
  border: 1px solid #2d3748;
  padding: 0.3rem;
  text-align: left;
}

.markdown-preview :deep(th) {
  background-color: #2d3748;
}

.markdown-preview :deep(.task-list-item) {
  list-style-type: none;
  margin-left: -1.5rem;
}

.markdown-preview :deep(.task-list-item input) {
  margin-right: 0.5rem;
}
</style>

