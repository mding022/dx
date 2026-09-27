import { BriefcaseBusiness, ClipboardList, Pill, ShieldCheck } from "lucide-react";
import type { PatientIdentity } from "@/lib/backend";
import { PatientIllustration } from "@/components/PatientIllustration";

export function PatientChart({ patient, simulationId }: { patient: PatientIdentity; simulationId: string }) {
  return <section id="patient-chart" className="panel patient-chart" aria-labelledby="patient-chart-title">
    <div className="patient-chart-heading"><span className="section-overline">YOUR PATIENT</span><span className="id-chip"><ShieldCheck size={12} />Simulated</span></div>
    <div className="patient-identity"><div className="patient-portrait-wrap"><PatientIllustration pronouns={patient.pronouns} /></div><div><h2 id="patient-chart-title">{patient.name}</h2><p>{patient.age} years · {patient.pronouns}</p><span><BriefcaseBusiness size={13} />{patient.occupation}</span></div></div>
    <div className="patient-background-section"><h3>Background</h3><p>{patient.background}</p></div>
    <div className="chart-sections">{[{ label: "Medical history", items: patient.medical_history, icon: ClipboardList }, { label: "Medications", items: patient.medications, icon: Pill }, { label: "Allergies", items: patient.allergies, icon: ShieldCheck }].map(({ label, items, icon: Icon }) => <div className="chart-section" key={label}><h3><Icon size={16} />{label}</h3>{items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="chart-unreported">Not reported</p>}</div>)}</div>
    <div className="chart-footer"><span>CASE REFERENCE</span><code>{simulationId.slice(0, 8).toUpperCase()}</code></div>
  </section>;
}
