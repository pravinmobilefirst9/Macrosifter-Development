import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {
  LandingTopicBlockComponent
} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {RouterModule} from "@angular/router";

@NgModule({
  declarations: [LandingTopicBlockComponent],
  exports: [LandingTopicBlockComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingTopicBlockModule {}
