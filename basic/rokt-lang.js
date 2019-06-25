// Run me as $ node rokt-lang.js example-program.json

const globals = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  'print': (... args) => {
    console.log(... args);
    return args[args.length - 1];
  }
};

const globalEnvironment = name => {
  if (name in globals) {
    return globals[name];
  } else {
    throw new Error(`${name} could not be resolved`);
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
      if (expression[0] === 'fn') {
        return ((... args) => evaluate(expression[2], name => {
          const index = expression[1].indexOf(name);
          return (0 <= index ? args[index] : environment(name));
        }));
      } else if (expression[0] === 'if') {
        const condition = evaluate(expression[1], environment);
        return evaluate((condition ? expression[2] : expression[3]), environment);
      } else if (expression[0] === 'def') {
        globals[expression[1]] = evaluate(expression[2], environment);
        return expression[1];
      } else {
        const results = expression.map(e => evaluate(e, environment));
        return results[0](... results.slice(1));
      }
    }
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

process
  .argv
  .slice(2) // leave off "node" and the script's name
  .forEach(file => {
    JSON.parse(require('fs').readFileSync(file)).forEach(form => {
      evaluate(form, globalEnvironment);
    });
  });
