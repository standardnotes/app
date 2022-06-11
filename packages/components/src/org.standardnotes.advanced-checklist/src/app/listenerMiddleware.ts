import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  deleteAllCompleted,
  openAllCompleted,
  taskAdded,
  taskDeleted,
  taskModified,
  tasksGroupAdded,
  tasksGroupCollapsed,
  tasksGroupDeleted,
  tasksGroupLastActive,
  tasksGroupMerged,
  tasksReordered,
  taskToggled,
} from '../features/tasks/tasks-slice'

const listenerMiddleware = createListenerMiddleware()

/**
 * A list of actions that we want to listen to.
 * The groupName is obtained from the payload, and we use it to
 * dispatch the tasksGroupLastActive action.
 */
const actionsWithGroup = isAnyOf(
  taskAdded,
  taskModified,
  taskToggled,
  taskDeleted,
  openAllCompleted,
  deleteAllCompleted,
  tasksReordered,
  tasksGroupAdded,
  tasksGroupDeleted,
  tasksGroupMerged,
  tasksGroupCollapsed
)

listenerMiddleware.startListening({
  matcher: actionsWithGroup,
  effect: ({ payload }, listenerApi) => {
    const { groupName } = payload
    listenerApi.dispatch(tasksGroupLastActive({ groupName }))
  },
})

export default listenerMiddleware.middleware
