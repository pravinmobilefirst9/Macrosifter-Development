import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { DataService } from '@ghostfolio/client/services/data.service';
import { Statistics } from '@ghostfolio/common/interfaces/statistics.interface';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { format } from 'date-fns';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subject } from 'rxjs';
import {BannerData} from "@ghostfolio/client/components/@theme/banner/banner.component";
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";

@Component({
  host: { class: 'page' },
  selector: 'gf-landing-page',
  styleUrls: ['./landing-page.scss'],
  templateUrl: './landing-page.html'
})
export class LandingPageComponent implements OnDestroy, OnInit {
  public currentYear = format(new Date(), 'yyyy');
  public demoAuthToken: string;
  public deviceType: string;
  public hasPermissionForStatistics: boolean;
  public statistics: Statistics;
  public testimonials = [
    {
      author: 'Philipp',
      country: 'Germany 🇩🇪',
      quote: `Super slim app with a great user interface. On top of that, it's open source.`
    },
    {
      author: 'Onur',
      country: 'Switzerland 🇨🇭',
      quote: `Ghostfolio looks like the perfect portfolio tracker I've been searching for all these years.`
    },
    {
      author: 'Ivo',
      country: 'Netherlands 🇳🇱',
      quote: `A fantastic open source app to track my investments across platforms. Love the simplicity of its design and the depth of the insights.`
    },
    {
      author: 'Damjan',
      country: 'Slovenia 🇸🇮',
      quote: `Ghostfolio helps me track all my investments in one place, it has a built-in portfolio analyzer and a very neat, seamless user interface.`
    }
  ];

  bannerData: BannerData = {
    title: 'Invest Smarter',
    text: 'With MacroSifter, you can automatically sync your investments, segment your holdings, cut through the noise, and gain insights that actually matter.',
    buttonText: 'Try for free',
    buttonRoute: '/register',
    showButton: true,
    showImages: false,
  }

  blocks = [
    {icon: 'assets/icons/HIW-1.svg', text: 'Link or add your investment accounts and import or manually add historical transactions in 10-15 mins', arrow: true},
    {icon: 'assets/icons/HIW-2.svg', text: 'If you’ve linked your account, we’ll automatically sync your transactions. Otherwise, easily import or enter your transactions at any time.', arrow: true},
    {icon: 'assets/icons/HIW-3.svg', text: 'Gain valuable insights ', arrow: false},
  ]

  topics: TopicInput[] = [
    new TopicInput(
      'Automated & Simplified',
      'Syncing',
      'We connect to most major financial institutions and make it easy for you to import historical transactions while automatically syncing all future transactions. If you’d like to manually add your accounts or transactions, no problem. We support that too.',
      'assets/images/image01_start.svg'
    ),
    new TopicInput(
      'Multi-Asset Portfolio',
      'Management & Analysis',
      'Track all your assets in MacroSifter and  easily segment your holdings into different portfolios. Stocks, ETFs, Options, Crypto, Real Estate, and even your own businesses. We allow you to track assets all over the world in real time combined with critical insights.',
      'assets/images/image02_start.svg',
      'left',
      'Discover',
      '/start/portfolio-management'
    ),
    new TopicInput(
      'Dividends &',
      'Distributions',
      'Fidelity Research shows that dividends have accounted for roughly 40% of the total return on US stocks since the 1930s, yet your dividend returns are often opaque. We make it easy to track your dividends. We calculate your dividend yield on cost, dividend growth, current dividend yield, dividend income for assets all over the world, and more. Have real estate or other business investments? We make it easy for you to track your distribution returns too.',
      'assets/images/image03_start.svg',
      'right',
      'Discover',
      '/start/dividends'
    ),
    new TopicInput(
      'Stock & Market',
      'Screeners',
      'Forget all the noise. At the end of the day, only valuations, business moat, and quality matters in the long run.  We arm you with tried & true valuation metrics, such as Earnings Yield, EV/EBITDA, and Historical Over or Under Valuation, to help you make the right investing decisions for yourself. ',
      'assets/images/image04_start.svg',
      'left',
      'Discover',
      '/start/screeners'
    ),
    new TopicInput(
      'Macroeconomic',
      'Dashboard',
      'The news cycle never ends - forget the noise and paralysis. We’ve compiled an objective dashboard utilizing multiple objective methodologies so you can see where the economy may be headed at a given point in time. While it’s impossible to predict the future, knowing the probabilities helps one prepare for potential outcomes. ',
      'assets/images/image05_start.svg',
      'right',
      'Discover',
      '/start/macroeconomics'
    )
  ]

  public features = [
    {
      icon: 'assets/icons/rocket 1.svg',
      title: 'Fast',
      text: 'Our application has been developed with speed in mind by utilizing the latest technologies. App performance will always remain a top priority. ',
    },
    {
      icon: 'assets/icons/shield 1.svg',
      title: 'Your Security Matters to Us',
      text: 'We take your privacy and security very seriously. We have a strict set of internal security standards based on industry best practices. We encrypt everything sent between you and our servers and require two factor authentication.',
    },
    {
      icon: 'assets/icons/palm-of-hand 1.svg',
      title: 'No Ads',
      text: 'We don\'t store any personal data, we don\'t share any data with third parties, and we are a 100% ad free solution.',
    },
    {
      icon: 'assets/icons/distribution 1.svg',
      title: 'Import & Export With Ease',
      text: 'We make it easy for you to import historical transactions and export all of your transaction history.',
    },
  ]

  showsideImages = false;

  private unsubscribeSubject = new Subject<void>();

  public constructor(
    private dataService: DataService,
    private deviceService: DeviceDetectorService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    const { globalPermissions, statistics } = this.dataService.fetchInfo();

    this.hasPermissionForStatistics = hasPermission(
      globalPermissions,
      permissions.enableStatistics
    );

    this.statistics = statistics;
  }

  public ngOnInit() {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
    this.bannerData.showImages = this.deviceType === 'desktop';
    this.showsideImages = this.deviceType === 'desktop';
    this.changeDetectorRef.markForCheck();
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }
}
