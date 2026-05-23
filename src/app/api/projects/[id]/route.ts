import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取单个项目详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await queryOne<any>(`
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
      WHERE p.id = ?
    `, [id]);

    if (!project) {
      return NextResponse.json({
        success: false,
        message: '任务不存在'
      }, { status: 404 });
    }

    // 获取里程碑
    const milestones = await query<any>(
      'SELECT * FROM "SYSDBA"."milestones" WHERE "project_id" = ? ORDER BY due_date ASC',
      [id]
    );

    // 获取任务
    const tasks = await query<any>(
      'SELECT * FROM "SYSDBA"."tasks" WHERE "project_id" = ? ORDER BY created_at DESC',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        milestones,
        tasks
      }
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取项目详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新项目
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      goal,
      current_progress,
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

    // 检查项目是否存在
    // 使用 TO_CHAR 转换日期字段为字符串，避免时区问题
    const existingProject = await queryOne<any>(
      `SELECT "id", "name", "description", "department_id", "office_id", "module_id",
              "progress", "status", "priority", "budget", 
              TO_CHAR("start_date", 'YYYY-MM-DD') as "start_date",
              TO_CHAR("end_date", 'YYYY-MM-DD') as "end_date",
              "manager_name", "manager_phone", "created_at", "updated_at",
              "goal", "current_progress"
       FROM "SYSDBA"."projects" WHERE "id" = ?`,
      [id]
    );

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        message: '任务不存在'
      }, { status: 404 });
    }

    // 根据进度自动计算状态
    let computedStatus = existingProject.status;
    if (progress !== undefined) {
      if (progress === 0) {
        computedStatus = 'planning';
      } else if (progress === 100) {
        computedStatus = 'completed';
      } else if (status === 'planning' || status === 'in_progress') {
        computedStatus = 'in_progress';
      }
    }

    // 更新项目
    // 对于日期字段，直接使用字符串值（GET 已返回 YYYY-MM-DD 格式）
    const startDateValue = startDate ? startDate : (existingProject.start_date || null);
    const endDateValue = endDate ? endDate : (existingProject.end_date || null);
    
    const result = await execute(`
      UPDATE "SYSDBA"."projects" SET
        name = ?,
        description = ?,
        goal = ?,
        current_progress = ?,
        department_id = ?,
        office_id = ?,
        module_id = ?,
        priority = ?,
        budget = ?,
        start_date = TO_DATE(?, 'YYYY-MM-DD'),
        end_date = TO_DATE(?, 'YYYY-MM-DD'),
        manager_name = ?,
        manager_phone = ?,
        status = ?,
        progress = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || existingProject.name,
      description !== undefined ? description : existingProject.description,
      goal !== undefined ? goal : existingProject.goal,
      current_progress !== undefined ? current_progress : existingProject.current_progress,
      departmentId !== undefined ? departmentId : existingProject.department_id,
      officeId !== undefined ? officeId : existingProject.office_id,
      moduleId !== undefined ? moduleId : existingProject.module_id,
      priority || existingProject.priority,
      budget !== undefined ? budget : existingProject.budget,
      startDateValue,
      endDateValue,
      managerName || existingProject.manager_name,
      managerPhone || existingProject.manager_phone,
      status || computedStatus,
      progress !== undefined ? progress : existingProject.progress,
      id
    ]);

    // 记录操作日志
    const changes: string[] = [];
    if (name && name !== existingProject.name) changes.push(`名称: ${existingProject.name} → ${name}`);
    if (description !== undefined && description !== existingProject.description) changes.push(`描述已更新`);
    if (goal !== undefined && goal !== existingProject.goal) changes.push(`目标已更新`);
    if (current_progress !== undefined && current_progress !== existingProject.current_progress) changes.push(`进展: ${existingProject.current_progress || '无'} → ${current_progress || '无'}`);
    if (progress !== undefined && progress !== existingProject.progress) changes.push(`进度: ${existingProject.progress}% → ${progress}%`);
    if (managerName && managerName !== existingProject.manager_name) changes.push(`负责人: ${existingProject.manager_name || '无'} → ${managerName}`);
    if (status || computedStatus !== existingProject.status) changes.push(`状态: ${existingProject.status} → ${status || computedStatus}`);
    const oldEndDate = existingProject.end_date || '';
    if (endDate && endDate !== oldEndDate) {
      changes.push(`预计完成时间: ${oldEndDate || '无'} → ${endDate}`);
    }
    
    if (changes.length > 0) {
      await execute(`
        INSERT INTO "SYSDBA"."project_logs" ("project_id", "operator_id", "action", "details")
        VALUES (?, ?, ?, ?)
      `, [id, user.id, '更新任务', changes.join('; ')]);
    }

    return NextResponse.json({
      success: true,
      message: '任务更新成功'
    });

  } catch (error) {
    console.error('更新任务失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新任务失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 检查项目是否存在
    const existingProject = await queryOne<any>(
      'SELECT * FROM "SYSDBA"."projects" WHERE "id" = ?',
      [id]
    );

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        message: '任务不存在'
      }, { status: 404 });
    }

    // 删除关联数据
    await execute('DELETE FROM "SYSDBA"."project_members" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."milestones" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."project_logs" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."tasks" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."documents" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."risks" WHERE "project_id" = ?', [id]);
    await execute('DELETE FROM "SYSDBA"."costs" WHERE "project_id" = ?', [id]);

    // 删除项目
    await execute('DELETE FROM "SYSDBA"."projects" WHERE "id" = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '任务删除成功'
    });

  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除项目失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
