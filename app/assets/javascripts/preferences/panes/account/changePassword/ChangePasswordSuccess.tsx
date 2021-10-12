import { FunctionalComponent } from 'preact';

export const ChangePasswordSuccess: FunctionalComponent = () => {
  return (
    <>
      <div className={'sk-label sk-bold info'}>Your password has been successfully changed.</div>
      <p className={'sk-p'}>
        Please ensure you are running the latest version of Standard Notes on all platforms to ensure maximum compatibility.
      </p>
    </>
  );
};
