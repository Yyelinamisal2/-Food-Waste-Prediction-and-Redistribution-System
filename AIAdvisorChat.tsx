import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, InventoryItem } from "../types";
import { 
  Send, 
  Sparkles, 
  Utensils, 
  HelpCircle, 
  ShieldAlert, 
  Hourglass,
  ArrowRight,
  Bot,
  User,
  Coffee,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAdvisorChatProps {
  inventory: InventoryItem[];
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  clearChat: () => void;
}

export default function AIAdvisorChat({
  inventory,
  messages,
  sendMessage,
  isSending,
  clearChat
}: AIAdvisorChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    
    sendMessage(inputText.trim());
    setInputText("");
  };

  // Premade quick guidelines tags
  const PRESET_QUERIES = [
    {
      label: "Leftover recipes from my inventory",
      icon: <Utensils className="w-3.5 h-3.5 text-emerald-500 mr-1" />,
      text: "Based on my current active inventory items on spoil risk, what quick leftover recipes can I create to prevent throwing them away?"
    },
    {
      label: "Bananas & Bread preservation",
      icon: <Coffee className="w-3.5 h-3.5 text-amber-500 mr-1" />,
      text: "How can I extend the remaining shelf-life of overripe bananas and artisanal sourdough bread?"
    },
    {
      label: "Cooked food safety regs",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500 mr-1" />,
      text: "What are the food safety codes and temperature regulations I should adhere to when donating hot cooked catering pans?"
    },
    {
      label: "Methane landfill costs",
      icon: <Globe className="w-3.5 h-3.5 text-blue-500 mr-1" />,
      text: "What is the relation between landfill food waste, greenhouse gas emissions, and global warming impacts?"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-advisor-tab">
      
      {/* LEFT SUB-BAR: LOGISTIC SAFETY & INVENTORY STOCK REFERENCE (SPAN 4) */}
      <div className="lg:col-span-4 space-y-6" id="advisor-inventory-reference">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Active Ingredients Context</h3>
            <p className="text-xs text-slate-400">These items on hand are automatically paired with Gemini answers to tailor recipes.</p>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="reference-item-list">
            {inventory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No items on hand to auto-inject.</p>
            ) : (
              inventory.map((item) => (
                <div 
                  key={item.id}
                  className="border border-slate-100/80 rounded-xl p-2.5 bg-slate-50/50 text-xs flex justify-between items-center"
                >
                  <div className="text-left">
                    <span className="font-bold text-slate-700 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono italic">Exp: {item.expirationDate}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono text-[10px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Food Safety Code CheatSheet</h4>
            <div className="space-y-2 bg-amber-50/40 p-3 border border-amber-100/50 rounded-xl">
              <p>
                🥛 <strong className="text-amber-800">Cold Chain:</strong> Dairy and fresh meat products must remain below 40°F (4°C) to prevent pathogen outbreak.
              </p>
              <p>
                🍲 <strong className="text-amber-800">Hot Holding:</strong> Cooked food must be cooled rapidly or matched immediately for transfer within a 4-hour window.
              </p>
              <p>
                🏷️ <strong className="text-amber-800">Labelling:</strong> All donor parcels must have allergen warnings (Nuts, Wheat, Dairy) clearly detailed on matched dispatches.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: CONVERSATION CHAT SCREEN (SPAN 8) */}
      <div className="lg:col-span-8 flex flex-col" id="advisor-conversation-pane">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[550px]" id="chat-cabinet">
          
          {/* Box Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">EcoChef & LogiWaste Advisor</h3>
                <span className="text-[10px] text-slate-400 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-800 uppercase tracking-wider">
                  Live Gemini 3.5 AI Advisor
                </span>
              </div>
            </div>
            
            <button
              onClick={clearChat}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-lg transition"
            >
              Clear Logs
            </button>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs" id="chat-scroller-flow">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-3 max-w-md mx-auto my-auto">
                <Sparkles className="w-8 h-8 mx-auto text-emerald-500 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Ask anything about preservation!</p>
                  <p className="text-xs">I am your direct culinary advisor. Send a query below or select one of our eco-presets to obtain rapid preservation insights and recipe models.</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAI = msg.role === "model";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start ${isAI ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`flex gap-2.5 max-w-[85%] ${isAI ? "flex-row text-left" : "flex-row-reverse text-right"}`}>
                      
                      {/* Badge avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                        isAI 
                          ? "bg-slate-50 text-emerald-600 border-slate-200" 
                          : "bg-slate-900 text-white border-slate-900"
                      }`}>
                        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      {/* Msg Box */}
                      <div className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isAI 
                          ? "bg-slate-50 border border-slate-150 text-slate-700" 
                          : "bg-slate-900 text-white"
                      }`}>
                        {msg.content}
                      </div>

                    </div>
                  </motion.div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-start justify-start">
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-emerald-650 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Chef is cooking up recommendations...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Helper Tags Row */}
          <div className="py-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-left" id="preset-tags">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(preset.text)}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-slate-600 font-semibold flex items-center transition cursor-pointer"
              >
                {preset.icon}
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Form input bar */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-100/60" id="chat-composer">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for Leftover Sourdough Pan Pizza recipes, cold holding guidelines..."
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 focus:outline-emerald-600 font-medium"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className={`text-white px-5 py-3 rounded-xl font-bold text-xs transition flex items-center space-x-1 ${
                isSending || !inputText.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <span>Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
