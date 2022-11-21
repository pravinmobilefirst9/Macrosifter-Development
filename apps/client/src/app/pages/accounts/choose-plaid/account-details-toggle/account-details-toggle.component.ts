import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DataService } from '../../../../services/data.service';
import { AccountDetailsToggleParams } from './interfaces/interfaces';
import {
  PlaidErrorMetadata,
  PlaidErrorObject,
  PlaidEventMetadata,
  PlaidOnEventArgs,
  PlaidOnExitArgs,
  PlaidOnSuccessArgs,
  PlaidSuccessMetadata,
  PlaidConfig,
  NgxPlaidLinkService,
  PlaidLinkHandler
} from "ngx-plaid-link";
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'apps/client/src/environments/environment';
import { Account as AccountModel, AccountType } from '@prisma/client';
import { User } from '@ghostfolio/common/interfaces';
import { CreateAccountDto } from '@ghostfolio/api/app/account/create-account.dto';

@Component({
  host: { class: 'h-100' },
  selector: 'gf-account-details-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./account-details-toggle.scss'],
  templateUrl: 'account-details-toggle.html'
})
export class AccountDetailsToggleDialog implements OnDestroy {
  public currencies: string[] = [];
  public platforms: { id: string; name: string }[];

  private unsubscribeSubject = new Subject<void>();
  private plaidLinkHandler: PlaidLinkHandler;
 
  private config: any = {
    apiVersion: "v2",
    env: "sandbox",
    institution: environment.plaid_institution,
    token: null,
    webhook: "",
    product: ["auth","transactions"],
    countryCodes: ['US', 'CA', 'GB'],
    key: environment.plaid_secret
  };

  public constructor(
    private plaidLinkService: NgxPlaidLinkService,
    private dataService: DataService,
    public dialogRef: MatDialogRef<AccountDetailsToggleDialog>,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: AccountDetailsToggleParams,
    private dialog: MatDialog,
  ) {}
  accountStatusCode = ''
    msg = ''
  ngOnInit() {
    console.log(this.data.account.accountType)
    console.log(this.data.account.accountType['statusCode'])
    this.accountStatusCode = this.data.account.accountType['statusCode']
    this.msg = this.data.account.accountType['msg']
    const { currencies, platforms } = this.dataService.fetchInfo();

    this.currencies = currencies;
    this.platforms = platforms;
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }
}
