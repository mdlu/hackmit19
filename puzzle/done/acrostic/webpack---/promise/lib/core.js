'use strict';

var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};

function getThen(obj) {
    try {
        return obj.then;
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}

function tryCallOne(fn, a) {
    try {
        return fn(a);
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}

function tryCallTwo(fn, a, b) {
    try {
        fn(a, b);
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}

module.exports = Promise;

function Promise(fn) {
    if (typeof this !== 'object') {
        throw new TypeError('Promises must be constructed via new');
    }
    if (typeof fn !== 'function') {
        throw new TypeError('not a function');
    }
    this._45 = 0;
    this._81 = 0;
    this._65 = null;
    this._54 = null;
    if (fn === noop) return;
    doResolve(fn, this);
}
Promise._10 = null;
Promise._97 = null;
Promise._61 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
    if (this.constructor !== Promise) {
        return safeThen(this, onFulfilled, onRejected);
    }
    var res = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, res));
    return res;
};

function safeThen(self, onFulfilled, onRejected) {
    return new self.constructor(function(resolve, reject) {
        var res = new Promise(noop);
        res.then(resolve, reject);
        handle(self, new Handler(onFulfilled, onRejected, res));
    });
};

function handle(self, deferred) {
    while (self._81 === 3) {
        self = self._65;
    }
    if (Promise._10) {
        Promise._10(self);
    }
    if (self._81 === 0) {
        if (self._45 === 0) {
            self._45 = 1;
            self._54 = deferred;
            return;
        }
        if (self._45 === 1) {
            self._45 = 2;
            self._54 = [self._54, deferred];
            return;
        }
        self._54.push(deferred);
        return;
    }
    handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
    asap(function() {
        var cb = self._81 === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            if (self._81 === 1) {
                resolve(deferred.promise, self._65);
            } else {
                reject(deferred.promise, self._65);
            }
            return;
        }
        var ret = tryCallOne(cb, self._65);
        if (ret === IS_ERROR) {
            reject(deferred.promise, LAST_ERROR);
        } else {
            resolve(deferred.promise, ret);
        }
    });
}

function resolve(self, newValue) {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self) {
        return reject(
            self,
            new TypeError('A promise cannot be resolved with itself.')
        );
    }
    if (
        newValue &&
        (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
        var then = getThen(newValue);
        if (then === IS_ERROR) {
            return reject(self, LAST_ERROR);
        }
        if (
            then === self.then &&
            newValue instanceof Promise
        ) {
            self._81 = 3;
            self._65 = newValue;
            finale(self);
            return;
        } else if (typeof then === 'function') {
            doResolve(then.bind(newValue), self);
            return;
        }
    }
    self._81 = 1;
    self._65 = newValue;
    finale(self);
}

function reject(self, newValue) {
    self._81 = 2;
    self._65 = newValue;
    if (Promise._97) {
        Promise._97(self, newValue);
    }
    finale(self);
}

function finale(self) {
    if (self._45 === 1) {
        handle(self, self._54);
        self._54 = null;
    }
    if (self._45 === 2) {
        for (var i = 0; i < self._54.length; i++) {
            handle(self, self._54[i]);
        }
        self._54 = null;
    }
}

function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
    var done = false;
    var res = tryCallTwo(fn, function(value) {
        if (done) return;
        done = true;
        resolve(promise, value);
    }, function(reason) {
        if (done) return;
        done = true;
        reject(promise, reason);
    })
    if (!done && res === IS_ERROR) {
        done = true;
        reject(promise, LAST_ERROR);
    }
}



//////////////////
// WEBPACK FOOTER
// ./~/promise/lib/core.js
// module id = 4
// module chunks = 0