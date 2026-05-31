'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores';

interface PaginationProps {
  typeId: string;
  onPageChange: (page: number, pageSize: number) => void;
}

export function Pagination({ typeId, onPageChange }: PaginationProps) {
  const { pagination, projectCounts, setPagination } = useProjectStore();
  
  const current = pagination[typeId] || { page: 1, pageSize: 10 };
  const total = projectCounts[typeId] || 0;
  
  const totalPages = Math.ceil(total / current.pageSize) || 1;
  const startIdx = (current.page - 1) * current.pageSize;
  const endIdx = Math.min(startIdx + current.pageSize, total);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50 rounded-b-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          显示 {total > 0 ? startIdx + 1 : 0}-{endIdx} 共 {total} 条
        </span>
        <Select 
          value={current.pageSize.toString()} 
          onValueChange={(value) => {
            const newPageSize = parseInt(value);
            setPagination(typeId, { page: 1, pageSize: newPageSize });
            onPageChange(1, newPageSize);
          }}
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10/页</SelectItem>
            <SelectItem value="20">20/页</SelectItem>
            <SelectItem value="30">30/页</SelectItem>
            <SelectItem value="40">40/页</SelectItem>
            <SelectItem value="50">50/页</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            setPagination(typeId, { ...current, page: 1 });
            onPageChange(1, current.pageSize);
          }}
          disabled={current.page <= 1}
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            const newPage = current.page - 1;
            setPagination(typeId, { ...current, page: newPage });
            onPageChange(newPage, current.pageSize);
          }}
          disabled={current.page <= 1}
        >
          ‹
        </Button>
        <span className="text-xs px-2">
          {current.page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            const newPage = current.page + 1;
            setPagination(typeId, { ...current, page: newPage });
            onPageChange(newPage, current.pageSize);
          }}
          disabled={current.page >= totalPages}
        >
          ›
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            setPagination(typeId, { ...current, page: totalPages });
            onPageChange(totalPages, current.pageSize);
          }}
          disabled={current.page >= totalPages}
        >
          »
        </Button>
      </div>
    </div>
  );
}