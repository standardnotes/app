import { fireEvent, screen } from '@testing-library/react'

import { RootState } from '../../app/store'
import { testRender } from '../../testUtils'
import TaskGroup from './TaskGroup'

const defaultGroup = {
  name: 'default group',
  tasks: [
    {
      id: 'test-1',
      description: 'Testing',
      completed: false,
      createdAt: new Date(),
    },
    {
      id: 'test-2',
      description: 'Testing',
      completed: false,
      createdAt: new Date(),
    },
  ],
}

it('renders the group name', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.getByText(defaultGroup.name)).toBeVisible()
})

it('renders the number of completed tasks and total tasks', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  const completedTasks = defaultGroup.tasks.filter((task) => task.completed).length
  const totalTasks = defaultGroup.tasks.length

  expect(screen.getByTestId('task-group-stats')).toHaveTextContent(`${completedTasks}/${totalTasks}`)
})

it('renders the circular progress bar', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.getByTestId('circular-progress-bar')).toBeInTheDocument()
})

it('does not render a thematic break element', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.queryByTestId('task-group-separator')).not.toBeInTheDocument()
})

it('renders the element that is used to create a new task', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.getByTestId('create-task-input')).toBeInTheDocument()
})

it('renders the element that is used to display the list of tasks', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.getByTestId('task-list')).toBeInTheDocument()
})

it('collapses the group', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  const createTask = screen.getByTestId('create-task-input')
  const taskItemList = screen.getByTestId('task-list')

  expect(createTask).toBeVisible()
  expect(taskItemList).toBeVisible()

  const collapseButton = screen.getByTestId('collapse-task-group')
  fireEvent.click(collapseButton)

  expect(createTask).not.toBeVisible()
  expect(taskItemList).not.toBeVisible()
})

it('shows group options', () => {
  testRender(<TaskGroup group={defaultGroup} isDragging={false} />)

  expect(screen.getByTestId('task-group-options')).toBeInTheDocument()
})

it('hides group options if can not edit', () => {
  const defaultState: Partial<RootState> = {
    settings: {
      canEdit: false,
      isRunningOnMobile: false,
      spellCheckerEnabled: true,
    },
  }

  testRender(<TaskGroup group={defaultGroup} isDragging={false} />, {}, defaultState)

  expect(screen.queryByTestId('task-group-options')).not.toBeInTheDocument()
})

it('shows a reorder icon when on mobile', () => {
  let defaultState: Partial<RootState> = {
    settings: {
      canEdit: false,
      isRunningOnMobile: true,
      spellCheckerEnabled: true,
    },
  }

  testRender(<TaskGroup group={defaultGroup} isDragging={false} />, {}, defaultState)

  expect(screen.queryByTestId('reorder-icon')).not.toBeInTheDocument()

  defaultState = {
    settings: {
      canEdit: true,
      isRunningOnMobile: true,
      spellCheckerEnabled: true,
    },
  }

  testRender(<TaskGroup group={defaultGroup} isDragging={false} />, {}, defaultState)

  expect(screen.getByTestId('reorder-icon')).toBeInTheDocument()
})
