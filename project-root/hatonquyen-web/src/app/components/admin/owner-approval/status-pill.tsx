import { StatusBadge } from "../shared/status-badge";
import type { OwnerStatus } from "./types";

interface StatusPillProps {
  status: OwnerStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  if (status === "approved") {
    return <StatusBadge variant="active" label="Đã duyệt" />;
  }

  if (status === "rejected") {
    return <StatusBadge variant="archived" label="Từ chối" />;
  }

  return <StatusBadge variant="pending" label="Chờ duyệt" />;
}
