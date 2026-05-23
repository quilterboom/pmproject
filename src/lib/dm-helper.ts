import { getConnection } from './db';

// 将达梦数据库返回的数组结果转换为对象格式
async function rowsToObjects<T = any>(rows: any[], metaData: any[]): Promise<T[]> {
  if (!rows || rows.length === 0) return [];
  
  const result: T[] = [];
  
  for (const row of rows) {
    const obj: any = {};
    for (let index = 0; index < metaData.length; index++) {
      const col = metaData[index];
      let value = row[index];
      
      // 转换 BigInt 为普通数字
      if (typeof value === 'bigint') {
        value = Number(value);
      }
      // 处理 LOB 对象（CLOB/TEXT 类型）
      else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        // 对于 LOB 类型（达梦数据库返回的是可读流），需要异步读取内容
        if (value.type === 2017 || (value.constructor && value.constructor.name === 'DM_CLOB') || (value.iLob)) {
          try {
            const chunks = [];
            for await (const chunk of value) {
              chunks.push(chunk);
            }
            value = Buffer.concat(chunks).toString();
          } catch (e) {
            console.error('读取 LOB 内容失败:', e);
            value = null;
          }
        } else {
          // 其他对象类型，转换为 null
          value = null;
        }
      }
      // 将列名统一转为小写，解决达梦数据库返回大写列名的问题
      obj[col.name.toLowerCase()] = value;
    }
    result.push(obj as T);
  }
  
  return result;
}

// 执行查询并返回结果
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params);
    // 如果结果已经是对象数组，直接返回；否则转换为对象数组
    if (result.rows && result.rows.length > 0 && typeof result.rows[0] === 'object' && !Array.isArray(result.rows[0])) {
      return result.rows as T[];
    }
    return await rowsToObjects<T>(result.rows || [], result.metaData || []);
  } finally {
    await conn.close();
  }
}

// 执行更新/插入/删除并返回影响的行数
export async function execute(
  sql: string,
  params: any[] = []
): Promise<number> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params);
    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

// 执行查询并返回单行
export async function queryOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// 事务执行（简化版）
export async function transaction<T>(
  callback: (conn: Awaited<ReturnType<typeof getConnection>>) => Promise<T>
): Promise<T> {
  const conn = await getConnection();
  try {
    return await callback(conn);
  } finally {
    await conn.close();
  }
}
