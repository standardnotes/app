import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type SettingsState = {
  canEdit: boolean
  isRunningOnMobile: boolean
  spellCheckerEnabled: boolean
}

const initialState: SettingsState = {
  canEdit: true,
  isRunningOnMobile: false,
  spellCheckerEnabled: true,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setCanEdit(state, action: PayloadAction<boolean>) {
      state.canEdit = action.payload
    },
    setIsRunningOnMobile(state, action: PayloadAction<boolean>) {
      state.isRunningOnMobile = action.payload
    },
    setSpellCheckerEnabled(state, action: PayloadAction<boolean>) {
      state.spellCheckerEnabled = action.payload
    },
  },
})

export const { setCanEdit, setIsRunningOnMobile, setSpellCheckerEnabled } = settingsSlice.actions
export default settingsSlice.reducer
