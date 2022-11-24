const PREFERENCE_IDS = [
  'general',
  'account',
  'security',
  'appearance',
  'backups',
  'listed',
  'shortcuts',
  'accessibility',
  'get-free-month',
  'help-feedback',
  'whats-new',
] as const

export type PreferenceId = typeof PREFERENCE_IDS[number]
