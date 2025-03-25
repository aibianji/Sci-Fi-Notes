import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

// Types
interface TrayCallback {
  onNewNote: () => void;
  onToggleCompactMode: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

// Listen for tray events from Rust backend
export async function initTrayListeners(callbacks: TrayCallback): Promise<void> {
  // Listen for new note request from tray
  await listen('new-note', () => {
    callbacks.onNewNote();
  });
  
  // Listen for toggle compact mode from tray
  await listen('toggle-compact', () => {
    callbacks.onToggleCompactMode();
  });
  
  // Listen for export data request from tray
  await listen('export-data', () => {
    callbacks.onExportData();
  });
  
  // Listen for import data request from tray
  await listen('import-data', () => {
    callbacks.onImportData();
  });
}

// Minimize to tray
export async function minimizeToTray(): Promise<void> {
  await appWindow.hide();
}

// Restore from tray
export async function restoreFromTray(): Promise<void> {
  await appWindow.show();
  await appWindow.setFocus();
}

