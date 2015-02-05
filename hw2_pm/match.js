/*
 * Hao Chen (904547539)
 * 
 */

var _ = {};
var many = function (x) { return [many, x]; };
var when = function (x) { return [when, x]; };

function match(value /* , pat1, fun1, pat2, fun2, ... */) {
  for (var i = 1; i < arguments.length; i += 2) {
    var pat = arguments[i];
    var fun = arguments[i+1];
    var varList = [];
    if (matchPattern(value, pat, varList)) {
      return fun.apply(undefined, varList);
    }
  }
  throw new Error("match failed");
}

function isWhen(pat) {
  return typeof pat === 'object' && pat.hasOwnProperty(length) &&
         pat.length == 2 && pat[0] === when;
}

function isMany(pat) {
  return typeof pat === 'object' && pat.hasOwnProperty(length) &&
         pat.length == 2 && pat[0] === many;
}

function isPrimValue(value) {
  return typeof value === 'number' || typeof value === 'boolean' ||
         typeof value === 'string';
}

function matchPattern(value, pat, varList) {
  if (pat === _) {
    varList.push(value);
    return true;
  } else 
  if (isPrimValue(value) && isPrimValue(pat)) { 
    return pat === value;
  } else 
  if (isWhen(pat)) {
    var when_func = pat[1];
    var cond = when_func.apply(undefined, [value]); 
    if (cond) varList.push(value);
    return cond;
  } else 
  if (typeof value === 'object' && value.hasOwnProperty(length)) {
    if (typeof pat === 'object' && pat.hasOwnProperty(length)) {
      // array
      var value_index = 0, pat_index = 0;
      while (pat_index < pat.length) {
        if (isMany(pat[pat_index])) {
          var new_list = []
          while (value_index < value.length) {
            if (!matchPattern(value[value_index], 
                              pat[pat_index][1],
                              new_list)) {
              break;
            }
            value_index ++;
          }
          varList.push(new_list);
          pat_index ++;
        } else { 
          if (value_index >= value.length ||
              !matchPattern(value[value_index], pat[pat_index], varList)) {
            return false;
          }
          value_index ++;
          pat_index ++;
        }
      }
      return value_index == value.length;
    } else {
      return false;
    }
  }
  return false;
}
