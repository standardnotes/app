export interface TestIPCMessage {
  id: number
  type: MessageType
  args: any[]
}

export interface TestIPCMessageResult {
  id: number
  resolve?: any
  reject?: any
}

export interface AppTestMessage {
  type: AppMessageType
}

export enum AppMessageType {
  Ready,
  WindowLoaded,
  SavedBackup,
  Log,
}

export enum MessageType {
  WindowCount,
  StoreData,
  StoreSettingsLocation,
  StoreSet,
  SetLocalStorageValue,
  AppMenuItems,
  SpellCheckerManager,
  SpellCheckerLanguages,
  ClickLanguage,
  BackupsAreEnabled,
  ToggleBackupsEnabled,
  BackupsLocation,
  PerformBackup,
  ChangeBackupsLocation,
  CopyDecryptScript,
  MenuReloaded,
  UpdateState,
  CheckForUpdate,
  UpdateManagerNotifiedStateChange,
  Relaunch,
  DataArchive,
  GetJSON,
  DownloadFile,
  AutoUpdateEnabled,
  HasReloadedMenu,
  AppStateCall,
  SignOut,
}
