import { generateWeeklyCalendarSchedule } from "./calendar-engine";
import { getWeekStartIso, formatIsoDate } from "./calendar-utils";
import { shouldGenerateDailySchedule, markDailyScheduleGenerated } from "./daily-schedule-check";
import { loadCalendarConfig } from "./calendar-storage";

/**
 * 每天第一句话时自动生成当天行程（如果启用了自动生成）
 * @param characterId 角色 ID
 * @returns 是否触发了生成
 */
export async function tryGenerateDailyScheduleOnFirstMessage(
  characterId: string
): Promise<{ generated: boolean; error?: string }> {
  // 检查是否启用了自动生成
  const config = loadCalendarConfig();
  if (!config.autoGenerateEnabled) {
    return { generated: false };
  }

  // 检查今天是否已经生成过
  if (!shouldGenerateDailySchedule(characterId)) {
    return { generated: false };
  }

  // 生成本周日程（包含今天）
  const today = new Date();
  const weekStart = getWeekStartIso(today);
  
  try {
    const result = await generateWeeklyCalendarSchedule("character", characterId, weekStart);
    
    if (result.success) {
      markDailyScheduleGenerated(characterId);
      return { generated: true };
    } else {
      return { generated: false, error: result.error };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { generated: false, error: message };
  }
}
