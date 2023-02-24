import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MenuItemInterface} from "@ghostfolio/client/components/@theme/header/menu-item.interface";
import {DeviceDetectorService} from "ngx-device-detector";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {PRIVACY_POLICY_LINK, TERMS_OF_USE_LINK} from "@ghostfolio/common/config";

@Component({
  selector: 'ms-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  animations: [
    trigger('openMenu', [
      state('open', style({
        height: '*',
      })),
      state('close', style({
        margin: '0',
        height: '0',
      })),
      transition('open <=> close', animate('300ms'))
    ])
  ]
})
export class FooterComponent implements OnInit {
  public currentYear = new Date().getFullYear();

  public menu1: MenuItemInterface[] = [
    { link: '/', name: 'About Us'},
    { link: '/', name: 'Help Center'},
    { link: '/', name: 'Submit a Support Ticket'},
    { link: '/', name: 'Blog'},
  ]
  public menu2: MenuItemInterface[] = [
    { link: '/', name: 'Stocks'},
    { link: '/', name: 'Options'},
    { link: '/', name: 'ETFs'},
    { link: '/', name: 'Crypto'},
    { link: '/', name: 'Commodities'},
    { link: '/', name: 'Real Estate'},
    { link: '/', name: 'Private Equity & Venture Capital Investments'},
    { link: '/', name: 'Your Businesses'},
  ]
  public menu3: MenuItemInterface[] = [
    { link: '/', name: 'Portfolio Management & Analysis'},
    { link: '/', name: 'Dividends & Distributions'},
    { link: '/', name: 'Stock & Market Screeners'},
    { link: '/', name: 'Macroeconomic Dashboard'},
  ]

  public icons: MenuItemInterface[] = [
    {link: 'https://twitter.com/Macrosifter', name: 'assets/icons/twitter.svg'},
    {link: 'https://www.instagram.com/macrosifter/', name: 'assets/icons/instagram.svg'},
    {link: 'https://www.linkedin.com/company/macrosifter/about/', name: 'assets/icons/linkedin.svg'},
    {link: 'https://www.facebook.com/Macrosifter', name: 'assets/icons/facebook.svg'},
    {link: 'https://www.youtube.com/@macrosifter', name: 'assets/icons/youtube.svg'},
    {link: 'https://www.tiktok.com/@macrosifter', name: 'assets/icons/tiktok.svg'},
  ]

  deviceType: string;

  mobMenus = [
    {title: 'Company', menu: this.menu1, open: false},
    {title: 'Assets', menu: this.menu2, open: false},
    {title: 'Features', menu: this.menu3, open: false},
  ]
  open = -1;

  termsLink = TERMS_OF_USE_LINK;
  privacyPolicyLink = PRIVACY_POLICY_LINK;

  constructor(
    private deviceService: DeviceDetectorService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
    this.changeDetectorRef.markForCheck();
  }

  openMenu(i: number) {
    this.open = this.open === i ? -1 : i;
  }
}
