var assert = require('assert'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    toDot = require('./scratch').toDot;


suite('obj["key"] to obj.key', function (){
    var tests =
            [
                'function test () { var obj = {key : 1}; return obj["key"];}',
                '({key : 1})["key"]',
                'function test () { var obj = {"a key" : 1}; return obj["a key"];}',
                'function test (obj) { return obj["key"]["nested key"];}'
            ];
    var results =
            [
                'function test () { var obj = {key : 1}; return obj.key;}',
                '({key : 1}).key',
                'function test () { var obj = {"a key" : 1}; return obj["a key"];}',
                'function test (obj) { return obj.key["nested key"];}'
            ].map(function(code, i, ar) { return escodegen.generate(esprima.parse(code));});

    function check(source, target) {
        assert.equal(toDot(source), target);
    }

    test('simple obj[\"key\"] should become obj.key', function() {
        check(tests[0], results[0]);
    });

    test('accessing object literal should work', function() {
        check(tests[1], results[1]);
    });

    test('multi-word keys should only be used with obj[..] syntax', function() {
        check(tests[2], results[2]);
    });


    test('should work with nested objects', function() {
        check(tests[3], results[3]);
    });


});
