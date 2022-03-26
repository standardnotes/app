import { FunctionComponent, Ref } from 'preact';
import { forwardRef } from 'preact/compat';
import { StateUpdater, useState } from 'preact/hooks';
import { DecoratedInput, DecoratedInputProps } from './DecoratedInput';
import { IconButton } from './IconButton';

const Toggle: FunctionComponent<{
  isToggled: boolean;
  setIsToggled: StateUpdater<boolean>;
}> = ({ isToggled, setIsToggled }) => (
  <IconButton
    className="w-5 h-5 justify-center sk-circle hover:bg-grey-4"
    icon={isToggled ? 'eye-off' : 'eye'}
    iconClassName="sn-icon--small"
    title="Show/hide password"
    onClick={() => setIsToggled((isToggled) => !isToggled)}
    focusable={true}
  />
);

/**
 * Password input that has a toggle to show/hide password and can be decorated on the left and right side
 */
export const DecoratedPasswordInput: FunctionComponent<
  Omit<DecoratedInputProps, 'type'>
> = forwardRef((props, ref: Ref<HTMLInputElement>) => {
  const [isToggled, setIsToggled] = useState(false);

  const rightSideDecorations = props.right ? [...props.right] : [];

  return (
    <DecoratedInput
      {...props}
      ref={ref}
      type={isToggled ? 'text' : 'password'}
      right={[
        ...rightSideDecorations,
        <Toggle isToggled={isToggled} setIsToggled={setIsToggled} />,
      ]}
    />
  );
});
