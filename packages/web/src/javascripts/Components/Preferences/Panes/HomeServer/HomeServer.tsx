import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'

import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import HomeServerSettings from './HomeServerSettings'
import { AppName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

const HomeServer = () => {
  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <HomeServerSettings />
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>{c('B6.Preferences.HomeServer.Title').t`Remote access`}</Title>
        <Subtitle>{c('B6.Preferences.HomeServer.Subtitle')
          .t`Accessing your home server while on the go is easy and secure with Tailscale.`}</Subtitle>
        <ol className="ml-3 mt-3 list-outside list-decimal">
          <li>
            {c('B6.Preferences.HomeServer.Label').t`Register on`}{' '}
            <a className="text-info" href="https://tailscale.com/">
              Tailscale.com
            </a>{' '}
            {c('B6.Preferences.HomeServer.Label').t`for free.`}
          </li>
          <li className="mt-2">
            {c('B6.Preferences.HomeServer.Status')
              .t`Download Tailscale on this computer and complete the Tailscale setup wizard until you are presented with the IP address of your computer. It should start with something like 100.xxx...`}
          </li>
          <li className="mt-2">{c('B6.Preferences.HomeServer.Info')
            .t`Download Tailscale on your mobile device and sign into your Tailscale account.`}</li>
          <li className="mt-2">{c('B6.Preferences.HomeServer.Info')
            .t`Activate the Tailscale VPN on your mobile device.`}</li>
          <li className="mt-2">
            {jtString(
              c('B6.Preferences.HomeServer.Info')
                .jt`Open ${AppName} on your mobile device and sign into your home server by specifying the sync server URL during sign in. The URL will be the Tailscale-based IP address of this computer, followed by the port number of your home server. For example, if your computer Tailscale IP address is 100.112.45.106 and your home server is running on port 3127, your sync server URL will be http://100.112.45.106:3127.`,
            )}
          </li>
        </ol>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>{c('B6.Preferences.HomeServer.Title').t`Backing up your data`}</Title>
        <Subtitle>
          {c('B6.Preferences.HomeServer.Info')
            .t`For automatic backups, you can place your server's data inside of a synced cloud folder, like Dropbox, Tresorit, or iCloud Drive.`}
        </Subtitle>
        <ol className="ml-3 mt-3 list-outside list-decimal">
          <li>{c('B6.Preferences.HomeServer.Info')
            .t`Change your server's data location by selecting "Change Location" in the Home Server section above.`}</li>
          <li className="mt-2">{c('B6.Preferences.HomeServer.Info')
            .t`Select a cloud drive to store your server's data in.`}</li>
          <li className="mt-2">{c('B6.Preferences.HomeServer.Info').t`Restart your home server.`}</li>
        </ol>
        <Text className="mt-3">
          {jtString(
            c('B6.Preferences.HomeServer.Info')
              .jt`Your ${AppName} data is always end-to-end encrypted on disk, so your cloud provider will not be able to read your notes or files.`,
          )}
        </Text>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default HomeServer
