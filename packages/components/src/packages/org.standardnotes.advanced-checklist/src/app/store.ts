import { configureStore } from '@reduxjs/toolkit'

import settingsReducer from '../features/settings/settings-slice'
import tasksReducer from '../features/tasks/tasks-slice'
import listenerMiddleware from './listenerMiddleware'

export const store = configureStore({
  reducer: {
    tasks: tasksReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware),
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
