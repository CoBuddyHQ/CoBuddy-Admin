import { Module } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { CitiesController } from './cities.controller';
import { InterestsController } from './interests.controller';
import { LanguagesController } from './languages.controller';
import { AppLanguagesController } from './app-languages.controller';
import { TicketCategoriesController } from './ticket-categories.controller';
import { IncidentTypesController } from './incident-types.controller';
import { CommunicationStylesController } from './communication-styles.controller';
import { ActivityPacesController } from './activity-paces.controller';
import { SessionDurationsController } from './session-durations.controller';
import { NotificationCategoriesController } from './notification-categories.controller';
import { ReviewTagsController } from './review-tags.controller';
import { DisputeReasonsController } from './dispute-reasons.controller';
import { CancellationReasonsController } from './cancellation-reasons.controller';
import { KycDocTypesController } from './kyc-doc-types.controller';
import { PlaceTypesController } from './place-types.controller';
import { SystemDefaultsController } from './system-defaults.controller';
import { BundleController } from './bundle.controller';

@Module({
  imports: [],
  controllers: [
    CitiesController,
    InterestsController,
    LanguagesController,
    AppLanguagesController,
    TicketCategoriesController,
    IncidentTypesController,
    CommunicationStylesController,
    ActivityPacesController,
    SessionDurationsController,
    NotificationCategoriesController,
    ReviewTagsController,
    DisputeReasonsController,
    CancellationReasonsController,
    KycDocTypesController,
    PlaceTypesController,
    SystemDefaultsController,
    BundleController,
  ],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
