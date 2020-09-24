import { ApplicationService } from 'snjs';
import { WebApplication } from '@/ui_models/application';
import { isDesktopApplication } from '@/utils';
import { AppStateEvent } from '@/ui_models/app_state';

const MILLISECONDS_PER_SECOND = 1000;
const FOCUS_POLL_INTERVAL = 1 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_NONE = 0;
const LOCK_INTERVAL_IMMEDIATE = 1;
const LOCK_INTERVAL_ONE_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_FIVE_MINUTES = 300 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_ONE_HOUR = 3600 * MILLISECONDS_PER_SECOND;

const STORAGE_KEY_AUTOLOCK_INTERVAL = "AutoLockIntervalKey";

export class AutolockService extends ApplicationService {

  private unsubState: any
  private pollFocusInterval: any
  private lastFocusState?: 'hidden' | 'visible'
  private lockAfterDate?: Date
  private lockTimeout?: any

  onAppLaunch() {
    this.observeVisibility();
    return super.onAppLaunch();
  }

  observeVisibility() {
    this.unsubState = (this.application as WebApplication).getAppState().addObserver(
      async (eventName) => {
        if (eventName === AppStateEvent.WindowDidBlur) {
          this.documentVisibilityChanged(false);
        } else if (eventName === AppStateEvent.WindowDidFocus) {
          this.documentVisibilityChanged(true);
        }
      }
    );
    if (!isDesktopApplication()) {
      this.beginWebFocusPolling();
    }
  }

  deinit() {
    this.unsubState();
    this.cancelAutoLockTimer();
    if (this.pollFocusInterval) {
      clearInterval(this.pollFocusInterval);
    }
  }

  private lockApplication() {
    if (!this.application.hasPasscode()) {
      throw Error('Attempting to lock application with no passcode');
    }
    this.application.lock();
  }

  async setAutoLockInterval(interval: number) {
    return this.application!.setValue(
      STORAGE_KEY_AUTOLOCK_INTERVAL,
      interval
    );
  }

  async getAutoLockInterval() {
    const interval = await this.application!.getValue(
      STORAGE_KEY_AUTOLOCK_INTERVAL
    );
    if (interval) {
      return interval;
    } else {
      return LOCK_INTERVAL_NONE;
    }
  }

  async deleteAutolockPreference() {
    await this.application!.removeValue(
      STORAGE_KEY_AUTOLOCK_INTERVAL
    );
    this.cancelAutoLockTimer();
  }

  /**
   *  Verify document is in focus every so often as visibilitychange event is
   *  not triggered on a typical window blur event but rather on tab changes.
   */
  beginWebFocusPolling() {
    this.pollFocusInterval = setInterval(() => {
      if (document.hidden) {
        /** Native event listeners will have fired */
        return;
      }
      const hasFocus = document.hasFocus();
      if (hasFocus && this.lastFocusState === 'hidden') {
        this.documentVisibilityChanged(true);
      } else if (!hasFocus && this.lastFocusState === 'visible') {
        this.documentVisibilityChanged(false);
      }
      /* Save this to compare against next time around */
      this.lastFocusState = hasFocus ? 'visible' : 'hidden';
    }, FOCUS_POLL_INTERVAL);
  }

  getAutoLockIntervalOptions() {
    return [
      {
        value: LOCK_INTERVAL_NONE,
        label: "Off"
      },
      {
        value: LOCK_INTERVAL_IMMEDIATE,
        label: "Immediately"
      },
      {
        value: LOCK_INTERVAL_ONE_MINUTE,
        label: "1m"
      },
      {
        value: LOCK_INTERVAL_FIVE_MINUTES,
        label: "5m"
      },
      {
        value: LOCK_INTERVAL_ONE_HOUR,
        label: "1h"
      }
    ];
  }

  async documentVisibilityChanged(visible: boolean) {
    if (visible) {
      const locked = await this.application.isLocked();
      if (
        !locked &&
        this.lockAfterDate &&
        new Date() > this.lockAfterDate
      ) {
        this.lockApplication();
      }
      this.cancelAutoLockTimer();
    } else {
      this.beginAutoLockTimer();
    }
  }

  async beginAutoLockTimer() {
    const interval = await this.getAutoLockInterval();
    if (interval === LOCK_INTERVAL_NONE) {
      return;
    }
    /**
     * Use a timeout if possible, but if the computer is put to sleep, timeouts won't
     * work. Need to set a date as backup. this.lockAfterDate does not need to be
     * persisted,  as living in memory is sufficient. If memory is cleared, then the
     * application will lock anyway.
     */
    const addToNow = (seconds: number) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + seconds);
      return date;
    };
    this.lockAfterDate = addToNow(interval / MILLISECONDS_PER_SECOND);
    clearTimeout(this.lockTimeout);
    this.lockTimeout = setTimeout(() => {
      this.cancelAutoLockTimer();
      this.lockApplication();
      this.lockAfterDate = undefined;
    }, interval);
  }

  cancelAutoLockTimer() {
    clearTimeout(this.lockTimeout);
    this.lockAfterDate = undefined;
    this.lockTimeout = undefined;
  }
}
