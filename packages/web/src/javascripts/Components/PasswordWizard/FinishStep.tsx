import { c } from 'ttag'
import { CheckmarkCircle } from '../UIElements/CheckmarkCircle'

export const FinishStep = () => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-start gap-3">
        <div className="pt-1">
          <CheckmarkCircle />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-bold">{c('B1.Account.Password.Info').t`Your password has been successfully changed.`}</div>
          <p>
            {c('B1.Account.Password.Info')
              .t`Ensure you are running the latest version of Standard Notes on all platforms for maximum compatibility.`}
          </p>
        </div>
      </div>
    </div>
  )
}
