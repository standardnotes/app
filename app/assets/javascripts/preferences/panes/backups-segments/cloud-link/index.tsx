import React from 'react';
import { Provider, ProviderType } from './Provider';
import { useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
  Text,
} from '@/preferences/components';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';

const providerData = [
  {
    name: ProviderType.Dropbox,
    urlFragment: 'dropbox',
    urlParamsKey: 'dropbox_secret_url',
  },
  {
    name: ProviderType.Google,
    urlFragment: 'gdrive',
    urlParamsKey: 'gdrive_secret_url',
  },
  {
    name: ProviderType.OneDrive,
    urlFragment: 'onedrive',
    urlParamsKey: 'onedrive_secret_url',
  },
];

type Props = {
  application: WebApplication;
};

export const CloudLink = ({ application }: Props) => {
  const [isEntitledForCloudBackups, setIsEntitledForCloudBackups] =
    useState(false);

  useEffect(() => {
    const cloudBackupsFeatureStatus = application.getFeatureStatus(
      FeatureIdentifier.CloudLink
    );
    setIsEntitledForCloudBackups(
      cloudBackupsFeatureStatus === FeatureStatus.Entitled
    );
  }, [application]);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Cloud Backups</Title>
        {!isEntitledForCloudBackups && (
          <>
            <Text>
              A <span className={'font-bold'}>Plus</span> or{' '}
              <span className={'font-bold'}>Pro</span> subscription plan is
              required to enable Email Backups.{' '}
              <a target="_blank" href="https://standardnotes.com/features">
                Learn more
              </a>
              .
            </Text>
            <HorizontalSeparator classes="mt-3 mb-3" />
          </>
        )}
        <div
          className={
            isEntitledForCloudBackups
              ? ''
              : 'faded cursor-default pointer-events-none'
          }
        >
          <Text>
            Configure the integrations below to enable automatic daily backups
            of your encrypted data set to your third-party cloud provider.
          </Text>
          <div className="sk-panel-section">
            <HorizontalSeparator classes={'mt-3 mb-3'} />
            <div className="sk-panel-row">
              <div className="flex">
                {providerData.map(({ name, urlFragment, urlParamsKey }) => (
                  <Provider
                    application={application}
                    name={name}
                    urlFragment={urlFragment}
                    urlParamsKey={urlParamsKey}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
