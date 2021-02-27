import { Component, OnInit } from '@angular/core';

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
  readFile(file: File) {
    var reader = new FileReader();
    var delimiter = this.getDelimiter();

    reader.onload = function (e) {
      var target: any = e.target;
      var data = target.result;

      // split by new line
      var rows = data.toString().split('\n');

      var content = [];

      // get names
      var names = rows[0].toString().split(delimiter);

      // split by delimiter
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i].split(delimiter);
        var element = {}
        for (var j = 0; j < row.length; j++) {
          element[names[j]] = row[j];
        }
        content.push(element);
      }

    }
    reader.readAsText(file);
  }
}
