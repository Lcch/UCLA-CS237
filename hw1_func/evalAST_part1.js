/*
 * Chen Hao (904547539)
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
    var tag = ast[0];
    var args = ast.slice(1);
    return this.impls[tag].apply(this, args);
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
    throw new Error('unbound identifier: ' + name);
  }
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
  fun: function(x, e) {
    return ['closure', x, e, this];
  },
  id: function(name) {
    return this.lookup(name);
  },
  "call": function(ef) {
    var func = this.eval(ef);
    var var_list = func[1];
    var newEnv = new Env({}, func[3]);
    if (var_list.length + 1 > arguments.length) {
      throw new Error("function: calling with too few args");
    }
    if (var_list.length + 1 < arguments.length) {
      throw new Error("funciont: calling with too many args");
    }
    for (var i = 1; i < arguments.length; i++) {
      newEnv.variable[var_list[i-1]] = this.eval(arguments[i]);
    }
    return newEnv.eval(func[2]);
  },
  "let": function(x, e1, e2) {
    var newEnv = new Env({}, this);
    console.log(typeof x);
    newEnv.variable[x] = this.eval(e1);
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


