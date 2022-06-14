import './TaskItem.scss'

import { ChangeEvent, createRef, KeyboardEvent, useEffect, useState } from 'react'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector, useDidMount } from '../../app/hooks'
import { taskDeleted, taskModified, TaskPayload, taskToggled } from './tasks-slice'

import { CheckBoxInput, TextAreaInput } from '../../common/components'

/**
 * A delay in the dispatch function, when a task is opened.
 * Necessary to allow for transitions to occur.
 */
const DISPATCH_OPENED_DELAY_MS = 1_250

/**
 * A delay in the dispatch function, when a task is completed.
 * Necessary to allow for transitions to occur.
 */
const DISPATCH_COMPLETED_DELAY_MS = 1_850

const Container = styled.div<{ completed?: boolean }>`
  align-content: center;
  align-items: center;
  display: flex;
  flex-direction: row;

  ${({ completed }) =>
    completed &&
    `
    color: var(--sn-stylekit-info-color);
  `}

  min-width: 10%;
  max-width: 85%;
`

export type TaskItemProps = {
  task: TaskPayload
  groupName: string
  innerRef?: (element?: HTMLElement | null | undefined) => any
}

const TaskItem: React.FC<TaskItemProps> = ({ task, groupName, innerRef, ...props }) => {
  const textAreaRef = createRef<HTMLTextAreaElement>()

  const dispatch = useAppDispatch()

  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const spellCheckEnabled = useAppSelector((state) => state.settings.spellCheckerEnabled)

  const [completed, setCompleted] = useState(!!task.completed)
  const [description, setDescription] = useState(task.description)

  function resizeTextArea(textarea: HTMLTextAreaElement | null): void {
    if (!textarea) {
      return
    }

    /**
     * Set to 1px first to reset scroll height in case it shrunk.
     */
    const heightOffset = 4
    textarea.style.height = '1px'
    textarea.style.height = textarea.scrollHeight - heightOffset + 'px'
  }

  useEffect(() => {
    resizeTextArea(textAreaRef.current)
  })

  function onCheckBoxToggle() {
    const newCompletedState = !completed
    setCompleted(newCompletedState)

    newCompletedState
      ? textAreaRef.current!.classList.add('cross-out')
      : textAreaRef.current!.classList.add('no-text-decoration')

    const dispatchDelay = newCompletedState ? DISPATCH_COMPLETED_DELAY_MS : DISPATCH_OPENED_DELAY_MS

    setTimeout(() => {
      dispatch(taskToggled({ id: task.id, groupName }))
    }, dispatchDelay)
  }

  function onTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value)
  }

  function onKeyUp(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Delete task if empty and enter pressed
    if (event.key === 'Enter') {
      if (description.length === 0) {
        dispatch(taskDeleted({ id: task.id, groupName }))
        event.preventDefault()
      }
    }

    const element = event.target as HTMLTextAreaElement
    resizeTextArea(element)
  }

  function onKeyPress(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      // We want to disable any action on enter.
      event.preventDefault()
    }
  }

  /**
   * Save the task after the user has stopped typing.
   */
  useDidMount(() => {
    const timeoutId = setTimeout(() => {
      if (description !== task.description) {
        dispatch(taskModified({ task: { id: task.id, description }, groupName }))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [description, groupName])

  return (
    <Container data-testid="task-item" completed={completed} ref={innerRef} {...props}>
      <CheckBoxInput testId="check-box-input" checked={completed} disabled={!canEdit} onChange={onCheckBoxToggle} />
      <TextAreaInput
        testId="text-area-input"
        className="text-area-input"
        disabled={!canEdit || !!completed}
        onChange={onTextChange}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        ref={textAreaRef}
        spellCheck={spellCheckEnabled}
        value={description}
      />
    </Container>
  )
}

export default TaskItem
