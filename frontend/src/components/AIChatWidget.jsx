import React, { useState, useRef, useEffect } from 'react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your Aura Studio AI Stylist. How can I help you elevate your look today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // We send the entire conversation history (excluding the very first greeting if we want to save tokens, but it's fine)
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response');
      }

      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', content: "I'm having trouble connecting to my neural net right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`glass-panel rounded-3xl mb-4 overflow-hidden shadow-2xl transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0 flex' : 'scale-0 opacity-0 translate-y-10 hidden'
        }`}
        style={{ width: '350px', height: '500px', flexDirection: 'column', borderColor: 'var(--surface-border)' }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'rgba(0,240,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accentCyan text-black flex items-center justify-center text-xs font-bold">AI</div>
            <div>
              <h3 className="text-sm font-bold font-display" style={{ color: 'var(--heading-color)' }}>Aura AI Concierge</h3>
              <p className="text-[10px] font-mono text-accentCyan">Online</p>
            </div>
          </div>
          <button onClick={toggleChat} className="text-gray-400 hover:text-white transition p-2">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--surface-bg)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-accentCyan text-black rounded-br-sm' 
                    : 'glass-panel rounded-bl-sm'
                }`}
                style={msg.role === 'ai' ? { borderColor: 'var(--surface-border-subtle)', color: 'var(--text-color)' } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-panel max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-accentCyan animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-accentCyan animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-accentCyan animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-bg)' }}>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about styles..."
              className="flex-1 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accentCyan"
              style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--input-border)' }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black transition-all"
              style={{ backgroundColor: input.trim() ? 'var(--accent-cyan)' : 'var(--input-border)', opacity: isLoading ? 0.5 : 1 }}
            >
              ➤
            </button>
          </div>
        </form>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={toggleChat}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform magnetic"
        style={{ backgroundColor: 'var(--accent-cyan)', color: 'black', fontSize: '24px' }}
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}
