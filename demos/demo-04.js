const evaluate = (expression, environment) => {
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return expression;
  case 'string':
    return environment(expression);
  case 'object':
    if (Array.isArray(expression)) {
      const results = expression.map(e => evaluate(e, environment));
      return results[0](... results.slice(1));
    }
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

const globalEnvironment = name => {
  if (name === 'name') {
    return 'Carlo';
  } else if (name === '+') {
    return (a, b) => a + b;
  } else {
    throw new Error(`Can't resolve variable ${name}`);
  }
};

console.log(evaluate(['+', 1, 2], globalEnvironment));
