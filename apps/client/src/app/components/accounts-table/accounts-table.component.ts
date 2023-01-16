import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Account as AccountModel } from '@prisma/client';
import { institutionIcons } from 'apps/client/src/assets/icons/institution/institution';
import { platformIcons } from 'apps/client/src/assets/icons/platform/platform';
import { Subject, Subscription } from 'rxjs';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '@ghostfolio/client/services/data.service';
import { ChoosePlaidStartUpdateModeDialog } from '@ghostfolio/client/pages/accounts/choose-plaid/choose-plaid-start-update-mode/choose-plaid-start-update-mode.component';
import { ChoosePlaidStartTwoDepositDialog } from '@ghostfolio/client/pages/accounts/choose-plaid/choose-plaid-start-two-deposit/choose-plaid-start-two-deposit.component';

@Component({
  selector: 'gf-accounts-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accounts-table.component.html',
  styleUrls: ['./accounts-table.component.scss']
})
export class AccountsTableComponent implements OnChanges, OnDestroy, OnInit {
  @Input() accounts: AccountModel[];
  @Input() accountTypes: [];
  @Input() plaidMessages: [];
  @Input() baseCurrency: string;
  @Input() deviceType: string;
  @Input() locale: string;
  @Input() showActions: boolean;
  @Input() totalBalanceInBaseCurrency: number;
  @Input() totalValueInBaseCurrency: number;
  @Input() transactionCount: number;

  @Output() accountDeleted = new EventEmitter<string>();
  @Output() institutionDeleted = new EventEmitter<string>();
  @Output() accountToUpdate = new EventEmitter<AccountModel>();

  public dataSource: MatTableDataSource<AccountModel> =
    new MatTableDataSource();
  public displayedColumns = [];
  public isLoading = true;
  public institutionIcons = institutionIcons;
  public platformIcons = platformIcons;
  public routeQueryParams: Subscription;
  public description: any;

  private unsubscribeSubject = new Subject<void>();

  public constructor(private router: Router, public dialog: MatDialog,
    public dataService: DataService
  ) {

  }

  public ngOnInit() {

  }

  public getAccountByInstitutionWise(accounts: AccountModel[]): AccountModel[] {

    const accountObj = {
      manual: []
    }
    console.log(accounts);


    accounts.forEach((currentAccount) => {

      if (currentAccount.institutionId) {
        if (!accountObj.hasOwnProperty(currentAccount.institutionId)) {
          accountObj[currentAccount.institutionId] = [];
          const firstAccount = {};
          firstAccount['Institution'] = currentAccount['Institution']
          firstAccount['Platform'] = currentAccount['Platform']
          firstAccount['PlaidToken'] = currentAccount['PlaidToken']
          firstAccount['isHeader'] = true;
          firstAccount['isInstitution'] = true;
          firstAccount['verification_status'] = currentAccount['verification_status'];
          firstAccount['access_token'] = currentAccount['access_token'];
          firstAccount['account_id'] = currentAccount['account_id'];
          accountObj[currentAccount.institutionId].push(firstAccount);
        }


        currentAccount['isHeader'] = false;
        currentAccount['isInstitution'] = false;
        accountObj[currentAccount.institutionId].push(currentAccount);

      } else {

        if (accountObj.manual.length === 0) {
          const firstManualAccount = {};
          firstManualAccount['isHeader'] = true;
          firstManualAccount['isManual'] = true;
          accountObj.manual.push(firstManualAccount)

          currentAccount['isHeader'] = false;
          currentAccount['isManual'] = true;
          accountObj.manual.push(currentAccount)
        } else {
          currentAccount['isHeader'] = false;
          currentAccount['isManual'] = true;
          accountObj.manual.push(currentAccount)
        }
      }
    })

    let institutionWise: AccountModel[];
    institutionWise = [];
    Object.entries(accountObj).forEach(([key, value]) => {
      institutionWise.unshift(...value);
    })




    console.log(institutionWise);

    return institutionWise;
  }

  public deleteAccountByinstitutionId(institutionId: string) {
    this.institutionDeleted.emit(institutionId);
  }

  public ngOnChanges() {
    this.displayedColumns = [
      'institution',
      'account',
      'transactions',
      'balance',
      'value',
      'currency',
      'valueInBaseCurrency'
    ];

    if (this.showActions) {
      this.displayedColumns.push('actions');
    }
    this.isLoading = true;

    if (this.accounts) {

      // isHeader === true && isInstitution === true
      // isHeader === true && isManual === true 
      const newAccounts = [];
      for (let i = 0; i < this.accounts.length; i++) {
        if (this.accounts[i]['isHeader'] && this.accounts[i]['isInstitution']) {

        } else if (this.accounts[i]['isHeader'] && this.accounts[i]['isManual']) {

        } else {
          newAccounts.push(this.accounts[i])
        }
      }



      this.accounts = this.getAccountByInstitutionWise(newAccounts);

      console.log(this.plaidMessages);
      console.log(this.accounts);

      for (let i = 0; i < this.accounts.length; i++) {
        if (this.accounts[i]['isHeader'] && this.accounts[i]['isInstitution']) {
          this.accounts[i]['Institution']['item_Login_Required_Status'] = false;
          // this.accounts[i]['Institution']['access_token'] = false;



          for (let j = 0; j < this.plaidMessages.length; j++) {

            if (this.accounts[i]['Institution']['institutionUniqueId'] === this.plaidMessages[j]['institutionUniqueId']) {
              this.accounts[i]['Institution']['item_Login_Required_Status'] = this.plaidMessages[j]['item_Login_Required_Status']
              this.accounts[i]['Institution']['accessToken'] = this.plaidMessages[j]['accessToken'];
              this.accounts[i]['Institution']['itemId'] = this.plaidMessages[j]['itemId'];
            }

          }

        }
      }



      this.dataSource = new MatTableDataSource(this.accounts);
      // console.log(this.dataSource.filteredData);

      this.isLoading = false;
    }
  }

  public syncInstitution(institutionId: string) {
    alert("Sync Institution" + institutionId);
  }

  public verifyTwoDeposit(access_token: string, account_id: string) {
    if (!access_token) {
      alert('Token undefined!')
      return;
    }
    if (access_token) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;

      dialogConfig.height = "500px";
      dialogConfig.width = "700px";

      dialogConfig.enterAnimationDuration = '500ms';
      dialogConfig.exitAnimationDuration = '0ms';

      dialogConfig.data = {
        accessToken: access_token,
        account_id,
      };

      this.dialog.open(ChoosePlaidStartTwoDepositDialog, dialogConfig);
    }

  }

  public onDeleteAccount(aId: string) {
    this.accountDeleted.emit(aId);
  }

  public onOpenAccountDetailDialog(accountId: string) {
    this.router.navigate([], {
      queryParams: { accountId, accountDetailDialog: true }
    });
  }

  public onUpdateAccount(aAccount: AccountModel) {
    this.accountToUpdate.emit(aAccount);
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  public openDialog(enterAnimationDuration: string, exitAnimationDuration: string, accountId: string): void {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.height = "220px";
    dialogConfig.width = "400px";

    dialogConfig.enterAnimationDuration = enterAnimationDuration;
    dialogConfig.exitAnimationDuration = exitAnimationDuration;

    dialogConfig.data = {
      accountId
    };

    const dialogRef = this.dialog.open(DialogDeleteAccountDialog, dialogConfig);

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.onDeleteAccount(data);
      }
    })

  }

  public openDialogInstitutionDelete(institutionId: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.height = "220px";
    dialogConfig.width = "400px";

    dialogConfig.enterAnimationDuration = '500ms';
    dialogConfig.exitAnimationDuration = '0ms';

    dialogConfig.data = {
      institutionId
    };

    const dialogRef = this.dialog.open(DialogDeleteInstitutionDialog, dialogConfig);

    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.deleteAccountByinstitutionId(data);
      }
    })
  }

  public plaidStartUpdateMode(accessToken: string, item_Login_Required_Status: boolean, itemId: string) {
    if (!item_Login_Required_Status) {
      alert("No need to update!");
    } else {

      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;

      dialogConfig.height = "500px";
      dialogConfig.width = "700px";

      dialogConfig.enterAnimationDuration = '500ms';
      dialogConfig.exitAnimationDuration = '0ms';

      dialogConfig.data = {
        access_token: accessToken,
        item_id: itemId
      };

      this.dialog.open(ChoosePlaidStartUpdateModeDialog, dialogConfig);

    }
  }

}

@Component({
  selector: 'dialog-delete-account-dialog',
  templateUrl: 'dialog-delete-account-dialog.html',
})
export class DialogDeleteAccountDialog {
  accountId: string;

  constructor(public dialogRef: MatDialogRef<DialogDeleteAccountDialog>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.accountId = data.accountId;

  }

  save(accountId: string) {
    this.dialogRef.close(accountId);
  }

  close() {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'dialog-delete-institution-dialog',
  templateUrl: 'dialog-delete-institution-dialog.html',
})
export class DialogDeleteInstitutionDialog {
  institutionId: string;

  constructor(public dialogRef: MatDialogRef<DialogDeleteAccountDialog>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.institutionId = data.institutionId;

  }

  save(institutionId: string) {
    this.dialogRef.close(institutionId);
  }

  close() {
    this.dialogRef.close();
  }

}
