import Link from 'next/link'
import { Bot, Sparkles, Printer, BookOpen, Clock, Zap, MessageCircle, FileText, CheckCircle2, ArrowRight, ShieldCheck, Brain, PenTool, Layers } from 'lucide-react'
import { getBucketLastModified } from '@/lib/gcs-info';

export default async function LandingPage() {
  const lastModified = await getBucketLastModified();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bot size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">BigHistory AI</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm sm:text-base"
            >
              로그인
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 active:scale-95 text-sm sm:text-base flex items-center gap-1 group"
            >
              <Sparkles size={16} className="group-hover:animate-pulse" />
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-[900px] bg-gradient-to-b from-slate-50 via-white to-transparent -z-10" />

        <div className="max-w-6xl mx-auto relative z-10 px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-blue-600 mb-8 shadow-sm animate-fade-in hover:shadow-md transition-shadow cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              선생님을 위한 지적 조수
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.15] break-keep drop-shadow-sm">
              20권의 빅히스토리,<br className="hidden sm:block" />
              <span className="text-blue-600 relative inline-block">
                단 10초 만에
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-100" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
              수업 자료로 변신합니다.
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-3xl mx-auto font-medium leading-relaxed break-keep">
              방대한 빅히스토리 지식을 AI가 분석하여 선생님의 소중한 시간을 아껴드립니다.<br className="hidden md:block" />
              더 이상 자료 검색에 시간을 낭비하지 마세요.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                시작하기 <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Visual: App Interface Mockup */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
              {/* Mockup Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                      <Bot size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">BigHistory AI</span>
                  </div>
                  <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="flex flex-col hidden sm:flex">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Architecture</span>
                    <span className="text-[10px] text-slate-600 font-medium">{lastModified}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-xs text-slate-500 font-bold">U</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">User</span>
                  </div>
                </div>
              </div>

              {/* Mockup Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left: Chat Area */}
                <div className="w-full md:w-[45%] bg-slate-50 border-r border-slate-200 flex flex-col p-4 sm:p-6">
                  {/* User Message */}
                  <div className="flex justify-end mb-8">
                    <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-medium leading-relaxed max-w-[90%] shadow-lg shadow-slate-900/10">
                      [강의 대상: 중학교 1학년] [강의자료 생성 요청] 집단 학습: 인류만이 가진 초능력
                    </div>
                  </div>

                  {/* Assistant Response */}
                  <div className="flex flex-col items-start w-full animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Bot size={14} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Research Logic</span>
                    </div>

                    {/* Result Card */}
                    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-default group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm mb-1">[강의 대상: 중학교 1학년] 집단 학습: 인류만이 가진 초능력</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">Curriculum content is ready. Click open to view adjacent to the chat.</p>
                        </div>
                      </div>
                      <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shadow-blue-200 shadow-md">
                        OPEN
                      </button>
                    </div>
                  </div>

                  {/* Chat Input Placeholder */}
                  <div className="mt-auto pt-6">
                    <div className="w-full h-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center px-4 justify-between">
                      <span className="text-xs text-slate-300">중학교 1학년 대상 수업 자료 주제를 입력하세요...</span>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Canvas Area (Hidden on small mobile, visible on desktop) */}
                <div className="hidden md:flex flex-1 bg-white flex-col h-full relative overflow-hidden">
                  {/* Canvas Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 w-[70%]">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">[강의 대상: 중학교 1학년] 집단 학습: 인류만이 가진 초능력</span>
                    </div>
                    <div className="flex items-center gap-2 grayscale opacity-40">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                  </div>

                  {/* Canvas Content */}
                  <div className="p-8 overflow-y-auto no-scrollbar mask-linear-fade">
                    <h1 className="text-2xl font-bold font-serif text-slate-900 mb-8 leading-tight">집단 학습: 인류만이 가진 초능력</h1>

                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="text-blue-600">1.</span> 단원 목표 (Learning Objectives)
                      </h2>
                      <p className="text-sm text-slate-600 leading-7 font-serif break-keep">
                        이 단원에서는 인류만이 가진 특별한 능력인 <strong className="bg-blue-50 text-blue-700 px-1 rounded">집단 학습</strong>에 대해 알아봅니다. 우리는 집단 학습이 어떻게 인류의 생존과 발전에 기여했는지, 그리고 다른 동물들과 어떻게 다른지를 살펴볼 것입니다.
                      </p>
                    </div>

                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="text-blue-600">2.</span> 핵심 질문 (Key Questions)
                      </h2>
                      <ul className="space-y-4">
                        <li className="pl-4 border-l-2 border-slate-100 hover:border-blue-200 transition-colors">
                          <p className="text-sm text-slate-700 font-medium mb-2">인간은 어떻게 다른 동물들과 구별되는 '초능력'인 집단 학습을 할 수 있게 되었을까요?</p>
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">답변</span>
                        </li>
                        <li className="pl-4 border-l-2 border-slate-100 hover:border-blue-200 transition-colors">
                          <p className="text-sm text-slate-700 font-medium mb-2">집단 학습은 인류의 역사에서 어떤 중요한 변화를 가져왔을까요?</p>
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">답변</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mb-8 opacity-50 blur-[1px]">
                      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="text-blue-600">3.</span> 학습 핵심 개념 (Core Concepts)
                      </h2>
                      <p className="text-sm text-slate-600">...</p>
                    </div>
                  </div>
                  {/* Fade Overlay */}
                  <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Reliability (No Hallucination) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-slate-100 text-blue-600 mb-6">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">AI의 환각(거짓말)을 없앴습니다.</h2>
          <p className="text-lg text-slate-600 leading-relaxed break-keep max-w-2xl mx-auto">
            인터넷의 불확실한 정보가 아닙니다. <br />
            BigHistory AI는 <strong>엄선된 20권의 전문 도서</strong>를 기반으로 검증된 텍스트로만 답합니다. (RAG 기술 적용)
          </p>
        </div>
      </section>

      {/* Magic Features Grid (4 Items) */}
      <section id="features" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">수업에 필요한 모든 기능</h2>
            <p className="text-slate-500">선생님의 요구사항을 반영하여 꼭 필요한 기능만 담았습니다.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                <MessageCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">단순 채팅</h3>
              <p className="text-sm text-slate-500">
                궁금한 점을 질문하면 AI가 교육적 맥락에 맞춰 즉시 답변합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">핵심 요약</h3>
              <p className="text-sm text-slate-500">
                각차시 수업에 필요한 역사적 사건과 과학적 개념을 용어중심으로제공합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                <Brain size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">학습 활동</h3>
              <p className="text-sm text-slate-500">
                수업 주제에 맞는 모둠 활동 메뉴얼과 활동지를 제공합니다
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                <Printer size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">수업 활동지 (PDF)</h3>
              <p className="text-sm text-slate-500">
                생성된 모든 자료는 클릭한번으로 인쇄가능한 PDF로 변환하여 저장됩니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section (Table) */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">왜 <span className="text-blue-400">BigHistory AI</span>인가요?</h2>
            <p className="text-slate-400 text-lg">일반 챗봇과는 근본적으로 다릅니다.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 border-b border-white/10 bg-white/5 text-sm md:text-base">
              <div className="col-span-3 p-6 font-bold text-slate-400 flex items-center">구분</div>
              <div className="col-span-4 md:col-span-5 p-6 font-bold text-slate-500 flex items-center">일반 챗봇 (CHATGPT 등)</div>
              <div className="col-span-5 md:col-span-4 p-6 font-bold text-blue-400 flex items-center">BIGHISTORY AI</div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-12 border-b border-white/10 hover:bg-white/5 transition-colors">
              <div className="col-span-3 p-6 font-medium text-slate-300 flex items-center">데이터 신뢰성</div>
              <div className="col-span-4 md:col-span-5 p-6 text-slate-400 flex items-center">출처 불문의 인터넷 데이터</div>
              <div className="col-span-5 md:col-span-4 p-6 text-white font-semibold flex items-center">엄선된 20권의 전문 도서 (RAG)</div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-12 border-b border-white/10 hover:bg-white/5 transition-colors">
              <div className="col-span-3 p-6 font-medium text-slate-300 flex items-center">스타일 & 어조</div>
              <div className="col-span-4 md:col-span-5 p-6 text-slate-400 flex items-center">기계적인 나열 (1, 2, 3...)</div>
              <div className="col-span-5 md:col-span-4 p-6 text-white font-semibold flex items-center">잘 편집된 교과서/에세이 스타일</div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-12 border-b border-white/10 hover:bg-white/5 transition-colors">
              <div className="col-span-3 p-6 font-medium text-slate-300 flex items-center">활용성</div>
              <div className="col-span-4 md:col-span-5 p-6 text-slate-400 flex items-center">복사/붙여넣기 후 재편집 필요</div>
              <div className="col-span-5 md:col-span-4 p-6 text-white font-semibold flex items-center">즉시 PDF 변환 및 인쇄 가능</div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-12 hover:bg-white/5 transition-colors">
              <div className="col-span-3 p-6 font-medium text-slate-300 flex items-center">인터페이스</div>
              <div className="col-span-4 md:col-span-5 p-6 text-slate-400 flex items-center">단순 채팅창</div>
              <div className="col-span-5 md:col-span-4 p-6 text-white font-semibold flex items-center">에디터 + 도서관 + 뷰어 워크스페이스</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience & Roadmap */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            {/* Left: Target Audience */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <CheckCircle2 className="text-blue-600" /> 이런 분들에게 추천합니다
              </h2>
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-4 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <PenTool size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">초/중/고 교사</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">매번 새로운 수업 자료를 준비해야 하는 부담에서 벗어나세요.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-4 hover:border-purple-300 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">방과 후 강사</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">차별화된 고퀄리티 커리큘럼으로 경쟁력을 높이세요.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex items-start gap-4 hover:border-green-300 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">학부모</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">검증된 지식을 아이들에게 체계적으로 가르쳐주세요.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Roadmap */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <Layers className="text-blue-600" /> 미래 로드맵
              </h2>
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-12 pl-8 py-2">
                {/* V1.0 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-lg">V1.0 (Current)</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">NOW</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    텍스트 및 커리큘럼 생성, PDF 내보내기, 사용자 관리 완성.
                  </p>
                </div>

                {/* V2.0 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-slate-200 border-4 border-white"></div>
                  <h3 className="font-bold text-slate-400 text-lg mb-2">V2.0</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    관련 <span className="bg-blue-50 text-blue-700 px-1 rounded">이미지/도표 자동 생성 및 삽입 기능</span>, 멀티 모달 RAG.
                  </p>
                </div>

                {/* V3.0 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-slate-200 border-4 border-white"></div>
                  <h3 className="font-bold text-slate-400 text-lg mb-2">V3.0</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    전국민 대상 표준 교육 모델로 정착.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">BigHistory AI</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            "지식은 연결될 때 가장 빛납니다. BigHistory AI가 그 연결의 시작이 되겠습니다."
          </p>
          <div className="text-slate-400 text-xs">
            © 2025 Goraebang BigHistory AI Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div >
  )
}
