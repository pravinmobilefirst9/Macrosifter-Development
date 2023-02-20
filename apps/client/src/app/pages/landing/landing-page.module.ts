import {CommonModule} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {LandingPageRoutingModule} from './landing-page-routing.module';
import {LandingPageComponent} from './landing-page.component';
import {MsBannerModule} from '@ghostfolio/client/components/@theme/banner/banner.module';
import {LandingTopicBlockModule} from '@ghostfolio/client/components/landing-topic-block/landing-topic-block.module';
import {MatButtonModule} from '@angular/material/button';
import {SubLandingComponent} from './sub-landings/sub-landing/sub-landing.component';
import {
  PortfolioManagementComponent
} from "@ghostfolio/client/pages/landing/sub-landings/portfolio-management.component";
import {DividendsComponent} from "@ghostfolio/client/pages/landing/sub-landings/dividends.component";
import {ScreenersComponent} from "@ghostfolio/client/pages/landing/sub-landings/screeners.component";
import {MacroeconomicsComponent} from "@ghostfolio/client/pages/landing/sub-landings/macroeconomics.component";

@NgModule({
  declarations: [
    LandingPageComponent,
    SubLandingComponent,
    PortfolioManagementComponent,
    DividendsComponent,
    ScreenersComponent,
    MacroeconomicsComponent
  ],
  imports: [
    CommonModule,
    LandingPageRoutingModule,
    RouterModule,
    MsBannerModule,
    LandingTopicBlockModule,
    MatButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingPageModule {
}
