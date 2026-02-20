"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Send, Bot } from "lucide-react";
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
  const supabase = createClient();

  // Load existing conversation
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

  // Real-time subscription
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
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
        // Deduplicate
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...newMsgs.filter((m) => !ids.has(m.id))];
      });
    } catch {
      // Re-add the message to input on failure
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[500px] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">{businessName}</p>
          <p className="text-xs text-gray-400">Usually replies instantly</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* AI disclosure */}
      <div className="bg-orange-50 px-4 py-2 text-xs text-orange-700 flex items-center gap-1.5">
        <Bot className="h-3.5 w-3.5 shrink-0" />
        Responses may be AI-assisted. A human will handle your order.
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[320px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Hi! Ask us about our products or place an order.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === "buyer" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                msg.sender_type === "buyer"
                  ? "bg-orange-600 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 px-3 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
