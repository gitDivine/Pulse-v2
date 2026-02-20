import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { InboxView, type Conversation } from "./inbox-view";

export default async function InboxPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, buyer_identifier, buyer_name, channel, last_message, last_message_at, is_read")
    .eq("business_id", business!.id)
    .order("last_message_at", { ascending: false });

  return (
    <div>
      <Topbar title="Inbox" />
      <div className="p-6">
        <InboxView
          conversations={(conversations || []) as Conversation[]}
          businessId={business!.id}
        />
      </div>
    </div>
  );
}
