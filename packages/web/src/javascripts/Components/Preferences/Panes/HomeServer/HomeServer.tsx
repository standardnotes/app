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
        <Title>Remote Access</Title>
        <Subtitle>Accessing your home server while on the go is easy and secure with Tailscale.</Subtitle>
        <ol className="mt-3 ml-3 list-outside list-decimal">
          <li>
            Register on{' '}
            <a className="text-info" href="https://tailscale.com/">
              Tailscale.com
            </a>{' '}
            for free.
          </li>
          <li className="mt-2">
            Download Tailscale on this computer and complete the Tailscale setup wizard until you are presented with the
            final IP address of your server. It should start with something like 100.xxx...
          </li>
          <li className="mt-2">Download Tailscale on your mobile device and sign into your Tailscale account.</li>
        </ol>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>Backing Up Your Data</Title>
        <Subtitle>
          For automatic backups, you can place your server's data inside of a synced cloud folder, like Dropbox,
          Tresorit, or iCloud Drive.
        </Subtitle>
        <ol className="mt-3 ml-3 list-outside list-decimal">
          <li>
            Change your server's data location by selecting "Change Data Location" in the Home Server section above.
          </li>
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
