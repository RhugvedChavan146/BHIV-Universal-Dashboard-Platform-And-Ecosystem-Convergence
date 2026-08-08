import type { ProductLayout } from "./types";

function layoutKey(product: string, id: string): string {
  return `${product}:${id}`;
}

/**
 * Registry of named per-product dashboard layouts. A layout is just an
 * ordered list of widget-id references (`ProductLayout.zones`) — no
 * component imports live here, so registering a layout never forces its
 * widgets to load.
 */
export class ProductLayoutRegistry {
  private layouts: Map<string, ProductLayout> = new Map();

  public register(layout: ProductLayout): void {
    this.layouts.set(layoutKey(layout.product, layout.id), layout);
  }

  public registerMany(layouts: ProductLayout[]): void {
    layouts.forEach((layout) => this.register(layout));
  }

  public unregister(product: string, id: string): void {
    this.layouts.delete(layoutKey(product, id));
  }

  public get(product: string, id: string): ProductLayout | undefined {
    return this.layouts.get(layoutKey(product, id));
  }

  public getAllForProduct(product: string): ProductLayout[] {
    return Array.from(this.layouts.values()).filter((layout) => layout.product === product);
  }

  public getAll(): ProductLayout[] {
    return Array.from(this.layouts.values());
  }

  public clear(): void {
    this.layouts.clear();
  }
}

export const globalProductLayoutRegistry = new ProductLayoutRegistry();
