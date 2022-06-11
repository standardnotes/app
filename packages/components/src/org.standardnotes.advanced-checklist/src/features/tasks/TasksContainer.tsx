import './TasksContainer.scss'

import React from 'react'
import {
  Draggable,
  DraggingStyle,
  Droppable,
  NotDraggingStyle,
} from 'react-beautiful-dnd'
import styled from 'styled-components'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import { useAppSelector } from '../../app/hooks'
import { SubTitle } from '../../common/components'
import { TaskPayload } from './tasks-slice'

import TaskItem from './TaskItem'

const InnerTasksContainer = styled.div<{
  type: ContainerType
  items: number
}>`
  display: flex;
  flex-direction: column;

  & > *:not(:last-child) {
    margin-bottom: 5px;
  }

  ${({ type, items }) =>
    type === 'completed' && items > 0 ? 'margin-bottom: 28px' : ''};
`

const OuterContainer = styled.div<{ type: ContainerType; items: number }>`
  ${({ type, items }) =>
    type === 'open' && items > 0 ? 'margin-bottom: 18px' : ''};
`

const SubTitleContainer = styled.div`
  align-items: center;
  display: flex;

  & > *:first-child {
    margin-right: 14px;
  }
`

const Wrapper = styled.div`
  color: var(--sn-stylekit-foreground-color);
`

const getItemStyle = (
  isDragging: boolean,
  draggableStyle?: DraggingStyle | NotDraggingStyle
) => ({
  ...draggableStyle,
  ...(isDragging && {
    color: 'var(--sn-stylekit-info-color)',
    fontWeight: 500,
  }),
})

type ContainerType = 'open' | 'completed'

type TasksContainerProps = {
  groupName: string
  tasks: TaskPayload[]
  type: ContainerType
  testId?: string
}

const TasksContainer: React.FC<TasksContainerProps> = ({
  groupName,
  tasks,
  type,
  testId,
  children,
}) => {
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const droppableId = `${type}-tasks-droppable`

  return (
    <OuterContainer data-testid={testId} type={type} items={tasks.length}>
      <Droppable droppableId={droppableId} isDropDisabled={!canEdit}>
        {(provided) => (
          <Wrapper>
            <SubTitleContainer>
              <SubTitle>{type} tasks</SubTitle>
            </SubTitleContainer>
            <InnerTasksContainer
              {...provided.droppableProps}
              className={`${type}-tasks-container`}
              items={tasks.length}
              ref={provided.innerRef}
              type={type}
            >
              <TransitionGroup
                component={null}
                childFactory={(child) => React.cloneElement(child)}
              >
                {tasks.map((task, index) => {
                  return (
                    <CSSTransition
                      key={`${task.id}-${!!task.completed}`}
                      classNames={{
                        enter: 'fade-in',
                        enterActive: 'fade-in',
                        enterDone: 'fade-in',
                        exit: 'fade-out',
                        exitActive: 'fade-out',
                        exitDone: 'fade-out',
                      }}
                      timeout={{
                        enter: 1_500,
                        exit: 1_250,
                      }}
                      onEnter={(node: HTMLElement) => {
                        node.classList.remove('explode')
                      }}
                      onEntered={(node: HTMLElement) => {
                        node.classList.remove('fade-in')

                        const completed = !!task.completed
                        completed && node.classList.add('explode')

                        node.addEventListener(
                          'animationend',
                          () => {
                            node.classList.remove('explode')
                          },
                          false
                        )
                      }}
                      onExited={(node: HTMLElement) => {
                        node.classList.remove('fade-out')
                      }}
                      addEndListener={(node, done) => {
                        done()
                      }}
                      mountOnEnter
                      unmountOnExit
                    >
                      <Draggable
                        key={`draggable-${task.id}`}
                        draggableId={`draggable-${task.id}`}
                        index={index}
                        isDragDisabled={!canEdit}
                      >
                        {(
                          { innerRef, draggableProps, dragHandleProps },
                          { isDragging }
                        ) => {
                          const { style, ...restDraggableProps } =
                            draggableProps
                          return (
                            <div
                              className="task-item"
                              style={getItemStyle(isDragging, style)}
                              {...restDraggableProps}
                            >
                              <TaskItem
                                key={`task-item-${task.id}`}
                                task={task}
                                groupName={groupName}
                                innerRef={innerRef}
                                {...dragHandleProps}
                              />
                            </div>
                          )
                        }}
                      </Draggable>
                    </CSSTransition>
                  )
                })}
              </TransitionGroup>
              {provided.placeholder}
            </InnerTasksContainer>
            {children}
          </Wrapper>
        )}
      </Droppable>
    </OuterContainer>
  )
}

export default TasksContainer
