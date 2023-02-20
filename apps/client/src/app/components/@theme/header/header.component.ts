import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LoginWithAccessTokenDialog } from '@ghostfolio/client/components/login-with-access-token-dialog/login-with-access-token-dialog.component';
import { DataService } from '@ghostfolio/client/services/data.service';
import { ImpersonationStorageService } from '@ghostfolio/client/services/impersonation-storage.service';
import {
  STAY_SIGNED_IN,
  SettingsStorageService
} from '@ghostfolio/client/services/settings-storage.service';
import { TokenStorageService } from '@ghostfolio/client/services/token-storage.service';
import { InfoItem, User } from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { EMPTY, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import {MenuItemInterface} from "@ghostfolio/client/components/@theme/header/menu-item.interface";
import {DeviceDetectorService} from "ngx-device-detector";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {Role} from "@prisma/client";
import {
  ShowAccessTokenDialog
} from "@ghostfolio/client/pages/register/show-access-token-dialog/show-access-token-dialog.component";

@Component({
  selector: 'ms-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('mobHeight', [
      state('in', style({
        height: '*',
      })),
      state('out', style({
        height: '0',
      })),
      transition('in => out', animate('400ms ease-in-out')),
      transition('out => in', animate('400ms ease-in-out'))
    ])
  ]
})
export class HeaderComponent implements OnChanges {
  @Input() currentRoute: string;
  @Input() info: InfoItem;
  @Input() user: User;

  @Output() signOut = new EventEmitter<void>();

  public hasPermissionForSocialLogin: boolean;
  public hasPermissionForSubscription: boolean;
  public hasPermissionToAccessAdminControl: boolean;
  public hasPermissionToAccessFearAndGreedIndex: boolean;
  public impersonationId: string;
  public isMenuOpen: boolean;

  public guestMenu: MenuItemInterface[] = [
    {
      name: 'About Us',
      link: 'about'
    },
    {
      name: 'Features',
      link: 'features'
    },
    {
      name: 'Blog',
      link: 'blog'
    },
    {
      name: 'Pricing',
      link: 'pricing'
    },
  ]

  // todo user permissions
  public userMenu: MenuItemInterface[] = [
    {
      name: 'Overview',
      link: ''
    },
    {
      name: 'Portfolio',
      link: 'portfolio'
    },
    {
      name: 'Accounts',
      link: 'accounts'
    },
    {
      name: 'Resources',
      link: 'resources'
    },
    {
      name: 'My Ghostfolio',
      link: 'account'
    },
  ]
  // todo admin permissions and menu
  public adminMenu: MenuItemInterface[] = [
    {
      name: 'Overview',
      link: ''
    },
    {
      name: 'Portfolio',
      link: 'portfolio'
    },
    {
      name: 'Accounts',
      link: 'accounts'
    },
    {
      name: 'Admin Control',
      link: 'admin'
    },
    {
      name: 'Resources',
      link: 'resources'
    },
  ]

  public menu: MenuItemInterface[] = []

  showMobMenu: 'in' | 'out' = 'out';
  deviceType: string;

  private unsubscribeSubject = new Subject<void>();

  public constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private impersonationStorageService: ImpersonationStorageService,
    private router: Router,
    private settingsStorageService: SettingsStorageService,
    private tokenStorageService: TokenStorageService,
    private deviceService: DeviceDetectorService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.impersonationStorageService
      .onChangeHasImpersonation()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((id) => {
        this.impersonationId = id;
      });

    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
  }

  public ngOnChanges() {
    this.hasPermissionForSocialLogin = hasPermission(
      this.info?.globalPermissions,
      permissions.enableSocialLogin
    );

    this.hasPermissionForSubscription = hasPermission(
      this.info?.globalPermissions,
      permissions.enableSubscription
    );

    this.hasPermissionToAccessAdminControl = hasPermission(
      this.user?.permissions,
      permissions.accessAdminControl
    );

    this.hasPermissionToAccessFearAndGreedIndex = hasPermission(
      this.info?.globalPermissions,
      permissions.enableFearAndGreedIndex
    );

    this.menu = this.user ? this.userMenu : this.guestMenu;
    if (this.hasPermissionToAccessAdminControl) this.menu = this.adminMenu
    this.changeDetectorRef.markForCheck()
  }

  public impersonateAccount(aId: string) {
    if (aId) {
      this.impersonationStorageService.setId(aId);
    } else {
      this.impersonationStorageService.removeId();
    }

    window.location.reload();
  }

  public onMenuClosed() {
    this.isMenuOpen = false;
  }

  public onMenuOpened() {
    this.isMenuOpen = true;
  }

  public onSignOut() {
    this.showMobMenu = 'out';
    this.signOut.next();
  }

  public openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginWithAccessTokenDialog, {
      autoFocus: false,
      data: {
        accessToken: '',
        hasPermissionToUseSocialLogin: this.hasPermissionForSocialLogin,
        title: $localize`Sign in`
      },
      width: '30rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((data) => {
        if (data?.accessToken) {
          this.dataService
            .loginAnonymous(data?.accessToken)
            .pipe(
              catchError(() => {
                alert($localize`Oops! Incorrect Security Token.`);

                return EMPTY;
              }),
              takeUntil(this.unsubscribeSubject)
            )
            .subscribe(({ authToken }) => {
              this.setToken(authToken);
            });
        }

        this.showMobMenu = 'out'
      });
  }

  public setToken(aToken: string) {
    this.tokenStorageService.saveToken(
      aToken,
      this.settingsStorageService.getSetting(STAY_SIGNED_IN) === 'true'
    );

    this.router.navigate(['']);
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  public openShowAccessTokenDialog(
    accessToken: string,
    authToken: string,
    role: Role
  ): void {
    const dialogRef = this.dialog.open(ShowAccessTokenDialog, {
      data: {
        accessToken,
        authToken,
        role
      },
      disableClose: true,
      width: '30rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((data) => {
        if (data?.authToken) {
          this.tokenStorageService.saveToken(authToken, true);

          this.router.navigate(['']);
        }
      });
  }

  public async createAccount() {
    this.dataService
      .postUser()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe(({ accessToken, authToken, role }) => {
        this.openShowAccessTokenDialog(accessToken, authToken, role);
      });
  }
}
