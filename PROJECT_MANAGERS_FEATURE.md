# 项目负责人多选功能说明

## 📝 功能概述

在创建项目时，可以添加多个负责人，从注册用户中选择。所有负责人都会被添加到项目成员列表中。

## 🎯 功能特性

### 1. 前端界面
- ✅ 复选框列表显示所有注册用户
- ✅ 每个用户显示姓名、用户名和所属部门
- ✅ 支持多选负责人
- ✅ 显示已选负责人的数量

### 2. 后端处理
- ✅ 接收多个负责人 ID
- ✅ 第一个负责人设为主要负责人（manager_id）
- ✅ 所有负责人添加到 project_members 表
- ✅ 项目列表显示所有负责人（用逗号分隔）

### 3. 数据存储
- **projects 表**: `manager_id` 存储第一个负责人（主要负责人）
- **project_members 表**: 存储所有负责人及其角色

## 🔧 技术实现

### 前端代码

#### 状态管理
```typescript
const [users, setUsers] = useState<any[]>([]);
const [formData, setFormData] = useState({
  // ...其他字段
  managerIds: [] as string[],  // 多个负责人 ID
});
```

#### 负责人选择函数
```typescript
const handleManagerToggle = (userId: string) => {
  setFormData((prev: any) => {
    const currentManagers = prev.managerIds || [];
    if (currentManagers.includes(userId)) {
      return {
        ...prev,
        managerIds: currentManagers.filter((id: string) => id !== userId)
      };
    } else {
      return {
        ...prev,
        managerIds: [...currentManagers, userId]
      };
    }
  });
};
```

#### UI 组件
```tsx
<div className="space-y-2">
  <Label htmlFor="managers">负责人（可多选）</Label>
  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
    {users.map((user) => (
      <div key={user.id} className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`user-${user.id}`}
          checked={(formData.managerIds || []).includes(user.id.toString())}
          onChange={() => handleManagerToggle(user.id.toString())}
        />
        <label htmlFor={`user-${user.id}`} className="flex-1 text-sm">
          {user.real_name} ({user.username})
          <Badge>{user.department_name}</Badge>
        </label>
      </div>
    ))}
  </div>
</div>
```

### 后端 API

#### 创建项目（POST /api/projects）
```typescript
const body = await request.json();
const { managerIds, ...otherFields } = body;

// 使用第一个负责人作为主要负责人
const primaryManagerId = managerIds && managerIds.length > 0 ? managerIds[0] : null;

// 创建项目
const [result] = await pool.query(`
  INSERT INTO projects (..., manager_id, ...)
  VALUES (..., ?, ...)
`, [..., primaryManagerId, ...]);

const projectId = insertResult.insertId;

// 添加所有负责人到 project_members 表
if (managerIds && managerIds.length > 0) {
  const memberValues = managerIds.map((userId: string) => [projectId, userId, 'manager']);
  await pool.query(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES ${memberValues.map(() => '(?, ?, ?)').join(', ')}
  `, memberValues.flat());
}
```

#### 查询项目（GET /api/projects）
```typescript
const [projects] = await pool.query(`
  SELECT
    p.*,
    d.name as department_name,
    o.name as office_name,
    m.name as module_name,
    (
      SELECT GROUP_CONCAT(u.real_name SEPARATOR ', ')
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = p.id AND pm.role = 'manager'
    ) as manager_names
  FROM projects p
  LEFT JOIN departments d ON p.department_id = d.id
  LEFT JOIN offices o ON p.office_id = o.id
  LEFT JOIN modules m ON p.module_id = m.id
  ORDER BY p.created_at DESC
`);
```

## 📊 数据结构

### projects 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 项目 ID |
| name | VARCHAR | 项目名称 |
| manager_id | INT | 主要负责人 ID（第一个选择的用户） |

### project_members 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 记录 ID |
| project_id | INT | 项目 ID |
| user_id | INT | 用户 ID |
| role | ENUM | 角色（manager, developer, tester 等） |

## 🎨 用户界面

### 新建项目对话框
```
┌─────────────────────────────────────┐
│ 新建项目                             │
├─────────────────────────────────────┤
│ 项目名称：[_______________]         │
│ 项目编号：[_______________]         │
│ ...其他字段...                      │
│                                     │
│ 负责人（可多选）：                   │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 测试用户1 (testuser1) [仪控部] │ │
│ │ ☑ 测试用户2 (testuser2) [仪控部] │ │
│ │ ☐ 系统管理员 (admin) [仪控部]   │ │
│ └─────────────────────────────────┘ │
│ 已选择 2 位负责人                    │
│                                     │
│ [取消] [创建]                        │
└─────────────────────────────────────┘
```

### 项目列表显示
```
┌─────────────────────────────────────┐
│ 测试项目1                           │
│ PROJ001                             │
│ [已完成] [高]                        │
│                                     │
| 这是一个测试项目                     │
│                                     │
│ 部门：仪控部                        │
│ 科室：保护科                        │
│ 负责人：测试用户1, 测试用户2        │
│ 进度：0%                            │
└─────────────────────────────────────┘
```

## ✅ 测试用例

### 测试步骤

1. **创建测试用户**
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{
    "username":"user1",
    "password":"123456",
    "realName":"张三",
    "departmentId":1,
    "officeId":1
  }' \
  http://localhost:5000/api/auth/register
```

2. **登录获取 token**
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  http://localhost:5000/api/auth/login
```

3. **创建项目（多选负责人）**
```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "name":"新项目",
    "description":"项目描述",
    "departmentId":1,
    "officeId":1,
    "moduleId":1,
    "managerIds":["1", "3", "4"],
    "startDate":"2026-04-05",
    "endDate":"2026-12-31",
    "priority":"high"
  }' \
  http://localhost:5000/api/projects
```

4. **查看项目列表**
```bash
curl -H 'Authorization: Bearer YOUR_TOKEN' \
  http://localhost:5000/api/projects
```

**预期结果**:
```json
{
  "list": [
    {
      "id": 1,
      "name": "新项目",
      "manager_id": 1,  // 第一个负责人
      "manager_names": "系统管理员, 张三, 李四"  // 所有负责人
    }
  ]
}
```

## 🔍 数据验证

### 检查项目成员表
```sql
SELECT
  p.name as project_name,
  u.real_name as manager_name,
  pm.role
FROM projects p
JOIN project_members pm ON p.id = pm.project_id
JOIN users u ON pm.user_id = u.id
WHERE p.id = 1;
```

**预期结果**:
| project_name | manager_name | role |
|--------------|--------------|------|
| 新项目 | 系统管理员 | manager |
| 新项目 | 张三 | manager |
| 新项目 | 李四 | manager |

## 📝 注意事项

1. **至少一个负责人**: 虽然可以选择 0 个负责人，但建议至少选择一个
2. **主要负责人**: 第一个选择的负责人会被设为主要负责人（manager_id）
3. **用户可见性**: 只显示活跃状态的用户
4. **部门权限**: 用户只能看到同部门的用户（根据权限配置）
5. **角色固定**: 当前所有负责人的角色都设为 'manager'

## 🚀 扩展建议

1. **角色细分**: 可以支持不同角色（项目经理、技术负责人、产品负责人等）
2. **用户筛选**: 可以按部门、科室筛选用户
3. **搜索功能**: 添加用户搜索框，快速找到用户
4. **批量添加**: 支持从其他项目复制负责人
5. **权限控制**: 只显示有权限添加的用户

## 📚 相关文件

- **前端页面**: `src/app/dashboard/projects/page.tsx`
- **后端 API**: `src/app/api/projects/route.ts`
- **数据库表**: `projects`, `project_members`

---

**功能状态**: ✅ 已完成并测试通过  
**最后更新**: 2026-04-05
