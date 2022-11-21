import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AccountDetailsToggleDialog } from './account-details-toggle.component';
import { NgxPlaidLinkModule } from "ngx-plaid-link";
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AccountDetailsToggleDialog],
  imports: [
    NgxPlaidLinkModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class GfAccountDetailsToggleDialogModule {}
