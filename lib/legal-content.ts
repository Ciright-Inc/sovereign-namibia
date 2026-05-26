import type { LegalSlug } from "./legal-slugs";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
};

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction and Constitutional Foundation",
    paragraphs: [
      "Sovereign Namibia (\"the Platform\", \"we\", \"us\") operates as the Republic of Namibia's sovereign digital identity and governance infrastructure. This Privacy Policy is drafted in accordance with the Constitution of the Republic of Namibia, particularly the protections of human dignity (Article 8), equality and freedom from discrimination (Article 10), privacy (Article 13), and the right to fair and lawful administrative action (Article 18).",
      "We further align our practices with Namibian common law privacy principles, the Communications Act (No. 8 of 2009), applicable cybercrime and digital evidence legislation, and internationally recognised data protection standards comparable to POPIA and GDPR where cross-border processing occurs.",
      "This Platform exists to serve citizens, participating institutions, and the Republic — not to commercialise personal information. Your data belongs to you.",
    ],
  },
  {
    id: "ownership",
    title: "Citizen Data Ownership",
    paragraphs: [
      "You retain ownership of your personal data at all times. Sovereign Namibia acts as a lawful processor and custodian on behalf of citizens and authorised public institutions, never as a proprietor of your identity.",
      "We do not sell, rent, broker, or monetise personal data. No third party may acquire citizen records through this Platform for commercial profiling, advertising, or resale purposes.",
      "Participating organisations retain lawful ownership of records they originate, subject to constitutional and statutory obligations governing public administration and citizen access.",
    ],
  },
  {
    id: "categories",
    title: "Categories of Data Collected",
    paragraphs: ["We collect only data necessary for lawful identity verification, account management, and authorised public services:"],
    list: [
      "Identity particulars: legal name, date of birth, national identification references, and verification documents",
      "Contact information: mobile number, email address, and verified correspondence channels",
      "Authentication data: one-time passwords, session tokens, and credential metadata (passwords are never stored in plain text)",
      "Verification artefacts: encrypted document uploads, telecom verification records, and KYC review outcomes",
      "Technical telemetry: device type, browser metadata, IP region (not precise geolocation), and security event logs",
      "Service interaction records: directory searches (masked), claim requests, and support communications",
    ],
  },
  {
    id: "lawful-basis",
    title: "Lawful Basis for Processing",
    paragraphs: [
      "Processing occurs only where a lawful basis exists under Namibian law: explicit consent, statutory obligation, performance of a public function, protection of vital interests, or legitimate interests balanced against your constitutional rights.",
      "Government-integrated services operate under constitutional mandates and applicable statutes. Where consent is required, it is obtained through clear, affirmative mechanisms — never through pre-ticked boxes or implied agreement.",
      "You may withdraw consent for optional processing at any time, subject to limitations where processing is required by law or for the integrity of verified identity records.",
    ],
  },
  {
    id: "consent",
    title: "Consent Mechanisms",
    paragraphs: [
      "Registration, verification, and document submission each require distinct, informed consent presented in plain language.",
      "Consent records are timestamped, versioned against the applicable policy, and retained as part of the audit trail.",
      "Minors and persons under legal guardianship are processed only through lawful representative mechanisms as required by Namibian law.",
    ],
  },
  {
    id: "security",
    title: "Encryption and Access Control",
    paragraphs: [
      "All data is encrypted in transit using TLS 1.2 or higher. Data at rest is encrypted using industry-standard algorithms with keys managed through enterprise-grade key management practices.",
      "Access is governed by strict identity and access management (IAM) policies. Role-based access control ensures that only authorised systems and personnel may view identifiable data, and only to the minimum extent required.",
      "Multi-factor authentication protects administrative and reviewer accounts. All access to sensitive records is logged, monitored, and subject to periodic audit.",
      "Security controls are reviewed regularly against evolving threats and aligned with enterprise cybersecurity standards appropriate for national digital infrastructure.",
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure and Cross-Border Transfers",
    paragraphs: [
      "Sovereign Namibia operates a security-conscious, multi-layered infrastructure designed for resilience and continuity while protecting operational confidentiality.",
      "Frontend applications and edge routing are served through infrastructure hosted in South Africa, providing regional proximity and performance for Southern African users.",
      "Backend application orchestration and switching layers are regionally managed under strict access controls and encrypted communication channels.",
      "Encrypted replication and secured cloud workloads may utilise AWS infrastructure in Virginia, United States, for redundancy, resilience, analytics, and business continuity purposes.",
      "All cross-border transfers occur only over encrypted channels. Data at rest in secondary regions remains encrypted. Transfers are limited to what is necessary for operational continuity and are governed by contractual and technical safeguards comparable to international data protection standards.",
      "We do not disclose specific routing logic, internal endpoints, credentials, or traceable infrastructure patterns in public documentation. Transparency is provided at the level necessary for citizen trust without exposing operational attack surfaces.",
    ],
  },
  {
    id: "retention",
    title: "Retention and Deletion",
    paragraphs: [
      "Identity records are retained for the duration of your active account and as required by applicable Namibian law, statutory retention schedules, and legitimate audit requirements.",
      "Verification documents are retained only for the period necessary to complete review and satisfy regulatory obligations, after which they may be archived or securely deleted in accordance with policy.",
      "You may request access to, correction of, or deletion of your personal data, subject to lawful exceptions where retention is mandated for public interest, legal proceedings, or the prevention of fraud.",
      "Deletion requests are processed within statutory timeframes. Upon deletion, data is removed from active systems and scheduled for secure erasure from backup stores within defined recovery windows.",
    ],
  },
  {
    id: "analytics",
    title: "Analytics and Automated Processing",
    paragraphs: [
      "Operational analytics are used solely to improve service reliability, detect anomalies, and measure platform performance. Analytics data is aggregated and de-identified wherever practicable.",
      "Automated processing supports identity verification workflows. Significant decisions affecting your rights include human review pathways where required by law or platform policy.",
      "We do not use personal data for behavioural advertising, commercial profiling, or sale to data brokers.",
    ],
  },
  {
    id: "disclosure",
    title: "Lawful Disclosure Limitations",
    paragraphs: [
      "Personal data is disclosed only where required by valid legal process, court order, or statutory authority under Namibian law, or with your explicit consent.",
      "Law enforcement requests are verified for legal validity before any disclosure. We challenge requests that appear overbroad or inconsistent with constitutional protections.",
      "Participating institutions receive only the minimum data necessary for authorised service delivery, governed by data sharing agreements and audit requirements.",
    ],
  },
  {
    id: "incidents",
    title: "Incident Response and Breach Notification",
    paragraphs: [
      "Sovereign Namibia maintains a documented incident response programme aligned with enterprise cybersecurity standards.",
      "In the event of a data breach likely to affect your rights, we will notify affected individuals and relevant authorities within timeframes required by applicable Namibian law and international best practice.",
      "Notifications will describe the nature of the incident, categories of data affected, measures taken, and recommended steps you may take to protect yourself.",
      "Post-incident reviews are conducted to strengthen controls and prevent recurrence.",
    ],
  },
  {
    id: "rights",
    title: "Your Privacy Rights",
    paragraphs: ["Consistent with the Constitution and applicable law, you have the right to:"],
    list: [
      "Access personal data held about you",
      "Request correction of inaccurate or incomplete records",
      "Request deletion where no lawful basis for retention exists",
      "Object to processing based on legitimate interests",
      "Receive information about how your data is used",
      "Lodge a complaint with the relevant Namibian authority",
    ],
  },
  {
    id: "contact",
    title: "Contact and Data Protection Enquiries",
    paragraphs: [
      "For privacy enquiries, data subject requests, or concerns about how your information is handled, contact our Data Protection Office at privacy@sovereignnamibia.com.",
      "We aim to respond to all substantiated requests within 30 days, or within the period prescribed by applicable law, whichever is sooner.",
      "This Privacy Policy is reviewed periodically and updated to reflect changes in law, technology, and platform capabilities. Material changes will be communicated through the Platform.",
    ],
  },
];

export const TERMS_OF_USE: LegalSection[] = [
  {
    id: "preamble",
    title: "Preamble",
    paragraphs: [
      "These Terms of Use govern access to and use of Sovereign Namibia, the Republic of Namibia's sovereign digital identity and governance platform. By accessing or using this Platform, you agree to these Terms and affirm your commitment to lawful, respectful, and constitutionally aligned conduct.",
      "This Platform exists to protect national digital trust. It is not a commercial data marketplace. It is infrastructure for citizens, institutions, and the Republic.",
    ],
  },
  {
    id: "sovereignty",
    title: "Sovereign Data Principles",
    paragraphs: [
      "Personal data belongs to the individual citizen. Institutional records belong to the participating organisation that lawfully created them. Where applicable, data pertaining to public functions belongs to the Republic of Namibia, held in trust for its people.",
      "Sovereign Namibia does not monetise, sell, or commercialise citizen data under any circumstances.",
      "All processing occurs within the framework of the Constitution of Namibia, applicable statutes, and the principles of lawful, fair, and transparent administration.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility and Account Integrity",
    paragraphs: [
      "You must be a Namibian citizen or lawfully authorised representative to register for citizen identity services, or an authorised institutional user for administrative functions.",
      "You are responsible for the accuracy and lawfulness of all information you submit. False, misleading, or fraudulent submissions violate these Terms and may constitute offences under Namibian law.",
      "You must safeguard your credentials and notify us immediately of any unauthorised access to your account.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: ["You agree to use the Platform only for lawful purposes. The following conduct is strictly prohibited:"],
    list: [
      "Unauthorized scraping, crawling, extraction, or bulk harvesting of platform data",
      "Resale, redistribution, or commercial exploitation of any data obtained through the Platform",
      "Profiling, surveillance, or monitoring of citizens without lawful authority",
      "Replication or mirroring of platform content or services without written authorisation",
      "Attempting to circumvent authentication, encryption, or access controls",
      "Introducing malware, conducting denial-of-service attacks, or probing infrastructure",
      "Impersonating citizens, officials, or institutional representatives",
      "Using the Platform to facilitate fraud, identity theft, or any criminal activity",
    ],
  },
  {
    id: "enforcement",
    title: "Cybersecurity Enforcement and Suspension",
    paragraphs: [
      "Sovereign Namibia employs continuous abuse monitoring, rate limiting, audit logging, and anomaly detection to protect platform integrity.",
      "Violations of these Terms may result in immediate account suspension, revocation of access, and preservation of evidence for legal proceedings.",
      "We cooperate with lawful investigations by Namibian authorities and reserve the right to pursue civil and criminal remedies against persons who compromise platform security or citizen trust.",
      "Technical enforcement measures are applied proportionately and documented in accordance with administrative justice principles.",
    ],
  },
  {
    id: "government-services",
    title: "Government-Integrated Services",
    paragraphs: [
      "Services integrated with government functions operate under constitutional mandates and applicable statutory obligations, including duties of fairness, transparency, and accountability in public administration.",
      "Institutional users are bound by additional terms governing their access to citizen records, including purpose limitation, audit requirements, and confidentiality obligations.",
      "The Platform does not substitute for formal legal processes, judicial orders, or statutory decision-making procedures.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "All Platform software, design, documentation, trademarks, and proprietary systems are owned by or licensed to Sovereign Namibia and protected under Namibian and international intellectual property law.",
      "Citizens retain ownership of personal data and documents they submit. Submission grants Sovereign Namibia a limited licence to process data solely for verification, service delivery, and lawful platform operations.",
      "You may not copy, modify, reverse-engineer, or create derivative works from Platform software or content without express written permission.",
    ],
  },
  {
    id: "liability",
    title: "Limitations of Liability",
    paragraphs: [
      "The Platform is provided as sovereign public infrastructure. While we maintain enterprise-grade security and availability standards, no system is entirely immune from disruption.",
      "To the fullest extent permitted by Namibian law, Sovereign Namibia shall not be liable for indirect, incidental, or consequential damages arising from Platform use, except where liability cannot be excluded by law.",
      "Nothing in these Terms limits your constitutional rights or statutory remedies available under Namibian law.",
      "Service availability information is published at our System Status centre. Scheduled maintenance will be communicated in advance where practicable.",
    ],
  },
  {
    id: "amendments",
    title: "Amendments and Governing Law",
    paragraphs: [
      "These Terms may be updated to reflect changes in law, technology, or platform capabilities. Material changes will be communicated through the Platform with reasonable notice.",
      "Continued use after notification constitutes acceptance of updated Terms, except where your explicit consent is required by law.",
      "These Terms are governed by the laws of the Republic of Namibia. Disputes shall be subject to the jurisdiction of Namibian courts, without prejudice to your constitutional rights.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "For questions regarding these Terms, contact legal@sovereignnamibia.com or visit support.sovereignnamibia.com.",
    ],
  },
];

export const CITIZEN_RIGHTS_INTRO: LegalSection[] = [
  {
    id: "introduction",
    title: "Your Rights in the Digital Age",
    paragraphs: [
      "The Constitution of the Republic of Namibia is the supreme law of the land. Its protections extend into the digital realm — your dignity, privacy, equality, freedom of expression, and right to participate in public life do not diminish when you enter sovereign digital space.",
      "Sovereign Namibia is built to uphold these rights technologically and operationally. This page explains your constitutional protections in plain language and demonstrates how our platform safeguards them.",
    ],
  },
];

export const DIGITAL_RIGHTS: LegalSection[] = [
  {
    id: "dignity",
    title: "Dignity and Privacy",
    paragraphs: [
      "Article 8 guarantees your inherent dignity. Article 13 protects your privacy. Sovereign Namibia encrypts your data, restricts access to authorised personnel, and never sells your personal information.",
      "Directory searches return masked results — your full identity is never exposed to unauthorised parties through casual lookup.",
    ],
  },
  {
    id: "equality",
    title: "Equality and Non-Discrimination",
    paragraphs: [
      "Article 10 ensures equal treatment before the law. Our platform applies verification and access rules uniformly, without discrimination on grounds of race, sex, religion, ethnic origin, or social status.",
    ],
  },
  {
    id: "expression",
    title: "Freedom of Expression and Information",
    paragraphs: [
      "Article 21 protects freedom of speech and expression. While the Platform is not a forum for public discourse, it ensures you can access your own records and understand how your data is used — supporting your right to information about yourself.",
    ],
  },
  {
    id: "participation",
    title: "Participation and Association",
    paragraphs: [
      "Articles 21 and 22 protect your freedom to participate in public affairs and associate with others. Digital identity infrastructure enables you to engage with government services, verify your status, and participate in the digital economy with confidence.",
    ],
  },
  {
    id: "administration",
    title: "Lawful Administrative Conduct",
    paragraphs: [
      "Article 18 entitles you to fair and lawful administrative action. Every significant decision about your identity record includes audit trails, review pathways, and the right to request correction of errors.",
      "Administrative actions on the Platform are logged, time-stamped, and subject to oversight consistent with principles of administrative justice.",
    ],
  },
  {
    id: "platform-protections",
    title: "How Sovereign Namibia Protects Your Rights",
    paragraphs: [
      "Technologically: end-to-end encryption, role-based access control, multi-factor authentication, and continuous security monitoring.",
      "Operationally: data minimisation, purpose limitation, consent records, and incident response procedures aligned with constitutional values.",
      "Institutionally: audit trails, human review for significant decisions, and transparent privacy and terms documentation available to every citizen.",
    ],
  },
];

export function getLegalContent(slug: LegalSlug): LegalSection[] {
  switch (slug) {
    case "privacy":
      return PRIVACY_POLICY;
    case "terms":
      return TERMS_OF_USE;
    case "rights":
      return [...CITIZEN_RIGHTS_INTRO, ...DIGITAL_RIGHTS];
  }
}

export const LEGAL_SUMMARIES: Record<
  LegalSlug,
  { title: string; summary: string; highlights: string[] }
> = {
  privacy: {
    title: "Privacy Policy",
    summary:
      "Your data belongs to you. Sovereign Namibia never sells personal information and processes data only under constitutional and statutory authority.",
    highlights: [
      "Citizen data ownership guaranteed",
      "No sale or commercialisation of personal data",
      "Encrypted storage and strict access controls",
      "Transparent cross-border infrastructure disclosure",
    ],
  },
  terms: {
    title: "Terms of Use",
    summary:
      "Constitutionally aligned terms protecting national digital trust. Unauthorized data extraction, profiling, and platform misuse are prohibited.",
    highlights: [
      "Sovereign data principles",
      "Strict acceptable use enforcement",
      "Intellectual property protections",
      "Immediate suspension for abuse",
    ],
  },
  rights: {
    title: "Your Rights as a Namibian Citizen",
    summary:
      "Constitutional rights presented for the digital age — dignity, privacy, equality, and lawful administration upheld by sovereign infrastructure.",
    highlights: [
      "Searchable Constitution of Namibia",
      "Digital rights in plain English",
      "Platform protections explained",
      "Empowering, citizen-first design",
    ],
  },
};

