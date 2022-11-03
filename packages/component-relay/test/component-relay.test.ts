import {
  ContentType,
  ComponentAction,
  DeinitSource,
  Environment,
  Platform,
  SNApplication,
  SNComponent,
  SNTheme,
  platformFromString,
  NoteMutator,
  SNNote,
  environmentFromString,
} from '@standardnotes/snjs'
import {
  sleep,
  testExtensionEditorPackage,
  testExtensionForTagsPackage,
  testThemeDefaultPackage,
  testThemeDarkPackage,
  htmlTemplate,
  createComponentItem,
  registerComponent,
  createNoteItem,
  registerComponentHandler,
  SHORT_DELAY_TIME,
  createTagItem,
  jsonForItem,
} from './helpers'
import ComponentRelay from '../lib/componentRelay'
import { createApplication } from './lib/appFactory'
import Logger from '../lib/logger'

describe('Component Relay', () => {
  /** The child window. This is where the extension lives. */
  let childWindow: Window
  let componentRelay: ComponentRelay
  /** The Standard Notes application. */
  let testSNApp: SNApplication
  /** The test component. */
  let testComponent: SNComponent

  beforeEach(async () => {
    window.document.body.innerHTML = `<iframe>${htmlTemplate}</iframe>`
    childWindow = window.document.querySelector('iframe').contentWindow
    childWindow.document.title = 'Testing'

    // Mocking functions that are not implemented by JSDOM.
    childWindow.alert = jest.fn()
    childWindow.confirm = jest.fn()
    childWindow.open = jest.fn()

    testSNApp = await createApplication(
      'test-application',
      Environment.Web,
      Platform.LinuxWeb,
    )
    testComponent = await createComponentItem(
      testSNApp,
      testExtensionEditorPackage,
    )

    componentRelay = new ComponentRelay({
      targetWindow: childWindow,
      options: {
        acceptsThemes: true,
        // Coallesed saving is disabled here to avoid delays and timeouts in tests.
        coallesedSaving: false,
      },
    })

    /**
     * Workaround for https://github.com/jsdom/jsdom/issues/2745
     * If event.origin is empty, replace it with http://localhost
     */
    childWindow.addEventListener(
      'message',
      (event) => {
        if (event.origin === '') {
          event.stopImmediatePropagation()
          event.stopPropagation()
          const eventWithOrigin = new MessageEvent('message', {
            data: event.data,
            origin: 'http://localhost',
          })
          childWindow.dispatchEvent(eventWithOrigin)
        }
      },
      true,
    )
  })

  afterEach(() => {
    componentRelay.deinit()
    componentRelay = undefined

    const childIframe = window.document.getElementsByTagName('iframe')[0]
    window.document.body.removeChild(childIframe)
    childWindow = undefined

    testComponent = undefined

    testSNApp.deinit(DeinitSource.SignOut)
    testSNApp = undefined
  })

  it('should throw error if contentWindow is undefined', () => {
    expect(() => new ComponentRelay(undefined)).toThrow(
      'contentWindow must be a valid Window object.',
    )
  })

  it('should not be undefined', () => {
    expect(componentRelay).not.toBeUndefined()
  })

  it('should not run onReady callback when component has not been registered', () => {
    expect.hasAssertions()
    const onReady = jest.fn()
    componentRelay.deinit()
    componentRelay = new ComponentRelay({
      targetWindow: childWindow,
      onReady,
    })
    expect(onReady).toBeCalledTimes(0)
  })

  it('should run onReady callback when component is registered', async () => {
    expect.hasAssertions()
    const onReady = jest.fn()
    componentRelay.deinit()
    componentRelay = new ComponentRelay({
      targetWindow: childWindow,
      onReady,
    })
    await registerComponent(testSNApp, childWindow, testComponent)
    expect(onReady).toBeCalledTimes(1)
  })

  it('should run onThemesChange callback when a theme is activated', async () => {
    expect.hasAssertions()
    const onThemesChange = jest.fn()
    componentRelay.deinit()
    componentRelay = new ComponentRelay({
      targetWindow: childWindow,
      onReady: jest.fn(),
      onThemesChange,
    })
    await registerComponent(testSNApp, childWindow, testComponent)

    ;(await createComponentItem(testSNApp, testThemeDefaultPackage, {
      active: true,
    })) as SNTheme
    await registerComponent(testSNApp, childWindow, testComponent)

    testSNApp.componentManager.postActiveThemesToComponent(testComponent)
    await sleep(0.001)

    expect(onThemesChange).toBeCalledTimes(1)
  })

  test('getSelfComponentUUID() before the component is registered should be undefined', () => {
    const uuid = componentRelay.getSelfComponentUUID()
    expect(uuid).toBeUndefined()
  })

  test('getSelfComponentUUID() after the component is registered should not be undefined', async () => {
    await registerComponent(testSNApp, childWindow, testComponent)
    const uuid = componentRelay.getSelfComponentUUID()
    expect(uuid).not.toBeUndefined()
    expect(uuid).toBe(testComponent.uuid)
  })

  test('getComponentDataValueForKey() before the component is registered should return undefined', async () => {
    const value = componentRelay.getComponentDataValueForKey('foo')
    expect(value).toBeUndefined()
  })

  test('getComponentDataValueForKey() with a key that does not exist should return undefined', async () => {
    await registerComponent(testSNApp, childWindow, testComponent)
    const value = componentRelay.getComponentDataValueForKey('bar')
    expect(value).toBeUndefined()
  })

  test('getComponentDataValueForKey() with an existing key should return value', async () => {
    await registerComponent(testSNApp, childWindow, testComponent)
    const value = componentRelay.getComponentDataValueForKey('foo')
    expect(value).toBe('bar')
  })

  it('should not return the platform and/or environment if component is not initialized', async () => {
    const { platform, environment } = componentRelay
    expect(platform).toBeUndefined()
    expect(environment).toBeUndefined()
  })

  it('should return the string representation of the platform', async () => {
    await registerComponent(testSNApp, childWindow, testComponent)
    const { platform } = componentRelay
    expect(typeof platform).toBe('string')
    expect(platformFromString(platform)).toBe(testSNApp.platform)
  })

  it('should return the string representation of the environment', async () => {
    await registerComponent(testSNApp, childWindow, testComponent)
    const { environment } = componentRelay
    expect(typeof environment).toBe('string')
    expect(environmentFromString(environment)).toBe(testSNApp.environment)
  })

  test('setComponentDataValueForKey() should throw an error if component is not initialized', () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')
    expect(() => componentRelay.setComponentDataValueForKey('', '')).toThrow(
      'The component has not been initialized.',
    )
    expect(parentPostMessage).not.toBeCalled()
  })

  test('setComponentDataValueForKey() with an invalid key should throw an error', async () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')
    await registerComponent(testSNApp, childWindow, testComponent)
    expect(() => componentRelay.setComponentDataValueForKey('', '')).toThrow(
      'The key for the data value should be a valid string.',
    )
    expect(parentPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        action: ComponentAction.SetComponentData,
        data: expect.any(Object),
        messageId: expect.any(String),
        sessionKey: expect.any(String),
        api: 'component',
      }),
      expect.any(String),
    )
  })

  test('setComponentDataValueForKey() should set the value for the corresponding key', async () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')
    await registerComponent(testSNApp, childWindow, testComponent)
    const dataValue = `value-${Date.now()}`
    componentRelay.setComponentDataValueForKey('testing', dataValue)
    const expectedComponentData = {
      componentData: {
        ...testComponent.componentData,
        testing: dataValue,
      },
    }
    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ComponentAction.SetComponentData,
        data: expectedComponentData,
        messageId: expect.any(String),
        sessionKey: expect.any(String),
        api: 'component',
      }),
      expect.any(String),
    )
    const value = componentRelay.getComponentDataValueForKey('testing')
    expect(value).toEqual(dataValue)
  })

  test('clearComponentData() should clear all component data', async () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')
    await registerComponent(testSNApp, childWindow, testComponent)
    componentRelay.clearComponentData()
    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ComponentAction.SetComponentData,
        data: {
          componentData: {},
        },
        messageId: expect.any(String),
        sessionKey: expect.any(String),
        api: 'component',
      }),
      expect.any(String),
    )
    const value = componentRelay.getComponentDataValueForKey('foo')
    expect(value).toBeUndefined()
  })

  test('isRunningInDesktopApplication() should return false if the environment is web', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Web,
      Platform.LinuxWeb,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInDesktop = componentRelay.isRunningInDesktopApplication()
    expect(isRunningInDesktop).toBe(false)
  })

  test('isRunningInDesktopApplication() should return false if the environment is mobile', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Mobile,
      Platform.Ios,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInDesktop = componentRelay.isRunningInDesktopApplication()
    expect(isRunningInDesktop).toBe(false)
  })

  test('isRunningInDesktopApplication() should return true if the environment is desktop', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Desktop,
      Platform.LinuxDesktop,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInDesktop = componentRelay.isRunningInDesktopApplication()
    expect(isRunningInDesktop).toBe(true)
  })

  test('isRunningInMobileApplication() should return false if the environment is web', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Web,
      Platform.LinuxWeb,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInMobile = componentRelay.isRunningInMobileApplication()
    expect(isRunningInMobile).toBe(false)
  })

  test('isRunningInMobileApplication() should return false if the environment is desktop', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Desktop,
      Platform.LinuxDesktop,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInMobile = componentRelay.isRunningInMobileApplication()
    expect(isRunningInMobile).toBe(false)
  })

  test('isRunningInMobileApplication() should return true if the environment is mobile', async () => {
    testSNApp = await createApplication(
      'test-application',
      Environment.Mobile,
      Platform.Ios,
    )
    await registerComponent(testSNApp, childWindow, testComponent)
    const isRunningInMobile = componentRelay.isRunningInMobileApplication()
    expect(isRunningInMobile).toBe(true)
  })

  test('postMessage payload should be stringified if on mobile', async () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

    testSNApp = await createApplication(
      'test-application',
      Environment.Mobile,
      Platform.Ios,
    )
    testComponent = await createComponentItem(
      testSNApp,
      testExtensionEditorPackage,
    )

    componentRelay.deinit()
    componentRelay = new ComponentRelay({
      targetWindow: childWindow,
    })
    await registerComponent(testSNApp, childWindow, testComponent)

    // Performing an action so it can call parent.postMessage function.
    componentRelay.clearSelection()

    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String), // TODO: jsdom should report the proper URL and not an empty string
    )
  })

  it('should activate themes when ready, by inserting elements to <head>', async () => {
    const testTheme = (await createComponentItem(
      testSNApp,
      testThemeDefaultPackage,
      {
        active: true,
      },
    )) as SNTheme
    await registerComponent(testSNApp, childWindow, testComponent)

    const customThemes =
      childWindow.document.head.getElementsByClassName('custom-theme')
    expect(customThemes.length).toEqual(1)

    const themeLink = customThemes[0] as HTMLLinkElement
    expect(themeLink.id).toEqual(btoa(testTheme.hosted_url))
    expect(themeLink.href).toEqual(new URL(testTheme.hosted_url).href)
    expect(themeLink.type).toEqual('text/css')
    expect(themeLink.rel).toEqual('stylesheet')
    expect(themeLink.media).toEqual('screen,print')
  })

  it('should send the ThemesActivated action after themes are activated', async () => {
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

    ;(await createComponentItem(testSNApp, testThemeDefaultPackage, {
      active: true,
    })) as SNTheme
    await registerComponent(testSNApp, childWindow, testComponent)

    expect(parentPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ComponentAction.ThemesActivated,
        data: {},
        messageId: expect.any(String),
        sessionKey: expect.any(String),
        api: 'component',
      }),
      expect.any(String),
    )
  })

  it('should process the ThemesActivated action within the actionHandler', async () => {
    expect.hasAssertions()

    ;(await createComponentItem(testSNApp, testThemeDefaultPackage, {
      active: true,
    })) as SNTheme

    const onThemesActivated = jest.fn().mockImplementation((data) => data)

    /**
     * The actionHandler will have a different implementation
     * for the ThemesActivated action depending of the environment.
     */
    const customActionHandler = (component, action, data) => {
      if (action === ComponentAction.ThemesActivated) {
        onThemesActivated(data)
      }
    }

    registerComponentHandler(
      testSNApp,
      [testComponent.area],
      undefined,
      customActionHandler,
    )
    await registerComponent(testSNApp, childWindow, testComponent)

    // Waiting for the ThemesActivated action to be triggered after the component relay has activated all themes.
    await sleep(SHORT_DELAY_TIME)

    expect(onThemesActivated).toHaveBeenCalledTimes(1)
    expect(onThemesActivated).toHaveBeenCalledWith({})
  })

  test('postActiveThemesToComponent() should dispatch messages to activate/deactivate themes', async () => {
    /**
     * Creating an active SNTheme, that will be activated once the component is registered.
     */
    const testThemeDefault = (await createComponentItem(
      testSNApp,
      testThemeDefaultPackage,
      {
        active: true,
      },
    )) as SNTheme
    await registerComponent(testSNApp, childWindow, testComponent)

    /**
     * Creating another active SNTheme.
     * This will be used to replace the previously activated theme.
     */
    const testThemeDark = (await createComponentItem(
      testSNApp,
      testThemeDarkPackage,
      {
        active: true,
      },
    )) as SNTheme

    /**
     * Setting active = false so that only the new theme becomes the active theme.
     */
    testSNApp.componentManager.deactivateComponent(testThemeDefault.uuid)

    /**
     * componentManager.postActiveThemesToComponent() will trigger the ActivateTheme action.
     * This should deactivate the Default theme, and activate the Dark theme.
     */
    testSNApp.componentManager.postActiveThemesToComponent(testComponent)
    await sleep(0.001)

    const customThemes =
      childWindow.document.head.getElementsByClassName('custom-theme')
    expect(customThemes.length).toEqual(1)

    const themeLink = customThemes[0] as HTMLLinkElement
    expect(themeLink.id).toEqual(btoa(testThemeDark.hosted_url))
    expect(themeLink.href).toEqual(new URL(testThemeDark.hosted_url).href)
    expect(themeLink.type).toEqual('text/css')
    expect(themeLink.rel).toEqual('stylesheet')
    expect(themeLink.media).toEqual('screen,print')
  })

  it.skip('should queue message if sessionKey is not set', async () => {
    expect.hasAssertions()

    /**
     * Messages are queued when the sessionKey is not set or has a falsey value.
     * sessionKey is set by Uuid.GenerateUuid() which uses our generateUuid
     * function in our Utils module. We will mock the return value to be undefined.
     */
    const Utils = require('./../lib/utils')
    jest.spyOn(Utils, 'generateUuid').mockReturnValue(undefined)

    await registerComponent(testSNApp, childWindow, testComponent)
    const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')
    componentRelay.setComponentDataValueForKey('testing', '1234')
    expect(parentPostMessage).not.toHaveBeenCalled()
  })

  describe('component actions', () => {
    beforeAll(() => {
      /**
       * Components prompts for permissions via the presentPermissionsDialog function, which
       * has been implemented to use window.confirm to approve these requests.
       * We want to approve all of them during our ComponentActions tests.
       */
      window.confirm = (message) => true
    })

    afterAll(() => {
      // Restoring window.confirm implementation.
      window.confirm = (message) => false
    })

    test('streamItems', async (done) => {
      expect.hasAssertions()

      const savedTestNote = await createNoteItem(testSNApp)
      const contentTypes = [ContentType.Note]

      await registerComponent(testSNApp, childWindow, testComponent)

      componentRelay.streamItems(contentTypes, (items) => {
        expect(items).not.toBeUndefined()
        expect(items.length).toBe(1)
        expect(items[0].uuid).toBe(savedTestNote.uuid)
        done()
      })
    })

    test('streamContextItem', async () => {
      expect.assertions(8)

      const simpleNote = await createNoteItem(testSNApp, {
        title: 'A simple note',
        text: 'This is a note created for testing purposes.',
      })
      const awesomeNote = await createNoteItem(testSNApp, {
        title: 'Awesome note!',
        text: "This is not just any note, it's an awesome note!",
      })

      await registerComponent(testSNApp, childWindow, testComponent)

      let itemInContext

      componentRelay.streamContextItem((item) => {
        itemInContext = item
      })

      /**
       * Registering a handler to the Editor component area.
       * This is necesary in order to get the item in context.
       * We can later call the `componentManager.contextItemDidChangeInArea()` function.
       */
      registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
      testSNApp.componentManager.contextItemDidChangeInArea(testComponent.area)

      await sleep(SHORT_DELAY_TIME)

      expect(itemInContext).not.toBeUndefined()
      expect(itemInContext.uuid).toBe(simpleNote.uuid)
      expect(itemInContext.content.title).toBe(simpleNote.title)
      expect(itemInContext.content.text).toBe(simpleNote.text)

      registerComponentHandler(testSNApp, [testComponent.area], awesomeNote)
      testSNApp.componentManager.contextItemDidChangeInArea(testComponent.area)

      await sleep(SHORT_DELAY_TIME)

      expect(itemInContext).not.toBeUndefined()
      expect(itemInContext.uuid).toBe(awesomeNote.uuid)
      expect(itemInContext.content.title).toBe(awesomeNote.title)
      expect(itemInContext.content.text).toBe(awesomeNote.text)
    })

    test('selectItem', async () => {
      expect.hasAssertions()

      const testTagsComponent = await createComponentItem(
        testSNApp,
        testExtensionForTagsPackage,
      )

      const testTag1 = await createTagItem(testSNApp, 'Test 1')
      const testTag2 = await createTagItem(testSNApp, 'Test 2')

      await registerComponent(testSNApp, childWindow, testTagsComponent)

      /**
       * A mock function to check that the action handler is called.
       * We will then check that the return value contains the Tag's UUID and Title.
       */
      const onSelectTag = jest.fn().mockImplementation((data) => data)

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.SelectItem) {
          onSelectTag(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        testTag1,
        customActionHandler,
      )
      componentRelay.selectItem(testTag1)

      await sleep(SHORT_DELAY_TIME)

      expect(onSelectTag).toReturnWith(
        expect.objectContaining({
          item: expect.objectContaining({
            payload: expect.objectContaining({
              uuid: testTag1.uuid,
            }),
            title: testTag1.title,
          }),
        }),
      )

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        testTag2,
        customActionHandler,
      )
      componentRelay.selectItem(testTag2)

      await sleep(SHORT_DELAY_TIME)

      expect(onSelectTag).toReturnWith(
        expect.objectContaining({
          item: expect.objectContaining({
            payload: expect.objectContaining({
              uuid: testTag2.uuid,
            }),
            title: testTag2.title,
          }),
        }),
      )
    })

    test('clearSelection', async () => {
      expect.hasAssertions()

      const testTagsComponent = await createComponentItem(
        testSNApp,
        testExtensionForTagsPackage,
      )
      await registerComponent(testSNApp, childWindow, testTagsComponent)

      const onClearSelection = jest.fn().mockImplementation((data) => data)

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.ClearSelection) {
          onClearSelection(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        undefined,
        customActionHandler,
      )
      componentRelay.clearSelection()

      await sleep(SHORT_DELAY_TIME)

      expect(onClearSelection).toHaveBeenCalledWith({
        content_type: ContentType.Tag,
      })
    })

    test('createItem', async () => {
      expect.hasAssertions()
      await registerComponent(testSNApp, childWindow, testComponent)

      const noteItem = {
        content_type: ContentType.Note,
        content: {
          title: 'My note',
          text: 'This is an ordinary Note item that will created from an extension.',
        },
      }

      const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

      let createdItem

      componentRelay.createItem(noteItem, (item) => {
        createdItem = item
      })

      await sleep(SHORT_DELAY_TIME)

      expect(createdItem).not.toBeUndefined()
      expect(createdItem.content.title).toBe(noteItem.content.title)
      expect(createdItem.content.text).toBe(noteItem.content.text)

      const allNotesItems = testSNApp.allItems().filter((item) => {
        return item.content_type === ContentType.Note
      })

      // Only one Note item should have been created.
      expect(allNotesItems.length).toBe(1)

      /**
       * childWindow.parent.postMessage should be called twice:
       * - For the ComponentAction.CreateItem action
       * - For the ComponentAction.AssociateItem action (inside the createItem() callback)
       */
      expect(parentPostMessage).toBeCalledTimes(2)
    })

    test('createItems', async () => {
      expect.hasAssertions()
      await registerComponent(testSNApp, childWindow, testComponent)

      const noteItems = [
        {
          content_type: ContentType.Note,
          content: {
            title: 'My note #1',
            text: 'This is my first note.',
          },
        },
        {
          content_type: ContentType.Note,
          content: {
            title: 'My note #2',
            text: 'This is my second note.',
          },
        },
      ]

      const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

      let createdItems

      componentRelay.createItems(noteItems, (item) => {
        createdItems = item
      })

      await sleep(SHORT_DELAY_TIME)

      expect(createdItems).not.toBeUndefined()
      expect(createdItems.length).toBe(noteItems.length)

      const firstCreatedNote = createdItems[0]
      expect(firstCreatedNote.content.title).toBe(noteItems[0].content.title)
      expect(firstCreatedNote.content.text).toBe(noteItems[0].content.text)

      const secondCreatedNote = createdItems[1]
      expect(secondCreatedNote.content.title).toBe(noteItems[1].content.title)
      expect(secondCreatedNote.content.text).toBe(noteItems[1].content.text)

      const allNotesItems = testSNApp.allItems().filter((item) => {
        return item.content_type === ContentType.Note
      })

      // Only two Note items should have been created.
      expect(allNotesItems.length).toBe(noteItems.length)

      /**
       * childWindow.parent.postMessage should be called once:
       * - For the ComponentAction.CreateItems action
       */
      expect(parentPostMessage).toBeCalledTimes(1)
    })

    test('associateItem', async () => {
      expect.hasAssertions()

      const simpleNote = await createNoteItem(testSNApp, {
        title: 'A simple note',
        text: 'This is a note created for testing purposes.',
      })

      const testTagsComponent = await createComponentItem(
        testSNApp,
        testExtensionForTagsPackage,
      )
      await registerComponent(testSNApp, childWindow, testTagsComponent)

      const onAssociateItem = jest.fn().mockImplementation((data) => data)

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.AssociateItem) {
          onAssociateItem(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        undefined,
        customActionHandler,
      )
      componentRelay.associateItem({
        uuid: simpleNote.uuid,
      })

      await sleep(SHORT_DELAY_TIME)

      expect(onAssociateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({
            uuid: simpleNote.uuid,
          }),
        }),
      )
    })

    test('deassociateItem', async () => {
      expect.hasAssertions()

      const simpleNote = await createNoteItem(testSNApp, {
        title: 'A simple note',
        text: 'This is a note created for testing purposes.',
      })

      const testTagsComponent = await createComponentItem(
        testSNApp,
        testExtensionForTagsPackage,
      )
      await registerComponent(testSNApp, childWindow, testTagsComponent)

      const onDeassociateItem = jest.fn().mockImplementation((data) => data)

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.DeassociateItem) {
          onDeassociateItem(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        undefined,
        customActionHandler,
      )
      componentRelay.deassociateItem({
        uuid: simpleNote.uuid,
      })

      await sleep(SHORT_DELAY_TIME)

      expect(onDeassociateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.objectContaining({
            uuid: simpleNote.uuid,
          }),
        }),
      )
    })

    test('deleteItem and deleteItems', async () => {
      expect.hasAssertions()
      await registerComponent(testSNApp, childWindow, testComponent)

      const createItemPayload = {
        content_type: ContentType.Note,
        content: {
          title: 'Note title',
          text: 'This note should be deleted.',
        },
      }

      let createdNote

      /**
       * We can only delete an Item that was created through a component.
       * In this case, we want to create the item, and later delete it via
       * componentRelay.deleteItem()
       */
      componentRelay.createItem(createItemPayload, (data) => {
        createdNote = data
      })

      await sleep(SHORT_DELAY_TIME)

      const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

      let result

      /**
       * deleteItems is the main function, that takes an array of items to be deleted.
       * deleteItem calls deleteItems internally, by passing an array with a single item.
       */
      componentRelay.deleteItem(createdNote, (data) => {
        result = data
      })

      await sleep(SHORT_DELAY_TIME)

      expect(result).not.toBeUndefined()
      expect(result).toStrictEqual({ deleted: true })

      const deletedNote = testSNApp.findItem(createdNote.uuid)
      expect(deletedNote).toBeUndefined()

      const allNotesItems = testSNApp.allItems().filter((item) => {
        return item.content_type === ContentType.Note
      })

      // The created note should be deleted.
      expect(allNotesItems.length).toBe(0)

      /**
       * childWindow.parent.postMessage should be called once:
       * - For the ComponentAction.DeleteItems action
       */
      expect(parentPostMessage).toBeCalledTimes(1)
    })

    test('sendCustomEvent', async () => {
      expect.hasAssertions()

      const testTagsComponent = await createComponentItem(
        testSNApp,
        testExtensionForTagsPackage,
      )
      await registerComponent(testSNApp, childWindow, testTagsComponent)

      const onClearSelection = jest.fn().mockImplementation((data) => data)
      const customEventData = {
        content_type: ContentType.Tag,
      }

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.ClearSelection) {
          onClearSelection(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testTagsComponent.area],
        undefined,
        customActionHandler,
      )

      // We'll perform the clearSelection action, but using the sendCustomEvent function instead.
      componentRelay.sendCustomEvent(
        ComponentAction.ClearSelection,
        customEventData,
      )

      await sleep(SHORT_DELAY_TIME)

      expect(onClearSelection).toHaveBeenCalledWith(customEventData)
    })

    test('saveItem', async () => {
      expect.hasAssertions()
      await registerComponent(testSNApp, childWindow, testComponent)

      const createItemPayload = {
        content_type: ContentType.Note,
        content: {
          title: 'Note title',
          text: 'This note should be updated.',
        },
      }

      let createdNote

      /**
       * We can only save an Item that was created through a component.
       * In this case, we want to create the item, and later modify it then save it via
       * componentRelay.saveItem()
       */
      componentRelay.createItem(createItemPayload, (data) => {
        createdNote = data
      })

      await sleep(SHORT_DELAY_TIME)

      const parentPostMessage = jest.spyOn(childWindow.parent, 'postMessage')

      /**
       * saveItems is the main function, that takes an array of items to be saved.
       * saveItem calls saveItems internally, by passing an array with a single item.
       */
      createdNote.content.text = 'This note is ready!'

      const onSaveItemCallback = jest.fn()
      componentRelay.saveItem(createdNote, onSaveItemCallback)

      await sleep(SHORT_DELAY_TIME)

      const savedItem = testSNApp.findItem(createdNote.uuid) as SNNote
      expect(savedItem.text).toBe(createdNote.content.text)

      // The passed callback should be called once.
      expect(onSaveItemCallback).toBeCalledTimes(1)

      const allNotesItems = testSNApp.allItems().filter((item) => {
        return item.content_type === ContentType.Note
      })

      // There should be a total of 1 Note item.
      expect(allNotesItems.length).toBe(1)

      /**
       * childWindow.parent.postMessage should be called once:
       * - For the ComponentAction.DeleteItems action
       */
      expect(parentPostMessage).toBeCalledTimes(1)
    })

    test('setSize', async () => {
      expect.hasAssertions()
      await registerComponent(testSNApp, childWindow, testComponent)

      const onSetSize = jest.fn().mockImplementation((data) => data)

      const customActionHandler = (component, action, data) => {
        if (action === ComponentAction.SetSize) {
          onSetSize(data)
        }
      }

      registerComponentHandler(
        testSNApp,
        [testComponent.area],
        undefined,
        customActionHandler,
      )
      componentRelay.setSize('100px', '100px')

      await sleep(SHORT_DELAY_TIME)

      expect(onSetSize).toHaveBeenCalledTimes(1)
      expect(onSetSize).toReturnWith(
        expect.objectContaining({
          type: 'container',
          width: '100px',
          height: '100px',
        }),
      )
    })

    describe('keyDownEvent', () => {
      const onKeyDown = jest.fn().mockImplementation((data) => data)

      beforeEach(async () => {
        await registerComponent(testSNApp, childWindow, testComponent)

        const customActionHandler = (component, action, data) => {
          if (action === ComponentAction.KeyDown) {
            onKeyDown(data)
          }
        }

        registerComponentHandler(
          testSNApp,
          [testComponent.area],
          undefined,
          customActionHandler,
        )
      })

      afterEach(() => {
        onKeyDown.mockClear()
      })

      test('ctrl key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(
          new KeyboardEvent('keydown', { ctrlKey: true }),
        )

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyDown).toHaveBeenCalledTimes(1)
        expect(onKeyDown).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Control',
          }),
        )
      })

      test('shift key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(
          new KeyboardEvent('keydown', { shiftKey: true }),
        )

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyDown).toHaveBeenCalledTimes(1)
        expect(onKeyDown).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Shift',
          }),
        )
      })

      test('meta key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(
          new KeyboardEvent('keydown', { metaKey: true }),
        )

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyDown).toHaveBeenCalledTimes(1)
        expect(onKeyDown).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Meta',
          }),
        )
      })
    })

    describe('keyUpEvent', () => {
      const onKeyUp = jest.fn().mockImplementation((data) => data)

      beforeEach(async () => {
        await registerComponent(testSNApp, childWindow, testComponent)

        const customActionHandler = (component, action, data) => {
          if (action === ComponentAction.KeyUp) {
            onKeyUp(data)
          }
        }

        registerComponentHandler(
          testSNApp,
          [testComponent.area],
          undefined,
          customActionHandler,
        )
      })

      afterEach(() => {
        onKeyUp.mockClear()
      })

      test('ctrl key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(
          new KeyboardEvent('keyup', { key: 'Control' }),
        )

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyUp).toHaveBeenCalledTimes(1)
        expect(onKeyUp).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Control',
          }),
        )
      })

      test('shift key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }))

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyUp).toHaveBeenCalledTimes(1)
        expect(onKeyUp).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Shift',
          }),
        )
      })

      test('meta key', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta' }))

        await sleep(SHORT_DELAY_TIME)

        expect(onKeyUp).toHaveBeenCalledTimes(1)
        expect(onKeyUp).toHaveBeenCalledWith(
          expect.objectContaining({
            keyboardModifier: 'Meta',
          }),
        )
      })
    })

    describe('mouseClickEvent', async () => {
      const onClick = jest.fn().mockImplementation((data) => data)

      beforeEach(async () => {
        await registerComponent(testSNApp, childWindow, testComponent)

        const customActionHandler = (component, action, data) => {
          if (action === ComponentAction.Click) {
            onClick(data)
          }
        }

        registerComponentHandler(
          testSNApp,
          [testComponent.area],
          undefined,
          customActionHandler,
        )
      })

      afterEach(() => {
        onClick.mockClear()
      })

      test('normal click', async () => {
        expect.hasAssertions()

        childWindow.dispatchEvent(new MouseEvent('click', {}))

        await sleep(SHORT_DELAY_TIME)

        expect(onClick).toHaveBeenCalledTimes(1)
        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({}))
      })
    })

    describe('test permissions', () => {
      let simpleNote: SNNote
      let awesomeNote: SNNote

      beforeAll(() => {
        window.confirm = (message) => false
      })

      beforeEach(async () => {
        simpleNote = await createNoteItem(testSNApp, {
          title: 'A simple note',
          text: 'This is a note created for testing purposes.',
        })
        awesomeNote = await createNoteItem(testSNApp, {
          title: 'Awesome note!',
          text: "This is not just any note, it's an awesome note!",
        })
        await registerComponent(testSNApp, childWindow, testComponent)
      })

      afterAll(() => {
        window.confirm = (message) => true
      })

      test('setComponentData', async () => {
        const dataKey = `key-${+new Date()}`
        const dataValue = `value-${+new Date()}`

        // A component does not need special permissions to set its data.
        componentRelay.setComponentDataValueForKey(dataKey, dataValue)

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        const storedDataForKey =
          componentRelay.getComponentDataValueForKey(dataKey)
        expect(storedDataForKey).toBe(dataValue)
      })

      test('streamContextItem', async () => {
        let streamedNote

        componentRelay.streamContextItem((items) => {
          streamedNote = items
        })

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        expect(streamedNote).toBeUndefined()
      })

      test('streamItems', async () => {
        let streamedNotes

        componentRelay.streamItems([ContentType.Note], (items) => {
          streamedNotes = items
        })

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        expect(streamedNotes).toBeUndefined()
      })

      test('createItems', async () => {
        let createdNote
        const noteItem = {
          content_type: ContentType.Note,
          content: {
            title: 'My note',
            text: 'This is an ordinary Note item that will created from an extension.',
          },
        }

        componentRelay.createItem(noteItem, (result) => {
          createdNote = result
        })

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        expect(createdNote).toBeUndefined()

        // There should be 2 notes only.
        const allNotes = testSNApp.getItems(ContentType.Note)
        expect(allNotes.length).toBe(2)
      })

      test('saveItems', async () => {
        const itemToSave = {
          uuid: awesomeNote.uuid,
          content: {
            title: 'Changed',
          },
          content_type: 'Note',
        }

        //@ts-ignore
        componentRelay.saveItem(itemToSave, () => {
          console.info("You shouldn't see this message :(")
        })

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        awesomeNote = testSNApp.findItem(awesomeNote.uuid) as SNNote
        expect(awesomeNote.title).not.toBe('Changed')
      })

      test('deleteItems', async () => {
        componentRelay.streamItems([ContentType.Note], (items) => {
          //@ts-ignore
          componentRelay.deleteItems(items, (result) => {
            console.info("You shouldn't see this message :(", result)
          })
        })

        registerComponentHandler(testSNApp, [testComponent.area], simpleNote)
        testSNApp.componentManager.contextItemDidChangeInArea(
          testComponent.area,
        )

        await sleep(SHORT_DELAY_TIME)

        simpleNote = testSNApp.findItem(simpleNote.uuid) as SNNote
        awesomeNote = testSNApp.findItem(awesomeNote.uuid) as SNNote

        expect(simpleNote).not.toBeUndefined()
        expect(awesomeNote).not.toBeUndefined()
        expect(simpleNote.deleted).toBeFalsy()
        expect(awesomeNote.deleted).toBeFalsy()
      })
    })

    /**
     * When the original message is not found, this mostly indicates that there's a communication
     * issue between the component relay and Standard Notes.
     */
    test('should alert when original message is not found', async () => {
      expect.hasAssertions()

      await createNoteItem(testSNApp)
      const contentTypes = [ContentType.Note]

      await registerComponent(testSNApp, childWindow, testComponent)

      const windowAlert = jest.spyOn(childWindow, 'alert')
      const loggerInfo = jest.spyOn(Logger, 'info')

      // @ts-ignore
      const sentMessagesPush = jest.spyOn(
        componentRelay['sentMessages'],
        'push',
      )
      sentMessagesPush.mockImplementation(() => false)

      componentRelay.streamItems(contentTypes, (items) => {
        childWindow.alert('This should not be executed.')
      })

      await sleep(SHORT_DELAY_TIME)

      expect(windowAlert).toBeCalledTimes(0)
      expect(loggerInfo).toBeCalled()

      const expectedMessage =
        `The extension '${childWindow.document.title}' is attempting to communicate with ` +
        `Standard Notes, but an error is preventing it from doing so. Please restart this extension and try again.`
      expect(loggerInfo).toBeCalledWith(expectedMessage)
    })
  })

  describe('getItemAppDataValue', () => {
    test('on a JSON object', async () => {
      let simpleNote = await createNoteItem(testSNApp, {
        title: 'A simple note',
        text: 'This is a note created for testing purposes.',
      })

      let item = jsonForItem(simpleNote, testComponent)

      let appDataValue = componentRelay.getItemAppDataValue(item, 'foo')
      expect(appDataValue).toBeUndefined()

      simpleNote = (await testSNApp.changeAndSaveItem(
        simpleNote.uuid,
        (mutator: NoteMutator) => {
          // @ts-ignore
          mutator.setAppDataItem('foo', 'bar')
        },
      )) as SNNote

      item = jsonForItem(simpleNote, testComponent)

      appDataValue = componentRelay.getItemAppDataValue(item, 'foo')
      expect(appDataValue).not.toBeUndefined()
      expect(appDataValue).toBe('bar')
    })

    it('should return undefined on an undefined value', () => {
      expect(
        componentRelay.getItemAppDataValue(undefined, 'foo'),
      ).toBeUndefined()
    })

    it('should return undefined on an undefined value', () => {
      expect(
        componentRelay.getItemAppDataValue(undefined, 'foo'),
      ).toBeUndefined()
    })

    it('should return undefined on an empty object', () => {
      // @ts-ignore
      expect(componentRelay.getItemAppDataValue({}, 'foo')).toBeUndefined()
    })

    it('should return undefined on a object that is not of type ItemMessagePayload', () => {
      // @ts-ignore
      expect(
        componentRelay.getItemAppDataValue({ test: 1, testing: {} }, 'foo'),
      ).toBeUndefined()
    })
  })
})
