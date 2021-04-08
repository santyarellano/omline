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
  epochs_limit = 10000;
  error_limit = 100;
  ms_per_epoch = 1;
  learning_rate = 0.033;
  training_proportion = 75;
  testing_proportion = 100 - this.training_proportion;
  running = false;
  show_process = false;
  show_test = false;
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

  training_accuracy = 0;
  training_plot_real = [];
  training_plot_hyp = [];
  trainingPlotOptions: any;
  training_chart_options: EChartsOption = {
    title: {
      text: `Training Set`
    },
    legend: {
      data: ['Real Values', 'Hypothesis']
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Real Values',
        showSymbol: true,
        data: this.training_plot_real,
        type: 'line',
      },
      {
        name: 'Hypothesis',
        data: this.training_plot_hyp,
        type: 'line',
      },
    ],
  };

  testing_accuracy = 0;
  testing_plot_real = [];
  testing_plot_hyp = [];
  testingPlotOptions: any;
  testing_chart_options: EChartsOption = {
    title: {
      text: `Testing Set`
    },
    legend: {
      data: ['Real Values', 'Hypothesis']
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: this.testing_plot_real,
        type: 'line',
      },
      {
        data: this.testing_plot_hyp,
        type: 'line',
      },
    ],
  };

  accuracy_diff = 0;

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
    this.training_plot_hyp = [];
    this.training_plot_real = [];
    this.testing_plot_hyp = [];
    this.testing_plot_real = [];
    this.testing_accuracy = 0;
    this.training_accuracy = 0;
    this.trainingPlotOptions = {
      title: {
        text: `Training Set`
      },
      series: [
        {
          name: 'Real Values',
          data: this.training_plot_real,
          type: 'line',
        },
        {
          name: 'Hypothesis',
          data: this.training_plot_hyp,
          type: 'line',
        },
      ]
    };
    this.testingPlotOptions = {
      title: {
        text: `Testing Set`
      },
      series: [
        {
          name: 'Real Values',
          data: this.testing_plot_real,
          type: 'line',
        },
        {
          name: 'Hypothesis',
          data: this.testing_plot_hyp,
          type: 'line',
        },
      ]
    };

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

    // Run learning every N ms
    this.timer = setInterval(() => {
      this.Epoch();
      this.updateMSE();
      var rounded = this.mse.toFixed(2);

      // update series data:
      this.updateOptions = {
        title: {
          text: `Mean Square Error: ${rounded}%\nEpoch: ${this.current_epoch}`
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

  updateMSE() {
    var error_acum = 0;

    this.training_set.forEach(instance => {
      var hyp = this.hypothesys(instance);
      var error = hyp - instance[this.predict_feature];
      error_acum += Math.pow(error, 2);
    });

    this.mse = error_acum / this.training_set.length;
    this.mse *= 100;
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

  GetTrainingPlot() {
    var accuracy_sum = 0;

    this.training_set.forEach(instance => {
      var hyp = this.prep_service.denormalizeResult(this.hypothesys(instance), this.predict_feature);
      var real = this.prep_service.denormalizeResult(instance[this.predict_feature], this.predict_feature);

      this.training_plot_hyp.push(hyp);
      this.training_plot_real.push(real);

      // get accuracy
      var _error = Math.abs(100 - ((hyp * 100) / real));
      accuracy_sum += 100 - _error;
    });

    var accur = accuracy_sum / this.training_set.length;
    this.training_accuracy = +accur.toFixed(2);
  }

  GetTestingPlot() {
    var accuracy_sum = 0;

    this.testing_set.forEach(instance => {
      var hyp = this.prep_service.denormalizeResult(this.hypothesys(instance), this.predict_feature);
      var real = this.prep_service.denormalizeResult(instance[this.predict_feature], this.predict_feature);

      this.testing_plot_hyp.push(hyp);
      this.testing_plot_real.push(real);

      // get accuracy
      var _error = Math.abs(100 - ((hyp * 100) / real));
      accuracy_sum += 100 - _error;
    });

    var accur = accuracy_sum / this.testing_set.length;
    this.testing_accuracy = +accur.toFixed(2);
  }

  run_test() {
    var error_acum = 0;
    for (var i = 0; i < this.testing_set.length - 1; i++) {
      var hyp = this.hypothesys(this.testing_set[i]);
      var error = hyp - this.testing_set[i][this.predict_feature];
      error_acum += Math.pow(error, 2);
    }
    var avg_error = error_acum / this.testing_set.length;
    this.running = false;
    document.getElementById("run_btn").innerText = "Run";

    // Plot comparations
    this.GetTrainingPlot();
    this.GetTestingPlot();
    this.accuracy_diff = Math.abs(this.training_accuracy - this.testing_accuracy);
    this.accuracy_diff = +this.accuracy_diff.toFixed(3);

    // Show model
    for (var key in this.params) {
      this.test_model[key] = 0;
    }
    this.param_keys = Object.keys(this.params);

    this.update_model();
    this.show_model = true;
  }

  update_model() {
    var temp_model = Object.assign({}, this.test_model);
    temp_model = this.prep_service.normalizeElement(temp_model);
    temp_model["bias"] = 0;
    var hyp = this.hypothesys(temp_model);
    hyp = this.prep_service.denormalizeResult(hyp, this.predict_feature);
    this.test_result = hyp;
  }

}
