// Run me as $ node rokt-lang-attribute.js example-program.txt

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
  } else if (obj instanceof Date) {
    return obj.toLocaleDateString('en-AU');
    // return obj.toISOString().substr(0, 10);
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
          result.push(r.result);
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
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  'or': (... args) => args.find(x => x && x !== ''),
  'and': (... args) => args.every(x => x && x !== ''),
  'not': x => !x,
  '=': (a, b) => a === b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  'day-of-week': date => date.toLocaleString('en-AU', {weekday: 'long'}),
  'months-before': (date, months) => {
    const d = new Date(date);
    d.setMonth(date.setMonth() - months);
    return d;
  },
  'days-before': (date, days) => {
    const d = new Date(date);
    d.setDate(date.getDate() - days);
    return d;
  },
  'string-append': (... objs) => objs.filter(x => x !== null).map(toString).join('')
};

const globalEnvironment = name => {
  if (name in globals) {
    return globals[name];
  } else {
    return null;
  }
};

const evaluate = (expression, environment) => {
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return expression;
  case 'string':
    return environment(expression);
  case 'object':
    if (Array.isArray(expression)) {
      if (expression[0] === 'if') {
        const condition = evaluate(expression[1], environment);
        return evaluate((condition ? expression[2] : expression[3]), environment);
      } else if (expression[0] === 'def') {
        globals[expression[1]] = evaluate(expression[2], environment);
        return null; // expression[1];
      } else if (expression[0] === 'quote') {
        return expression[1];
      } else {
        const results = expression.map(e => evaluate(e, environment));
        return results[0](... results.slice(1));
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

const lookupEnvironment = map => name => {
  if (name in map) {
    return map[name];
  } else {
    return globalEnvironment(name);
  }
};

process
  .argv
  .slice(2) // leave off "node" and the script's name
  .forEach(file => process.stdout.write(
    evaluate(readText(require('fs').readFileSync(file).toString()).result, lookupEnvironment({
      'now': new Date(),
      'rokt.firstname': 'Carlo',
      'rokt.eventdate': new Date('2019-03-18')
    }))));
