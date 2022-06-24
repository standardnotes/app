import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { arrayMoveImmutable, isJsonString, parseMarkdownTasks } from '../../common/utils'

const LATEST_SCHEMA_VERSION = '1.0.0'

export type TasksState = {
  schemaVersion: string
  groups: GroupPayload[]
  initialized?: boolean
  legacyContent?: GroupPayload
  lastError?: string
}

const initialState: TasksState = {
  schemaVersion: LATEST_SCHEMA_VERSION,
  groups: [],
}

export type TaskPayload = {
  id: string
  description: string
  completed?: boolean
  createdAt: Date
  updatedAt?: Date
  completedAt?: Date
}

type CollapsedState = {
  group?: boolean
  open?: boolean
  completed?: boolean
}

export type GroupPayload = {
  name: string
  collapsed?: CollapsedState
  draft?: string
  lastActive?: Date
  tasks: TaskPayload[]
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    taskAdded(
      state,
      action: PayloadAction<{
        task: { id: string; description: string }
        groupName: string
      }>,
    ) {
      const { groupName, task } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      delete group.draft
      group.tasks.unshift({
        ...task,
        completed: false,
        createdAt: new Date(),
      })
    },
    taskModified(
      state,
      action: PayloadAction<{
        task: { id: string; description: string }
        groupName: string
      }>,
    ) {
      const { groupName, task } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      const currentTask = group.tasks.find((item) => item.id === task.id)
      if (!currentTask) {
        return
      }
      currentTask.description = task.description
      currentTask.updatedAt = new Date()
    },
    taskDeleted(state, action: PayloadAction<{ id: string; groupName: string }>) {
      const { id, groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.tasks = group.tasks.filter((task) => task.id !== id)
    },
    taskToggled(state, action: PayloadAction<{ id: string; groupName: string }>) {
      const { id, groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      const currentTask = group.tasks.find((task) => task.id === id)
      if (!currentTask) {
        return
      }
      currentTask.completed = !currentTask.completed
      currentTask.updatedAt = new Date()
      if (currentTask.completed) {
        currentTask.completedAt = new Date()
      } else {
        delete currentTask.completedAt
      }
      /**
       * Puts the recently toggled task on top
       */
      const tasks = group.tasks.filter((task) => task.id !== id)
      group.tasks = [currentTask, ...tasks]
    },
    openAllCompleted(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.tasks.forEach((task) => {
        task.completed = false
        delete task.completedAt
      })
    },
    deleteAllCompleted(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.tasks = group.tasks.filter((task) => task.completed === false)
    },
    tasksReordered(
      state,
      action: PayloadAction<{
        groupName: string
        swapTaskIndex: number
        withTaskIndex: number
        isSameSection: boolean
      }>,
    ) {
      const { groupName, swapTaskIndex, withTaskIndex, isSameSection } = action.payload
      if (!isSameSection) {
        return
      }
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.tasks = arrayMoveImmutable(group.tasks, swapTaskIndex, withTaskIndex)
    },
    tasksGroupAdded(
      state,
      action: PayloadAction<{
        groupName: string
      }>,
    ) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (group) {
        return
      }
      state.groups.push({
        name: groupName,
        tasks: [],
      })
    },
    tasksGroupReordered(
      state,
      action: PayloadAction<{
        swapGroupIndex: number
        withGroupIndex: number
      }>,
    ) {
      const { swapGroupIndex, withGroupIndex } = action.payload
      state.groups = arrayMoveImmutable(state.groups, swapGroupIndex, withGroupIndex)
    },
    tasksGroupDeleted(
      state,
      action: PayloadAction<{
        groupName: string
      }>,
    ) {
      const { groupName } = action.payload
      state.groups = state.groups.filter((item) => item.name !== groupName)
    },
    tasksGroupMerged(
      state,
      action: PayloadAction<{
        groupName: string
        mergeWith: string
      }>,
    ) {
      const { groupName, mergeWith } = action.payload
      if (groupName === mergeWith) {
        return
      }
      const groupA = state.groups.find((item) => item.name === groupName)
      if (!groupA) {
        return
      }
      const groupB = state.groups.find((item) => item.name === mergeWith)
      if (!groupB) {
        return
      }
      groupA.name = mergeWith
      groupA.tasks = [...(groupB.tasks ?? []), ...groupA.tasks]
      state.groups = state.groups.filter((group) => group !== groupB)
    },
    tasksGroupRenamed(
      state,
      action: PayloadAction<{
        groupName: string
        newName: string
      }>,
    ) {
      const { groupName, newName } = action.payload
      if (groupName === newName) {
        return
      }
      const groupA = state.groups.find((item) => item.name === groupName)
      if (!groupA) {
        return
      }
      groupA.name = newName
    },
    tasksGroupCollapsed(
      state,
      action: PayloadAction<{
        groupName: string
        type: keyof CollapsedState
        collapsed: boolean
      }>,
    ) {
      const { groupName, type, collapsed } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.collapsed = {
        ...(group.collapsed ?? {}),
        [type]: collapsed,
      }
    },
    tasksGroupDraft(
      state,
      action: PayloadAction<{
        groupName: string
        draft: string
      }>,
    ) {
      const { groupName, draft } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.draft = draft
    },
    tasksGroupLastActive(
      state,
      action: PayloadAction<{
        groupName: string
      }>,
    ) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) {
        return
      }
      group.lastActive = new Date()
    },
    tasksLegacyContentMigrated(state, { payload }: PayloadAction<{ continue: boolean }>) {
      if (!state.legacyContent) {
        return
      }

      if (payload.continue) {
        state.initialized = true
        state.groups.push(state.legacyContent)
        delete state.lastError
      } else {
        state.initialized = false
        state.groups = []
        state.lastError =
          'The legacy content migration has been canceled by the user. ' +
          'Please reload this note to try again or switch to the Basic Checklist editor.'
      }

      delete state.legacyContent
    },
    tasksLoaded(state, { payload }: PayloadAction<string>) {
      if (!payload && !state.initialized) {
        payload = '{}'
      }

      try {
        const isJson = isJsonString(payload)
        if (!isJson) {
          const legacyContent = parseMarkdownTasks(payload)
          if (legacyContent) {
            state.legacyContent = legacyContent
            state.initialized = false
            return
          }
        }

        const parsedState = JSON.parse(payload) as TasksState
        const newState: TasksState = {
          schemaVersion: parsedState?.schemaVersion ?? LATEST_SCHEMA_VERSION,
          groups: parsedState?.groups ?? [],
        }

        if (newState !== initialState) {
          state.schemaVersion = newState.schemaVersion
          state.groups = newState.groups
          state.initialized = true
          delete state.lastError
        }
      } catch (error: any) {
        state.initialized = false
        state.lastError = `An error has occurred while parsing the note's content: ${error}`
        return
      }
    },
  },
})

export const {
  taskAdded,
  taskModified,
  taskToggled,
  taskDeleted,
  openAllCompleted,
  deleteAllCompleted,
  tasksLoaded,
  tasksLegacyContentMigrated,
  tasksGroupAdded,
  tasksReordered,
  tasksGroupReordered,
  tasksGroupDeleted,
  tasksGroupMerged,
  tasksGroupRenamed,
  tasksGroupCollapsed,
  tasksGroupDraft,
  tasksGroupLastActive,
} = tasksSlice.actions
export default tasksSlice.reducer
