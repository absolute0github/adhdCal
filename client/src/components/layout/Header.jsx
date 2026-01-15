import { Clock, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, signOut, googleCalendarConnected, connectGoogleCalendar } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TimeKit</h1>
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

          {/* User info & Sign Out */}
          <div className="flex items-center gap-2">
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 md:w-8 md:h-8 rounded-full"
              />
            )}
            <span className="hidden md:inline text-sm text-gray-600 max-w-[150px] truncate">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
