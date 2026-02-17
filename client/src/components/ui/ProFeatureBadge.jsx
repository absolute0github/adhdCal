export default function ProFeatureBadge({ className = '' }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium ${className}`}
    >
      Pro
    </span>
  );
}
