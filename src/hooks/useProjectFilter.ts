import { useState, useCallback } from 'react';

export interface ProjectFilterState {
  status: string;
  priority: string;
  keyword: string;
  module_id: string;
  project_type_id: string;
  manager_name: string;
  end_date_from?: string;
  end_date_to?: string;
}

export interface ProjectFilterOptions extends ProjectFilterState {
  page: number;
  pageSize: number;
}

export function useProjectFilter(defaultPageSize = 10) {
  const [filters, setFilters] = useState<ProjectFilterState>({
    status: '',
    priority: '',
    keyword: '',
    module_id: '',
    project_type_id: '',
    manager_name: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: defaultPageSize
  });

  const updateFilter = useCallback(<K extends keyof ProjectFilterState>(
    key: K,
    value: ProjectFilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      priority: '',
      keyword: '',
      module_id: '',
      project_type_id: '',
      manager_name: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const buildParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams();
    params.append('page', pagination.page.toString());
    params.append('page_size', pagination.pageSize.toString());
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.module_id) params.append('module_id', filters.module_id);
    if (filters.project_type_id) params.append('project_type_id', filters.project_type_id);
    if (filters.manager_name) params.append('manager_name', filters.manager_name);
    if (filters.end_date_from) params.append('end_date_from', filters.end_date_from);
    if (filters.end_date_to) params.append('end_date_to', filters.end_date_to);
    
    return params;
  }, [filters, pagination]);

  const getFilterOptions = useCallback((): ProjectFilterOptions => {
    return {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }, [filters, pagination]);

  return {
    filters,
    pagination,
    updateFilter,
    resetFilters,
    setPage,
    setPageSize,
    buildParams,
    getFilterOptions
  };
}