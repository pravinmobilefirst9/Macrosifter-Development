import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
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
import { AccountDetailsTogglePendingDialog } from "../choose-plaid-start-update-mode/account-details-toggle-pending.component";

@Component({
  selector: 'choose-plaid-start-micro-deposit',
  templateUrl: 'choose-plaid-start-micro-deposit.html',
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
export class ChoosePlaidStartMicroDepositDialog implements OnInit {

  private config: any = {
    apiVersion: "v2",
    env: "sandbox",
    institution: environment.plaid_institution,
    token: null,
    webhook: "",
    product: ["transactions"],
    countryCodes: ['US'],
    key: environment.plaid_secret
  };

  private unsubscribeSubject = new Subject<void>();

  private plaidLinkHandler: PlaidLinkHandler;
  public deviceType: string;

  constructor(public dialogRef: MatDialogRef<ChoosePlaidStartMicroDepositDialog>,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceDetectorService,
    private dataService: DataService,
    private plaidLinkService: NgxPlaidLinkService,
  ) {
    this.btnClick();
  }
  ngOnInit(): void {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;
  }


  public btnClick = async () => {
    this.router.navigate(['/plaid-flow'], { relativeTo: this.route });
    this.dataService.createPlaidLinkTokenMicroDeposit().subscribe(data => {
      this.config.token = data['link_token']
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


    let bodyData = {
      "accounts": metadata.accounts,
      "institution": metadata.institution,
      "public_token": metadata.public_token,
      "userId": window.localStorage.getItem("local-user-id")
    }

    this.dataService.postPlaidAccountDetails(bodyData).subscribe(response => {
      this.dialogRef.close();
      this.openAccountDetailsToggle(response)
    })
  }

  openAccountDetailsToggle(status) {

    if (status.status === "pending_automatic_verification") {

      const dialogRef = this.dialog.open(AccountDetailsTogglePendingDialog, {
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

          this.router.navigate(['/accounts'], { relativeTo: this.route });
        });

    } else {
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

          this.router.navigate(['/accounts'], { relativeTo: this.route });
        });
    }


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