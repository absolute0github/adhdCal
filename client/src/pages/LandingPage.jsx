import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, CalendarCheck, Zap, Target, Sparkles, Clock, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: CalendarCheck,
    title: 'Auto-Schedule',
    description: 'Finds open slots in your Google Calendar and drops tasks in for you. No dragging, no guessing.',
  },
  {
    icon: Zap,
    title: 'Manageable Sessions',
    description: 'Breaks big tasks into focus-friendly chunks so you can actually start instead of staring at a wall of work.',
  },
  {
    icon: Target,
    title: 'Priority + Complexity',
    description: 'Tag tasks by urgency and difficulty. Tackle easy wins first or frontload the hard stuff — your call.',
  },
  {
    icon: Brain,
    title: 'Brain Dump Mode',
    description: 'Dump every task in your head at once. Get it all out, then let ADHDCal sort out when it happens.',
  },
];

const steps = [
  {
    icon: Sparkles,
    step: '1',
    title: 'Add your tasks',
    description: 'Type them in one by one or brain-dump a whole list. No pressure to organize yet.',
  },
  {
    icon: Clock,
    step: '2',
    title: 'Set your preferences',
    description: 'Tell us your work hours, session length, and which days you actually want to work.',
  },
  {
    icon: CalendarCheck,
    step: '3',
    title: 'Hit auto-schedule',
    description: 'One click and your tasks land in your Google Calendar. Done. Go do the thing.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ctaLink = isAuthenticated ? '/app' : '/login';
  const ctaText = isAuthenticated ? 'Go to App' : 'Get Started Free';

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ADHDCal
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
              {isAuthenticated ? (
                <Link to="/app" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all">
                  Go to App
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Log In</Link>
                  <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 hover:text-indigo-600 py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 hover:text-indigo-600 py-2">How It Works</a>
            {!isAuthenticated && (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600 hover:text-indigo-600 py-2">Log In</Link>
            )}
            <Link
              to={ctaLink}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-6">
            <Brain className="w-4 h-4" />
            Built for ADHD brains
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Finally, a calendar that{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              gets your brain
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dump your tasks, set your hours, and let ADHDCal auto-schedule
            everything into your Google Calendar. No executive function required.
          </p>

          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Problem statement */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Traditional calendars assume you can just... do things.
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          They give you a blank grid and expect you to figure out what goes where, when to
          start, and how long it takes. For ADHD brains, that blank grid is a recipe for
          paralysis. ADHDCal does the planning part for you so you can focus on the doing part.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tools that work with your brain
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature is designed to reduce friction and make starting easier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Three steps. That's it.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No 20-minute setup. No tutorials. Just tasks in, calendar out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-indigo-600 mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to work with your brain?
          </h2>
          <p className="text-lg text-indigo-100 mb-10 max-w-xl mx-auto">
            Stop fighting your calendar. Start using one that actually helps.
          </p>
          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:bg-indigo-50"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span>&copy; {new Date().getFullYear()} ADHDCal. Built for brains that work differently.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
