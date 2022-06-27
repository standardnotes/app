import { render, screen } from '@testing-library/react'
import NotePreview from './NotePreview'
import { GroupPayload } from './tasks-slice'

const workTasks = [
  {
    id: 'test-b-1',
    description: 'Test #1',
    createdAt: new Date(),
  },
  {
    id: 'test-b-2',
    description: 'Test #2',
    completed: true,
    createdAt: new Date(),
  },
]

const personalTasks = [
  {
    id: 'test-c-1',
    description: 'Test #3',
    createdAt: new Date(),
  },
  {
    id: 'test-c-2',
    description: 'Test #4',
    completed: true,
    createdAt: new Date(),
  },
]

const miscTasks = [
  {
    id: 'test-d-1',
    description: 'Test #5',
    createdAt: new Date(),
  },
  {
    id: 'test-d-2',
    description: 'Test #6',
    createdAt: new Date(),
  },
]

it('should render without tasks', () => {
  const groupedTasks: GroupPayload[] = []

  render(<NotePreview groupedTasks={groupedTasks} />)

  const header = screen.getByText('0/0 tasks completed')
  expect(header).toBeVisible()

  const progressBar = screen.getByTestId('circular-progress-bar')
  expect(progressBar).toBeVisible()

  // eslint-disable-next-line testing-library/no-node-access
  const progressBarBackground = progressBar.firstChild
  expect(progressBarBackground).toHaveClass('background')

  // eslint-disable-next-line testing-library/no-node-access
  const progressBarStroke = progressBar.lastChild
  expect(progressBarStroke).toHaveClass('progress p-0')

  const groupList = screen.queryAllByTestId('group-summary')
  expect(groupList).toHaveLength(0)
})

it('should render with tasks', () => {
  const groupedTasks = [
    {
      name: 'Work',
      tasks: workTasks,
    },
    {
      name: 'Personal',
      tasks: personalTasks,
    },
  ]

  render(<NotePreview groupedTasks={groupedTasks} />)

  const header = screen.getByText('2/4 tasks completed')
  expect(header).toBeVisible()

  const progressBar = screen.getByTestId('circular-progress-bar')
  expect(progressBar).toBeVisible()

  // eslint-disable-next-line testing-library/no-node-access
  const progressBarBackground = progressBar.firstChild
  expect(progressBarBackground).toHaveClass('background')

  // eslint-disable-next-line testing-library/no-node-access
  const progressBarStroke = progressBar.lastChild
  expect(progressBarStroke).toHaveClass('progress p-50')

  const groupList = screen.getAllByTestId('group-summary')
  expect(groupList).toHaveLength(2)
})

it('should render a summary of the remaining group(s)', () => {
  const groupedTasks = [
    {
      name: 'Work',
      tasks: workTasks,
    },
    {
      name: 'Personal',
      tasks: personalTasks,
    },
    {
      name: 'Misc',
      tasks: miscTasks,
    },
    {
      name: 'Groceries',
      tasks: [
        {
          id: 'test-e-1',
          description: 'Test #7',
          createdAt: new Date(),
        },
      ],
    },
  ]

  render(<NotePreview groupedTasks={groupedTasks} />)

  const remainingGroups = screen.getByTestId('groups-remaining')
  expect(remainingGroups).toHaveTextContent('And 1 other group')
  expect(remainingGroups).toBeVisible()
})
