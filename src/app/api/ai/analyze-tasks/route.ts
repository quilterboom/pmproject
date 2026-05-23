import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/dm-helper';

// AI 项目风险分析 - 支持 Ollama
export async function POST(request: Request) {
  try {
    // 获取默认模型配置
    let dbConfig: any = null;
    try {
      dbConfig = await queryOne<any>(`
        SELECT 
          id, name, provider, 
          base_url, api_key, model, is_default, status
        FROM "SYSDBA"."model_configs" 
        WHERE is_default = 1 AND status = 'active'
      `);
    } catch (queryError: any) {
      console.error('查询配置错误:', queryError.message);
    }

    const provider = dbConfig?.provider || 'minimax-cn';
    const model = dbConfig?.model || 'MiniMax-M2.5';
    const baseUrl = dbConfig?.base_url || 'https://api.minimaxi.com/v1';
    const apiKey = dbConfig?.api_key || '';

    // 获取所有项目
    const projects = await query('SELECT * FROM "SYSDBA"."projects"');

    const now = new Date().getTime();
    const riskProjects: any[] = [];
    const normalProjects: any[] = [];

    if (projects && projects.length > 0) {
      for (const p of projects) {
        // 过滤已完成/取消的项目
        if (p.status === 'completed' || p.status === 'cancelled') continue;

        const projectInfo: any = {
          id: p.id,
          name: p.name,
          status: p.status,
          priority: p.priority,
          progress: p.progress,
          endDate: p.end_date,
          riskLevel: 'normal',
          riskReason: ''
        };

        if (!p.end_date) {
          normalProjects.push(projectInfo);
          continue;
        }

        const endTime = new Date(p.end_date).getTime();
        const daysLeft = Math.floor((endTime - now) / (1000 * 60 * 60 * 24));

        // 风险判断
        if (daysLeft < 0) {
          projectInfo.riskLevel = 'overdue';
          projectInfo.riskReason = `已超期 ${Math.abs(daysLeft)} 天`;
          riskProjects.push(projectInfo);
        } else if (daysLeft <= 3 && p.progress < 100) {
          projectInfo.riskLevel = 'high';
          projectInfo.riskReason = `还剩 ${daysLeft} 天，进度仅 ${p.progress}%`;
          riskProjects.push(projectInfo);
        } else if (daysLeft <= 7 && p.progress < 50) {
          projectInfo.riskLevel = 'medium';
          projectInfo.riskReason = `还剩 ${daysLeft} 天，进度 ${p.progress}%`;
          riskProjects.push(projectInfo);
        } else if (p.status === 'on_hold') {
          projectInfo.riskLevel = 'medium';
          projectInfo.riskReason = '项目已暂停';
          riskProjects.push(projectInfo);
        } else {
          normalProjects.push(projectInfo);
        }
      }
    }

    // 排序
    riskProjects.sort((a, b) => {
      const order: Record<string, number> = { overdue: 0, high: 1, medium: 2 };
      return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
    });

    // 如果有风险项目且配置了模型，尝试调用 AI 生成总结
    let aiSummary = '';
    if (riskProjects.length > 0 && dbConfig) {
      const riskList = riskProjects.map(p => 
        `- ${p.name}: ${p.riskReason}`
      ).join('\n');

      const prompt = `请为以下项目风险分析生成简洁的中文总结（50字以内）：

${riskList}

直接返回总结文字，不要 JSON，不要其他内容。`;

      try {
        if (provider === 'ollama') {
          const ollamaUrl = baseUrl || 'http://localhost:11434';
          const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'user', content: prompt }
              ],
              stream: false
            })
          });
          if (response.ok) {
            const data = await response.json();
            aiSummary = data.message?.content || '';
          }
        } else if (provider === 'minimax-cn' || provider === 'minimax') {
          const { OpenAI } = require('openai');
          const client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl
          });
          const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200
          });
          aiSummary = response.choices?.[0]?.message?.content || '';
        }
      } catch (aiError: any) {
        console.error('AI 总结生成失败:', aiError.message);
      }
    }

    const summary = aiSummary || `共 ${riskProjects.length + normalProjects.length} 个进行中项目，${
      riskProjects.length > 0 ? `${riskProjects.length} 个存在风险` : '无风险'
    }。`;

    return NextResponse.json({
      success: true,
      data: { summary, riskProjects, normalProjects, stats: {
        total: riskProjects.length + normalProjects.length,
        overdue: riskProjects.filter(p => p.riskLevel === 'overdue').length,
        risk: riskProjects.length,
        normal: normalProjects.length
      }}
    });

  } catch (error) {
    console.error('AI 分析失败:', error);
    return NextResponse.json({
      success: false,
      message: '分析失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}