import { HttpResponse } from '../Http/HttpResponse'
import { SingleRevision } from './SingleRevision'

export type SingleRevisionResponse = HttpResponse & {
  data: SingleRevision
}
