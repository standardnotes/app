import { UnprotectedAccessSecondsDuration } from './UnprotectedAccessSecondsDuration'
import { c } from 'ttag'

export const ProtectionSessionDurations = [
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneMinute,
    label: c('B4.Security.Protections.Label').t`1 Minute`,
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.FiveMinutes,
    label: c('B4.Security.Protections.Label').t`5 Minutes`,
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneHour,
    label: c('B4.Security.Protections.Label').t`1 Hour`,
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneWeek,
    label: c('B4.Security.Protections.Label').t`1 Week`,
  },
]
