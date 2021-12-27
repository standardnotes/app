import { Icon, IconType } from '@/components/Icon';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { FunctionComponent } from 'preact';
import { MouseEventHandler } from 'react';
import { useState, useRef, useEffect } from 'preact/hooks';

const DisclosureIconButton: FunctionComponent<{
  className?: string;
  icon: IconType;
  onMouseEnter?: MouseEventHandler;
  onMouseLeave?: MouseEventHandler;
}> = ({ className = '', icon, onMouseEnter, onMouseLeave }) => (
  <DisclosureButton
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`no-border cursor-pointer bg-transparent hover:brightness-130 p-0 ${
      className ?? ''
    }`}
  >
    <Icon type={icon} />
  </DisclosureButton>
);

/**
 * AuthAppInfoPopup is an info icon that shows a tooltip when clicked
 * Tooltip is dismissible by clicking outside
 *
 * Note: it can be generalized but more use cases are required
 * @returns
 */
export const AuthAppInfoTooltip: FunctionComponent = () => {
  const [isClicked, setClicked] = useState(false);
  const [isHover, setHover] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const dismiss = () => setClicked(false);
    document.addEventListener('mousedown', dismiss);
    return () => {
      document.removeEventListener('mousedown', dismiss);
    };
  }, [ref]);

  return (
    <Disclosure
      open={isClicked || isHover}
      onChange={() => setClicked(!isClicked)}
    >
      <div className="relative">
        <DisclosureIconButton
          icon="info"
          className="mt-1"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        />
        <DisclosurePanel>
          <div
            className={`bg-inverted-default color-inverted-default text-center rounded shadow-overlay 
py-1.5 px-2 absolute w-103 -top-10 -left-51`}
          >
            Some apps, like Google Authenticator, do not back up and restore
            your secret keys if you lose your device or get a new one.
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};
