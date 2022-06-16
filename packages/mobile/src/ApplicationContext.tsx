import { MobileApplication } from '@Lib/Application'
import React from 'react'

export const ApplicationContext = React.createContext<MobileApplication | undefined>(undefined)

export const SafeApplicationContext = ApplicationContext as React.Context<MobileApplication>
