import { ProtocolVersion } from '@standardnotes/common';
import { EncryptedPayloadInterface, ItemContent } from '@standardnotes/models';
export declare type EncryptedParameters = {
    uuid: string;
    content: string;
    items_key_id: string | undefined;
    enc_item_key: string;
    version: ProtocolVersion;
    /** @deprecated */
    auth_hash?: string;
};
export declare type DecryptedParameters<C extends ItemContent = ItemContent> = {
    uuid: string;
    content: C;
};
export declare type ErrorDecryptingParameters = {
    uuid: string;
    errorDecrypting: true;
    waitingForKey?: boolean;
};
export declare function isErrorDecryptingParameters(x: EncryptedParameters | DecryptedParameters | ErrorDecryptingParameters): x is ErrorDecryptingParameters;
export declare function encryptedParametersFromPayload(payload: EncryptedPayloadInterface): EncryptedParameters;
