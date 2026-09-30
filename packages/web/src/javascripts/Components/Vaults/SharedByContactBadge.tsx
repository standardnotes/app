import { TrustedContactInterface } from '@standardnotes/models'
import { c } from 'ttag'
import Icon from '../Icon/Icon'

const SharedByContactBadge = ({ contact }: { contact: TrustedContactInterface }) => {
  return (
    <div
      title={c('B2.NavSharedUI.Label').t`Shared by contact`}
      className="flex items-center rounded bg-info px-1.5 py-1 text-neutral-contrast"
    >
      <Icon
        ariaLabel={c('B2.NavSharedUI.Label').t`Shared by contact`}
        type="archive"
        className="mr-1 text-info-contrast"
        size="medium"
      />
      <div className="text-center text-sm font-semibold lg:text-xs">{contact.name}</div>
    </div>
  )
}

export default SharedByContactBadge
