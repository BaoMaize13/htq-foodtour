import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { SearchInput } from "../shared/search-input";
import {
    fetchAdminUsers,
    updateAdminUserRole,
    updateAdminUserStatus,
    type AdminUsersMeta,
} from "./admin.service";

interface UserRow {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "moderator" | "editor" | "user" | "owner";
    accountStatus: "active" | "suspended";
}

const roleOptions: UserRow["role"][] = ["admin", "moderator", "editor", "user", "owner"];
const DEFAULT_PAGE_SIZE = 10;

const defaultMeta: AdminUsersMeta = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

export function UserRoleManagementPage() {
    const [items, setItems] = useState<UserRow[]>([]);
    const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<AdminUsersMeta>(defaultMeta);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearchText(searchText.trim());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [searchText]);

    const loadUsers = async (nextPage = page, keyword = debouncedSearchText) => {
        setRequestState("loading");
        setError(null);

        try {
            const response = await fetchAdminUsers({
                search: keyword,
                page: nextPage,
                limit: DEFAULT_PAGE_SIZE,
            });

            setItems(response.data || []);
            setMeta(response.meta || defaultMeta);
            setRequestState("success");
        } catch (err) {
            setRequestState("error");
            setError(err instanceof Error ? err.message : "Không thể tải người dùng");
        }
    };

    useEffect(() => {
        void loadUsers(page, debouncedSearchText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearchText]);

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setPage(1);
    };

    const handleRefresh = () => {
        void loadUsers(page, debouncedSearchText);
    };

    const handleRoleChange = async (user: UserRow, role: UserRow["role"]) => {
        if (role === user.role) return;

        try {
            const response = await updateAdminUserRole(user.id, role);
            setItems((prev) => prev.map((item) => (item.id === user.id ? (response.data as UserRow) : item)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể đổi role");
        }
    };

    const handleToggleStatus = async (user: UserRow) => {
        try {
            const nextStatus = user.accountStatus === "active" ? "suspended" : "active";
            const response = await updateAdminUserStatus(user.id, nextStatus);
            setItems((prev) => prev.map((item) => (item.id === user.id ? (response.data as UserRow) : item)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái user");
        }
    };

    const goToPreviousPage = () => {
        if (!meta.hasPrevPage || requestState === "loading") return;
        setPage((current) => Math.max(1, current - 1));
    };

    const goToNextPage = () => {
        if (!meta.hasNextPage || requestState === "loading") return;
        setPage((current) => current + 1);
    };

    const firstItemIndex = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    const lastItemIndex = Math.min(meta.page * meta.limit, meta.total);

    return (
        <div className="space-y-5">
            <PageHeader
                title="Người dùng & Phân quyền"
                subtitle="Quản lý tài khoản, vai trò và trạng thái người dùng hệ thống"
                action={
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={requestState === "loading"}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${requestState === "loading" ? "animate-spin" : ""}`} />
                        Làm mới
                    </button>
                }
            />

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                    {error}
                </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <SearchInput
                        value={searchText}
                        onChange={handleSearchChange}
                        placeholder="Tìm theo tên, email, role, trạng thái..."
                    />

                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="rounded-full bg-secondary px-3 py-1.5">
                            Tổng: <strong className="text-foreground">{meta.total}</strong> người dùng
                        </span>
                        {debouncedSearchText && (
                            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                                Đang tìm: {debouncedSearchText}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
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
                                            <div>
                                                <p className="text-[14px] text-foreground">Không tìm thấy người dùng</p>
                                                <p className="text-[12px] text-muted-foreground mt-1">
                                                    Hãy thử đổi từ khóa tìm kiếm hoặc làm mới dữ liệu.
                                                </p>
                                            </div>
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

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[12px] text-muted-foreground">
                        Hiển thị <strong className="text-foreground">{firstItemIndex}</strong> - <strong className="text-foreground">{lastItemIndex}</strong> / <strong className="text-foreground">{meta.total}</strong> người dùng
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goToPreviousPage}
                            disabled={!meta.hasPrevPage || requestState === "loading"}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Trước
                        </button>

                        <span className="rounded-lg bg-secondary px-3 py-1.5 text-[12px] text-foreground">
                            Trang {meta.page} / {meta.totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={goToNextPage}
                            disabled={!meta.hasNextPage || requestState === "loading"}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserRoleManagementPage;
