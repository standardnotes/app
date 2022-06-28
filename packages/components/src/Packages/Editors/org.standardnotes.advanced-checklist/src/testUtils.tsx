import { render as rtlRender, RenderOptions } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { RootState } from './app/store'

const defaultMockState: RootState = {
  tasks: {
    schemaVersion: '1.0.0',
    defaultSections: [],
    groups: [],
  },
  settings: {
    canEdit: true,
    isRunningOnMobile: false,
    spellCheckerEnabled: true,
  },
}

export function testRender(ui: React.ReactElement, renderOptions?: RenderOptions, state?: Partial<RootState>) {
  const mockStore = configureStore()({
    ...defaultMockState,
    ...state,
  })
  function Wrapper({ children }: { children: React.ReactElement<any, string | React.JSXElementConstructor<any>> }) {
    return <Provider store={mockStore}>{children}</Provider>
  }
  return {
    component: rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    mockStore,
  }
}
