import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TermsOfUseComponent } from './terms-of-use.component';
import {TermsOfUseRoutingModule} from "@ghostfolio/client/pages/terms-of-use/terms-of-use-routing.module";
import {RouterModule} from "@angular/router";

@NgModule({
    declarations: [TermsOfUseComponent],
    imports: [
      RouterModule,
      TermsOfUseRoutingModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TermsOfUseModule { }
