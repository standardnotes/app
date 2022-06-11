import { screen, within } from '@testing-library/react'

import { testRender } from '../../testUtils'
import TaskItemList from './TaskItemList'

const defaultGroup = {
  name: 'default group',
  tasks: [
    {
      id: 'test-1',
      description: 'Testing #1',
      completed: false,
      createdAt: new Date(),
    },
    {
      id: 'test-2',
      description: 'Testing #2',
      completed: false,
      createdAt: new Date(),
    },
  ],
}

it('renders the open tasks container', async () => {
  testRender(<TaskItemList group={defaultGroup} />)

  const openTasksContainer = screen.getByTestId('open-tasks-container')

  expect(openTasksContainer).toBeInTheDocument()
  expect(openTasksContainer).toHaveTextContent('open tasks')

  const taskItems = within(openTasksContainer).getAllByTestId('task-item')
  expect(taskItems).toHaveLength(2)

  const completedTasksActions = screen.queryByTestId('completed-tasks-actions')
  expect(completedTasksActions).not.toBeInTheDocument()
})

it('renders the completed tasks container', () => {
  const groupWithCompletedTask = {
    name: 'a new group',
    tasks: [
      ...defaultGroup.tasks,
      {
        id: 'test-3',
        description: 'Testing #3',
        completed: true,
        createdAt: new Date(),
      },
    ],
  }

  testRender(<TaskItemList group={groupWithCompletedTask} />)

  const completedTasksContainer = screen.getByTestId(
    'completed-tasks-container'
  )

  expect(completedTasksContainer).toBeInTheDocument()
  expect(completedTasksContainer).toHaveTextContent('completed tasks')

  const taskItems = within(completedTasksContainer).getAllByTestId('task-item')
  expect(taskItems).toHaveLength(1)

  const completedTasksActions = screen.getByTestId('completed-tasks-actions')
  expect(completedTasksActions).toBeInTheDocument()
})
