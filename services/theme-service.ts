// Types
export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

// Default themes
export const defaultThemes: Theme[] = [
  {
    id: 'default',
    name: '深空蓝',
    colors: {
      background: '#0a0a1a',
      foreground: '#e2e8f0',
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#00b7c2',
      border: '#3a506b'
    }
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    colors: {
      background: '#0f0e17',
      foreground: '#fffffe',
      primary: '#2e1760',
      secondary: '#251a41',
      accent: '#ff8906',
      border: '#7f5af0'
    }
  },
  {
    id: 'matrix',
    name: '矩阵',
    colors: {
      background: '#0d0208',
      foreground: '#e4efe7',
      primary: '#0d1b0e',
      secondary: '#1b2921',
      accent: '#4dff00',
      border: '#265c25'
    }
  },
  {
    id: 'neon',
    name: '霓虹',
    colors: {
      background: '#10002b',
      foreground: '#e0aaff',
      primary: '#240046',
      secondary: '#3c096c',
      accent: '#ff00ff',
      border: '#5a189a'
    }
  }
];

// Apply theme to document
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  // Set CSS variables
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--border', theme.colors.border);
}

// Save theme preference
export function saveThemePreference(themeId: string): void {
  localStorage.setItem('sci-fi-notes-theme', themeId);
}

// Load theme preference
export function loadThemePreference(): string {
  return localStorage.getItem('sci-fi-notes-theme') || 'default';
}

// Get theme by ID
export function getThemeById(themeId: string): Theme {
  return defaultThemes.find(theme => theme.id === themeId) || defaultThemes[0];
}

