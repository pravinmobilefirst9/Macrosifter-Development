import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {BannerComponent} from "@ghostfolio/client/components/@theme/banner/banner.component";
import {MatButtonModule} from "@angular/material/button";
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [BannerComponent],
  exports: [BannerComponent],
  imports: [
    MatButtonModule,
    RouterModule,
    CommonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MsBannerModule {}
