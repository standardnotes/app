import { MutationType } from '../../Abstract/Item'
import { createSmartViewWithContent, createSmartViewWithTitle } from '../../Utilities/Test/SpecUtils'
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

  it('preferences should be undefined if previously undefined', () => {
    const smartView = createSmartViewWithTitle()
    const mutator = new SmartViewMutator(smartView, MutationType.UpdateUserTimestamps)
    const result = mutator.getResult()

    expect(result.content.preferences).toBeFalsy()
  })

  it('preferences should be lazy-created if attempting to set a property', () => {
    const smartView = createSmartViewWithTitle()
    const mutator = new SmartViewMutator(smartView, MutationType.UpdateUserTimestamps)
    mutator.preferences.sortBy = 'content_type'
    const result = mutator.getResult()

    expect(result.content.preferences?.sortBy).toEqual('content_type')
  })

  it('preferences should be nulled if client is reseting', () => {
    const smartView = createSmartViewWithContent({
      title: 'foo',
      preferences: {
        sortBy: 'content_type',
      },
    })

    const mutator = new SmartViewMutator(smartView, MutationType.UpdateUserTimestamps)
    mutator.preferences = undefined
    const result = mutator.getResult()

    expect(result.content.preferences).toBeFalsy()
  })
})
