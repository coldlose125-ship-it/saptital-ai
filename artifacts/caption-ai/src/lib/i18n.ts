export type Locale = 'ko' | 'en';

const translations = {
  'app.subtitle': {
    ko: '청각장애인 병원 진료 맞춤 소통 서비스',
    en: 'Hospital Communication for Hearing-Impaired',
  },
  'splash.subtitle': {
    ko: '청각장애인을 위한 병원 진료 맞춤 소통 서비스',
    en: 'Bidirectional Hospital Communication for Hearing-Impaired Patients',
  },
  'splash.tagline': {
    ko: 'Hospital Communication Service',
    en: 'Hospital Communication Service',
  },
  'mic.select': { ko: '마이크 기기 선택', en: 'Select microphone' },
  'mic.default': { ko: '기본 마이크', en: 'Default mic' },
  'status.label': { ko: '녹음 상태', en: 'Recording status' },
  'status.waiting': { ko: '대기 중', en: 'Standby' },
  'status.recording': { ko: '녹음 중', en: 'Recording' },
  'status.processing': { ko: '처리 중', en: 'Processing' },
  'status.error': { ko: '오류 발생', en: 'Error' },
  'status.unsupported': { ko: '지원하지 않음', en: 'Unsupported' },
  'font.label': { ko: '자막 글자 크기 선택', en: 'Caption font size' },
  'font.standard': { ko: '표준', en: 'Standard' },
  'font.large': { ko: '크게', en: 'Large' },
  'font.xlarge': { ko: '매우 크게', en: 'X-Large' },
  'font.size': { ko: '글자 크기', en: 'Font size' },
  'export.btn': { ko: '기록 저장', en: 'Export' },
  'export.btn.aria': { ko: '오늘의 진료 기록 저장 및 내보내기', en: 'Save and export today\'s medical records' },
  'btn.start': { ko: '진료 시작', en: 'Start' },
  'btn.start.short': { ko: '시작', en: 'Start' },
  'btn.start.aria': { ko: '진료 시작 — 음성 인식을 시작합니다', en: 'Start consultation — begin speech recognition' },
  'btn.stop': { ko: '중지', en: 'Stop' },
  'btn.stop.aria': { ko: '음성 인식 중지', en: 'Stop speech recognition' },
  'btn.clear.aria': { ko: '자막 기록 전체 삭제', en: 'Delete all captions' },
  'btn.clear.title': { ko: '전체 삭제', en: 'Clear all' },
  'warn.storage': {
    ko: '저장 공간이 부족하여 자동 저장이 중단됐습니다. \'기록 저장\' 버튼으로 수동 저장하세요.',
    en: 'Auto-save stopped due to low storage. Please use the \'Export\' button to save manually.',
  },
  'warn.close': { ko: '경고 닫기', en: 'Close warning' },
  'err.mic.hint': {
    ko: '주소창 왼쪽 🔒 아이콘 → 마이크 → 허용 후 새로고침하세요.',
    en: 'Click the 🔒 icon in the address bar → Microphone → Allow, then refresh.',
  },
  'err.mic.retry': { ko: '재시도', en: 'Retry' },
  'err.mic.retry.aria': { ko: '마이크 권한 재요청', en: 'Request microphone permission again' },
  'err.close': { ko: '오류 메시지 닫기', en: 'Close error message' },
  'caption.log': { ko: '자막 기록', en: 'Caption log' },
  'caption.empty.aria': { ko: '자막 없음. 진료 시작 버튼을 눌러 시작하세요', en: 'No captions. Press Start to begin.' },
  'caption.empty.title': { ko: '아직 자막이 없습니다', en: 'No captions yet' },
  'caption.empty.desc': {
    ko: '\'진료 시작\' 버튼을 눌러 의사의 말씀을 자막으로 확인하세요',
    en: 'Press \'Start\' to see the doctor\'s words as captions',
  },
  'ai.analyzing': { ko: 'AI 분석 중...', en: 'AI analyzing...' },
  'live.label.active': { ko: '실시간 음성 인식 중...', en: 'Real-time speech recognition...' },
  'live.label.idle': { ko: '최근 발화', en: 'Last spoken' },
  'live.placeholder.listening': { ko: '말씀하세요...', en: 'Speak now...' },
  'live.placeholder.idle': { ko: '의사 선생님의 말씀이 여기에 표시됩니다', en: 'Doctor\'s words will appear here' },
  'live.recognizing': { ko: '인식 중', en: 'Recognizing' },
  'live.last': { ko: '최근 발화', en: 'Last spoken' },
  'live.none': { ko: '없음', en: 'None' },
  'mobile.font.label': { ko: '자막 글자 크기 선택 (모바일)', en: 'Caption font size (mobile)' },
  'mobile.terms.open': { ko: '의학 용어 사전 열기', en: 'Open medical glossary' },
  'mobile.terms.btn': { ko: '용어 사전', en: 'Glossary' },
  'mobile.terms.title': { ko: '의학 용어 사전', en: 'Medical Glossary' },
  'mobile.terms.close': { ko: '의학 용어 사전 닫기', en: 'Close medical glossary' },
  'clear.title': { ko: '자막 기록 삭제', en: 'Delete Caption History' },
  'clear.desc': { ko: '지금까지의 대화 기록이 모두 삭제됩니다.', en: 'All conversation history will be deleted.' },
  'clear.confirm': { ko: '삭제된 내용은 복구할 수 없습니다. 계속 진행하시겠습니까?', en: 'Deleted content cannot be recovered. Continue?' },
  'clear.cancel': { ko: '취소', en: 'Cancel' },
  'clear.delete': { ko: '삭제', en: 'Delete' },
  'terms.selected': { ko: '선택 블록 분석', en: 'Selected Block Analysis' },
  'terms.title': { ko: '의학 용어 사전', en: 'Medical Glossary' },
  'terms.back': { ko: '전체', en: 'All' },
  'terms.list.label': { ko: '의학 용어 풀이', en: 'Medical Term Explanations' },
  'terms.list.aria': { ko: '의학 용어 풀이 목록', en: 'Medical term explanations list' },
  'terms.empty': { ko: '어려운 의학 용어가 없습니다', en: 'No medical terms detected' },
  'terms.keywords': { ko: '# 핵심 키워드', en: '# Key Terms' },
  'terms.hint': {
    ko: '자막 블록을 클릭하면 해당 내용의 의학 용어를 볼 수 있습니다',
    en: 'Click a caption block to see its medical terms',
  },
  'terms.panel.aria': { ko: '의학 용어 사전 패널', en: 'Medical glossary panel' },
  'reply.region': { ko: '빠른 답변 버튼', en: 'Quick reply buttons' },
  'reply.loading': { ko: 'AI가 답변을 분석 중입니다...', en: 'AI is analyzing replies...' },
  'reply.speaking': { ko: '음성 전달 중... (버튼을 다시 누르면 중지)', en: 'Speaking... (press again to stop)' },
  'reply.hint': { ko: '빠른 답변 — 클릭하면 음성으로 전달됩니다', en: 'Quick reply — click to speak aloud' },
  'reply.stop': { ko: '음성 중지', en: 'Stop speaking' },
  'reply.speak': { ko: '음성으로 전달', en: 'Speak aloud' },
  'reply.group': { ko: '음성 답변 선택', en: 'Select voice reply' },
  'transcript.topic': { ko: '주제 전환', en: 'Topic Change' },
  'transcript.ai': { ko: 'AI 분석 중...', en: 'AI analyzing...' },
  'transcript.block': { ko: '자막 블록', en: 'Caption block' },
  'transcript.selected': { ko: '선택됨', en: 'selected' },
  'transcript.terms': { ko: '용어', en: 'terms' },
  'transcript.recognizing': { ko: '인식 중...', en: 'Recognizing...' },
  'transcript.original': { ko: '원본', en: 'Original' },
  'export.title': { ko: '오늘의 진료 기록', en: 'Today\'s Medical Record' },
  'export.captions': { ko: '자막 기록', en: 'Caption records' },
  'export.terms': { ko: '의학 용어', en: 'Medical terms' },
  'export.keywords': { ko: '핵심 키워드', en: 'Key terms' },
  'export.section.captions': { ko: '의사 발화 자막 기록', en: 'Doctor\'s Speech Captions' },
  'export.section.terms': { ko: '의학 용어 풀이', en: 'Medical Term Explanations' },
  'export.empty': { ko: '기록된 자막이 없습니다', en: 'No captions recorded' },
  'export.copy': { ko: '텍스트 복사', en: 'Copy Text' },
  'export.save': { ko: 'PDF 저장', en: 'Save PDF' },
  'export.print': { ko: '인쇄하기', en: 'Print' },
  'export.copied': { ko: '클립보드에 복사되었습니다', en: 'Copied to clipboard' },
  'export.copied.hint': { ko: '메시지, 문자 등에 바로 붙여넣기 하세요', en: 'Paste into messages, texts, etc.' },
  'export.popup.blocked': { ko: '팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.', en: 'Popup blocked. Please allow popups and try again.' },
  'export.disclaimer': {
    ko: '※ 본 리포트는 Sapital AI가 음성 인식 및 AI 분석을 통해 자동 생성한 참고용 자료입니다.\n의료적 판단 및 처방은 반드시 담당 의사 선생님과 직접 상담하시기 바랍니다.',
    en: '※ This report was auto-generated by Sapital AI via speech recognition and AI analysis.\nPlease consult your doctor directly for any medical decisions or prescriptions.',
  },
  'export.report.title': { ko: '진료 요약 리포트', en: 'Medical Summary Report' },
  'export.report.date': { ko: '진료 날짜', en: 'Date' },
  'export.report.time': { ko: '진료 시간', en: 'Time' },
  'export.report.count': { ko: '자막 기록', en: 'Captions' },
  'export.report.save.pdf': { ko: '💾 PDF로 저장', en: '💾 Save as PDF' },
  'export.report.close': { ko: '닫기', en: 'Close' },
  'export.report.reprint': { ko: '🖨️ 다시 인쇄', en: '🖨️ Re-print' },
  'export.report.transcript.header': { ko: '의사 발화 자막 기록', en: 'Doctor\'s Speech Caption Log' },
  'export.report.no.captions': { ko: '기록된 자막이 없습니다.', en: 'No captions recorded.' },
  'export.report.term.header': { ko: '의학 용어 풀이', en: 'Medical Term Explanations' },
  'export.report.col.num': { ko: '#', en: '#' },
  'export.report.col.time': { ko: '시각', en: 'Time' },
  'export.report.col.content': { ko: '발화 내용', en: 'Content' },
  'export.report.col.term': { ko: '용어', en: 'Term' },
  'export.report.col.desc': { ko: '쉬운 설명', en: 'Explanation' },
  'export.copy.title': { ko: 'Sapital AI 진료 요약', en: 'Sapital AI Medical Summary' },
  'export.copy.date': { ko: '📅 진료 일시', en: '📅 Date' },
  'export.copy.main': { ko: '🩺 주요 내용', en: '🩺 Key Content' },
  'export.copy.terms': { ko: '💡 알아둘 용어', en: '💡 Terms to Know' },
  'export.copy.none': { ko: '없음', en: 'None' },
  'export.copy.empty': { ko: '기록된 내용이 없습니다.', en: 'No content recorded.' },
  'export.copy.footer': {
    ko: '※ Sapital AI — 청각장애인 병원 진료 맞춤 소통 서비스가 자동 생성한 요약입니다.',
    en: '※ Auto-generated summary by Sapital AI — Hospital Communication Service for Hearing-Impaired.',
  },
  'speech.unsupported': {
    ko: '이 브라우저는 음성인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.',
    en: 'This browser does not support speech recognition. Please use Chrome.',
  },
  'speech.mic.denied': {
    ko: '마이크 권한이 없습니다. 브라우저 주소창의 마이크 아이콘을 클릭해 권한을 허용하세요.',
    en: 'Microphone permission denied. Click the mic icon in the address bar to allow access.',
  },
  'speech.mic.denied2': {
    ko: '마이크 권한이 없습니다. 브라우저 주소창에서 마이크 권한을 허용해주세요.',
    en: 'Microphone access denied. Please allow mic permission in your browser.',
  },
  'speech.network': {
    ko: '네트워크 오류: 인터넷 연결을 확인해주세요.',
    en: 'Network error: Please check your internet connection.',
  },
  'speech.error': { ko: '오류', en: 'Error' },
  'tier.urgent': { ko: '긴급', en: 'Urgent' },
  'tier.core': { ko: '핵심', en: 'Critical' },
  'tier.important': { ko: '중요', en: 'Important' },
  'tier.normal': { ko: '일반', en: 'Normal' },
  'settings.theme': { ko: '테마', en: 'Theme' },
  'settings.lang': { ko: '언어', en: 'Language' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export function translateErrorMsg(msg: string, locale: Locale): string {
  if (msg in translations) return t(msg as TranslationKey, locale);
  if (msg.startsWith('speech.error:')) {
    const code = msg.slice('speech.error:'.length);
    return `${t('speech.error', locale)}: ${code}`;
  }
  return msg;
}

const STATUS_MAP: Record<string, TranslationKey> = {
  'idle': 'status.waiting',
  'recording': 'status.recording',
  'processing': 'status.processing',
  'error': 'status.error',
  'unsupported': 'status.unsupported',
};

export function translateStatus(status: string, locale: Locale): string {
  const key = STATUS_MAP[status];
  return key ? t(key, locale) : status;
}

const TIER_MAP: Record<string, TranslationKey> = {
  '긴급': 'tier.urgent',
  '핵심': 'tier.core',
  '중요': 'tier.important',
  '일반': 'tier.normal',
};

export function translateTier(tier: string, locale: Locale): string {
  const key = TIER_MAP[tier];
  return key ? t(key, locale) : tier;
}

const FONT_LABEL_MAP: Record<number, TranslationKey> = {
  0: 'font.standard',
  1: 'font.large',
  2: 'font.xlarge',
};

export function translateFontLabel(level: number, locale: Locale): string {
  const key = FONT_LABEL_MAP[level];
  return key ? t(key, locale) : String(level);
}
