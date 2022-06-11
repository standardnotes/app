import React from 'react'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import styled from 'styled-components'

import { useAppDispatch } from '../../app/hooks'
import { groupTasksByCompletedStatus } from '../../common/utils'
import { GroupPayload, tasksReordered } from './tasks-slice'

import TasksContainer from './TasksContainer'
import CompletedTasksActions from './CompletedTasksActions'

const Container = styled.div`
  position: relative;
`

type TaskItemListProps = {
  group: GroupPayload
}

const TaskItemList: React.FC<TaskItemListProps> = ({ group }) => {
  const dispatch = useAppDispatch()

  const { openTasks, completedTasks } = groupTasksByCompletedStatus(group.tasks)

  function onDragEnd(result: DropResult) {
    const droppedOutsideList = !result.destination
    if (droppedOutsideList) {
      return
    }

    const { source, destination } = result
    if (!destination) {
      return
    }

    dispatch(
      tasksReordered({
        groupName: group.name,
        swapTaskIndex: source.index,
        withTaskIndex: destination.index,
        isSameSection: source.droppableId === destination.droppableId,
      })
    )
  }

  return (
    <Container data-testid="task-list">
      <DragDropContext onDragEnd={onDragEnd}>
        <TasksContainer
          testId="open-tasks-container"
          type="open"
          tasks={openTasks}
          groupName={group.name}
        />

        <TasksContainer
          testId="completed-tasks-container"
          type="completed"
          tasks={completedTasks}
          groupName={group.name}
        >
          {completedTasks.length > 0 && (
            <CompletedTasksActions groupName={group.name} />
          )}
        </TasksContainer>
      </DragDropContext>
    </Container>
  )
}

export default TaskItemList
