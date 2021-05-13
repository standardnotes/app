import { toDirective } from './utils';
import Close from '../../icons/ic-close.svg';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';

type Props = { appState: AppState };

const NoAccountWarning = observer(({ appState }: Props) => {
  const canShow = appState.noAccountWarning.show;
  if (!canShow) {
    return null;
  }
  return (
    <div className="mt-5 p-5 rounded-md shadow-sm grid grid-template-cols-1fr">
      <h1 className="sk-h3 m-0 font-semibold">Data not backed up</h1>
      <p className="m-0 mt-1 col-start-1 col-end-3">
        Sign in or register to back up your notes.
      </p>
      <button
        className="sn-button small info mt-3 col-start-1 col-end-3 justify-self-start"
        onClick={(event) => {
          event.stopPropagation();
          appState.accountMenu.setShow(true);
        }}
      >
        Open Account menu
      </button>
      <button
        onClick={() => {
          appState.noAccountWarning.hide();
        }}
        title="Ignore"
        label="Ignore"
        style="height: 20px"
        className="border-0 m-0 p-0 bg-transparent cursor-pointer rounded-md col-start-2 row-start-1 color-neutral hover:color-info"
      >
        <Close className="fill-current block" />
      </button>
    </div>
  );
});

export const NoAccountWarningDirective = toDirective<Props>(NoAccountWarning);
