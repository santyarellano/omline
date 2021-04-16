import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { rejects } from 'assert';
import { PreprocessorServiceService } from '../preprocessor-service.service';

export interface Feature {
  name: string;
  selected: boolean;
  subfeatures?: Feature[];
}

@Component({
  selector: 'app-preprocessor',
  templateUrl: './preprocessor.component.html',
  styleUrls: ['./preprocessor.component.css']
})
export class PreprocessorComponent implements OnInit {
  loading: Boolean = false;
  csv_file?: File;
  separator: string = "Coma";
  separator_options: string[] = [
    'Coma',
    'Whitespace',
    'Semicolon'
  ];
  show_table = false;
  show_features_select = false;
  dataSource = [];
  dataSource_keys = [];

  features: Feature = {
    name: 'Features to consider',
    selected: false,
    subfeatures: []
  };
  selectedAllFeatures: boolean = false;
  selected_features: string[];

  constructor(public prep_service: PreprocessorServiceService) {
  }

  ngOnInit(): void {
  }

  someComplete(): boolean {
    if (this.features.subfeatures == null) {
      return false;
    }
    return this.features.subfeatures.filter(t => t.selected).length > 0 && !this.selectedAllFeatures;
  }

  setAll(selected: boolean) {
    this.selectedAllFeatures = selected;
    if (this.features.subfeatures == null) {
      return;
    }
    this.features.subfeatures.forEach(t => t.selected = selected);
    this.updateSelectedFeatures();
  }

  updateAllFeaturesSelected() {
    this.selectedAllFeatures = this.features.subfeatures != null && this.features.subfeatures.every(t => t.selected);
    this.updateSelectedFeatures();
  }

  updateSelectedFeatures() {
    this.selected_features = [];
    this.features.subfeatures.forEach((feature) => {
      if (feature.selected) {
        this.selected_features.push(feature.name);
      }
    });

    this.prep_service.UpdateDataByFeatures(this.selected_features);
    this.dataSource = this.prep_service.GetData();
    this.dataSource_keys = this.prep_service.labels;
  }

  /*
  FILE INPUT CHANGE:
  - Update button text with filename
  - Call readfile()
  */
  csvInputChange(fileInputEvent: any) {
    this.csv_file = fileInputEvent.target.files[0];
    this.loading = true;
    let btn = document.getElementById("file-input");
    this.features.subfeatures = [];

    if (this.csv_file) {
      if (btn) {
        btn.textContent = this.csv_file.name;
      }

      this.readFile().then((content) => {
        // assign to content and draw in table
        this.dataSource = content;
        this.dataSource_keys = Object.keys(this.dataSource[0]);
        this.show_table = true;

        // Add features to checkbox list
        this.prep_service.raw_labels.forEach(label => {
          var auxFeature = {
            name: label,
            selected: false
          };

          this.features.subfeatures.push(auxFeature);
        });
        this.setAll(true);

        this.show_features_select = true;
        this.loading = false;
      });
    }
  }

  getDelimiter() {
    if (this.separator == "Coma")
      return ',';
    else if (this.separator == "Whitespace")
      return ' ';
    else if (this.separator == "Semicolon")
      return ';';
    else
      return ',';
  }

  /*
  READFILE(FILE):
  1. Check if file has CSV content
  2. Get names if first row (checkbox)
  3. Read content with separator (radio buttons)
  */
  readFile(): Promise<any[]> {
    var reader = new FileReader();
    var delimiter = this.getDelimiter();
    reader.readAsText(this.csv_file);
    var serv = this.prep_service;
    var table = document.getElementById("head_table");

    return new Promise((resolve, reject) => {
      reader.onload = function (e) {
        var target: any = e.target;
        var data = target.result;
        resolve(serv.ParseText(data, delimiter));
      }
    });

  }
}
