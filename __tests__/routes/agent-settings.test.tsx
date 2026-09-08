import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentSettingsScreen } from "#/routes/agent-settings";
import AgentProfilesSettingsRoute from "#/routes/agent-profiles-settings";
import SettingsService from "#/api/settings-service/settings-service.api";
import { SecretsService } from "#/api/secrets-service";
import { MOCK_DEFAULT_USER_SETTINGS } from "#/mocks/handlers";
import { Settings } from "#/types/settings";

vi.mock("#/hooks/query/use-acp-auth-status", () => ({
  useAcpAuthStatus: () => ({
    status: "unknown",
    isChecking: false,
    isSupported: true,
  }),
}));

vi.mock("#/api/agent-profiles-service/profile-field-support", () => ({
  agentProfileSupportsSwitchLlmTool: () => true,
}));

vi.mock("#/utils/custom-toast-handlers", () => ({
  displaySuccessToast: vi.fn(),
  displayErrorToast: vi.fn(),
  displayWarningToast: vi.fn(),
}));

function buildSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...MOCK_DEFAULT_USER_SETTINGS,
    ...overrides,
    agent_settings:
      overrides.agent_settings ?? MOCK_DEFAULT_USER_SETTINGS.agent_settings,
  };
}

function renderScreen(
  props: React.ComponentProps<typeof AgentSettingsScreen> = {},
) {
  return render(<AgentSettingsScreen {...props} />, {
    wrapper: ({ children }) => (
      <MemoryRouter>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    ),
  });
}

describe("AgentSettingsScreen", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(SettingsService, "saveSettings").mockResolvedValue(true);
    vi.spyOn(SecretsService, "getSecrets").mockResolvedValue([]);
    vi.spyOn(SecretsService, "createSecret").mockResolvedValue();
  });

  it("shows only the native Thingo Code settings and no agent selector", async () => {
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(buildSettings());
    renderScreen();

    await screen.findByTestId("agent-settings-screen");
    expect(screen.queryByTestId("agent-type-selector")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("agent-settings-enable-sub-agents"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("agent-command-input")).not.toBeInTheDocument();
  });

  it("normalizes legacy global ACP settings to the native settings UI", async () => {
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(
      buildSettings({
        agent_settings: {
          schema_version: 1,
          agent_kind: "acp",
          acp_server: "claude-code",
          acp_command: ["npx", "legacy-acp"],
        },
      }),
    );
    renderScreen();

    await screen.findByTestId("agent-settings-screen");
    expect(screen.queryByTestId("agent-type-selector")).not.toBeInTheDocument();
    expect(screen.queryByTestId("agent-command-input")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("agent-settings-enable-sub-agents"),
    ).toBeInTheDocument();
  });

  it("saves the fixed native agent kind with native settings", async () => {
    const user = userEvent.setup();
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(buildSettings());
    const save = vi.spyOn(SettingsService, "saveSettings");
    renderScreen();

    const toggle = await screen.findByTestId(
      "agent-settings-enable-sub-agents",
    );
    await user.click(toggle);
    await user.click(screen.getByTestId("agent-save-button"));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        agent_settings_diff: expect.objectContaining({
          agent_kind: "openhands",
          enable_sub_agents: true,
        }),
      }),
    );
  });

  it("keeps LLM switching and tool concurrency controls", async () => {
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(buildSettings());
    renderScreen();

    expect(
      await screen.findByTestId("agent-settings-enable-switch-llm-tool"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sdk-settings-tool_concurrency_limit"),
    ).toBeInTheDocument();
  });

  it("retains legacy ACP profile data only in the embedded compatibility editor", async () => {
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(buildSettings());
    renderScreen({
      embedded: true,
      agentSettingsOverride: {
        schema_version: 1,
        agent_kind: "acp",
        acp_server: "claude-code",
        acp_command: ["npx", "legacy-acp"],
      },
    });

    expect(await screen.findByTestId("agent-command-input")).toHaveValue(
      "npx legacy-acp",
    );
    expect(screen.queryByTestId("agent-type-selector")).not.toBeInTheDocument();
  });

  it("redirects the legacy plural route to the canonical Agent page once", async () => {
    const RouterStub = createRoutesStub([
      {
        path: "/settings/agents",
        Component: AgentProfilesSettingsRoute,
      },
      {
        path: "/settings/agent",
        Component: () => <div data-testid="canonical-agent-route" />,
      },
    ]);

    render(<RouterStub initialEntries={["/settings/agents"]} />);

    expect(await screen.findByTestId("canonical-agent-route")).toBeVisible();
  });
});
