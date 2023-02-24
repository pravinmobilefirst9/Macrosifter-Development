import {Component} from '@angular/core';
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";

@Component({
  host: { class: 'page' },
  selector: 'gf-landing-page',
  template: `
    <ms-sub-landing [data]="data"></ms-sub-landing>
  `
})
export class DividendsComponent {

  data = {
    bannerData: {
      title: 'The Most Comprehensive Dividend & Distribution Tracker',
      text: 'We make dividend & distribution tracking easy.',
      buttonText: 'Try for free',
      buttonRoute: '/register',
      showButton: true,
      showImages: false,
    },
    topics: [
      new TopicInput(
        'Analytics',
        'That Matter',
        'Gain valuable insights into your dividend and distributions. We provide a breakdown of your dividend income by various time periods so you can see the yield and yield on cost over individual holdings or specific portfolios.',
        'assets/images/image02.svg'
      ),
      new TopicInput(
        'Add Your Distributions on',
        'Your Real Estate, Private Investments, or Businesses',
        'We make it easy for you to enter your expected distributions and record received distributions across your real estate, private investments, or businesses.',
        'assets/images/image05.svg',
        'left'
      ),
      new TopicInput(
        'Tax',
        'Reporting',
        'Easily calculate the potential tax implications across your dividends and distributions.',
        'assets/images/image06.svg'
      ),
      new TopicInput(
        'Never miss a',
        'dividend',
        'Never lose track of important dividend events again. Keep track of your dividend ex-dates and dividend payment dates.',
        'assets/images/image07.svg',
        'left'
      ),
    ],
  }

  public constructor() {}

}
