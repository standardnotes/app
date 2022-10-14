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

    getPersistableState = () => ({
      testString: 'test',
      testBoolean: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    hydrateFromStorage = (_state) => {}

    statePersistenceHandler = new StatePersistenceHandler<PersistableState>(
      application,
      'test' as PersistedStateKey,
      getPersistableState,
      hydrateFromStorage,
    )
  })

  it('it should not call hydrate fn if no persisted value available', async () => {
    await statePersistenceHandler.onAppEvent(ApplicationEvent.LocalDataLoaded)

    expect(hydrateFromStorage).not.toHaveBeenCalled()
  })
})
