export const DAILY_LIMIT = 10;
const KEY = "quota";

const today = () => new Date().toLocaleDateString("sv"); // YYYY-MM-DD, zona lokal

export function usedToday(): number {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v?.date === today() ? v.count : 0;
  } catch {
    return 0;
  }
}

export function bump() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: today(), count: usedToday() + 1 }));
  } catch {}
}
