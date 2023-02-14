import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  public constructor(private http: HttpClient) {
  }

  public validateTimezones() {
    return this.http.get<string[]>(`/api/v1/admin/timezones-validate`);
  }

  public fillTimezones() {
    return this.http.get<string[]>(`/api/v1/admin/timezones-fill`);
  }

  public getTimezones() {
    return this.http.get<string[]>(`/api/v1/admin/timezones-update`);
  }
}
