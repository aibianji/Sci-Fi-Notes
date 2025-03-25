import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';
import { sendDesktopNotification } from './windows-service';

// 检查更新
export async function checkForUpdates(silent: boolean = false): Promise<boolean> {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();
    
    if (shouldUpdate) {
      if (!silent) {
        sendDesktopNotification(
          '发现新版本', 
          `发现新版本 ${manifest?.version}，点击更新按钮进行更新。`
        );
      }
      return true;
    }
    
    if (!silent) {
      sendDesktopNotification('已是最新版本', '您正在使用最新版本的应用。');
    }
    return false;
  } catch (error) {
    console.error('检查更新失败:', error);
    if (!silent) {
      sendDesktopNotification('检查更新失败', '无法检查更新，请检查网络连接。');
    }
    return false;
  }
}

// 安装更新
export async function installAppUpdate(): Promise<void> {
  try {
    // 显示更新中通知
    sendDesktopNotification('更新中', '正在下载并安装更新，请稍候...');
    
    // 安装更新
    await installUpdate();
    
    // 重启应用
    sendDesktopNotification('更新完成', '更新已完成，应用将重新启动。');
    await relaunch();
  } catch (error) {
    console.error('安装更新失败:', error);
    sendDesktopNotification('更新失败', '安装更新失败，请稍后再试。');
  }
}

// 自动检查更新（应用启动时和定时检查）
export function setupAutoUpdater(): void {
  // 应用启动后延迟检查更新（静默模式）
  setTimeout(() => {
    checkForUpdates(true);
  }, 5000);
  
  // 每天检查一次更新
  setInterval(() => {
    checkForUpdates(true);
  }, 24 * 60 * 60 * 1000);
}

