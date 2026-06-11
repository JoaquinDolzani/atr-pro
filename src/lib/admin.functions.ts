import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAthlete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { athleteId: string }) =>
    z.object({ athleteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Authorize: caller must be coach
    const { data: isCoach } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "coach" });
    if (!isCoach) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Cascade deletes profile/trainings/reports/races/payments/monthly_loads via FK ON DELETE CASCADE.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.athleteId);
    if (error) throw error;
    return { ok: true };
  });
