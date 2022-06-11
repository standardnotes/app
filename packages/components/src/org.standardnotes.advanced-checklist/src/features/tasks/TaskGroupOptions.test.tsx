import { fireEvent, screen } from '@testing-library/react'
import { testRender } from '../../testUtils'

import TaskGroupOptions from './TaskGroupOptions'
import { tasksGroupDeleted } from './tasks-slice'

function clickButton(element: HTMLElement) {
  fireEvent.mouseDown(element)
  fireEvent.mouseUp(element)
  fireEvent.click(element)
  fireEvent.mouseMove(element)
  fireEvent.mouseUp(element)
}

const groupName = 'default group'

it('renders an options menu', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  expect(optionsButton).toBeInTheDocument()

  const deleteTaskGroup = screen.getByTestId('delete-task-group')
  const mergeTaskGroup = screen.getByTestId('merge-task-group')

  expect(deleteTaskGroup).not.toBeVisible()
  expect(mergeTaskGroup).not.toBeVisible()

  clickButton(optionsButton)

  expect(deleteTaskGroup).toBeVisible()
  expect(mergeTaskGroup).toBeVisible()
})

it('should dispatch tasksGroupDeleted action', () => {
  const { mockStore } = testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const deleteTaskGroup = screen.getByTestId('delete-task-group')
  clickButton(deleteTaskGroup)

  const confirmDialog = screen.getByTestId('delete-task-group-dialog')
  expect(confirmDialog).toBeInTheDocument()
  expect(confirmDialog).toHaveTextContent(
    `Are you sure you want to delete the group '${groupName}'?`
  )

  const confirmButton = screen.getByTestId('confirm-dialog-button')
  fireEvent.click(confirmButton)

  const dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(1)
  expect(dispatchedActions[0]).toMatchObject(tasksGroupDeleted({ groupName }))
})

it('should open the merge task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const mergeTaskGroup = screen.getByTestId('merge-task-group')
  clickButton(mergeTaskGroup)

  expect(screen.getByTestId('merge-task-group-dialog')).toBeInTheDocument()
})

it('should open the delete task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const deleteTaskGroup = screen.getByTestId('delete-task-group')
  clickButton(deleteTaskGroup)

  expect(screen.getByTestId('delete-task-group-dialog')).toBeInTheDocument()
})

it('should open the rename task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const renameTaskGroup = screen.getByTestId('rename-task-group')
  clickButton(renameTaskGroup)

  expect(screen.getByTestId('rename-task-group-dialog')).toBeInTheDocument()
})

it('should close the delete task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const deleteTaskGroup = screen.getByTestId('delete-task-group')
  clickButton(deleteTaskGroup)

  const cancelButton = screen.getByTestId('cancel-dialog-button')
  clickButton(cancelButton)

  expect(
    screen.queryByTestId('trash-task-group-dialog')
  ).not.toBeInTheDocument()
})

it('should close the merge task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const mergeTaskGroup = screen.getByTestId('merge-task-group')
  clickButton(mergeTaskGroup)

  const cancelButton = screen.queryAllByRole('button')[0]
  clickButton(cancelButton)

  expect(
    screen.queryByTestId('merge-task-group-dialog')
  ).not.toBeInTheDocument()
})

it('should close the rename task group dialog', () => {
  testRender(<TaskGroupOptions groupName={groupName} />)

  const optionsButton = screen.getByTestId('task-group-options')
  fireEvent.click(optionsButton)

  const renameTaskGroup = screen.getByTestId('rename-task-group')
  clickButton(renameTaskGroup)

  const cancelButton = screen.queryAllByRole('button')[0]
  clickButton(cancelButton)

  expect(
    screen.queryByTestId('rename-task-group-dialog')
  ).not.toBeInTheDocument()
})
