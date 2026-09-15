import { FeaturesClientInterface, FeatureStatus } from '@standardnotes/services'
import { InternalEventBusInterface } from '@standardnotes/snjs'
import { FeaturesController } from './FeaturesController'

describe('FeaturesController', () => {
  describe('isUniversalSearchEnabled', () => {
    let features: jest.Mocked<Pick<FeaturesClientInterface, 'getFeatureStatus' | 'hasRole'>>
    let eventBus: jest.Mocked<Pick<InternalEventBusInterface, 'addEventHandler'>>
    let controller: FeaturesController

    beforeEach(() => {
      features = {
        getFeatureStatus: jest.fn().mockReturnValue(FeatureStatus.Entitled),
        hasRole: jest.fn(),
      }
      eventBus = {
        addEventHandler: jest.fn(),
      }
      controller = new FeaturesController(
        features as unknown as FeaturesClientInterface,
        eventBus as unknown as InternalEventBusInterface,
      )
    })

    afterEach(() => {
      controller.deinit()
    })

    it('returns true', () => {
      expect(controller.isUniversalSearchEnabled()).toBe(true)
    })
  })
})
