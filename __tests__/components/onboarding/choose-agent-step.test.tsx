import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChooseAgentStep,
  type OnboardingAgentId,
} from "#/components/features/onboarding/steps/choose-agent-step";
import SettingsService from "#/api/settings-service/settings-service.api";

function renderStep(initial: OnboardingAgentId = "openhands") {
  const onSelect = vi.fn();
  const onNext = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ChooseAgentStep
        selectedAgentId={initial}
        onSelect={onSelect}
        onNext={onNext}
      />
    </QueryClientProvider>,
  );
  return { onSelect, onNext };
}

describe("ChooseAgentStep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(SettingsService, "saveSettings").mockResolvedValue(true);
  });

  it("renders Thingo Code as the only available agent", () => {
    renderStep();

    const thingoCode = screen.getByTestId("onboarding-agent-option-openhands");
    expect(thingoCode).toHaveTextContent("Thingo Code");
    expect(thingoCode).toHaveAttribute("aria-checked", "true");
    expect(
      screen.queryByTestId("onboarding-agent-option-claude-code"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("onboarding-agent-option-codex"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("onboarding-agent-option-gemini-cli"),
    ).not.toBeInTheDocument();
  });

  it("normalizes a legacy ACP selection to Thingo Code", async () => {
    const user = userEvent.setup();
    const { onSelect, onNext } = renderStep("claude-code");

    await user.click(screen.getByTestId("onboarding-agent-next"));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith("openhands");
      expect(SettingsService.saveSettings).toHaveBeenCalledWith({
        agent_settings_diff: { agent_kind: "openhands" },
      });
      expect(onNext).toHaveBeenCalledOnce();
    });
  });

  it("uses the bundled Thingo Code logo", () => {
    renderStep();
    expect(
      screen.getByTestId("onboarding-agent-icon-openhands"),
    ).toHaveAttribute("aria-label", "Thingo Code");
  });
});

