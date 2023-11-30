import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'

import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import HomeServerSettings from './HomeServerSettings'

const HomeServer = () => {
  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <HomeServerSettings />
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>Remote access</Title>
        <Subtitle>Accessing your home server while on the go is easy and secure with Tailscale.</Subtitle>
        <ol className="ml-3 mt-3 list-outside list-decimal">
          <li>
            Register on{' '}
            <a className="text-info" href="https://tailscale.com/">
              Tailscale.com
            </a>{' '}
            for free.
          </li>
          <li className="mt-2">
            Download Tailscale on this computer and complete the Tailscale setup wizard until you are presented with the
            IP address of your computer. It should start with something like 100.xxx...
          </li>
          <li className="mt-2">Download Tailscale on your mobile device and sign into your Tailscale account.</li>
          <li className="mt-2">Activate the Tailscale VPN on your mobile device.</li>
          <li className="mt-2">
            Open Standard Notes on your mobile device and sign into your home server by specifying the sync server URL
            during sign in. The URL will be the Tailscale-based IP address of this computer, followed by the port number
            of your home server. For example, if your computer Tailscale IP address is 100.112.45.106 and your home
            server is running on port 3127, your sync server URL will be http://100.112.45.106:3127.
          </li>
        </ol>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>Backing up your data</Title>
        <Subtitle>
          For automatic backups, you can place your server's data inside of a synced cloud folder, like Dropbox,
          Tresorit, or iCloud Drive.
        </Subtitle>
        <ol className="ml-3 mt-3 list-outside list-decimal">
          <li>Change your server's data location by selecting "Change Location" in the Home Server section above.</li>
          <li className="mt-2">Select a cloud drive to store your server's data in.</li>
          <li className="mt-2">Restart your home server.</li>
        </ol>
        <Text className="mt-3">
          Your Standard Notes data is always end-to-end encrypted on disk, so your cloud provider will not be able to
          read your notes or files.
        </Text>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default HomeServer
