import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio,
  Gauge,
  Loader2,
  Play,
  RotateCcw,
  Settings2,
  Square,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { LanguageBadge, type Language } from "../shared/language-badge";
import { generateNarrationAudio, previewNarrationAudio, requestJson } from "../../../services/api.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

type TaskStatus = "idle" | "queued" | "processing" | "completed" | "failed";
type ButtonVisualState = "default" | "loading" | "disabled";

interface AudioTask {
  jobId?: string;
  lang: Language;
  status: TaskStatus;
  progress: number;
  duration?: string;
  fileSize?: string;
  audioUrl?: string;
  error?: string;
}

type BackendQueueStatus = "draft" | "pending" | "approved" | "revision_requested" | "rejected";

interface AudioBatchJob {
  id: string;
  narrationId: string;
  title: string;
  language: string;
  status: string;
  createdAt: string;
}

const allLangs: Language[] = ["vi", "en", "zh", "ja", "fr"];

const languageMeta: Record<Language, { label: string; helper: string }> = {
  vi: { label: "Tiếng Việt", helper: "Bản gốc ưu tiên" },
  en: { label: "English", helper: "Khách quốc tế" },
  zh: { label: "中文", helper: "Khách Hoa ngữ" },
  ja: { label: "日本語", helper: "Khách Nhật" },
  fr: { label: "Français", helper: "Khách Pháp ngữ" },
};

const defaultVoiceIds: Record<Language, string> = {
  vi: "vi-f1",
  en: "en-f1",
  zh: "zh-f1",
  ja: "ja-f1",
  fr: "fr-f1",
};

const speedOptions = [
  { id: "0.92", label: "Chậm", helper: "Rõ từng câu" },
  { id: "1.03", label: "Tiêu chuẩn", helper: "Tự nhiên" },
  { id: "1.14", label: "Nhanh", helper: "Tour ngắn" },
];

const statusTone: Record<TaskStatus, { label: string; className: string; icon: ReactNode }> = {
  idle: {
    label: "Ready",
    className: "bg-secondary text-muted-foreground border-border",
    icon: null,
  },
  queued: {
    label: "Queued",
    className: "bg-[#C9A84C]/8 text-[#A8890A] border-[#C9A84C]/15",
    icon: <Clock3 className="w-3 h-3" />,
  },
  processing: {
    label: "Processing",
    className: "bg-primary/8 text-primary border-primary/15",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    className: "bg-[#2D5A3D]/8 text-[#2D5A3D] border-[#2D5A3D]/15",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/8 text-destructive border-destructive/15",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const queueEligibleStatuses = new Set<BackendQueueStatus>(["draft", "pending", "approved", "revision_requested", "rejected"]);

const resolveQueueStatus = (status?: string | null): BackendQueueStatus => {
  if (!status) return "approved";
  if (queueEligibleStatuses.has(status as BackendQueueStatus)) {
    return status as BackendQueueStatus;
  }
  if (status === "pending_approval") {
    return "pending";
  }
  if (status === "published") {
    return "approved";
  }
  return "approved";
};

const toLanguageCode = (value?: string | null): Language | null => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.startsWith("vi")) return "vi";
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("fr")) return "fr";
  return null;
};

const mapJobStatus = (status: string): TaskStatus => {
  if (status === "processing") return "processing";
  if (status === "completed") return "completed";
  if (status === "failed" || status === "cancelled") return "failed";
  return "queued";
};

const mapJobProgress = (status: string): number => {
  if (status === "completed" || status === "failed" || status === "cancelled") return 100;
  if (status === "processing") return 55;
  return 100;
};

function createWaveHeights(length: number) {
  return Array.from({ length }, (_, index) => Math.max(20, Math.round(Math.sin(index * 0.42) * 36 + 48)));
}

export function ProcessingStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusTone[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

export function ResultStateRow({
  title,
  meta,
  tone = "neutral",
  trailing,
}: {
  title: string;
  meta: string;
  tone?: "neutral" | "success" | "danger";
  trailing?: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-[#2D5A3D]/15 bg-[#2D5A3D]/5"
      : tone === "danger"
        ? "border-destructive/15 bg-destructive/5"
        : "border-border bg-input-background";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${toneClass}`}>
      <div className="min-w-0">
        <p className="truncate text-[12px] text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
      </div>
      {trailing}
    </div>
  );
}

export function RetryAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/15 bg-destructive/10 px-3 py-1.5 text-[12px] text-destructive transition-colors hover:bg-destructive/15"
    >
      <RotateCcw className="h-3 w-3" />
      Thử lại
    </button>
  );
}

export function GenerateAudioButton({
  state,
  count,
  onClick,
}: {
  state: ButtonVisualState;
  count: number;
  onClick?: () => void;
}) {
  const disabled = state === "disabled" || state === "loading";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] transition-all shadow-sm ${
        state === "disabled"
          ? "cursor-not-allowed bg-primary/40 text-primary-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      <span>{state === "loading" ? "Đang tạo..." : "Tạo âm thanh"}</span>
      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-inherit">{count}</span>
    </button>
  );
}

export function LanguageSelector({
  selected,
  disabled,
  onChange,
}: {
  selected: Set<Language>;
  disabled: boolean;
  onChange: (langs: Set<Language>) => void;
}) {
  const toggle = (lang: Language) => {
    if (disabled) return;
    const next = new Set(selected);
    next.has(lang) ? next.delete(lang) : next.add(lang);
    onChange(next);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(selected.size === allLangs.length ? new Set() : new Set(allLangs));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-foreground">Chọn ngôn ngữ cần tạo audio</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Mỗi ngôn ngữ sẽ dùng cấu hình giọng đọc riêng bên dưới.
          </p>
        </div>
        <button
          onClick={selectAll}
          disabled={disabled}
          className="text-[11px] text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected.size === allLangs.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {allLangs.map((lang) => {
          const isSelected = selected.has(lang);
          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              disabled={disabled}
              className={`rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                disabled
                  ? "cursor-not-allowed opacity-55"
                  : isSelected
                    ? "border-primary bg-primary/6 shadow-sm"
                    : "border-border bg-card hover:border-primary/20 hover:bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <LanguageBadge lang={lang} compact />
                  <p className={`mt-2 text-[12px] ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {languageMeta[lang].label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{languageMeta[lang].helper}</p>
                </div>
                <div
                  className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected.size === 0 && (
        <p className="text-[11px] text-muted-foreground">Chọn ít nhất một ngôn ngữ để bật nút Generate Audio.</p>
      )}
    </div>
  );
}

export function AudioTaskCard({
  task,
  speed,
  onSpeedChange,
  onRetry,
  onCancel,
  onUploadAudio,
  onPreview,
  isPlaying,
  isPreviewLoading,
  locked,
}: {
  task: AudioTask;
  speed: string;
  onSpeedChange: (value: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  onUploadAudio: (file: File | null) => void;
  onPreview: () => void;
  isPlaying: boolean;
  isPreviewLoading: boolean;
  locked: boolean;
}) {
  const selectedSpeed = speedOptions.find((item) => item.id === speed) || speedOptions[1];
  const waveHeights = useMemo(() => createWaveHeights(36), []);

  const cardTone =
    task.status === "completed"
      ? "border-[#2D5A3D]/20 bg-[#2D5A3D]/[0.03]"
      : task.status === "failed"
        ? "border-destructive/20 bg-destructive/[0.03]"
        : task.status === "processing"
          ? "border-primary/20 bg-primary/[0.03]"
          : task.status === "queued"
            ? "border-[#C9A84C]/20 bg-[#C9A84C]/[0.04]"
            : "border-border bg-card";

  return (
    <div className={`rounded-2xl border ${cardTone}`}>
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <LanguageBadge lang={task.lang} />
            <div className="min-w-0">
              <p className="text-[13px] text-foreground">{languageMeta[task.lang].label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{languageMeta[task.lang].helper}</p>
            </div>
          </div>
        </div>
        <ProcessingStatusBadge status={task.status} />
      </div>

      {(task.status === "processing" || task.status === "queued") && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                task.status === "processing" ? "bg-primary" : "bg-[#C9A84C]/50"
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              {task.status === "processing" ? "Đang tổng hợp giọng đọc và cân chỉnh âm lượng..." : "Đang chờ tới lượt xử lý..."}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] ${task.status === "processing" ? "text-primary" : "text-[#A8890A]"}`}>{task.progress}%</span>
              {task.status === "processing" && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
                  aria-label={`Huỷ tác vụ ${task.lang}`}
                >
                  <Square className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {task.status === "idle" && (
        <div className="space-y-3 px-4 pb-4">
          <div className="rounded-xl border border-border bg-input-background p-3">
            <div className="mb-3 flex items-center gap-2 text-[12px] text-foreground">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              Cấu hình AI
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">Tốc độ đọc</label>
                <Select value={speed} onValueChange={onSpeedChange} disabled={locked}>
                  <SelectTrigger className="h-9 rounded-lg bg-card text-[12px]">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedSpeed.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {speedOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <span className="flex items-center gap-2">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          {option.label}
                          <span className="text-[10px] text-muted-foreground">{option.helper}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ResultStateRow
            title="Sẵn sàng tạo audio"
            meta="Điều chỉnh tốc độ nếu cần rồi tạo âm thanh."
            trailing={
              <button
                type="button"
                onClick={onPreview}
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 ${
                  isPlaying ? "animate-pulse" : ""
                }`}
                aria-label={`Nghe thử giọng ${task.lang}`}
              >
                {isPreviewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
              </button>
            }
          />
        </div>
      )}

      {task.status === "completed" && (
        <div className="space-y-3 px-4 pb-4">
          {task.audioUrl ? (
            <div className="rounded-2xl border border-[#2D5A3D]/15 bg-[#2D5A3D]/5 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-foreground">audio_{task.lang}.mp3</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{task.duration} · {task.fileSize}</p>
                </div>
                <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#2D5A3D]/15 text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/6">
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      onUploadAudio(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Download className="h-3.5 w-3.5" />
                </label>
              </div>
              <audio controls src={task.audioUrl} className="h-9 w-full" />
            </div>
          ) : (
            <ResultStateRow
              title={`audio_${task.lang}.mp3`}
              meta={`${task.duration} · ${task.fileSize} · sẵn sàng`}
              tone="success"
              trailing={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPreview}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D5A3D] text-white transition-colors hover:bg-[#2D5A3D]/90 ${
                      isPlaying ? "animate-pulse" : ""
                    }`}
                  >
                    {isPreviewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
                  </button>
                  <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#2D5A3D]/15 text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/6">
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        onUploadAudio(file);
                        event.currentTarget.value = "";
                      }}
                    />
                    <Download className="h-3.5 w-3.5" />
                  </label>
                </div>
              }
            />
          )}

          <div className="flex h-6 items-center gap-[2px] px-1">
            {waveHeights.map((height, index) => (
              <div key={index} className="flex-1 rounded-full bg-[#2D5A3D]/20" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      )}

      {task.status === "failed" && (
        <div className="space-y-3 px-4 pb-4">
          <ResultStateRow
            title="Không thể hoàn tất job này"
            meta={task.error || "Có lỗi khi tạo audio. Vui lòng thử lại sau."}
            tone="danger"
            trailing={<AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] leading-5 text-muted-foreground">
              Retry chỉ áp dụng cho ngôn ngữ đang lỗi và không ảnh hưởng các audio đã completed.
            </p>
            <RetryAction onClick={onRetry} />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBanner({
  completedCount,
  failedCount,
  queuedCount,
  totalCount,
  hasBlockingWork,
}: {
  completedCount: number;
  failedCount: number;
  queuedCount: number;
  totalCount: number;
  hasBlockingWork: boolean;
}) {
  if (totalCount === 0) return null;

  if (hasBlockingWork) {
    return (
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[12px] text-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            Đang gửi job tạo audio lên backend queue...
          </span>
          <span className="text-[12px] text-muted-foreground">Chờ phản hồi từ API</span>
        </div>
        <div className="overflow-hidden rounded-full bg-secondary">
          <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: "55%" }} />
        </div>
      </div>
    );
  }

  if (queuedCount > 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#C9A84C]/15 bg-[#C9A84C]/5 p-4">
        <Clock3 className="h-5 w-5 shrink-0 text-[#A8890A]" />
        <div className="flex-1">
          <p className="text-[13px] text-foreground">
            {queuedCount} job đã vào queue backend{completedCount > 0 ? ` · ${completedCount}/${totalCount} audio đã sẵn sàng` : ""}.
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Tiến trình xử lý thực tế hiện phụ thuộc worker backend. Bạn có thể đóng modal sau khi request đã được queue thành công.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        failedCount === 0 ? "border-[#2D5A3D]/15 bg-[#2D5A3D]/5" : "border-[#C9A84C]/15 bg-[#C9A84C]/5"
      }`}
    >
      {failedCount === 0 ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2D5A3D]" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0 text-[#A8890A]" />
      )}
      <div className="flex-1">
        <p className="text-[13px] text-foreground">
          {failedCount === 0
            ? `Tất cả ${completedCount} audio đã sẵn sàng.`
            : `${completedCount}/${totalCount} audio hoàn tất · ${failedCount} audio cần retry`}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {failedCount === 0
            ? "Bạn có thể đóng modal hoặc tải từng file ngay bây giờ."
            : "Partial success: chỉ retry những job thất bại, không cần generate lại toàn bộ."}
        </p>
      </div>
    </div>
  );
}

interface GenerateAudioModalProps {
  open: boolean;
  onClose: () => void;
  narrationId: string | null;
  narrationStatus: string | null;
  narrationTitle: string;
  narrationScript?: string;
}

export function GenerateAudioModal({ open, onClose, narrationId, narrationStatus, narrationTitle, narrationScript = "" }: GenerateAudioModalProps) {
  const [selectedLangs, setSelectedLangs] = useState<Set<Language>>(new Set(["vi"]));
  const [voices, setVoices] = useState<Record<Language, string>>(defaultVoiceIds);
  const [speeds, setSpeeds] = useState<Record<Language, string>>({
    vi: "1.03",
    en: "1.03",
    zh: "1.03",
    ja: "1.03",
    fr: "1.03",
  });
  const [tasks, setTasks] = useState<AudioTask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedLangs(new Set(["vi"]));
      setVoices(defaultVoiceIds);
      setSpeeds({
        vi: "1.03",
        en: "1.03",
        zh: "1.03",
        ja: "1.03",
        fr: "1.03",
      });
      setTasks([]);
      setIsSubmitting(false);
      setPlayingId(null);
      setPreviewLoadingId(null);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [open]);

  const previewTasks = useMemo<AudioTask[]>(
    () => allLangs.filter((lang) => selectedLangs.has(lang)).map((lang) => ({ lang, status: "idle", progress: 0 })),
    [selectedLangs]
  );

  const hasTasks = tasks.length > 0;
  const hasBlockingWork = isSubmitting || tasks.some((task) => task.status === "processing");
  const queuedCount = tasks.filter((task) => task.status === "queued").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const activeTasks = hasTasks ? tasks : previewTasks;
  const narrationAudioText = useMemo(() => {
    const script = String(narrationScript || "").trim();
    if (script) return script;

    return narrationTitle
      ? `${narrationTitle}. Đây là nội dung thuyết minh dùng để tạo bản nghe thử.`
      : "Nội dung thuyết minh dùng để tạo bản nghe thử.";
  }, [narrationScript, narrationTitle]);

  const mergeTasks = useCallback((langs: Language[], updates: AudioTask[]) => {
    setTasks((prev) => {
      const retained = prev.filter((task) => langs.indexOf(task.lang) === -1);
      return [...retained, ...updates].sort((left, right) => allLangs.indexOf(left.lang) - allLangs.indexOf(right.lang));
    });
  }, []);

  const syncJobs = useCallback((jobs: AudioBatchJob[]) => {
    setTasks((prev) =>
      prev.map((task) => {
        const job = jobs.find((item) => item.id === task.jobId);
        if (!job) {
          return task;
        }

        const nextStatus = mapJobStatus(job.status);
        return {
          ...task,
          status: nextStatus,
          progress: mapJobProgress(job.status),
          error:
            nextStatus === "failed"
              ? task.error || "Job backend đã bị hủy hoặc thất bại trong hàng đợi."
              : undefined,
        };
      })
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trackedJobIds = tasks.map((task) => task.jobId).filter(Boolean) as string[];
    if (trackedJobIds.length === 0) {
      return;
    }

    const pollJobs = async () => {
      try {
        const response = await requestJson<{ data?: AudioBatchJob[] }>("/api/narrations/admin/audio/jobs");
        const relevantJobs = (response.data || []).filter((job) => trackedJobIds.indexOf(job.id) !== -1);
        if (relevantJobs.length > 0) {
          syncJobs(relevantJobs);
        }
      } catch {
        // Keep the last known UI state if polling fails.
      }
    };

    void pollJobs();
    pollingRef.current = setInterval(() => {
      void pollJobs();
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open, syncJobs, tasks]);

  const dispatchQueue = useCallback(
    async (langs: Language[]) => {
      if (langs.length === 0) {
        return;
      }

      if (!narrationId) {
        mergeTasks(
          langs,
          langs.map((lang) => ({
            lang,
            status: "failed",
            progress: 100,
            error: "Không xác định được bài thuyết minh để đẩy job tạo audio.",
          }))
        );
        return;
      }

      setIsSubmitting(true);
      mergeTasks(langs, langs.map((lang) => ({ lang, status: "processing", progress: 15 })));

      try {
        const results = await Promise.all(
          langs.map(async (lang) => {
            try {
              const response = await generateNarrationAudio({
                narrationId,
                text: narrationAudioText,
                voiceId: voices[lang],
                language: lang,
                speed: Number(speeds[lang]) || 1.03,
              });

              return {
                lang,
                status: "completed" as const,
                progress: 100,
                duration: "1:00",
                fileSize: `${(((response.data?.size || 0) as number) / (1024 * 1024)).toFixed(1)} MB`,
                audioUrl: response.data?.url,
              };
            } catch (error) {
              return {
                lang,
                status: "failed" as const,
                progress: 100,
                error: error instanceof Error ? error.message : "Không thể tạo audio",
              };
            }
          })
        );

        mergeTasks(langs, results);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tạo audio từ backend queue";
        mergeTasks(
          langs,
          langs.map((lang) => ({
            lang,
            status: "failed",
            progress: 100,
            error: message,
          }))
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [mergeTasks, narrationAudioText, narrationId, speeds, voices]
  );

  const handleGenerate = useCallback(() => {
    if (selectedLangs.size === 0) return;
    void dispatchQueue(allLangs.filter((lang) => selectedLangs.has(lang)));
  }, [dispatchQueue, selectedLangs]);

  const handleRetry = useCallback(
    (lang: Language) => {
      void dispatchQueue([lang]);
    },
    [dispatchQueue]
  );

  const handleCancelTask = useCallback((lang: Language, jobId: string) => {
    void requestJson(`/api/narrations/admin/audio/jobs/${jobId}/cancel`, {
      method: "POST",
    }).catch(() => undefined);

    setTasks((prev) =>
      prev.map((task) =>
        task.lang === lang
          ? { ...task, status: "failed", progress: 100, error: "Tác vụ đã được hủy bởi admin." }
          : task
      )
    );
  }, []);

  const handlePreviewTask = useCallback(
    async (task: AudioTask, voiceId: string, speedId: string) => {
      const taskId = task.lang;
      const selectedSpeed = Number(speedId) || 1.03;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;

      if (playingId === taskId && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setPlayingId(null);
        return;
      }

      setPreviewLoadingId(taskId);

      try {
        let nextUrl = task.audioUrl;
        if (!nextUrl) {
          const previewText = narrationAudioText;

          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            const synth = window.speechSynthesis;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(previewText);
            utterance.lang = task.lang === "vi" ? "vi-VN" : task.lang === "en" ? "en-US" : task.lang === "zh" ? "zh-CN" : task.lang === "ja" ? "ja-JP" : "fr-FR";
            utterance.rate = selectedSpeed;
            utterance.pitch = 1.18;

            const availableVoices = synth.getVoices();
            const langVoices = availableVoices.filter((voice) =>
              voice.lang.toLowerCase().startsWith(task.lang)
            );

            const femaleKeywords = ["female", "woman", "zira", "susan", "linda", "linh", "nữ"];

            const preferredVoice = langVoices.find((voice) => {
              const voiceName = `${voice.name} ${voice.voiceURI}`.toLowerCase();
              return femaleKeywords.some((hint) => voiceName.indexOf(hint) !== -1);
            });

            utterance.voice = preferredVoice || langVoices[0] || null;
            utterance.onstart = () => setPlayingId(taskId);
            utterance.onend = () => setPlayingId((current) => (current === taskId ? null : current));
            utterance.onerror = () => setPlayingId((current) => (current === taskId ? null : current));

            synth.speak(utterance);
            return;
          }

          const response = await previewNarrationAudio({
            text: previewText,
            language: task.lang,
            voiceId,
            speed: selectedSpeed,
          });
          nextUrl = response.data.url;
        }

        audio.pause();
        audio.src = nextUrl;
        audio.load();

        const playbackRate = selectedSpeed;
        audio.defaultPlaybackRate = playbackRate;
        audio.playbackRate = playbackRate;
        audio.preservesPitch = false;
        audio.onloadedmetadata = () => {
          audio.playbackRate = playbackRate;
        };

        await audio.play();
        setPlayingId(taskId);

        audio.onended = () => setPlayingId((current) => (current === taskId ? null : current));
        audio.onerror = () => setPlayingId((current) => (current === taskId ? null : current));
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Audio preview play failed:", error?.response?.status, error?.response?.data || error?.message || error);
        }
        setPlayingId(null);
      } finally {
        setPreviewLoadingId(null);
      }
    },
    [narrationAudioText, playingId]
  );

  const handleUploadTaskAudio = useCallback(async (lang: Language, file: File | null) => {
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
    if (!response.ok) return;

    const uploadedUrl = data?.data?.url;
    if (!uploadedUrl) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.lang === lang
          ? {
              ...task,
              audioUrl: uploadedUrl,
              fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            }
          : task
      )
    );
  }, []);

  if (!open) return null;

  const buttonState: ButtonVisualState =
    selectedLangs.size === 0 ? "disabled" : isSubmitting ? "loading" : "default";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !hasBlockingWork) onClose(); }}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-[820px] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl [&>button]:hidden"
        onInteractOutside={(event) => { if (hasBlockingWork) event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (hasBlockingWork) event.preventDefault(); }}
      >
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-[18px] font-normal text-foreground">Cấu hình Audio</DialogTitle>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-2.5 py-1 text-[11px] text-[#A8890A]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Multi-language
                  </span>
                </div>
                <DialogDescription className="mt-1 max-w-[520px] truncate text-[12px]">{narrationTitle}</DialogDescription>
              </div>
            </div>

            <button
              onClick={!hasBlockingWork ? onClose : undefined}
              disabled={hasBlockingWork}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ngôn ngữ</p>
              <p className="mt-1 text-[14px] text-foreground">5 ngôn ngữ</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tiến trình</p>
              <p className="mt-1 text-[14px] text-foreground">Theo từng ngôn ngữ</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Thời gian dự kiến</p>
              <p className="mt-1 text-[14px] text-foreground">~30 giây / ngôn ngữ</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <LanguageSelector selected={selectedLangs} disabled={hasTasks} onChange={setSelectedLangs} />

          <SummaryBanner
            completedCount={completedCount}
            failedCount={failedCount}
            queuedCount={queuedCount}
            totalCount={tasks.length}
            hasBlockingWork={hasBlockingWork}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] text-foreground">{hasTasks ? "Tiến trình từng ngôn ngữ" : "Preview từng ngôn ngữ"}</span>
            </div>

            {activeTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {activeTasks.map((task) => (
                  <AudioTaskCard
                    key={task.lang}
                    task={task}
                    speed={speeds[task.lang]}
                    onSpeedChange={(value) => setSpeeds((prev) => ({ ...prev, [task.lang]: value }))}
                    onRetry={() => handleRetry(task.lang)}
                    onCancel={() => handleCancelTask(task.lang, task.jobId || `local-${task.lang}`)}
                    onUploadAudio={(file) => void handleUploadTaskAudio(task.lang, file)}
                    onPreview={() => void handlePreviewTask(task, voices[task.lang], speeds[task.lang])}
                    isPlaying={playingId === task.lang}
                    isPreviewLoading={previewLoadingId === task.lang}
                    locked={hasTasks}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/10 p-6 text-center">
                <p className="text-[13px] text-foreground">Chưa có ngôn ngữ nào được chọn</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Hãy chọn ít nhất một language để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-border bg-secondary/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          {!hasTasks && (
            <>
              <p className="text-[12px] text-muted-foreground">
                {selectedLangs.size > 0
                  ? `${selectedLangs.size} ngôn ngữ đã chọn · ~${selectedLangs.size * 30}s xử lý`
                  : "Chọn ngôn ngữ để bật Generate Audio"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground transition-colors hover:bg-muted"
                >
                  Hủy
                </button>
                <GenerateAudioButton state={buttonState} count={selectedLangs.size} onClick={handleGenerate} />
              </div>
            </>
          )}

          {hasTasks && hasBlockingWork && (
            <>
              <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Đang gửi request tạo audio lên backend queue...
              </p>
              <GenerateAudioButton state="loading" count={tasks.length} />
            </>
          )}

          {hasTasks && !hasBlockingWork && (
            <>
              <p className="text-[12px] text-muted-foreground">
                {queuedCount > 0
                  ? `${queuedCount} job đã vào queue backend`
                  : failedCount > 0
                    ? `${failedCount} audio cần thử lại`
                    : "Tất cả audio đã sẵn sàng"}
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] text-primary-foreground transition-all shadow-sm hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                {queuedCount > 0 ? "Đóng" : "Hoàn tất"}
              </button>
            </>
          )}
        </DialogFooter>

        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
