import { jwtConfig } from './db';
import jwt from 'jsonwebtoken';
import { query } from './dm-helper';

/**
 * 生成 JWT Token
 */
export function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(
    payload,
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn } as any
  );
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, jwtConfig.secret) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中获取用户信息
 */
export async function getUserFromToken(token: string): Promise<Record<string, unknown> | null> {
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return null;
  }

  const users = await query<Record<string, unknown>>(
    'SELECT "id", "username", "real_name", "email", "role", "status", "department_id" FROM "SYSDBA"."users" WHERE "id" = ? AND "status" = ?',
    [decoded.userId, 'active']
  );

  if (users.length === 0) return null;

  return { ...users[0], role: users[0].role || 'user', realName: users[0].real_name };
}
