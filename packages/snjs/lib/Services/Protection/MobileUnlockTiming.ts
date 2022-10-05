export enum MobileUnlockTiming {
  Immediately = 'immediately',
  OnQuit = 'on-quit',
}

export type TimingDisplayOption = {
  title: string
  key: MobileUnlockTiming
  selected: boolean
}
