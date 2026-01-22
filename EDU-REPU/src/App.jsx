import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Shield, AlertTriangle, UserCheck, 
  Gavel, FileText, Users, CheckCircle, Sparkles, Send, 
  MessageSquare, BrainCircuit, ClipboardList, Loader2, Volume2, VolumeX,
  ChevronRight, Info
} from 'lucide-react';

// --- Utility: PCM to WAV Conversion (MANDATORY for Gemini TTS) ---
const pcmToWav = (pcmBase64, sampleRate = 24000) => {
  const byteCharacters = atob(pcmBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const pcmData = new Uint16Array(new Uint8Array(byteNumbers).buffer);
  const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset, pcmData[i], true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
};

const App = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioCache, setAudioCache] = useState({});
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  // Gemini API States
  const [aiMode, setAiMode] = useState('analyze');
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const audioRef = useRef(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // API Key from environment variable
  
  // Debug: Check if API key is loaded (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('API Key loaded:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
    }
  }, [apiKey]);

  const slides = [
    {
      id: 1,
      title: "채용 평판조회 법적 리스크 예방",
      subTitle: "인재 영입, 안전하고 공정하게!",
      icon: <Shield className="w-24 h-24 text-blue-600" />,
      content: ["임직원 여러분, 안녕하십니까.", "우수 인재 채용을 위한 평판조회,", "법적 리스크 없이 진행하는 방법을 알아봅니다."],
      script: "안녕하십니까, 임직원 여러분. 우리 회사는 우수한 인재를 영입하기 위해 최선을 다하고 있습니다. 그 과정에서 후보자의 역량을 검증하기 위해 평판조회를 진행하는 경우가 많습니다. 오늘은 안전한 채용을 위한 평판조회 가이드를 말씀드리겠습니다."
    },
    {
      id: 2,
      title: "동의 없는 정보 수집 금지",
      subTitle: "개인정보보호법 위반 사례",
      icon: <AlertTriangle className="w-24 h-24 text-red-500" />,
      content: ["전 직장 인사팀 직접 문의 금지", "🚫 지원자 동의 없음 = 불법", "결과: 5년 이하 징역 또는 벌금형"],
      script: "가장 흔히 발생하는 실수는 지원자의 동의 없이 평판을 조회하는 것입니다. 전 직장 인사팀에 직접 연락해 정보를 얻는 행위는 개인정보보호법상 형사처벌 대상이 될 수 있습니다."
    },
    {
      id: 3,
      title: "지인 찬스 리스크",
      subTitle: "사적인 대화도 법적 책임이 따릅니다",
      icon: <Users className="w-24 h-24 text-orange-500" />,
      content: ["전 직장 동료 문의 금지", "🚫 공식 정보가 아니더라도 위험", "결과: 최대 5천만 원 과태료"],
      script: "사적인 네트워크를 통한 조회도 마찬가지입니다. 업무 목적으로 지원자의 동의 없이 정보를 수집했다면 과태료 부과 대상이 될 가능성이 매우 높으므로 주의해야 합니다."
    },
    {
      id: 4,
      title: "제공자의 법적 리스크",
      subTitle: "선의로 알려줘도 처벌받을 수 있습니다",
      icon: <Gavel className="w-24 h-24 text-purple-600" />,
      content: ["형법상 명예훼손죄 성립", "비밀유지 의무 위반", "비방 목적 인정 시 가중 처벌"],
      script: "정보를 제공하는 사람 역시 명예훼손이나 영업비밀 유출 등으로 법적 분쟁에 휘말릴 수 있습니다. 평판 조회를 요청할 때도, 응답할 때도 신중함이 필요합니다."
    },
    {
      id: 5,
      title: "채용절차법 준수",
      subTitle: "직무와 무관한 정보 수집 금지",
      icon: <UserCheck className="w-24 h-24 text-green-600" />,
      content: ["🚫 부모 직업, 재산, 혼인 등 금지", "직무 수행과 무관한 개인사 배제", "위반 시 즉시 과태료 부과"],
      script: "채용절차법에 따라 직무와 무관한 개인적인 정보를 묻는 것은 엄격히 금지되어 있습니다. 오직 지원자의 직무 역량에만 집중하여 평가해야 합니다."
    },
    {
      id: 6,
      title: "안전한 조회를 위한 원칙",
      subTitle: "반드시 지켜야 할 3요소",
      icon: <CheckCircle className="w-24 h-24 text-teal-600" />,
      content: ["1. 서면 동의 획득", "2. 지정된 레퍼리에게만 연락", "3. 역량 중심 질문"],
      script: "안전한 조회를 위해 서면 동의를 반드시 받고, 지원자가 지정한 대상에게만 연락하며, 질문은 성과와 역량에만 집중하십시오."
    },
    {
      id: 7,
      title: "교육 요약 및 마무리",
      subTitle: "준법 채용이 회사의 경쟁력입니다",
      icon: <FileText className="w-24 h-24 text-indigo-600" />,
      content: ["인사팀 공식 프로세스 준수", "임의적 조회 지양", "공정하고 투명한 채용 문화"],
      script: "결론입니다. 개인적인 평판조회는 큰 리스크를 동반합니다. 반드시 인사팀의 공식 절차를 따라주십시오. 경청해주셔서 감사합니다."
    }
  ];

  // --- TTS Core Function ---
  // NOTE: TTS 기능은 현재 Gemini API에서 제한적이므로 일시적으로 비활성화
  // 필요시 Web Speech API나 다른 TTS 서비스 사용 고려
  const fetchAudio = async (text, slideIndex) => {
    if (audioCache[slideIndex]) return audioCache[slideIndex];
    
    if (!apiKey) {
      console.error('API key is not set');
      setIsAudioLoading(false);
      return null;
    }

    // TTS 기능 일시 비활성화 - NOT_FOUND 에러 방지
    console.warn('TTS 기능이 현재 비활성화되어 있습니다. 텍스트만 표시됩니다.');
    setIsAudioLoading(false);
    return null;

    // 아래 코드는 TTS 기능이 활성화될 때 사용
    /*
    setIsAudioLoading(true);
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Say naturally and professionally: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
              }
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('TTS API Error:', errorData);
          throw new Error(`TTS Failed: ${response.status} ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        const pcmData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (pcmData) {
          const wavBlob = pcmToWav(pcmData);
          const url = URL.createObjectURL(wavBlob);
          setAudioCache(prev => ({ ...prev, [slideIndex]: url }));
          setIsAudioLoading(false);
          return url;
        }
      } catch (err) {
        console.error(`TTS attempt ${i + 1} failed:`, err);
        if (i === 4) { 
          setIsAudioLoading(false); 
          console.error('TTS failed after 5 attempts');
          return null; 
        }
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
    */
  };

  // --- Sync Control: Load and Play Audio for Current Slide ---
  useEffect(() => {
    const syncAudioWithSlide = async () => {
      if (isPlaying && activeTab === 'video' && currentSlide < slides.length) {
        const url = await fetchAudio(slides[currentSlide].script, currentSlide);
        if (url && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.muted = isMuted;
          audioRef.current.play().catch(e => console.error("Auto-play blocked", e));
        }
      } else {
        audioRef.current?.pause();
      }
    };
    syncAudioWithSlide();
  }, [currentSlide, isPlaying, activeTab]);

  // Handle Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        setIsPlaying(false); // Video finished
      }
    };

    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      setAudioDuration(audio.duration || 0);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [currentSlide, slides.length]);

  // Sync Mute State
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleRestart = () => {
    setCurrentSlide(0);
    setAudioCurrentTime(0);
    setIsPlaying(true);
  };

  // --- Gemini AI Help Tool ---
  const handleAiAction = async () => {
    if (!userInput.trim()) return;
    
    if (!apiKey) {
      setAiResponse("⚠️ API 키가 설정되지 않았습니다. Vercel 환경 변수에서 VITE_GEMINI_API_KEY를 확인해주세요.");
      return;
    }
    
    setIsAiLoading(true);
    let prompt = "";
    let sys = "당신은 대한민국 채용 법률 전문가입니다. 사용자의 질문에 전문적이고 명확하게 답하세요.";
    
    if (aiMode === 'analyze') prompt = `이 평판조회 시나리오의 법적 위험을 분석해줘: "${userInput}"`;
    else if (aiMode === 'generate') prompt = `"${userInput}" 직무 면접 후 진행할 법적으로 안전한 평판조회 질문 5가지를 생성해줘.`;
    else prompt = userInput;

    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        // Use stable model: gemini-1.5-pro (more reliable than flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: sys }] }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('AI API Error:', errorData);
          throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (responseText) {
          setAiResponse(responseText);
        } else {
          setAiResponse("답변을 가져올 수 없습니다. 응답 형식을 확인해주세요.");
        }
        setIsAiLoading(false);
        return;
      } catch (e) {
        console.error(`AI API attempt ${i + 1} failed:`, e);
        if (i === 4) { 
          let errorMsg = "⚠️ 오류가 발생했습니다.";
          
          if (e.message?.includes('NOT_FOUND')) {
            errorMsg = "⚠️ 모델을 찾을 수 없습니다. API 키가 올바르게 설정되었는지 확인해주세요.\n\nVercel 환경 변수에서 VITE_GEMINI_API_KEY가 설정되어 있는지 확인하세요.";
          } else if (e.message?.includes('401') || e.message?.includes('UNAUTHENTICATED')) {
            errorMsg = "⚠️ API 키 인증 실패. API 키가 유효한지 확인해주세요.";
          } else if (e.message?.includes('403') || e.message?.includes('PERMISSION_DENIED')) {
            errorMsg = "⚠️ API 접근 권한이 없습니다. API 키 권한을 확인해주세요.";
          } else {
            errorMsg = `⚠️ 오류가 발생했습니다: ${e.message || '알 수 없는 오류'}`;
          }
          
          setAiResponse(errorMsg); 
          setIsAiLoading(false); 
        }
        await new Promise(r => setTimeout(r, delay)); 
        delay *= 2;
      }
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-100 p-4 font-sans text-slate-900">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <audio ref={audioRef} />

        {/* Tab Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('video')} 
            className={`flex-1 py-5 flex items-center justify-center gap-2 font-black transition-all ${activeTab === 'video' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
          >
            <Play size={20} /> 교육 영상 시청
          </button>
          <button 
            onClick={() => { setActiveTab('ai-tools'); setIsPlaying(false); }} 
            className={`flex-1 py-5 flex items-center justify-center gap-2 font-black transition-all ${activeTab === 'ai-tools' ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-600 hover:bg-white'}`}
          >
            <Sparkles size={20} /> AI 스마트 가이드
          </button>
        </div>

        {activeTab === 'video' ? (
          <div className="flex flex-col">
            {/* Visual Display Screen */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-indigo-50 flex flex-col items-center justify-center p-12 text-center overflow-hidden">
              <div key={currentSlide} className="animate-slide-up w-full h-full flex flex-col items-center justify-center space-y-8">
                <div className="p-6 bg-white rounded-3xl shadow-2xl transition-all duration-700 transform hover:scale-110">
                  {currentSlideData.icon}
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
                    {currentSlideData.title}
                  </h2>
                  <p className="text-xl md:text-2xl text-indigo-600 font-bold opacity-80">{currentSlideData.subTitle}</p>
                </div>
                <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-2xl border-l-[12px] border-indigo-600 text-left scale-100">
                  <ul className="space-y-4">
                    {currentSlideData.content.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xl text-slate-700 font-bold leading-snug">
                        <CheckCircle size={26} className="text-indigo-600 mt-1 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Start Overlay */}
              {!isPlaying && currentSlide === 0 && audioCurrentTime === 0 && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-10 backdrop-blur-md">
                  <button 
                    onClick={() => setIsPlaying(true)} 
                    className="group bg-white text-slate-900 rounded-full p-10 shadow-2xl transform transition hover:scale-105 active:scale-95 flex items-center gap-6"
                  >
                    <div className="bg-indigo-600 text-white rounded-full p-5 group-hover:bg-indigo-700 transition shadow-lg">
                      <Play size={56} fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <span className="block text-3xl font-black">교육 시작하기</span>
                      <span className="text-lg font-bold text-slate-500">AI 나레이션 자동 동기화</span>
                    </div>
                  </button>
                  <div className="mt-8 flex items-center gap-2 text-white/60 text-sm">
                    <Info size={16} /> 클릭 시 오디오가 함께 재생됩니다
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isAudioLoading && (
                <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/90 px-4 py-2 rounded-2xl text-sm font-bold text-indigo-600 shadow-xl border border-indigo-100 animate-pulse">
                  <Loader2 size={18} className="animate-spin" />
                  AI 음성 싱크 맞추는 중...
                </div>
              )}
            </div>

            {/* Subtitle / Script Bar */}
            <div className="bg-slate-900 p-10 min-h-[160px] flex items-center justify-center text-center border-t-8 border-indigo-600 relative">
              <p className="text-white text-2xl md:text-3xl font-medium leading-relaxed max-w-4xl tracking-tight opacity-95">
                "{currentSlideData.script}"
              </p>
              {/* Individual Slide Progress */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                 <div 
                   className="h-full bg-indigo-400 transition-all duration-100 ease-linear" 
                   style={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }}
                 />
              </div>
            </div>

            {/* Main Controls */}
            <div className="bg-white p-6 flex items-center gap-6 border-t border-slate-200">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="p-4 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 transition shadow-sm active:scale-90"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-black text-slate-400">전체 학습 단계</span>
                   <span className="text-sm font-black text-indigo-600">{currentSlide + 1} / {slides.length}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200 p-1">
                  <div className="flex h-full gap-1">
                    {slides.map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-all duration-500 ${i < currentSlide ? 'bg-indigo-600' : i === currentSlide ? 'bg-indigo-400 animate-pulse' : 'bg-slate-200'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition ${isMuted ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-100'}`}>
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <button onClick={handleRestart} className="p-4 rounded-2xl bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                  <RotateCcw size={24} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ✨ AI 스마트 가이드 Interface */
          <div className="flex flex-col h-[700px] bg-slate-50">
            <div className="flex bg-white border-b border-slate-200 p-3 gap-2 sticky top-0 z-10">
              {[
                {id: 'analyze', icon: <BrainCircuit size={18}/>, label: '리스크 분석'},
                {id: 'generate', icon: <ClipboardList size={18}/>, label: '질문 생성기'},
                {id: 'chat', icon: <MessageSquare size={18}/>, label: '법률 Q&A'}
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { setAiMode(tab.id); setAiResponse(''); setUserInput(''); }}
                  className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black transition-all ${aiMode === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {aiResponse ? (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg"><Sparkles size={24}/></div>
                    <div className="flex-1">
                      <div className="bg-white border-2 border-indigo-100 p-8 rounded-3xl shadow-xl text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                      <button onClick={() => setAiResponse('')} className="mt-4 ml-4 text-sm font-black text-indigo-600 hover:underline">다른 질문하기</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                  <div className="p-10 bg-white rounded-[40px] shadow-inner shadow-slate-200"><BrainCircuit size={100} className="text-slate-300"/></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800">Gemini AI 인사 법률 조언</h3>
                    <p className="text-xl text-slate-500 mt-3 max-w-sm">평판조회 과정에서 궁금한 점을<br/>AI 전문가에게 물어보세요.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div className="relative max-w-4xl mx-auto group">
                <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={
                    aiMode === 'analyze' ? "리스크가 걱정되는 상황을 자세히 설명해 주세요..." :
                    aiMode === 'generate' ? "직무명을 입력하세요 (예: 경력직 데이터 사이언티스트)" : "법적 절차에 대해 질문해 주세요..."
                  }
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 pr-20 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all min-h-[140px] text-xl font-medium shadow-inner"
                />
                <button 
                  onClick={handleAiAction}
                  disabled={isAiLoading || !userInput.trim()}
                  className="absolute bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={28} /> : <Send size={28} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-slate-400 text-sm font-bold flex items-center gap-4">
        <span>© 2025 준법 채용 교육 솔루션</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full" />
        <span className="text-indigo-400">Gemini AI Powered</span>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(50px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
