import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Send, Loader2, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    documentId: string;
    content: string;
    similarity: number;
  }>;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Erro no chat:', err);
      setError(err.response?.data?.message || 'Erro ao enviar mensagem. Verifique as configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
<div className="flex items-center justify-center w-full h-full bg-transparent">
  
  {/* Container do CHAT (Filho): Tem 80% de largura e altura */}
  <div className="flex flex-col w-[80%] h-[80%] bg-background-light dark:bg-background-dark rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#325567]">
    
    {/* Header */}
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#325567] p-4 shrink-0">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat Assistant</h2>
      <button
        onClick={handleNewChat}
        className="flex items-center justify-center gap-2 rounded-lg h-9 px-3 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10"
      >
        <Plus size={18} />
        <span className="truncate">New Chat</span>
      </button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 gap-4 h-full">
          <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Welcome to DocuChat AI!
          </h3>
          <p className="max-w-xs">
            Ask me anything about the documents in your knowledge base to get started.
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start'} gap-3`}
            >
              {msg.role === 'assistant' && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <MessageSquare size={18} />
                </div>
              )}
              <div
                className={`max-w-lg rounded-lg p-3 text-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-none bg-primary text-white'
                    : 'rounded-tl-none bg-gray-100 dark:bg-[#111c22] text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      📚 Sources ({msg.sources.length} documents):
                    </p>
                    {msg.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 pl-2 border-l-2 border-primary/30">
                        <span className="font-medium">Doc {idx + 1}:</span> {source.documentId.substring(0, 12)}...
                        <span className="ml-2 text-primary font-semibold">
                          {(source.similarity * 100).toFixed(1)}% relevance
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && (!msg.sources || msg.sources.length === 0) && (
                  <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-600">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠️ No documents found for this query
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <MessageSquare size={18} />
              </div>
              <div className="max-w-lg rounded-lg rounded-tl-none bg-gray-100 dark:bg-[#111c22] p-3 text-sm">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  </div>
</div>

)}