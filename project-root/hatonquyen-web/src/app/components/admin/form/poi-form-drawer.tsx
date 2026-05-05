import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, FileText, ImageIcon, MapPin, Navigation, X } from "lucide-react";
import { TextField } from "./text-field";
import { TextAreaField } from "./text-area-field";
import { NumberField } from "./number-field";
import { SelectField } from "./select-field";
import { ModalFooterActions } from "./modal-footer-actions";
import { LocationPickerCard } from "./location-picker-card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../../../../components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";

interface POIData {
  id?: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  lat: string;
  lng: string;
  geofenceRadius: string;
  audioPriority: string;
  isVisible: boolean;
  category: string;
}

const emptyPOI: POIData = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  images: [],
  lat: "",
  lng: "",
  geofenceRadius: "50",
  audioPriority: "",
  isVisible: true,
  category: "",
};

const editMockPOI: POIData = {
  id: "1",
  name: "Quán Dimsum Hải Ký",
  shortDescription: "Quán dimsum lâu đời nhất phố Hà Tôn Quyền, nổi tiếng với há cảo tôm và xíu mại thượng hạng từ năm 1975.",
  fullDescription: "Quán dimsum lâu đời nhất phố Hà Tôn Quyền, nổi tiếng với há cảo tôm và xíu mại thượng hạng từ năm 1975.",
  images: [],
  lat: "10.7553",
  lng: "106.6488",
  geofenceRadius: "80",
  audioPriority: "1",
  isVisible: true,
  category: "dimsum",
};

interface POIFormDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  categoryOptions?: Array<{ value: string; label: string; icon?: string }>;
  initialData?: Partial<POIData> | null;
  onSubmit?: (payload: {
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
  }) => Promise<void>;
}

type Errors = Partial<Record<keyof POIData, string>>;

export function POIFormDrawer({ open, onClose, mode, categoryOptions = [], initialData, onSubmit }: POIFormDrawerProps) {
  const [form, setForm] = useState<POIData>(mode === "edit" ? editMockPOI : emptyPOI);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setForm({
          ...emptyPOI,
          ...editMockPOI,
          ...initialData,
          images: Array.isArray(initialData.images) ? initialData.images : [],
          lat: String(initialData.lat ?? editMockPOI.lat),
          lng: String(initialData.lng ?? editMockPOI.lng),
          geofenceRadius: String(initialData.geofenceRadius ?? editMockPOI.geofenceRadius),
          audioPriority: String(initialData.audioPriority ?? editMockPOI.audioPriority),
        });
      } else {
        setForm(emptyPOI);
      }
      setErrors({});
      setIsSubmitting(false);
      setShowSuccess(false);
      setTouched(new Set());
    }
  }, [open, mode, initialData]);

  const updateField = useCallback(<K extends keyof POIData>(key: K, value: POIData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, [errors]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Tên địa điểm không được để trống";
    else if (form.name.length < 3) e.name = "Tên phải có ít nhất 3 ký tự";
    if (!form.shortDescription.trim()) e.shortDescription = "Mô tả ngắn không được để trống";
    else if (form.shortDescription.length > 200) e.shortDescription = "Mô tả không được vượt quá 200 ký tự";
    if (!form.lat.trim()) e.lat = "Vĩ độ không được để trống";
    else if (isNaN(Number(form.lat)) || Number(form.lat) < -90 || Number(form.lat) > 90) e.lat = "Vĩ độ không hợp lệ (-90 đến 90)";
    if (!form.lng.trim()) e.lng = "Kinh độ không được để trống";
    else if (isNaN(Number(form.lng)) || Number(form.lng) < -180 || Number(form.lng) > 180) e.lng = "Kinh độ không hợp lệ (-180 đến 180)";
    if (!form.geofenceRadius.trim()) e.geofenceRadius = "Bán kính không được để trống";
    else if (Number(form.geofenceRadius) < 10 || Number(form.geofenceRadius) > 500) e.geofenceRadius = "Bán kính phải từ 10m đến 500m";
    if (!form.category) e.category = "Vui lòng chọn danh mục";
    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          id: form.id,
          name: form.name.trim(),
          shortDescription: form.shortDescription.trim(),
          fullDescription: form.fullDescription.trim() || form.shortDescription.trim(),
          images: form.images,
          lat: Number(form.lat),
          lng: Number(form.lng),
          geofenceRadius: Number(form.geofenceRadius),
          audioPriority: Number(form.audioPriority || 0),
          status: form.isVisible ? "active" : "hidden",
          category: form.category,
        });
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const isCreate = mode === "create";
  const hasErrors = Object.keys(errors).length > 0;

  const handleUploadImage = async (file: File | null) => {
    if (!file) return;

    const authSession = localStorage.getItem("authSession");
    let accessToken = localStorage.getItem("accessToken");
    if (authSession) {
      try {
        accessToken = JSON.parse(authSession)?.accessToken || accessToken;
      } catch {
        accessToken = accessToken || null;
      }
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: "include",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || "Không thể upload ảnh");
    }

    const uploadedUrl = data?.data?.url;
    if (uploadedUrl) {
      setForm((prev) => ({ ...prev, images: [...prev.images, uploadedUrl] }));
    }
  };

  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next && !isSubmitting) onClose(); }} direction="right">
      <DrawerContent className="h-full w-full max-w-[720px] gap-0 overflow-hidden border-l border-border bg-card p-0 shadow-2xl sm:max-w-[720px]">
        {showSuccess && (
          <div className="absolute inset-0 z-10 bg-card/95 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2D5A3D]/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#2D5A3D]" />
            </div>
            <p className="text-[16px] text-foreground">
              {isCreate ? "Tạo địa điểm thành công!" : "Cập nhật thành công!"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">{form.name}</p>
          </div>
        )}

        <DrawerHeader className="flex-row items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCreate
                ? "bg-primary/10 text-primary"
                : "bg-[#C9A84C]/10 text-[#C9A84C]"
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DrawerTitle className="text-[16px] font-normal text-foreground">
                  {isCreate ? "Thêm địa điểm mới" : "Chi tiết địa điểm"}
                </DrawerTitle>
                <Badge variant="outline" className="rounded-full border-border bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {isCreate ? "Tạo mới" : "Chỉnh sửa"}
                </Badge>
              </div>
              <DrawerDescription className="mt-0.5 text-[12px]">
                {isCreate ? "Tạo POI mới trên bản đồ ẩm thực" : `Đang sửa: ${form.name || editMockPOI.name}`}
              </DrawerDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DrawerHeader>

        <div className={`h-[2px] shrink-0 ${isCreate ? "bg-primary" : "bg-[#C9A84C]"}`} />

        <Tabs defaultValue="basic" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 border-b border-border bg-secondary/10 px-6 py-3">
            <TabsList className="grid h-10 w-full grid-cols-3 rounded-lg">
              <TabsTrigger value="basic" className="rounded-md text-[12px]">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="location" className="rounded-md text-[12px]">Vị trí & Bản đồ</TabsTrigger>
              <TabsTrigger value="content" className="rounded-md text-[12px]">Nội dung</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <Card className="gap-0 rounded-lg">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-[14px] font-normal">
                    <MapPin className="h-4 w-4 text-primary" />
                    Thông tin cơ bản
                  </CardTitle>
                  <CardDescription className="text-[12px]">Tên, danh mục và trạng thái hiển thị của POI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-4">
                  <TextField
                    label="Tên địa điểm"
                    value={form.name}
                    onChange={(v) => updateField("name", v)}
                    placeholder="VD: Quán Dimsum Hải Ký"
                    required
                    error={errors.name}
                    success={touched.has("name") && form.name.length >= 3 && !errors.name ? "Hợp lệ" : undefined}
                  />
                  <SelectField
                    label="Danh mục"
                    options={categoryOptions}
                    value={form.category}
                    onChange={(v) => updateField("category", v)}
                    placeholder="Chọn danh mục ẩm thực"
                    required
                    error={errors.category}
                  />
                  <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-input-background p-3.5">
                    <div>
                      <p className="text-[13px] text-foreground">Trạng thái</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {form.isVisible ? "Đang hiển thị trên bản đồ công khai" : "Đang ẩn khỏi bản đồ công khai"}
                      </p>
                    </div>
                    <Switch checked={form.isVisible} onCheckedChange={(v) => updateField("isVisible", v)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-0 space-y-4">
              <Card className="gap-0 rounded-lg">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-[14px] font-normal">
                    <Navigation className="h-4 w-4 text-primary" />
                    Vị trí & Bản đồ
                  </CardTitle>
                  <CardDescription className="text-[12px]">Tọa độ, bán kính nhận diện và vùng địa chỉ của địa điểm.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-4">
                  <div className="rounded-lg border border-border bg-secondary/20 px-3.5 py-3">
                    <p className="text-[12px] text-muted-foreground">Địa chỉ chi tiết</p>
                    <p className="mt-1 text-[13px] text-foreground">{form.name ? `${form.name}, phố Hà Tôn Quyền, Quận 11, TP.HCM` : "Phố Hà Tôn Quyền, Quận 11, TP.HCM"}</p>
                  </div>
                  <LocationPickerCard
                    lat={form.lat}
                    lng={form.lng}
                    onLatChange={(v) => updateField("lat", v)}
                    onLngChange={(v) => updateField("lng", v)}
                    latError={errors.lat}
                    lngError={errors.lng}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <NumberField
                      label="Bán kính Geofence"
                      value={form.geofenceRadius}
                      onChange={(v) => updateField("geofenceRadius", v)}
                      placeholder="50"
                      required
                      min={10}
                      max={500}
                      suffix="mét"
                      error={errors.geofenceRadius}
                      helpText="Khoảng cách kích hoạt thuyết minh tự động (10-500m)"
                    />
                    <NumberField
                      label="Thứ tự ưu tiên Audio"
                      value={form.audioPriority}
                      onChange={(v) => updateField("audioPriority", v)}
                      placeholder="VD: 1"
                      min={0}
                      max={99}
                      helpText="Số nhỏ hơn được phát trước khi nhiều POI giao nhau."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-0 space-y-4">
              <Card className="gap-0 rounded-lg">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-[14px] font-normal">
                    <FileText className="h-4 w-4 text-primary" />
                    Nội dung
                  </CardTitle>
                  <CardDescription className="text-[12px]">Ảnh cover, mô tả ngắn và nội dung bài viết.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-4">
                  <div>
                    <label className="flex items-center gap-1 text-[13px] text-foreground mb-1.5">Ảnh cover</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-4 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/40">
                      <ImageIcon className="h-4 w-4" />
                      Chọn ảnh từ máy tính
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          void handleUploadImage(file).catch(() => undefined);
                          event.currentTarget.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                    {form.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {form.images.map((image, index) => (
                          <div key={`${image}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
                            <div className="flex min-w-0 items-center gap-2">
                              <img src={image} alt={`poi-${index}`} className="h-12 w-16 shrink-0 rounded-md border border-border object-cover" />
                              <span className="truncate pr-2">{image}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                              className="text-destructive hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <TextAreaField
                    label="Mô tả ngắn"
                    value={form.shortDescription}
                    onChange={(v) => updateField("shortDescription", v)}
                    placeholder="Mô tả ngắn gọn về địa điểm, đặc trưng ẩm thực..."
                    required
                    maxLength={200}
                    error={errors.shortDescription}
                    helpText="Hiển thị trên thẻ bản đồ và kết quả tìm kiếm"
                  />
                  <TextAreaField
                    label="Nội dung bài viết"
                    value={form.fullDescription}
                    onChange={(v) => updateField("fullDescription", v)}
                    placeholder="Mô tả chi tiết cho trang nội dung địa điểm"
                    rows={7}
                    helpText="Nếu để trống, hệ thống sẽ dùng Mô tả ngắn"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DrawerFooter className="shrink-0 px-6 pb-5 pt-0">
          {hasErrors && (
            <p className="mb-1 text-[12px] text-destructive">Vui lòng kiểm tra các trường đang báo lỗi trước khi lưu.</p>
          )}
          <ModalFooterActions
            onCancel={onClose}
            onSubmit={handleSubmit}
            submitLabel={isCreate ? "Tạo địa điểm" : "Cập nhật"}
            isSubmitting={isSubmitting}
            isDisabled={isSubmitting}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
