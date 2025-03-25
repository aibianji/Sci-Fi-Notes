import { invoke } from '@tauri-apps/api/tauri';
import { readTextFile, writeTextFile, createDir, BaseDirectory } from '@tauri-apps/api/fs';

// Types
export interface Note {
  id: string;
  content: string;
  timestamp: Date;
  x: number;
  y: number;
  bgColor: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  opacity: number;
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface AppSettings {
  compactMode: boolean;
}

// Constants
const APP_DIR = 'nexus-notes';
const NOTES_FILE = 'notes.json';
const CATEGORIES_FILE = 'categories.json';
const SETTINGS_FILE = 'settings.json';

// Ensure app directory exists
export async function ensureAppDir(): Promise<void> {
  try {
    await createDir(APP_DIR, { dir: BaseDirectory.AppData, recursive: true });
  } catch (error) {
    console.error('Failed to create app directory:', error);
  }
}

// Save notes to file
export async function saveNotes(notes: Note[]): Promise<void> {
  try {
    await ensureAppDir();
    // Convert Date objects to strings for serialization
    const serializedNotes = notes.map(note => ({
      ...note,
      timestamp: note.timestamp.toISOString()
    }));
    await writeTextFile(
      `${APP_DIR}/${NOTES_FILE}`,
      JSON.stringify(serializedNotes, null, 2),
      { dir: BaseDirectory.AppData }
    );
  } catch (error) {
    console.error('Failed to save notes:', error);
    // Fallback to localStorage if Tauri API fails
    localStorage.setItem('sci-fi-notes', JSON.stringify(notes));
  }
}

// Load notes from file
export async function loadNotes(): Promise<Note[]> {
  try {
    await ensureAppDir();
    const content = await readTextFile(`${APP_DIR}/${NOTES_FILE}`, { dir: BaseDirectory.AppData });
    const parsedNotes = JSON.parse(content);
    // Convert string dates back to Date objects
    return parsedNotes.map((note: any) => ({
      ...note,
      timestamp: new Date(note.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load notes:', error);
    // Fallback to localStorage if Tauri API fails
    const savedNotes = localStorage.getItem('sci-fi-notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        return parsedNotes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp)
        }));
      } catch (e) {
        console.error('Failed to parse saved notes from localStorage', e);
        return [];
      }
    }
    return [];
  }
}

// Save categories to file
export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await ensureAppDir();
    await writeTextFile(
      `${APP_DIR}/${CATEGORIES_FILE}`,
      JSON.stringify(categories, null, 2),
      { dir: BaseDirectory.AppData }
    );
  } catch (error) {
    console.error('Failed to save categories:', error);
    // Fallback to localStorage if Tauri API fails
    localStorage.setItem('sci-fi-notes-categories', JSON.stringify(categories));
  }
}

// Load categories from file
export async function loadCategories(): Promise<Category[]> {
  try {
    await ensureAppDir();
    const content = await readTextFile(`${APP_DIR}/${CATEGORIES_FILE}`, { dir: BaseDirectory.AppData });
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load categories:', error);
    // Fallback to localStorage if Tauri API fails
    const savedCategories = localStorage.getItem('sci-fi-notes-categories');
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories);
      } catch (e) {
        console.error('Failed to parse saved categories from localStorage', e);
        return [];
      }
    }
    return [];
  }
}

// Save app settings to file
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await ensureAppDir();
    await writeTextFile(
      `${APP_DIR}/${SETTINGS_FILE}`,
      JSON.stringify(settings, null, 2),
      { dir: BaseDirectory.AppData }
    );
  } catch (error) {
    console.error('Failed to save settings:', error);
    // Fallback to localStorage if Tauri API fails
    localStorage.setItem('sci-fi-notes-settings', JSON.stringify(settings));
  }
}

// Load app settings from file
export async function loadSettings(): Promise<AppSettings> {
  try {
    await ensureAppDir();
    const content = await readTextFile(`${APP_DIR}/${SETTINGS_FILE}`, { dir: BaseDirectory.AppData });
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Fallback to localStorage if Tauri API fails
    const savedSettings = localStorage.getItem('sci-fi-notes-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings from localStorage', e);
        return { compactMode: false };
      }
    }
    return { compactMode: false };
  }
}

