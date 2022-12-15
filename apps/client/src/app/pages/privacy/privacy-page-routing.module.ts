import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@ghostfolio/client/core/auth.guard';

import { PrivacyPageComponent } from './privacy-page.component';

const routes: Routes = [
    {
        canActivate: [AuthGuard],
        component: PrivacyPageComponent,
        path: '',
        title: $localize`Privacy`
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PrivacyPageRoutingModule { }
