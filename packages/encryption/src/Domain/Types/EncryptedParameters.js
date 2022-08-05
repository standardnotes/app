"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptedParametersFromPayload = exports.isErrorDecryptingParameters = void 0;
function isErrorDecryptingParameters(x) {
    return x.errorDecrypting;
}
exports.isErrorDecryptingParameters = isErrorDecryptingParameters;
function encryptedParametersFromPayload(payload) {
    return {
        uuid: payload.uuid,
        content: payload.content,
        items_key_id: payload.items_key_id,
        enc_item_key: payload.enc_item_key,
        version: payload.version,
        auth_hash: payload.auth_hash,
    };
}
exports.encryptedParametersFromPayload = encryptedParametersFromPayload;
