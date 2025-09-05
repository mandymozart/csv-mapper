import type { Profile } from '../types';

const STORAGE_KEY = 'csv-mapper-profiles';
const CURRENT_PROFILE_KEY = 'csv-mapper-current-profile';

/**
 * Save profiles to localStorage
 */
export function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Failed to save profiles to localStorage:', error);
  }
}

/**
 * Load profiles from localStorage
 */
export function loadProfiles(): Profile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load profiles from localStorage:', error);
    return [];
  }
}

/**
 * Save current profile ID to localStorage
 */
export function saveCurrentProfileId(profileId: string | null): void {
  try {
    if (profileId) {
      localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
    } else {
      localStorage.removeItem(CURRENT_PROFILE_KEY);
    }
  } catch (error) {
    console.error('Failed to save current profile ID:', error);
  }
}

/**
 * Load current profile ID from localStorage
 */
export function loadCurrentProfileId(): string | null {
  try {
    return localStorage.getItem(CURRENT_PROFILE_KEY);
  } catch (error) {
    console.error('Failed to load current profile ID:', error);
    return null;
  }
}

/**
 * Create a new profile with default values
 */
export function createNewProfile(name: string = 'New Profile', description: string = ''): Profile {
  return {
    id: generateId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mappings: [],
    methods: []
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Export all profiles as a project file
 */
export function exportProject(profiles: Profile[], customName?: string): void {
  console.log('exportProject called with profiles:', profiles);
  const defaultName = customName || `csv-mapper-project-${new Date().toISOString().split('T')[0]}`;
  console.log('Default filename:', defaultName);
  
  // Try prompt with timeout fallback
  let fileName: string | null = null;
  try {
    fileName = prompt('Enter filename for the project export:', defaultName);
    console.log('User entered filename:', fileName);
  } catch (error) {
    console.warn('Prompt failed, using default filename:', error);
    fileName = defaultName;
  }
  
  // If prompt returns null (cancelled), use default filename
  if (fileName === null) {
    console.log('Prompt returned null, using default filename');
    fileName = defaultName;
  }
  
  // Ensure we have a filename
  if (!fileName || fileName.trim() === '') {
    fileName = defaultName;
  }
  
  // Ensure .json extension
  const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  console.log('Final filename:', finalFileName);
  
  const projectData = {
    name: 'CSV Mapper Project',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    profiles: profiles
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  console.log('About to call downloadFile with:', { finalFileName, contentLength: jsonString.length });
  downloadFile(jsonString, finalFileName, 'application/json');
}

/**
 * Import profiles from a project file
 */
export function importProject(projectData: string): { success: boolean; message: string; profileCount?: number } {
  try {
    const project = JSON.parse(projectData);
    
    if (!project.profiles || !Array.isArray(project.profiles)) {
      return { success: false, message: 'Invalid project file format' };
    }

    // Validate profile structure
    for (const profile of project.profiles) {
      if (!profile.id || !profile.name || !profile.createdAt) {
        return { success: false, message: 'Invalid profile structure in project file' };
      }
    }

    // Save the imported profiles
    saveProfiles(project.profiles);
    
    return { 
      success: true, 
      message: `Successfully imported ${project.profiles.length} profiles`,
      profileCount: project.profiles.length
    };
  } catch (error) {
    return { success: false, message: 'Failed to parse project file' };
  }
}

/**
 * Download a file with given content and filename
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
    console.log('File downloaded successfully');
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
