import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { UserFeaturesData } from './UserFeaturesData'

export type UserFeaturesResponse = DeprecatedHttpResponse & {
  data: UserFeaturesData
}
