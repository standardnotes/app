import { isString, lastElement, sleep } from '@standardnotes/utils'
import { UuidString } from '@Lib/Types/UuidString'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { DeprecatedHttpService } from '../Api/DeprecatedHttpService'
import { SettingsService } from '../Settings/SNSettingsService'
import { ListedClientInterface } from './ListedClientInterface'
import { LegacyApiService } from '../Api/ApiService'
import { isErrorResponse, ListedAccount, ListedAccountInfo, ListedAccountInfoResponse } from '@standardnotes/responses'
import { NoteMutator, SNActionsExtension, SNNote } from '@standardnotes/models'
import {
  AbstractService,
  InternalEventBusInterface,
  MutatorClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { ProtectionService } from '../Protection'
import { ContentType, SettingName } from '@standardnotes/domain-core'

export class ListedService extends AbstractService implements ListedClientInterface {
  constructor(
    private apiService: LegacyApiService,
    private itemManager: ItemManager,
    private settingsService: SettingsService,
    private httpSerivce: DeprecatedHttpService,
    private protectionService: ProtectionService,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  override deinit() {
    ;(this.itemManager as unknown) = undefined
    ;(this.settingsService as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    ;(this.httpSerivce as unknown) = undefined
    ;(this.protectionService as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    super.deinit()
  }

  public canRegisterNewListedAccount(): boolean {
    return this.apiService.user != undefined
  }

  public isNoteAuthorizedForListed(note: SNNote): boolean {
    return note.authorizedForListed
  }

  public async authorizeNoteForListed(note: SNNote): Promise<boolean> {
    const result = await this.protectionService.authorizeListedPublishing()
    if (result === false) {
      return false
    }

    await this.mutator.changeItem<NoteMutator>(note, (mutator) => {
      mutator.authorizedForListed = true
    })

    void this.sync.sync()

    return true
  }

  /**
   * Account creation is asyncronous on the backend due to message-based nature of architecture.
   * In order to get the newly created account, we poll the server to check for new accounts.
   */
  public async requestNewListedAccount(): Promise<ListedAccount | undefined> {
    const accountsBeforeRequest = await this.getSettingsBasedListedAccounts()
    const response = await this.apiService.registerForListedAccount()
    if (isErrorResponse(response)) {
      return undefined
    }
    const MaxAttempts = 4
    const DelayBetweenRequests = 3000
    for (let i = 0; i < MaxAttempts; i++) {
      const accounts = await this.getSettingsBasedListedAccounts()
      if (accounts.length > accountsBeforeRequest.length) {
        return lastElement(accounts)
      } else {
        await sleep(DelayBetweenRequests, false)
      }
    }
    return undefined
  }

  public async getListedAccounts(): Promise<ListedAccount[]> {
    const settingsBasedAccounts = await this.getSettingsBasedListedAccounts()
    const legacyAccounts = this.getLegacyListedAccounts()

    return [...settingsBasedAccounts, ...legacyAccounts]
  }

  public async getListedAccountInfo(
    account: ListedAccount,
    inContextOfItem?: UuidString,
  ): Promise<ListedAccountInfo | undefined> {
    const hostUrl = account.hostUrl
    let url = `${hostUrl}/authors/${account.authorId}/extension?secret=${account.secret}`
    if (inContextOfItem) {
      url += `&item_uuid=${inContextOfItem}`
    }

    const response = (await this.httpSerivce.getAbsolute(url).catch((error) => {
      console.error(error)
    })) as ListedAccountInfoResponse

    if (!response || response.data?.error || !response.data || isString(response.data)) {
      return undefined
    }

    return response
  }

  private async getSettingsBasedListedAccounts(): Promise<ListedAccount[]> {
    const response = await this.settingsService.getSetting(
      SettingName.create(SettingName.NAMES.ListedAuthorSecrets).getValue(),
    )
    if (!response) {
      return []
    }
    const accounts = JSON.parse(response) as ListedAccount[]
    return accounts
  }

  private getLegacyListedAccounts(): ListedAccount[] {
    const extensions = this.itemManager
      .getItems<SNActionsExtension>(ContentType.TYPES.ActionsExtension)
      .filter((extension) => extension.isListedExtension)

    const accounts: ListedAccount[] = []

    for (const extension of extensions) {
      const urlString = extension.url
      const url = new URL(urlString)

      /** Expected path format: '/authors/647/extension/' */
      const path = url.pathname
      const authorId = path.split('/')[2]

      /** Expected query string format: '?secret=xxx&type=sn&name=Listed' */
      const queryString = url.search
      const key = queryString.split('secret=')[1].split('&')[0]

      accounts.push({
        secret: key,
        authorId,
        hostUrl: url.origin,
      })
    }

    return accounts
  }
}
