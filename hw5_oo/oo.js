// NLR is for return usage where return_marker to identify the return scope and 
// return_value indetify the return value.
function NLR(return_marker, return_value) {
  this.return_marker = return_marker;
  this.return_value = return_value;
}

O.transAST = function(ast) {
  // O.super_class_dict stores the super class name of class.
  // O.current_class stores the current class name when we translate the methodDecl.
  // Use O.super_class and O.current_class, we can get the super class name easily for super translation.
  O.super_class_dict = {};
  O.super_class_dict["Object"] = null;
  O.super_class_dict["Number"] = 'Object';
  O.super_class_dict["Boolean"] = 'Object';
  O.super_class_dict["True"] = 'Boolean';
  O.super_class_dict["False"] = 'Boolean';
  O.current_class = []; 
  return O.translate(ast);
}

O.translate = function(ast) {
  return match(ast,
               ['program', many(_)], O.transPrograms,
               ['classDecl', _, _, _], O.transClassDecl,
               ['methodDecl', _, _, _, _], O.transMethodDecl,
               ['varDecls', many(_)], O.transVarDecls,
               ['return', _], O.transReturn,
               ['setVar', _, _], O.transSetVar,
               ['setInstVar', _, _], O.transSetInstVar,
               ['exprStmt', _], O.transExpr,
               ['null'], O.transNull,
               ['true'], O.transTrue,
               ['false'], O.transFalse,
               ['number', _], O.transNumber,
               ['getVar', _], O.transGetVar,
               ['getInstVar', _], O.transGetInstVar,
               ['new', _, many(_)], O.transNew,
               ['send', _, _, many(_)], O.transSend,
               ['super', _, many(_)], O.transSuper,
               ['block', _, _], O.transBlock,
               ['this'], O.transThis); 
};

O.transStatements = function(statements) {
  var ret = '';
  for (var i = 0; i < statements.length; i++) {
    ret += O.translate(statements[i]) + ';\n';
  }
  return ret;
}

O.transPrograms = function(statements) {
  return 'OO.initializeCT();\n' + O.transStatements(statements);
};

O.transClassDecl = function(name, superClassname, instVarNames) {
  O.super_class_dict[name] = superClassname;
  var varnames = []
  for (var i = 0; i < instVarNames.length; i++) {
    varnames.push('"' + instVarNames[i] + '"');
  }
  return 'OO.declareClass("' + name + '", "' + superClassname + '", [' + varnames.join(', ') + '])';  
};

O.transMethodDecl = function(className, sel, args, implFn) {
  var args_st = ['_this'];
  for (var i = 0; i < args.length; i++) {
    args_st.push(args[i]);
  }
  O.current_class.push(className);
  var ret = 'OO.declareMethod("' + className + '", "' + sel + '", ' + 
                              'function (' + args_st.join(', ') + ') {\n' +
                              '  var $return_marker = {};\n' + 
                              '  try {\n' + 
                              O.transStatements(implFn) + 
                              '  } catch (e) { \n' + 
                              '    if (e instanceof NLR && e.return_marker === $return_marker) { \n' +
                              '      return e.return_value;' +
                              '    } else throw e; \n' +  
                              '  }; \n' +
                              '  return null; })\n';
  O.current_class.pop();
  return ret;
};

O.transVarDecls = function(var_pairs) {
  var binding_pair_st = [];
  for (var i = 0; i < var_pairs.length; i++) {
    binding_pair_st.push(var_pairs[i][0] + " = " + O.translate(var_pairs[i][1]));
  }
  return 'var ' + binding_pair_st.join(', ') + '\n';
};

O.transReturn = function(e) {
  return 'throw new NLR($return_marker, ' + O.translate(e) + ')';
};

O.transSetInstVar = function(x, e) {
  return 'OO.setInstVar(_this, "' + x + '", ' + O.translate(e) + ')'; 
};

O.transSetVar = function(x, e) {
  return x + " = " + O.translate(e) + '\n';
};

O.transExpr = function(e) {
  return O.translate(e);
};

O.transTrue = function() { return "true"; };
O.transFalse = function() { return "false"; };
O.transNull = function() { return "null"; }
O.transNumber = function(num) { return num; }

O.transGetVar = function(x) {
  return x;
};

O.transGetInstVar = function(x) {
  return 'OO.getInstVar(_this, "' + x + '")';
};

O.transNew = function(className, e_ls) {
  var st = ['"' + className + '"'];
  for (var i = 0; i < e_ls.length; i++) {
    st.push(O.translate(e_ls[i]));
  }
  return 'OO.instantiate(' + st.join(', ') + ')';
};

O.transSend = function(recv, m, args) {
  var ret = O.translate(recv);
  var st = ['"' + m + '"'];
  for (var i = 0; i < args.length; i++) {
    st.push(O.translate(args[i]));
  }
  return 'OO.send(' + ret + ', ' + st.join(', ') + ')';
};

O.transSuper = function(m, args) {
  var st = [];
  for (var i = 0; i < args.length; i++) {
    st.push(O.translate(args));
  }
  var superClassname = O.super_class_dict[O.current_class[O.current_class.length - 1]];
  if (superClassname === undefined) {
    throw new Error("No super class");
  } else {
    return 'OO.superSend("' + superClassname + '", _this, "' + m + '"' + st.join(', ') + ')';
  }
};

O.transBlock = function(x_ls, st_ls) {
  var last_expr_index = st_ls.length;
  for (var i = 0; i < st_ls.length; i++) {
    if (Array.isArray(st_ls[i]) && st_ls[i].length > 0 && st_ls[i][0] === 'exprStmt') {
      last_expr_index = i;
    }
  }

  var implFn = 'var $return_value = null;';
  for (var i = 0; i < st_ls.length; i++) {
    if (i !== last_expr_index) {
      implFn += O.translate(st_ls[i]) + ';';
    } else {
      implFn += '$return_value = ' + O.translate(st_ls[i]) + ';';
    }
  }
  implFn += 'return $return_value;'
  return 'OO.instantiate("Block", function (' + x_ls.join(', ') + ') { \n' + 
         implFn + '})';
};
O.transThis = function() {
  return '_this';
};


var OO = {};
OO.initializeCT = function() {
  OO.class_table = {};

  // Initial Object Class
  OO.class_table["Object"] = new OO.Class("Object", undefined, []);
  OO.declareMethod("Object", "initialize", function() {});
  OO.declareMethod("Object", "===",
    function(_this, that) { return _this === that; }
  );
  OO.declareMethod("Object", "!==",
    function(_this, that) { return _this !== that; }
  );
  OO.declareMethod("Object", "isNumber",
    function(_this) { return false; }
  );

  // Initial Number Class
  OO.declareClass("Number", "Object", ["num"]);
  OO.declareMethod("Number", "isNumber", 
    function(_this) { return true; }
  );
  OO.declareMethod("Number", "+", 
    function(_this, that) { return _this + that; }
  );
  OO.declareMethod("Number", "-", 
    function(_this, that) { return _this - that; }
  );
  OO.declareMethod("Number", "*", 
    function(_this, that) { return _this * that; }
  );
  OO.declareMethod("Number", "/", 
    function(_this, that) { return _this / that; }
  );
  OO.declareMethod("Number", "%", 
    function(_this, that) { return _this % that; }
  );
  OO.declareMethod("Number", "<", 
    function(_this, that) { return _this < that; }
  );
  OO.declareMethod("Number", "<=", 
    function(_this, that) { return _this <= that; }
  );
  OO.declareMethod("Number", ">=", 
    function(_this, that) { return _this >= that; }
  );
  OO.declareMethod("Number", ">", 
    function(_this, that) { return _this > that; }
  );

  OO.declareClass("Null", "Object", [])
  OO.declareClass("Boolean", "Object", [])
  OO.declareClass("True", "Boolean", [])
  OO.declareClass("False", "Boolean", [])

  OO.declareClass("Block", "Object", ["implFn"]);
  OO.declareMethod("Block", "initialize", function(_this, implFn) {
    OO.setInstVar(_this, "implFn", implFn);
  });
  OO.declareMethod("Block", "call", function(_this) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var implFn = OO.getInstVar(_this, 'implFn');
    return implFn.apply(null, args);
  });
};

OO.declareClass = function(name, superClassname, instVarNames) {
  // Exception case 1: already contains a class with the same name
  if (OO.class_table[name]) {
    throw new Error("Already contains a class with the same name");
  }

  // Exception case 2: no entry for superClassname
  if (!OO.class_table[superClassname]) {
    throw new Error("No entry for superClassname");
  }

  // Exception case 3: repeated variable and superclass has duplicate variable
  var repeated_element = false;
  for (var i = 0; i < instVarNames.length; i++) {
    for (var j = i+1; j < instVarNames.length; j++) {
      if (instVarNames[i] === instVarNames[j]) {
        throw new Error("There are duplicates in instVarNames");
      }
    }
    if (OO.class_table[superClassname].hasVar(instVarNames[i])) {
      throw new Error("There is duplicate instance variable with SuperClass");
    }
  }

  OO.class_table[name] = new OO.Class(name, 
                                      OO.class_table[superClassname], 
                                      instVarNames);
};

OO.declareMethod = function(className, selector, implFn) {
  if (OO.class_table[className]) {
    OO.class_table[className].methodNames.push(selector);
    OO.class_table[className].method[selector] = implFn;
  } else {
    throw new Error("No entry for the class");
  }
};
OO.instantiate = function(className) {
  args = Array.prototype.slice.call(arguments, 1);
  var _class = OO.class_table[className];
  if (_class) {
    var new_instance = new OO.ClassInstance(_class);
    if (_class.method["initialize"]) {
      _class.method["initialize"].apply(undefined, 
                                      [new_instance].concat(args));
    }
    return new_instance;
  } else {
    throw new Error("No entry for the class"); 
  }
};
OO.getInstVar = function(recv, instVarName) {
  if (recv.hasVar(instVarName)) {
    return recv.getValue(instVarName);
  } else {
    throw new Error("Undeclared instacne variable");
  }
};
OO.setInstVar = function(recv, instVarName, value) {
  if (recv.hasVar(instVarName)) {
    return recv.setValue(instVarName, value);
  } else {
    throw new Error("Undeclared instacne variable");
  }
};
OO.send = function(recv, selector) {
  args = Array.prototype.slice.call(arguments, 2);

  recv_class = OO.getRecvClass(recv);
  method = recv_class.getMethod(selector);
  if (method) {
    return method.apply(undefined, [recv].concat(args));
  } else {
    throw new Error("Undeclared instance selector");
  }
};
OO.superSend = function(superClassName, recv, selector) {
  args = Array.prototype.slice.call(arguments, 3);
  
  recv_class = OO.getRecvClass(recv);
  method = OO.class_table[superClassName].getMethod(selector);
  if (method) {
    return method.apply(undefined, [recv].concat(args));
  } else {
    throw new Error("Undeclared instance selector");
  }
};
OO.getSuperClassName = function(recv) {
  recv_class = OO.getRecvClass(recv);
  return recv_class.superClass.name;
};
OO.getRecvClass = function(recv) {
  if (recv === null) {
    recv_class = OO.class_table["Null"];
  } else
  if (recv === true) {
    recv_class = OO.class_table["True"];
  } else 
  if (recv === false) {
    recv_class = OO.class_table["False"];
  } else 
  if (typeof recv === "number") {
    recv_class = OO.class_table["Number"]; 
  } else {
    recv_class = recv._class;
  }
  return recv_class;
};


// Class
OO.Class = function(name, superClass, instVarNames) {
  this.name = name;
  this.superClass = superClass;
  this.instVarNames = instVarNames;
  this.method = {};
  this.methodNames = [];
};
OO.Class.prototype.hasVar = function(varname) {
  if (this.instVarNames.indexOf(varname) >= 0) return true;
  if (this.superClass) {
    return this.superClass.hasVar(varname);
  } else {
    return false;
  }
};
OO.Class.prototype.hasMethod = function(methodname) {
  if (this.methodNames.indexOf(methodname) >= 0) {
    return true;
  }
  if (this.superClass) {
    return this.superClass.hasMethod(methodname);
  } else {
    return false;
  }
};
OO.Class.prototype.getMethod = function(methodname) {
  if (this.methodNames.indexOf(methodname) >= 0) {
    return this.method[methodname];
  }
  if (this.superClass) {
    return this.superClass.getMethod(methodname);
  } else {
    return undefined;
  }
};

// ClassInstance
OO.ClassInstance = function(_class) {
  this._class = _class;
  if (_class.superClass) {
    this.superInstance = new OO.ClassInstance(_class.superClass);
  } else {
    this.superInstance = undefined;
  }
  this.variable = {};
};
OO.ClassInstance.prototype.hasVar = function(varname) {
  return this._class.hasVar(varname);
};
OO.ClassInstance.prototype.hasMethod = function(methodname) {
  return this._class.hasMethod(methodname);
};
OO.ClassInstance.prototype.getValue = function(varname) {
  if (this._class.instVarNames.indexOf(varname) >= 0) return this.variable[varname];
  if (this.superInstance) {
    return this.superInstance.getValue(varname);
  } else {
    throw new Error("Does not have an instance variable: " + varname);
  }
};
OO.ClassInstance.prototype.setValue = function(varname, value) {
  if (this._class.instVarNames.indexOf(varname) >= 0) {
    this.variable[varname] = value;
    return value;
  } else {
    if (this.superInstance) {
      return this.superInstance.setValue(varname, value);
    } else {
      throw new Error("Does not have an instance variable: " + varname);
    }
  }
};

// Pattern Matching
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
  throw new Error("match failed: " + value);
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
