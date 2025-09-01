import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GearService } from '../../gear.service';
import { SpecBlock, SlotName, ItemRef } from '../../models';
import { BlizzardService, ItemResult } from '../../blizzard.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { firstValueFrom, from } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { GearItem } from 'src/app/player-detail/player-detail.component';

interface Row { slot: SlotName; SOFT_BIS: ItemRef[] | undefined; HARD_BIS: ItemRef[] | undefined }

@Component({
  selector: 'app-spec-detail',
  templateUrl: './spec-detail.component.html',
  styleUrls: ['./spec-detail.component.css']
})
export class SpecDetailComponent implements OnChanges, OnInit {
  cls: string | null = null;
  spec: string | null = null;
  @Input() specBlock!: SpecBlock;
  @Input() editMode = false;

  slotOrder = GearService.slotOrder;
  slotLabel = GearService.slotLabel;
  wowhead = GearService.wowheadUrl;

  rows: Row[] = [];

  // Add/Edit by Item ID
  editId: Record<string, string> = {};   // key -> text input
  editing: Record<string, boolean> = {};
  adding: Partial<Record<SlotName, boolean>> = {};
  error: Record<string, string> = {};

  constructor(private gear: GearService, private blizz: BlizzardService, private route: ActivatedRoute,) { }


  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.cls = params.get('cls');
      this.spec = params.get('spec');
    })
  }

  ngOnChanges(_: SimpleChanges) {
    const order = this.slotOrder.filter(s => this.specBlock && this.specBlock[s as SlotName]);
    this.rows = order.map(slot => ({ slot: slot as SlotName, HARD_BIS: this.specBlock[slot as SlotName]?.HARD_BIS, SOFT_BIS: this.specBlock[slot as SlotName]?.SOFT_BIS }));
  }

  key(slot: SlotName, idx: number) { return slot + ':' + idx; }
  addKey(slot: SlotName) { return 'add:' + slot; }

  // ----- Edit existing -----
  startEdit(slot: SlotName, idx: number) {
    const k = this.key(slot, idx);
    this.editing[k] = true;
    this.editId[k] = '';
    this.error[k] = '';
  }

  // ----- Add new -----
  startAdd(slot: SlotName) {
    this.adding[slot] = true;
    const k = this.addKey(slot);
    this.editId[k] = '';
    this.error[k] = '';
  }
  cancelAdd(slot: SlotName) {
    const k = this.addKey(slot);
    delete this.adding[slot];
    delete this.editId[k];
    delete this.error[k];
  }
  async confirmAdd(slot: SlotName) {
    const k = this.addKey(slot);
    // if (!idNum) { this.error[k] = 'Enter a valid item ID.'; return; }
    const ids = this.editId[k].split(',')
      .map(id => id.trim())
      .filter(id => id)
      .map(id => parseInt(id, 10))

    ids.forEach(async (idNum) => {
      try {
        const item: ItemResult = await firstValueFrom(this.blizz.getItem(idNum));
        if (!item?.id || !item?.name) throw new Error('Item not found');
        const arr = this.specBlock[slot]?.SOFT_BIS as ItemRef[];
        arr.push({ id: item.id, name: item.name });
        this.gear.mutateSlot(this.cls, this.spec, slot, this.specBlock[slot]!);
      } catch (e: any) {
        this.error[k] = 'Lookup failed. Check the ID.';
      }
    })
    this.cancelAdd(slot);
  }


  onDrop(event: CdkDragDrop<GearItem[]>) {
    if (!event.container || !event.previousContainer) return;
    const [toSlotName, toSection] = (event.container.id || '').split('__') as [SlotName, 'HARD_BIS' | 'SOFT_BIS'];
    const [fromSlotName, fromSection] = (event.previousContainer.id || '').split('__') as [SlotName, 'HARD_BIS' | 'SOFT_BIS'];
    const toList = event.container.data as GearItem[];
    const fromList = event.previousContainer.data as GearItem[];
    if (event.previousContainer === event.container) {
      moveItemInArray(toList, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(fromList, toList, event.previousIndex, event.currentIndex);
    }
    this.gear.mutateSlot(this.cls, this.spec, toSlotName, this.specBlock[toSlotName]!);
  }


  remove(slot: SlotName, type: 'HARD_BIS' | 'SOFT_BIS', idx: number) {
    const arr = this.specBlock[slot]![type];
    arr.splice(idx, 1);
    this.gear.mutateSlot(this.cls, this.spec, slot, this.specBlock[slot]!);
  }

  trackByRow = (_: number, r: Row) => r.slot;
  trackByItem = (_: number, it: ItemRef) => it.id + ':' + it.name;
}
