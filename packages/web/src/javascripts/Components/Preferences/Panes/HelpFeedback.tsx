import { Title, Subtitle, Text, LinkButton } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { MouseEventHandler } from 'react'
import {
  AppName,
  jtString,
  DiscordUrl,
  ForumUrl,
  HelpOfflineUrl,
  HelpUrl,
  PrivacyPolicyUrl,
  SupportEmail,
  SupportMailtoUrl,
} from '@standardnotes/features'
import { c } from 'ttag'

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
          <Title>{c('B7.FilesSubscriptionHelp.Help.Info').t`Frequently asked questions`}</Title>
          <div className="h-2 w-full" />
          <Subtitle>{c('B7.FilesSubscriptionHelp.Help.Confirmation').t`Who can read my private notes?`}</Subtitle>
          <Text>
            {c('B7.FilesSubscriptionHelp.Help.Info')
              .t`Quite simply: no one but you. Not us, not your ISP, not a hacker, and not a government agency. As long as you keep your password safe, and your password is reasonably strong, then you are the only person in the world with the ability to decrypt your notes. For more on how we handle your privacy and security, check out our easy to read`}{' '}
            <a target="_blank" className="underline hover:no-underline" href={PrivacyPolicyUrl} onClick={handleClick}>
              {c('B7.FilesSubscriptionHelp.Help.Info').t`Privacy Manifesto.`}
            </a>
          </Text>
          {application.isNativeIOS() && (
            <>
              <LinkButton
                className="mt-3"
                label={c('B7.FilesSubscriptionHelp.Help.Label').t`Privacy Policy`}
                link={PrivacyPolicyUrl}
                onClick={handleClick}
              />
              <LinkButton
                className="mt-3"
                label={c('B7.FilesSubscriptionHelp.Help.Label').t`Terms of Use`}
                link="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                onClick={handleClick}
              />
            </>
          )}
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>{c('B7.FilesSubscriptionHelp.Help.Confirmation')
            .t`Can I collaborate with others on a note?`}</Subtitle>
          <Text>
            {jtString(
              c('B7.FilesSubscriptionHelp.Help.Info')
                .jt`Because of our encrypted architecture, ${AppName} does not currently provide a real-time collaboration solution. Multiple users can share the same account however, but editing at the same time may result in sync conflicts, which may result in the duplication of notes.`,
            )}
          </Text>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>
            {jtString(c('B7.FilesSubscriptionHelp.Help.Confirmation').jt`Can I use ${AppName} totally offline?`)}
          </Subtitle>
          <Text>
            {jtString(
              c('B7.FilesSubscriptionHelp.Help.Info')
                .jt`${AppName} can be used totally offline without an account, and without an internet connection. You can find`,
            )}{' '}
            <a target="_blank" className="underline hover:no-underline" href={HelpOfflineUrl} onClick={handleClick}>
              {c('B7.FilesSubscriptionHelp.Help.Info').t`more details here.`}
            </a>
          </Text>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>{c('B7.FilesSubscriptionHelp.Help.Confirmation').t`Can’t find your question here?`}</Subtitle>
          <LinkButton
            className="mt-3"
            label={c('B7.FilesSubscriptionHelp.Help.Label').t`Open FAQ`}
            link={HelpUrl}
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B7.FilesSubscriptionHelp.Help.Info').t`Community forum`}</Title>
          <Text>
            {c('B7.FilesSubscriptionHelp.Help.Info')
              .t`If you have an issue, found a bug or want to suggest a feature, you can browse or post to the forum. It’s recommended for non-account related issues.`}
          </Text>
          <LinkButton
            className="mt-3"
            label={c('B7.FilesSubscriptionHelp.Help.Label').t`Go to the forum`}
            link={ForumUrl}
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B7.FilesSubscriptionHelp.Help.Info').t`Discord server`}</Title>
          <Text>
            {jtString(
              c('B7.FilesSubscriptionHelp.Help.Info')
                .jt`Want to meet other passionate note-takers and privacy enthusiasts? Want to share your feedback with us? Join the ${AppName} Discord for discussions on security, themes, editors and more.`,
            )}
          </Text>
          <LinkButton
            className="mt-3"
            link={DiscordUrl}
            label={c('B7.FilesSubscriptionHelp.Help.Label').t`Join our Discord`}
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B7.FilesSubscriptionHelp.Help.Confirmation').t`Account related issue?`}</Title>
          <Text>
            {jtString(
              c('B7.FilesSubscriptionHelp.Help.Info').jt`Send an email to ${SupportEmail} and we’ll sort it out.`,
            )}
          </Text>
          <LinkButton
            className="mt-3"
            link={SupportMailtoUrl}
            label={c('B7.FilesSubscriptionHelp.Help.Label').t`Email us`}
            onClick={handleClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default HelpAndFeedback
