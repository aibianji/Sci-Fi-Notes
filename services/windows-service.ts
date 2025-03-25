import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { register, unregister } from '@tauri-apps/api/globalShortcut';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

// Register global shortcut to create a new note
export async function registerGlobalShortcuts(createNoteCallback: () => void): Promise<void> {
  try {
    // Register Ctrl+Alt+N to create a new note
    await register('CommandOrControl+Alt+N', () => {
      createNoteCallback();
    });
    
    // Register Ctrl+Alt+Space to show/hide the app
    await register('CommandOrControl+Alt+Space', async () => {
      const visible = await appWindow.isVisible();
      if (visible) {
        await appWindow.hide();
      } else {
        await appWindow.show();
        await appWindow.setFocus();
      }
    });
  } catch (error) {
    console.error('Failed to register global shortcuts:', error);
  }
}

// Unregister global shortcuts when app is closing
export async function unregisterGlobalShortcuts(): Promise<void> {
  try {
    await unregister('CommandOrControl+Alt+N');
    await unregister('CommandOrControl+Alt+Space');
  } catch (error) {
    console.error('Failed to unregister global shortcuts:', error);
  }
}

// Send a desktop notification
export async function sendDesktopNotification(title: string, body: string): Promise<void> {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    
    if (permissionGranted) {
      sendNotification({ title, body });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Set app to run at Windows startup
export async function setAutoStart(enabled: boolean): Promise<void> {
  try {
    await invoke('plugin:autostart|enable', { enabled });
  } catch (error) {
    console.error('Failed to set auto start:', error);
  }
}

