import {Subject} from "rxjs";
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {MatPaginatorIntl, PageEvent} from "@angular/material/paginator";
import '@angular/localize/init';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ms-activities-table-paginator',
  styleUrls: ['./activities-table-paginator.component.scss'],
  templateUrl: './activities-table-paginator.component.html'
})
export class ActivitiesTablePaginatorComponent implements MatPaginatorIntl, OnInit {

  @Input() pageSizeOptions = [10, 50, 100];
  @Input() length = 0;

  @Output() paginationSet = new EventEmitter<{pageIndex: number, pageSize: number}>();

  pageIndex = 0;
  pageSize = this.pageSizeOptions[0] ?? 10;

  changes = new Subject<void>();

  firstPageLabel = $localize`First page`;
  itemsPerPageLabel = $localize`Items per page:`;
  lastPageLabel = $localize`Last page`;
  nextPageLabel = $localize`Next page`;
  previousPageLabel = $localize`Previous page`;

  ngOnInit() {
    this.emit();
  }

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return $localize`Page 1 of 1`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return $localize`Page ${page + 1} of ${amountPages}`;
  }

  pageSet($e: PageEvent) {
    if ($e.pageSize !== this.pageSize) {
      this.pageSize = $e.pageSize;
      this.pageIndex = 0;
    } else {
      this.pageIndex = $e.pageIndex
    }

    this.emit();
  }

  valueChange($e) {
    console.log('value change: ', $e)
  }

  public emit() {
    this.paginationSet.emit({pageIndex: this.pageIndex, pageSize: this.pageSize});
  }
}
