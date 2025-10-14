import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface SearchSuggestion {
  id: string;
  title: string;
  category?: string;
  type: 'product' | 'category' | 'recent';
}

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container" [class.focused]="isFocused">
      <div class="search-input-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text"
          class="search-input"
          [placeholder]="placeholder"
          [(ngModel)]="searchQuery"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (input)="onInput($event)"
          (keydown)="onKeyDown($event)"
          #searchInput
        >
        <button 
          *ngIf="searchQuery" 
          class="clear-btn"
          (click)="clearSearch()"
          type="button"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>

      <!-- Sugerencias -->
      <div class="suggestions-dropdown" *ngIf="showSuggestions && suggestions.length > 0">
        <div class="suggestions-header">
          <span>Sugerencias</span>
          <small>{{ suggestions.length }} resultados</small>
        </div>
        
        <div class="suggestions-list">
          <div 
            *ngFor="let suggestion of suggestions; let i = index"
            class="suggestion-item"
            [class.highlighted]="i === highlightedIndex"
            (click)="selectSuggestion(suggestion)"
            (mouseenter)="highlightedIndex = i"
          >
            <div class="suggestion-icon">
              <i [class]="getSuggestionIcon(suggestion.type)"></i>
            </div>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-category" *ngIf="suggestion.category">
                {{ suggestion.category }}
              </div>
            </div>
            <div class="suggestion-type">
              <span class="type-badge" [class]="'type-' + suggestion.type">
                {{ getTypeLabel(suggestion.type) }}
              </span>
            </div>
          </div>
        </div>

        <div class="suggestions-footer" *ngIf="searchQuery">
          <button class="search-all-btn" (click)="searchAll()">
            <i class="bi bi-search"></i>
            Buscar "{{ searchQuery }}" en todos los productos
          </button>
        </div>
      </div>

      <!-- Overlay -->
      <div class="search-overlay" *ngIf="showSuggestions" (click)="hideSuggestions()"></div>
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
      max-width: 400px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      background: white;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #0077b6;
      box-shadow: 0 0 0 4px rgba(0, 119, 182, 0.1);
    }

    .search-container.focused .search-input {
      border-radius: 12px 12px 0 0;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #64748b;
      font-size: 16px;
      z-index: 1;
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .clear-btn:hover {
      background: #f1f5f9;
      color: #374151;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #0077b6;
      border-top: none;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 400px;
      overflow: hidden;
    }

    .suggestions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .suggestions-list {
      max-height: 280px;
      overflow-y: auto;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f1f5f9;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background: #f8fafc;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-icon {
      width: 36px;
      height: 36px;
      background: #f1f5f9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: #64748b;
    }

    .suggestion-content {
      flex: 1;
      min-width: 0;
    }

    .suggestion-title {
      font-weight: 500;
      color: #1e293b;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .suggestion-category {
      font-size: 12px;
      color: #64748b;
    }

    .type-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .type-product {
      background: #dbeafe;
      color: #1e40af;
    }

    .type-category {
      background: #dcfce7;
      color: #166534;
    }

    .type-recent {
      background: #fef3c7;
      color: #92400e;
    }

    .suggestions-footer {
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .search-all-btn {
      width: 100%;
      background: #0077b6;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .search-all-btn:hover {
      background: #005f8a;
    }

    .search-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .search-container {
        max-width: 100%;
      }

      .suggestions-dropdown {
        max-height: 300px;
      }

      .suggestions-list {
        max-height: 200px;
      }
    }
  `]
})
export class SmartSearchComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Buscar productos...';
  @Input() suggestions: SearchSuggestion[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() suggestionSelected = new EventEmitter<SearchSuggestion>();
  @Output() queryChange = new EventEmitter<string>();

  searchQuery = '';
  isFocused = false;
  showSuggestions = false;
  highlightedIndex = -1;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.queryChange.emit(query);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFocus(): void {
    this.isFocused = true;
    this.showSuggestions = true;
  }

  onBlur(): void {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      this.isFocused = false;
      this.showSuggestions = false;
      this.highlightedIndex = -1;
    }, 200);
  }

  onInput(event: any): void {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.showSuggestions = query.length > 0;
    this.highlightedIndex = -1;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions || this.suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.highlightedIndex]);
        } else {
          this.searchAll();
        }
        break;
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchQuery = suggestion.title;
    this.hideSuggestions();
    this.suggestionSelected.emit(suggestion);
  }

  searchAll(): void {
    this.hideSuggestions();
    this.search.emit(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.hideSuggestions();
  }

  hideSuggestions(): void {
    this.showSuggestions = false;
    this.highlightedIndex = -1;
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'product': return 'bi bi-box-seam';
      case 'category': return 'bi bi-grid';
      case 'recent': return 'bi bi-clock-history';
      default: return 'bi bi-search';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'product': return 'Producto';
      case 'category': return 'Categoría';
      case 'recent': return 'Reciente';
      default: return '';
    }
  }
}
