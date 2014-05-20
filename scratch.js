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
