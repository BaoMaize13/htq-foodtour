import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { fetchAdminActiveOwners, toggleAdminOwnerSuspend } from "./admin.service";

interface ActiveOwnerRow {
  id: string;
  ownerId: string;
  fullName: string;
  email: string;
  accountStatus: "active" | "suspended";
  businessName: string;
}

export function ActiveOwnersPage() {
  const [items, setItems] = useState<ActiveOwnerRow[]>([]);
  const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadOwners = async () => {
    setRequestState("loading");
    setError(null);

    try {
      const response = await fetchAdminActiveOwners();
      setItems(response.data || []);
      setRequestState("success");
    } catch (err) {
      setRequestState("error");
      setError(err instanceof Error ? err.message : "Không thể tải owner hoạt động");
    }
  };

  useEffect(() => {
    void loadOwners();
  }, []);

  const handleToggleStatus = async (owner: ActiveOwnerRow) => {
    try {
      const response = await toggleAdminOwnerSuspend(owner.id);
      setItems((prev) => prev.map((item) => (item.id === owner.id ? response.data : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái owner");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Chủ cửa hàng hoạt động" subtitle="Quản lý tài khoản owner, khóa/mở khóa" />

      {requestState === "error" && error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Business</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Account Status</th>
              <th className="px-4 py-3 text-right text-[12px] text-muted-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {requestState === "loading" ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu owner...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] text-foreground">Không có owner hoạt động</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.fullName}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.email}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.businessName}</td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${item.accountStatus === "active" ? "bg-[#2D5A3D]/10 text-[#2D5A3D]" : "bg-destructive/10 text-destructive"}`}>
                      {item.accountStatus === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => void handleToggleStatus(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors">
                      {item.accountStatus === "active" ? "Suspend Account" : "Reactivate Account"}
                    </button>
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

export default ActiveOwnersPage;
