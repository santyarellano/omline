import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-preprocessor',
  templateUrl: './preprocessor.component.html',
  styleUrls: ['./preprocessor.component.css']
})
export class PreprocessorComponent implements OnInit {
  loading: Boolean = false;
  csv_file?: File;
  first_row_names: Boolean = true;
  separator: string = "Coma";
  separator_options: string[] = [
    'Coma',
    'Whitespace',
    'Semicolon'
  ];

  constructor() {
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
    //console.log(file); // <- remove
    this.loading = true;
    let btn = document.getElementById("file-input");
    if (this.csv_file) {
      if (btn) {
        btn.textContent = this.csv_file.name;
      }
      this.readFile(this.csv_file);
    }
  }

  /*
  READFILE(FILE):
  1. Check if file has CSV content
  2. Get names if first row (checkbox)
  3. Read content with separator (radio buttons)
  */
  readFile(file: File) {
    console.log(file);
  }
}
