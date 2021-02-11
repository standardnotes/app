import { toDirective, useAutorunValue } from './utils';
import Close from '../../icons/ic_close.svg';
import { AppState } from '@/ui_models/app_state';

function NoAccountWarning({ appState }: { appState: AppState }) {
  const canShow = useAutorunValue(() => appState.noAccountWarning.show);
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
        className="sn-btn mt-3 col-start-1 col-end-3 justify-self-start"
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
        className="border-0 p-0 bg-transparent cursor-pointer rounded-md col-start-2 row-start-1 color-neutral hover:color-info"
      >
        <Close className="fill-current" />
      </button>
    </div>
  );
}

export const NoAccountWarningDirective = toDirective(NoAccountWarning);
