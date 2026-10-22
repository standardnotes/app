import { ComponentAction, IframeComponentFeatureDescription } from '@standardnotes/features'
import { ComponentMessage, Environment, Platform, SNNote, UIFeature } from '@standardnotes/models'
import { UuidGenerator } from '@standardnotes/utils'
import { ComponentViewer } from './ComponentViewer'
import { ComponentViewerRequiresComponentManagerProperties } from './ComponentViewerRequiresComponentManagerFunctions'

describe('ComponentViewer scroll to end', () => {
  const createViewer = () => {
    const services = {
      items: { addObserver: jest.fn().mockReturnValue(jest.fn()) },
      features: { addEventObserver: jest.fn().mockReturnValue(jest.fn()) },
      logger: { info: jest.fn() },
      alerts: { alert: jest.fn() },
    }

    const viewer = new ComponentViewer(
      { displayName: 'Editor', uniqueIdentifier: { value: 'editor' } } as unknown as UIFeature<IframeComponentFeatureDescription>,
      services as unknown as ConstructorParameters<typeof ComponentViewer>[1],
      { item: { uuid: 'note-uuid' } as unknown as SNNote, url: 'https://editor' },
      {
        environment: Environment.Web,
        platform: Platform.MacWeb,
        componentManagerFunctions: {} as ComponentViewerRequiresComponentManagerProperties,
      },
    )

    return { viewer, services }
  }

  const scrollStateMessage = (data: ComponentMessage['data']): ComponentMessage => ({
    action: ComponentAction.ScrollState,
    data,
  })

  it('notifies scroll state observers and replays the latest state to new observers', () => {
    const { viewer } = createViewer()
    const observer = jest.fn()
    viewer.addScrollStateObserver(observer)

    viewer.handleMessage(scrollStateMessage({ canScroll: true, isAtBottom: false }))
    expect(observer).toHaveBeenCalledWith({ canScroll: true, isAtBottom: false })

    const lateObserver = jest.fn()
    viewer.addScrollStateObserver(lateObserver)
    expect(lateObserver).toHaveBeenCalledWith({ canScroll: true, isAtBottom: false })
  })

  it('does not call observers before the component reports a scroll state', () => {
    const { viewer } = createViewer()
    const observer = jest.fn()

    viewer.addScrollStateObserver(observer)

    expect(observer).not.toHaveBeenCalled()
  })

  it('ignores malformed scroll state messages', () => {
    const { viewer } = createViewer()
    const observer = jest.fn()
    viewer.addScrollStateObserver(observer)

    viewer.handleMessage(scrollStateMessage({ canScroll: true }))

    expect(observer).not.toHaveBeenCalled()
  })

  it('stops notifying removed observers', () => {
    const { viewer } = createViewer()
    const observer = jest.fn()
    const removeObserver = viewer.addScrollStateObserver(observer)

    removeObserver()
    viewer.handleMessage(scrollStateMessage({ canScroll: true, isAtBottom: true }))

    expect(observer).not.toHaveBeenCalled()
  })

  it('sends a scroll-to-end message to the component window', () => {
    const { viewer } = createViewer()
    const postMessage = jest.fn()
    ;(viewer as unknown as { window: Window }).window = { postMessage } as unknown as Window

    viewer.requestScrollToEnd({ moveCaret: true })

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: ComponentAction.ScrollToEnd, data: { moveCaret: true } }),
      '*',
    )
  })

  it('tells the component on registration whether the host handles the scroll to end shortcut', () => {
    UuidGenerator.SetGenerator(() => 'session-key')
    const { viewer } = createViewer()
    ;(viewer as unknown as { config: { componentManagerFunctions: object } }).config.componentManagerFunctions = {
      getComponentPreferences: () => undefined,
      urlsForActiveThemes: () => [],
    }
    const postMessage = jest.fn()

    let hostHandlesShortcut = false
    viewer.setHandlesScrollToEndShortcut(() => hostHandlesShortcut)
    hostHandlesShortcut = true
    viewer.setWindow({ postMessage } as unknown as Window)

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ComponentAction.ComponentRegistered,
        data: expect.objectContaining({ handlesScrollToEndShortcut: true }),
      }),
      '*',
    )
  })

  it('does not alert when there is no component window yet', () => {
    const { viewer, services } = createViewer()

    viewer.requestScrollToEnd({ moveCaret: false })

    expect(services.alerts.alert).not.toHaveBeenCalled()
  })
})
