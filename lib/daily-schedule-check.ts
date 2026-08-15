import { kvGet, kvSet, registerKvMigration } from "./kv-db";
import { formatIsoDate } from "./calendar-utils";

const DAILY_SCHEDULE_CHECK_KEY = "ai_phone_daily_schedule_check_v1";
registerKvMigration(DAILY_SCHEDULE_CHECK_KEY);

type DailyScheduleCheck = {
  characterId: string;
  lastCheckDate: string; // YYYY-MM-DD
  lastGeneratedDate: string; // YYYY-MM-DD
};

function loadDailyScheduleChecks(): DailyScheduleCheck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = kvGet(DAILY_SCHEDULE_CHECK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDailyScheduleChecks(checks: DailyScheduleCheck[]): void {
  if (typeof window === "undefined") return;
  kvSet(DAILY_SCHEDULE_CHECK_KEY, JSON.stringify(checks));
}

/**
 * 检查角色今天是否已经生成过日程
 * 返回 true 表示需要生成（今天第一次聊天）
 */
export function shouldGenerateDailySchedule(characterId: string): boolean {
  const today = formatIsoDate(new Date());
  const checks = loadDailyScheduleChecks();
  const check = checks.find(c => c.characterId === characterId);
  
  if (!check) {
    // 从未生成过，需要生成
    return true;
  }
  
  if (check.lastGeneratedDate !== today) {
    // 上次生成不是今天，需要重新生成
    return true;
  }
  
  return false;
}

/**
 * 标记角色今天已经生成过日程
 */
export function markDailyScheduleGenerated(characterId: string): void {
  const today = formatIsoDate(new Date());
  const checks = loadDailyScheduleChecks();
  const existingIndex = checks.findIndex(c => c.characterId === characterId);
  
  if (existingIndex >= 0) {
    checks[existingIndex].lastCheckDate = today;
    checks[existingIndex].lastGeneratedDate = today;
  } else {
    checks.push({
      characterId,
      lastCheckDate: today,
      lastGeneratedDate: today,
    });
  }
  
  saveDailyScheduleChecks(checks);
}

/**
 * 检查角色今天是否检查过（无论是否生成）
 * 用于避免同一天多次触发检查
 */
export function hasDailyScheduleCheckedToday(characterId: string): boolean {
  const today = formatIsoDate(new Date());
  const checks = loadDailyScheduleChecks();
  const check = checks.find(c => c.characterId === characterId);
  return check?.lastCheckDate === today;
}

/**
 * 标记角色今天已经检查过（但可能没生成）
 */
export function markDailyScheduleChecked(characterId: string): void {
  const today = formatIsoDate(new Date());
  const checks = loadDailyScheduleChecks();
  const existingIndex = checks.findIndex(c => c.characterId === characterId);
  
  if (existingIndex >= 0) {
    checks[existingIndex].lastCheckDate = today;
  } else {
    checks.push({
      characterId,
      lastCheckDate: today,
      lastGeneratedDate: "",
    });
  }
  
  saveDailyScheduleChecks(checks);
}
