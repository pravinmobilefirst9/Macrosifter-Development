import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AccountType, Prisma } from '@prisma/client';
import { Subject } from 'rxjs';

import { DataService } from '../../../services/data.service';
import { CreateOrUpdateAccountDialogParams } from './interfaces/interfaces';

@Component({
  host: { class: 'h-100' },
  selector: 'gf-create-or-update-account-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./create-or-update-account-dialog.scss'],
  templateUrl: 'create-or-update-account-dialog.html'
})
export class CreateOrUpdateAccountDialog implements OnDestroy {
  public currencies: string[] = [];
  public platforms: { id: string; name: string }[];
  public accountTypes: any[];
  public activeSubTypes: any[];
  public activeType: AccountType = 'CASH';
  public activeSubType: string;


  private unsubscribeSubject = new Subject<void>();

  public constructor(
    private dataService: DataService,
    public dialogRef: MatDialogRef<CreateOrUpdateAccountDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CreateOrUpdateAccountDialogParams
  ) { }

  async ngOnInit() {
    const { currencies, platforms } = this.dataService.fetchInfo();
    this.currencies = currencies;
    this.platforms = platforms;

    this.accountTypes = this.data.accountTypes;

    if (this.data.account.id) {
      this.setActiveAccount(this.data.account.accountType)
    } else {
      this.setActiveAccount(this.accountTypes[0].accountTypeName)
    }
  }

  public setActiveAccount(activeAccountTypeName: string) {
    // Targeted accountTypeName
    for (let i = 0; i < this.accountTypes.length; i++) {
      if (this.accountTypes[i].accountTypeName === activeAccountTypeName) {
        this.activeSubTypes = this.accountTypes[i].AccountSubTypes;
        // this.data.account.accountSubTypeId = 1;
        break;
      }
    }

  }


  public onCancel(): void {
    this.dialogRef.close();
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }
}
