import { requestJson } from '../../../services/api.service';

import type {
  ApproveContentPayload,
  ContentApprovalFilters,
  ContentApprovalListResponse,
  ContentModerationMutationResponse,
  RejectContentPayload,
  RevisionRequestPayload,
} from './types';

const toQueryString = (filters: ContentApprovalFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.language && filters.language !== 'all') params.set('language', filters.language);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export async function fetchContentSubmissions(filters: ContentApprovalFilters = {}): Promise<ContentApprovalListResponse> {
  return requestJson<ContentApprovalListResponse>(`/api/narrations/admin/content/pending${toQueryString(filters)}`);
}

export async function approveContentSubmission(submissionId: string, payload: ApproveContentPayload): Promise<ContentModerationMutationResponse> {
  return requestJson<ContentModerationMutationResponse>(`/api/narrations/admin/content/${submissionId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestRevisionForContent(submissionId: string, payload: RevisionRequestPayload): Promise<ContentModerationMutationResponse> {
  return requestJson<ContentModerationMutationResponse>(`/api/narrations/admin/content/${submissionId}/revision`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function rejectContentSubmission(submissionId: string, payload: RejectContentPayload): Promise<ContentModerationMutationResponse> {
  return requestJson<ContentModerationMutationResponse>(`/api/narrations/admin/content/${submissionId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
