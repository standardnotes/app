/**
 * @jest-environment jsdom
 */

import { EditorViewCtrl } from '@Views/editor/editor_view';
import {
  ApplicationEvent,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
} from '@standardnotes/snjs/';

describe('editor-view', () => {
  let ctrl: EditorViewCtrl;
  let setShowProtectedWarningSpy: jest.SpyInstance;

  beforeEach(() => {
    const $timeout = {} as jest.Mocked<ng.ITimeoutService>;
    ctrl = new EditorViewCtrl($timeout);

    setShowProtectedWarningSpy = jest.spyOn(ctrl, 'setShowProtectedWarning');

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
          hasProtectionSources: () => true,
          authorizeNoteAccess: jest.fn(),
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

    it("should hide the note if at the time of the session expiration the note wasn't edited for longer than the allowed idle time", async () => {
      jest
        .spyOn(ctrl, 'getSecondsElapsedSinceLastEdit')
        .mockImplementation(
          () =>
            ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction +
            5
        );

      await ctrl.onAppEvent(ApplicationEvent.UnprotectedSessionExpired);

      expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(true);
    });

    it('should postpone the note hiding by correct time if the time passed after its last modification is less than the allowed idle time', async () => {
      const secondsElapsedSinceLastEdit =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction -
        3;

      Object.defineProperty(ctrl.note, 'userModifiedDate', {
        value: new Date(Date.now() - secondsElapsedSinceLastEdit * 1000),
        configurable: true,
      });

      await ctrl.onAppEvent(ApplicationEvent.UnprotectedSessionExpired);

      const secondsAfterWhichTheNoteShouldHide =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction -
        secondsElapsedSinceLastEdit;
      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000);
      expect(setShowProtectedWarningSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1 * 1000);
      expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(true);
    });

    it('should postpone the note hiding by correct time if the user continued editing it even after the protection session has expired', async () => {
      const secondsElapsedSinceLastModification = 3;
      Object.defineProperty(ctrl.note, 'userModifiedDate', {
        value: new Date(
          Date.now() - secondsElapsedSinceLastModification * 1000
        ),
        configurable: true,
      });

      await ctrl.onAppEvent(ApplicationEvent.UnprotectedSessionExpired);

      let secondsAfterWhichTheNoteShouldHide =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction -
        secondsElapsedSinceLastModification;
      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000);

      // A new modification has just happened
      Object.defineProperty(ctrl.note, 'userModifiedDate', {
        value: new Date(),
        configurable: true,
      });

      secondsAfterWhichTheNoteShouldHide =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction;
      jest.advanceTimersByTime((secondsAfterWhichTheNoteShouldHide - 1) * 1000);
      expect(setShowProtectedWarningSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1 * 1000);
      expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('note is unprotected', () => {
    it('should not call any hiding logic', async () => {
      Object.defineProperty(ctrl, 'note', {
        value: {
          protected: false,
        },
      });
      const hideProtectedNoteIfInactiveSpy = jest.spyOn(
        ctrl,
        'hideProtectedNoteIfInactive'
      );

      await ctrl.onAppEvent(ApplicationEvent.UnprotectedSessionExpired);

      expect(hideProtectedNoteIfInactiveSpy).not.toHaveBeenCalled();
    });
  });

  describe('dismissProtectedWarning', () => {
    describe('the note has protection sources', () => {
      it('should reveal note contents if the authorization has been passed', async () => {
        jest
          .spyOn(ctrl.application, 'authorizeNoteAccess')
          .mockImplementation(async () => Promise.resolve(true));

        await ctrl.dismissProtectedWarning();

        expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(false);
      });

      it('should not reveal note contents if the authorization has not been passed', async () => {
        jest
          .spyOn(ctrl.application, 'authorizeNoteAccess')
          .mockImplementation(async () => Promise.resolve(false));

        await ctrl.dismissProtectedWarning();

        expect(setShowProtectedWarningSpy).not.toHaveBeenCalled();
      });
    });

    describe('the note does not have protection sources', () => {
      it('should reveal note contents', async () => {
        jest
          .spyOn(ctrl.application, 'hasProtectionSources')
          .mockImplementation(() => false);

        await ctrl.dismissProtectedWarning();

        expect(setShowProtectedWarningSpy).toHaveBeenCalledWith(false);
      });
    });
  });
});
