const evaluate = expression => {
  switch (typeof(expression)) {
  case 'number':
  case 'boolean':
    return expression;
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

console.log(evaluate(10));
