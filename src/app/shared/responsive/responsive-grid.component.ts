import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getGridClasses()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    /* Grid responsivo mejorado */
    .responsive-grid {
      display: grid;
      gap: var(--grid-gap, 20px);
      width: 100%;
    }

    /* Grids específicos */
    .grid-auto-fit {
      grid-template-columns: repeat(auto-fit, minmax(var(--min-width, 280px), 1fr));
    }

    .grid-auto-fill {
      grid-template-columns: repeat(auto-fill, minmax(var(--min-width, 280px), 1fr));
    }

    .grid-fixed {
      grid-template-columns: repeat(var(--columns, 3), 1fr);
    }

    /* Breakpoints responsivos */
    @media (max-width: 1200px) {
      .grid-fixed {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 992px) {
      .grid-fixed {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .grid-auto-fit,
      .grid-auto-fill {
        --min-width: 250px;
      }
    }

    @media (max-width: 768px) {
      .responsive-grid {
        --grid-gap: 16px;
      }
      
      .grid-fixed {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .grid-auto-fit,
      .grid-auto-fill {
        --min-width: 220px;
      }
    }

    @media (max-width: 576px) {
      .responsive-grid {
        --grid-gap: 12px;
      }
      
      .grid-fixed {
        grid-template-columns: 1fr;
      }
      
      .grid-auto-fit,
      .grid-auto-fill {
        --min-width: 100%;
        grid-template-columns: 1fr;
      }
    }

    /* Variantes de espaciado */
    .gap-small {
      --grid-gap: 12px;
    }

    .gap-medium {
      --grid-gap: 20px;
    }

    .gap-large {
      --grid-gap: 32px;
    }

    /* Variantes de ancho mínimo */
    .min-width-small {
      --min-width: 200px;
    }

    .min-width-medium {
      --min-width: 280px;
    }

    .min-width-large {
      --min-width: 350px;
    }
  `]
})
export class ResponsiveGridComponent {
  @Input() type: 'auto-fit' | 'auto-fill' | 'fixed' = 'auto-fit';
  @Input() gap: 'small' | 'medium' | 'large' = 'medium';
  @Input() minWidth: 'small' | 'medium' | 'large' = 'medium';
  @Input() columns?: number;

  getGridClasses(): string {
    const classes = ['responsive-grid'];
    
    // Tipo de grid
    classes.push(`grid-${this.type}`);
    
    // Espaciado
    classes.push(`gap-${this.gap}`);
    
    // Ancho mínimo
    classes.push(`min-width-${this.minWidth}`);
    
    return classes.join(' ');
  }
}
