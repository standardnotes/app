import { HttpResponse } from '../Http/HttpResponse'
import { UserFeaturesData } from './UserFeaturesData'

export type UserFeaturesResponse = HttpResponse & {
  data: UserFeaturesData
}
