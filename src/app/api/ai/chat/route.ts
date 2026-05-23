import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

// 从模型配置获取 API 密钥
async function getModelConfig() {
  const configResult = await query(`SELECT * FROM "SYSDBA"."model_configs" WHERE is_default = 1 AND status = 'active'`);
  if (!configResult || configResult.length === 0) {
    throw new Error('未找到模型配置');
  }
  const config = configResult[0];
  return {
    base_url: config.base_url,
    api_key: config.api_key,
    model: config.model
  };
}

// 调用大模型进行整理归纳
async function callAI整理(content: string, instruction: string) {
  const modelConfig = await getModelConfig();
  const { base_url, api_key, model } = modelConfig;

  const response = await fetch(`${base_url}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个项目数据分析助手。请根据用户的指令，对提供的数据进行整理、归纳、总结。用简洁清晰的中文回复。'
        },
        {
          role: 'user',
          content: `${instruction}\n\n以下是项目数据：\n${content}`
        }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
  }
  throw new Error('AI 响应格式错误');
}

// AI 问答 API - 数据库查询 + 大模型整理归纳
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: false, message: '请输入问题' }, { status: 400 });
    }

    // 查询项目数据
    const projects = await query(`
      SELECT p.id, p.name, p.status, p.progress, p.priority, p.start_date, p.end_date, p.description,
             m.name as module_name, d.name as department_name
      FROM "SYSDBA"."projects" p
      LEFT JOIN "SYSDBA"."modules" m ON p.module_id = m.id
      LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
      ORDER BY p.id DESC LIMIT 20
    `);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ success: true, data: { content: '暂无项目' } });
    }

    // 构建原始数据文本
    const rawData = projects.map((p: any) =>
      `项目${p.id}：${p.name} | 状态：${p.status} | 进度：${p.progress || 0}% | 优先级：${p.priority} | 部门：${p.department_name} | 类型：${p.module_name}`
    ).join('\n');

    // 调用大模型进行整理归纳
    const summarized = await callAI整理(rawData, `请归纳总结以下项目信息，突出关键要点（如项目数量、整体进度、状态分布、优先级等）。用户问题是：${message}`);

    return NextResponse.json({ success: true, data: { content: summarized } });
  } catch (error: any) {
    console.error('AI 整理失败:', error);
    // 如果 AI 调用失败，返回原始数据
    return NextResponse.json({ success: true, data: { content: error.message || '处理失败' } });
  }
}