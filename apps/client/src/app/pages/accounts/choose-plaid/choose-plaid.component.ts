import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { ChoosePlaidDialogParams } from './interfaces/interfaces';
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
import { AccountDetailsToggleDialog } from './account-details-toggle/account-details-toggle.component';
import { ChoosePlaidStartDialog } from './choose-plaid-start/choose-plaid-start.component';

@Component({
  host: { class: 'h-100' },
  selector: 'gf-choose-plaid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./choose-plaid.scss'],
  templateUrl: './choose-plaid.html'
})
export class ChoosePlaidDialog implements OnDestroy {
  public currencies: string[] = [];
  public platforms: { id: string; name: string }[];

  private unsubscribeSubject = new Subject<void>();
  private plaidLinkHandler: PlaidLinkHandler;

  private config: any = {
    apiVersion: "v2",
    env: environment.PLAID_ENV,
    institution: environment.plaid_institution,
    token: null,
    webhook: "",
    product: ["auth", "transactions"],
    countryCodes: ['US', 'CA', 'GB'],
    key: environment.plaid_secret
  };
  public user: User;
  public deviceType: string;

  public constructor(
    private plaidLinkService: NgxPlaidLinkService,
    private dataService: DataService,
    public dialogRef: MatDialogRef<ChoosePlaidDialog>,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: ChoosePlaidDialogParams,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
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

  public btnClick = async () => {

    this.onCancel();
    const dialogRef = this.dialog.open(ChoosePlaidStartDialog, {
      data: {},
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

    // this.dataService.createPlaidLinkToken().subscribe(data => {
    //   this.config.token = data['link_token']
    //   this.plaidLinkService
    //     .createPlaid(
    //       Object.assign({}, this.config, {
    //         onSuccess: (token, metadata) => this.onSuccess(token, metadata),
    //         onExit: (error, metadata) => this.onExit(error, metadata),
    //         onEvent: (eventName, metadata) => this.onEvent(eventName, metadata),
    //       })
    //     )
    //     .then((handler: PlaidLinkHandler) => {
    //       this.plaidLinkHandler = handler;
    //       this.open();
    //     });
    // })
  }
  public manualClick() {
    this.dialogRef.close();
    this.router.navigate(
      ['/accounts'],
      { queryParams: { createDialog: true } }
    );
  }
  open() {
    this.plaidLinkHandler.open();
  }

  exit() {
    this.plaidLinkHandler.exit();
  }

  onSuccess(token, metadata) {
    console.log("We got a token:", token);
    console.log("We got metadata:", metadata);
    // api call
    // this.openAccountDetailsToggle('success')
    let bodyData = {
      "accounts": metadata.accounts,
      "institution": metadata.institution,
      "public_token": metadata.public_token,
      "userId": window.localStorage.getItem("local-user-id")
    }
    // let response = {
    //   "statusCode": 201,
    //   "message": "account is verified with plaid we are importing account detailsssssss"
    // }
    // this.openAccountDetailsToggle(response)
    this.dataService.postPlaidAccountDetails(bodyData).subscribe(response => {
      this.openAccountDetailsToggle(response)
    })
  }
  openAccountDetailsToggle(status) {
    const dialogRef = this.dialog.open(AccountDetailsToggleDialog, {
      data: {
        account: {
          accountType: status,

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

              }
            });
        }

        this.router.navigate(['.'], { relativeTo: this.route });
      });
  }
  onEvent(eventName, metadata) {
    console.log("We got an event:", eventName);
    console.log("We got metadata:", metadata);
  }

  onExit(error, metadata) {
    console.log("We exited:", error);
    console.log("We got metadata:", metadata);
  }
}
