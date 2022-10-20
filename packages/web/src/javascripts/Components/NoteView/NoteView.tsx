import { ChangeEventHandler, createRef, KeyboardEventHandler, RefObject } from 'react'
import {
  ApplicationEvent,
  isPayloadSourceRetrieved,
  isPayloadSourceInternalChange,
  ContentType,
  SNComponent,
  SNNote,
  ComponentArea,
  PrefKey,
  ComponentViewerInterface,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
  NoteViewController,
  PayloadEmitSource,
  WebAppEvent,
  EditorLineHeight,
  EditorFontSize,
  NoteType,
} from '@standardnotes/snjs'
import { debounce, isDesktopApplication } from '@/Utils'
import { EditorEventSource } from '../../Types/EditorEventSource'
import { confirmDialog, KeyboardModifier, KeyboardKey } from '@standardnotes/ui-services'
import { STRING_DELETE_PLACEHOLDER_ATTEMPT, STRING_DELETE_LOCKED_ATTEMPT, StringDeleteNote } from '@/Constants/Strings'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import ProtectedItemOverlay from '@/Components/ProtectedItemOverlay/ProtectedItemOverlay'
import PinNoteButton from '@/Components/PinNoteButton/PinNoteButton'
import NotesOptionsPanel from '@/Components/NotesOptions/NotesOptionsPanel'
import ComponentView from '@/Components/ComponentView/ComponentView'
import PanelResizer, { PanelSide, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import { ElementIds } from '@/Constants/ElementIDs'
import ChangeEditorButton from '@/Components/ChangeEditor/ChangeEditorButton'
import EditingDisabledBanner from './EditingDisabledBanner'
import {
  transactionForAssociateComponentWithCurrentNote,
  transactionForDisassociateComponentWithCurrentNote,
} from './TransactionFunctions'
import { reloadFont } from './FontFunctions'
import { NoteViewProps } from './NoteViewProps'
import IndicatorCircle from '../IndicatorCircle/IndicatorCircle'
import { classNames } from '@/Utils/ConcatenateClassNames'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import NoteStatusIndicator, { NoteStatus } from './NoteStatusIndicator'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import LinkedItemsButton from '../LinkedItems/LinkedItemsButton'
import NoteViewFileDropTarget from './NoteViewFileDropTarget'

const MinimumStatusDuration = 400
const TextareaDebounce = 100
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
  editorText: string
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
  /** Setting to true then false will allow the main content textarea to be destroyed
   * then re-initialized. Used when reloading spellcheck status. */
  textareaUnloading: boolean

  leftResizerWidth: number
  leftResizerOffset: number
  rightResizerWidth: number
  rightResizerOffset: number

  monospaceFont?: boolean
  lineHeight?: EditorLineHeight
  fontSize?: EditorFontSize
  updateSavingIndicator?: boolean

  editorFeatureIdentifier?: string
  noteType?: NoteType
}

const PlaintextFontSizeMapping: Record<EditorFontSize, string> = {
  ExtraSmall: 'text-xs',
  Small: 'text-sm',
  Normal: 'text-editor',
  Medium: 'text-lg',
  Large: 'text-xl',
}

class NoteView extends PureComponent<NoteViewProps, State> {
  readonly controller!: NoteViewController

  private statusTimeout?: NodeJS.Timeout
  private lastEditorFocusEventSource?: EditorEventSource
  onEditorComponentLoad?: () => void

  private scrollPosition = 0
  private removeTrashKeyObserver?: () => void
  private removeTabObserver?: () => void
  private removeComponentStreamObserver?: () => void
  private removeComponentManagerObserver?: () => void
  private removeInnerNoteObserver?: () => void

  private protectionTimeoutId: ReturnType<typeof setTimeout> | null = null

  private noteViewElementRef: RefObject<HTMLDivElement>
  private editorContentRef: RefObject<HTMLDivElement>

  constructor(props: NoteViewProps) {
    super(props, props.application)

    this.controller = props.controller

    this.onEditorComponentLoad = () => {
      this.application.getDesktopService()?.redoSearch()
    }

    this.debounceReloadEditorComponent = debounce(this.debounceReloadEditorComponent.bind(this), 25)

    this.textAreaChangeDebounceSave = debounce(this.textAreaChangeDebounceSave, TextareaDebounce)

    this.state = {
      availableStackComponents: [],
      editorStateDidLoad: false,
      editorText: '',
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
      textareaUnloading: false,
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

    this.removeTabObserver?.()
    this.removeTabObserver = undefined
    this.onEditorComponentLoad = undefined

    this.statusTimeout = undefined
    ;(this.onPanelResizeFinish as unknown) = undefined
    ;(this.dismissProtectedWarning as unknown) = undefined
    ;(this.editorComponentViewerRequestsReload as unknown) = undefined
    ;(this.onTextAreaChange as unknown) = undefined
    ;(this.onTitleEnter as unknown) = undefined
    ;(this.onTitleChange as unknown) = undefined
    ;(this.onContentFocus as unknown) = undefined
    ;(this.onPanelResizeFinish as unknown) = undefined
    ;(this.stackComponentExpanded as unknown) = undefined
    ;(this.toggleStackComponent as unknown) = undefined
    ;(this.setScrollPosition as unknown) = undefined
    ;(this.resetScrollPosition as unknown) = undefined
    ;(this.onSystemEditorLoad as unknown) = undefined
    ;(this.debounceReloadEditorComponent as unknown) = undefined
    ;(this.textAreaChangeDebounceSave as unknown) = undefined
    ;(this.editorContentRef as unknown) = undefined
  }

  getState() {
    return this.state as State
  }

  get note() {
    return this.controller.item
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
        this.focusTitle()
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
    if (note.uuid !== this.note.uuid) {
      throw Error('Editor received changes for non-current note')
    }

    let title = this.state.editorTitle,
      text = this.state.editorText

    if (isPayloadSourceRetrieved(source)) {
      title = note.title
      text = note.text
    }

    if (!this.state.editorTitle) {
      title = note.title
    }

    if (!this.state.editorText) {
      text = note.text
    }

    if (title !== this.state.editorTitle) {
      this.setState({
        editorTitle: title,
      })
    }

    if (text !== this.state.editorText) {
      this.setState({
        editorText: text,
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

  dismissProtectedWarning = async () => {
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

  onTextAreaChange: ChangeEventHandler<HTMLTextAreaElement> = ({ currentTarget }) => {
    const text = currentTarget.value
    this.setState({
      editorText: text,
    })
    this.textAreaChangeDebounceSave()
  }

  textAreaChangeDebounceSave = () => {
    this.controller
      .save({
        editorValues: {
          title: this.state.editorTitle,
          text: this.state.editorText,
        },
        isUserModified: true,
      })
      .catch(console.error)
  }

  onTitleEnter: KeyboardEventHandler<HTMLInputElement> = ({ key, currentTarget }) => {
    if (key !== KeyboardKey.Enter) {
      return
    }

    currentTarget.blur()
    this.focusEditor()
  }

  onTitleChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    const title = currentTarget.value
    this.setState({
      editorTitle: title,
    })
    this.controller
      .save({
        editorValues: {
          title: title,
          text: this.state.editorText,
        },
        isUserModified: true,
        dontUpdatePreviews: true,
      })
      .catch(console.error)
  }

  focusEditor() {
    const element = document.getElementById(ElementIds.NoteTextEditor)
    if (element) {
      this.lastEditorFocusEventSource = EditorEventSource.Script
      element.focus()
    }
  }

  focusTitle() {
    document.getElementById(ElementIds.NoteTitleEditor)?.focus()
  }

  onContentFocus = () => {
    if (this.lastEditorFocusEventSource) {
      this.application.notifyWebEvent(WebAppEvent.EditorFocused, { eventSource: this.lastEditorFocusEventSource })
    }
    this.lastEditorFocusEventSource = undefined
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
            editorValues: {
              title: this.state.editorTitle,
              text: this.state.editorText,
            },
            bypassDebouncer: true,
            dontUpdatePreviews: true,
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
      this.setState({ textareaUnloading: true })
      this.setState({ textareaUnloading: false })
      reloadFont(this.state.monospaceFont)

      this.setState({
        spellcheck,
      })
    }
  }

  async reloadPreferences() {
    const monospaceFont = this.application.getPreference(
      PrefKey.EditorMonospaceEnabled,
      PrefDefaults[PrefKey.EditorMonospaceEnabled],
    )

    const marginResizersEnabled = this.application.getPreference(
      PrefKey.EditorResizersEnabled,
      PrefDefaults[PrefKey.EditorResizersEnabled],
    )

    const lineHeight = this.application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight])

    const fontSize = this.application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize])

    const updateSavingIndicator = this.application.getPreference(
      PrefKey.UpdateSavingStatusIndicator,
      PrefDefaults[PrefKey.UpdateSavingStatusIndicator],
    )

    await this.reloadSpellcheck()

    this.setState({
      monospaceFont,
      marginResizersEnabled,
      lineHeight,
      fontSize,
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

  /** @components */

  async reloadStackComponents() {
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
      modifiers: [KeyboardModifier.Meta],
      onKeyDown: () => {
        this.deleteNote(false).catch(console.error)
      },
    })
  }

  setScrollPosition = () => {
    const editor = document.getElementById(ElementIds.NoteTextEditor) as HTMLInputElement
    this.scrollPosition = editor.scrollTop
  }

  resetScrollPosition = () => {
    const editor = document.getElementById(ElementIds.NoteTextEditor) as HTMLInputElement
    editor.scrollTop = this.scrollPosition
  }

  onSystemEditorLoad = (ref: HTMLTextAreaElement | null) => {
    if (this.removeTabObserver || !ref) {
      return
    }
    /**
     * Insert 4 spaces when a tab key is pressed,
     * only used when inside of the text editor.
     * If the shift key is pressed first, this event is
     * not fired.
     */
    const editor = document.getElementById(ElementIds.NoteTextEditor) as HTMLInputElement

    if (!editor) {
      console.error('Editor is not yet mounted; unable to add tab observer.')
      return
    }

    this.removeTabObserver = this.application.io.addKeyObserver({
      element: editor,
      key: KeyboardKey.Tab,
      onKeyDown: (event) => {
        if (document.hidden || this.note.locked || event.shiftKey) {
          return
        }
        event.preventDefault()
        /** Using document.execCommand gives us undo support */
        const insertSuccessful = document.execCommand('insertText', false, '\t')
        if (!insertSuccessful) {
          /** document.execCommand works great on Chrome/Safari but not Firefox */
          const start = editor.selectionStart || 0
          const end = editor.selectionEnd || 0
          const spaces = '    '
          /** Insert 4 spaces */
          editor.value = editor.value.substring(0, start) + spaces + editor.value.substring(end)
          /** Place cursor 4 spaces away from where the tab key was pressed */
          editor.selectionStart = editor.selectionEnd = start + 4
        }
        this.setState({
          editorText: editor.value,
        })

        this.controller
          .save({
            editorValues: {
              title: this.state.editorTitle,
              text: this.state.editorText,
            },
            bypassDebouncer: true,
          })
          .catch(console.error)
      },
    })

    editor.addEventListener('scroll', this.setScrollPosition)
    editor.addEventListener('input', this.resetScrollPosition)

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const removedNodes = record.removedNodes.values()
        for (const node of removedNodes) {
          if (node === editor) {
            this.removeTabObserver?.()
            this.removeTabObserver = undefined
            editor.removeEventListener('scroll', this.setScrollPosition)
            editor.removeEventListener('scroll', this.resetScrollPosition)
            this.scrollPosition = 0
          }
        }
      }
    })

    observer.observe(editor.parentElement as HTMLElement, { childList: true })
  }

  ensureNoteIsInsertedBeforeUIAction = async () => {
    if (this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote()
    }
  }

  override render() {
    if (this.state.showProtectedWarning || !this.application.isAuthorizedToRenderItem(this.note)) {
      return (
        <ProtectedItemOverlay
          viewControllerManager={this.viewControllerManager}
          hasProtectionSources={this.application.hasProtectionSources()}
          onViewItem={this.dismissProtectedWarning}
          itemType={'note'}
        />
      )
    }

    return (
      <div
        aria-label="Note"
        className="section editor sn-component max-h-screen md:max-h-full"
        ref={this.noteViewElementRef}
      >
        {this.note && (
          <NoteViewFileDropTarget
            note={this.note}
            linkingController={this.viewControllerManager.linkingController}
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
              <div className="flex items-center gap-3">
                <LinkedItemsButton
                  filesController={this.viewControllerManager.filesController}
                  linkingController={this.viewControllerManager.linkingController}
                  onClickPreprocessing={this.ensureNoteIsInsertedBeforeUIAction}
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
            </div>
            <LinkedItemBubblesContainer linkingController={this.viewControllerManager.linkingController} />
          </div>
        )}

        <div
          id={ElementIds.EditorContent}
          className={`${ElementIds.EditorContent} z-editor-content`}
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

          {this.state.editorComponentViewer && (
            <div className="component-view">
              <ComponentView
                key={this.state.editorComponentViewer.identifier}
                componentViewer={this.state.editorComponentViewer}
                onLoad={this.onEditorComponentLoad}
                requestReload={this.editorComponentViewerRequestsReload}
                application={this.application}
              />
            </div>
          )}

          {this.state.editorStateDidLoad && !this.state.editorComponentViewer && !this.state.textareaUnloading && (
            <textarea
              autoComplete="off"
              dir="auto"
              id={ElementIds.NoteTextEditor}
              onChange={this.onTextAreaChange}
              onFocus={this.onContentFocus}
              readOnly={this.state.noteLocked}
              ref={(ref) => ref && this.onSystemEditorLoad(ref)}
              spellCheck={this.state.spellcheck}
              value={this.state.editorText}
              className={classNames(
                'editable font-editor flex-grow',
                this.state.lineHeight && `leading-${this.state.lineHeight.toLowerCase()}`,
                this.state.fontSize && PlaintextFontSizeMapping[this.state.fontSize],
              )}
            ></textarea>
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
