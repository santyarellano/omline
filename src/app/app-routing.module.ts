import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LinearRegressionComponent } from './linear-regression/linear-regression.component';
import { LogisticRegressionComponent } from './logistic-regression/logistic-regression.component';

const routes: Routes = [
  { path: 'linear_regression', component: LinearRegressionComponent },
  { path: 'logistic_regression', component: LogisticRegressionComponent },
  { path: '**', redirectTo: '/linear_regression', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
