import { ProcessedTranscript } from './caption-engine';

export interface DemoEntry {
  delay: number;
  transcript: Omit<ProcessedTranscript, 'id' | 'timestamp'>;
  transcriptEn?: Omit<ProcessedTranscript, 'id' | 'timestamp'>;
  globalTerms?: { term: string; explanation: string }[];
  globalTermsEn?: { term: string; explanation: string }[];
  globalKeywords?: string[];
  globalKeywordsEn?: string[];
  suggestedReplies?: string[];
  suggestedRepliesEn?: string[];
  /** true: 환자가 버튼 클릭 전까지 대기 / false: delay 후 자동 진행 */
  waitForReply?: boolean;
}

export const DEMO_SCRIPT: DemoEntry[] = [
  // ── Step 0: 의사 첫 인사 (대기) ──
  {
    delay: 0,
    waitForReply: true,
    transcript: {
      originalText: '안녕하세요, 오늘 어디가 많이 불편하세요?',
      displayText: '안녕하세요, 오늘 어디가 많이 불편하세요?',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '안녕하세요, 오늘 어디가 많이 불편하세요?', isKeyword: false }],
      aiLoading: false,
      aiTopic: '초진 문진',
      aiTier: '일반',
      aiKeywords: ['문진', '증상'],
      sentiment: 'neutral',
      topicChanged: false,
      medical_terms: [],
      suggested_replies: ['두통과 메스꺼움이 있습니다', '열이 나고 몸이 무겁습니다', '가슴이 두근거리고 숨이 차요'],
    },
    transcriptEn: {
      originalText: 'Hello, what brings you in today?',
      displayText: 'Hello, what brings you in today?',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Hello, what brings you in today?', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Initial Consultation',
      aiTier: '일반',
      aiKeywords: ['consultation', 'symptoms'],
      sentiment: 'neutral',
      topicChanged: false,
      medical_terms: [],
      suggested_replies: ['I have a headache and feel nauseous', 'I have a fever and feel tired', 'My heart is racing and I am short of breath'],
    },
    suggestedReplies: ['두통과 메스꺼움이 있습니다', '열이 나고 몸이 무겁습니다', '가슴이 두근거리고 숨이 차요'],
    suggestedRepliesEn: ['I have a headache and feel nauseous', 'I have a fever and feel tired', 'My heart is racing and I am short of breath'],
  },

  // ── Step 1: 환자 증상 (자동 진행) ──
  {
    delay: 1500,
    waitForReply: false,
    transcript: {
      originalText: '며칠 전부터 두통이 심하고 메스꺼움이 있어요. 어지럼증도 있고요.',
      displayText: '수일 전부터 두통과 오심(메스꺼움), 어지럼증 증상이 있습니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '수일 전부터 두통과 오심(메스꺼움), 어지럼증 증상이 있습니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '신경계 증상',
      aiTier: '핵심',
      aiKeywords: ['두통', '메스꺼움', '어지럼증'],
      sentiment: 'negative',
      topicChanged: true,
      medical_terms: [
        { term: '오심', explanation: '메스꺼움을 의학 용어로 표현한 것으로, 구역질이 날 것 같은 불쾌한 느낌' },
        { term: '현훈', explanation: '어지럼증의 의학 용어. 주변이나 자신이 빙빙 도는 것 같은 느낌' },
      ],
      suggested_replies: [],
    },
    transcriptEn: {
      originalText: 'I have had a headache and nausea for several days, with dizziness too.',
      displayText: 'Reports headaches, nausea, and dizziness for several days.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Reports headaches, nausea, and dizziness for several days.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Neurological Symptoms',
      aiTier: '핵심',
      aiKeywords: ['headache', 'nausea', 'dizziness'],
      sentiment: 'negative',
      topicChanged: true,
      medical_terms: [
        { term: 'Nausea', explanation: 'An uncomfortable feeling of needing to vomit; queasiness.' },
        { term: 'Vertigo', explanation: 'A type of dizziness where you feel as if everything is spinning around you.' },
      ],
      suggested_replies: [],
    },
    globalTerms: [
      { term: '오심', explanation: '메스꺼움을 의학 용어로 표현한 것. 구역질이 날 것 같은 불쾌한 느낌' },
      { term: '현훈', explanation: '어지럼증의 의학 용어. 주변이나 자신이 빙빙 도는 것 같은 느낌' },
    ],
    globalTermsEn: [
      { term: 'Nausea', explanation: 'An uncomfortable feeling of needing to vomit; queasiness.' },
      { term: 'Vertigo', explanation: 'Dizziness where surroundings appear to spin or move.' },
    ],
    globalKeywords: ['두통', '오심', '현훈'],
    globalKeywordsEn: ['headache', 'nausea', 'vertigo'],
  },

  // ── Step 2: 의사 혈압 문진 (대기) ──
  {
    delay: 0,
    waitForReply: true,
    transcript: {
      originalText: '혈압을 한번 측정해 보겠습니다. 고혈압 가족력이 있으신가요?',
      displayText: '혈압을 측정하겠습니다. 고혈압 가족력이 있으신지 확인합니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '혈압을 측정하겠습니다. 고혈압 가족력이 있으신지 확인합니다.', isKeyword: false }],
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
    transcriptEn: {
      originalText: 'I will check your blood pressure. Do you have a family history of hypertension?',
      displayText: 'Checking blood pressure. Is there a family history of high blood pressure?',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Checking blood pressure. Is there a family history of high blood pressure?', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Blood Pressure Check',
      aiTier: '일반',
      aiKeywords: ['blood pressure', 'hypertension', 'family history'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: 'Family History', explanation: 'A record of diseases or conditions that exist in close blood relatives.' },
      ],
      suggested_replies: ['My father has high blood pressure', 'No family history of hypertension', 'I am not sure'],
    },
    globalTerms: [
      { term: '가족력', explanation: '혈연 가족 중 특정 질병을 가진 사람이 있는 경우' },
    ],
    globalTermsEn: [
      { term: 'Family History', explanation: 'Presence of a disease or condition in close blood relatives.' },
    ],
    globalKeywords: ['혈압', '고혈압', '가족력'],
    globalKeywordsEn: ['blood pressure', 'hypertension', 'family history'],
    suggestedReplies: ['아버지가 고혈압이십니다', '가족력은 없습니다', '잘 모르겠습니다'],
    suggestedRepliesEn: ['My father has high blood pressure', 'No family history', 'I am not sure'],
  },

  // ── Step 3: 환자 가족력 답변 (자동 진행) ──
  {
    delay: 1500,
    waitForReply: false,
    transcript: {
      originalText: '아버지가 고혈압이셔서 혈압약을 드시고 계세요. 저도 가끔 혈압이 높다고 들었어요.',
      displayText: '부친이 고혈압으로 항고혈압제를 복용 중이며, 본인도 고혈압 소견을 들은 적 있습니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '부친이 고혈압으로 항고혈압제를 복용 중이며, 본인도 고혈압 소견을 들은 적 있습니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '혈압·순환기 확인',
      aiTier: '중요',
      aiKeywords: ['가족력', '항고혈압제', '고혈압'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: '항고혈압제', explanation: '혈압을 낮추기 위해 사용하는 약물의 총칭. 혈압약이라고도 함' },
      ],
      suggested_replies: [],
    },
    transcriptEn: {
      originalText: 'My father has hypertension and takes blood pressure medication. I have also been told I have high blood pressure.',
      displayText: 'Father takes antihypertensive medication. Patient has also been informed of elevated blood pressure.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Father takes antihypertensive medication. Patient has also been informed of elevated blood pressure.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Blood Pressure Check',
      aiTier: '중요',
      aiKeywords: ['antihypertensive', 'hypertension', 'family history'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: 'Antihypertensive', explanation: 'Medication used to lower blood pressure, commonly called blood pressure pills.' },
      ],
      suggested_replies: [],
    },
    globalTerms: [
      { term: '항고혈압제', explanation: '혈압을 낮추기 위해 사용하는 약물의 총칭' },
    ],
    globalTermsEn: [
      { term: 'Antihypertensive', explanation: 'Medication that lowers blood pressure.' },
    ],
    globalKeywords: ['항고혈압제', '고혈압', '가족력'],
    globalKeywordsEn: ['antihypertensive', 'hypertension', 'family history'],
  },

  // ── Step 4: 의사 심전도 검사 (대기) ──
  {
    delay: 0,
    waitForReply: true,
    transcript: {
      originalText: '심전도 검사를 해보겠습니다. 가슴 두근거림이나 불규칙한 맥박을 느끼신 적이 있으신가요?',
      displayText: '심전도(ECG) 검사를 진행합니다. 심계항진이나 부정맥 증상을 경험하셨는지 확인합니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '심전도(ECG) 검사를 진행합니다. 심계항진이나 부정맥 증상을 경험하셨는지 확인합니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '심장·순환기 검사',
      aiTier: '중요',
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
    transcriptEn: {
      originalText: 'We will perform an ECG. Have you experienced palpitations or an irregular heartbeat?',
      displayText: 'Performing an ECG. Checking for palpitations or arrhythmia symptoms.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Performing an ECG. Checking for palpitations or arrhythmia symptoms.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Cardiac Examination',
      aiTier: '중요',
      aiKeywords: ['ECG', 'arrhythmia', 'palpitations'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: 'ECG (Electrocardiogram)', explanation: 'A test that records the electrical activity of the heart, used to detect arrhythmia and heart attacks.' },
        { term: 'Palpitations', explanation: 'An awareness of your heart beating rapidly, strongly, or irregularly.' },
        { term: 'Arrhythmia', explanation: 'An abnormal heart rhythm that is too fast, too slow, or irregular.' },
      ],
      suggested_replies: ['Yes, my heart sometimes races', 'I feel it beating irregularly', 'No particular symptoms'],
    },
    globalTerms: [
      { term: '심전도(ECG)', explanation: '심장의 전기 활동을 그래프로 기록하는 검사' },
      { term: '심계항진', explanation: '가슴이 두근거리거나 심장 박동이 강하게 느껴지는 증상' },
      { term: '부정맥', explanation: '심장 박동이 정상 리듬을 벗어난 상태' },
    ],
    globalTermsEn: [
      { term: 'ECG (Electrocardiogram)', explanation: 'Records the heart electrical activity to detect arrhythmia.' },
      { term: 'Palpitations', explanation: 'Sensation of rapid or irregular heartbeat.' },
      { term: 'Arrhythmia', explanation: 'Abnormal heart rhythm — too fast, slow, or irregular.' },
    ],
    globalKeywords: ['심전도', '부정맥', '심계항진'],
    globalKeywordsEn: ['ECG', 'arrhythmia', 'palpitations'],
    suggestedReplies: ['네, 가끔 심장이 빠르게 뛰어요', '불규칙하게 뛰는 느낌이에요', '특별한 증상은 없었습니다'],
    suggestedRepliesEn: ['Yes, my heart sometimes races', 'I feel it beating irregularly', 'No particular symptoms'],
  },

  // ── Step 5: 환자 심장 증상 답변 (자동 진행) ──
  {
    delay: 1500,
    waitForReply: false,
    transcript: {
      originalText: '네, 가끔 심장이 빠르게 뛰는 느낌이 있고, 그럴 때 숨이 좀 차요.',
      displayText: '간헐적 빈맥감과 호흡 곤란(숨참) 증상이 동반됩니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '간헐적 빈맥감과 호흡 곤란(숨참) 증상이 동반됩니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '심장·순환기 검사',
      aiTier: '핵심',
      aiKeywords: ['빈맥', '호흡곤란', '심장'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: '빈맥', explanation: '분당 100회 이상의 빠른 심박수 상태' },
        { term: '호흡곤란', explanation: '숨쉬기가 어렵거나 숨이 차는 증상. 심장 또는 폐 질환과 관련될 수 있음' },
      ],
      suggested_replies: [],
    },
    transcriptEn: {
      originalText: 'Yes, my heart sometimes races and I feel short of breath at those times.',
      displayText: 'Intermittent rapid heartbeat accompanied by shortness of breath.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Intermittent rapid heartbeat accompanied by shortness of breath.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Cardiac Examination',
      aiTier: '핵심',
      aiKeywords: ['tachycardia', 'dyspnea', 'heart'],
      sentiment: 'negative',
      topicChanged: false,
      medical_terms: [
        { term: 'Tachycardia', explanation: 'A heart rate exceeding 100 beats per minute.' },
        { term: 'Dyspnea', explanation: 'Difficulty breathing or shortness of breath; may be cardiac or pulmonary in origin.' },
      ],
      suggested_replies: [],
    },
    globalTerms: [
      { term: '빈맥', explanation: '분당 100회 이상의 빠른 심박수' },
      { term: '호흡곤란', explanation: '숨쉬기가 어렵거나 숨이 차는 증상' },
    ],
    globalTermsEn: [
      { term: 'Tachycardia', explanation: 'Heart rate over 100 beats per minute.' },
      { term: 'Dyspnea', explanation: 'Shortness of breath or difficulty breathing.' },
    ],
    globalKeywords: ['빈맥', '호흡곤란'],
    globalKeywordsEn: ['tachycardia', 'dyspnea'],
  },

  // ── Step 6: 의사 CT/MRI 안내 (대기) ──
  {
    delay: 0,
    waitForReply: true,
    transcript: {
      originalText: '뇌 CT 촬영과 MRI 검사를 진행하겠습니다. 뇌혈관 질환 가능성을 확인해야 합니다.',
      displayText: '뇌 CT 및 MRI 검사로 뇌혈관 질환(뇌졸중, 뇌출혈 등) 가능성을 확인합니다.',
      score: 0, tier: '긴급', keywordsFound: ['긴급'], segments: [{ text: '뇌 CT 및 MRI 검사로 뇌혈관 질환(뇌졸중, 뇌출혈 등) 가능성을 확인합니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '신경계 정밀 검사',
      aiTier: '긴급',
      aiKeywords: ['뇌CT', 'MRI', '뇌혈관질환', '뇌졸중'],
      sentiment: 'negative',
      topicChanged: true,
      medical_terms: [
        { term: '뇌졸중', explanation: '뇌혈관이 막히거나(뇌경색) 터져(뇌출혈) 뇌 기능이 손상되는 응급 질환' },
        { term: '뇌출혈', explanation: '뇌 안의 혈관이 파열되어 뇌 조직에 출혈이 발생하는 상태' },
        { term: 'MRI', explanation: '자기공명영상. 자기장을 이용해 인체 내부를 고해상도로 촬영하는 검사' },
      ],
      suggested_replies: ['검사가 얼마나 걸리나요?', '지금 바로 검사를 받을 수 있나요?', '검사 결과는 언제 나오나요?'],
    },
    transcriptEn: {
      originalText: 'We will order a brain CT and MRI to check for cerebrovascular disease.',
      displayText: 'Brain CT and MRI ordered to check for cerebrovascular disease such as stroke or brain hemorrhage.',
      score: 0, tier: '긴급', keywordsFound: ['긴급'], segments: [{ text: 'Brain CT and MRI ordered to check for cerebrovascular disease such as stroke or brain hemorrhage.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Neurological Imaging',
      aiTier: '긴급',
      aiKeywords: ['Brain CT', 'MRI', 'stroke', 'cerebrovascular'],
      sentiment: 'negative',
      topicChanged: true,
      medical_terms: [
        { term: 'Stroke', explanation: 'Brain damage caused by a blocked or ruptured blood vessel in the brain.' },
        { term: 'Cerebral Hemorrhage', explanation: 'Bleeding inside the brain from a ruptured blood vessel.' },
        { term: 'MRI', explanation: 'Magnetic Resonance Imaging — high-resolution internal body scans using magnetic fields.' },
      ],
      suggested_replies: ['How long does the test take?', 'Can I take it right away?', 'When will the results be ready?'],
    },
    globalTerms: [
      { term: '뇌졸중', explanation: '뇌혈관이 막히거나 터져 뇌 기능이 손상되는 응급 질환' },
      { term: '뇌출혈', explanation: '뇌 안의 혈관이 파열되어 출혈이 발생하는 상태' },
      { term: 'MRI', explanation: '자기공명영상. 고해상도로 내부를 촬영하는 검사' },
    ],
    globalTermsEn: [
      { term: 'Stroke', explanation: 'Brain damage from blocked or ruptured blood vessels.' },
      { term: 'Cerebral Hemorrhage', explanation: 'Bleeding inside the brain from a ruptured blood vessel.' },
      { term: 'MRI', explanation: 'High-resolution imaging using magnetic fields.' },
    ],
    globalKeywords: ['뇌CT', 'MRI', '뇌졸중', '뇌혈관'],
    globalKeywordsEn: ['Brain CT', 'MRI', 'stroke', 'cerebrovascular'],
    suggestedReplies: ['검사가 얼마나 걸리나요?', '지금 바로 받을 수 있나요?', '검사 결과는 언제 나오나요?'],
    suggestedRepliesEn: ['How long does the test take?', 'Can I take it right away?', 'When will the results be ready?'],
  },

  // ── Step 7: 의사 처방 안내 (자동 진행, 종료) ──
  {
    delay: 1500,
    waitForReply: false,
    transcript: {
      originalText: '검사 결과는 내일 오후에 나올 예정입니다. 오늘은 진통제와 혈압약 처방전을 드리겠습니다.',
      displayText: '검사 결과는 명일 오후 확인 가능합니다. 진통제(NSAIDs)와 항고혈압제를 처방합니다.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: '검사 결과는 명일 오후 확인 가능합니다. 진통제(NSAIDs)와 항고혈압제를 처방합니다.', isKeyword: false }],
      aiLoading: false,
      aiTopic: '처방 및 안내',
      aiTier: '중요',
      aiKeywords: ['처방', '진통제', 'NSAIDs', '항고혈압제'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: 'NSAIDs', explanation: '비스테로이드성 소염진통제. 통증, 발열, 염증 완화에 사용되는 약물군' },
      ],
      suggested_replies: [],
    },
    transcriptEn: {
      originalText: 'Test results will be ready tomorrow afternoon. I will prescribe a painkiller and blood pressure medication for today.',
      displayText: 'Results available tomorrow afternoon. Prescribing NSAIDs and an antihypertensive medication today.',
      score: 0, tier: '일반', keywordsFound: [], segments: [{ text: 'Results available tomorrow afternoon. Prescribing NSAIDs and an antihypertensive medication today.', isKeyword: false }],
      aiLoading: false,
      aiTopic: 'Prescription',
      aiTier: '중요',
      aiKeywords: ['prescription', 'NSAIDs', 'antihypertensive'],
      sentiment: 'neutral',
      topicChanged: true,
      medical_terms: [
        { term: 'NSAIDs', explanation: 'Non-steroidal anti-inflammatory drugs used for pain relief, fever, and inflammation.' },
      ],
      suggested_replies: [],
    },
    globalTerms: [
      { term: 'NSAIDs', explanation: '비스테로이드성 소염진통제. 통증·발열·염증 완화에 사용' },
    ],
    globalTermsEn: [
      { term: 'NSAIDs', explanation: 'Non-steroidal anti-inflammatory drugs for pain, fever, and inflammation.' },
    ],
    globalKeywords: ['처방', 'NSAIDs'],
    globalKeywordsEn: ['prescription', 'NSAIDs'],
  },
];
