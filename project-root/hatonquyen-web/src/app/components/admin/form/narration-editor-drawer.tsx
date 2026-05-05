import { useState, useEffect, useCallback } from "react";
import { X, Mic, CheckCircle2, Type, FileText, AlignLeft, Info, ImageIcon } from "lucide-react";
import { TextField } from "./text-field";
import { TextAreaField } from "./text-area-field";
import { SelectField } from "./select-field";
import { ModalFooterActions } from "./modal-footer-actions";
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
import { Badge } from "../../../../components/ui/badge";
import { Textarea } from "../../../../components/ui/textarea";

interface NarrationData {
  id?: string;
  title: string;
  script: string;
  shortText: string;
  fullText: string;
  images: string[];
  language: string;
  status: string;
  poiId: string;
}

const emptyNarration: NarrationData = {
  title: "",
  script: "",
  shortText: "",
  fullText: "",
  images: [],
  language: "vi",
  status: "draft",
  poiId: "",
};

const editMockNarration: NarrationData = {
  id: "1",
  title: "Câu chuyện Dimsum Hải Ký – Di sản ẩm thực 50 năm",
  script: "Bạn đang đứng trước Quán Dimsum Hải Ký, một trong những tiệm dimsum lâu đời nhất của phố Hà Tôn Quyền. Được thành lập từ năm 1975 bởi gia đình gốc Quảng Đông, quán đã trải qua ba thế hệ và vẫn giữ nguyên công thức há cảo tôm trứ danh.",
  shortText: "Khám phá câu chuyện 50 năm của tiệm dimsum lâu đời nhất phố Hà Tôn Quyền.",
  fullText: "Quán Dimsum Hải Ký được thành lập năm 1975 bởi ông Trần Văn Hải, một đầu bếp gốc Quảng Đông. Ông mang theo công thức há cảo gia truyền từ quê nhà, kết hợp với nguyên liệu tươi ngon Sài Gòn để tạo nên hương vị độc đáo.\n\nQua ba thế hệ, quán vẫn duy trì phương pháp nhồi nhân thủ công và hấp bằng xửng tre truyền thống. Mỗi buổi sáng, hơn 500 chiếc há cảo được chuẩn bị từ 4h sáng để phục vụ thực khách.\n\nĐặc biệt, xíu mại Hải Ký được báo Tuổi Trẻ bình chọn là một trong 10 món ăn đường phố ngon nhất Sài Gòn năm 2023.",
  images: ["https://images.smartfoodtour.vn/narrations/hai-ky-cover.jpg", "https://images.smartfoodtour.vn/narrations/hai-ky-steamer.jpg"],
  language: "vi",
  status: "active",
  poiId: "poi-1",
};

const languageOptions = [
  { value: "vi", label: "Tiếng Việt", icon: "🇻🇳" },
  { value: "zh", label: "中文 (Trung Quốc)", icon: "🇨🇳" },
  { value: "en", label: "English", icon: "🇬🇧" },
  { value: "ja", label: "日本語 (Nhật)", icon: "🇯🇵" },
  { value: "fr", label: "Français (Pháp)", icon: "🇫🇷" },
];

const statusOptions = [
  { value: "draft", label: "Bản nháp", icon: "📝" },
  { value: "active", label: "Đã xuất bản", icon: "✅" },
  { value: "pending", label: "Chờ duyệt", icon: "⏳" },
  { value: "archived", label: "Lưu trữ", icon: "📦" },
];

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

type Errors = Partial<Record<keyof NarrationData, string>>;

interface NarrationEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: Partial<NarrationData> | null;
  poiOptions?: SelectOption[];
  onSubmit?: (payload: {
    id?: string;
    title: string;
    script: string;
    shortText: string;
    fullText: string;
    images: string[];
    language: string;
    status: string;
    poiId: string;
  }) => Promise<void>;
}

export function NarrationEditorDrawer({ open, onClose, mode, initialData, poiOptions = [], onSubmit }: NarrationEditorDrawerProps) {
  const [form, setForm] = useState<NarrationData>(mode === "edit" ? editMockNarration : emptyNarration);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setForm({
          ...emptyNarration,
          ...editMockNarration,
          ...initialData,
          images: Array.isArray(initialData.images) ? initialData.images : [],
        });
      } else {
        setForm(mode === "edit" ? editMockNarration : emptyNarration);
      }
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setShowSuccess(false);
      setTouched(new Set());
    }
  }, [open, mode, initialData]);

  const updateField = useCallback(<K extends keyof NarrationData>(key: K, value: NarrationData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    setTouched((prev) => new Set(prev).add(key));
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, [errors]);

  const buildSubmissionForm = (): NarrationData => {
    const selectedPoi = poiOptions.find((item) => item.value === form.poiId) || poiOptions[0];
    const fallbackTitle = selectedPoi?.label
      ? `${selectedPoi.label} · Thuyết minh`
      : "Thuyết minh mới";
    const title = form.title.trim() || fallbackTitle;
    const baseText =
      form.script.trim() ||
      form.fullText.trim() ||
      form.shortText.trim() ||
      title;
    const fallbackShortText =
      baseText.length > 157 ? `${baseText.slice(0, 157).trim()}...` : baseText;

    return {
      ...form,
      title,
      script: baseText,
      shortText: form.shortText.trim() || fallbackShortText,
      fullText: form.fullText.trim() || baseText,
      poiId: form.poiId || selectedPoi?.value || "",
    };
  };

  const validate = (candidate: NarrationData): Errors => {
    const e: Errors = {};
    if (poiOptions.length === 0) e.poiId = "Chưa tải được danh sách địa điểm";
    else if (!candidate.poiId) e.poiId = "Vui lòng chọn địa điểm liên quan";
    return e;
  };

  const handleSubmit = async () => {
    const submissionForm = buildSubmissionForm();
    const validationErrors = validate(submissionForm);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          id: submissionForm.id,
          title: submissionForm.title.trim(),
          script: submissionForm.script.trim(),
          shortText: submissionForm.shortText.trim(),
          fullText: submissionForm.fullText.trim(),
          images: submissionForm.images,
          language: submissionForm.language,
          status: submissionForm.status,
          poiId: submissionForm.poiId,
        });
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Không thể lưu thuyết minh");
    }
  };

  if (!open) return null;

  const isCreate = mode === "create";

  // Word count helper
  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = (text: string) => Math.max(1, Math.ceil(wordCount(text) / 150));

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
      throw new Error(data?.message || "Không thể upload ảnh narration");
    }

    const uploadedUrl = data?.data?.url;
    if (uploadedUrl) {
      setForm((prev) => ({ ...prev, images: [...prev.images, uploadedUrl] }));
    }
  };

  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next && !isSubmitting) onClose(); }} direction="right">
      <DrawerContent className="h-full w-full max-w-[760px] gap-0 overflow-hidden border-l border-border bg-card p-0 shadow-2xl sm:max-w-[760px]">
        {showSuccess && (
          <div className="absolute inset-0 z-10 bg-card/95 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2D5A3D]/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#2D5A3D]" />
            </div>
            <p className="text-[16px] text-foreground">
              {isCreate ? "Tạo thuyết minh thành công!" : "Cập nhật thành công!"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">{form.title}</p>
          </div>
        )}

        <DrawerHeader className="flex-row items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCreate ? "bg-primary/10 text-primary" : "bg-[#C9A84C]/10 text-[#C9A84C]"
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DrawerTitle className="text-[16px] font-normal text-foreground">
                  {isCreate ? "Thêm thuyết minh mới" : "Chi tiết thuyết minh"}
                </DrawerTitle>
                <Badge variant="outline" className="rounded-full border-border bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {isCreate ? "Tạo mới" : "Chỉnh sửa"}
                </Badge>
              </div>
              <DrawerDescription className="mt-0.5 max-w-[520px] truncate text-[12px]">
                {isCreate ? "Soạn nội dung cho audio tour" : `Đang sửa: ${form.title || editMockNarration.title}`}
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

        <Tabs defaultValue="script" className="min-h-0 flex-1 gap-0">
          <div className="shrink-0 border-b border-border bg-secondary/10 px-6 py-3">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg">
              <TabsTrigger value="script" className="rounded-md text-[12px]">Kịch bản</TabsTrigger>
              <TabsTrigger value="display" className="rounded-md text-[12px]">Thông tin hiển thị</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="script" className="mt-0 space-y-4">
              <Card className="gap-0 rounded-lg">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-[14px] font-normal">
                    <Mic className="h-4 w-4 text-primary" />
                    Kịch bản thuyết minh
                  </CardTitle>
                  <CardDescription className="text-[12px]">Metadata và nội dung dành cho AI đọc.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-4">
                  <TextField
                    label="Tiêu đề"
                    value={form.title}
                    onChange={(v) => updateField("title", v)}
                    placeholder="VD: Câu chuyện Dimsum Hải Ký - Di sản ẩm thực 50 năm"
                    required
                    error={errors.title}
                    success={touched.has("title") && form.title.length >= 5 && !errors.title ? "Hợp lệ" : undefined}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Ngôn ngữ"
                      options={languageOptions}
                      value={form.language}
                      onChange={(v) => updateField("language", v)}
                      placeholder="Chọn ngôn ngữ"
                      required
                      error={errors.language}
                    />
                    <SelectField
                      label="Trạng thái duyệt"
                      options={statusOptions}
                      value={form.status}
                      onChange={(v) => updateField("status", v)}
                      placeholder="Chọn trạng thái"
                    />
                  </div>
                  <SelectField
                    label="Địa điểm gắn kèm"
                    options={poiOptions}
                    value={form.poiId}
                    onChange={(v) => updateField("poiId", v)}
                    placeholder="Chọn địa điểm"
                    required
                    error={errors.poiId}
                    disabled={poiOptions.length === 0}
                    helpText={
                      poiOptions.length === 0
                        ? "Đang tải danh sách địa điểm từ hệ thống"
                        : "Thuyết minh sẽ được kích hoạt khi người dùng đến gần POI này"
                    }
                  />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1 text-[13px] text-foreground">
                        Kịch bản thuyết minh <span className="text-destructive">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        {form.script.trim().length > 0 && (
                          <span className="text-[11px] text-muted-foreground">~{readingTime(form.script)} phút đọc</span>
                        )}
                        <span className={`text-[11px] ${form.script.length > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
                          {form.script.length}/2000
                        </span>
                      </div>
                    </div>
                    <Textarea
                      value={form.script}
                      onChange={(e) => updateField("script", e.target.value)}
                      rows={12}
                      placeholder="Viết kịch bản thuyết minh audio ở đây..."
                      className={`min-h-[280px] resize-y text-[13px] leading-relaxed ${
                        errors.script ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus-visible:ring-destructive/50" : ""
                      }`}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                      <div className="flex items-center gap-1 rounded bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Type className="h-3 w-3" /> {wordCount(form.script)} từ
                      </div>
                      <div className="flex items-center gap-1 rounded bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Mic className="h-3 w-3" /> ~{readingTime(form.script)} phút audio
                      </div>
                      {form.script.length >= 50 && !errors.script && (
                        <div className="flex items-center gap-1 rounded bg-[#2D5A3D]/8 px-2 py-0.5 text-[10px] text-[#2D5A3D]">
                          <CheckCircle2 className="h-3 w-3" /> Đủ độ dài
                        </div>
                      )}
                    </div>
                    {errors.script && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-destructive">
                        <Info className="h-3.5 w-3.5 shrink-0" /> {errors.script}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="mt-0 space-y-4">
              <Card className="gap-0 rounded-lg">
                <CardHeader className="px-4 pt-4">
                  <CardTitle className="flex items-center gap-2 text-[14px] font-normal">
                    <FileText className="h-4 w-4 text-primary" />
                    Thông tin hiển thị
                  </CardTitle>
                  <CardDescription className="text-[12px]">Ảnh minh họa, mô tả ngắn và transcript cho người dùng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 pt-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[13px] text-foreground">Ảnh minh họa</label>
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
                              <img src={image} alt={`narration-${index}`} className="h-12 w-16 shrink-0 rounded-md border border-border object-cover" />
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
                    {errors.images && <p className="mt-1.5 text-[12px] text-destructive">{errors.images}</p>}
                  </div>
                  <TextAreaField
                    label="Mô tả ngắn"
                    value={form.shortText}
                    onChange={(v) => updateField("shortText", v)}
                    placeholder="Tóm tắt ngắn gọn nội dung thuyết minh..."
                    required
                    maxLength={160}
                    rows={3}
                    error={errors.shortText}
                    helpText="Hiển thị trên thẻ preview và push notification"
                  />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1 text-[13px] text-foreground">
                        Nội dung bản ghi chép <span className="text-destructive">*</span>
                      </label>
                      <span className={`text-[11px] ${form.fullText.length > 5000 ? "text-destructive" : "text-muted-foreground"}`}>
                        {form.fullText.length} ký tự
                      </span>
                    </div>
                    <Textarea
                      value={form.fullText}
                      onChange={(e) => updateField("fullText", e.target.value)}
                      rows={10}
                      placeholder="Viết transcript hiển thị cho người dùng..."
                      className={`min-h-[220px] resize-y text-[13px] leading-relaxed ${
                        errors.fullText ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus-visible:ring-destructive/50" : ""
                      }`}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                      <div className="flex items-center gap-1 rounded bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <FileText className="h-3 w-3" /> {form.fullText.split("\n").filter(Boolean).length} đoạn
                      </div>
                      <div className="flex items-center gap-1 rounded bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <AlignLeft className="h-3 w-3" /> {wordCount(form.fullText)} từ
                      </div>
                    </div>
                    {errors.fullText && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-destructive">
                        <Info className="h-3.5 w-3.5 shrink-0" /> {errors.fullText}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DrawerFooter className="shrink-0 px-6 pb-5 pt-0">
          {submitError && (
            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
              {submitError}
            </div>
          )}
          <ModalFooterActions
            onCancel={onClose}
            onSubmit={handleSubmit}
            submitLabel={isCreate ? "Tạo thuyết minh" : "Cập nhật"}
            isSubmitting={isSubmitting}
            isDisabled={isSubmitting}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
