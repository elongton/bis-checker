export type SlotName =
  | 'HEAD' | 'NECK' | 'SHOULDER' | 'BACK' | 'CHEST'
  | 'WRIST' | 'HANDS' | 'WAIST' | 'LEGS' | 'FEET'
  | 'FINGER_1' | 'FINGER_2' | 'TRINKET_1' | 'TRINKET_2'
  | 'MAIN_HAND' | 'OFF_HAND' | 'RANGED';


export interface ItemRef { id: number; name: string; }

export type ItemLists = {SOFT_BIS: ItemRef[], HARD_BIS: ItemRef[]}
export type SpecBlock = Partial<Record<SlotName, ItemLists>>;
export type ClassBlock = Record<string, SpecBlock>;
export type GearLibrary = Record<string, ClassBlock>;
