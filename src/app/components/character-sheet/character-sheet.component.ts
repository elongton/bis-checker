import { Component, Input, OnInit } from "@angular/core";
import { GearService } from "src/app/gear.service";
import { GearItem, Player } from "src/app/player-detail/player-detail.component";

@Component({
  selector: "character-sheet",
  templateUrl: "./character-sheet.component.html",
  styleUrl: "./character-sheet.component.scss",
})
export class CharacterSheetComponent implements OnInit {
  wowhead = GearService.wowheadUrl;
  @Input() player: Player | null = null;
  bisList: any | null = null;
  constructor(private gearService: GearService) {}

  ngOnInit(): void {
    this.gearService.getLibrary().subscribe((lib) => {
      this.bisList = lib;
    });
  }

  getBisListItems(slotName: string): any {
    if (!this.bisList || !this.player) {
      return [];
    }
    const bisList = this.bisList[this.player.class]?.[this.player.spec]?.[slotName] || [];
    return bisList
  }
}

@Component({
  selector: "slot-component",
  template: `
    <div *ngIf="position == 'left' || position == 'bottom'" class="frame iron" id="head-slot">
      <gear-image [itemId]="slot?.[0]?.id" />
    </div>
    <div
      class="gear-options"
      [style.padding]= "position == 'right' || position == 'left' ? '5px' : '5px 0'"
      [style.textAlign]="position == 'right' ? 'right' : 'left'"
    >
      <div *ngFor="let item of slot">
        <span *ngIf="isHardBis(item)" class="hard-bis-indicator" title="Hard BiS">★</span>
        <span *ngIf="isSoftBis(item) && !isHardBis(item)" class="soft-bis-indicator" title="Soft BiS">★</span>
        <a [href]="wowhead(item.id)" target="_blank">{{ item.name }}</a>
      </div>
    </div>
    <div *ngIf="position == 'right'" class="frame iron" id="head-slot">
      <gear-image [itemId]="slot?.[0]?.id" />
    </div>
  `,
  styleUrl: "./character-sheet.component.scss",
})
export class SlotComponent {
  wowhead = GearService.wowheadUrl;
  @Input() slot: GearItem[] | null = null;
  @Input() position: 'left' | 'right' | 'bottom' = 'left';
  @Input() bisListItems: any | null = null;
  constructor() {}

  isSoftBis(item: GearItem): boolean {
    if (!this.bisListItems || !this.bisListItems.SOFT_BIS) return false;
    return this.bisListItems.SOFT_BIS.some((bisItem: GearItem) => bisItem.id === item.id);
  }
  isHardBis(item: GearItem): boolean {
    if (!this.bisListItems || !this.bisListItems.HARD_BIS) return false;
    return this.bisListItems.HARD_BIS.some((bisItem: GearItem) => bisItem.id === item.id);
  }
}
