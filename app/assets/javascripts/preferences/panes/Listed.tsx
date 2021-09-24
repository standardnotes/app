import {
  PreferencesGroup,
  PreferencesPane,
  PreferencesSegment,
  Title,
  Subtitle,
  Text,
} from '../components';
import { Button } from '@/components/Button';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

export const Listed: FunctionComponent = () => {
  const [isConnectedToListed, setIsConnectedToListed] = useState(false);

  return (
    <PreferencesPane>
      {isConnectedToListed && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Your blog on Listed</Title>
            <div className="h-2 w-full" />
            <div className="flex">
              <Button
                className="mr-2"
                type="normal"
                label="Visit your blog"
                onClick={() => {
                  return;
                }}
              />
              <Button
                type="normal"
                label="Open Settings"
                onClick={() => {
                  return;
                }}
              />
            </div>
          </PreferencesSegment>
        </PreferencesGroup>
      )}
      {isConnectedToListed && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Disconnect from Standard Notes</Title>
            <div className="h-2 w-full" />
            <Subtitle>
              Disconnecting Listed will result in loss of access to your blog.
              Ensure your Listed author key is backed up before uninstalling.
            </Subtitle>
            <Button
              className="mt-3"
              type="danger"
              label="Disconnect"
              onClick={() => {
                setIsConnectedToListed(false);
              }}
            />
          </PreferencesSegment>
        </PreferencesGroup>
      )}
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>About Listed</Title>
          <div className="h-2 w-full" />
          <Subtitle>What is Listed?</Subtitle>
          <Text>
            Listed is a free blogging platform that allows you to create a
            public journal published directly from your notes.{' '}
            <a target="_blank" href="#">
              Learn More
            </a>
          </Text>
        </PreferencesSegment>
        <PreferencesSegment>
          <Subtitle>How to get started?</Subtitle>
          <Text>
            First, you’ll need to sign up for Listed. Once you have your Listed
            account, follow the instructions to connect it with your Standard
            Notes account.
          </Text>
          <Button
            className="min-w-20 mt-3"
            type="normal"
            label="Get started"
            disabled={isConnectedToListed}
            onClick={() => {
              setIsConnectedToListed(true);
            }}
          />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  );
};
