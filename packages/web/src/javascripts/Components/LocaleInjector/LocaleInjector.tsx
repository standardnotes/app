import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { Fragment, FunctionComponent, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
  children: ReactNode
}

const LocaleInjector: FunctionComponent<Props> = ({ children }) => {
  const { currentLocale } = localizationStore

  return <Fragment key={currentLocale}>{children}</Fragment>
}

export default observer(LocaleInjector)
