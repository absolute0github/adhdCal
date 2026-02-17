import { X, Sparkles } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, feature = 'this feature' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
          </div>
          <p className="text-white/90">
            Unlock {feature} and supercharge your productivity
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h3 className="font-semibold text-gray-900 mb-3">Pro features include:</h3>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Brain Dump Mode - add multiple tasks at once
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Unlimited tasks (free tier: 25 tasks)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Extended scheduling window
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              SMS reminders
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
              Advanced analytics
            </li>
          </ul>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // TODO: Implement upgrade flow
                window.open('/upgrade', '_blank');
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
