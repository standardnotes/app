import { MILLISECONDS_IN_A_DAY } from '@/Constants/Constants'

export const calculateDifferenceBetweenDatesInDays = (firstDate: Date, secondDate: Date) => {
  const firstDateAsUTCMilliseconds = Date.UTC(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate())

  const secondDateAsUTCMilliseconds = Date.UTC(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate())

  return Math.round((firstDateAsUTCMilliseconds - secondDateAsUTCMilliseconds) / MILLISECONDS_IN_A_DAY)
}
