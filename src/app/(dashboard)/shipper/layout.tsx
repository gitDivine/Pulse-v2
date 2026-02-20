import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { DashboardShell } from "../dashboard-shell";

export default async function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "shipper") redirect("/carrier/dashboard");

  return (
    <DashboardShell
      userName={profile.full_name}
      companyName={profile.company_name ?? undefined}
      role="shipper"
    >
      {children}
    </DashboardShell>
  );
}
