import { resolveActiveDateLocales } from '@standardnotes/i18n'
import dayjs from 'dayjs'
import RelativeTimePlugin from 'dayjs/plugin/relativeTime'
import UpdateLocalePlugin from 'dayjs/plugin/updateLocale'

dayjs.extend(UpdateLocalePlugin)
dayjs.extend(RelativeTimePlugin)

dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: '%ds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
})

type DateLocaleState = {
  intlLocale: string
  localizationEnabled: boolean
}

const initialResolvedLocales = resolveActiveDateLocales({
  appLocale: 'en_US',
  localizationEnabled: false,
})

const state: DateLocaleState = {
  intlLocale: initialResolvedLocales.intlLocale,
  localizationEnabled: false,
}

const dayjsLocaleLoaders: Record<string, () => Promise<unknown>> = {
  de: () => import('dayjs/locale/de'),
  en: () => Promise.resolve(),
  es: () => import('dayjs/locale/es'),
  fr: () => import('dayjs/locale/fr'),
  ja: () => import('dayjs/locale/ja'),
  'pt-br': () => import('dayjs/locale/pt-br'),
  tr: () => import('dayjs/locale/tr'),
  'zh-cn': () => import('dayjs/locale/zh-cn'),
}

async function loadDayjsLocale(dayjsLocale: string): Promise<void> {
  const load = dayjsLocaleLoaders[dayjsLocale] ?? dayjsLocaleLoaders.en
  await load()
}

export function getIntlLocale(): string {
  return state.intlLocale
}

export function isDateLocalizationEnabled(): boolean {
  return state.localizationEnabled
}

export async function configureDateLocale(options: { appLocale: string; localizationEnabled: boolean }): Promise<void> {
  state.localizationEnabled = options.localizationEnabled

  const { intlLocale, dayjsLocale } = resolveActiveDateLocales(options)
  state.intlLocale = intlLocale

  try {
    await loadDayjsLocale(dayjsLocale)
    dayjs.locale(dayjsLocale)
  } catch (error) {
    console.error('Failed to load dayjs locale, falling back to English', error)
    dayjs.locale('en')
  }
}
