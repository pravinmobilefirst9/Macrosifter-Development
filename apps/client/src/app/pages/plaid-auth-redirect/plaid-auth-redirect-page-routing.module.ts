import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@ghostfolio/client/core/auth.guard';

import { PlaidAuthRedirectPageComponent } from './plaid-auth-redirect-page.components';

const routes: Routes = [
    {
        canActivate: [AuthGuard],
        component: PlaidAuthRedirectPageComponent,
        path: '',
        title: $localize`plaid-oauth`
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PlaidAuthRedirectPageRoutingModule { }
