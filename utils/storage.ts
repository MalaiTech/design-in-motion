
import AsyncStorage from '@react-native-async-storage/async-storage';

// Project phases
export type ProjectPhase = 'Framing' | 'Exploration' | 'Pilot' | 'Delivery' | 'Finish';

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  phase: ProjectPhase;
  createdAt: string;
  updatedAt: string;
  artifacts: string[]; // Array of artifact URLs/paths (placeholder for now)
}

const PROJECTS_KEY = '@design_in_motion_projects';

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PROJECTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading projects:', e);
    return [];
  }
};

// Save a new project
export const saveProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  try {
    const projects = await getProjects();
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return newProject;
  } catch (e) {
    console.error('Error saving project:', e);
    throw e;
  }
};

// Update an existing project
export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  try {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  } catch (e) {
    console.error('Error updating project:', e);
    throw e;
  }
};

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting project:', e);
    throw e;
  }
};
