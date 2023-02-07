/* eslint-disable @typescript-eslint/no-unused-vars */
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { PlaidAuthRedirectPageRoutingModule } from './plaid-auth-redirect-page-routing.module';
import { PlaidAuthRedirectPageComponent } from './plaid-auth-redirect-page.components';

@NgModule({
    declarations: [],
    providers: [PlaidAuthRedirectPageComponent],
    imports: [
        PlaidAuthRedirectPageRoutingModule,
        CommonModule,
        RouterModule,
        MatDialogModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlaidAuthRedirectPageModule { }
