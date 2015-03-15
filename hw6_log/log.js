// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

function isClause(c) { return c instanceof Clause; };
function isVar(v) { return v instanceof Var; };

Rule.version_num = 0;

Rule.prototype.makeCopyWithFreshVarNames = function() {
	var version_num = ++Rule.version_num;
	var head = this.head.freshVarNames(version_num);
	var body = this.body.map(function(x) {
							 	return x.freshVarNames(version_num);
							 });
	return new Rule(head, body);
};

Clause.prototype.freshVarNames = function(version_num) {
	var args = this.args.map(function(x) { 
							 	return x.freshVarNames(version_num); 
							 });
	return new Clause(this.name, args);
};
Var.prototype.freshVarNames = function(version_num) {
	return new Var('$' + version_num + '_' + this.name);
};

Clause.prototype.rewrite = function(subst) {
	var args = this.args.map(function(x) {
							 	return x.rewrite(subst);
							 });
	return new Clause(this.name, args)
};

Var.prototype.rewrite = function(subst) {
	var term = subst.lookup(this.name);
	if (term !== undefined) {
		if (isVar(term) || isClause(term)) {
      return term.rewrite(subst);
		}
    return term; 
	} else {
		return this;
	}
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
	if (term1 === term2) return this;
	if (!isVar(term1)) {
		var temp = term1;
		term1 = term2;
		term2 = temp;
	};
	if (isVar(term1) && isVar(term2) && term1.name === term2.name) return this;
	if (isVar(term1) && this.lookup(term1.name) !== undefined) {
		return this.unify(this.lookup(term1.name), term2);
	}
	if (isVar(term2) && this.lookup(term2.name) !== undefined) {
		return this.unify(term1, this.lookup(term2.name));
	}
	if (isVar(term1)) {
		var name = term1.name;
		this.bind(name, term2);
		return this;
	}
	if (isClause(term1) && isClause(term2) && term1.name === term2.name &&
		term1.args.length === term2.args.length) {
		for (var i = 0; i < term1.args.length; i++) {
			this.unify(term1.args[i], term2.args[i]);
		}
		return this;
	}; 
	throw new Error("unification failed");
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

function Interator(next) {
	this.next = next;
};

function Goal(clauses, subst, search_index, parent, depth) {
	this.clauses = clauses;
	this.subst = subst;
	this.search_index = search_index;
	this.parent = parent;
  this.depth = depth;
};

function matchRules(rules_set, cur_c) {
  var rls = rules_set[cur_c.name];
  if (rls === undefined) {
    return [];
  } else {
    var ret = [];
    for (var i = 0; i < rls.length; i++) {
      if (rls[i].head.args.length === cur_c.args.length) {
        ret.push(rls[i]);
      }
    }
    return ret;
  }
};

function cleanOutput(subst) {
  console.log("answer: ", subst);
  var ret_subst = new Subst();
  for (var varName in subst.bindings) {
    ret_subst.bind(varName, new Var(varName).rewrite(subst));
  }
  return ret_subst;
};

rules_set = {};

Program.prototype.solve = function() {
  console.log("NEW QUERY");
  rules_set = {};
  for (var i = 0; i < this.rules.length; i++) {
    var name = this.rules[i].head.name;
    if (rules_set[name] === undefined) {
      rules_set[name] = [];
    }
    rules_set[name].push(this.rules[i]);
  }
  return this.search(this.query);
};

Program.prototype.search = function(queries) {
	var goal = new Goal(queries, new Subst(), -1, null, 0);
	var stack = [];
	stack.push(goal);

  return new Interator(function() {
    while (stack.length > 0) {
      var goal = stack[stack.length - 1];
      console.log(goal);
      if (goal.clauses.length === 0) {
        stack.pop();
        return cleanOutput(goal.subst);
      } else {
        goal.search_index += 1;
        var cur_c = goal.clauses[0];
        var rls = matchRules(rules_set, cur_c);
        if (goal.search_index >= rls.length) {
          stack.pop();
        } else {
          var choose_rule = rls[goal.search_index].makeCopyWithFreshVarNames();
          var clone_subst = goal.subst.clone();
          try {
            clone_subst.unify(cur_c, choose_rule.head);
          } catch (e) {
            if (e.message === "unification failed") {
              continue;
            } else {
              throw e;
            }
          }
          var new_queries = [];
          for (var i = 1; i < goal.clauses.length; i++) {
            new_queries.push(goal.clauses[i].rewrite(clone_subst));
          }
          for (var i = 0; i < choose_rule.body.length; i++) {
            new_queries.push(choose_rule.body[i].rewrite(clone_subst));
          }
          stack.push(new Goal(new_queries, clone_subst, -1, goal, goal.depth + 1));
        }
      }
    }
    return false;
  });
};

