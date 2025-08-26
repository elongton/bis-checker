import { Component, OnInit } from "@angular/core";
import { GearService } from "../gear.service";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";

interface Player {
  name: string;
  class: string;
  lastSeen: string;
  spec: string;
  items?: Record<string, Item[]>;
  core: boolean
}

export interface Item {
  id: number;
  name: string;
}

@Component({
  selector: "app-players",
  templateUrl: "./players.component.html",
  styleUrl: "./players.component.css",
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  gear: any | null = null;

  classFilter: string = "";
  nameSearch: string = "";
  sortColumn: "coreRaider" | "name" | "class" | "lastSeen" | "softBis" | "hardBis" = "name";
  sortDirection: "asc" | "desc" = "asc";
  selectedNames = new Set<string>();
  copied = false;
  $user = this.auth.$user;
  editMode = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private gearService: GearService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem("edit_pw") == "crashout!"){
      this.editMode = true;
    }

    this.route.queryParams.subscribe((params) => {
      this.classFilter = params["class"] || "";
      this.nameSearch = params["name"] || "";
    });

    this.gearService.getLibrary().subscribe((lib) => {
      this.gear = lib;
      this.loadPlayers();
    });
  }

  loadPlayers(): void {
    this.http.get<Player[]>("/api/player").subscribe({
      next: (data) => {
        this.players = data;
      },
      error: (err) => console.error("Failed to fetch players:", err),
    });
  }

  get filteredClasses(): string[] {
    const classes = new Set(this.players.map((p) => p.class));
    return Array.from(classes).sort();
  }

  get filteredPlayers(): Player[] {
    let filtered = this.players;

    if (this.classFilter) {
      filtered = filtered.filter(
        (p) => p.class.toLowerCase() === this.classFilter.toLowerCase()
      );
    }

    if (this.nameSearch.trim()) {
      const lowerName = this.nameSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(lowerName)
      );
    }

    return filtered.sort((a, b) => {
      const aVal = this.getSortValue(a);
      const bVal = this.getSortValue(b);
      if (aVal < bVal) return this.sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  getSortValue(player: Player): any {
    switch (this.sortColumn) {
      case "lastSeen":
        return new Date(player.lastSeen).getTime();
      case "softBis":
        return this.getSoftBisCount(player);
      case "hardBis":
        return this.getHardBisCount(player);
      case "class":
        return player.class.toLowerCase();
      case "coreRaider":
        return player.core ? 1 : 0; // Sort core raiders first
      default:
        return player.name.toLowerCase();
    }
  }

  setSort(column: typeof this.sortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "asc";
    }
  }

  getSpecOptionsForPlayer(player: Player): string[] {
    if (!this.gear) return [];
    const classGear = this.gear[player.class];
    return classGear ? Object.keys(classGear) : [];
  }

  updateSpec(player: Player, newSpec: string): void {
    this.http
      .patch(`/api/player/${encodeURIComponent(player.name)}/spec`, {
        spec: newSpec
      })
      .subscribe({
        next: () => (player.spec = newSpec),
        error: (err) => console.error("Failed to update spec:", err),
      });
  }

  getSoftBisCount(player: Player): number {
    if (!player.spec || !this.gear) return 0;
    const specGear = this.gear[player.class]?.[player.spec];
    if (!specGear) return 0;
    let count = 0;
    for (const slot in specGear) {
      const playerItems = player.items?.[slot] || [];
      if (
        playerItems.some((item) =>
          specGear[slot].some((bis: Item) => bis.id === item.id)
        )
      ) {
        count++;
      }
    }
    return count;
  }

  getHardBisCount(player: Player): number {
    if (!player.spec || !this.gear) return 0;
    const specGear = this.gear[player.class]?.[player.spec];
    if (!specGear) return 0;
    let count = 0;
    for (const slot in specGear) {
      const topItem = specGear[slot][0];
      if (!topItem) continue;
      const playerItems = player.items?.[slot] || [];
      if (playerItems.some((item) => item.id === topItem.id)) {
        count++;
      }
    }
    return count;
  }

  copyTableToClipboard(): void {
    const headers = [
      "Name",
      "Class",
      "Spec",
      "Soft BiS",
      "Hard BiS",
      "Last Seen",
      "Core Raider"
    ];

    const source = [...this.filteredPlayers].filter(
      (p) => this.selectedNames.size === 0 || this.selectedNames.has(p.name)
    );

    const rows = source.map((player) => [
      player.name,
      player.class,
      player.spec || "",
      this.getSoftBisCount(player).toString(),
      this.getHardBisCount(player).toString(),
      new Date(player.lastSeen).toLocaleString(),
      player.core ? "Yes" : "No"
    ]);

    const allRows = [headers, ...rows];
    const colWidths = headers.map((_, i) =>
      Math.max(...allRows.map((row) => row[i].length))
    );

    const formatRow = (row: string[]) =>
      "| " + row.map((cell, i) => cell.padEnd(colWidths[i])).join(" | ") + " |";

    const divider =
      "+-" + colWidths.map((w) => "-".repeat(w)).join("-+-") + "-+";

    const tableLines = [
      divider,
      formatRow(headers),
      divider,
      ...rows.map(formatRow),
      divider,
    ];

    const tableString = tableLines.join("\n"); // ✅ Fix here

    navigator.clipboard.writeText(tableString).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 3000);
    });
  }

  updateQueryParams(): void {
    this.router.navigate([], {
      queryParams: {
        class: this.classFilter || null,
        name: this.nameSearch || null,
      },
      queryParamsHandling: "merge",
    });
  }

  toggleSelection(name: string): void {
    if (this.selectedNames.has(name)) {
      this.selectedNames.delete(name);
    } else {
      this.selectedNames.add(name);
    }
  }

  isSelected(name: string): boolean {
    return this.selectedNames.has(name);
  }

  areAllFilteredSelected(): boolean {
    return this.filteredPlayers.every((player) =>
      this.selectedNames.has(player.name)
    );
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      for (const player of this.filteredPlayers) {
        this.selectedNames.add(player.name);
      }
    } else {
      this.selectedNames.clear(); // uncheck all, globally
    }
  }

  toggleCore(player: any): void {
    const newValue = !player.core;

    this.http
      .patch(`/api/player/${player.name}/core`, { core: newValue })
      .subscribe({
        next: () => {
          player.core = newValue; // optimistically update UI
        },
        error: (err) => {
          console.error(`Failed to update core for ${player.name}`, err);
          // Optionally revert checkbox state or show error to user
        },
      });
  }

    tryToggleEdit() {
    if (!this.editMode) {
      if (localStorage.getItem("edit_pw") == "crashout!") {
        this.editMode = true;
        return;
      }
      const pw = window.prompt("Enter password to enable edit mode:");
      if (pw === "crashout!") {
        localStorage.setItem("edit_pw", "crashout!");
        this.editMode = true;
      } else {
        alert("Incorrect password.");
      }
    } else {
      // turning off edit mode without saving
      this.editMode = false;
    }
  }

}
