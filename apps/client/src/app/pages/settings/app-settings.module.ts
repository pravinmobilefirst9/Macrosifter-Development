import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {AppSettingsComponent} from "@ghostfolio/client/pages/settings/app-settings.component";
import {AppSettingsRoutingModule} from "@ghostfolio/client/pages/settings/app-settings-routing.module";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [AppSettingsComponent],
  imports: [
    AppSettingsRoutingModule,
    MatProgressSpinnerModule,
    CommonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppSettingsModule {}
