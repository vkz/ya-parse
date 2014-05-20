var esprima = require('esprima'),
    estraverse = require('estraverse'),
    escodegen = require('escodegen');

// // Pollute global - makes testing in Chrome easier
// esprima = require('esprima'),
// estraverse = require('estraverse'),
// escodegen = require('escodegen');

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

exports.toLiteral = toLiteral;

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

exports.toDot = toDot;

// ---------------------- Problem 2-3: scope --------------------------- //

function createsScope(node) {
    var type = node.type;
    return type === 'Program' || type === 'FunctionDeclaration' || type === 'FunctionExpression';
}

function replaceThis(src) {

    // Enter: when 'Program' or 'FunctionDeclaration' or 'FunctionExpression'
    // - push new scope,
    // - set currentScope to the pushed one
    // - for every 'ThisExpression' push it onto current scope

    // Leave: when 'Program' or 'FunctionDeclaration' or 'FunctionExpression'
    // - pop scope
    // - if scope.length > 2
    // - - scope.forEach node
    // - - - replace node.object with { name : "_t", type : "Identifier"}
    // - prepend function's body with 'var _t = this;'

    var ast = esprima.parse(src),
        scopes = [],
        newScope = function genEmptyScope() {var empty = []; return empty;};

    estraverse.traverse(ast, {
        enter: function(node, parent) {
            if (createsScope(node)) {
                // push new scope onto scopes
                scopes.push([]);

            } else if (node.type === 'ThisExpression') {
                var currentScope = scopes[scopes.length - 1];
                currentScope.push(node);

            }
        },

        leave: function(node, parent) {

            var currentScope,
                bodyPrefix;

            if (createsScope(node)) {
                currentScope = scopes.pop();
                if (currentScope.length > 2) {

                    // replace every `this` in scope with `_t`
                    currentScope.forEach (function (node) {
                        node.type = "Identifier";
                        node.name = "_t";
                    });

                    // add 'var _t = this;' declaration
                    bodyPrefix = esprima.parse('var _t = this;').body;
                    node.body = bodyPrefix.concat(node.body);

                }
            }

        }
    });
    return escodegen.generate(ast);
}

exports.replaceThis = replaceThis;
