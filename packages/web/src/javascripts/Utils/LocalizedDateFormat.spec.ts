import { configureDateLocale } from '@/Utils/DateLocale'
import { formatDateAndTimeForNote } from '@/Utils/LocalizedDateFormat'

describe('LocalizedDateFormat', () => {
  const sampleDate = new Date('2024-03-15T14:30:00')

  afterEach(async () => {
    await configureDateLocale({ appLocale: 'en_US', localizationEnabled: false })
  })

  it('formats note dates using the app locale when localization is enabled', async () => {
    await configureDateLocale({ appLocale: 'fr_FR', localizationEnabled: true })

    const formatted = formatDateAndTimeForNote(sampleDate, false)

    expect(formatted).toMatch(/vendredi|friday/i)
    expect(formatted).toMatch(/mars|mar/i)
  })

  it('uses the browser locale when localization is disabled', async () => {
    const originalNavigator = global.navigator

    Object.defineProperty(global, 'navigator', {
      value: { languages: ['de-DE'] },
      configurable: true,
    })

    await configureDateLocale({ appLocale: 'fr_FR', localizationEnabled: false })

    const formatted = formatDateAndTimeForNote(sampleDate, false)

    expect(formatted).toMatch(/freitag|friday/i)
    expect(formatted).toMatch(/märz|mar/i)

    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    })
  })
})
