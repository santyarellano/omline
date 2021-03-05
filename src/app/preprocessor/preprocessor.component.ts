import { Component, OnInit } from '@angular/core';
import { rejects } from 'assert';
import { PreprocessorServiceService } from '../preprocessor-service.service';

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
  dataSource = [];
  dataSource_keys = [];

  constructor(private prep_service: PreprocessorServiceService) {
  }

  ngOnInit(): void {
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
    if (this.csv_file) {
      if (btn) {
        btn.textContent = this.csv_file.name;
      }

      this.readFile().then((content) => {
        // assign to content and draw in table
        this.dataSource = content;
        this.dataSource_keys = Object.keys(this.dataSource[0]);
        this.show_table = true;
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
