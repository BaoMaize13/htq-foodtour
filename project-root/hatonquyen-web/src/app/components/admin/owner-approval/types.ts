export type OwnerStatus = "pending" | "approved" | "rejected";
export type RiskLevel = "standard" | "attention";
export type ViewState = "default" | "loading" | "empty";
export type ReviewActionType = "approve" | "reject";
export type OwnerDocumentType = "business_license" | "citizen_id" | "frontage_photo" | "tax_code";
export type OwnerDocumentStatus = "submitted" | "missing";

export interface OwnerDocumentRecord {
  id: string;
  label: string;
  type: OwnerDocumentType;
  status: OwnerDocumentStatus;
}

export interface OwnerContactRecord {
  fullName: string;
  email: string;
}

export interface OwnerBusinessRecord {
  name: string;
  address: string;
  cuisine: string;
}

export interface OwnerReviewRecord {
  riskLevel: RiskLevel;
  completenessScore: number;
  coverageLabel: string;
  adminNote: string;
  rejectionReason?: string;
  reviewerName?: string;
  lastActionAt?: string;
}

export interface OwnerApplication {
  id: string;
  owner: OwnerContactRecord;
  business: OwnerBusinessRecord;
  submittedAt: string;
  submittedLabel: string;
  status: OwnerStatus;
  documents: OwnerDocumentRecord[];
  review: OwnerReviewRecord;
}

export interface OwnerApplicationFilters {
  query?: string;
  status?: OwnerStatus | "all";
  riskLevel?: RiskLevel | "all";
}

export interface OwnerApplicationListMeta {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsAttention: number;
  approvedToday: number;
}

export interface OwnerApplicationListResponse {
  data: OwnerApplication[];
  meta: OwnerApplicationListMeta;
}

export interface ApproveOwnerApplicationPayload {
  reviewerId: string;
  reviewerName: string;
  note?: string;
}

export interface RejectOwnerApplicationPayload {
  reviewerId: string;
  reviewerName: string;
  reason: string;
}

export interface OwnerApplicationMutationResponse {
  application: OwnerApplication;
  meta: OwnerApplicationListMeta;
}

export interface OwnerActionInFlight {
  ownerId: string;
  action: ReviewActionType;
}
