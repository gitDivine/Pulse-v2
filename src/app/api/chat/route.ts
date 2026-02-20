import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/server";
import { getAIResponse } from "@/lib/ai/chat-responder";

// Rate limiting: track requests per session
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

export async function POST(request: NextRequest) {
  try {
    const { businessId, buyerIdentifier, content } = await request.json();

    if (!businessId || !buyerIdentifier || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Rate limiting
    const now = Date.now();
    const limit = rateLimitMap.get(buyerIdentifier);
    if (limit && limit.resetAt > now && limit.count >= MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment." },
        { status: 429 }
      );
    }
    if (!limit || limit.resetAt <= now) {
      rateLimitMap.set(buyerIdentifier, { count: 1, resetAt: now + 60000 });
    } else {
      limit.count++;
    }

    const supabase = await createServiceRoleSupabase();

    // Find or create conversation
    let conversationId: string;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("business_id", businessId)
      .eq("buyer_identifier", buyerIdentifier)
      .single();

    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          business_id: businessId,
          buyer_identifier: buyerIdentifier,
          channel: "web",
          is_read: false,
        })
        .select("id")
        .single();
      if (error || !created) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      conversationId = created.id;
    }

    // Save buyer message
    const { data: buyerMessage, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "buyer",
        content,
        is_ai_generated: false,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        is_read: false,
      })
      .eq("id", conversationId);

    // Get business products for AI context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, stock_quantity, description")
      .eq("business_id", businessId)
      .eq("is_published", true);

    // Get business info
    const { data: business } = await supabase
      .from("businesses")
      .select("name, category, city, state")
      .eq("id", businessId)
      .single();

    // Generate AI response (Zone One — information only)
    const aiContent = await getAIResponse({
      buyerMessage: content,
      products: products || [],
      businessName: business?.name || "this store",
      businessCategory: business?.category || "general",
    });

    // Save AI response
    const { data: aiResponse } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "ai",
        content: aiContent,
        is_ai_generated: true,
      })
      .select()
      .single();

    // Create notification for seller
    const { data: bizOwner } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .single();

    if (bizOwner) {
      await supabase.from("notifications").insert({
        user_id: bizOwner.owner_id,
        title: "New message",
        body: `A buyer says: "${content.slice(0, 100)}"`,
        priority: "normal",
        action_url: "/dashboard/inbox",
      });
    }

    return NextResponse.json({ buyerMessage, aiResponse });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
