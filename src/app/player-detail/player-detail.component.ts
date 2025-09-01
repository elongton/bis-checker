import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GearService } from "src/app/gear.service";

export type GearItem = {
  id: number;
  name: string;
};

type Items = {
  WristSlot: GearItem[];
  FingerSlot: GearItem[];
  Trinket0Slot: GearItem[];
  Trinket1Slot: GearItem[];
  BackSlot: GearItem[];
  MainHandSlot: GearItem[];
  SecondaryHandSlot: GearItem[];
  RangedSlot: GearItem[];
  HeadSlot: GearItem[];
  NeckSlot: GearItem[];
  ShoulderSlot: GearItem[];
  ShirtSlot: GearItem[];
  ChestSlot: GearItem[];
  WaistSlot: GearItem[];
  LegsSlot: GearItem[];
  FeetSlot: GearItem[];
};

export interface Player {
  name: string;
  class: string;
  spec: string;
  items: Items;
  lastSeen: string;
  core: boolean;
}

@Component({
  selector: "app-player",
  templateUrl: "./player-detail.component.html",
  styleUrl: "./player-detail.component.scss",
})
export class PlayerDetailComponent implements OnInit {
  player: any = null;
  loading = true;
  error: string | null = null;
  wowhead = GearService.wowheadUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const playerName = this.route.snapshot.paramMap.get("name");
    if (playerName) {
      this.http.get<Player>(`/api/player/${playerName}/details`).subscribe({
        next: (data) => {
          this.player = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = "Failed to load player details";
          this.loading = false;
        },
      });
    } else {
      this.error = "No player name provided in route";
      this.loading = false;
    }
  }

  getItemSlots(items: Record<string, any[]>): string[] {
    return Object.keys(items).sort();
  }
}
