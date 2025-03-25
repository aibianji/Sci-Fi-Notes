import { ref } from 'vue';
import { sendDesktopNotification } from './windows-service';

// AI 功能配置
export interface AIConfig {
  enabled: boolean;
  autoCategorizationEnabled: boolean;
  autoSummarizationEnabled: boolean;
  apiKey: string;
  apiEndpoint: string;
  language: string;
}

// 默认配置
export const defaultAIConfig: AIConfig = {
  enabled: false,
  autoCategorizationEnabled: false,
  autoSummarizationEnabled: false,
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  language: 'zh-CN'
};

// 当前配置
export const aiConfig = ref<AIConfig>({ ...defaultAIConfig });

// AI 处理状态
export const aiProcessing = ref(false);

// 加载配置
export function loadAIConfig(): void {
  const savedConfig = localStorage.getItem('sci-fi-notes-ai');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      aiConfig.value = { ...defaultAIConfig, ...parsed };
    } catch (e) {
      console.error('Failed to parse AI config', e);
    }
  }
}

// 保存配置
export function saveAIConfig(): void {
  localStorage.setItem('sci-fi-notes-ai', JSON.stringify(aiConfig.value));
}

// 自动分类便签
export async function autocategorizeNote(content: string, existingCategories: string[]): Promise<string | null> {
  if (!aiConfig.value.enabled || !aiConfig.value.autoCategorizationEnabled || !aiConfig.value.apiKey) {
    return null;
  }
  
  aiProcessing.value = true;
  
  try {
    const prompt = `
      以下是一个便签的内容，请根据内容将其分类到最合适的类别中。
      可选的类别有：${existingCategories.join(', ')}
      如果没有合适的类别，请回复"其他"。
      只需回复类别名称，不要有其他内容。
      
      便签内容：
      ${content}
    `;
    
    const response = await callAI(prompt);
    
    // 检查返回的类别是否在现有类别中
    const suggestedCategory = response.trim();
    if (existingCategories.includes(suggestedCategory)) {
      return suggestedCategory;
    } else if (suggestedCategory === '其他') {
      return null;
    } else {
      // 如果返回的类别不在现有类别中，尝试找到最匹配的
      const bestMatch = existingCategories.find(cat => 
        cat.toLowerCase().includes(suggestedCategory.toLowerCase()) || 
        suggestedCategory.toLowerCase().includes(cat.toLowerCase())
      );
      return bestMatch || null;
    }
  } catch (error) {
    console.error('Failed to autocategorize note:', error);
    return null;
  } finally {
    aiProcessing.value = false;
  }
}

// 自动生成便签摘要
export async function summarizeNote(content: string, maxLength: number = 50): Promise<string | null> {
  if (!aiConfig.value.enabled || !aiConfig.value.autoSummarizationEnabled || !aiConfig.value.apiKey) {
    return null;
  }
  
  if (content.length <= maxLength) {
    return content;
  }
  
  aiProcessing.value = true;
  
  try {
    const prompt = `
      请将以下便签内容概括为不超过${maxLength}个字符的简短摘要。
      保留关键信息，使摘要清晰明了。
      只需回复摘要内容，不要有其他内容。
      
      便签内容：
      ${content}
    `;
    
    const response = await callAI(prompt);
    return response.trim();
  } catch (error) {
    console.error('Failed to summarize note:', error);
    return null;
  } finally {
    aiProcessing.value = false;
  }
}

// 生成便签内容建议
export async function suggestNoteContent(prompt: string): Promise<string | null> {
  if (!aiConfig.value.enabled || !aiConfig.value.apiKey) {
    return null;
  }
  
  aiProcessing.value = true;
  
  try {
    const aiPrompt = `
      请根据以下提示生成一个便签内容。
      内容应该简洁、有用，并且格式良好。
      只需回复便签内容，不要有其他内容。
      
      提示：
      ${prompt}
    `;
    
    const response = await callAI(aiPrompt);
    return response.trim();
  } catch (error) {
    console.error('Failed to suggest note content:', error);
    return null;
  } finally {
    aiProcessing.value = false;
  }
}

// 调用 AI API
async function callAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(aiConfig.value.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.value.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that helps with note management. Respond in ${aiConfig.value.language}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI API call failed:', error);
    sendDesktopNotification('AI 处理失败', '无法连接到 AI 服务');
    throw error;
  }
}

