import { FeatureIdentifier } from '@standardnotes/features';
declare type ChecksumEntry = {
    version: string;
    base64: string;
    binary: string;
};
export declare type ComponentChecksumsType = Record<FeatureIdentifier, ChecksumEntry>;
export {};
