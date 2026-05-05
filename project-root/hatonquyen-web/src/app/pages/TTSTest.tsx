import React, { useState } from 'react';
import { ttsEngine, type TTSLanguage } from '../../core/tts/engine';

const DEFAULT_LANGUAGE: TTSLanguage = 'vi-VN';

const TTSTest: React.FC = () => {
    const [inputText, setInputText] = useState('');

    const handlePlay = () => {
        if (!inputText.trim()) return;
        ttsEngine.speak({
            text: inputText,
            language: DEFAULT_LANGUAGE,
            mode: 'DEV',
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePlay();
        }
    };

    return (
        <div className="bg-burgundy-bg text-gray-200 min-h-screen">
            <header className="bg-gradient-to-r from-burgundy via-[#6B0F2E] to-burgundy border-b-4 border-gold-dark shadow-lg">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gold tracking-wider">
                        🏮 FOOD TOUR — TTS Test Console 🏮
                    </h1>
                    <span className="text-xs text-gold-dark bg-burgundy-dark px-3 py-1 rounded-full border border-gold-dark/40">
                        DEV ONLY
                    </span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <section className="bg-gradient-to-br from-burgundy to-burgundy-dark rounded-2xl border-2 border-gold-dark shadow-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-dark"></div>
                    <div className="px-5 py-3 border-b border-gold-dark/30">
                        <h2 className="text-sm font-semibold text-gold-dark uppercase tracking-wider">
                            🎙️ Speech Input
                        </h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label
                                htmlFor="inputText"
                                className="block text-xs text-gold-dark/70 uppercase tracking-wider mb-1.5"
                            >
                                Text to speak
                            </label>
                            <textarea
                                id="inputText"
                                rows={4}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu muốn đọc..."
                                className="w-full bg-burgundy-bg/60 border border-gold-dark/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition resize-none"
                            ></textarea>
                        </div>

                        <button
                            id="btnPlay"
                            onClick={handlePlay}
                            className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 bg-gold hover:bg-[#FFC700] active:scale-95 text-burgundy shadow-lg shadow-gold/20"
                        >
                            ▶ Phát thử âm thanh
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default TTSTest;
