import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-container" *ngIf="totalPages > 1">
      <div class="pagination-info">
        <span class="results-text">
          Mostrando {{ startItem }}-{{ endItem }} de {{ totalItems }} resultados
        </span>
      </div>

      <nav class="pagination-nav">
        <!-- Botón anterior -->
        <button 
          class="pagination-btn prev-btn"
          [disabled]="currentPage === 1"
          (click)="goToPage(currentPage - 1)"
        >
          <i class="bi bi-chevron-left"></i>
          <span class="btn-text">Anterior</span>
        </button>

        <!-- Números de página -->
        <div class="page-numbers">
          <!-- Primera página -->
          <button 
            *ngIf="showFirstPage"
            class="page-btn"
            [class.active]="currentPage === 1"
            (click)="goToPage(1)"
          >
            1
          </button>

          <!-- Dots izquierda -->
          <span *ngIf="showLeftDots" class="dots">...</span>

          <!-- Páginas visibles -->
          <button 
            *ngFor="let page of visiblePages"
            class="page-btn"
            [class.active]="currentPage === page"
            (click)="goToPage(page)"
          >
            {{ page }}
          </button>

          <!-- Dots derecha -->
          <span *ngIf="showRightDots" class="dots">...</span>

          <!-- Última página -->
          <button 
            *ngIf="showLastPage"
            class="page-btn"
            [class.active]="currentPage === totalPages"
            (click)="goToPage(totalPages)"
          >
            {{ totalPages }}
          </button>
        </div>

        <!-- Botón siguiente -->
        <button 
          class="pagination-btn next-btn"
          [disabled]="currentPage === totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          <span class="btn-text">Siguiente</span>
          <i class="bi bi-chevron-right"></i>
        </button>
      </nav>

      <!-- Selector de items por página -->
      <div class="items-per-page" *ngIf="showItemsPerPage">
        <label>Mostrar:</label>
        <select 
          class="items-select"
          [value]="itemsPerPage"
          (change)="onItemsPerPageChange($event)"
        >
          <option *ngFor="let option of itemsPerPageOptions" [value]="option">
            {{ option }}
          </option>
        </select>
        <span>por página</span>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin: 32px 0;
    }

    .pagination-info {
      text-align: center;
    }

    .results-text {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .pagination-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0077b6;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 8px;
    }

    .page-btn {
      width: 40px;
      height: 40px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .page-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0077b6;
    }

    .page-btn.active {
      background: #0077b6;
      border-color: #0077b6;
      color: white;
    }

    .page-btn.active:hover {
      background: #005f8a;
      border-color: #005f8a;
    }

    .dots {
      padding: 0 8px;
      color: #94a3b8;
      font-weight: 500;
    }

    .items-per-page {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #64748b;
    }

    .items-select {
      padding: 6px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 14px;
      cursor: pointer;
    }

    .items-select:focus {
      outline: none;
      border-color: #0077b6;
      box-shadow: 0 0 0 3px rgba(0, 119, 182, 0.1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pagination-container {
        gap: 12px;
      }

      .pagination-nav {
        flex-wrap: wrap;
        justify-content: center;
      }

      .pagination-btn .btn-text {
        display: none;
      }

      .pagination-btn {
        padding: 8px 12px;
      }

      .page-btn {
        width: 36px;
        height: 36px;
        font-size: 13px;
      }

      .items-per-page {
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .pagination-info {
        font-size: 13px;
      }

      .page-numbers {
        gap: 2px;
      }

      .page-btn {
        width: 32px;
        height: 32px;
        font-size: 12px;
      }
    }
  `]
})
export class ModernPaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() itemsPerPage = 12;
  @Input() maxVisiblePages = 5;
  @Input() showItemsPerPage = true;
  @Input() itemsPerPageOptions = [6, 12, 24, 48];

  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  totalPages = 0;
  visiblePages: number[] = [];
  showFirstPage = false;
  showLastPage = false;
  showLeftDots = false;
  showRightDots = false;
  startItem = 0;
  endItem = 0;

  ngOnChanges(): void {
    this.calculatePagination();
  }

  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.calculateVisiblePages();
    this.calculateItemRange();
  }

  private calculateVisiblePages(): void {
    const half = Math.floor(this.maxVisiblePages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.maxVisiblePages - 1);

    // Ajustar el inicio si estamos cerca del final
    if (end - start + 1 < this.maxVisiblePages) {
      start = Math.max(1, end - this.maxVisiblePages + 1);
    }

    this.visiblePages = [];
    for (let i = start; i <= end; i++) {
      this.visiblePages.push(i);
    }

    // Determinar si mostrar primera página, última página y dots
    this.showFirstPage = start > 1;
    this.showLastPage = end < this.totalPages;
    this.showLeftDots = start > 2;
    this.showRightDots = end < this.totalPages - 1;
  }

  private calculateItemRange(): void {
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(event: any): void {
    const newItemsPerPage = parseInt(event.target.value);
    this.itemsPerPageChange.emit(newItemsPerPage);
  }
}
