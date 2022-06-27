import { screen, within } from '@testing-library/react'

import { testRender } from '../../testUtils'
import TaskSectionList from './TaskSectionList'

const defaultGroup = {
  name: 'default group',
  sections: [
    {
      id: 'open-tasks',
      name: 'Open tasks',
    },
    {
      id: 'completed-tasks',
      name: 'Completed tasks',
    },
  ],
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
  testRender(<TaskSectionList group={defaultGroup} />)

  const openTasksContainer = screen.getByTestId('open-tasks-section')

  expect(openTasksContainer).toBeInTheDocument()
  expect(openTasksContainer).toHaveTextContent('Open tasks')

  const taskItems = within(openTasksContainer).getAllByTestId('task-item')
  expect(taskItems).toHaveLength(2)

  const completedTasksActions = screen.queryByTestId('completed-tasks-actions')
  expect(completedTasksActions).not.toBeInTheDocument()
})

it('renders the completed tasks section', () => {
  const groupWithCompletedTask = defaultGroup
  groupWithCompletedTask.tasks.push({
    id: 'test-3',
    description: 'Testing #3',
    completed: true,
    createdAt: new Date(),
  })

  testRender(<TaskSectionList group={groupWithCompletedTask} />)

  const completedTasksSection = screen.getByTestId('completed-tasks-section')

  expect(completedTasksSection).toBeInTheDocument()
  expect(completedTasksSection).toHaveTextContent('Completed tasks')

  const taskItems = within(completedTasksSection).getAllByTestId('task-item')
  expect(taskItems).toHaveLength(1)

  const completedTasksActions = screen.getByTestId('completed-tasks-actions')
  expect(completedTasksActions).toBeInTheDocument()
})
