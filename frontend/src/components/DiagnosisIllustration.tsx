import {
  Activity, Brain, Bug, Droplet, Droplets, Eye, Flower2, HeartPulse,
  Leaf, Ribbon, Wind, Bone, type LucideIcon,
} from "lucide-react";
import { DISEASE_NAMES } from "./diagnosis-illustration-data";

export type DiagnosisIllustrationProps = {
  diseaseId?: number;
  name: string;
  className?: string;
  /** Set true when nearby text already names the diagnosis. */
  decorative?: boolean;
};

const organIcons: Record<string, LucideIcon> = {
  heart: HeartPulse, lung: Wind, brain: Brain, kidney: Droplets, blood: Droplets,
  skin: Flower2, bone: Bone, eye: Eye, infection: Bug, cancer: Ribbon,
  mental: Brain, gut: Activity, liver: Leaf, metabolic: Droplet, vessel: Activity,
  default: Activity,
};
const colors = ["#628477", "#bd8067", "#82975f", "#71869a", "#b98a53", "#987a91", "#5e8f91", "#a5675e"];

function categoryFor(label: string): string {
  const n = label.normalize("NFKD").toLowerCase();
  if (/heart|cardio|valve|myocard|tachycardia|hypertens/.test(n)) return "heart";
  if (/lung|pneum|respirat|asthma|bronch|airway|pulmonary|emphysema|dyspnea/.test(n)) return "lung";
  if (/brain|cerebro|dementia|parkinson|epilep|psych|mental|anxiety|depress|confus|deliri|aphasia|migraine|paranoi|schizophren|bipolar|manic|delusion|personality|affect/.test(n)) return "brain";
  if (/kidney|renal|urinary|prostat|pyelo/.test(n)) return "kidney";
  if (/anemia|blood|thromb|neutrop|pancyt|sickle|bacteremia|septic|lymph|thrombus|embol|vascular|ischemia|hemiparesis/.test(n)) return "blood";
  if (/skin|cellulitis|rash|exanthema|melanoma|decubitus/.test(n)) return "skin";
  if (/bone|arthritis|polyarthritis|gout|osteoporosis|osteomyelitis/.test(n)) return "bone";
  if (/glaucoma|eye/.test(n)) return "eye";
  if (/cancer|carcinoma|neoplasm|tumor|lymphoma|malignant|fibroid/.test(n)) return "cancer";
  if (/infection|influenza|hepatitis|candidiasis|immuno-deficiency|septic|bacteremia/.test(n)) return "infection";
  if (/liver|hepat|cirrhosis/.test(n)) return "liver";
  if (/diabetes|glucose|cholesterol|lipid|obesity|hypothyroid|dehydrat|fluid|bilirubin|keto|hyperlipid/.test(n)) return "metabolic";
  if (/gastro|gastr|pancrea|colitis|colon|divert|ulcer|hernia|ileus|chole|deglut|incontin|hemorrhoid|adhesion/.test(n)) return "gut";
  if (/dependence|suicide attempt/.test(n)) return "brain";
  return "default";
}

function stableHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A compact, diagnosis-specific organ vignette for search results and review cards. */
export function DiagnosisIllustration({ diseaseId, name, className = "", decorative = false }: DiagnosisIllustrationProps) {
  const label = name.trim() || (diseaseId ? DISEASE_NAMES[diseaseId] : undefined) || "Health condition";
  const key = label.normalize("NFKD").toLowerCase();
  const hash = stableHash(key);
  const category = categoryFor(label);
  const Icon = /diabetes|hypoglycemia|hyperglycemia|ketoacidosis/.test(key) ? Droplet : organIcons[category];
  const tone = colors[hash % colors.length];
  const accent = colors[(hash >>> 5) % colors.length];
  const rotation = (hash % 17) - 8;
  const dotX = 15 + ((hash >>> 9) % 70);
  const dotY = 18 + ((hash >>> 15) % 28);

  return (
    <svg
      className={className}
      viewBox="0 0 112 88"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `${label} illustration`}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="108" height="84" rx="24" fill="#f3f3e8" />
      <circle cx="56" cy="44" r="31" fill="#e2ead9" />
      <circle cx={dotX} cy={dotY} r="3.5" fill={accent} opacity=".8" />
      <circle cx={94 - (hash % 9)} cy={65 - (hash % 7)} r="2.5" fill={tone} opacity=".65" />
      <path d={`M18 ${68 - (hash % 5)}c8-9 13-7 18-2m43-41c5-5 10-4 15 0`} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <g transform={`rotate(${rotation} 56 44)`}>
        <circle cx="56" cy="44" r="22" fill="#fffdf5" />
        {category === "lung" ? (
          <g fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M56 31v13m0-7c-5-8-8-9-11-8l-5 17c-2 7 2 12 8 10l8-5m0-7c5-8 8-9 11-8l5 17c2 7-2 12-8 10l-8-5" />
            <path d="M56 37l-6 7m6-1 6-6" />
          </g>
        ) : (
          <Icon x="39" y="27" width="34" height="34" stroke={tone} strokeWidth={1.8} aria-hidden="true" />
        )}
      </g>
      <path d={`M${48 + (hash % 10)} 72h${14 + ((hash >>> 6) % 12)}`} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
