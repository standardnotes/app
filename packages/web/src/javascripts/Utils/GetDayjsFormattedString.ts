import dayjs from 'dayjs'
import AdvancedFormat from 'dayjs/plugin/advancedFormat'
import IsoWeek from 'dayjs/plugin/isoWeek'
import UTC from 'dayjs/plugin/utc'
import Timezone from 'dayjs/plugin/timezone'
import WeekYear from 'dayjs/plugin/weekYear'
import WeekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(AdvancedFormat)
dayjs.extend(IsoWeek)
dayjs.extend(UTC)
dayjs.extend(Timezone)
dayjs.extend(WeekYear)
dayjs.extend(WeekOfYear)

export function getDayjsFormattedString(date: Parameters<typeof dayjs>[0], format: string): string {
  return dayjs(date).format(format)
}
