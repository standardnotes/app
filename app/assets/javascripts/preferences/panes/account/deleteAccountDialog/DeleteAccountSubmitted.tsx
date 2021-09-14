import { FunctionalComponent } from 'preact';

export const DeleteAccountSubmitted: FunctionalComponent = () => {
  return (
    <div>
      <div className={'text-input'}>Request Received.</div>
      <p className={'mt-2'}>If an account was found with this email, you'll receive an email with next steps.</p>
    </div>
  );
};
