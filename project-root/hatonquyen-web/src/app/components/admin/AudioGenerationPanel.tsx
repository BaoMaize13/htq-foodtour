import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Loader2,
  Play,
  RotateCcw,
  Square,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "./shared/page-header";
import { LanguageBadge, type Language } from "./shared/language-badge";
import { cn } from "../../../components/ui/utils";
import { ttsEngine, type TTSLanguage } from "../../../core/tts/engine";

type JobStatus = "idle" | "processing" | "completed" | "failed";
type ButtonState = "default" | "hover" | "loading" | "disabled";

const supportedLanguages: Array<{ lang: Language; label: string; helper: string }> = [
  { lang: "vi", label: "Tiếng Việt", helper: "Bản gốc ưu tiên" },
  { lang: "en", label: "English", helper: "Khách quốc tế" },
  { lang: "zh", label: "中文", helper: "Khách Hoa ngữ" },
  { lang: "ja", label: "日本語", helper: "Khách Nhật" },
  { lang: "fr", label: "Français", helper: "Khách Pháp ngữ" },
];

const stateCards = [
  {
    title: "Idle",
    subtitle: "Trước khi generate",
    accent: "#7A1B2E",
    points: ["Chưa có job", "CTA disable nếu chưa chọn language", "Estimate hiển thị nhẹ nhàng"],
  },
  {
    title: "Language Selection",
    subtitle: "Selected rõ ràng",
    accent: "#C9A84C",
    points: ["Selected có border + tint", "Focus ring vàng ấm", "Cho phép select all / clear"],
  },
  {
    title: "Processing",
    subtitle: "Đang chạy hàng đợi",
    accent: "#7A1B2E",
    points: ["Global progress + per-task progress", "Khoá selector", "Spinner chỉ ở điểm cần chú ý"],
  },
  {
    title: "Completed",
    subtitle: "Audio sẵn sàng",
    accent: "#2D5A3D",
    points: ["Preview row nổi bật", "Download action gọn", "Giữ cảm giác tin cậy"],
  },
  {
    title: "Partial Success",
    subtitle: "Thành công một phần",
    accent: "#C9A84C",
    points: ["Banner tóm tắt", "Job lỗi giữ riêng", "Cho phép rời modal an toàn"],
  },
  {
    title: "Failed + Retry",
    subtitle: "Hồi phục an toàn",
    accent: "#D4183D",
    points: ["Lỗi ngắn gọn", "Retry cục bộ", "Không reset task đã xong"],
  },
];

const statusConfig: Record<JobStatus, { label: string; tone: string; surface: string; description: string }> = {
  idle: {
    label: "Ready",
    tone: "text-muted-foreground border-border bg-secondary/60",
    surface: "border-border bg-card",
    description: "Đã chọn giọng đọc, chờ bắt đầu xử lý.",
  },
  processing: {
    label: "Processing",
    tone: "text-primary border-primary/15 bg-primary/8",
    surface: "border-primary/20 bg-primary/[0.03]",
    description: "Đang sinh audio và cập nhật tiến trình theo thời gian thực.",
  },
  completed: {
    label: "Completed",
    tone: "text-[#2D5A3D] border-[#2D5A3D]/15 bg-[#2D5A3D]/8",
    surface: "border-[#2D5A3D]/20 bg-[#2D5A3D]/[0.03]",
    description: "Preview hoặc download ngay khi từng language xong.",
  },
  failed: {
    label: "Failed",
    tone: "text-destructive border-destructive/15 bg-destructive/8",
    surface: "border-destructive/20 bg-destructive/[0.03]",
    description: "Giữ nguyên context lỗi và hiển thị retry rõ ràng.",
  },
};

function SectionFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">{eyebrow}</p>
          <h2 className="mt-2 text-[20px] text-foreground">{title}</h2>
        </div>
        <p className="max-w-[520px] text-[12px] leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function GenerateAudioButton({
  state = "default",
  count = 3,
  wide = false,
}: {
  state?: ButtonState;
  count?: number;
  wide?: boolean;
}) {
  const isLoading = state === "loading";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] transition-all",
        wide && "w-full",
        state === "default" && "bg-primary text-primary-foreground shadow-lg shadow-primary/15",
        state === "hover" && "bg-[#671624] text-primary-foreground shadow-xl shadow-primary/20 -translate-y-0.5",
        state === "loading" && "bg-primary text-primary-foreground shadow-lg shadow-primary/15",
        state === "disabled" && "cursor-not-allowed bg-primary/35 text-primary-foreground/85"
      )}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      <span>{isLoading ? "Generating Audio..." : "Generate Audio"}</span>
      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-inherit">{count}</span>
    </button>
  );
}

function LanguageSelectorChip({
  lang,
  label,
  helper,
  selected = false,
  focused = false,
  disabled = false,
}: {
  lang: Language;
  label: string;
  helper: string;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-all",
        selected ? "border-primary bg-primary/[0.06] shadow-sm" : "border-border bg-background",
        focused && "ring-2 ring-[#C9A84C]/45 ring-offset-2 ring-offset-card",
        disabled && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <LanguageBadge lang={lang} compact />
          <div>
            <p className={cn("text-[13px]", selected ? "text-primary" : "text-foreground")}>{label}</p>
            <p className="text-[11px] text-muted-foreground">{helper}</p>
          </div>
        </div>
        <div
          className={cn(
            "mt-1 flex h-5 w-5 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
          )}
        >
          {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
        </div>
      </div>
    </div>
  );
}

function ProcessingStatusBadge({ status }: { status: JobStatus }) {
  const Icon = status === "idle" ? Clock3 : status === "processing" ? Loader2 : status === "completed" ? CheckCircle2 : AlertCircle;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]", statusConfig[status].tone)}>
      <Icon className={cn("h-3.5 w-3.5", status === "processing" && "animate-spin")} />
      {statusConfig[status].label}
    </span>
  );
}

function ResultStateRow({
  title,
  meta,
  tone = "neutral",
  trailing,
}: {
  title: string;
  meta: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  trailing?: ReactNode;
}) {
  const toneClass = {
    neutral: "border-border bg-background",
    success: "border-[#2D5A3D]/15 bg-[#2D5A3D]/5",
    warning: "border-[#C9A84C]/15 bg-[#C9A84C]/8",
    danger: "border-destructive/15 bg-destructive/5",
  }[tone];

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-2xl border px-3 py-3", toneClass)}>
      <div className="min-w-0">
        <p className="truncate text-[12px] text-foreground">{title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>
      </div>
      {trailing}
    </div>
  );
}

function RetryAction({ subtle = false }: { subtle?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] transition-colors",
        subtle
          ? "border-destructive/15 bg-destructive/8 text-destructive hover:bg-destructive/12"
          : "border-border bg-card text-foreground hover:bg-secondary"
      )}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Retry
    </button>
  );
}

function AudioTaskCard({
  lang,
  label,
  status,
  voice,
  progress,
  fileMeta,
  error,
  onPlay,
  onStop,
  isPlaying,
}: {
  lang: Language;
  label: string;
  status: JobStatus;
  voice: string;
  progress?: number;
  fileMeta?: string;
  error?: string;
  onPlay?: () => void;
  onStop?: () => void;
  isPlaying?: boolean;
}) {
  const [engineState, setEngineState] = useState(ttsEngine.getState());

  useEffect(() => {
    const unsubscribe = ttsEngine.subscribe((state) => {
      setEngineState(state);
    });

    return unsubscribe;
  }, []);

  const ttsLanguage = useMemo<TTSLanguage>(() => {
    const languageMap: Record<Language, TTSLanguage> = {
      vi: "vi-VN",
      en: "en-US",
      zh: "zh-CN",
      ja: "ja-JP",
      fr: "fr-FR",
    };

    return languageMap[lang];
  }, [lang]);

  const isCardPlayingByEngine = (engineState.isPlaying || engineState.isPaused) && engineState.lang === ttsLanguage;
  const isCardPlaying = isPlaying ?? isCardPlayingByEngine;

  const handleAudioPreview = () => {
    if (isCardPlaying) {
      if (onStop) {
        onStop();
      } else {
        ttsEngine.stop();
      }
      return;
    }

    if (onPlay) {
      onPlay();
      return;
    }

    ttsEngine.speak({
      mode: "DEV",
      language: ttsLanguage,
      poiId: `ADMIN_PREVIEW_${lang.toUpperCase()}`,
      destination: `Audio preview ${label}`,
      text: `Đây là bản xem trước audio cho ngôn ngữ ${label}. Smart Food Tour đang dùng chế độ DEV để kiểm thử phát âm thanh trực tiếp từ TTS engine.`,
    });
  };

  return (
    <div className={cn("rounded-[22px] border p-4", statusConfig[status].surface)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <LanguageBadge lang={lang} />
          <p className="mt-2 text-[13px] text-foreground">{label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{voice}</p>
        </div>
        <ProcessingStatusBadge status={status} />
      </div>

      {status === "idle" && (
        <div className="mt-4 space-y-3">
          <ResultStateRow
            title="Voice preset"
            meta="Female warm narration · AI Premium"
            trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />}
          />
          <p className="text-[11px] leading-5 text-muted-foreground">{statusConfig[status].description}</p>
        </div>
      )}

      {status === "processing" && (
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Synthesizing speech and normalizing output...</p>
            <span className="text-[11px] text-primary">{progress}%</span>
          </div>
          <ResultStateRow
            title="Current step"
            meta="Text-to-speech render in progress"
            tone="warning"
            trailing={<Loader2 className="h-4 w-4 animate-spin text-primary" />}
          />
        </div>
      )}

      {status === "completed" && (
        <div className="mt-4 space-y-3">
          <ResultStateRow
            title={`audio-${lang}.mp3`}
            meta={fileMeta ?? "01:58 · 1.1 MB · ready for delivery"}
            tone="success"
            trailing={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAudioPreview}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D5A3D] text-white transition-all",
                    isCardPlaying && "animate-pulse shadow-[0_0_0_2px_rgba(45,90,61,0.25)]"
                  )}
                  aria-label={isCardPlaying ? `Stop preview ${label}` : `Play preview ${label}`}
                >
                  {isCardPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D5A3D]/15 bg-card text-[#2D5A3D]">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            }
          />
          <p className="text-[11px] leading-5 text-muted-foreground">{statusConfig[status].description}</p>
        </div>
      )}

      {status === "failed" && (
        <div className="mt-4 space-y-3">
          <ResultStateRow
            title="Retry required"
            meta={error ?? "TTS provider timeout. Retry after 30 seconds."}
            tone="danger"
            trailing={<AlertCircle className="h-4 w-4 text-destructive" />}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] leading-5 text-muted-foreground">{statusConfig[status].description}</p>
            <RetryAction subtle />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStateCard({
  title,
  subtitle,
  accent,
  points,
}: {
  title: string;
  subtitle: string;
  accent: string;
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />
        <div>
          <p className="text-[13px] text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {points.map((point) => (
          <div key={point} className="rounded-xl bg-secondary/45 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenerateAudioShowcase() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Generate Audio UI – ManageNarrations"
        subtitle="Production-ready design spec bám theo admin portal của Smart Food Tour, ưu tiên handoff 1:1 sang React + Tailwind."
      />

      <section
        className="overflow-hidden rounded-[28px] border border-[#3A252A] bg-[#1A1215] p-6 text-[#FFF8F0] shadow-xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, rgba(201,168,76,0.18), transparent 30%), linear-gradient(135deg, #1A1215 0%, #24171B 42%, #1A1215 100%)",
        }}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#C9A84C]">Smart Food Tour / Web Admin / ManageNarrations</p>
            <div className="space-y-3">
              <h2 className="text-[30px] leading-tight text-[#FFF8F0]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Generate Audio UI với cảm giác cao cấp, đáng tin cậy và đủ rõ để xử lý bất đồng bộ đa ngôn ngữ.
              </h2>
              <p className="max-w-[720px] text-[13px] leading-7 text-[#E8DDD6]/80">
                Mẫu này giữ đúng hệ màu burgundy, gold và warm neutral của portal hiện có, đồng thời nâng phần xử lý audio thành
                một interaction panel dễ thao tác, ít gây áp lực và đủ giàu trạng thái để handoff sang frontend.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Desktop-first modal panel", "5-language selector", "Per-language task cards", "Idle / Processing / Completed / Failed / Retry"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#E8DDD6]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C]">Design Principles</p>
            <div className="mt-4 space-y-3">
              {[
                "Selected state phải dễ đọc chỉ với 1 lần quét mắt.",
                "Status hierarchy rõ: global summary trước, task detail sau.",
                "Completed và failed khác nhau bằng icon, color và hành động.",
                "Async feedback mềm mại, không lạm dụng spinner hoặc màu cảnh báo.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-[12px] leading-6 text-[#E8DDD6]/82">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-2">
        <SectionFrame
          eyebrow="Frame 01"
          title="Generate Audio Interaction Panel"
          description="Frame chính cho trạng thái idle và selection. Modal nằm tự nhiên trong admin shell, footer CTA rõ ràng, language selection đủ nổi nhưng không quá “technical”."
        >
          <div className="rounded-[28px] border border-border bg-[#F7F1ED] p-5">
            <div className="rounded-[24px] border border-[#3A252A] bg-[#1A1215] p-4 text-[#E8DDD6]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#C9A84C]">Preview Context</p>
                  <p className="mt-2 text-[13px] text-white">Manage Narrations / Generate Audio</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#E8DDD6]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C9A84C]" />
                  Trusted async workflow
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-[#C9A84C]/20 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[17px] text-foreground">Generate Audio</p>
                      <p className="mt-1 max-w-[420px] text-[12px] leading-6 text-muted-foreground">
                        Câu chuyện Dimsum Hải Ký – Di sản ẩm thực 50 năm
                      </p>
                    </div>
                  </div>
                  <ProcessingStatusBadge status="idle" />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Supported languages", value: "5" },
                    { label: "Recommended voice profile", value: "Warm Premium" },
                    { label: "Estimated processing", value: "~30s / language" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-[15px] text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-foreground">Language Selector</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Selected state dùng border + tint + check indicator. Focus ring dùng gold để hợp visual system.</p>
                  </div>
                  <button className="text-[11px] text-primary hover:underline">Select all languages</button>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  {supportedLanguages.map((language, index) => (
                    <LanguageSelectorChip
                      key={language.lang}
                      {...language}
                      selected={index < 3}
                      focused={language.lang === "ja"}
                    />
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_280px]">
                  <div className="space-y-3">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Selected jobs preview</p>
                    <AudioTaskCard lang="vi" label="Tiếng Việt" status="idle" voice="Linh · Female Southern" />
                    <AudioTaskCard lang="en" label="English" status="idle" voice="Sarah · Female US" />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[22px] border border-[#C9A84C]/15 bg-[#C9A84C]/10 p-4">
                      <p className="text-[12px] text-foreground">UX note</p>
                      <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                        Button chỉ enable khi có ít nhất 1 language được chọn. Trong trạng thái idle, panel vẫn cho phép thay voice preset mà không tạo cảm giác rối.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-border bg-background p-4">
                      <p className="text-[12px] text-foreground">Footer behavior</p>
                      <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                        Cancel secondary, Generate Audio primary. Estimate hiển thị cạnh trái để tăng cảm giác kiểm soát.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-border bg-secondary/15 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-[12px] text-muted-foreground">3 languages selected · estimated 90 seconds total</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl bg-secondary px-4 py-3 text-[13px] text-secondary-foreground">Cancel</button>
                  <GenerateAudioButton count={3} />
                </div>
              </div>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame
          eyebrow="Frame 02"
          title="Processing / Results State"
          description="Frame thứ hai cho lúc đang xử lý và trả kết quả. Ưu tiên summary cấp cao trước, sau đó là task panel theo từng language job để partial success vẫn dễ hiểu."
        >
          <div className="space-y-4 rounded-[28px] border border-border bg-[#F7F1ED] p-5">
            <div className="rounded-[24px] border border-primary/15 bg-primary/[0.03] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[13px] text-foreground">Global generation status</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">3/5 completed · 1 processing · 1 failed. Completed jobs vẫn khả dụng ngay.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ProcessingStatusBadge status="processing" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D5A3D]/15 bg-[#2D5A3D]/8 px-2.5 py-1 text-[11px] text-[#2D5A3D]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    3 completed
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/15 bg-destructive/8 px-2.5 py-1 text-[11px] text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    1 needs retry
                  </span>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary" style={{ width: "76%" }} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <AudioTaskCard lang="vi" label="Tiếng Việt" status="completed" voice="Linh · Female Southern" fileMeta="02:08 · 1.2 MB · auto-normalized" />
              <AudioTaskCard lang="en" label="English" status="completed" voice="Sarah · Female US" fileMeta="01:54 · 1.0 MB · delivery ready" />
              <AudioTaskCard lang="zh" label="中文" status="completed" voice="小美 · 女声标准" fileMeta="01:42 · 0.9 MB · ready for review" />
              <AudioTaskCard lang="ja" label="日本語" status="processing" voice="美咲 · 女性標準" progress={68} />
              <AudioTaskCard
                lang="fr"
                label="Français"
                status="failed"
                voice="수빈 · 여성 표준"
                error="Quota exceeded: TTS API rate limit. Retry after 30s."
              />
            </div>

            <div className="rounded-[22px] border border-[#C9A84C]/15 bg-[#C9A84C]/10 p-4">
              <p className="text-[12px] text-foreground">Partial success principle</p>
              <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                Khi một vài task completed và một vài task failed, UI không “flatten” mọi trạng thái thành một message duy nhất. Global banner chỉ tóm tắt,
                quyết định chính vẫn nằm ở từng card: preview, download hoặc retry.
              </p>
            </div>
          </div>
        </SectionFrame>
      </div>

      <SectionFrame
        eyebrow="Components"
        title="Status Components"
        description="Nhóm component hoá để dễ map sang React + Tailwind: GenerateAudioButton, LanguageSelector, AudioTaskCard, ProcessingStatusBadge, ResultStateRow và RetryAction."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">GenerateAudioButton</p>
            <div className="mt-4 space-y-3">
              <GenerateAudioButton state="default" count={5} wide />
              <GenerateAudioButton state="hover" count={5} wide />
              <GenerateAudioButton state="loading" count={5} wide />
              <GenerateAudioButton state="disabled" count={0} wide />
            </div>
          </div>

          <div className="rounded-[22px] border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">LanguageSelector</p>
            <div className="mt-4 grid gap-3">
              <LanguageSelectorChip lang="vi" label="Tiếng Việt" helper="Selected" selected />
              <LanguageSelectorChip lang="en" label="English" helper="Default" />
              <LanguageSelectorChip lang="zh" label="中文" helper="Focus state" focused />
              <LanguageSelectorChip lang="fr" label="Français" helper="Disabled" disabled />
            </div>
          </div>

          <div className="rounded-[22px] border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">ProcessingStatusBadge</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ProcessingStatusBadge status="idle" />
              <ProcessingStatusBadge status="processing" />
              <ProcessingStatusBadge status="completed" />
              <ProcessingStatusBadge status="failed" />
            </div>

            <p className="mt-6 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">RetryAction</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <RetryAction />
              <RetryAction subtle />
            </div>
          </div>

          <div className="rounded-[22px] border border-border bg-background p-4 xl:col-span-2">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">AudioTaskCard</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <AudioTaskCard lang="vi" label="Tiếng Việt" status="idle" voice="Linh · Female Southern" />
              <AudioTaskCard lang="ja" label="日本語" status="processing" voice="美咲 · 女性標準" progress={42} />
            </div>
          </div>

          <div className="rounded-[22px] border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">ResultStateRow</p>
            <div className="mt-4 space-y-3">
              <ResultStateRow title="audio-vi.mp3" meta="02:08 · 1.2 MB" />
              <ResultStateRow title="Delivered successfully" meta="Ready for tour app sync" tone="success" />
              <ResultStateRow title="Retry recommended" meta="Timeout when contacting provider" tone="danger" />
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        eyebrow="State Showcase"
        title="Idle / Processing / Completed / Failed"
        description="Bộ state card rút gọn để designer và frontend cùng nhìn ra logic chuyển trạng thái trước khi triển khai chi tiết trong modal."
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {stateCards.map((card) => (
            <MiniStateCard key={card.title} {...card} />
          ))}
        </div>
      </SectionFrame>

      <section
        className="rounded-[28px] border border-[#3A252A] p-6 text-[#FFF8F0]"
        style={{ backgroundImage: "linear-gradient(135deg, #1A1215 0%, #24171B 50%, #1F1518 100%)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#C9A84C]">Handoff Notes For Dev</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">State mapping</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>`idle`: chưa có task, selector editable, CTA enable khi `selectedLangs.size &gt; 0`.</div>
              <div>`processing`: khoá selector và voice preset, giữ global progress + per-task progress.</div>
              <div>`completed`: mở preview/download ngay tại card, không chờ batch hoàn tất.</div>
              <div>`failed`: giữ nguyên card lỗi với message ngắn, retry cục bộ.</div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">Button behavior</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>Primary CTA dùng `bg-primary`, hover darken nhẹ, focus dùng ring gold để nổi trên nền sáng.</div>
              <div>Loading state giữ cùng kích thước button, chỉ đổi icon sang spinner để tránh layout shift.</div>
              <div>Disabled state giảm độ tương phản vừa đủ, không xoá count pill để vẫn truyền tải context.</div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">Async visual feedback</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>Global banner ưu tiên “tình hình chung”, còn hành động nằm trong từng AudioTaskCard.</div>
              <div>Spinner chỉ dùng ở banner và task đang active; completed/failed dùng icon tĩnh để giảm nhiễu.</div>
              <div>Tablet: modal chuyển về 1 cột, language grid 3+2, footer sticky để CTA luôn trong tầm mắt.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
