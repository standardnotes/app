import { PreferencePaneId } from '@/__mocks__/@standardnotes/snjs'
import { PreferencesMenuItem } from './PreferencesMenuItem'

export const PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: PreferencePaneId.WhatsNew, label: "What's New", icon: 'asterisk', order: 0 },
  { id: PreferencePaneId.Account, label: 'Account', icon: 'user', order: 1 },
  { id: PreferencePaneId.General, label: 'General', icon: 'settings', order: 3 },
  { id: PreferencePaneId.Security, label: 'Security', icon: 'security', order: 4 },
  { id: PreferencePaneId.Backups, label: 'Backups', icon: 'restore', order: 5 },
  { id: PreferencePaneId.Appearance, label: 'Appearance', icon: 'themes', order: 6 },
  { id: PreferencePaneId.Listed, label: 'Listed', icon: 'listed', order: 7 },
  { id: PreferencePaneId.Shortcuts, label: 'Shortcuts', icon: 'keyboard', order: 8 },
  { id: PreferencePaneId.Plugins, label: 'Plugins', icon: 'dashboard', order: 8 },
  { id: PreferencePaneId.Accessibility, label: 'Accessibility', icon: 'accessibility', order: 9 },
  { id: PreferencePaneId.GetFreeMonth, label: 'Get a free month', icon: 'star', order: 10 },
  { id: PreferencePaneId.HelpFeedback, label: 'Help & feedback', icon: 'help', order: 11 },
]

export const READY_PREFERENCES_MENU_ITEMS: PreferencesMenuItem[] = [
  { id: PreferencePaneId.WhatsNew, label: "What's New", icon: 'asterisk', order: 0 },
  { id: PreferencePaneId.Account, label: 'Account', icon: 'user', order: 1 },
  { id: PreferencePaneId.General, label: 'General', icon: 'settings', order: 3 },
  { id: PreferencePaneId.Security, label: 'Security', icon: 'security', order: 4 },
  { id: PreferencePaneId.Backups, label: 'Backups', icon: 'restore', order: 5 },
  { id: PreferencePaneId.Appearance, label: 'Appearance', icon: 'themes', order: 6 },
  { id: PreferencePaneId.Listed, label: 'Listed', icon: 'listed', order: 7 },
  { id: PreferencePaneId.Plugins, label: 'Plugins', icon: 'dashboard', order: 8 },
  { id: PreferencePaneId.HelpFeedback, label: 'Help & feedback', icon: 'help', order: 11 },
]
