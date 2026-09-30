export const LISTED_SUNSETTING_PREFERENCES_NOTE =
  'Note: The Listed platform will permanently shut down December 31, 2026. Your data published on Listed will still be available in your personal Standard Notes account.'

export const LISTED_SUNSETTING_ACTIONS_NOTE = 'Listed will permanently shut down on December 31, 2026.'

const LearnMoreLink = () => {
  return (
    <a
      target="_blank"
      className="underline hover:no-underline"
      href="https://listed.to/@Listed/76799/an-update-about-listed"
    >
      Learn more
    </a>
  )
}

type Props = {
  variant?: 'pane' | 'menu'
}

const ListedSunsettingBanner = ({ variant = 'pane' }: Props) => {
  const message = variant === 'menu' ? LISTED_SUNSETTING_ACTIONS_NOTE : LISTED_SUNSETTING_PREFERENCES_NOTE

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
