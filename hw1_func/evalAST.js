/*
 * Chen Hao (904547539)
 * hw2 of PPL
 */

F.evalAST = function(ast) {
  emptyEnv = new Env({}, undefined);
  return emptyEnv.eval(ast);
};

function Env(variable, parent) {
  this.variable = variable;
  this.parent = parent;
}

Env.prototype.eval = function(ast) {
  if (this.isValue(ast)) {
    return ast;
  } else {
    return this.impls[ast[0]].apply(this, ast.slice(1)); 
  }
}

Env.prototype.isValue = function(ast) {
  return (typeof ast === 'number' || typeof ast === 'boolean' ||
          ast === null || ast[0] === 'closure');
}

Env.prototype.lookup = function(name) {
  if (this.variable.hasOwnProperty(name)) {
    return this.variable[name];
  } else if (this.parent) {
    return this.parent.lookup(name);
  } else {
    return undefined;
  }
}

Env.prototype.changeValue = function(name, value) {
  if (this.variable.hasOwnProperty(name)) {
    this.variable[name] = value;
  } else if (this.parent) {
    this.parent.changeValue(name, value);
  }
}

Env.prototype.setValue = function(name, value) {
  if (this.lookup(name) === undefined) {
    throw new Error("set inexistent variable"); 
  } else {
    this.changeValue(name, value);
  }
}

Env.prototype.patternMatch = function(ev, p, ret_v) {
  var rv = {};
  if (p === null || typeof p === 'number' || typeof p === 'boolean') {
    return p === ev;
  } else 
  if (p[0] === '_') {
    return true;
  } else 
  if (p[0] === 'id') {
    ret_v[p[1]] = ev;
    return true; 
  } else 
  if (p[0] === 'cons') {
    if (ev === null) return false;
    if (typeof ev === 'object' && ev.length === p.length && ev[0] === 'cons') {
      return (this.patternMatch(ev[1], p[1], ret_v) && 
              this.patternMatch(ev[2], p[2], ret_v));
    }
    return false;
  }
  return false;
}

function chkType(val, type) {
  if (typeof val === type) {
    return val;
  } else {
    throw new Error(val + " is not the type of " + type);
    return undefined;
  }
}

Env.prototype.impls = {
  delay: function(e) {
    return ['closure', [], e, this];
  },
  force: function(e) {
    return this.eval(['call', e]);
  },
  listComp: function(e, x, elist, epred) {
    var ret = null;
    // derive the elements of list
    var vlist = function(list) {
                  var ret = [];
                  while (list !== null && 
                         list.length === 3 && list[0] === 'cons') {
                    ret.push(list[1]);
                    list = list[2];
                  }
                  return list === null ? ret : undefined;
                } (this.eval(elist));
    for (var i = vlist.length - 1; i >= 0; i--) {
      var newEnv = new Env({}, this);
      newEnv.variable[x] = vlist[i];
      if (epred === undefined || chkType(newEnv.eval(epred), 'boolean')) {
        ret = ['cons', newEnv.eval(e), ret];
      }
    }
    return ret;
  },
  match: function(e) {
    var ev = this.eval(e);
    for (var i = 1; i < arguments.length; i += 2) {
      var new_v = {};
      if (this.patternMatch(ev, arguments[i], new_v)) {
        var newEnv = new Env({}, this);
        newEnv.variable = new_v;
        return newEnv.eval(arguments[i+1]);
      } 
    }
    throw new Error("no match pattern");
  },
  set: function(id, e) {
    var value = this.eval(e);
    this.setValue(id, value);
    return value;
  },
  seq: function(e1, e2) {
    this.eval(e1);
    return this.eval(e2);
  },
  cons: function(e1, e2) {
    return ['cons', this.eval(e1), this.eval(e2)];
  },
  fun: function(x, e) {
    return ['closure', x, e, this];
  },
  id: function(name) {
    var value = this.lookup(name);
    if (value === undefined) {
      throw new Error('unbound identifier: ' + name);
    }
    return value;
  },
  "call": function(ef) {
    var func = this.eval(ef);
    var var_list = func[1];
    var newEnv = new Env({}, func[3]);
    if (var_list === undefined) {
      throw new Error("calling non-function");
    }

    // currying
    if (var_list.length + 1 > arguments.length) {
      var newFunc_var_list = var_list.slice();
      newFunc_var_list.splice(0, arguments.length - 1);
      for (var i = 1; i < arguments.length; i++) {
        newEnv.variable[var_list[i-1]] = this.eval(arguments[i]);
      }
      return ['closure', newFunc_var_list, func[2], newEnv];
    }
    // too many arguments
    if (var_list.length + 1 < arguments.length) {
      throw new Error("funciont: calling with too many args");
    }

    // call function
    for (var i = 1; i < arguments.length; i++) {
      newEnv.variable[var_list[i-1]] = this.eval(arguments[i]);
    }
    return newEnv.eval(func[2]);
  },
  "let": function(x, e1, e2) {
    var newEnv = new Env({}, this);
    newEnv.variable[x] = 'undefined';
    newEnv.variable[x] = newEnv.eval(e1);
    return newEnv.eval(e2);
  },
  "if": function(e1, e2, e3) {
    return chkType(this.eval(e1), 'boolean') ? this.eval(e2) : this.eval(e3);
  },
  "+": function(x, y) {
    return chkType(this.eval(x), 'number') + chkType(this.eval(y), 'number');
  },
  "-": function(x, y) {
    return chkType(this.eval(x), 'number') - chkType(this.eval(y), 'number');
  },
  "*": function(x, y) {
    return chkType(this.eval(x), 'number') * chkType(this.eval(y), 'number');
  },
  "/": function(x, y) {
    var val_y = chkType(this.eval(y), 'number');
    if (val_y === 0) {
      throw new Error("divide 0");
    }
    return chkType(this.eval(x), 'number') / val_y;
  },
  "%": function(x, y) {
    var val_y = chkType(this.eval(y), 'number');
    if (val_y === 0) {
      throw new Error("divide 0");
    }
    return chkType(this.eval(x), 'number') % val_y;
  },
  "=": function(x, y) {
    return this.eval(x) === this.eval(y);
  },
  "!=": function(x, y) {
    return this.eval(x) !== this.eval(y);
  },
  "<": function(x, y) {
    return chkType(this.eval(x), 'number') < chkType(this.eval(y), 'number');
  },
  ">": function(x, y) {
    return chkType(this.eval(x), 'number') > chkType(this.eval(y), 'number');
  },
  "and": function(x, y) {
    var val_x = chkType(this.eval(x), 'boolean');
    var val_y = chkType(this.eval(y), 'boolean');
    return val_x && val_y;
  },
  "or": function(x, y) {
    var val_x = chkType(this.eval(x), 'boolean');
    var val_y = chkType(this.eval(y), 'boolean');
    return val_x || val_y;
  }
};
