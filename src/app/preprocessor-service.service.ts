import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreprocessorServiceService {
  data_uploaded = false; // default should be false
  data = [];
  labels = [];

  constructor() { }

  ParseText(txt: String, delimiter) {
    var rows = txt.split('\n');
    this.labels = rows[0].split(delimiter);

    // split by delimiter
    for (var i = 1; i < rows.length - 1; i++) {
      var row = rows[i].split(delimiter);
      var element = {}
      for (var j = 0; j < row.length; j++) {
        element[this.labels[j]] = row[j];
      }
      this.data.push(element);
    }
    this.data_uploaded = true;
    return this.data;
  }

  splitDataSets(train_percentage, labels_to_analyze) {
    // get total dataset
    var trainSet = [];
    var testSet = [];

    // filter unwanted data
    this.data.forEach(instance => {
      instance = this.getFilteredObj(instance, labels_to_analyze);
      testSet.push(instance);
    });

    // split set in two parts acording to percentage
    var to_split = Math.floor(testSet.length * (train_percentage / 100));
    trainSet = testSet.splice(0, to_split);

    return [trainSet, testSet];
  }

  // returns obj without unwanted features
  getFilteredObj(obj, labels) {
    var ret = {};
    labels.forEach(label => {
      ret[label] = obj[label];
    });

    return ret;
  }
}
