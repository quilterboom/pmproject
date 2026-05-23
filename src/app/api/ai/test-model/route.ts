import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/dm-helper';

// 测试模型连接 - 添加详细错误日志
export async function GET(request: NextRequest) {
  let errorInfo = '';
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('config_id');
    
    errorInfo = `step1: configId=${configId}`;

    if (!configId) {
      return NextResponse.json({ success: false, message: '缺少 config_id 参数' });
    }

    // 从数据库获取配置
    errorInfo = 'step2: before queryOne';
    const dbConfig = await queryOne<any>(`
      SELECT 
        id, name, provider, 
        base_url, api_key, model
      FROM "SYSDBA"."model_configs" 
      WHERE id = ?
    `, [configId]);

    errorInfo = 'step2: after queryOne';
    
    if (!dbConfig) {
      return NextResponse.json({ success: false, message: '配置不存在' });
    }

    const actualApiKey = dbConfig.api_key;
    const actualModel = dbConfig.model;
    const actualProvider = dbConfig.provider;
    const actualBaseUrl = dbConfig.base_url;
    
    errorInfo = `step3: got config, key_length=${actualApiKey?.length ?? 0}`;

    if (!actualProvider || !actualModel) {
      return NextResponse.json({ success: false, message: '缺少必要参数' });
    }

    if (!actualApiKey) {
      return NextResponse.json({ success: false, message: '请先在模型配置页面填写 API Key' });
    }

    let success = false;
    let message = '';

    // MiniMax API 测试
    if (actualProvider === 'minimax-cn' || actualProvider === 'minimax') {
      try {
        // 使用 OpenAI SDK 兼容接入
        const { OpenAI } = require('openai');
        const client = new OpenAI({
          apiKey: actualApiKey,
          baseURL: actualBaseUrl || 'https://api.minimaxi.com/v1'
        });

        errorInfo = `step4: calling ${actualBaseUrl}`;

        const response = await client.chat.completions.create({
          model: actualModel,
          messages: [{ role: 'user', content: '你好，请回复"测试成功"' }],
          max_tokens: 50,
        });

        success = true;
        message = response.choices?.[0]?.message?.content || '模型连接成功';
      } catch (apiError: any) {
        message = apiError.message || 'API 调用失败';
        errorInfo = `step5: error - ${message}`;
      }
    } 
    // Ollama 本地模型测试
    else if (actualProvider === 'ollama') {
      try {
        const ollamaUrl = actualBaseUrl || 'http://localhost:11434';
        errorInfo = `step4: calling ollama at ${ollamaUrl}`;

        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: actualModel,
            messages: [{ role: 'user', content: '你好' }],
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama 返回错误: ${response.status}`);
        }

        const data = await response.json();
        success = true;
        message = data.message?.content || '模型连接成功';
      } catch (apiError: any) {
        message = apiError.message || 'Ollama 连接失败';
        errorInfo = `step5: error - ${message}`;
      }
    } else {
      success = true;
      message = `配置已保存（${actualProvider} - ${actualModel}）`;
    }

    return NextResponse.json({ success, message });
  } catch (error: any) {
    console.log('[Test Model] 错误 at:', errorInfo, '- error:', error.message);
    return NextResponse.json({ success: false, message: error.message + ' @' + errorInfo });
  }
}