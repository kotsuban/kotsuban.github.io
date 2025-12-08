const LOG_TYPES = {
  SUCCESS: "✅ SUCCESS",
  ERROR: "❌ ERROR",
  INFO: "ℹ️ INFO",
}

type LogType = keyof typeof LOG_TYPES;

export function log(type: LogType, message: string) {
  console.log(LOG_TYPES[type], message);
}

