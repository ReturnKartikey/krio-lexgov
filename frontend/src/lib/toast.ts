export type ToastType = "success" | "error" | "info" | "loading";

export interface ToastOptions {
  description?: string;
  duration?: number; // ms
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private maxToasts = 4;

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(type: ToastType, title: string, options?: ToastOptions): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = options?.duration ?? (type === "loading" ? 10000 : 3500);

    const newToast: ToastItem = {
      id,
      type,
      title,
      description: options?.description,
      duration,
      createdAt: Date.now(),
    };

    // Keep at most maxToasts
    this.toasts = [newToast, ...this.toasts.slice(0, this.maxToasts - 1)];
    this.notify();

    if (duration > 0 && type !== "loading") {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(title: string, description?: string, options?: Omit<ToastOptions, "description">): string {
    return this.show("success", title, { ...options, description });
  }

  info(title: string, description?: string, options?: Omit<ToastOptions, "description">): string {
    return this.show("info", title, { ...options, description });
  }

  error(title: string, description?: string, options?: Omit<ToastOptions, "description">): string {
    return this.show("error", title, { ...options, description, duration: options?.duration ?? 4500 });
  }

  loading(title: string, description?: string, options?: Omit<ToastOptions, "description">): string {
    return this.show("loading", title, { ...options, description });
  }

  dismiss(id: string) {
    const prevLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== prevLen) {
      this.notify();
    }
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toast = new ToastManager();
