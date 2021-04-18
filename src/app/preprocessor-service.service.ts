import { Injectable } from '@angular/core';
import { count, sample } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PreprocessorServiceService {
  data_uploaded = false; // default should be false
  removed_samples = 0;
  encoded_features = 0;
  complete_data = [];
  data = [];
  raw_labels = [];
  labels = [];
  encoded_labels = [];
  encoded_original_labels = []

  means = {};
  mins = {};
  maxs = {};

  constructor() { }

  OneHotEncoding(set) {
    // Find non-numerical features
    var _count = 0;
    this.encoded_labels = [];
    for (var field in set[0]) {
      if (isNaN(set[0][field])) {
        _count++;
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
            if (!this.encoded_labels.includes(new_name)) {
              this.encoded_labels.push(new_name);
            }

            // add this sample's class
            set[i][new_name] = (c == set[i][field]) ? 1 : 0;
          });

          // Delete this attribute
          delete set[i][field];
        }

        // Add original label to dictionary
        if (!this.encoded_original_labels.includes(field)) {
          this.encoded_original_labels.push(field);
        }
      }
    }
    this.encoded_features = _count;
    return set;
  }

  RemoveRowsWithNan() {
    this.removed_samples = this.data.length;
    this.data = this.data.filter(function (el) {
      var _hasNan = false;
      for (var key in el) {
        if (isNaN(el[key])) {
          _hasNan = true;
        }
      }
      return !_hasNan;
    });
    this.removed_samples = Math.abs(this.removed_samples - this.data.length);
  }

  // returns an unbinded copy of complete_data
  GetCompleteData() {
    return JSON.parse(JSON.stringify(this.complete_data));
  }

  // returns an unbinded copy of data
  GetData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  ParseText(txt: String, delimiter) {
    var rows = txt.split('\n');
    this.raw_labels = rows[0].split(delimiter);
    this.labels = rows[0].split(delimiter);
    this.data = [];

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

    // Copy data before applying other processes.
    this.complete_data = this.GetData();

    // Apply 1-hot enconding & cleaning
    this.data = this.OneHotEncoding(this.data);
    this.RemoveRowsWithNan();

    // refresh labels
    this.labels = [];
    for (var key in this.data[0]) {
      this.labels.push(key);
    }

    return this.data;
  }

  GetEncodedFeats(feats) {
    var ret = [];

    feats.forEach(ft => {
      if (this.encoded_original_labels.includes(ft)) {
        ret.push(ft);
      }
    });

    return ret;
  }

  UpdateDataByFeatures(feats) {
    var _tempData = this.GetCompleteData();
    _tempData = this.OneHotEncoding(_tempData);
    this.data = [];

    // Get Selected Encoded Features
    var selected_encoded_feats = this.GetEncodedFeats(feats);

    _tempData.forEach(sample => {
      var _temp = {};
      for (var key in sample) {
        if (feats.includes(key)) {
          _temp[key] = sample[key];
        } else {
          //console.log(key);
          selected_encoded_feats.forEach(ft => {
            if (key.startsWith(ft)) {
              _temp[key] = sample[key];
            }
          });
        }

        this.data.push(_temp);
      }
    });

    // Update labels
    this.labels = Object.keys(this.data[0]);

    // Update linear learner
    this.data_uploaded = false;
    setTimeout(() => {
      this.data_uploaded = true;
    }, 50);
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
