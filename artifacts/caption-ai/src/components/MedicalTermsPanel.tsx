import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FlaskConical, Stethoscope, MousePointerClick, ArrowLeft } from 'lucide-react';

interface MedicalTerm {
  term: string;
  explanation: string;
}

interface SelectedBlock {
  topic?: string;
  displayText?: string;
  originalText: string;
  medical_terms?: MedicalTerm[];
  keywords?: string[];
}

interface MedicalTermsPanelProps {
  selectedBlock: SelectedBlock | null;
  globalTerms: MedicalTerm[];
  globalKeywords: string[];
  onClearSelection: () => void;
}

function TermCard({ term, explanation }: MedicalTerm) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <FlaskConical className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary truncate">{term}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{explanation}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function MedicalTermsPanel({ selectedBlock, globalTerms, globalKeywords, onClearSelection }: MedicalTermsPanelProps) {
  const terms = selectedBlock?.medical_terms ?? globalTerms;
  const keywords = selectedBlock?.keywords ?? globalKeywords;
  const isBlockSelected = selectedBlock !== null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-xl">
          <Stethoscope className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">
            {isBlockSelected ? '선택 블록 분석' : '의학 용어 사전'}
          </h2>
          {isBlockSelected && selectedBlock?.topic && (
            <p className="text-xs text-muted-foreground truncate">{selectedBlock.topic}</p>
          )}
        </div>
        {isBlockSelected && (
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            전체
          </button>
        )}
      </div>

      {/* Medical terms list */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-2.5 pr-0.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          의학 용어 풀이
        </div>
        <AnimatePresence mode="wait">
          {terms.length > 0 ? (
            <motion.div
              key={isBlockSelected ? 'selected' : 'global'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2.5"
            >
              {terms.map((t, i) => <TermCard key={`${t.term}-${i}`} {...t} />)}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center py-6 text-muted-foreground"
            >
              <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">어려운 의학 용어가 없습니다</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2"># 핵심 키워드</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map(kw => (
              <span key={kw} className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      {!isBlockSelected && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
            자막 블록을 클릭하면 해당 내용의 의학 용어를 볼 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
