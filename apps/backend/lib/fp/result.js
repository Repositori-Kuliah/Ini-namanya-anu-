/**
 * Functional Programming Core: Result Monad & Pipe (Pure JavaScript).
 * Strictly avoids OOP classes, constructors, or mutation.
 */

export const ok = (value) => Object.freeze({ _tag: 'Ok', value });
export const err = (error) => Object.freeze({ _tag: 'Err', error });

export const isOk = (result) => Boolean(result && result._tag === 'Ok');
export const isErr = (result) => Boolean(result && result._tag === 'Err');

/**
 * Functor map for Result: transforms Ok value, leaves Err untouched.
 * @param {(val: any) => any} fn
 */
export const map = (fn) => (result) =>
  isOk(result) ? ok(fn(result.value)) : result;

/**
 * Monadic flatMap for Result: chains computations that return Result.
 * @param {(val: any) => object} fn
 */
export const flatMap = (fn) => (result) =>
  isOk(result) ? fn(result.value) : result;

/**
 * Pattern matching for Result.
 * @param {(val: any) => any} onOk
 * @param {(err: any) => any} onErr
 */
export const match = (onOk, onErr) => (result) =>
  isOk(result) ? onOk(result.value) : onErr(result.error);

/**
 * Functional pipe for left-to-right function composition.
 * @param {any} initialValue
 * @param {...Function} fns
 */
export const pipe = (initialValue, ...fns) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);
