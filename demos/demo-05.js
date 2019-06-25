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

console.log(evaluate(['if', ['=', 1, 1], 10, 0], globalEnvironment));
console.log(evaluate(['if', ['=', 1, 2], 10, 0], globalEnvironment));
