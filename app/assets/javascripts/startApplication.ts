import { Bridge } from './services/bridge';

export type StartApplication = (
  defaultSyncServerHost: string,
  defaultFilesHostHost: string,
  bridge: Bridge,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string
) => Promise<void>;
