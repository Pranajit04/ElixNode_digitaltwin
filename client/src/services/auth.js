const BASE = import.meta.env.VITE_API_URL || "";
const STORAGE_KEY = "elixnode_user";

async function sha256(value) {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function request(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function login(email, password) {
  const passwordHash = await sha256(password);
  const user = await request("/api/users/login", { email, passwordHash });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export async function register(name, email, password) {
  const passwordHash = await sha256(password);
  return request("/api/users/register", { name, email, passwordHash, role: "operator" });
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUser() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
