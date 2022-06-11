import { fireEvent, screen } from '@testing-library/react'
import { RootState } from '../../app/store'

import { testRender } from '../../testUtils'
import CreateTask from './CreateTask'
import { taskAdded } from './tasks-slice'

jest.mock('uuid', () => {
  return {
    v4: () => 'my-fake-uuid',
  }
})

const defaultGroup = {
  name: 'My default group',
  tasks: [],
}

it('renders a button by default', () => {
  testRender(<CreateTask group={defaultGroup} />)

  const inputBox = screen.queryByTestId('create-task-input')
  expect(inputBox).toBeInTheDocument()
  expect(inputBox).toHaveTextContent('')
})

it('should not render input if can not edit', () => {
  const defaultState: Partial<RootState> = {
    settings: {
      canEdit: false,
      isRunningOnMobile: false,
      spellCheckerEnabled: true,
    },
  }

  testRender(<CreateTask group={defaultGroup} />, {}, defaultState)

  expect(screen.queryByTestId('create-task-input')).not.toBeInTheDocument()
})

it('changes the input box value', () => {
  testRender(<CreateTask group={defaultGroup} />)

  const inputBox = screen.getByTestId('create-task-input') as HTMLInputElement
  fireEvent.change(inputBox, { target: { value: 'This is a simple task' } })

  expect(inputBox.value).toBe('This is a simple task')
})

test('pressing enter when input box is empty, should not create a new task', () => {
  const { mockStore } = testRender(<CreateTask group={defaultGroup} />)

  const inputBox = screen.getByTestId('create-task-input')
  fireEvent.keyPress(inputBox, {
    key: 'Enter',
    code: 'Enter',
    charCode: 13,
    target: { value: '' },
  })

  const dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(0)
})

test('pressing enter when input box is not empty, should create a new task', () => {
  const { mockStore } = testRender(<CreateTask group={defaultGroup} />)

  const inputBox = screen.getByTestId('create-task-input')
  fireEvent.keyPress(inputBox, {
    key: 'Enter',
    code: 'Enter',
    charCode: 13,
    target: { value: 'My awesome task' },
  })

  const dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(1)
  expect(dispatchedActions[0]).toMatchObject(
    taskAdded({
      task: { id: 'my-fake-uuid', description: 'My awesome task' },
      groupName: defaultGroup.name,
    })
  )
})
