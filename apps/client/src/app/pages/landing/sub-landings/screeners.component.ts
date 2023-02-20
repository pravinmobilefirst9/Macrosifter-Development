import {Component} from '@angular/core';
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";

@Component({
  host: { class: 'page' },
  selector: 'gf-landing-page',
  template: `
    <ms-sub-landing [data]="data"></ms-sub-landing>
  `
})
export class ScreenersComponent {

  data = {
    bannerData: {
      title: 'The Simply Insightful Stock & Market Screener',
      text: 'We provide you with tried & true valuation metrics to stay focused, whether we’re in a bear market or a bull market.',
      buttonText: 'Try for free',
      buttonRoute: '/register',
      showButton: true,
      showImages: false,
    },
    topics: [
      new TopicInput(
        'Company Analytics',
        'That Matter',
        'Gain valuable insights into stock valuation metrics to supercharge your investment decision making process. We focus on tried & true valuation metrics, such as Earnings Yield, Operating Cash Flow Yield, Free Cash Flow Yield, EV/EBITDA, and measures of historical valuation.',
        'assets/images/image01_stock.png'
      ),
      new TopicInput(
        'Market Analytics',
        'That Matter',
        'Gain valuable insights into the largest markets in the world with valuation metrics such as PE, Shiller PE, and market cap to GDP.',
        'assets/images/image02_stock.png',
        'left'
      ),
      new TopicInput(
        'Sentiment at Your',
        'Fingertips',
        'Understand current market sentiment',
        'assets/images/image03_stock.png'
      ),
    ],
  }

  public constructor() {}

}
