import { StatusBadge } from "../shared/status-badge";
import type { ContentModerationStatus } from "./types";

interface ContentStatusBadgeProps {
  status: ContentModerationStatus;
}

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  if (status === "approved") {
    return <StatusBadge variant="active" label="Đã duyệt" />;
  }

  if (status === "revision_requested") {
    return <StatusBadge variant="draft" label="Yêu cầu chỉnh sửa" />;
  }

  if (status === "rejected") {
    return <StatusBadge variant="archived" label="Từ chối" />;
  }

  return <StatusBadge variant="pending" label="Chờ duyệt" />;
}
