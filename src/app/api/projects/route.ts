import { NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取项目列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('department_id');
    const keyword = searchParams.get('keyword');
    const priority = searchParams.get('priority');
    const managerName = searchParams.get('manager_name');

    // 获取当前用户
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未提供认证信息' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: '无效的token' }, { status: 401 });
    }

    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (departmentId) {
      whereClause += ' AND p.department_id = ?';
      params.push(departmentId);
    }

    if (priority) {
      whereClause += ' AND p.priority = ?';
      params.push(priority);
    }

    // 按负责人搜索（模糊匹配）
    if (managerName) {
      whereClause += ' AND p.manager_name LIKE ?';
      params.push(`%${managerName}%`);
    }

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 非管理员只能查看自己负责的项目（模糊匹配，支持多个负责人）
    if (currentUser.role !== 'admin') {
      whereClause += ' AND p.manager_name LIKE ?';
      params.push(`%${currentUser.realName || currentUser.username}%`);
    }

    // 查询总数
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM "SYSDBA"."projects" p ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询项目列表
    // 使用 TO_CHAR 转换日期字段为字符串，避免时区问题
    const projects = await query<any>(`
      SELECT
        p."id", p."name", p."description", p."department_id", p."office_id", p."module_id",
        p."progress", p."status", p."priority", p."budget", 
        TO_CHAR(p."start_date", 'YYYY-MM-DD') as "start_date",
        TO_CHAR(p."end_date", 'YYYY-MM-DD') as "end_date",
        p."manager_name", p."manager_phone", p."created_at", p."updated_at", p."goal", p."current_progress",
        d.name as department_name,
        o.name as office_name,
        m.name as module_name
      FROM "SYSDBA"."projects" p
      LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
      LEFT JOIN "SYSDBA"."offices" o ON p.office_id = o.id
      LEFT JOIN "SYSDBA"."modules" m ON p.module_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    return NextResponse.json({
      success: true,
      data: {
        list: projects,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取项目列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 创建项目
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '无效的认证信息'
      }, { status: 401 });
    }

    // 检查是否为管理员
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '只有管理员才能创建任务'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      departmentId,
      officeId,
      moduleId,
      priority,
      budget,
      startDate,
      endDate,
      managerName,
      managerPhone,
      status,
      progress
    } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: '项目名称不能为空'
      }, { status: 400 });
    }

    // 处理关联字段，确保空字符串转为 null，并验证关联记录是否存在
    let deptId = departmentId && departmentId > 0 ? departmentId : null;
    let offId = officeId && officeId > 0 ? officeId : null;
    let modId = moduleId && moduleId > 0 ? moduleId : null;

    // 验证 department_id 是否存在
    if (deptId) {
      const deptExists = await queryOne('SELECT id FROM "SYSDBA"."departments" WHERE id = ?', [deptId]);
      if (!deptExists) { deptId = null; console.log('department_id不存在，已转为null'); }
    }
    // 验证 office_id 是否存在
    if (offId) {
      const officeExists = await queryOne('SELECT id FROM "SYSDBA"."offices" WHERE id = ?', [offId]);
      if (!officeExists) { offId = null; console.log('office_id不存在，已转为null'); }
    }
    // 验证 module_id 是否存在
    if (modId) {
      const moduleExists = await queryOne('SELECT id FROM "SYSDBA"."modules" WHERE id = ?', [modId]);
      if (!moduleExists) { modId = null; console.log('module_id不存在，已转为null'); }
    }

    // 插入项目
    // 达梦数据库使用 UTC 时区，存储时需要将中国时区的日期转换为 UTC（日期字符串 + 'T00:00:00+08:00' 会被转换为正确日期）
    const formatDateForDB = (dateStr: string | null | undefined) => {
      if (!dateStr) return null;
      // 直接返回日期字符串，数据库会正确处理
      return dateStr;
    };
    
    console.log('插入项目参数:', { name, description, moduleId, priority, managerName });
    const result = await execute(`
      INSERT INTO "SYSDBA"."projects" (
        name, description, department_id, office_id, module_id,
        priority, budget, start_date, end_date, 
        manager_name, manager_phone, status, progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description || null,
      deptId,
      offId,
      modId,
      priority || 'medium',
      budget || null,
      formatDateForDB(startDate),
      formatDateForDB(endDate),
      managerName || null,
      managerPhone || null,
      status || 'planning',
      progress || 0
    ]);

    // 获取刚插入的项目ID - 使用 MAX(id) 因为 LAST_INSERT_ID() 在达梦数据库中可能不工作
    const newProject = await queryOne<{ id: number }>(
      'SELECT MAX(id) as id FROM "SYSDBA"."projects"'
    );

    // 如果有负责人，给负责人发送消息通知
    if (managerName && newProject?.id) {
      // 根据 manager_name 查找对应的用户
      const managerUser = await queryOne<{ id: number }>(
        'SELECT "id" FROM "SYSDBA"."users" WHERE "real_name" = ?',
        [managerName]
      );

      if (managerUser) {
        // 发送消息通知
        await execute(`
          INSERT INTO "SYSDBA"."notifications" (
            "user_id", "type", "title", "content", "project_id"
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          managerUser.id,
          'project_assigned',
          '新任务分配',
          `您被分配负责项目"${name}"，请及时查看。`,
          newProject.id
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: '任务创建成功',
      data: {
        id: newProject?.id,
        ...body
      }
    });

  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建项目失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
