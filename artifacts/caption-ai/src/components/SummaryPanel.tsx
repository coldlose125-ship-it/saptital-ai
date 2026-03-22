import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Hash } from 'lucide-react';

interface SummaryPanelProps {
  summaryText: string;
  keywords: string[];
}

export function SummaryPanel({ summaryText, keywords }: SummaryPanelProps) {
  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/10">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">실시간 AI 요약</h2>
      </div>

      <div className="flex-1">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            최근 내용
          </h3>
          <AnimatePresence mode="wait">
            <motion.p 
              key={summaryText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-foreground leading-relaxed font-medium"
            >
              {summaryText}
            </motion.p>
          </AnimatePresence>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4" />
            핵심 키워드
          </h3>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {keywords.length > 0 ? (
                keywords.map((kw) => (
                  <motion.span
                    key={kw}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-background border border-border px-3 py-1.5 rounded-lg text-sm font-semibold text-primary shadow-sm"
                  >
                    {kw}
                  </motion.span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground bg-white/50 px-3 py-1.5 rounded-lg border border-transparent">
                  아직 추출된 키워드가 없습니다.
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
