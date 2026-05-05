import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  FileText,
  Mail,
  Play,
  ScrollText,
  Square,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { LanguageBadge } from "../shared/language-badge";
import { ActionDecisionBar } from "./action-decision-bar";
import { ContentStatusBadge } from "./content-status-badge";
import { ttsEngine, type TTSLanguage } from "../../../../core/tts/engine";
import type {
  ContentActionType,
  ContentPreviewTab,
  ContentSubmission,
} from "./types";

interface ContentPreviewDrawerProps {
  submission: ContentSubmission | null;
  loading?: boolean;
  busyAction?: ContentActionType | null;
  onApprove?: () => void;
  onRequestRevision?: () => void;
  onReject?: () => void;
}

export function ContentPreviewDrawer({
  submission,
  loading = false,
  busyAction = null,
  onApprove,
  onRequestRevision,
  onReject,
}: ContentPreviewDrawerProps) {
  const [activeTab, setActiveTab] = useState<ContentPreviewTab>("shortText");
  const [engineState, setEngineState] = useState(ttsEngine.getState());

  useEffect(() => {
    const unsubscribe = ttsEngine.subscribe((state) => setEngineState(state));
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-[24px] border border-border bg-card p-5">
        <div className="h-6 w-40 rounded bg-secondary" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 rounded-2xl bg-secondary/80" />
          ))}
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Eye className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-[14px] text-foreground">Chọn nội dung để preview</p>
        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
          Drawer preview giúp admin đọc nhanh short text, full text và audio script mà
          không bị ngợp bởi quá nhiều màn hình.
        </p>
      </div>
    );
  }

  const tabItems: { id: ContentPreviewTab; label: string }[] = [
    { id: "shortText", label: "Short text" },
    { id: "fullText", label: "Full text" },
    { id: "script", label: "Script" },
  ];

  const tabContent =
    activeTab === "shortText"
      ? submission.body.shortText
      : activeTab === "fullText"
        ? submission.body.fullText
        : submission.body.script;

  const languageMap: Record<string, TTSLanguage> = {
    vi: "vi-VN",
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    fr: "fr-FR",
  };

  const ttsLanguage = languageMap[submission.language] || "vi-VN";
  const isPreviewPlaying = (engineState.isPlaying || engineState.isPaused) && engineState.lang === ttsLanguage;

  const handlePreviewTTS = () => {
    if (isPreviewPlaying) {
      ttsEngine.stop();
      return;
    }

    ttsEngine.speak({
      mode: "DEV",
      language: ttsLanguage,
      destination: submission.title,
      text: tabContent || submission.body.shortText || submission.title,
    });
  };

  return (
    <div className="rounded-[24px] border border-border bg-card p-5">
      <div className="rounded-[22px] border border-[#3A252A] bg-[#1A1215] p-4 text-[#FFF8F0]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C]">
              Content Preview Drawer
            </p>
            <p className="mt-2 text-[16px] text-white">{submission.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ContentStatusBadge status={submission.status} />
              <LanguageBadge lang={submission.language} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#E8DDD6]/70">
              Quality score
            </p>
            <p className="mt-1 text-[18px] text-[#C9A84C]">
              {submission.moderation.qualityScore}/100
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {[
          { icon: Store, label: "POI", value: submission.relatedPOI.name },
          { icon: UserRound, label: "Submitted by", value: submission.submittedBy.name },
          { icon: Mail, label: "Email", value: submission.submittedBy.email },
          { icon: CalendarDays, label: "Submitted", value: submission.submittedLabel },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeTab === "script" ? (
                <ScrollText className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {activeTab === "shortText"
                  ? "Short text preview"
                  : activeTab === "fullText"
                    ? "Full text preview"
                    : "Script preview"}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePreviewTTS}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${
                isPreviewPlaying
                  ? "border-[#2D5A3D]/20 bg-[#2D5A3D]/10 text-[#2D5A3D] animate-pulse"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {isPreviewPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPreviewPlaying ? "Dừng" : "Nghe thử"}
            </button>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-foreground">{tabContent}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#A8890A]" />
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#A8890A]">
            Moderation note
          </p>
        </div>
        <p className="mt-2 text-[12px] leading-6 text-foreground">
          {submission.moderation.note}
        </p>
      </div>

      {(submission.moderation.revisionMessage || submission.moderation.rejectedReason) && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 ${
            submission.moderation.rejectedReason
              ? "border-destructive/15 bg-destructive/5"
              : "border-[#C9A84C]/15 bg-[#C9A84C]/8"
          }`}
        >
          <p
            className={`text-[11px] uppercase tracking-[0.16em] ${
              submission.moderation.rejectedReason ? "text-destructive" : "text-[#A8890A]"
            }`}
          >
            {submission.moderation.rejectedReason
              ? "Reason sent to owner"
              : "Revision request sent"}
          </p>
          <p className="mt-2 text-[12px] leading-6 text-foreground">
            {submission.moderation.rejectedReason || submission.moderation.revisionMessage}
          </p>
        </div>
      )}

      {submission.status === "pending" ? (
        <div className="mt-4">
          <ActionDecisionBar
            busyAction={busyAction}
            onApprove={onApprove}
            onRequestRevision={onRequestRevision}
            onReject={onReject}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-[12px] text-muted-foreground">
          Nội dung này đã được xử lý. Drawer vẫn hiển thị lại đầy đủ để admin tra cứu
          nhanh trạng thái moderation.
        </div>
      )}
    </div>
  );
}
