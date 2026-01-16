
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectPhase = 'Framing' | 'Exploration' | 'Pilot' | 'Delivery' | 'Finish';

export interface Artifact {
  id: string;
  type: 'image' | 'document' | 'url';
  uri: string;
  name?: string;
  caption?: string;
  isFavorite?: boolean;
}

export interface Decision {
  id: string;
  summary: string;
  rationale: string;
  artifacts: string[];
  phase?: ProjectPhase;
  timestamp: string;
}

export interface CertaintyItem {
  id: string;
  text: string;
  category: 'known' | 'assumed' | 'unknown';
}

export interface DesignSpaceItem {
  id: string;
  text: string;
}

export interface ExplorationQuestion {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface FramingDecision {
  id: string;
  summary: string;
  artifacts: string[];
  timestamp: string;
}

export interface ExploreItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface BuildItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface CheckItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface AdaptItem {
  id: string;
  text: string;
  isFavorite: boolean;
}

export interface ExplorationDecision {
  id: string;
  summary: string;
  timestamp: string;
  artifactIds?: string[];
}

export interface PhaseChangeEvent {
  id: string;
  phase: ProjectPhase;
  timestamp: string;
}

export interface ExplorationLoop {
  id: string;
  question: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  updatedDate: string;
  artifactIds: string[];
  
  // Explore section
  exploreItems: ExploreItem[];
  exploreArtifactIds: string[];
  
  // Build section
  buildItems: BuildItem[];
  buildArtifactIds: string[];
  
  // Check section
  checkItems: CheckItem[];
  checkArtifactIds: string[];
  
  // Adapt section
  adaptItems: AdaptItem[];
  adaptArtifactIds: string[];
  
  // Exploration decisions
  explorationDecisions: ExplorationDecision[];
  decisionsArtifactIds?: string[];
  
  // Next exploration questions
  nextExplorationQuestions: ExplorationQuestion[];
  
  // Time and costs
  timeSpent: number;
  costs: number;
  
  // Invoices and receipts
  invoicesArtifactIds: string[];
}

export interface Project {
  id: string;
  title: string;
  phase: ProjectPhase;
  costs: number;
  hours: number;
  updatedDate: string;
  startDate: string;
  artifacts: Artifact[];
  decisions?: Decision[];
  
  // Phase history tracking
  phaseHistory?: PhaseChangeEvent[];
  
  // Framing fields
  opportunityOrigin?: string;
  purpose?: string;
  certaintyItems?: CertaintyItem[];
  designSpaceItems?: DesignSpaceItem[];
  explorationQuestions?: ExplorationQuestion[];
  framingDecisions?: FramingDecision[];
  framingArtifactIds?: string[]; // FIXED: Track which artifacts belong to Framing
  
  // Exploration Loops
  explorationLoops?: ExplorationLoop[];
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
