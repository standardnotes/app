import { isDesktopApplication } from '@/utils';
import {  AppStateEvents } from '../state';

const MILLISECONDS_PER_SECOND = 1000;
const FOCUS_POLL_INTERVAL = 1 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_NONE = 0;
const LOCK_INTERVAL_IMMEDIATE = 1;
const LOCK_INTERVAL_ONE_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_FIVE_MINUTES = 300 * MILLISECONDS_PER_SECOND;
const LOCK_INTERVAL_ONE_HOUR= 3600 * MILLISECONDS_PER_SECOND;

const STORAGE_KEY_AUTOLOCK_INTERVAL = "AutoLockIntervalKey";

export class LockManager {
  /* @ngInject */
  constructor($rootScope, application, appState) {
    this.$rootScope = $rootScope;
    this.application = application;
    this.appState = appState;
    this.observeVisibility();
  }

  observeVisibility() {
    this.appState.addObserver((eventName, data) => {
      if(eventName === AppStateEvents.WindowDidBlur) {
        this.documentVisibilityChanged(false);
      } else if(eventName === AppStateEvents.WindowDidFocus) {
        this.documentVisibilityChanged(true);
      }
    });
    if (!isDesktopApplication()) {
      this.beginWebFocusPolling();
    }
  }

  async setAutoLockInterval(interval) {
    return this.application.setValue(STORAGE_KEY_AUTOLOCK_INTERVAL, interval);
  }

  async getAutoLockInterval() {
    const interval = await this.application.getValue(
      STORAGE_KEY_AUTOLOCK_INTERVAL,
    );
    if(interval) {
      return interval;
    } else {
      return LOCK_INTERVAL_NONE;
    }
  }
  
  /**
   *  Verify document is in focus every so often as visibilitychange event is
   *  not triggered on a typical window blur event but rather on tab changes.
   */
  beginWebFocusPolling() {
    this.pollFocusTimeout = setInterval(() => {
      const hasFocus = document.hasFocus();
      if(hasFocus && this.lastFocusState === 'hidden') {
        this.documentVisibilityChanged(true);
      } else if(!hasFocus && this.lastFocusState === 'visible') {
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

  async documentVisibilityChanged(visible) {
    if(visible) {
      const locked = await this.application.isPasscodeLocked();
      if(
        !locked &&
        this.lockAfterDate && 
        new Date() > this.lockAfterDate
      ) {
        this.application.lock();
      }
      this.cancelAutoLockTimer();
    } else {
      this.beginAutoLockTimer();
    }
  }

  async beginAutoLockTimer() {
    var interval = await this.getAutoLockInterval();
    if(interval === LOCK_INTERVAL_NONE) {
      return;
    }
    /**
     * Use a timeout if possible, but if the computer is put to sleep, timeouts won't 
     * work. Need to set a date as backup. this.lockAfterDate does not need to be 
     * persisted,  as living in memory is sufficient. If memory is cleared, then the 
     * application will lock anyway.
     */
    const addToNow = (seconds) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + seconds);
      return date;
    };
    this.lockAfterDate = addToNow(interval / MILLISECONDS_PER_SECOND);
    this.lockTimeout = setTimeout(() => {
      this.cancelAutoLockTimer();
      this.application.lock();
      this.lockAfterDate = null;
    }, interval);
  }

  cancelAutoLockTimer() {
    clearTimeout(this.lockTimeout);
    this.lockAfterDate = null;
  }
}
