import { ApplicationEvent, InternalEventInterface } from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { clearPersistedLocale, getPersistedLocale, persistLocale } from '@/Utils/LocalePersistence'
import { LocalizationController } from './LocalizationController'
import { localizationStore } from './LocalizationStore'

const catalog = { en_US: 'English', fr_FR: 'Français' }

let mockCurrentLocale = 'en_US'
const mockLocaleService = {
  getCurrentLocale: (): string => mockCurrentLocale,
  getAvailableLocales: jest.fn(),
  loadAndActivateLocale: jest.fn(),
}

jest.mock('./WebLocaleService', () => ({ getWebLocaleService: () => mockLocaleService }))
jest.mock('@/Utils/DateLocale', () => ({ configureDateLocale: jest.fn() }))
jest.mock('@/Application/Device/SyncDesktopMainProcessLocalization', () => ({
  syncDesktopMainProcessLocalization: jest.fn(),
}))
jest.mock('@/Application/Device/SyncMobileNativeLocalization', () => ({ syncMobileNativeLocalization: jest.fn() }))
jest.mock('@standardnotes/toast', () => ({
  addToast: jest.fn(),
  ToastType: { Success: 'success', Error: 'error' },
}))

describe('LocalizationController', () => {
  const originalLocation = window.location
  let reload: jest.Mock
  let localizationEnabled: boolean
  let syncedLocale: string | undefined
  let localizationAvailable: boolean
  let seenOnAccount: boolean
  let seenOnDevice: boolean

  const preferences = {
    getValue: () => seenOnAccount,
    setValue: jest.fn(async (_key: string, value: boolean) => {
      seenOnAccount = value
    }),
    getLocalValue: () => seenOnDevice,
    setLocalValue: (_key: string, value: boolean) => {
      seenOnDevice = value
    },
  }

  const featuresController = {
    isLocalizationEnabled: () => localizationEnabled,
    isLocalizationFeatureAvailable: () => localizationAvailable,
    toggleLocalization: () => {
      localizationEnabled = !localizationEnabled
    },
  }

  const createController = () =>
    new LocalizationController(
      featuresController as never,
      () => getPersistedLocale() ?? syncedLocale,
      preferences as never,
      {} as never,
      { getRoute: () => ({ type: 'none' }) } as never,
      { addEventHandler: jest.fn() } as never,
    )

  const sendEvent = (controller: LocalizationController, type: ApplicationEvent) =>
    controller.handleEvent({ type } as InternalEventInterface)

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

  const bootWithLocale = async (locale: string) => {
    mockCurrentLocale = locale
    localizationStore.setCurrentLocale(locale)
    const controller = createController()
    await sendEvent(controller, ApplicationEvent.LocalDataLoaded)
    await flushPromises()
    return controller
  }

  beforeEach(() => {
    reload = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, protocol: 'http:', reload },
    })

    localizationEnabled = true
    syncedLocale = undefined
    localizationAvailable = true
    seenOnAccount = true
    seenOnDevice = false
    preferences.setValue.mockClear()
    mockCurrentLocale = 'en_US'
    mockLocaleService.getAvailableLocales.mockResolvedValue(catalog)
    mockLocaleService.loadAndActivateLocale.mockImplementation(async (locale: string) => {
      mockCurrentLocale = locale
    })

    clearPersistedLocale()
    sessionStorage.clear()
    localizationStore.setAvailableLocales({})
    localizationStore.setCurrentLocale('en_US')
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  it('shows a toast after the reload when switching languages', async () => {
    const controller = await bootWithLocale('en_US')

    expect(await controller.changeLocaleAndReload('fr_FR')).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(getPersistedLocale()).toBe('fr_FR')
    expect(addToast).not.toHaveBeenCalled()

    await bootWithLocale('fr_FR')

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: ToastType.Success, message: expect.stringContaining('Français') }),
    )
  })

  it('does not show a toast on a regular reload', async () => {
    persistLocale('fr_FR')

    await bootWithLocale('fr_FR')

    expect(addToast).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('keeps the boot language when the saved language failed to load at startup', async () => {
    persistLocale('fr_FR')

    const controller = await bootWithLocale('en_US')

    expect(reload).not.toHaveBeenCalled()
    expect(localizationStore.currentLocale).toBe('en_US')
    expect(localizationStore.availableLocales).toEqual(catalog)
    expect(getPersistedLocale()).toBe('fr_FR')

    expect(await controller.changeLocaleAndReload('en_US')).toBe(true)
    expect(getPersistedLocale()).toBe('en_US')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads into English when localization is off but the page is in another language', async () => {
    localizationEnabled = false

    await bootWithLocale('fr_FR')

    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('sn-pending-locale-switch')).toBe('en_US')
  })

  it('clears the saved language on sign out', async () => {
    persistLocale('fr_FR')
    const controller = await bootWithLocale('fr_FR')

    await sendEvent(controller, ApplicationEvent.SignedOut)

    expect(getPersistedLocale()).toBeUndefined()
  })

  it('loads the language list while localization is still off', async () => {
    localizationEnabled = false

    await bootWithLocale('en_US')

    expect(localizationStore.availableLocales).toEqual(catalog)
  })

  it('loads the language list once the feature becomes available', async () => {
    localizationEnabled = false
    localizationAvailable = false
    mockLocaleService.getAvailableLocales.mockClear()

    const controller = await bootWithLocale('en_US')
    expect(mockLocaleService.getAvailableLocales).not.toHaveBeenCalled()

    localizationAvailable = true
    await sendEvent(controller, ApplicationEvent.FeaturesAvailabilityChanged)
    await flushPromises()

    expect(localizationStore.availableLocales).toEqual(catalog)
  })

  it('keeps the saved language and reports an error when the catalog fails to load', async () => {
    persistLocale('fr_FR')
    mockLocaleService.getAvailableLocales.mockRejectedValue(new Error('offline'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    await bootWithLocale('fr_FR')

    expect(getPersistedLocale()).toBe('fr_FR')
    expect(localizationStore.availableLocalesFailedToLoad).toBe(true)
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads once, after the switch animation, when turning localization on', async () => {
    localizationEnabled = false
    syncedLocale = 'fr_FR'
    const controller = await bootWithLocale('en_US')

    let finishAnimation: () => void = () => undefined
    const animation = new Promise<void>((resolve) => {
      finishAnimation = resolve
    })

    const toggling = controller.toggleLocalization(animation)
    await sendEvent(controller, ApplicationEvent.FeaturesAvailabilityChanged)
    await flushPromises()

    expect(reload).not.toHaveBeenCalled()

    finishAnimation()

    await toggling
    expect(reload).toHaveBeenCalledTimes(1)
    expect(getPersistedLocale()).toBe('fr_FR')
    expect(sessionStorage.getItem('sn-pending-locale-switch')).toBe('fr_FR')
  })

  describe('labs spotlight', () => {
    beforeEach(() => {
      localizationEnabled = false
      seenOnAccount = false
    })

    const launch = async () => {
      const controller = await bootWithLocale('en_US')
      await sendEvent(controller, ApplicationEvent.CompletedFullSync)
      return controller
    }

    const signInAndGainAccess = async (controller: LocalizationController) => {
      await sendEvent(controller, ApplicationEvent.SignedIn)
      localizationAvailable = true
      await sendEvent(controller, ApplicationEvent.FeaturesAvailabilityChanged)
    }

    it('opens after the launch sync when it has not been seen', async () => {
      const controller = await bootWithLocale('en_US')
      expect(controller.labsSpotlightOpen).toBe(false)

      await sendEvent(controller, ApplicationEvent.CompletedFullSync)

      expect(controller.labsSpotlightOpen).toBe(true)
    })

    it('does not open on launch when the launch sync brings a pref seen on another device', async () => {
      const controller = await bootWithLocale('en_US')
      await sendEvent(controller, ApplicationEvent.FeaturesAvailabilityChanged)
      expect(controller.labsSpotlightOpen).toBe(false)

      seenOnAccount = true
      await sendEvent(controller, ApplicationEvent.PreferencesChanged)
      await sendEvent(controller, ApplicationEvent.CompletedFullSync)

      expect(controller.labsSpotlightOpen).toBe(false)
    })

    it('does not open on sign in when the synced pref says it was already seen', async () => {
      localizationAvailable = false
      const controller = await launch()

      await signInAndGainAccess(controller)
      expect(controller.labsSpotlightOpen).toBe(false)

      seenOnAccount = true
      await sendEvent(controller, ApplicationEvent.PreferencesChanged)
      await sendEvent(controller, ApplicationEvent.CompletedFullSync)

      expect(controller.labsSpotlightOpen).toBe(false)
    })

    it('opens after the first sync following sign in when it has not been seen', async () => {
      localizationAvailable = false
      const controller = await launch()

      await signInAndGainAccess(controller)
      expect(controller.labsSpotlightOpen).toBe(false)

      await sendEvent(controller, ApplicationEvent.CompletedFullSync)

      expect(controller.labsSpotlightOpen).toBe(true)
    })

    it('keeps a signed-out dismissal when the account prefs replace the local ones on sign in', async () => {
      const controller = await launch()
      controller.dismissLabsSpotlight()

      await sendEvent(controller, ApplicationEvent.SignedIn)
      seenOnAccount = false
      await sendEvent(controller, ApplicationEvent.PreferencesChanged)
      expect(controller.labsSpotlightOpen).toBe(false)

      preferences.setValue.mockClear()
      await sendEvent(controller, ApplicationEvent.CompletedFullSync)

      expect(controller.labsSpotlightOpen).toBe(false)
      expect(preferences.setValue).toHaveBeenCalledWith('hasSeenLocalizationLabsSpotlight', true)
    })

    it('does not rewrite the account pref when it already says seen', async () => {
      seenOnDevice = true
      seenOnAccount = true

      await launch()

      expect(preferences.setValue).not.toHaveBeenCalled()
    })
  })
})
