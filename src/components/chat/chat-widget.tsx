"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { timeAgo } from "@/lib/utils/format";

interface Message {
  id: string;
  sender_type: "buyer" | "seller" | "ai";
  content: string;
  is_ai_generated: boolean;
  created_at: string;
}

interface ChatWidgetProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
}

const quickReplies = [
  "What products do you have?",
  "How much is delivery?",
  "Do you deliver to my area?",
  "I want to place an order",
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatWidget({ businessId, businessName, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = sessionStorage.getItem("pulse_chat_session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("pulse_chat_session", id);
    }
    return id;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadMessages() {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("business_id", businessId)
        .eq("buyer_identifier", sessionId)
        .single();

      if (conversation) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, sender_type, content, is_ai_generated, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });
        if (msgs) setMessages(msgs as Message[]);
      }
    }
    if (sessionId) loadMessages();
  }, [businessId, sessionId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          buyerIdentifier: sessionId,
          content,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      setMessages((prev) => {
        const newMsgs: Message[] = [];
        if (data.buyerMessage) newMsgs.push(data.buyerMessage);
        if (data.aiResponse) newMsgs.push(data.aiResponse);
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...newMsgs.filter((m) => !ids.has(m.id))];
      });
    } catch {
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleQuickReply(text: string) {
    setInput(text);
    setTimeout(() => {
      handleSend();
    }, 50);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 dark:bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-gray-900" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{businessName}</p>
            <p className="text-xs text-gray-400">Usually replies instantly</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </div>

      {/* AI disclosure */}
      <div className="bg-orange-50 dark:bg-orange-500/10 px-4 py-2 text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
        <Bot className="h-3.5 w-3.5 shrink-0" />
        Responses may be AI-assisted. A human will handle your order.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[320px]">
        <AnimatePresence initial={false}>
          {messages.length === 0 && !sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hi! Ask us about our products or place an order.
              </p>
              {/* Quick replies */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {quickReplies.map((text) => (
                  <motion.button
                    key={text}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickReply(text)}
                    className="rounded-full border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-orange-300 transition-colors"
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex ${msg.sender_type === "buyer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  msg.sender_type === "buyer"
                    ? "bg-orange-600 text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.sender_type === "buyer" ? "text-orange-200" : "text-gray-400"
                }`}>
                  {msg.is_ai_generated && "AI · "}
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </motion.div>
          ))}

          {sending && <TypingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-white/5 px-3 py-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-200 dark:border-white/10 bg-transparent px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          disabled={sending}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md shadow-orange-600/20"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </form>
    </motion.div>
  );
}
