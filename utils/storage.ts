
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectPhase = 'Framing' | 'Exploration' | 'Pilot' | 'Delivery' | 'Finish';

export interface Project {
  id: string;
  title: string;
  phase: ProjectPhase;
  costs: number;
  hours: number;
  updatedDate: string;
  startDate: string;
  artifacts: Artifact[];
}

export interface Artifact {
  id: string;
  type: 'image' | 'document' | 'url';
  uri: string;
  name?: string;
}

const PROJECTS_KEY = '@design_in_motion_projects';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    projects.push(project);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const updateProject = async (updatedProject: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
      projects[index] = updatedProject;
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
