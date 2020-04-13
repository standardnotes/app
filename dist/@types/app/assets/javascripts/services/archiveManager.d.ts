import { WebApplication } from '@/application';
import { SNItem } from 'snjs';
export declare class ArchiveManager {
    private readonly application;
    private textFile?;
    constructor(application: WebApplication);
    downloadBackup(encrypted: boolean): Promise<void>;
    downloadBackupOfItems(items: SNItem[], encrypted: boolean): Promise<void>;
    private formattedDate;
    private itemsData;
    private get zip();
    private loadZip;
    private downloadZippedItems;
    private hrefForData;
    private downloadData;
}
