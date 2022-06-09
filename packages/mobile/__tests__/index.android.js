/* eslint-disable */
import React from 'react'
import 'react-native'
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import Index from '../index.android'

it('renders correctly', () => {
  const tree = renderer.create(<Index />)
})
/* eslint-enable */
