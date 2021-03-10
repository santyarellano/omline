import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainNavComponent } from './main-nav/main-nav.component';
import { LayoutModule } from '@angular/cdk/layout';

// ANGULAR MATERIAL MODULES
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';

// OTHER LIBS
import { NgxEchartsModule } from 'ngx-echarts';

// COMPONENTS
import { PreprocessorComponent } from './preprocessor/preprocessor.component';
import { LinearRegressionComponent } from './linear-regression/linear-regression.component';
import { LogisticRegressionComponent } from './logistic-regression/logistic-regression.component';
import { LinearLearnerComponent } from './linear-learner/linear-learner.component';

@NgModule({
  declarations: [
    AppComponent,
    MainNavComponent,
    PreprocessorComponent,
    LinearRegressionComponent,
    LogisticRegressionComponent,
    LinearLearnerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule,
    MatInputModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
