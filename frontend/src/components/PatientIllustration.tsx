export function PatientIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 270 280" role="img" aria-label="Illustrated patient portrait" xmlns="http://www.w3.org/2000/svg">
      <circle cx="135" cy="139" r="112" fill="#e4f0ca" />
      <path d="M26 280c7-48 47-75 109-75s102 27 109 75" fill="#3f665d" />
      <path d="M78 231c15 17 35 26 57 26s42-9 57-26l-18-16-39-9-39 9z" fill="#f8f8ed" />
      <path d="M116 188h38v42c0 11-8 20-19 20s-19-9-19-20z" fill="#d6a580" />
      <ellipse cx="135" cy="131" rx="66" ry="75" fill="#dba984" />
      <path d="M69 130c-6-50 9-86 66-87 48-1 68 31 66 79-10-6-15-21-18-35-32 8-69 12-102 3-2 15-6 29-12 40z" fill="#273b35" />
      <path d="M76 91c14-36 44-48 81-42 21 3 34 15 40 33-22-14-43-19-68-16-19 3-37 11-53 25z" fill="#273b35" />
      <ellipse cx="70" cy="137" rx="10" ry="16" fill="#dba984" /><ellipse cx="200" cy="137" rx="10" ry="16" fill="#dba984" />
      <path d="M102 129c7-5 17-5 24-1M145 128c7-4 17-4 24 1" stroke="#4c4037" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="113" cy="137" r="3" fill="#273b35" /><circle cx="157" cy="137" r="3" fill="#273b35" />
      <path d="M133 140l-5 19c4 3 9 4 14 1" stroke="#aa745f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M115 176c12 10 28 11 40 0" stroke="#8d584d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M91 219l-12 12 34 49h22l-22-54zM179 219l12 12-34 49h-22l22-54z" fill="#527b6f" />
    </svg>
  );
}
