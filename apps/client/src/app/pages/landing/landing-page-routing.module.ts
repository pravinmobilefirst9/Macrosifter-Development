import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@ghostfolio/client/core/auth.guard';
import { LandingPageComponent } from './landing-page.component';
import {
  PortfolioManagementComponent
} from "@ghostfolio/client/pages/landing/sub-landings/portfolio-management.component";
import {DividendsComponent} from "@ghostfolio/client/pages/landing/sub-landings/dividends.component";
import {ScreenersComponent} from "@ghostfolio/client/pages/landing/sub-landings/screeners.component";
import {MacroeconomicsComponent} from "@ghostfolio/client/pages/landing/sub-landings/macroeconomics.component";

const routes: Routes = [
  { path: '', component: LandingPageComponent, canActivate: [AuthGuard] }, // todo - is AuthGuard necessary?
  { path: 'portfolio-management', component: PortfolioManagementComponent },
  { path: 'dividends', component: DividendsComponent },
  { path: 'screeners', component: ScreenersComponent },
  { path: 'macroeconomics', component: MacroeconomicsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingPageRoutingModule {}
