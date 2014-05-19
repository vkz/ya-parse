var assert = require('assert'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    toLiteral = require('./scratch').toLiteral;


suite('Concatenating string literals', function (){
    var tests =
            [
                'function test () { return "string1" + "string2" + "string3";}',
                'function test () { return "string1" + "string2" + 5;}',
                'function test () { return "string1" + 5 + "string3";}'
            ];
    var results =
            [
                'function test () { return "string1string2string3";}',
                'function test () { return "string1string2" + 5;}',
                'function test () { return "string1" + 5 + "string3";}'
            ].map(function(code, i, ar) { return escodegen.generate(esprima.parse(code));});

    function check(source, target) {
        assert.equal(toLiteral(source), target);
    }

    test('concatenate >2 strings should produce a single string', function() {
        check(tests[0], results[0]);
    });

    test('concatenate 2 strings and num should produce `str + num`', function() {
        check(tests[1], results[1]);
    });

    test('concatenate string with a num should not change the code', function() {
        check(tests[2], results[2]);
    });


});
