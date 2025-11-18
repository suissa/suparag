import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Send, Loader2, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useChatbotFactory } from '../lib/chatbotFactory';
import chatbotConfig from '../config/chatbot.config.json';

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
  const [isAnimated, setIsAnimated] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Usar o ChatbotFactory para processar a configuração
  const chatbotStyle = useChatbotFactory(chatbotConfig as any);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animação de entrada quando o componente monta
  useEffect(() => {
    if (chatbotStyle.animationEvent === 'page.load.full') {
      // Aguardar um frame para garantir que o DOM está pronto
      requestAnimationFrame(() => {
        setIsAnimated(true);
      });
    }
  }, [chatbotStyle.animationEvent]);

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
      
      console.log('📥 Response from API:', JSON.stringify(response.data, null, 2));
      console.log('📚 Sources:', JSON.stringify(response.data.sources, null, 2));
      
      // Debug: verificar cada source individualmente
      response.data.sources?.forEach((source: any, idx: number) => {
        console.log(`Source ${idx}:`, {
          documentId: source.documentId,
          similarity: source.similarity,
          similarityType: typeof source.similarity,
          similarityValue: source.similarity
        });
      });
      
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
    <div 
      className={`h-full flex flex-col bg-background-light dark:bg-background-dark ${chatbotStyle.containerClasses}`}
      style={isAnimated ? chatbotStyle.finalStyle : chatbotStyle.initialStyle}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#325567] p-4">
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
              Welcome to suparag!
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
                className={`flex ${
                  msg.role === 'user' 
                    ? chatbotStyle.userMessageClasses 
                    : chatbotStyle.botMessageClasses
                } gap-3 items-start`}
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
                          <span className="font-medium">Doc {idx + 1}:</span> {source.documentId ? source.documentId.substring(0, 12) : 'N/A'}...
                          <span className="ml-2 text-primary font-semibold">
                            {typeof source.similarity === 'number' ? (source.similarity * 100).toFixed(1) : 'N/A'}% relevance
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

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-[#325567] p-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="form-input w-full resize-none rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-[#233c48] pr-12 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary disabled:opacity-50"
            placeholder="Ask a question about your documents..."
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
