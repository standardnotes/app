import { TagContent } from './../Tag/TagContent'
import { PredicateJsonForm } from '../../Runtime/Predicate/Interface'

export interface SmartViewContent extends TagContent {
  predicate: PredicateJsonForm
}
