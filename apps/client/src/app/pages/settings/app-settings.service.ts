import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  public constructor(private http: HttpClient) {
  }

  public getTimezones() {
    return this.http.get<string[]>(`/api/v1/admin/timezones-update`);
  }
}
