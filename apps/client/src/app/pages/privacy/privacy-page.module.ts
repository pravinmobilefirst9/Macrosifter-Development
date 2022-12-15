import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { PrivacyPageRoutingModule } from './privacy-page-routing.module';
import { PrivacyPageComponent } from './privacy-page.component';

@NgModule({
    declarations: [PrivacyPageComponent],
    imports: [
        RouterModule,
        PrivacyPageRoutingModule,
        MatTableModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PrivacyPageModule { }
