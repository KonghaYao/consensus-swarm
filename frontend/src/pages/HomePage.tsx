/**
 * HomePage - 主页（英雄式居中布局）
 * 符合 Web Interface Guidelines - 语义化 HTML、可访问性、现代设计
 */

import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Settings,
  Users,
  Vote,
  Sparkles,
  ArrowRight,
  Workflow,
  Lightbulb,
  CheckCircle2,
  Zap,
  Shield,
  Target,
  Code,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-24 px-8">
        <div className="text-center max-w-5xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-900/20 border border-white/20">
                <Users className="w-12 h-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* 产品名称 */}
          <h1 className="text-7xl md:text-8xl font-bold text-gray-900 mb-6 tracking-tight text-wrap-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Consensus
          </h1>

          {/* 标语 */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed text-wrap-pretty animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            多 Agent 共识系统 — 让 AI 团队通过结构化讨论达成共识
          </p>

          {/* 副标题 */}
          <p className="text-base text-gray-500 mb-12 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            配置多个 AI Agent 角色，通过民主投票和结构化辩论，确保每一项决策都获得团队一致认可
          </p>

          {/* 行动按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <Link to="/chat" className="group">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-medium shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                开始会议
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/agents" className="group">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base font-medium border-2 hover:bg-white/80 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-2" />
                配置 Agent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 核心特性 Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-6xl mx-auto">
          {/* 分隔线 */}
          <div className="flex items-center gap-4 mb-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <h2 className="text-2xl font-bold text-gray-900">核心特性</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* 特性 1 */}
            <article className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                  <Users className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">多角色协作</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  配置不同角色的 AI Agent，从产品经理到技术专家，多角度分析问题
                </p>
              </div>
            </article>

            {/* 特性 2 */}
            <article className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-green-200/60 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/25">
                  <Vote className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">民主投票机制</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  所有 Agent 必须达成一致共识（100% 同意），确保决策质量和团队认可
                </p>
              </div>
            </article>

            {/* 特性 3 */}
            <article className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-purple-200/60 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">结构化讨论</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  反对者详细说明理由，支持者回应后再次投票，直到达成共识
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 工作流程 Section */}
      <section className="relative z-10 py-20 px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-wrap-balance">
              工作流程
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              简单四步，让 AI 团队达成共识
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 步骤 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                  <Target className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">发起会议</h3>
                <p className="text-sm text-gray-600">
                  设定讨论主题，选择参与讨论的 AI Agent 角色
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
            </div>

            {/* 步骤 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
                  <MessageCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">自由讨论</h3>
                <p className="text-sm text-gray-600">
                  各 Agent 发表观点和建议，主持人引导讨论方向
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-green-300 to-transparent" />
            </div>

            {/* 步骤 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                  <Vote className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">投票表决</h3>
                <p className="text-sm text-gray-600">
                  所有 Agent 对提案进行投票，反对者需说明理由
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-amber-300 to-transparent" />
            </div>

            {/* 步骤 4 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                  <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">达成共识</h3>
                <p className="text-sm text-gray-600">
                  反复讨论直至 100% 同意，生成最终决策报告
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 使用场景 Section */}
      <section className="relative z-10 py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-wrap-balance">
              适用场景
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              多种场景，让 AI 团队协作更高效
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 场景 1 */}
            <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/60 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">产品决策</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                让产品经理、设计师、工程师等角色共同评估新功能和优先级
              </p>
            </article>

            {/* 场景 2 */}
            <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/60 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-green-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">技术方案评审</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                架构师、资深工程师、安全专家共同评审技术方案和架构设计
              </p>
            </article>

            {/* 场景 3 */}
            <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/60 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">文档审核</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                多角度审核文档内容，确保信息准确、表述清晰、逻辑严谨
              </p>
            </article>

            {/* 场景 4 */}
            <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200/60 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">风险评估</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                法务、安全、运营等角色共同识别和评估项目潜在风险
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 为什么选择 Section */}
      <section className="relative z-10 py-20 px-8 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-wrap-balance">
              为什么选择 Consensus
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              独特的共识机制，带来更高质量的决策
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 优势 1 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <Zap className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">更高决策质量</h3>
              <p className="text-gray-600 leading-relaxed">
                通过多角色讨论和 100% 共识要求，确保每个决策都经过全面审视和充分论证
              </p>
            </div>

            {/* 优势 2 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                <Workflow className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">结构化流程</h3>
              <p className="text-gray-600 leading-relaxed">
                标准化的讨论和投票流程，让 AI 团队协作更加高效有序，避免混乱和遗漏
              </p>
            </div>

            {/* 优势 3 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                <Shield className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">可追溯性</h3>
              <p className="text-gray-600 leading-relaxed">
                完整记录讨论过程、投票结果和决策依据，便于后续审查和复盘
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 shadow-2xl shadow-blue-900/30 relative overflow-hidden">
            {/* 装饰元素 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-wrap-balance">
                准备好体验 AI 团队共识了吗？
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                立即开始，让多个 AI Agent 为您提供更全面的决策建议
              </p>
              <Link to="/chat" className="inline-flex group">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-medium bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  开始首次会议
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 底部提示 */}
      <footer className="relative z-10 py-8 text-center text-sm text-gray-400">
        <p>Powered by LangGraph & Anthropic Claude</p>
      </footer>
    </main>
  );
}
