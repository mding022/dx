import { auth0 } from "@/lib/auth0";
import { backendPost, type GeneratedCase } from "@/lib/backend";

export async function POST() {
  const session = await auth0.getSession();
  if (!session) return Response.json({ error: "Please log in first." }, { status: 401 });
  try {
    const data = await backendPost<{ simulation_id: string; case: GeneratedCase }>(
      "/api/simulations/start", { user_id: session.user.sub },
    );
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Simulation start failed", error);
    return Response.json({ error: "Could not start a simulation. Please try again." }, { status: 502 });
  }
}
