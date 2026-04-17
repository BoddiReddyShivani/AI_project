const suspiciousRules = [
  {
    label: "Upfront payment request",
    weight: 28,
    patterns: [/\bregistration fee\b/i, /\bsecurity deposit\b/i, /\bpay .*?(training|processing|interview)\b/i, /\bapplication fee\b/i, /\bpay now\b/i],
    advice: "Legitimate employers usually do not ask candidates to pay to get hired."
  },
  {
    label: "Too-good-to-be-true salary",
    weight: 18,
    patterns: [/earn\s*(₹|rs\.?|inr|\$)?\s*\d+.*per\s*(day|week)/i, /guaranteed income/i, /easy money/i, /instant joining bonus/i],
    advice: "Very high rewards with very little effort are a common fraud pattern."
  },
  {
    label: "No experience with urgent hiring pressure",
    weight: 12,
    patterns: [/no experience/i, /immediate joining/i, /urgent hiring/i, /limited seats/i, /apply today only/i],
    advice: "Pressure-based hiring language can be used to rush victims into payment or disclosure."
  },
  {
    label: "Personal email domain",
    weight: 18,
    patterns: [/@[\w.-]+\.(gmail|yahoo|outlook|hotmail)\.com/i],
    advice: "Recruitment from free email services is not always fake, but it deserves extra verification."
  },
  {
    label: "Sensitive data request",
    weight: 14,
    patterns: [/aadhaar/i, /pan card/i, /bank details/i, /otp/i, /cvv/i, /upi pin/i],
    advice: "Never share financial or highly sensitive identity details before verifying the employer."
  },
  {
    label: "Remote/chat-only communication",
    weight: 8,
    patterns: [/telegram/i, /whatsapp only/i, /dm me/i, /text recruiter/i],
    advice: "Scammers often avoid official company communication channels."
  },
  {
    label: "Interview bypass or guaranteed selection",
    weight: 10,
    patterns: [/no interview/i, /guaranteed job/i, /100% selection/i, /direct offer letter/i],
    advice: "Promises of guaranteed selection are usually a warning sign."
  }
];

function extractSignals(text) {
  return suspiciousRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => ({
      label: rule.label,
      weight: rule.weight,
      advice: rule.advice
    }));
}

function getRiskLevel(score) {
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function generateSafetyChecklist(text) {
  const checklist = [
    "Verify the recruiter email against the company’s official domain.",
    "Check whether the company has an official careers page.",
    "Do not pay registration, training, or security fees.",
    "Avoid sharing OTP, bank credentials, CVV, or PIN.",
    "Ask for a written offer and official HR contact details."
  ];

  if (/remote/i.test(text)) {
    checklist.push("Request a video interview or official calendar invite before proceeding.");
  }

  if (/internship|fresher/i.test(text)) {
    checklist.push("Cross-check internship postings on the company website or LinkedIn page.");
  }

  return checklist;
}

function analyzeJobText(jobText) {
  const text = jobText.trim();
  const normalized = text.toLowerCase();
  const signals = extractSignals(normalized);
  const rawScore = signals.reduce((sum, item) => sum + item.weight, 0);
  const riskScore = Math.min(rawScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  const confidence = riskScore >= 65 ? "Strong signal match" : riskScore >= 35 ? "Moderate signal match" : "Limited suspicious signals";

  const reasons = signals.length
    ? signals.map((item) => item.label)
    : ["No major scam indicators were detected in the provided text."];

  return {
    riskScore,
    riskLevel,
    confidence,
    reasons,
    matchedSignals: signals,
    safetyChecklist: generateSafetyChecklist(text),
    summary:
      riskLevel === "High"
        ? "This posting has several strong scam indicators. Verify carefully before taking any action."
        : riskLevel === "Medium"
          ? "This posting shows some suspicious patterns and should be cross-checked before proceeding."
          : "This posting does not show many direct scam signals, but you should still verify the employer and recruiter."
  };
}

module.exports = { analyzeJobText };
