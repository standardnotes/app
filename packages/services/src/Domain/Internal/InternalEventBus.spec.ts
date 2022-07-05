import { InternalEventHandlerInterface } from './InternalEventHandlerInterface'
import { InternalEventBus } from './InternalEventBus'
import { InternalEventPublishStrategy } from './InternalEventPublishStrategy'

describe('InternalEventBus', () => {
  let eventHandler1: InternalEventHandlerInterface
  let eventHandler2: InternalEventHandlerInterface
  let eventHandler3: InternalEventHandlerInterface

  const createEventBus = () => new InternalEventBus()

  beforeEach(() => {
    eventHandler1 = {} as jest.Mocked<InternalEventHandlerInterface>
    eventHandler1.handleEvent = jest.fn()

    eventHandler2 = {} as jest.Mocked<InternalEventHandlerInterface>
    eventHandler2.handleEvent = jest.fn()

    eventHandler3 = {} as jest.Mocked<InternalEventHandlerInterface>
    eventHandler3.handleEvent = jest.fn()
  })

  it('should trigger appropriate event handlers upon event publishing', () => {
    const eventBus = createEventBus()
    eventBus.addEventHandler(eventHandler1, 'test_event_1')
    eventBus.addEventHandler(eventHandler2, 'test_event_2')
    eventBus.addEventHandler(eventHandler1, 'test_event_3')
    eventBus.addEventHandler(eventHandler3, 'test_event_2')

    eventBus.publish({ type: 'test_event_2', payload: { foo: 'bar' } })

    expect(eventHandler1.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler2.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
    expect(eventHandler3.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
  })

  it('should do nothing if there are no appropriate event handlers', () => {
    const eventBus = createEventBus()
    eventBus.addEventHandler(eventHandler1, 'test_event_1')
    eventBus.addEventHandler(eventHandler2, 'test_event_2')
    eventBus.addEventHandler(eventHandler1, 'test_event_3')
    eventBus.addEventHandler(eventHandler3, 'test_event_2')

    eventBus.publish({ type: 'test_event_4', payload: { foo: 'bar' } })

    expect(eventHandler1.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler2.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler3.handleEvent).not.toHaveBeenCalled()
  })

  it('should handle event synchronously in a sequential order', async () => {
    const eventBus = createEventBus()
    eventBus.addEventHandler(eventHandler1, 'test_event_1')
    eventBus.addEventHandler(eventHandler2, 'test_event_2')
    eventBus.addEventHandler(eventHandler1, 'test_event_3')
    eventBus.addEventHandler(eventHandler3, 'test_event_2')

    await eventBus.publishSync({ type: 'test_event_2', payload: { foo: 'bar' } }, InternalEventPublishStrategy.SEQUENCE)

    expect(eventHandler1.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler2.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
    expect(eventHandler3.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
  })

  it('should handle event synchronously in a random order', async () => {
    const eventBus = createEventBus()
    eventBus.addEventHandler(eventHandler1, 'test_event_1')
    eventBus.addEventHandler(eventHandler2, 'test_event_2')
    eventBus.addEventHandler(eventHandler1, 'test_event_3')
    eventBus.addEventHandler(eventHandler3, 'test_event_2')

    await eventBus.publishSync({ type: 'test_event_2', payload: { foo: 'bar' } }, InternalEventPublishStrategy.ASYNC)

    expect(eventHandler1.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler2.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
    expect(eventHandler3.handleEvent).toHaveBeenCalledWith({
      type: 'test_event_2',
      payload: { foo: 'bar' },
    })
  })

  it('should do nothing if there are no appropriate event handlers for synchronous handling', async () => {
    const eventBus = createEventBus()
    eventBus.addEventHandler(eventHandler1, 'test_event_1')
    eventBus.addEventHandler(eventHandler2, 'test_event_2')
    eventBus.addEventHandler(eventHandler1, 'test_event_3')
    eventBus.addEventHandler(eventHandler3, 'test_event_2')

    await eventBus.publishSync({ type: 'test_event_4', payload: { foo: 'bar' } }, InternalEventPublishStrategy.ASYNC)

    expect(eventHandler1.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler2.handleEvent).not.toHaveBeenCalled()
    expect(eventHandler3.handleEvent).not.toHaveBeenCalled()
  })

  it('should clear event observers on deinit', async () => {
    const eventBus = createEventBus()
    eventBus.deinit()

    expect(eventBus['eventHandlers']).toBeUndefined
  })
})
