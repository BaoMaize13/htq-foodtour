import { Inbox, ShieldAlert } from "lucide-react";
import { OwnerRowActions } from "./owner-row-actions";
import { StatusPill } from "./status-pill";
import type { OwnerActionInFlight, OwnerApplication, ViewState } from "./types";

interface OwnerTableProps {
  owners: OwnerApplication[];
  selectedId: string | null;
  viewState: ViewState;
  actionInFlight?: OwnerActionInFlight | null;
  onSelect: (owner: OwnerApplication) => void;
  onApprove: (owner: OwnerApplication) => void;
  onReject: (owner: OwnerApplication) => void;
}

export function OwnerTable({
  owners,
  selectedId,
  viewState,
  actionInFlight = null,
  onSelect,
  onApprove,
  onReject,
}: OwnerTableProps) {
  if (viewState === "loading") {
    return (
      <div className="rounded-[24px] border border-border bg-card p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.2fr_1fr_1.2fr_1.4fr_0.8fr_0.8fr_1fr] gap-3 rounded-2xl border border-border/60 px-4 py-4"
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

  if (owners.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-secondary/15 px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-[14px] text-foreground">
          Không có owner nào đang chờ duyệt
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Khi có hồ sơ mới, danh sách pending sẽ xuất hiện ở đây để admin xử lý.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {[
                "Full name",
                "Email",
                "Business name",
                "Business address",
                "Submitted date",
                "Status",
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
            {owners.map((owner) => {
              const busyAction =
                actionInFlight?.ownerId === owner.id ? actionInFlight.action : null;

              return (
                <tr
                  key={owner.id}
                  className={`border-b border-border last:border-b-0 transition-colors ${
                    selectedId === owner.id
                      ? "bg-primary/[0.03]"
                      : "hover:bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-4">
                    <button onClick={() => onSelect(owner)} className="text-left">
                      <p className="text-[13px] text-foreground">
                        {owner.owner.fullName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {owner.business.cuisine}
                      </p>
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[12px] text-foreground">{owner.owner.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[12px] text-foreground">{owner.business.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-[240px] text-[12px] leading-5 text-foreground">
                      {owner.business.address}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[12px] text-muted-foreground">
                      {owner.submittedLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <StatusPill status={owner.status} />
                      {owner.review.riskLevel === "attention" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-2.5 py-1 text-[11px] text-[#A8890A]">
                          <ShieldAlert className="h-3 w-3" />
                          Cần xem kỹ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <OwnerRowActions
                      owner={owner}
                      busyAction={busyAction}
                      onSelect={() => onSelect(owner)}
                      onApprove={() => onApprove(owner)}
                      onReject={() => onReject(owner)}
                    />
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
