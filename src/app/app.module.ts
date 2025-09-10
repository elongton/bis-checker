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
import { CeilPipe } from "./pipes/ceil.pipe";
import { GearImageComponent } from "./components/gear-image/gear-image.component";
import { CharacterSheetComponent, SlotComponent } from "./components/character-sheet/character-sheet.component";
import { PlayersComponent } from "./players/players.component";
import { PlayerDetailComponent } from "./player-detail/player-detail.component";
import { ButtonDirective } from "./directives/button.directive";
import { CapitalizeFirstPipe } from "./pipes/capitalize-first.pipe";
import { LowerCasePipe } from "./pipes/lowercase.pipe";
import { DatePipe } from "@angular/common";
import { ParseColorDirective } from "./directives/parse-color.directive";

@NgModule({
  declarations: [
    LogsComponent,
    LandingPageComponent,
    AppComponent,
    ClassTabsComponent,
    SpecDetailComponent,
    CeilPipe,
    GearImageComponent,
    CharacterSheetComponent,
    SlotComponent,
    PlayersComponent,
    PlayerDetailComponent ,
    ButtonDirective,
    ParseColorDirective,
    CapitalizeFirstPipe,
    LowerCasePipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,

    RouterModule.forRoot([
      { path: "logs", component: LogsComponent },
      { path: "players", component: PlayersComponent },
      { path: "players/:name", component: PlayerDetailComponent },
      { path: "bis-list/:cls", component: ClassTabsComponent },
      { path: "bis-list/:cls/:spec", component: ClassTabsComponent },
      { path: "bis-list", redirectTo: "bis-list/WARRIOR/Fury" },
      { path: "", redirectTo: "players", pathMatch: "full" },
      { path: "**", redirectTo: "" },
    ]),
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
