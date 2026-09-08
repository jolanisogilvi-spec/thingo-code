import { Navigate } from "react-router";

export const handle = { hideTitle: false };

/** Legacy Agent Profiles bookmark; the canonical page is `/settings/agent`. */
export default function AgentProfilesSettingsRoute() {
  return <Navigate to="/settings/agent" replace />;
}
