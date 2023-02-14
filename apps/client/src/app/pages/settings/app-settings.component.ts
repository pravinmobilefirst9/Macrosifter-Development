import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {AppSettingsService} from "@ghostfolio/client/pages/settings/app-settings.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";

@Component({
  host: { class: 'page' },
  selector: 'ms-app-settings',
  templateUrl: './app-settings.component.html'
})
export class AppSettingsComponent implements OnInit{

  loadingTimezones = true;
  tzStats = {
    total: [],
    local: []
  }
  private unsubscribeSubject = new Subject<void>();

  constructor(
    private settingsService: AppSettingsService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.validateTimezones();
  }

  validateTimezones() {
    this.loadingTimezones = true;
    this.settingsService.validateTimezones()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe(
        next => {
          this.tzStats.total = next?.['total'] ?? [];
          this.tzStats.local = next?.['local'] ?? [];
          this.loadingTimezones = false;
          this.changeDetectorRef.markForCheck();
        }, () => {
          this.loadingTimezones = false;
          this.changeDetectorRef.markForCheck();
        }
      )
  }

  fillTimezones() {
    this.loadingTimezones = true;
    this.settingsService.fillTimezones().subscribe(
      next => {
        this.tzStats['new'] = next['new']
        this.validateTimezones();
      }, () => {
        this.validateTimezones();
      }
    );
  }

  updateTimezones() {
    this.loadingTimezones = true;
    this.settingsService.getTimezones().subscribe(
      next => {
        this.tzStats['updated'] = next['updated']
        this.validateTimezones();
      }, () => {
        this.validateTimezones();
      }
    );
  }
}
