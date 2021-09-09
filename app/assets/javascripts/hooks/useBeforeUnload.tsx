import { useEffect } from '@node_modules/preact/hooks';

export const useBeforeUnload = (): void => {
  useEffect(() => {
    window.onbeforeunload = () => true;

    return () => {
      window.onbeforeunload = null;
    };
  }, []);
};
