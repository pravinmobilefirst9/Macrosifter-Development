import { Component, Inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";
import { CreateAccountDto } from "@ghostfolio/api/app/account/create-account.dto";
import { DataService } from "@ghostfolio/client/services/data.service";
import { environment } from "apps/client/src/environments/environment";
import { DeviceDetectorService } from "ngx-device-detector";
import { NgxPlaidLinkService, PlaidLinkHandler } from "ngx-plaid-link";
import { Subject, takeUntil } from "rxjs";
import { AccountDetailsToggleDialog } from "../account-details-toggle/account-details-toggle.component";

@Component({
  selector: 'choose-plaid-start-update-mode',
  templateUrl: 'choose-plaid-start-update-mode.html',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  standalone: true
})
export class ChoosePlaidStartUpdateModeDialog implements OnInit {

  private config: any = {
    "client_id": "{{client_id}}",
    "secret": "{{secret_key}}",
    "client_name": "Insert Client name here",
    "country_codes": ["US"],
    "language": "en",
    "user": {
      "client_user_id": "unique_user_id"
    },
    "access_token": "ENTER_ACCESS_TOKEN_HERE"
  };

  private unsubscribeSubject = new Subject<void>();

  private plaidLinkHandler: PlaidLinkHandler;
  public deviceType: string;

  constructor(public dialogRef: MatDialogRef<ChoosePlaidStartUpdateModeDialog>,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceDetectorService,
    private dataService: DataService,
    private plaidLinkService: NgxPlaidLinkService,
    @Inject(MAT_DIALOG_DATA) public data: ChoosePlaidStartUpdateModeDialog
  ) {
    console.log("Update flow started.....3");
    this.btnClick();
  }
  ngOnInit(): void {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
  }


  public btnClick = async () => {
    console.log("Update flow started.....4");
    console.log("Access token for update mode: ", this.data['access_token']);

    this.router.navigate(['/plaid-flow'], { relativeTo: this.route });
    this.dataService.createPlaidLinkTokenUpdateMode(this.data['access_token']).subscribe(data => {
      this.config.token = data['link_token']
      console.log("link token created for update mode", data['link_token']);

      this.plaidLinkService
        .createPlaid(
          Object.assign({}, this.config, {
            onSuccess: (token, metadata) => this.onSuccess(token, metadata),
            onExit: (error, metadata) => this.onExit(error, metadata),
            onEvent: (eventName, metadata) => this.onEvent(eventName, metadata)
          })
        )
        .then((handler: PlaidLinkHandler) => {
          this.plaidLinkHandler = handler;
          this.open();
        });
    })
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
    console.log(this.data['itemId']);

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

    this.dataService.updateItemLoginRequiredStatus(this.data['item_id']).subscribe(response => {
      // console.log('ITEM_LOGIN_REQUIRED_STATUS_CHANGED!');
    })


    this.dataService.postPlaidAccountDetails(bodyData).subscribe(response => {
      this.dialogRef.close();
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

        this.router.navigate(['/accounts'], { relativeTo: this.route });
      });
  }

  onEvent(eventName, metadata) {
    console.log("We got an event:", eventName);
    console.log("We got metadata:", metadata);
  }

  onExit(error, metadata) {
    console.log("We exited:", error);
    console.log("We got metadata:", metadata);
    this.router.navigate(['/accounts'], { relativeTo: this.route });
    this.dialogRef.close();
  }


}