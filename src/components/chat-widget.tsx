'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Markdown from 'markdown-to-jsx';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  message: string;
  created_at: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userToken, setUserToken] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Khởi tạo session_id và lấy token khi widget mount
  useEffect(() => {
    // Tạo session_id ngẫu nhiên nếu chưa có trong localStorage
    let storedSession = localStorage.getItem('chat_session_id');
    if (!storedSession) {
      storedSession = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', storedSession);
    }
    setSessionId(storedSession);

    // Nạp lịch sử chat tạm từ localStorage nếu có
    const storedHistory = localStorage.getItem('chat_history');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            created_at: new Date(m.created_at),
          }))
        );
      } catch (e) {
        console.error('Không thể phục hồi lịch sử chat:', e);
      }
    } else {
      // Tin nhắn chào mừng mặc định
      setMessages([
        {
          id: 'welcome',
          role: 'agent',
          message: 'Xin chào! Mình có thể giúp gì cho bạn về sản phẩm, đơn hàng hoặc chính sách đổi trả/bảo hành?',
          created_at: new Date(),
        },
      ]);
    }

    // Lấy token của user để xác thực tra cứu đơn hàng
    const getSessionToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserToken(session?.access_token || null);
    };

    getSessionToken();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserToken(session?.access_token || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Lưu lịch sử chat mỗi khi thay đổi
  useEffect(() => {
    if (messages.length > 0 && messages[0].id !== 'welcome') {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsgText = input.trim();
    setInput('');

    // Thêm tin nhắn user vào state
    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      message: userMsgText,
      created_at: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Gọi API Endpoint thông qua biến môi trường hoặc fallback API Mock nội bộ
      const serviceUrl = process.env.NEXT_PUBLIC_RAG_SERVICE_URL || '/api/chat';
      
      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsgText,
          session_id: sessionId,
          user_token: userToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Kết nối API bị lỗi');
      }

      const data = await response.json();

      // Thêm phản hồi của bot vào state
      const botMessage: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'agent',
        message: data.reply || 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi này.',
        created_at: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Lỗi gọi RAG API:', error);
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'agent',
        message: 'Có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng kiểm tra cấu hình mạng hoặc thử lại sau!',
        created_at: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử cuộc trò chuyện này không?')) {
      localStorage.removeItem('chat_history');
      setMessages([
        {
          id: 'welcome',
          role: 'agent',
          message: 'Lịch sử chat đã được làm sạch. Bạn cần mình tư vấn thiết bị nào hôm nay?',
          created_at: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* KHUNG CỬA SỔ CHAT POPUP */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[500px] rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* HEADER CHAT */}
          <div className="bg-muted border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card animate-pulse"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight">Trợ lý Mua sắm AI</h3>
                <span className="text-[10px] text-muted-foreground">Hỗ trợ 24/7 trực tuyến</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-background transition-colors"
                title="Xóa lịch sử chat"
              >
                Xóa lịch sử
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* BODY CHAT - TIN NHẮN */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}
                >
                  {/* Nội dung markdown */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm">
                    <Markdown>{msg.message}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Tin nhắn đang nhập */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer gõ tin nhắn */}
          <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2 items-center">
            <input
              type="text"
              placeholder="Hỏi về sản phẩm, chính sách đổi trả..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-10 px-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 text-xs sm:text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground shadow-md shadow-primary/10 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}

      {/* 2. NÚT BẤM BONG BÓNG TRÒN NỔI BẬT */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary hover:opacity-95 text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/35 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
        title="Trò chuyện với trợ lý AI"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-success"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
