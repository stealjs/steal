function privateBar() {
    return bar();
}

export function bar() {
    return 'bar result';
}

export function foo() {
    return privateBar();
}

foo();
