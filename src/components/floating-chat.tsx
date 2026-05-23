'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FloatingChatProps {
  apiEndpoint?: string;
  defaultMessages?: { role: string; content: string }[];
  modelConfig?: { base_url: string; model: string; api_key: string };
}

export default function FloatingChat({ 
  apiEndpoint = '/api/ai/chat',
  defaultMessages = [],
  modelConfig
}: FloatingChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(defaultMessages);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          ...(modelConfig && { config: modelConfig })
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || '无回复' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '请求失败' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-xl border mb-2 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex justify-between items-center">
            <span className="text-white font-medium">AI 助手</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">✕</button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 && <p className="text-xs text-center text-muted-foreground">你可以问我项目管理的问题</p>}
            {messages.map((m, i) => (
              <div key={i} className={`text-xs p-2 rounded ${m.role === 'user' ? 'bg-blue-500 text-white ml-4' : 'bg-gray-200 mr-4'}`}>{m.content}</div>
            ))}
            {loading && <div className="text-xs bg-gray-200 p-2 rounded mr-4">思考中...</div>}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t flex gap-1">
            <Input className="h-8 text-sm" placeholder="问 AI..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={loading} />
            <Button size="sm" className="h-8 px-3" onClick={handleSend} disabled={loading || !input.trim()}>→</Button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(true)} className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white font-bold hover:scale-110 transition-transform">
        AI
      </button>
    </div>
  );
}