import {
  getPercentage,
  getTaskArrayFromGroupedTasks,
  groupTasksByCompletedStatus,
  truncateText,
} from '../../common/utils'
import { GroupPayload, TaskPayload } from './tasks-slice'

const GROUPS_PREVIEW_LIMIT = 3
const MAX_GROUP_DESCRIPTION_LENGTH = 30

const Title: React.FC = ({ children }) => {
  return <p className="ml-2 w-full font-medium">{children}</p>
}

type GroupSummaryProps = {
  groups: GroupPayload[]
}

const GroupSummary: React.FC<GroupSummaryProps> = ({ groups }) => {
  const totalGroups = groups.length
  const groupsToPreview = groups.slice(0, Math.min(totalGroups, GROUPS_PREVIEW_LIMIT))
  if (groupsToPreview.length === 0) {
    return <></>
  }

  const remainingGroups = totalGroups - groupsToPreview.length
  const groupNoun = remainingGroups > 1 ? 'groups' : 'group'

  return (
    <>
      <div className="my-2">
        {groupsToPreview.map((group, index) => {
          const totalTasks = group.tasks.length
          const totalCompletedTasks = group.tasks.filter((task) => task.completed === true).length

          return (
            <p data-testid="group-summary" key={`group-${group.name}`} className="mb-1">
              {truncateText(group.name, MAX_GROUP_DESCRIPTION_LENGTH)}
              <span className="px-2 text-neutral">
                {totalCompletedTasks}/{totalTasks}
              </span>
            </p>
          )
        })}
      </div>
      {remainingGroups > 0 && (
        <p data-testid="groups-remaining">
          And {remainingGroups} other {groupNoun}
        </p>
      )}
    </>
  )
}

type NotePreviewProps = {
  groupedTasks: GroupPayload[]
}

const NotePreview: React.FC<NotePreviewProps> = ({ groupedTasks }) => {
  const allTasks: TaskPayload[] = getTaskArrayFromGroupedTasks(groupedTasks)
  const { completedTasks } = groupTasksByCompletedStatus(allTasks)
  const percentage = getPercentage(allTasks.length, completedTasks.length)
  const roundedPercentage = Math.floor(percentage / 10) * 10

  return (
    <>
      <div className="flex flex-grow items-center mb-3">
        <svg data-testid="circular-progress-bar" className="sk-circular-progress" viewBox="0 0 18 18">
          <circle className="background" />
          <circle className={`progress p-${roundedPercentage}`} />
        </svg>
        <Title>
          {completedTasks.length}/{allTasks.length} tasks completed
        </Title>
      </div>
      <GroupSummary groups={groupedTasks} />
    </>
  )
}

export default NotePreview
