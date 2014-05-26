var esprima = require('esprima'),
    estraverse = require('estraverse'),
    escodegen = require('escodegen');

/**
 when bundled with Browserify access module functionality from `scratch` object
 */


// ---------------------- Problem 2-1: string literals ----------------- //
function childrenAreStrings (left, right) {
    return (left.type === "Literal" && typeof left.value === "string" &&
            right.type === "Literal" && typeof right.value === "string");
}

function toLiteral(src) {
    var ast = esprima.parse(src);
    estraverse.replace(ast, {
        leave: function(node, parent) {
            if(node.type === 'BinaryExpression' &&
               node.operator === '+' &&
               childrenAreStrings(node.left, node.right)) {
                return { type : "Literal", value : node.left.value + node.right.value};
            }
        }
    });
    return escodegen.generate(ast);
}

// ---------------------- Problem 2-2: obj[key] ------------------------ //
function identifierLike(str) {
    // cheat to avoid using RegExps
    var toks = esprima.tokenize(str);
    return toks.length === 1 && toks[0].type === "Identifier";
}

function toDot(src) {
    var ast = esprima.parse(src);
    estraverse.traverse(ast, {
        leave: function(node, parent) {
            if(node.type === 'MemberExpression' && node.computed && // accessing object with obj[key]
               node.property.type === "Literal" &&                  // key is a Literal
               typeof node.property.value === "string" &&           // key is a String
               identifierLike(node.property.value)) {               // key can be used after dot in obj.key
                node.computed = false;
                node.property = (esprima.parse('obj.' + node.property.value)).body[0].expression.property;
            }
        }
    });
    return escodegen.generate(ast);
}

// ---------------------- Problem 2-3: scope --------------------------- //

function createsScope(node) {
    var type = node.type;
    return type === 'Program' || type === 'FunctionDeclaration' || type === 'FunctionExpression';
}

function replaceThis(src) {

    // INVARIANT: both `enter` and `leave` callbacks always leave
    // currentScope pointing at the top of the `scopes` stack

    // enter: when 'Program' or 'FunctionDeclaration' or 'FunctionExpression'
    // - push new scope,
    // - for every 'ThisExpression' push it onto current scope

    // leave: when 'Program' or 'FunctionDeclaration' or 'FunctionExpression'
    // - if scope.length > 2
    // - - scope.forEach node
    // - - - replace node with { name : "_t", type : "Identifier"}
    // - - prepend function's body with 'var _t = this;'
    // - restore the INVARIANT


    var ast = esprima.parse(src),
        scopes = [],
        currentScope = [];

    estraverse.traverse(ast, {
        enter: function(node, parent) {
            if (createsScope(node)) {
                // push a new scope
                currentScope = [];
                scopes.push(currentScope);
            } else if (node.type === 'ThisExpression') {
                // at least one scope will have been created,
                // so currentScope is safe to push into
                currentScope.push(node);
            }
        },

        leave: function(node, parent) {
            var bodyPrefix;

            if (createsScope(node)) {
                // INVARIANT makes the use of currentScope safe
                if (currentScope.length > 2) {

                    // replace every `this` in scope with `_t`
                    currentScope.forEach (function (node) {
                        node.type = "Identifier";
                        node.name = "_t";
                    });

                    // add 'var _t = this;' declaration
                    bodyPrefix = esprima.parse('var _t = this;').body;
                    node.type === 'Program' ? node.body = bodyPrefix.concat(node.body) : node.body.body = bodyPrefix.concat(node.body.body);
                }
                // leaving the scope, restore the INVARIANT
                scopes.pop();
                currentScope = scopes[scopes.length - 1];
            }
        }
    });
    return escodegen.generate(ast);
}

/**
 value of `module.exports` will be bound to `scratch` in the browser
 scratch === Object {toLiteral: function, toDot: function, replaceThis: function}
*/
module.exports = {toLiteral: toLiteral, toDot: toDot, replaceThis: replaceThis};
