import { FunctionComponent } from 'preact';
import { WebApplication } from '@/ui_models/application';
import { useState } from 'preact/hooks';

interface PurchaseIframeProps {
  application: WebApplication;
}

export const PurchaseIframe: FunctionComponent<PurchaseIframeProps> = ({
  application,
}) => {
  const [url] = useState(() => application.getPurchaseIframeUrl());
  return <iframe className="border-0 w-full h-full" src={url} />;
};
