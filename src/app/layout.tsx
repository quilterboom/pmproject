import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '任务管理系统',
    template: '%s | 任务管理系统',
  },
  description:
    '任务管理系统是一个简洁高效的项目管理工具，帮助团队跟踪任务、管理项目进度。',
  keywords: [
    '扣子编程',
    'Coze Code',
    'Vibe Coding',
    'AI 编程',
    '智能体搭建',
    '工作流搭建',
    '网站搭建',
    '网站部署',
    '全栈开发',
    'AI 工程师',
  ],
  authors: [{ name: '任务管理系统团队' }],
  generator: '任务管理系统',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '任务管理系统',
    description:
      '任务管理系统是一个简洁高效的项目管理工具，帮助团队跟踪任务、管理项目进度。',
    url: 'http://129.226.220.194:5000',
    siteName: '任务管理系统',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
