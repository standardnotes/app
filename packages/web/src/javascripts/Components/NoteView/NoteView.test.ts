/**
 * @jest-environment jsdom
 */

import { WebApplication } from '@/Application/WebApplication'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import {
  ApplicationEvent,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
  SNNote,
  NoteType,
  PayloadEmitSource,
  VaultServiceInterface,
} from '@standardnotes/snjs'
import NoteView from './NoteView'
import { NoteViewController } from './Controller/NoteViewController'

describe('NoteView', () => {
  let noteViewController: NoteViewController
  let application: WebApplication

  let notesController: NotesController
  let vaults: VaultServiceInterface

  const createNoteView = () =>
    new NoteView({
      controller: noteViewController,
      application,
    })

  beforeEach(() => {
    jest.useFakeTimers()

    noteViewController = {} as jest.Mocked<NoteViewController>

    notesController = {} as jest.Mocked<NotesController>
    notesController.setShowProtectedWarning = jest.fn()
    notesController.getSpellcheckStateForNote = jest.fn()
    notesController.getEditorWidthForNote = jest.fn()

    vaults = {} as jest.Mocked<VaultServiceInterface>
    vaults.getItemVault = jest.fn().mockReturnValue(undefined)

    application = {
      notesController,
      noteViewController,
      vaults,
    } as unknown as jest.Mocked<WebApplication>

    application.hasProtectionSources = jest.fn().mockReturnValue(true)
    application.authorizeNoteAccess = jest.fn()
    application.addWebEventObserver = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('note is protected', () => {
    it("should hide the note if at the time of the session expiration the note wasn't edited for longer than the allowed idle time", async () => {
      const secondsElapsedSinceLastEdit = ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction + 5

      noteViewController.item = {
        protected: true,
        userModifiedDate: new Date(Date.now() - secondsElapsedSinceLastEdit * 1000),
      } as jest.Mocked<SNNote>

      await createNoteView().onAppEvent(ApplicationEvent.UnprotectedSessionExpired)

      expect(notesController.setShowProtectedWarning).toHaveBeenCalledWith(true)
    })

    it('should postpone the note hiding by correct time if the time passed after its last modification is less than the allowed idle time', async () => {
      const secondsElapsedSinceLastEdit = ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction - 3

      noteViewController.item = {
        protected: true,
        userModifiedDate: new Date(Date.now() - secondsElapsedSinceLastEdit * 1000),
      } as jest.Mocked<SNNote>

      await createNoteView().onAppEvent(ApplicationEvent.UnprotectedSessionExpired)

      const secondsAfterWhichTheNoteShouldHide =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction - secondsElapsedSinceLastEdit

      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000)

      expect(notesController.setShowProtectedWarning).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1 * 1000)

      expect(notesController.setShowProtectedWarning).toHaveBeenCalledWith(true)
    })

    it('should postpone the note hiding by correct time if the user continued editing it even after the protection session has expired', async () => {
      const secondsElapsedSinceLastModification = 3

      noteViewController.item = {
        protected: true,
        userModifiedDate: new Date(Date.now() - secondsElapsedSinceLastModification * 1000),
      } as jest.Mocked<SNNote>

      await createNoteView().onAppEvent(ApplicationEvent.UnprotectedSessionExpired)

      let secondsAfterWhichTheNoteShouldHide =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction - secondsElapsedSinceLastModification
      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000)

      noteViewController.item = {
        protected: true,
        userModifiedDate: new Date(),
      } as jest.Mocked<SNNote>

      secondsAfterWhichTheNoteShouldHide = ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction
      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000)
      expect(notesController.setShowProtectedWarning).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1 * 1000)
      expect(notesController.setShowProtectedWarning).toHaveBeenCalledWith(true)
    })
  })

  describe('note is unprotected', () => {
    it('should not call any hiding logic', async () => {
      noteViewController.item = {
        protected: false,
      } as jest.Mocked<SNNote>

      await createNoteView().onAppEvent(ApplicationEvent.UnprotectedSessionExpired)

      expect(notesController.setShowProtectedWarning).not.toHaveBeenCalled()
    })
  })

  describe('editors', () => {
    it('should reload editor if noteType changes', async () => {
      noteViewController.item = {
        noteType: NoteType.Code,
      } as jest.Mocked<SNNote>

      const view = createNoteView()
      view.reloadEditorComponent = jest.fn()
      view.setState = jest.fn()

      const changedItem = {
        noteType: NoteType.Plain,
      } as jest.Mocked<SNNote>
      view.onNoteInnerChange(changedItem, PayloadEmitSource.LocalChanged)

      expect(view.reloadEditorComponent).toHaveBeenCalled()
    })

    it('should reload editor if editorIdentifier changes', async () => {
      noteViewController.item = {
        editorIdentifier: 'foo',
      } as jest.Mocked<SNNote>

      const view = createNoteView()
      view.reloadEditorComponent = jest.fn()
      view.setState = jest.fn()

      const changedItem = {
        editorIdentifier: 'bar',
      } as jest.Mocked<SNNote>
      view.onNoteInnerChange(changedItem, PayloadEmitSource.LocalChanged)

      expect(view.reloadEditorComponent).toHaveBeenCalled()
    })
  })

  describe('dismissProtectedWarning', () => {
    beforeEach(() => {
      noteViewController.item = {
        protected: false,
      } as jest.Mocked<SNNote>
    })

    describe('the note has protection sources', () => {
      it('should reveal note contents if the authorization has been passed', async () => {
        application.authorizeNoteAccess = jest.fn().mockReturnValue(true)

        const noteView = new NoteView({
          controller: noteViewController,
          application,
        })

        await noteView.authorizeAndDismissProtectedWarning()

        expect(notesController.setShowProtectedWarning).toHaveBeenCalledWith(false)
      })

      it('should not reveal note contents if the authorization has not been passed', async () => {
        application.authorizeNoteAccess = jest.fn().mockReturnValue(false)

        const noteView = new NoteView({
          controller: noteViewController,
          application,
        })

        await noteView.authorizeAndDismissProtectedWarning()

        expect(notesController.setShowProtectedWarning).not.toHaveBeenCalled()
      })
    })

    describe('the note does not have protection sources', () => {
      it('should reveal note contents', async () => {
        application.hasProtectionSources = jest.fn().mockReturnValue(false)

        const noteView = new NoteView({
          controller: noteViewController,
          application,
        })

        await noteView.authorizeAndDismissProtectedWarning()

        expect(notesController.setShowProtectedWarning).toHaveBeenCalledWith(false)
      })
    })
  })
})
