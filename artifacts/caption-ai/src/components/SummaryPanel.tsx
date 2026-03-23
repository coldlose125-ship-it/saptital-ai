import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Hash, Loader2, MousePointerClick, ArrowLeft } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';

interface SummaryPanelProps {
  summaryText: string;
  keywords: string[];
  isLoading?: boolean;
  isBlockSelected?: boolean;
  selectedTopic?: string;
  onClearSelection?: () => void;
}

export function SummaryPanel({
  summaryText,
  keywords,
  isLoading = false,
  isBlockSelected = false,
  selectedTopic,
  onClearSelection,
}: SummaryPanelProps) {
  const { t } = useSettings();

  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/10">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground tracking-tight truncate">
            {isBlockSelected ? t('summary.title.block') : t('summary.title.live')}
          </h2>
          {isBlockSelected && selectedTopic && (
            <p className="text-xs text-muted-foreground font-medium truncate">{selectedTopic}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isBlockSelected && onClearSelection && (
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
              title={t('summary.btn.back.title')}
            >
              <ArrowLeft className="w-3 h-3" />
              {t('terms.back')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {/* Summary text */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {isBlockSelected ? t('summary.section.block') : t('summary.section.live')}
          </h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={summaryText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-foreground leading-relaxed font-medium"
            >
              {isLoading && summaryText === '' ? (
                <span className="text-muted-foreground text-sm">{t('summary.loading')}</span>
              ) : summaryText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Keywords */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Hash className="w-4 h-4" />
            {t('summary.keywords')}
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
                  {isLoading ? t('summary.keywords.loading') : t('summary.keywords.empty')}
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hint when no block is selected */}
        {!isBlockSelected && (
          <div className="mt-auto pt-4 border-t border-border/40">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
              {t('summary.hint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
