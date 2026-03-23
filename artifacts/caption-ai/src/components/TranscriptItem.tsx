import React from 'react';
import { ProcessedTranscript } from '@/lib/caption-engine';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Edit2, Loader2, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSettings } from '@/lib/settings-context';
import { translateTier } from '@/lib/i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TranscriptItemProps {
  data: ProcessedTranscript;
  isInterim?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  fontSizeLevel?: 0 | 1 | 2;
}

const MAIN_TEXT_SIZE = ['text-lg', 'text-xl', 'text-2xl'] as const;
const INTERIM_TEXT_SIZE = ['text-xl', 'text-2xl', 'text-3xl'] as const;

const TIER_BADGE: Record<string, string> = {
  긴급: 'bg-red-500 text-white',
  핵심: 'bg-orange-400 text-white',
  중요: 'bg-yellow-400 text-amber-950',
  일반: '',
};

export function TranscriptItem({ data, isInterim = false, isSelected = false, onClick, fontSizeLevel = 0 }: TranscriptItemProps) {
  const { t, locale } = useSettings();
  const activeTier = data.aiTier ?? data.tier;
  const mainText = data.displayText ?? data.originalText;
  const hasTerms = (data.medical_terms?.length ?? 0) > 0;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={!isInterim ? onClick : undefined}
        onKeyDown={!isInterim ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
        role={!isInterim ? 'button' : undefined}
        tabIndex={!isInterim ? 0 : undefined}
        aria-pressed={!isInterim ? isSelected : undefined}
        aria-label={!isInterim ? `${t('transcript.block')}: ${mainText}${isSelected ? ` (${t('transcript.selected')})` : ''}` : undefined}
        className={cn(
          "relative w-full p-4 rounded-2xl border border-border transition-all duration-200 bg-card",
          isInterim ? "opacity-60" : "",
          !isInterim && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isSelected
            ? "ring-2 ring-primary ring-offset-2 shadow-lg border-primary/30"
            : !isInterim && "hover:shadow-md hover:border-primary/20 hover:ring-1 hover:ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {data.aiLoading && !isInterim && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-label={t('transcript.ai')}>
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              {t('transcript.ai')}
            </span>
          )}

          {!data.aiLoading && data.aiTopic && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {data.aiTopic}
            </motion.span>
          )}

          {!data.aiLoading && (activeTier === '긴급' || activeTier === '핵심') && (
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", TIER_BADGE[activeTier])}>
              {translateTier(activeTier, locale)}
            </span>
          )}

          {hasTerms && !data.aiLoading && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              {t('transcript.terms')} {data.medical_terms!.length}
            </span>
          )}

          {isInterim && (
            <span className="text-xs text-muted-foreground flex items-center animate-pulse" aria-label={t('transcript.recognizing')}>
              <Edit2 className="w-3 h-3 mr-1" aria-hidden="true" /> {t('transcript.recognizing')}
            </span>
          )}

          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-50" aria-hidden="true" />
            <time dateTime={data.timestamp.toISOString()}>{format(data.timestamp, 'HH:mm:ss')}</time>
          </span>
        </div>

        <p className={cn(
          "leading-relaxed tracking-tight transition-all duration-300",
          isInterim
            ? `${INTERIM_TEXT_SIZE[fontSizeLevel]} text-muted-foreground`
            : `${MAIN_TEXT_SIZE[fontSizeLevel]} text-foreground font-medium`
        )}>
          {mainText}
        </p>

        {!isInterim && data.displayText && data.displayText !== data.originalText && (
          <p className="mt-1.5 text-xs text-muted-foreground/60 italic border-t border-border/30 pt-1.5">
            {t('transcript.original')}: {data.originalText}
          </p>
        )}
      </motion.div>
    </div>
  );
}
