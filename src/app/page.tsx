import Link from 'next/link'
import { Bot, BookOpen, Search, Zap, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">BigHistory</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/login"
              className="bg-gray-900 text-white px-4 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            AI 기반 빅히스토리 교육 플랫폼
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
            모든 역사를 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              하나의 이야기로
            </span> 연결하다
          </h1>

          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            빅히스토리 20권의 방대한 지을 AI가 분석하여 선생님의 수업 준비를 도와드립니다.
            단원 목표 설정부터 퀴즈 생성까지, 단 3초면 충분합니다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              무료로 시작하기 <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
            >
              기능 살펴보기
            </a>
          </div>

          {/* Dashboard Preview Image Placeholder */}
          <div className="mt-20 relative mx-auto max-w-4xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center group">
              {/* Use the uploaded image as a preview background if possible, or just a placeholder */}
              <div className="text-white opacity-50 text-center">
                <p className="mb-2 text-6xl">✨</p>
                <p>AI 채팅 인터페이스 미리보기</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">선생님을 위한 강력한 도구</h2>
            <p className="text-gray-500">빅히스토리 교육에 최적화된 기능을 제공합니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">정확한 소스 검색 (RAG)</h3>
              <p className="text-gray-500 leading-relaxed">
                20권의 교과서 데이터를 벡터 단위로 분석하여, 질문에 가장 적합한 근거 자료를 찾아내고 출처를 함께 표시합니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">맞춤형 코스 생성</h3>
              <p className="text-gray-500 leading-relaxed">
                초등, 중등, 고등학생 대상별로 난이도와 어조를 자동 조절하여 최적의 수업 계획안을 3초 만에 생성합니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">빅히스토리 특화</h3>
              <p className="text-gray-500 leading-relaxed">
                우주, 지구, 생명, 인류 등 138억 년의 역사를 다루는 빅히스토리만의 융합적 관점을 완벽하게 이해하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© 2025 BigHistory AI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
