import { AbstractComponent } from '@/Components/Abstract/PureComponent'
import ChangeEditorButton from '@/Components/ChangeEditor/ChangeEditorButton'
import ComponentView from '@/Components/ComponentView/ComponentView'
import NotesOptionsPanel from '@/Components/NotesOptions/NotesOptionsPanel'
import PanelResizer, { PanelResizeType, PanelSide } from '@/Components/PanelResizer/PanelResizer'
import PinNoteButton from '@/Components/PinNoteButton/PinNoteButton'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import { ElementIds } from '@/Constants/ElementIDs'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { StringDeleteNote, STRING_DELETE_LOCKED_ATTEMPT, STRING_DELETE_PLACEHOLDER_ATTEMPT } from '@/Constants/Strings'
import { log, LoggingDomain } from '@/Logging'
import { debounce, isDesktopApplication, isMobileScreen } from '@/Utils'
import { classNames } from '@/Utils/ConcatenateClassNames'
import {
  ApplicationEvent,
  ComponentArea,
  ComponentViewerInterface,
  ContentType,
  isPayloadSourceInternalChange,
  isPayloadSourceRetrieved,
  NoteType,
  PayloadEmitSource,
  PrefKey,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
  SNComponent,
  SNNote,
} from '@standardnotes/snjs'
import { confirmDialog, KeyboardKey, KeyboardModifier } from '@standardnotes/ui-services'
import { ChangeEventHandler, createRef, KeyboardEventHandler, RefObject } from 'react'
import { BlockEditor } from '../BlockEditor/BlockEditorComponent'
import IndicatorCircle from '../IndicatorCircle/IndicatorCircle'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import LinkedItemsButton from '../LinkedItems/LinkedItemsButton'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'
import EditingDisabledBanner from './EditingDisabledBanner'
import { reloadFont } from './FontFunctions'
import NoteStatusIndicator, { NoteStatus } from './NoteStatusIndicator'
import NoteViewFileDropTarget from './NoteViewFileDropTarget'
import { NoteViewProps } from './NoteViewProps'
import {
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from './TransactionFunctions'
import { SuperEditorContentId } from '@standardnotes/blocks-editor'
import { NoteViewController } from './Controller/NoteViewController'
import { PlainEditor, PlainEditorInterface } from './PlainEditor/PlainEditor'

const MinimumStatusDuration = 400
const NoteEditingDisabledText = 'Note editing disabled.'

function sortAlphabetically(array: SNComponent[]): SNComponent[] {
  return array.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
}

type State = {
  availableStackComponents: SNComponent[]
  editorComponentViewer?: ComponentViewerInterface
  editorComponentViewerDidAlreadyReload?: boolean
  editorStateDidLoad: boolean
  editorTitle: string
  isDesktop?: boolean
  lockText: string
  marginResizersEnabled?: boolean
  noteLocked: boolean
  noteStatus?: NoteStatus
  saveError?: boolean
  showLockedIcon: boolean
  showProtectedWarning: boolean
  spellcheck: boolean
  stackComponentViewers: ComponentViewerInterface[]
  syncTakingTooLong: boolean
  monospaceFont?: boolean
  plainEditorFocused?: boolean
  leftResizerWidth: number
  leftResizerOffset: number
  rightResizerWidth: number
  rightResizerOffset: number

  updateSavingIndicator?: boolean
  editorFeatureIdentifier?: string
  noteType?: NoteType
}

class NoteView extends AbstractComponent<NoteViewProps, State> {
  readonly controller!: NoteViewController

  private statusTimeout?: NodeJS.Timeout
  onEditorComponentLoad?: () => void

  private removeTrashKeyObserver?: () => void
  private removeComponentStreamObserver?: () => void
  private removeComponentManagerObserver?: () => void
  private removeInnerNoteObserver?: () => void

  private protectionTimeoutId: ReturnType<typeof setTimeout> | null = null
  private noteViewElementRef: RefObject<HTMLDivElement>
  private editorContentRef: RefObject<HTMLDivElement>
  private plainEditorRef?: RefObject<PlainEditorInterface>

  constructor(props: NoteViewProps) {
    super(props, props.application)

    this.controller = props.controller

    this.onEditorComponentLoad = () => {
      if (!this.controller || this.controller.dealloced) {
        return
      }
      this.application.getDesktopService()?.redoSearch()
    }

    this.debounceReloadEditorComponent = debounce(this.debounceReloadEditorComponent.bind(this), 25)

    this.state = {
      availableStackComponents: [],
      editorStateDidLoad: false,
      editorTitle: '',
      isDesktop: isDesktopApplication(),
      lockText: NoteEditingDisabledText,
      noteStatus: undefined,
      noteLocked: this.controller.item.locked,
      showLockedIcon: true,
      showProtectedWarning: false,
      spellcheck: true,
      stackComponentViewers: [],
      syncTakingTooLong: false,
      leftResizerWidth: 0,
      leftResizerOffset: 0,
      rightResizerWidth: 0,
      rightResizerOffset: 0,
      editorFeatureIdentifier: this.controller.item.editorIdentifier,
      noteType: this.controller.item.noteType,
    }

    this.noteViewElementRef = createRef<HTMLDivElement>()
    this.editorContentRef = createRef<HTMLDivElement>()
  }

  override deinit() {
    super.deinit()
    ;(this.controller as unknown) = undefined

    this.removeComponentStreamObserver?.()
    ;(this.removeComponentStreamObserver as unknown) = undefined

    this.removeInnerNoteObserver?.()
    ;(this.removeInnerNoteObserver as unknown) = undefined

    this.removeComponentManagerObserver?.()
    ;(this.removeComponentManagerObserver as unknown) = undefined

    this.removeTrashKeyObserver?.()
    this.removeTrashKeyObserver = undefined

    this.clearNoteProtectionInactivityTimer()
    ;(this.ensureNoteIsInsertedBeforeUIAction as unknown) = undefined

    this.onEditorComponentLoad = undefined

    this.statusTimeout = undefined
    ;(this.onPanelResizeFinish as unknown) = undefined
    ;(this.authorizeAndDismissProtectedWarning as unknown) = undefined
    ;(this.editorComponentViewerRequestsReload as unknown) = undefined
    ;(this.onTitleEnter as unknown) = undefined
    ;(this.onTitleChange as unknown) = undefined
    ;(this.onPanelResizeFinish as unknown) = undefined
    ;(this.stackComponentExpanded as unknown) = undefined
    ;(this.toggleStackComponent as unknown) = undefined
    ;(this.debounceReloadEditorComponent as unknown) = undefined
    ;(this.editorContentRef as unknown) = undefined
    ;(this.plainEditorRef as unknown) = undefined
  }

  getState() {
    return this.state as State
  }

  get note() {
    return this.controller.item
  }

  override shouldComponentUpdate(_nextProps: Readonly<NoteViewProps>, nextState: Readonly<State>): boolean {
    const complexObjects: (keyof State)[] = ['availableStackComponents', 'stackComponentViewers']
    for (const key of Object.keys(nextState) as (keyof State)[]) {
      if (complexObjects.includes(key)) {
        continue
      }
      const prevValue = this.state[key]
      const nextValue = nextState[key]

      if (prevValue !== nextValue) {
        log(LoggingDomain.NoteView, 'Rendering due to state change', key, prevValue, nextValue)
        return true
      }
    }

    return false
  }

  override componentDidMount(): void {
    super.componentDidMount()

    this.registerKeyboardShortcuts()

    this.removeInnerNoteObserver = this.controller.addNoteInnerValueChangeObserver((note, source) => {
      this.onNoteInnerChange(note, source)
    })

    this.autorun(() => {
      this.setState({
        showProtectedWarning: this.viewControllerManager.notesController.showProtectedWarning,
      })
    })

    this.reloadEditorComponent().catch(console.error)
    this.reloadStackComponents().catch(console.error)

    const showProtectedWarning =
      this.note.protected &&
      (!this.application.hasProtectionSources() || !this.application.hasUnprotectedAccessSession())
    this.setShowProtectedOverlay(showProtectedWarning)

    this.reloadPreferences().catch(console.error)

    if (this.controller.isTemplateNote) {
      setTimeout(() => {
        if (this.controller.templateNoteOptions?.autofocusBehavior === 'title') {
          this.focusTitle()
        }
      })
    }
  }

  override componentDidUpdate(_prevProps: NoteViewProps, prevState: State): void {
    if (
      this.state.showProtectedWarning != undefined &&
      prevState.showProtectedWarning !== this.state.showProtectedWarning
    ) {
      this.reloadEditorComponent().catch(console.error)
    }
  }

  onNoteInnerChange(note: SNNote, source: PayloadEmitSource): void {
    log(LoggingDomain.NoteView, 'On inner note change', PayloadEmitSource[source])

    if (note.uuid !== this.note.uuid) {
      throw Error('Editor received changes for non-current note')
    }

    let title = this.state.editorTitle

    if (isPayloadSourceRetrieved(source)) {
      title = note.title
    }

    if (!this.state.editorTitle) {
      title = note.title
    }

    if (title !== this.state.editorTitle) {
      this.setState({
        editorTitle: title,
      })
    }

    if (note.locked !== this.state.noteLocked) {
      this.setState({
        noteLocked: note.locked,
      })
    }

    if (note.editorIdentifier !== this.state.editorFeatureIdentifier || note.noteType !== this.state.noteType) {
      this.setState({
        editorFeatureIdentifier: note.editorIdentifier,
        noteType: note.noteType,
        editorTitle: note.title,
      })

      void this.reloadEditorComponent()
    }

    this.reloadSpellcheck().catch(console.error)

    const isTemplateNoteInsertedToBeInteractableWithEditor = source === PayloadEmitSource.LocalInserted && note.dirty
    if (isTemplateNoteInsertedToBeInteractableWithEditor) {
      return
    }

    if (note.lastSyncBegan || note.dirty) {
      if (note.lastSyncEnd) {
        const shouldShowSavingStatus = note.lastSyncBegan && note.lastSyncBegan.getTime() > note.lastSyncEnd.getTime()
        const shouldShowSavedStatus = note.lastSyncBegan && note.lastSyncEnd.getTime() > note.lastSyncBegan.getTime()
        if (note.dirty || shouldShowSavingStatus) {
          this.showSavingStatus()
        } else if (this.state.noteStatus && shouldShowSavedStatus) {
          this.showAllChangesSavedStatus()
        }
      } else {
        this.showSavingStatus()
      }
    }
  }

  override componentWillUnmount(): void {
    if (this.state.editorComponentViewer) {
      this.application.componentManager?.destroyComponentViewer(this.state.editorComponentViewer)
    }

    super.componentWillUnmount()
  }

  override async onAppLaunch() {
    await super.onAppLaunch()
    this.streamItems()
  }

  override async onAppEvent(eventName: ApplicationEvent) {
    if (this.controller?.dealloced) {
      return
    }

    switch (eventName) {
      case ApplicationEvent.PreferencesChanged:
        this.reloadPreferences().catch(console.error)
        break
      case ApplicationEvent.HighLatencySync:
        this.setState({ syncTakingTooLong: true })
        break
      case ApplicationEvent.CompletedFullSync: {
        this.setState({ syncTakingTooLong: false })
        const isInErrorState = this.state.saveError
        /** if we're still dirty, don't change status, a sync is likely upcoming. */
        if (!this.note.dirty && isInErrorState) {
          this.showAllChangesSavedStatus()
        }
        break
      }
      case ApplicationEvent.FailedSync:
        /**
         * Only show error status in editor if the note is dirty.
         * Otherwise, it means the originating sync came from somewhere else
         * and we don't want to display an error here.
         */
        if (this.note.dirty) {
          this.showErrorStatus()
        }
        break
      case ApplicationEvent.LocalDatabaseWriteError:
        this.showErrorStatus({
          type: 'error',
          message: 'Offline Saving Issue',
          desc: 'Changes not saved',
        })
        break
      case ApplicationEvent.UnprotectedSessionBegan: {
        this.setShowProtectedOverlay(false)
        break
      }
      case ApplicationEvent.UnprotectedSessionExpired: {
        if (this.note.protected) {
          this.hideProtectedNoteIfInactive()
        }
        break
      }
    }
  }

  getSecondsElapsedSinceLastEdit(): number {
    return (Date.now() - this.note.userModifiedDate.getTime()) / 1000
  }

  hideProtectedNoteIfInactive(): void {
    const secondsElapsedSinceLastEdit = this.getSecondsElapsedSinceLastEdit()
    if (secondsElapsedSinceLastEdit >= ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction) {
      this.setShowProtectedOverlay(true)
    } else {
      const secondsUntilTheNextCheck =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction - secondsElapsedSinceLastEdit
      this.startNoteProtectionInactivityTimer(secondsUntilTheNextCheck)
    }
  }

  startNoteProtectionInactivityTimer(timerDurationInSeconds: number): void {
    this.clearNoteProtectionInactivityTimer()
    this.protectionTimeoutId = setTimeout(() => {
      this.hideProtectedNoteIfInactive()
    }, timerDurationInSeconds * 1000)
  }

  clearNoteProtectionInactivityTimer(): void {
    if (this.protectionTimeoutId) {
      clearTimeout(this.protectionTimeoutId)
    }
  }

  authorizeAndDismissProtectedWarning = async () => {
    let showNoteContents = true

    if (this.application.hasProtectionSources()) {
      showNoteContents = await this.application.authorizeNoteAccess(this.note)
    }

    if (!showNoteContents) {
      return
    }

    this.setShowProtectedOverlay(false)
    this.focusTitle()
  }

  streamItems() {
    this.removeComponentStreamObserver = this.application.streamItems(ContentType.Component, async ({ source }) => {
      log(LoggingDomain.NoteView, 'On component stream observer', PayloadEmitSource[source])
      if (isPayloadSourceInternalChange(source) || source === PayloadEmitSource.InitialObserverRegistrationPush) {
        return
      }

      if (!this.note) {
        return
      }

      await this.reloadStackComponents()
      this.debounceReloadEditorComponent()
    })
  }

  private createComponentViewer(component: SNComponent) {
    const viewer = this.application.componentManager.createComponentViewer(component, this.note.uuid)
    return viewer
  }

  public editorComponentViewerRequestsReload = async (
    viewer: ComponentViewerInterface,
    force?: boolean,
  ): Promise<void> => {
    if (this.state.editorComponentViewerDidAlreadyReload && !force) {
      return
    }

    const component = viewer.component
    this.application.componentManager.destroyComponentViewer(viewer)
    this.setState(
      {
        editorComponentViewer: undefined,
        editorComponentViewerDidAlreadyReload: true,
      },
      () => {
        this.setState({
          editorComponentViewer: this.createComponentViewer(component),
          editorStateDidLoad: true,
        })
      },
    )
  }

  /**
   * Calling reloadEditorComponent successively without waiting for state to settle
   * can result in componentViewers being dealloced twice
   */
  debounceReloadEditorComponent() {
    this.reloadEditorComponent().catch(console.error)
  }

  private destroyCurrentEditorComponent() {
    const currentComponentViewer = this.state.editorComponentViewer
    if (currentComponentViewer) {
      this.application.componentManager.destroyComponentViewer(currentComponentViewer)
      this.setState({
        editorComponentViewer: undefined,
      })
    }
  }

  async reloadEditorComponent() {
    log(LoggingDomain.NoteView, 'Reload editor component')
    if (this.state.showProtectedWarning) {
      this.destroyCurrentEditorComponent()
      return
    }

    const newEditor = this.application.componentManager.editorForNote(this.note)

    /** Editors cannot interact with template notes so the note must be inserted */
    if (newEditor && this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote()
    }

    const currentComponentViewer = this.state.editorComponentViewer

    if (currentComponentViewer?.componentUuid !== newEditor?.uuid) {
      if (currentComponentViewer) {
        this.destroyCurrentEditorComponent()
      }

      if (newEditor) {
        this.setState({
          editorComponentViewer: this.createComponentViewer(newEditor),
          editorStateDidLoad: true,
        })
      }
      reloadFont(this.state.monospaceFont)
    } else {
      this.setState({
        editorStateDidLoad: true,
      })
    }
  }

  hasAvailableExtensions() {
    return this.application.actionsManager.extensionsInContextOfItem(this.note).length > 0
  }

  showSavingStatus() {
    this.setStatus({ type: 'saving', message: 'Saving…' }, false)
  }

  showAllChangesSavedStatus() {
    this.setState({
      saveError: false,
      syncTakingTooLong: false,
    })
    this.setStatus({
      type: 'saved',
      message: 'All changes saved' + (this.application.noAccount() ? ' offline' : ''),
    })
  }

  showErrorStatus(error?: NoteStatus) {
    if (!error) {
      error = {
        type: 'error',
        message: 'Sync Unreachable',
        desc: 'Changes saved offline',
      }
    }
    this.setState({
      saveError: true,
      syncTakingTooLong: false,
    })
    this.setStatus(error)
  }

  setStatus(status: NoteStatus, wait = true) {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout)
    }
    if (wait) {
      this.statusTimeout = setTimeout(() => {
        this.setState({
          noteStatus: status,
        })
      }, MinimumStatusDuration)
    } else {
      this.setState({
        noteStatus: status,
      })
    }
  }

  cancelPendingSetStatus() {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout)
    }
  }

  onTitleEnter: KeyboardEventHandler<HTMLInputElement> = ({ key, currentTarget }) => {
    if (key !== KeyboardKey.Enter) {
      return
    }

    currentTarget.blur()
    this.plainEditorRef?.current?.focus()
  }

  onTitleChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    log(LoggingDomain.NoteView, 'Performing save after title change')

    const title = currentTarget.value

    this.setState({
      editorTitle: title,
    })

    this.controller
      .save({
        title: title,
        isUserModified: true,
        dontGeneratePreviews: true,
      })
      .catch(console.error)
  }

  focusTitle() {
    document.getElementById(ElementIds.NoteTitleEditor)?.focus()
  }

  setShowProtectedOverlay(show: boolean) {
    this.viewControllerManager.notesController.setShowProtectedWarning(show)
  }

  async deleteNote(permanently: boolean) {
    if (this.controller.isTemplateNote) {
      this.application.alertService.alert(STRING_DELETE_PLACEHOLDER_ATTEMPT).catch(console.error)
      return
    }

    if (this.note.locked) {
      this.application.alertService.alert(STRING_DELETE_LOCKED_ATTEMPT).catch(console.error)
      return
    }

    const title = this.note.title.length ? `'${this.note.title}'` : 'this note'
    const text = StringDeleteNote(title, permanently)
    if (
      await confirmDialog({
        text,
        confirmButtonStyle: 'danger',
      })
    ) {
      if (permanently) {
        this.performNoteDeletion(this.note)
      } else {
        this.controller
          .save({
            title: this.state.editorTitle,
            bypassDebouncer: true,
            dontGeneratePreviews: true,
            customMutate: (mutator) => {
              mutator.trashed = true
            },
          })
          .catch(console.error)
      }
    }
  }

  performNoteDeletion(note: SNNote) {
    this.application.mutator.deleteItem(note).catch(console.error)
  }

  onPanelResizeFinish = async (width: number, left: number, isMaxWidth: boolean) => {
    if (isMaxWidth) {
      await this.application.setPreference(PrefKey.EditorWidth, null)
    } else {
      if (width !== undefined && width !== null) {
        await this.application.setPreference(PrefKey.EditorWidth, width)
      }
    }
    if (left !== undefined && left !== null) {
      await this.application.setPreference(PrefKey.EditorLeft, left)
    }
    this.application.sync.sync().catch(console.error)
  }

  async reloadSpellcheck() {
    const spellcheck = this.viewControllerManager.notesController.getSpellcheckStateForNote(this.note)
    if (spellcheck !== this.state.spellcheck) {
      reloadFont(this.state.monospaceFont)
      this.setState({ spellcheck })
    }
  }

  async reloadPreferences() {
    log(LoggingDomain.NoteView, 'Reload preferences')
    const monospaceFont = this.application.getPreference(
      PrefKey.EditorMonospaceEnabled,
      PrefDefaults[PrefKey.EditorMonospaceEnabled],
    )

    const marginResizersEnabled = this.application.getPreference(
      PrefKey.EditorResizersEnabled,
      PrefDefaults[PrefKey.EditorResizersEnabled],
    )

    const updateSavingIndicator = this.application.getPreference(
      PrefKey.UpdateSavingStatusIndicator,
      PrefDefaults[PrefKey.UpdateSavingStatusIndicator],
    )

    await this.reloadSpellcheck()

    this.setState({
      monospaceFont,
      marginResizersEnabled,

      updateSavingIndicator,
    })

    reloadFont(monospaceFont)

    if (marginResizersEnabled) {
      const width = this.application.getPreference(PrefKey.EditorWidth, PrefDefaults[PrefKey.EditorWidth])
      if (width != null) {
        this.setState({
          leftResizerWidth: width,
          rightResizerWidth: width,
        })
      }
      const left = this.application.getPreference(PrefKey.EditorLeft, PrefDefaults[PrefKey.EditorLeft])
      if (left != null) {
        this.setState({
          leftResizerOffset: left,
          rightResizerOffset: left,
        })
      }
    }
  }

  async reloadStackComponents() {
    log(LoggingDomain.NoteView, 'Reload stack components')
    const stackComponents = sortAlphabetically(
      this.application.componentManager
        .componentsForArea(ComponentArea.EditorStack)
        .filter((component) => component.active),
    )
    const enabledComponents = stackComponents.filter((component) => {
      return component.isExplicitlyEnabledForItem(this.note.uuid)
    })

    const needsNewViewer = enabledComponents.filter((component) => {
      const hasExistingViewer = this.state.stackComponentViewers.find(
        (viewer) => viewer.componentUuid === component.uuid,
      )
      return !hasExistingViewer
    })

    const needsDestroyViewer = this.state.stackComponentViewers.filter((viewer) => {
      const viewerComponentExistsInEnabledComponents = enabledComponents.find((component) => {
        return component.uuid === viewer.componentUuid
      })
      return !viewerComponentExistsInEnabledComponents
    })

    const newViewers: ComponentViewerInterface[] = []
    for (const component of needsNewViewer) {
      newViewers.push(this.application.componentManager.createComponentViewer(component, this.note.uuid))
    }

    for (const viewer of needsDestroyViewer) {
      this.application.componentManager.destroyComponentViewer(viewer)
    }
    this.setState({
      availableStackComponents: stackComponents,
      stackComponentViewers: newViewers,
    })
  }

  stackComponentExpanded = (component: SNComponent): boolean => {
    return !!this.state.stackComponentViewers.find((viewer) => viewer.componentUuid === component.uuid)
  }

  toggleStackComponent = async (component: SNComponent) => {
    if (!component.isExplicitlyEnabledForItem(this.note.uuid)) {
      await this.application.mutator.runTransactionalMutation(
        transactionForAssociateComponentWithCurrentNote(component, this.note),
      )
    } else {
      await this.application.mutator.runTransactionalMutation(
        transactionForDisassociateComponentWithCurrentNote(component, this.note),
      )
    }
    this.application.sync.sync().catch(console.error)
  }

  registerKeyboardShortcuts() {
    this.removeTrashKeyObserver = this.application.io.addKeyObserver({
      key: KeyboardKey.Backspace,
      notTags: ['INPUT', 'TEXTAREA'],
      notElementIds: [SuperEditorContentId],
      modifiers: [KeyboardModifier.Meta],
      onKeyDown: () => {
        this.deleteNote(false).catch(console.error)
      },
    })
  }

  ensureNoteIsInsertedBeforeUIAction = async () => {
    if (this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote()
    }
  }

  onPlainFocus = () => {
    this.setState({ plainEditorFocused: true })
  }

  onPlainBlur = () => {
    this.setState({ plainEditorFocused: false })
  }

  override render() {
    if (this.controller.dealloced) {
      return null
    }

    if (this.state.showProtectedWarning || !this.application.isAuthorizedToRenderItem(this.note)) {
      return (
        <ProtectedItemOverlay
          showAccountMenu={() => this.application.showAccountMenu()}
          hasProtectionSources={this.application.hasProtectionSources()}
          onViewItem={this.authorizeAndDismissProtectedWarning}
          itemType={'note'}
        />
      )
    }

    const renderHeaderOptions = isMobileScreen() ? !this.state.plainEditorFocused : true

    const editorMode =
      this.note.noteType === NoteType.Super
        ? 'super'
        : this.state.editorStateDidLoad && !this.state.editorComponentViewer
        ? 'plain'
        : this.state.editorComponentViewer
        ? 'component'
        : 'plain'

    return (
      <div aria-label="Note" className="section editor sn-component h-full md:max-h-full" ref={this.noteViewElementRef}>
        {this.note && (
          <NoteViewFileDropTarget
            note={this.note}
            linkingController={this.viewControllerManager.linkingController}
            filesController={this.viewControllerManager.filesController}
            noteViewElement={this.noteViewElementRef.current}
          />
        )}

        {this.state.noteLocked && (
          <EditingDisabledBanner
            onMouseLeave={() => {
              this.setState({
                lockText: NoteEditingDisabledText,
                showLockedIcon: true,
              })
            }}
            onMouseOver={() => {
              this.setState({
                lockText: 'Enable editing',
                showLockedIcon: false,
              })
            }}
            onClick={() => this.viewControllerManager.notesController.setLockSelectedNotes(!this.state.noteLocked)}
            showLockedIcon={this.state.showLockedIcon}
            lockText={this.state.lockText}
          />
        )}

        {this.note && (
          <div
            id="editor-title-bar"
            className="content-title-bar section-title-bar z-editor-title-bar w-full bg-default pt-4"
          >
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2 md:mb-0 md:flex-nowrap md:gap-4 xl:items-center">
              <div className={classNames(this.state.noteLocked && 'locked', 'flex flex-grow items-center')}>
                <MobileItemsListButton />
                <div className="title flex-grow overflow-auto">
                  <input
                    className="input text-lg"
                    disabled={this.state.noteLocked}
                    id={ElementIds.NoteTitleEditor}
                    onChange={this.onTitleChange}
                    onFocus={(event) => {
                      event.target.select()
                    }}
                    onKeyUp={this.onTitleEnter}
                    spellCheck={false}
                    value={this.state.editorTitle}
                    autoComplete="off"
                  />
                </div>
                <NoteStatusIndicator
                  status={this.state.noteStatus}
                  syncTakingTooLong={this.state.syncTakingTooLong}
                  updateSavingIndicator={this.state.updateSavingIndicator}
                />
              </div>
              {renderHeaderOptions && (
                <div className="flex items-center gap-3">
                  <LinkedItemsButton
                    filesController={this.viewControllerManager.filesController}
                    linkingController={this.viewControllerManager.linkingController}
                    onClickPreprocessing={this.ensureNoteIsInsertedBeforeUIAction}
                    featuresController={this.viewControllerManager.featuresController}
                  />
                  <ChangeEditorButton
                    application={this.application}
                    viewControllerManager={this.viewControllerManager}
                    onClickPreprocessing={this.ensureNoteIsInsertedBeforeUIAction}
                  />
                  <PinNoteButton
                    notesController={this.viewControllerManager.notesController}
                    onClickPreprocessing={this.ensureNoteIsInsertedBeforeUIAction}
                  />
                  <NotesOptionsPanel
                    application={this.application}
                    navigationController={this.viewControllerManager.navigationController}
                    notesController={this.viewControllerManager.notesController}
                    linkingController={this.viewControllerManager.linkingController}
                    historyModalController={this.viewControllerManager.historyModalController}
                    onClickPreprocessing={this.ensureNoteIsInsertedBeforeUIAction}
                  />
                </div>
              )}
            </div>
            {editorMode !== 'super' && (
              <LinkedItemBubblesContainer linkingController={this.viewControllerManager.linkingController} />
            )}
          </div>
        )}

        <div
          id={ElementIds.EditorContent}
          className={`${ElementIds.EditorContent} z-editor-content overflow-scroll`}
          ref={this.editorContentRef}
        >
          {this.state.marginResizersEnabled && this.editorContentRef.current ? (
            <PanelResizer
              minWidth={300}
              hoverable={true}
              collapsable={false}
              panel={this.editorContentRef.current}
              side={PanelSide.Left}
              type={PanelResizeType.OffsetAndWidth}
              left={this.state.leftResizerOffset}
              width={this.state.leftResizerWidth}
              resizeFinishCallback={this.onPanelResizeFinish}
            />
          ) : null}

          {editorMode === 'component' && this.state.editorComponentViewer && (
            <div className="component-view flex-grow">
              <ComponentView
                key={this.state.editorComponentViewer.identifier}
                componentViewer={this.state.editorComponentViewer}
                onLoad={this.onEditorComponentLoad}
                requestReload={this.editorComponentViewerRequestsReload}
                application={this.application}
              />
            </div>
          )}

          {editorMode === 'plain' && (
            <PlainEditor
              application={this.application}
              spellcheck={this.state.spellcheck}
              ref={this.plainEditorRef}
              controller={this.controller}
              locked={this.state.noteLocked}
              onFocus={this.onPlainFocus}
              onBlur={this.onPlainBlur}
            />
          )}

          {editorMode === 'super' && (
            <div className={classNames('blocks-editor w-full flex-grow overflow-hidden overflow-y-scroll')}>
              <BlockEditor
                key={this.note.uuid}
                application={this.application}
                note={this.note}
                linkingController={this.viewControllerManager.linkingController}
                filesController={this.viewControllerManager.filesController}
                spellcheck={this.state.spellcheck}
              />
            </div>
          )}

          {this.state.marginResizersEnabled && this.editorContentRef.current ? (
            <PanelResizer
              minWidth={300}
              hoverable={true}
              collapsable={false}
              panel={this.editorContentRef.current}
              side={PanelSide.Right}
              type={PanelResizeType.OffsetAndWidth}
              left={this.state.rightResizerOffset}
              width={this.state.rightResizerWidth}
              resizeFinishCallback={this.onPanelResizeFinish}
            />
          ) : null}
        </div>

        <div id="editor-pane-component-stack">
          {this.state.availableStackComponents.length > 0 && (
            <div
              id="component-stack-menu-bar"
              className="flex h-6 w-full items-center justify-between border-t border-solid border-border bg-contrast px-2 py-0 text-text"
            >
              <div className="flex h-full">
                {this.state.availableStackComponents.map((component) => {
                  return (
                    <div
                      key={component.uuid}
                      onClick={() => {
                        this.toggleStackComponent(component).catch(console.error)
                      }}
                      className="flex flex-grow cursor-pointer items-center justify-center [&:not(:first-child)]:ml-3"
                    >
                      <div className="flex h-full items-center [&:not(:first-child)]:ml-2">
                        {this.stackComponentExpanded(component) && component.active && <IndicatorCircle style="info" />}
                        {!this.stackComponentExpanded(component) && <IndicatorCircle style="neutral" />}
                      </div>
                      <div className="flex h-full items-center [&:not(:first-child)]:ml-2">
                        <div className="whitespace-nowrap text-xs font-bold">{component.name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="sn-component">
            {this.state.stackComponentViewers.map((viewer) => {
              return (
                <div className="component-view component-stack-item" key={viewer.identifier}>
                  <ComponentView key={viewer.identifier} componentViewer={viewer} application={this.application} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default NoteView
