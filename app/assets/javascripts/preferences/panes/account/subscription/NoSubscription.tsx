import { FunctionalComponent } from "preact";
import { Text } from '@/preferences/components';
import { Button } from '@/components/Button';

export const NoSubscription: FunctionalComponent = () => (
  <>
    <Text>You don't have a Standard Notes subscription yet.</Text>
    <div className="flex">
      <Button
        className="min-w-20 mt-3 mr-3"
        type="normal"
        label="Refresh"
        onClick={() => null}
      />
      <Button
        className="min-w-20 mt-3"
        type="primary"
        label="Purchase subscription"
        onClick={() => null}
      />
    </div>
  </>
);
