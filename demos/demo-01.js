const evaluate = expression => {
  switch (typeof(expression)) {
    // fill in cases here
  }
  throw new Error(`Don't know how to evaluate ${expression}`);
};

console.log(evaluate(10));
