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

export function getRelativeTimeString(date: Parameters<typeof dayjs>[0]): string {
  return dayjs(date).fromNow()
}
