export { OwnerApprovalPage } from "./owner-approval-page-clean";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Eye,
  FileBadge2,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageSquareWarning,
  ShieldAlert,
  Store,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../shared/page-header";
import { StatusBadge } from "../shared/status-badge";

type OwnerStatus = "pending" | "approved" | "rejected";
type RiskLevel = "standard" | "attention";
type ViewState = "default" | "loading" | "empty";

interface OwnerApplication {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  businessAddress: string;
  submittedDate: string;
  status: OwnerStatus;
  riskLevel: RiskLevel;
  cuisine: string;
  documents: string[];
  coverage: string;
  note: string;
}

const initialOwners: OwnerApplication[] = [
  {
    id: "owner-1",
    fullName: "Trần Minh Long",
    email: "long.tran@dongphuc.vn",
    businessName: "Nhà hàng Đông Phúc",
    businessAddress: "18 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "12/04/2026 · 09:20",
    status: "pending",
    riskLevel: "standard",
    cuisine: "Quảng Đông",
    documents: ["Giấy phép KD", "CCCD", "Ảnh mặt tiền", "Mã số thuế"],
    coverage: "Hồ sơ đầy đủ 94%",
    note: "Không gian ổn định, nhận diện biển hiệu rõ, phù hợp để đưa vào tuyến phố ẩm thực.",
  },
  {
    id: "owner-2",
    fullName: "Lý Ngọc Mai",
    email: "mai.ly@haiky.com",
    businessName: "Dimsum Hải Ký Signature",
    businessAddress: "42 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "12/04/2026 · 08:10",
    status: "pending",
    riskLevel: "attention",
    cuisine: "Dimsum",
    documents: ["Giấy phép KD", "CCCD", "Ảnh mặt tiền"],
    coverage: "Thiếu xác nhận mã số thuế",
    note: "Hồ sơ mạnh nhưng cần bổ sung giấy tờ thuế để hoàn tất phê duyệt.",
  },
  {
    id: "owner-3",
    fullName: "Nguyễn Bảo Châu",
    email: "chau.nguyen@phoenixtea.vn",
    businessName: "Trà Đạo Phượng Hoàng",
    businessAddress: "72 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "11/04/2026 · 17:45",
    status: "pending",
    riskLevel: "standard",
    cuisine: "Trà đạo",
    documents: ["Giấy phép KD", "CCCD", "Ảnh mặt tiền", "Mã số thuế"],
    coverage: "Hồ sơ đầy đủ 97%",
    note: "Hình ảnh thương hiệu tốt, câu chuyện thương hiệu rõ và phù hợp với tuyến trải nghiệm cao cấp.",
  },
  {
    id: "owner-4",
    fullName: "Vương Gia Huy",
    email: "huy.vuong@royalhotpot.vn",
    businessName: "Lẩu Tứ Xuyên Hoàng Gia",
    businessAddress: "88 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "11/04/2026 · 13:30",
    status: "pending",
    riskLevel: "attention",
    cuisine: "Lẩu Tứ Xuyên",
    documents: ["Giấy phép KD", "CCCD"],
    coverage: "Thiếu ảnh mặt tiền và mã số thuế",
    note: "Cần làm rõ hình ảnh mặt tiền và tình trạng pháp lý trước khi approve.",
  },
  {
    id: "owner-5",
    fullName: "Phạm Thu Hà",
    email: "ha.pham@shanghaibao.vn",
    businessName: "Bánh Bao Thượng Hải",
    businessAddress: "28 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "10/04/2026 · 19:05",
    status: "approved",
    riskLevel: "standard",
    cuisine: "Bánh bao",
    documents: ["Giấy phép KD", "CCCD", "Ảnh mặt tiền", "Mã số thuế"],
    coverage: "Đã phê duyệt",
    note: "Hồ sơ tốt, đã đạt yêu cầu trong vòng trước.",
  },
  {
    id: "owner-6",
    fullName: "Hoàng Thiên Phúc",
    email: "phuc.hoang@wontonlane.vn",
    businessName: "Tiệm Mì Vằn Thắn Thanh Ký",
    businessAddress: "68 Hà Tôn Quyền, Phường 6, Quận 11",
    submittedDate: "10/04/2026 · 10:15",
    status: "rejected",
    riskLevel: "attention",
    cuisine: "Mì - vằn thắn",
    documents: ["CCCD", "Ảnh mặt tiền"],
    coverage: "Đã từ chối do hồ sơ thiếu",
    note: "Cần nộp lại giấy phép kinh doanh hợp lệ và thông tin địa chỉ đồng nhất.",
  },
];

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
        <p className="max-w-[560px] text-[12px] leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "primary" | "gold" | "success";
}) {
  const toneClass =
    tone === "gold"
      ? "from-[#C9A84C]/20 to-[#A8890A]/10 border-[#C9A84C]/20"
      : tone === "success"
        ? "from-[#2D5A3D]/18 to-[#2D5A3D]/8 border-[#2D5A3D]/18"
        : "from-primary/14 to-primary/5 border-primary/18";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br px-4 py-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-[20px] text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function ApprovalActionGroup({
  compact = false,
  disabled = false,
  onApprove,
  onReject,
}: {
  compact?: boolean;
  disabled?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={disabled}
          onClick={onApprove}
          className="rounded-lg border border-[#2D5A3D]/15 bg-[#2D5A3D]/8 px-3 py-1.5 text-[12px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Approve
        </button>
        <button
          disabled={disabled}
          onClick={onReject}
          className="rounded-lg border border-destructive/15 bg-destructive/8 px-3 py-1.5 text-[12px] text-destructive transition-colors hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled}
        onClick={onApprove}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D5A3D]/18 bg-[#2D5A3D]/10 px-4 py-3 text-[13px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/15 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <BadgeCheck className="h-4 w-4" />
        Approve Owner
      </button>
      <button
        disabled={disabled}
        onClick={onReject}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/15 bg-destructive/8 px-4 py-3 text-[13px] text-destructive transition-colors hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <MessageSquareWarning className="h-4 w-4" />
        Reject With Reason
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: OwnerStatus }) {
  if (status === "approved") return <StatusBadge variant="active" label="Đã duyệt" />;
  if (status === "rejected") return <StatusBadge variant="archived" label="Từ chối" />;
  return <StatusBadge variant="pending" label="Chờ duyệt" />;
}

function OwnerRowActions({
  owner,
  onSelect,
  onApprove,
  onReject,
}: {
  owner: OwnerApplication;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (owner.status !== "pending") {
    return (
      <button
        onClick={onSelect}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <Eye className="h-3.5 w-3.5" />
        Xem
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onSelect}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <Eye className="h-3.5 w-3.5" />
        Review
      </button>
      <ApprovalActionGroup compact onApprove={onApprove} onReject={onReject} />
    </div>
  );
}

function OwnerTable({
  owners,
  selectedId,
  viewState,
  onSelect,
  onApprove,
  onReject,
}: {
  owners: OwnerApplication[];
  selectedId: string | null;
  viewState: ViewState;
  onSelect: (owner: OwnerApplication) => void;
  onApprove: (owner: OwnerApplication) => void;
  onReject: (owner: OwnerApplication) => void;
}) {
  if (viewState === "loading") {
    return (
      <div className="rounded-[24px] border border-border bg-card p-4">
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1.2fr_1fr_1.2fr_1.4fr_0.8fr_0.8fr_1fr] gap-3 rounded-2xl border border-border/60 px-4 py-4">
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
        <p className="mt-4 text-[14px] text-foreground">Không có owner nào đang chờ duyệt</p>
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
              {["Full name", "Email", "Business name", "Business address", "Submitted date", "Status", "Actions"].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {owners.map((owner) => (
              <tr
                key={owner.id}
                className={`border-b border-border last:border-b-0 transition-colors ${
                  selectedId === owner.id ? "bg-primary/[0.03]" : "hover:bg-secondary/30"
                }`}
              >
                <td className="px-4 py-4">
                  <button onClick={() => onSelect(owner)} className="text-left">
                    <p className="text-[13px] text-foreground">{owner.fullName}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{owner.cuisine}</p>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[12px] text-foreground">{owner.email}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[12px] text-foreground">{owner.businessName}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[240px] text-[12px] leading-5 text-foreground">{owner.businessAddress}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[12px] text-muted-foreground">{owner.submittedDate}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <StatusPill status={owner.status} />
                    {owner.riskLevel === "attention" && (
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
                    onSelect={() => onSelect(owner)}
                    onApprove={() => onApprove(owner)}
                    onReject={() => onReject(owner)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OwnerProfilePreviewCard({
  owner,
  loading = false,
  onApprove,
  onReject,
}: {
  owner: OwnerApplication | null;
  loading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-5 animate-pulse">
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
        <p className="mt-4 text-[14px] text-foreground">Chọn một hồ sơ để xem nhanh</p>
        <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
          Preview card giúp admin đọc hồ sơ, kiểm tra mức độ đầy đủ và ra quyết định approve/reject ngay bên cạnh bảng.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-border bg-card p-5">
      <div className="rounded-[22px] border border-[#3A252A] bg-[#1A1215] p-4 text-[#FFF8F0]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A84C]">Owner Profile Preview</p>
            <p className="mt-2 text-[16px] text-white">{owner.fullName}</p>
            <p className="mt-1 text-[12px] text-[#E8DDD6]/75">{owner.businessName}</p>
          </div>
          <StatusPill status={owner.status} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {[
          { icon: Mail, label: "Email", value: owner.email },
          { icon: Store, label: "Business", value: owner.businessName },
          { icon: MapPin, label: "Address", value: owner.businessAddress },
          { icon: CalendarDays, label: "Submitted", value: owner.submittedDate },
          { icon: FileBadge2, label: "Coverage", value: owner.coverage },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-foreground">{item.value}</p>
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Submitted documents</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {owner.documents.map((document) => (
              <span key={document} className="rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-2.5 py-1 text-[11px] text-[#A8890A]">
                {document}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Admin note</p>
          <p className="mt-2 text-[12px] leading-6 text-foreground">{owner.note}</p>
        </div>
      </div>

      {owner.status === "pending" ? (
        <div className="mt-4">
          <ApprovalActionGroup onApprove={onApprove} onReject={onReject} />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-[12px] text-muted-foreground">
          Hồ sơ này đã được xử lý. Bảng danh sách bên trái vẫn giữ lịch sử để admin tra cứu nhanh.
        </div>
      )}
    </div>
  );
}

function RejectReasonModal({
  open,
  owner,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  owner: OwnerApplication | null;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !owner) return null;

  const quickReasons = [
    "Thông tin giấy phép kinh doanh chưa đầy đủ.",
    "Địa chỉ cửa hàng chưa khớp với hồ sơ.",
    "Cần bổ sung ảnh mặt tiền rõ hơn.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[560px] rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[18px] text-foreground">Reject owner application</p>
                <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                  Phản hồi sẽ được gửi với giọng điệu lịch sự để chủ cửa hàng biết cần chỉnh sửa gì trước khi nộp lại.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3">
            <p className="text-[12px] text-foreground">{owner.businessName}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{owner.fullName} · {owner.email}</p>
          </div>

          <div>
            <label className="mb-2 block text-[12px] text-foreground">Rejection reason</label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ví dụ: Hồ sơ hiện chưa có mã số thuế và ảnh mặt tiền chưa đủ rõ để đối chiếu. Vui lòng bổ sung rồi gửi lại."
              className="min-h-[132px] w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">Nên nêu rõ điểm còn thiếu để owner dễ chỉnh sửa và gửi lại.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickReasons.map((item) => (
              <button
                key={item}
                onClick={() => onReasonChange(item)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/10 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">Destructive action có copy lịch sự, không dùng wording nặng nề.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground transition-colors hover:bg-muted"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={reason.trim().length < 12}
              className="rounded-xl border border-destructive/15 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Gửi phản hồi & Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatePreviewCard({
  title,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  subtitle: string;
  tone: "neutral" | "gold" | "green" | "red";
  icon: ReactNode;
}) {
  const toneClass =
    tone === "gold"
      ? "border-[#C9A84C]/15 bg-[#C9A84C]/8"
      : tone === "green"
        ? "border-[#2D5A3D]/15 bg-[#2D5A3D]/5"
        : tone === "red"
          ? "border-destructive/15 bg-destructive/5"
          : "border-border bg-background";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[13px] text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function OwnerApprovalPageStaticShowcase() {
  const [applications, setApplications] = useState<OwnerApplication[]>(initialOwners);
  const [viewState, setViewState] = useState<ViewState>("default");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(initialOwners[0]?.id ?? null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "approve" | "reject"; message: string } | null>(null);

  const filteredOwners = useMemo(() => {
    if (viewState === "empty") return [];
    return applications;
  }, [applications, viewState]);

  const selectedOwner =
    filteredOwners.find((item) => item.id === selectedOwnerId) ??
    applications.find((item) => item.id === selectedOwnerId) ??
    null;

  const rejectTarget = applications.find((item) => item.id === rejectTargetId) ?? null;

  useEffect(() => {
    if (filteredOwners.length === 0) {
      setSelectedOwnerId(null);
      return;
    }
    if (!selectedOwner || !filteredOwners.some((item) => item.id === selectedOwner.id)) {
      setSelectedOwnerId(filteredOwners[0].id);
    }
  }, [filteredOwners, selectedOwner]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleApprove = (owner: OwnerApplication) => {
    setApplications((prev) => prev.map((item) => (item.id === owner.id ? { ...item, status: "approved" } : item)));
    setFeedback({ type: "approve", message: `Đã approve hồ sơ của ${owner.fullName}.` });
  };

  const handleOpenReject = (owner: OwnerApplication) => {
    setRejectTargetId(owner.id);
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectTarget || rejectReason.trim().length < 12) return;
    setApplications((prev) => prev.map((item) => (item.id === rejectTarget.id ? { ...item, status: "rejected", note: rejectReason.trim() } : item)));
    setFeedback({ type: "reject", message: `Đã gửi phản hồi từ chối cho ${rejectTarget.fullName}.` });
    setRejectTargetId(null);
    setRejectReason("");
  };

  const pendingCount = applications.filter((item) => item.status === "pending").length;
  const attentionCount = applications.filter((item) => item.status === "pending" && item.riskLevel === "attention").length;
  const approvedToday = applications.filter((item) => item.status === "approved").length;

  return (
    <div className="space-y-6 pb-10">
      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            feedback.type === "approve"
              ? "border-[#2D5A3D]/18 bg-[#2D5A3D]/5"
              : "border-[#C9A84C]/18 bg-[#C9A84C]/10"
          }`}
        >
          {feedback.type === "approve" ? (
            <BadgeCheck className="h-5 w-5 shrink-0 text-[#2D5A3D]" />
          ) : (
            <MessageSquareWarning className="h-5 w-5 shrink-0 text-[#A8890A]" />
          )}
          <div className="flex-1">
            <p className="text-[13px] text-foreground">{feedback.message}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {feedback.type === "approve"
                ? "Approval success state cần gọn, rõ và không làm gián đoạn flow."
                : "Reject success state xác nhận đã gửi reason lịch sự để owner có thể nộp lại."}
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Owner Approval"
        subtitle="Duyệt hồ sơ owner đăng ký vào Smart Food Tour với quan hệ rõ ràng giữa list, detail preview và reject flow."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-border bg-card p-1">
              {(["default", "loading", "empty"] as ViewState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => setViewState(state)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] transition-colors ${
                    viewState === state ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {state === "default" ? "Default" : state === "loading" ? "Loading" : "Empty"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Pending owners" value={String(pendingCount)} note="Danh sách ưu tiên cần quyết định hôm nay" tone="primary" />
        <SummaryCard label="Needs attention" value={String(attentionCount)} note="Thiếu giấy tờ hoặc cần đọc kỹ trước khi approve" tone="gold" />
        <SummaryCard label="Approved today" value={String(approvedToday)} note="Giữ nhịp duyệt nhanh nhưng vẫn kiểm soát rủi ro" tone="success" />
      </div>

      <SectionFrame
        eyebrow="Frame 01"
        title="OwnerApproval List"
        description="Frame chính dùng trong desktop admin: bảng pending bên trái, preview bên phải. Cách tổ chức này giúp admin đọc hồ sơ nhanh và ra quyết định mà không phải nhảy context quá nhiều."
      >
        <div className="space-y-5 rounded-[28px] border border-border bg-[#F7F1ED] p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <OwnerTable
              owners={filteredOwners.slice(0, 10)}
              selectedId={selectedOwnerId}
              viewState={viewState}
              onSelect={(owner) => setSelectedOwnerId(owner.id)}
              onApprove={handleApprove}
              onReject={handleOpenReject}
            />
            <OwnerProfilePreviewCard
              owner={viewState === "loading" ? null : selectedOwner}
              loading={viewState === "loading"}
              onApprove={selectedOwner ? () => handleApprove(selectedOwner) : undefined}
              onReject={selectedOwner ? () => handleOpenReject(selectedOwner) : undefined}
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        eyebrow="Frame 02"
        title="Reject Flow With Reason"
        description="Reject flow được giữ mềm mại, lịch sự và có trách nhiệm. Admin luôn phải nhập lý do rõ ràng trước khi từ chối, giúp owner dễ sửa và nộp lại."
      >
        <div className="rounded-[28px] border border-border bg-[#F7F1ED] p-5">
          <div className="mx-auto max-w-[560px] rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[18px] text-foreground">Reject owner application</p>
                  <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                    Copy tập trung vào phản hồi mang tính hướng dẫn, không phán xét.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3">
                <p className="text-[12px] text-foreground">Dimsum Hải Ký Signature</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Lý Ngọc Mai · mai.ly@haiky.com</p>
              </div>
              <div className="rounded-2xl border border-border bg-input-background px-4 py-3">
                <p className="text-[12px] text-foreground">Rejection reason</p>
                <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                  Hồ sơ hiện chưa có xác nhận mã số thuế và ảnh mặt tiền chưa đủ rõ để đối chiếu. Vui lòng bổ sung hai mục này rồi gửi lại để hệ thống tiếp tục xét duyệt.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Thiếu giấy phép KD", "Địa chỉ chưa khớp", "Cần ảnh mặt tiền rõ hơn"].map((item) => (
                  <span key={item} className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/10 px-6 py-4">
              <p className="text-[11px] text-muted-foreground">Destructive action được giảm lực bằng lý do rõ ràng và copy mềm.</p>
              <div className="flex items-center gap-3">
                <button className="rounded-xl bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground">Hủy</button>
                <button className="rounded-xl border border-destructive/15 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
                  Gửi phản hồi & Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        eyebrow="Frame 03"
        title="Owner Detail Preview"
        description="Frame preview này có thể coi như owner detail state. Mục tiêu là giúp admin đọc các trường quan trọng nhất trong một glance, trước khi approve hoặc mở reject flow."
      >
        <OwnerProfilePreviewCard
          owner={applications.find((item) => item.status === "pending") ?? applications[0]}
          onApprove={() => {}}
          onReject={() => {}}
        />
      </SectionFrame>

      <SectionFrame
        eyebrow="Components"
        title="Action States"
        description="Component section cho approval/reject states và badge states để frontend dễ map sang React + Tailwind mà không phải suy diễn lại behavior."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">ApprovalActionGroup</p>
            <div className="mt-4 space-y-3">
              <ApprovalActionGroup />
              <ApprovalActionGroup compact />
              <ApprovalActionGroup disabled />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">StatusBadge</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill status="pending" />
              <StatusPill status="approved" />
              <StatusPill status="rejected" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Row Relationship</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border bg-card px-3 py-3 text-[12px] text-foreground">
                Review button chọn row và mở preview context.
              </div>
              <div className="rounded-xl border border-[#2D5A3D]/15 bg-[#2D5A3D]/5 px-3 py-3 text-[12px] text-[#2D5A3D]">
                Approve là positive action nhưng vẫn dùng outline/tint, không quá “loud”.
              </div>
              <div className="rounded-xl border border-destructive/15 bg-destructive/5 px-3 py-3 text-[12px] text-destructive">
                Reject luôn đi qua reason modal để giảm rủi ro thao tác.
              </div>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        eyebrow="State Showcase"
        title="Default / Loading / Empty / Success"
        description="State showcase gom đủ các trạng thái quan trọng: default list, loading, empty, owner detail preview, reject modal, approval success và reject success."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatePreviewCard title="Default list" subtitle="Table + preview card cùng hiển thị, giúp quyết định nhanh." tone="neutral" icon={<Building2 className="h-4 w-4 text-primary" />} />
          <StatePreviewCard title="Loading state" subtitle="Skeleton rows và skeleton preview card giữ đúng layout để tránh nhảy bố cục." tone="neutral" icon={<Loader2 className="h-4 w-4 text-muted-foreground" />} />
          <StatePreviewCard title="Empty state" subtitle="Empty copy nhẹ nhàng, nhấn mạnh inbox pending hiện chưa có mục nào." tone="neutral" icon={<Inbox className="h-4 w-4 text-muted-foreground" />} />
          <StatePreviewCard title="Owner detail preview" subtitle="Preview card làm cầu nối giữa table và action group, giảm việc mở nhiều màn." tone="gold" icon={<Eye className="h-4 w-4 text-[#A8890A]" />} />
          <StatePreviewCard title="Approval success" subtitle="Banner xanh xác nhận hành động mà không khóa nhịp duyệt tiếp theo." tone="green" icon={<BadgeCheck className="h-4 w-4 text-[#2D5A3D]" />} />
          <StatePreviewCard title="Reject success" subtitle="Banner vàng ấm xác nhận đã gửi phản hồi lịch sự cho owner." tone="gold" icon={<MessageSquareWarning className="h-4 w-4 text-[#A8890A]" />} />
        </div>
      </SectionFrame>

      <section className="rounded-[28px] border border-[#3A252A] p-6 text-[#FFF8F0]" style={{ backgroundImage: "linear-gradient(135deg, #1A1215 0%, #24171B 50%, #1F1518 100%)" }}>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#C9A84C]">Handoff Notes For Dev</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">Approval / reject flow</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>Row `Review` chọn owner và đồng bộ dữ liệu sang `OwnerProfilePreviewCard`.</div>
              <div>`Approve` cập nhật trạng thái ngay và hiển thị success banner ngắn gọn.</div>
              <div>`Reject` luôn đi qua `RejectReasonModal`; chỉ submit khi có reason đủ rõ.</div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">Destructive action treatment</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>Reject không dùng màu đỏ đặc toàn khối; giữ tint + border để vẫn sang và có kiểm soát.</div>
              <div>Copy trong modal ưu tiên hướng dẫn owner chỉnh sửa hơn là phán xét hồ sơ.</div>
              <div>Quick reject trên row chỉ là trigger mở modal, không phải destructive action trực tiếp.</div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-[13px] text-[#FFF8F0]">Table / detail / modal relationship</p>
            <div className="mt-3 space-y-2 text-[11px] leading-6 text-[#E8DDD6]/80">
              <div>`OwnerTable` là nơi scan nhanh và sắp ưu tiên.</div>
              <div>`OwnerProfilePreviewCard` là decision surface chính cho desktop.</div>
              <div>`RejectReasonModal` chỉ mở khi admin đã có context từ table hoặc preview, tránh reject mù.</div>
            </div>
          </div>
        </div>
      </section>

      <RejectReasonModal
        open={!!rejectTarget}
        owner={rejectTarget}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectTargetId(null);
          setRejectReason("");
        }}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
