export enum FeatureIdentifier {
  AccountSwitcher = 'com.standardnotes.account-switcher',
  CloudLink = 'org.standardnotes.cloudlink',
  DailyDropboxBackup = 'org.standardnotes.daily-dropbox-backup',
  DailyEmailBackup = 'org.standardnotes.daily-email-backup',
  DailyGDriveBackup = 'org.standardnotes.daily-gdrive-backup',
  DailyOneDriveBackup = 'org.standardnotes.daily-onedrive-backup',
  Files = 'org.standardnotes.files',
  FilesBeta = 'org.standardnotes.files-beta',
  FilesLowStorageTier = 'org.standardnotes.files-low-storage-tier',
  FilesMaximumStorageTier = 'org.standardnotes.files-max-storage-tier',
  ListedCustomDomain = 'org.standardnotes.listed-custom-domain',
  NoteHistory30Days = 'org.standardnotes.note-history-30',
  NoteHistory365Days = 'org.standardnotes.note-history-365',
  NoteHistoryUnlimited = 'org.standardnotes.note-history-unlimited',
  SignInAlerts = 'com.standardnotes.sign-in-alerts',
  SmartFilters = 'org.standardnotes.smart-filters',
  TagNesting = 'org.standardnotes.tag-nesting',
  TwoFactorAuth = 'org.standardnotes.two-factor-auth',
  SubscriptionSharing = 'org.standardnotes.subscription-sharing',

  AutobiographyTheme = 'org.standardnotes.theme-autobiography',
  DynamicTheme = 'org.standardnotes.theme-dynamic',
  DarkTheme = 'org.standardnotes.theme-focus',
  FocusMode = 'org.standardnotes.focus-mode',
  FuturaTheme = 'org.standardnotes.theme-futura',
  MidnightTheme = 'org.standardnotes.theme-midnight',
  SolarizedDarkTheme = 'org.standardnotes.theme-solarized-dark',
  TitaniumTheme = 'org.standardnotes.theme-titanium',

  CodeEditor = 'org.standardnotes.code-editor',
  MarkdownProEditor = 'org.standardnotes.advanced-markdown-editor',
  MarkdownVisualEditor = 'org.standardnotes.markdown-visual-editor',
  PlainTextEditor = 'org.standardnotes.plain-text-editor',
  PlusEditor = 'org.standardnotes.plus-editor',
  SheetsEditor = 'org.standardnotes.standard-sheets',
  TaskEditor = 'org.standardnotes.simple-task-editor',
  TokenVaultEditor = 'org.standardnotes.token-vault',

  DeprecatedBoldEditor = 'org.standardnotes.bold-editor',
  DeprecatedMarkdownBasicEditor = 'org.standardnotes.simple-markdown-editor',
  DeprecatedMarkdownMathEditor = 'org.standardnotes.fancy-markdown-editor',
  DeprecatedMarkdownMinimistEditor = 'org.standardnotes.minimal-markdown-editor',
  DeprecatedFoldersComponent = 'org.standardnotes.folders',
  DeprecatedFileSafe = 'org.standardnotes.file-safe',
}

/**
 * Identifier for standalone filesafe instance offered as legacy installable via extensions-server
 */
export const LegacyFileSafeIdentifier = 'org.standardnotes.legacy.file-safe'

export const ExperimentalFeatures = []
