import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreprocessorServiceService {
  data_uploaded = false; // default should be false
  data = [];
  labels = [];

  means = {};
  mins = {};
  maxs = {};

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


  // returns [avg, max, min]
  getAvgMinMax(set, param) {
    var acum = 0;
    var max = null;
    var min = null;
    var len = 0;

    set.forEach(el => {
      var val = +el[param];
      acum += val;
      len++;

      if (max == null) max = val;
      max = (val > max) ? val : max;

      if (min == null) min = val;
      min = (val < min) ? val : min;

    });

    acum /= len;
    return [acum, max, min];
  }

  normalizeElement(element) {
    for (var key in element) {
      element[key] = (element[key] - this.means[key]) / (this.maxs[key] - this.mins[key]);
    }

    return element;
  }

  denormalizeResult(result, key) {
    var ret = result * (this.maxs[key] - this.mins[key]) + this.means[key];
    return ret;
  }

  normalizeByAvg(set) {
    // Get avg, max & min
    for (var key in set[0]) {
      var temp = this.getAvgMinMax(set, key);
      this.means[key] = temp[0];
      this.maxs[key] = temp[1];
      this.mins[key] = temp[2];
    }

    // apply normalization to element
    set.forEach(element => {
      element = this.normalizeElement(element);
    });

    return set;
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

    // remove last instance as it is empty by default always
    testSet.pop();

    // Normalize so that gradient descent can converge (using whole set)
    testSet = this.normalizeByAvg(testSet);

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
