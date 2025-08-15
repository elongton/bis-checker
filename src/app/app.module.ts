import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ClassTabsComponent } from './class-tabs.component';
import { SpecDetailComponent } from './spec-detail.component';

@NgModule({
  declarations: [AppComponent, ClassTabsComponent, SpecDetailComponent],
  imports: [
    BrowserModule, HttpClientModule, FormsModule, DragDropModule,
    RouterModule.forRoot([
      { path: '', redirectTo: 'Mage', pathMatch: 'full' },
      { path: ':cls', component: ClassTabsComponent },
      { path: ':cls/:spec', component: ClassTabsComponent },
      { path: '**', redirectTo: '' }
    ])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
