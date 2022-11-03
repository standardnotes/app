/**
 * Declaring types needed from snjs.
 * This file will be deleted after snjs becomes a monorepo and provides such types.
 */
/**
 * The available actions that a component can perform.
 */
export declare enum ComponentAction {
    SetSize = "set-size",
    StreamItems = "stream-items",
    StreamContextItem = "stream-context-item",
    SaveItems = "save-items",
    SelectItem = "select-item",
    AssociateItem = "associate-item",
    DeassociateItem = "deassociate-item",
    ClearSelection = "clear-selection",
    CreateItem = "create-item",
    CreateItems = "create-items",
    DeleteItems = "delete-items",
    SetComponentData = "set-component-data",
    InstallLocalComponent = "install-local-component",
    ToggleActivateComponent = "toggle-activate-component",
    RequestPermissions = "request-permissions",
    PresentConflictResolution = "present-conflict-resolution",
    DuplicateItem = "duplicate-item",
    ComponentRegistered = "component-registered",
    ActivateThemes = "themes",
    Reply = "reply",
    SaveSuccess = "save-success",
    SaveError = "save-error",
    ThemesActivated = "themes-activated",
    KeyDown = "key-down",
    KeyUp = "key-up",
    Click = "click"
}
export declare enum Environment {
    Web = 1,
    Desktop = 2,
    Mobile = 3
}
export declare enum ContentType {
    Any = "*",
    Item = "SF|Item",
    RootKey = "SN|RootKey|NoSync",
    ItemsKey = "SN|ItemsKey",
    EncryptedStorage = "SN|EncryptedStorage",
    Note = "Note",
    Tag = "Tag",
    SmartTag = "SN|SmartTag",
    Component = "SN|Component",
    Editor = "SN|Editor",
    ActionsExtension = "Extension",
    UserPrefs = "SN|UserPreferences",
    HistorySession = "SN|HistorySession",
    Theme = "SN|Theme",
    Mfa = "SF|MFA",
    ServerExtension = "SF|Extension",
    FilesafeCredentials = "SN|FileSafe|Credentials",
    FilesafeFileMetadata = "SN|FileSafe|FileMetadata",
    FilesafeIntegration = "SN|FileSafe|Integration",
    ExtensionRepo = "SN|ExtensionRepo"
}
export declare enum AppDataField {
    Pinned = "pinned",
    Archived = "archived",
    Locked = "locked",
    UserModifiedDate = "client_updated_at",
    DefaultEditor = "defaultEditor",
    MobileRules = "mobileRules",
    NotAvailableOnMobile = "notAvailableOnMobile",
    MobileActive = "mobileActive",
    LastSize = "lastSize",
    PrefersPlainEditor = "prefersPlainEditor",
    ComponentInstallError = "installError"
}
