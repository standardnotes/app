import { ApplicationViewCtrl } from './application_view';
import { ApplicationEvent, SNNote, UuidString } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { NotesState } from '@/ui_models/app_state/notes_state';
import { DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING } from '@Views/constants';
import { Editor } from '@/ui_models/editor';
import { AppState } from '@/ui_models/app_state';

describe('application-view', () => {
  let ctrl: ApplicationViewCtrl;

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  const activeEditor = {
    reset: async () => Promise.resolve({}),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setNote: () => {
    }
  };

  const firstProtectedNoteInitialValue = {
    uuid: 'protected-note-1',
    protected: true,
    userModifiedDate: new Date(Date.now() - (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING + 1) * 1000)
  };
  const secondProtectedNoteInitialValue = {
    uuid: 'protected-note-2',
    protected: true,
    userModifiedDate: new Date()
  };
  const firstUnprotectedNoteInitialValue = {
    uuid: 'unprotected-note-1',
    protected: false,
    userModifiedDate: new Date()
  };

  const notes = [{
    ...firstProtectedNoteInitialValue
  }, {
    ...firstUnprotectedNoteInitialValue
  }, {
    ...secondProtectedNoteInitialValue
  }];

  const selectedProtectedNote = {
    [firstProtectedNoteInitialValue.uuid]: { ...firstProtectedNoteInitialValue }
  };

  const selectedNotesInitialValue = {
    ...selectedProtectedNote
  } as unknown as Record<UuidString, SNNote>;

  const mockedAppState = {
    notes: {
      selectedNotes: { ...selectedNotesInitialValue },

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      selectNote: () => {
      },
      unselectNotesByUuids: async (_uuids: UuidString[]) => {
        return Promise.resolve();
      }
    } as unknown as NotesState,
    getActiveEditor: () => {
      return activeEditor as unknown as Editor;
    }
  };

  beforeAll(() => {
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    // window.setTimeout = jest.fn();
  });

  afterAll(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  beforeEach(() => {
    const $location = {} as jest.Mocked<any>; // TODO: fix `any`
    const $rootScope = {} as jest.Mocked<any>; // TODO: fix `any`
    const $timeout = {} as jest.Mocked<ng.ITimeoutService>;

    ctrl = new ApplicationViewCtrl($location, $rootScope, $timeout);

    // TODO: maybe move the below object to `__mocks__` and overwrite in tests what's necessary
    ctrl.application = {
      getProtectionSessionExpiryDate: () => new Date(Date.now() - 1 * 1000),
      getAppState: () => {
        return mockedAppState;
      },
      authorizeNoteAccess: async (note: SNNote) => {
        return Promise.resolve(true);
      }
    } as WebApplication;
  });

  afterEach(() => {
    ctrl.deinit();
  });

  describe('protection session expired', () => {
    describe('the time passed after the note was edited last time exceeds the allowed idle time', () => {
      // TODO: if `authorizeNoteAccessSpy` is used only in one test, then move it to that test
      let authorizeNoteAccessSpy: jest.SpyInstance;
      beforeEach(() => {
        authorizeNoteAccessSpy = jest.spyOn(ctrl.application, 'authorizeNoteAccess');
      });

      it('should reset editor contents', async () => {
        const resetEditorSpy = jest.spyOn(activeEditor, 'reset');
        await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

        expect(resetEditorSpy).toHaveBeenCalled();
      });

      it('should show session expiration popup', async () => {
        await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

        expect(authorizeNoteAccessSpy).toHaveBeenCalled();
      });

      describe('a single protected note is selected', () => {
        it('should restore note contents in the editor if user correctly entered their credentials in the popup', async () => {
          const appState = ctrl.application.getAppState();
          const unselectNotesByUuidsSpy = jest.spyOn(appState.notes, 'unselectNotesByUuids');
          const setNoteSpy = jest.spyOn(activeEditor, 'setNote');
          jest.spyOn(ctrl.application, 'authorizeNoteAccess').mockImplementation(() => Promise.resolve(true));

          await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

          expect(setNoteSpy).toHaveBeenCalled();
          expect(unselectNotesByUuidsSpy).not.toHaveBeenCalled();
        });

        describe('user entered incorrect credentials in the popup or closed it', () => {
          beforeEach(() => {
            jest.spyOn(ctrl.application, 'authorizeNoteAccess').mockImplementation(() => Promise.resolve(false));
          });

          it('should not restore note contents in the editor', async () => {
            const setNoteSpy = jest.spyOn(activeEditor, 'setNote');
            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            expect(setNoteSpy).not.toHaveBeenCalled();
          });

          it('should unselect the protected note', async () => {
            const unselectNotesByUuidsSpy = jest.spyOn(mockedAppState.notes, 'unselectNotesByUuids');

            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            expect(unselectNotesByUuidsSpy).toHaveBeenCalledWith([firstProtectedNoteInitialValue.uuid]);
          });
        });
      });

      describe('multiple notes are selected', () => {
        describe('user entered incorrect credentials in the popup or closed it', () => {
          it('should unselect the protected notes', async () => {
            jest.spyOn(ctrl.application, 'authorizeNoteAccess').mockImplementation(() => Promise.resolve(false));

            const appState = ctrl.application.getAppState();
            appState.notes.selectedNotes[firstUnprotectedNoteInitialValue.uuid] = firstUnprotectedNoteInitialValue as SNNote;
            appState.notes.selectedNotes[secondProtectedNoteInitialValue.uuid] = secondProtectedNoteInitialValue as SNNote;
            const unselectNotesByUuidsSpy = jest.spyOn(appState.notes, 'unselectNotesByUuids');

            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            expect(unselectNotesByUuidsSpy).toHaveBeenCalledWith([firstProtectedNoteInitialValue.uuid, secondProtectedNoteInitialValue.uuid]);

            appState.notes.selectedNotes = { ...selectedNotesInitialValue };
          });
        });
      });
    });

    describe('the time passed after the note was edited last time doesn\'t exceed the allowed idle time', () => {
      let appState: AppState;
      let authorizeNoteAccessSpy: jest.SpyInstance;

      beforeEach(() => {
        // To handle `setTimeout`-related stuff correctly
        jest.useFakeTimers();

        appState = ctrl.application.getAppState();
        appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid] = {
          ...appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid],
          userModifiedDate: new Date(Date.now() - (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - 1) * 1000)
          // userModifiedDate: new Date(Date.now() - (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING + 1) * 1000)
        } as SNNote;
        authorizeNoteAccessSpy = jest.spyOn(ctrl.application, 'authorizeNoteAccess');
      });
      afterEach(() => {
        appState.notes.selectedNotes = {...selectedNotesInitialValue};
        jest.useRealTimers();
      });

      it('should not show the session expiration popup', async () => {
        await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

        expect(authorizeNoteAccessSpy).not.toHaveBeenCalled();
      });

      it ('should postpone the session expiration popup for a dynamically calculated time', async () => {
        const handleProtectionExpirationSpy = jest.spyOn(ctrl, 'handleProtectionExpiration');

        await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

        expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(0);

        // TODO: probably need to handle each case from `getSecondsUntilNextCheck()` method.
        jest.advanceTimersByTime(DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING * 1000);

        expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
