import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapPin,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { CircleMarker, MapContainer, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PageHeader } from "../shared/page-header";
import { SearchInput } from "../shared/search-input";
import { FilterDropdown, type FilterOption } from "../shared/filter-dropdown";
import { StatusBadge } from "../shared/status-badge";
import { RowActionMenu } from "../shared/row-action-menu";
import { PrimaryActionButton } from "../shared/primary-action-button";
import { DeleteConfirmDialog } from "../shared/delete-confirm-dialog";
import { BaseMapTileLayer } from "../shared/base-map-tile-layer";
import { POIFormDrawer } from "../form/poi-form-drawer";
import { createPlace, deletePlace, fetchPlaceById, fetchPlaceCategories, fetchPlaces, updatePlace, type PlaceAdminItem } from "./place-admin.service";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";

type POIStatus = "active" | "inactive" | "pending" | "draft";

interface POI {
  id: string;
  name: string;
  address: string;
  fullDescription?: string;
  images?: string[];
  lat?: number;
  lng?: number;
  geofenceRadius?: number;
  categoryId?: string;
  category: string;
  categoryIcon: string;
  status: POIStatus;
  owner: string;
  audioPriority: number;
  hasGeofence: boolean;
  updatedAt: string;
}

const ROWS_PER_PAGE = 8;
const DEFAULT_MAP_CENTER: [number, number] = [10.758, 106.6527];
const ORANGE_DOT = "#F97316";
const ORANGE_DOT_BORDER = "#C2410C";

type MappedPOI = POI & { lat: number; lng: number };

const mapPOI = (item: PlaceAdminItem): POI => ({
  id: item.id,
  name: item.name,
  address: item.shortDescription || "—",
  fullDescription: item.fullDescription,
  images: item.images || [],
  lat: item.lat,
  lng: item.lng,
  geofenceRadius: item.geofenceRadius,
  categoryId: item.category?.id,
  category: item.category?.name || "Khác",
  categoryIcon: "📍",
  status: item.status === "hidden" ? "inactive" : (item.status as POIStatus),
  owner: item.ownerProfileId ? `Owner #${item.ownerProfileId.slice(-4)}` : "Admin",
  audioPriority: item.audioPriority || 0,
  hasGeofence: Boolean(item.geofenceRadius),
  updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "-",
});

const isMappedPOI = (poi: POI): poi is MappedPOI =>
  Number.isFinite(poi.lat) && Number.isFinite(poi.lng);

function PlacesMapBounds({ places }: { places: MappedPOI[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, 16, { animate: false });
      return;
    }

    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 17, { animate: false });
      return;
    }

    map.fitBounds(
      places.map((place) => [place.lat, place.lng] as [number, number]),
      { animate: false, maxZoom: 17, padding: [32, 32] }
    );
  }, [map, places]);

  return null;
}

function PlacesLocationMap({
  places,
  isLoading,
}: {
  places: POI[];
  isLoading: boolean;
}) {
  const mappedPlaces = useMemo(() => places.filter(isMappedPOI), [places]);
  const center = mappedPlaces[0]
    ? ([mappedPlaces[0].lat, mappedPlaces[0].lng] as [number, number])
    : DEFAULT_MAP_CENTER;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] text-foreground">Bản đồ vị trí quán</p>
            <p className="text-[11px] text-muted-foreground">
              {mappedPlaces.length} điểm có tọa độ
            </p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] text-orange-700">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Chấm cam là quán
        </div>
      </div>

      <div className="relative h-[360px] w-full bg-secondary/30">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải bản đồ địa điểm...
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={16}
            className="h-full w-full"
            scrollWheelZoom
          >
            <BaseMapTileLayer />
            <PlacesMapBounds places={mappedPlaces} />
            {mappedPlaces.map((place) => (
              <CircleMarker
                key={place.id}
                center={[place.lat, place.lng]}
                radius={7}
                pathOptions={{
                  color: ORANGE_DOT_BORDER,
                  fillColor: ORANGE_DOT,
                  fillOpacity: 0.9,
                  opacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="text-[13px] font-medium text-foreground">{place.name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{place.address}</p>
                    <p className="mt-2 text-[11px] text-orange-700">
                      {place.category} · {place.status === "active" ? "Hiển thị" : "Đã ẩn"}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export function ManagePlacesPage() {
  const loadRequestRef = useRef(0);
  const [places, setPlaces] = useState<POI[]>([]);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [drawerCategoryOptions, setDrawerCategoryOptions] = useState<Array<{ value: string; label: string; icon?: string }>>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<POI | null>(null);
  const [editingPlace, setEditingPlace] = useState<POI | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [sortField, setSortField] = useState<"name" | "audioPriority" | "updatedAt">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const loadPlaces = async () => {
    const requestId = ++loadRequestRef.current;
    setRequestState("loading");
    setRequestError(null);

    try {
      const [placesResponse, categoriesResponse] = await Promise.all([fetchPlaces(), fetchPlaceCategories()]);
      if (requestId !== loadRequestRef.current) {
        return;
      }
      setPlaces((placesResponse.data || []).map(mapPOI));
      setDrawerCategoryOptions((categoriesResponse.data || []).map((item) => ({ value: item.id, label: item.name, icon: "📍" })));
      setRequestState("success");
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      setRequestState("error");
      setRequestError(error instanceof Error ? error.message : "Không thể tải danh sách địa điểm");
    }
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const statusFilters: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "Tất cả", count: places.length },
      { value: "active", label: "Hiển thị", count: places.filter((p) => p.status === "active").length },
      { value: "pending", label: "Chờ duyệt", count: places.filter((p) => p.status === "pending").length },
      { value: "draft", label: "Bản nháp", count: places.filter((p) => p.status === "draft").length },
      { value: "inactive", label: "Đã ẩn", count: places.filter((p) => p.status === "inactive").length },
    ],
    [places]
  );

  const categoryFilters: FilterOption[] = useMemo(() => {
    const values = Array.from(new Set(places.map((p) => p.category))).filter(Boolean);
    return [{ value: "all", label: "Tất cả" }, ...values.map((value) => ({ value, label: value }))];
  }, [places]);

  const filtered = useMemo(() => {
    let result = places;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (categoryFilter !== "all") result = result.filter((p) => p.category === categoryFilter);

    result = [...result].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return result;
  }, [categoryFilter, places, search, sortDir, sortField, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasActiveFilters = search.length > 0 || statusFilter !== "all" || categoryFilter !== "all";
  const isNoResults = hasActiveFilters && filtered.length === 0;

  const openCreate = () => {
    setFormMode("create");
    setEditingPlace(null);
    setFormOpen(true);
  };

  const handleView = async (poi: POI) => {
    try {
      const response = await fetchPlaceById(poi.id);
      setEditingPlace(mapPOI(response.data));
      setFormMode("edit");
      setFormOpen(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Không thể tải chi tiết địa điểm");
    }
  };

  const handleEdit = async (poi: POI) => {
    try {
      const response = await fetchPlaceById(poi.id);
      setEditingPlace(mapPOI(response.data));
      setFormMode("edit");
      setFormOpen(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Không thể mở chỉnh sửa địa điểm");
    }
  };

  const handleSubmitPlace = async (payload: {
    id?: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    images: string[];
    lat: number;
    lng: number;
    geofenceRadius: number;
    audioPriority: number;
    status: string;
    category: string;
  }) => {
    const normalizedPayload = {
      name: payload.name,
      shortDescription: payload.shortDescription,
      fullDescription: payload.fullDescription,
      images: payload.images,
      lat: Number.parseFloat(String(payload.lat)),
      lng: Number.parseFloat(String(payload.lng)),
      geofenceRadius: Number.parseInt(String(payload.geofenceRadius), 10) || 50,
      audioPriority: Number.parseInt(String(payload.audioPriority), 10) || 0,
      isVisible: payload.status !== "hidden",
      status: payload.status,
      category: payload.category,
    };

    if (formMode === "edit" && payload.id) {
      const response = await updatePlace(payload.id, normalizedPayload);

      const mapped = mapPOI(response.data);
      setPlaces((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      return;
    }

    const response = await createPlace(normalizedPayload);

    setPlaces((prev) => [mapPOI(response.data), ...prev]);
  };

  const handleDelete = async (poi: POI) => {
    try {
      await deletePlace(poi.id);
      setPlaces((prev) => prev.filter((item) => item.id !== poi.id));
      setDeleteTarget(null);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Không thể xóa địa điểm");
    }
  };

  const handleToggleVisibility = async (poi: POI, checked: boolean) => {
    const previous = poi;
    const nextStatus: POIStatus = checked ? "active" : "inactive";

    setStatusUpdatingId(poi.id);
    setPlaces((prev) => prev.map((item) => (item.id === poi.id ? { ...item, status: nextStatus } : item)));

    try {
      const response = await fetchPlaceById(poi.id);
      const detail = response.data;
      const updateResponse = await updatePlace(poi.id, {
        name: detail.name || poi.name,
        shortDescription: detail.shortDescription || poi.address || poi.name,
        fullDescription: detail.fullDescription || poi.fullDescription || detail.shortDescription || poi.address || poi.name,
        images: detail.images || poi.images || [],
        lat: Number(detail.lat ?? poi.lat ?? 0),
        lng: Number(detail.lng ?? poi.lng ?? 0),
        geofenceRadius: Number(detail.geofenceRadius ?? poi.geofenceRadius ?? 50),
        audioPriority: Number(detail.audioPriority ?? poi.audioPriority ?? 0),
        isVisible: checked,
        status: checked ? "active" : "hidden",
        category: detail.category?.id || poi.categoryId || "",
      });

      const mapped = mapPOI(updateResponse.data);
      setPlaces((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
    } catch (error) {
      setPlaces((prev) => prev.map((item) => (item.id === previous.id ? previous : item)));
      setRequestError(error instanceof Error ? error.message : "Không thể cập nhật trạng thái địa điểm");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Địa điểm" subtitle={`${places.length} địa điểm trên phố Hà Tôn Quyền`} action={<PrimaryActionButton label="Thêm địa điểm" onClick={openCreate} />} />

      {requestState === "error" && requestError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{requestError}</div>
      )}

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm tên, mô tả, chủ sở hữu..." />
          <div className="flex items-center gap-2 flex-wrap">
            <FilterDropdown label="Danh mục" options={categoryFilters} value={categoryFilter} onChange={(v) => { setCategoryFilter(v); setPage(1); }} />
            <FilterDropdown label="Trạng thái" options={statusFilters} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
          </div>
          <div className="lg:ml-auto">
            <Badge variant="outline" className="rounded-full border-border bg-secondary/40 px-3 py-1 text-[11px] text-muted-foreground">
              {filtered.length} kết quả
            </Badge>
          </div>
        </div>
      </div>

      <PlacesLocationMap places={filtered} isLoading={requestState === "loading"} />

      <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="w-[92px] px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">Ảnh</TableHead>
              <TableHead className="min-w-[280px] px-4 py-3">
                <button onClick={() => handleSort("name")} className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                  Tên địa điểm <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">Danh mục</TableHead>
              <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
              <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => handleSort("updatedAt")} className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                  Cập nhật <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="w-14 px-4 py-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
              {requestState === "loading" ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu địa điểm...
                    </div>
                  </TableCell>
                </TableRow>
              ) : isNoResults ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[14px] text-foreground mb-1">Không tìm thấy kết quả</p>
                      <p className="text-[12px] text-muted-foreground mb-4">Không có địa điểm nào khớp với bộ lọc hiện tại</p>
                      <button onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }} className="text-[12px] text-primary hover:underline">Xóa bộ lọc</button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                        <Utensils className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-[14px] text-foreground mb-1">Chưa có địa điểm nào</p>
                      <p className="text-[12px] text-muted-foreground mb-4">Bắt đầu thêm địa điểm ẩm thực đầu tiên</p>
                      <PrimaryActionButton label="Thêm địa điểm đầu tiên" onClick={openCreate} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((poi) => (
                  <TableRow key={poi.id} className="hover:bg-secondary/30">
                    <TableCell className="px-4 py-3">
                      <Avatar className="h-12 w-12 rounded-lg border border-border bg-secondary/40">
                        {poi.images?.[0] ? (
                          <AvatarImage src={poi.images[0]} alt={poi.name} className="rounded-lg object-cover" />
                        ) : (
                          <AvatarFallback className="rounded-lg text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="max-w-[360px] truncate text-[13px] text-foreground">{poi.name}</p>
                        <p className="mt-0.5 max-w-[360px] truncate text-[11px] text-muted-foreground">{poi.address}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="rounded-full border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-foreground">
                        {poi.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={poi.status === "active"}
                          disabled={statusUpdatingId === poi.id}
                          onCheckedChange={(checked) => void handleToggleVisibility(poi, checked)}
                          aria-label={`Cập nhật trạng thái ${poi.name}`}
                        />
                        <StatusBadge variant={poi.status as any} />
                        {statusUpdatingId === poi.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3"><span className="text-[12px] text-muted-foreground">{poi.updatedAt}</span></TableCell>
                    <TableCell className="px-4 py-3">
                      <RowActionMenu
                        onView={() => void handleView(poi)}
                        onEdit={() => void handleEdit(poi)}
                        onDelete={() => setDeleteTarget(poi)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
            <p className="text-[12px] text-muted-foreground">Hiển thị {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} trong {filtered.length} kết quả</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] transition-colors ${p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget)}
        title={`Xóa "${deleteTarget?.name}"?`}
        description={`Địa điểm "${deleteTarget?.name}" tại ${deleteTarget?.address} sẽ bị xóa vĩnh viễn khỏi hệ thống. Thao tác này không thể hoàn tác.`}
      />

      <POIFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        mode={formMode}
        categoryOptions={drawerCategoryOptions}
        initialData={
          editingPlace
            ? {
                id: editingPlace.id,
                name: editingPlace.name,
                shortDescription: editingPlace.address,
                fullDescription: editingPlace.fullDescription,
                images: editingPlace.images || [],
                lat: String(editingPlace.lat ?? ""),
                lng: String(editingPlace.lng ?? ""),
                geofenceRadius: String(editingPlace.geofenceRadius ?? "50"),
                audioPriority: String(editingPlace.audioPriority ?? "0"),
                category: editingPlace.categoryId,
                isVisible: editingPlace.status !== "inactive",
              }
            : null
        }
        onSubmit={handleSubmitPlace}
      />
    </div>
  );
}
