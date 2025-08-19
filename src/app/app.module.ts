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
import { PlayerComponent } from "./bis-list/player/player.component";

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
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,

    RouterModule.forRoot([
      { path: "logs", component: LogsComponent },
      { path: "bis-list", component: BisListComponent },
      { path: "bis-list/player/:name", component: PlayerComponent },
      { path: "bis-admin/:cls", component: ClassTabsComponent },
      { path: "bis-admin/:cls/:spec", component: ClassTabsComponent },
      { path: "bis-admin", redirectTo: "bis-admin/warrior/prot" },
      { path: "", redirectTo: "bis-admin/warrior/prot", pathMatch: "full" },
      { path: "**", redirectTo: "" },
    ]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
