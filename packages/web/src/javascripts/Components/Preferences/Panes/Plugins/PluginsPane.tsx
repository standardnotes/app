import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import InstallCustomPlugin from '@/Components/Preferences/Panes/Plugins/InstallCustom/InstallCustomPlugin'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { PackageProvider } from './PackageProvider'
import BrowsePlugins from './BrowsePlugins/BrowsePlugins'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import { Title } from '../../PreferencesComponents/Content'
import ManagePlugins from './ManagePlugins/ManagePlugins'
import { c } from 'ttag'

type Props = {
  pluginsLatestVersions: PackageProvider
}

const PluginsPane: FunctionComponent<Props> = ({ pluginsLatestVersions }) => {
  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <BrowsePlugins />
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B6.Preferences.Other.Title').t`Manage Plugins`}</Title>
          <ManagePlugins className={'mt-3'} pluginsLatestVersions={pluginsLatestVersions} />
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B6.Preferences.Other.Title').t`Install Custom Plugin`}</Title>
          <InstallCustomPlugin className={'mt-3'} />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default observer(PluginsPane)
