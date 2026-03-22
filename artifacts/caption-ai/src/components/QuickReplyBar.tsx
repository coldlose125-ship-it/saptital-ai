import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Volume2, Square } from 'lucide-react';
import { speakText } from '@/lib/ai-service';
import { useSettings } from '@/lib/settings-context';

interface QuickReplyBarProps {
  replies: string[];
  isLoading?: boolean;
  onReply?: (text: string) => void;
}

function SkeletonButton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay }}
      className="flex-1 min-w-[140px] h-11 rounded-xl bg-primary/15"
      aria-hidden="true"
    />
  );
}

export function QuickReplyBar({ replies, isLoading = false, onReply }: QuickReplyBarProps) {
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const { t } = useSettings();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleClick = async (text: string, idx: number) => {
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    setSpeakingIdx(idx);
    onReply?.(text);
    await speakText(text);
    if (mountedRef.current) setSpeakingIdx(null);
  };

  const showSkeleton = isLoading && replies.length === 0;
  const showReplies = replies.length >= 3;

  return (
    <AnimatePresence>
      {(showSkeleton || showReplies) && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          role="region"
          aria-label={t('reply.region')}
          className="bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3 shrink-0"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="text-xs font-semibold text-muted-foreground">
                {showSkeleton
                  ? t('reply.loading')
                  : speakingIdx !== null
                    ? t('reply.speaking')
                    : t('reply.hint')}
              </span>
              {showSkeleton
                ? <span className="ml-auto flex gap-0.5" aria-hidden="true">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                : speakingIdx !== null
                  ? <span className="ml-auto flex gap-0.5" aria-hidden="true">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  : <Volume2 className="w-3.5 h-3.5 text-primary ml-auto" aria-hidden="true" />
              }
            </div>

            <div className="flex gap-2.5 flex-wrap" role={showReplies ? 'group' : undefined} aria-label={showReplies ? t('reply.group') : undefined}>
              {showSkeleton ? (
                <>
                  <SkeletonButton delay={0} />
                  <SkeletonButton delay={0.1} />
                  <SkeletonButton delay={0.2} />
                </>
              ) : (
                replies.slice(0, 3).map((reply, idx) => {
                  const isSpeaking = speakingIdx === idx;
                  return (
                    <motion.button
                      key={reply}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => handleClick(reply, idx)}
                      aria-label={isSpeaking ? `"${reply}" ${t('reply.stop')}` : `"${reply}" ${t('reply.speak')}`}
                      aria-pressed={isSpeaking}
                      className={[
                        'flex-1 min-w-[140px] flex items-center justify-center gap-2 font-semibold text-sm px-4 py-3 rounded-xl shadow-sm transition-all duration-200',
                        isSpeaking
                          ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse-soft'
                          : 'bg-primary hover:bg-primary/90 active:scale-95 text-white',
                      ].join(' ')}
                    >
                      {isSpeaking
                        ? <Square className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        : <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      }
                      {reply}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
