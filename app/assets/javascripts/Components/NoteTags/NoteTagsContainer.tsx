import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { AutocompleteTagInput } from '@/Components/TagAutocomplete/AutocompleteTagInput'
import { NoteTag } from './NoteTag'
import { useEffect } from 'preact/hooks'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'

type Props = {
  appState: AppState
}

export const NoteTagsContainer = observer(({ appState }: Props) => {
  if (isStateDealloced(appState)) {
    return null
  }

  const { tags, tagsContainerMaxWidth } = appState.noteTags

  useEffect(() => {
    appState.noteTags.reloadTagsContainerMaxWidth()
  }, [appState])

  return (
    <div
      className="bg-transparent flex flex-wrap min-w-80 -mt-1 -mr-2"
      style={{
        maxWidth: tagsContainerMaxWidth,
      }}
    >
      {tags.map((tag) => (
        <NoteTag key={tag.uuid} appState={appState} tag={tag} />
      ))}
      <AutocompleteTagInput appState={appState} />
    </div>
  )
})
