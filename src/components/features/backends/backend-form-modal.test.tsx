import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendConnectionOptions } from "./backend-form-modal";

afterEach(() => vi.clearAllMocks());

describe("BackendConnectionOptions — Thingo Code local-only mode", () => {
  it("does not render Cloud login or backend-kind choices", () => {
    render(<BackendConnectionOptions onConnected={vi.fn()} />);

    expect(
      screen.queryByTestId("add-backend-cloud-title"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("add-backend-kind-option-cloud"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("add-backend-kind-option-local"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("add-backend-form")).toBeInTheDocument();
  });

  it("always submits a manual server as a local backend", async () => {
    const onConnected = vi.fn();
    render(
      <BackendConnectionOptions
        onConnected={onConnected}
        initialManualBackend={{
          name: "Thingo Server",
          host: "http://localhost:18000",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("add-backend-submit"));

    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(onConnected).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "local",
        name: "Thingo Server",
        host: "http://localhost:18000",
      }),
      "manual",
      { agentServerVersion: expect.any(String) },
    );
  });
});
