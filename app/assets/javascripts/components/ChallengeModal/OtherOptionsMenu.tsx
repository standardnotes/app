import { MENU_MARGIN_FROM_APP_BORDER } from '@/constants';
import { WebApplication } from '@/ui_models/application';
import { ButtonType, Challenge, ChallengeReason } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { StateUpdater, useRef, useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Menu } from '../Menu/Menu';
import { MenuItem, MenuItemType } from '../Menu/MenuItem';
import { useCloseOnBlur } from '../utils';

type Props = {
  application: WebApplication;
  challenge: Challenge;
  disabled: boolean;
  setBypassFocusLock: StateUpdater<boolean>;
};

export const OtherOptionsMenu: FunctionComponent<Props> = ({
  application,
  challenge,
  disabled,
  setBypassFocusLock,
}) => {
  const menuId = `other-options-${challenge.id}`;
  const shouldShowForgotPasscode = [
    ChallengeReason.ApplicationUnlock,
    ChallengeReason.Migration,
  ].includes(challenge.reason);

  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<JSXInternal.CSSProperties>();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [closeOnBlur] = useCloseOnBlur(containerRef, setIsOpen);

  const toggleMenu = () => {
    const rect = menuButtonRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientHeight } = document.documentElement;
      const footerElementRect = document
        .getElementById('footer-bar')
        ?.getBoundingClientRect();
      const footerHeightInPx = footerElementRect?.height;

      const style: JSXInternal.CSSProperties = {};

      if (footerHeightInPx) {
        style.maxHeight =
          clientHeight -
          rect.bottom -
          footerHeightInPx -
          MENU_MARGIN_FROM_APP_BORDER;
      }

      style.bottom = clientHeight - rect.top;
      style.right = document.body.clientWidth - rect.right;

      setMenuStyle(style);
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={containerRef}>
      <Button
        disabled={disabled}
        className="min-w-68"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={toggleMenu}
        onBlur={closeOnBlur}
        ref={menuButtonRef}
      >
        Other options
      </Button>
      {isOpen && (
        <div
          className="sn-dropdown max-h-120 min-w-68 py-1 fixed overflow-y-auto"
          style={menuStyle}
          id={menuId}
          ref={menuRef}
        >
          <Menu isOpen={isOpen} a11yLabel="Other options">
            {shouldShowForgotPasscode ? (
              <MenuItem
                type={MenuItemType.IconButton}
                onClick={() => {
                  setBypassFocusLock(true);
                  application.alertService
                    .confirm(
                      'If you forgot your local passcode, your only option is to clear your local data from this device and sign back in to your account.',
                      'Forgot passcode?',
                      'Delete local data',
                      ButtonType.Danger
                    )
                    .then((shouldDeleteLocalData) => {
                      if (shouldDeleteLocalData) {
                        application.user.signOut();
                      }
                    })
                    .catch(console.error)
                    .finally(() => {
                      setBypassFocusLock(false);
                    });
                }}
                onBlur={closeOnBlur}
              >
                <Icon type="help" className="mr-2 color-neutral" />
                Forgot passcode?
              </MenuItem>
            ) : null}
            <MenuItem
              type={MenuItemType.IconButton}
              onClick={() => {
                window.open(
                  'https://standardnotes.com/help/3/how-does-standard-notes-secure-my-notes',
                  '_blank'
                );
              }}
              onBlur={closeOnBlur}
            >
              <Icon type="info" className="mr-2 color-neutral" />
              How we protect your notes
            </MenuItem>
          </Menu>
        </div>
      )}
    </div>
  );
};
