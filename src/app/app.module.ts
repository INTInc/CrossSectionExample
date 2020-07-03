import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { MatTooltipModule} from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { AppComponent } from './app.component';
import { CrosssectionComponent } from './components/crosssection/crosssection.component';
import { TemplateService } from './services/templateservice';
import { TrajectoryService } from './services/trajectoryservice';

import { HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF } from "@angular/common";

export function getBaseHref(): string {
  //return window.location.pathname;
  let paths: string[] = window.location.pathname.split('/').splice(1, 1);
  let basePath: string = (paths && paths[0]) || 'int';
  return '/' + basePath;
}

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
    TrajectoryService,
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
