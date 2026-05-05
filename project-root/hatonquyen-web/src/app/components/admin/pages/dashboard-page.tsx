import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, RefreshCw, Star, TrendingUp, UserCheck, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard, StatCardSkeleton, StatCardError } from "../dashboard/stat-card";
import { DashboardSectionHeader } from "../dashboard/dashboard-section-header";
import { QuickActionCard } from "../dashboard/quick-action-card";
import { fetchAdminDashboardSummary, fetchAnalyticsLiveCount, fetchAnalyticsUsersGrowth } from "./admin.service";

interface DashboardMeta {
  totalPOIs: number;
  pendingOwnerApprovals: number;
  totalUsers: number;
  totalReviews: number;
}

interface UsersGrowthPoint {
  period: string;
  newUsers: number;
  totalUsers: number;
}

const formatPeriodLabel = (period: string) => {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    return `${month}/${year.slice(2)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return period.slice(5);
  }

  return period;
};

export function DashboardPage() {
  const [requestState, setRequestState] = useState<"loading" | "success" | "error">("loading");
  const [analyticsState, setAnalyticsState] = useState<"loading" | "success" | "error">("loading");
  const [liveState, setLiveState] = useState<"loading" | "success" | "error">("loading");
  const [liveUsers, setLiveUsers] = useState(0);
  const [growthPoints, setGrowthPoints] = useState<UsersGrowthPoint[]>([]);
  const [meta, setMeta] = useState<DashboardMeta>({
    totalPOIs: 0,
    pendingOwnerApprovals: 0,
    totalUsers: 0,
    totalReviews: 0,
  });

  const loadDashboard = async () => {
    setRequestState("loading");

    try {
      const response = (await fetchAdminDashboardSummary()) as {
        data?: DashboardMeta;
      };
      setMeta(response.data || { totalPOIs: 0, pendingOwnerApprovals: 0, totalUsers: 0, totalReviews: 0 });
      setRequestState("success");
    } catch {
      setRequestState("error");
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadGrowth = async () => {
      setAnalyticsState("loading");

      try {
        const response = (await fetchAnalyticsUsersGrowth("month")) as {
          data?: { points?: UsersGrowthPoint[] };
        };

        if (!isMounted) {
          return;
        }

        setGrowthPoints(response.data?.points || []);
        setAnalyticsState("success");
      } catch {
        if (isMounted) {
          setAnalyticsState("error");
        }
      }
    };

    void loadGrowth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLiveUsers = async () => {
      try {
        const response = (await fetchAnalyticsLiveCount()) as {
          data?: { liveUsers?: number; liveCount?: number };
        };

        if (!isMounted) {
          return;
        }

        setLiveUsers(Number(response.data?.liveUsers ?? response.data?.liveCount ?? 0));
        setLiveState("success");
      } catch {
        if (isMounted) {
          setLiveState("error");
        }
      }
    };

    void loadLiveUsers();
    const intervalId = window.setInterval(() => void loadLiveUsers(), 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const statData = useMemo(
    () => [
      {
        label: "Tổng Địa điểm (POI)",
        value: String(meta.totalPOIs),
        icon: MapPin,
        gradient: "from-[#7A1B2E] to-[#9B2C3F]",
        subtitle: "Quản lý toàn bộ địa điểm",
        to: "/admin/manage-places",
      },
      {
        label: "Pending Approvals",
        value: String(meta.pendingOwnerApprovals),
        icon: UserCheck,
        gradient: "from-[#C9A84C] to-[#A8890A]",
        subtitle: "Owner chờ duyệt",
        to: "/admin/owner-approval",
      },
      {
        label: "Tổng Người dùng",
        value: String(meta.totalUsers),
        icon: Users,
        gradient: "from-[#2D5A3D] to-[#3D7A52]",
        subtitle: "Tài khoản hệ thống",
        to: "/admin/users",
      },
      {
        label: "Tổng Đánh giá",
        value: String(meta.totalReviews),
        icon: Star,
        gradient: "from-[#4A3B2A] to-[#6B5A42]",
        subtitle: "Review toàn hệ thống",
        to: "/admin/reviews",
      },
    ],
    [meta]
  );

  const quickActions = [
    { icon: MapPin, label: "Quản lý Địa điểm", description: "Đi tới danh sách POI", to: "/admin/manage-places" },
    { icon: UserCheck, label: "Duyệt Chủ cửa hàng", description: "Xử lý owner pending", to: "/admin/owner-approval" },
    { icon: Users, label: "Người dùng & Phân quyền", description: "Quản lý role và trạng thái", to: "/admin/users" },
    { icon: Star, label: "Quản lý Đánh giá", description: "Moderation review", to: "/admin/reviews" },
  ];

  return (
    <div className="space-y-6">
      {requestState === "error" && (
        <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] text-foreground">Không thể kết nối server</p>
            <p className="text-[12px] text-muted-foreground">Dữ liệu dashboard chưa thể cập nhật. Vui lòng thử lại.</p>
          </div>
          <button
            onClick={() => void loadDashboard()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-[12px] hover:bg-destructive/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      )}

      <section>
        <DashboardSectionHeader title="Thống kê người dùng" subtitle="Tăng trưởng tài khoản và người dùng đang online" />
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 mt-3">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] text-emerald-700">
                <span className={`h-2 w-2 rounded-full ${liveState === "success" ? "bg-emerald-500" : liveState === "error" ? "bg-destructive" : "bg-amber-500"}`} />
                Live
              </span>
            </div>
            <div className="mt-5">
              <p className="text-[13px] text-muted-foreground">Người dùng đang hoạt động</p>
              <p className="mt-2 text-4xl font-semibold tracking-normal text-foreground">
                {liveState === "loading" ? "--" : liveUsers.toLocaleString("vi-VN")}
              </p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {liveState === "error" ? "Chưa thể cập nhật live count" : "Cập nhật trực tiếp từ heartbeat"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h2 className="text-[15px] font-semibold text-foreground">Tăng trưởng người dùng</h2>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">Tổng tài khoản tích lũy theo 6 tháng gần nhất</p>
              </div>
              <span className="text-[12px] text-muted-foreground">{growthPoints.length} mốc dữ liệu</span>
            </div>

            <div className="mt-5 h-[260px]">
              {analyticsState === "error" ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-[13px] text-muted-foreground">
                  Không tải được dữ liệu biểu đồ
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthPoints} margin={{ top: 8, right: 18, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatPeriodLabel}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} width={40} />
                    <Tooltip
                      formatter={(value, name) => [
                        Number(value).toLocaleString("vi-VN"),
                        name === "totalUsers" ? "Tổng người dùng" : "User mới",
                      ]}
                      labelFormatter={(label) => `Thời gian: ${formatPeriodLabel(String(label))}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalUsers"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line type="monotone" dataKey="newUsers" stroke="#16A34A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <DashboardSectionHeader title="Tổng quan hệ thống" subtitle="Dữ liệu realtime từ backend" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-3">
          {requestState === "loading"
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : requestState === "error"
            ? statData.map((s) => <StatCardError key={s.label} label={s.label} />)
            : statData.map((s) => (
                <a key={s.label} href={s.to} className="block">
                  <StatCard {...s} />
                </a>
              ))}
        </div>
      </section>

      <section>
        <DashboardSectionHeader title="Thao tác nhanh" subtitle="Truy cập nhanh các chức năng chính" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.to} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
}
