var OO = {};

OO.initializeCT = function() {
  OO.class_table = {};

  // Initial Object Class
  OO.class_table["Object"] = new OO.Class("Object", undefined, []);
  OO.declareMethod("Object", "initialize", function() {});
  OO.declareMethod("Object", "===",
    function(_this, that) {
      return _this === that;
    }
  );
  OO.declareMethod("Object", "!==",
    function(_this, that) {
      return _this !== that;
    }
  );
  OO.declareMethod("Object", "isNumber",
    function(_this) {
      return false;
    }
  );

  // Initial Number Class
  OO.declareClass("Number", "Object", ["num"]);
  OO.declareMethod("Number", "isNumber", 
    function(_this) {
      return true;
    }
  );
  OO.declareMethod("Number", "+", 
    function(_this, that) {
      return _this + that;
    }
  );
  OO.declareMethod("Number", "-", 
    function(_this, that) {
      return _this - that;
    }
  );
  OO.declareMethod("Number", "*", 
    function(_this, that) {
      return _this * that;
    }
  );
  OO.declareMethod("Number", "/", 
    function(_this, that) {
      return _this / that;
    }
  );
  OO.declareMethod("Number", "%", 
    function(_this, that) {
      return _this % that;
    }
  );
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
    OO.class_table[className].method[selector] = implFn;
  } else {
    throw new Error("No entry for the class");
  }
};
OO.instantiate = function(className) {
  args = Array.prototype.slice.call(arguments, 1);
  var _class = OO.class_table[className];
  console.log(_class);
  if (_class) {
    var new_instance = new OO.ClassInstance(_class);
    console.log("OK", _class.method["initialize"]);
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

  if (typeof recv === "number") {
    recv_class = OO.class_table["Number"];
  } else {
    recv_class = recv._class;
  }

  method = recv_class.getMethod(selector);
  console.log("hey: ", method);
  if (method) {
    return method.apply(undefined, [recv].concat(args));
  } else {
    throw new Error("Undeclared instance selector");
  }
};
OO.superSend = function(superClassName, recv, selector) {
  args = Array.prototype.slice.call(arguments, 3);
  recv_super_class = recv._class.superClass;
  method = recv_super_class.getMethod(selector);
  if (method) {
    return method.apply(undefined, [recv.superInstance].concat(args));
  } else {
    throw new Error("Undeclared instance selector");
  }
};


// Class
OO.Class = function(name, superClass, instVarNames) {
  this.name = name;
  this.superClass = superClass;
  this.instVarNames = instVarNames;
  this.method = {};
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
  if (this.method[methodname]) return true;
  if (this.superClass) {
    return this.superClass.hasMethod(methodname);
  } else {
    return false;
  }
};
OO.Class.prototype.getMethod = function(methodname) {
  if (this.method[methodname]) return this.method[methodname];
  if (this.superClass) {
    return this.superClass.getMethod(methodname);
  } else {
    return undefined;
  }
};

// ClassInstance
OO.ClassInstance = function(_class) {
  this._class = _class;
  console.log(_class);
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
  } else {
    if (this.superInstance) {
      return this.superInstance.setValue(varname, value);
    } else {
      throw new Error("Does not have an instance variable: " + varname);
    }
  }
};


