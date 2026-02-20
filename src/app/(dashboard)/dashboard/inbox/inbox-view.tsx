"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/format";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";

export interface Conversation {
  id: string;
  buyer_identifier: string;
  buyer_name: string | null;
  channel: string;
  last_message: string | null;
  last_message_at: string | null;
  is_read: boolean;
}

interface Message {
  id: string;
  sender_type: "buyer" | "seller" | "ai";
  content: string;
  is_ai_generated: boolean;
  created_at: string;
}

interface InboxViewProps {
  conversations: Conversation[];
  businessId: string;
}

export function InboxView({ conversations: initialConversations, businessId }: InboxViewProps) {
  const [conversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const selected = conversations.find((c) => c.id === selectedId);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedId) return;

    async function load() {
      const id = selectedId!;
      const { data } = await supabase
        .from("messages")
        .select("id, sender_type, content, is_ai_generated, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);

      // Mark as read
      await supabase
        .from("conversations")
        .update({ is_read: true })
        .eq("id", id);
    }
    load();
  }, [selectedId, supabase]);

  // Real-time messages
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`inbox-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedId || sending) return;

    setSending(true);
    const content = input.trim();
    setInput("");

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedId,
        sender_type: "seller",
        content,
        is_ai_generated: false,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }

    await supabase
      .from("conversations")
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq("id", selectedId);

    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-500">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages from your storefront will appear here</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full flex items-start gap-3 p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id ? "bg-orange-50" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {(conv.buyer_name || "B").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.buyer_name || "Buyer"}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.last_message}
                    </p>
                  )}
                </div>
                {!conv.is_read && (
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0 mt-1" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message view */}
      <div className={`flex-1 flex flex-col ${!selectedId ? "hidden md:flex" : "flex"}`}>
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <div>
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a conversation to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {(selected?.buyer_name || "B").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selected?.buyer_name || "Buyer"}
                </p>
                <p className="text-xs text-gray-400">via {selected?.channel || "web"}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "buyer" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      msg.sender_type === "buyer"
                        ? "bg-gray-100 text-gray-900 rounded-bl-md"
                        : msg.sender_type === "ai"
                        ? "bg-blue-50 text-blue-900 rounded-br-md"
                        : "bg-orange-600 text-white rounded-br-md"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_type === "buyer"
                        ? "text-gray-400"
                        : msg.sender_type === "ai"
                        ? "text-blue-400"
                        : "text-orange-200"
                    }`}>
                      {msg.sender_type === "ai" ? "AI response · " : ""}
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <form onSubmit={handleSend} className="border-t border-gray-200 px-4 py-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
