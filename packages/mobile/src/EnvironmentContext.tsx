import { TEnvironment } from '@Root/App'
import React from 'react'

export const EnvironmentContext = React.createContext<TEnvironment | undefined>(undefined)

export const SafeEnvironmentContext = EnvironmentContext as React.Context<TEnvironment>
