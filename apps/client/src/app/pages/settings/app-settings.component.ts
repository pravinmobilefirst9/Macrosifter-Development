import {ChangeDetectorRef, Component} from "@angular/core";
import {AppSettingsService} from "@ghostfolio/client/pages/settings/app-settings.service";

@Component({
  host: { class: 'page' },
  selector: 'ms-app-settings',
  templateUrl: './app-settings.component.html'
})
export class AppSettingsComponent {

  loadingTimezones = false;

  constructor(
    private settingsService: AppSettingsService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  updateTimezones() {
    this.loadingTimezones = true;
    this.settingsService.getTimezones().subscribe(
      () => {
        this.loadingTimezones = false;
        this.changeDetectorRef.markForCheck();
      }, () => {
        this.loadingTimezones = false;
        this.changeDetectorRef.markForCheck();
      }
    );
  }
}
