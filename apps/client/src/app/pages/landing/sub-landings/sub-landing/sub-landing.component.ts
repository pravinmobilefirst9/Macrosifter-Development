import {Component, Input, OnInit} from '@angular/core';
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";
import {BannerData} from "@ghostfolio/client/components/@theme/banner/banner.component";

@Component({
  selector: 'ms-sub-landing',
  templateUrl: './sub-landing.component.html',
  styleUrls: ['../../landing-page.scss'],
})
export class SubLandingComponent implements OnInit {

  @Input() data: {
    bannerData: BannerData,
    topics: TopicInput[]
  };

  constructor() {}

  ngOnInit(): void {}
}
