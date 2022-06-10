import {
  ChangeEvent,
  createRef,
  FocusEvent,
  KeyboardEvent,
  useState,
} from 'react'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { tasksGroupAdded } from './tasks-slice'

import { TextInput, WideButton } from '../../common/components'
import { AddIcon } from '../../common/components/icons'
import { ArrowVector } from '../../common/components/vectors'

const InputContainer = styled.div`
  background-color: var(--sn-stylekit-background-color);
  border: 1px solid var(--sn-stylekit-border-color);
  border-radius: 8px;
  box-sizing: border-box;
  padding: 16px;
  width: 100%;
`

const TutorialContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 9px;
  position: relative;
`

const Tutorial = styled.div`
  align-items: center;
  align-content: center;
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 100%;
  z-index: 100;
`

const TutorialText = styled.div`
  color: var(--sn-stylekit-paragraph-text-color);
  font-size: var(--sn-stylekit-font-size-h2);
  margin: 0;
  text-align: center;
  width: 194px;
`

const BaseEmptyContainer = styled.div`
  background-color: var(--sn-stylekit-border-color);
  border-radius: 8px;
  box-sizing: border-box;
  height: 66px;
  padding: 16px;
  margin-bottom: 9px;
`

const EmptyContainer1 = styled(BaseEmptyContainer)`
  opacity: 0.8;
`

const EmptyContainer2 = styled(BaseEmptyContainer)`
  opacity: 0.6;
`

const EmptyContainer3 = styled(BaseEmptyContainer)`
  opacity: 0.4;
`

const EmptyContainer4 = styled(BaseEmptyContainer)`
  opacity: 0.2;
`

const CreateGroup: React.FC = () => {
  const inputRef = createRef<HTMLInputElement>()

  const dispatch = useAppDispatch()

  const [group, setGroup] = useState('')
  const [isCreateMode, setIsCreateMode] = useState(false)

  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const spellCheckerEnabled = useAppSelector(
    (state) => state.settings.spellCheckerEnabled
  )
  const groupedTasks = useAppSelector((state) => state.tasks.groups)
  const taskGroupCount = groupedTasks.length

  function toggleMode() {
    setIsCreateMode(!isCreateMode)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setIsCreateMode(false)
    setGroup('')
  }

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setGroup(event.target.value)
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const groupName = (event.target as HTMLInputElement).value
      if (groupName.length > 0) {
        dispatch(tasksGroupAdded({ groupName }))
      }

      setIsCreateMode(false)
      setGroup('')
    }
  }

  if (!canEdit) {
    return <></>
  }

  return (
    <>
      {!isCreateMode && taskGroupCount > 0 ? (
        <WideButton data-testid="create-group-button" onClick={toggleMode}>
          <AddIcon />
        </WideButton>
      ) : (
        <>
          <InputContainer>
            <TextInput
              testId="create-group-input"
              value={group}
              enterKeyHint={'go'}
              onBlur={handleBlur}
              onChange={handleTextChange}
              onKeyPress={handleKeyPress}
              placeholder="Name your task group and press enter"
              ref={inputRef}
              spellCheck={spellCheckerEnabled}
              textSize="big"
              autoFocus
            />
          </InputContainer>
          {taskGroupCount === 0 && (
            <TutorialContainer>
              <Tutorial>
                <ArrowVector style={{ marginRight: 140, marginBottom: 12 }} />
                <TutorialText>
                  Get started by naming your first task group
                </TutorialText>
              </Tutorial>
              <EmptyContainer1 />
              <EmptyContainer2 />
              <EmptyContainer3 />
              <EmptyContainer4 />
            </TutorialContainer>
          )}
        </>
      )}
    </>
  )
}

export default CreateGroup
