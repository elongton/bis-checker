import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appButton]',
})
export class ButtonDirective implements OnInit {

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @Input() margin = '';
  ngOnInit() {
    this.applyBaseStyles();
  }

  private applyBaseStyles() {
    // 1) Hard reset of UA styles (keeps direction/unicode-bidi)
    this.setStyle('all', 'unset');
    this.setStyle('appearance', 'none'); // Safari
    this.setStyle('-webkit-appearance', 'none');
    this.setStyle('margin', this.margin || '0'); // allow margin override

    // 2) Base “button-like” layout
    this.setStyle('display', 'inline-flex');
    this.setStyle('align-items', 'center');
    this.setStyle('justify-content', 'center');
    this.setStyle('gap', '.5rem');

    // 3) Visuals
    // this.setStyle('background-color', this.bg);
    // this.setStyle('color', this.text);
    // this.setStyle('padding', this.padding);
    // this.setStyle('border-radius', this.radius);
    this.setStyle('border', '1px solid transparent');
    // this.setStyle('box-shadow', this.shadow);
    this.setStyle('text-decoration', 'none'); // removes <a> underline
    this.setStyle('font', 'inherit'); // inherit family/size
    // this.setStyle('font-weight', this.fontWeight);
    this.setStyle('line-height', '1'); // compact button look
    this.setStyle('cursor', 'pointer');
    this.setStyle('transition', 'background-color .18s ease, box-shadow .18s ease, transform .02s ease');

  }

  private setStyle(prop: string, value: string) {
    this.renderer.setStyle(this.el.nativeElement, prop, value);
  }

}
