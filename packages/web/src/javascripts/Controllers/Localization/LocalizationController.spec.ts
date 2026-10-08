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

  const featuresController = {
    isLocalizationEnabled: () => localizationEnabled,
    isLocalizationFeatureAvailable: () => true,
    toggleLocalization: () => {
      localizationEnabled = !localizationEnabled
    },
  }

  const createController = () =>
    new LocalizationController(
      featuresController as never,
      () => getPersistedLocale() ?? syncedLocale,
      { getValue: () => true, setValue: jest.fn() } as never,
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
})
