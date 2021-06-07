import { Bridge } from "./services/bridge";

export type StartApplication = (
  defaultSyncServerHost: string,
  bridge: Bridge,
  nextVersionSyncServerHost: string
) => Promise<void>;
