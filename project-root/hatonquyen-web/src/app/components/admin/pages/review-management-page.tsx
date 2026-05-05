import { Loader2, Star, EyeOff, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { deleteAdminReview, fetchAdminReviews, updateAdminReviewStatus } from "./admin.service";

interface ReviewRow {
  id: string;
  user: { id: string; fullName: string; email: string } | null;
  poi: { id: string; name: string } | null;
  rating: number;
  content: string;
  status: "published" | "hidden";
  createdAt: string;
}

export function ReviewManagementPage() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    setRequestState("loading");
    setError(null);

    try {
      const response = await fetchAdminReviews();
      setItems(response.data || []);
      setRequestState("success");
    } catch (err) {
      setRequestState("error");
      setError(err instanceof Error ? err.message : "Không thể tải đánh giá");
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const handleToggle = async (item: ReviewRow) => {
    try {
      const nextStatus = item.status === "published" ? "hidden" : "published";
      const response = await updateAdminReviewStatus(item.id, nextStatus);
      setItems((prev) => prev.map((row) => (row.id === item.id ? response.data : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái review");
    }
  };

  const handleDelete = async (item: ReviewRow) => {
    try {
      await deleteAdminReview(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa review");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Đánh giá" subtitle="Theo dõi và kiểm duyệt đánh giá từ người dùng" />

      {requestState === "error" && error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Người dùng</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">POI</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Rating</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Nội dung</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-right text-[12px] text-muted-foreground uppercase tracking-wider">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {requestState === "loading" ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu đánh giá...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Star className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] text-foreground">Chưa có dữ liệu đánh giá</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-foreground">{item.user?.fullName || "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground">{item.user?.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.poi?.name || "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{"★".repeat(item.rating)}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground max-w-[380px] truncate">{item.content}</td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${item.status === "published" ? "bg-[#2D5A3D]/10 text-[#2D5A3D]" : "bg-secondary text-muted-foreground"}`}>
                      {item.status === "published" ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => void handleToggle(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors">
                        <EyeOff className="w-3.5 h-3.5" /> {item.status === "published" ? "Ẩn" : "Hiện"}
                      </button>
                      <button onClick={() => void handleDelete(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewManagementPage;
