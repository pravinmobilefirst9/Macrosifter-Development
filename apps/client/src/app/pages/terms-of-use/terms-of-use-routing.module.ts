import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@ghostfolio/client/core/auth.guard';

import { TermsOfUseComponent } from './terms-of-use.component';

const routes: Routes = [
    {
        // canActivate: [AuthGuard],
        component: TermsOfUseComponent,
        path: '',
        title: $localize`Terms of Service`
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TermsOfUseRoutingModule { }
