import { Eye, Inbox, Sparkles } from "lucide-react";
import { LanguageBadge } from "../shared/language-badge";
import { ActionDecisionBar } from "./action-decision-bar";
import { ContentStatusBadge } from "./content-status-badge";
import type {
  ContentActionInFlight,
  ContentSubmission,
  ContentViewState,
} from "./types";

interface ContentApprovalTableProps {
  items: ContentSubmission[];
  selectedId: string | null;
  viewState: ContentViewState;
  actionInFlight?: ContentActionInFlight | null;
  onSelect: (submission: ContentSubmission) => void;
  onApprove: (submission: ContentSubmission) => void;
  onRequestRevision: (submission: ContentSubmission) => void;
  onReject: (submission: ContentSubmission) => void;
}

export function ContentApprovalTable({
  items,
  selectedId,
  viewState,
  actionInFlight = null,
  onSelect,
  onApprove,
  onRequestRevision,
  onReject,
}: ContentApprovalTableProps) {
  if (viewState === "loading") {
    return (
      <div className="rounded-[24px] border border-border bg-card p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.35fr_1fr_0.8fr_1fr_0.9fr_1fr_1.25fr] gap-3 rounded-2xl border border-border/60 px-4 py-4"
            >
              {Array.from({ length: 7 }).map((__, cell) => (
                <div key={cell} className="h-4 rounded bg-secondary" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-secondary/15 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-[14px] text-foreground">
          Không có nội dung nào đang chờ duyệt
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Khi owner gửi nội dung mới, danh sách pending sẽ xuất hiện ở đây để admin
          xét duyệt.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {[
                "Title",
                "POI / Quán",
                "Language",
                "Submitted by",
                "Status",
                "Submitted date",
                "Actions",
              ].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-[12px] uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const busyAction =
                actionInFlight?.submissionId === item.id ? actionInFlight.action : null;

              return (
                <tr
                  key={item.id}
                  className={`border-b border-border last:border-b-0 transition-colors ${
                    selectedId === item.id ? "bg-primary/[0.03]" : "hover:bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-4">
                    <button onClick={() => onSelect(item)} className="text-left">
                      <p className="max-w-[260px] text-[13px] leading-5 text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.contentType === "story"
                          ? "Story content"
                          : item.contentType === "script"
                            ? "Audio script"
                            : "POI overview"}
                      </p>
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{item.relatedPOI.icon}</span>
                      <div>
                        <p className="text-[12px] text-foreground">{item.relatedPOI.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {item.wordCount} từ
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <LanguageBadge lang={item.language} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[12px] text-foreground">{item.submittedBy.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.submittedBy.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <ContentStatusBadge status={item.status} />
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-2.5 py-1 text-[11px] text-[#A8890A]">
                        <Sparkles className="h-3 w-3" />
                        Quality {item.moderation.qualityScore}/100
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[12px] text-muted-foreground">{item.submittedLabel}</p>
                  </td>
                  <td className="px-4 py-4">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelect(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </button>
                        <ActionDecisionBar
                          compact
                          busyAction={busyAction}
                          onApprove={() => onApprove(item)}
                          onRequestRevision={() => onRequestRevision(item)}
                          onReject={() => onReject(item)}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelect(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
