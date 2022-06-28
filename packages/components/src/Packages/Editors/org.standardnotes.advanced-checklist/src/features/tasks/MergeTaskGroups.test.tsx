import { fireEvent, screen } from '@testing-library/react'
import { RootState } from '../../app/store'
import { testRender } from '../../testUtils'

import MergeTaskGroups from './MergeTaskGroups'
import { tasksGroupMerged } from './tasks-slice'

const handleClose = jest.fn()

it('renders the alert dialog when no groups are available to merge', () => {
  const defaultGroup = 'Test'
  const defaultState: Partial<RootState> = {
    tasks: {
      schemaVersion: '1.0.0',
      defaultSections: [],
      groups: [
        {
          name: 'Test',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    },
  }

  testRender(<MergeTaskGroups groupName={defaultGroup} handleClose={handleClose} />, {}, defaultState)

  const alertDialog = screen.getByTestId('merge-task-group-dialog')
  expect(alertDialog).toBeInTheDocument()
  expect(alertDialog).toHaveTextContent(`There are no other groups to merge '${defaultGroup}' with.`)
  expect(alertDialog).not.toHaveTextContent(`Select which group you want to merge '${defaultGroup}' into:`)

  // There shouldn't be any radio buttons
  expect(screen.queryAllByRole('radio')).toHaveLength(0)
})

it('renders the alert dialog when there are groups available to merge', () => {
  const defaultGroup = 'Test'
  const defaultState: Partial<RootState> = {
    tasks: {
      schemaVersion: '1.0.0',
      defaultSections: [],
      groups: [
        {
          name: 'Test',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Testing',
          tasks: [
            {
              id: 'another-id',
              description: 'Another simple task',
              completed: false,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Tests',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    },
  }

  testRender(<MergeTaskGroups groupName={defaultGroup} handleClose={handleClose} />, {}, defaultState)

  const alertDialog = screen.getByTestId('merge-task-group-dialog')
  expect(alertDialog).toBeInTheDocument()
  expect(alertDialog).toHaveTextContent(`Select which group you want to merge '${defaultGroup}' into:`)
  expect(alertDialog).not.toHaveTextContent(`There are no other groups to merge '${defaultGroup}' with.`)

  const radioButtons = screen.queryAllByRole('radio')
  expect(radioButtons).toHaveLength(2)

  const firstRadioButton = radioButtons[0]
  expect(firstRadioButton).not.toBeChecked()
  expect(firstRadioButton).toHaveAttribute('value', 'Testing')

  const secondRadioButton = radioButtons[1]
  expect(secondRadioButton).not.toBeChecked()
  expect(secondRadioButton).toHaveAttribute('value', 'Tests')
})

it('should close the dialog if no group is selected and the Merge button is clicked', () => {
  const defaultGroup = 'Test'
  const defaultState: Partial<RootState> = {
    tasks: {
      schemaVersion: '1.0.0',
      defaultSections: [],
      groups: [
        {
          name: 'Test',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Testing',
          tasks: [
            {
              id: 'another-id',
              description: 'Another simple task',
              completed: false,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Tests',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    },
  }

  const { mockStore } = testRender(
    <MergeTaskGroups groupName={defaultGroup} handleClose={handleClose} />,
    {},
    defaultState,
  )

  const buttons = screen.queryAllByRole('button')
  expect(buttons).toHaveLength(2)

  const mergeButton = buttons[1]
  expect(mergeButton).toHaveTextContent('Merge groups')

  fireEvent.click(mergeButton)

  const dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(0)
  expect(handleClose).toHaveBeenCalledTimes(1)
})

it('should dispatch the action to merge groups', () => {
  const defaultGroup = 'Test'
  const defaultState: Partial<RootState> = {
    tasks: {
      schemaVersion: '1.0.0',
      defaultSections: [],
      groups: [
        {
          name: 'Test',
          tasks: [
            {
              id: 'some-id',
              description: 'A simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Testing',
          tasks: [
            {
              id: 'another-id',
              description: 'Another simple task',
              completed: false,
              createdAt: new Date(),
            },
          ],
        },
        {
          name: 'Tests',
          tasks: [
            {
              id: 'yet-another-id',
              description: 'Yet another simple task',
              completed: true,
              createdAt: new Date(),
            },
          ],
        },
      ],
    },
  }

  const { mockStore } = testRender(
    <MergeTaskGroups groupName={defaultGroup} handleClose={handleClose} />,
    {},
    defaultState,
  )

  const radioButtons = screen.queryAllByRole('radio')

  let dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(0)
  expect(handleClose).toHaveBeenCalledTimes(0)

  const firstRadioButton = radioButtons[0]
  fireEvent.click(firstRadioButton)

  const buttons = screen.queryAllByRole('button')
  expect(buttons).toHaveLength(2)

  const cancelButton = buttons[0]
  expect(cancelButton).toHaveTextContent('Cancel')

  const mergeButton = buttons[1]
  expect(mergeButton).toHaveTextContent('Merge groups')

  fireEvent.click(mergeButton)

  dispatchedActions = mockStore.getActions()
  expect(dispatchedActions).toHaveLength(1)
  expect(dispatchedActions[0]).toMatchObject(tasksGroupMerged({ groupName: defaultGroup, mergeWith: 'Testing' }))
  expect(handleClose).toHaveBeenCalledTimes(1)
})
