import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// import { LogsComponent } from "./logs/logs.component";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { AppComponent } from "./app.component";
import { ClassTabsComponent } from "./class-tabs.component";
import { SpecDetailComponent } from "./spec-detail.component";
import { LogsComponent } from "./logs/logs.component";
import { CeilPipe } from './ceil.pipe';

@NgModule({
  declarations: [
    LogsComponent,
    LandingPageComponent,
    AppComponent,
    ClassTabsComponent,
    SpecDetailComponent,
    CeilPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    RouterModule.forRoot([
      { path: "", component: LandingPageComponent },
      { path: "logs", component: LogsComponent },
      { path: ":cls", component: ClassTabsComponent },
      { path: ":cls/:spec", component: ClassTabsComponent },
      { path: "**", redirectTo: "" },
    ]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
