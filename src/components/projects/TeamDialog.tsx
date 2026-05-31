'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores';

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  members: any[];
  loading: boolean;
  newMember: { userId: string; role: string };
  onNewMemberChange: (member: { userId: string; role: string }) => void;
  onAddMember: () => void;
  onRemoveMember: (id: number) => void;
  adding: boolean;
  isAdmin: boolean;
}

export function TeamDialog({
  open,
  onOpenChange,
  project,
  members,
  loading,
  newMember,
  onNewMemberChange,
  onAddMember,
  onRemoveMember,
  adding,
  isAdmin,
}: TeamDialogProps) {
  const { users } = useProjectStore();

  const availableUsers = users.filter(
    u => u.username !== 'admin' && !members.some(m => m.user_id === u.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>团队成员管理</DialogTitle>
          <DialogDescription>
            任务：{project?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex gap-2">
              <Select 
                value={newMember.userId} 
                onValueChange={v => onNewMemberChange({ ...newMember, userId: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.real_name || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={newMember.role} 
                onValueChange={v => onNewMemberChange({ ...newMember, role: v })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">成员</SelectItem>
                  <SelectItem value="leader">负责人</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={onAddMember} 
                disabled={adding || !newMember.userId}
              >
                添加
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">暂无团队成员</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 border rounded-md">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                    {(member.real_name || member.username || '?').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.real_name || member.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === 'leader' ? '负责人' : '成员'}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveMember(member.id)} 
                      className="text-red-500"
                    >
                      移除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}