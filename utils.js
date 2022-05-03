const fs = require("fs");
const { resolve } = require("path");

/*

*/
function checkKeys(obj, keys, obj_name, show_error = true) {
  for (key in keys) {
    var checker = keys[key];
    if (!(key in obj)) {
      if (show_error) { console.log(`Error!, "${key}" expected in ${obj_name}`); }
      return false;
    }
    var out = checker(obj[key]);
    if (out === false) {
      if (show_error) { console.log(`Invalid value for "${obj_name}.${key}" !`); }
      return false;
    } else if (is_string(out)) {
      if (show_error) { console.log(out); }
      return false;
    }
  }
  return true;
}

function is_string(s) {
  return typeof s === 'string' || s instanceof String
}

function file_exists(s) {
  return fs.existsSync(s);
}

function getConnection(db_conn_pool) {
  return new Promise((resolve, reject) => {
    db_conn_pool.getConnection((err, connection) => {
      if (err) { return reject(err); }
      resolve(connection);
    });
  });
}

function range(start, stop, step) {
  if (typeof stop == 'undefined') {
    // one param defined
    stop = start; start = 0;
  }

  if (typeof step == 'undefined') { step = 1; }
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) { return []; }

  var result = [];
  for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }

  return result;
}

function chr(n) {
  return String.fromCharCode(n)
}

function ord(s) {
  return s.charCodeAt(0);
}

function random_choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function is_promise(promise) {  
  return !!promise && typeof promise.then === 'function'
}

function is_obj(obj) {
  return typeof obj === 'object';
}

let nums = range(ord("0"), ord("9")+1).map(chr);
let upper_alphas = range(ord("A"), ord("Z")+1).map(chr);
let lower_alphas = range(ord("a"), ord("z")+1).map(chr);
let alphas = upper_alphas.concat(lower_alphas);
let aplpha_nums = nums.concat(alphas);

module.exports = {
  nums, upper_alphas, lower_alphas, alphas, aplpha_nums,
  
  checkKeys, is_string, file_exists, is_promise, is_obj,
  getConnection, range, chr, ord, random_choice
}
