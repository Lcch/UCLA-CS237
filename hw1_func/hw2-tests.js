tests(
  F,
  {
    name: 'recursive let',
    code: 'let f = fun n -> if n = 0\n' +
          '                 then 1\n' +
          '                 else n * f (n - 1) in\n' +
          '  f 5',
    expected: 120
  },
  {
    name: 'currying',
    code: 'let add = fun x y -> x + y in\n' +
          '  let inc = add 1 in\n' +
          '    inc 10',
    expected: 11
  },
  {
    name: 'cons',
    code: '5 + 4::0::6::nil',
    expected: ['cons', 9, ['cons', 0, ['cons', 6, null]]]
  },
  {
    name: 'list sugar',
    code: '[5 + 4;0;6]',
    expected: ['cons', 9, ['cons', 0, ['cons', 6, null]]]
  },
  {
    name: 'match',
    code: 'let lst = [1;2::3;4] in\n' +
          '  match lst with\n' +
          '    [1;x::3;y] -> y * 10 + x',
    expected: 42
  },
  {
    name: 'match failure should throw exception',
    code: 'match 5 with 6 -> 42',
    shouldThrow: true
  },
  {
    name: 'factorial w/ pattern matching',
    code: 'let f = fun n ->\n' +
          '          match n with\n' +
          '            0 -> 1\n' +
          '          | _ -> n * f (n - 1) in\n' +
          '  f 6',
    expected: 720
  },
  {
    name: 'map',
    code: 'let map = fun f l ->\n' +
          '            match l with\n' +
          '              nil -> nil\n' +
          '            | x::xs -> f x::map f xs in\n' +
          '  map (fun x -> x + 1) [1;2;3]',
    expected: ['cons', 2, ['cons', 3, ['cons', 4, null]]]
  },
  {
    name: 'set and seq',
    code: 'let counter = (let count = 0 in fun -> count := count + 1) in\n' +
          '  counter (); counter (); counter ()',
    expected: 3
  },
  {
    name: 'list comprehension w/o predicate',
    code: 'let nats = [0;1;2;3;4] in\n' +
          '  [x * 2 | x <- nats]',
    expected: ['cons', 0, ['cons', 2, ['cons', 4, ['cons', 6, ['cons', 8, null]]]]]
  },
  {
    name: 'list comprehension w/ predicate',
    code: 'let nats = [0;1;2;3;4] in\n' +
          '  [x * 2 | x <- nats, x % 2 = 0]',
    expected: ['cons', 0, ['cons', 4, ['cons', 8, null]]]
  },
  {
    name: 'delay and force',
    code: 'let take = fun n s ->\n' +
          '  match n with\n' +
          '    0 -> nil\n' +
          '  | _ -> match s with\n' +
          '           first::rest -> first::take (n - 1) (force rest) in\n' +
          'let ones = 1::delay ones in\n' +
          '  take 5 ones',
    expected:  ['cons', 1, ['cons', 1, ['cons', 1, ['cons', 1, ['cons', 1, null]]]]]
  },
  {
    name: 'rec let 2',
    code: 'let x = fun x -> x + 1 in x 3',
    expected: 4
  },
  {
    name: 'rec let 3',
    code: 'let x = x + 1 in x',
    shouldThrow: true
  },
  {
    name: 'rename rec let',
    code: 'let f = fun n -> if n = 0 \n' +
          '      then 1\n' +
          '      else n * f (n - 1) in \n' +
          '   let g = f in\n' +
          '      g 5 \n',
    expected: 120
  },
  {
    name: 'set and closure',
    code: 'let x = 2 in \n' +
          '   let addTwo = fun y -> x + y in\n' +
          '       x := 5; addTwo 5',
    expected: 10
  },
  {
    name: 'Scheme-style force',
    code: 'let a = 1 in \n' + 
          '   let addOne = delay (1 + a) in\n' +
          '     force addOne; a := 2; force addOne\n',
    expected: 3
  },
  {
    name: 'Copy delay',
    code: 'let a = 1 in \n' + 
          '   let addOne = delay (1 + a) in\n' + 
          '     force addOne;\n' + 
          '     let addOne2 = addOne in\n' + 
          '       a := 2;\n' + 
          '       force addOne2\n',
    expected: 3
  },
  {
    name: 'reverse a list', 
    code: 'let f = fun xs -> match xs with\n' + 
          '     a::as -> (f as) :: a\n' + 
          '   | null -> null\n' + 
          'in f [1;2;3]\n',
    expected: ["cons", ["cons", ["cons", null, 3], 2], 1]
  },
  {
    name: 'find the index of an item in a list',
    code: 'let f = fun xs x i -> match xs with \n'+
          '    a::as -> if a=x then i else f as x (i+1)\n' +
          '  | null -> -1\n' +
          'in\n' + 
          'f [1;5;4;2] 2 0\n',
    expected: 3
  },
  {
    name: 'currying and set',
    code: 'let x = (x := (fun p q -> p + q); x 1) in \n' + 
          '  x 2\n',
    expected: 3
  },
  {
    name: 'empty list comprehension',
    code: '[x * 2 | x <- [1;2;3;4], x > 4]',
    expected: null
  },
  {
    name: 'list comprehension predicate must be boolean',
    code: '[x * 2 | x <- [1;2;3;4], 0]',
    shouldThrow: true
  },
  {
    name: 'true reverse 1',
    code: 'let reverse = fun l -> (\n' +
          '  let reverseAndAppend = fun l last -> match l with\n' +
          '    [] -> last\n' +
          '    | x::xs -> reverseAndAppend xs (x::last)\n' +
          '    | x -> x::last\n' +
          '  in\n' +
          '    reverseAndAppend l null)\n' +
          'in\n' +
          '  reverse [1;2;3;null;5]',
    expected: ["cons", 5, ["cons", null, ["cons", 3, ["cons", 2, ["cons", 1, null]]]]]
  },
  {
    name: 'true reverse 2',
    code: 'let reverse = fun l -> (\n' +
          '  let reverseAndAppend = fun l last -> match l with\n' +
          '    [] -> last\n' +
          '    | x::xs -> reverseAndAppend xs (x::last)\n' +
          '    | x -> x::last\n' +
          '  in\n' +
          '    reverseAndAppend l null)\n' +
          'in\n' +
          '  reverse []',
    expected: null
  },
  {
    name: 'true reverse 3',
    code: 'let append = fun xs n -> match xs with\n' +
          '    null -> n::null\n' +
          '  | h::t -> h::(append t n)\n' +
          'in\n' +
          'let rev = fun xs -> match xs with\n' +
          '    null -> null\n' +
          '  | h::t -> append (rev t) h\n' +
          'in\n' +
          'rev [1;nil;3::2;4]\n',
    expected: ["cons", 4, ["cons", ["cons", 3, 2], ["cons", null, ["cons", 1, null]]]]
  },
  {
    name: 'pattern match 1',
    code: 'let f = fun l1 -> match l1 with\n' +
          '  [_;_;_] -> true\n' +
          '  | _ -> false\n' + 
          'in f [1;2;3;4]',
    expected: false
  },
  {
    name: 'pattern match 1',
    code: 'let f = fun l1 -> match l1 with\n' +
          '  x -> true\n' +
          '  | x::y -> false\n' + 
          'in f [1;2;3;4]',
    expected: true
  },
  {
    name: 'delay and set 1',
    code: 'let a = 0 in\n' +
          '  let s = delay (6*a) in\n' +
          '    let a = 7 in\n' +
          '      (force s;\n' +
          '      let a = 9 in\n' +
          '      force s)',
    expected: 0
  },
  {
    name: 'delay and set 2',
    code: 'let a = 0 in\n' +
          '  let s = delay (6*a) in\n' +
          '    let a = 7 in\n' +
          '      (force s;\n' +
          '      a := 9;\n' +
          '      force s)',
    expected: 0
  },
  {
    name: 'delay and set 3',
    code: 'let a = 0 in\n' +
          '  let s = delay (6*a) in\n' +
          '    a := 5;\n' +
          '    let a = 7 in\n' +
          '      (force s;\n' +
          '      let a = 9 in\n' +
          '      force s)',
    expected: 30
  },
  {
    name: 'rec let 4',
    code: 'let x = (x := 1; x + 1) in x',
    expected: 2
  },
  {
    name: 'rec let 5',
    code: 'let x = 1 in let x = x + 1 in x',
    shouldThrow: true
  },
  {
    name: 'sieve',
    code: 'let head = fun s ->\n' +
          '  match s with\n' +
          '    x::_ -> x\n' +
          'in\n' +
          '\n' +
          'let tail = fun s ->\n' +
          '  match s with\n' +
          '    _::dxs -> force dxs    \n' +
          'in\n' +
          '\n' +
          'let take = fun n s ->\n' +
          '  match n with\n' +
          '    0 -> null\n' +
          '  | _ -> (head s)::take (n - 1) (tail s)\n' +
          'in\n' +
          '\n' +
          'let ones = 1::delay ones\n' +
          'in\n' +
          '\n' +
          'let sum = fun s1 s2 ->\n' +
          '  (head s1) + (head s2)::delay (sum (tail s1) (tail s2))\n' +
          'in\n' +
          '\n' +
          'let fib = 1::delay (1::delay (sum fib (tail fib)))\n' +
          'in\n' +
          '\n' +
          'let filterMultiples = fun n s ->\n' +
          '  if head s % n = 0\n' +
          '  then filterMultiples n (tail s)\n' +
          '  else (head s)::delay (filterMultiples n (tail s))\n' +
          'in\n' +
          '\n' +
          'let sieve = fun s ->\n' +
          '  (head s)::delay (sieve (filterMultiples (head s) (tail s))) \n' +
          'in\n' +
          '\n' +
          'let intsFrom = fun n -> n::delay (intsFrom (n + 1))\n' +
          'in\n' +
          '\n' +
          'let primes = sieve (intsFrom 2)\n' +
          'in\n' +
          '\n' +
          'let first = fun p s ->\n' +
          '  if p (head s)\n' +
          '  then head s\n' +
          '  else first p (tail s)\n' +
          'in\n' +
          '\n' +
          'first (fun x -> x > 1002) primes\n',
    expected: 1009
  }
);

