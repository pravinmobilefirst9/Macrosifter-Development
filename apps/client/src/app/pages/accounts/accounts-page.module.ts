import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { GfAccountDetailDialogModule } from '@ghostfolio/client/components/account-detail-dialog/account-detail-dialog.module';
import { GfAccountsTableModule } from '@ghostfolio/client/components/accounts-table/accounts-table.module';

import { AccountsPageRoutingModule } from './accounts-page-routing.module';
import { AccountsPageComponent } from './accounts-page.component';
import { GfCreateOrUpdateAccountDialogModule } from './create-or-update-account-dialog/create-or-update-account-dialog.module';
import { GfAccountDetailsToggleDialogModule } from './choose-plaid/account-details-toggle/account-details-toggle.module';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [AccountsPageComponent],
  imports: [
    AccountsPageRoutingModule,
    CommonModule,
    GfAccountDetailDialogModule,
    GfAccountsTableModule,
    GfCreateOrUpdateAccountDialogModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule,
    GfAccountDetailsToggleDialogModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AccountsPageModule { }
