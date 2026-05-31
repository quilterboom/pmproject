'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface LogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: any[];
  loading: boolean;
  actionLabels: Record<string, string>;
  actionColors: Record<string, string>;
}

export function LogsDialog({
  open,
  onOpenChange,
  logs,
  loading,
  actionLabels,
  actionColors,
}: LogsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>任务操作记录</DialogTitle>
          <DialogDescription>查看任务的所有操作历史</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无操作记录
            </p>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={actionColors[log.action] || 'bg-gray-500'}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                    <span className="font-medium">{log.operator_name || '未知用户'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}