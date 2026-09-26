"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";

export function StartSimulationButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/simulations/start", { method: "POST" });
      const data = await response.json() as { simulation_id?: string; error?: string };
      if (!response.ok || !data.simulation_id) throw new Error(data.error || "Could not start the simulation.");
      router.push(`/simulations/${data.simulation_id}/evaluate`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the simulation.");
      setPending(false);
    }
  }

  return <div className={compact ? "start-control compact" : "start-control"}>
    <button type="button" className="button button-dark" onClick={start} disabled={pending}>
      {pending ? <LoaderCircle size={18} className="spin" /> : null}
      {pending ? "Preparing case…" : "Start a simulation"}
      {!pending ? <ArrowUpRight size={18} /> : null}
    </button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </div>;
}
