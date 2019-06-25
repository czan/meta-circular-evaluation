// Run me as $ node rokt-lang-doc.js example-program.md

const whitespace = ' \t\n',
      breaking = '(){}',
      endoflist = {};

const toString = obj => {
  if (typeof(obj) === 'function') {
    return toString(obj());
  } else if (Array.isArray(obj)) {
    return '(' +  obj.map(toString).join(' ') + ')';
  } else if (obj === null) {
    return '';
  } else {
    return ''+obj;
  }
};

const readList = (string, i) => {
  while (i < string.length
         && whitespace.indexOf(string[i]) !== -1) {
    i++;
  }
  if (i >= string.length) {
    throw new Error("Whoops! Trying to read at the end of a file!");
  }
  const start = i;
  let result = null;
  switch (string[i++]) {
  case '(':
    result = [];
    while (i < string.length) {
      const r = readList(string, i);
      i = r.i;
      if (r.result === endoflist) {
        break;
      } else {
        result.push(r.result);
      }
    }
    break;
  case ')':
    result = endoflist;
    break;
  case '"':
    while (i < string.length
           && string[i] !== '"') {
      if (string[i++] === '\\')
        i++;
    }
    i++;
    if (i >= string.length) {
      throw new Error("Unterminated string! " + start);
    }
    result = ["quote", JSON.parse(string.substring(start, i))];
    break;
  case '{':
    return readText(string, i, '}');
  default:
    --i; // we actually want the first character, too
    while (i < string.length
           && whitespace.indexOf(string[i]) === -1
           && breaking.indexOf(string[i]) === -1) {
      i++;
    }
    result = string.substring(start, i);
    if (!isNaN(+result)) {
      result = +result; // convert to a number
    }
  }
  return {result, i};
};

const readText = (string, i=0, terminate='') => {
  let start = i, result = [];
  while (i < string.length && terminate.indexOf(string[i]) === -1) {
    if (string[i] === '@') {
      if (string[i + 1] === '@' || terminate.indexOf(string[i + 1]) !== -1) {
        i += 2;
      } else {
        result.push(['quote', string.substring(start, i).replace(/@(.)/g, '$1')]);
        const r = readList(string, i+1, true);
        i = r.i;
        if (r.result !== null) {
          let newlines = 0;
          while (string[i] === '\n') {
            i++;
            newlines++;
          }
          if (newlines > 0) {
            result.push(['add-newlines', r.result, newlines]);
          } else {
            result.push(r.result);
          }
        }
        start = i;
      }
    } else {
      ++i;
    }
  }
  result.push(['quote', string.substring(start, i).replace(/@(.)/g, '$1')]);
  result.unshift('string-append');
  if (i < string.length) {
    i++;
  }
  return {result, i};
};

const globals = {
  '=': (a, b) => a === b,
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  'string-append': (... objs) => objs.filter(x => x !== null).map(toString).join(''),
  'print': (... args) => {
    console.log(... args);
    return args[args.length - 1];
  },
  'eval': (expr, env) => evaluate(expr, env),
  'push': (list, item) => {list.push(item);},
  'first': list => list[0],
  'rest': list => list.slice(1),
  'empty?': list => list.length === 0,
  'last': list => list[list.length - 1],
  'list': (... args) => args,
  'map': (f, list) => list.map(f),
  'cons': (car, cdr) => [car].concat(cdr),
  'append': (... lists) => [].concat(... lists),
  'join': (list, sep) => list.join(sep),
  'normalize-link': name => name.toLocaleLowerCase().replace(/\s/g, '-').replace(/[^0-9a-z-]/g, ''),
  'apply': (f, args) => f(... args),
  'delay': (env, expr) => () => evaluate(expr, env),
  'load': file => {
    const str = require('fs').readFileSync(file).toString();
    try {
      let i = 0;
      while (true) {
        const r = readList(str, i);
        evaluate(r.result, name => {
          if (name in globals) {
            return globals[name];
          } else {
            throw new Error(`${name} could not be resolved`);
          }
        });
        i = r.i;
      }
    } catch (e) {
      if (e.message !== "Whoops! Trying to read at the end of a file!") {
        throw e;
      }
    }
    return null;
  },
  'add-newlines': (value, i) => () => {
    const x = toString(value);
    if (x === null || x === '') {
      return '';
    } else {
      let result = x;
      while (--i >= 0) {
        result += '\n';
      }
      return result;
    }
  }
};
globals.delay.fexpr = true;

const evaluate = (expression, environment) => {
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return expression;
  case 'string':
    return environment(expression);
  case 'object':
    if (Array.isArray(expression)) {
      if (expression[0] === 'fn') {
        return ((... args) => evaluate(expression[2], name => {
          const index = expression[1].indexOf(name);
          return (0 <= index ? args[index] : environment(name));
        }));
      } else if (expression[0] === 'fexpr') {
        const result = ((... args) => evaluate(expression[2], name => {
          const index = expression[1].indexOf(name);
          return (0 <= index ? args[index] : environment(name));
        }));
        result.fexpr = true;
        return result;
      } else if (expression[0] === 'if') {
        const condition = evaluate(expression[1], environment);
        return evaluate((condition ? expression[2] : expression[3]), environment);
      } else if (expression[0] === 'def') {
        globals[expression[1]] = evaluate(expression[2], environment);
        return null; // expression[1];
      } else if (expression[0] === 'quote') {
        return expression[1];
      } else {
        const head = evaluate(expression[0], environment);
        if (head.fexpr) {
          return head(environment, ... expression.slice(1));
        } else {
          return head(... expression.slice(1).map(e => evaluate(e, environment)));
        }
      }
    }
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

// const f = evaluate(
//   ['fn', ['x'],
//    ['do',
//     ['print', ['+', 'x', 1]],
//     ['*', 'x', 10]]],
//   name => {if (name in globals) {return globals[name];} else {throw new Error(`${name} could not be resolved`);}});

// console.log('result =>', f(10));
// console.log('result =>', f(20));

process
  .argv
  .slice(2) // leave off "node" and the script's name
  .forEach(file => console.log(
    evaluate(readText(require('fs').readFileSync(file).toString()).result,
             name => {
               if (name in globals) {
                 return globals[name];
               } else {
                 throw new Error(`${name} could not be resolved`);
               }
             })));
