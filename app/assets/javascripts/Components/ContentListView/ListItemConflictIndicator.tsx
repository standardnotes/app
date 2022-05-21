import { FunctionComponent } from 'preact'

export const ListItemConflictIndicator: FunctionComponent = () => {
  return (
    <div className="flex flex-wrap items-center mt-0.5">
      <div className={'py-1 px-1.5 rounded mr-1 mt-2 bg-danger color-danger-contrast'}>
        <div className="text-xs font-bold text-center">Conflicted Copy</div>
      </div>
    </div>
  )
}
