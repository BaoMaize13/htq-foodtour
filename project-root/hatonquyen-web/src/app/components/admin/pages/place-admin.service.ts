import { requestJson } from '../../../services/api.service';

export interface PlaceAdminItem {
  id: string;
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  geofenceRadius?: number;
  audioPriority: number;
  isVisible?: boolean;
  status: string;
  category?: { id: string; name: string } | null;
  ownerProfileId?: string | null;
  updatedAt?: string;
}

export interface PlaceCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface PlaceMutationPayload {
  name: string;
  shortDescription: string;
  fullDescription: string;
  images?: string[];
  lat: number;
  lng: number;
  geofenceRadius: number;
  audioPriority?: number;
  isVisible?: boolean;
  status?: string;
  category: string;
}

export interface PlaceAdminListResponse {
  data: PlaceAdminItem[];
  meta?: {
    total: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

export const fetchPlaces = () => requestJson<PlaceAdminListResponse>('/api/places?limit=100');
export const fetchPlaceById = (id: string) => requestJson<{ data: PlaceAdminItem }>(`/api/places/${id}`);
export const deletePlace = (id: string) => requestJson<{ message: string }>(`/api/places/${id}`, { method: 'DELETE' });
export const createPlace = (payload: PlaceMutationPayload) => requestJson<{ data: PlaceAdminItem }>('/api/places', { method: 'POST', body: JSON.stringify(payload) });
export const updatePlace = (id: string, payload: PlaceMutationPayload) => requestJson<{ data: PlaceAdminItem }>(`/api/places/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const fetchPlaceCategories = () => requestJson<{ data: PlaceCategoryOption[] }>('/api/places/categories');
