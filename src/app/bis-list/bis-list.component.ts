import { Component, OnInit } from "@angular/core";
import { GearService } from "../gear.service";
import { HttpClient } from "@angular/common/http";

interface Player {
  name: string;
  class: string;
  lastSeen: string;
  spec: string;
}

export interface Item {
  id: number;
  name: string;
}

@Component({
  selector: "app-bis-list",
  templateUrl: "./bis-list.component.html",
  styleUrl: "./bis-list.component.css",
})
export class BisListComponent implements OnInit {
  players: Player[] = [];
  classFilter: string = "";
  dummySpecs = ["Spec A", "Spec B", "Spec C"];
  gear: any;

  constructor(private http: HttpClient, private gearService: GearService) {}

  ngOnInit(): void {
    this.gearService.getLibrary().subscribe((lib) => {
      this.gear = lib;
      console.log(this.gear);
      this.loadPlayers();
      console.log(this.players);
    });
  }

  loadPlayers(): void {
    this.http.get<Player[]>("/api/player").subscribe({
      next: (data) => {
        this.players = data;
        console.log(data);
      },
      error: (err) => console.error("Failed to fetch players:", err),
    });
  }

  get filteredClasses(): string[] {
    const classes = new Set(this.players.map((p) => p.class));
    return Array.from(classes).sort();
  }

  get groupedPlayers(): Record<string, Player[]> {
    const grouped: Record<string, Player[]> = {};

    for (const player of this.players) {
      if (this.classFilter && player.class !== this.classFilter) continue;
      if (!grouped[player.class]) grouped[player.class] = [];
      grouped[player.class].push(player);
    }

    return grouped;
  }

  updateSpec(player: Player, newSpec: string): void {
    this.http
      .patch(`/api/player/${encodeURIComponent(player.name)}/spec`, {
        spec: newSpec,
      })
      .subscribe({
        next: () => {}, // `player.spec` already updated by ngModel
        error: (err) =>
          console.error(`Failed to update spec for ${player.name}:`, err),
      });
  }

  getSpecOptionsForPlayer(player: Player): string[] {
    if (!this.gear) return [];
    const classEntry = this.gear[player.class];
    return classEntry ? Object.keys(classEntry) : [];
  }

  getSoftBisCount(player: Player): number {
    if (!player.spec || !this.gear) return 0;

    const classGear = this.gear[player.class];
    const specGear = classGear?.[player.spec];
    if (!specGear) return 0;

    let count = 0;
    const playerItems = (player as any).items || {};

    for (const slot of Object.keys(specGear)) {
      const bisItems = specGear[slot];
      const playerSlotItems: Item[] = playerItems[slot] || [];

      if (
        playerSlotItems.some((item) =>
          bisItems.some((bis: Item) => bis.id === item.id)
        )
      ) {
        count++;
      }
    }

    return count;
  }

  getHardBisCount(player: Player): number {
    if (!player.spec || !this.gear) return 0;

    const classGear = this.gear[player.class];
    const specGear = classGear?.[player.spec];
    if (!specGear) return 0;

    let count = 0;
    const playerItems = (player as any).items || {};

    for (const slot of Object.keys(specGear)) {
      const bestItem = specGear[slot][0];
      if (!bestItem) continue;

      const playerSlotItems: Item[] = playerItems[slot] || [];
      if (playerSlotItems.some((item) => item.id === bestItem.id)) {
        count++;
      }
    }

    return count;
  }
}
