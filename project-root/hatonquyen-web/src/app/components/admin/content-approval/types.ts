import type { Language } from "../shared/language-badge";

export type ContentModerationStatus =
  | "pending"
  | "approved"
  | "revision_requested"
  | "rejected";

export type ContentActionType = "approve" | "revision" | "reject";
export type ContentViewState = "default" | "loading" | "empty";
export type ContentPreviewTab = "shortText" | "fullText" | "script";

export interface SubmittedByRecord {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
}

export interface RelatedPOIRecord {
  id: string;
  name: string;
  icon: string;
}

export interface ContentBodyRecord {
  shortText: string;
  fullText: string;
  script: string;
}

export interface ContentModerationRecord {
  qualityScore: number;
  reviewerName?: string;
  lastReviewedAt?: string;
  note: string;
  revisionMessage?: string;
  rejectedReason?: string;
}

export interface ContentSubmission {
  id: string;
  title: string;
  language: Language;
  relatedPOI: RelatedPOIRecord;
  submittedBy: SubmittedByRecord;
  submittedAt: string;
  submittedLabel: string;
  status: ContentModerationStatus;
  wordCount: number;
  contentType: "story" | "script" | "overview";
  body: ContentBodyRecord;
  moderation: ContentModerationRecord;
}

export interface ContentApprovalListMeta {
  total: number;
  pending: number;
  approved: number;
  revisionRequested: number;
  rejected: number;
  readyToApprove: number;
}

export interface ContentApprovalListResponse {
  data: ContentSubmission[];
  meta: ContentApprovalListMeta;
}

export interface ContentApprovalFilters {
  query?: string;
  status?: ContentModerationStatus | "all";
  language?: Language | "all";
}

export interface ApproveContentPayload {
  reviewerId: string;
  reviewerName: string;
  note?: string;
}

export interface RevisionRequestPayload {
  reviewerId: string;
  reviewerName: string;
  message: string;
}

export interface RejectContentPayload {
  reviewerId: string;
  reviewerName: string;
  reason: string;
}

export interface ContentModerationMutationResponse {
  submission: ContentSubmission;
  meta: ContentApprovalListMeta;
}

export interface ContentActionInFlight {
  submissionId: string;
  action: ContentActionType;
}
