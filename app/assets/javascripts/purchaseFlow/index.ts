import { toDirective } from '@/components/utils';
import {
  PurchaseFlowWrapper,
  PurchaseFlowWrapperProps,
} from './PurchaseFlowWrapper';

export const PurchaseFlowDirective =
  toDirective<PurchaseFlowWrapperProps>(PurchaseFlowWrapper);
