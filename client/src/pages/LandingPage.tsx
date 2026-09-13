import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Inbox,
  Send,
  BarChart3,
  Sliders,
  Check,
  ArrowRight,
  Github,
  Mail,
  Linkedin,
  ExternalLink,
  Eye,
  MousePointerClick,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CompanyLogo } from '../components/common/CompanyLogo';

export const LandingPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [demoTone, setDemoTone] = useState<'Casual' | 'Warm' | 'Balanced' | 'Professional' | 'Formal'>('Balanced');
  const [composerTarget, setComposerTarget] = useState('Tech Recruiters');
  const [composerOffer, setComposerOffer] = useState('React & TypeScript SWE');
  const [composerObjective, setComposerObjective] = useState('SWE Internship');

  const tonePreviews = {
    Casual: {
      subject: 'Hey Sarah — love what Stripe is building with developer CLI tools',
      body: `Hi Sarah,\n\nHope your week is off to a great start! I’ve been following Stripe for a while and was really impressed by your team’s recent real-time API latency benchmarks.\n\nI’m a developer working heavily with React, TypeScript, and Go. I noticed the Software Engineer opening and felt my distributed systems background would map really well to what you're building.\n\nWould love to chat for 5 minutes or send over my portfolio if you’re open to it. Either way, keep up the awesome work!\n\nBest,\nShivansh`,
      desc: 'Reads like a message from a friend',
    },
    Warm: {
      subject: 'Passionate about Stripe · Software Engineer Intern Application',
      body: `Hi Sarah,\n\nI hope you’re having a wonderful week! I’ve been following Stripe’s journey with great interest, especially how thoughtfully your engineering team handles developer ergonomics.\n\nAs a student with hands-on experience in React, TypeScript, and distributed systems, I’d love to explore how I could contribute to your team as a Software Engineer Intern.\n\nWould you have 10 minutes for a brief chat or be open to passing my resume to the hiring manager?\n\nThank you for your time,\nShivansh Rai`,
      desc: 'Friendly but clearly professional',
    },
    Balanced: {
      subject: 'Software Engineer Intern at Stripe · Shivansh Rai',
      body: `Hi Sarah,\n\nI’ve been following Stripe’s work closely and was really excited to see your team scaling high-concurrency payment microservices.\n\nI’m a full-stack developer with core expertise in React, TypeScript, and Node.js. I’ve built distributed apps with strict reliability standards, and I’m eager to bring that same dedication to the Software Engineer Intern position at Stripe.\n\nWould you be open to a quick 10-minute chat this week, or should I connect with someone else on your recruiting team?\n\nBest regards,\nShivansh Rai`,
      desc: 'Confident and approachable',
    },
    Professional: {
      subject: 'Software Engineer Intern inquiry · Shivansh Rai (React, TypeScript)',
      body: `Dear Sarah,\n\nI am writing to express my strong interest in the Software Engineer Intern position at Stripe. Having studied your engineering blogs and recent infrastructure upgrades, I have been deeply impressed by your team’s technical rigor.\n\nMy technical background centers on React, TypeScript, and Node.js. Over the past year, I have engineered microservices handling high-concurrency workloads, optimizing query latency by 35%.\n\nI have attached my resume for your review and would welcome the opportunity to discuss how my skill set aligns with your team’s upcoming goals.\n\nSincerely,\nShivansh Rai`,
      desc: 'Polished and business-appropriate',
    },
    Formal: {
      subject: 'Application for Software Engineer Intern — Shivansh Rai',
      body: `Dear Ms. Sarah Jenkins,\n\nI am writing to formally submit my candidacy for the Software Engineer Intern opportunity currently available at Stripe.\n\nWith comprehensive training in Computer Science and demonstrable experience designing reliable, full-stack systems with React and TypeScript, I am confident in my ability to execute technical responsibilities with precision and reliability.\n\nI would welcome the privilege of an interview to discuss how my qualifications align with your organizational goals.\n\nRespectfully,\nShivansh Rai`,
      desc: 'Reads like a formal business letter',
    },
  };

  const themeOptions: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D1117] text-[#17201C] dark:text-[#F0F0F0] relative overflow-hidden font-sans transition-colors">
      {/* Background Decorative Rings & Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_70%_20%,rgba(0,168,120,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_70%_20%,rgba(0,200,150,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-[-100px] w-[500px] h-[500px] bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none z-0"></div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0D1117]/90 backdrop-blur-md border-b border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#00A878] dark:bg-[#161B22] border border-[#00A878]/30 dark:border-[#2D3A4A] flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white dark:text-[#00C896]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
                <path d="m22 7-10 7L2 7" />
                <path d="M16 3c1.5 2 1.5 4 0 6" />
              </svg>
            </div>
            <span className="font-sans font-bold text-[19px] text-[#17201C] dark:text-white tracking-tight">
              MailMint
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[14px] text-[#5E6863] dark:text-[#9CA3AF] font-medium">
            <a href="#hero" className="hover:text-[#00A878] dark:hover:text-white transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[#00A878] dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#tone-spectrum" className="hover:text-[#00A878] dark:hover:text-white transition-colors">
              Tone Spectrum
            </a>
            <a href="#pricing" className="hover:text-[#00A878] dark:hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#creator" className="hover:text-[#00A878] dark:hover:text-white transition-colors">
              Creator
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="flex items-center p-0.5 bg-[#F1F4F2] dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px]">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  title={`${opt.label} mode`}
                  className={`p-1.5 rounded-[4px] transition-all ${
                    theme === opt.id
                      ? 'bg-white dark:bg-[#1F2937] text-[#00A878] dark:text-[#00C896] shadow-xs'
                      : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
                  }`}
                >
                  {opt.icon}
                </button>
              ))}
            </div>

            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-[6px] bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] text-[13px] font-bold hover:bg-[#008f66] dark:hover:bg-[#00b084] transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-medium text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-[6px] bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] text-[13px] font-bold hover:bg-[#008f66] dark:hover:bg-[#00b084] transition-all shadow-sm"
                >
                  Start for Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section Matching User Sample Image */}
      <section id="hero" className="relative z-10 pt-12 sm:pt-16 pb-20 px-6 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A878]/10 dark:bg-[#00C896]/15 border border-[#00A878]/25 dark:border-[#00C896]/30 text-[#00A878] dark:text-[#00C896] text-[12px] font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh outreach. Real connections.</span>
            </div>

            <h1 className="text-[38px] sm:text-[46px] lg:text-[50px] font-extrabold text-[#17201C] dark:text-white tracking-tight leading-[1.12]">
              MailMint: Craft <br />
              <span className="text-[#00A878] dark:text-[#00C896]">
                Perfect Cold Emails
              </span> <br />
              in Seconds
            </h1>

            <p className="text-[16px] sm:text-[17px] text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed max-w-md">
              Generate personalized, effective cold outreach campaigns effortlessly with AI. Delivered from your own verified Gmail inbox with strict human review.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/register"
                className="px-6 py-3 rounded-[8px] bg-[#00A878] dark:bg-[#00C896] hover:bg-[#008f66] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[14px] font-bold transition-all shadow-[0_4px_16px_rgba(0,168,120,0.3)] dark:shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:scale-[1.02] flex items-center gap-2"
              >
                <span>Start Generating For Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="px-5 py-3 rounded-[8px] bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] text-[#17201C] dark:text-white text-[14px] font-semibold hover:bg-[#F1F4F2] dark:hover:bg-[#1F2937] transition-all shadow-xs"
              >
                Learn More
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-[12px] text-[#5E6863] dark:text-[#9CA3AF]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
                <span>100% Anti-Spam Pledge</span>
              </div>
            </div>
          </div>

          {/* Right Column: Rich Visual Workspace Mockup */}
          <div className="lg:col-span-7 relative">
            {/* Ambient Connection Circles in Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
              <div className="w-[480px] h-[480px] rounded-full border border-[#DDE3DF]/60 dark:border-[#2D3A4A]/40 animate-pulse"></div>
              <div className="absolute w-[360px] h-[360px] rounded-full border border-dashed border-[#00A878]/20 dark:border-[#00C896]/20"></div>
            </div>

            {/* Laptop Frame Container */}
            <div className="relative mx-auto max-w-[560px] bg-[#E5EAE7] dark:bg-[#1F2937] p-2.5 rounded-[16px] shadow-2xl border border-[#DDE3DF] dark:border-[#2D3A4A]">
              {/* Camera notch */}
              <div className="w-2.5 h-2.5 bg-[#87918C] dark:bg-[#2D3A4A] rounded-full mx-auto mb-2 opacity-60"></div>

              {/* Laptop Screen Content */}
              <div className="bg-white dark:bg-[#111827] rounded-[10px] overflow-hidden border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-inner text-left">
                
                {/* Screen Header */}
                <div className="px-4 py-2.5 bg-[#F7F8F6] dark:bg-[#161B22] border-b border-[#DDE3DF] dark:border-[#2D3A4A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-[4px] bg-[#00A878] dark:bg-[#00C896] flex items-center justify-center text-white text-[9px] font-bold">
                      M
                    </div>
                    <span className="font-bold text-[12px] text-[#17201C] dark:text-white">MailMint</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#5E6863] dark:text-[#9CA3AF]">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-[#1F2937] border border-[#DDE3DF] dark:border-[#2D3A4A]">
                      Dashboard
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#00A878]/15 dark:bg-[#00C896]/20 text-[#00A878] dark:text-[#00C896] font-semibold">
                      Email Composer
                    </span>
                  </div>
                </div>

                {/* Composer Preview Body */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#17201C] dark:text-white font-sans">
                        Compose Cold Email
                      </h4>
                      <p className="text-[11px] text-[#5E6863] dark:text-[#9CA3AF]">
                        Generate personalized, effective cold outreach campaigns effortlessly with AI.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#00A878] dark:text-[#00C896] bg-[#00A878]/10 dark:bg-[#00C896]/15 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3" />
                      <span>Ready to review</span>
                    </div>
                  </div>

                  {/* Email Canvas inside Mockup */}
                  <div className="bg-[#F7F8F6] dark:bg-[#161B22] p-4 rounded-[8px] border border-[#DDE3DF] dark:border-[#2D3A4A] space-y-2 text-[12px]">
                    <div className="text-[11px] text-[#5E6863] dark:text-[#9CA3AF] font-mono pb-1 border-b border-[#DDE3DF]/60 dark:border-[#2D3A4A]/60 flex items-center justify-between">
                      <span>Subject: Excited about the SWE Intern role at Stripe</span>
                      <span className="text-[#00A878] dark:text-[#00C896]">94 score</span>
                    </div>

                    <p className="text-[#17201C] dark:text-white font-serif leading-relaxed">
                      Dear Sarah,
                    </p>
                    <p className="text-[#5E6863] dark:text-[#9CA3AF] font-serif leading-relaxed line-clamp-3">
                      I noticed your team is actively scaling real-time payment reliability infrastructure. As a Computer Science student with practical experience in React, TypeScript, and distributed systems, I would love to explore how I could contribute to Stripe this summer.
                    </p>
                    <p className="text-[#17201C] dark:text-white font-serif">
                      Sincerely,<br />
                      Shivansh Rai
                    </p>
                  </div>
                </div>
              </div>

              {/* Laptop bottom bar */}
              <div className="h-2 bg-[#DDE3DF] dark:bg-[#111827] rounded-b-[10px] mt-1.5 flex justify-center">
                <div className="w-16 h-1 bg-[#87918C] dark:bg-[#2D3A4A] rounded-full"></div>
              </div>
            </div>

            {/* Floating Quick Composer Card (Left Overlay) */}
            <div className="absolute -left-4 sm:-left-6 top-16 w-52 sm:w-60 bg-white dark:bg-[#161B22] p-3.5 rounded-[12px] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xl text-left space-y-2.5 z-20 animate-fadeIn">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#DDE3DF] dark:border-[#2D3A4A]">
                <div className="w-3.5 h-3.5 rounded-full bg-[#00A878] dark:bg-[#00C896]"></div>
                <span className="text-[11px] font-bold text-[#17201C] dark:text-white">Quick Drafter</span>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-0.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={composerTarget}
                  onChange={(e) => setComposerTarget(e.target.value)}
                  className="w-full px-2 py-1 bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[11px] text-[#17201C] dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-0.5">
                  Offer / Value
                </label>
                <input
                  type="text"
                  value={composerOffer}
                  onChange={(e) => setComposerOffer(e.target.value)}
                  className="w-full px-2 py-1 bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[11px] text-[#17201C] dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#5E6863] dark:text-[#9CA3AF] mb-0.5">
                  Objective
                </label>
                <input
                  type="text"
                  value={composerObjective}
                  onChange={(e) => setComposerObjective(e.target.value)}
                  className="w-full px-2 py-1 bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[11px] text-[#17201C] dark:text-white outline-none"
                />
              </div>

              <button className="w-full py-1.5 bg-[#00A878] dark:bg-[#00C896] hover:bg-[#008f66] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[11px] font-bold rounded shadow-xs transition-colors">
                Generate
              </button>
            </div>

            {/* Floating Performance Stats Card (Right Overlay) */}
            <div className="absolute -right-2 sm:-right-6 bottom-4 w-48 sm:w-56 bg-white dark:bg-[#161B22] p-3.5 rounded-[12px] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xl text-left space-y-2 z-20 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#17201C] dark:text-white font-semibold">
                  <Eye className="w-3.5 h-3.5 text-[#00A878] dark:text-[#00C896]" />
                  High Open Rate
                </span>
                <span className="font-bold text-[#00A878] dark:text-[#00C896]">68%</span>
              </div>
              <div className="w-full bg-[#F1F4F2] dark:bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#00A878] dark:bg-[#00C896] h-full rounded-full w-[68%]"></div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#DDE3DF] dark:border-[#2D3A4A]">
                <span className="flex items-center gap-1.5 text-[#5E6863] dark:text-[#9CA3AF]">
                  <MousePointerClick className="w-3.5 h-3.5 text-[#6366F1]" />
                  Click Rate
                </span>
                <span className="font-semibold text-[#17201C] dark:text-white">22%</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#5E6863] dark:text-[#9CA3AF]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                  Response Rate
                </span>
                <span className="font-semibold text-[#17201C] dark:text-white">15%</span>
              </div>
            </div>

            {/* Flying Email Icons with Green Delivery Arrows */}
            <div className="absolute -top-4 right-10 sm:right-16 flex items-center gap-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] px-2.5 py-1.5 rounded-full shadow-lg animate-bounce">
              <Mail className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
              <span className="text-[10px] font-bold text-[#00A878] dark:text-[#00C896]">Delivered ↑</span>
            </div>

            <div className="absolute top-24 -right-4 flex items-center gap-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] px-2.5 py-1.5 rounded-full shadow-lg">
              <Mail className="w-3.5 h-3.5 text-[#6366F1]" />
              <span className="text-[10px] font-bold text-[#6366F1]">Replied ↑</span>
            </div>
          </div>

        </div>
      </section>

      {/* Social Proof: Recruiter Company Wall */}
      <section className="py-12 border-y border-[#DDE3DF] dark:border-[#2D3A4A] bg-white/60 dark:bg-[#111827]/40">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <p className="text-[12px] font-mono uppercase tracking-wider text-[#5E6863] dark:text-[#9CA3AF] mb-6">
            Empowering students and engineers reaching out to teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-90">
            {['Stripe', 'Linear', 'Figma', 'Google', 'Datadog', 'Microsoft', 'Meta', 'Airbnb'].map((comp) => (
              <div key={comp} className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] shadow-xs hover:border-[#00A878] dark:hover:border-[#00C896] transition-colors">
                <CompanyLogo name={comp} size="sm" />
                <span className="text-[13px] font-semibold text-[#17201C] dark:text-white">{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="how-it-works" className="py-20 px-6 max-w-[1280px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold tracking-wider">
            Engineered for High Response
          </span>
          <h2 className="text-[30px] sm:text-[36px] font-bold text-[#17201C] dark:text-white mt-2 font-sans tracking-tight">
            Not a Spam Tool. Real Connections.
          </h2>
          <p className="text-[14px] text-[#5E6863] dark:text-[#9CA3AF] mt-3 leading-relaxed">
            MailMint bridges your actual technical background with target recruiter job descriptions, generating authentic emails delivered straight from your verified personal Gmail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-[8px] bg-[#00A878]/10 dark:bg-[#00C896]/15 text-[#00A878] dark:text-[#00C896] flex items-center justify-center mb-4 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-[#17201C] dark:text-white mb-2">
              Ghostwriter Voice
            </h3>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed">
              Trains on your past writing samples to match your natural tone, sentence cadence, and personal sign-off habits.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-[8px] bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mb-4 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-[#17201C] dark:text-white mb-2">
              Anti-Spam Preflight
            </h3>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed">
              Mandatory pre-flight checklist. Checks for buzzword spam, verifies recruiter identity, and requires explicit user review.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mb-4 font-bold">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-[#17201C] dark:text-white mb-2">
              Personal Gmail API
            </h3>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed">
              Dispatches directly through your personal Google mailbox. Zero third-party spam server pools, maximizing deliverability.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-[8px] bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center mb-4 font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-[#17201C] dark:text-white mb-2">
              Sentiment & Sync
            </h3>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed">
              AI automatically classifies incoming replies (Interview Offer, Referral Confirmed, Polite Pass) and advances your Kanban pipeline.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Tone Spectrum Playground */}
      <section id="tone-spectrum" className="py-20 px-6 max-w-[1280px] mx-auto border-t border-[#DDE3DF] dark:border-[#2D3A4A]">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold tracking-wider">
            Precision Style Control
          </span>
          <h2 className="text-[30px] sm:text-[36px] font-bold text-[#17201C] dark:text-white mt-2 font-sans tracking-tight">
            The 5-Tone Spectrum
          </h2>
          <p className="text-[14px] text-[#5E6863] dark:text-[#9CA3AF] mt-2">
            Every company culture is different. Slide through MailMint's spectrum to find the perfect cadence.
          </p>
        </div>

        {/* Tone Selector Buttons */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-sm overflow-x-auto max-w-full">
            {(['Casual', 'Warm', 'Balanced', 'Professional', 'Formal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDemoTone(t)}
                className={`px-4 py-2 rounded-[6px] text-[13px] font-medium transition-all ${
                  demoTone === t
                    ? 'bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] font-bold shadow-xs'
                    : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Realistic Email Paper Preview */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-lg p-6 sm:p-8 text-left space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE3DF] dark:border-[#2D3A4A] text-[12px]">
            <div className="flex items-center gap-2 text-[#5E6863] dark:text-[#9CA3AF]">
              <span className="font-semibold text-[#17201C] dark:text-white">Tone Profile:</span>
              <span className="text-[#00A878] dark:text-[#00C896] font-medium">{demoTone}</span>
              <span>— {tonePreviews[demoTone].desc}</span>
            </div>
            <CompanyLogo name="Stripe" size="xs" />
          </div>

          <div>
            <span className="text-[11px] font-mono text-[#5E6863] dark:text-[#9CA3AF] block mb-1">SUBJECT LINE</span>
            <div className="text-[15px] font-semibold text-[#17201C] dark:text-white">
              {tonePreviews[demoTone].subject}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-mono text-[#5E6863] dark:text-[#9CA3AF] block mb-2">EMAIL BODY</span>
            <div className="p-4 bg-[#F7F8F6] dark:bg-[#111827] rounded-[6px] border border-[#DDE3DF] dark:border-[#2D3A4A] text-[#17201C] dark:text-white font-serif text-[14px] leading-relaxed whitespace-pre-line">
              {tonePreviews[demoTone].body}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-[1280px] mx-auto border-t border-[#DDE3DF] dark:border-[#2D3A4A]">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold tracking-wider">
            Simple, Transparent
          </span>
          <h2 className="text-[30px] sm:text-[36px] font-bold text-[#17201C] dark:text-white mt-2 font-sans tracking-tight">
            Built for Students and Job Seekers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold">Free Starter</span>
              <div className="mt-2 mb-4">
                <span className="text-[36px] font-bold text-[#17201C] dark:text-white">$0</span>
                <span className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]"> / forever</span>
              </div>
              <ul className="space-y-2.5 text-[13px] text-[#5E6863] dark:text-[#9CA3AF] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> 25 Saved Contacts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> 5 Emails per day</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Gmail API Integration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Pre-Flight Anti-Spam Check</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 text-center bg-[#F1F4F2] dark:bg-[#1F2937] text-[#17201C] dark:text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#E5EAE7] dark:hover:bg-[#2D3A4A] transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="p-6 bg-white dark:bg-[#161B22] border-2 border-[#00A878] dark:border-[#00C896] rounded-[10px] flex flex-col justify-between relative shadow-xl">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-[4px] bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] text-[10px] font-bold uppercase font-mono">
              Most Popular
            </span>
            <div>
              <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold">Pro Job Hunter</span>
              <div className="mt-2 mb-4">
                <span className="text-[36px] font-bold text-[#17201C] dark:text-white">$19</span>
                <span className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]"> / month</span>
              </div>
              <ul className="space-y-2.5 text-[13px] text-[#17201C] dark:text-white mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> 1,000 Saved Contacts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> 50 Emails per day</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Ghostwriter Voice Trainer</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Recruiter Reply Sentiment Sync</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Chrome Extension (MailMint Clipper)</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 text-center bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] text-[13px] font-bold rounded-[6px] hover:bg-[#008f66] dark:hover:bg-[#00b084] transition-colors shadow-sm"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Team Tier */}
          <div className="p-6 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[12px] font-mono text-[#00A878] dark:text-[#00C896] uppercase font-bold">Cohort / Campus</span>
              <div className="mt-2 mb-4">
                <span className="text-[36px] font-bold text-[#17201C] dark:text-white">$49</span>
                <span className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]"> / month</span>
              </div>
              <ul className="space-y-2.5 text-[13px] text-[#5E6863] dark:text-[#9CA3AF] mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> 5 Team Member Seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Shared Template Library</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Cohort Response Analytics</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" /> Priority API Support</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="w-full py-2.5 text-center bg-[#F1F4F2] dark:bg-[#1F2937] text-[#17201C] dark:text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#E5EAE7] dark:hover:bg-[#2D3A4A] transition-colors"
            >
              Contact Team Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Creator Footer with Contact Details & Portfolio */}
      <footer id="creator" className="border-t border-[#DDE3DF] dark:border-[#2D3A4A] bg-white dark:bg-[#111827] py-14 px-6 transition-colors">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-left">
          
          {/* Col 1: Brand & Ethos */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#00A878] dark:bg-[#161B22] flex items-center justify-center text-white dark:text-[#00C896] font-bold text-xs shadow-xs">
                M
              </div>
              <span className="text-[18px] font-bold text-[#17201C] dark:text-white">MailMint</span>
            </div>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] max-w-sm leading-relaxed">
              <strong>Fresh outreach. Real connections.</strong><br />
              The AI cold outreach and recruiter email platform built strictly for thoughtful, human-reviewed professional connections.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-[12px] font-mono uppercase text-[#17201C] dark:text-white font-bold mb-3">Product</h4>
            <ul className="space-y-2 text-[13px] text-[#5E6863] dark:text-[#9CA3AF]">
              <li><Link to="/email-generator" className="hover:text-[#00A878] dark:hover:text-[#00C896] transition-colors">AI Email Generator</Link></li>
              <li><Link to="/contacts" className="hover:text-[#00A878] dark:hover:text-[#00C896] transition-colors">Contacts CRM & Kanban</Link></li>
              <li><Link to="/jobs" className="hover:text-[#00A878] dark:hover:text-[#00C896] transition-colors">Target Jobs Tracker</Link></li>
              <li><Link to="/analytics" className="hover:text-[#00A878] dark:hover:text-[#00C896] transition-colors">Skills Gap Analytics</Link></li>
            </ul>
          </div>

          {/* Col 3: Creator Details & Portfolio */}
          <div>
            <h4 className="text-[12px] font-mono uppercase text-[#00A878] dark:text-[#00C896] font-bold mb-3">Created By</h4>
            <div className="space-y-2 text-[13px]">
              <p className="font-bold text-[#17201C] dark:text-white">SHIVANSH RAI</p>
              <p className="text-[#5E6863] dark:text-[#9CA3AF]">Aspiring Software Developer & AI Builder</p>

              <div className="pt-2 flex flex-col gap-1.5">
                <a
                  href="https://portfolio-shivansh-green.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#00A878] dark:text-[#00C896] font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Shivansh Rai | Aspiring Software Developer</span>
                </a>

                <a
                  href="mailto:shivanshrai282@gmail.com"
                  className="flex items-center gap-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>shivanshrai282@gmail.com</span>
                </a>

                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="https://portfolio-shivansh-green.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded bg-[#F1F4F2] dark:bg-[#1F2937] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white transition-colors"
                    title="Portfolio"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href="mailto:shivanshrai282@gmail.com"
                    className="p-1.5 rounded bg-[#F1F4F2] dark:bg-[#1F2937] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white transition-colors"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto pt-6 border-t border-[#DDE3DF] dark:border-[#2D3A4A] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#87918C] dark:text-[#6B7280]">
          <p>© 2026 MailMint. All rights reserved.</p>
          <p>Strictly Human-in-the-Loop · Powered by Gemini & Express</p>
        </div>
      </footer>
    </div>
  );
};
