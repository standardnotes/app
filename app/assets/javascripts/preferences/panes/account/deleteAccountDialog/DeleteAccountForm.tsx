import { FunctionalComponent } from 'preact';
import { DecoratedInput } from '@/components/DecoratedInput';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;
import { StateUpdater } from '@node_modules/preact/hooks';

type Props = {
  accountEmail: string;
  setAccountEmail: StateUpdater<string>;
  handleKeyPress: (event: TargetedKeyboardEvent<HTMLInputElement>) => void;
}

export const DeleteAccountForm: FunctionalComponent<Props> = ({
  accountEmail,
  setAccountEmail,
  handleKeyPress
}) => {
  return (
    <section>
      <div>
        <p>
          If you've forgotten your password to your Standard Notes account, your only option is
          to delete the account and start all over.
        </p>
        <p className={'mt-2'}>
          <span className={'font-bold'}>Note:{' '}</span>
          Deleting your account will permanently delete any associated notes, tags, and other data.
          If you're already signed in to Standard Notes on one of your devices, be sure to
          export your data before proceeding.
        </p>
        <p className={'mt-2'}>
          <span className={'font-bold'}>Extended users:{' '}</span>
          Your notes account is separate from your{' '}
          <a href='https://website-dev.standardnotes.com/features' target={'_blank'}>Extended</a>{' '}
          account. Deleting your notes account{' '}
          <i>will not</i>{' '}
          affect your Extended account or subscription. Simply re-add your existing Extended Code after you perform the
          deletion process.
        </p>
        <h3 className={'color-black'}>Enter your account email to proceed</h3>
        <div className='mt-20' />
        <DecoratedInput
          text={accountEmail}
          onChange={(accountEmail) => {
            setAccountEmail(accountEmail);
          }}
          onKeyPress={handleKeyPress}
          placeholder={'Account Email'}
        />
      </div>
    </section>
  );
};
