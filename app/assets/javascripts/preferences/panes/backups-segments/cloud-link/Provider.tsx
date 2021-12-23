import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SNItem } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { Button } from '@/components/Button';
import { openInNewTab } from '@/utils';

export enum ProviderType {
  Dropbox = 'Dropbox',
  Google = 'Google Drive',
  OneDrive = 'OneDrive',
}

type Props = {
  application: WebApplication;
  name: string;
  // urlFragment: string;
  urlParamsKey: string;
};

export const Provider = ({
  application,
  name,
  // urlFragment,
  urlParamsKey,
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // TODO: check if all initial values are set correctly (e.g., `successfullyInstalled` and the logic&UI depending on it)
  const [authBegan, setAuthBegan] = useState(false);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [successfullyInstalled, setSuccessfullyInstalled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState<SNItem | undefined>();
  const [confirmation, setConfirmation] = useState('');

  const getAuthUrl = () => {
    // TODO: probably need to have some object/Map that returns corresponding value
    // console.log('name', name, ', ProviderType.Dropbox', ProviderType.Dropbox);

    // TODO: take the correct links (from SNJS)
    if (name == ProviderType.Dropbox) {
      // return window.dropbox_auth_url;
      return 'https://www.dropbox.com/1/oauth2/authorize?client_id=7wzjlm5ap227jw7&response_type=code&redirect_uri=https://extensions-server-dev.standardnotes.org/dropbox/auth_redirect';
    }
    if (name == ProviderType.Google) {
      // return 'window.gdrive_auth_url';
      return 'https://accounts.google.com/o/oauth2/auth/oauthchooseaccount?access_type=offline&client_id=1031174943822-adi9auubef1eo6agmanmb12j2b9fr7ef.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fextensions-server-dev.standardnotes.org%2Fgdrive&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&flowName=GeneralOAuthFlow';
    }
    if (name == ProviderType.OneDrive) {
      // return 'window.onedrive_auth_url';
      return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=706bd9c2-215d-4b5f-a9b5-b466d18ba246&scope=Files.ReadWrite.AppFolder%20Files.ReadWrite.All%20offline_access&response_type=code&redirect_uri=https://extensions-server-dev.standardnotes.org/onedrive/auth_redirect';
    }
  };

  // TODO: fix typings

  const findInstalled = useCallback(() => {
    return installed ? application.findItem(installed.uuid) : undefined;
  }, [application, installed]);

  const uninstall = (event: Event) => {
    event.stopPropagation();
    application.deleteItem(installed as SNItem);
  };

  const install = (event: Event, authUrl: string) => {
    event.stopPropagation();
    openInNewTab(authUrl);
    setAuthBegan(true);
  };

  const performBackupNow = () => {
    // A backup is performed anytime the extension is saved, so just save it here
    application.saveItem((installed as SNItem).uuid);
    alert(
      'A backup has been triggered for this provider. Please allow a couple minutes for your backup to be processed.'
    );
  };

  const base64Encode = (inputString: string) => {
    try {
      return btoa(inputString);
    } catch (e) {
      alert('Invalid code. Please try again.');
    }
  };

  // TODO: check if `component` is always truthy or falsy and remove `if` statement
  const submitExtensionUrl = async (url: string) => {
    const component = await application.downloadExternalFeature(url);
    // console.log('component is', component);
    /*if (component) {
      setConfirmableExtension(component);
    }*/
  };

  const handleKeyPress = async (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      try {
        // TODO: check what is `confirmation` value
        // console.log('{confirmation} ', confirmation);
        await submitExtensionUrl(confirmation);

        setAuthBegan(false);
        setSecretUrl(null);
        setSuccessfullyInstalled(true);

        alert(
          `${name} has been successfully installed. Your first backup has also been queued and should be reflected in your external cloud's folder within the next few minutes.`
        );
      } catch (e) {
        alert('Invalid code. Please try again.');
      }
    }
  };

  const handleChange = (event: Event) => {
    setConfirmation((event.target as HTMLInputElement).value);
  };

  const copyCode = () => {
    console.log('selecting textarea, check if works');
    textareaRef.current?.select();

    try {
      const successful = document.execCommand('copy');
      if (!successful) throw successful;
      setCopied(true);
    } catch (err) {
      console.log('Failed to copy');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get(urlParamsKey);
    const currentlyInstalled = findInstalled();

    setSecretUrl(url);
    setInstalled(currentlyInstalled);
  }, [findInstalled, urlParamsKey]);

  const expanded = authBegan || secretUrl || successfullyInstalled;

  return (
    <div
      className={`px-6 py-2 border-solid border-1 border-main mr-1 ${
        expanded ? 'expanded' : ' '
      }`}
    >
      <div className="sk-panel-section-title sk-panel-row centered">{name}</div>
      {authBegan && (
        <div>
          <p className="sk-panel-row text-center">
            Complete authentication from the newly opened window. Upon
            completion, a confirmation code will be displayed. Enter this code
            below:
          </p>
          <div
            className={`sk-notification dashed border-1 one-line border-neutral`}
          >
            <input
              className="sk-input sk-base center-text"
              placeholder="Enter confirmation code"
              value={confirmation}
              onKeyPress={handleKeyPress}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
      {successfullyInstalled && <p>{name} has been successfully installed.</p>}
      {!installed && !authBegan && !secretUrl && (
        <div className="sk-button-group sk-panel-row stretch">
          <Button
            type="normal"
            label="Install"
            className={'px-1 py-1 text-xs'}
            onClick={(event) => {
              install(event, getAuthUrl() as string);
            }}
          />
        </div>
      )}

      {installed && (
        <div>
          <div className="sk-button-group sk-panel-row stretch">
            <a className="sk-button sk-secondary-contrast" onClick={uninstall}>
              <div className="sk-label">Uninstall</div>
            </a>
          </div>
          <div className="sk-button-group stretch">
            <a
              className="sk-button sk-secondary-contrast"
              onClick={performBackupNow}
            >
              <div className="sk-label">Perform Backup</div>
            </a>
          </div>
        </div>
      )}

      {secretUrl && (
        <div className="confirmation sk-panel-row centered">
          <div className="sk-panel-column stretch">
            <div>
              Copy and paste the following confirmation code back into Standard
              Notes:
            </div>
            <textarea
              ref={textareaRef}
              className="sk-base selectable"
              id={name}
              value={base64Encode(secretUrl)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="sk-button-group">
              <a onClick={copyCode} className="sk-button sk-base">
                <div className="sk-label">
                  {copied ? 'Successfully Copied' : 'Copy'}
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
