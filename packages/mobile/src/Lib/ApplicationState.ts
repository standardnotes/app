import { InternalEventBus } from '@standardnotes/services'
import {
  ApplicationEvent,
  ApplicationService,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValidation,
  ContentType,
  isNullOrUndefined,
  NoteViewController,
  PayloadEmitSource,
  PrefKey,
  removeFromArray,
  SmartView,
  SNNote,
  SNTag,
  SNUserPrefs,
  StorageKey,
  StorageValueModes,
  SystemViewId,
  Uuid,
} from '@standardnotes/snjs'
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  InteractionManager,
  Keyboard,
  KeyboardEventListener,
  NativeEventSubscription,
  NativeModules,
  Platform,
} from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { hide, show } from 'react-native-privacy-snapshot'
import VersionInfo from 'react-native-version-info'
import pjson from '../../package.json'
import { MobileApplication } from './Application'
import { associateComponentWithNote } from './ComponentManager'
const { PlatformConstants } = NativeModules

export enum AppStateType {
  LosingFocus = 1,
  EnteringBackground = 2,
  GainingFocus = 3,
  ResumingFromBackground = 4,
  TagChanged = 5,
  EditorClosed = 6,
  PreferencesChanged = 7,
}

export enum LockStateType {
  Locked = 1,
  Unlocked = 2,
}

export enum AppStateEventType {
  KeyboardChangeEvent = 1,
  TabletModeChange = 2,
  DrawerOpen = 3,
}

export type TabletModeChangeData = {
  new_isInTabletMode: boolean
  old_isInTabletMode: boolean
}

export enum UnlockTiming {
  Immediately = 'immediately',
  OnQuit = 'on-quit',
}

export enum PasscodeKeyboardType {
  Default = 'default',
  Numeric = 'numeric',
}

export enum MobileStorageKey {
  PasscodeKeyboardTypeKey = 'passcodeKeyboardType',
}

type EventObserverCallback = (event: AppStateEventType, data?: TabletModeChangeData) => void | Promise<void>
type ObserverCallback = (event: AppStateType, data?: unknown) => void | Promise<void>
type LockStateObserverCallback = (event: LockStateType) => void | Promise<void>

export class ApplicationState extends ApplicationService {
  override application: MobileApplication
  observers: ObserverCallback[] = []
  private stateObservers: EventObserverCallback[] = []
  private lockStateObservers: LockStateObserverCallback[] = []
  locked = true
  keyboardDidShowListener?: EmitterSubscription
  keyboardDidHideListener?: EmitterSubscription
  keyboardHeight?: number
  removeAppEventObserver!: () => void
  selectedTagRestored = false
  selectedTag: SNTag | SmartView = this.application.items.getSmartViews()[0]
  userPreferences?: SNUserPrefs
  tabletMode = false
  ignoreStateChanges = false
  mostRecentState?: AppStateType
  authenticationInProgress = false
  multiEditorEnabled = false
  screenshotPrivacyEnabled?: boolean
  passcodeTiming?: UnlockTiming
  biometricsTiming?: UnlockTiming
  removeHandleReactNativeAppStateChangeListener: NativeEventSubscription
  removeItemChangesListener?: () => void
  removePreferencesLoadedListener?: () => void

  constructor(application: MobileApplication) {
    super(application, new InternalEventBus())
    this.application = application
    this.setTabletModeEnabled(this.isTabletDevice)
    this.handleApplicationEvents()
    this.handleItemsChanges()

    this.removeHandleReactNativeAppStateChangeListener = AppState.addEventListener(
      'change',
      this.handleReactNativeAppStateChange,
    )

    this.keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', this.keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', this.keyboardDidHide)
  }

  override deinit() {
    this.removeAppEventObserver()
    ;(this.removeAppEventObserver as unknown) = undefined

    this.removeHandleReactNativeAppStateChangeListener.remove()
    if (this.removeItemChangesListener) {
      this.removeItemChangesListener()
    }
    if (this.removePreferencesLoadedListener) {
      this.removePreferencesLoadedListener()
    }

    this.observers.length = 0
    this.keyboardDidShowListener = undefined
    this.keyboardDidHideListener = undefined
  }

  restoreSelectedTag() {
    if (this.selectedTagRestored) {
      return
    }
    const savedTagUuid: string | undefined = this.prefService.getValue(PrefKey.MobileSelectedTagUuid, undefined)

    if (isNullOrUndefined(savedTagUuid)) {
      this.selectedTagRestored = true
      return
    }

    const savedTag =
      (this.application.items.findItem(savedTagUuid) as SNTag) ||
      this.application.items.getSmartViews().find(tag => tag.uuid === savedTagUuid)
    if (savedTag) {
      this.setSelectedTag(savedTag, false)
      this.selectedTagRestored = true
    }
  }

  override async onAppStart() {
    this.removePreferencesLoadedListener = this.prefService.addPreferencesLoadedObserver(() => {
      this.notifyOfStateChange(AppStateType.PreferencesChanged)
    })

    await this.loadUnlockTiming()
  }

  override async onAppLaunch() {
    MobileApplication.setPreviouslyLaunched()
    this.screenshotPrivacyEnabled = (await this.getScreenshotPrivacyEnabled()) ?? true
    void this.setAndroidScreenshotPrivacy(this.screenshotPrivacyEnabled)
  }

  /**
   * Registers an observer for App State change
   * @returns function that unregisters this observer
   */
  public addStateChangeObserver(callback: ObserverCallback) {
    this.observers.push(callback)
    return () => {
      removeFromArray(this.observers, callback)
    }
  }

  /**
   * Registers an observer for lock state change
   * @returns function that unregisters this observer
   */
  public addLockStateChangeObserver(callback: LockStateObserverCallback) {
    this.lockStateObservers.push(callback)
    return () => {
      removeFromArray(this.lockStateObservers, callback)
    }
  }

  /**
   * Registers an observer for App State Event change
   * @returns function that unregisters this observer
   */
  public addStateEventObserver(callback: EventObserverCallback) {
    this.stateObservers.push(callback)
    return () => {
      removeFromArray(this.stateObservers, callback)
    }
  }

  /**
   * Notify observers of ApplicationState change
   */
  private notifyOfStateChange(state: AppStateType, data?: unknown) {
    if (this.ignoreStateChanges) {
      return
    }

    // Set most recent state before notifying observers, in case they need to query this value.
    this.mostRecentState = state

    for (const observer of this.observers) {
      void observer(state, data)
    }
  }

  /**
   * Notify observers of ApplicationState Events
   */
  private notifyEventObservers(event: AppStateEventType, data?: TabletModeChangeData) {
    for (const observer of this.stateObservers) {
      void observer(event, data)
    }
  }

  /**
   * Notify observers of ApplicationState Events
   */
  private notifyLockStateObservers(event: LockStateType) {
    for (const observer of this.lockStateObservers) {
      void observer(event)
    }
  }

  private async loadUnlockTiming() {
    this.passcodeTiming = await this.getPasscodeTiming()
    this.biometricsTiming = await this.getBiometricsTiming()
  }

  public async setAndroidScreenshotPrivacy(enable: boolean) {
    if (Platform.OS === 'android') {
      enable ? FlagSecure.activate() : FlagSecure.deactivate()
    }
  }

  /**
   * Creates a new editor if one doesn't exist. If one does, we'll replace the
   * editor's note with an empty one.
   */
  async createEditor(title?: string) {
    const selectedTagUuid = this.selectedTag
      ? this.selectedTag instanceof SmartView
        ? undefined
        : this.selectedTag.uuid
      : undefined

    this.application.editorGroup.closeActiveNoteController()

    const noteView = await this.application.editorGroup.createNoteController(undefined, title, selectedTagUuid)

    const defaultEditor = this.application.componentManager.getDefaultEditor()
    if (defaultEditor) {
      await associateComponentWithNote(this.application, defaultEditor, this.getActiveNoteController().note)
    }

    return noteView
  }

  async openEditor(noteUuid: string): Promise<NoteViewController> {
    const note = this.application.items.findItem(noteUuid) as SNNote
    const activeEditor = this.getActiveNoteController()
    if (activeEditor) {
      this.application.editorGroup.closeActiveNoteController()
    }

    const noteView = await this.application.editorGroup.createNoteController(noteUuid)

    if (note && note.conflictOf) {
      void InteractionManager.runAfterInteractions(() => {
        void this.application?.mutator.changeAndSaveItem(note, mutator => {
          mutator.conflictOf = undefined
        })
      })
    }

    return noteView
  }

  getActiveNoteController() {
    return this.application.editorGroup.noteControllers[0]
  }

  getEditors() {
    return this.application.editorGroup.noteControllers
  }

  closeEditor(editor: NoteViewController) {
    this.notifyOfStateChange(AppStateType.EditorClosed)
    this.application.editorGroup.closeNoteController(editor)
  }

  closeActiveEditor() {
    this.notifyOfStateChange(AppStateType.EditorClosed)
    this.application.editorGroup.closeActiveNoteController()
  }

  closeAllEditors() {
    this.notifyOfStateChange(AppStateType.EditorClosed)
    this.application.editorGroup.closeAllNoteControllers()
  }

  editorForNote(uuid: Uuid): NoteViewController | void {
    for (const editor of this.getEditors()) {
      if (editor.note?.uuid === uuid) {
        return editor
      }
    }
  }

  private keyboardDidShow: KeyboardEventListener = e => {
    this.keyboardHeight = e.endCoordinates.height
    this.notifyEventObservers(AppStateEventType.KeyboardChangeEvent)
  }

  private keyboardDidHide: KeyboardEventListener = () => {
    this.keyboardHeight = 0
    this.notifyEventObservers(AppStateEventType.KeyboardChangeEvent)
  }

  /**
   * @returns Returns keybord height
   */
  getKeyboardHeight() {
    return this.keyboardHeight
  }

  /**
   * Reacts to @SNNote and @SNTag Changes
   */
  private handleItemsChanges() {
    this.removeItemChangesListener = this.application.streamItems<SNNote | SNTag>(
      [ContentType.Note, ContentType.Tag],
      async ({ changed, inserted, removed, source }) => {
        if (source === PayloadEmitSource.PreSyncSave || source === PayloadEmitSource.RemoteRetrieved) {
          const removedNotes = removed.filter(i => i.content_type === ContentType.Note)
          for (const removedNote of removedNotes) {
            const editor = this.editorForNote(removedNote.uuid)
            if (editor) {
              this.closeEditor(editor)
            }
          }

          const notes = [...changed, ...inserted].filter(candidate => candidate.content_type === ContentType.Note)

          const isBrowswingTrashedNotes =
            this.selectedTag instanceof SmartView && this.selectedTag.uuid === SystemViewId.TrashedNotes

          const isBrowsingArchivedNotes =
            this.selectedTag instanceof SmartView && this.selectedTag.uuid === SystemViewId.ArchivedNotes

          for (const note of notes) {
            const editor = this.editorForNote(note.uuid)
            if (!editor) {
              continue
            }

            if (note.trashed && !isBrowswingTrashedNotes) {
              this.closeEditor(editor)
            } else if (note.archived && !isBrowsingArchivedNotes) {
              this.closeEditor(editor)
            }
          }
        }

        if (this.selectedTag) {
          const matchingTag = [...changed, ...inserted].find(candidate => candidate.uuid === this.selectedTag.uuid)
          if (matchingTag) {
            this.selectedTag = matchingTag as SNTag
          }
        }
      },
    )
  }

  /**
   * Registers for MobileApplication events
   */
  private handleApplicationEvents() {
    this.removeAppEventObserver = this.application.addEventObserver(async eventName => {
      switch (eventName) {
        case ApplicationEvent.LocalDataIncrementalLoad:
        case ApplicationEvent.LocalDataLoaded: {
          this.restoreSelectedTag()
          break
        }
        case ApplicationEvent.Started: {
          this.locked = true
          break
        }
        case ApplicationEvent.Launched: {
          this.locked = false
          this.notifyLockStateObservers(LockStateType.Unlocked)
          break
        }
      }
    })
  }

  /**
   * Set selected @SNTag
   */
  public setSelectedTag(tag: SNTag | SmartView, saveSelection = true) {
    if (this.selectedTag.uuid === tag.uuid) {
      return
    }
    const previousTag = this.selectedTag
    this.selectedTag = tag

    if (saveSelection) {
      void this.application.getLocalPreferences().setUserPrefValue(PrefKey.MobileSelectedTagUuid, tag.uuid)
    }

    this.notifyOfStateChange(AppStateType.TagChanged, {
      tag,
      previousTag,
    })
  }

  /**
   * @returns tags that are referencing note
   */
  public getNoteTags(note: SNNote) {
    return this.application.items.itemsReferencingItem(note).filter(ref => {
      return ref.content_type === ContentType.Tag
    }) as SNTag[]
  }

  /**
   * @returns notes this tag references
   */
  public getTagNotes(tag: SNTag | SmartView) {
    if (tag instanceof SmartView) {
      return this.application.items.notesMatchingSmartView(tag)
    } else {
      return this.application.items.referencesForItem(tag).filter(ref => {
        return ref.content_type === ContentType.Note
      }) as SNNote[]
    }
  }

  public getSelectedTag() {
    return this.selectedTag
  }

  static get version() {
    return `${pjson['user-version']} (${VersionInfo.buildVersion})`
  }

  get isTabletDevice() {
    const deviceType = PlatformConstants.interfaceIdiom
    return deviceType === 'pad'
  }

  get isInTabletMode() {
    return this.tabletMode
  }

  setTabletModeEnabled(enabledTabletMode: boolean) {
    if (enabledTabletMode !== this.tabletMode) {
      this.tabletMode = enabledTabletMode
      this.notifyEventObservers(AppStateEventType.TabletModeChange, {
        new_isInTabletMode: enabledTabletMode,
        old_isInTabletMode: !enabledTabletMode,
      })
    }
  }

  getPasscodeTimingOptions() {
    return [
      {
        title: 'Immediately',
        key: UnlockTiming.Immediately,
        selected: this.passcodeTiming === UnlockTiming.Immediately,
      },
      {
        title: 'On Quit',
        key: UnlockTiming.OnQuit,
        selected: this.passcodeTiming === UnlockTiming.OnQuit,
      },
    ]
  }

  getBiometricsTimingOptions() {
    return [
      {
        title: 'Immediately',
        key: UnlockTiming.Immediately,
        selected: this.biometricsTiming === UnlockTiming.Immediately,
      },
      {
        title: 'On Quit',
        key: UnlockTiming.OnQuit,
        selected: this.biometricsTiming === UnlockTiming.OnQuit,
      },
    ]
  }

  private async checkAndLockApplication() {
    const isLocked = await this.application.isLocked()
    if (!isLocked) {
      const hasBiometrics = await this.application.hasBiometrics()
      const hasPasscode = this.application.hasPasscode()
      if (hasPasscode && this.passcodeTiming === UnlockTiming.Immediately) {
        await this.application.lock()
      } else if (hasBiometrics && this.biometricsTiming === UnlockTiming.Immediately && !this.locked) {
        const challenge = new Challenge(
          [new ChallengePrompt(ChallengeValidation.Biometric)],
          ChallengeReason.ApplicationUnlock,
          false,
        )
        void this.application.promptForCustomChallenge(challenge)

        this.locked = true
        this.notifyLockStateObservers(LockStateType.Locked)
        this.application.addChallengeObserver(challenge, {
          onComplete: () => {
            this.locked = false
            this.notifyLockStateObservers(LockStateType.Unlocked)
          },
        })
      }
    }
  }

  /**
   * handles App State change from React Native
   */
  private handleReactNativeAppStateChange = async (nextAppState: AppStateStatus) => {
    if (this.ignoreStateChanges) {
      return
    }

    // if the most recent state is not 'background' ('inactive'), then we're going
    // from inactive to active, which doesn't really happen unless you, say, swipe
    // notification center in iOS down then back up. We don't want to lock on this state change.
    const isResuming = nextAppState === 'active'
    const isResumingFromBackground = isResuming && this.mostRecentState === AppStateType.EnteringBackground
    const isEnteringBackground = nextAppState === 'background'
    const isLosingFocus = nextAppState === 'inactive'

    if (isEnteringBackground) {
      this.notifyOfStateChange(AppStateType.EnteringBackground)
      return this.checkAndLockApplication()
    }

    if (isResumingFromBackground || isResuming) {
      if (this.screenshotPrivacyEnabled) {
        hide()
      }

      if (isResumingFromBackground) {
        this.notifyOfStateChange(AppStateType.ResumingFromBackground)
      }

      // Notify of GainingFocus even if resuming from background
      this.notifyOfStateChange(AppStateType.GainingFocus)
      return
    }

    if (isLosingFocus) {
      if (this.screenshotPrivacyEnabled) {
        show()
      }

      this.notifyOfStateChange(AppStateType.LosingFocus)
      return this.checkAndLockApplication()
    }
  }

  /**
   * Visibility change events are like active, inactive, background,
   * while non-app cycle events are custom events like locking and unlocking
   */
  isAppVisibilityChange(state: AppStateType) {
    return (
      [
        AppStateType.LosingFocus,
        AppStateType.EnteringBackground,
        AppStateType.GainingFocus,
        AppStateType.ResumingFromBackground,
      ] as Array<AppStateType>
    ).includes(state)
  }

  private async getScreenshotPrivacyEnabled(): Promise<boolean | undefined> {
    return this.application.getValue(StorageKey.MobileScreenshotPrivacyEnabled, StorageValueModes.Default) as Promise<
      boolean | undefined
    >
  }

  private async getPasscodeTiming(): Promise<UnlockTiming | undefined> {
    return this.application.getValue(StorageKey.MobilePasscodeTiming, StorageValueModes.Nonwrapped) as Promise<
      UnlockTiming | undefined
    >
  }

  private async getBiometricsTiming(): Promise<UnlockTiming | undefined> {
    return this.application.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped) as Promise<
      UnlockTiming | undefined
    >
  }

  public async setScreenshotPrivacyEnabled(enabled: boolean) {
    await this.application.setValue(StorageKey.MobileScreenshotPrivacyEnabled, enabled, StorageValueModes.Default)
    this.screenshotPrivacyEnabled = enabled
    void this.setAndroidScreenshotPrivacy(enabled)
  }

  public async setPasscodeTiming(timing: UnlockTiming) {
    await this.application.setValue(StorageKey.MobilePasscodeTiming, timing, StorageValueModes.Nonwrapped)
    this.passcodeTiming = timing
  }

  public async setBiometricsTiming(timing: UnlockTiming) {
    await this.application.setValue(StorageKey.MobileBiometricsTiming, timing, StorageValueModes.Nonwrapped)
    this.biometricsTiming = timing
  }

  public async getPasscodeKeyboardType(): Promise<PasscodeKeyboardType> {
    return this.application.getValue(
      MobileStorageKey.PasscodeKeyboardTypeKey,
      StorageValueModes.Nonwrapped,
    ) as Promise<PasscodeKeyboardType>
  }

  public async setPasscodeKeyboardType(type: PasscodeKeyboardType) {
    await this.application.setValue(MobileStorageKey.PasscodeKeyboardTypeKey, type, StorageValueModes.Nonwrapped)
  }

  public onDrawerOpen() {
    this.notifyEventObservers(AppStateEventType.DrawerOpen)
  }

  /*
  Allows other parts of the code to perform external actions without triggering state change notifications.
  This is useful on Android when you present a share sheet and dont want immediate authentication to appear.
  */
  async performActionWithoutStateChangeImpact(block: () => void | Promise<void>, notAwaited?: boolean) {
    this.ignoreStateChanges = true
    if (notAwaited) {
      void block()
    } else {
      await block()
    }
    setTimeout(() => {
      this.ignoreStateChanges = false
    }, 350)
  }

  getMostRecentState() {
    return this.mostRecentState
  }

  private get prefService() {
    return this.application.getLocalPreferences()
  }

  public getEnvironment() {
    const bundleId = VersionInfo.bundleIdentifier
    return bundleId && bundleId.includes('dev') ? 'dev' : 'prod'
  }
}
