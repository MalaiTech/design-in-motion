
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

export interface TimeEntry {
  id: string;
  reason: string;
  hours: number;
}

export interface CostEntry {
  id: string;
  reason: string;
  amount: number;
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
  
  // Time and costs - aggregated totals
  timeSpent: number;
  costs: number;
  
  // Time and costs - individual entries with descriptions
  timeEntries?: TimeEntry[];
  costEntries?: CostEntry[];
  
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

// Helper function to calculate project-level totals from exploration loops
export const calculateProjectTotals = (project: Project): { totalHours: number; totalCosts: number } => {
  let totalHours = 0;
  let totalCosts = 0;
  
  if (project.explorationLoops && project.explorationLoops.length > 0) {
    project.explorationLoops.forEach(loop => {
      totalHours += loop.timeSpent || 0;
      totalCosts += loop.costs || 0;
    });
  }
  
  return { totalHours, totalCosts };
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const data = await AsyncStorage.getItem(PROJECTS_KEY);
    const projects = data ? JSON.parse(data) : [];
    
    // Calculate and update project-level totals for all projects
    const updatedProjects = projects.map((project: Project) => {
      const { totalHours, totalCosts } = calculateProjectTotals(project);
      return {
        ...project,
        hours: totalHours,
        costs: totalCosts,
      };
    });
    
    return updatedProjects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    const projects = await getProjects();
    
    // Calculate project-level totals before saving
    const { totalHours, totalCosts } = calculateProjectTotals(project);
    const projectWithTotals = {
      ...project,
      hours: totalHours,
      costs: totalCosts,
    };
    
    projects.push(projectWithTotals);
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
      // Calculate project-level totals before saving
      const { totalHours, totalCosts } = calculateProjectTotals(updatedProject);
      const projectWithTotals = {
        ...updatedProject,
        hours: totalHours,
        costs: totalCosts,
      };
      
      projects[index] = projectWithTotals;
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
