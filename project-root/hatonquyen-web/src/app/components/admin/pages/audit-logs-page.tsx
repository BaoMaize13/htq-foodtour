import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { PageHeader } from "../shared/page-header";
import { fetchAdminAuditLogs } from "./admin.service";

type AuditLogItem = {
  id: string;
  adminUser: string;
  action: string;
  targetId: string;
  timestamp: string;
};

const SOCKET_SERVER_URL = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        setErrorMessage("");
        const response = await fetchAdminAuditLogs();

        if (!isMounted) {
          return;
        }

        setLogs(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Không thể tải nhật ký hoạt động.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("new_audit_log", (newLog: AuditLogItem) => {
      setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50));
    });

    socket.on("connect_error", () => {
      setErrorMessage("Kết nối thời gian thực bị gián đoạn.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Nhật ký hoạt động" subtitle="Theo dõi lịch sử thao tác hệ thống" />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">{errorMessage}</div>
      ) : null}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Thời gian</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Người dùng</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Hành động</th>
              <th className="px-4 py-3 text-left text-[12px] text-muted-foreground uppercase tracking-wider">Mã đối tượng</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-5 text-center text-[13px] text-muted-foreground">
                  Đang tải nhật ký hoạt động...
                </td>
              </tr>
            ) : null}

            {!isLoading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-5 text-center text-[13px] text-muted-foreground">
                  Chưa có nhật ký hoạt động.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-foreground">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{log.adminUser}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{log.targetId}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogsPage;
