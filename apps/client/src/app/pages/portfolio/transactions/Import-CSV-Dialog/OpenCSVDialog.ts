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
import { MatSnackBar } from "@angular/material/snack-bar";
import { BrowserModule } from '@angular/platform-browser'
import { DataService } from "@ghostfolio/client/services/data.service";
import { parse as csvToJson } from 'papaparse';
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";


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
        NgxSkeletonLoaderModule,
    ],
    schemas: [],
    standalone: true
})
export class OpenCSVDialog implements OnInit {



    public isLoading: boolean;
    public selectedInstitutionId: string;
    public selectedAccountId: string;
    public csvData: any;
    public selectedFileName: string;
    public institutions: { institutionId: string, institutionName: string, accounts: { accountId: string, accountName: string }[] }[]
    public accounts: { accountId: string, accountName: string }[]
    public isFormOk: boolean;



    constructor(public dialogRef: MatDialogRef<OpenCSVDialog>,
        public dataService: DataService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data) {
    }


    ngOnInit(): void {
        this.isLoading = true;
        this.selectedAccountId = null;
        this.selectedInstitutionId = null;
        this.csvData = null;
        this.selectedFileName = null;
        this.handleInstitutionSelect();
        this.isFormOk = false;
    }

    handleInstitutionSelect() {

        this.dataService.getInstitutionForCSVUpload().subscribe({
            next: (data: { institutionId: string, institutionName: string, accounts: { accountId: string, accountName: string }[] }[]) => {
                this.institutions = data;
            }, error: (err) => {
                console.log(err);
            }
        }).add(() => {
            this.isLoading = false;
        })


    }

    handleInstitutionSelectionChange(institutionId) {
        this.selectedInstitutionId = institutionId;
        const currentInstitution = this.institutions.filter((e) => (e.institutionId === institutionId))
        this.accounts = currentInstitution[0].accounts;
        this.selectedAccountId = null;
        if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
            this.isFormOk = true;
        } else {
            this.isFormOk = false;
        }
    }

    handleAccountSelectionChange(accountId) {
        this.selectedAccountId = accountId;
        if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
            this.isFormOk = true;
        } else {
            this.isFormOk = false;
        }
    }

    public onImportCSV() {

        const input = document.createElement('input');
        input.accept = 'application/JSON, .csv';
        input.type = 'file';

        input.onchange = (event) => {

            // Getting the file reference
            const file = (event.target as HTMLInputElement).files[0];
            // Setting up the reader
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');

            this.selectedFileName = file.name;
            // (id, Institutionid,userid,filename,records_count,createdat)

            reader.onload = async (readerEvent) => {

                const fileContent = readerEvent.target.result as string;

                try {

                    if (file.name.endsWith('.csv')) {

                        let content = csvToJson(fileContent, {
                            dynamicTyping: true,
                            header: true,
                            skipEmptyLines: true
                        }).data;

                        content = content.filter((e) => e['TRANSACTION ID'])

                        content = content.map((e) => {
                            const obj = e;
                            obj['DATE'] = new Date(e['DATE']).toISOString()
                            return obj;
                        })

                        this.csvData = content;

                        if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
                            this.isFormOk = true;
                        } else {
                            this.isFormOk = false;
                        }


                    } else {
                        if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
                            this.isFormOk = false;
                        }
                        this.snackBar.dismiss();
                        this.snackBar.open('⏳ ' + $localize`Please chack your file , file type should be .csv!`)._dismissAfter(4000);
                    }



                } catch (error) {
                    if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
                        this.isFormOk = false;
                    }
                    console.log(error);
                    this.snackBar.dismiss()
                    this.snackBar.open('⏳ ' + 'Please chack your csv file , DATE should be in mm/dd/yyyy!')._dismissAfter(4000);
                }

            }


        }

        input.click();
    }

    public handleUpload() {


        if (this.selectedAccountId && this.selectedInstitutionId && this.csvData) {
            console.log('institutionId=', this.selectedInstitutionId);
            console.log('accountId=', this.selectedAccountId);
            console.log('csv data ', this.csvData);

            this.dataService.postCSVFileUpload({
                institutionId: this.selectedInstitutionId,
                accountId: this.selectedAccountId,
                csv_data: this.csvData
            }).subscribe({
                next: (response) => {
                    console.log(response);
                }, error: (err) => {
                    console.log(err);
                }
            })


        }


    }

}