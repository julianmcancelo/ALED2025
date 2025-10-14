import { Injectable } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: ToastMessage[] = [];
  private toastCounter = 0;

  getToasts(): ToastMessage[] {
    return this.toasts;
  }

  show(toast: Omit<ToastMessage, 'id'>): void {
    const id = `toast-${++this.toastCounter}`;
    const duration = toast.duration || 4000;
    
    const newToast: ToastMessage = {
      ...toast,
      id,
      icon: toast.icon || this.getDefaultIcon(toast.type)
    };

    this.toasts.push(newToast);

    // Auto-remove después del duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  clear(): void {
    this.toasts = [];
  }

  // Métodos de conveniencia
  success(title: string, message: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  private getDefaultIcon(type: string): string {
    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    return icons[type as keyof typeof icons] || 'bi-info-circle-fill';
  }
}
