import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ActivitiesTablePaginatorComponent } from './activities-table-paginator.component';
import {MatPaginatorIntl, MatPaginatorModule} from "@angular/material/paginator";

@NgModule({
  declarations: [ActivitiesTablePaginatorComponent],
  exports: [ActivitiesTablePaginatorComponent],
  imports: [
    MatPaginatorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{provide: MatPaginatorIntl, useClass: ActivitiesTablePaginatorComponent}],
})
export class MsActivitiesTablePaginatorModule {}
