import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';
import { appWindow } from '@tauri-apps/api/window';

// Types
export interface Reminder {
  id: string;
  noteId: string;
  title: string;
  time: Date;
  isActive: boolean;
}

// Store for active reminders
const activeReminders = new Map<string, NodeJS.Timeout>();

// Check if notification permissions are granted
export async function checkNotificationPermission(): Promise<boolean> {
  let permissionGranted = await isPermissionGranted();
  
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
  
  return permissionGranted;
}

// Schedule a reminder
export function scheduleReminder(reminder: Reminder, onTrigger: (reminder: Reminder) => void): void {
  if (!reminder.isActive) return;
  
  // Cancel existing reminder if any
  cancelReminder(reminder.id);
  
  // Calculate delay until reminder time
  const now = new Date();
  const reminderTime = new Date(reminder.time);
  const delay = reminderTime.getTime() - now.getTime();
  
  // Only schedule if reminder is in the future
  if (delay > 0) {
    const timerId = setTimeout(() => {
      triggerReminder(reminder);
      onTrigger(reminder);
    }, delay);
    
    activeReminders.set(reminder.id, timerId);
  }
}

// Cancel a scheduled reminder
export function cancelReminder(reminderId: string): void {
  const timerId = activeReminders.get(reminderId);
  if (timerId) {
    clearTimeout(timerId);
    activeReminders.delete(reminderId);
  }
}

// Trigger a reminder notification
async function triggerReminder(reminder: Reminder): Promise<void> {
  const permissionGranted = await checkNotificationPermission();
  
  if (permissionGranted) {
    sendNotification({
      title: '便签提醒',
      body: reminder.title,
      icon: 'icons/icon.png'
    });
    
    // Show app window if hidden
    const isVisible = await appWindow.isVisible();
    if (!isVisible) {
      await appWindow.show();
      await appWindow.setFocus();
    }
  }
}

// Schedule multiple reminders
export function scheduleReminders(reminders: Reminder[], onTrigger: (reminder: Reminder) => void): void {
  // Cancel all existing reminders
  clearAllReminders();
  
  // Schedule active reminders
  reminders
    .filter(reminder => reminder.isActive)
    .forEach(reminder => scheduleReminder(reminder, onTrigger));
}

// Clear all scheduled reminders
export function clearAllReminders(): void {
  activeReminders.forEach(timerId => clearTimeout(timerId));
  activeReminders.clear();
}

