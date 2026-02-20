import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// DELETE /api/favorites/[carrierId] — remove a favorite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const { carrierId } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("shipper_id", user.id)
      .eq("carrier_id", carrierId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
