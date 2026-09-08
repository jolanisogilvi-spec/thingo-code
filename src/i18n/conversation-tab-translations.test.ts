import { describe, expect, it } from "vitest";
import { I18nKey } from "./declaration";
import { translationResources } from "./resources";

describe("conversation tool tab translations", () => {
  it("uses Chinese labels in the Chinese interface and English labels in English", () => {
    const expected = [
      [I18nKey.COMMON$FILES, "文件", "Files"],
      [I18nKey.DIFF_VIEWER$COMMITS, "提交记录", "Commits"],
      [I18nKey.COMMON$PLANNER, "计划器", "Planner"],
      [I18nKey.COMMON$TERMINAL, "终端", "Terminal"],
      [I18nKey.COMMON$BROWSER, "浏览器", "Browser"],
      [I18nKey.COMMON$USAGE, "用量", "Usage"],
      [I18nKey.COMMON$TASK_LIST, "任务列表", "Task List"],
    ] as const;

    for (const [key, chinese, english] of expected) {
      expect(translationResources["zh-CN"]?.[key]).toBe(chinese);
      expect(translationResources.en?.[key]).toBe(english);
    }
  });
});
