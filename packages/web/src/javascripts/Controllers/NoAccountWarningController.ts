import { storage, StorageKey } from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  SessionsClientInterface,
} from '@standardnotes/snjs'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class NoAccountWarningController extends AbstractViewController implements InternalEventHandlerInterface {
  show: boolean

  constructor(
    private sessions: SessionsClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.show = sessions.isSignedIn() ? false : storage.get(StorageKey.ShowNoAccountWarning) ?? true

    eventBus.addEventHandler(this, ApplicationEvent.SignedIn)
    eventBus.addEventHandler(this, ApplicationEvent.Started)

    makeObservable(this, {
      show: observable,
      hide: action,
    })
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.SignedIn:
        runInAction(() => {
          this.show = false
        })
        break
      case ApplicationEvent.Started:
        if (this.sessions.isSignedIn()) {
          runInAction(() => {
            this.show = false
          })
        }
        break
    }
  }

  hide = (): void => {
    this.show = false
    storage.set(StorageKey.ShowNoAccountWarning, false)
  }

  reset = (): void => {
    storage.remove(StorageKey.ShowNoAccountWarning)
  }
}
