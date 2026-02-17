const TASK_NAMES = [
  'Write quarterly report',
  'Call dentist for checkup',
  'Fix login page bug',
  'Research project management tools',
  'Clean out email inbox',
  'Update resume',
  'Organize digital photos',
  'Plan team meeting agenda',
  'Review pull requests',
  'Write unit tests for auth module',
  'Schedule car maintenance',
  'Prepare presentation slides',
  'Read chapter 5 of textbook',
  'Grocery shopping list',
  'Set up automated backups',
  'Reply to client emails',
  'File expense reports',
  'Debug API timeout issue',
  'Design landing page mockup',
  'Update project documentation',
  'Refactor database queries',
  'Book flight for conference',
  'Create social media posts',
  'Review insurance policy',
  'Set up CI/CD pipeline',
  'Organize desk and workspace',
  'Write blog post draft',
  'Pay utility bills',
  'Plan weekend meal prep',
  'Review and merge feature branch',
];

const DURATION_RANGES = {
  short: { min: 15, max: 30 },
  medium: { min: 45, max: 90 },
  long: { min: 120, max: 240 },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDuration() {
  const range = pickRandom(Object.values(DURATION_RANGES));
  // Round to nearest 15 minutes
  const raw = randomInt(range.min, range.max);
  return Math.round(raw / 15) * 15;
}

export function generateRandomTasks(count = 5) {
  const shuffled = [...TASK_NAMES].sort(() => Math.random() - 0.5);
  const names = shuffled.slice(0, Math.min(count, TASK_NAMES.length));

  // If count > available names, allow repeats with suffix
  while (names.length < count) {
    names.push(`${pickRandom(TASK_NAMES)} (${names.length + 1})`);
  }

  return names.map(name => ({
    name,
    estimatedDuration: randomDuration(),
    complexity: randomInt(1, 5),
  }));
}

export function generateRandomTaskNames(count = 5) {
  const shuffled = [...TASK_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, TASK_NAMES.length));
}
