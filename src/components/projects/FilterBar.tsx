'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores';

export function FilterBar() {
  const { 
    filters, 
    setFilter, 
    resetFilters,
    projectTypes,
    modules 
  } = useProjectStore();

  const hasActiveFilters = filters.searchKeyword || 
    filters.filterStatus !== 'all' || 
    filters.filterManager !== 'all' || 
    filters.filterPriority !== 'all' || 
    filters.filterProjectType !== 'all' || 
    filters.filterModule !== 'all';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Input
          placeholder="搜索任务名称、描述、编号..."
          value={filters.searchKeyword}
          onChange={(e) => setFilter('searchKeyword', e.target.value)}
          className="w-64"
        />
        {filters.searchKeyword && (
          <button
            onClick={() => setFilter('searchKeyword', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <Select 
        value={filters.filterStatus} 
        onValueChange={(value) => setFilter('filterStatus', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="planning">规划中</SelectItem>
          <SelectItem value="in_progress">进行中</SelectItem>
          <SelectItem value="completed">已完成</SelectItem>
          <SelectItem value="on_hold">已暂停</SelectItem>
          <SelectItem value="cancelled">已终止</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <Input
          placeholder="搜索负责人..."
          value={filters.filterManager === 'all' ? '' : filters.filterManager}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              setFilter('filterManager', 'all');
            } else {
              setFilter('filterManager', value);
            }
          }}
          className="w-40"
        />
        {filters.filterManager !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setFilter('filterManager', 'all')}
          >
            ×
          </Button>
        )}
      </div>

      <Select 
        value={filters.filterPriority} 
        onValueChange={(value) => setFilter('filterPriority', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="全部优先级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部优先级</SelectItem>
          <SelectItem value="1">高优先级</SelectItem>
          <SelectItem value="2">中优先级</SelectItem>
          <SelectItem value="3">低优先级</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.filterProjectType} 
        onValueChange={(value) => setFilter('filterProjectType', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="全部类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部类型</SelectItem>
          {projectTypes.map((type) => (
            <SelectItem key={type.id} value={type.id.toString()}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={filters.filterModule} 
        onValueChange={(value) => setFilter('filterModule', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="全部模块" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部模块</SelectItem>
          {modules.map((mod) => (
            <SelectItem key={mod.id} value={mod.id.toString()}>
              {mod.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          清除过滤
        </Button>
      )}
    </div>
  );
}