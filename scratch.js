var esprima = require('esprima'),
    estraverse = require('estraverse'),
    escodegen = require('escodegen');

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
};

exports.toLiteral = toLiteral;

// var test1 = 'function test () { return "string1" + "string2" + "string3";}' ;
// var test2 = 'function test () { return "string1" + "string2" + 5;}' ;
// var test3 = 'function test () { return "string1" + 5 + "string3";}' ;
// console.log(toLiteral(test1));
// console.log(toLiteral(test2));
// console.log(toLiteral(test3));
