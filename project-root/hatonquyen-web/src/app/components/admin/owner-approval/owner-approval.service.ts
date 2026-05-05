import { requestJson } from '../../../services/api.service';

import type {
  ApproveOwnerApplicationPayload,
  OwnerApplicationFilters,
  OwnerApplicationListResponse,
  OwnerApplicationMutationResponse,
  RejectOwnerApplicationPayload,
} from './types';

const toQueryString = (filters: OwnerApplicationFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.riskLevel && filters.riskLevel !== 'all') params.set('riskLevel', filters.riskLevel);

  const query = params.toString();
  return query ? `?${query}` : '';
};

export async function fetchOwnerApplications(filters: OwnerApplicationFilters = {}): Promise<OwnerApplicationListResponse> {
  return requestJson<OwnerApplicationListResponse>(`/api/users/admin/owners/pending${toQueryString(filters)}`);
}

export async function approveOwnerApplication(applicationId: string, payload: ApproveOwnerApplicationPayload): Promise<OwnerApplicationMutationResponse> {
  return requestJson<OwnerApplicationMutationResponse>(`/api/users/admin/owners/${applicationId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function rejectOwnerApplication(applicationId: string, payload: RejectOwnerApplicationPayload): Promise<OwnerApplicationMutationResponse> {
  return requestJson<OwnerApplicationMutationResponse>(`/api/users/admin/owners/${applicationId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
