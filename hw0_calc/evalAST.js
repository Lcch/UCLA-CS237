C.evalAST = function(ast) {
  C.vtable = {};
  return ev(ast);
};

function ev(ast) {
  if (typeof ast === "number") {
    return ast;
  } else {
    var tag = ast[0];
    var args = ast.slice(1);
    return impls[tag].apply(undefined, args);
  }
}

var impls = {
  "seq": function(x, y) {
    ev(x);
    return ev(y);
  },
  "+": function(x, y) {
    return ev(x) + ev(y);
  },
  "-": function(x, y) {
    return ev(x) - ev(y);
  },
  "*": function(x, y) {
    return ev(x) * ev(y);
  },
  "^": function(x, y) {
    return Math.pow(ev(x), ev(y));
  },
  "/": function(x, y) {
    return ev(x) / ev(y);
  },
  "set": function(x, y) {
    return (C.vtable[x] = ev(y));
  },
  "id": function(x) {
    return C.vtable[x] || 0;
  }
};
