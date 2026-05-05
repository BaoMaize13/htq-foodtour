import { requestJson } from '../../../services/api.service';

export const fetchAdminMenus = () => requestJson('/api/admin/menus');
export const fetchAdminDashboardSummary = () => requestJson('/api/admin/dashboard/summary');
export const fetchAnalyticsLiveCount = () => requestJson('/api/analytics/live-count');
export const fetchAnalyticsUsersGrowth = (groupBy: 'day' | 'month' = 'month') => requestJson(`/api/analytics/users-growth?groupBy=${groupBy}`);
export const updateAdminMenuStatus = (id: string, status: 'active' | 'hidden') => requestJson(`/api/admin/menus/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteAdminMenu = (id: string) => requestJson(`/api/admin/menus/${id}`, { method: 'DELETE' });

export const fetchAdminReviews = () => requestJson('/api/admin/reviews');
export const updateAdminReviewStatus = (id: string, status: 'published' | 'hidden') => requestJson(`/api/admin/reviews/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteAdminReview = (id: string) => requestJson(`/api/admin/reviews/${id}`, { method: 'DELETE' });

export const fetchAdminActiveOwners = () => requestJson('/api/admin/owners/active');
export const toggleAdminOwnerSuspend = (id: string) => requestJson(`/api/admin/owners/${id}/suspend`, { method: 'PUT' });

export const fetchAdminUsers = () => requestJson('/api/admin/users');
export const updateAdminUserRole = (id: string, role: 'admin' | 'moderator' | 'editor' | 'user' | 'owner') => requestJson(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const updateAdminUserStatus = (id: string, status: 'active' | 'suspended') => requestJson(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const fetchAdminAudioTasks = () => requestJson('/api/admin/audio-tasks');

export const fetchAdminAuditLogs = () => requestJson<{ data: Array<{ id: string; adminUser: string; action: string; targetId: string; timestamp: string }> }>('/api/admin/audit-logs');
