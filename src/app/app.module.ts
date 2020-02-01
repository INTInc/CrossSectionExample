import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { MatTooltipModule} from '@angular/material';
import { MatButtonModule } from '@angular/material';
import { MatCardModule } from '@angular/material/card';

import { AppComponent } from './app.component';
import { CrosssectionComponent } from './components/crosssection/crosssection.component';
import { TemplateService } from './services/templateservice';
import { TrajectoryService } from './services/trajectoryservice';

import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    CrosssectionComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    MatCardModule,
    MatButtonModule,
    HttpClientModule
  ],
  providers: [
    TemplateService,
    TrajectoryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
