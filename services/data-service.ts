import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import { Note, Category } from './storage-service';

// Types
interface ExportData {
  notes: Note[];
  categories: Category[];
  version: string;
  exportDate: string;
}

// Export data to JSON file
export async function exportData(notes: Note[], categories: Category[]): Promise<boolean> {
  try {
    // Prepare export data
    const exportData: ExportData = {
      notes,
      categories,
      version: '1.0.0',
      exportDate: new Date().toISOString()
    };
    
    // Convert Date objects to strings for serialization
    const serializedData = {
      ...exportData,
      notes: notes.map(note => ({
        ...note,
        timestamp: note.timestamp.toISOString()
      }))
    };
    
    // Ask user where to save the file
    const filePath = await save({
      filters: [{
        name: 'Nexus Notes Backup',
        extensions: ['json']
      }],
      defaultPath: `nexus-notes-backup-${new Date().toISOString().slice(0, 10)}.json`
    });
    
    if (!filePath) return false; // User cancelled
    
    // Write data to file
    await writeTextFile(filePath, JSON.stringify(serializedData, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to export data:', error);
    return false;
  }
}

// Import data from JSON file
export async function importData(): Promise<{ notes: Note[], categories: Category[] } | null> {
  try {
    // Ask user to select a file
    const selected = await open({
      filters: [{
        name: 'Nexus Notes Backup',
        extensions: ['json']
      }]
    });
    
    if (!selected) return null; // User cancelled
    
    // Read file content
    const content = await readTextFile(selected as string);
    const importedData = JSON.parse(content) as ExportData;
    
    // Validate data format
    if (!importedData.notes || !importedData.categories || !importedData.version) {
      throw new Error('Invalid backup file format');
    }
    
    // Convert string dates back to Date objects
    const notes = importedData.notes.map(note => ({
      ...note,
      timestamp: new Date(note.timestamp)
    }));
    
    return {
      notes,
      categories: importedData.categories
    };
  } catch (error) {
    console.error('Failed to import data:', error);
    return null;
  }
}

