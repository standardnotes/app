import React from 'react'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { GroupModel, tasksReordered } from './tasks-slice'

import CompletedTasksActions from './CompletedTasksActions'
import TasksSection from './TasksSection'

const Container = styled.div`
  position: relative;
`

type TaskSectionListProps = {
  group: GroupModel
}

const TaskSectionList: React.FC<TaskSectionListProps> = ({ group }) => {
  const dispatch = useAppDispatch()
  const defaultSections = useAppSelector((state) => state.tasks.defaultSections)

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
      }),
    )
  }

  const sections = group.sections ?? defaultSections

  return (
    <Container data-testid="task-section-list">
      {sections.map((section) => {
        const tasks = group.tasks.filter((task) =>
          section.id === 'completed-tasks' ? task.completed === true : !task.completed,
        )
        return (
          <DragDropContext key={`${section.id}-section-dnd`} onDragEnd={onDragEnd}>
            <TasksSection testId={`${section.id}-section`} groupName={group.name} section={section} tasks={tasks}>
              {section.id === 'completed-tasks' && tasks.length > 0 && <CompletedTasksActions groupName={group.name} />}
            </TasksSection>
          </DragDropContext>
        )
      })}
    </Container>
  )
}

export default TaskSectionList
