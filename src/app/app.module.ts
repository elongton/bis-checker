import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// import { LogsComponent } from "./logs/logs.component";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { AppComponent } from "./app.component";
import { ClassTabsComponent } from "./bis-admin/class-tabs/class-tabs.component";
import { SpecDetailComponent } from "./bis-admin/spec-details/spec-detail.component";
import { LogsComponent } from "./logs/logs.component";
import { CeilPipe } from "./ceil.pipe";
import { BisListComponent } from "./bis-list/bis-list.component";
import { PlayerComponent } from "./player-detail/player.component";
import { GearImageComponent } from "./components/gear-image/gear-image.component";
import { CharacterSheetComponent, SlotComponent } from "./components/character-sheet/character-sheet.component";

@NgModule({
  declarations: [
    LogsComponent,
    LandingPageComponent,
    AppComponent,
    ClassTabsComponent,
    SpecDetailComponent,
    CeilPipe,
    BisListComponent,
    PlayerComponent,
    GearImageComponent,
    CharacterSheetComponent,
    SlotComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,

    RouterModule.forRoot([
      { path: "logs", component: LogsComponent },
      { path: "players", component: BisListComponent },
      { path: "players/:name", component: PlayerComponent },
      { path: "bis-list/:cls", component: ClassTabsComponent },
      { path: "bis-list/:cls/:spec", component: ClassTabsComponent },
      { path: "bis-list", redirectTo: "bis-list/warrior/prot" },
      { path: "", redirectTo: "bis-list/warrior/prot", pathMatch: "full" },
      { path: "**", redirectTo: "" },
    ]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
