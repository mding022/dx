import { PhoneCall, Signal } from "lucide-react";

export function CallStatus({ patientName }: { patientName: string }) {
  return <section className="call-status" aria-label="Simulation call status">
    <span className="call-icon"><PhoneCall size={22} /></span>
    <div className="call-copy"><span className="call-eyebrow"><span className="live-dot" /> SIMULATED CALL IN PROGRESS</span><strong>You&apos;re with {patientName}</strong><p>Your patient encounter is open while you make your assessment.</p></div>
    <div className="call-right"><span className="call-signal"><Signal size={15} /> ACTIVE</span><span className="call-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span></div>
  </section>;
}
