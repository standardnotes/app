import { ApplicationViewCtrl } from './application_view';
import { ApplicationEvent, ProtectionSessionDurations, SNNote, UuidString } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { NotesState } from '@/ui_models/app_state/notes_state';
import { DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING } from '@Views/constants';
import { Editor } from '@/ui_models/editor';
import { AppState } from '@/ui_models/app_state';
import { ILocationService, IRootScopeService } from 'angular';

describe('application-view', () => {
  let ctrl: ApplicationViewCtrl;
  let appState: AppState;

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

  const selectedProtectedNote = {
    [firstProtectedNoteInitialValue.uuid]: { ...firstProtectedNoteInitialValue }
  };

  const selectedNotesInitialValue = {
    ...selectedProtectedNote
  } as unknown as Record<UuidString, SNNote>;

   const mockedAppState = {
     notes: {
       selectedNotes: { ...selectedNotesInitialValue },
       selectedProtectedNoteAccessDuration: ProtectionSessionDurations[1].valueInSeconds,
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

  beforeEach(() => {
    const $location = {} as jest.Mocked<ILocationService>;
    const $rootScope = {} as jest.Mocked<IRootScopeService>;
    const $timeout = {} as jest.Mocked<ng.ITimeoutService>;

    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();

    ctrl = new ApplicationViewCtrl($location, $rootScope, $timeout);

    ctrl.application = {
      getProtectionSessionExpiryDate: () => new Date(Date.now() - 1 * 1000),
      getAppState: () => {
        return {...mockedAppState};
      },
      authorizeNoteAccess: async (_note: SNNote) => {
        return Promise.resolve(true);
      }
    } as WebApplication;
  });

  beforeEach(() => {
    appState = ctrl.application.getAppState();
  });

  afterEach(() => {
    appState.notes.selectedNotes = { ...selectedNotesInitialValue };
    appState.notes.selectedProtectedNoteAccessDuration = ProtectionSessionDurations[1].valueInSeconds;
  });

  afterEach(() => {
    ctrl.deinit();

    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  describe('protection session expired', () => {
    describe('the time passed after the note modification date exceeds the allowed idle time', () => {
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
            const unselectNotesByUuidsSpy = jest.spyOn(appState.notes, 'unselectNotesByUuids');
            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            expect(unselectNotesByUuidsSpy).toHaveBeenCalledWith([firstProtectedNoteInitialValue.uuid]);
          });
        });
      });

      describe('multiple notes are selected', () => {
        describe('user entered incorrect credentials in the popup or closed it', () => {
          it('should unselect the protected notes', async () => {
            jest.spyOn(ctrl.application, 'authorizeNoteAccess').mockImplementation(() => Promise.resolve(false));

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

    describe('the note last modification date doesn\'t exceed the allowed idle time', () => {
      let authorizeNoteAccessSpy: jest.SpyInstance;
      let handleProtectionExpirationSpy: jest.SpyInstance;

      beforeEach(() => {
        authorizeNoteAccessSpy = jest.spyOn(ctrl.application, 'authorizeNoteAccess');
        // For handling `setTimeout`-related stuff correctly
        jest.useFakeTimers();

        handleProtectionExpirationSpy = jest.spyOn(ctrl, 'handleProtectionExpiration');
      });

      beforeEach(() => {
        appState = ctrl.application.getAppState();
        authorizeNoteAccessSpy = jest.spyOn(ctrl.application, 'authorizeNoteAccess');
      });

      afterEach(() => {
        appState.notes.selectedNotes = { ...selectedNotesInitialValue };
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should not show the session expiration popup', async () => {
        appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid] = {
          ...appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid],
          userModifiedDate: new Date(Date.now() - (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - 1) * 1000)
        } as SNNote;

        await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

        expect(authorizeNoteAccessSpy).not.toHaveBeenCalled();
      });

      describe('protection session duration is set to `0` ("Don\'t Remember" option) by the user', () => {
        it('should show session expiration dialog after the default postpone duration', async () => {
          appState.notes.selectedProtectedNoteAccessDuration = ProtectionSessionDurations[0].valueInSeconds;

          await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

          jest.advanceTimersByTime((DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - 1) * 1000);
          expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(0);

          jest.advanceTimersByTime(1 * 1000);
          expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(1);
        });
      });

      describe('protection session duration is set to other than "Don\'t Remember" option', () => {
        describe('postpone showing the expiration dialog by correct time', () => {
          it('should show expiration dialog correctly if the protected note was modified before the session has expired', async () => {
            const currentDateTimestamp = Date.now();
            const secondsBetweenNoteLastModificationAndSessionExpiration = 3;
            appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid] = {
              ...appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid],
              userModifiedDate: new Date(currentDateTimestamp - secondsBetweenNoteLastModificationAndSessionExpiration * 1000)
            } as SNNote;
            ctrl.application.getProtectionSessionExpiryDate = () => new Date(currentDateTimestamp - (secondsBetweenNoteLastModificationAndSessionExpiration - 1) * 1000);

            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            const protectionSessionExpiryDateTimestamp = ctrl.application.getProtectionSessionExpiryDate().getTime();
            const secondsBeforeShowingExpirationDialog = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - (
              protectionSessionExpiryDateTimestamp - appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid].userModifiedDate.getTime()
            ) / 1000;

            jest.advanceTimersByTime((secondsBeforeShowingExpirationDialog - 1) * 1000);
            expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(0);

            jest.advanceTimersByTime(1 * 1000);
            expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(1);
          });

          it('should show expiration dialog correctly if the protected note was modified after the session expiration', async () => {
            const currentDateTimestamp = Date.now();
            appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid] = {
              ...appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid],
              userModifiedDate: new Date(currentDateTimestamp - (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - 2) * 1000)
            } as SNNote;
            ctrl.application.getProtectionSessionExpiryDate = () => new Date(
              currentDateTimestamp - (2 * DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING) * 1000
            );

            await ctrl.onAppEvent(ApplicationEvent.ProtectionSessionExpiryDateChanged);

            const secondsBeforeShowingExpirationDialog = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - (
              (currentDateTimestamp - appState.notes.selectedNotes[firstProtectedNoteInitialValue.uuid].userModifiedDate.getTime()) / 1000
            );

            jest.advanceTimersByTime((secondsBeforeShowingExpirationDialog - 1) * 1000);
            expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(0);

            jest.advanceTimersByTime(1 * 1000 + 1);
            expect(handleProtectionExpirationSpy).toHaveBeenCalledTimes(1);
          });
        });
      });
    });
  });
});
