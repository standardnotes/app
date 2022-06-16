import React from 'react'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { tasksGroupReordered } from './tasks-slice'

import TaskGroup from './TaskGroup'

const TaskGroupList: React.FC = () => {
  const dispatch = useAppDispatch()

  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const groupedTasks = useAppSelector((state) => state.tasks.groups)

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
      tasksGroupReordered({
        swapGroupIndex: source.index,
        withGroupIndex: destination.index,
      }),
    )
  }

  return (
    <DragDropContext data-testid="task-group-list" onDragEnd={onDragEnd}>
      <Droppable droppableId={'droppable-task-group-list'} isDropDisabled={!canEdit}>
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {groupedTasks.map((group, index) => {
              return (
                <Draggable
                  key={`draggable-${group.name}`}
                  draggableId={`draggable-${group.name}`}
                  index={index}
                  isDragDisabled={!canEdit}
                >
                  {({ innerRef, draggableProps, dragHandleProps }, { isDragging }) => {
                    const { onTransitionEnd, ...restDraggableProps } = draggableProps
                    return (
                      <TaskGroup
                        key={`group-${group.name}`}
                        group={group}
                        isDragging={isDragging}
                        innerRef={innerRef}
                        onTransitionEnd={onTransitionEnd}
                        onDragStart={dragHandleProps?.onDragStart}
                        isLast={groupedTasks.length - 1 === index}
                        {...dragHandleProps}
                        {...restDraggableProps}
                      />
                    )
                  }}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default TaskGroupList
