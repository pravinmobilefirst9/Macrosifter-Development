import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ObservableStore } from '@codewithdan/observable-store';
import { User } from '@ghostfolio/common/interfaces';
import {of, Subject, take} from 'rxjs';
import { throwError } from 'rxjs';
import {catchError, map, takeUntil} from 'rxjs/operators';

import { UserStoreActions } from './user-store.actions';
import { UserStoreState } from './user-store.state';
import {
  WorldtimeapiByIpResposeInterface
} from "@ghostfolio/common/interfaces/responses/worldtimeapi.by-ip-respose.interface";
const LOCAL_USER_ID = 'local-user-id'

@Injectable({
  providedIn: 'root'
})
export class UserService extends ObservableStore<UserStoreState> {
  public constructor(private http: HttpClient) {
    super({ trackStateHistory: true });

    this.setState({ user: undefined }, UserStoreActions.Initialize);
  }

  public get(force = false) {
    const state = this.getState();

    if (state?.user && force !== true) {
      // Get from cache
      return of(state.user);
    } else {
      // Get from endpoint
      return this.fetchUser().pipe(catchError(this.handleError));
    }
  }

  public remove() {
    this.setState({ user: null }, UserStoreActions.RemoveUser);
  }

  public getAllTimezones() {
    return fetch("https://worldtimeapi.org/api/timezone")
      .then(response => response.json());
  }

  public getTimezoneByIp() {
    return fetch("https://worldtimeapi.org/api/ip")
      .then(response => {
        response.json().then( data => {
          const tz = (data as WorldtimeapiByIpResposeInterface).timezone;
          return this.get()
            .pipe(take(1))
            .subscribe( u => {
            const user: User = {...u};
            user.settings.timezone = tz;
            this.setState({ user }, UserStoreActions.GetUser);
          });
        })
      })
  }

  public getTimezone(tz: string) {
    return fetch("https://worldtimeapi.org/api/timezone/" + tz)
      .then(response => response.json())
  }

  private fetchUser() {
    return this.http.get<User>('/api/v1/user').pipe(
      map((user) => {
        window.localStorage.setItem(LOCAL_USER_ID, user.id);
        this.setState({ user }, UserStoreActions.GetUser);
        return user;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    if (error.error instanceof Error) {
      const errMessage = error.error.message;
      return throwError(errMessage);
    }

    return throwError(error || 'Server error');
  }
}
