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
  epochs_limit = 1000;
  error_limit = 1;
  ms_per_epoch = 1;
  learning_rate = 0.033;
  training_proportion = 75;
  testing_proportion = 100 - this.training_proportion;
  running = false;
  show_process = false;
  show_test = false;
  accuracy = 0;
  show_model = false;

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
  param_keys = [];
  test_result = 0;
  test_model = {};

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
    this.show_model = false;
    this.show_test = false;
    document.getElementById("run_btn").innerText = "Running...";

    // reset values
    this.mse = 100;
    this.mse_history = [];
    this.current_epoch = 0;

    // Set params to random starting values
    this.params = {};
    this.selected_features.forEach((feature) => {
      if (feature != this.predict_feature) {
        this.params[feature] = Math.random() * 10;
      }
    });
    this.params["bias"] = Math.random() * 10;

    // Get training & testing sets
    this.testing_proportion = 100 - this.training_proportion;
    var splitSet = this.prep_service.splitDataSets(this.training_proportion, this.selected_features);
    this.training_set = splitSet[0];
    this.testing_set = splitSet[1];

    this.updateMSE();

    // fix normalization
    /*console.log(this.training_set[0]);
    this.normalize(this.training_set);
    console.log(this.training_set[0]);*/

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
        acum += this.params[key] * sample[key];
      }
    }

    acum += this.params["bias"];

    return acum;
  }

  // Gradient Descent algorithm
  GradientDescent() {
    var temp = Object.assign({}, this.params);

    for (var key in this.params) {
      var acum = 0;



      this.training_set.forEach(instance => {
        var error = this.hypothesys(instance) - instance[this.predict_feature];
        if (key != "bias")
          acum += error * instance[key];
        else
          acum += error;
      });

      temp[key] = this.params[key] - this.learning_rate * (1 / this.training_set.length) * acum;
    }

    return temp;
  }

  getMaxJson(obj: JSON) {
    var ret = null;
    for (var key in obj) {
      if (ret == null) ret = obj[key];
      ret = (obj[key] > ret) ? obj[key] : ret;
    }

    return ret;
  }

  // To-do: fix so user model can be used.
  normalize(set) {
    var acum: number = 0;
    set.forEach(sample => {
      for (var key in sample) {
        acum += +sample[key];
      }
      var avg = acum / Object.keys(sample).length;
      var max_val = +this.getMaxJson(sample);
      for (var key in sample) {
        sample[key] = (sample[key] - avg) / max_val;
      }
    });
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
      this.run_test();
      this.show_test = true;
    }

    // Stop if error is growing or if nan
    if ((this.mse_history.length > 5 && this.mse_history[this.mse_history.length - 1] > this.mse_history[this.mse_history.length - 2]) || isNaN(this.mse)) {
      clearInterval(this.timer);
      this.run_test();
      this.show_test = true;
    }

    this.current_epoch++;
  }

  run_test() {
    var error_acum = 0;
    for (var i = 0; i < this.testing_set.length - 1; i++) {
      var hyp = this.hypothesys(this.testing_set[i]);
      var error = hyp - this.testing_set[i][this.predict_feature];
      error_acum += Math.pow(error, 2);
    }
    var avg_error = error_acum / this.testing_set.length
    this.accuracy = 100 - avg_error;
    this.running = false;
    document.getElementById("run_btn").innerText = "Run";

    // Show model
    for (var key in this.params) {
      this.test_model[key] = 0;
    }
    this.param_keys = Object.keys(this.params);

    this.update_model();
    this.show_model = true;
  }

  update_model() {
    this.test_result = this.hypothesys(this.test_model);
  }

}
