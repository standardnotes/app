import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { getPercentage } from '../../common/utils'
import { GroupModel, tasksGroupCollapsed } from './tasks-slice'

import CreateTask from './CreateTask'
import TaskSectionList from './TaskSectionList'

import TaskGroupOptions from './TaskGroupOptions'

import { useEffect, useState } from 'react'
import { CircularProgressBar, GenericInlineText, MainTitle, RoundButton } from '../../common/components'
import { ChevronDownIcon, ChevronUpIcon } from '../../common/components/icons'

const TaskGroupContainer = styled.div<{ isLast?: boolean }>`
  background-color: var(--sn-stylekit-background-color);
  border: 1px solid var(--sn-stylekit-border-color);
  border-radius: 4px;
  box-sizing: border-box;
  padding: 16px;
  margin-bottom: ${({ isLast }) => (!isLast ? '9px' : '0px')};

  @media only screen and (max-width: 600px) {
    padding: 8px 10px;
  }
`

type TaskGroupProps = {
  group: GroupModel
  isDragging: boolean
  isLast?: boolean
  style?: React.CSSProperties
  innerRef?: (element?: HTMLElement | null | undefined) => any
  onDragStart?: React.DragEventHandler<any>
  onTransitionEnd?: React.TransitionEventHandler<any>
}

const TaskGroup: React.FC<TaskGroupProps> = ({
  group,
  isDragging,
  isLast,
  style,
  innerRef,
  onDragStart,
  onTransitionEnd,
  ...props
}) => {
  const dispatch = useAppDispatch()

  const groupName = group.name

  const completedTasks = group.tasks.filter((task) => task.completed).length
  const totalTasks = group.tasks.length
  const percentageCompleted = getPercentage(completedTasks, totalTasks)

  const [collapsed, setCollapsed] = useState<boolean>(!!group.collapsed)

  const canEdit = useAppSelector((state) => state.settings.canEdit)

  const allTasksCompleted = totalTasks > 0 && totalTasks === completedTasks

  function handleCollapse() {
    setCollapsed(!collapsed)
  }

  function handleClick() {
    if (!collapsed) {
      return
    }
    setCollapsed(false)
  }

  useEffect(() => {
    dispatch(tasksGroupCollapsed({ groupName, type: 'group', collapsed }))
  }, [collapsed, dispatch, groupName])

  return (
    <TaskGroupContainer
      ref={innerRef}
      style={style}
      onDragStart={onDragStart}
      onTransitionEnd={onTransitionEnd}
      isLast={isLast}
    >
      <div className="flex items-center justify-between h-8 mt-1 mb-1">
        <div className="flex flex-grow items-center" onClick={handleClick}>
          <MainTitle crossed={allTasksCompleted && collapsed} highlight={isDragging} {...props}>
            {groupName}
          </MainTitle>
          <CircularProgressBar size={18} percentage={percentageCompleted} />
          <GenericInlineText data-testid="task-group-stats">
            {completedTasks}/{totalTasks}
          </GenericInlineText>
        </div>
        {!isDragging && (
          <div className="flex items-center">
            {canEdit && (
              <div className="ml-3">
                <TaskGroupOptions groupName={groupName} />
              </div>
            )}
            <div className="ml-3">
              <RoundButton testId="collapse-task-group" onClick={handleCollapse}>
                {!collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </RoundButton>
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <>
          <CreateTask group={group} />
          <TaskSectionList group={group} />
        </>
      )}
    </TaskGroupContainer>
  )
}

export default TaskGroup
