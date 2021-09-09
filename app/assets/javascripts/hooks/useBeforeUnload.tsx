import { useEffect } from '@node_modules/preact/hooks';

const useBeforeUnload = (): void => {
  useEffect(() => {
    window.onbeforeunload = () => true;

    return () => {
      window.onbeforeunload = null;
    };
  }, []);
};

export default useBeforeUnload;
