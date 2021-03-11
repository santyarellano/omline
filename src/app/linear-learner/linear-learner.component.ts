import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PreprocessorServiceService } from '../preprocessor-service.service';
import { EChartsOption } from 'echarts';


export interface Feature {
  name: string;
  selected: boolean;
  subfeatures?: Feature[];
}

@Component({
  selector: 'app-linear-learner',
  templateUrl: './linear-learner.component.html',
  styleUrls: ['./linear-learner.component.css']
})
export class LinearLearnerComponent implements OnInit {
  epochs_limit = 20000;
  error_limit = 5;
  ms_per_epoch = 50;
  learning_rate = 0.33;
  training_proportion = 70;
  testing_proportion = 100 - this.training_proportion;
  running = false;
  show_process = false;
  valid_params = true;

  feature: Feature = {
    name: 'Features to analyze',
    selected: false,
    subfeatures: [
    ]
  };
  selectedAllFeatures: boolean = false;

  predict_feature: string;
  selected_features: string[];

  mse = 100;
  mse_history = [];
  current_epoch = 0;
  params = {};
  training_set = [];
  testing_set = [];

  updateOptions: any;
  timer: any;
  mse_chart_options: EChartsOption = {
    title: {
      text: `Error: ${this.mse}%\nEpoch: ${this.current_epoch}`
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: this.mse_history,
        type: 'line',
      },
    ],
  };

  constructor(public prep_service: PreprocessorServiceService) {
  }

  ngOnInit(): void {
    // labels filter
    this.prep_service.labels.forEach((label) => {
      var auxFeature = {
        name: label,
        selected: false
      };

      this.feature.subfeatures.push(auxFeature);
    });
    this.setAll(true);
  }

  run() {
    this.running = true;
    this.show_process = true;
    document.getElementById("run_btn").innerText = "Running...";

    // reset values
    this.mse = 100;
    this.mse_history = [];
    this.current_epoch = 0;

    // Set params to random starting values
    this.params = {};
    this.selected_features.forEach((feature) => {
      this.params[feature] = Math.random() * 100;
    });

    // Get training & testing sets
    this.testing_proportion = 100 - this.training_proportion;
    var splitSet = this.prep_service.splitDataSets(this.testing_proportion, this.training_proportion, this.selected_features);

    // Run learning every N ms
    this.timer = setInterval(() => {
      this.Epoch();

      // update series data:
      this.updateOptions = {
        title: {
          text: `Error: ${this.mse}%\nEpoch: ${this.current_epoch}`
        },
        series: [{
          data: this.mse_history
        }]
      };

    }, this.ms_per_epoch);
  }

  updateAllFeaturesSelected() {
    this.selectedAllFeatures = this.feature.subfeatures != null && this.feature.subfeatures.every(t => t.selected);
    this.updateSelectedFeatures();
  }

  someComplete(): boolean {
    if (this.feature.subfeatures == null) {
      return false;
    }
    return this.feature.subfeatures.filter(t => t.selected).length > 0 && !this.selectedAllFeatures;
  }

  setAll(selected: boolean) {
    this.selectedAllFeatures = selected;
    if (this.feature.subfeatures == null) {
      return;
    }
    this.feature.subfeatures.forEach(t => t.selected = selected);
    this.updateSelectedFeatures();
  }

  updateSelectedFeatures() {
    this.selected_features = [];
    this.feature.subfeatures.forEach((feature) => {
      if (feature.selected) {
        this.selected_features.push(feature.name);
      }
    });
    this.predict_feature = this.selected_features[0];
  }

  Hypothesys() {
    return 1;
  }

  GradientDescent() {
    return 1;
  }

  Scaling() {
    return 1;
  }

  // TO-DO: apply epoch algorithm
  Epoch() {
    /* 
      1. Capture old params
      2. Calculate new params with Gradient Descent
      3. Stop when local mimima is found (limits reached or no further improvement)
    */

    // ---- MOCK ----
    this.mse_history.push(this.mse);
    this.mse *= .98;
    this.current_epoch++;
    // ---- MOCK ----

    // Capture old params
    var old_params = this.params;

    // Calculate new params with Gradient Descent
    //this.params = this.GradientDescent();

    // Stop when local mimima is found (limits reached or no further improvement)
    if (this.mse <= this.error_limit || this.current_epoch >= this.epochs_limit || old_params === this.params) {
      clearInterval(this.timer);
      this.running = false;
      document.getElementById("run_btn").innerText = "Run";
    }
  }

}
