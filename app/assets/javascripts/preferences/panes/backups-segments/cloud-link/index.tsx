import React from 'react';
import { CloudProvider, ProviderType } from './CloudProvider';
import { useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import {
  PreferencesGroup,
  PreferencesSegment,
  Text,
  Title,
} from '@/preferences/components';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { FeatureIdentifier } from '@standardnotes/features';
import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';

const providerData = [
  {
    name: ProviderType.Dropbox,
  },
  {
    name: ProviderType.Google,
  },
  {
    name: ProviderType.OneDrive,
  },
];

type Props = {
  application: WebApplication;
};

export const CloudLink: FunctionComponent<Props> = ({ application }) => {
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
              required to enable Cloud Backups.{' '}
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
          <div>
            <HorizontalSeparator classes={'mt-3 mb-3'} />
            <div>
              {providerData.map(({ name }) => (
                <>
                  <CloudProvider application={application} name={name} />
                  <HorizontalSeparator classes={'mt-3 mb-3'} />
                </>
              ))}
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
};
