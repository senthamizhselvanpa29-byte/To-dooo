// ============================================================
// STARTING HABITS for the daily routine setup
//
// `offset` = minutes after waking up. Example with wake-up at 6:00 AM:
//   brush offset 10 → 6:10 AM, lunch offset 420 → 1:00 PM.
// With night shift (wake-up 2:00 PM) the same habits move automatically:
//   brush → 2:10 PM, lunch → 9:00 PM.
// `on` = ticked by default in the setup. Names are in src/locales (habitWake…).
// ============================================================

export const DEFAULT_HABITS = [
  { key: 'habitWake', emoji: '⏰', offset: 0, on: true },
  { key: 'habitBrush', emoji: '🪥', offset: 10, on: true },
  { key: 'habitPrayer', emoji: '🙏', offset: 20, on: false },
  { key: 'habitBath', emoji: '🚿', offset: 30, on: true },
  { key: 'habitExercise', emoji: '🏃', offset: 45, on: false },
  { key: 'habitBreakfast', emoji: '🍳', offset: 120, on: true },
  { key: 'habitMedicine', emoji: '💊', offset: 150, on: false },
  { key: 'habitWater', emoji: '💧', offset: 300, on: false },
  { key: 'habitLunch', emoji: '🍛', offset: 420, on: true },
  { key: 'habitDinner', emoji: '🍽️', offset: 870, on: true },
  { key: 'habitRead', emoji: '📖', offset: 900, on: false },
  { key: 'habitSleep', emoji: '😴', offset: 990, on: true },
];
