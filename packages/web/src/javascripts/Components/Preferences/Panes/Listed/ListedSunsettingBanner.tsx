import { AppName, ListedName } from '@standardnotes/features'
import { c } from 'ttag'

type Props = {
  variant?: 'pane' | 'menu'
}

const LearnMoreLink = () => {
  return (
    <a
      target="_blank"
      className="underline hover:no-underline"
      href="https://listed.to/@Listed/76799/an-update-about-listed"
    >
      {c('B6.Preferences.Listed.Action').t`Learn more`}
    </a>
  )
}

const ListedSunsettingBanner = ({ variant = 'pane' }: Props) => {
  const message =
    variant === 'menu'
      ? c('B6.Preferences.Listed.Info').jt`${ListedName} will permanently shut down on December 31, 2026.`
      : c('B6.Preferences.Listed.Info')
          .jt`Note: The ${ListedName} platform will permanently shut down December 31, 2026. Your data published on ${ListedName} will still be available in your personal ${AppName} account.`

  if (variant === 'menu') {
    return (
      <div className="bg-warning-faded m-1 mb-3 rounded border border-border p-3 text-sm text-text">
        <p className="m-0 font-bold">
          {message} <LearnMoreLink />
        </p>
      </div>
    )
  }

  return (
    <div className="bg-warning-faded mb-3 flex max-w-full flex-col rounded border border-solid border-border p-6 text-sm text-text">
      <p className="m-0 font-bold">
        {message} <LearnMoreLink />
      </p>
    </div>
  )
}

export default ListedSunsettingBanner
