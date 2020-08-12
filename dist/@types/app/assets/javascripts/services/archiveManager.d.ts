import { WebApplication } from '@/ui_models/application';
export declare class ArchiveManager {
    private readonly application;
    private textFile?;
    constructor(application: WebApplication);
    downloadBackup(encrypted: boolean): Promise<void>;
    private formattedDate;
    private itemsData;
    private get zip();
    private loadZip;
    private downloadZippedItems;
    private hrefForData;
    private downloadData;
}
