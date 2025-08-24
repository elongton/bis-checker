import { Component, Input, OnInit } from "@angular/core";
import { GearService } from "src/app/gear.service";
import { Item, Player } from "src/app/player-detail/player.component";

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
    return this.bisList[this.player.class]?.[this.player.spec]?.[slotName] || [];
  }
}

@Component({
  selector: "slot-component",
  template: `
    <div *ngIf="!right" class="frame iron" id="head-slot">
      <gear-image [itemId]="slot?.[0]?.id" />
    </div>
    <div
      class="gear-options"
      style="padding: 5px;"
      [style.textAlign]="right ? 'right' : 'left'"
    >
      <div *ngFor="let item of slot">
        <span *ngIf="isHardBis(item)" class="hard-bis-indicator" title="Hard BiS">★</span>
        <span *ngIf="isSoftBis(item) && !isHardBis(item)" class="soft-bis-indicator" title="Soft BiS">★</span>
        <a [href]="wowhead(item.id)" target="_blank">{{ item.name }}</a>
      </div>
    </div>
    <div *ngIf="right" class="frame iron" id="head-slot">
      <gear-image [itemId]="slot?.[0]?.id" />
    </div>
  `,
  styleUrl: "./character-sheet.component.scss",
})
export class SlotComponent {
  wowhead = GearService.wowheadUrl;
  @Input() slot: Item[] | null = null;
  @Input() right: boolean = false;
  @Input() bisListItems: any | null = null;
  constructor() {}

  isSoftBis(item: Item): boolean {
    if (!this.bisListItems) return false;
    return this.bisListItems.some((bisItem: Item) => bisItem.id === item.id);
  }
  isHardBis(item: Item): boolean {
    if (!this.bisListItems || this.bisListItems.length == 0) return false;
    return this.bisListItems[0].id === item.id;
  }
}
