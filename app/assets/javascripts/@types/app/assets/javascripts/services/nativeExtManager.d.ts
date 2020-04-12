/** A class for handling installation of system extensions */
export class NativeExtManager extends ApplicationService {
    constructor(application: any);
    extManagerId: string;
    batchManagerId: string;
    /** @override */
    onAppLaunch(): void;
    get extManagerPred(): SNPredicate;
    get batchManagerPred(): SNPredicate;
    reload(): void;
    resolveExtensionsManager(): Promise<void>;
    extensionsManagerTemplatePayload(): import("../../../../../snjs/dist/@types/protocol/payloads/pure_payload").PurePayload | undefined;
    batchManagerTemplatePayload(): import("../../../../../snjs/dist/@types/protocol/payloads/pure_payload").PurePayload | undefined;
    resolveBatchManager(): Promise<void>;
}
import { ApplicationService } from "../../../../../../../../../../Users/mo/Desktop/sn/dev/snjs/dist/@types";
import { SNPredicate } from "../../../../../../../../../../Users/mo/Desktop/sn/dev/snjs/dist/@types";
