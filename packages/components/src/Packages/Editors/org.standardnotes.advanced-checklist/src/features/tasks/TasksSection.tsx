import './TasksSection.scss'

import React, { useEffect, useState } from 'react'
import { Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector, usePrevious } from '../../app/hooks'
import { SubTitle } from '../../common/components'
import { SectionModel, TaskModel, tasksGroupCollapsed } from './tasks-slice'

import TaskItem from './TaskItem'

const SectionHeader = styled.div`
  align-items: center;
  display: flex;

  & > *:first-child {
    margin-right: 14px;
  }
`

const InnerTasksContainer = styled.div`
  display: flex;
  flex-direction: column;

  & > *:not(:last-child) {
    margin-bottom: 9px;
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

const COMPLETED_TASK_TIMEOUT_MS = 1_800
const OPEN_TASK_TIMEOUT_MS = 1_200

type TransitionTimeout = {
  enter: number
  exit: number
}

function getTimeout(completed?: boolean): TransitionTimeout {
  return {
    enter: completed ? COMPLETED_TASK_TIMEOUT_MS : OPEN_TASK_TIMEOUT_MS,
    exit: !completed ? COMPLETED_TASK_TIMEOUT_MS : OPEN_TASK_TIMEOUT_MS,
  }
}

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
  allTasks?: TaskModel[]
  testId?: string
}

const TasksSection: React.FC<TasksSectionProps> = ({ groupName, tasks, section, allTasks, testId, children }) => {
  const dispatch = useAppDispatch()
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const droppableId = `${section.id}-droppable`

  const [collapsed, setCollapsed] = useState<boolean>(!!section.collapsed)

  function handleCollapse() {
    setCollapsed(!collapsed)
  }

  const prevTasks: TaskModel[] = usePrevious(allTasks)

  useEffect(() => {
    dispatch(tasksGroupCollapsed({ groupName, type: section.id, collapsed }))
  }, [collapsed, dispatch, groupName, section.id])

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
              <SubTitle onClick={handleCollapse}>{section.name}</SubTitle>
            </SectionHeader>
            {!collapsed && (
              <InnerTasksContainer
                {...provided.droppableProps}
                className={`${section.id}-container`}
                ref={provided.innerRef}
              >
                <TransitionGroup component={null}>
                  {tasks.map((task, index) => {
                    const timeout = getTimeout(task.completed)
                    return (
                      <CSSTransition
                        key={task.id}
                        timeout={timeout}
                        classNames={{
                          enter: 'fade-in',
                          enterActive: 'fade-in',
                          enterDone: 'fade-in',
                          exit: 'fade-out',
                          exitActive: 'fade-out',
                          exitDone: 'fade-out',
                        }}
                        onEnter={(node: HTMLElement) => {
                          const exists = prevTasks.find((t) => t.id === task.id)
                          exists && node.classList.add('hide')

                          const completed = !!task.completed
                          completed && node.classList.add('explode')
                          !completed && node.classList.remove('explode')
                        }}
                        onEntered={(node: HTMLElement) => {
                          node.classList.remove('hide')
                          setTimeout(() => node.classList.remove(...['fade-in', 'explode']), timeout.enter)
                        }}
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
                              <div
                                style={getItemStyle(isDragging, style)}
                                ref={innerRef}
                                {...restDraggableProps}
                                {...dragHandleProps}
                              >
                                <TaskItem key={`task-item-${task.id}`} task={task} groupName={groupName} />
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
            )}
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
