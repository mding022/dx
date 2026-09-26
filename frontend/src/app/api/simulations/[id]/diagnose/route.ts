import { auth0 } from "@/lib/auth0";
import { backendPost, type Simulation } from "@/lib/backend";

export async function POST(request: Request, context: RouteContext<"/api/simulations/[id]/diagnose">) {
  const session = await auth0.getSession();
  if (!session) return Response.json({ error: "Please log in first." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(body.diagnosis_id)) {
    return Response.json({ error: "Choose a diagnosis from the list." }, { status: 400 });
  }
  try {
    const data = await backendPost<Simulation>("/api/simulations/complete", {
      user_id: session.user.sub,
      simulation_id: id,
      diagnosis_id: body.diagnosis_id,
    });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Diagnosis submission failed", error);
    return Response.json({ error: "Could not submit the diagnosis. Please try again." }, { status: 502 });
  }
}
