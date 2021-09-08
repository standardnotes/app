import { FunctionalComponent } from 'preact';

type Props = {
  classes?: string;
}
const PreferencesHorizontalSeparator: FunctionalComponent<Props> = ({
  classes = ''
}) => {
  return <hr className={`h-1px w-full bg-border no-border ${classes}`} />;
};

export default PreferencesHorizontalSeparator;
