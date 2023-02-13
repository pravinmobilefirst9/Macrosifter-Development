import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SelectSearchInput {
  key: string | number;
  value: string | number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ms-select-search',
  styleUrls: ['./select-search.component.scss'],
  templateUrl: './select-search.component.html'
})
export class SelectSearchComponent implements OnChanges, OnDestroy {
  @Input() allFilters: SelectSearchInput[];
  @Input() selectedKey: string | number;
  @Input() isLoading: boolean;
  @Input() placeholder: string;
  @Input() showSearchIcon = false;

  @Output() valueChanged = new EventEmitter<SelectSearchInput>();

  @ViewChild('autocomplete') matAutocomplete: MatAutocomplete;
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  public filters$: Subject<SelectSearchInput[]> = new BehaviorSubject([]);
  public filters: Observable<SelectSearchInput[]> = this.filters$.asObservable();
  public searchControl = new FormControl<SelectSearchInput | string>(undefined);
  public selectedFilter: SelectSearchInput;

  private unsubscribeSubject = new Subject<void>();

  public constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((filterOrSearchTerm) => {
        if (filterOrSearchTerm) {
          const searchTerm = filterOrSearchTerm?.toString();
          this.filters$.next(this.getFilters(searchTerm));
        } else {
          this.filters$.next(this.getFilters());
        }
      });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.selectedKey) {
      this.selectedFilter = this.allFilters.find(f => f.key === this.selectedKey);
      this.updateFilters();
    }

    if (changes.allFilters?.currentValue) {
      this.updateFilters();
    }

  }

  public onSelectFilter(event: MatAutocompleteSelectedEvent): void {
    this.selectedFilter = this.allFilters.find((filter) => {
        return filter.key === event.option.value;
      })
    this.updateFilters();
    this.searchInput.nativeElement.value = '';
    this.searchControl.setValue(undefined);
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  private getFilters(searchTerm?: string) {
    const filtersMap = this.allFilters
        .filter((filter) => // Filter selected filters
          this.selectedFilter?.key !== filter.key
        ).filter((filter) => {
          if (searchTerm) {
            // Filter by search term
            return filter.value
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          }

          return filter;
        })

    return filtersMap;
  }

  private updateFilters() {
    this.filters$.next(this.getFilters());

    // Emit an array with a new reference
    this.valueChanged.emit(this.selectedFilter);
  }

  public onRemoveFilter(): void {
    this.selectedFilter = undefined;

    this.updateFilters();
  }
}
