import { Loader2, EyeOff, Trash2, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { deleteAdminMenu, fetchAdminMenus, updateAdminMenuStatus } from "./admin.service";

interface MenuItemRow {
  id: string;
  name: string;
  poi: { id: string; name: string } | null;
  price: number;
  category: string;
  status: "active" | "hidden";
}

export function MenuManagementPage() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadMenus = async () => {
    setRequestState("loading");
    setError(null);

    try {
      const response = await fetchAdminMenus();
      setItems(response.data || []);
      setRequestState("success");
    } catch (err) {
      setRequestState("error");
      setError(err instanceof Error ? err.message : "Không thể tải menu");
    }
  };

  useEffect(() => {
    void loadMenus();
  }, []);

  const handleToggle = async (item: MenuItemRow) => {
    try {
      const nextStatus = item.status === "active" ? "hidden" : "active";
      const response = await updateAdminMenuStatus(item.id, nextStatus);
      setItems((prev) => prev.map((row) => (row.id === item.id ? response.data : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái menu");
    }
  };

  const handleDelete = async (item: MenuItemRow) => {
    try {
      await deleteAdminMenu(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa menu item");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Menu" subtitle="Chuẩn hóa và quản lý thực đơn toàn hệ thống" />

      {requestState === "error" && error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Tên món</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">POI</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Giá</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Danh mục</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-right text-[12px] text-muted-foreground uppercase tracking-wider">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {requestState === "loading" ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu menu...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] text-foreground">Chưa có dữ liệu menu</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.poi?.name || "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.price.toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.category}</td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${item.status === "active" ? "bg-[#2D5A3D]/10 text-[#2D5A3D]" : "bg-secondary text-muted-foreground"}`}>
                      {item.status === "active" ? "Hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => void handleToggle(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors">
                        <EyeOff className="w-3.5 h-3.5" /> {item.status === "active" ? "Ẩn" : "Hiện"}
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

export default MenuManagementPage;
