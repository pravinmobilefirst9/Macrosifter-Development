import {Component, Input, OnInit} from '@angular/core';

export interface BannerData {
  title: string;
  text: string;
  buttonText: string;
  buttonRoute: string;
  showButton: boolean;
  showImages: boolean;
}

@Component({
  selector: 'ms-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit {
  @Input() data: BannerData;

  constructor() {}

  ngOnInit(): void {}
}
