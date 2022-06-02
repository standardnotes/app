import { storage, StorageKey } from '@/Services/LocalStorage'
import { ApplicationEvent, InternalEventBus } from '@standardnotes/snjs'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class NoAccountWarningController extends AbstractViewController {
  show: boolean

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    this.show = application.hasAccount() ? false : storage.get(StorageKey.ShowNoAccountWarning) ?? true

    this.disposers.push(
      application.addEventObserver(async () => {
        runInAction(() => {
          this.show = false
        })
      }, ApplicationEvent.SignedIn),
    )

    this.disposers.push(
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          runInAction(() => {
            this.show = false
          })
        }
      }, ApplicationEvent.Started),
    )

    makeObservable(this, {
      show: observable,
      hide: action,
    })
  }

  hide = (): void => {
    this.show = false
    storage.set(StorageKey.ShowNoAccountWarning, false)
  }

  reset = (): void => {
    storage.remove(StorageKey.ShowNoAccountWarning)
  }
}
