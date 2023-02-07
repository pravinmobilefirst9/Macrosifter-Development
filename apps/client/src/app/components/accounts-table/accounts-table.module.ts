import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { GfSymbolIconModule } from '@ghostfolio/client/components/symbol-icon/symbol-icon.module';
import { GfValueModule } from '@ghostfolio/ui/value';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatDialogModule } from '@angular/material/dialog';
import { AccountsTableComponent } from './accounts-table.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [AccountsTableComponent],
  exports: [AccountsTableComponent],
  imports: [
    CommonModule,
    GfSymbolIconModule,
    GfValueModule,
    MatButtonModule,
    MatInputModule,
    MatTooltipModule,
    MatMenuModule,
    MatTableModule,
    MatDialogModule,
    NgxSkeletonLoaderModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GfAccountsTableModule { }
