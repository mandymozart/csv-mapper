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
 * Export profile as JSON file
 */
export function exportProfile(profile: Profile): void {
  const dataStr = JSON.stringify(profile, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `${profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_profile.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import profile from JSON file
 */
export function importProfile(file: File): Promise<Profile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const profileData = JSON.parse(e.target?.result as string);
        
        // Validate profile structure
        if (!profileData.id || !profileData.name) {
          throw new Error('Invalid profile format');
        }
        
        // Update timestamps
        profileData.updatedAt = new Date().toISOString();
        
        resolve(profileData as Profile);
      } catch (error) {
        reject(new Error('Failed to parse profile file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
