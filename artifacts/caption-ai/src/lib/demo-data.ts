import { ProcessedTranscript } from './caption-engine';

export interface DemoEntry {
  delay: number;
  transcript: Omit<ProcessedTranscript, 'id' | 'timestamp'>;
  globalTerms?: { term: string; explanation: string }[];
  globalKeywords?: string[];
  suggestedReplies?: string[];
}

export const DEMO_SCRIPT: DemoEntry[] = [
  {
    delay: 1200,
    transcript: {
      originalText: '안녕하세요, 오늘 어디가 많이 불편하세요?',
      displayText: '안녕하세요, 오늘 어디가 많이 불편하세요?',
      aiLoading: false,
      aiTopic: '초진 문진',
      aiTier: '일반',
      aiKeywords: ['문진', '증상'],
      sentiment: 'neutral',
      topicChanged: false,
      medical_terms: [],
      suggested_replies: ['두통과 메스꺼움이 있습니다', '열이 나고 몸이 무겁습니다', '가슴이 두근거리고 숨이 차요'],
    },
    suggestedReplies: ['두통과 메스꺼움이 있습니다', '열이 나고 몸이 무겁습니다', '가슴이 두근거리고 숨이 차요'],
  },
  {
    delay: 3500,
    transcript: {
      originalText: '며칠 전부터 두통이 심하고 메스꺼움이 있어요. 어지럼증도 있고요.',
      displayText: '수일 전부터 두통과 오심(메스꺼움), 어지럼증 증상이 있습니다.',
      aiLoading: false,
      aiTopic: '신경계 증상',
      aiTier: '중증',
      aiKeywords: ['두통', '메스꺼움', '어지럼증'],
      sentiment: 'negative',
      topicChanged: true,
      medical_terms: [
        { term: '오심', explanation: '메스꺼움을 의학 용어로 표현한 것으로, 구역질이 날 것 같은 불쾌한 느낌' },
        { term: '현훈', explanation: '어지럼증의 의학 용어. 주변이나 자신이 빙빙 도는 것 같은 느낌' },
      ],
      suggested_replies: ['언제부터 시작됐나요?', '두통의 위치가 어디인지 가르쳐주세요', '구토를 동반하나요?'],
    },
    globalTerms: [
      { term: '오심', explanation: '메스꺼움을 의학 용어로 표현한 것. 구역질이 날 것 같은 불쾌한 느낌' },
      { term: '현훈', explanation: '어지럼증의 의학 용어. 주변이나 자신이 빙빙 도는 것 같은 느낌' },
    ],
    globalKeywords: ['두통', '오심', '현훈'],
    suggestedReplies: ['언제부터 시작됐나요?', '두통의 위치는 어디인가요?', '구토를 동반하나요?'],
  },
  {
    delay: 4000,
    transcript: {
      originalText: '혈압을 한번 측정해 보겠습니다. 고혈압 가족력이 있으신가요?',
      displayText: '혈압을 측정하겠습니다. 고혈압 가족력이 있으신지 확인합니다.',
      aiLoading: false,
      aiTopic: '혈압·순환기 확인',
      aiTier: '일반',
      aiKeywords: ['혈압', '고혈압', '가족력'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: '가족력', explanation: '혈연 관계 가족 중에 특정 질병을 가진 사람이 있는 경우' },
      ],
      suggested_replies: ['아버지가 고혈압이십니다', '가족력은 없는 것 같습니다', '정확히 모르겠습니다'],
    },
    globalTerms: [
      { term: '가족력', explanation: '혈연 가족 중 특정 질병을 가진 사람이 있는 경우' },
    ],
    globalKeywords: ['혈압', '고혈압', '가족력'],
    suggestedReplies: ['아버지가 고혈압이십니다', '가족력은 없습니다', '잘 모르겠습니다'],
  },
  {
    delay: 4200,
    transcript: {
      originalText: '아버지가 고혈압이셔서 혈압약을 드시고 계세요. 저도 가끔 혈압이 높다고 들었어요.',
      displayText: '부친이 고혈압으로 항고혈압제를 복용 중이며, 본인도 고혈압 소견을 들은 적 있습니다.',
      aiLoading: false,
      aiTopic: '혈압·순환기 확인',
      aiTier: '주의',
      aiKeywords: ['가족력', '항고혈압제', '고혈압'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: '항고혈압제', explanation: '혈압을 낮추기 위해 사용하는 약물의 총칭. 혈압약이라고도 함' },
      ],
      suggested_replies: ['혈압이 얼마나 나왔나요?', '현재 복용 중인 약이 있으신가요?', '마지막 혈압 측정은 언제였나요?'],
    },
    globalTerms: [
      { term: '항고혈압제', explanation: '혈압을 낮추기 위해 사용하는 약물의 총칭' },
    ],
    globalKeywords: ['항고혈압제', '고혈압', '가족력'],
    suggestedReplies: ['혈압이 얼마나 나왔나요?', '현재 복용 중인 약이 있나요?', '마지막 혈압 측정은 언제였나요?'],
  },
  {
    delay: 4500,
    transcript: {
      originalText: '심전도 검사를 해보겠습니다. 가슴 두근거림이나 불규칙한 맥박을 느끼신 적이 있으신가요?',
      displayText: '심전도(ECG) 검사를 진행합니다. 심계항진이나 부정맥 증상을 경험하셨는지 확인합니다.',
      aiLoading: false,
      aiTopic: '심장·순환기 검사',
      aiTier: '주의',
      aiKeywords: ['심전도', '부정맥', '심계항진'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: '심전도(ECG)', explanation: '심장의 전기 활동을 그래프로 기록하는 검사. 부정맥, 심근경색 등 진단에 사용' },
        { term: '심계항진', explanation: '가슴이 두근거리거나 심장 박동이 강하게 느껴지는 증상' },
        { term: '부정맥', explanation: '심장 박동이 정상적인 리듬을 벗어난 상태. 너무 빠르거나 느리거나 불규칙한 경우 포함' },
      ],
      suggested_replies: ['네, 가끔 심장이 빠르게 뛰어요', '불규칙하게 뛰는 느낌이 들어요', '특별한 증상은 없었습니다'],
    },
    globalTerms: [
      { term: '심전도(ECG)', explanation: '심장의 전기 활동을 그래프로 기록하는 검사' },
      { term: '심계항진', explanation: '가슴이 두근거리거나 심장 박동이 강하게 느껴지는 증상' },
      { term: '부정맥', explanation: '심장 박동이 정상 리듬을 벗어난 상태' },
    ],
    globalKeywords: ['심전도', '부정맥', '심계항진'],
    suggestedReplies: ['네, 가끔 심장이 빠르게 뛰어요', '불규칙하게 뛰는 느낌이에요', '특별한 증상은 없었습니다'],
  },
  {
    delay: 4000,
    transcript: {
      originalText: '네, 가끔 심장이 빠르게 뛰는 느낌이 있고, 그럴 때 숨이 좀 차요.',
      displayText: '간헐적 빈맥감과 호흡 곤란(숨참) 증상이 동반됩니다.',
      aiLoading: false,
      aiTopic: '심장·순환기 검사',
      aiTier: '중증',
      aiKeywords: ['빈맥', '호흡곤란', '심장'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: '빈맥', explanation: '분당 100회 이상의 빠른 심박수 상태' },
        { term: '호흡곤란', explanation: '숨쉬기가 어렵거나 숨이 차는 증상. 심장 또는 폐 질환과 관련될 수 있음' },
      ],
      suggested_replies: ['증상이 얼마나 자주 있나요?', '운동할 때 더 심해지나요?', '언제부터 이런 증상이 있었나요?'],
    },
    globalTerms: [
      { term: '빈맥', explanation: '분당 100회 이상의 빠른 심박수' },
      { term: '호흡곤란', explanation: '숨쉬기가 어렵거나 숨이 차는 증상' },
    ],
    globalKeywords: ['빈맥', '호흡곤란'],
    suggestedReplies: ['얼마나 자주 있나요?', '운동할 때 더 심해지나요?', '언제부터 이런 증상이 있었나요?'],
  },
  {
    delay: 4500,
    transcript: {
      originalText: '뇌 CT 촬영과 MRI 검사를 진행하겠습니다. 뇌혈관 질환 가능성을 확인해야 합니다.',
      displayText: '뇌 CT 및 MRI 검사로 뇌혈관 질환(뇌졸중, 뇌출혈 등) 가능성을 확인합니다.',
      aiLoading: false,
      aiTopic: '신경계 정밀 검사',
      aiTier: '긴급',
      aiKeywords: ['뇌CT', 'MRI', '뇌혈관질환', '뇌졸중'],
      sentiment: 'urgent',
      topicChanged: true,
      medical_terms: [
        { term: '뇌졸중', explanation: '뇌혈관이 막히거나(뇌경색) 터져(뇌출혈) 뇌 기능이 손상되는 응급 질환' },
        { term: '뇌출혈', explanation: '뇌 안의 혈관이 파열되어 뇌 조직에 출혈이 발생하는 상태' },
        { term: 'MRI', explanation: '자기공명영상. 자기장을 이용해 인체 내부를 고해상도로 촬영하는 검사' },
      ],
      suggested_replies: ['검사가 얼마나 걸리나요?', '지금 바로 검사를 받을 수 있나요?', '검사 결과는 언제 나오나요?'],
    },
    globalTerms: [
      { term: '뇌졸중', explanation: '뇌혈관이 막히거나 터져 뇌 기능이 손상되는 응급 질환' },
      { term: '뇌출혈', explanation: '뇌 안의 혈관이 파열되어 출혈이 발생하는 상태' },
      { term: 'MRI', explanation: '자기공명영상. 고해상도로 내부를 촬영하는 검사' },
    ],
    globalKeywords: ['뇌CT', 'MRI', '뇌졸중', '뇌혈관'],
    suggestedReplies: ['검사가 얼마나 걸리나요?', '지금 바로 받을 수 있나요?', '검사 결과는 언제 나오나요?'],
  },
  {
    delay: 4000,
    transcript: {
      originalText: '검사 결과는 내일 오후에 나올 예정입니다. 오늘은 진통제와 혈압약 처방전을 드리겠습니다.',
      displayText: '검사 결과는 명일 오후 확인 가능합니다. 진통제(NSAIDs)와 항고혈압제를 처방합니다.',
      aiLoading: false,
      aiTopic: '처방 및 안내',
      aiTier: '일반',
      aiKeywords: ['처방', '진통제', 'NSAIDs', '항고혈압제'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: 'NSAIDs', explanation: '비스테로이드성 소염진통제. 통증, 발열, 염증 완화에 사용되는 약물군' },
      ],
      suggested_replies: ['처방전은 어디서 받나요?', '복용 시 주의사항이 있나요?', '내일 몇 시에 오면 되나요?'],
    },
    globalTerms: [
      { term: 'NSAIDs', explanation: '비스테로이드성 소염진통제. 통증·발열·염증 완화에 사용' },
    ],
    globalKeywords: ['처방', 'NSAIDs'],
    suggestedReplies: ['처방전은 어디서 받나요?', '복용 시 주의사항이 있나요?', '내일 몇 시에 오면 되나요?'],
  },
];
