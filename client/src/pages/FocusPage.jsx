import FocusTimer from '../components/focus/FocusTimer';

/**
 * Focus Page — wraps the Pomodoro timer in a page layout
 * Route: /app/focus
 */
export default function FocusPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <FocusTimer />
    </div>
  );
}
