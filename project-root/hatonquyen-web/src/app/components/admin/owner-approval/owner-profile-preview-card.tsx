import {
  CalendarDays,
  Eye,
  FileBadge2,
  Mail,
  MapPin,
  MessageSquareWarning,
  Store,
} from "lucide-react";
import { ApprovalActionGroup } from "./approval-action-group";
import { StatusPill } from "./status-pill";
import type { ReviewActionType, OwnerApplication } from "./types";

interface OwnerProfilePreviewCardProps {
  owner: OwnerApplication | null;
  loading?: boolean;
  busyAction?: ReviewActionType | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function OwnerProfilePreviewCard({
  owner,
  loading = false,
  busyAction = null,
  onApprove,
  onReject,
}: OwnerProfilePreviewCardProps) {
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

  if (!owner) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Eye className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-[14px] text-foreground">
          Chọn một hồ sơ để xem nhanh
        </p>
        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
          Preview card giúp admin đọc hồ sơ, kiểm tra mức độ đầy đủ và ra quyết định
          approve/reject ngay bên cạnh bảng.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-border bg-card p-5">
      <div className="rounded-[22px] border border-[#3A252A] bg-[#1A1215] p-4 text-[#FFF8F0]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C]">
              Owner Profile Preview
            </p>
            <p className="mt-2 text-[16px] text-white">{owner.owner.fullName}</p>
            <p className="mt-1 text-[12px] text-[#E8DDD6]/75">
              {owner.business.name}
            </p>
          </div>
          <StatusPill status={owner.status} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {[
          { icon: Mail, label: "Email", value: owner.owner.email },
          { icon: Store, label: "Business", value: owner.business.name },
          { icon: MapPin, label: "Address", value: owner.business.address },
          { icon: CalendarDays, label: "Submitted", value: owner.submittedLabel },
          { icon: FileBadge2, label: "Coverage", value: owner.review.coverageLabel },
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

        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Submitted documents
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {owner.documents.map((document) => {
              const isMissing = document.status === "missing";

              return (
                <span
                  key={document.id}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    isMissing
                      ? "border-destructive/15 bg-destructive/5 text-destructive"
                      : "border-[#C9A84C]/15 bg-[#C9A84C]/8 text-[#A8890A]"
                  }`}
                >
                  {document.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Admin note
          </p>
          <p className="mt-2 text-[12px] leading-6 text-foreground">
            {owner.review.adminNote}
          </p>
        </div>

        {owner.review.rejectionReason && (
          <div className="rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-destructive" />
              <p className="text-[11px] uppercase tracking-[0.16em] text-destructive">
                Reason sent to owner
              </p>
            </div>
            <p className="mt-2 text-[12px] leading-6 text-foreground">
              {owner.review.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {owner.status === "pending" ? (
        <div className="mt-4">
          <ApprovalActionGroup
            busyAction={busyAction}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-[12px] text-muted-foreground">
          Hồ sơ này đã được xử lý. Bảng danh sách bên trái vẫn giữ lịch sử để admin
          tra cứu nhanh.
        </div>
      )}
    </div>
  );
}
