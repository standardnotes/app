import { observer } from 'mobx-react-lite'
import AutocompleteTagInput from '@/Components/TagAutocomplete/AutocompleteTagInput'
import NoteTag from './NoteTag'
import { useEffect } from 'react'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'

type Props = {
  noteTagsController: NoteTagsController
  navigationController: NavigationController
}

const NoteTagsContainer = ({ noteTagsController, navigationController }: Props) => {
  const { tags } = noteTagsController

  useEffect(() => {
    noteTagsController.reloadTagsContainerMaxWidth()
  }, [noteTagsController])

  return (
    <div className="hidden min-w-80 max-w-full flex-wrap bg-transparent md:-mr-2 md:flex">
      {tags.map((tag) => (
        <NoteTag
          key={tag.uuid}
          noteTagsController={noteTagsController}
          navigationController={navigationController}
          tag={tag}
        />
      ))}
      <AutocompleteTagInput noteTagsController={noteTagsController} />
    </div>
  )
}

export default observer(NoteTagsContainer)
