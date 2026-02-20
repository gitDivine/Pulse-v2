import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", user!.id)
    .single();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, quiet_hours_start, quiet_hours_end")
    .eq("owner_id", user!.id)
    .single();

  return (
    <div>
      <Topbar title="Settings" />
      <div className="p-6">
        <SettingsView profile={profile!} business={business!} />
      </div>
    </div>
  );
}
