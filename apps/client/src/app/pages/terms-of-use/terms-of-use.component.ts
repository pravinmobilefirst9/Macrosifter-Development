import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
    host: { class: 'page' },
    selector: 'ms-privacy-page',
    styleUrls: ['./terms-of-use.scss'],
    templateUrl: './terms-of-use.html'
})
export class TermsOfUseComponent implements OnDestroy, OnInit {

    public constructor() {}

    public ngOnInit() {
    }

    public ngOnDestroy() {

    }
}
