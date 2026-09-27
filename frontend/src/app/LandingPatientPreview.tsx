"use client";

import { useEffect, useState } from "react";
import { PatientIllustration } from "@/components/PatientIllustration";
import styles from "./page.module.css";

const patients = [
  { name: "Maya Chen", age: 34, pronouns: "she/her" },
  { name: "Daniel Park", age: 42, pronouns: "he/him" },
  { name: "Amara Okafor", age: 29, pronouns: "she/her" },
  { name: "Mateo Rivera", age: 56, pronouns: "he/him" },
  { name: "Leila Haddad", age: 47, pronouns: "she/her" },
  { name: "Samuel Okoro", age: 38, pronouns: "he/him" },
  { name: "Sofia Alvarez", age: 61, pronouns: "she/her" },
  { name: "Arjun Mehta", age: 25, pronouns: "he/him" },
  { name: "Nina Patel", age: 31, pronouns: "she/her" },
  { name: "Omar Hassan", age: 67, pronouns: "he/him" },
  { name: "Elena Rossi", age: 52, pronouns: "she/her" },
  { name: "Noah Bennett", age: 44, pronouns: "he/him" },
  { name: "Grace Kim", age: 72, pronouns: "she/her" },
  { name: "Leo Martin", age: 36, pronouns: "he/him" },
  { name: "Priya Shah", age: 28, pronouns: "she/her" },
  { name: "Ethan Brooks", age: 59, pronouns: "he/him" },
] as const;

export function LandingPatientPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % patients.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const patient = patients[index];
  return (
    <div className={styles.patientIdentity} key={patient.name}>
      <div className={styles.patientPortrait}>
        <PatientIllustration className={styles.portrait} pronouns={patient.pronouns} />
      </div>
      <div className={styles.patientName}>Meet {patient.name.split(" ")[0]} <span>·</span> {patient.age}</div>
      <div className={styles.patientCaption}>A new patient. A new conversation.</div>
    </div>
  );
}
