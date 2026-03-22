import React from 'react';
import { ProcessedTranscript } from '@/lib/caption-engine';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, Clock, Edit2, Loader2, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TranscriptItemProps {
  data: ProcessedTranscript;
  isInterim?: boolean;
}

export function TranscriptItem({ data, isInterim = false }: TranscriptItemProps) {

  // Prefer AI tier over keyword tier when available
  const activeTier = data.aiTier ?? data.tier;

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case '긴급':
        return {
          wrapper: 'border-[#ff4d4d] bg-[#fff5f5]',
          badge: 'bg-[#ff4d4d] text-white',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          isPulse: true
        };
      case '핵심':
        return {
          wrapper: 'border-[#ff8c1a] bg-[#fffaf5]',
          badge: 'bg-[#ff8c1a] text-white',
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
          isPulse: false
        };
      case '중요':
      case '일정':
      case '변경':
        return {
          wrapper: 'border-[#ffcc00] bg-[#fffdf0]',
          badge: 'bg-[#ffcc00] text-amber-950',
          icon: <Info className="w-3.5 h-3.5 mr-1" />,
          isPulse: false
        };
      default:
        return {
          wrapper: 'border-transparent bg-white',
          badge: null,
          icon: null,
          isPulse: false
        };
    }
  };

  const styles = getTierStyles(activeTier);

  // Topic label: AI topic if available, else tier name
  const topicLabel = data.aiTopic ?? (activeTier !== '일반' ? activeTier : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "relative w-full p-4 rounded-2xl border transition-all duration-300",
        styles.wrapper,
        isInterim ? "opacity-60 grayscale-[50%]" : "opacity-100 shadow-sm",
        "hover:shadow-md"
      )}
    >
      {/* Header: Badge & Timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* AI loading spinner */}
          {data.aiLoading && !isInterim && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI 분석 중</span>
            </span>
          )}

          {/* Topic badge — shows when AI is done or keyword matched */}
          {!data.aiLoading && topicLabel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide gap-1",
                styles.badge,
                styles.isPulse && "animate-pulse-soft"
              )}
            >
              {data.aiTopic ? <Sparkles className="w-3 h-3" /> : styles.icon}
              {topicLabel}
            </motion.div>
          )}

          {isInterim && (
            <span className="text-xs text-muted-foreground flex items-center animate-pulse">
              <Edit2 className="w-3 h-3 mr-1" /> 작성 중...
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium flex items-center">
          <Clock className="w-3 h-3 mr-1 opacity-50" />
          {format(data.timestamp, 'HH:mm:ss')}
        </span>
      </div>

      {/* Main Text Content */}
      <p className="text-lg leading-relaxed text-foreground tracking-tight">
        {data.segments.map((segment, idx) => {
          if (!segment.isKeyword) {
            return <span key={idx}>{segment.text}</span>;
          }
          return (
            <span
              key={idx}
              className={cn(
                "font-bold px-1 py-0.5 rounded-md inline-block -my-0.5 mx-0.5 transition-colors",
                segment.keywordTier === '긴급' ? "bg-red-100 text-red-700" :
                segment.keywordTier === '핵심' ? "bg-orange-100 text-orange-700" :
                "bg-yellow-100 text-yellow-800"
              )}
            >
              {segment.text}
            </span>
          );
        })}
      </p>
    </motion.div>
  );
}
