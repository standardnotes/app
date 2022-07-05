let dirtyIndex = 0

export function getIncrementedDirtyIndex() {
  dirtyIndex++
  return dirtyIndex
}

export function getCurrentDirtyIndex() {
  return dirtyIndex
}
