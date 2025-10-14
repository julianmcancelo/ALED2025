import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SimpleFilters {
  categoria?: string;
  precioMin?: number;
  precioMax?: number;
  ordenarPor?: string;
  busqueda?: string;
}

@Component({
  selector: 'app-simple-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-card">
      <div class="filters-header">
        <h4><i class="bi bi-funnel"></i> Filtros</h4>
        <button class="btn-clear" (click)="clearAll()" *ngIf="hasFilters()">
          <i class="bi bi-x-circle"></i> Limpiar
        </button>
      </div>

      <div class="filter-group">
        <label>Buscar:</label>
        <input 
          type="text" 
          class="form-control"
          placeholder="Nombre del producto..."
          [(ngModel)]="filters.busqueda"
          (input)="onChange()"
        >
      </div>

      <div class="filter-group">
        <label>Categoría:</label>
        <select class="form-control" [(ngModel)]="filters.categoria" (change)="onChange()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let cat of categorias" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Precio:</label>
        <div class="price-inputs">
          <input 
            type="number" 
            class="form-control"
            placeholder="Mín"
            [(ngModel)]="filters.precioMin"
            (input)="onChange()"
          >
          <span>-</span>
          <input 
            type="number" 
            class="form-control"
            placeholder="Máx"
            [(ngModel)]="filters.precioMax"
            (input)="onChange()"
          >
        </div>
      </div>

      <div class="filter-group">
        <label>Ordenar por:</label>
        <select class="form-control" [(ngModel)]="filters.ordenarPor" (change)="onChange()">
          <option value="">Relevancia</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre-asc">Nombre: A-Z</option>
          <option value="nombre-desc">Nombre: Z-A</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .filters-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .filters-header h4 {
      margin: 0;
      color: #333;
      font-size: 16px;
    }

    .btn-clear {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #6c757d;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-clear:hover {
      background: #e9ecef;
    }

    .filter-group {
      margin-bottom: 15px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #0077b6;
      box-shadow: 0 0 0 2px rgba(0,119,182,0.2);
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .price-inputs input {
      flex: 1;
    }

    .price-inputs span {
      color: #666;
      font-weight: 500;
    }
  `]
})
export class SimpleFiltersComponent {
  @Input() categorias: string[] = [];
  @Output() filtersChange = new EventEmitter<SimpleFilters>();

  filters: SimpleFilters = {};

  onChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }

  clearAll(): void {
    this.filters = {};
    this.onChange();
  }

  hasFilters(): boolean {
    return !!(
      this.filters.busqueda ||
      this.filters.categoria ||
      this.filters.precioMin ||
      this.filters.precioMax ||
      this.filters.ordenarPor
    );
  }
}
