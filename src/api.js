const BASE_URL =
  process.env.REACT_APP_API_URL || "https://hymlbe-production.up.railway.app";

export async function scoreQuiz(answers) {
  const res = await fetch(`${BASE_URL}/quiz/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`Score API error: ${res.status}`);
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE_URL}/leaderboard`);
  if (!res.ok) throw new Error(`Leaderboard API error: ${res.status}`);
  return res.json();
}

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error(`Events API error: ${res.status}`);
  return res.json();
}

export async function saveResult(trimmedName, userId, code, animal, group) {
  const res = await fetch(`${BASE_URL}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trimmedName,
      userId,
      code,
      animal,
      group,
    }),
  });
  if (!res.ok) throw new Error(`Save result error: ${res.status}`);
  return res.json();
}

export async function attendEvent(userId, code) {
  const res = await fetch(`${BASE_URL}/events/attend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, attend_code: code }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Attend API error: ${res.status}`);
  }
  if (data?.success === false) {
    throw new Error(data?.message || "Attendance confirmation failed.");
  }
  return data;
}

export async function getUserMissions(userId) {
  const res = await fetch(
    `${BASE_URL}/user/missions${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`,
  );
  if (!res.ok) throw new Error(`User missions API error: ${res.status}`);
  return res.json();
}
