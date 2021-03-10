import { Component, OnInit } from '@angular/core';
import { PreprocessorServiceService } from '../preprocessor-service.service';

@Component({
  selector: 'app-linear-regression',
  templateUrl: './linear-regression.component.html',
  styleUrls: ['./linear-regression.component.css']
})

export class LinearRegressionComponent implements OnInit {

  constructor(public prep_service: PreprocessorServiceService) { }

  ngOnInit(): void {
  }

}
