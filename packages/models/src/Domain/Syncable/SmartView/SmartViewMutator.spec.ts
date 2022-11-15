import { MutationType } from '../../Abstract/Item'
import { createSmartViewWithContent } from '../../Utilities/Test/SpecUtils'
import { SmartViewMutator } from './SmartViewMutator'

describe('smart view mutator', () => {
  it('should set predicate', () => {
    const smartView = createSmartViewWithContent({
      title: 'foo',
      predicate: {
        keypath: 'title',
        operator: '=',
        value: 'foo',
      },
    })

    const mutator = new SmartViewMutator(smartView, MutationType.UpdateUserTimestamps)
    mutator.predicate = {
      keypath: 'title',
      operator: '=',
      value: 'bar',
    }
    const result = mutator.getResult()

    expect(result.content.predicate.value).toBe('bar')
  })
})
