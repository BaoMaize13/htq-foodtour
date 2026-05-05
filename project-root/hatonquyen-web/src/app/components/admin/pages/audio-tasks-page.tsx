import { AlertCircle, Loader2, Play, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../shared/page-header";
import { ttsEngine, type TTSLanguage } from "../../../../core/tts/engine";

type LanguageCode = "vi" | "en" | "zh" | "ja" | "fr";
type TranslationStatus = "idle" | "loading" | "ready" | "error";

interface TranslationItem {
  text: string;
  status: TranslationStatus;
  error?: string;
}

interface LanguageConfig {
  code: LanguageCode;
  label: string;
  translateLocale: string;
  hint: string;
}

const LANGUAGE_CONFIG: LanguageConfig[] = [
  { code: "vi", label: "Tiếng Việt", translateLocale: "vi", hint: "Nội dung gốc để thử đọc" },
  { code: "en", label: "English", translateLocale: "en", hint: "Bản dịch tiếng Anh" },
  { code: "zh", label: "中文", translateLocale: "zh-CN", hint: "Bản dịch tiếng Trung" },
  { code: "ja", label: "日本語", translateLocale: "ja", hint: "Bản dịch tiếng Nhật" },
  { code: "fr", label: "Français", translateLocale: "fr", hint: "Bản dịch tiếng Pháp" },
];

const createEmptyTranslations = (): Record<LanguageCode, TranslationItem> => ({
  vi: { text: "", status: "idle" },
  en: { text: "", status: "idle" },
  zh: { text: "", status: "idle" },
  ja: { text: "", status: "idle" },
  fr: { text: "", status: "idle" },
});

const extractTranslatedText = (payload: unknown) => {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  return payload[0]
    .map((item) => (Array.isArray(item) ? String(item[0] || "") : ""))
    .join("")
    .trim();
};

const translateVietnameseText = async (text: string, targetLocale: string) => {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "vi");
  url.searchParams.set("tl", targetLocale);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Translator HTTP ${response.status}`);
  }

  const payload = JSON.parse(await response.text());
  const translated = extractTranslatedText(payload);

  if (!translated) {
    throw new Error("Bộ dịch trả về rỗng");
  }

  return translated;
};

const TTS_LANGUAGE_MAP: Record<LanguageCode, TTSLanguage> = {
  vi: "vi-VN",
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  fr: "fr-FR",
};

export function AudioTasksPage() {
  const [sourceText, setSourceText] = useState("");
  const [translations, setTranslations] = useState<Record<LanguageCode, TranslationItem>>(createEmptyTranslations);
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const [playingLanguage, setPlayingLanguage] = useState<LanguageCode | null>(null);
  const [queueMode, setQueueMode] = useState<"single" | "all" | null>(null);

  const translateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateRunRef = useRef(0);
  const playSessionRef = useRef(0);
  const queueRef = useRef<LanguageCode[]>([]);
  const translationsRef = useRef(translations);
  const engineActiveRef = useRef(false);
  const pendingEngineStartRef = useRef(false);

  useEffect(() => {
    translationsRef.current = translations;
  }, [translations]);

  useEffect(() => {
    const handleState = (state: ReturnType<typeof ttsEngine.getState>) => {
      const isActive = state.isPlaying || state.isPaused || Boolean(state.currentText);
      const wasActive = engineActiveRef.current;
      engineActiveRef.current = isActive;

      if (isActive) {
        pendingEngineStartRef.current = false;
      }

      if (!wasActive || isActive || pendingEngineStartRef.current) {
        return;
      }

      const nextCode = queueRef.current.shift();
      if (nextCode) {
        startPlayback(nextCode, playSessionRef.current);
        return;
      }

      finishPlayback();
    };

    const unsubscribe = ttsEngine.subscribe(handleState);
    handleState(ttsEngine.getState());

    return () => {
      unsubscribe();
      ttsEngine.stop();
    };
  }, []);

  const finishPlayback = () => {
    setPlayingLanguage(null);
    setQueueMode(null);
  };

  const stopPlayback = (clearNotice = true) => {
    playSessionRef.current += 1;
    queueRef.current = [];
    engineActiveRef.current = false;
    pendingEngineStartRef.current = false;
    ttsEngine.stop();

    finishPlayback();
    if (clearNotice) {
      setPlaybackNotice(null);
    }
  };

  const startPlayback = (languageCode: LanguageCode, session: number) => {
    const config = LANGUAGE_CONFIG.find((item) => item.code === languageCode);
    const text = translationsRef.current[languageCode]?.text?.trim();

    if (!config || !text) {
      const nextCode = queueRef.current.shift();
      if (nextCode) {
        startPlayback(nextCode, session);
      } else {
        finishPlayback();
      }
      return;
    }

    if (session !== playSessionRef.current) {
      return;
    }

    setPlayingLanguage(languageCode);
    setPlaybackNotice(null);
    pendingEngineStartRef.current = true;

    void ttsEngine.speak({
      text,
      destination: config.label,
      language: TTS_LANGUAGE_MAP[languageCode],
      mode: "DEV",
      voice: "female",
    });
  };

  const beginPlayback = (languageCodes: LanguageCode[], mode: "single" | "all") => {
    const playableCodes = languageCodes.filter((code) => translationsRef.current[code]?.text?.trim());
    if (playableCodes.length === 0) return;

    const [firstCode, ...restCodes] = playableCodes;
    const nextSession = playSessionRef.current + 1;

    playSessionRef.current = nextSession;
    queueRef.current = restCodes;
    setQueueMode(mode);
    setPlaybackNotice(null);
    engineActiveRef.current = false;
    pendingEngineStartRef.current = false;
    ttsEngine.stop();
    startPlayback(firstCode, nextSession);
  };

  const translateAllTargets = async (text: string) => {
    const requestId = ++translateRunRef.current;

    setTranslations({
      vi: { text, status: "ready" },
      en: { text: "", status: "loading" },
      zh: { text: "", status: "loading" },
      ja: { text: "", status: "loading" },
      fr: { text: "", status: "loading" },
    });
    const targets = LANGUAGE_CONFIG.filter((item) => item.code !== "vi");
    const results = await Promise.allSettled(
      targets.map(async (item) => {
        const translatedText = await translateVietnameseText(text, item.translateLocale);
        return { code: item.code, translatedText };
      })
    );

    if (requestId !== translateRunRef.current) {
      return;
    }

    results.forEach((result, index) => {
      const target = targets[index];
      if (result.status === "fulfilled") {
        setTranslations((prev) => ({
          ...prev,
          [target.code]: {
            text: result.value.translatedText,
            status: "ready",
          },
        }));
        return;
      }

      const message = result.reason instanceof Error ? result.reason.message : "Không thể dịch";
      setTranslations((prev) => ({
        ...prev,
        [target.code]: {
          text: "",
          status: "error",
          error: message,
        },
      }));
    });
  };

  useEffect(() => {
    const trimmedSource = sourceText.trim();

    if (translateTimerRef.current) {
      clearTimeout(translateTimerRef.current);
    }

    stopPlayback(false);

    if (!trimmedSource) {
      translateRunRef.current += 1;
      setTranslations(createEmptyTranslations());
      setPlaybackNotice(null);
      return;
    }

    setTranslations({
      vi: { text: trimmedSource, status: "ready" },
      en: { text: "", status: "loading" },
      zh: { text: "", status: "loading" },
      ja: { text: "", status: "loading" },
      fr: { text: "", status: "loading" },
    });

    translateTimerRef.current = setTimeout(() => {
      void translateAllTargets(trimmedSource);
    }, 500);

    return () => {
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
      }
    };
  }, [sourceText]);

  useEffect(() => {
    return () => {
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
      }
      stopPlayback();
    };
  }, []);

  const isTranslating = useMemo(
    () => LANGUAGE_CONFIG.some((item) => item.code !== "vi" && translations[item.code].status === "loading"),
    [translations]
  );

  const readyCount = useMemo(
    () => LANGUAGE_CONFIG.filter((item) => translations[item.code].text.trim()).length,
    [translations]
  );

  const canPlayAll = useMemo(
    () => LANGUAGE_CONFIG.every((item) => translations[item.code].text.trim()),
    [translations]
  );

  const handleRefresh = () => {
    const trimmedSource = sourceText.trim();
    if (!trimmedSource) return;
    stopPlayback();
    void translateAllTargets(trimmedSource);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dev TTS Test"
        subtitle="Nhập 1 đoạn tiếng Việt, hệ thống tự dịch sang 4 ngôn ngữ còn lại và phát thử."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!sourceText.trim() || isTranslating}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Dịch lại
            </button>
            <button
              type="button"
              onClick={() => beginPlayback(LANGUAGE_CONFIG.map((item) => item.code), "all")}
              disabled={!canPlayAll || isTranslating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Phát cả 5 ngôn ngữ
            </button>
            <button
              type="button"
              onClick={() => stopPlayback()}
              disabled={!playingLanguage}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              Dừng
            </button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.3fr,0.9fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] text-foreground">Nguồn tiếng Việt</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Không cần chọn nhà hàng, không cần chọn từng ngôn ngữ trước. Chỉ nhập nội dung tiếng Việt để test.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
              {readyCount}/5 bản sẵn sàng
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-4">
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-muted-foreground">Nội dung tiếng Việt</label>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Ví dụ: Xin chào, đây là bản thử nghiệm thuyết minh du lịch ẩm thực bằng tiếng Việt."
              rows={7}
              className="min-h-[180px] w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Tự động dịch sau 0.5 giây khi ngừng gõ.</span>
              <span>{sourceText.trim().length} ký tự</span>
            </div>
          </div>
        </section>

      </div>

      {playbackNotice && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{playbackNotice}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LANGUAGE_CONFIG.map((item) => {
          const translation = translations[item.code];
          const isPlaying = playingLanguage === item.code;
          const isReady = translation.status === "ready" && Boolean(translation.text.trim());
          const statusTone =
            translation.status === "error"
              ? "border-destructive/30 bg-destructive/5"
              : isPlaying
              ? "border-primary/40 bg-primary/5"
              : translation.status === "loading"
              ? "border-border bg-secondary/30"
              : "border-border bg-card";

          return (
            <section key={item.code} className={`rounded-2xl border p-4 shadow-sm transition-colors ${statusTone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] text-foreground">{item.label}</h3>
                    {item.code === "vi" && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">Nguồn</span>}
                    {isPlaying && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">Đang phát</span>}
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{item.hint}</p>
                </div>

                <button
                  type="button"
                  onClick={() => beginPlayback([item.code], "single")}
                  disabled={!isReady || translation.status === "loading"}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {translation.status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Phát
                </button>
              </div>

              <div className="mt-4">
                <textarea
                  value={item.code === "vi" ? sourceText : translation.text}
                  onChange={(event) => {
                    if (item.code === "vi") {
                      setSourceText(event.target.value);
                      return;
                    }

                    setTranslations((prev) => ({
                      ...prev,
                      [item.code]: {
                        text: event.target.value,
                        status: event.target.value.trim() ? "ready" : "idle",
                      },
                    }));
                  }}
                  placeholder={item.code === "vi" ? "Nhập nội dung tiếng Việt..." : "Bản dịch sẽ xuất hiện tại đây..."}
                  rows={6}
                  className="min-h-[160px] w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {translation.status === "loading"
                    ? "Đang dịch..."
                    : translation.status === "error"
                    ? translation.error || "Không thể dịch"
                    : isReady
                    ? "Sẵn sàng phát"
                    : "Chưa có nội dung"}
                </span>
                <span>{(item.code === "vi" ? sourceText : translation.text).trim().length} ký tự</span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default AudioTasksPage;
