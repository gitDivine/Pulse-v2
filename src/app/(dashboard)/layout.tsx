import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  return (
    <DashboardShell
      businessName={business.name}
      businessSlug={business.slug}
    >
      {children}
    </DashboardShell>
  );
}
