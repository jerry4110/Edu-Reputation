# 채용 평판조회 법적 리스크 예방 교육 솔루션

React 기반의 채용 평판조회 법적 리스크 예방 교육 플랫폼입니다. Gemini AI를 활용한 TTS(Text-to-Speech) 및 법률 조언 기능을 제공합니다.

## 주요 기능

- 📹 **교육 영상 시청**: 7단계 교육 슬라이드와 AI 나레이션 자동 동기화
- 🤖 **AI 스마트 가이드**: Gemini AI를 활용한 법률 조언
  - 리스크 분석
  - 질문 생성기
  - 법률 Q&A

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- Lucide React (아이콘)
- Google Gemini API (TTS & Chat)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. API 키 설정

`src/App.jsx` 파일에서 Gemini API 키를 설정하세요:

```javascript
const apiKey = "YOUR_GEMINI_API_KEY"; // API Key used by runtime
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드

```bash
npm run build
```

## 프로젝트 구조

```
EDU-REPU/
├── src/
│   ├── App.jsx          # 메인 컴포넌트
│   ├── main.jsx         # React 진입점
│   └── index.css        # Tailwind CSS 설정
├── index.html           # HTML 템플릿
├── package.json         # 프로젝트 의존성
├── vite.config.js       # Vite 설정
├── tailwind.config.js   # Tailwind CSS 설정
└── postcss.config.js    # PostCSS 설정
```

## 사용 방법

1. **교육 영상 시청 탭**: 
   - "교육 시작하기" 버튼을 클릭하여 교육을 시작합니다
   - 각 슬라이드는 AI 나레이션과 함께 자동으로 재생됩니다
   - 재생/일시정지, 음소거, 재시작 기능을 사용할 수 있습니다

2. **AI 스마트 가이드 탭**:
   - 리스크 분석: 평판조회 시나리오의 법적 위험을 분석합니다
   - 질문 생성기: 직무에 맞는 법적으로 안전한 평판조회 질문을 생성합니다
   - 법률 Q&A: 채용 관련 법률 질문에 답변합니다

## 주의사항

- Gemini API 키가 필요합니다
- API 키는 환경 변수로 관리하는 것을 권장합니다
- TTS 기능은 Gemini 2.5 Flash Preview TTS 모델을 사용합니다

## 라이선스

© 2025 준법 채용 교육 솔루션
