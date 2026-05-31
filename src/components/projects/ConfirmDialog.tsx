'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConfirmDialogProps {
  type: 'terminate' | 'pause';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  loading: boolean;
}

export function ConfirmDialog({
  type,
  open,
  onOpenChange,
  project,
  reason,
  onReasonChange,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  const isTerminate = type === 'terminate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isTerminate ? '终止任务' : '暂停任务'}</DialogTitle>
          <DialogDescription>
            您确定要{isTerminate ? '终止' : '暂停'}任务"{project?.name}"吗？
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{isTerminate ? '终止原因' : '暂停原因'} *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={`请输入${isTerminate ? '终止' : '暂停'}原因...`}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant={isTerminate ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  {isTerminate ? '终止中...' : '暂停中...'}
                </>
              ) : (
                isTerminate ? '确认终止' : '确认暂停'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}