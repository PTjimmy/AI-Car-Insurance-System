export type ClaimStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Evidence Requested";

export type Claim = {
  number: string;
  customer: string;
  policy: string;
  type: string;
  submitted: string;
  incidentDate: string;
  location: string;

  severity: "Low" | "Moderate" | "High";
  confidence: number;
  repairCost: number;

  status: ClaimStatus;

  aiFindings: string;
};

/*
 * INSUREAI SHARED CLAIM DATA
 *
 * This is currently prototype data.
 * All customer, officer and admin pages should use
 * this same source instead of creating separate claim
 * arrays inside each page.
 */

export const claims: Claim[] = [
  {
    number: "CLM-2026-00142",

    customer: "InsureAI User",

    policy: "INS-MTR-2026-00124",

    type: "Vehicle Damage",

    submitted: "18 August 2026",

    incidentDate: "17 August 2026",

    location: "Vadodara, Gujarat",

    severity: "Moderate",

    confidence: 91,

    repairCost: 85000,

    status: "Pending",

    aiFindings:
      "The submitted vehicle images indicate visible damage to the front bumper and right-side body panel. The AI estimates the damage as moderate and recommends further inspection before repair approval.",
  },

  {
    number: "CLM-2026-00098",

    customer: "InsureAI User",

    policy: "INS-MTR-2026-00124",

    type: "Minor Accident",

    submitted: "04 July 2026",

    incidentDate: "03 July 2026",

    location: "Vadodara, Gujarat",

    severity: "Low",

    confidence: 96,

    repairCost: 32500,

    status: "Approved",

    aiFindings:
      "The submitted vehicle evidence indicates minor damage. The AI classified the damage as low severity and estimated the repair cost at ₹32,500.",
  },
];

/*
 * Helper functions
 */

export const getClaimByNumber = (
  claimNumber: string
): Claim | undefined => {
  return claims.find(
    (claim) => claim.number === claimNumber
  );
};

export const getPendingClaims = (): Claim[] => {
  return claims.filter(
    (claim) => claim.status === "Pending"
  );
};

export const getApprovedClaims = (): Claim[] => {
  return claims.filter(
    (claim) => claim.status === "Approved"
  );
};

export const getRejectedClaims = (): Claim[] => {
  return claims.filter(
    (claim) => claim.status === "Rejected"
  );
};

export const getEvidenceRequestedClaims = (): Claim[] => {
  return claims.filter(
    (claim) => claim.status === "Evidence Requested"
  );
};