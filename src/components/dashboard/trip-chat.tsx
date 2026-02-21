"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MessageSquare, Send, Image, X, ChevronDown, Check, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";

interface TripChatProps {
  tripId: string;
}

export function TripChat({ tripId }: TripChatProps) {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get current user
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Fetch messages
  async function fetchMessages(silent = false) {
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`);
      const data = await res.json();
      if (res.ok) {
        const prev = messages;
        setMessages(data.messages || []);
        // If chat is collapsed, count unread from other party
        if (!expanded) {
          const unread = (data.messages || []).filter(
            (m: any) => m.sender_id !== currentUserId && !m.read_at
          ).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
        // Auto-scroll if new messages arrived
        if (!silent && (data.messages || []).length > prev.length) {
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
        }
      }
    } catch {} finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentUserId) return;
    fetchMessages();
    return () => clearInterval(pollRef.current);
  }, [tripId, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    clearInterval(pollRef.current);
    if (expanded) {
      fetchMessages();
      pollRef.current = setInterval(() => fetchMessages(true), 12000);
    }
    return () => clearInterval(pollRef.current);
  }, [expanded, currentUserId]);

  // Auto-scroll on mount/expand
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [expanded, messages.length]);

  async function handleSend() {
    if ((!body.trim() && !imageUrl) || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() || "📷 Photo", image_url: imageUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setBody("");
      setImageUrl(null);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch (err: any) {
      toast(err.message || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/trips/${tripId}/messages/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.url);
    } catch (err: any) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <Card className="overflow-hidden">
      {/* Header — clickable to toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-orange-500" />
          <CardTitle className="!mb-0">Messages</CardTitle>
          {unreadCount > 0 && !expanded && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Chat body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-white/5 mt-4" />

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="max-h-[320px] overflow-y-auto py-3 space-y-2 scroll-smooth"
            >
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : !hasMessages ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  No messages yet. Start the conversation.
                </p>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUserId;
                  const senderName = msg.profiles?.company_name || msg.profiles?.full_name || "Unknown";
                  const showName = !isMe && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                        {showName && (
                          <p className="text-[10px] font-medium text-gray-400 mb-0.5 px-1">
                            {senderName}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm break-words ${
                            isMe
                              ? "bg-orange-500 text-white rounded-br-md"
                              : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-bl-md"
                          }`}
                        >
                          {msg.image_url && (
                            <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                              <img
                                src={msg.image_url}
                                alt="Shared image"
                                className="rounded-lg max-h-40 max-w-full object-cover"
                              />
                            </a>
                          )}
                          {msg.body !== "📷 Photo" && <p>{msg.body}</p>}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "justify-end" : ""}`}>
                          <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                          {isMe && (
                            msg.read_at
                              ? <CheckCheck className="h-3 w-3 text-blue-500" />
                              : <Check className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Image preview */}
            {imageUrl && (
              <div className="relative inline-block mx-1 mb-2">
                <img src={imageUrl} alt="Upload" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-white/10" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-1 -right-1 rounded-full bg-black/60 p-0.5"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 pt-2 border-t border-gray-200 dark:border-white/5">
              <label className="shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                {uploading ? (
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image className="h-4 w-4 text-gray-400" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={(!body.trim() && !imageUrl) || sending}
                loading={sending}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
