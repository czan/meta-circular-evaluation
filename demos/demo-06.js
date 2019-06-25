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
        return (... args) => {
          const localEnvironment = name => {
            const index = expression[1].indexOf(name);
            return (0 <= index ? args[index] : environment(name));
          };
          return evaluate(expression[2], localEnvironment);
        };
      } else if (expression[0] === 'if') {
        if (evaluate(expression[1], environment)) {
          return evaluate(expression[2], environment);
        } else {
          return evaluate(expression[3], environment);
        }
      } else {
        const results = expression.map(e => evaluate(e, environment));
        return results[0](... results.slice(1));
      }
    }
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

const globalEnvironment = name => {
  if (name === '+') {
    return (a, b) => a + b;
  } else if (name === '=') {
    return (a, b) => a === b;
  } else {
    throw new Error(`Can't resolve variable ${name}`);
  }
};

const f = ['fn', ['x'], ['if', ['=', 'x', 1], 10, 0]];
console.log(evaluate([f, 0], globalEnvironment));
console.log(evaluate([f, 1], globalEnvironment));
