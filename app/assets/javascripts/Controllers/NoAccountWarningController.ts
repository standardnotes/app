import { storage, StorageKey } from '@/Services/LocalStorage'
import { ApplicationEvent } from '@standardnotes/snjs'
import { runInAction, makeObservable, observable, action } from 'mobx'
import { WebApplication } from '../Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class NoAccountWarningController extends AbstractViewController {
  show: boolean

  constructor(application: WebApplication, appObservers: (() => void)[]) {
    super(application)

    this.show = application.hasAccount() ? false : storage.get(StorageKey.ShowNoAccountWarning) ?? true

    appObservers.push(
      application.addEventObserver(async () => {
        runInAction(() => {
          this.show = false
        })
      }, ApplicationEvent.SignedIn),
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
