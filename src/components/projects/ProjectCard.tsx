'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: any;
  columnWidths: Record<string, number>;
  getProjectStatus: (project: any) => string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  toLocalDateString: (date: string | null) => string;
  isAdmin: boolean;
  urgingProjectId: number | null;
  onUrge: (projectId: number) => void;
}

export function ProjectCard({
  project,
  columnWidths,
  getProjectStatus,
  statusColors,
  statusLabels,
  toLocalDateString,
  isAdmin,
  urgingProjectId,
  onUrge,
}: ProjectCardProps) {
  const router = useRouter();
  const projectStatus = getProjectStatus(project);

  return (
    <div 
      className="flex py-3 px-4 hover:bg-accent/30 transition-colors border-b border-border/50 items-center"
    >
      <div className="min-w-0" style={{ width: `${columnWidths.name}%` }}>
        <span 
          className="font-medium text-sm truncate cursor-pointer hover:text-blue-600 block"
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
        >
          {project.name}
        </span>
      </div>
      
      <div style={{ width: `${columnWidths.type}%` }}>
        {project.project_type_name ? (
          <Badge variant="outline" className="text-xs">{project.project_type_name}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>
      
      <div style={{ width: `${columnWidths.module}%` }}>
        {project.module_name ? (
          <span className="text-xs truncate block" title={project.module_name}>{project.module_name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>
      
      <div style={{ width: `${columnWidths.priority}%` }}>
        <Badge className={cn(
          "text-xs",
          Number(project.priority) === 1 ? 'bg-red-500' : 
          Number(project.priority) === 2 ? 'bg-orange-500' : 'bg-gray-500'
        )}>
          {Number(project.priority) === 1 ? '高' : Number(project.priority) === 2 ? '中' : '低'}
        </Badge>
      </div>
      
      <div className="min-w-0" style={{ width: `${columnWidths.manager}%` }}>
        <span className="text-xs truncate block" title={project.manager_name || '-'}>
          {project.manager_name || '-'}
        </span>
      </div>
      
      <div style={{ width: `${columnWidths.endDate}%` }}>
        <span className="text-xs">{toLocalDateString(project.end_date) || '-'}</span>
      </div>
      
      <div className="flex items-center gap-1" style={{ width: `${columnWidths.progress}%` }}>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full",
              projectStatus === 'completed' ? 'bg-green-500' : 
              projectStatus === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
            )}
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-8">{project.progress || 0}%</span>
      </div>
      
      <div style={{ width: `${columnWidths.status}%` }}>
        <Badge className={cn("text-xs", statusColors[projectStatus] || 'bg-gray-500')}>
          {statusLabels[projectStatus] || '?'}
        </Badge>
      </div>
      
      <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()} style={{ width: `${columnWidths.action}%` }}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
          className="text-xs h-6 px-1.5"
        >
          详情
        </Button>
        {isAdmin && ['planning', 'in_progress', 'overdue'].includes(projectStatus) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUrge(project.id)}
            disabled={urgingProjectId === project.id}
            className="text-xs h-6 px-1.5 text-red-600 border-red-200 hover:bg-red-50"
          >
            {urgingProjectId === project.id ? '...' : '催一下'}
          </Button>
        )}
      </div>
    </div>
  );
}