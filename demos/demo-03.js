const evaluate = (expression, environment) => {
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return expression;
  case 'string':
    return environment(expression);
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

const globalEnvironment = name => {
  if (name === 'name') {
    return 'Carlo';
  } else {
    throw new Error(`Can't resolve variable ${name}`);
  }
};

console.log(evaluate("name", globalEnvironment));
