import { Component, OnDestroy } from "@angular/core";
import { GearService } from "../../gear.service";
import { SpecBlock } from "../../models";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { Subscription, combineLatest } from "rxjs";
import { AuthService } from "src/app/auth.service";

@Component({
  selector: "app-class-tabs",
  templateUrl: "./class-tabs.component.html",
  styleUrls: ["./class-tabs.component.css"],
})
export class ClassTabsComponent implements OnDestroy {
  classes: string[] = [];
  active = 0;
  specs: Record<string, string[]> = {};
  selectedClass: string | null = null;
  selectedSpec: string | null = null;
  selectedBlock?: SpecBlock;
  editMode = false;
  isDirty = false;

  private sub?: Subscription;
  private libSub?: Subscription;
  $user = this.auth.$user;

  constructor(
    private gear: GearService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    const classes$ = this.gear.getClasses();
    const params$ = this.route.paramMap;

    this.sub = combineLatest([classes$, params$]).subscribe(
      ([clsList, params]: [string[], ParamMap]) => {
        this.classes = clsList;
        clsList.forEach((cls) =>
          this.gear.getSpecsForClass(cls).subscribe((s) => {
            this.specs[cls] = s;
          })
        );

        const pClsRaw = params.get("cls");
        const pSpecRaw = params.get("spec");

        if (pClsRaw) {
          const libCls = this.findCaseInsensitive(pClsRaw, clsList);
          if (libCls) {
            this.active = Math.max(0, clsList.indexOf(libCls));
            this.selectedClass = libCls;
            if (pSpecRaw) {
              const libSpec = this.findCaseInsensitive(
                pSpecRaw,
                this.classSpecs(libCls)
              );
              if (libSpec) this.openSpec(libCls, libSpec, false);
              else {
                this.selectedSpec = null;
                this.selectedBlock = undefined;
                this.isDirty = false;
              }
            } else {
              this.selectedSpec = null;
              this.selectedBlock = undefined;
              this.isDirty = false;
            }
          }
        }
      }
    );

    // Recompute dirty when library changes
    this.libSub = this.gear.getLibrary().subscribe(() => this.computeDirty());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.libSub?.unsubscribe();
  }

  classSpecs(cls: string) {
    return this.specs[cls] ?? [];
  }

  openClass(cls: string) {
    const map: Record<string, [string, string]> = {
      Druid: ["druid", "restoration"],
      Hunter: ["hunter", "marksmanship"],
      Mage: ["mage", "fire"],
      Paladin: ["paladin", "holy"],
      Priest: ["priest", "holy/disc"],
      Rogue: ["rogue", "combat"],
      Warlock: ["warlock", "dm/sm ruin"],
      Warrior: ["warrior", "prot"],
    };
    const pair = map[cls] || [
      cls.toLowerCase(),
      this.classSpecs(cls)[0]?.toLowerCase() || "",
    ];
    if (pair[1]) this.router.navigate(["/bis-list/", pair[0], pair[1]]);
    else this.router.navigate(["/bis-list/", pair[0]]);
  }

  openSpec(cls: string, spec: string, pushRoute: boolean = true) {
    this.selectedClass = cls;
    this.selectedSpec = spec;
    if (pushRoute)
      this.router.navigate([
        "/bis-list/",
        cls.toLowerCase(),
        spec.toLowerCase(),
      ]);
    this.gear.getSpecBlock(cls, spec).subscribe((block) => {
      this.selectedBlock = block;
      this.computeDirty();
    });
    // no auto scroll
  }
  // Sticky header actions
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

  async saveEdits() {
    if (!this.selectedClass || !this.selectedSpec) return;
    await this.gear.saveAll();
    this.editMode = false;
    this.computeDirty();
  }

  cancelEdits() {
    this.gear.cancel();
    this.editMode = false;
    if (this.selectedClass && this.selectedSpec)
      this.openSpec(this.selectedClass, this.selectedSpec, false);
    else this.computeDirty();
  }

  computeDirty() {
    if (!this.selectedClass || !this.selectedSpec) {
      this.isDirty = false;
      return;
    }
    this.isDirty = this.gear.isSpecDirty(this.selectedClass, this.selectedSpec);
  }

  trackByClass = (_: number, c: string) => c;
  trackBySpec = (_: number, s: string) => s;

  private findCaseInsensitive(needle: string, hay: string[]): string | null {
    const lower = needle.toLowerCase();
    for (const h of hay) if (h.toLowerCase() === lower) return h;
    return null;
  }

  downloadGearJson() {
    const gear = this.gear.getAllGear();
    const blob = new Blob([JSON.stringify(gear, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gear_library.json";
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
