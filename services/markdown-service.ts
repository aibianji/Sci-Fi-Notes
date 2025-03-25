import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Markdown 配置
export interface MarkdownConfig {
  enabled: boolean;
  syntaxHighlighting: boolean;
  autoLinks: boolean;
  taskLists: boolean;
  tables: boolean;
  sanitize: boolean;
}

// 默认配置
export const defaultMarkdownConfig: MarkdownConfig = {
  enabled: false,
  syntaxHighlighting: true,
  autoLinks: true,
  taskLists: true,
  tables: true,
  sanitize: true
};

// 加载配置
export function loadMarkdownConfig(): MarkdownConfig {
  const savedConfig = localStorage.getItem('sci-fi-notes-markdown');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      return { ...defaultMarkdownConfig, ...parsed };
    } catch (e) {
      console.error('Failed to parse markdown config', e);
    }
  }
  return { ...defaultMarkdownConfig };
}

// 保存配置
export function saveMarkdownConfig(config: MarkdownConfig): void {
  localStorage.setItem('sci-fi-notes-markdown', JSON.stringify(config));
}

// 配置 Marked
function configureMarked(config: MarkdownConfig): void {
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false
  });
  
  // 添加任务列表扩展
  if (config.taskLists) {
    const renderer = new marked.Renderer();
    const originalListitem = renderer.listitem;
    
    renderer.listitem = (text, task, checked) => {
      if (task) {
        return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${text}</li>`;
      }
      return originalListitem(text);
    };
    
    marked.use({ renderer });
  }
}

// 将 Markdown 转换为 HTML
export function markdownToHtml(markdown: string, config: MarkdownConfig = defaultMarkdownConfig): string {
  if (!config.enabled) {
    return escapeHtml(markdown);
  }
  
  configureMarked(config);
  
  try {
    let html = marked(markdown);
    
    // 如果启用了安全过滤
    if (config.sanitize) {
      html = DOMPurify.sanitize(html);
    }
    
    return html;
  } catch (error) {
    console.error('Failed to convert markdown to HTML:', error);
    return escapeHtml(markdown);
  }
}

// 转义 HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 检测文本是否包含 Markdown
export function containsMarkdown(text: string): boolean {
  // 检查常见的 Markdown 语法
  const markdownPatterns = [
    /^#+\s+/m,                  // 标题
    /\*\*.*?\*\*/,              // 粗体
    /\*.*?\*/,                  // 斜体
    /\[.*?\]$$.*?$$/,           // 链接
    /!\[.*?\]$$.*?$$/,          // 图片
    /^>\s+/m,                   // 引用
    /^-\s+/m,                   // 无序列表
    /^[0-9]+\.\s+/m,            // 有序列表
    /^```[\s\S]*?```/m,         // 代码块
    /`.*?`/,                    // 行内代码
    /^---+$/m,                  // 分隔线
    /\|\s*.*\s*\|/              // 表格
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

// 获取 Markdown 快捷工具栏项
export function getMarkdownToolbarItems(): { icon: string; title: string; markdown: string; }[] {
  return [
    { icon: 'H1', title: '标题 1', markdown: '# ' },
    { icon: 'H2', title: '标题 2', markdown: '## ' },
    { icon: 'B', title: '粗体', markdown: '**粗体文本**' },
    { icon: 'I', title: '斜体', markdown: '*斜体文本*' },
    { icon: '—', title: '分隔线', markdown: '\n---\n' },
    { icon: '•', title: '无序列表', markdown: '- 列表项\n- 列表项\n- 列表项\n' },
    { icon: '1.', title: '有序列表', markdown: '1. 列表项\n2. 列表项\n3. 列表项\n' },
    { icon: '✓', title: '任务列表', markdown: '- [ ] 任务\n- [ ] 任务\n- [x] 已完成任务\n' },
    { icon: '❞', title: '引用', markdown: '> 引用文本\n' },
    { icon: '⌨', title: '代码', markdown: '`代码`' },
    { icon: '≡', title: '代码块', markdown: '```\n代码块\n```' },
    { icon: '🔗', title: '链接', markdown: '[链接文本](https://example.com)' },
    { icon: '🖼', title: '图片', markdown: '![图片描述](图片URL)' },
    { icon: '📋', title: '表格', markdown: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |' }
  ];
}

