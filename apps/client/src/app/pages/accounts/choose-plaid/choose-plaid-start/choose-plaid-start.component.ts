import { Component, Injector, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";
import { CreateAccountDto } from "@ghostfolio/api/app/account/create-account.dto";
import { AccountPageComponent } from "@ghostfolio/client/pages/account/account-page.component";
import { DataService } from "@ghostfolio/client/services/data.service";
import { environment } from "apps/client/src/environments/environment";
import { DeviceDetectorService } from "ngx-device-detector";
import { NgxPlaidLinkService, PlaidLinkHandler } from "ngx-plaid-link";
import { Subject, takeUntil } from "rxjs";
import { AccountDetailsToggleDialog } from "../account-details-toggle/account-details-toggle.component";
import { ChoosePlaidStartMicroDepositDialog } from "../choose-plaid-start-micro-deposit/choose-plaid-start-micro-deposit.component";
import { ChoosePlaidStartUpdateModeDialog } from '../choose-plaid-start-update-mode/choose-plaid-start-update-mode.component'

@Component({
  selector: 'choose-plaid-start',
  templateUrl: 'choose-plaid-start.html',
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
export class ChoosePlaidStartDialog implements OnInit {

  private config: any = {
    apiVersion: "v2",
    env: environment.PLAID_ENV,
    institution: environment.plaid_institution,
    token: null,
    webhook: environment.webhook,
    product: ["transactions"],
    countryCodes: ['US'],
    key: environment.plaid_secret
  };

  private unsubscribeSubject = new Subject<void>();

  private plaidLinkHandler: PlaidLinkHandler;
  public deviceType: string;

  constructor(public dialogRef: MatDialogRef<ChoosePlaidStartDialog>,
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
    this.dataService.createPlaidLinkToken().subscribe(data => {
      localStorage.setItem("linkTokenData", JSON.stringify(data));
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
      console.log(response);
      if (response['status'] === 'ITEM_LOGIN_REQUIRED') {
        console.log("Update flow started.....1");
        this.startUpdateModeToggle(response)
      } else {
        this.openAccountDetailsToggle(response)
      }
    })
  }

  startUpdateModeToggle(status) {
    console.log("Update flow started.....2");
    const dialogRef = this.dialog.open(ChoosePlaidStartUpdateModeDialog, {
      data: status,
      height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
      width: this.deviceType === 'mobile' ? '100vw' : '50rem'
    });

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

    switch (metadata.status) {

      case 'institution_not_found':
        this.dialog.open(ChoosePlaidStartMicroDepositDialog, {
          data: {},
          height: this.deviceType === 'mobile' ? '97.5vh' : '80vh',
          width: this.deviceType === 'mobile' ? '100vw' : '50rem'
        });
        break;

      default: break;

    }

    this.dialogRef.close();
  }


}