"use client";

// Global in-memory log buffer for debugging
const MAX_LOGS = 500;
const logBuffer: Array<{ time: string; level: string; message: string }> = [];

function formatTime() {
  const d = new Date();
  return d.toTimeString().split(" ")[0] + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export function logInfo(tag: string, ...args: any[]) {
  const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const entry = { time: formatTime(), level: "INFO", message: `[${tag}] ${msg}` };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  console.log(`%c[${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

export function logWarn(tag: string, ...args: any[]) {
  const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const entry = { time: formatTime(), level: "WARN", message: `[${tag}] ${msg}` };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  console.warn(`%c[${tag}]`, "color: #f59e0b; font-weight: bold;", ...args);
}

export function logError(tag: string, ...args: any[]) {
  const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const entry = { time: formatTime(), level: "ERROR", message: `[${tag}] ${msg}` };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  console.error(`%c[${tag}]`, "color: #ef4444; font-weight: bold;", ...args);
}

export function getAppLogs(): string {
  return logBuffer.map((l) => `[${l.time}] [${l.level}] ${l.message}`).join("\n");
}

if (typeof window !== "undefined") {
  (window as any).__getLogs = getAppLogs;
  (window as any).__logBuffer = logBuffer;
}
