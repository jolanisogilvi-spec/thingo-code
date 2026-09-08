import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import {
  getStoredConversationMetadata,
  removeStoredConversationMetadata,
} from "#/api/conversation-metadata-store";

vi.mock("#/hooks/use-tracking", () => ({
  useTracking: () => ({ trackConversationCreated: vi.fn() }),
}));

const { useLlmProfilesMock } = vi.hoisted(() => ({
  useLlmProfilesMock: vi.fn(() => ({
    data: { active_profile: null as string | null },
  })),
}));
vi.mock("#/hooks/query/use-llm-profiles", () => ({
  useLlmProfiles: () => useLlmProfilesMock(),
}));

vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackend: () => ({
    backend: { id: "local-1", kind: "local" },
    orgId: null,
  }),
}));

const listInstalledPluginsMock = vi.fn().mockResolvedValue([]);
vi.mock("#/api/plugins-management-service", () => ({
  __esModule: true,
  default: { listInstalledPlugins: () => listInstalledPluginsMock() },
}));

function wrapper(client = new QueryClient()) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function conversation(id = "conv-1") {
  return {
    id: "task-id",
    app_conversation_id: id,
    agent_server_url: "http://agent-server.local",
  } as never;
}

describe("useCreateConversation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useLlmProfilesMock.mockReturnValue({ data: { active_profile: null } });
    listInstalledPluginsMock.mockReset();
    listInstalledPluginsMock.mockResolvedValue([]);
    removeStoredConversationMetadata("conv-1");
    removeStoredConversationMetadata("conv-metadata");
  });

  it("forwards conversation inputs through the inline-agent path", async () => {
    const create = vi
      .spyOn(AgentServerConversationService, "createConversation")
      .mockResolvedValue(conversation());
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: wrapper(),
    });

    await result.current.mutateAsync({
      query: "请修复问题",
      conversationInstructions: "先运行测试",
      repository: {
        name: "thingo/code",
        gitProvider: "github",
        branch: "main",
      },
      workingDir: "workspace/project",
      workspaceMode: "local_repo",
      agentType: "plan",
      agentProfileId: "legacy-acp-profile",
    });

    expect(create).toHaveBeenCalledWith({
      initialUserMsg: "请修复问题",
      conversationInstructions: "先运行测试",
      plugins: undefined,
      metadata: {
        selected_repository: "thingo/code",
        selected_branch: "main",
        git_provider: "github",
      },
      workingDirOverride: "workspace/project",
      workspaceMode: "local_repo",
      parentConversationId: undefined,
      agentType: "plan",
    });
    expect(create.mock.lastCall?.[0]).not.toHaveProperty("agentProfileId");
  });

  it("ignores saved and explicitly supplied Agent Profile identifiers", async () => {
    const create = vi
      .spyOn(AgentServerConversationService, "createConversation")
      .mockResolvedValue(conversation());
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: wrapper(),
    });

    await result.current.mutateAsync({
      query: "hello",
      agentProfileId: "profile-acp",
    });

    expect(create.mock.lastCall?.[0]).not.toHaveProperty("agentProfileId");
    expect(create.mock.lastCall?.[0]).not.toHaveProperty("agentProfileKind");
  });

  it("stamps the selected LLM profile without using an Agent Profile", async () => {
    useLlmProfilesMock.mockReturnValue({ data: { active_profile: "qwen" } });
    vi.spyOn(
      AgentServerConversationService,
      "createConversation",
    ).mockResolvedValue(conversation("conv-metadata"));
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: wrapper(),
    });

    await result.current.mutateAsync({ query: "hello" });

    await waitFor(() =>
      expect(
        getStoredConversationMetadata("conv-metadata")?.active_profile,
      ).toBe("qwen"),
    );
  });

  it("stores plugin coordinates without secret parameters", async () => {
    vi.spyOn(
      AgentServerConversationService,
      "createConversation",
    ).mockResolvedValue(conversation("conv-metadata"));
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: wrapper(),
    });

    await result.current.mutateAsync({
      plugins: [
        {
          source: "github:thingo/example",
          ref: "main",
          repo_path: "plugins/a",
          parameters: { token: "secret" },
        },
      ],
    });

    await waitFor(() =>
      expect(getStoredConversationMetadata("conv-metadata")?.plugins).toEqual([
        {
          source: "github:thingo/example",
          ref: "main",
          repo_path: "plugins/a",
        },
      ]),
    );
  });

  it("invalidates conversation lists after creation", async () => {
    vi.spyOn(
      AgentServerConversationService,
      "createConversation",
    ).mockResolvedValue(conversation());
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: wrapper(client),
    });

    await result.current.mutateAsync({});

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["user", "conversations"],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["start-tasks"] });
  });
});
