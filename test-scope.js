var assert = require('assert'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    replaceThis = require('./scratch').replaceThis;


suite('replacing scoped this', function (){
    var tests =
            [

                //function scope
                'function test () { this.a(); this.b(); this.c(); this.d(); }',

                // global scope
                'this.a(); this.b(); this.c(); this.d();',

                // nested scopes: global -> scope1 -> scope2
                'this.a(); this.b(); this.c();' +
                'function scope1 () {' +
                '    this.a(); this.b();' +
                '    function scope2 () { this.a(); this.b(); this.c(); this.d(); };' +
                '}'

            ];
    var results =
            [
                //function scope
                'function test () { var _t = this; _t.a(); _t.b(); _t.c(); _t.d(); }',

                // global scope
                'var _t = this; _t.a(); _t.b(); _t.c(); _t.d();',

                // nested scopes: global -> scope1 -> scope2
                'var _t = this; _t.a(); _t.b(); _t.c(); _t.d();' +
                'function scope1 () {' +
                '    this.a(); this.b();' +
                '    function scope2 () { var _t = this; _t.a(); _t.b(); _t.c(); _t.d(); };' +
                '}'

            ].map(function(code, i, ar) { return escodegen.generate(esprima.parse(code));});

    function check(source, target) {
        assert.equal(replaceThis(source), target);
    }

    test('3x `this` in a function gets replaced', function() {
        check(tests[0], results[0]);
    });

    test('3x `this` in global scope gets replaced', function() {
        check(tests[1], results[1]);
    });

    test('only 3x `this` in global and nested scopes get replaced', function() {
        check(tests[2], results[2]);
    });

});
