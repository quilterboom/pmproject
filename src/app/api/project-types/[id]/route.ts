import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 更新项目类型（仅管理员）
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

    // 只有管理员可以更新项目类型
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '只有管理员可以修改项目类型'
      }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, sortOrder, isActive } = body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return NextResponse.json({
        success: false,
        message: '项目类型名称不能为空'
      }, { status: 400 });
    }

    // 检查名称是否已被其他类型使用
    const existing = await queryOne<any>(
      'SELECT "id" FROM "SYSDBA"."project_types" WHERE "name" = ? AND "id" != ?',
      [name.trim(), id]
    );
    
    if (existing) {
      return NextResponse.json({
        success: false,
        message: '项目类型名称已存在'
      }, { status: 400 });
    }

    // 更新项目类型
    await execute(`
      UPDATE "SYSDBA"."project_types"
      SET "name" = ?, "description" = ?, "color" = ?, "sort_order" = ?, "is_active" = ?
      WHERE "id" = ?
    `, [
      name.trim(),
      description || null,
      color || '#3b82f6',
      sortOrder || 0,
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      id
    ]);

    return NextResponse.json({
      success: true,
      message: '项目类型更新成功'
    });
  } catch (error) {
    console.error('更新项目类型失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新项目类型失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除项目类型（仅管理员）
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

    // 只有管理员可以删除项目类型
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '只有管理员可以删除项目类型'
      }, { status: 403 });
    }

    const { id } = await params;

    // 删除项目类型
    await execute('DELETE FROM "SYSDBA"."project_types" WHERE "id" = ?', [id]);

    return NextResponse.json({
      success: true,
      message: '项目类型删除成功'
    });
  } catch (error) {
    console.error('删除项目类型失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除项目类型失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
