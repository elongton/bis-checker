import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: 'td[appParseColor]',
})
export class ParseColorDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(private el: ElementRef<HTMLTableCellElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    // Initial apply
    this.applyFromText();

    // Watch for text/content changes inside the <td>
    this.observer = new MutationObserver(() => this.applyFromText());
    this.observer.observe(this.el.nativeElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private applyFromText(): void {
    const raw = this.el.nativeElement.textContent ?? '';
    const val = this.toNumber(raw);

    const color = this.pickColor(val);
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
  }

  /** Extracts the first numeric value from arbitrary cell text. */
  private toNumber(text: string): number | null {
    // Keep digits, optional leading minus, and decimal points; take the *first* number found.
    const match = text.match(/-?\d+(\.\d+)?/);
    if (!match) return null;

    const n = parseFloat(match[0]);
    return Number.isFinite(n) ? n : null;
  }

  /** Maps value to color per your ranges. */
  private pickColor(val: number | null): string {
    // Fallback (no/invalid number): use common gray
    if (val === null) return '#666';

    // If you want to clamp into 0–99, uncomment the next line:
    // val = Math.max(0, Math.min(99, val));

    // astounding: exactly 99
    if (val === 99) return '#e268a8';

    // legendary: 95–98
    if (val >= 95 && val <= 98) return '#ff8000';

    // epic: 75–94
    if (val >= 75 && val <= 94) return '#a335ee';

    // rare: 50–74
    if (val >= 50 && val <= 74) return '#0070ff';

    // uncommon: 30–49
    if (val >= 30 && val <= 49) return '#1eff00';

    // common: 0–29 (and anything else)
    return '#666';
  }
}
