import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-preprocessor',
  templateUrl: './preprocessor.component.html',
  styleUrls: ['./preprocessor.component.css']
})
export class PreprocessorComponent implements OnInit {
  loading_file: Boolean = false;
  //csv_file: File?;

  constructor() {
    //this.csv_file = null;
  }

  ngOnInit(): void {
  }

  csvInputChange(fileInputEvent: any) {
    let file = fileInputEvent.target.files[0];
    let filename = file.name;
    //console.log(file); // <- remove
    this.loading_file = true;
    this.readFile(file);
  }

  readFile(file: File) {
  }
}
