import { AppStateEventType } from '@Lib/ApplicationState'
import { ComponentLoadingError, ComponentManager } from '@Lib/ComponentManager'
import { isNullOrUndefined } from '@Lib/Utils'
import { ApplicationContext, SafeApplicationContext } from '@Root/ApplicationContext'
import { AppStackNavigationProp } from '@Root/AppStack'
import { SCREEN_COMPOSE } from '@Root/Screens/screens'
import SNTextView from '@standardnotes/react-native-textview'
import {
  ApplicationEvent,
  ComponentMutator,
  ComponentViewer,
  ContentType,
  isPayloadSourceInternalChange,
  isPayloadSourceRetrieved,
  ItemMutator,
  NoteMutator,
  NoteViewController,
  PayloadEmitSource,
  SNComponent,
  UuidString,
} from '@standardnotes/snjs'
import { ICON_ALERT, ICON_LOCK } from '@Style/Icons'
import { ThemeService, ThemeServiceContext } from '@Style/ThemeService'
import { lighten } from '@Style/Utils'
import React, { createRef } from 'react'
import { Keyboard, Platform, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from 'styled-components'
import { ComponentView } from './ComponentView'
import {
  Container,
  LoadingText,
  LoadingWebViewContainer,
  LockedContainer,
  LockedText,
  NoteTitleInput,
  StyledTextView,
  TextContainer,
  WebViewReloadButton,
  WebViewReloadButtonText,
} from './Compose.styled'

const NOTE_PREVIEW_CHAR_LIMIT = 80
const MINIMUM_STATUS_DURATION = 400
const SAVE_TIMEOUT_DEBOUNCE = 250
const SAVE_TIMEOUT_NO_DEBOUNCE = 100

type State = {
  title: string
  text: string
  saveError: boolean
  webViewError?: ComponentLoadingError
  webViewErrorDesc?: string
  loadingWebview: boolean
  downloadingEditor: boolean
  componentViewer?: ComponentViewer
}

type PropsWhenNavigating = AppStackNavigationProp<typeof SCREEN_COMPOSE>

type PropsWhenRenderingDirectly = {
  noteUuid: UuidString
}

const EditingIsDisabledText = 'This note has editing disabled. Please enable editing on this note to make changes.'

export class Compose extends React.Component<PropsWhenNavigating | PropsWhenRenderingDirectly, State> {
  static override contextType = ApplicationContext
  override context: React.ContextType<typeof ApplicationContext>
  controller: NoteViewController
  editorViewRef: React.RefObject<SNTextView> = createRef()
  saveTimeout: ReturnType<typeof setTimeout> | undefined
  alreadySaved = false
  statusTimeout: ReturnType<typeof setTimeout> | undefined
  downloadingMessageTimeout: ReturnType<typeof setTimeout> | undefined
  removeNoteInnerValueObserver?: () => void
  removeComponentsObserver?: () => void
  removeStreamComponents?: () => void
  removeStateEventObserver?: () => void
  removeAppEventObserver?: () => void
  removeComponentHandler?: () => void

  constructor(
    props: PropsWhenNavigating | PropsWhenRenderingDirectly,
    context: React.ContextType<typeof SafeApplicationContext>,
  ) {
    super(props)
    this.context = context

    const noteUuid = 'noteUuid' in props ? props.noteUuid : props.route.params.noteUuid
    const editor = this.context.editorGroup.itemControllers.find((c) => c.item.uuid === noteUuid) as NoteViewController
    if (!editor) {
      throw 'Unable to to find note controller'
    }

    this.controller = editor

    this.state = {
      title: this.controller.item.title,
      text: this.controller.item.text,
      componentViewer: undefined,
      saveError: false,
      webViewError: undefined,
      loadingWebview: false,
      downloadingEditor: false,
    }
  }

  override componentDidMount() {
    this.removeNoteInnerValueObserver = this.controller.addNoteInnerValueChangeObserver((note, source) => {
      if (isPayloadSourceRetrieved(source)) {
        this.setState({
          title: note.title,
          text: note.text,
        })
      }

      const isTemplateNoteInsertedToBeInteractableWithEditor = source === PayloadEmitSource.LocalInserted && note.dirty
      if (isTemplateNoteInsertedToBeInteractableWithEditor) {
        return
      }

      if (note.lastSyncBegan || note.dirty) {
        if (note.lastSyncEnd) {
          if (note.dirty || (note.lastSyncBegan && note.lastSyncBegan.getTime() > note.lastSyncEnd.getTime())) {
            this.showSavingStatus()
          } else if (
            this.context?.getStatusManager().hasMessage(SCREEN_COMPOSE) &&
            note.lastSyncBegan &&
            note.lastSyncEnd.getTime() > note.lastSyncBegan.getTime()
          ) {
            this.showAllChangesSavedStatus()
          }
        } else {
          this.showSavingStatus()
        }
      }
    })

    this.removeStreamComponents = this.context?.streamItems(ContentType.Component, async ({ source }) => {
      if (isPayloadSourceInternalChange(source)) {
        return
      }

      if (!this.controllerNote) {
        return
      }

      void this.reloadComponentEditorState()
    })

    this.removeAppEventObserver = this.context?.addEventObserver(async (eventName) => {
      if (!this.controller || this.controller.dealloced) {
        return
      }

      if (eventName === ApplicationEvent.CompletedFullSync) {
        /** if we're still dirty, don't change status, a sync is likely upcoming. */
        if (!this.controllerNote.dirty && this.state.saveError) {
          this.showAllChangesSavedStatus()
        }
      } else if (eventName === ApplicationEvent.FailedSync) {
        /**
         * Only show error status in editor if the note is dirty.
         * Otherwise, it means the originating sync came from somewhere else
         * and we don't want to display an error here.
         */
        if (this.controllerNote.dirty) {
          this.showErrorStatus('Sync Unavailable (changes saved offline)')
        }
      } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
        this.showErrorStatus('Offline Saving Issue (changes not saved)')
      }
    })

    this.removeStateEventObserver = this.context?.getAppState().addStateEventObserver((state) => {
      if (state === AppStateEventType.DrawerOpen) {
        this.dismissKeyboard()
        /**
         * Saves latest note state before any change might happen in the drawer
         */
      }
    })

    if (this.controller.isTemplateNote && Platform.OS === 'ios') {
      setTimeout(() => {
        this.editorViewRef?.current?.focus()
      }, 0)
    }
  }

  override componentWillUnmount() {
    this.dismissKeyboard()
    this.removeNoteInnerValueObserver && this.removeNoteInnerValueObserver()
    this.removeAppEventObserver && this.removeAppEventObserver()
    this.removeStreamComponents && this.removeStreamComponents()
    this.removeStateEventObserver && this.removeStateEventObserver()
    this.removeComponentHandler && this.removeComponentHandler()
    this.removeStateEventObserver = undefined
    this.removeNoteInnerValueObserver = undefined
    this.removeComponentHandler = undefined
    this.removeStreamComponents = undefined
    this.removeAppEventObserver = undefined
    this.context?.getStatusManager()?.setMessage(SCREEN_COMPOSE, '')
    if (this.state.componentViewer && this.componentManager) {
      this.componentManager.destroyComponentViewer(this.state.componentViewer)
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout)
    }
    if (this.downloadingMessageTimeout) {
      clearTimeout(this.downloadingMessageTimeout)
    }
  }

  /**
   * Because note.locked accesses note.content.appData,
   * we do not want to expose the template to direct access to note.locked,
   * otherwise an exception will occur when trying to access note.locked if the note
   * is deleted. There is potential for race conditions to occur with setState, where a
   * previous setState call may have queued a digest cycle, and the digest cycle triggers
   * on a deleted note.
   */
  get noteLocked() {
    if (!this.controllerNote) {
      return false
    }
    return this.controllerNote.locked
  }

  setStatus = (status: string, color?: string, wait = true) => {
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout)
    }
    if (wait) {
      this.statusTimeout = setTimeout(() => {
        this.context?.getStatusManager()?.setMessage(SCREEN_COMPOSE, status, color)
      }, MINIMUM_STATUS_DURATION)
    } else {
      this.context?.getStatusManager()?.setMessage(SCREEN_COMPOSE, status, color)
    }
  }

  showSavingStatus = () => {
    this.setStatus('Saving...', undefined, false)
  }

  showAllChangesSavedStatus = () => {
    this.setState({
      saveError: false,
    })
    const offlineStatus = this.context?.hasAccount() ? '' : ' (offline)'
    this.setStatus('All changes saved' + offlineStatus)
  }

  showErrorStatus = (message: string) => {
    this.setState({
      saveError: true,
    })
    this.setStatus(message)
  }

  get controllerNote() {
    return this.controller.item
  }

  dismissKeyboard = () => {
    Keyboard.dismiss()
    this.editorViewRef.current?.blur()
  }

  get componentManager() {
    return this.context?.mobileComponentManager as ComponentManager
  }

  async associateComponentWithCurrentNote(component: SNComponent) {
    const note = this.controllerNote
    if (!note) {
      return
    }
    return this.context?.mutator.changeItem(component, (m: ItemMutator) => {
      const mutator = m as ComponentMutator
      mutator.removeDisassociatedItemId(note.uuid)
      mutator.associateWithItem(note.uuid)
    })
  }

  reloadComponentEditorState = async () => {
    this.setState({
      downloadingEditor: false,
      loadingWebview: false,
      webViewError: undefined,
    })

    const associatedEditor = this.componentManager.editorForNote(this.controllerNote)

    /** Editors cannot interact with template notes so the note must be inserted */
    if (associatedEditor && this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote()
      void this.associateComponentWithCurrentNote(associatedEditor)
    }

    if (!associatedEditor) {
      if (this.state.componentViewer) {
        this.componentManager.destroyComponentViewer(this.state.componentViewer)
        this.setState({ componentViewer: undefined })
      }
    } else if (associatedEditor.uuid !== this.state.componentViewer?.component.uuid) {
      if (this.state.componentViewer) {
        this.componentManager.destroyComponentViewer(this.state.componentViewer)
      }
      if (this.componentManager.isComponentThirdParty(associatedEditor.identifier)) {
        await this.componentManager.preloadThirdPartyIndexPathFromDisk(associatedEditor.identifier)
      }
      this.loadComponentViewer(associatedEditor)
    }
  }

  loadComponentViewer(component: SNComponent) {
    this.setState({
      componentViewer: this.componentManager.createComponentViewer(component, this.controllerNote.uuid),
    })
  }

  async forceReloadExistingEditor() {
    if (this.state.componentViewer) {
      this.componentManager.destroyComponentViewer(this.state.componentViewer)
    }

    this.setState({
      componentViewer: undefined,
      loadingWebview: false,
      webViewError: undefined,
    })

    const associatedEditor = this.componentManager.editorForNote(this.controllerNote)
    if (associatedEditor) {
      this.loadComponentViewer(associatedEditor)
    }
  }

  saveNote = async (params: { newTitle?: string; newText?: string }) => {
    if (this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote()
    }

    if (!this.context?.items.findItem(this.controllerNote.uuid)) {
      void this.context?.alertService.alert('Attempting to save this note has failed. The note cannot be found.')
      return
    }

    const { newTitle, newText } = params

    await this.context.mutator.changeItem(
      this.controllerNote,
      (mutator) => {
        const noteMutator = mutator as NoteMutator

        if (newTitle != null) {
          noteMutator.title = newTitle
        }

        if (newText != null) {
          noteMutator.text = newText

          const substring = newText.substring(0, NOTE_PREVIEW_CHAR_LIMIT)
          const shouldTruncate = newText.length > NOTE_PREVIEW_CHAR_LIMIT
          const previewPlain = substring + (shouldTruncate ? '...' : '')
          noteMutator.preview_plain = previewPlain
          noteMutator.preview_html = undefined
        }
      },
      true,
    )

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    const noDebounce = this.context?.noAccount()
    const syncDebouceMs = noDebounce ? SAVE_TIMEOUT_NO_DEBOUNCE : SAVE_TIMEOUT_DEBOUNCE

    this.saveTimeout = setTimeout(() => {
      void this.context?.sync.sync()
    }, syncDebouceMs)
  }

  onTitleChange = (newTitle: string) => {
    if (this.controllerNote.locked) {
      void this.context?.alertService?.alert(EditingIsDisabledText)
      return
    }

    this.setState(
      {
        title: newTitle,
      },
      () => this.saveNote({ newTitle: newTitle }),
    )
  }

  onContentChange = (text: string) => {
    if (this.controllerNote.locked) {
      void this.context?.alertService?.alert(EditingIsDisabledText)
      return
    }

    void this.saveNote({ newText: text })
  }

  onLoadWebViewStart = () => {
    this.setState({
      loadingWebview: true,
      webViewError: undefined,
    })
  }

  onLoadWebViewEnd = () => {
    this.setState({
      loadingWebview: false,
    })
  }

  onLoadWebViewError = (error: ComponentLoadingError, desc?: string) => {
    this.setState({
      loadingWebview: false,
      webViewError: error,
      webViewErrorDesc: desc,
    })
  }

  onDownloadEditorStart = () => {
    this.setState({
      downloadingEditor: true,
    })
  }

  onDownloadEditorEnd = () => {
    if (this.downloadingMessageTimeout) {
      clearTimeout(this.downloadingMessageTimeout)
    }

    this.downloadingMessageTimeout = setTimeout(
      () =>
        this.setState({
          downloadingEditor: false,
        }),
      this.state.webViewError ? 0 : 200,
    )
  }

  getErrorText(): string {
    let text = ''
    switch (this.state.webViewError) {
      case ComponentLoadingError.ChecksumMismatch:
        text = 'The remote editor signature differs from the expected value.'
        break
      case ComponentLoadingError.DoesntExist:
        text = 'The local editor files do not exist.'
        break
      case ComponentLoadingError.FailedDownload:
        text = 'The editor failed to download.'
        break
      case ComponentLoadingError.LocalServerFailure:
        text = 'The local component server has an error.'
        break
      case ComponentLoadingError.Unknown:
        text = 'An unknown error occurred.'
        break
      default:
        break
    }

    if (this.state.webViewErrorDesc) {
      text += `Webview Error: ${this.state.webViewErrorDesc}`
    }

    return text
  }

  override render() {
    const shouldDisplayEditor =
      this.state.componentViewer &&
      Boolean(this.controllerNote) &&
      !this.controllerNote.prefersPlainEditor &&
      !this.state.webViewError

    return (
      <Container>
        <ThemeContext.Consumer>
          {(theme) => (
            <>
              {this.noteLocked && (
                <LockedContainer>
                  <Icon name={ThemeService.nameForIcon(ICON_LOCK)} size={16} color={theme.stylekitBackgroundColor} />
                  <LockedText>Note Editing Disabled</LockedText>
                </LockedContainer>
              )}
              {this.state.webViewError && (
                <LockedContainer>
                  <Icon name={ThemeService.nameForIcon(ICON_ALERT)} size={16} color={theme.stylekitBackgroundColor} />
                  <LockedText>
                    Unable to load {this.state.componentViewer?.component.name} — {this.getErrorText()}
                  </LockedText>
                  <WebViewReloadButton
                    onPress={() => {
                      void this.forceReloadExistingEditor()
                    }}
                  >
                    <WebViewReloadButtonText>Reload</WebViewReloadButtonText>
                  </WebViewReloadButton>
                </LockedContainer>
              )}
              <ThemeServiceContext.Consumer>
                {(themeService) => (
                  <>
                    <NoteTitleInput
                      testID="noteTitleField"
                      onChangeText={this.onTitleChange}
                      value={this.state.title}
                      placeholder={'Add Title'}
                      selectionColor={theme.stylekitInfoColor}
                      underlineColorAndroid={'transparent'}
                      placeholderTextColor={theme.stylekitNeutralColor}
                      keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
                      autoCorrect={true}
                      autoCapitalize={'sentences'}
                    />
                    {(this.state.downloadingEditor ||
                      (this.state.loadingWebview && themeService?.isLikelyUsingDarkColorTheme())) && (
                      <LoadingWebViewContainer locked={this.noteLocked}>
                        <LoadingText>
                          {'Loading '}
                          {this.state.componentViewer?.component.name}...
                        </LoadingText>
                      </LoadingWebViewContainer>
                    )}
                    {/* setting webViewError to false on onLoadEnd will cause an infinite loop on Android upon webview error, so, don't do that. */}
                    {shouldDisplayEditor && this.state.componentViewer && (
                      <ComponentView
                        key={this.state.componentViewer?.identifier}
                        componentViewer={this.state.componentViewer}
                        onLoadStart={this.onLoadWebViewStart}
                        onLoadEnd={this.onLoadWebViewEnd}
                        onLoadError={this.onLoadWebViewError}
                        onDownloadEditorStart={this.onDownloadEditorStart}
                        onDownloadEditorEnd={this.onDownloadEditorEnd}
                      />
                    )}

                    {!shouldDisplayEditor && !isNullOrUndefined(this.controllerNote) && Platform.OS === 'android' && (
                      <TextContainer>
                        <StyledTextView
                          testID="noteContentField"
                          ref={this.editorViewRef}
                          autoFocus={false}
                          value={this.state.text}
                          selectionColor={lighten(theme.stylekitInfoColor, 0.35)}
                          handlesColor={theme.stylekitInfoColor}
                          onChangeText={this.onContentChange}
                          errorState={false}
                        />
                      </TextContainer>
                    )}
                    {/* Empty wrapping view fixes native textview crashing */}
                    {!shouldDisplayEditor && Platform.OS === 'ios' && (
                      <View key={this.controllerNote.uuid}>
                        <StyledTextView
                          testID="noteContentField"
                          ref={this.editorViewRef}
                          autoFocus={false}
                          multiline
                          value={this.state.text}
                          keyboardDismissMode={'interactive'}
                          keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
                          selectionColor={lighten(theme.stylekitInfoColor)}
                          onChangeText={this.onContentChange}
                          editable={!this.noteLocked}
                          errorState={!!this.state.webViewError}
                        />
                      </View>
                    )}
                  </>
                )}
              </ThemeServiceContext.Consumer>
            </>
          )}
        </ThemeContext.Consumer>
      </Container>
    )
  }
}
