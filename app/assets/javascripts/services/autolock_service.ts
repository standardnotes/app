import { ApplicationService } from '@standardnotes/snjs';

const MILLISECONDS_PER_SECOND = 1000;
const POLL_INTERVAL = 50;

const LockInterval = {
  None: 0,
  Immediate: 1,
  OneMinute: 60 * MILLISECONDS_PER_SECOND,
  FiveMinutes: 300 * MILLISECONDS_PER_SECOND,
  OneHour: 3600 * MILLISECONDS_PER_SECOND,
};

const STORAGE_KEY_AUTOLOCK_INTERVAL = 'AutoLockIntervalKey';

export class AutolockService extends ApplicationService {
  private pollInterval: any;
  private lastFocusState?: 'hidden' | 'visible';
  private lockAfterDate?: Date;

  onAppLaunch() {
    this.beginPolling();
    return super.onAppLaunch();
  }

  deinit() {
    this.cancelAutoLockTimer();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    super.deinit();
  }

  private lockApplication() {
    if (!this.application.hasPasscode()) {
      throw Error('Attempting to lock application with no passcode');
    }
    this.application.lock();
  }

  async setAutoLockInterval(interval: number) {
    return this.application.setValue(STORAGE_KEY_AUTOLOCK_INTERVAL, interval);
  }

  async getAutoLockInterval() {
    const interval = (await this.application.getValue(
      STORAGE_KEY_AUTOLOCK_INTERVAL
    )) as number;
    if (interval) {
      return interval;
    } else {
      return LockInterval.None;
    }
  }

  async deleteAutolockPreference() {
    await this.application.removeValue(STORAGE_KEY_AUTOLOCK_INTERVAL);
    this.cancelAutoLockTimer();
  }

  /**
   *  Verify document is in focus every so often as visibilitychange event is
   *  not triggered on a typical window blur event but rather on tab changes.
   */
  beginPolling() {
    this.pollInterval = setInterval(async () => {
      const locked = await this.application.isLocked();
      if (!locked && this.lockAfterDate && new Date() > this.lockAfterDate) {
        this.lockApplication();
      }
      const hasFocus = document.hasFocus();
      if (hasFocus && this.lastFocusState === 'hidden') {
        this.documentVisibilityChanged(true);
      } else if (!hasFocus && this.lastFocusState === 'visible') {
        this.documentVisibilityChanged(false);
      }
      /* Save this to compare against next time around */
      this.lastFocusState = hasFocus ? 'visible' : 'hidden';
    }, POLL_INTERVAL);
  }

  getAutoLockIntervalOptions() {
    return [
      {
        value: LockInterval.None,
        label: 'Off',
      },
      {
        value: LockInterval.Immediate,
        label: 'Immediately',
      },
      {
        value: LockInterval.OneMinute,
        label: '1m',
      },
      {
        value: LockInterval.FiveMinutes,
        label: '5m',
      },
      {
        value: LockInterval.OneHour,
        label: '1h',
      },
    ];
  }

  async documentVisibilityChanged(visible: boolean) {
    if (visible) {
      this.cancelAutoLockTimer();
    } else {
      this.beginAutoLockTimer();
    }
  }

  async beginAutoLockTimer() {
    const interval = await this.getAutoLockInterval();
    if (interval === LockInterval.None) {
      return;
    }
    const addToNow = (seconds: number) => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + seconds);
      return date;
    };
    this.lockAfterDate = addToNow(interval / MILLISECONDS_PER_SECOND);
  }

  cancelAutoLockTimer() {
    this.lockAfterDate = undefined;
  }
}
