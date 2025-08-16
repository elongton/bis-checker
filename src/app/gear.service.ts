import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GearLibrary, ClassBlock, SpecBlock, SlotName, ItemRef } from './models';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

const STORAGE_KEY = 'classic-bis-library';

@Injectable({ providedIn: 'root' })
export class GearService {
  private subject = new BehaviorSubject<GearLibrary>({} as GearLibrary);
  library$ = this.subject.asObservable();
  private currentLib?: GearLibrary;
  private pristineLib?: GearLibrary;

  
  private getHeaders() {
    const userString = localStorage.getItem('discord_user');
    return new HttpHeaders({ 'x-discord-username': (userString ? JSON.parse(userString).username : null) || 'unknown' });
  }
constructor(private http: HttpClient) {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.http.get<GearLibrary>('/api/gear', { headers: this.getHeaders() }).subscribe({
      next: (lib) => {
        this.currentLib = JSON.parse(JSON.stringify(lib));
        this.pristineLib = JSON.parse(JSON.stringify(lib));
        if (this.currentLib) this.subject.next(this.currentLib);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentLib));
      },
      error: () => {
        if (saved) {
          this.currentLib = JSON.parse(saved);
          this.pristineLib = JSON.parse(saved);
          if (this.currentLib) this.subject.next(this.currentLib);
        } else {
          this.currentLib = {} as GearLibrary;
          this.pristineLib = {} as GearLibrary;
          if (this.currentLib) this.subject.next(this.currentLib);
        }
      }
    });
  }

  getLibrary() { return this.library$; }
  getClasses() { return this.library$.pipe(map(lib => Object.keys(lib).sort())); }
  getSpecsForClass(cls: string) { return this.library$.pipe(map(lib => lib[cls] ? Object.keys(lib[cls]).sort() : [])); }
  getSpecBlock(cls: string, spec: string) { return this.library$.pipe(map(lib => (lib[cls] && (lib[cls] as ClassBlock)[spec]) as SpecBlock)); }

  /** Get a snapshot of a spec from current/pristine */
  getCurrentSpec(cls: string, spec: string): SpecBlock | undefined {
    return this.currentLib?.[cls]?.[spec] as SpecBlock | undefined;
  }
  getPristineSpec(cls: string, spec: string): SpecBlock | undefined {
    return this.pristineLib?.[cls]?.[spec] as SpecBlock | undefined;
  }

  /** Shallow JSON compare for spec slice */
  isSpecDirty(cls: string, spec: string): boolean {
    const a = this.getCurrentSpec(cls, spec);
    const b = this.getPristineSpec(cls, spec);
    if (!a && !b) return false;
    try {
      return JSON.stringify(a) !== JSON.stringify(b);
    } catch {
      return true;
    }
  }

  mutateSlot(cls: string, spec: string, slot: SlotName, items: ItemRef[]) {
    if (!this.currentLib) return;
    (this.currentLib[cls][spec] as SpecBlock)[slot] = items;
    if (this.currentLib) this.subject.next(this.currentLib);
  }

  // Save only a specific spec slice, POST to /gear/:cls/:spec
  async saveSpec(cls: string, spec: string) {
    if (!this.currentLib) return;
    const slice = (this.currentLib[cls]?.[spec]) as SpecBlock;
    if (!slice) return;
    try {
      await this.http.post(`/gear/${encodeURIComponent(cls)}/${encodeURIComponent(spec)}`, slice, { headers: this.getHeaders() }).toPromise();
      // Update pristine copy locally after successful POST
      this.pristineLib = JSON.parse(JSON.stringify(this.currentLib));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentLib));
    } catch (e) {
      console.error('Save failed, keeping changes locally only.');
    }
  }

    // Save only a specific spec slice, POST to /gear/:cls/:spec
  async saveAll() {
    if (!this.currentLib) return;
    const slice = (this.currentLib);
    if (!slice) return;
    try {
      await this.http.put(`/api/gear`, slice, { headers: this.getHeaders() }).toPromise();
      // Update pristine copy locally after successful POST
      this.pristineLib = JSON.parse(JSON.stringify(this.currentLib));
    } catch (e) {
      console.error('Save failed, keeping changes locally only.');
    }
  }

  cancel() {
    if (!this.pristineLib) return;
    this.currentLib = JSON.parse(JSON.stringify(this.pristineLib));
    if (this.currentLib) this.subject.next(this.currentLib);
  }

  static slotOrder: SlotName[] = [
    'HeadSlot','NeckSlot','ShoulderSlot','BackSlot','ChestSlot','WristSlot','HandsSlot','WaistSlot',
    'LegsSlot','FeetSlot','Finger0Slot','Finger1Slot','Trinket0Slot','Trinket1Slot',
    'MainHandSlot','SecondaryHandSlot','TwoHandSlot','RangedSlot'
  ];

  static slotLabel(slot: SlotName) {
    const label = slot.replace(/(0|1)Slot$/, ' Slot').replace(/([A-Z])/g, ' $1').trim();
    return label.replace('Two Hand Slot','Two-Hand').replace('Main Hand Slot','Main Hand')
                .replace('Secondary Hand Slot','Off Hand').replace('Ranged Slot','Ranged');
  }

  static wowheadUrl(id: number) { return `https://www.wowhead.com/classic/item=${id}`; }
}
