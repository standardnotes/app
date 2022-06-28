import './TasksSection.scss'

import React, { useState } from 'react'
import { Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { RoundButton, SubTitle } from '../../common/components'
import { SectionModel, TaskModel, tasksGroupCollapsed } from './tasks-slice'

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

const OuterContainer = styled.div<{ addMargin: boolean; items: number; collapsed: boolean }>`
  margin-bottom: ${({ addMargin, items, collapsed }) => (addMargin && items > 0 && !collapsed ? '10px' : '0')};
`

const ChildrenContainer = styled.div<{ addMargin: boolean; items: number }>`
  margin-top: ${({ addMargin, items }) => (addMargin && items > 0 ? '15px' : '0')};
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

type TasksSectionProps = {
  groupName: string
  tasks: TaskModel[]
  section: SectionModel
  testId?: string
}

const TasksSection: React.FC<TasksSectionProps> = ({ groupName, tasks, section, testId, children }) => {
  const dispatch = useAppDispatch()
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const droppableId = `${section.id}-droppable`

  const [collapsed, setCollapsed] = useState<boolean>(!!section.collapsed)

  const handleCollapse = () => {
    dispatch(tasksGroupCollapsed({ groupName, type: section.id, collapsed: !collapsed }))
    setCollapsed(!collapsed)
  }

  return (
    <OuterContainer
      data-testid={testId}
      addMargin={section.id === 'open-tasks'}
      items={tasks.length}
      collapsed={collapsed}
    >
      <Droppable droppableId={droppableId} isDropDisabled={!canEdit}>
        {(provided) => (
          <Wrapper>
            <SectionHeader>
              <SubTitle>{section.name}</SubTitle>
              {tasks.length > 0 && (
                <RoundButton onClick={handleCollapse} size="small">
                  {!collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </RoundButton>
              )}
            </SectionHeader>
            <InnerTasksContainer
              {...provided.droppableProps}
              className={`${section.id}-container`}
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
            <ChildrenContainer addMargin={section.id === 'completed-tasks'} items={tasks.length}>
              {children}
            </ChildrenContainer>
          </Wrapper>
        )}
      </Droppable>
    </OuterContainer>
  )
}

export default TasksSection
