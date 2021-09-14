import { FunctionalComponent } from 'preact';
import { DecoratedInput } from '@/components/DecoratedInput';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import { StateUpdater } from '@node_modules/preact/hooks';
import { Icon } from '@/components/Icon';
import { HtmlInputType } from '@/enums';
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;

type Props = {
  setPassword: StateUpdater<string>;
  handleKeyPress: (event: TargetedKeyboardEvent<HTMLInputElement>) => void;
}

export const DeleteAccountForm: FunctionalComponent<Props> = ({
  setPassword,
  handleKeyPress
}) => {
  return (
    <div className={'text-center'}>
      <div className={'flex justify-center'}>
        <Icon type={'lock-in-circle'} className={'w-30 h-30'} />
      </div>

      <div className={'mt-4 text-lg color-black'}>Delete account?</div>
      <div>For safety reasons, we need you to confirm your password before continuing.</div>
      <div className={'mt-4'}>
        <DecoratedInput
          type={HtmlInputType.Password}
          onChange={(password) => {
            setPassword(password);
          }}
          onKeyPress={handleKeyPress}
          placeholder={'Password'}
        />
      </div>
    </div>
  );
};
