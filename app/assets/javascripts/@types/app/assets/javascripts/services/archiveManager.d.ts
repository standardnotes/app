export class ArchiveManager {
    constructor(application: any);
    application: any;
    /** @public */
    public downloadBackup(encrypted: any): Promise<void>;
    /** @public */
    public downloadBackupOfItems(items: any, encrypted: any): Promise<void>;
    /** @private */
    private formattedDate;
    /** @private */
    private itemsData;
    /** @private */
    private loadZip;
    /** @private */
    private downloadZippedItems;
    /** @private */
    private hrefForData;
    textFile: string | undefined;
    /** @private */
    private downloadData;
}
