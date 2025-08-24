import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GearService } from "src/app/gear.service";

export type Item = {
  id: number;
  name: string;
};

type Items = {
  WristSlot: Item[];
  FingerSlot: Item[];
  Trinket0Slot: Item[];
  Trinket1Slot: Item[];
  BackSlot: Item[];
  MainHandSlot: Item[];
  SecondaryHandSlot: Item[];
  RangedSlot: Item[];
  HeadSlot: Item[];
  NeckSlot: Item[];
  ShoulderSlot: Item[];
  ShirtSlot: Item[];
  ChestSlot: Item[];
  WaistSlot: Item[];
  LegsSlot: Item[];
  FeetSlot: Item[];
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
  templateUrl: "./player.component.html",
  styleUrl: "./player.component.scss",
})
export class PlayerComponent implements OnInit {
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
