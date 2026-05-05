import { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { ttsEngine } from '../core/tts/engine';

const playerI18n: Record<string, { ready: string; playing: string; paused: string; stopped: string }> = {
  'vi-VN': { ready: 'Chọn điểm đến để nghe...', playing: 'Đang phát', paused: 'Tạm dừng', stopped: 'Đã dừng' },
  'en-US': { ready: 'Select a destination to listen...', playing: 'Playing', paused: 'Paused', stopped: 'Stopped' },
  'zh-CN': { ready: '选择目的地收听...', playing: '正在播放', paused: '已暂停', stopped: '已停止' },
  'ja-JP': { ready: '目的地を選んで聴く...', playing: '再生中', paused: '一時停止', stopped: '停止' },
  'fr-FR': { ready: 'Choisir une destination...', playing: 'Lecture', paused: 'En pause', stopped: 'Arrêté' },
};

export function MiniTTSPlayer({ lang = 'vi-VN' }: { lang?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const t = playerI18n[lang] || playerI18n['vi-VN'];

  useEffect(() => {
    const updateState = (state: any) => {
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
      setCurrentText(state.currentText || '');
    };
    const unsubscribe = ttsEngine.subscribe(updateState);
    updateState(ttsEngine.getState());
    return unsubscribe;
  }, []);

  const handlePlay = () => {
    if (!currentText) {
      void ttsEngine.speak({
        text: 'Đây là đoạn audio mẫu để nghe thử giọng đọc cho hệ thống Smart Food Tour.',
        destination: 'Audio preview',
        language: lang as any,
        mode: 'DEV',
      });
      return;
    }

    ttsEngine.play();
  };

  const handlePause = () => {
    ttsEngine.pause();
  };

  const handleStop = () => {
    ttsEngine.stop();
  };

  const isStopped = !isPlaying && !isPaused && !!currentText;
  const showBadge = isPlaying || isPaused || isStopped;
  const badgeText = isPlaying ? t.playing : isPaused ? t.paused : t.stopped;
  const badgeClass = isPlaying
    ? 'bg-green-500/20 text-green-400'
    : isPaused
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-gray-500/20 text-gray-400';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-gradient-to-br from-[#8B1538] to-[#5C0A1F] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]"></div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[#FFD700] text-sm font-semibold tracking-wide">
                🏮 FOOD TOUR
              </h3>
              {showBadge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-white text-base font-medium leading-snug">
              {currentText || t.ready}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="w-14 h-14 rounded-full bg-[#FFD700] hover:bg-[#FFC700] active:scale-95
                         transition-all duration-200 flex items-center justify-center
                         shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Play"
            >
              <Play className="w-6 h-6 text-[#8B1538] ml-0.5" />
            </button>

            <button
              onClick={handlePause}
              disabled={!isPlaying && !isPaused}
              className="w-11 h-11 rounded-full bg-[#D4AF37] hover:bg-[#C49F2F]
                         active:scale-95 transition-all duration-200
                         flex items-center justify-center shadow-md hover:shadow-lg
                         disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Pause"
            >
              <Pause className="w-5 h-5 text-[#8B1538]" />
            </button>

            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="w-11 h-11 rounded-full bg-[#5C0A1F] border-2 border-[#D4AF37]/50
                         hover:bg-[#3A0915] hover:border-[#D4AF37]
                         active:scale-95 transition-all duration-200
                         flex items-center justify-center shadow-md
                         disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Stop"
            >
              <Square className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
            </button>
          </div>
        </div>

        <div className="h-2 bg-[#5C0A1F] flex gap-1 px-2 pb-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-[#D4AF37] opacity-30 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
