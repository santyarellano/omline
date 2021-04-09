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

  OneHotEncoding(set) {
    // Find non-numerical features
    for (var field in set[0]) {
      if (isNaN(set[0][field])) {
        // get all classes of this field
        var classes = [];
        for (var i = 0; i < set.length; i++) {
          if (!classes.includes(set[i][field])) {
            classes.push(set[i][field]);
          }
        }

        // substitue in all samples such class with the new binary classes
        for (var i = 0; i < set.length; i++) {
          classes.forEach(c => {
            // new name for this class
            var new_name = field + "_" + c;

            // add this sample's class
            set[i][new_name] = (c == set[i][field]) ? 1 : 0;
          });

          // Delete this attribute
          delete set[i][field];
        }
      }
    }

    return set;
  }

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

    // remove last instance as it is empty by default always
    this.data.pop();

    // Apply 1-hot enconding
    this.data = this.OneHotEncoding(this.data);

    // refresh labels
    this.labels = [];
    for (var key in this.data[0]) {
      this.labels.push(key);
    }

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

  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
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

    // Shuffle data set
    this.shuffle(testSet);

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
