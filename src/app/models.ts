export type SlotName =
  | 'HeadSlot' | 'NeckSlot' | 'ShoulderSlot' | 'BackSlot' | 'ChestSlot'
  | 'WristSlot' | 'HandsSlot' | 'WaistSlot' | 'LegsSlot' | 'FeetSlot'
  | 'Finger0Slot' | 'Finger1Slot' | 'Trinket0Slot' | 'Trinket1Slot'
  | 'MainHandSlot' | 'SecondaryHandSlot' | 'TwoHandSlot' | 'RangedSlot';

export interface ItemRef { id: number; name: string; }

export type SpecBlock = Partial<Record<SlotName, ItemRef[]>>;
export type ClassBlock = Record<string, SpecBlock>;
export type GearLibrary = Record<string, ClassBlock>;
