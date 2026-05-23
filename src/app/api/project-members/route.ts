import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取项目成员
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ success: false, message: '请提供项目ID' }, { status: 400 });
    }

    const members = await query(`
      SELECT pm.*, u.username, u.real_name, u.email
      FROM "SYSDBA"."project_members" pm
      LEFT JOIN "SYSDBA"."users" u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.created_at DESC
    `, [projectId]);

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}

// 添加项目成员
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, userId, role } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ success: false, message: '项目ID和用户ID不能为空' }, { status: 400 });
    }

    // 检查是否已存在
    const existing = await query(`
      SELECT * FROM "SYSDBA"."project_members" 
      WHERE project_id = ? AND user_id = ?
    `, [projectId, userId]);

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: '该成员已在项目中' }, { status: 400 });
    }

    await execute(`
      INSERT INTO "SYSDBA"."project_members" ("project_id", "user_id", "role")
      VALUES (?, ?, ?)
    `, [projectId, userId, role || 'member']);

    return NextResponse.json({ success: true, message: '添加成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '添加失败' }, { status: 500 });
  }
}

// 移除项目成员
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: '成员ID不能为空' }, { status: 400 });
    }

    await execute(`DELETE FROM "SYSDBA"."project_members" WHERE "id" = ?`, [id]);

    return NextResponse.json({ success: true, message: '移除成功' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '移除失败' }, { status: 500 });
  }
}
