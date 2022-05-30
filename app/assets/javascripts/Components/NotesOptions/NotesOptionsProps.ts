import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'

export type NotesOptionsProps = {
  application: WebApplication
  appState: AppState
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}
