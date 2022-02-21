import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { SNNote } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';

type Props = {
  application: WebApplication;
  appState: AppState;
  note: SNNote;
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

export const ListedActionsOption: FunctionComponent<Props> = ({
  application,
  appState,
  note,
  closeOnBlur,
}) => {
  const listedMenuButtonRef = useRef<HTMLButtonElement>(null);
  const listedMenuRef = useRef<HTMLDivElement>(null);

  const [listedMenuOpen, setListedMenuOpen] = useState(false);
  const [listedMenuStyle, setListedMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });

  const toggleListedMenu = () => {
    if (!listedMenuOpen) {
      const menuPosition = calculateSubmenuStyle(listedMenuButtonRef.current);
      if (menuPosition) {
        setListedMenuStyle(menuPosition);
      }
    }

    setListedMenuOpen(!listedMenuOpen);
  };

  useEffect(() => {
    if (listedMenuOpen) {
      setTimeout(() => {
        const newMenuPosition = calculateSubmenuStyle(
          listedMenuButtonRef.current,
          listedMenuRef.current
        );

        if (newMenuPosition) {
          setListedMenuStyle(newMenuPosition);
        }
      });
    }
  }, [listedMenuOpen]);

  return (
    <Disclosure open={listedMenuOpen} onChange={toggleListedMenu}>
      <DisclosureButton
        ref={listedMenuButtonRef}
        onBlur={closeOnBlur}
        className="sn-dropdown-item justify-between"
      >
        <div className="flex items-center">
          <Icon type="listed" className="color-neutral mr-2" />
          Listed actions
        </div>
        <Icon type="chevron-right" className="color-neutral" />
      </DisclosureButton>
      <DisclosurePanel
        ref={listedMenuRef}
        style={{
          ...listedMenuStyle,
          position: 'fixed',
        }}
        className="sn-dropdown flex flex-col items-center justify-center min-h-16 max-h-120 min-w-68 fixed overflow-y-auto"
      >
        Listed action
      </DisclosurePanel>
    </Disclosure>
  );
};
