import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private static readonly DEFAULT_TITLE =
    'MacroSifter - Portfolio Management';

  public constructor(private readonly title: Title) {
    super();
  }

  public override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);

    if (title) {
      this.title.setTitle(`${title} – ${PageTitleStrategy.DEFAULT_TITLE}`);
    } else {
      this.title.setTitle(`${PageTitleStrategy.DEFAULT_TITLE}`);
    }
  }
}
