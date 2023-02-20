import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {InfoItem, User} from "@ghostfolio/common/interfaces";

@Component({
  selector: 'ms-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  @Input() currentRoute: string;
  @Input() info: InfoItem;
  @Input() user: User;

  @Output() signOut = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  public onSignOut() {
    this.signOut.next();
  }
}
