import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Timer, Volume2, VolumeX, Settings } from 'lucide-react';

/**
 * FocusTimer — ADHD-friendly Pomodoro Timer
 * 
 * Designed with ADHD users in mind:
 * - Large, clear countdown display (no tiny numbers)
 * - Visual progress ring shows time remaining at a glance
 * - Minimal controls, clear states
 * - Encouraging messages between sessions
 * - Browser notifications when timer completes
 * - Session counter for sense of accomplishment
 */

const ENCOURAGEMENTS = [
  "You crushed it! 🎉",
  "Another one done! 💪",
  "Focus champion! 🏆",
  "You're on fire! 🔥",
  "Keep that momentum! 🚀",
  "Nailed it! ⭐",
  "Brain power activated! 🧠",
  "Unstoppable! 💥",
];

const BREAK_MESSAGES = [
  "Take a breather. You earned it. ☕",
  "Stand up, stretch, hydrate. 💧",
  "Rest your eyes. Look at something far away. 👀",
  "Quick break — you'll come back stronger. 💪",
  "Breathe in... breathe out... 🌊",
];

const PRESETS = {
  standard: { work: 25, short: 5, long: 15, label: '25/5' },
  short: { work: 15, short: 3, long: 10, label: '15/3' },
  long: { work: 50, short: 10, long: 20, label: '50/10' },
};

export default function FocusTimer() {
  // Timer state
  const [preset, setPreset] = useState('standard');
  const [phase, setPhase] = useState('idle'); // idle, work, break, longBreak
  const [timeLeft, setTimeLeft] = useState(PRESETS.standard.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [encouragement, setEncouragement] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const config = PRESETS[preset];

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Create audio context for completion sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Pleasant chime — two notes
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.8);
      });
    } catch (e) {
      // Audio not available, that's ok
    }
  }, [soundEnabled]);

  // Notify user
  const notify = useCallback((title, body) => {
    playSound();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🍅' });
    }
  }, [playSound]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase]);

  function handleTimerComplete() {
    setIsRunning(false);

    if (phase === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      setTotalFocusMinutes(prev => prev + config.work);
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);

      // Every 4 pomodoros = long break
      if (newCount % 4 === 0) {
        setPhase('longBreak');
        setTimeLeft(config.long * 60);
        notify('Long Break Time! 🎉', `${newCount} pomodoros done! Take a ${config.long}-minute break.`);
      } else {
        setPhase('break');
        setTimeLeft(config.short * 60);
        notify('Break Time! ☕', BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)]);
      }
    } else {
      // Break is over
      setPhase('work');
      setTimeLeft(config.work * 60);
      setEncouragement('');
      notify('Focus Time! 🎯', `Time to work for ${config.work} minutes.`);
    }
  }

  function startTimer() {
    if (phase === 'idle') {
      setPhase('work');
      setTimeLeft(config.work * 60);
    }
    setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setPhase('idle');
    setTimeLeft(config.work * 60);
    setEncouragement('');
  }

  function skipToNext() {
    setIsRunning(false);
    if (phase === 'work') {
      handleTimerComplete();
    } else {
      setPhase('work');
      setTimeLeft(config.work * 60);
      setEncouragement('');
    }
  }

  function changePreset(newPreset) {
    setPreset(newPreset);
    if (!isRunning) {
      setPhase('idle');
      setTimeLeft(PRESETS[newPreset].work * 60);
      setEncouragement('');
    }
    setShowSettings(false);
  }

  // Format time display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = phase === 'work' ? config.work * 60 :
                       phase === 'break' ? config.short * 60 :
                       phase === 'longBreak' ? config.long * 60 :
                       config.work * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;

  // SVG progress ring
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Phase colors
  const phaseColors = {
    idle: { ring: '#6366f1', bg: 'from-indigo-950 to-gray-900', text: 'text-indigo-400' },
    work: { ring: '#f59e0b', bg: 'from-amber-950 to-gray-900', text: 'text-amber-400' },
    break: { ring: '#10b981', bg: 'from-emerald-950 to-gray-900', text: 'text-emerald-400' },
    longBreak: { ring: '#8b5cf6', bg: 'from-violet-950 to-gray-900', text: 'text-violet-400' },
  };
  const colors = phaseColors[phase] || phaseColors.idle;

  const phaseLabels = {
    idle: 'Ready to Focus',
    work: 'Focus Time',
    break: 'Short Break',
    longBreak: 'Long Break',
  };

  return (
    <div className={`min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-b ${colors.bg} rounded-2xl p-8 transition-all duration-700`}>
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer className={`w-6 h-6 ${colors.text}`} />
          <h1 className="text-2xl font-bold text-white">Focus Timer</h1>
        </div>
        <p className={`text-lg font-medium ${colors.text} transition-colors duration-500`}>
          {phaseLabels[phase]}
        </p>
      </div>

      {/* Encouragement message */}
      {encouragement && (
        <div className="mb-6 animate-bounce">
          <p className="text-xl font-bold text-white">{encouragement}</p>
        </div>
      )}

      {/* Timer Ring */}
      <div className="relative mb-10">
        <svg width="320" height="320" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        
        {/* Time display — centered over ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-mono font-bold text-white tracking-wider tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {phase !== 'idle' && (
            <span className="text-sm text-gray-400 mt-2">
              {phase === 'work' ? `Session ${completedPomodoros + 1}` : 'Recharging...'}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        {/* Reset */}
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Reset"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        {/* Play/Pause — Large center button */}
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="p-6 rounded-full bg-white text-gray-900 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
            title={phase === 'idle' ? 'Start' : 'Resume'}
          >
            <Play className="w-10 h-10 ml-1" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-6 rounded-full bg-white text-gray-900 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
            title="Pause"
          >
            <Pause className="w-10 h-10" />
          </button>
        )}

        {/* Skip */}
        <button
          onClick={skipToNext}
          disabled={phase === 'idle'}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Skip to next"
        >
          {phase === 'break' || phase === 'longBreak' ? (
            <Zap className="w-6 h-6" />
          ) : (
            <Coffee className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Session Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < (completedPomodoros % 4) ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <span>{completedPomodoros} pomodoro{completedPomodoros !== 1 ? 's' : ''}</span>
        </div>
        <span>•</span>
        <span>{totalFocusMinutes}min focused</span>
      </div>

      {/* Settings Row */}
      <div className="flex items-center gap-3">
        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600'}`}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Preset selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {Object.entries(PRESETS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => changePreset(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                preset === key 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="mt-6 text-xs text-gray-600">
        Tip: Stay on this tab for notifications to work
      </p>
    </div>
  );
}
