import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, LogOut, Calendar, Settings, Shield, Moon, Sun, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import UserPreferencesModal from '../settings/UserPreferencesModal';

export default function Header() {
  const { user, signOut, googleCalendarConnected, connectGoogleCalendar, userProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const isAdmin = userProfile?.role === 'admin';
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">ADHDCal</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Google Calendar Connection */}
            {!googleCalendarConnected && (
              <button
                onClick={connectGoogleCalendar}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Calendar</span>
              </button>
            )}

            {/* Admin Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                title="Admin"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Focus Timer Link */}
            <Link
              to="/app/focus"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
              title="Focus Timer"
            >
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Focus</span>
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

            {/* Preferences Button */}
            <button
              onClick={() => setShowPreferences(true)}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Preferences"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </button>

            {/* User info & Sign Out */}
            <div className="flex items-center gap-2">
              {user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full"
                />
              )}
              <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <UserPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}
