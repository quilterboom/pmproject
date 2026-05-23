import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取所有权限
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // permissions, roles, user-roles
    const userId = searchParams.get('user_id');

    // 获取所有权限
    if (type === 'permissions') {
      const permissions = await query(`
        SELECT * FROM "SYSDBA"."permissions" ORDER BY "category", "code"
      `);
      return NextResponse.json({ success: true, data: permissions });
    }

    // 获取所有角色
    if (type === 'roles') {
      const roles = await query(`
        SELECT * FROM "SYSDBA"."roles" ORDER BY "id"
      `);
      
      // 获取每个角色的权限
      for (const role of roles) {
        const perms = await query(`
          SELECT p.* FROM "SYSDBA"."permissions" p
          JOIN "SYSDBA"."role_permissions" rp ON p."id" = rp."permission_id"
          WHERE rp."role_id" = ?
        `, [role.id]);
        role.permissions = perms;
      }
      
      return NextResponse.json({ success: true, data: roles });
    }

    // 获取用户的角色和权限
    if (type === 'user-roles' && userId) {
      const userRoles = await query(`
        SELECT r.* FROM "SYSDBA"."roles" r
        JOIN "SYSDBA"."user_roles" ur ON r."id" = ur."role_id"
        WHERE ur."user_id" = ?
      `, [userId]);

      // 获取所有权限
      const allPerms = await query(`
        SELECT * FROM "SYSDBA"."permissions" ORDER BY "category", "code"
      `);
      
      // 获取用户已有的权限
      const userPerms = await query(`
        SELECT DISTINCT p.* FROM "SYSDBA"."permissions" p
        JOIN "SYSDBA"."role_permissions" rp ON p."id" = rp."permission_id"
        JOIN "SYSDBA"."user_roles" ur ON rp."role_id" = ur."role_id"
        WHERE ur."user_id" = ?
      `, [userId]);

      return NextResponse.json({ 
        success: true, 
        data: { 
          roles: userRoles, 
          permissions: allPerms,
          userPermissions: userPerms 
        } 
      });
    }

    // 默认返回所有权限分类
    const categories = await query(`
      SELECT DISTINCT "category" FROM "SYSDBA"."permissions" ORDER BY "category"
    `);
    
    const permissions = await query(`
      SELECT * FROM "SYSDBA"."permissions" ORDER BY "category", "code"
    `);

    return NextResponse.json({ success: true, data: { categories, permissions } });

  } catch (error) {
    console.error('获取权限失败:', error);
    return NextResponse.json({ success: false, message: '获取权限失败' }, { status: 500 });
  }
}

// 更新角色权限
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { roleId, permissionIds, action } = body;

    if (action === 'updatePermissions') {
      // 先删除该角色的所有权限
      await execute(`DELETE FROM "SYSDBA"."role_permissions" WHERE "role_id" = ?`, [roleId]);
      
      // 重新插入权限
      for (const permId of permissionIds) {
        await execute(
          `INSERT INTO "SYSDBA"."role_permissions" ("role_id", "permission_id") VALUES (?, ?)`,
          [roleId, permId]
        );
      }
      
      return NextResponse.json({ success: true, message: '权限更新成功' });
    }

    return NextResponse.json({ success: false, message: '无效操作' }, { status: 400 });

  } catch (error) {
    console.error('更新权限失败:', error);
    return NextResponse.json({ success: false, message: '更新权限失败' }, { status: 500 });
  }
}

// 用户角色分配
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, roleId, action } = body;

    if (action === 'assignRole') {
      // 检查是否已有该角色
      const existing = await queryOne(
        `SELECT * FROM "SYSDBA"."user_roles" WHERE "user_id" = ? AND "role_id" = ?`,
        [userId, roleId]
      );
      
      if (!existing) {
        await execute(
          `INSERT INTO "SYSDBA"."user_roles" ("user_id", "role_id") VALUES (?, ?)`,
          [userId, roleId]
        );
      }
      
      return NextResponse.json({ success: true, message: '角色分配成功' });
    }

    if (action === 'removeRole') {
      await execute(
        `DELETE FROM "SYSDBA"."user_roles" WHERE "user_id" = ? AND "role_id" = ?`,
        [userId, roleId]
      );
      
      return NextResponse.json({ success: true, message: '角色移除成功' });
    }

    return NextResponse.json({ success: false, message: '无效操作' }, { status: 400 });

  } catch (error) {
    console.error('分配角色失败:', error);
    return NextResponse.json({ success: false, message: '分配角色失败' }, { status: 500 });
  }
}
