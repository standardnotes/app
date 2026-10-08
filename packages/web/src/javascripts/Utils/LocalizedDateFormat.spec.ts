import { configureDateLocale } from '@/Utils/DateLocale'
import {
  capitalizeForSentenceStart,
  dateToStringStyle1,
  formatDateAndTimeForNote,
  formatDateAndTimeForNoteTitle,
  formatDateForContextMenu,
  formatDefaultDateTime,
} from '@/Utils/LocalizedDateFormat'

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

  describe('when localization is disabled', () => {
    beforeEach(async () => {
      await configureDateLocale({ appLocale: 'fr_FR', localizationEnabled: false })
    })

    it('matches the pre-localization note date format', () => {
      const datePart = sampleDate.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const timePart = sampleDate.toLocaleTimeString(undefined, { timeStyle: 'short' })

      expect(formatDateAndTimeForNote(sampleDate)).toBe(`${datePart} at ${timePart}`)
      expect(formatDateAndTimeForNote(sampleDate, false)).toBe(datePart)
      expect(formatDateAndTimeForNoteTitle(sampleDate)).toBe(`${datePart} at ${timePart}`)
    })

    it('matches the pre-localization Moments date format', () => {
      const timePart = sampleDate.toLocaleTimeString(undefined, { timeStyle: 'short' })

      expect(dateToStringStyle1(sampleDate)).toBe(`${sampleDate.toLocaleDateString()} at ${timePart}`)
    })

    it('matches the pre-localization context menu format', () => {
      expect(formatDateForContextMenu(sampleDate)).toBe(
        `${sampleDate.toDateString()} ${sampleDate.toLocaleTimeString()}`,
      )
    })

    it('matches the pre-localization default date time format', () => {
      expect(formatDefaultDateTime(sampleDate)).toBe(sampleDate.toLocaleString())
    })

    it('does not capitalize', () => {
      expect(capitalizeForSentenceStart('mardi 6 oct. 2026')).toBe('mardi 6 oct. 2026')
    })
  })

  describe('when localization is enabled', () => {
    beforeEach(async () => {
      await configureDateLocale({ appLocale: 'fr_FR', localizationEnabled: true })
    })

    it('lets the app locale join date and time', () => {
      expect(formatDateAndTimeForNote(sampleDate)).not.toContain(' at ')
      expect(dateToStringStyle1(sampleDate)).not.toContain(' at ')
    })

    it('keeps the pre-localization formats in the app locale', () => {
      expect(formatDateAndTimeForNote(sampleDate, false)).toBe(
        sampleDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
      )
      expect(formatDefaultDateTime(sampleDate)).toBe(sampleDate.toLocaleString('fr-FR'))
      expect(formatDateForContextMenu(sampleDate)).toBe(
        `${sampleDate.toLocaleDateString('fr-FR', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })} ${sampleDate.toLocaleTimeString('fr-FR')}`,
      )
    })
  })

  it('capitalizes the first letter for sentence-start titles', async () => {
    await configureDateLocale({ appLocale: 'fr_FR', localizationEnabled: true })

    const formatted = formatDateAndTimeForNoteTitle(sampleDate, false)

    expect(formatted.charAt(0)).toBe(formatted.charAt(0).toLocaleUpperCase('fr-FR'))
    expect(formatted).toMatch(/^V|^v/) // vendredi -> Vendredi
  })

  it('leaves already-capitalized strings unchanged', () => {
    expect(capitalizeForSentenceStart('Friday, March 15, 2024')).toBe('Friday, March 15, 2024')
  })
})
