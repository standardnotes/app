import { Bridge } from "./services/bridge";

export type StartApplication = (
  defaultSyncServerHost: string,
  bridge: Bridge,
  alternativeSyncServerHost: string
) => Promise<void>;
