import { UnprotectedAccessSecondsDuration } from './UnprotectedAccessSecondsDuration'
import { c } from 'ttag'

export function getProtectionSessionDurations() {
  return [
    {
      valueInSeconds: UnprotectedAccessSecondsDuration.OneMinute,
      label: c('B5.SecuritySync.Protections.Label').t`1 Minute`,
    },
    {
      valueInSeconds: UnprotectedAccessSecondsDuration.FiveMinutes,
      label: c('B5.SecuritySync.Protections.Label').t`5 Minutes`,
    },
    {
      valueInSeconds: UnprotectedAccessSecondsDuration.OneHour,
      label: c('B5.SecuritySync.Protections.Label').t`1 Hour`,
    },
    {
      valueInSeconds: UnprotectedAccessSecondsDuration.OneWeek,
      label: c('B5.SecuritySync.Protections.Label').t`1 Week`,
    },
  ]
}
