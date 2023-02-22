import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '@ghostfolio/client/services/data.service';
import { environment } from 'apps/client/src/environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';
import { NgxPlaidLinkService, PlaidConfig, PlaidLinkHandler } from 'ngx-plaid-link';
import { ChoosePlaidStartMicroDepositDialog } from '../accounts/choose-plaid/choose-plaid-start-micro-deposit/choose-plaid-start-micro-deposit.component';
import { ChoosePlaidStartDialog } from '../accounts/choose-plaid/choose-plaid-start/choose-plaid-start.component';

@Component({
    host: { class: 'page' },
    selector: 'gf-plaid-auth-redirect-page',
    styleUrls: [],
    templateUrl: './plaid-auth-redirect-page.html'
})
export class PlaidAuthRedirectPageComponent implements OnInit {

    private plaidLinkHandler: PlaidLinkHandler;

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

    public deviceType: string;
    constructor(private dataService: DataService,
        private plaidLinkService: NgxPlaidLinkService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        const receivedRedirectUri = window.location.href;
        const storedTokenData = localStorage.getItem("linkTokenData");
        const token = JSON.parse(storedTokenData);
        this.btnClick({ receivedRedirectUri, token })
    }



    ngOnInit(): void {
    }

    public btnClick = async ({ receivedRedirectUri, token }) => {

        this.config['token'] = token['link_token'];
        this.config['receivedRedirectUri'] = receivedRedirectUri

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
        // let response = {
        //   "statusCode": 201,
        //   "message": "account is verified with plaid we are importing account detailsssssss"
        // }
        // this.openAccountDetailsToggle(response)

        this.dataService.postPlaidAccountDetails(bodyData).subscribe(response => {
            localStorage.removeItem("linkTokenData");
            this.router.navigate(['/accounts'], { relativeTo: this.route });
        })
    }

    onEvent(eventName, metadata) {
        console.log("We got an event:", eventName);
        console.log("We got metadata:", metadata);
    }

    onExit(error, metadata) {
        console.log("We exited:", error);
        console.log("We got metadata:", metadata);
        this.router.navigate(['/accounts'], { relativeTo: this.route });
    }


}




