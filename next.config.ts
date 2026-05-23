import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 生产模式配置
  productionBrowserSourceMaps: false,
  
  // 生产模式下启用静态资源压缩
  compress: true,
  
  // 允许的开发环境域
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  
  // 静态文件缓存配置
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
