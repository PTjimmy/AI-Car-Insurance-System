/**
 * Typed API client for the InsureAI FastAPI backend.
 * All requests go to /api/v1/... via the Vite proxy (see vite.config.ts).
 */

const BASE = "/api/v1";

// ---------------------------------------------------------------------------
// Types mirroring backend Pydantic schemas
// ---------------------------------------------------------------------------

export type UserRole = "CUSTOMER" | "CLAIM_OFFICER" | "ADMIN";
export type ClaimStatus =
  | "Pending"
  | "Under Review"
  | "Evidence Requested"
  | "Approved"
  | "Rejected";

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  role: UserRole;
  full_name: string;
}

export interface CustomerProfile {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string | null;
  created_at: string;
  status: string;
}

export interface OfficerProfile {
  officer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
}

export interface Vehicle {
  vehicle_id: number;
  customer_id: number;
  registration_number: string;
  make: string;
  model: string;
  manufacturing_year: number;
  vehicle_value: number;
  created_at: string;
}

export interface PolicyType {
  policy_type_id: number;
  /** Policy code from RAG document: P001–P006 */
  policy_code: string | null;
  policy_name: string;
  /**
   * annual_premium is NULL for P001-P006 prototype policies.
   * The RAG Policy Knowledge Base document does not specify annual premiums.
   * Display as "Not specified in prototype" when null — never show ₹0.
   */
  annual_premium: number | null;
  coverage_limit: number;
  /** Per-severity coverage percentages (business rule — from policy_type DB row) */
  minor_coverage_pct: number | null;
  moderate_coverage_pct: number | null;
  severe_coverage_pct: number | null;
  /** Deductible amount in ₹ (business rule) */
  deductible: number | null;
  /** Maximum claim payable in ₹ (business rule) */
  max_claim: number | null;
  description: string | null;
  is_active: boolean;
  /** Coverage names included in this plan (for display on Buy Policy page) */
  coverages?: string[];
}

export interface Policy {
  policy_id: number;
  policy_number: string;
  vehicle_id: number;
  policy_type_id: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  policy_type: PolicyType | null;
  vehicle: Vehicle | null;
}

/**
 * AIAnalysis — field labelling mirrors backend separation.
 *
 * AI prediction fields (produced by ViT model):
 *   damage_severity, confidence_score, model_version, analyzed_at
 *
 * Business-rule calculation fields (produced by claim_estimator.py):
 *   coverage_pct_applied, deductible_applied, estimated_claim_amount
 *
 * Image strategy: is_primary_image = true for the FIRST uploaded image
 *   which is the one analysed by ViT. Subsequent images are stored as
 *   supporting evidence and are NOT re-analysed (Option B).
 *
 * Removed from this interface (legacy, no longer populated):
 *   estimated_repair_cost — was a hard-coded business rule, not AI output
 *   risk_level            — removed (no documented rule)
 *   fraud_score           — removed (no fraud model)
 */
export interface AIAnalysis {
  analysis_id: number;
  claim_id: number;

  /** AI prediction — ViT damage severity classification */
  damage_severity: string | null;
  /** AI prediction — softmax confidence (0.0–1.0) */
  confidence_score: number | null;

  /** Business rule — coverage % selected for this severity from policy */
  coverage_pct_applied: number | null;
  /** Business rule — deductible amount subtracted (₹) */
  deductible_applied: number | null;
  /** Business rule — final estimated claim amount after calculation (₹) */
  estimated_claim_amount: number | null;

  /** True for the primary (first) image; always true per claim (Option B) */
  is_primary_image: boolean;
  model_version: string | null;
  analyzed_at: string;
}

export interface ClaimImage {
  image_id: number;
  claim_id: number;
  file_path: string;
  image_type: string;
  uploaded_at: string;
}

export interface ClaimHistoryEntry {
  history_id: number;
  claim_id: number;
  officer_id: number;
  status: ClaimStatus;
  remarks: string | null;
  changed_at: string;
}

export interface Claim {
  claim_id: number;
  claim_number: string;
  policy_id: number;
  assigned_officer_id: number | null;
  accident_date: string;
  claim_date: string;
  claim_type: string;
  location: string | null;
  description: string;
  claimed_amount: number;
  approved_amount: number | null;
  status: ClaimStatus;
  decision_remarks: string | null;
  created_at: string;
  images: ClaimImage[];
  ai_analysis: AIAnalysis | null;
  history: ClaimHistoryEntry[];
  policy: Policy | null;
}

export interface AdminStats {
  total_users: number;
  total_customers: number;
  total_officers: number;
  total_claims: number;
  claims_by_status: Record<ClaimStatus | string, number>;
  ai_assessments_completed: number;
  average_confidence: number;
}

export interface AdminUser {
  user_id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  customer_id: number | null;
  officer_id: number | null;
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body != null
        ? JSON.stringify(body)
        : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") {
        // Standard FastAPI error: { "detail": "Some message" }
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        // Pydantic validation error: { "detail": [{ "msg": "...", "loc": [...] }] }
        message = data.detail
          .map((e: { msg?: string; loc?: string[] }) => {
            const field = e.loc?.slice(1).join(" → ") ?? "";
            const msg = e.msg?.replace(/^Value error,\s*/i, "") ?? "Invalid value";
            return field ? `${field}: ${msg}` : msg;
          })
          .join(". ");
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);
const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
const postForm = <T>(path: string, form: FormData) =>
  request<T>("POST", path, form, true);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
  }) => post<{ message: string; email: string; requires_verification: boolean }>(
    "/auth/register", data
  ),

  verifyEmail: (email: string, code: string) =>
    post<AuthToken>("/auth/verify-email", { email, code }),

  resendVerification: (email: string) =>
    post<{ message: string }>("/auth/resend-verification", { email }),

  /** Step 1 of login 2FA — validates password, sends code, does NOT return a JWT */
  login: (email: string, password: string) =>
    post<{ requires_verification: boolean; email: string; message: string }>(
      "/auth/login", { email, password }
    ),

  /** Step 2 of login 2FA — validates code, returns the real JWT */
  verifyLogin: (email: string, code: string) =>
    post<AuthToken>("/auth/verify-login", { email, code }),

  resendLoginCode: (email: string) =>
    post<{ message: string }>("/auth/resend-login-code", { email }),
};

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export const customerApi = {
  getProfile: () => get<CustomerProfile>("/customer/profile"),
  updateProfile: (data: Partial<CustomerProfile>) =>
    put<CustomerProfile>("/customer/profile", data),

  getVehicles: () => get<Vehicle[]>("/customer/vehicles"),
  createVehicle: (data: Omit<Vehicle, "vehicle_id" | "customer_id" | "created_at">) =>
    post<Vehicle>("/customer/vehicles", data),

  getPolicyTypes: () => get<PolicyType[]>("/customer/policy-types"),
  getPolicies: () => get<Policy[]>("/customer/policies"),
  purchasePolicy: (data: {
    vehicle_id: number;
    policy_type_id: number;
    start_date: string;
    end_date: string;
  }) => post<Policy>("/customer/policies", data),

  getClaims: () => get<Claim[]>("/customer/claims"),
  getClaim: (id: number) => get<Claim>(`/customer/claims/${id}`),
  submitClaim: (data: {
    policy_id: number;
    accident_date: string;
    claim_type: string;
    location?: string;
    description: string;
    claimed_amount: number;
  }) => post<Claim>("/customer/claims", data),

  uploadImage: (claimId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return postForm<ClaimImage>(`/customer/claims/${claimId}/images`, form);
  },
};

// ---------------------------------------------------------------------------
// Officer
// ---------------------------------------------------------------------------

export const officerApi = {
  getClaims: () => get<Claim[]>("/officer/claims"),
  getClaim: (id: number) => get<Claim>(`/officer/claims/${id}`),
  updateStatus: (
    id: number,
    data: { status: ClaimStatus; remarks?: string; approved_amount?: number }
  ) => put<Claim>(`/officer/claims/${id}/status`, data),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  getStats: () => get<AdminStats>("/admin/stats"),
  getUsers: () => get<AdminUser[]>("/admin/users"),
  getUser: (id: number) => get<AdminUser>(`/admin/users/${id}`),
  deactivateUser: (id: number) => put<AdminUser>(`/admin/users/${id}/deactivate`, {}),
  activateUser: (id: number) => put<AdminUser>(`/admin/users/${id}/activate`, {}),
  deleteUser: (id: number) => request<void>("DELETE", `/admin/users/${id}`),

  getClaims: () => get<Claim[]>("/admin/claims"),
  getClaim: (id: number) => get<Claim>(`/admin/claims/${id}`),
  assignOfficer: (claimId: number, officerId: number) =>
    post<Claim>(`/admin/claims/${claimId}/assign`, { officer_id: officerId }),

  getOfficers: () => get<OfficerProfile[]>("/admin/officers"),
  createOfficer: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
  }) => post<OfficerProfile>("/admin/officers", data),
};

// Image URL helper — authenticated image served by backend
// Uses ?token= query param so browser <img> tags can display images
// without needing to set Authorization headers.
export function imageUrl(filename: string): string {
  const name = filename.split("/").pop() ?? filename;
  const token = localStorage.getItem("access_token") ?? "";
  return `${BASE}/images/${name}?token=${encodeURIComponent(token)}`;
}

export { ApiError };
