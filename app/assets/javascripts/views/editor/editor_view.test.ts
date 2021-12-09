/**
 * @jest-environment jsdom
 */

import { EditorViewCtrl } from '@Views/editor/editor_view';
import {
  ApplicationEvent,
  DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING,
} from '@standardnotes/snjs/';

describe('editor-view', () => {
  let ctrl: EditorViewCtrl;

  beforeEach(() => {
    const $timeout = {} as jest.Mocked<ng.ITimeoutService>;
    ctrl = new EditorViewCtrl($timeout);

    Object.defineProperties(ctrl, {
      application: {
        value: {
          getAppState: () => {
            return {
              notes: {
                setShowProtectedWarning: jest.fn(),
              },
            };
          },
        },
      },
      removeComponentsObserver: {
        value: jest.fn(),
        writable: true,
      },
      removeTrashKeyObserver: {
        value: jest.fn(),
        writable: true,
      },
      unregisterComponent: {
        value: jest.fn(),
        writable: true,
      },
      editor: {
        value: {
          clearNoteChangeListener: jest.fn(),
        },
      },
    });
  });
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    ctrl.deinit();
  });

  describe('note is protected', () => {
    beforeEach(() => {
      Object.defineProperty(ctrl, 'note', {
        value: {
          protected: true,
        },
      });
    });

    describe('protection remembrance duration in authentication modal is set to "Don\'t remember" and the note is opened', () => {
      const protectionDuration = 0;
      let setShowProtectedWarningSpy: jest.SpyInstance;

      beforeEach(() => {
        setShowProtectedWarningSpy = jest.spyOn(
          ctrl,
          'setShowProtectedWarning'
        );

        Object.defineProperties(ctrl.application, {
          getIsProtectionRemembranceSelectionDontRemember: {
            value: jest.fn().mockImplementation(() => true),
          },
          getProtectionSessionExpiryDate: {
            value: jest
              .fn()
              .mockImplementation(() => new Date(Date.now() - 2 * 1000)),
            configurable: true,
          },
        });
        Object.defineProperty(ctrl.note, 'userModifiedDate', {
          value: new Date(
            Date.now() -
              10 * DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING * 1000
          ),
          configurable: true,
        });
      });

      it('should postpone note hiding by predefined time to allow note editing', async () => {
        const setTimerForNoteProtectionSpy = jest.spyOn(
          ctrl,
          'setTimerForNoteProtection'
        );

        await ctrl.onAppEvent(
          ApplicationEvent.ProtectionSessionExpiryDateChanged,
          {
            protectionDuration,
          }
        );

        expect(setTimerForNoteProtectionSpy).toHaveBeenCalledWith(
          DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING
        );
        expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(false);
      });

      it("should hide the note if it wasn't edited for the predefined time", async () => {
        const showOrPostponeProtectionScreenSpy = jest.spyOn(
          ctrl,
          'showOrPostponeProtectionScreen'
        );

        await ctrl.onAppEvent(
          ApplicationEvent.ProtectionSessionExpiryDateChanged,
          {
            protectionDuration,
          }
        );

        jest.advanceTimersByTime(
          (DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - 1) * 1000
        );
        expect(showOrPostponeProtectionScreenSpy).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1 * 1000);
        expect(showOrPostponeProtectionScreenSpy).toHaveBeenCalled();
      });

      it('should postpone note hiding by correct time if the time passed after editing the note is less than the allowed idle time', async () => {
        const showOrPostponeProtectionScreenSpy = jest.spyOn(
          ctrl,
          'showOrPostponeProtectionScreen'
        );

        const currentTimestamp = Date.now();
        const secondsAfterWhichTheNoteWasModified = 4;
        const noteModificationDate = new Date(
          currentTimestamp + secondsAfterWhichTheNoteWasModified * 1000
        );

        Object.defineProperty(ctrl.note, 'userModifiedDate', {
          value: noteModificationDate,
          configurable: true,
        });
        Object.defineProperty(
          ctrl.application,
          'getProtectionSessionExpiryDate',
          {
            value: jest
              .fn()
              .mockImplementation(
                () =>
                  new Date(
                    currentTimestamp +
                      DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING *
                        1000
                  )
              ),
            configurable: true,
          }
        );

        await ctrl.onAppEvent(
          ApplicationEvent.ProtectionSessionExpiryDateChanged,
          {
            protectionDuration,
          }
        );

        jest.advanceTimersByTime(
          DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING * 1000
        );
        expect(showOrPostponeProtectionScreenSpy).toHaveBeenCalled();
        expect(setShowProtectedWarningSpy).not.toHaveBeenCalledWith(true);

        jest.advanceTimersByTime(secondsAfterWhichTheNoteWasModified * 1000);
        expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(true);
      });
    });

    describe('protection remembrance duration in authentication modal is set to other than "Don\'t remember" option and the note is opened', () => {
      // TODO: add tests
    });
  });

  describe('note is unprotected', () => {
    // TODO: write the tests
  });

  describe('dismissProtectedWarning', () => {
    // TODO: write tests
  });
});
