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
  ms_per_epoch = 10;
  learning_rate = 0.01;
  training_proportion = 75;
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
      if (feature != this.predict_feature) {
        this.params[feature] = Math.random() * 100;
      }
    });

    // Get training & testing sets
    this.testing_proportion = 100 - this.training_proportion;
    var splitSet = this.prep_service.splitDataSets(this.training_proportion, this.selected_features);
    this.training_set = splitSet[0];
    this.testing_set = splitSet[1];

    this.updateMSE();

    // Run learning every N ms
    this.timer = setInterval(() => {
      this.Epoch();
      this.updateMSE();

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

  // Evaluates the current hypothesis and returns the result
  hypothesys(sample) {
    var acum = 0;
    for (var key in sample) {
      if (key != this.predict_feature) {
        //console.log(key, sample[key]);
        acum += this.params[key] * sample[key];
      }
    }

    return acum;
  }

  // Gradient Descent algorithm
  GradientDescent() {
    var temp = Object.assign({}, this.params);

    for (var key in this.params) {
      var acum = 0;

      this.training_set.forEach(instance => {
        var error = this.hypothesys(instance) - instance[this.predict_feature];
        acum += error * instance[key];
      });

      temp[key] = this.params[key] - this.learning_rate * (1 / this.training_set.length) * acum;
    }

    return temp;
  }

  Scaling() {
    return 1;
  }

  updateMSE() {
    var error_acum = 0;

    this.training_set.forEach(instance => {
      var hyp = this.hypothesys(instance);
      var error = hyp - instance[this.predict_feature];
      error_acum += Math.pow(error, 2);
    });

    this.mse = error_acum / this.training_set.length;
    this.mse_history.push(this.mse);
  }

  Epoch() {
    // Capture old params
    var old_params = Object.assign({}, this.params);

    // Calculate new params with Gradient Descent
    this.params = this.GradientDescent();

    // Stop when local mimima is found (limits reached or no further improvement)
    if (this.mse <= this.error_limit || this.current_epoch >= this.epochs_limit || old_params === this.params) {
      clearInterval(this.timer);
      this.running = false;
      document.getElementById("run_btn").innerText = "Run";
    }

    this.current_epoch++;
  }

}
