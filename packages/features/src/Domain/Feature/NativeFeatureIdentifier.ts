import { Result, ValueObject } from '@standardnotes/domain-core'

export interface NativeFeatureIdentifierProps {
  value: string
}

export class NativeFeatureIdentifier extends ValueObject<NativeFeatureIdentifierProps> {
  static readonly TYPES = {
    DailyEmailBackup: 'org.standardnotes.daily-email-backup',
    Files: 'org.standardnotes.files',
    FilesLowStorageTier: 'org.standardnotes.files-low-storage-tier',
    FilesMaximumStorageTier: 'org.standardnotes.files-max-storage-tier',
    ListedCustomDomain: 'org.standardnotes.listed-custom-domain',
    NoteHistory30Days: 'org.standardnotes.note-history-30',
    NoteHistory365Days: 'org.standardnotes.note-history-365',
    NoteHistoryUnlimited: 'org.standardnotes.note-history-unlimited',
    SignInAlerts: 'com.standardnotes.sign-in-alerts',
    SmartFilters: 'org.standardnotes.smart-filters',
    TagNesting: 'org.standardnotes.tag-nesting',
    TwoFactorAuth: 'org.standardnotes.two-factor-auth',
    UniversalSecondFactor: 'org.standardnotes.universal-second-factor',
    SubscriptionSharing: 'org.standardnotes.subscription-sharing',

    AutobiographyTheme: 'org.standardnotes.theme-autobiography',
    DynamicTheme: 'org.standardnotes.theme-dynamic',
    DarkTheme: 'org.standardnotes.theme-focus',
    FuturaTheme: 'org.standardnotes.theme-futura',
    MidnightTheme: 'org.standardnotes.theme-midnight',
    SolarizedDarkTheme: 'org.standardnotes.theme-solarized-dark',
    TitaniumTheme: 'org.standardnotes.theme-titanium',
    ProtonTheme: 'com.standardnotes.theme-proton',

    PlainEditor: 'com.standardnotes.plain-text',
    SuperEditor: 'com.standardnotes.super-editor',

    SheetsEditor: 'org.standardnotes.standard-sheets',
    TokenVaultEditor: 'org.standardnotes.token-vault',

    Clipper: 'org.standardnotes.clipper',

    Vaults: 'org.standardnotes.vaults',
    SharedVaults: 'org.standardnotes.shared-vaults',

    DeprecatedCodeEditor: 'org.standardnotes.code-editor',
    DeprecatedMarkdownProEditor: 'org.standardnotes.advanced-markdown-editor',
    DeprecatedPlusEditor: 'org.standardnotes.plus-editor',
    DeprecatedTaskEditor: 'org.standardnotes.simple-task-editor',
    DeprecatedMarkdownVisualEditor: 'org.standardnotes.markdown-visual-editor',
    DeprecatedBoldEditor: 'org.standardnotes.bold-editor',
    DeprecatedMarkdownBasicEditor: 'org.standardnotes.simple-markdown-editor',
    DeprecatedMarkdownMathEditor: 'org.standardnotes.fancy-markdown-editor',
    DeprecatedMarkdownMinimistEditor: 'org.standardnotes.minimal-markdown-editor',
    DeprecatedFoldersComponent: 'org.standardnotes.folders',
    DeprecatedFileSafe: 'org.standardnotes.file-safe',
    LegacyFileSafeIdentifier: 'org.standardnotes.legacy.file-safe',
  }

  get value(): string {
    return this.props.value
  }

  private constructor(props: NativeFeatureIdentifierProps) {
    super(props)
  }

  static create(type: string): Result<NativeFeatureIdentifier> {
    const isValidType = Object.values(this.TYPES).includes(type)
    if (!isValidType) {
      return Result.fail<NativeFeatureIdentifier>(`Invalid feature identifier: ${type}`)
    } else {
      return Result.ok<NativeFeatureIdentifier>(new NativeFeatureIdentifier({ value: type }))
    }
  }
}

/**
 * Identifier for standalone filesafe instance offered as legacy installable via extensions-server
 */
export const ExperimentalFeatures = [NativeFeatureIdentifier.TYPES.Vaults]
