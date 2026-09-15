import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'
import { LocaleService } from '@standardnotes/i18n'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
} from '@standardnotes/snjs'

export class LocalizationController extends AbstractViewController implements InternalEventHandlerInterface {
  private localeService?: LocaleService

  constructor(
    private readonly featuresController: FeaturesController,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, ApplicationEvent.Started)
    eventBus.addEventHandler(this, ApplicationEvent.FeaturesAvailabilityChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.Started:
      case ApplicationEvent.FeaturesAvailabilityChanged:
        await this.initializeLocalization()
        break
    }
  }

  async setLocale(locale: string): Promise<void> {
    await this.localeService?.setLocale(locale)
  }

  private async initializeLocalization(): Promise<void> {
    if (!this.localeService) {
      this.localeService = new LocaleService({
        onLocaleChanged: (locale) => localizationStore.setCurrentLocale(locale),
      })
    }

    await this.localeService.initialize({
      localizationEnabled: this.featuresController.isLocalizationEnabled(),
    })
  }
}
