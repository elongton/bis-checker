import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GearService } from '../../gear.service';
import { SpecBlock, SlotName, ItemRef } from '../../models';
import { BlizzardService, ItemResult } from '../../blizzard.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';

interface Row { slot: SlotName; items: ItemRef[]; }

@Component({
  selector: 'app-spec-detail',
  templateUrl: './spec-detail.component.html',
  styleUrls: ['./spec-detail.component.css']
})
export class SpecDetailComponent implements OnChanges {
  @Input() cls = '';
  @Input() spec = '';
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
  busy: Record<string, boolean> = {};
  error: Record<string, string> = {};

  constructor(private gear: GearService, private blizz: BlizzardService) {}

  ngOnChanges(_: SimpleChanges) {
    const order = this.slotOrder.filter(s => this.specBlock && this.specBlock[s as SlotName]);
    this.rows = order.map(slot => ({ slot: slot as SlotName, items: this.specBlock[slot as SlotName] as ItemRef[] }));
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
  cancelEdit(slot: SlotName, idx: number) {
    const k = this.key(slot, idx);
    delete this.editing[k];
    delete this.editId[k];
    delete this.error[k];
    delete this.busy[k];
  }
  async confirmEdit(slot: SlotName, idx: number) {
    const k = this.key(slot, idx);
    const idNum = parseInt(this.editId[k], 10);
    if (!idNum) { this.error[k] = 'Enter a valid item ID.'; return; }
    this.busy[k] = true; this.error[k] = '';
    try {
      const item: ItemResult = await firstValueFrom(this.blizz.getItem(idNum));
      if (!item?.id || !item?.name) throw new Error('Item not found');
      const arr = this.specBlock[slot] as ItemRef[];
      arr[idx] = { id: item.id, name: item.name };
      this.gear.mutateSlot(this.cls, this.spec, slot, arr);
      this.cancelEdit(slot, idx);
    } catch (e:any) {
      this.error[k] = 'Lookup failed. Check the ID.';
    } finally {
      this.busy[k] = false;
    }
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
    delete this.busy[k];
  }
  async confirmAdd(slot: SlotName) {
    const k = this.addKey(slot);
    const idNum = parseInt(this.editId[k], 10);
    if (!idNum) { this.error[k] = 'Enter a valid item ID.'; return; }
    this.busy[k] = true; this.error[k] = '';
    try {
      const item: ItemResult = await firstValueFrom(this.blizz.getItem(idNum));
      if (!item?.id || !item?.name) throw new Error('Item not found');
      const arr = this.specBlock[slot] as ItemRef[];
      arr.push({ id: item.id, name: item.name });
      this.gear.mutateSlot(this.cls, this.spec, slot, arr);
      this.cancelAdd(slot);
    } catch (e:any) {
      this.error[k] = 'Lookup failed. Check the ID.';
    } finally {
      this.busy[k] = false;
    }
  }

  // DnD / remove
  dropped(slot: SlotName, event: CdkDragDrop<ItemRef[]>) {
    const arr = this.specBlock[slot] as ItemRef[];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.gear.mutateSlot(this.cls, this.spec, slot, arr);
  }
  remove(slot: SlotName, idx: number) {
    const arr = this.specBlock[slot] as ItemRef[];
    arr.splice(idx, 1);
    this.gear.mutateSlot(this.cls, this.spec, slot, arr);
  }

  trackByRow = (_: number, r: Row) => r.slot;
  trackByItem = (_: number, it: ItemRef) => it.id + ':' + it.name;
}
