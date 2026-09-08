import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Sparkles, Send, ShieldCheck, FileSearch, Bot, User } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string | null;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, investigationId }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; event_ids?: string[]; provider?: string }>>([
    {
      sender: 'ai',
      text: 'Hello, I am CyberTrace AI. Ask me anything about this investigation. I generate answers grounded strictly in digital evidence log records without hallucinating facts.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    "What happened in this investigation?",
    "Show suspicious activity involving user Rahul.",
    "Which IP generated the most suspicious events?",
    "What happened before the database was queried?"
  ];

  const handleSend = async (textToSend?: string) => {
    const qText = textToSend || query;
    if (!qText.trim() || !investigationId) return;

    const newMsg = { sender: 'user' as const, text: qText };
    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await aiAPI.query(investigationId, qText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer,
          event_ids: res.referenced_event_ids,
          provider: res.provider_used
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'An error occurred while querying the investigation evidence base.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Forensic Investigation Assistant" maxWidth="max-w-3xl">
      <div className="flex flex-col h-[500px]">
        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[11px] font-medium text-blue-700 border border-blue-200 transition-all text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 h-fit">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3.5 rounded-xl text-xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.event_ids && msg.event_ids.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-sans font-medium">Evidence Citations:</span>
                    {msg.event_ids.map((id) => (
                      <span key={id} className="px-1.5 py-0.5 rounded bg-blue-50 font-mono text-[10px] text-blue-700 border border-blue-200 font-semibold">
                        {id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}

                {msg.provider && (
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Engine: {msg.provider}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-sans font-semibold animate-pulse p-2">
              <Sparkles className="w-4 h-4" /> Querying evidence logs...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about the evidence (e.g. Show database queries)..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};
