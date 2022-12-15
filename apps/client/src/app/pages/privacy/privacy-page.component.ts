import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@ghostfolio/common/interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';





@Component({
    host: { class: 'page' },
    selector: 'gf-privacy-page',
    styleUrls: ['./privacy-page.scss'],
    templateUrl: './privacy-page.html'
})
export class PrivacyPageComponent implements OnDestroy, OnInit {



    public constructor(
        private changeDetectorRef: ChangeDetectorRef,
    ) {

    }

    public ngOnInit() {
    }

    public ngOnDestroy() {

    }
}
