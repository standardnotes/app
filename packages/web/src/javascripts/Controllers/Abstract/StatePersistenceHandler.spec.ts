/**
 * @jest-environment jsdom
 */

import { WebApplication } from '@/Application/Application'
import { ApplicationEvent } from '@standardnotes/snjs'
import { PersistedStateKey, StatePersistenceHandler } from './StatePersistenceHandler'

type PersistableState = {
  testString: string
  testBoolean: boolean
}

describe('StatePersistenceHandler', () => {
  let application: WebApplication
  let statePersistenceHandler: StatePersistenceHandler<PersistableState>
  let getPersistableState: () => PersistableState
  let hydrateFromStorage: (state: PersistableState) => void

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>
    application.addEventObserver = jest.fn()
    application.setValue = jest.fn()

    getPersistableState = () => ({
      testString: 'test',
      testBoolean: true,
    })

    hydrateFromStorage = jest.fn()
  })

  it('it should not call hydrate fn if no persisted value available', async () => {
    application.getValue = jest.fn()

    statePersistenceHandler = new StatePersistenceHandler<PersistableState>(
      application,
      'test' as PersistedStateKey,
      getPersistableState,
      hydrateFromStorage,
    )

    await statePersistenceHandler.onAppEvent(ApplicationEvent.LocalDataLoaded)

    expect(hydrateFromStorage).not.toHaveBeenCalled()
  })

  it('it should call hydrate fn if no persisted value available', async () => {
    application.getValue = jest.fn().mockReturnValue(getPersistableState())

    statePersistenceHandler = new StatePersistenceHandler<PersistableState>(
      application,
      'test' as PersistedStateKey,
      getPersistableState,
      hydrateFromStorage,
    )

    await statePersistenceHandler.onAppEvent(ApplicationEvent.LocalDataLoaded)

    expect(hydrateFromStorage).toHaveBeenCalled()
  })

  it('it should not persist new values if not hydrated once', async () => {
    application.getValue = jest.fn()

    statePersistenceHandler = new StatePersistenceHandler<PersistableState>(
      application,
      'test' as PersistedStateKey,
      getPersistableState,
      hydrateFromStorage,
    )

    await statePersistenceHandler.onAppEvent(ApplicationEvent.LocalDataLoaded)

    expect(hydrateFromStorage).not.toHaveBeenCalled()

    statePersistenceHandler.persistValuesToStorage()

    expect(application.setValue).not.toHaveBeenCalled()
  })

  it('it should persist new values if hydrated at least once', async () => {
    application.getValue = jest.fn().mockReturnValue(getPersistableState())

    statePersistenceHandler = new StatePersistenceHandler<PersistableState>(
      application,
      'test' as PersistedStateKey,
      getPersistableState,
      hydrateFromStorage,
    )

    await statePersistenceHandler.onAppEvent(ApplicationEvent.LocalDataLoaded)

    expect(hydrateFromStorage).toHaveBeenCalled()

    statePersistenceHandler.persistValuesToStorage()

    expect(application.setValue).toHaveBeenCalled()
  })
})
