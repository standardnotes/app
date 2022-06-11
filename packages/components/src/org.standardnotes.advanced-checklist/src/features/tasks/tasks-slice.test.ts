import reducer, {
  openAllCompleted,
  deleteAllCompleted,
  taskAdded,
  taskDeleted,
  taskModified,
  tasksLoaded,
  taskToggled,
  tasksGroupAdded,
  tasksReordered,
  tasksGroupReordered,
  tasksGroupDeleted,
  tasksGroupMerged,
  tasksGroupCollapsed,
  tasksGroupDraft,
  tasksGroupLastActive,
  tasksGroupRenamed,
} from './tasks-slice'
import type { TasksState } from './tasks-slice'

it('should return the initial state', () => {
  return expect(
    reducer(undefined, {
      type: undefined,
    })
  ).toEqual({ schemaVersion: '1.0.0', groups: [] })
})

it('should handle a task being added to a non-existing group', () => {
  const previousState: TasksState = { schemaVersion: '1.0.0', groups: [] }

  expect(
    reducer(
      previousState,
      taskAdded({
        task: { id: 'some-id', description: 'A simple task' },
        groupName: 'Test',
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [],
  })
})

it('should handle a task being added to the existing tasks store', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      taskAdded({
        task: { id: 'another-id', description: 'Another simple task' },
        groupName: 'Test',
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle an existing task being modified', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      taskModified({
        task: { id: 'some-id', description: 'Task description changed' },
        groupName: 'Test',
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'Task description changed',
            completed: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should not modify tasks if an invalid id is provided', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      taskModified({
        task: { id: 'some-invalid-id', description: 'New description' },
        groupName: 'Test',
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should keep completed field as-is, if task is modified', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      taskModified({
        task: {
          id: 'some-id',
          description: 'New description',
        },
        groupName: 'Test',
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'New description',
            completed: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle an existing task being toggled', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(previousState, taskToggled({ id: 'some-id', groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            completedAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

test('toggled tasks should be on top of the list', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'another-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'extra-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(previousState, taskToggled({ id: 'another-id', groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            completedAt: expect.any(Date),
          },
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'extra-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle an existing completed task being toggled', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
  }

  expect(
    reducer(previousState, taskToggled({ id: 'some-id', groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle an existing task being deleted', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(previousState, taskDeleted({ id: 'some-id', groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle opening all tasks that are marked as completed', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(previousState, openAllCompleted({ groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle clear all completed tasks', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(previousState, deleteAllCompleted({ groupName: 'Test' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle loading tasks into the tasks store, if an invalid payload is provided', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(reducer(previousState, tasksLoaded('null'))).toEqual(previousState)
  expect(reducer(previousState, tasksLoaded('undefined'))).toEqual(
    previousState
  )
})

it('should initialize the storage with an empty object', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(reducer(previousState, tasksLoaded(''))).toEqual({
    schemaVersion: '1.0.0',
    groups: [],
    initialized: true,
  })
})

it('should not initialize the storage again with an empty object', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
    initialized: true,
  }

  expect(reducer(previousState, tasksLoaded(''))).toEqual(previousState)
})

it('should handle loading tasks into the tasks store, with a valid payload', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [],
  }

  const tasksPayload: TasksState = {
    schemaVersion: '2.0.0',
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
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  const serializedPayload = JSON.stringify(tasksPayload)
  expect(reducer(previousState, tasksLoaded(serializedPayload))).toEqual({
    schemaVersion: '2.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(String),
          },
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(String),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: expect.any(String),
          },
        ],
      },
    ],
    initialized: true,
  })
})

it('should handle adding a new task group', () => {
  const previousState: TasksState = { schemaVersion: '1.0.0', groups: [] }

  expect(
    reducer(previousState, tasksGroupAdded({ groupName: 'New group' }))
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'New group',
        tasks: [],
      },
    ],
  })
})

it('should handle adding an existing task group', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Existing group',
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
  }

  expect(
    reducer(previousState, tasksGroupAdded({ groupName: 'Existing group' }))
  ).toEqual(previousState)
})

it('should handle reordering tasks from the same section', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      tasksReordered({
        groupName: 'Test',
        swapTaskIndex: 0,
        withTaskIndex: 1,
        isSameSection: true,
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle reordering tasks from different sections', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: new Date(),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  expect(
    reducer(
      previousState,
      tasksReordered({
        groupName: 'Test',
        swapTaskIndex: 0,
        withTaskIndex: 1,
        isSameSection: false,
      })
    )
  ).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle reordering task groups', () => {
  const defaultCreatedAt = new Date()

  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: defaultCreatedAt,
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
            createdAt: defaultCreatedAt,
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
            createdAt: defaultCreatedAt,
          },
        ],
      },
    ],
  }

  const currentState = reducer(
    previousState,
    tasksGroupReordered({
      swapGroupIndex: 0,
      withGroupIndex: 1,
    })
  )

  const expectedState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Testing',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: defaultCreatedAt,
          },
        ],
      },
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: defaultCreatedAt,
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
            createdAt: defaultCreatedAt,
          },
        ],
      },
    ],
  }

  expect(JSON.stringify(currentState)).toEqual(JSON.stringify(expectedState))
})

it('should handle deleting groups', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
  }

  const currentState = reducer(
    previousState,
    tasksGroupDeleted({ groupName: 'Testing' })
  )

  const expectedState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
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
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  }

  expect(currentState).toEqual(expectedState)
})

it('should not merge the same group', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
  }

  const currentState = reducer(
    previousState,
    tasksGroupMerged({ groupName: 'Testing', mergeWith: 'Testing' })
  )

  expect(currentState).toEqual(previousState)
})

it('should handle merging groups', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test group #1',
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
        name: 'Test group #2',
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
        name: 'Test group #3',
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
  }

  const currentState = reducer(
    previousState,
    tasksGroupMerged({ groupName: 'Test group #3', mergeWith: 'Test group #2' })
  )

  expect(currentState).toMatchObject({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test group #1',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Test group #2',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle renaming a group', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
    ],
  }

  const currentState = reducer(
    previousState,
    tasksGroupRenamed({ groupName: 'Testing', newName: 'Tested' })
  )

  expect(currentState).toEqual({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Tested',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it("should rename a group and preserve it's current order", () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: '1st group',
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
        name: '2nd group',
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
        name: '3rd group',
        tasks: [
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: false,
            createdAt: new Date(),
          },
        ],
      },
    ],
  }

  const currentState = reducer(
    previousState,
    tasksGroupRenamed({ groupName: '2nd group', newName: 'Middle group' })
  )

  expect(currentState).toMatchObject({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: '1st group',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Middle group',
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: '3rd group',
        tasks: [
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should handle collapsing groups', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
  }

  const currentState = reducer(
    previousState,
    tasksGroupCollapsed({ groupName: 'Testing', collapsed: true })
  )

  const expectedState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Testing',
        collapsed: true,
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
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
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  }

  expect(currentState).toEqual(expectedState)
})

it('should handle saving task draft for groups', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
  }

  const currentState = reducer(
    previousState,
    tasksGroupDraft({ groupName: 'Tests', draft: 'Remember to ...' })
  )

  const expectedState = {
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
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
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Tests',
        draft: 'Remember to ...',
        tasks: [
          {
            id: 'yet-another-id',
            description: 'Yet another simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  }

  expect(currentState).toEqual(expectedState)
})

it('should handle setting a group as last active', () => {
  const previousState: TasksState = {
    schemaVersion: '1.0.0',
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
    ],
  }

  const currentState = reducer(
    previousState,
    tasksGroupLastActive({ groupName: 'Testing' })
  )

  expect(currentState).toMatchObject({
    schemaVersion: '1.0.0',
    groups: [
      {
        name: 'Test',
        tasks: [
          {
            id: 'some-id',
            description: 'A simple task',
            completed: true,
            createdAt: expect.any(Date),
          },
        ],
      },
      {
        name: 'Testing',
        lastActive: expect.any(Date),
        tasks: [
          {
            id: 'another-id',
            description: 'Another simple task',
            completed: false,
            createdAt: expect.any(Date),
          },
        ],
      },
    ],
  })
})

it('should detect and load legacy content', () => {
  const payload = '- [ ] Foo bar'
  expect(reducer(undefined, tasksLoaded(payload))).toMatchObject<TasksState>({
    schemaVersion: '1.0.0',
    initialized: false,
    groups: [],
    legacyContent: {
      name: 'Checklist',
      tasks: [
        {
          id: expect.any(String),
          description: 'Foo bar',
          completed: false,
          createdAt: expect.any(Date),
        },
      ],
    },
  })
})
