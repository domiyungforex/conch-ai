'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, BookOpen, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const suggestedPrompts = [
  'What does Romans 8 teach?',
  'Who was Melchizedek?',
  'Explain Esther 4.',
  'Show me Scripture about wisdom.',
  'How does the Bible address forgiveness?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function AskContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [input, setInput] = useState(initialQuery);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (initialQuery && messages.length === 0) handleSubmit(initialQuery);
  }, [initialQuery]);

  const handleSubmit = async (text?: string) => {
    const question = text || input.trim();
    if (!question || isLoading) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: question }) });
      if (!res.ok) throw new Error('Failed');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      const msgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: msgId, role: 'assistant', content: '' }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value);
          setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content } : m));
        }
      }
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-8rem)]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-stone-900 mb-2">ASK THE WAY</h1>
            <p className="text-stone-500">Ask about Scripture, faith, or life...</p>
          </div>
          <div className="w-full max-w-xl space-y-3 mb-8">
            {suggestedPrompts.map((prompt) => (
              <button key={prompt} onClick={() => { setInput(prompt); handleSubmit(prompt); }}
                className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-white transition-colors group">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-stone-400 group-hover:text-stone-600 shrink-0" />
                  <span className="text-sm text-stone-700">{prompt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-6 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
              )}
              <Card className={`max-w-[85%] ${message.role === 'user' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200'}`}>
                <CardContent className="p-4">
                  <div className="prose prose-sm max-w-none">
                    {message.content ? message.content.split('\n').map((p, i) => (
                      <p key={i} className={message.role === 'user' ? 'text-white' : 'text-stone-800'}>{p}</p>
                    )) : isLoading && (
                      <div className="flex items-center gap-2 text-stone-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-stone-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      <div className="sticky bottom-20 md:bottom-0 pt-4 bg-stone-50">
        <div className="relative">
          <Textarea placeholder="Ask about Scripture, faith, or life..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            rows={1} className="min-h-[48px] max-h-[120px] resize-none pr-12 bg-white border-stone-200 rounded-xl" />
          <Button size="sm" onClick={() => handleSubmit()} disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>}>
      <AskContent />
    </Suspense>
  );
}
