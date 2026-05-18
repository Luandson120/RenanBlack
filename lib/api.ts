// lib/api.ts

export async function getAvailableHours(date: string): Promise<string[]> {
  const res = await fetch(`/api/bookings/available?date=${date}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.available ?? [];
}