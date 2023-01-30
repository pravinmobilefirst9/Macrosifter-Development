import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject, NO_ERRORS_SCHEMA, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatOptgroup, MatOption, MatOptionModule } from "@angular/material/core";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { BrowserModule } from '@angular/platform-browser'


@Component({
    selector: 'open-csv-dialog',
    templateUrl: './OpenCSVDialog.html',
    imports: [
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        CommonModule,
    ],
    schemas: [],
    standalone: true
})
export class OpenCSVDialog implements OnInit {

    institutionId: string;

    institution = [
        {
            institutionName: 'TD Ameritrade (Investments)',
            id: '3a6e0024-0ea1-4d45-b7e4-2d83efc8244d',
            accounts: [
                {
                    name: 'acc 1',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                },
                {
                    name: 'acc 2',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                },
                {
                    name: 'acc 3',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                },
                {
                    name: 'acc 4',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                }
            ]
        },
        {
            institutionName: 'Betterment',
            id: '857c693d-f53c-4083-85af-c9dc1b53e147',
            accounts: [
                {
                    name: 'acc 5',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                },
                {
                    name: 'acc 6',
                    id: '047e3a14-0b89-4838-9e54-200714db9e7f'
                },

            ]
        }
    ]

    accounts = []

    constructor(public dialogRef: MatDialogRef<OpenCSVDialog>,
        @Inject(MAT_DIALOG_DATA) public data) {

    }


    ngOnInit(): void {

    }

    handleInstitutionSelect(institutionName) {
        console.log(institutionName);
        this.accounts = this.institution.filter((e) => e.institutionName === institutionName)[0].accounts;
        console.log(this.accounts);


    }


}