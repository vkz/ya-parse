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

// var tests =
//         [
//             'function test () { var obj = {key : 1}; return obj["key"];}',
//             '({key : 1})["key"]',
//             'function test () { var obj = {"a key" : 1}; return obj["a key"];}',
//             'function test (obj) { return obj["key"]["nested key"];}'
//         ];
