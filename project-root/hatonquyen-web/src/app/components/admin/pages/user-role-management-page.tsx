import { Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "./admin.service";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "moderator" | "editor" | "user" | "owner";
  accountStatus: "active" | "suspended";
}

const roleOptions: UserRow["role"][] = ["admin", "moderator", "editor", "user", "owner"];

export function UserRoleManagementPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setRequestState("loading");
    setError(null);

    try {
      const response = await fetchAdminUsers();
      setItems(response.data || []);
      setRequestState("success");
    } catch (err) {
      setRequestState("error");
      setError(err instanceof Error ? err.message : "Không thể tải người dùng");
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleRoleChange = async (user: UserRow, role: UserRow["role"]) => {
    if (role === user.role) return;

    try {
      const response = await updateAdminUserRole(user.id, role);
      setItems((prev) => prev.map((item) => (item.id === user.id ? response.data : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đổi role");
    }
  };

  const handleToggleStatus = async (user: UserRow) => {
    try {
      const nextStatus = user.accountStatus === "active" ? "suspended" : "active";
      const response = await updateAdminUserStatus(user.id, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === user.id ? response.data : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái user");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Người dùng & Phân quyền" subtitle="Quản lý tài khoản và vai trò hệ thống" />

      {requestState === "error" && error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">User Name</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-[12px] text-muted-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {requestState === "loading" ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu người dùng...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] text-foreground">Chưa có dữ liệu người dùng</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.fullName}</td>
                  <td className="px-4 py-3 text-[13px] text-foreground">{item.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={item.role}
                      onChange={(event) => void handleRoleChange(item, event.target.value as UserRow["role"])}
                      className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] text-foreground"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${item.accountStatus === "active" ? "bg-[#2D5A3D]/10 text-[#2D5A3D]" : "bg-destructive/10 text-destructive"}`}>
                      {item.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => void handleToggleStatus(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors">
                      {item.accountStatus === "active" ? "Suspend User" : "Reactivate User"}
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

export default UserRoleManagementPage;
