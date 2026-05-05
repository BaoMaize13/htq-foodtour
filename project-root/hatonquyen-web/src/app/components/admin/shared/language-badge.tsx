type Language = "vi" | "zh" | "en" | "ja" | "fr";

const langConfig: Record<Language, { label: string; flag: string; color: string }> = {
  vi: { label: "Tiếng Việt", flag: "🇻🇳", color: "bg-[#DA251D]/8 text-[#DA251D] border-[#DA251D]/15" },
  zh: { label: "中文", flag: "🇨🇳", color: "bg-[#DE2910]/8 text-[#DE2910] border-[#DE2910]/15" },
  en: { label: "English", flag: "🇬🇧", color: "bg-[#1A3A6B]/8 text-[#1A3A6B] border-[#1A3A6B]/15" },
  ja: { label: "日本語", flag: "🇯🇵", color: "bg-[#BC002D]/8 text-[#BC002D] border-[#BC002D]/15" },
  fr: { label: "Français", flag: "🇫🇷", color: "bg-[#244C8A]/8 text-[#244C8A] border-[#244C8A]/15" },
};

interface LanguageBadgeProps {
  lang: Language;
  compact?: boolean;
}

export function LanguageBadge({ lang, compact = false }: LanguageBadgeProps) {
  const cfg = langConfig[lang];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border ${cfg.color}`}>
      <span className="text-[12px]">{cfg.flag}</span>
      {!compact && cfg.label}
    </span>
  );
}

export type { Language };
