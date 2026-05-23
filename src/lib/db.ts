import dm from 'dmdb';

// 达梦数据库配置
export const dbConfig = {
  host: process.env.DB_HOST || '129.226.220.194',
  port: parseInt(process.env.DB_PORT || '5236'),
  user: process.env.DB_USER || 'SYSDBA',
  password: process.env.DB_PASSWORD || 'SYSDBA000',
};

// 创建连接串
const connectionString = `dm://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}`;

// 获取单个连接
export async function getConnection() {
  return await dm.getConnection(connectionString);
}

// JWT 配置
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
