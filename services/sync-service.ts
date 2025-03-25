import { ref } from 'vue';
import { Note, Category } from './storage-service';
import { Reminder } from './reminder-service';
import { sendDesktopNotification } from './windows-service';

// 同步配置
export interface SyncConfig {
  enabled: boolean;
  provider: 'dropbox' | 'google-drive' | 'onedrive' | 'webdav' | 'custom';
  autoSync: boolean;
  syncInterval: number; // 分钟
  lastSyncTime: Date | null;
  syncOnStartup: boolean;
  syncOnChange: boolean;
  customEndpoint: string;
  username: string;
  password: string;
  token: string;
}

// 同步状态
export interface SyncStatus {
  syncing: boolean;
  lastSyncTime: Date | null;
  lastSyncResult: 'success' | 'error' | 'conflict' | null;
  errorMessage: string | null;
  progress: number;
}

// 默认配置
export const defaultSyncConfig: SyncConfig = {
  enabled: false,
  provider: 'dropbox',
  autoSync: true,
  syncInterval: 30,
  lastSyncTime: null,
  syncOnStartup: true,
  syncOnChange: true,
  customEndpoint: '',
  username: '',
  password: '',
  token: ''
};

// 当前配置
export const syncConfig = ref<SyncConfig>({ ...defaultSyncConfig });

// 同步状态
export const syncStatus = ref<SyncStatus>({
  syncing: false,
  lastSyncTime: null,
  lastSyncResult: null,
  errorMessage: null,
  progress: 0
});

// 加载配置
export function loadSyncConfig(): void {
  const savedConfig = localStorage.getItem('sci-fi-notes-sync');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      syncConfig.value = { 
        ...defaultSyncConfig, 
        ...parsed,
        lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null
      };
    } catch (e) {
      console.error('Failed to parse sync config', e);
    }
  }
}

// 保存配置
export function saveSyncConfig(): void {
  localStorage.setItem('sci-fi-notes-sync', JSON.stringify(syncConfig.value));
}

// 同步数据
export async function syncData(
  notes: Note[], 
  categories: Category[], 
  reminders: Reminder[]
): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] } | null> {
  if (!syncConfig.value.enabled) return null;
  
  syncStatus.value.syncing = true;
  syncStatus.value.progress = 0;
  syncStatus.value.errorMessage = null;
  
  try {
    // 准备数据
    const data = {
      notes,
      categories,
      reminders,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    syncStatus.value.progress = 20;
    
    // 根据提供商执行同步
    let result;
    switch (syncConfig.value.provider) {
      case 'dropbox':
        result = await syncWithDropbox(data);
        break;
      case 'google-drive':
        result = await syncWithGoogleDrive(data);
        break;
      case 'onedrive':
        result = await syncWithOneDrive(data);
        break;
      case 'webdav':
        result = await syncWithWebDAV(data);
        break;
      case 'custom':
        result = await syncWithCustomProvider(data);
        break;
      default:
        throw new Error('Unknown sync provider');
    }
    
    syncStatus.value.progress = 100;
    syncStatus.value.lastSyncTime = new Date();
    syncStatus.value.lastSyncResult = 'success';
    syncConfig.value.lastSyncTime = new Date();
    saveSyncConfig();
    
    sendDesktopNotification('同步成功', '数据已成功同步');
    
    return result;
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus.value.lastSyncResult = 'error';
    syncStatus.value.errorMessage = error instanceof Error ? error.message : '未知错误';
    
    sendDesktopNotification('同步失败', syncStatus.value.errorMessage || '同步过程中发生错误');
    
    return null;
  } finally {
    syncStatus.value.syncing = false;
  }
}

// 与 Dropbox 同步
async function syncWithDropbox(data: any): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] }> {
  syncStatus.value.progress = 40;
  
  // 模拟 Dropbox API 调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  syncStatus.value.progress = 80;
  
  // 返回相同的数据，模拟成功同步
  return {
    notes: data.notes,
    categories: data.categories,
    reminders: data.reminders
  };
}

// 与 Google Drive 同步
async function syncWithGoogleDrive(data: any): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] }> {
  syncStatus.value.progress = 40;
  
  // 模拟 Google Drive API 调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  syncStatus.value.progress = 80;
  
  // 返回相同的数据，模拟成功同步
  return {
    notes: data.notes,
    categories: data.categories,
    reminders: data.reminders
  };
}

// 与 OneDrive 同步
async function syncWithOneDrive(data: any): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] }> {
  syncStatus.value.progress = 40;
  
  // 模拟 OneDrive API 调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  syncStatus.value.progress = 80;
  
  // 返回相同的数据，模拟成功同步
  return {
    notes: data.notes,
    categories: data.categories,
    reminders: data.reminders
  };
}

// 与 WebDAV 同步
async function syncWithWebDAV(data: any): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] }> {
  syncStatus.value.progress = 40;
  
  // 模拟 WebDAV API 调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  syncStatus.value.progress = 80;
  
  // 返回相同的数据，模拟成功同步
  return {
    notes: data.notes,
    categories: data.categories,
    reminders: data.reminders
  };
}

// 与自定义提供商同步
async function syncWithCustomProvider(data: any): Promise<{ notes: Note[]; categories: Category[]; reminders: Reminder[] }> {
  syncStatus.value.progress = 40;
  
  // 模拟自定义 API 调用
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  syncStatus.value.progress = 80;
  
  // 返回相同的数据，模拟成功同步
  return {
    notes: data.notes,
    categories: data.categories,
    reminders: data.reminders
  };
}

// 设置自动同步
export function setupAutoSync(
  getNotes: () => Note[],
  getCategories: () => Category[],
  getReminders: () => Reminder[],
  setNotes: (notes: Note[]) => void,
  setCategories: (categories: Category[]) => void,
  setReminders: (reminders: Reminder[]) => void
): () => void {
  if (!syncConfig.value.enabled || !syncConfig.value.autoSync) {
    return () => {};
  }
  
  // 计算同步间隔（毫秒）
  const interval = syncConfig.value.syncInterval * 60 * 1000;
  
  // 设置定时器
  const timerId = setInterval(async () => {
    if (syncStatus.value.syncing) return;
    
    const result = await syncData(getNotes(), getCategories(), getReminders());
    if (result) {
      setNotes(result.notes);
      setCategories(result.categories);
      setReminders(result.reminders);
    }
  }, interval);
  
  // 返回清理函数
  return () => {
    clearInterval(timerId);
  };
}

