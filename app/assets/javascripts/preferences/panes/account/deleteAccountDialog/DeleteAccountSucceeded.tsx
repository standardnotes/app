import { FunctionalComponent } from 'preact';

export const DeleteAccountSucceeded: FunctionalComponent = () => {
  return (
    <div>
      <div className={'text-input'}>Account Deletion Complete</div>
      <p className={'mt-2'}>Your account has been deleted. You may now re-register.</p>
    </div>
  );
};
