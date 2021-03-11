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
  learning_rate = 0.33;
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

    // Run learning every 100ms
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

      // stop if limits reached
      if (this.mse <= this.error_limit || this.current_epoch >= this.epochs_limit) {
        clearInterval(this.timer);
      }
    }, 100);


  }

  run() {
    this.running = true;
    this.show_process = true;
    document.getElementById("run_btn").innerText = "Running...";
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

  Epoch() {
    this.mse_history.push(this.mse);
    this.mse *= .98;
    this.current_epoch++;
  }

}
