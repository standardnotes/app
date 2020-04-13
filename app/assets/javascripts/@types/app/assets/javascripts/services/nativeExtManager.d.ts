import { SNPredicate, ApplicationService } from 'snjs';
import { PayloadContent } from '@/../../../../snjs/dist/@types/protocol/payloads/generator';
/** A class for handling installation of system extensions */
export declare class NativeExtManager extends ApplicationService {
    extManagerId: string;
    batchManagerId: string;
    /** @override */
    onAppLaunch(): Promise<void>;
    get extManagerPred(): SNPredicate;
    get batchManagerPred(): SNPredicate;
    get extMgrUrl(): any;
    get batchMgrUrl(): any;
    reload(): void;
    resolveExtensionsManager(): Promise<void>;
    extensionsManagerTemplateContent(): PayloadContent;
    resolveBatchManager(): Promise<void>;
    batchManagerTemplateContent(): PayloadContent;
}
