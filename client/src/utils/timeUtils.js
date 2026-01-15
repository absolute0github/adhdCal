// Generate a UUID (with fallback for older browsers)
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Parse duration string (e.g., "2h 30m", "90m", "1.5h") to minutes
export function parseDuration(input) {
  if (typeof input === 'number') return input;

  const str = input.trim().toLowerCase();

  // Try "Xh Ym" format
  const hourMinMatch = str.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/);
  if (hourMinMatch) {
    const hours = parseFloat(hourMinMatch[1]);
    const mins = hourMinMatch[2] ? parseInt(hourMinMatch[2]) : 0;
    return Math.round(hours * 60 + mins);
  }

  // Try "Xm" format
  const minMatch = str.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/);
  if (minMatch) {
    return parseInt(minMatch[1]);
  }

  // Try "X.Xh" format
  const decimalHourMatch = str.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (decimalHourMatch) {
    return Math.round(parseFloat(decimalHourMatch[1]) * 60);
  }

  // Try plain number (assume minutes)
  const plainNumber = parseFloat(str);
  if (!isNaN(plainNumber)) {
    return Math.round(plainNumber);
  }

  return null;
}

// Format minutes to human-readable string
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

// Format date for display
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Format time for display
export function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format date and time together
export function formatDateTime(dateString) {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Check if a date is today
export function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Get start of day
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of day
export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
