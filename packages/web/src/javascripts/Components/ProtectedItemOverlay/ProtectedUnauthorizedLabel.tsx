import { c } from 'ttag'

const ProtectedUnauthorizedLabel = () => {
  return (
    <div className="text-center">{c('B2.NavSharedUI.Info').t`This item is protected. Please authorize first.`}</div>
  )
}

export default ProtectedUnauthorizedLabel
