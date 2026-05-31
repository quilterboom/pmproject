'use client';

interface ProjectHeaderProps {
  columnWidths: Record<string, number>;
  resizing: string | null;
  onResizeStart: (key: string, e: React.MouseEvent) => void;
}

const columnLabels: Record<string, string> = {
  name: '任务标题',
  type: '类型',
  module: '模块',
  priority: '优先级',
  manager: '负责人',
  endDate: '预期',
  progress: '进度',
  status: '状态',
  action: '操作',
};

export function ProjectHeader({ columnWidths, resizing, onResizeStart }: ProjectHeaderProps) {
  return (
    <div className="flex py-2 px-4 bg-gray-50 rounded-t-lg border-b font-medium text-xs text-muted-foreground select-none">
      {Object.entries(columnWidths).map(([key, width], index) => (
        <div 
          key={key} 
          className="relative" 
          style={{ 
            width: `${width}%`, 
            paddingRight: index < Object.keys(columnWidths).length - 1 ? '8px' : '0' 
          }}
        >
          <span className="block truncate">{columnLabels[key] || key}</span>
          {index < Object.keys(columnWidths).length - 1 && (
            <div 
              className="absolute right-0 top-0 h-full w-3 cursor-col-resize z-10"
              style={{ transform: 'translateX(4px)' }}
              onMouseDown={(e) => onResizeStart(key, e)}
            >
              <div 
                className={`h-full w-0.5 transition-colors rounded ${resizing === key ? 'bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}