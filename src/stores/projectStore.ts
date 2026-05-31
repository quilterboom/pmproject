import { create } from 'zustand';

export interface ProjectFilter {
  searchKeyword: string;
  filterStatus: string;
  filterManager: string;
  filterPriority: string;
  filterProjectType: string;
  filterModule: string;
}

export interface ProjectPagination {
  page: number;
  pageSize: number;
}

interface ProjectState {
  filters: ProjectFilter;
  pagination: Record<string, ProjectPagination>;
  projectCounts: Record<string, number>;
  projectsByType: Record<string, any[]>;
  typeLoading: Record<string, boolean>;
  projectTypes: Array<{ id: number; name: string; color?: string }>;
  modules: Array<{ id: number; name: string }>;
  users: any[];
  
  setFilter: <K extends keyof ProjectFilter>(key: K, value: ProjectFilter[K]) => void;
  resetFilters: () => void;
  setPagination: (typeId: string, pagination: ProjectPagination) => void;
  setProjectCounts: (typeId: string, count: number) => void;
  setProjectsByType: (typeId: string, projects: any[]) => void;
  setTypeLoading: (typeId: string, loading: boolean) => void;
  setProjectTypes: (types: Array<{ id: number; name: string; color?: string }>) => void;
  setModules: (modules: Array<{ id: number; name: string }>) => void;
  setUsers: (users: any[]) => void;
}

const initialFilters: ProjectFilter = {
  searchKeyword: '',
  filterStatus: 'all',
  filterManager: 'all',
  filterPriority: 'all',
  filterProjectType: 'all',
  filterModule: 'all',
};

export const useProjectStore = create<ProjectState>((set) => ({
  filters: initialFilters,
  pagination: {},
  projectCounts: {},
  projectsByType: {},
  typeLoading: {},
  projectTypes: [],
  modules: [],
  users: [],

  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
  })),

  resetFilters: () => set({ filters: initialFilters }),

  setPagination: (typeId, pagination) => set((state) => ({
    pagination: { ...state.pagination, [typeId]: pagination },
  })),

  setProjectCounts: (typeId, count) => set((state) => ({
    projectCounts: { ...state.projectCounts, [typeId]: count },
  })),

  setProjectsByType: (typeId, projects) => set((state) => ({
    projectsByType: { ...state.projectsByType, [typeId]: projects },
  })),

  setTypeLoading: (typeId, loading) => set((state) => ({
    typeLoading: { ...state.typeLoading, [typeId]: loading },
  })),

  setProjectTypes: (types) => set({ projectTypes: types }),

  setModules: (modules) => set({ modules }),

  setUsers: (users) => set({ users }),
}));