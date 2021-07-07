import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesPane, PreferencesSegment } from './pane';

export const HelpAndFeedback: FunctionalComponent = () => (
  <PreferencesPane>
    <PreferencesGroup>
      <PreferencesSegment>
        <h2>Frequently asked questions</h2>
        <h4>Who can read my private notes?</h4>
        <p>
          Quite simply: no one but you. Not us, not your ISP, not a hacker, and
          not a government agency. As long as you keep your password safe, and
          your password is reasonably strong, then you are the only person in
          the world with the ability to decrypt your notes. For more on how we
          handle your privacy and security, check out our easy to read{' '}
          <a target="_blank" href="https://standardnotes.com/privacy">
            Privacy Manifesto.
          </a>
        </p>
      </PreferencesSegment>
      <PreferencesSegment>
        <h4>Can I collaborate with others on a note?</h4>
        <p>
          Because of our encrypted architecture, Standard Notes does not
          currently provide a real-time collaboration solution. Multiple users
          can share the same account however, but editing at the same time may
          result in sync conflicts, which may result in the duplication of
          notes.
        </p>
      </PreferencesSegment>
      <PreferencesSegment>
        <h4>Can I use Standard Notes totally offline?</h4>
        <p>
          Standard Notes can be used totally offline without an account, and
          without an internet connection. You can find{' '}
          <a
            target="_blank"
            href="https://standardnotes.com/help/59/can-i-use-standard-notes-totally-offline"
          >
            more details here.
          </a>
        </p>
      </PreferencesSegment>
      <PreferencesSegment>
        <h4>Can’t find your question here?</h4>
        <button
          onClick={() =>
            window.open('https://standardnotes.com/help', '_blank')
          }
        >
          Open FAQ
        </button>
      </PreferencesSegment>
    </PreferencesGroup>
    <PreferencesGroup>
      <PreferencesSegment>
        <h2>Community forum</h2>
        <p>
          If you have an issue, found a bug or want to suggest a feature, you
          can browse or post to the forum. It’s recommended for non-account
          related issues. Please read our{' '}
          <a target="_blank" href="https://standardnotes.com/longevity/">
            Longevity statement
          </a>{' '}
          before advocating for a feature request.
        </p>
        <button
          onClick={() =>
            window.open('https://forum.standardnotes.org/', '_blank')
          }
        >
          Go to the forum
        </button>
      </PreferencesSegment>
    </PreferencesGroup>
    <PreferencesGroup>
      <PreferencesSegment>
        <h2>Slack group</h2>
        <p>
          Want to meet other passionate note-takers and privacy enthusiasts?
          Want to share your feedback with us? Join the Standard Notes Slack
          group for discussions on security, themes, editors and more.
        </p>
        <button
          onClick={() =>
            window.open('https://standardnotes.com/slack', '_blank')
          }
        >
          Join our Slack group
        </button>
      </PreferencesSegment>
    </PreferencesGroup>
    <PreferencesGroup>
      <PreferencesSegment>
        <h2>Account related issue?</h2>
        <p>Send an email to help@standardnotes.org and we’ll sort it out.</p>
        <button
          onClick={() =>
            window.open('mailto: help@standardnotes.org', '_blank')
          }
        >
          Email us
        </button>
      </PreferencesSegment>
    </PreferencesGroup>
  </PreferencesPane>
);
