import { ChangeEvent, createRef, KeyboardEvent, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { GroupPayload, taskAdded, tasksGroupDraft } from './tasks-slice'

import { TextInput } from '../../common/components'
import { DottedCircleIcon } from '../../common/components/icons'
import { isLastActiveGroup } from '../../common/utils'

const Container = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 8px;

  & > *:first-child {
    margin-left: 1px;
    margin-right: 9px;
  }
`

type CreateTaskProps = {
  group: GroupPayload
}

const CreateTask: React.FC<CreateTaskProps> = ({ group }) => {
  const inputRef = createRef<HTMLInputElement>()

  const dispatch = useAppDispatch()

  const spellCheckerEnabled = useAppSelector((state) => state.settings.spellCheckerEnabled)
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const allGroups = useAppSelector((state) => state.tasks.groups)

  const groupName = group.name
  const [taskDraft, setTaskDraft] = useState<string>(group.draft ?? '')

  function onTextChange(event: ChangeEvent<HTMLInputElement>) {
    const draft = event.target.value
    dispatch(tasksGroupDraft({ groupName, draft }))
    setTaskDraft(draft)
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const rawString = (event.target as HTMLInputElement).value
      if (rawString.length === 0) {
        return
      }

      dispatch(taskAdded({ task: { id: uuidv4(), description: rawString }, groupName }))
      setTaskDraft('')
    }
  }

  if (!canEdit) {
    return <></>
  }

  const isLastActive = isLastActiveGroup(allGroups, groupName)

  return (
    <Container>
      <DottedCircleIcon />
      <TextInput
        testId="create-task-input"
        disabled={!canEdit}
        enterKeyHint={'go'}
        onChange={onTextChange}
        onKeyPress={handleKeyPress}
        placeholder={'Type a task and press enter'}
        ref={inputRef}
        spellCheck={spellCheckerEnabled}
        value={taskDraft}
        autoFocus={isLastActive}
      />
    </Container>
  )
}

export default CreateTask
