import { v4 as uuidv4 } from 'uuid'
import { GroupPayload, TaskPayload } from '../features/tasks/tasks-slice'

export function arrayMoveMutable(
  array: any[],
  fromIndex: number,
  toIndex: number
) {
  const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex
  if (startIndex >= 0 && startIndex < array.length) {
    const endIndex = toIndex < 0 ? array.length + toIndex : toIndex
    const [item] = array.splice(fromIndex, 1)
    array.splice(endIndex, 0, item)
  }
}

export function arrayMoveImmutable(
  array: any[],
  fromIndex: number,
  toIndex: number
) {
  array = [...array]
  arrayMoveMutable(array, fromIndex, toIndex)
  return array
}

export function getPercentage(numberA: number, numberB: number): number {
  if (numberA === 0 || numberB === 0) {
    return 0
  }
  const min = Math.min(numberA, numberB)
  const max = Math.max(numberA, numberB)
  const percentage = (min / max) * 100
  return Number(percentage.toFixed(2))
}

export function groupTasksByCompletedStatus(tasks: TaskPayload[]) {
  const openTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  return {
    openTasks,
    completedTasks,
  }
}

export function getTaskArrayFromGroupedTasks(
  groupedTasks: GroupPayload[]
): TaskPayload[] {
  let taskArray: TaskPayload[] = []

  groupedTasks.forEach((group) => {
    taskArray = taskArray.concat(group.tasks)
  })

  return taskArray
}

export function truncateText(text: string, limit: number = 50) {
  if (text.length <= limit) {
    return text
  }
  return text.substring(0, limit) + '...'
}

export function getPlainPreview(groupedTasks: GroupPayload[]) {
  const allTasks = getTaskArrayFromGroupedTasks(groupedTasks)
  const { completedTasks } = groupTasksByCompletedStatus(allTasks)

  return `${completedTasks.length}/${allTasks.length} tasks completed`
}

function createTaskFromLine(rawTask: string): TaskPayload | undefined {
  const IS_COMPLETED = /^- \[x\] /i
  const OPEN_PREFIX = '- [ ] '

  const description = rawTask.replace(OPEN_PREFIX, '').replace(IS_COMPLETED, '')

  if (description.length === 0) {
    return
  }

  return {
    id: uuidv4(),
    description,
    completed: IS_COMPLETED.test(rawTask),
    createdAt: new Date(),
  }
}

export function parseMarkdownTasks(payload?: string): GroupPayload | undefined {
  if (!payload) {
    return
  }

  const IS_LEGACY_FORMAT = /^- \[[x ]\] .*/gim
  if (!IS_LEGACY_FORMAT.test(payload)) {
    return
  }

  const lines = payload.split('\n')
  const tasks: TaskPayload[] = []

  lines
    .filter((line) => line.replace(/ /g, '').length > 0)
    .map((line) => createTaskFromLine(line))
    .forEach((item) => item && tasks.push(item))

  if (tasks.length === 0) {
    return
  }

  return {
    name: 'Checklist',
    tasks,
  }
}

export function isJsonString(rawString: string) {
  try {
    JSON.parse(rawString)
  } catch (e) {
    return false
  }
  return true
}

export function isLastActiveGroup(
  allGroups: GroupPayload[],
  groupName: string
): boolean {
  if (allGroups.length === 0) {
    return true
  }

  const lastActiveGroup = allGroups.reduce((prev, current) => {
    if (!prev.lastActive) {
      return current
    }
    if (!current.lastActive) {
      return prev
    }
    return prev.lastActive > current.lastActive ? prev : current
  })

  return lastActiveGroup.name === groupName
}
