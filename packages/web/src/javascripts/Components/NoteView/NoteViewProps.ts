import { WebApplication } from '@/Application/WebApplication'
import { NoteViewController } from './Controller/NoteViewController'

export interface NoteViewProps {
  application: WebApplication
  controller: NoteViewController
}
