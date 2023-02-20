import {Component, Input, OnInit} from '@angular/core';

export class TopicInput {
  constructor(
    public topic: string,
    public header: string,
    public text: string,
    public image: string,
    public imagePos: 'left' | 'right' = 'right',
    public buttonText?: string,
    public buttonLink?: string,
  ) {
  }
}

@Component({
  selector: 'ms-landing-topic-block',
  templateUrl: './landing-topic-block.component.html',
  styleUrls: ['./landing-topic-block.component.scss']
})
export class LandingTopicBlockComponent implements OnInit {
  @Input() data: TopicInput;

  constructor() {}

  ngOnInit(): void {}
}
