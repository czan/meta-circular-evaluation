@(load "stdlib.md")

# My test document

@(toc)

@(heading {A documentation language})

Most programming languages are set up to communicate computation, both to the computer and to other people. But what if we had a programming language that let us write _documents_? Well, that would be interesting.

@(subheading {This is a heading})

This is an example document to show how you could do custom parsing into a simple AST that can be "compiled" into a text stream. This file can be understood to be a program that generates a markdown file, but it looks a fair bit like Markdown itself.

Except for blocks like this:

    @(example (+ 1 2))

which specify some code to be run. Now we can easily show examples and be sure that the output remains up to date.

    @(example (- 1 2))
    @(example (* 1 2))
    @(example (/ 1 2))

We can also define our own functions with custom logic:

@(def example-sum
  (fexpr (env x y)
    {The sum of @x and @y is @(+ (eval x env) (eval y env))}))

    @(example-sum 1 (+ 1 1))

which specify some code to be run.

@(heading {The next heading})

We can write more content here, if we want to.
