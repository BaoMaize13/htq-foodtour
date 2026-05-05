import { useMemo, useState, useEffect, useRef } from "react";
import {
    ArrowUpDown,
    FileText,
    Globe,
    Loader2,
    Volume2,
    VolumeX,
    Clock3,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Play,
    Square,
} from "lucide-react";
import { PageHeader } from "../shared/page-header";
import { SearchInput } from "../shared/search-input";
import { FilterDropdown, type FilterOption } from "../shared/filter-dropdown";
import { StatusBadge } from "../shared/status-badge";
import { LanguageBadge, type Language } from "../shared/language-badge";
import { RowActionMenu } from "../shared/row-action-menu";
import { PrimaryActionButton } from "../shared/primary-action-button";
import { DeleteConfirmDialog } from "../shared/delete-confirm-dialog";
import { NarrationEditorDrawer } from "../form/narration-editor-drawer";
import { GenerateAudioModal } from "../narration/generate-audio-modal";
import { buildApiUrl, requestJson } from "../../../services/api.service";
import { Badge } from "../../../../components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../components/ui/table";

type NarrationStatus =
    | "active"
    | "draft"
    | "pending"
    | "archived"
    | "approved"
    | "published"
    | "pending_approval"
    | "rejected"
    | "revision_requested";

type AudioStatus =
    | "missing"
    | "pending"
    | "processing"
    | "completed"
    | "ready"
    | "failed";

interface Narration {
    id: string;
    poiId?: string | null;
    title: string;
    shortText: string;
    script?: string;
    fullText?: string;
    images: string[];
    language: Language;
    status: NarrationStatus;
    backendStatus: string;
    poiName: string;
    poiIcon: string;
    wordCount: number;
    audioDuration: string;
    hasAudio: boolean;
    audioStatus: AudioStatus;
    audioUrl?: string;
    updatedAt: string;
}

interface PoiOption {
    value: string;
    label: string;
    icon?: string;
}

const ROWS_PER_PAGE = 8;

const languageLabels: Record<Language, string> = {
    vi: "Tiếng Việt",
    en: "English",
    zh: "中文",
    ja: "日本語",
    fr: "Français",
};

const statusLabels: Record<string, string> = {
    active: "Đã duyệt",
    approved: "Đã duyệt",
    published: "Đã xuất bản",
    draft: "Bản nháp",
    pending: "Chờ duyệt",
    pending_approval: "Chờ duyệt",
    rejected: "Từ chối",
    revision_requested: "Cần chỉnh sửa",
    archived: "Lưu trữ",
};

const audioStatusLabels: Record<AudioStatus, string> = {
    missing: "Chưa có audio",
    pending: "Chờ tạo",
    processing: "Đang tạo",
    completed: "Sẵn sàng",
    ready: "Sẵn sàng",
    failed: "Lỗi audio",
};

const normalizeAudioStatus = (value?: string | null): AudioStatus => {
    if (
        value === "pending" ||
        value === "processing" ||
        value === "completed" ||
        value === "ready" ||
        value === "failed"
    ) {
        return value;
    }

    return "missing";
};

const normalizeStatus = (status: string): NarrationStatus => {
    if (status === "approved") return "active";
    if (status === "published") return "active";
    if (status === "pending_approval") return "pending";
    if (status === "revision_requested") return "pending";
    if (status === "rejected") return "archived";

    return (status as NarrationStatus) || "draft";
};

const normalizeLanguage = (value?: string | null): Language => {
    const normalized = String(value || "").toLowerCase();

    if (normalized.startsWith("vi")) return "vi";
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("zh")) return "zh";
    if (normalized.startsWith("ja")) return "ja";
    if (normalized.startsWith("fr")) return "fr";

    return "vi";
};

const mapNarration = (item: any): Narration => {
    const audioUrl =
        item?.audioUrl ||
        item?.audioFileUrl ||
        item?.audio?.url ||
        item?.audio?.audioUrl ||
        null;

    const audioStatus = normalizeAudioStatus(item?.audioStatus || item?.audio?.status);

    const hasAudio = Boolean(
        audioUrl ||
        item?.audioAssetId ||
        audioStatus === "completed" ||
        audioStatus === "ready"
    );

    const durationLabel = hasAudio
        ? item?.audioDuration || item?.audio?.durationLabel || "Đã tạo"
        : audioStatus === "processing"
            ? "Đang tạo"
            : audioStatus === "pending"
                ? "Chờ tạo"
                : audioStatus === "failed"
                    ? "Cần xử lý"
                    : "Chưa có audio";

    return {
        id: String(item?.id || item?._id || ""),
        poiId: item?.poiId || item?.poi?._id || null,
        title: item?.title || "Untitled",
        shortText: item?.shortText || "",
        script: item?.script || "",
        fullText: item?.fullText || "",
        images: Array.isArray(item?.images) ? item.images : [],
        language: normalizeLanguage(item?.language),
        status: normalizeStatus(String(item?.status || "draft")),
        backendStatus: String(item?.status || "draft"),
        poiName: item?.poiName || item?.poi?.name || "POI",
        poiIcon: item?.poiIcon || "📍",
        wordCount: Number.isFinite(item?.wordCount)
            ? item.wordCount
            : String(item?.fullText || item?.script || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean).length,
        audioDuration: durationLabel,
        hasAudio,
        audioStatus,
        audioUrl: audioUrl || undefined,
        updatedAt: item?.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString("vi-VN")
            : "-",
    };
};

const resolveAudioUrl = (url?: string | null) => {
    const raw = String(url || "").trim();

    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    return buildApiUrl(raw.startsWith("/") ? raw : `/${raw}`);
};

const getSpeechLang = (lang: Language) => {
    if (lang === "en") return "en-US";
    if (lang === "zh") return "zh-CN";
    if (lang === "ja") return "ja-JP";
    if (lang === "fr") return "fr-FR";
    return "vi-VN";
};

const getNarrationSpeechText = (narration: Narration) =>
    String(
        narration.script ||
        narration.fullText ||
        narration.shortText ||
        narration.title ||
        ""
    ).trim();

export function ManageNarrationsPage() {
    const logApiError = (error: unknown) => {
        const err = error as any;

        console.error(
            "API FETCH ERROR in Manage Narrations:",
            err?.response?.status,
            err?.response?.data || err?.message || err
        );
    };

    const [narrations, setNarrations] = useState<Narration[]>([]);
    const [requestState, setRequestState] = useState<
        "idle" | "loading" | "success" | "error"
    >("loading");
    const [requestError, setRequestError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Narration | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingNarration, setEditingNarration] = useState<Narration | null>(null);
    const [audioModalOpen, setAudioModalOpen] = useState(false);
    const [audioNarration, setAudioNarration] = useState<Narration | null>(null);
    const [poiOptions, setPoiOptions] = useState<PoiOption[]>([]);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [languageFilter, setLanguageFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [placeFilter, setPlaceFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [sortField, setSortField] = useState<"title" | "updatedAt" | "wordCount">(
        "updatedAt"
    );
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadNarrations = async () => {
        setRequestState("loading");
        setRequestError(null);

        try {
            const [response, placesResponse] = await Promise.all([
                requestJson("/api/narrations/admin") as Promise<{ data?: unknown[] }>,
                requestJson("/api/places?limit=100") as Promise<{
                    data?: Array<{ id?: string; _id?: string; name?: string }>;
                }>,
            ]);

            setNarrations((response.data || []).map(mapNarration));
            setPoiOptions(
                (placesResponse.data || [])
                    .map((item) => ({
                        value: String(item.id || item._id || ""),
                        label: item.name || "Địa điểm chưa đặt tên",
                        icon: "📍",
                    }))
                    .filter((item) => item.value)
            );
            setRequestState("success");
        } catch (error) {
            logApiError(error);
            setRequestState("error");
            setRequestError(
                error instanceof Error
                    ? error.message
                    : "Không thể tải danh sách thuyết minh"
            );
        }
    };

    useEffect(() => {
        void loadNarrations();
    }, []);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const languageFilters: FilterOption[] = useMemo(
        () => [
            {
                value: "all",
                label: "Tất cả",
                count: narrations.length,
            },
            ...(["vi", "en", "zh", "ja", "fr"] as Language[]).map((lang) => ({
                value: lang,
                label: languageLabels[lang],
                count: narrations.filter((item) => item.language === lang).length,
            })),
        ],
        [narrations]
    );

    const statusFilters: FilterOption[] = useMemo(() => {
        const values = Array.from(new Set(narrations.map((item) => item.status))).filter(
            Boolean
        );

        return [
            {
                value: "all",
                label: "Tất cả",
                count: narrations.length,
            },
            ...values.map((value) => ({
                value,
                label: statusLabels[value] || value,
                count: narrations.filter((item) => item.status === value).length,
            })),
        ];
    }, [narrations]);

    const placeFilters: FilterOption[] = useMemo(() => {
        const uniquePlaces = Array.from(
            new Map(
                narrations.map((item) => [item.poiId || item.poiName, item.poiName])
            ).entries()
        );

        return [
            {
                value: "all",
                label: "Tất cả",
                count: narrations.length,
            },
            ...uniquePlaces.map(([value, label]) => ({
                value,
                label,
                count: narrations.filter((item) => (item.poiId || item.poiName) === value)
                    .length,
            })),
        ];
    }, [narrations]);

    const filteredNarrations = useMemo(() => {
        let result = narrations;
        const q = search.trim().toLowerCase();

        if (q) {
            result = result.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    item.shortText.toLowerCase().includes(q) ||
                    item.poiName.toLowerCase().includes(q)
            );
        }

        if (languageFilter !== "all") {
            result = result.filter((item) => item.language === languageFilter);
        }

        if (statusFilter !== "all") {
            result = result.filter((item) => item.status === statusFilter);
        }

        if (placeFilter !== "all") {
            result = result.filter((item) => (item.poiId || item.poiName) === placeFilter);
        }

        return result;
    }, [languageFilter, narrations, placeFilter, search, statusFilter]);

    const sortedNarrations = useMemo(() => {
        return [...filteredNarrations].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === "string" && typeof valB === "string") {
                return sortDir === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortDir === "asc"
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });
    }, [filteredNarrations, sortDir, sortField]);

    const totalPages = Math.max(1, Math.ceil(sortedNarrations.length / ROWS_PER_PAGE));

    const paginatedNarrations = sortedNarrations.slice(
        (page - 1) * ROWS_PER_PAGE,
        page * ROWS_PER_PAGE
    );

    const hasActiveFilters =
        search.length > 0 ||
        languageFilter !== "all" ||
        statusFilter !== "all" ||
        placeFilter !== "all";

    const isNoResults = hasActiveFilters && sortedNarrations.length === 0;

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const handleDeleteNarration = async (narration: Narration) => {
        try {
            await requestJson(`/api/narrations/${narration.id}`, {
                method: "DELETE",
            });

            setNarrations((prev) => prev.filter((item) => item.id !== narration.id));
            setDeleteTarget(null);
        } catch (error) {
            logApiError(error);
            setRequestError(
                error instanceof Error ? error.message : "Không thể xóa thuyết minh"
            );
        }
    };

    const handleViewNarration = async (narration: Narration) => {
        try {
            const response = (await requestJson(
                `/api/narrations/admin/${narration.id}`
            )) as {
                data?: unknown;
            };

            setAudioNarration(mapNarration(response.data || narration));
            setAudioModalOpen(true);
        } catch (error) {
            logApiError(error);
            setRequestError(
                error instanceof Error
                    ? error.message
                    : "Không thể tải chi tiết thuyết minh"
            );
        }
    };

    const handleToggleAudioPreview = (narration: Narration) => {
        const url = resolveAudioUrl(narration.audioUrl);
        const speechText = getNarrationSpeechText(narration);

        const stopCurrentPreview = () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
            setPlayingAudioId(null);
        };

        const speakFromScript = () => {
            if (
                !speechText ||
                typeof window === "undefined" ||
                !("speechSynthesis" in window)
            ) {
                setPlayingAudioId(null);
                return;
            }

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.lang = getSpeechLang(narration.language);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.onstart = () => setPlayingAudioId(narration.id);
            utterance.onend = () =>
                setPlayingAudioId((current) =>
                    current === narration.id ? null : current
                );
            utterance.onerror = () =>
                setPlayingAudioId((current) =>
                    current === narration.id ? null : current
                );

            window.speechSynthesis.speak(utterance);
        };

        if (playingAudioId === narration.id) {
            stopCurrentPreview();
            return;
        }

        stopCurrentPreview();

        if (!url) {
            speakFromScript();
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        audio.src = url;
        audio.onended = () =>
            setPlayingAudioId((current) => (current === narration.id ? null : current));
        audio.onerror = () => speakFromScript();

        void audio
            .play()
            .then(() => setPlayingAudioId(narration.id))
            .catch(() => speakFromScript());
    };

    const handleEditNarration = async (narration: Narration) => {
        try {
            const response = (await requestJson(
                `/api/narrations/admin/${narration.id}`
            )) as {
                data?: unknown;
            };

            setEditingNarration(mapNarration(response.data || narration));
            setFormMode("edit");
            setFormOpen(true);
        } catch (error) {
            logApiError(error);
            setRequestError(
                error instanceof Error
                    ? error.message
                    : "Không thể mở chỉnh sửa thuyết minh"
            );
        }
    };

    const openCreate = () => {
        setFormMode("create");
        setEditingNarration(null);
        setFormOpen(true);
    };

    const handleSubmitNarration = async (payload: {
        id?: string;
        title: string;
        script: string;
        shortText: string;
        fullText: string;
        images: string[];
        language: string;
        status: string;
        poiId: string;
    }) => {
        const apiStatus =
            payload.status === "active"
                ? "approved"
                : payload.status === "archived"
                    ? "rejected"
                    : payload.status;

        if (formMode === "edit" && payload.id) {
            const response = (await requestJson(`/api/narrations/admin/${payload.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...payload,
                    status: apiStatus,
                }),
            })) as {
                data?: unknown;
            };

            const mapped = mapNarration(response.data);

            setNarrations((prev) =>
                prev.map((item) => (item.id === mapped.id ? mapped : item))
            );

            return;
        }

        const response = (await requestJson("/api/narrations/admin", {
            method: "POST",
            body: JSON.stringify({
                ...payload,
                status: apiStatus,
            }),
        })) as {
            data?: unknown;
        };

        setNarrations((prev) => [mapNarration(response.data), ...prev]);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Quản lý Thuyết minh"
                subtitle={`${narrations.length} bài thuyết minh · ${new Set(narrations.map((n) => n.language)).size
                    } ngôn ngữ`}
                action={<PrimaryActionButton label="Thêm thuyết minh" onClick={openCreate} />}
            />

            {requestState === "error" && requestError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                    {requestError}
                </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <SearchInput
                        value={search}
                        onChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        placeholder="Tìm tiêu đề, mô tả, địa điểm..."
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <FilterDropdown
                            label="Ngôn ngữ"
                            options={languageFilters}
                            value={languageFilter}
                            onChange={(value) => {
                                setLanguageFilter(value);
                                setPage(1);
                            }}
                        />

                        <FilterDropdown
                            label="Trạng thái duyệt"
                            options={statusFilters}
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        />

                        <FilterDropdown
                            label="Địa điểm"
                            options={placeFilters}
                            value={placeFilter}
                            onChange={(value) => {
                                setPlaceFilter(value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div className="xl:ml-auto">
                        <Badge
                            variant="outline"
                            className="rounded-full border-border bg-secondary/40 px-3 py-1 text-[11px] text-muted-foreground"
                        >
                            {sortedNarrations.length} kết quả
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                            <TableHead className="min-w-[320px] px-4 py-3">
                                <button
                                    onClick={() => handleSort("title")}
                                    className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Tiêu đề bài viết <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>

                            <TableHead className="min-w-[190px] px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">
                                Địa điểm liên kết
                            </TableHead>

                            <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">
                                Ngôn ngữ
                            </TableHead>

                            <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">
                                Trạng thái duyệt
                            </TableHead>

                            <TableHead className="px-4 py-3 text-[12px] uppercase tracking-wider text-muted-foreground">
                                Trạng thái audio
                            </TableHead>

                            <TableHead className="px-4 py-3">
                                <button
                                    onClick={() => handleSort("updatedAt")}
                                    className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Cập nhật <ArrowUpDown className="w-3 h-3" />
                                </button>
                            </TableHead>

                            <TableHead className="w-14 px-4 py-3" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {requestState === "loading" ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-16 text-center">
                                    <div className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tải dữ liệu thuyết minh...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedNarrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                        </div>

                                        <p className="text-[14px] text-foreground mb-1">
                                            {isNoResults
                                                ? "Không tìm thấy kết quả"
                                                : "Chưa có thuyết minh nào"}
                                        </p>

                                        <p className="text-[12px] text-muted-foreground mb-4">
                                            {isNoResults
                                                ? "Không có bài nào khớp với bộ lọc hiện tại"
                                                : "Bắt đầu soạn nội dung thuyết minh đầu tiên cho audio tour"}
                                        </p>

                                        {isNoResults ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch("");
                                                    setLanguageFilter("all");
                                                    setStatusFilter("all");
                                                    setPlaceFilter("all");
                                                }}
                                                className="text-[12px] text-primary hover:underline"
                                            >
                                                Xóa bộ lọc
                                            </button>
                                        ) : (
                                            <PrimaryActionButton
                                                label="Thêm thuyết minh đầu tiên"
                                                onClick={openCreate}
                                            />
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedNarrations.map((narr) => (
                                <TableRow key={narr.id} className="hover:bg-secondary/30">
                                    <TableCell className="px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="max-w-[360px] truncate text-[13px] text-foreground">
                                                {narr.title}
                                            </p>
                                            <p className="mt-0.5 max-w-[340px] truncate text-[11px] text-muted-foreground">
                                                {narr.shortText}
                                            </p>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px]">{narr.poiIcon}</span>
                                            <span className="max-w-[170px] truncate text-[12px] text-foreground">
                                                {narr.poiName}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <LanguageBadge lang={narr.language} />
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <StatusBadge
                                            variant={narr.status as any}
                                            label={
                                                narr.status === "active"
                                                    ? "Đã xuất bản"
                                                    : narr.status === "draft"
                                                        ? "Bản nháp"
                                                        : narr.status === "pending"
                                                            ? "Chờ duyệt"
                                                            : "Lưu trữ"
                                            }
                                        />
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${narr.audioStatus === "completed" ||
                                                        narr.audioStatus === "ready"
                                                        ? "border-[#2D5A3D]/15 bg-[#2D5A3D]/8 text-[#2D5A3D]"
                                                        : narr.audioStatus === "processing"
                                                            ? "border-primary/15 bg-primary/8 text-primary"
                                                            : narr.audioStatus === "pending"
                                                                ? "border-[#C9A84C]/15 bg-[#C9A84C]/8 text-[#A8890A]"
                                                                : narr.audioStatus === "failed"
                                                                    ? "border-destructive/15 bg-destructive/8 text-destructive"
                                                                    : "border-border bg-secondary/40 text-muted-foreground"
                                                    }`}
                                            >
                                                {narr.audioStatus === "completed" ||
                                                    narr.audioStatus === "ready" ? (
                                                    <Volume2 className="h-3.5 w-3.5" />
                                                ) : narr.audioStatus === "processing" ||
                                                    narr.audioStatus === "pending" ? (
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                ) : narr.audioStatus === "failed" ? (
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                ) : (
                                                    <VolumeX className="h-3.5 w-3.5" />
                                                )}

                                                <span>{audioStatusLabels[narr.audioStatus]}</span>

                                                {narr.hasAudio && (
                                                    <span className="text-current/70">
                                                        · {narr.audioDuration}
                                                    </span>
                                                )}
                                            </div>

                                            {(narr.audioUrl ||
                                                narr.script ||
                                                narr.fullText ||
                                                narr.shortText ||
                                                narr.title) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleAudioPreview(narr)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2D5A3D]/15 bg-[#2D5A3D]/8 text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/12"
                                                    aria-label={
                                                        playingAudioId === narr.id
                                                            ? `Dừng nghe thử ${narr.title}`
                                                            : `Nghe thử ${narr.title}`
                                                    }
                                                    title={
                                                        playingAudioId === narr.id
                                                            ? "Dừng nghe thử"
                                                            : "Nghe thử audio"
                                                    }
                                                >
                                                    {playingAudioId === narr.id ? (
                                                        <Square className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Play className="ml-0.5 h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <span className="text-[12px] text-muted-foreground">
                                            {narr.updatedAt}
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-4 py-3">
                                        <RowActionMenu
                                            onView={() => void handleViewNarration(narr)}
                                            onEdit={() => void handleEditNarration(narr)}
                                            onDelete={() => setDeleteTarget(narr)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {sortedNarrations.length > 0 && (
                    <div className="flex items-center justify-between border-t border-border bg-secondary/20 px-4 py-3">
                        <p className="text-[12px] text-muted-foreground">
                            Hiển thị {(page - 1) * ROWS_PER_PAGE + 1}–
                            {Math.min(page * ROWS_PER_PAGE, sortedNarrations.length)} trong{" "}
                            {sortedNarrations.length} kết quả
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setPage(item)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-colors ${item === page
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[13px] text-foreground">Tổng quan ngôn ngữ</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(["vi", "en", "zh", "ja", "fr"] as Language[]).map((lang) => {
                        const count = narrations.filter((n) => n.language === lang).length;
                        const published = narrations.filter(
                            (n) => n.language === lang && n.status === "active"
                        ).length;

                        return (
                            <div
                                key={lang}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30 border border-border/50"
                            >
                                <LanguageBadge lang={lang} compact />

                                <div className="min-w-0">
                                    <p className="text-[12px] text-foreground">{count} bài</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {published} xuất bản
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && void handleDeleteNarration(deleteTarget)}
                title={`Xóa "${deleteTarget?.title?.substring(0, 40)}..."?`}
                description={`Thuyết minh "${deleteTarget?.title}" sẽ bị xóa vĩnh viễn. Audio liên quan cũng sẽ bị gỡ khỏi tour.`}
            />

            <NarrationEditorDrawer
                open={formOpen}
                onClose={() => setFormOpen(false)}
                mode={formMode}
                initialData={
                    editingNarration
                        ? {
                            id: editingNarration.id,
                            title: editingNarration.title,
                            shortText: editingNarration.shortText,
                            fullText: editingNarration.fullText || editingNarration.shortText,
                            script: editingNarration.script || editingNarration.shortText,
                            images: editingNarration.images,
                            language: editingNarration.language,
                            status: editingNarration.status,
                            poiId: editingNarration.poiId || "",
                        }
                        : null
                }
                poiOptions={poiOptions}
                onSubmit={handleSubmitNarration}
            />

            <GenerateAudioModal
                open={audioModalOpen}
                onClose={() => {
                    setAudioModalOpen(false);
                    void loadNarrations();
                }}
                narrationId={audioNarration?.id || null}
                narrationStatus={audioNarration?.backendStatus || null}
                narrationTitle={audioNarration?.title || ""}
                narrationScript={
                    audioNarration?.script ||
                    audioNarration?.fullText ||
                    audioNarration?.shortText ||
                    ""
                }
            />
        </div>
    );
}
