import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Volume2 } from 'lucide-react';
import { speakText } from '@/lib/ai-service';

interface QuickReplyBarProps {
  replies: string[];
  onReply?: (text: string) => void;
}

export function QuickReplyBar({ replies, onReply }: QuickReplyBarProps) {
  const handleClick = (text: string) => {
    speakText(text);
    onReply?.(text);
  };

  return (
    <AnimatePresence>
      {replies.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3 shrink-0"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">빠른 답변 — 클릭하면 음성으로 전달됩니다</span>
              <Volume2 className="w-3.5 h-3.5 text-primary ml-auto" />
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {replies.slice(0, 3).map((reply, idx) => (
                <motion.button
                  key={reply}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => handleClick(reply)}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-sm transition-all duration-150"
                  title={`"${reply}" 음성 출력`}
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  {reply}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
