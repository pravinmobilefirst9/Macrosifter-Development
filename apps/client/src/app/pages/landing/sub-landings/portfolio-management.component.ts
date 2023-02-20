import {Component} from '@angular/core';
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";

@Component({
  host: { class: 'page' },
  selector: 'gf-landing-page',
  template: `
    <ms-sub-landing [data]="data"></ms-sub-landing>
  `
})
export class PortfolioManagementComponent {

  data = {
    bannerData: {
      title: 'The Most Comprehensive Portfolio Tracker',
      text: 'Track all your assets across custom portfolios that you create. Stocks, Options, ETFs, Real Estate, Crypto, Commodities, Private Equity/Venture Capital, and even your own businesses.',
      buttonText: 'Try for free',
      buttonRoute: '/register',
      showButton: true,
      showImages: false,
    },
    topics: [
      new TopicInput(
        'Link to our financial institutions to',
        'automatically sync transactions',
        'We connect to most major financial institutions and make it easy for you to import historical transactions while automatically syncing all future transactions. If you’d like to manually add your accounts or transactions, no problem. We support that too.',
        'assets/images/portfolio_image01.png'
      ),
      new TopicInput(
        'Analytics',
        'That Matter',
        'We cut through the noise and provide valuable insights into each of your holdings and across your portfolios. Get insights into your asset, sector, industry, country, or more exposure types whether on an individual holding basis or a portfolio group.',
        'assets/images/image02_about.png',
        'left'
      ),
      new TopicInput(
        'Tax',
        'Reporting',
        'Easily calculate the potential tax implications across your entire portfolio across capital gains, dividend income, foreign taxes withheld, and more.',
        'assets/images/portfolio_image03.png'
      ),
      new TopicInput(
        'Secure Portfolio',
        'Sharing',
        'Share secure portfolio access with trusted partners at your leisure.',
        'assets/images/portfolio_image04.png',
        'left'
      ),
      // new TopicInput(
      //   '',
      //   '',
      //   '',
      //   'assets/images/portfolio_image01.png',
      //   'left'
      // )
    ],
  }

  public constructor() {}

}
