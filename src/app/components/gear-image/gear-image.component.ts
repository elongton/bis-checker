import { HttpClient } from "@angular/common/http";
import { Component, Input } from "@angular/core";
import { GearService } from "src/app/gear.service";

type ItemImage = {
  gearId: number;
  imageUrl: string;
  source: "blizzard" | "mongodb";
};

@Component({
  selector: "gear-image",
  templateUrl: "./gear-image.component.html",
  styleUrls: ["./gear-image.component.scss"],
})
export class GearImageComponent {
  @Input() itemId: number | null = null;
  imageUrl: string = "";
  wowhead = GearService.wowheadUrl;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (!this.itemId) return;

    // Load entire cache object (or empty if none exists yet)
    const stored = localStorage.getItem("itemImages");
    let cache: Record<number, ItemImage> = stored ? JSON.parse(stored) : {};

    if (cache[this.itemId]) {
      // Found in cache
      this.imageUrl = cache[this.itemId].imageUrl;
    } else {
      // Fetch from API and update cache
      this.http
        .get<ItemImage>(`/api/blizzard/item-image/${this.itemId}`)
        .subscribe((res) => {
          this.imageUrl = res.imageUrl;
          cache[this.itemId!] = res; // update cache with new entry
          localStorage.setItem("itemImages", JSON.stringify(cache));
        });
    }
  }
}
