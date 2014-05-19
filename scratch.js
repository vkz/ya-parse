esprima = require('esprima'),
estraverse = require('estraverse'),
escodegen = require('escodegen');


var test = 'function test () { return "string1" + "string2" + "string3";}' ;

//var test = 'function test () { return "string1" + "string2" + 5;}' ;

//var test = 'function test () { return "string1" + 5 + "string3";}' ;

function childrenAreStrings (left, right) {
    return (left.type === "Literal" && typeof left.value === "string" &&
            right.type === "Literal" && typeof right.value === "string");
}

ast = esprima.parse(test);

estraverse.replace(ast, {
    leave: function(node, parent) {
        if(node.type === 'BinaryExpression' &&
           node.operator === '+' &&
           childrenAreStrings(node.left, node.right)) {
            return { type : "Literal", value : node.left.value + node.right.value};
        }
    }
});

console.log(escodegen.generate (ast));
