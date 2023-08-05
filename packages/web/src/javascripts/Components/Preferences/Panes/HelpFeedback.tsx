import { Title, Subtitle, Text, LinkButton } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { MouseEventHandler } from 'react'

const HelpAndFeedback = ({ application }: { application: WebApplication }) => {
  const openLinkOnMobile = (link: string) => {
    if (application.isNativeMobileWeb()) {
      application.mobileDevice.openUrl(link)
    }
  }

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (application.isNativeMobileWeb()) {
      event.preventDefault()
      openLinkOnMobile(event.currentTarget.href)
    }
  }

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Frequently asked questions</Title>
          <div className="h-2 w-full" />
          <Subtitle>Who can read my private notes?</Subtitle>
          <Text>
            Quite simply: no one but you. Not us, not your ISP, not a hacker, and not a government agency. As long as
            you keep your password safe, and your password is reasonably strong, then you are the only person in the
            world with the ability to decrypt your notes. For more on how we handle your privacy and security, check out
            our easy to read{' '}
            <a
              target="_blank"
              className="underline hover:no-underline"
              href="https://standardnotes.com/privacy"
              onClick={handleClick}
            >
              Privacy Manifesto.
            </a>
          </Text>
          {application.isNativeIOS() && (
            <>
              <LinkButton
                className="mt-3"
                label="Privacy Policy"
                link="https://standardnotes.com/privacy"
                onClick={handleClick}
              />
              <LinkButton
                className="mt-3"
                label="Terms of Use"
                link="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                onClick={handleClick}
              />
            </>
          )}
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>Can I collaborate with others on a note?</Subtitle>
          <Text>
            Because of our encrypted architecture, Standard Notes does not currently provide a real-time collaboration
            solution. Multiple users can share the same account however, but editing at the same time may result in sync
            conflicts, which may result in the duplication of notes.
          </Text>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>Can I use Standard Notes totally offline?</Subtitle>
          <Text>
            Standard Notes can be used totally offline without an account, and without an internet connection. You can
            find{' '}
            <a
              target="_blank"
              className="underline hover:no-underline"
              href="https://standardnotes.com/help/59/can-i-use-standard-notes-totally-offline"
              onClick={handleClick}
            >
              more details here.
            </a>
          </Text>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>Can’t find your question here?</Subtitle>
          <LinkButton className="mt-3" label="Open FAQ" link="https://standardnotes.com/help" onClick={handleClick} />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Community forum</Title>
          <Text>
            If you have an issue, found a bug or want to suggest a feature, you can browse or post to the forum. It’s
            recommended for non-account related issues.
          </Text>
          <LinkButton
            className="mt-3"
            label="Go to the forum"
            link="https://standardnotes.com/forum"
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Community groups</Title>
          <Text>
            Want to meet other passionate note-takers and privacy enthusiasts? Want to share your feedback with us? Join
            the Standard Notes Discord for discussions on security, themes, editors and more.
          </Text>
          <LinkButton
            className="mt-3"
            link="https://standardnotes.com/discord"
            label="Join our Discord"
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Account related issue?</Title>
          <Text>Send an email to help@standardnotes.com and we’ll sort it out.</Text>
          <LinkButton className="mt-3" link="mailto: help@standardnotes.com" label="Email us" onClick={handleClick} />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default HelpAndFeedback
