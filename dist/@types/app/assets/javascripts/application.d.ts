/// <reference types="angular" />
import { PasswordWizardType } from './types';
import { SNApplication, Challenge, ChallengeOrchestrator, ProtectedAction } from 'snjs';
import { AppState, DesktopManager, LockManager, ArchiveManager, NativeExtManager, StatusManager, ThemeManager, PreferencesManager, KeyboardManager } from './services';
declare type WebServices = {
    appState: AppState;
    desktopService: DesktopManager;
    lockService: LockManager;
    archiveService: ArchiveManager;
    nativeExtService: NativeExtManager;
    statusService: StatusManager;
    themeService: ThemeManager;
    prefsService: PreferencesManager;
    keyboardService: KeyboardManager;
};
export declare class WebApplication extends SNApplication {
    private $compile?;
    private scope?;
    private onDeinit?;
    private webServices;
    private currentAuthenticationElement?;
    constructor($compile: ng.ICompileService, $timeout: ng.ITimeoutService, scope: ng.IScope, onDeinit: (app: WebApplication) => void);
    /** @override */
    deinit(): void;
    setWebServices(services: WebServices): void;
    /** @access public */
    getAppState(): AppState;
    /** @access public */
    getDesktopService(): DesktopManager;
    /** @access public */
    getLockService(): LockManager;
    /** @access public */
    getArchiveService(): ArchiveManager;
    /** @access public */
    getNativeExtService(): NativeExtManager;
    /** @access public */
    getStatusService(): StatusManager;
    /** @access public */
    getThemeService(): ThemeManager;
    /** @access public */
    getPrefsService(): PreferencesManager;
    /** @access public */
    getKeyboardService(): KeyboardManager;
    checkForSecurityUpdate(): Promise<boolean>;
    presentPasswordWizard(type: PasswordWizardType): void;
    promptForChallenge(challenge: Challenge, orchestrator: ChallengeOrchestrator): void;
    performProtocolUpgrade(): Promise<void>;
    presentPrivilegesModal(action: ProtectedAction, onSuccess?: any, onCancel?: any): Promise<void>;
    presentPrivilegesManagementModal(): void;
    authenticationInProgress(): boolean;
    presentPasswordModal(callback: () => void): void;
    presentRevisionPreviewModal(uuid: string, content: any): void;
}
export {};
