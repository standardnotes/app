const PREFERENCE_PANE_IDS = [
  'general',
  'account',
  'security',
  'home-server',
  'vaults',
  'appearance',
  'backups',
  'listed',
  'plugins',
  'shortcuts',
  'accessibility',
  'get-free-month',
  'help-feedback',
  'whats-new',
] as const

export type PreferencePaneId = (typeof PREFERENCE_PANE_IDS)[number]
