import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, CalendarCheck, Zap, Target, Sparkles, Clock, Menu, X,
  ArrowRight, Star, Check, Plus, Calendar, ListTodo, Columns, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Scroll animation hook ────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.8s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.8s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Browser frame for mockups ────────────────────────────── */
function BrowserFrame({ children, url = 'adhdcal.top', className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-2xl border border-gray-200/60 ${className}`}>
      <div className="bg-[#F1F0EE] px-4 py-2.5 flex items-center gap-3 border-b border-gray-200/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EC6A5E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F5BF4F]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#61C554]" />
        </div>
        <div className="flex-1 bg-white/70 rounded-lg px-3 py-1 text-[11px] text-gray-400 text-center font-mono">
          {url}
        </div>
      </div>
      <div className="bg-[#F8F7F6]">{children}</div>
    </div>
  );
}

/* ─── App header bar for mockups ───────────────────────────── */
function MockupAppHeader({ rightContent }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ADHDCal
        </span>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
      </div>
    </div>
  );
}

/* ─── Data ─────────────────────────────────────────────────── */
const features = [
  {
    icon: CalendarCheck,
    title: 'Auto-Schedule',
    desc: 'Finds open slots in your Google Calendar and drops tasks in for you. No dragging, no guessing, no decision fatigue.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Zap,
    title: 'Manageable Sessions',
    desc: 'Breaks big tasks into focus-friendly chunks so you actually start instead of staring at a 4-hour block and dissociating.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Target,
    title: 'Priority + Complexity',
    desc: 'Tag tasks by urgency and difficulty. Tackle easy wins first for momentum or frontload the hard stuff — your call.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Brain,
    title: 'Brain Dump Mode',
    desc: 'Dump every task rattling around your head at once. Get it all out, then let ADHDCal sort out when it happens.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

const steps = [
  { num: '01', title: 'Add your tasks', desc: 'Type them one by one or brain-dump a whole list. No pressure to organize anything yet.', icon: Sparkles },
  { num: '02', title: 'Set your preferences', desc: 'Tell us your work hours, session length, and which days you actually want to work.', icon: Clock },
  { num: '03', title: 'Hit auto-schedule', desc: 'One click. Your tasks land in your Google Calendar. Done. Go do the thing.', icon: CalendarCheck },
];

const testimonials = [
  {
    quote: "I used to spend more time planning than doing. ADHDCal just... handles it. I add my tasks, hit schedule, and they're in my calendar. Game changer.",
    name: 'Sarah M.',
    role: 'Freelance Designer',
    initial: 'S',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    quote: "The brain dump feature alone is worth it. I can get everything out of my head in 30 seconds and ADHDCal figures out the rest.",
    name: 'Jake R.',
    role: 'Software Developer',
    initial: 'J',
    gradient: 'from-indigo-400 to-blue-500',
  },
  {
    quote: "For the first time in my life, I actually look at my calendar and feel calm instead of overwhelmed. The 7-day trial convinced me in about 2 days.",
    name: 'Priya K.',
    role: 'Graduate Student',
    initial: 'P',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

/* ─── Mockup: Hero Dashboard Preview ──────────────────────── */
function DashboardPreview() {
  return (
    <BrowserFrame>
      <MockupAppHeader
        rightContent={
          <div className="px-2.5 py-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 rounded-md flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> Connected
          </div>
        }
      />
      <div className="p-4 space-y-3">
        {/* Task Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-semibold text-gray-800 mb-2">Add New Task</div>
          <div className="flex gap-1.5 mb-2.5">
            <div className="px-2.5 py-1 text-[10px] font-medium bg-blue-600 text-white rounded-md flex items-center gap-1">
              <Plus className="w-2.5 h-2.5" /> Single Task
            </div>
            <div className="px-2.5 py-1 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-md flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Brain Dump
            </div>
          </div>
          <div className="bg-gray-50 rounded-md px-2.5 py-1.5 text-[11px] text-gray-800 mb-2 border border-gray-200">
            Write blog post
          </div>
          <div className="flex gap-2 mb-2">
            <div className="bg-gray-50 rounded-md px-2.5 py-1.5 text-[11px] text-gray-800 border border-gray-200 flex-1">
              2h <span className="text-gray-400">= 2 hours</span>
            </div>
          </div>
          <div className="flex gap-1 mb-2.5">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${
                  n === 3 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {n}
              </div>
            ))}
            <span className="text-[10px] text-gray-400 ml-1 self-center">Medium</span>
          </div>
          <div className="flex gap-1.5">
            <div className="px-2 py-1 text-[9px] font-medium bg-gray-100 text-gray-600 rounded-md">Add to Backlog</div>
            <div className="px-2 py-1 text-[9px] font-medium bg-blue-600 text-white rounded-md">Add & Schedule</div>
            <div className="px-2 py-1 text-[9px] font-medium bg-green-600 text-white rounded-md">Auto-Schedule</div>
          </div>
        </div>

        {/* Task Backlog */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              <ListTodo className="w-3 h-3 text-gray-400" /> Task Backlog
            </div>
            <div className="px-2 py-0.5 text-[9px] font-medium bg-green-50 text-green-700 rounded-md flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> Auto-Schedule All
            </div>
          </div>
          {[
            { name: 'Design homepage mockup', dur: '1h 30m', comp: 2, compColor: 'bg-green-500' },
            { name: 'Write blog post', dur: '2h', comp: 3, compColor: 'bg-yellow-500' },
            { name: 'Review pull request', dur: '45m', comp: 1, compColor: 'bg-green-500' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-6 rounded-full ${t.compColor}`} />
                <div>
                  <div className="text-[11px] font-medium text-gray-800">{t.name}</div>
                  <div className="text-[9px] text-gray-400">{t.dur} &middot; Complexity {t.comp}</div>
                </div>
              </div>
              <div className="px-1.5 py-0.5 text-[8px] font-medium bg-blue-50 text-blue-600 rounded">Schedule</div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ─── Mockup: Task Entry Detail ───────────────────────────── */
function TaskEntryMockup() {
  return (
    <BrowserFrame url="adhdcal.top/app">
      <MockupAppHeader />
      <div className="p-5 max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Add New Task</h3>
          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg">
              <Plus className="w-3 h-3" /> Single Task
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg">
              <Zap className="w-3 h-3" /> Brain Dump
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">Task Name</label>
              <div className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white">
                Plan weekend camping trip
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">Estimated Duration</label>
              <div className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white flex justify-between">
                <span>1h 30m</span>
                <span className="text-gray-400">= 1 hour 30 min</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1 block">Complexity</label>
              <div className="flex gap-1.5 items-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center ${
                      n === 2 ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {n}
                  </div>
                ))}
                <span className="text-xs text-gray-400 ml-2">Easy</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Add to Backlog
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg">
              <Calendar className="w-3.5 h-3.5" /> Add & Schedule
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg">
              <Zap className="w-3.5 h-3.5" /> Auto-Schedule
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ─── Mockup: Task Backlog ────────────────────────────────── */
function TaskBacklogMockup() {
  const tasks = [
    { name: 'Design homepage mockup', dur: '1h 30m', comp: 2, color: 'bg-green-500' },
    { name: 'Write blog post for launch', dur: '2h', comp: 3, color: 'bg-yellow-500' },
    { name: 'Review client pull request', dur: '45m', comp: 1, color: 'bg-green-500' },
    { name: 'Prepare pitch deck', dur: '3h', comp: 4, color: 'bg-red-500' },
    { name: 'Update portfolio website', dur: '1h', comp: 2, color: 'bg-green-500' },
  ];

  return (
    <BrowserFrame url="adhdcal.top/app">
      <MockupAppHeader />
      <div className="p-5 max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Task Backlog</h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[10px] text-gray-500">
                <div className="w-3 h-3 rounded border border-gray-300 bg-green-500 flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
                Easier first
              </label>
              <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-green-50 text-green-700 rounded-lg">
                <Zap className="w-3 h-3" /> Auto-Schedule All
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 bg-white">
                <div className={`w-1 h-10 rounded-full ${t.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{t.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{t.dur} &middot; Complexity {t.comp}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="px-2 py-1 text-[9px] font-semibold bg-blue-50 text-blue-600 rounded-md">Schedule</div>
                  <div className="px-2 py-1 text-[9px] font-semibold bg-green-50 text-green-600 rounded-md">Auto</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ─── Mockup: Kanban Board ────────────────────────────────── */
function KanbanMockup() {
  const columns = [
    {
      title: 'Backlog', bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700',
      tasks: [{ name: 'Update resume', dur: '1h' }, { name: 'Research competitors', dur: '2h' }],
    },
    {
      title: 'In Progress', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700',
      tasks: [{ name: 'Write blog post', dur: '2h' }],
    },
    {
      title: 'Scheduled', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700',
      tasks: [{ name: 'Design mockup', dur: '1h30m' }, { name: 'Code review', dur: '45m' }],
    },
    {
      title: 'Done', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700',
      tasks: [{ name: 'Send invoice', dur: '15m' }, { name: 'Team standup', dur: '30m' }, { name: 'Fix login bug', dur: '1h' }],
    },
  ];

  return (
    <BrowserFrame url="adhdcal.top/app">
      <MockupAppHeader
        rightContent={
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-medium">
            <Columns className="w-3 h-3" /> Board
          </div>
        }
      />
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-[600px]">
          {columns.map((col, ci) => (
            <div key={ci} className="flex-1 min-w-[140px]">
              <div className={`rounded-t-lg px-2.5 py-1.5 border-t-2 ${col.border} ${col.bg}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${col.text}`}>{col.title}</span>
                  <span className={`text-[9px] font-medium ${col.text} opacity-60`}>{col.tasks.length}</span>
                </div>
              </div>
              <div className="bg-gray-50/80 border border-t-0 border-gray-200 rounded-b-lg p-1.5 space-y-1.5 min-h-[100px]">
                {col.tasks.map((t, ti) => (
                  <div key={ti} className="bg-white rounded-md p-2 border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-semibold text-gray-800">{t.name}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{t.dur}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const ctaLink = isAuthenticated ? '/app' : '/login';
  const ctaText = isAuthenticated ? 'Go to App' : 'Start Your Free 7-Day Trial';
  const ctaTextShort = isAuthenticated ? 'Go to App' : 'Start Free Trial';

  const mockupTabs = [
    { label: 'Task Entry', icon: Plus, component: TaskEntryMockup },
    { label: 'Task Backlog', icon: ListTodo, component: TaskBacklogMockup },
    { label: 'Kanban Board', icon: Columns, component: KanbanMockup },
  ];

  return (
    <>
      <style>{`
        .font-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-pulse-soft { animation: pulse-soft 4s ease-in-out infinite; }
        .cta-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <div className="font-body min-h-screen bg-white text-gray-600">

        {/* ───── Nav ───── */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ADHDCal
                </span>
              </Link>

              {/* Desktop */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">How It Works</a>
                <a href="#testimonials" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Testimonials</a>
                <Link to="/pricing" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Pricing</Link>
                {isAuthenticated ? (
                  <Link
                    to="/app"
                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50"
                  >
                    Go to App
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Log In</Link>
                    <Link
                      to="/login"
                      className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50"
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-5 space-y-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-indigo-600">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-indigo-600">How It Works</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-indigo-600">Testimonials</a>
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-indigo-600">Log In</Link>
              )}
              <Link
                to={ctaLink}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl"
              >
                {ctaTextShort}
              </Link>
            </div>
          )}
        </nav>

        {/* ───── Hero ───── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[#FAFBFF]" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200 rounded-full opacity-20 blur-[100px] animate-pulse-soft" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-200 rounded-full opacity-20 blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-pink-200 rounded-full opacity-15 blur-[80px] animate-pulse-soft" style={{ animationDelay: '4s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <Reveal>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded-full mb-6">
                    <Brain className="w-4 h-4" />
                    Built for ADHD brains
                  </span>
                </Reveal>

                <Reveal delay={0.1}>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                    Finally, a calendar that{' '}
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                      gets your brain
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={0.2}>
                  <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8 max-w-xl">
                    Dump your tasks, set your hours, and let ADHDCal auto-schedule everything
                    into your Google Calendar. No executive function required.
                  </p>
                </Reveal>

                <Reveal delay={0.3}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link
                      to={ctaLink}
                      className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-300/30 transition-all hover:shadow-2xl hover:shadow-indigo-400/30 hover:-translate-y-0.5"
                    >
                      {ctaText}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    {!isAuthenticated && (
                      <span className="text-sm text-gray-400 font-medium">No credit card required</span>
                    )}
                  </div>
                </Reveal>
              </div>

              {/* App Preview */}
              <Reveal delay={0.2} className="lg:pl-4">
                <div style={{ perspective: '1200px' }}>
                  <div style={{ transform: 'rotateY(-6deg) rotateX(3deg)' }}>
                    <DashboardPreview />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ───── Social Proof ───── */}
        <section className="border-y border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-gray-100">
              {[
                { icon: Brain, label: 'Built for ADHD brains', color: 'text-purple-600' },
                { icon: CalendarCheck, label: '500+ tasks scheduled', color: 'text-indigo-600' },
                { icon: Calendar, label: 'Google Calendar sync', color: 'text-blue-600' },
                { icon: Shield, label: 'Free 7-day trial', color: 'text-emerald-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2.5 py-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Problem Statement ───── */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-8">
                Traditional calendars assume you can just...{' '}
                <span className="italic text-gray-400">do things.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-6">
                They give you a blank grid and expect you to figure out what goes where, when
                to start, and how long everything takes. For ADHD brains, that blank grid is a
                recipe for paralysis.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="text-lg sm:text-xl text-gray-500 leading-relaxed">
                <strong className="text-gray-800">ADHDCal does the planning part for you</strong>{' '}
                so you can focus on the doing part.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ───── Features ───── */}
        <section id="features" className="scroll-mt-20 bg-[#FAFBFF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center mb-16">
              <Reveal>
                <span className="text-sm font-bold text-indigo-600 tracking-wide uppercase mb-3 block">Features</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Tools that work <em>with</em> your brain
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                  Every feature is designed to reduce friction and make starting easier.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.1}>
                  <div className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <f.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───── App Screenshots ───── */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center mb-12">
              <Reveal>
                <span className="text-sm font-bold text-indigo-600 tracking-wide uppercase mb-3 block">See It In Action</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Your new favorite productivity tool
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                  Clean interface. Zero learning curve. Built for brains that need less friction, not more features.
                </p>
              </Reveal>
            </div>

            <Reveal>
              {/* Tabs */}
              <div className="flex justify-center gap-2 mb-8">
                {mockupTabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === i
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200/50'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Active mockup */}
              <div className="max-w-3xl mx-auto">
                {(() => {
                  const ActiveMockup = mockupTabs[activeTab].component;
                  return <ActiveMockup />;
                })()}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ───── How It Works ───── */}
        <section id="how-it-works" className="scroll-mt-20 bg-[#FAFBFF]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center mb-16">
              <Reveal>
                <span className="text-sm font-bold text-indigo-600 tracking-wide uppercase mb-3 block">How It Works</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Three steps. That&rsquo;s it.
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                  No 20-minute setup. No tutorials. Just tasks in, calendar out.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200" />

              {steps.map((s, i) => (
                <Reveal key={s.num} delay={i * 0.15} className="text-center relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200/40 relative z-10">
                    <s.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="font-display text-sm font-bold text-indigo-500 mb-2">Step {s.num}</div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Testimonials ───── */}
        <section id="testimonials" className="scroll-mt-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center mb-16">
              <Reveal>
                <span className="text-sm font-bold text-indigo-600 tracking-wide uppercase mb-3 block">Testimonials</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  People like you, getting stuff done
                </h2>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="bg-[#FAFBFF] rounded-2xl p-8 border border-gray-100 h-full flex flex-col">
                    <div className="flex gap-1 mb-5">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 leading-relaxed flex-1 mb-6 italic">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold`}>
                        {t.initial}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-400">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Pricing / Trial CTA ───── */}
        <section id="pricing" className="bg-[#FAFBFF]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <Reveal>
              <div className="text-center bg-white rounded-3xl p-10 sm:p-14 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100 rounded-full opacity-50 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-100 rounded-full opacity-50 blur-2xl" />

                <div className="relative">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold rounded-full mb-6">
                    <Sparkles className="w-4 h-4" />
                    7 days free
                  </span>

                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Try ADHDCal free for 7 days
                  </h2>
                  <p className="text-lg text-gray-500 mb-2 max-w-lg mx-auto">
                    No credit card required. No commitment. Just sign up and start scheduling.
                  </p>
                  <p className="text-sm text-gray-400 mb-10">
                    Then $5.99/month. Cancel anytime &mdash; we make it easy, not guilt-trippy.
                  </p>

                  <Link
                    to={ctaLink}
                    className="group inline-flex items-center gap-2.5 px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xl font-bold rounded-2xl shadow-xl shadow-indigo-300/30 transition-all hover:shadow-2xl hover:shadow-indigo-400/40 hover:-translate-y-0.5"
                  >
                    {ctaText}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" /> No credit card
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" /> Cancel anytime
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" /> Full access
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ───── Final CTA ───── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Ready to work with your brain,{' '}
                <span className="text-indigo-200">not against it?</span>
              </h2>
              <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
                Stop fighting your calendar. Start using one that actually helps.
              </p>
              <Link
                to={ctaLink}
                className="group inline-flex items-center gap-2.5 px-10 py-5 bg-white text-indigo-600 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                {ctaText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ───── Footer ───── */}
        <footer className="bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-white">ADHDCal</span>
              </div>
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} ADHDCal. Built for brains that work differently.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
