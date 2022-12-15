import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateAccountDto } from '@ghostfolio/api/app/account/create-account.dto';
import { UpdateAccountDto } from '@ghostfolio/api/app/account/update-account.dto';
import { AccountDetailDialog } from '@ghostfolio/client/components/account-detail-dialog/account-detail-dialog.component';
import { AccountDetailDialogParams } from '@ghostfolio/client/components/account-detail-dialog/interfaces/interfaces';
import { DataService } from '@ghostfolio/client/services/data.service';
import { ImpersonationStorageService } from '@ghostfolio/client/services/impersonation-storage.service';
import { UserService } from '@ghostfolio/client/services/user/user.service';
import { User } from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { Account as AccountModel, AccountType } from '@prisma/client';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CreateOrUpdateAccountDialog } from './create-or-update-account-dialog/create-or-update-account-dialog.component';
import { ChoosePlaidDialog } from './choose-plaid/choose-plaid.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccountPageComponent } from '../account/account-page.component';
import { ChoosePlaidStartDialog } from './choose-plaid/choose-plaid-start/choose-plaid-start.component';

@Component({
  host: { class: 'page' },
  selector: 'gf-accounts-page',
  styleUrls: ['./accounts-page.scss'],
  templateUrl: './accounts-page.html'
})
export class AccountsPageComponent implements OnDestroy, OnInit {
  public accounts: AccountModel[];
  public accountTypes: [];
  public plaidMessages: [];
  public deviceType: string;
  public hasImpersonationId: boolean;
  public hasPermissionToCreateAccount: boolean;
  public hasPermissionToDeleteAccount: boolean;
  public routeQueryParams: Subscription;
  public totalBalanceInBaseCurrency = 0;
  public totalValueInBaseCurrency = 0;
  public transactionCount = 0;
  public user: User;

  private unsubscribeSubject = new Subject<void>();

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private deviceService: DeviceDetectorService,
    private dialog: MatDialog,
    private impersonationStorageService: ImpersonationStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((params) => {
        if (params['accountId'] && params['accountDetailDialog']) {
          this.openAccountDetailDialog(params['accountId']);
        } else if (params['choosePlaid']) {
          this.openChoosePlaidDialog();
        }
        else if (
          params['createDialog'] &&
          this.hasPermissionToCreateAccount
        ) {
          this.openCreateAccountDialog();
        } else if (params['editDialog']) {
          if (this.accounts) {
            const account = this.accounts.find(({ id }) => {
              return id === params['accountId'];
            });

            this.openUpdateAccountDialog(account);
          } else {
            this.router.navigate(['.'], { relativeTo: this.route });
          }
        }
      });
  }

  public ngOnInit() {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;

    this.impersonationStorageService
      .onChangeHasImpersonation()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((aId) => {
        this.hasImpersonationId = !!aId;
      });

    this.userService.stateChanged
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((state) => {
        if (state?.user) {
          this.user = state.user;

          this.hasPermissionToCreateAccount = hasPermission(
            this.user.permissions,
            permissions.createAccount
          );
          this.hasPermissionToDeleteAccount = hasPermission(
            this.user.permissions,
            permissions.deleteAccount
          );

          this.changeDetectorRef.markForCheck();
        }
      });

    this.fetchAccounts();
    this.fetchAccountTypesWithSubTypes();
  }

  public getPlaidMessages() {

    this.dataService.getPlaidMessages().pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((response: []) => {
        this.plaidMessages = response;
      })
  }


  public fetchAccountTypesWithSubTypes() {
    this.dataService.getAccountTypesWithItsSubTypes()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((x: []) => {
        this.accountTypes = x;
      })
  }

  public fetchAccounts() {
    this.getPlaidMessages();
    this.dataService
      .fetchAccounts()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe(
        ({
          accounts,
          totalBalanceInBaseCurrency,
          totalValueInBaseCurrency,
          transactionCount
        }) => {
          this.accounts = accounts;
          this.totalBalanceInBaseCurrency = totalBalanceInBaseCurrency;
          this.totalValueInBaseCurrency = totalValueInBaseCurrency;
          this.transactionCount = transactionCount;

          if (this.accounts?.length <= 0) {
            this.router.navigate([], { queryParams: { createDialog: true } });
          }

          this.changeDetectorRef.markForCheck();
        }
      );
  }

  public onDeleteAccount(aId: string) {
    this.dataService
      .deleteAccount(aId)
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe({
        next: () => {
          this.userService
            .get(true)
            .pipe(takeUntil(this.unsubscribeSubject))
            .subscribe();

          this.fetchAccounts();
        }
      });
  }

  public onDeleteInstitution(institutionId: string) {
    this.dataService.deleteAccountByInstitutionId(institutionId)
      .pipe()
      .subscribe({
        next: () => {
          this.fetchAccounts();
        }
      })
  }

  public onUpdateAccount(aAccount: AccountModel) {
    this.router.navigate([], {
      queryParams: { accountId: aAccount.id, editDialog: true }
    });
  }

  public openUpdateAccountDialog({
    accountType,
    balance,
    currency,
    id,
    accountSubTypeId,
    isExcluded,
    name,
    platformId
  }: AccountModel): void {
    const dialogRef = this.dialog.open(CreateOrUpdateAccountDialog, {
      data: {
        accountTypes: this.accountTypes,
        account: {
          accountType,
          balance,
          currency,
          id,
          accountSubTypeId,
          isExcluded,
          name,
          platformId
        }
      },
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((data: any) => {
        const account: UpdateAccountDto = data?.account;

        if (account) {
          this.dataService
            .putAccount(account)
            .pipe(takeUntil(this.unsubscribeSubject))
            .subscribe({
              next: () => {
                this.userService
                  .get(true)
                  .pipe(takeUntil(this.unsubscribeSubject))
                  .subscribe();

                this.fetchAccounts();
              }
            });
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  private openAccountDetailDialog(aAccountId: string) {
    const dialogRef = this.dialog.open(AccountDetailDialog, {
      autoFocus: false,
      data: <AccountDetailDialogParams>{
        accountId: aAccountId,
        deviceType: this.deviceType,
        hasImpersonationId: this.hasImpersonationId
      },
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe(() => {
        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }

  private openCreateAccountDialog(): void {
    const dialogRef = this.dialog.open(CreateOrUpdateAccountDialog, {
      data: {
        accountTypes: this.accountTypes,
        account: {
          accountType: AccountType.CASH,
          accountSubTypeId: 1,
          balance: 0,
          currency: this.user?.settings?.baseCurrency,
          isExcluded: false,
          name: null,
          platformId: null
        }
      },
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((data: any) => {
        const account: CreateAccountDto = data?.account;

        if (account) {
          this.dataService
            .postAccount(account)
            .pipe(takeUntil(this.unsubscribeSubject))
            .subscribe({
              next: () => {
                this.userService
                  .get(true)
                  .pipe(takeUntil(this.unsubscribeSubject))
                  .subscribe();
                this.dialog.open(DialogManualAccountInsert, {
                  data: {},
                  height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
                  width: this.deviceType === 'mobile' ? '100vw' : '50rem'
                })

                this.fetchAccounts();
              }
            });
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }
  // plaid
  private openChoosePlaidDialog(): void {
    const dialogRef = this.dialog.open(ChoosePlaidDialog, {
      data: {
        account: {
          accountType: AccountType.SECURITIES,
          balance: 0,
          currency: this.user?.settings?.baseCurrency,
          isExcluded: false,
          name: null,
          platformId: null
        }
      },
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((data: any) => {
        const account: CreateAccountDto = data?.account;

        if (account) {
          this.dataService
            .postAccount(account)
            .pipe(takeUntil(this.unsubscribeSubject))
            .subscribe({
              next: () => {
                this.userService
                  .get(true)
                  .pipe(takeUntil(this.unsubscribeSubject))
                  .subscribe();

                this.fetchAccounts();
              }
            });
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }
}



@Component({
  selector: 'dialog-manual-account-insert',
  templateUrl: 'dialog-manual-account-insert.html',
  styleUrls: ['dialog-manual-account-insert.scss'],
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  standalone: true
})
export class DialogManualAccountInsert implements OnInit {
  public deviceType: string;
  constructor(public dialogRef: MatDialogRef<DialogManualAccountInsert>,
    private dialog: MatDialog,
    private router: Router,
    private deviceService: DeviceDetectorService,
  ) {

  }
  ngOnInit(): void {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
  }


  onCancel() {
    this.dialogRef.close();
  }

  onAddManualAccount() {
    this.onCancel();
    this.router.navigate([], { queryParams: { createDialog: true } });
  }

  onConnectToPlaid() {
    this.onCancel();
    const dialogRef = this.dialog.open(ChoosePlaidStartDialog, {
      data: {},
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });
  }

}
