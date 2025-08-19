import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GearService } from "src/app/gear.service";

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

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const playerName = this.route.snapshot.paramMap.get("name");
    if (playerName) {
      this.http.get<any>(`/api/player/${playerName}/details`).subscribe({
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
