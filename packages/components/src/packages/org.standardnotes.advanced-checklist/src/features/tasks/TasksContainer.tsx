import './TasksContainer.scss'

import React, { useState } from 'react'
import { Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { RoundButton, SubTitle } from '../../common/components'
import { GroupPayload, TaskPayload, tasksGroupCollapsed } from './tasks-slice'

import { ChevronDownIcon, ChevronUpIcon } from '../../common/components/icons'
import TaskItem from './TaskItem'

const SectionHeader = styled.div`
  align-items: center;
  display: flex;

  & > *:first-child {
    margin-right: 14px;
  }
`

const InnerTasksContainer = styled.div<{ collapsed: boolean }>`
  display: ${({ collapsed }) => (collapsed ? 'none' : 'flex')};
  flex-direction: column;

  & > *:not(:last-child) {
    margin-bottom: 5px;
  }
`

const OuterContainer = styled.div<{ type: ContainerType; items: number; collapsed: boolean }>`
  margin-bottom: ${({ type, items, collapsed }) => (type === 'open' && items > 0 && !collapsed ? '10px' : '0')};
`

const ChildrenContainer = styled.div<{ type: ContainerType; items: number; collapsed: boolean }>`
  margin-top: ${({ type, items, collapsed }) => (type === 'completed' && items > 0 ? '15px' : '0')};
`

const Wrapper = styled.div`
  color: var(--sn-stylekit-foreground-color);
`

const getItemStyle = (isDragging: boolean, draggableStyle?: DraggingStyle | NotDraggingStyle) => ({
  ...draggableStyle,
  ...(isDragging && {
    color: 'var(--sn-stylekit-info-color)',
    fontWeight: 500,
  }),
})

type ContainerType = 'open' | 'completed'

type TasksContainerProps = {
  group: GroupPayload
  tasks: TaskPayload[]
  type: ContainerType
  testId?: string
}

const TasksContainer: React.FC<TasksContainerProps> = ({ group, tasks, type, testId, children }) => {
  const dispatch = useAppDispatch()
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const droppableId = `${type}-tasks-droppable`

  const [collapsed, setCollapsed] = useState<boolean>(
    type === 'open' ? !!group.collapsed?.open : !!group.collapsed?.completed,
  )

  const handleCollapse = () => {
    dispatch(tasksGroupCollapsed({ groupName: group.name, type, collapsed: !collapsed }))
    setCollapsed(!collapsed)
  }

  return (
    <OuterContainer data-testid={testId} type={type} items={tasks.length} collapsed={collapsed}>
      <Droppable droppableId={droppableId} isDropDisabled={!canEdit}>
        {(provided) => (
          <Wrapper>
            <SectionHeader>
              <SubTitle>{type} tasks</SubTitle>
              <RoundButton onClick={handleCollapse} size="small">
                {!collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </RoundButton>
            </SectionHeader>
            <InnerTasksContainer
              {...provided.droppableProps}
              className={`${type}-tasks-container`}
              collapsed={collapsed}
              ref={provided.innerRef}
            >
              <TransitionGroup component={null} childFactory={(child) => React.cloneElement(child)}>
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
                          false,
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
                        {({ innerRef, draggableProps, dragHandleProps }, { isDragging }) => {
                          const { style, ...restDraggableProps } = draggableProps
                          return (
                            <div className="task-item" style={getItemStyle(isDragging, style)} {...restDraggableProps}>
                              <TaskItem
                                key={`task-item-${task.id}`}
                                task={task}
                                groupName={group.name}
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
            <ChildrenContainer type={type} items={tasks.length} collapsed={collapsed}>
              {children}
            </ChildrenContainer>
          </Wrapper>
        )}
      </Droppable>
    </OuterContainer>
  )
}

export default TasksContainer
