import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-preprocessor',
  templateUrl: './preprocessor.component.html',
  styleUrls: ['./preprocessor.component.css']
})
export class PreprocessorComponent implements OnInit {
  loading_file: Boolean = false;
  csv_file?: File;


  constructor() {
    //this.csv_file = null;
  }

  ngOnInit(): void {
  }

  csvInputChange(fileInputEvent: any) {
    this.csv_file = fileInputEvent.target.files[0];
    //console.log(file); // <- remove
    this.loading_file = true;
    let btn = document.getElementById("file_input");
    if (this.csv_file) {
      if (btn) {
        btn.textContent = this.csv_file.name;
      }
      this.readFile(this.csv_file);
    }
  }

  readFile(file: File) {
    console.log(file);
  }
}
