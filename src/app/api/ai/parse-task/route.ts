import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/dm-helper';

// 解析任务描述为结构化数据
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, apiKey: customApiKey } = body;

    if (!description) {
      return NextResponse.json({
        success: false,
        message: '请提供任务描述'
      }, { status: 400 });
    }

    // 获取默认的模型配置
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

    console.log('数据库配置查询结果:', JSON.stringify(dbConfig));
    
    const provider = dbConfig?.provider || 'minimax-cn';
    const model = dbConfig?.model || 'MiniMax-M2.5';
    const baseUrl = dbConfig?.base_url || 'https://api.minimaxi.com/v1';
    const dbApiKey = dbConfig?.api_key || '';

    // API Key 逻辑：Ollama 不需要 key，其他需要
    let apiKey = customApiKey || dbApiKey;
    if (!apiKey && provider !== 'ollama' && !customApiKey && !dbApiKey) {
      apiKey = process.env.MINIMAX_API_KEY || '';
    }

    // 如果是 Ollama，跳过 apiKey 检查
    if (!apiKey && provider !== 'ollama') {
      return NextResponse.json({
        success: false,
        message: '请先在模型配置页面配置 API Key'
      }, { status: 400 });
    }

    // 构建 prompt
    const prompt = `你是一个任务管理助手。请从用户的描述中提取任务信息，生成 JSON 格式的结果。

任务描述: ${description}

请根据描述提取以下信息:
- name: 任务名称（简短描述）
- description: 任务目标/描述（详细说明）
- priority: 优先级（1=低, 2=中, 3=高）
- endDate: 预期完成日期（格式 YYYY-MM-DD，如果没提到请返回 null）

注意：
1. priority：如果描述中提到"紧急"、"重要"、"优先级高"、"立即"等，返回 3；如果提到"不急"、"空闲时"等，返回 1，否则返回 2
2. endDate：如果描述中提到具体日期（如"下周一"、"本月15号"、"5月20日"等），请转换为 YYYY-MM-DD 格式；如果没提到具体日期，请根据描述推断合理的截止日期（通常是描述日期后的 1-2 周）
3. 返回纯 JSON，不要包含任何其他文字

只返回 JSON，例如：
{"name": "用户登录页面UI设计", "description": "完成用户登录页面的视觉设计和交互效果", "priority": 3, "endDate": "2026-05-25"}`;

    // 调用大模型
    let resultText = '';

    console.log('AI 调用配置:', { provider, model, baseUrl, hasApiKey: !!apiKey });

    if (provider === 'ollama') {
      // Ollama 本地模型
      const ollamaUrl = baseUrl || 'http://localhost:11434';
      console.log('调用 Ollama:', ollamaUrl, '模型:', model);

      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一个任务管理助手，请从用户描述中提取任务信息并返回 JSON。' },
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama 返回错误: ${response.status}`);
      }

      const data = await response.json();
      resultText = data.message?.content || '';
    } else if (provider === 'minimax-cn' || provider === 'minimax') {
      // MiniMax API - 使用 OpenAI SDK
      const { OpenAI } = require('openai');
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl
      });

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: '你是一个任务管理助手，请从用户描述中提取任务信息并返回 JSON。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      resultText = response.choices?.[0]?.message?.content || '';
    } else if (provider === 'openai') {
      // OpenAI API
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一个任务管理助手，请从用户描述中提取任务信息并返回 JSON。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      resultText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'anthropic') {
      // Anthropic API
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          system: '你是一个任务管理助手，请从用户描述中提取任务信息并返回 JSON。',
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await response.json();
      resultText = data.content?.[0]?.text || '';
    } else {
      // 自定义 provider
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一个任务管理助手，请从用户描述中提取任务信息并返回 JSON。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      resultText = data.choices?.[0]?.message?.content || '';
    }

    // 解析 JSON 结果
    let parsedResult = {
      name: '',
      description: '',
      priority: 2,
      endDate: null
    };

    try {
      // 尝试提取 JSON
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('解析大模型返回结果失败:', parseError);
      return NextResponse.json({
        success: false,
        message: '解析结果失败',
        error: '无法解析大模型返回的内容'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: parsedResult
    });

  } catch (error) {
    console.error('AI 解析失败:', error);
    return NextResponse.json({
      success: false,
      message: 'AI 解析失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}