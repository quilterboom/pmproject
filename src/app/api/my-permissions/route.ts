import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取当前用户的权限列表
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: '无效的认证信息' }, { status: 401 });
    }

    // 获取用户的所有权限代码
    const permissions = await query(`
      SELECT DISTINCT p."code" 
      FROM "SYSDBA"."permissions" p
      JOIN "SYSDBA"."role_permissions" rp ON p."id" = rp."permission_id"
      JOIN "SYSDBA"."user_roles" ur ON rp."role_id" = ur."role_id"
      WHERE ur."user_id" = ?
    `, [user.id]);

    const permissionCodes = permissions.map((p: any) => p.CODE);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: permissionCodes
      }
    });

  } catch (error) {
    console.error('获取用户权限失败:', error);
    return NextResponse.json({ success: false, message: '获取权限失败' }, { status: 500 });
  }
}
