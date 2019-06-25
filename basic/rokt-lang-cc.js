// Run me as $ node rokt-lang-cc.js example-program.json

/* global setImmediate, setTimeout */

const globals = {
  '+': (cont, a, b) => setImmediate(() => cont(a + b)),
  '-': (cont, a, b) => setImmediate(() => cont(a - b)),
  '*': (cont, a, b) => setImmediate(() => cont(a * b)),
  '/': (cont, a, b) => setImmediate(() => cont(a / b)),
  '==': (cont, x, y) => setImmediate(() => cont(x == y)),
  'sleep': (cont, ms) => setTimeout(() => cont(ms), ms),
  'print': (cont, ... args) => setImmediate(() => {
    console.log(... args);
    return cont(args[args.length - 1]);
  })
};

const globalEnvironment = name => {
  if (name in globals) {
    return globals[name];
  } else {
    throw new Error(`${name} could not be resolved`);
  }
};

// evaluate arguments in parallel
const evaluateAll = (cont, expressions, environment) => {
  const results = new Array(expressions.length);
  let completed = 0;
  for (let i = 0; i < expressions.length; ++i) {
    evaluate(result => {
      results[i] = result;
      completed++;
      if (completed === expressions.length) {
        return setImmediate(() => cont(results));
      }
      return null; // just to stop the warning
    }, expressions[i], environment);
  }
};

const evaluate = (cont, expression, environment) => {
  const c = arg => (Math.random() < 0.5 ? setImmediate(() => cont(arg)) : cont(arg));
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return c(expression);
  case 'string':
    return c(environment(expression));
  case 'object':
    if (Array.isArray(expression)) {
      if (expression[0] === 'fn') {
        return c((cont, ... args) => evaluate(cont, expression[2], name => {
          const index = expression[1].indexOf(name);
          return (index >= 0 ? args[index] : environment(name));
        }));
      } else if (expression[0] === 'if') {
        return evaluate(condition => {
          return evaluate(cont, (condition ? expression[2] : expression[3]), environment);
        }, expression[1], environment);
      } else if (expression[0] === 'def') {
        return evaluate(result => {
          globals[expression[1]] = result;
          return c(result);
        }, expression[2], environment);
      } else {
        return evaluateAll(result => {
          return result[0].apply(null, [cont].concat(result.slice(1)));
        }, expression, environment);
      }
    }
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

process
  .argv
  .slice(2) // leave off "node" and the script's name
  .forEach(file => {
    const forms = JSON.parse(require('fs').readFileSync(file));
    const run = i => {
      if (i < forms.length) {
        evaluate(() => run(i + 1), forms[i], globalEnvironment);
      }
    };
    run(0);
  });
