import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@ghostfolio/client/core/auth.guard';
import {AppSettingsComponent} from "@ghostfolio/client/pages/settings/app-settings.component";

const routes: Routes = [
  {
    canActivate: [AuthGuard],
    component: AppSettingsComponent,
    path: '',
    title: $localize`App Settings`
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppSettingsRoutingModule {}
