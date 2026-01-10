
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectPhase = 'framing' | 'exploration' | 'pilot' | 'delivery' | 'finish';

export interface Project {
  id: string;
  title: string;
  description: string;
  phase: ProjectPhase;
  artifacts: string[];
  createdAt: string;
  updatedAt: string;
}

const PROJECTS_KEY = '@design_in_motion:projects';

export async function getProjects(): Promise<Project[]> {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

export async function saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
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
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
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
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}
