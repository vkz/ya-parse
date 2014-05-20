(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012-2013 Michael Ficarra <escodegen.copyright@michael.ficarra.me>
  Copyright (C) 2012-2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2013 Irakli Gozalishvili <rfobic@gmail.com>
  Copyright (C) 2012 Robert Gust-Bardon <donate@robert.gust-bardon.org>
  Copyright (C) 2012 John Freeman <jfreeman08@gmail.com>
  Copyright (C) 2011-2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*global exports:true, generateStatement:true, generateExpression:true, require:true, global:true*/
(function () {
    'use strict';

    var Syntax,
        Precedence,
        BinaryPrecedence,
        SourceNode,
        estraverse,
        esutils,
        isArray,
        base,
        indent,
        json,
        renumber,
        hexadecimal,
        quotes,
        escapeless,
        newline,
        space,
        parentheses,
        semicolons,
        safeConcatenation,
        directive,
        extra,
        parse,
        sourceMap,
        FORMAT_MINIFY,
        FORMAT_DEFAULTS;

    estraverse = require('estraverse');
    esutils = require('esutils');

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ComprehensionBlock: 'ComprehensionBlock',
        ComprehensionExpression: 'ComprehensionExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportDeclaration: 'ExportDeclaration',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        GeneratorExpression: 'GeneratorExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    Precedence = {
        Sequence: 0,
        Yield: 1,
        Assignment: 1,
        Conditional: 2,
        ArrowFunction: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        Member: 17,
        Primary: 18
    };

    BinaryPrecedence = {
        '||': Precedence.LogicalOR,
        '&&': Precedence.LogicalAND,
        '|': Precedence.BitwiseOR,
        '^': Precedence.BitwiseXOR,
        '&': Precedence.BitwiseAND,
        '==': Precedence.Equality,
        '!=': Precedence.Equality,
        '===': Precedence.Equality,
        '!==': Precedence.Equality,
        'is': Precedence.Equality,
        'isnt': Precedence.Equality,
        '<': Precedence.Relational,
        '>': Precedence.Relational,
        '<=': Precedence.Relational,
        '>=': Precedence.Relational,
        'in': Precedence.Relational,
        'instanceof': Precedence.Relational,
        '<<': Precedence.BitwiseSHIFT,
        '>>': Precedence.BitwiseSHIFT,
        '>>>': Precedence.BitwiseSHIFT,
        '+': Precedence.Additive,
        '-': Precedence.Additive,
        '*': Precedence.Multiplicative,
        '%': Precedence.Multiplicative,
        '/': Precedence.Multiplicative
    };

    function getDefaultOptions() {
        // default options
        return {
            indent: null,
            base: null,
            parse: null,
            comment: false,
            format: {
                indent: {
                    style: '    ',
                    base: 0,
                    adjustMultilineComment: false
                },
                newline: '\n',
                space: ' ',
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false
            },
            moz: {
                comprehensionExpressionStartsWithAssignment: false,
                starlessGenerator: false,
                parenthesizedComprehensionBlock: false
            },
            sourceMap: null,
            sourceMapRoot: null,
            sourceMapWithCode: false,
            directive: false,
            raw: true,
            verbatim: null
        };
    }

    function stringRepeat(str, num) {
        var result = '';

        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }

        return result;
    }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    function hasLineTerminator(str) {
        return (/[\r\n]/g).test(str);
    }

    function endsWithLineTerminator(str) {
        var len = str.length;
        return len && esutils.code.isLineTerminator(str.charCodeAt(len - 1));
    }

    function updateDeeply(target, override) {
        var key, val;

        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }

        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    } else {
                        target[key] = updateDeeply({}, val);
                    }
                } else {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    function generateNumber(value) {
        var result, point, temp, exponent, pos;

        if (value !== value) {
            throw new Error('Numeric literal whose value is NaN');
        }
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            throw new Error('Numeric literal whose value is negative');
        }

        if (value === 1 / 0) {
            return json ? 'null' : renumber ? '1e400' : '1e+400';
        }

        result = '' + value;
        if (!renumber || result.length < 3) {
            return result;
        }

        point = result.indexOf('.');
        if (!json && result.charCodeAt(0) === 0x30  /* 0 */ && point === 1) {
            point = 0;
            result = result.slice(1);
        }
        temp = result;
        result = result.replace('e+', 'e');
        exponent = 0;
        if ((pos = temp.indexOf('e')) > 0) {
            exponent = +temp.slice(pos + 1);
            temp = temp.slice(0, pos);
        }
        if (point >= 0) {
            exponent -= temp.length - point - 1;
            temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
        }
        pos = 0;
        while (temp.charCodeAt(temp.length + pos - 1) === 0x30  /* 0 */) {
            --pos;
        }
        if (pos !== 0) {
            exponent -= pos;
            temp = temp.slice(0, pos);
        }
        if (exponent !== 0) {
            temp += 'e' + exponent;
        }
        if ((temp.length < result.length ||
                    (hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length)) &&
                +temp === value) {
            result = temp;
        }

        return result;
    }

    // Generate valid RegExp expression.
    // This function is based on https://github.com/Constellation/iv Engine

    function escapeRegExpCharacter(ch, previousIsBackslash) {
        // not handling '\' and handling \u2028 or \u2029 to unicode escape sequence
        if ((ch & ~1) === 0x2028) {
            return (previousIsBackslash ? 'u' : '\\u') + ((ch === 0x2028) ? '2028' : '2029');
        } else if (ch === 10 || ch === 13) {  // \n, \r
            return (previousIsBackslash ? '' : '\\') + ((ch === 10) ? 'n' : 'r');
        }
        return String.fromCharCode(ch);
    }

    function generateRegExp(reg) {
        var match, result, flags, i, iz, ch, characterInBrack, previousIsBackslash;

        result = reg.toString();

        if (reg.source) {
            // extract flag from toString result
            match = result.match(/\/([^/]*)$/);
            if (!match) {
                return result;
            }

            flags = match[1];
            result = '';

            characterInBrack = false;
            previousIsBackslash = false;
            for (i = 0, iz = reg.source.length; i < iz; ++i) {
                ch = reg.source.charCodeAt(i);

                if (!previousIsBackslash) {
                    if (characterInBrack) {
                        if (ch === 93) {  // ]
                            characterInBrack = false;
                        }
                    } else {
                        if (ch === 47) {  // /
                            result += '\\';
                        } else if (ch === 91) {  // [
                            characterInBrack = true;
                        }
                    }
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    previousIsBackslash = ch === 92;  // \
                } else {
                    // if new RegExp("\\\n') is provided, create /\n/
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    // prevent like /\\[/]/
                    previousIsBackslash = false;
                }
            }

            return '/' + result + '/' + flags;
        }

        return result;
    }

    function escapeAllowedCharacter(code, next) {
        var hex, result = '\\';

        switch (code) {
        case 0x08  /* \b */:
            result += 'b';
            break;
        case 0x0C  /* \f */:
            result += 'f';
            break;
        case 0x09  /* \t */:
            result += 't';
            break;
        default:
            hex = code.toString(16).toUpperCase();
            if (json || code > 0xFF) {
                result += 'u' + '0000'.slice(hex.length) + hex;
            } else if (code === 0x0000 && !esutils.code.isDecimalDigit(next)) {
                result += '0';
            } else if (code === 0x000B  /* \v */) { // '\v'
                result += 'x0B';
            } else {
                result += 'x' + '00'.slice(hex.length) + hex;
            }
            break;
        }

        return result;
    }

    function escapeDisallowedCharacter(code) {
        var result = '\\';
        switch (code) {
        case 0x5C  /* \ */:
            result += '\\';
            break;
        case 0x0A  /* \n */:
            result += 'n';
            break;
        case 0x0D  /* \r */:
            result += 'r';
            break;
        case 0x2028:
            result += 'u2028';
            break;
        case 0x2029:
            result += 'u2029';
            break;
        default:
            throw new Error('Incorrectly classified character');
        }

        return result;
    }

    function escapeDirective(str) {
        var i, iz, code, quote;

        quote = quotes === 'double' ? '"' : '\'';
        for (i = 0, iz = str.length; i < iz; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27  /* ' */) {
                quote = '"';
                break;
            } else if (code === 0x22  /* " */) {
                quote = '\'';
                break;
            } else if (code === 0x5C  /* \ */) {
                ++i;
            }
        }

        return quote + str + quote;
    }

    function escapeString(str) {
        var result = '', i, len, code, singleQuotes = 0, doubleQuotes = 0, single, quote;

        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27  /* ' */) {
                ++singleQuotes;
            } else if (code === 0x22  /* " */) {
                ++doubleQuotes;
            } else if (code === 0x2F  /* / */ && json) {
                result += '\\';
            } else if (esutils.code.isLineTerminator(code) || code === 0x5C  /* \ */) {
                result += escapeDisallowedCharacter(code);
                continue;
            } else if ((json && code < 0x20  /* SP */) || !(json || escapeless || (code >= 0x20  /* SP */ && code <= 0x7E  /* ~ */))) {
                result += escapeAllowedCharacter(code, str.charCodeAt(i + 1));
                continue;
            }
            result += String.fromCharCode(code);
        }

        single = !(quotes === 'double' || (quotes === 'auto' && doubleQuotes < singleQuotes));
        quote = single ? '\'' : '"';

        if (!(single ? singleQuotes : doubleQuotes)) {
            return quote + result + quote;
        }

        str = result;
        result = quote;

        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if ((code === 0x27  /* ' */ && single) || (code === 0x22  /* " */ && !single)) {
                result += '\\';
            }
            result += String.fromCharCode(code);
        }

        return result + quote;
    }

    /**
     * flatten an array to a string, where the array can contain
     * either strings or nested arrays
     */
    function flattenToString(arr) {
        var i, iz, elem, result = '';
        for (i = 0, iz = arr.length; i < iz; ++i) {
            elem = arr[i];
            result += isArray(elem) ? flattenToString(elem) : elem;
        }
        return result;
    }

    /**
     * convert generated to a SourceNode when source maps are enabled.
     */
    function toSourceNodeWhenNeeded(generated, node) {
        if (!sourceMap) {
            // with no source maps, generated is either an
            // array or a string.  if an array, flatten it.
            // if a string, just return it
            if (isArray(generated)) {
                return flattenToString(generated);
            } else {
                return generated;
            }
        }
        if (node == null) {
            if (generated instanceof SourceNode) {
                return generated;
            } else {
                node = {};
            }
        }
        if (node.loc == null) {
            return new SourceNode(null, null, sourceMap, generated, node.name || null);
        }
        return new SourceNode(node.loc.start.line, node.loc.start.column, (sourceMap === true ? node.loc.source || null : sourceMap), generated, node.name || null);
    }

    function noEmptySpace() {
        return (space) ? space : ' ';
    }

    function join(left, right) {
        var leftSource = toSourceNodeWhenNeeded(left).toString(),
            rightSource = toSourceNodeWhenNeeded(right).toString(),
            leftCharCode = leftSource.charCodeAt(leftSource.length - 1),
            rightCharCode = rightSource.charCodeAt(0);

        if ((leftCharCode === 0x2B  /* + */ || leftCharCode === 0x2D  /* - */) && leftCharCode === rightCharCode ||
        esutils.code.isIdentifierPart(leftCharCode) && esutils.code.isIdentifierPart(rightCharCode) ||
        leftCharCode === 0x2F  /* / */ && rightCharCode === 0x69  /* i */) { // infix word operators all start with `i`
            return [left, noEmptySpace(), right];
        } else if (esutils.code.isWhiteSpace(leftCharCode) || esutils.code.isLineTerminator(leftCharCode) ||
                esutils.code.isWhiteSpace(rightCharCode) || esutils.code.isLineTerminator(rightCharCode)) {
            return [left, right];
        }
        return [left, space, right];
    }

    function addIndent(stmt) {
        return [base, stmt];
    }

    function withIndent(fn) {
        var previousBase, result;
        previousBase = base;
        base += indent;
        result = fn.call(this, base);
        base = previousBase;
        return result;
    }

    function calculateSpaces(str) {
        var i;
        for (i = str.length - 1; i >= 0; --i) {
            if (esutils.code.isLineTerminator(str.charCodeAt(i))) {
                break;
            }
        }
        return (str.length - 1) - i;
    }

    function adjustMultilineComment(value, specialBase) {
        var array, i, len, line, j, spaces, previousBase, sn;

        array = value.split(/\r\n|[\r\n]/);
        spaces = Number.MAX_VALUE;

        // first line doesn't have indentation
        for (i = 1, len = array.length; i < len; ++i) {
            line = array[i];
            j = 0;
            while (j < line.length && esutils.code.isWhiteSpace(line.charCodeAt(j))) {
                ++j;
            }
            if (spaces > j) {
                spaces = j;
            }
        }

        if (typeof specialBase !== 'undefined') {
            // pattern like
            // {
            //   var t = 20;  /*
            //                 * this is comment
            //                 */
            // }
            previousBase = base;
            if (array[1][spaces] === '*') {
                specialBase += ' ';
            }
            base = specialBase;
        } else {
            if (spaces & 1) {
                // /*
                //  *
                //  */
                // If spaces are odd number, above pattern is considered.
                // We waste 1 space.
                --spaces;
            }
            previousBase = base;
        }

        for (i = 1, len = array.length; i < len; ++i) {
            sn = toSourceNodeWhenNeeded(addIndent(array[i].slice(spaces)));
            array[i] = sourceMap ? sn.join('') : sn;
        }

        base = previousBase;

        return array.join('\n');
    }

    function generateComment(comment, specialBase) {
        if (comment.type === 'Line') {
            if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
            } else {
                // Always use LineTerminator
                return '//' + comment.value + '\n';
            }
        }
        if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
            return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
        }
        return '/*' + comment.value + '*/';
    }

    function addComments(stmt, result) {
        var i, len, comment, save, tailingToStatement, specialBase, fragment;

        if (stmt.leadingComments && stmt.leadingComments.length > 0) {
            save = result;

            comment = stmt.leadingComments[0];
            result = [];
            if (safeConcatenation && stmt.type === Syntax.Program && stmt.body.length === 0) {
                result.push('\n');
            }
            result.push(generateComment(comment));
            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push('\n');
            }

            for (i = 1, len = stmt.leadingComments.length; i < len; ++i) {
                comment = stmt.leadingComments[i];
                fragment = [generateComment(comment)];
                if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    fragment.push('\n');
                }
                result.push(addIndent(fragment));
            }

            result.push(addIndent(save));
        }

        if (stmt.trailingComments) {
            tailingToStatement = !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
            specialBase = stringRepeat(' ', calculateSpaces(toSourceNodeWhenNeeded([base, result, indent]).toString()));
            for (i = 0, len = stmt.trailingComments.length; i < len; ++i) {
                comment = stmt.trailingComments[i];
                if (tailingToStatement) {
                    // We assume target like following script
                    //
                    // var t = 20;  /**
                    //               * This is comment of t
                    //               */
                    if (i === 0) {
                        // first case
                        result = [result, indent];
                    } else {
                        result = [result, specialBase];
                    }
                    result.push(generateComment(comment, specialBase));
                } else {
                    result = [result, addIndent(generateComment(comment))];
                }
                if (i !== len - 1 && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result = [result, '\n'];
                }
            }
        }

        return result;
    }

    function parenthesize(text, current, should) {
        if (current < should) {
            return ['(', text, ')'];
        }
        return text;
    }

    function maybeBlock(stmt, semicolonOptional, functionBody) {
        var result, noLeadingComment;

        noLeadingComment = !extra.comment || !stmt.leadingComments;

        if (stmt.type === Syntax.BlockStatement && noLeadingComment) {
            return [space, generateStatement(stmt, { functionBody: functionBody })];
        }

        if (stmt.type === Syntax.EmptyStatement && noLeadingComment) {
            return ';';
        }

        withIndent(function () {
            result = [newline, addIndent(generateStatement(stmt, { semicolonOptional: semicolonOptional, functionBody: functionBody }))];
        });

        return result;
    }

    function maybeBlockSuffix(stmt, result) {
        var ends = endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
        if (stmt.type === Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
            return [result, space];
        }
        if (ends) {
            return [result, base];
        }
        return [result, newline, base];
    }

    function generateVerbatimString(string) {
        var i, iz, result;
        result = string.split(/\r\n|\n/);
        for (i = 1, iz = result.length; i < iz; i++) {
            result[i] = newline + base + result[i];
        }
        return result;
    }

    function generateVerbatim(expr, option) {
        var verbatim, result, prec;
        verbatim = expr[extra.verbatim];

        if (typeof verbatim === 'string') {
            result = parenthesize(generateVerbatimString(verbatim), Precedence.Sequence, option.precedence);
        } else {
            // verbatim is object
            result = generateVerbatimString(verbatim.content);
            prec = (verbatim.precedence != null) ? verbatim.precedence : Precedence.Sequence;
            result = parenthesize(result, prec, option.precedence);
        }

        return toSourceNodeWhenNeeded(result, expr);
    }

    function generateIdentifier(node) {
        return toSourceNodeWhenNeeded(node.name, node);
    }

    function generatePattern(node, options) {
        var result;

        if (node.type === Syntax.Identifier) {
            result = generateIdentifier(node);
        } else {
            result = generateExpression(node, {
                precedence: options.precedence,
                allowIn: options.allowIn,
                allowCall: true
            });
        }

        return result;
    }

    function generateFunctionBody(node) {
        var result, i, len, expr, arrow;

        arrow = node.type === Syntax.ArrowFunctionExpression;

        if (arrow && node.params.length === 1 && node.params[0].type === Syntax.Identifier) {
            // arg => { } case
            result = [generateIdentifier(node.params[0])];
        } else {
            result = ['('];
            for (i = 0, len = node.params.length; i < len; ++i) {
                result.push(generatePattern(node.params[i], {
                    precedence: Precedence.Assignment,
                    allowIn: true
                }));
                if (i + 1 < len) {
                    result.push(',' + space);
                }
            }
            result.push(')');
        }

        if (arrow) {
            result.push(space);
            result.push('=>');
        }

        if (node.expression) {
            result.push(space);
            expr = generateExpression(node.body, {
                precedence: Precedence.Assignment,
                allowIn: true,
                allowCall: true
            });
            if (expr.toString().charAt(0) === '{') {
                expr = ['(', expr, ')'];
            }
            result.push(expr);
        } else {
            result.push(maybeBlock(node.body, false, true));
        }
        return result;
    }

    function generateIterationForStatement(operator, stmt, semicolonIsNotNeeded) {
        var result = ['for' + space + '('];
        withIndent(function () {
            if (stmt.left.type === Syntax.VariableDeclaration) {
                withIndent(function () {
                    result.push(stmt.left.kind + noEmptySpace());
                    result.push(generateStatement(stmt.left.declarations[0], {
                        allowIn: false
                    }));
                });
            } else {
                result.push(generateExpression(stmt.left, {
                    precedence: Precedence.Call,
                    allowIn: true,
                    allowCall: true
                }));
            }

            result = join(result, operator);
            result = [join(
                result,
                generateExpression(stmt.right, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                })
            ), ')'];
        });
        result.push(maybeBlock(stmt.body, semicolonIsNotNeeded));
        return result;
    }

    function generateExpression(expr, option) {
        var result,
            precedence,
            type,
            currentPrecedence,
            i,
            len,
            raw,
            fragment,
            multiline,
            leftCharCode,
            leftSource,
            rightCharCode,
            allowIn,
            allowCall,
            allowUnparenthesizedNew,
            property,
            isGenerator;

        precedence = option.precedence;
        allowIn = option.allowIn;
        allowCall = option.allowCall;
        type = expr.type || option.type;

        if (extra.verbatim && expr.hasOwnProperty(extra.verbatim)) {
            return generateVerbatim(expr, option);
        }

        switch (type) {
        case Syntax.SequenceExpression:
            result = [];
            allowIn |= (Precedence.Sequence < precedence);
            for (i = 0, len = expr.expressions.length; i < len; ++i) {
                result.push(generateExpression(expr.expressions[i], {
                    precedence: Precedence.Assignment,
                    allowIn: allowIn,
                    allowCall: true
                }));
                if (i + 1 < len) {
                    result.push(',' + space);
                }
            }
            result = parenthesize(result, Precedence.Sequence, precedence);
            break;

        case Syntax.AssignmentExpression:
            allowIn |= (Precedence.Assignment < precedence);
            result = parenthesize(
                [
                    generateExpression(expr.left, {
                        precedence: Precedence.Call,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + expr.operator + space,
                    generateExpression(expr.right, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ],
                Precedence.Assignment,
                precedence
            );
            break;

        case Syntax.ArrowFunctionExpression:
            allowIn |= (Precedence.ArrowFunction < precedence);
            result = parenthesize(generateFunctionBody(expr), Precedence.ArrowFunction, precedence);
            break;

        case Syntax.ConditionalExpression:
            allowIn |= (Precedence.Conditional < precedence);
            result = parenthesize(
                [
                    generateExpression(expr.test, {
                        precedence: Precedence.LogicalOR,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + '?' + space,
                    generateExpression(expr.consequent, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space + ':' + space,
                    generateExpression(expr.alternate, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ],
                Precedence.Conditional,
                precedence
            );
            break;

        case Syntax.LogicalExpression:
        case Syntax.BinaryExpression:
            currentPrecedence = BinaryPrecedence[expr.operator];

            allowIn |= (currentPrecedence < precedence);

            fragment = generateExpression(expr.left, {
                precedence: currentPrecedence,
                allowIn: allowIn,
                allowCall: true
            });

            leftSource = fragment.toString();

            if (leftSource.charCodeAt(leftSource.length - 1) === 0x2F /* / */ && esutils.code.isIdentifierPart(expr.operator.charCodeAt(0))) {
                result = [fragment, noEmptySpace(), expr.operator];
            } else {
                result = join(fragment, expr.operator);
            }

            fragment = generateExpression(expr.right, {
                precedence: currentPrecedence + 1,
                allowIn: allowIn,
                allowCall: true
            });

            if (expr.operator === '/' && fragment.toString().charAt(0) === '/' ||
            expr.operator.slice(-1) === '<' && fragment.toString().slice(0, 3) === '!--') {
                // If '/' concats with '/' or `<` concats with `!--`, it is interpreted as comment start
                result.push(noEmptySpace());
                result.push(fragment);
            } else {
                result = join(result, fragment);
            }

            if (expr.operator === 'in' && !allowIn) {
                result = ['(', result, ')'];
            } else {
                result = parenthesize(result, currentPrecedence, precedence);
            }

            break;

        case Syntax.CallExpression:
            result = [generateExpression(expr.callee, {
                precedence: Precedence.Call,
                allowIn: true,
                allowCall: true,
                allowUnparenthesizedNew: false
            })];

            result.push('(');
            for (i = 0, len = expr['arguments'].length; i < len; ++i) {
                result.push(generateExpression(expr['arguments'][i], {
                    precedence: Precedence.Assignment,
                    allowIn: true,
                    allowCall: true
                }));
                if (i + 1 < len) {
                    result.push(',' + space);
                }
            }
            result.push(')');

            if (!allowCall) {
                result = ['(', result, ')'];
            } else {
                result = parenthesize(result, Precedence.Call, precedence);
            }
            break;

        case Syntax.NewExpression:
            len = expr['arguments'].length;
            allowUnparenthesizedNew = option.allowUnparenthesizedNew === undefined || option.allowUnparenthesizedNew;

            result = join(
                'new',
                generateExpression(expr.callee, {
                    precedence: Precedence.New,
                    allowIn: true,
                    allowCall: false,
                    allowUnparenthesizedNew: allowUnparenthesizedNew && !parentheses && len === 0
                })
            );

            if (!allowUnparenthesizedNew || parentheses || len > 0) {
                result.push('(');
                for (i = 0; i < len; ++i) {
                    result.push(generateExpression(expr['arguments'][i], {
                        precedence: Precedence.Assignment,
                        allowIn: true,
                        allowCall: true
                    }));
                    if (i + 1 < len) {
                        result.push(',' + space);
                    }
                }
                result.push(')');
            }

            result = parenthesize(result, Precedence.New, precedence);
            break;

        case Syntax.MemberExpression:
            result = [generateExpression(expr.object, {
                precedence: Precedence.Call,
                allowIn: true,
                allowCall: allowCall,
                allowUnparenthesizedNew: false
            })];

            if (expr.computed) {
                result.push('[');
                result.push(generateExpression(expr.property, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: allowCall
                }));
                result.push(']');
            } else {
                if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                    fragment = toSourceNodeWhenNeeded(result).toString();
                    // When the following conditions are all true,
                    //   1. No floating point
                    //   2. Don't have exponents
                    //   3. The last character is a decimal digit
                    //   4. Not hexadecimal OR octal number literal
                    // we should add a floating point.
                    if (
                            fragment.indexOf('.') < 0 &&
                            !/[eExX]/.test(fragment) &&
                            esutils.code.isDecimalDigit(fragment.charCodeAt(fragment.length - 1)) &&
                            !(fragment.length >= 2 && fragment.charCodeAt(0) === 48)  // '0'
                            ) {
                        result.push('.');
                    }
                }
                result.push('.');
                result.push(generateIdentifier(expr.property));
            }

            result = parenthesize(result, Precedence.Member, precedence);
            break;

        case Syntax.UnaryExpression:
            fragment = generateExpression(expr.argument, {
                precedence: Precedence.Unary,
                allowIn: true,
                allowCall: true
            });

            if (space === '') {
                result = join(expr.operator, fragment);
            } else {
                result = [expr.operator];
                if (expr.operator.length > 2) {
                    // delete, void, typeof
                    // get `typeof []`, not `typeof[]`
                    result = join(result, fragment);
                } else {
                    // Prevent inserting spaces between operator and argument if it is unnecessary
                    // like, `!cond`
                    leftSource = toSourceNodeWhenNeeded(result).toString();
                    leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
                    rightCharCode = fragment.toString().charCodeAt(0);

                    if (((leftCharCode === 0x2B  /* + */ || leftCharCode === 0x2D  /* - */) && leftCharCode === rightCharCode) ||
                            (esutils.code.isIdentifierPart(leftCharCode) && esutils.code.isIdentifierPart(rightCharCode))) {
                        result.push(noEmptySpace());
                        result.push(fragment);
                    } else {
                        result.push(fragment);
                    }
                }
            }
            result = parenthesize(result, Precedence.Unary, precedence);
            break;

        case Syntax.YieldExpression:
            if (expr.delegate) {
                result = 'yield*';
            } else {
                result = 'yield';
            }
            if (expr.argument) {
                result = join(
                    result,
                    generateExpression(expr.argument, {
                        precedence: Precedence.Yield,
                        allowIn: true,
                        allowCall: true
                    })
                );
            }
            result = parenthesize(result, Precedence.Yield, precedence);
            break;

        case Syntax.UpdateExpression:
            if (expr.prefix) {
                result = parenthesize(
                    [
                        expr.operator,
                        generateExpression(expr.argument, {
                            precedence: Precedence.Unary,
                            allowIn: true,
                            allowCall: true
                        })
                    ],
                    Precedence.Unary,
                    precedence
                );
            } else {
                result = parenthesize(
                    [
                        generateExpression(expr.argument, {
                            precedence: Precedence.Postfix,
                            allowIn: true,
                            allowCall: true
                        }),
                        expr.operator
                    ],
                    Precedence.Postfix,
                    precedence
                );
            }
            break;

        case Syntax.FunctionExpression:
            isGenerator = expr.generator && !extra.moz.starlessGenerator;
            result = isGenerator ? 'function*' : 'function';

            if (expr.id) {
                result = [result, (isGenerator) ? space : noEmptySpace(),
                          generateIdentifier(expr.id),
                          generateFunctionBody(expr)];
            } else {
                result = [result + space, generateFunctionBody(expr)];
            }

            break;

        case Syntax.ArrayPattern:
        case Syntax.ArrayExpression:
            if (!expr.elements.length) {
                result = '[]';
                break;
            }
            multiline = expr.elements.length > 1;
            result = ['[', multiline ? newline : ''];
            withIndent(function (indent) {
                for (i = 0, len = expr.elements.length; i < len; ++i) {
                    if (!expr.elements[i]) {
                        if (multiline) {
                            result.push(indent);
                        }
                        if (i + 1 === len) {
                            result.push(',');
                        }
                    } else {
                        result.push(multiline ? indent : '');
                        result.push(generateExpression(expr.elements[i], {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true
                        }));
                    }
                    if (i + 1 < len) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });
            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push(']');
            break;

        case Syntax.Property:
            if (expr.kind === 'get' || expr.kind === 'set') {
                result = [
                    expr.kind, noEmptySpace(),
                    generateExpression(expr.key, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    generateFunctionBody(expr.value)
                ];
            } else {
                if (expr.shorthand) {
                    result = generateExpression(expr.key, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    });
                } else if (expr.method) {
                    result = [];
                    if (expr.value.generator) {
                        result.push('*');
                    }
                    result.push(generateExpression(expr.key, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }));
                    result.push(generateFunctionBody(expr.value));
                } else {
                    result = [
                        generateExpression(expr.key, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true
                        }),
                        ':' + space,
                        generateExpression(expr.value, {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true
                        })
                    ];
                }
            }
            break;

        case Syntax.ObjectExpression:
            if (!expr.properties.length) {
                result = '{}';
                break;
            }
            multiline = expr.properties.length > 1;

            withIndent(function () {
                fragment = generateExpression(expr.properties[0], {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true,
                    type: Syntax.Property
                });
            });

            if (!multiline) {
                // issues 4
                // Do not transform from
                //   dejavu.Class.declare({
                //       method2: function () {}
                //   });
                // to
                //   dejavu.Class.declare({method2: function () {
                //       }});
                if (!hasLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    result = [ '{', space, fragment, space, '}' ];
                    break;
                }
            }

            withIndent(function (indent) {
                result = [ '{', newline, indent, fragment ];

                if (multiline) {
                    result.push(',' + newline);
                    for (i = 1, len = expr.properties.length; i < len; ++i) {
                        result.push(indent);
                        result.push(generateExpression(expr.properties[i], {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            type: Syntax.Property
                        }));
                        if (i + 1 < len) {
                            result.push(',' + newline);
                        }
                    }
                }
            });

            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(base);
            result.push('}');
            break;

        case Syntax.ObjectPattern:
            if (!expr.properties.length) {
                result = '{}';
                break;
            }

            multiline = false;
            if (expr.properties.length === 1) {
                property = expr.properties[0];
                if (property.value.type !== Syntax.Identifier) {
                    multiline = true;
                }
            } else {
                for (i = 0, len = expr.properties.length; i < len; ++i) {
                    property = expr.properties[i];
                    if (!property.shorthand) {
                        multiline = true;
                        break;
                    }
                }
            }
            result = ['{', multiline ? newline : '' ];

            withIndent(function (indent) {
                for (i = 0, len = expr.properties.length; i < len; ++i) {
                    result.push(multiline ? indent : '');
                    result.push(generateExpression(expr.properties[i], {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }));
                    if (i + 1 < len) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });

            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push('}');
            break;

        case Syntax.ThisExpression:
            result = 'this';
            break;

        case Syntax.Identifier:
            result = generateIdentifier(expr);
            break;

        case Syntax.Literal:
            if (expr.hasOwnProperty('raw') && parse && extra.raw) {
                try {
                    raw = parse(expr.raw).body[0].expression;
                    if (raw.type === Syntax.Literal) {
                        if (raw.value === expr.value) {
                            result = expr.raw;
                            break;
                        }
                    }
                } catch (e) {
                    // not use raw property
                }
            }

            if (expr.value === null) {
                result = 'null';
                break;
            }

            if (typeof expr.value === 'string') {
                result = escapeString(expr.value);
                break;
            }

            if (typeof expr.value === 'number') {
                result = generateNumber(expr.value);
                break;
            }

            if (typeof expr.value === 'boolean') {
                result = expr.value ? 'true' : 'false';
                break;
            }

            result = generateRegExp(expr.value);
            break;

        case Syntax.GeneratorExpression:
        case Syntax.ComprehensionExpression:
            // GeneratorExpression should be parenthesized with (...), ComprehensionExpression with [...]
            // Due to https://bugzilla.mozilla.org/show_bug.cgi?id=883468 position of expr.body can differ in Spidermonkey and ES6
            result = (type === Syntax.GeneratorExpression) ? ['('] : ['['];

            if (extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = generateExpression(expr.body, {
                    precedence: Precedence.Assignment,
                    allowIn: true,
                    allowCall: true
                });

                result.push(fragment);
            }

            if (expr.blocks) {
                withIndent(function () {
                    for (i = 0, len = expr.blocks.length; i < len; ++i) {
                        fragment = generateExpression(expr.blocks[i], {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true
                        });

                        if (i > 0 || extra.moz.comprehensionExpressionStartsWithAssignment) {
                            result = join(result, fragment);
                        } else {
                            result.push(fragment);
                        }
                    }
                });
            }

            if (expr.filter) {
                result = join(result, 'if' + space);
                fragment = generateExpression(expr.filter, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                });
                if (extra.moz.parenthesizedComprehensionBlock) {
                    result = join(result, [ '(', fragment, ')' ]);
                } else {
                    result = join(result, fragment);
                }
            }

            if (!extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = generateExpression(expr.body, {
                    precedence: Precedence.Assignment,
                    allowIn: true,
                    allowCall: true
                });

                result = join(result, fragment);
            }

            result.push((type === Syntax.GeneratorExpression) ? ')' : ']');
            break;

        case Syntax.ComprehensionBlock:
            if (expr.left.type === Syntax.VariableDeclaration) {
                fragment = [
                    expr.left.kind, noEmptySpace(),
                    generateStatement(expr.left.declarations[0], {
                        allowIn: false
                    })
                ];
            } else {
                fragment = generateExpression(expr.left, {
                    precedence: Precedence.Call,
                    allowIn: true,
                    allowCall: true
                });
            }

            fragment = join(fragment, expr.of ? 'of' : 'in');
            fragment = join(fragment, generateExpression(expr.right, {
                precedence: Precedence.Sequence,
                allowIn: true,
                allowCall: true
            }));

            if (extra.moz.parenthesizedComprehensionBlock) {
                result = [ 'for' + space + '(', fragment, ')' ];
            } else {
                result = join('for' + space, fragment);
            }
            break;

        default:
            throw new Error('Unknown expression type: ' + expr.type);
        }

        if (extra.comment) {
            result = addComments(expr,result);
        }
        return toSourceNodeWhenNeeded(result, expr);
    }

    function generateStatement(stmt, option) {
        var i,
            len,
            result,
            node,
            allowIn,
            functionBody,
            directiveContext,
            fragment,
            semicolon,
            isGenerator;

        allowIn = true;
        semicolon = ';';
        functionBody = false;
        directiveContext = false;
        if (option) {
            allowIn = option.allowIn === undefined || option.allowIn;
            if (!semicolons && option.semicolonOptional === true) {
                semicolon = '';
            }
            functionBody = option.functionBody;
            directiveContext = option.directiveContext;
        }

        switch (stmt.type) {
        case Syntax.BlockStatement:
            result = ['{', newline];

            withIndent(function () {
                for (i = 0, len = stmt.body.length; i < len; ++i) {
                    fragment = addIndent(generateStatement(stmt.body[i], {
                        semicolonOptional: i === len - 1,
                        directiveContext: functionBody
                    }));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });

            result.push(addIndent('}'));
            break;

        case Syntax.BreakStatement:
            if (stmt.label) {
                result = 'break ' + stmt.label.name + semicolon;
            } else {
                result = 'break' + semicolon;
            }
            break;

        case Syntax.ContinueStatement:
            if (stmt.label) {
                result = 'continue ' + stmt.label.name + semicolon;
            } else {
                result = 'continue' + semicolon;
            }
            break;

        case Syntax.DirectiveStatement:
            if (extra.raw && stmt.raw) {
                result = stmt.raw + semicolon;
            } else {
                result = escapeDirective(stmt.directive) + semicolon;
            }
            break;

        case Syntax.DoWhileStatement:
            // Because `do 42 while (cond)` is Syntax Error. We need semicolon.
            result = join('do', maybeBlock(stmt.body));
            result = maybeBlockSuffix(stmt.body, result);
            result = join(result, [
                'while' + space + '(',
                generateExpression(stmt.test, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                }),
                ')' + semicolon
            ]);
            break;

        case Syntax.CatchClause:
            withIndent(function () {
                var guard;

                result = [
                    'catch' + space + '(',
                    generateExpression(stmt.param, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];

                if (stmt.guard) {
                    guard = generateExpression(stmt.guard, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    });

                    result.splice(2, 0, ' if ', guard);
                }
            });
            result.push(maybeBlock(stmt.body));
            break;

        case Syntax.DebuggerStatement:
            result = 'debugger' + semicolon;
            break;

        case Syntax.EmptyStatement:
            result = ';';
            break;

        case Syntax.ExportDeclaration:
            result = 'export ';
            if (stmt.declaration) {
                // FunctionDeclaration or VariableDeclaration
                result = [result, generateStatement(stmt.declaration, { semicolonOptional: semicolon === '' })];
                break;
            }
            break;

        case Syntax.ExpressionStatement:
            result = [generateExpression(stmt.expression, {
                precedence: Precedence.Sequence,
                allowIn: true,
                allowCall: true
            })];
            // 12.4 '{', 'function' is not allowed in this position.
            // wrap expression with parentheses
            fragment = toSourceNodeWhenNeeded(result).toString();
            if (fragment.charAt(0) === '{' ||  // ObjectExpression
                    (fragment.slice(0, 8) === 'function' && '* ('.indexOf(fragment.charAt(8)) >= 0) ||  // function or generator
                    (directive && directiveContext && stmt.expression.type === Syntax.Literal && typeof stmt.expression.value === 'string')) {
                result = ['(', result, ')' + semicolon];
            } else {
                result.push(semicolon);
            }
            break;

        case Syntax.VariableDeclarator:
            if (stmt.init) {
                result = [
                    generateExpression(stmt.id, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    }),
                    space,
                    '=',
                    space,
                    generateExpression(stmt.init, {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true
                    })
                ];
            } else {
                result = generatePattern(stmt.id, {
                    precedence: Precedence.Assignment,
                    allowIn: allowIn
                });
            }
            break;

        case Syntax.VariableDeclaration:
            result = [stmt.kind];
            // special path for
            // var x = function () {
            // };
            if (stmt.declarations.length === 1 && stmt.declarations[0].init &&
                    stmt.declarations[0].init.type === Syntax.FunctionExpression) {
                result.push(noEmptySpace());
                result.push(generateStatement(stmt.declarations[0], {
                    allowIn: allowIn
                }));
            } else {
                // VariableDeclarator is typed as Statement,
                // but joined with comma (not LineTerminator).
                // So if comment is attached to target node, we should specialize.
                withIndent(function () {
                    node = stmt.declarations[0];
                    if (extra.comment && node.leadingComments) {
                        result.push('\n');
                        result.push(addIndent(generateStatement(node, {
                            allowIn: allowIn
                        })));
                    } else {
                        result.push(noEmptySpace());
                        result.push(generateStatement(node, {
                            allowIn: allowIn
                        }));
                    }

                    for (i = 1, len = stmt.declarations.length; i < len; ++i) {
                        node = stmt.declarations[i];
                        if (extra.comment && node.leadingComments) {
                            result.push(',' + newline);
                            result.push(addIndent(generateStatement(node, {
                                allowIn: allowIn
                            })));
                        } else {
                            result.push(',' + space);
                            result.push(generateStatement(node, {
                                allowIn: allowIn
                            }));
                        }
                    }
                });
            }
            result.push(semicolon);
            break;

        case Syntax.ThrowStatement:
            result = [join(
                'throw',
                generateExpression(stmt.argument, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                })
            ), semicolon];
            break;

        case Syntax.TryStatement:
            result = ['try', maybeBlock(stmt.block)];
            result = maybeBlockSuffix(stmt.block, result);

            if (stmt.handlers) {
                // old interface
                for (i = 0, len = stmt.handlers.length; i < len; ++i) {
                    result = join(result, generateStatement(stmt.handlers[i]));
                    if (stmt.finalizer || i + 1 !== len) {
                        result = maybeBlockSuffix(stmt.handlers[i].body, result);
                    }
                }
            } else {
                stmt.guardedHandlers = stmt.guardedHandlers || [];

                for (i = 0, len = stmt.guardedHandlers.length; i < len; ++i) {
                    result = join(result, generateStatement(stmt.guardedHandlers[i]));
                    if (stmt.finalizer || i + 1 !== len) {
                        result = maybeBlockSuffix(stmt.guardedHandlers[i].body, result);
                    }
                }

                // new interface
                if (stmt.handler) {
                    if (isArray(stmt.handler)) {
                        for (i = 0, len = stmt.handler.length; i < len; ++i) {
                            result = join(result, generateStatement(stmt.handler[i]));
                            if (stmt.finalizer || i + 1 !== len) {
                                result = maybeBlockSuffix(stmt.handler[i].body, result);
                            }
                        }
                    } else {
                        result = join(result, generateStatement(stmt.handler));
                        if (stmt.finalizer) {
                            result = maybeBlockSuffix(stmt.handler.body, result);
                        }
                    }
                }
            }
            if (stmt.finalizer) {
                result = join(result, ['finally', maybeBlock(stmt.finalizer)]);
            }
            break;

        case Syntax.SwitchStatement:
            withIndent(function () {
                result = [
                    'switch' + space + '(',
                    generateExpression(stmt.discriminant, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')' + space + '{' + newline
                ];
            });
            if (stmt.cases) {
                for (i = 0, len = stmt.cases.length; i < len; ++i) {
                    fragment = addIndent(generateStatement(stmt.cases[i], {semicolonOptional: i === len - 1}));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            }
            result.push(addIndent('}'));
            break;

        case Syntax.SwitchCase:
            withIndent(function () {
                if (stmt.test) {
                    result = [
                        join('case', generateExpression(stmt.test, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true
                        })),
                        ':'
                    ];
                } else {
                    result = ['default:'];
                }

                i = 0;
                len = stmt.consequent.length;
                if (len && stmt.consequent[0].type === Syntax.BlockStatement) {
                    fragment = maybeBlock(stmt.consequent[0]);
                    result.push(fragment);
                    i = 1;
                }

                if (i !== len && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push(newline);
                }

                for (; i < len; ++i) {
                    fragment = addIndent(generateStatement(stmt.consequent[i], {semicolonOptional: i === len - 1 && semicolon === ''}));
                    result.push(fragment);
                    if (i + 1 !== len && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });
            break;

        case Syntax.IfStatement:
            withIndent(function () {
                result = [
                    'if' + space + '(',
                    generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            if (stmt.alternate) {
                result.push(maybeBlock(stmt.consequent));
                result = maybeBlockSuffix(stmt.consequent, result);
                if (stmt.alternate.type === Syntax.IfStatement) {
                    result = join(result, ['else ', generateStatement(stmt.alternate, {semicolonOptional: semicolon === ''})]);
                } else {
                    result = join(result, join('else', maybeBlock(stmt.alternate, semicolon === '')));
                }
            } else {
                result.push(maybeBlock(stmt.consequent, semicolon === ''));
            }
            break;

        case Syntax.ForStatement:
            withIndent(function () {
                result = ['for' + space + '('];
                if (stmt.init) {
                    if (stmt.init.type === Syntax.VariableDeclaration) {
                        result.push(generateStatement(stmt.init, {allowIn: false}));
                    } else {
                        result.push(generateExpression(stmt.init, {
                            precedence: Precedence.Sequence,
                            allowIn: false,
                            allowCall: true
                        }));
                        result.push(';');
                    }
                } else {
                    result.push(';');
                }

                if (stmt.test) {
                    result.push(space);
                    result.push(generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }));
                    result.push(';');
                } else {
                    result.push(';');
                }

                if (stmt.update) {
                    result.push(space);
                    result.push(generateExpression(stmt.update, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }));
                    result.push(')');
                } else {
                    result.push(')');
                }
            });

            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        case Syntax.ForInStatement:
            result = generateIterationForStatement('in', stmt, semicolon === '');
            break;

        case Syntax.ForOfStatement:
            result = generateIterationForStatement('of', stmt, semicolon === '');
            break;

        case Syntax.LabeledStatement:
            result = [stmt.label.name + ':', maybeBlock(stmt.body, semicolon === '')];
            break;

        case Syntax.Program:
            len = stmt.body.length;
            result = [safeConcatenation && len > 0 ? '\n' : ''];
            for (i = 0; i < len; ++i) {
                fragment = addIndent(
                    generateStatement(stmt.body[i], {
                        semicolonOptional: !safeConcatenation && i === len - 1,
                        directiveContext: true
                    })
                );
                result.push(fragment);
                if (i + 1 < len && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    result.push(newline);
                }
            }
            break;

        case Syntax.FunctionDeclaration:
            isGenerator = stmt.generator && !extra.moz.starlessGenerator;
            result = [
                (isGenerator ? 'function*' : 'function'),
                (isGenerator ? space : noEmptySpace()),
                generateIdentifier(stmt.id),
                generateFunctionBody(stmt)
            ];
            break;

        case Syntax.ReturnStatement:
            if (stmt.argument) {
                result = [join(
                    'return',
                    generateExpression(stmt.argument, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    })
                ), semicolon];
            } else {
                result = ['return' + semicolon];
            }
            break;

        case Syntax.WhileStatement:
            withIndent(function () {
                result = [
                    'while' + space + '(',
                    generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        case Syntax.WithStatement:
            withIndent(function () {
                result = [
                    'with' + space + '(',
                    generateExpression(stmt.object, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true
                    }),
                    ')'
                ];
            });
            result.push(maybeBlock(stmt.body, semicolon === ''));
            break;

        default:
            throw new Error('Unknown statement type: ' + stmt.type);
        }

        // Attach comments

        if (extra.comment) {
            result = addComments(stmt, result);
        }

        fragment = toSourceNodeWhenNeeded(result).toString();
        if (stmt.type === Syntax.Program && !safeConcatenation && newline === '' &&  fragment.charAt(fragment.length - 1) === '\n') {
            result = sourceMap ? toSourceNodeWhenNeeded(result).replaceRight(/\s+$/, '') : fragment.replace(/\s+$/, '');
        }

        return toSourceNodeWhenNeeded(result, stmt);
    }

    function generate(node, options) {
        var defaultOptions = getDefaultOptions(), result, pair;

        if (options != null) {
            // Obsolete options
            //
            //   `options.indent`
            //   `options.base`
            //
            // Instead of them, we can use `option.format.indent`.
            if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
            }
            if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
            }
            options = updateDeeply(defaultOptions, options);
            indent = options.format.indent.style;
            if (typeof options.base === 'string') {
                base = options.base;
            } else {
                base = stringRepeat(indent, options.format.indent.base);
            }
        } else {
            options = defaultOptions;
            indent = options.format.indent.style;
            base = stringRepeat(indent, options.format.indent.base);
        }
        json = options.format.json;
        renumber = options.format.renumber;
        hexadecimal = json ? false : options.format.hexadecimal;
        quotes = json ? 'double' : options.format.quotes;
        escapeless = options.format.escapeless;
        newline = options.format.newline;
        space = options.format.space;
        if (options.format.compact) {
            newline = space = indent = base = '';
        }
        parentheses = options.format.parentheses;
        semicolons = options.format.semicolons;
        safeConcatenation = options.format.safeConcatenation;
        directive = options.directive;
        parse = json ? null : options.parse;
        sourceMap = options.sourceMap;
        extra = options;

        if (sourceMap) {
            if (!exports.browser) {
                // We assume environment is node.js
                // And prevent from including source-map by browserify
                SourceNode = require('source-map').SourceNode;
            } else {
                SourceNode = global.sourceMap.SourceNode;
            }
        }

        switch (node.type) {
        case Syntax.BlockStatement:
        case Syntax.BreakStatement:
        case Syntax.CatchClause:
        case Syntax.ContinueStatement:
        case Syntax.DirectiveStatement:
        case Syntax.DoWhileStatement:
        case Syntax.DebuggerStatement:
        case Syntax.EmptyStatement:
        case Syntax.ExpressionStatement:
        case Syntax.ForStatement:
        case Syntax.ForInStatement:
        case Syntax.ForOfStatement:
        case Syntax.FunctionDeclaration:
        case Syntax.IfStatement:
        case Syntax.LabeledStatement:
        case Syntax.Program:
        case Syntax.ReturnStatement:
        case Syntax.SwitchStatement:
        case Syntax.SwitchCase:
        case Syntax.ThrowStatement:
        case Syntax.TryStatement:
        case Syntax.VariableDeclaration:
        case Syntax.VariableDeclarator:
        case Syntax.WhileStatement:
        case Syntax.WithStatement:
            result = generateStatement(node);
            break;

        case Syntax.AssignmentExpression:
        case Syntax.ArrayExpression:
        case Syntax.ArrayPattern:
        case Syntax.BinaryExpression:
        case Syntax.CallExpression:
        case Syntax.ConditionalExpression:
        case Syntax.FunctionExpression:
        case Syntax.Identifier:
        case Syntax.Literal:
        case Syntax.LogicalExpression:
        case Syntax.MemberExpression:
        case Syntax.NewExpression:
        case Syntax.ObjectExpression:
        case Syntax.ObjectPattern:
        case Syntax.Property:
        case Syntax.SequenceExpression:
        case Syntax.ThisExpression:
        case Syntax.UnaryExpression:
        case Syntax.UpdateExpression:
        case Syntax.YieldExpression:

            result = generateExpression(node, {
                precedence: Precedence.Sequence,
                allowIn: true,
                allowCall: true
            });
            break;

        default:
            throw new Error('Unknown node type: ' + node.type);
        }

        if (!sourceMap) {
            return result.toString();
        }


        pair = result.toStringWithSourceMap({
            file: options.file,
            sourceRoot: options.sourceMapRoot
        });

        if (options.sourceContent) {
            pair.map.setSourceContent(options.sourceMap,
                                      options.sourceContent);
        }

        if (options.sourceMapWithCode) {
            return pair;
        }

        return pair.map.toString();
    }

    FORMAT_MINIFY = {
        indent: {
            style: '',
            base: 0
        },
        renumber: true,
        hexadecimal: true,
        quotes: 'auto',
        escapeless: true,
        compact: true,
        parentheses: false,
        semicolons: false
    };

    FORMAT_DEFAULTS = getDefaultOptions().format;

    exports.version = require('./package.json').version;
    exports.generate = generate;
    exports.attachComments = estraverse.attachComments;
    exports.Precedence = updateDeeply({}, Precedence);
    exports.browser = false;
    exports.FORMAT_MINIFY = FORMAT_MINIFY;
    exports.FORMAT_DEFAULTS = FORMAT_DEFAULTS;
}());
/* vim: set sw=4 ts=4 et tw=80 : */

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./package.json":15,"estraverse":17,"esutils":4,"source-map":5}],2:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var Regex;

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
    };

    function isDecimalDigit(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    }

    function isHexDigit(ch) {
        return isDecimalDigit(ch) || (97 <= ch && ch <= 102) || (65 <= ch && ch <= 70);
    }

    function isOctalDigit(ch) {
        return (ch >= 48 && ch <= 55);   // 0..7
    }

    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
            (ch >= 65 && ch <= 90) ||         // A..Z
            (ch >= 97 && ch <= 122) ||        // a..z
            (ch >= 48 && ch <= 57) ||         // 0..9
            (ch === 92) ||                    // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStart: isIdentifierStart,
        isIdentifierPart: isIdentifierPart
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],3:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var code = require('./code');

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierName(id) {
        var i, iz, ch;

        if (id.length === 0) {
            return false;
        }

        ch = id.charCodeAt(0);
        if (!code.isIdentifierStart(ch) || ch === 92) {  // \ (backslash)
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code.isIdentifierPart(ch) || ch === 92) {  // \ (backslash)
                return false;
            }
        }
        return true;
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierName: isIdentifierName
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./code":2}],4:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {
    'use strict';

    exports.code = require('./code');
    exports.keyword = require('./keyword');
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./code":2,"./keyword":3}],5:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./source-map/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./source-map/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./source-map/source-node').SourceNode;

},{"./source-map/source-map-consumer":10,"./source-map/source-map-generator":11,"./source-map/source-node":12}],6:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');

  /**
   * A data structure which is a combination of an array and a set. Adding a new
   * member is O(1), testing for membership is O(1), and finding the index of an
   * element is O(1). Removing elements from the set is not supported. Only
   * strings are supported for membership.
   */
  function ArraySet() {
    this._array = [];
    this._set = {};
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet();
    for (var i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var isDuplicate = this.has(aStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set[util.toSetString(aStr)] = idx;
    }
  };

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    return Object.prototype.hasOwnProperty.call(this._set,
                                                util.toSetString(aStr));
  };

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (this.has(aStr)) {
      return this._set[util.toSetString(aStr)];
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error('No element indexed by ' + aIdx);
  };

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };

  exports.ArraySet = ArraySet;

});

},{"./util":13,"amdefine":14}],7:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64 = require('./base64');

  // A single base 64 digit can contain 6 bits of data. For the base 64 variable
  // length quantities we use in the source map spec, the first bit is the sign,
  // the next four bits are the actual value, and the 6th bit is the
  // continuation bit. The continuation bit tells us whether there are more
  // digits in this value following this digit.
  //
  //   Continuation
  //   |    Sign
  //   |    |
  //   V    V
  //   101011

  var VLQ_BASE_SHIFT = 5;

  // binary: 100000
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

  // binary: 011111
  var VLQ_BASE_MASK = VLQ_BASE - 1;

  // binary: 100000
  var VLQ_CONTINUATION_BIT = VLQ_BASE;

  /**
   * Converts from a two-complement value to a value where the sign bit is
   * is placed in the least significant bit.  For example, as decimals:
   *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
   *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
   */
  function toVLQSigned(aValue) {
    return aValue < 0
      ? ((-aValue) << 1) + 1
      : (aValue << 1) + 0;
  }

  /**
   * Converts to a two-complement value from a value where the sign bit is
   * is placed in the least significant bit.  For example, as decimals:
   *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
   *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
   */
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative
      ? -shifted
      : shifted;
  }

  /**
   * Returns the base 64 VLQ encoded value.
   */
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;

    var vlq = toVLQSigned(aValue);

    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        // There are still more digits in this value, so we must make sure the
        // continuation bit is marked.
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);

    return encoded;
  };

  /**
   * Decodes the next base 64 VLQ value from the given string and returns the
   * value and the rest of the string.
   */
  exports.decode = function base64VLQ_decode(aStr) {
    var i = 0;
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;

    do {
      if (i >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }
      digit = base64.decode(aStr.charAt(i++));
      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);

    return {
      value: fromVLQSigned(result),
      rest: aStr.slice(i)
    };
  };

});

},{"./base64":8,"amdefine":14}],8:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var charToIntMap = {};
  var intToCharMap = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    .split('')
    .forEach(function (ch, index) {
      charToIntMap[ch] = index;
      intToCharMap[index] = ch;
    });

  /**
   * Encode an integer in the range of 0 to 63 to a single base 64 digit.
   */
  exports.encode = function base64_encode(aNumber) {
    if (aNumber in intToCharMap) {
      return intToCharMap[aNumber];
    }
    throw new TypeError("Must be between 0 and 63: " + aNumber);
  };

  /**
   * Decode a single base 64 digit to an integer.
   */
  exports.decode = function base64_decode(aChar) {
    if (aChar in charToIntMap) {
      return charToIntMap[aChar];
    }
    throw new TypeError("Not a valid base 64 digit: " + aChar);
  };

});

},{"amdefine":14}],9:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * Recursive implementation of binary search.
   *
   * @param aLow Indices here and lower do not contain the needle.
   * @param aHigh Indices here and higher do not contain the needle.
   * @param aNeedle The element being searched for.
   * @param aHaystack The non-empty array being searched.
   * @param aCompare Function which takes two elements and returns -1, 0, or 1.
   */
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
    // This function terminates when one of the following is true:
    //
    //   1. We find the exact element we are looking for.
    //
    //   2. We did not find the exact element, but we can return the next
    //      closest element that is less than that element.
    //
    //   3. We did not find the exact element, and there is no next-closest
    //      element which is less than the one we are searching for, so we
    //      return null.
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      // Found the element we are looking for.
      return aHaystack[mid];
    }
    else if (cmp > 0) {
      // aHaystack[mid] is greater than our needle.
      if (aHigh - mid > 1) {
        // The element is in the upper half.
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
      }
      // We did not find an exact match, return the next closest one
      // (termination case 2).
      return aHaystack[mid];
    }
    else {
      // aHaystack[mid] is less than our needle.
      if (mid - aLow > 1) {
        // The element is in the lower half.
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
      }
      // The exact needle element was not found in this haystack. Determine if
      // we are in termination case (2) or (3) and return the appropriate thing.
      return aLow < 0
        ? null
        : aHaystack[aLow];
    }
  }

  /**
   * This is an implementation of binary search which will always try and return
   * the next lowest value checked if there is no exact hit. This is because
   * mappings between original and generated line/col pairs are single points,
   * and there is an implicit region between each of them, so a miss just means
   * that you aren't on the very start of a region.
   *
   * @param aNeedle The element you are looking for.
   * @param aHaystack The array that is being searched.
   * @param aCompare A function which takes the needle and an element in the
   *     array and returns -1, 0, or 1 depending on whether the needle is less
   *     than, equal to, or greater than the element, respectively.
   */
  exports.search = function search(aNeedle, aHaystack, aCompare) {
    return aHaystack.length > 0
      ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare)
      : null;
  };

});

},{"amdefine":14}],10:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var util = require('./util');
  var binarySearch = require('./binary-search');
  var ArraySet = require('./array-set').ArraySet;
  var base64VLQ = require('./base64-vlq');

  /**
   * A SourceMapConsumer instance represents a parsed source map which we can
   * query for information about the original file positions by giving it a file
   * position in the generated source.
   *
   * The only parameter is the raw source map (either as a JSON string, or
   * already parsed to an object). According to the spec, source maps have the
   * following attributes:
   *
   *   - version: Which version of the source map spec this map is following.
   *   - sources: An array of URLs to the original source files.
   *   - names: An array of identifiers which can be referrenced by individual mappings.
   *   - sourceRoot: Optional. The URL root from which all sources are relative.
   *   - sourcesContent: Optional. An array of contents of the original source files.
   *   - mappings: A string of base64 VLQs which contain the actual mappings.
   *   - file: Optional. The generated file this source map is associated with.
   *
   * Here is an example source map, taken from the source map spec[0]:
   *
   *     {
   *       version : 3,
   *       file: "out.js",
   *       sourceRoot : "",
   *       sources: ["foo.js", "bar.js"],
   *       names: ["src", "maps", "are", "fun"],
   *       mappings: "AA,AB;;ABCDE;"
   *     }
   *
   * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
   */
  function SourceMapConsumer(aSourceMap) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === 'string') {
      sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
    }

    var version = util.getArg(sourceMap, 'version');
    var sources = util.getArg(sourceMap, 'sources');
    // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
    // requires the array) to play nice here.
    var names = util.getArg(sourceMap, 'names', []);
    var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
    var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
    var mappings = util.getArg(sourceMap, 'mappings');
    var file = util.getArg(sourceMap, 'file', null);

    // Once again, Sass deviates from the spec and supplies the version as a
    // string rather than a number, so we use loose equality checking here.
    if (version != this._version) {
      throw new Error('Unsupported version: ' + version);
    }

    // Pass `true` below to allow duplicate names and sources. While source maps
    // are intended to be compressed and deduplicated, the TypeScript compiler
    // sometimes generates source maps with duplicates in them. See Github issue
    // #72 and bugzil.la/889492.
    this._names = ArraySet.fromArray(names, true);
    this._sources = ArraySet.fromArray(sources, true);

    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this.file = file;
  }

  /**
   * Create a SourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @returns SourceMapConsumer
   */
  SourceMapConsumer.fromSourceMap =
    function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(SourceMapConsumer.prototype);

      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                              smc.sourceRoot);
      smc.file = aSourceMap._file;

      smc.__generatedMappings = aSourceMap._mappings.slice()
        .sort(util.compareByGeneratedPositions);
      smc.__originalMappings = aSourceMap._mappings.slice()
        .sort(util.compareByOriginalPositions);

      return smc;
    };

  /**
   * The version of the source mapping spec that we are consuming.
   */
  SourceMapConsumer.prototype._version = 3;

  /**
   * The list of original sources.
   */
  Object.defineProperty(SourceMapConsumer.prototype, 'sources', {
    get: function () {
      return this._sources.toArray().map(function (s) {
        return this.sourceRoot ? util.join(this.sourceRoot, s) : s;
      }, this);
    }
  });

  // `__generatedMappings` and `__originalMappings` are arrays that hold the
  // parsed mapping coordinates from the source map's "mappings" attribute. They
  // are lazily instantiated, accessed via the `_generatedMappings` and
  // `_originalMappings` getters respectively, and we only parse the mappings
  // and create these arrays once queried for a source location. We jump through
  // these hoops because there can be many thousands of mappings, and parsing
  // them is expensive, so we only want to do it if we must.
  //
  // Each object in the arrays is of the form:
  //
  //     {
  //       generatedLine: The line number in the generated code,
  //       generatedColumn: The column number in the generated code,
  //       source: The path to the original source file that generated this
  //               chunk of code,
  //       originalLine: The line number in the original source that
  //                     corresponds to this chunk of generated code,
  //       originalColumn: The column number in the original source that
  //                       corresponds to this chunk of generated code,
  //       name: The name of the original symbol which generated this chunk of
  //             code.
  //     }
  //
  // All properties except for `generatedLine` and `generatedColumn` can be
  // `null`.
  //
  // `_generatedMappings` is ordered by the generated positions.
  //
  // `_originalMappings` is ordered by the original positions.

  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
    get: function () {
      if (!this.__generatedMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__generatedMappings;
    }
  });

  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
    get: function () {
      if (!this.__originalMappings) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        this._parseMappings(this._mappings, this.sourceRoot);
      }

      return this.__originalMappings;
    }
  });

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  SourceMapConsumer.prototype._parseMappings =
    function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var mappingSeparator = /^[,;]/;
      var str = aStr;
      var mapping;
      var temp;

      while (str.length > 0) {
        if (str.charAt(0) === ';') {
          generatedLine++;
          str = str.slice(1);
          previousGeneratedColumn = 0;
        }
        else if (str.charAt(0) === ',') {
          str = str.slice(1);
        }
        else {
          mapping = {};
          mapping.generatedLine = generatedLine;

          // Generated column.
          temp = base64VLQ.decode(str);
          mapping.generatedColumn = previousGeneratedColumn + temp.value;
          previousGeneratedColumn = mapping.generatedColumn;
          str = temp.rest;

          if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
            // Original source.
            temp = base64VLQ.decode(str);
            mapping.source = this._sources.at(previousSource + temp.value);
            previousSource += temp.value;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source, but no line and column');
            }

            // Original line.
            temp = base64VLQ.decode(str);
            mapping.originalLine = previousOriginalLine + temp.value;
            previousOriginalLine = mapping.originalLine;
            // Lines are stored 0-based
            mapping.originalLine += 1;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source and line, but no column');
            }

            // Original column.
            temp = base64VLQ.decode(str);
            mapping.originalColumn = previousOriginalColumn + temp.value;
            previousOriginalColumn = mapping.originalColumn;
            str = temp.rest;

            if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
              // Original name.
              temp = base64VLQ.decode(str);
              mapping.name = this._names.at(previousName + temp.value);
              previousName += temp.value;
              str = temp.rest;
            }
          }

          this.__generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            this.__originalMappings.push(mapping);
          }
        }
      }

      this.__generatedMappings.sort(util.compareByGeneratedPositions);
      this.__originalMappings.sort(util.compareByOriginalPositions);
    };

  /**
   * Find the mapping that best matches the hypothetical "needle" mapping that
   * we are searching for in the given "haystack" of mappings.
   */
  SourceMapConsumer.prototype._findMapping =
    function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                           aColumnName, aComparator) {
      // To return the position we are searching for, we must first find the
      // mapping for the given position and then return the opposite position it
      // points to. Because the mappings are sorted, we can use binary search to
      // find the best mapping.

      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got '
                            + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got '
                            + aNeedle[aColumnName]);
      }

      return binarySearch.search(aNeedle, aMappings, aComparator);
    };

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.
   *   - column: The column number in the generated source.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.
   *   - column: The column number in the original source, or null.
   *   - name: The original identifier, or null.
   */
  SourceMapConsumer.prototype.originalPositionFor =
    function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };

      var mapping = this._findMapping(needle,
                                      this._generatedMappings,
                                      "generatedLine",
                                      "generatedColumn",
                                      util.compareByGeneratedPositions);

      if (mapping && mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source && this.sourceRoot) {
          source = util.join(this.sourceRoot, source);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: util.getArg(mapping, 'name', null)
        };
      }

      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * availible.
   */
  SourceMapConsumer.prototype.sourceContentFor =
    function SourceMapConsumer_sourceContentFor(aSource) {
      if (!this.sourcesContent) {
        return null;
      }

      if (this.sourceRoot) {
        aSource = util.relative(this.sourceRoot, aSource);
      }

      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }

      var url;
      if (this.sourceRoot
          && (url = util.urlParse(this.sourceRoot))) {
        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
        // many users. We can help them out when they expect file:// URIs to
        // behave like it would if they were running a local HTTP server. See
        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file"
            && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
        }

        if ((!url.path || url.path == "/")
            && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }

      throw new Error('"' + aSource + '" is not in the SourceMap.');
    };

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.
   *   - column: The column number in the original source.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.
   *   - column: The column number in the generated source, or null.
   */
  SourceMapConsumer.prototype.generatedPositionFor =
    function SourceMapConsumer_generatedPositionFor(aArgs) {
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };

      if (this.sourceRoot) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }

      var mapping = this._findMapping(needle,
                                      this._originalMappings,
                                      "originalLine",
                                      "originalColumn",
                                      util.compareByOriginalPositions);

      if (mapping) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null)
        };
      }

      return {
        line: null,
        column: null
      };
    };

  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  SourceMapConsumer.prototype.eachMapping =
    function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

      var mappings;
      switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
      }

      var sourceRoot = this.sourceRoot;
      mappings.map(function (mapping) {
        var source = mapping.source;
        if (source && sourceRoot) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name
        };
      }).forEach(aCallback, context);
    };

  exports.SourceMapConsumer = SourceMapConsumer;

});

},{"./array-set":6,"./base64-vlq":7,"./binary-search":9,"./util":13,"amdefine":14}],11:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var base64VLQ = require('./base64-vlq');
  var util = require('./util');
  var ArraySet = require('./array-set').ArraySet;

  /**
   * An instance of the SourceMapGenerator represents a source map which is
   * being built incrementally. You may pass an object with the following
   * properties:
   *
   *   - file: The filename of the generated source.
   *   - sourceRoot: A root for all relative URLs in this source map.
   */
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, 'file', null);
    this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = [];
    this._sourcesContents = null;
  }

  SourceMapGenerator.prototype._version = 3;

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  SourceMapGenerator.fromSourceMap =
    function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function (mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };

        if (mapping.source) {
          newMapping.source = mapping.source;
          if (sourceRoot) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }

          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };

          if (mapping.name) {
            newMapping.name = mapping.name;
          }
        }

        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  SourceMapGenerator.prototype.addMapping =
    function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);

      this._validateMapping(generated, original, source, name);

      if (source && !this._sources.has(source)) {
        this._sources.add(source);
      }

      if (name && !this._names.has(name)) {
        this._names.add(name);
      }

      this._mappings.push({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };

  /**
   * Set the source content for a source file.
   */
  SourceMapGenerator.prototype.setSourceContent =
    function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot) {
        source = util.relative(this._sourceRoot, source);
      }

      if (aSourceContent !== null) {
        // Add the source content to the _sourcesContents map.
        // Create a new _sourcesContents map if the property is null.
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else {
        // Remove the source file from the _sourcesContents map.
        // If the _sourcesContents map is empty, set the property to null.
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  SourceMapGenerator.prototype.applySourceMap =
    function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      // If aSourceFile is omitted, we will use the file property of the SourceMap
      if (!aSourceFile) {
        if (!aSourceMapConsumer.file) {
          throw new Error(
            'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
            'or the source map\'s "file" property. Both were omitted.'
          );
        }
        aSourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      // Make "aSourceFile" relative if an absolute Url is passed.
      if (sourceRoot) {
        aSourceFile = util.relative(sourceRoot, aSourceFile);
      }
      // Applying the SourceMap can add and remove items from the sources and
      // the names array.
      var newSources = new ArraySet();
      var newNames = new ArraySet();

      // Find mappings for the "aSourceFile"
      this._mappings.forEach(function (mapping) {
        if (mapping.source === aSourceFile && mapping.originalLine) {
          // Check if it can be mapped by the source map, then update the mapping.
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source !== null) {
            // Copy mapping
            mapping.source = original.source;
            if (aSourceMapPath) {
              mapping.source = util.join(aSourceMapPath, mapping.source)
            }
            if (sourceRoot) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name !== null && mapping.name !== null) {
              // Only use the identifier name if it's an identifier
              // in both SourceMaps
              mapping.name = original.name;
            }
          }
        }

        var source = mapping.source;
        if (source && !newSources.has(source)) {
          newSources.add(source);
        }

        var name = mapping.name;
        if (name && !newNames.has(name)) {
          newNames.add(name);
        }

      }, this);
      this._sources = newSources;
      this._names = newNames;

      // Copy sourcesContents of applied map.
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          if (sourceRoot) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  SourceMapGenerator.prototype._validateMapping =
    function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
          && aGenerated.line > 0 && aGenerated.column >= 0
          && !aOriginal && !aSource && !aName) {
        // Case 1.
        return;
      }
      else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
               && aOriginal && 'line' in aOriginal && 'column' in aOriginal
               && aGenerated.line > 0 && aGenerated.column >= 0
               && aOriginal.line > 0 && aOriginal.column >= 0
               && aSource) {
        // Cases 2 and 3.
        return;
      }
      else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  SourceMapGenerator.prototype._serializeMappings =
    function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;

      // The mappings must be guaranteed to be in sorted order before we start
      // serializing them or else the generated line numbers (which are defined
      // via the ';' separators) will be all messed up. Note: it might be more
      // performant to maintain the sorting as we insert them, rather than as we
      // serialize them, but the big O is the same either way.
      this._mappings.sort(util.compareByGeneratedPositions);

      for (var i = 0, len = this._mappings.length; i < len; i++) {
        mapping = this._mappings[i];

        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        }
        else {
          if (i > 0) {
            if (!util.compareByGeneratedPositions(mapping, this._mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }

        result += base64VLQ.encode(mapping.generatedColumn
                                   - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;

        if (mapping.source) {
          result += base64VLQ.encode(this._sources.indexOf(mapping.source)
                                     - previousSource);
          previousSource = this._sources.indexOf(mapping.source);

          // lines are stored 0-based in SourceMap spec version 3
          result += base64VLQ.encode(mapping.originalLine - 1
                                     - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;

          result += base64VLQ.encode(mapping.originalColumn
                                     - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;

          if (mapping.name) {
            result += base64VLQ.encode(this._names.indexOf(mapping.name)
                                       - previousName);
            previousName = this._names.indexOf(mapping.name);
          }
        }
      }

      return result;
    };

  SourceMapGenerator.prototype._generateSourcesContent =
    function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function (source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents,
                                                    key)
          ? this._sourcesContents[key]
          : null;
      }, this);
    };

  /**
   * Externalize the source map.
   */
  SourceMapGenerator.prototype.toJSON =
    function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        file: this._file,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._sourceRoot) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }

      return map;
    };

  /**
   * Render the source map being generated to a string.
   */
  SourceMapGenerator.prototype.toString =
    function SourceMapGenerator_toString() {
      return JSON.stringify(this);
    };

  exports.SourceMapGenerator = SourceMapGenerator;

});

},{"./array-set":6,"./base64-vlq":7,"./util":13,"amdefine":14}],12:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
  var util = require('./util');

  /**
   * SourceNodes provide a way to abstract over interpolating/concatenating
   * snippets of generated JavaScript source code while maintaining the line and
   * column information associated with the original source code.
   *
   * @param aLine The original line number.
   * @param aColumn The original column number.
   * @param aSource The original source's filename.
   * @param aChunks Optional. An array of strings which are snippets of
   *        generated JS, or other SourceNodes.
   * @param aName The original identifier.
   */
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine === undefined ? null : aLine;
    this.column = aColumn === undefined ? null : aColumn;
    this.source = aSource === undefined ? null : aSource;
    this.name = aName === undefined ? null : aName;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   */
  SourceNode.fromStringWithSourceMap =
    function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer) {
      // The SourceNode we want to fill with the generated code
      // and the SourceMap
      var node = new SourceNode();

      // The generated code
      // Processed fragments are removed from this array.
      var remainingLines = aGeneratedCode.split('\n');

      // We need to remember the position of "remainingLines"
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;

      // The generate SourceNodes we need a code range.
      // To extract it current and last mapping is used.
      // Here we store the last mapping.
      var lastMapping = null;

      aSourceMapConsumer.eachMapping(function (mapping) {
        if (lastMapping !== null) {
          // We add the code from "lastMapping" to "mapping":
          // First check if there is a new line in between.
          if (lastGeneratedLine < mapping.generatedLine) {
            var code = "";
            // Associate first line with "lastMapping"
            addMappingWithCode(lastMapping, remainingLines.shift() + "\n");
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
            // The remaining code is added without mapping
          } else {
            // There is no new line in between.
            // Associate the code between "lastGeneratedColumn" and
            // "mapping.generatedColumn" with "lastMapping"
            var nextLine = remainingLines[0];
            var code = nextLine.substr(0, mapping.generatedColumn -
                                          lastGeneratedColumn);
            remainingLines[0] = nextLine.substr(mapping.generatedColumn -
                                                lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            // No more remaining code, continue
            lastMapping = mapping;
            return;
          }
        }
        // We add the generated code until the first mapping
        // to the SourceNode without any mapping.
        // Each line is added as separate string.
        while (lastGeneratedLine < mapping.generatedLine) {
          node.add(remainingLines.shift() + "\n");
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[0];
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[0] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      // We have processed all mappings.
      if (remainingLines.length > 0) {
        if (lastMapping) {
          // Associate the remaining code in the current line with "lastMapping"
          var lastLine = remainingLines.shift();
          if (remainingLines.length > 0) lastLine += "\n";
          addMappingWithCode(lastMapping, lastLine);
        }
        // and add the remaining lines without any mapping
        node.add(remainingLines.join("\n"));
      }

      // Copy sourcesContent into SourceNode
      aSourceMapConsumer.sources.forEach(function (sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          node.setSourceContent(sourceFile, content);
        }
      });

      return node;

      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === undefined) {
          node.add(code);
        } else {
          node.add(new SourceNode(mapping.originalLine,
                                  mapping.originalColumn,
                                  mapping.source,
                                  code,
                                  mapping.name));
        }
      }
    };

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function (chunk) {
        this.add(chunk);
      }, this);
    }
    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length-1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    }
    else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    }
    else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  };

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk instanceof SourceNode) {
        chunk.walk(aFn);
      }
      else {
        if (chunk !== '') {
          aFn(chunk, { source: this.source,
                       line: this.line,
                       column: this.column,
                       name: this.name });
        }
      }
    }
  };

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len-1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild instanceof SourceNode) {
      lastChild.replaceRight(aPattern, aReplacement);
    }
    else if (typeof lastChild === 'string') {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    }
    else {
      this.children.push(''.replace(aPattern, aReplacement));
    }
    return this;
  };

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  SourceNode.prototype.setSourceContent =
    function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  SourceNode.prototype.walkSourceContents =
    function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i] instanceof SourceNode) {
          this.children[i].walkSourceContents(aFn);
        }
      }

      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function (chunk) {
      str += chunk;
    });
    return str;
  };

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function (chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if(lastOriginalSource !== original.source
           || lastOriginalLine !== original.line
           || lastOriginalColumn !== original.column
           || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      chunk.split('').forEach(function (ch, idx, array) {
        if (ch === '\n') {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === array.length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      });
    });
    this.walkSourceContents(function (sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map: map };
  };

  exports.SourceNode = SourceNode;

});

},{"./source-map-generator":11,"./util":13,"amdefine":14}],13:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  /**
   * This is a helper function for getting values from parameter/options
   * objects.
   *
   * @param args The object we are extracting values from
   * @param name The name of the property we are getting.
   * @param defaultValue An optional value to return if the property is missing
   * from the object. If this is not specified and the property is missing, an
   * error will be thrown.
   */
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;

  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;

  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;

  function urlGenerate(aParsedUrl) {
    var url = '';
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ':';
    }
    url += '//';
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + '@';
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;

  /**
   * Normalizes a path, or the path portion of a URL:
   *
   * - Replaces consequtive slashes with one slash.
   * - Removes unnecessary '.' parts.
   * - Removes unnecessary '<dir>/..' parts.
   *
   * Based on code in the Node.js 'path' core module.
   *
   * @param aPath The path or url to normalize.
   */
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = (path.charAt(0) === '/');

    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === '.') {
        parts.splice(i, 1);
      } else if (part === '..') {
        up++;
      } else if (up > 0) {
        if (part === '') {
          // The first part is blank if the path is absolute. Trying to go
          // above the root is a no-op. Therefore we can remove all '..' parts
          // directly after the root.
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join('/');

    if (path === '') {
      path = isAbsolute ? '/' : '.';
    }

    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;

  /**
   * Joins two paths/URLs.
   *
   * @param aRoot The root path or URL.
   * @param aPath The path or URL to be joined with the root.
   *
   * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
   *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
   *   first.
   * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
   *   is updated with the result and aRoot is returned. Otherwise the result
   *   is returned.
   *   - If aPath is absolute, the result is aPath.
   *   - Otherwise the two paths are joined with a slash.
   * - Joining for example 'http://' and 'www.example.com' is also supported.
   */
  function join(aRoot, aPath) {
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || '/';
    }

    // `join(foo, '//www.example.org')`
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }

    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }

    // `join('http://', 'www.example.com')`
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }

    var joined = aPath.charAt(0) === '/'
      ? aPath
      : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;

  /**
   * Because behavior goes wacky when you set `__proto__` on objects, we
   * have to prefix all the strings in our set with an arbitrary character.
   *
   * See https://github.com/mozilla/source-map/pull/31 and
   * https://github.com/mozilla/source-map/issues/30
   *
   * @param String aStr
   */
  function toSetString(aStr) {
    return '$' + aStr;
  }
  exports.toSetString = toSetString;

  function fromSetString(aStr) {
    return aStr.substr(1);
  }
  exports.fromSetString = fromSetString;

  function relative(aRoot, aPath) {
    aRoot = aRoot.replace(/\/$/, '');

    var url = urlParse(aRoot);
    if (aPath.charAt(0) == "/" && url && url.path == "/") {
      return aPath.slice(1);
    }

    return aPath.indexOf(aRoot + '/') === 0
      ? aPath.substr(aRoot.length + 1)
      : aPath;
  }
  exports.relative = relative;

  function strcmp(aStr1, aStr2) {
    var s1 = aStr1 || "";
    var s2 = aStr2 || "";
    return (s1 > s2) - (s1 < s2);
  }

  /**
   * Comparator between two mappings where the original positions are compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same original source/line/column, but different generated
   * line and column the same. Useful when searching for a mapping with a
   * stubbed out mapping.
   */
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp;

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp || onlyCompareOriginal) {
      return cmp;
    }

    cmp = strcmp(mappingA.name, mappingB.name);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    return mappingA.generatedColumn - mappingB.generatedColumn;
  };
  exports.compareByOriginalPositions = compareByOriginalPositions;

  /**
   * Comparator between two mappings where the generated positions are
   * compared.
   *
   * Optionally pass in `true` as `onlyCompareGenerated` to consider two
   * mappings with the same generated line and column, but different
   * source/name/original line and column the same. Useful when searching for a
   * mapping with a stubbed out mapping.
   */
  function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
    var cmp;

    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp || onlyCompareGenerated) {
      return cmp;
    }

    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp) {
      return cmp;
    }

    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp) {
      return cmp;
    }

    return strcmp(mappingA.name, mappingB.name);
  };
  exports.compareByGeneratedPositions = compareByGeneratedPositions;

});

},{"amdefine":14}],14:[function(require,module,exports){
(function (process,__filename){
/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 0.1.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint node: true */
/*global module, process */
'use strict';

/**
 * Creates a define for node.
 * @param {Object} module the "module" object that is defined by Node for the
 * current module.
 * @param {Function} [requireFn]. Node's require function for the current module.
 * It only needs to be passed in Node versions before 0.5, when module.require
 * did not exist.
 * @returns {Function} a define function that is usable for the current node
 * module.
 */
function amdefine(module, requireFn) {
    'use strict';
    var defineCache = {},
        loaderCache = {},
        alreadyCalled = false,
        path = require('path'),
        makeRequire, stringRequire;

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }

    /**
     * Create the normalize() function passed to a loader plugin's
     * normalize method.
     */
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(id) {
        function load(value) {
            loaderCache[id] = value;
        }

        load.fromText = function (id, text) {
            //This one is difficult because the text can/probably uses
            //define, and any relative paths and requires should be relative
            //to that id was it would be found on disk. But this would require
            //bootstrapping a module/require fairly deeply from node core.
            //Not sure how best to go about that yet.
            throw new Error('amdefine does not implement load.fromText');
        };

        return load;
    }

    makeRequire = function (systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
            if (typeof deps === 'string') {
                //Synchronous, single module require('')
                return stringRequire(systemRequire, exports, module, deps, relId);
            } else {
                //Array of dependencies with a callback.

                //Convert the dependencies to modules.
                deps = deps.map(function (depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                });

                //Wait for next tick to call back the require call.
                process.nextTick(function () {
                    callback.apply(null, deps);
                });
            }
        }

        amdRequire.toUrl = function (filePath) {
            if (filePath.indexOf('.') === 0) {
                return normalize(filePath, path.dirname(module.filename));
            } else {
                return filePath;
            }
        };

        return amdRequire;
    };

    //Favor explicit value, passed in if the module wants to support Node 0.4.
    requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
    };

    function runFactory(id, deps, factory) {
        var r, e, m, result;

        if (id) {
            e = loaderCache[id] = {};
            m = {
                id: id,
                uri: __filename,
                exports: e
            };
            r = makeRequire(requireFn, e, m, id);
        } else {
            //Only support one define call per file
            if (alreadyCalled) {
                throw new Error('amdefine with no module ID cannot be called more than once per file.');
            }
            alreadyCalled = true;

            //Use the real variables from node
            //Use module.exports for exports, since
            //the exports in here is amdefine exports.
            e = module.exports;
            m = module;
            r = makeRequire(requireFn, e, m, module.id);
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return r(depName);
            });
        }

        //Call the factory with the right dependencies.
        if (typeof factory === 'function') {
            result = factory.apply(m.exports, deps);
        } else {
            result = factory;
        }

        if (result !== undefined) {
            m.exports = result;
            if (id) {
                loaderCache[id] = m.exports;
            }
        }
    }

    stringRequire = function (systemRequire, exports, module, id, relId) {
        //Split the ID by a ! so that
        var index = id.indexOf('!'),
            originalId = id,
            prefix, plugin;

        if (index === -1) {
            id = normalize(id, relId);

            //Straight module lookup. If it is one of the special dependencies,
            //deal with it, otherwise, delegate to node.
            if (id === 'require') {
                return makeRequire(systemRequire, exports, module, relId);
            } else if (id === 'exports') {
                return exports;
            } else if (id === 'module') {
                return module;
            } else if (loaderCache.hasOwnProperty(id)) {
                return loaderCache[id];
            } else if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
            } else {
                if(systemRequire) {
                    return systemRequire(originalId);
                } else {
                    throw new Error('No module with ID: ' + id);
                }
            }
        } else {
            //There is a plugin in play.
            prefix = id.substring(0, index);
            id = id.substring(index + 1, id.length);

            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

            if (plugin.normalize) {
                id = plugin.normalize(id, makeNormalize(relId));
            } else {
                //Normalize the ID normally.
                id = normalize(id, relId);
            }

            if (loaderCache[id]) {
                return loaderCache[id];
            } else {
                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

                return loaderCache[id];
            }
        }
    };

    //Create a define function specific to the module asking for amdefine.
    function define(id, deps, factory) {
        if (Array.isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        } else if (typeof id !== 'string') {
            factory = id;
            id = deps = undefined;
        }

        if (deps && !Array.isArray(deps)) {
            factory = deps;
            deps = undefined;
        }

        if (!deps) {
            deps = ['require', 'exports', 'module'];
        }

        //Set up properties for this module. If an ID, then use
        //internal cache. If no ID, then use the external variables
        //for this node module.
        if (id) {
            //Put the module in deep freeze until there is a
            //require call for it.
            defineCache[id] = [id, deps, factory];
        } else {
            runFactory(id, deps, factory);
        }
    }

    //define.require, which has access to all the values in the
    //cache. Useful for AMD modules that all have IDs in the file,
    //but need to finally export a value to node based on one of those
    //IDs.
    define.require = function (id) {
        if (loaderCache[id]) {
            return loaderCache[id];
        }

        if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
        }
    };

    define.amd = {};

    return define;
}

module.exports = amdefine;

}).call(this,require("K/m7xv"),"/node_modules/escodegen/node_modules/source-map/node_modules/amdefine/amdefine.js")
},{"K/m7xv":20,"path":19}],15:[function(require,module,exports){
module.exports={
  "name": "escodegen",
  "description": "ECMAScript code generator",
  "homepage": "http://github.com/Constellation/escodegen",
  "main": "escodegen.js",
  "bin": {
    "esgenerate": "./bin/esgenerate.js",
    "escodegen": "./bin/escodegen.js"
  },
  "version": "1.3.2",
  "engines": {
    "node": ">=0.4.0"
  },
  "maintainers": [
    {
      "name": "Yusuke Suzuki",
      "email": "utatane.tea@gmail.com",
      "url": "http://github.com/Constellation"
    }
  ],
  "repository": {
    "type": "git",
    "url": "http://github.com/Constellation/escodegen.git"
  },
  "dependencies": {
    "esutils": "~1.0.0",
    "estraverse": "~1.5.0",
    "esprima": "~1.1.1",
    "source-map": "~0.1.33"
  },
  "optionalDependencies": {
    "source-map": "~0.1.33"
  },
  "devDependencies": {
    "esprima-moz": "*",
    "semver": "*",
    "chai": "~1.7.2",
    "gulp": "~3.5.0",
    "gulp-mocha": "~0.4.1",
    "gulp-eslint": "~0.1.2",
    "jshint-stylish": "~0.1.5",
    "gulp-jshint": "~1.4.0",
    "commonjs-everywhere": "~0.9.6",
    "bluebird": "~1.2.0",
    "bower-registry-client": "~0.2.0"
  },
  "licenses": [
    {
      "type": "BSD",
      "url": "http://github.com/Constellation/escodegen/raw/master/LICENSE.BSD"
    }
  ],
  "scripts": {
    "test": "gulp travis",
    "unit-test": "gulp test",
    "lint": "gulp lint",
    "release": "node tools/release.js",
    "build-min": "cjsify -ma path: tools/entry-point.js > escodegen.browser.min.js",
    "build": "cjsify -a path: tools/entry-point.js > escodegen.browser.js"
  },
  "readme": "### Escodegen [![Build Status](https://secure.travis-ci.org/Constellation/escodegen.svg)](http://travis-ci.org/Constellation/escodegen) [![Build Status](https://drone.io/github.com/Constellation/escodegen/status.png)](https://drone.io/github.com/Constellation/escodegen/latest)\n\nEscodegen ([escodegen](http://github.com/Constellation/escodegen)) is\n[ECMAScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm)\n(also popularly known as [JavaScript](http://en.wikipedia.org/wiki/JavaScript>JavaScript))\ncode generator from [Parser API](https://developer.mozilla.org/en/SpiderMonkey/Parser_API) AST.\nSee [online generator demo](http://constellation.github.com/escodegen/demo/index.html).\n\n\n### Install\n\nEscodegen can be used in a web browser:\n\n    <script src=\"escodegen.browser.js\"></script>\n\nescodegen.browser.js is found in tagged-revision. See Tags on GitHub.\n\nOr in a Node.js application via the package manager:\n\n    npm install escodegen\n\n### Usage\n\nA simple example: the program\n\n    escodegen.generate({\n        type: 'BinaryExpression',\n        operator: '+',\n        left: { type: 'Literal', value: 40 },\n        right: { type: 'Literal', value: 2 }\n    });\n\nproduces the string `'40 + 2'`\n\nSee the [API page](https://github.com/Constellation/escodegen/wiki/API) for\noptions. To run the tests, execute `npm test` in the root directory.\n\n### Building browser bundle / minified browser bundle\n\nAt first, executing `npm install` to install the all dev dependencies.\nAfter that,\n\n    npm run-script build\n\nwill generate `escodegen.browser.js`, it is used on the browser environment.\n\nAnd,\n\n    npm run-script build-min\n\nwill generate minified `escodegen.browser.min.js`.\n\n### License\n\n#### Escodegen\n\nCopyright (C) 2012 [Yusuke Suzuki](http://github.com/Constellation)\n (twitter: [@Constellation](http://twitter.com/Constellation)) and other contributors.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are met:\n\n  * Redistributions of source code must retain the above copyright\n    notice, this list of conditions and the following disclaimer.\n\n  * Redistributions in binary form must reproduce the above copyright\n    notice, this list of conditions and the following disclaimer in the\n    documentation and/or other materials provided with the distribution.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\"\nAND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\nIMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE\nARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY\nDIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\nLOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\nON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\nTHIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n\n#### source-map\n\nSourceNodeMocks has a limited interface of mozilla/source-map SourceNode implementations.\n\nCopyright (c) 2009-2011, Mozilla Foundation and contributors\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are met:\n\n* Redistributions of source code must retain the above copyright notice, this\n  list of conditions and the following disclaimer.\n\n* Redistributions in binary form must reproduce the above copyright notice,\n  this list of conditions and the following disclaimer in the documentation\n  and/or other materials provided with the distribution.\n\n* Neither the names of the Mozilla Foundation nor the names of project\n  contributors may be used to endorse or promote products derived from this\n  software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND\nANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\nWARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\nDISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE\nFOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL\nDAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR\nSERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER\nCAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,\nOR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n",
  "readmeFilename": "README.md",
  "bugs": {
    "url": "https://github.com/Constellation/escodegen/issues"
  },
  "_id": "escodegen@1.3.2",
  "dist": {
    "shasum": "bb0f434dbd594f2060639a79b4b06259dd5372de"
  },
  "_from": "escodegen@",
  "_resolved": "https://registry.npmjs.org/escodegen/-/escodegen-1.3.2.tgz"
}

},{}],16:[function(require,module,exports){
/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwErrorTolerant: true,
throwError: true, generateStatement: true, peek: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseUnaryExpression: true,
parseStatement: true, parseSourceElement: true */

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        SyntaxTreeDelegate,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        delegate,
        lookahead,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatiblity with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // 7.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment, attacher;

        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (state.lastCommentStart >= start) {
            return;
        }
        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                ++index;
                lineStart = index;
                if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function skipComment() {
        var ch, start;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function getEscapedIdentifier() {
        var ch, id;

        ch = source.charCodeAt(index++);
        id = String.fromCharCode(ch);

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            id = ch;
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (ch === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getEscapedIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            code = source.charCodeAt(index),
            code2,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        switch (code) {

        // Check for most common single-character punctuators.
        case 0x2E:  // . dot
        case 0x28:  // ( open bracket
        case 0x29:  // ) close bracket
        case 0x3B:  // ; semicolon
        case 0x2C:  // , comma
        case 0x7B:  // { open curly brace
        case 0x7D:  // } close curly brace
        case 0x5B:  // [
        case 0x5D:  // ]
        case 0x3A:  // :
        case 0x3F:  // ?
        case 0x7E:  // ~
            ++index;
            if (extra.tokenize) {
                if (code === 0x28) {
                    extra.openParenToken = extra.tokens.length;
                } else if (code === 0x7B) {
                    extra.openCurlyToken = extra.tokens.length;
                }
            }
            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };

        default:
            code2 = source.charCodeAt(index + 1);

            // '=' (U+003D) marks an assignment or comparison operator.
            if (code2 === 0x3D) {
                switch (code) {
                case 0x2B:  // +
                case 0x2D:  // -
                case 0x2F:  // /
                case 0x3C:  // <
                case 0x3E:  // >
                case 0x5E:  // ^
                case 0x7C:  // |
                case 0x25:  // %
                case 0x26:  // &
                case 0x2A:  // *
                    index += 2;
                    return {
                        type: Token.Punctuator,
                        value: String.fromCharCode(code) + String.fromCharCode(code2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        start: start,
                        end: index
                    };

                case 0x21: // !
                case 0x3D: // =
                    index += 2;

                    // !== and ===
                    if (source.charCodeAt(index) === 0x3D) {
                        ++index;
                    }
                    return {
                        type: Token.Punctuator,
                        value: source.slice(start, index),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        start: start,
                        end: index
                    };
                }
            }
        }

        // 4-character punctuator: >>>=

        ch4 = source.substr(index, 4);

        if (ch4 === '>>>=') {
            index += 4;
            return {
                type: Token.Punctuator,
                value: ch4,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // 3-character punctuators: === !== >>> <<= >>=

        ch3 = ch4.substr(0, 3);

        if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: ch3,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // Other 2-character punctuators: ++ -- << >> && ||
        ch2 = ch3.substr(0, 2);

        if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
            index += 2;
            return {
                type: Token.Punctuator,
                value: ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // 1-character punctuators: < > = ! + - * % & | ^ /
        if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    // 7.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(start) {
        var number = '0' + source[index++];
        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: true,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (isOctalDigit(ch)) {
                    return scanOctalLiteral(start);
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                            str += unescaped;
                        } else {
                            index = restore;
                            str += ch;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function testRegExp(pattern, flags) {
        var value;
        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }
        return value;
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwError({}, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
                } else {
                    str += '\\';
                    throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, pattern, value;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);

        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var ch;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        ch = source.charCodeAt(index);

        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }

        // Very common: ( and ) and ;
        if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (ch === 0x27 || ch === 0x22) {
            return scanStringLiteral();
        }


        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && ch === 0x2F) {
            return advanceSlash();
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, range, value;

        skipComment();
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            });
        }

        return token;
    }

    function lex() {
        var token;

        token = lookahead;
        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();

        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        return token;
    }

    function peek() {
        var pos, line, start;

        pos = index;
        line = lineNumber;
        start = lineStart;
        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
    }

    function Position(line, column) {
        this.line = line;
        this.column = column;
    }

    function SourceLocation(startLine, startColumn, line, column) {
        this.start = new Position(startLine, startColumn);
        this.end = new Position(line, column);
    }

    SyntaxTreeDelegate = {

        name: 'SyntaxTree',

        processComment: function (node) {
            var lastChild, trailingComments;

            if (node.type === Syntax.Program) {
                if (node.body.length > 0) {
                    return;
                }
            }

            peek();

            if (extra.trailingComments.length > 0) {
                if (extra.trailingComments[0].range[0] >= node.range[1]) {
                    trailingComments = extra.trailingComments;
                    extra.trailingComments = [];
                } else {
                    extra.trailingComments.length = 0;
                }
            } else {
                if (extra.bottomRightStack.length > 0 &&
                        extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments &&
                        extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments[0].range[0] >= node.range[1]) {
                    trailingComments = extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                    delete extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                }
            }

            // Eating the stack.
            while (extra.bottomRightStack.length > 0 && extra.bottomRightStack[extra.bottomRightStack.length - 1].range[0] >= node.range[0]) {
                lastChild = extra.bottomRightStack.pop();
            }

            if (lastChild) {
                if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                    node.leadingComments = lastChild.leadingComments;
                    delete lastChild.leadingComments;
                }
            } else if (extra.leadingComments.length > 0 && extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = extra.leadingComments;
                extra.leadingComments = [];
            }


            if (trailingComments) {
                node.trailingComments = trailingComments;
            }

            extra.bottomRightStack.push(node);
        },

        markEnd: function (node, startToken) {
            if (extra.range) {
                node.range = [startToken.start, index];
            }
            if (extra.loc) {
                node.loc = new SourceLocation(
                    startToken.startLineNumber === undefined ?  startToken.lineNumber : startToken.startLineNumber,
                    startToken.start - (startToken.startLineStart === undefined ?  startToken.lineStart : startToken.startLineStart),
                    lineNumber,
                    index - lineStart
                );
                this.postProcess(node);
            }

            if (extra.attachComment) {
                this.processComment(node);
            }
            return node;
        },

        postProcess: function (node) {
            if (extra.source) {
                node.loc.source = extra.source;
            }
            return node;
        },

        createArrayExpression: function (elements) {
            return {
                type: Syntax.ArrayExpression,
                elements: elements
            };
        },

        createAssignmentExpression: function (operator, left, right) {
            return {
                type: Syntax.AssignmentExpression,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBinaryExpression: function (operator, left, right) {
            var type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression :
                        Syntax.BinaryExpression;
            return {
                type: type,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBlockStatement: function (body) {
            return {
                type: Syntax.BlockStatement,
                body: body
            };
        },

        createBreakStatement: function (label) {
            return {
                type: Syntax.BreakStatement,
                label: label
            };
        },

        createCallExpression: function (callee, args) {
            return {
                type: Syntax.CallExpression,
                callee: callee,
                'arguments': args
            };
        },

        createCatchClause: function (param, body) {
            return {
                type: Syntax.CatchClause,
                param: param,
                body: body
            };
        },

        createConditionalExpression: function (test, consequent, alternate) {
            return {
                type: Syntax.ConditionalExpression,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createContinueStatement: function (label) {
            return {
                type: Syntax.ContinueStatement,
                label: label
            };
        },

        createDebuggerStatement: function () {
            return {
                type: Syntax.DebuggerStatement
            };
        },

        createDoWhileStatement: function (body, test) {
            return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test
            };
        },

        createEmptyStatement: function () {
            return {
                type: Syntax.EmptyStatement
            };
        },

        createExpressionStatement: function (expression) {
            return {
                type: Syntax.ExpressionStatement,
                expression: expression
            };
        },

        createForStatement: function (init, test, update, body) {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        },

        createForInStatement: function (left, right, body) {
            return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
            };
        },

        createFunctionDeclaration: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createFunctionExpression: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createIdentifier: function (name) {
            return {
                type: Syntax.Identifier,
                name: name
            };
        },

        createIfStatement: function (test, consequent, alternate) {
            return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createLabeledStatement: function (label, body) {
            return {
                type: Syntax.LabeledStatement,
                label: label,
                body: body
            };
        },

        createLiteral: function (token) {
            return {
                type: Syntax.Literal,
                value: token.value,
                raw: source.slice(token.start, token.end)
            };
        },

        createMemberExpression: function (accessor, object, property) {
            return {
                type: Syntax.MemberExpression,
                computed: accessor === '[',
                object: object,
                property: property
            };
        },

        createNewExpression: function (callee, args) {
            return {
                type: Syntax.NewExpression,
                callee: callee,
                'arguments': args
            };
        },

        createObjectExpression: function (properties) {
            return {
                type: Syntax.ObjectExpression,
                properties: properties
            };
        },

        createPostfixExpression: function (operator, argument) {
            return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: false
            };
        },

        createProgram: function (body) {
            return {
                type: Syntax.Program,
                body: body
            };
        },

        createProperty: function (kind, key, value) {
            return {
                type: Syntax.Property,
                key: key,
                value: value,
                kind: kind
            };
        },

        createReturnStatement: function (argument) {
            return {
                type: Syntax.ReturnStatement,
                argument: argument
            };
        },

        createSequenceExpression: function (expressions) {
            return {
                type: Syntax.SequenceExpression,
                expressions: expressions
            };
        },

        createSwitchCase: function (test, consequent) {
            return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent
            };
        },

        createSwitchStatement: function (discriminant, cases) {
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        },

        createThisExpression: function () {
            return {
                type: Syntax.ThisExpression
            };
        },

        createThrowStatement: function (argument) {
            return {
                type: Syntax.ThrowStatement,
                argument: argument
            };
        },

        createTryStatement: function (block, guardedHandlers, handlers, finalizer) {
            return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: guardedHandlers,
                handlers: handlers,
                finalizer: finalizer
            };
        },

        createUnaryExpression: function (operator, argument) {
            if (operator === '++' || operator === '--') {
                return {
                    type: Syntax.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true
                };
            }
            return {
                type: Syntax.UnaryExpression,
                operator: operator,
                argument: argument,
                prefix: true
            };
        },

        createVariableDeclaration: function (declarations, kind) {
            return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind
            };
        },

        createVariableDeclarator: function (id, init) {
            return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init
            };
        },

        createWhileStatement: function (test, body) {
            return {
                type: Syntax.WhileStatement,
                test: test,
                body: body
            };
        },

        createWithStatement: function (object, body) {
            return {
                type: Syntax.WithStatement,
                object: object,
                body: body
            };
        }
    };

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    assert(index < args.length, 'Message reference must be in range');
                    return args[index];
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.start;
            error.lineNumber = token.lineNumber;
            error.column = token.start - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        error.description = msg;
        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var line;

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B || match(';')) {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpected(lookahead);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [], startToken;

        startToken = lookahead;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return delegate.markEnd(delegate.createArrayExpression(elements), startToken);
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(param, first) {
        var previousStrict, body, startToken;

        previousStrict = strict;
        startToken = lookahead;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;
        return delegate.markEnd(delegate.createFunctionExpression(null, param, [], body), startToken);
    }

    function parseObjectPropertyKey() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return delegate.markEnd(delegate.createLiteral(token), startToken);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseObjectProperty() {
        var token, key, id, value, param, startToken;

        token = lookahead;
        startToken = lookahead;

        if (token.type === Token.Identifier) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                value = parsePropertyFunction([]);
                return delegate.markEnd(delegate.createProperty('get', key, value), startToken);
            }
            if (token.value === 'set' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead;
                if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
                    value = parsePropertyFunction([]);
                } else {
                    param = [ parseVariableIdentifier() ];
                    expect(')');
                    value = parsePropertyFunction(param, token);
                }
                return delegate.markEnd(delegate.createProperty('set', key, value), startToken);
            }
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', id, value), startToken);
        }
        if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpected(token);
        } else {
            key = parseObjectPropertyKey();
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', key, value), startToken);
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, key, kind, map = {}, toString = String, startToken;

        startToken = lookahead;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

            key = '$' + name;
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[key] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[key] |= kind;
            } else {
                map[key] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return delegate.markEnd(delegate.createObjectExpression(properties), startToken);
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        expr = parseExpression();

        expect(')');

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, startToken;

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        type = lookahead.type;
        startToken = lookahead;

        if (type === Token.Identifier) {
            expr =  delegate.createIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
            }
            expr = delegate.createLiteral(lex());
        } else if (type === Token.Keyword) {
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                expr = delegate.createThisExpression();
            } else {
                throwUnexpected(lex());
            }
        } else if (type === Token.BooleanLiteral) {
            token = lex();
            token.value = (token.value === 'true');
            expr = delegate.createLiteral(token);
        } else if (type === Token.NullLiteral) {
            token = lex();
            token.value = null;
            expr = delegate.createLiteral(token);
        } else if (match('/') || match('/=')) {
            if (typeof extra.tokens !== 'undefined') {
                expr = delegate.createLiteral(collectRegex());
            } else {
                expr = delegate.createLiteral(scanRegExp());
            }
            peek();
        } else {
            throwUnexpected(lex());
        }

        return delegate.markEnd(expr, startToken);
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var callee, args, startToken;

        startToken = lookahead;
        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];

        return delegate.markEnd(delegate.createNewExpression(callee, args), startToken);
    }

    function parseLeftHandSideExpressionAllowCall() {
        var previousAllowIn, expr, args, property, startToken;

        startToken = lookahead;

        previousAllowIn = state.allowIn;
        state.allowIn = true;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        state.allowIn = previousAllowIn;

        for (;;) {
            if (match('.')) {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            } else if (match('(')) {
                args = parseArguments();
                expr = delegate.createCallExpression(expr, args);
            } else if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                break;
            }
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    function parseLeftHandSideExpression() {
        var previousAllowIn, expr, property, startToken;

        startToken = lookahead;

        previousAllowIn = state.allowIn;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        state.allowIn = previousAllowIn;

        while (match('.') || match('[')) {
            if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            }
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = parseLeftHandSideExpressionAllowCall();

        if (lookahead.type === Token.Punctuator) {
            if ((match('++') || match('--')) && !peekLineTerminator()) {
                // 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    throwErrorTolerant({}, Messages.StrictLHSPostfix);
                }

                if (!isLeftHandSide(expr)) {
                    throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
                }

                token = lex();
                expr = delegate.markEnd(delegate.createPostfixExpression(token.value, expr), startToken);
            }
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = parseUnaryExpression();

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = parseUnaryExpression();

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                expr = delegate.createBinaryExpression(operator, left, right);
                markers.pop();
                marker = markers[markers.length - 1];
                delegate.markEnd(expr, marker);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = parseUnaryExpression();
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = delegate.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
            marker = markers.pop();
            delegate.markEnd(expr, marker);
        }

        return expr;
    }


    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = parseBinaryExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();

            expr = delegate.createConditionalExpression(expr, consequent, alternate);
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, left, right, node, startToken;

        token = lookahead;
        startToken = lookahead;

        node = left = parseConditionalExpression();

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(left)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && left.type === Syntax.Identifier && isRestrictedWord(left.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            token = lex();
            right = parseAssignmentExpression();
            node = delegate.markEnd(delegate.createAssignmentExpression(token.value, left, right), startToken);
        }

        return node;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead;

        expr = parseAssignmentExpression();

        if (match(',')) {
            expr = delegate.createSequenceExpression([ expr ]);

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }

            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block, startToken;

        startToken = lookahead;
        expect('{');

        block = parseStatementList();

        expect('}');

        return delegate.markEnd(delegate.createBlockStatement(block), startToken);
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseVariableDeclaration(kind) {
        var init = null, id, startToken;

        startToken = lookahead;
        id = parseVariableIdentifier();

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }

        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return delegate.markEnd(delegate.createVariableDeclarator(id, init), startToken);
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return delegate.createVariableDeclaration(declarations, 'var');
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations, startToken;

        startToken = lookahead;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, kind), startToken);
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');
        return delegate.createEmptyStatement();
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();
        consumeSemicolon();
        return delegate.createExpressionStatement(expr);
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return delegate.createIfStatement(test, consequent, alternate);
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return delegate.createDoWhileStatement(body, test);
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return delegate.createWhileStatement(test, body);
    }

    function parseForVariableDeclaration() {
        var token, declarations, startToken;

        startToken = lookahead;
        token = lex();
        declarations = parseVariableDeclarationList();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, token.value), startToken);
    }

    function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                delegate.createForStatement(init, test, update, body) :
                delegate.createForInStatement(left, right, body);
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(index) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return delegate.createContinueStatement(label);
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return delegate.createBreakStatement(label);
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(index) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return delegate.createReturnStatement(argument);
            }
        }

        if (peekLineTerminator()) {
            return delegate.createReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return delegate.createReturnStatement(argument);
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            // TODO(ikarienator): Should we update the test cases instead?
            skipComment();
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return delegate.createWithStatement(object, body);
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test, consequent = [], statement, startToken;

        startToken = lookahead;
        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            consequent.push(statement);
        }

        return delegate.markEnd(delegate.createSwitchCase(test, consequent), startToken);
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return delegate.createSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return delegate.createSwitchStatement(discriminant, cases);
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return delegate.createThrowStatement(argument);
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param, body, startToken;

        startToken = lookahead;
        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead);
        }

        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return delegate.markEnd(delegate.createCatchClause(param, body), startToken);
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return delegate.createTryStatement(block, [], handlers, finalizer);
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return delegate.createDebuggerStatement();
    }

    // 12 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            startToken;

        if (type === Token.EOF) {
            throwUnexpected(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }

        startToken = lookahead;

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return delegate.markEnd(parseEmptyStatement(), startToken);
            case '(':
                return delegate.markEnd(parseExpressionStatement(), startToken);
            default:
                break;
            }
        }

        if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return delegate.markEnd(parseBreakStatement(), startToken);
            case 'continue':
                return delegate.markEnd(parseContinueStatement(), startToken);
            case 'debugger':
                return delegate.markEnd(parseDebuggerStatement(), startToken);
            case 'do':
                return delegate.markEnd(parseDoWhileStatement(), startToken);
            case 'for':
                return delegate.markEnd(parseForStatement(), startToken);
            case 'function':
                return delegate.markEnd(parseFunctionDeclaration(), startToken);
            case 'if':
                return delegate.markEnd(parseIfStatement(), startToken);
            case 'return':
                return delegate.markEnd(parseReturnStatement(), startToken);
            case 'switch':
                return delegate.markEnd(parseSwitchStatement(), startToken);
            case 'throw':
                return delegate.markEnd(parseThrowStatement(), startToken);
            case 'try':
                return delegate.markEnd(parseTryStatement(), startToken);
            case 'var':
                return delegate.markEnd(parseVariableStatement(), startToken);
            case 'while':
                return delegate.markEnd(parseWhileStatement(), startToken);
            case 'with':
                return delegate.markEnd(parseWithStatement(), startToken);
            default:
                break;
            }
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return delegate.markEnd(delegate.createLabeledStatement(expr, labeledBody), startToken);
        }

        consumeSemicolon();

        return delegate.markEnd(delegate.createExpressionStatement(expr), startToken);
    }

    // 13 Function Definition

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, startToken;

        startToken = lookahead;
        expect('{');

        while (index < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return delegate.markEnd(delegate.createBlockStatement(sourceElements), startToken);
    }

    function parseParams(firstRestricted) {
        var param, params = [], token, stricted, paramSet, key, message;
        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead;
                param = parseVariableIdentifier();
                key = '$' + token.value;
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[key] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return {
            params: params,
            stricted: stricted,
            firstRestricted: firstRestricted,
            message: message
        };
    }

    function parseFunctionDeclaration() {
        var id, params = [], body, token, stricted, tmp, firstRestricted, message, previousStrict, startToken;

        startToken = lookahead;

        expectKeyword('function');
        token = lookahead;
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionDeclaration(id, params, [], body), startToken);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp, params = [], body, previousStrict, startToken;

        startToken = lookahead;
        expectKeyword('function');

        if (!match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionExpression(id, params, [], body), startToken);
    }

    // 14 Program

    function parseSourceElement() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(lookahead.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (lookahead.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseSourceElement();
            /* istanbul ignore if */
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var body, startToken;

        skipComment();
        peek();
        startToken = lookahead;
        strict = false;

        body = parseSourceElements();
        return delegate.markEnd(delegate.createProgram(body), startToken);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options) {
        var toString,
            token,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            token = lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    token = lex();
                } catch (lexError) {
                    token = lookahead;
                    if (extra.errors) {
                        extra.errors.push(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '1.2.1';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
   /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],17:[function(require,module,exports){
/*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*jslint vars:false, bitwise:true*/
/*jshint indent:4*/
/*global exports:true, define:true*/
(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // and plain browser loading,
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.estraverse = {}));
    }
}(this, function (exports) {
    'use strict';

    var Syntax,
        isArray,
        VisitorOption,
        VisitorKeys,
        BREAK,
        SKIP;

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    function ignoreJSHintError() { }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                } else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }

    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    ignoreJSHintError(shallowCopy);

    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License

    function upperBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            } else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }

    function lowerBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
            } else {
                len = diff;
            }
        }
        return i;
    }
    ignoreJSHintError(lowerBound);

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'defaults', 'rest', 'body'],
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'body', 'superClass'],
        ClassExpression: ['id', 'body', 'superClass'],
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'defaults', 'rest', 'body'],
        FunctionExpression: ['id', 'params', 'defaults', 'rest', 'body'],
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        MethodDefinition: ['key', 'value'],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handlers', 'handler', 'guardedHandlers', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };

    // unique id
    BREAK = {};
    SKIP = {};

    VisitorOption = {
        Break: BREAK,
        Skip: SKIP
    };

    function Reference(parent, key) {
        this.parent = parent;
        this.key = key;
    }

    Reference.prototype.replace = function replace(node) {
        this.parent[this.key] = node;
    };

    function Element(node, path, wrap, ref) {
        this.node = node;
        this.path = path;
        this.wrap = wrap;
        this.ref = ref;
    }

    function Controller() { }

    // API:
    // return property path array from root to current node
    Controller.prototype.path = function path() {
        var i, iz, j, jz, result, element;

        function addToPath(result, path) {
            if (isArray(path)) {
                for (j = 0, jz = path.length; j < jz; ++j) {
                    result.push(path[j]);
                }
            } else {
                result.push(path);
            }
        }

        // root node
        if (!this.__current.path) {
            return null;
        }

        // first node is sentinel, second node is root element
        result = [];
        for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
            element = this.__leavelist[i];
            addToPath(result, element.path);
        }
        addToPath(result, this.__current.path);
        return result;
    };

    // API:
    // return array of parent elements
    Controller.prototype.parents = function parents() {
        var i, iz, result;

        // first node is sentinel
        result = [];
        for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
            result.push(this.__leavelist[i].node);
        }

        return result;
    };

    // API:
    // return current node
    Controller.prototype.current = function current() {
        return this.__current.node;
    };

    Controller.prototype.__execute = function __execute(callback, element) {
        var previous, result;

        result = undefined;

        previous  = this.__current;
        this.__current = element;
        this.__state = null;
        if (callback) {
            result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
        }
        this.__current = previous;

        return result;
    };

    // API:
    // notify control skip / break
    Controller.prototype.notify = function notify(flag) {
        this.__state = flag;
    };

    // API:
    // skip child nodes of current node
    Controller.prototype.skip = function () {
        this.notify(SKIP);
    };

    // API:
    // break traversals
    Controller.prototype['break'] = function () {
        this.notify(BREAK);
    };

    Controller.prototype.__initialize = function(root, visitor) {
        this.visitor = visitor;
        this.root = root;
        this.__worklist = [];
        this.__leavelist = [];
        this.__current = null;
        this.__state = null;
    };

    Controller.prototype.traverse = function traverse(root, visitor) {
        var worklist,
            leavelist,
            element,
            node,
            nodeType,
            ret,
            key,
            current,
            current2,
            candidates,
            candidate,
            sentinel;

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        worklist.push(new Element(root, null, null, null));
        leavelist.push(new Element(null, null, null, null));

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                ret = this.__execute(visitor.leave, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }
                continue;
            }

            if (element.node) {

                ret = this.__execute(visitor.enter, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }

                worklist.push(sentinel);
                leavelist.push(element);

                if (this.__state === SKIP || ret === SKIP) {
                    continue;
                }

                node = element.node;
                nodeType = element.wrap || node.type;
                candidates = VisitorKeys[nodeType];

                current = candidates.length;
                while ((current -= 1) >= 0) {
                    key = candidates[current];
                    candidate = node[key];
                    if (!candidate) {
                        continue;
                    }

                    if (!isArray(candidate)) {
                        worklist.push(new Element(candidate, key, null, null));
                        continue;
                    }

                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                        if (!candidate[current2]) {
                            continue;
                        }
                        if ((nodeType === Syntax.ObjectExpression || nodeType === Syntax.ObjectPattern) && 'properties' === candidates[current]) {
                            element = new Element(candidate[current2], [key, current2], 'Property', null);
                        } else {
                            element = new Element(candidate[current2], [key, current2], null, null);
                        }
                        worklist.push(element);
                    }
                }
            }
        }
    };

    Controller.prototype.replace = function replace(root, visitor) {
        var worklist,
            leavelist,
            node,
            nodeType,
            target,
            element,
            current,
            current2,
            candidates,
            candidate,
            sentinel,
            outer,
            key;

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        outer = {
            root: root
        };
        element = new Element(root, null, null, new Reference(outer, 'root'));
        worklist.push(element);
        leavelist.push(element);

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                target = this.__execute(visitor.leave, element);

                // node may be replaced with null,
                // so distinguish between undefined and null in this place
                if (target !== undefined && target !== BREAK && target !== SKIP) {
                    // replace
                    element.ref.replace(target);
                }

                if (this.__state === BREAK || target === BREAK) {
                    return outer.root;
                }
                continue;
            }

            target = this.__execute(visitor.enter, element);

            // node may be replaced with null,
            // so distinguish between undefined and null in this place
            if (target !== undefined && target !== BREAK && target !== SKIP) {
                // replace
                element.ref.replace(target);
                element.node = target;
            }

            if (this.__state === BREAK || target === BREAK) {
                return outer.root;
            }

            // node may be null
            node = element.node;
            if (!node) {
                continue;
            }

            worklist.push(sentinel);
            leavelist.push(element);

            if (this.__state === SKIP || target === SKIP) {
                continue;
            }

            nodeType = element.wrap || node.type;
            candidates = VisitorKeys[nodeType];

            current = candidates.length;
            while ((current -= 1) >= 0) {
                key = candidates[current];
                candidate = node[key];
                if (!candidate) {
                    continue;
                }

                if (!isArray(candidate)) {
                    worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                    continue;
                }

                current2 = candidate.length;
                while ((current2 -= 1) >= 0) {
                    if (!candidate[current2]) {
                        continue;
                    }
                    if (nodeType === Syntax.ObjectExpression && 'properties' === candidates[current]) {
                        element = new Element(candidate[current2], [key, current2], 'Property', new Reference(candidate, current2));
                    } else {
                        element = new Element(candidate[current2], [key, current2], null, new Reference(candidate, current2));
                    }
                    worklist.push(element);
                }
            }
        }

        return outer.root;
    };

    function traverse(root, visitor) {
        var controller = new Controller();
        return controller.traverse(root, visitor);
    }

    function replace(root, visitor) {
        var controller = new Controller();
        return controller.replace(root, visitor);
    }

    function extendCommentRange(comment, tokens) {
        var target;

        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });

        comment.extendedRange = [comment.range[0], comment.range[1]];

        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }

        target -= 1;
        if (target >= 0) {
            comment.extendedRange[0] = tokens[target].range[1];
        }

        return comment;
    }

    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i, cursor;

        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }

        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }

        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }

        // This is based on John Freeman's implementation.
        cursor = 0;
        traverse(tree, {
            enter: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        cursor = 0;
        traverse(tree, {
            leave: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        return tree;
    }

    exports.version = '1.3.3-dev';
    exports.Syntax = Syntax;
    exports.traverse = traverse;
    exports.replace = replace;
    exports.attachComments = attachComments;
    exports.VisitorKeys = VisitorKeys;
    exports.VisitorOption = VisitorOption;
    exports.Controller = Controller;
}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],18:[function(require,module,exports){
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

},{"escodegen":1,"esprima":16,"estraverse":17}],19:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("K/m7xv"))
},{"K/m7xv":20}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[18])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9ub2RlX21vZHVsZXMvZXNjb2RlZ2VuL2VzY29kZWdlbi5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9ub2RlX21vZHVsZXMvZXNjb2RlZ2VuL25vZGVfbW9kdWxlcy9lc3V0aWxzL2xpYi9jb2RlLmpzIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc2NvZGVnZW4vbm9kZV9tb2R1bGVzL2VzdXRpbHMvbGliL2tleXdvcmQuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvZXN1dGlscy9saWIvdXRpbHMuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9ub2RlX21vZHVsZXMvZXNjb2RlZ2VuL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL2FycmF5LXNldC5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9ub2RlX21vZHVsZXMvZXNjb2RlZ2VuL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL2Jhc2U2NC12bHEuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC9iYXNlNjQuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC9iaW5hcnktc2VhcmNoLmpzIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc2NvZGVnZW4vbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAvc291cmNlLW1hcC1jb25zdW1lci5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9ub2RlX21vZHVsZXMvZXNjb2RlZ2VuL25vZGVfbW9kdWxlcy9zb3VyY2UtbWFwL2xpYi9zb3VyY2UtbWFwL3NvdXJjZS1tYXAtZ2VuZXJhdG9yLmpzIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc2NvZGVnZW4vbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbGliL3NvdXJjZS1tYXAvc291cmNlLW5vZGUuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9saWIvc291cmNlLW1hcC91dGlsLmpzIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc2NvZGVnZW4vbm9kZV9tb2R1bGVzL3NvdXJjZS1tYXAvbm9kZV9tb2R1bGVzL2FtZGVmaW5lL2FtZGVmaW5lLmpzIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc2NvZGVnZW4vcGFja2FnZS5qc29uIiwiL1VzZXJzL3Zrei93b3JrL3lhLXBhcnNlL25vZGVfbW9kdWxlcy9lc3ByaW1hL2VzcHJpbWEuanMiLCIvVXNlcnMvdmt6L3dvcmsveWEtcGFyc2Uvbm9kZV9tb2R1bGVzL2VzdHJhdmVyc2UvZXN0cmF2ZXJzZS5qcyIsIi9Vc2Vycy92a3ovd29yay95YS1wYXJzZS9zY3JhdGNoLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25ZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOXFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLypcbiAgQ29weXJpZ2h0IChDKSAyMDEyLTIwMTMgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTItMjAxMyBNaWNoYWVsIEZpY2FycmEgPGVzY29kZWdlbi5jb3B5cmlnaHRAbWljaGFlbC5maWNhcnJhLm1lPlxuICBDb3B5cmlnaHQgKEMpIDIwMTItMjAxMyBNYXRoaWFzIEJ5bmVucyA8bWF0aGlhc0BxaXdpLmJlPlxuICBDb3B5cmlnaHQgKEMpIDIwMTMgSXJha2xpIEdvemFsaXNodmlsaSA8cmZvYmljQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIFJvYmVydCBHdXN0LUJhcmRvbiA8ZG9uYXRlQHJvYmVydC5ndXN0LWJhcmRvbi5vcmc+XG4gIENvcHlyaWdodCAoQykgMjAxMiBKb2huIEZyZWVtYW4gPGpmcmVlbWFuMDhAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTEtMjAxMiBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEpvb3N0LVdpbSBCb2VrZXN0ZWlqbiA8am9vc3Qtd2ltQGJvZWtlc3RlaWpuLm5sPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgS3JpcyBLb3dhbCA8a3Jpcy5rb3dhbEBjaXhhci5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcnBhZCBCb3Jzb3MgPGFycGFkLmJvcnNvc0Bnb29nbGVtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG4vKmdsb2JhbCBleHBvcnRzOnRydWUsIGdlbmVyYXRlU3RhdGVtZW50OnRydWUsIGdlbmVyYXRlRXhwcmVzc2lvbjp0cnVlLCByZXF1aXJlOnRydWUsIGdsb2JhbDp0cnVlKi9cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFN5bnRheCxcbiAgICAgICAgUHJlY2VkZW5jZSxcbiAgICAgICAgQmluYXJ5UHJlY2VkZW5jZSxcbiAgICAgICAgU291cmNlTm9kZSxcbiAgICAgICAgZXN0cmF2ZXJzZSxcbiAgICAgICAgZXN1dGlscyxcbiAgICAgICAgaXNBcnJheSxcbiAgICAgICAgYmFzZSxcbiAgICAgICAgaW5kZW50LFxuICAgICAgICBqc29uLFxuICAgICAgICByZW51bWJlcixcbiAgICAgICAgaGV4YWRlY2ltYWwsXG4gICAgICAgIHF1b3RlcyxcbiAgICAgICAgZXNjYXBlbGVzcyxcbiAgICAgICAgbmV3bGluZSxcbiAgICAgICAgc3BhY2UsXG4gICAgICAgIHBhcmVudGhlc2VzLFxuICAgICAgICBzZW1pY29sb25zLFxuICAgICAgICBzYWZlQ29uY2F0ZW5hdGlvbixcbiAgICAgICAgZGlyZWN0aXZlLFxuICAgICAgICBleHRyYSxcbiAgICAgICAgcGFyc2UsXG4gICAgICAgIHNvdXJjZU1hcCxcbiAgICAgICAgRk9STUFUX01JTklGWSxcbiAgICAgICAgRk9STUFUX0RFRkFVTFRTO1xuXG4gICAgZXN0cmF2ZXJzZSA9IHJlcXVpcmUoJ2VzdHJhdmVyc2UnKTtcbiAgICBlc3V0aWxzID0gcmVxdWlyZSgnZXN1dGlscycpO1xuXG4gICAgU3ludGF4ID0ge1xuICAgICAgICBBc3NpZ25tZW50RXhwcmVzc2lvbjogJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyxcbiAgICAgICAgQXJyYXlFeHByZXNzaW9uOiAnQXJyYXlFeHByZXNzaW9uJyxcbiAgICAgICAgQXJyYXlQYXR0ZXJuOiAnQXJyYXlQYXR0ZXJuJyxcbiAgICAgICAgQXJyb3dGdW5jdGlvbkV4cHJlc3Npb246ICdBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbicsXG4gICAgICAgIEJsb2NrU3RhdGVtZW50OiAnQmxvY2tTdGF0ZW1lbnQnLFxuICAgICAgICBCaW5hcnlFeHByZXNzaW9uOiAnQmluYXJ5RXhwcmVzc2lvbicsXG4gICAgICAgIEJyZWFrU3RhdGVtZW50OiAnQnJlYWtTdGF0ZW1lbnQnLFxuICAgICAgICBDYWxsRXhwcmVzc2lvbjogJ0NhbGxFeHByZXNzaW9uJyxcbiAgICAgICAgQ2F0Y2hDbGF1c2U6ICdDYXRjaENsYXVzZScsXG4gICAgICAgIENvbXByZWhlbnNpb25CbG9jazogJ0NvbXByZWhlbnNpb25CbG9jaycsXG4gICAgICAgIENvbXByZWhlbnNpb25FeHByZXNzaW9uOiAnQ29tcHJlaGVuc2lvbkV4cHJlc3Npb24nLFxuICAgICAgICBDb25kaXRpb25hbEV4cHJlc3Npb246ICdDb25kaXRpb25hbEV4cHJlc3Npb24nLFxuICAgICAgICBDb250aW51ZVN0YXRlbWVudDogJ0NvbnRpbnVlU3RhdGVtZW50JyxcbiAgICAgICAgRGlyZWN0aXZlU3RhdGVtZW50OiAnRGlyZWN0aXZlU3RhdGVtZW50JyxcbiAgICAgICAgRG9XaGlsZVN0YXRlbWVudDogJ0RvV2hpbGVTdGF0ZW1lbnQnLFxuICAgICAgICBEZWJ1Z2dlclN0YXRlbWVudDogJ0RlYnVnZ2VyU3RhdGVtZW50JyxcbiAgICAgICAgRW1wdHlTdGF0ZW1lbnQ6ICdFbXB0eVN0YXRlbWVudCcsXG4gICAgICAgIEV4cG9ydERlY2xhcmF0aW9uOiAnRXhwb3J0RGVjbGFyYXRpb24nLFxuICAgICAgICBFeHByZXNzaW9uU3RhdGVtZW50OiAnRXhwcmVzc2lvblN0YXRlbWVudCcsXG4gICAgICAgIEZvclN0YXRlbWVudDogJ0ZvclN0YXRlbWVudCcsXG4gICAgICAgIEZvckluU3RhdGVtZW50OiAnRm9ySW5TdGF0ZW1lbnQnLFxuICAgICAgICBGb3JPZlN0YXRlbWVudDogJ0Zvck9mU3RhdGVtZW50JyxcbiAgICAgICAgRnVuY3Rpb25EZWNsYXJhdGlvbjogJ0Z1bmN0aW9uRGVjbGFyYXRpb24nLFxuICAgICAgICBGdW5jdGlvbkV4cHJlc3Npb246ICdGdW5jdGlvbkV4cHJlc3Npb24nLFxuICAgICAgICBHZW5lcmF0b3JFeHByZXNzaW9uOiAnR2VuZXJhdG9yRXhwcmVzc2lvbicsXG4gICAgICAgIElkZW50aWZpZXI6ICdJZGVudGlmaWVyJyxcbiAgICAgICAgSWZTdGF0ZW1lbnQ6ICdJZlN0YXRlbWVudCcsXG4gICAgICAgIExpdGVyYWw6ICdMaXRlcmFsJyxcbiAgICAgICAgTGFiZWxlZFN0YXRlbWVudDogJ0xhYmVsZWRTdGF0ZW1lbnQnLFxuICAgICAgICBMb2dpY2FsRXhwcmVzc2lvbjogJ0xvZ2ljYWxFeHByZXNzaW9uJyxcbiAgICAgICAgTWVtYmVyRXhwcmVzc2lvbjogJ01lbWJlckV4cHJlc3Npb24nLFxuICAgICAgICBOZXdFeHByZXNzaW9uOiAnTmV3RXhwcmVzc2lvbicsXG4gICAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgICAgT2JqZWN0UGF0dGVybjogJ09iamVjdFBhdHRlcm4nLFxuICAgICAgICBQcm9ncmFtOiAnUHJvZ3JhbScsXG4gICAgICAgIFByb3BlcnR5OiAnUHJvcGVydHknLFxuICAgICAgICBSZXR1cm5TdGF0ZW1lbnQ6ICdSZXR1cm5TdGF0ZW1lbnQnLFxuICAgICAgICBTZXF1ZW5jZUV4cHJlc3Npb246ICdTZXF1ZW5jZUV4cHJlc3Npb24nLFxuICAgICAgICBTd2l0Y2hTdGF0ZW1lbnQ6ICdTd2l0Y2hTdGF0ZW1lbnQnLFxuICAgICAgICBTd2l0Y2hDYXNlOiAnU3dpdGNoQ2FzZScsXG4gICAgICAgIFRoaXNFeHByZXNzaW9uOiAnVGhpc0V4cHJlc3Npb24nLFxuICAgICAgICBUaHJvd1N0YXRlbWVudDogJ1Rocm93U3RhdGVtZW50JyxcbiAgICAgICAgVHJ5U3RhdGVtZW50OiAnVHJ5U3RhdGVtZW50JyxcbiAgICAgICAgVW5hcnlFeHByZXNzaW9uOiAnVW5hcnlFeHByZXNzaW9uJyxcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1VwZGF0ZUV4cHJlc3Npb24nLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0aW9uOiAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG4gICAgICAgIFZhcmlhYmxlRGVjbGFyYXRvcjogJ1ZhcmlhYmxlRGVjbGFyYXRvcicsXG4gICAgICAgIFdoaWxlU3RhdGVtZW50OiAnV2hpbGVTdGF0ZW1lbnQnLFxuICAgICAgICBXaXRoU3RhdGVtZW50OiAnV2l0aFN0YXRlbWVudCcsXG4gICAgICAgIFlpZWxkRXhwcmVzc2lvbjogJ1lpZWxkRXhwcmVzc2lvbidcbiAgICB9O1xuXG4gICAgUHJlY2VkZW5jZSA9IHtcbiAgICAgICAgU2VxdWVuY2U6IDAsXG4gICAgICAgIFlpZWxkOiAxLFxuICAgICAgICBBc3NpZ25tZW50OiAxLFxuICAgICAgICBDb25kaXRpb25hbDogMixcbiAgICAgICAgQXJyb3dGdW5jdGlvbjogMixcbiAgICAgICAgTG9naWNhbE9SOiAzLFxuICAgICAgICBMb2dpY2FsQU5EOiA0LFxuICAgICAgICBCaXR3aXNlT1I6IDUsXG4gICAgICAgIEJpdHdpc2VYT1I6IDYsXG4gICAgICAgIEJpdHdpc2VBTkQ6IDcsXG4gICAgICAgIEVxdWFsaXR5OiA4LFxuICAgICAgICBSZWxhdGlvbmFsOiA5LFxuICAgICAgICBCaXR3aXNlU0hJRlQ6IDEwLFxuICAgICAgICBBZGRpdGl2ZTogMTEsXG4gICAgICAgIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgICAgICAgVW5hcnk6IDEzLFxuICAgICAgICBQb3N0Zml4OiAxNCxcbiAgICAgICAgQ2FsbDogMTUsXG4gICAgICAgIE5ldzogMTYsXG4gICAgICAgIE1lbWJlcjogMTcsXG4gICAgICAgIFByaW1hcnk6IDE4XG4gICAgfTtcblxuICAgIEJpbmFyeVByZWNlZGVuY2UgPSB7XG4gICAgICAgICd8fCc6IFByZWNlZGVuY2UuTG9naWNhbE9SLFxuICAgICAgICAnJiYnOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gICAgICAgICd8JzogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gICAgICAgICdeJzogUHJlY2VkZW5jZS5CaXR3aXNlWE9SLFxuICAgICAgICAnJic6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgICAgICAgJz09JzogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgICAgICAgJyE9JzogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgICAgICAgJz09PSc6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gICAgICAgICchPT0nOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICAgICAgICAnaXMnOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICAgICAgICAnaXNudCc6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gICAgICAgICc8JzogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICAgICAgICAnPic6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgICAgICAgJzw9JzogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICAgICAgICAnPj0nOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gICAgICAgICdpbic6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgICAgICAgJ2luc3RhbmNlb2YnOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gICAgICAgICc8PCc6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICAgICAgICAnPj4nOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgICAgICAgJz4+Pic6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICAgICAgICAnKyc6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gICAgICAgICctJzogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgICAgICAgJyonOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICAgICAgICAnJSc6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gICAgICAgICcvJzogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnZXREZWZhdWx0T3B0aW9ucygpIHtcbiAgICAgICAgLy8gZGVmYXVsdCBvcHRpb25zXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbmRlbnQ6IG51bGwsXG4gICAgICAgICAgICBiYXNlOiBudWxsLFxuICAgICAgICAgICAgcGFyc2U6IG51bGwsXG4gICAgICAgICAgICBjb21tZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgIGluZGVudDoge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZTogJyAgICAnLFxuICAgICAgICAgICAgICAgICAgICBiYXNlOiAwLFxuICAgICAgICAgICAgICAgICAgICBhZGp1c3RNdWx0aWxpbmVDb21tZW50OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3bGluZTogJ1xcbicsXG4gICAgICAgICAgICAgICAgc3BhY2U6ICcgJyxcbiAgICAgICAgICAgICAgICBqc29uOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZW51bWJlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGV4YWRlY2ltYWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHF1b3RlczogJ3NpbmdsZScsXG4gICAgICAgICAgICAgICAgZXNjYXBlbGVzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGFyZW50aGVzZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgc2VtaWNvbG9uczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzYWZlQ29uY2F0ZW5hdGlvbjogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb3o6IHtcbiAgICAgICAgICAgICAgICBjb21wcmVoZW5zaW9uRXhwcmVzc2lvblN0YXJ0c1dpdGhBc3NpZ25tZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzdGFybGVzc0dlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGFyZW50aGVzaXplZENvbXByZWhlbnNpb25CbG9jazogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3VyY2VNYXA6IG51bGwsXG4gICAgICAgICAgICBzb3VyY2VNYXBSb290OiBudWxsLFxuICAgICAgICAgICAgc291cmNlTWFwV2l0aENvZGU6IGZhbHNlLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICAgIHJhdzogdHJ1ZSxcbiAgICAgICAgICAgIHZlcmJhdGltOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyaW5nUmVwZWF0KHN0ciwgbnVtKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcblxuICAgICAgICBmb3IgKG51bSB8PSAwOyBudW0gPiAwOyBudW0gPj4+PSAxLCBzdHIgKz0gc3RyKSB7XG4gICAgICAgICAgICBpZiAobnVtICYgMSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBzdHI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIGlmICghaXNBcnJheSkge1xuICAgICAgICBpc0FycmF5ID0gZnVuY3Rpb24gaXNBcnJheShhcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzTGluZVRlcm1pbmF0b3Ioc3RyKSB7XG4gICAgICAgIHJldHVybiAoL1tcXHJcXG5dL2cpLnRlc3Qoc3RyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHN0cikge1xuICAgICAgICB2YXIgbGVuID0gc3RyLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGxlbiAmJiBlc3V0aWxzLmNvZGUuaXNMaW5lVGVybWluYXRvcihzdHIuY2hhckNvZGVBdChsZW4gLSAxKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGVlcGx5KHRhcmdldCwgb3ZlcnJpZGUpIHtcbiAgICAgICAgdmFyIGtleSwgdmFsO1xuXG4gICAgICAgIGZ1bmN0aW9uIGlzSGFzaE9iamVjdCh0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyAmJiB0YXJnZXQgaW5zdGFuY2VvZiBPYmplY3QgJiYgISh0YXJnZXQgaW5zdGFuY2VvZiBSZWdFeHApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChrZXkgaW4gb3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGlmIChvdmVycmlkZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gb3ZlcnJpZGVba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNIYXNoT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSGFzaE9iamVjdCh0YXJnZXRba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZURlZXBseSh0YXJnZXRba2V5XSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtrZXldID0gdXBkYXRlRGVlcGx5KHt9LCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVOdW1iZXIodmFsdWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCwgcG9pbnQsIHRlbXAsIGV4cG9uZW50LCBwb3M7XG5cbiAgICAgICAgaWYgKHZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOdW1lcmljIGxpdGVyYWwgd2hvc2UgdmFsdWUgaXMgTmFOJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTnVtZXJpYyBsaXRlcmFsIHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgPT09IDEgLyAwKSB7XG4gICAgICAgICAgICByZXR1cm4ganNvbiA/ICdudWxsJyA6IHJlbnVtYmVyID8gJzFlNDAwJyA6ICcxZSs0MDAnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ID0gJycgKyB2YWx1ZTtcbiAgICAgICAgaWYgKCFyZW51bWJlciB8fCByZXN1bHQubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvaW50ID0gcmVzdWx0LmluZGV4T2YoJy4nKTtcbiAgICAgICAgaWYgKCFqc29uICYmIHJlc3VsdC5jaGFyQ29kZUF0KDApID09PSAweDMwICAvKiAwICovICYmIHBvaW50ID09PSAxKSB7XG4gICAgICAgICAgICBwb2ludCA9IDA7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UoMSk7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcCA9IHJlc3VsdDtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoJ2UrJywgJ2UnKTtcbiAgICAgICAgZXhwb25lbnQgPSAwO1xuICAgICAgICBpZiAoKHBvcyA9IHRlbXAuaW5kZXhPZignZScpKSA+IDApIHtcbiAgICAgICAgICAgIGV4cG9uZW50ID0gK3RlbXAuc2xpY2UocG9zICsgMSk7XG4gICAgICAgICAgICB0ZW1wID0gdGVtcC5zbGljZSgwLCBwb3MpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwb2ludCA+PSAwKSB7XG4gICAgICAgICAgICBleHBvbmVudCAtPSB0ZW1wLmxlbmd0aCAtIHBvaW50IC0gMTtcbiAgICAgICAgICAgIHRlbXAgPSArKHRlbXAuc2xpY2UoMCwgcG9pbnQpICsgdGVtcC5zbGljZShwb2ludCArIDEpKSArICcnO1xuICAgICAgICB9XG4gICAgICAgIHBvcyA9IDA7XG4gICAgICAgIHdoaWxlICh0ZW1wLmNoYXJDb2RlQXQodGVtcC5sZW5ndGggKyBwb3MgLSAxKSA9PT0gMHgzMCAgLyogMCAqLykge1xuICAgICAgICAgICAgLS1wb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvcyAhPT0gMCkge1xuICAgICAgICAgICAgZXhwb25lbnQgLT0gcG9zO1xuICAgICAgICAgICAgdGVtcCA9IHRlbXAuc2xpY2UoMCwgcG9zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXhwb25lbnQgIT09IDApIHtcbiAgICAgICAgICAgIHRlbXAgKz0gJ2UnICsgZXhwb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0ZW1wLmxlbmd0aCA8IHJlc3VsdC5sZW5ndGggfHxcbiAgICAgICAgICAgICAgICAgICAgKGhleGFkZWNpbWFsICYmIHZhbHVlID4gMWUxMiAmJiBNYXRoLmZsb29yKHZhbHVlKSA9PT0gdmFsdWUgJiYgKHRlbXAgPSAnMHgnICsgdmFsdWUudG9TdHJpbmcoMTYpKS5sZW5ndGggPCByZXN1bHQubGVuZ3RoKSkgJiZcbiAgICAgICAgICAgICAgICArdGVtcCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRlbXA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8vIEdlbmVyYXRlIHZhbGlkIFJlZ0V4cCBleHByZXNzaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL0NvbnN0ZWxsYXRpb24vaXYgRW5naW5lXG5cbiAgICBmdW5jdGlvbiBlc2NhcGVSZWdFeHBDaGFyYWN0ZXIoY2gsIHByZXZpb3VzSXNCYWNrc2xhc2gpIHtcbiAgICAgICAgLy8gbm90IGhhbmRsaW5nICdcXCcgYW5kIGhhbmRsaW5nIFxcdTIwMjggb3IgXFx1MjAyOSB0byB1bmljb2RlIGVzY2FwZSBzZXF1ZW5jZVxuICAgICAgICBpZiAoKGNoICYgfjEpID09PSAweDIwMjgpIHtcbiAgICAgICAgICAgIHJldHVybiAocHJldmlvdXNJc0JhY2tzbGFzaCA/ICd1JyA6ICdcXFxcdScpICsgKChjaCA9PT0gMHgyMDI4KSA/ICcyMDI4JyA6ICcyMDI5Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDEwIHx8IGNoID09PSAxMykgeyAgLy8gXFxuLCBcXHJcbiAgICAgICAgICAgIHJldHVybiAocHJldmlvdXNJc0JhY2tzbGFzaCA/ICcnIDogJ1xcXFwnKSArICgoY2ggPT09IDEwKSA/ICduJyA6ICdyJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlUmVnRXhwKHJlZykge1xuICAgICAgICB2YXIgbWF0Y2gsIHJlc3VsdCwgZmxhZ3MsIGksIGl6LCBjaCwgY2hhcmFjdGVySW5CcmFjaywgcHJldmlvdXNJc0JhY2tzbGFzaDtcblxuICAgICAgICByZXN1bHQgPSByZWcudG9TdHJpbmcoKTtcblxuICAgICAgICBpZiAocmVnLnNvdXJjZSkge1xuICAgICAgICAgICAgLy8gZXh0cmFjdCBmbGFnIGZyb20gdG9TdHJpbmcgcmVzdWx0XG4gICAgICAgICAgICBtYXRjaCA9IHJlc3VsdC5tYXRjaCgvXFwvKFteL10qKSQvKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmbGFncyA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgcmVzdWx0ID0gJyc7XG5cbiAgICAgICAgICAgIGNoYXJhY3RlckluQnJhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZXZpb3VzSXNCYWNrc2xhc2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGl6ID0gcmVnLnNvdXJjZS5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICAgICAgY2ggPSByZWcuc291cmNlLmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXByZXZpb3VzSXNCYWNrc2xhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJhY3RlckluQnJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gOTMpIHsgIC8vIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJJbkJyYWNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09IDQ3KSB7ICAvLyAvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXFxcJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDkxKSB7ICAvLyBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVySW5CcmFjayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGVzY2FwZVJlZ0V4cENoYXJhY3RlcihjaCwgcHJldmlvdXNJc0JhY2tzbGFzaCk7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzSXNCYWNrc2xhc2ggPSBjaCA9PT0gOTI7ICAvLyBcXFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIG5ldyBSZWdFeHAoXCJcXFxcXFxuJykgaXMgcHJvdmlkZWQsIGNyZWF0ZSAvXFxuL1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gZXNjYXBlUmVnRXhwQ2hhcmFjdGVyKGNoLCBwcmV2aW91c0lzQmFja3NsYXNoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJldmVudCBsaWtlIC9cXFxcWy9dL1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c0lzQmFja3NsYXNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJy8nICsgcmVzdWx0ICsgJy8nICsgZmxhZ3M7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVzY2FwZUFsbG93ZWRDaGFyYWN0ZXIoY29kZSwgbmV4dCkge1xuICAgICAgICB2YXIgaGV4LCByZXN1bHQgPSAnXFxcXCc7XG5cbiAgICAgICAgc3dpdGNoIChjb2RlKSB7XG4gICAgICAgIGNhc2UgMHgwOCAgLyogXFxiICovOlxuICAgICAgICAgICAgcmVzdWx0ICs9ICdiJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4MEMgIC8qIFxcZiAqLzpcbiAgICAgICAgICAgIHJlc3VsdCArPSAnZic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDA5ICAvKiBcXHQgKi86XG4gICAgICAgICAgICByZXN1bHQgKz0gJ3QnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBoZXggPSBjb2RlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGpzb24gfHwgY29kZSA+IDB4RkYpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3UnICsgJzAwMDAnLnNsaWNlKGhleC5sZW5ndGgpICsgaGV4O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAweDAwMDAgJiYgIWVzdXRpbHMuY29kZS5pc0RlY2ltYWxEaWdpdChuZXh0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnMCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4MDAwQiAgLyogXFx2ICovKSB7IC8vICdcXHYnXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd4MEInO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3gnICsgJzAwJy5zbGljZShoZXgubGVuZ3RoKSArIGhleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlc2NhcGVEaXNhbGxvd2VkQ2hhcmFjdGVyKGNvZGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9ICdcXFxcJztcbiAgICAgICAgc3dpdGNoIChjb2RlKSB7XG4gICAgICAgIGNhc2UgMHg1QyAgLyogXFwgKi86XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMHgwQSAgLyogXFxuICovOlxuICAgICAgICAgICAgcmVzdWx0ICs9ICduJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4MEQgIC8qIFxcciAqLzpcbiAgICAgICAgICAgIHJlc3VsdCArPSAncic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDIwMjg6XG4gICAgICAgICAgICByZXN1bHQgKz0gJ3UyMDI4JztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4MjAyOTpcbiAgICAgICAgICAgIHJlc3VsdCArPSAndTIwMjknO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdGx5IGNsYXNzaWZpZWQgY2hhcmFjdGVyJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVzY2FwZURpcmVjdGl2ZShzdHIpIHtcbiAgICAgICAgdmFyIGksIGl6LCBjb2RlLCBxdW90ZTtcblxuICAgICAgICBxdW90ZSA9IHF1b3RlcyA9PT0gJ2RvdWJsZScgPyAnXCInIDogJ1xcJyc7XG4gICAgICAgIGZvciAoaSA9IDAsIGl6ID0gc3RyLmxlbmd0aDsgaSA8IGl6OyArK2kpIHtcbiAgICAgICAgICAgIGNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgIGlmIChjb2RlID09PSAweDI3ICAvKiAnICovKSB7XG4gICAgICAgICAgICAgICAgcXVvdGUgPSAnXCInO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAweDIyICAvKiBcIiAqLykge1xuICAgICAgICAgICAgICAgIHF1b3RlID0gJ1xcJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4NUMgIC8qIFxcICovKSB7XG4gICAgICAgICAgICAgICAgKytpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHF1b3RlICsgc3RyICsgcXVvdGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXNjYXBlU3RyaW5nKHN0cikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gJycsIGksIGxlbiwgY29kZSwgc2luZ2xlUXVvdGVzID0gMCwgZG91YmxlUXVvdGVzID0gMCwgc2luZ2xlLCBxdW90ZTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgIGNvZGUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgICAgIGlmIChjb2RlID09PSAweDI3ICAvKiAnICovKSB7XG4gICAgICAgICAgICAgICAgKytzaW5nbGVRdW90ZXM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4MjIgIC8qIFwiICovKSB7XG4gICAgICAgICAgICAgICAgKytkb3VibGVRdW90ZXM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4MkYgIC8qIC8gKi8gJiYganNvbikge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnXFxcXCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVzdXRpbHMuY29kZS5pc0xpbmVUZXJtaW5hdG9yKGNvZGUpIHx8IGNvZGUgPT09IDB4NUMgIC8qIFxcICovKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IGVzY2FwZURpc2FsbG93ZWRDaGFyYWN0ZXIoY29kZSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChqc29uICYmIGNvZGUgPCAweDIwICAvKiBTUCAqLykgfHwgIShqc29uIHx8IGVzY2FwZWxlc3MgfHwgKGNvZGUgPj0gMHgyMCAgLyogU1AgKi8gJiYgY29kZSA8PSAweDdFICAvKiB+ICovKSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gZXNjYXBlQWxsb3dlZENoYXJhY3Rlcihjb2RlLCBzdHIuY2hhckNvZGVBdChpICsgMSkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzaW5nbGUgPSAhKHF1b3RlcyA9PT0gJ2RvdWJsZScgfHwgKHF1b3RlcyA9PT0gJ2F1dG8nICYmIGRvdWJsZVF1b3RlcyA8IHNpbmdsZVF1b3RlcykpO1xuICAgICAgICBxdW90ZSA9IHNpbmdsZSA/ICdcXCcnIDogJ1wiJztcblxuICAgICAgICBpZiAoIShzaW5nbGUgPyBzaW5nbGVRdW90ZXMgOiBkb3VibGVRdW90ZXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gcXVvdGUgKyByZXN1bHQgKyBxdW90ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ciA9IHJlc3VsdDtcbiAgICAgICAgcmVzdWx0ID0gcXVvdGU7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBpZiAoKGNvZGUgPT09IDB4MjcgIC8qICcgKi8gJiYgc2luZ2xlKSB8fCAoY29kZSA9PT0gMHgyMiAgLyogXCIgKi8gJiYgIXNpbmdsZSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0ICsgcXVvdGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZmxhdHRlbiBhbiBhcnJheSB0byBhIHN0cmluZywgd2hlcmUgdGhlIGFycmF5IGNhbiBjb250YWluXG4gICAgICogZWl0aGVyIHN0cmluZ3Mgb3IgbmVzdGVkIGFycmF5c1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZsYXR0ZW5Ub1N0cmluZyhhcnIpIHtcbiAgICAgICAgdmFyIGksIGl6LCBlbGVtLCByZXN1bHQgPSAnJztcbiAgICAgICAgZm9yIChpID0gMCwgaXogPSBhcnIubGVuZ3RoOyBpIDwgaXo7ICsraSkge1xuICAgICAgICAgICAgZWxlbSA9IGFycltpXTtcbiAgICAgICAgICAgIHJlc3VsdCArPSBpc0FycmF5KGVsZW0pID8gZmxhdHRlblRvU3RyaW5nKGVsZW0pIDogZWxlbTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNvbnZlcnQgZ2VuZXJhdGVkIHRvIGEgU291cmNlTm9kZSB3aGVuIHNvdXJjZSBtYXBzIGFyZSBlbmFibGVkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvU291cmNlTm9kZVdoZW5OZWVkZWQoZ2VuZXJhdGVkLCBub2RlKSB7XG4gICAgICAgIGlmICghc291cmNlTWFwKSB7XG4gICAgICAgICAgICAvLyB3aXRoIG5vIHNvdXJjZSBtYXBzLCBnZW5lcmF0ZWQgaXMgZWl0aGVyIGFuXG4gICAgICAgICAgICAvLyBhcnJheSBvciBhIHN0cmluZy4gIGlmIGFuIGFycmF5LCBmbGF0dGVuIGl0LlxuICAgICAgICAgICAgLy8gaWYgYSBzdHJpbmcsIGp1c3QgcmV0dXJuIGl0XG4gICAgICAgICAgICBpZiAoaXNBcnJheShnZW5lcmF0ZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZsYXR0ZW5Ub1N0cmluZyhnZW5lcmF0ZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VuZXJhdGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0ZWQgaW5zdGFuY2VvZiBTb3VyY2VOb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLmxvYyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFNvdXJjZU5vZGUobnVsbCwgbnVsbCwgc291cmNlTWFwLCBnZW5lcmF0ZWQsIG5vZGUubmFtZSB8fCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFNvdXJjZU5vZGUobm9kZS5sb2Muc3RhcnQubGluZSwgbm9kZS5sb2Muc3RhcnQuY29sdW1uLCAoc291cmNlTWFwID09PSB0cnVlID8gbm9kZS5sb2Muc291cmNlIHx8IG51bGwgOiBzb3VyY2VNYXApLCBnZW5lcmF0ZWQsIG5vZGUubmFtZSB8fCBudWxsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub0VtcHR5U3BhY2UoKSB7XG4gICAgICAgIHJldHVybiAoc3BhY2UpID8gc3BhY2UgOiAnICc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gam9pbihsZWZ0LCByaWdodCkge1xuICAgICAgICB2YXIgbGVmdFNvdXJjZSA9IHRvU291cmNlTm9kZVdoZW5OZWVkZWQobGVmdCkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIHJpZ2h0U291cmNlID0gdG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyaWdodCkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGxlZnRDaGFyQ29kZSA9IGxlZnRTb3VyY2UuY2hhckNvZGVBdChsZWZ0U291cmNlLmxlbmd0aCAtIDEpLFxuICAgICAgICAgICAgcmlnaHRDaGFyQ29kZSA9IHJpZ2h0U291cmNlLmNoYXJDb2RlQXQoMCk7XG5cbiAgICAgICAgaWYgKChsZWZ0Q2hhckNvZGUgPT09IDB4MkIgIC8qICsgKi8gfHwgbGVmdENoYXJDb2RlID09PSAweDJEICAvKiAtICovKSAmJiBsZWZ0Q2hhckNvZGUgPT09IHJpZ2h0Q2hhckNvZGUgfHxcbiAgICAgICAgZXN1dGlscy5jb2RlLmlzSWRlbnRpZmllclBhcnQobGVmdENoYXJDb2RlKSAmJiBlc3V0aWxzLmNvZGUuaXNJZGVudGlmaWVyUGFydChyaWdodENoYXJDb2RlKSB8fFxuICAgICAgICBsZWZ0Q2hhckNvZGUgPT09IDB4MkYgIC8qIC8gKi8gJiYgcmlnaHRDaGFyQ29kZSA9PT0gMHg2OSAgLyogaSAqLykgeyAvLyBpbmZpeCB3b3JkIG9wZXJhdG9ycyBhbGwgc3RhcnQgd2l0aCBgaWBcbiAgICAgICAgICAgIHJldHVybiBbbGVmdCwgbm9FbXB0eVNwYWNlKCksIHJpZ2h0XTtcbiAgICAgICAgfSBlbHNlIGlmIChlc3V0aWxzLmNvZGUuaXNXaGl0ZVNwYWNlKGxlZnRDaGFyQ29kZSkgfHwgZXN1dGlscy5jb2RlLmlzTGluZVRlcm1pbmF0b3IobGVmdENoYXJDb2RlKSB8fFxuICAgICAgICAgICAgICAgIGVzdXRpbHMuY29kZS5pc1doaXRlU3BhY2UocmlnaHRDaGFyQ29kZSkgfHwgZXN1dGlscy5jb2RlLmlzTGluZVRlcm1pbmF0b3IocmlnaHRDaGFyQ29kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBbbGVmdCwgcmlnaHRdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbbGVmdCwgc3BhY2UsIHJpZ2h0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRJbmRlbnQoc3RtdCkge1xuICAgICAgICByZXR1cm4gW2Jhc2UsIHN0bXRdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdpdGhJbmRlbnQoZm4pIHtcbiAgICAgICAgdmFyIHByZXZpb3VzQmFzZSwgcmVzdWx0O1xuICAgICAgICBwcmV2aW91c0Jhc2UgPSBiYXNlO1xuICAgICAgICBiYXNlICs9IGluZGVudDtcbiAgICAgICAgcmVzdWx0ID0gZm4uY2FsbCh0aGlzLCBiYXNlKTtcbiAgICAgICAgYmFzZSA9IHByZXZpb3VzQmFzZTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVTcGFjZXMoc3RyKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgPSBzdHIubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmIChlc3V0aWxzLmNvZGUuaXNMaW5lVGVybWluYXRvcihzdHIuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHN0ci5sZW5ndGggLSAxKSAtIGk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRqdXN0TXVsdGlsaW5lQ29tbWVudCh2YWx1ZSwgc3BlY2lhbEJhc2UpIHtcbiAgICAgICAgdmFyIGFycmF5LCBpLCBsZW4sIGxpbmUsIGosIHNwYWNlcywgcHJldmlvdXNCYXNlLCBzbjtcblxuICAgICAgICBhcnJheSA9IHZhbHVlLnNwbGl0KC9cXHJcXG58W1xcclxcbl0vKTtcbiAgICAgICAgc3BhY2VzID0gTnVtYmVyLk1BWF9WQUxVRTtcblxuICAgICAgICAvLyBmaXJzdCBsaW5lIGRvZXNuJ3QgaGF2ZSBpbmRlbnRhdGlvblxuICAgICAgICBmb3IgKGkgPSAxLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgbGluZSA9IGFycmF5W2ldO1xuICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaiA8IGxpbmUubGVuZ3RoICYmIGVzdXRpbHMuY29kZS5pc1doaXRlU3BhY2UobGluZS5jaGFyQ29kZUF0KGopKSkge1xuICAgICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzcGFjZXMgPiBqKSB7XG4gICAgICAgICAgICAgICAgc3BhY2VzID0gajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc3BlY2lhbEJhc2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAvLyBwYXR0ZXJuIGxpa2VcbiAgICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgIC8vICAgdmFyIHQgPSAyMDsgIC8qXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgKiB0aGlzIGlzIGNvbW1lbnRcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgcHJldmlvdXNCYXNlID0gYmFzZTtcbiAgICAgICAgICAgIGlmIChhcnJheVsxXVtzcGFjZXNdID09PSAnKicpIHtcbiAgICAgICAgICAgICAgICBzcGVjaWFsQmFzZSArPSAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiYXNlID0gc3BlY2lhbEJhc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3BhY2VzICYgMSkge1xuICAgICAgICAgICAgICAgIC8vIC8qXG4gICAgICAgICAgICAgICAgLy8gICpcbiAgICAgICAgICAgICAgICAvLyAgKi9cbiAgICAgICAgICAgICAgICAvLyBJZiBzcGFjZXMgYXJlIG9kZCBudW1iZXIsIGFib3ZlIHBhdHRlcm4gaXMgY29uc2lkZXJlZC5cbiAgICAgICAgICAgICAgICAvLyBXZSB3YXN0ZSAxIHNwYWNlLlxuICAgICAgICAgICAgICAgIC0tc3BhY2VzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldmlvdXNCYXNlID0gYmFzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDEsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICBzbiA9IHRvU291cmNlTm9kZVdoZW5OZWVkZWQoYWRkSW5kZW50KGFycmF5W2ldLnNsaWNlKHNwYWNlcykpKTtcbiAgICAgICAgICAgIGFycmF5W2ldID0gc291cmNlTWFwID8gc24uam9pbignJykgOiBzbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJhc2UgPSBwcmV2aW91c0Jhc2U7XG5cbiAgICAgICAgcmV0dXJuIGFycmF5LmpvaW4oJ1xcbicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlQ29tbWVudChjb21tZW50LCBzcGVjaWFsQmFzZSkge1xuICAgICAgICBpZiAoY29tbWVudC50eXBlID09PSAnTGluZScpIHtcbiAgICAgICAgICAgIGlmIChlbmRzV2l0aExpbmVUZXJtaW5hdG9yKGNvbW1lbnQudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcvLycgKyBjb21tZW50LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBbHdheXMgdXNlIExpbmVUZXJtaW5hdG9yXG4gICAgICAgICAgICAgICAgcmV0dXJuICcvLycgKyBjb21tZW50LnZhbHVlICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4dHJhLmZvcm1hdC5pbmRlbnQuYWRqdXN0TXVsdGlsaW5lQ29tbWVudCAmJiAvW1xcblxccl0vLnRlc3QoY29tbWVudC52YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGp1c3RNdWx0aWxpbmVDb21tZW50KCcvKicgKyBjb21tZW50LnZhbHVlICsgJyovJywgc3BlY2lhbEJhc2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnLyonICsgY29tbWVudC52YWx1ZSArICcqLyc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudHMoc3RtdCwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBpLCBsZW4sIGNvbW1lbnQsIHNhdmUsIHRhaWxpbmdUb1N0YXRlbWVudCwgc3BlY2lhbEJhc2UsIGZyYWdtZW50O1xuXG4gICAgICAgIGlmIChzdG10LmxlYWRpbmdDb21tZW50cyAmJiBzdG10LmxlYWRpbmdDb21tZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzYXZlID0gcmVzdWx0O1xuXG4gICAgICAgICAgICBjb21tZW50ID0gc3RtdC5sZWFkaW5nQ29tbWVudHNbMF07XG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGlmIChzYWZlQ29uY2F0ZW5hdGlvbiAmJiBzdG10LnR5cGUgPT09IFN5bnRheC5Qcm9ncmFtICYmIHN0bXQuYm9keS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnXFxuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZUNvbW1lbnQoY29tbWVudCkpO1xuICAgICAgICAgICAgaWYgKCFlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHRvU291cmNlTm9kZVdoZW5OZWVkZWQocmVzdWx0KS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCdcXG4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMSwgbGVuID0gc3RtdC5sZWFkaW5nQ29tbWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb21tZW50ID0gc3RtdC5sZWFkaW5nQ29tbWVudHNbaV07XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBbZ2VuZXJhdGVDb21tZW50KGNvbW1lbnQpXTtcbiAgICAgICAgICAgICAgICBpZiAoIWVuZHNXaXRoTGluZVRlcm1pbmF0b3IodG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChmcmFnbWVudCkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQucHVzaCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFkZEluZGVudChmcmFnbWVudCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQucHVzaChhZGRJbmRlbnQoc2F2ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0bXQudHJhaWxpbmdDb21tZW50cykge1xuICAgICAgICAgICAgdGFpbGluZ1RvU3RhdGVtZW50ID0gIWVuZHNXaXRoTGluZVRlcm1pbmF0b3IodG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgc3BlY2lhbEJhc2UgPSBzdHJpbmdSZXBlYXQoJyAnLCBjYWxjdWxhdGVTcGFjZXModG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChbYmFzZSwgcmVzdWx0LCBpbmRlbnRdKS50b1N0cmluZygpKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdG10LnRyYWlsaW5nQ29tbWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjb21tZW50ID0gc3RtdC50cmFpbGluZ0NvbW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0YWlsaW5nVG9TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgYXNzdW1lIHRhcmdldCBsaWtlIGZvbGxvd2luZyBzY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIHQgPSAyMDsgIC8qKlxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICogVGhpcyBpcyBjb21tZW50IG9mIHRcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3QgY2FzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gW3Jlc3VsdCwgaW5kZW50XTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtyZXN1bHQsIHNwZWNpYWxCYXNlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZUNvbW1lbnQoY29tbWVudCwgc3BlY2lhbEJhc2UpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbcmVzdWx0LCBhZGRJbmRlbnQoZ2VuZXJhdGVDb21tZW50KGNvbW1lbnQpKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpICE9PSBsZW4gLSAxICYmICFlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHRvU291cmNlTm9kZVdoZW5OZWVkZWQocmVzdWx0KS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbcmVzdWx0LCAnXFxuJ107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJlbnRoZXNpemUodGV4dCwgY3VycmVudCwgc2hvdWxkKSB7XG4gICAgICAgIGlmIChjdXJyZW50IDwgc2hvdWxkKSB7XG4gICAgICAgICAgICByZXR1cm4gWycoJywgdGV4dCwgJyknXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXliZUJsb2NrKHN0bXQsIHNlbWljb2xvbk9wdGlvbmFsLCBmdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgdmFyIHJlc3VsdCwgbm9MZWFkaW5nQ29tbWVudDtcblxuICAgICAgICBub0xlYWRpbmdDb21tZW50ID0gIWV4dHJhLmNvbW1lbnQgfHwgIXN0bXQubGVhZGluZ0NvbW1lbnRzO1xuXG4gICAgICAgIGlmIChzdG10LnR5cGUgPT09IFN5bnRheC5CbG9ja1N0YXRlbWVudCAmJiBub0xlYWRpbmdDb21tZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gW3NwYWNlLCBnZW5lcmF0ZVN0YXRlbWVudChzdG10LCB7IGZ1bmN0aW9uQm9keTogZnVuY3Rpb25Cb2R5IH0pXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdG10LnR5cGUgPT09IFN5bnRheC5FbXB0eVN0YXRlbWVudCAmJiBub0xlYWRpbmdDb21tZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gJzsnO1xuICAgICAgICB9XG5cbiAgICAgICAgd2l0aEluZGVudChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBbbmV3bGluZSwgYWRkSW5kZW50KGdlbmVyYXRlU3RhdGVtZW50KHN0bXQsIHsgc2VtaWNvbG9uT3B0aW9uYWw6IHNlbWljb2xvbk9wdGlvbmFsLCBmdW5jdGlvbkJvZHk6IGZ1bmN0aW9uQm9keSB9KSldO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1heWJlQmxvY2tTdWZmaXgoc3RtdCwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBlbmRzID0gZW5kc1dpdGhMaW5lVGVybWluYXRvcih0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKHJlc3VsdCkudG9TdHJpbmcoKSk7XG4gICAgICAgIGlmIChzdG10LnR5cGUgPT09IFN5bnRheC5CbG9ja1N0YXRlbWVudCAmJiAoIWV4dHJhLmNvbW1lbnQgfHwgIXN0bXQubGVhZGluZ0NvbW1lbnRzKSAmJiAhZW5kcykge1xuICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHQsIHNwYWNlXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kcykge1xuICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHQsIGJhc2VdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbcmVzdWx0LCBuZXdsaW5lLCBiYXNlXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZVZlcmJhdGltU3RyaW5nKHN0cmluZykge1xuICAgICAgICB2YXIgaSwgaXosIHJlc3VsdDtcbiAgICAgICAgcmVzdWx0ID0gc3RyaW5nLnNwbGl0KC9cXHJcXG58XFxuLyk7XG4gICAgICAgIGZvciAoaSA9IDEsIGl6ID0gcmVzdWx0Lmxlbmd0aDsgaSA8IGl6OyBpKyspIHtcbiAgICAgICAgICAgIHJlc3VsdFtpXSA9IG5ld2xpbmUgKyBiYXNlICsgcmVzdWx0W2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVWZXJiYXRpbShleHByLCBvcHRpb24pIHtcbiAgICAgICAgdmFyIHZlcmJhdGltLCByZXN1bHQsIHByZWM7XG4gICAgICAgIHZlcmJhdGltID0gZXhwcltleHRyYS52ZXJiYXRpbV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2ZXJiYXRpbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudGhlc2l6ZShnZW5lcmF0ZVZlcmJhdGltU3RyaW5nKHZlcmJhdGltKSwgUHJlY2VkZW5jZS5TZXF1ZW5jZSwgb3B0aW9uLnByZWNlZGVuY2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdmVyYmF0aW0gaXMgb2JqZWN0XG4gICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0ZVZlcmJhdGltU3RyaW5nKHZlcmJhdGltLmNvbnRlbnQpO1xuICAgICAgICAgICAgcHJlYyA9ICh2ZXJiYXRpbS5wcmVjZWRlbmNlICE9IG51bGwpID8gdmVyYmF0aW0ucHJlY2VkZW5jZSA6IFByZWNlZGVuY2UuU2VxdWVuY2U7XG4gICAgICAgICAgICByZXN1bHQgPSBwYXJlbnRoZXNpemUocmVzdWx0LCBwcmVjLCBvcHRpb24ucHJlY2VkZW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQsIGV4cHIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlSWRlbnRpZmllcihub2RlKSB7XG4gICAgICAgIHJldHVybiB0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKG5vZGUubmFtZSwgbm9kZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVQYXR0ZXJuKG5vZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICBpZiAobm9kZS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdGVFeHByZXNzaW9uKG5vZGUsIHtcbiAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBvcHRpb25zLnByZWNlZGVuY2UsXG4gICAgICAgICAgICAgICAgYWxsb3dJbjogb3B0aW9ucy5hbGxvd0luLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlRnVuY3Rpb25Cb2R5KG5vZGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCwgaSwgbGVuLCBleHByLCBhcnJvdztcblxuICAgICAgICBhcnJvdyA9IG5vZGUudHlwZSA9PT0gU3ludGF4LkFycm93RnVuY3Rpb25FeHByZXNzaW9uO1xuXG4gICAgICAgIGlmIChhcnJvdyAmJiBub2RlLnBhcmFtcy5sZW5ndGggPT09IDEgJiYgbm9kZS5wYXJhbXNbMF0udHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIC8vIGFyZyA9PiB7IH0gY2FzZVxuICAgICAgICAgICAgcmVzdWx0ID0gW2dlbmVyYXRlSWRlbnRpZmllcihub2RlLnBhcmFtc1swXSldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gWycoJ107XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBub2RlLnBhcmFtcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlUGF0dGVybihub2RlLnBhcmFtc1tpXSwge1xuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWVcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgaWYgKGkgKyAxIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcsJyArIHNwYWNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaCgnKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFycm93KSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChzcGFjZSk7XG4gICAgICAgICAgICByZXN1bHQucHVzaCgnPT4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLmV4cHJlc3Npb24pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNwYWNlKTtcbiAgICAgICAgICAgIGV4cHIgPSBnZW5lcmF0ZUV4cHJlc3Npb24obm9kZS5ib2R5LCB7XG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5Bc3NpZ25tZW50LFxuICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChleHByLnRvU3RyaW5nKCkuY2hhckF0KDApID09PSAneycpIHtcbiAgICAgICAgICAgICAgICBleHByID0gWycoJywgZXhwciwgJyknXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGV4cHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobWF5YmVCbG9jayhub2RlLmJvZHksIGZhbHNlLCB0cnVlKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUl0ZXJhdGlvbkZvclN0YXRlbWVudChvcGVyYXRvciwgc3RtdCwgc2VtaWNvbG9uSXNOb3ROZWVkZWQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFsnZm9yJyArIHNwYWNlICsgJygnXTtcbiAgICAgICAgd2l0aEluZGVudChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoc3RtdC5sZWZ0LnR5cGUgPT09IFN5bnRheC5WYXJpYWJsZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgd2l0aEluZGVudChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHN0bXQubGVmdC5raW5kICsgbm9FbXB0eVNwYWNlKCkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZVN0YXRlbWVudChzdG10LmxlZnQuZGVjbGFyYXRpb25zWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LmxlZnQsIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5DYWxsLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBvcGVyYXRvcik7XG4gICAgICAgICAgICByZXN1bHQgPSBbam9pbihcbiAgICAgICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKHN0bXQucmlnaHQsIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICksICcpJ107XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQucHVzaChtYXliZUJsb2NrKHN0bXQuYm9keSwgc2VtaWNvbG9uSXNOb3ROZWVkZWQpKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwciwgb3B0aW9uKSB7XG4gICAgICAgIHZhciByZXN1bHQsXG4gICAgICAgICAgICBwcmVjZWRlbmNlLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGN1cnJlbnRQcmVjZWRlbmNlLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIHJhdyxcbiAgICAgICAgICAgIGZyYWdtZW50LFxuICAgICAgICAgICAgbXVsdGlsaW5lLFxuICAgICAgICAgICAgbGVmdENoYXJDb2RlLFxuICAgICAgICAgICAgbGVmdFNvdXJjZSxcbiAgICAgICAgICAgIHJpZ2h0Q2hhckNvZGUsXG4gICAgICAgICAgICBhbGxvd0luLFxuICAgICAgICAgICAgYWxsb3dDYWxsLFxuICAgICAgICAgICAgYWxsb3dVbnBhcmVudGhlc2l6ZWROZXcsXG4gICAgICAgICAgICBwcm9wZXJ0eSxcbiAgICAgICAgICAgIGlzR2VuZXJhdG9yO1xuXG4gICAgICAgIHByZWNlZGVuY2UgPSBvcHRpb24ucHJlY2VkZW5jZTtcbiAgICAgICAgYWxsb3dJbiA9IG9wdGlvbi5hbGxvd0luO1xuICAgICAgICBhbGxvd0NhbGwgPSBvcHRpb24uYWxsb3dDYWxsO1xuICAgICAgICB0eXBlID0gZXhwci50eXBlIHx8IG9wdGlvbi50eXBlO1xuXG4gICAgICAgIGlmIChleHRyYS52ZXJiYXRpbSAmJiBleHByLmhhc093blByb3BlcnR5KGV4dHJhLnZlcmJhdGltKSkge1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlVmVyYmF0aW0oZXhwciwgb3B0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFN5bnRheC5TZXF1ZW5jZUV4cHJlc3Npb246XG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGFsbG93SW4gfD0gKFByZWNlZGVuY2UuU2VxdWVuY2UgPCBwcmVjZWRlbmNlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGV4cHIuZXhwcmVzc2lvbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5leHByZXNzaW9uc1tpXSwge1xuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW4sXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBpZiAoaSArIDEgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudGhlc2l6ZShyZXN1bHQsIFByZWNlZGVuY2UuU2VxdWVuY2UsIHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguQXNzaWdubWVudEV4cHJlc3Npb246XG4gICAgICAgICAgICBhbGxvd0luIHw9IChQcmVjZWRlbmNlLkFzc2lnbm1lbnQgPCBwcmVjZWRlbmNlKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudGhlc2l6ZShcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlRXhwcmVzc2lvbihleHByLmxlZnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQ2FsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlICsgZXhwci5vcGVyYXRvciArIHNwYWNlLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5yaWdodCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5Bc3NpZ25tZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogYWxsb3dJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LFxuICAgICAgICAgICAgICAgIHByZWNlZGVuY2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5BcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbjpcbiAgICAgICAgICAgIGFsbG93SW4gfD0gKFByZWNlZGVuY2UuQXJyb3dGdW5jdGlvbiA8IHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKGdlbmVyYXRlRnVuY3Rpb25Cb2R5KGV4cHIpLCBQcmVjZWRlbmNlLkFycm93RnVuY3Rpb24sIHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguQ29uZGl0aW9uYWxFeHByZXNzaW9uOlxuICAgICAgICAgICAgYWxsb3dJbiB8PSAoUHJlY2VkZW5jZS5Db25kaXRpb25hbCA8IHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIudGVzdCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZSArICc/JyArIHNwYWNlLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5jb25zZXF1ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZSArICc6JyArIHNwYWNlLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5hbHRlcm5hdGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQXNzaWdubWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFByZWNlZGVuY2UuQ29uZGl0aW9uYWwsXG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkxvZ2ljYWxFeHByZXNzaW9uOlxuICAgICAgICBjYXNlIFN5bnRheC5CaW5hcnlFeHByZXNzaW9uOlxuICAgICAgICAgICAgY3VycmVudFByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW2V4cHIub3BlcmF0b3JdO1xuXG4gICAgICAgICAgICBhbGxvd0luIHw9IChjdXJyZW50UHJlY2VkZW5jZSA8IHByZWNlZGVuY2UpO1xuXG4gICAgICAgICAgICBmcmFnbWVudCA9IGdlbmVyYXRlRXhwcmVzc2lvbihleHByLmxlZnQsIHtcbiAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBjdXJyZW50UHJlY2VkZW5jZSxcbiAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxlZnRTb3VyY2UgPSBmcmFnbWVudC50b1N0cmluZygpO1xuXG4gICAgICAgICAgICBpZiAobGVmdFNvdXJjZS5jaGFyQ29kZUF0KGxlZnRTb3VyY2UubGVuZ3RoIC0gMSkgPT09IDB4MkYgLyogLyAqLyAmJiBlc3V0aWxzLmNvZGUuaXNJZGVudGlmaWVyUGFydChleHByLm9wZXJhdG9yLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW2ZyYWdtZW50LCBub0VtcHR5U3BhY2UoKSwgZXhwci5vcGVyYXRvcl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4oZnJhZ21lbnQsIGV4cHIub3BlcmF0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcmFnbWVudCA9IGdlbmVyYXRlRXhwcmVzc2lvbihleHByLnJpZ2h0LCB7XG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogY3VycmVudFByZWNlZGVuY2UgKyAxLFxuICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW4sXG4gICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGV4cHIub3BlcmF0b3IgPT09ICcvJyAmJiBmcmFnbWVudC50b1N0cmluZygpLmNoYXJBdCgwKSA9PT0gJy8nIHx8XG4gICAgICAgICAgICBleHByLm9wZXJhdG9yLnNsaWNlKC0xKSA9PT0gJzwnICYmIGZyYWdtZW50LnRvU3RyaW5nKCkuc2xpY2UoMCwgMykgPT09ICchLS0nKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgJy8nIGNvbmNhdHMgd2l0aCAnLycgb3IgYDxgIGNvbmNhdHMgd2l0aCBgIS0tYCwgaXQgaXMgaW50ZXJwcmV0ZWQgYXMgY29tbWVudCBzdGFydFxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vRW1wdHlTcGFjZSgpKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChmcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBmcmFnbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleHByLm9wZXJhdG9yID09PSAnaW4nICYmICFhbGxvd0luKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gWycoJywgcmVzdWx0LCAnKSddO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBwYXJlbnRoZXNpemUocmVzdWx0LCBjdXJyZW50UHJlY2VkZW5jZSwgcHJlY2VkZW5jZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkNhbGxFeHByZXNzaW9uOlxuICAgICAgICAgICAgcmVzdWx0ID0gW2dlbmVyYXRlRXhwcmVzc2lvbihleHByLmNhbGxlZSwge1xuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQ2FsbCxcbiAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhbGxvd1VucGFyZW50aGVzaXplZE5ldzogZmFsc2VcbiAgICAgICAgICAgIH0pXTtcblxuICAgICAgICAgICAgcmVzdWx0LnB1c2goJygnKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGV4cHJbJ2FyZ3VtZW50cyddLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHJbJ2FyZ3VtZW50cyddW2ldLCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQXNzaWdubWVudCxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGlmIChpICsgMSA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnLCcgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goJyknKTtcblxuICAgICAgICAgICAgaWYgKCFhbGxvd0NhbGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbJygnLCByZXN1bHQsICcpJ107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudGhlc2l6ZShyZXN1bHQsIFByZWNlZGVuY2UuQ2FsbCwgcHJlY2VkZW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5OZXdFeHByZXNzaW9uOlxuICAgICAgICAgICAgbGVuID0gZXhwclsnYXJndW1lbnRzJ10ubGVuZ3RoO1xuICAgICAgICAgICAgYWxsb3dVbnBhcmVudGhlc2l6ZWROZXcgPSBvcHRpb24uYWxsb3dVbnBhcmVudGhlc2l6ZWROZXcgPT09IHVuZGVmaW5lZCB8fCBvcHRpb24uYWxsb3dVbnBhcmVudGhlc2l6ZWROZXc7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4oXG4gICAgICAgICAgICAgICAgJ25ldycsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIuY2FsbGVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuTmV3LFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd1VucGFyZW50aGVzaXplZE5ldzogYWxsb3dVbnBhcmVudGhlc2l6ZWROZXcgJiYgIXBhcmVudGhlc2VzICYmIGxlbiA9PT0gMFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAoIWFsbG93VW5wYXJlbnRoZXNpemVkTmV3IHx8IHBhcmVudGhlc2VzIHx8IGxlbiA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnKCcpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZUV4cHJlc3Npb24oZXhwclsnYXJndW1lbnRzJ11baV0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQXNzaWdubWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSArIDEgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcsJyArIHNwYWNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnKScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQgPSBwYXJlbnRoZXNpemUocmVzdWx0LCBQcmVjZWRlbmNlLk5ldywgcHJlY2VkZW5jZSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5NZW1iZXJFeHByZXNzaW9uOlxuICAgICAgICAgICAgcmVzdWx0ID0gW2dlbmVyYXRlRXhwcmVzc2lvbihleHByLm9iamVjdCwge1xuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQ2FsbCxcbiAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogYWxsb3dDYWxsLFxuICAgICAgICAgICAgICAgIGFsbG93VW5wYXJlbnRoZXNpemVkTmV3OiBmYWxzZVxuICAgICAgICAgICAgfSldO1xuXG4gICAgICAgICAgICBpZiAoZXhwci5jb21wdXRlZCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCdbJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIucHJvcGVydHksIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiBhbGxvd0NhbGxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJ10nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4cHIub2JqZWN0LnR5cGUgPT09IFN5bnRheC5MaXRlcmFsICYmIHR5cGVvZiBleHByLm9iamVjdC52YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSB0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKHJlc3VsdCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIGFsbCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAvLyAgIDEuIE5vIGZsb2F0aW5nIHBvaW50XG4gICAgICAgICAgICAgICAgICAgIC8vICAgMi4gRG9uJ3QgaGF2ZSBleHBvbmVudHNcbiAgICAgICAgICAgICAgICAgICAgLy8gICAzLiBUaGUgbGFzdCBjaGFyYWN0ZXIgaXMgYSBkZWNpbWFsIGRpZ2l0XG4gICAgICAgICAgICAgICAgICAgIC8vICAgNC4gTm90IGhleGFkZWNpbWFsIE9SIG9jdGFsIG51bWJlciBsaXRlcmFsXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIHNob3VsZCBhZGQgYSBmbG9hdGluZyBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LmluZGV4T2YoJy4nKSA8IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhL1tlRXhYXS8udGVzdChmcmFnbWVudCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc3V0aWxzLmNvZGUuaXNEZWNpbWFsRGlnaXQoZnJhZ21lbnQuY2hhckNvZGVBdChmcmFnbWVudC5sZW5ndGggLSAxKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAhKGZyYWdtZW50Lmxlbmd0aCA+PSAyICYmIGZyYWdtZW50LmNoYXJDb2RlQXQoMCkgPT09IDQ4KSAgLy8gJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcuJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVJZGVudGlmaWVyKGV4cHIucHJvcGVydHkpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKHJlc3VsdCwgUHJlY2VkZW5jZS5NZW1iZXIsIHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguVW5hcnlFeHByZXNzaW9uOlxuICAgICAgICAgICAgZnJhZ21lbnQgPSBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5hcmd1bWVudCwge1xuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuVW5hcnksXG4gICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc3BhY2UgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gam9pbihleHByLm9wZXJhdG9yLCBmcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtleHByLm9wZXJhdG9yXTtcbiAgICAgICAgICAgICAgICBpZiAoZXhwci5vcGVyYXRvci5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRlbGV0ZSwgdm9pZCwgdHlwZW9mXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCBgdHlwZW9mIFtdYCwgbm90IGB0eXBlb2ZbXWBcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gam9pbihyZXN1bHQsIGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGluc2VydGluZyBzcGFjZXMgYmV0d2VlbiBvcGVyYXRvciBhbmQgYXJndW1lbnQgaWYgaXQgaXMgdW5uZWNlc3NhcnlcbiAgICAgICAgICAgICAgICAgICAgLy8gbGlrZSwgYCFjb25kYFxuICAgICAgICAgICAgICAgICAgICBsZWZ0U291cmNlID0gdG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGxlZnRDaGFyQ29kZSA9IGxlZnRTb3VyY2UuY2hhckNvZGVBdChsZWZ0U291cmNlLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICByaWdodENoYXJDb2RlID0gZnJhZ21lbnQudG9TdHJpbmcoKS5jaGFyQ29kZUF0KDApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgoKGxlZnRDaGFyQ29kZSA9PT0gMHgyQiAgLyogKyAqLyB8fCBsZWZ0Q2hhckNvZGUgPT09IDB4MkQgIC8qIC0gKi8pICYmIGxlZnRDaGFyQ29kZSA9PT0gcmlnaHRDaGFyQ29kZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXN1dGlscy5jb2RlLmlzSWRlbnRpZmllclBhcnQobGVmdENoYXJDb2RlKSAmJiBlc3V0aWxzLmNvZGUuaXNJZGVudGlmaWVyUGFydChyaWdodENoYXJDb2RlKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vRW1wdHlTcGFjZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCA9IHBhcmVudGhlc2l6ZShyZXN1bHQsIFByZWNlZGVuY2UuVW5hcnksIHByZWNlZGVuY2UpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguWWllbGRFeHByZXNzaW9uOlxuICAgICAgICAgICAgaWYgKGV4cHIuZGVsZWdhdGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAneWllbGQqJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gJ3lpZWxkJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHByLmFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gam9pbihcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5hcmd1bWVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5ZaWVsZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKHJlc3VsdCwgUHJlY2VkZW5jZS5ZaWVsZCwgcHJlY2VkZW5jZSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5VcGRhdGVFeHByZXNzaW9uOlxuICAgICAgICAgICAgaWYgKGV4cHIucHJlZml4KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBleHByLm9wZXJhdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIuYXJndW1lbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlVuYXJ5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBQcmVjZWRlbmNlLlVuYXJ5LFxuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcGFyZW50aGVzaXplKFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5hcmd1bWVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuUG9zdGZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBleHByLm9wZXJhdG9yXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFByZWNlZGVuY2UuUG9zdGZpeCxcbiAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5GdW5jdGlvbkV4cHJlc3Npb246XG4gICAgICAgICAgICBpc0dlbmVyYXRvciA9IGV4cHIuZ2VuZXJhdG9yICYmICFleHRyYS5tb3ouc3Rhcmxlc3NHZW5lcmF0b3I7XG4gICAgICAgICAgICByZXN1bHQgPSBpc0dlbmVyYXRvciA/ICdmdW5jdGlvbionIDogJ2Z1bmN0aW9uJztcblxuICAgICAgICAgICAgaWYgKGV4cHIuaWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbcmVzdWx0LCAoaXNHZW5lcmF0b3IpID8gc3BhY2UgOiBub0VtcHR5U3BhY2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVJZGVudGlmaWVyKGV4cHIuaWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUZ1bmN0aW9uQm9keShleHByKV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtyZXN1bHQgKyBzcGFjZSwgZ2VuZXJhdGVGdW5jdGlvbkJvZHkoZXhwcildO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5BcnJheVBhdHRlcm46XG4gICAgICAgIGNhc2UgU3ludGF4LkFycmF5RXhwcmVzc2lvbjpcbiAgICAgICAgICAgIGlmICghZXhwci5lbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAnW10nO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXVsdGlsaW5lID0gZXhwci5lbGVtZW50cy5sZW5ndGggPiAxO1xuICAgICAgICAgICAgcmVzdWx0ID0gWydbJywgbXVsdGlsaW5lID8gbmV3bGluZSA6ICcnXTtcbiAgICAgICAgICAgIHdpdGhJbmRlbnQoZnVuY3Rpb24gKGluZGVudCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGV4cHIuZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFleHByLmVsZW1lbnRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaW5kZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpICsgMSA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG11bHRpbGluZSA/IGluZGVudCA6ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihleHByLmVsZW1lbnRzW2ldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5Bc3NpZ25tZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgKyAxIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnLCcgKyAobXVsdGlsaW5lID8gbmV3bGluZSA6IHNwYWNlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChtdWx0aWxpbmUgJiYgIWVuZHNXaXRoTGluZVRlcm1pbmF0b3IodG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3bGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChtdWx0aWxpbmUgPyBiYXNlIDogJycpO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goJ10nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LlByb3BlcnR5OlxuICAgICAgICAgICAgaWYgKGV4cHIua2luZCA9PT0gJ2dldCcgfHwgZXhwci5raW5kID09PSAnc2V0Jykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgZXhwci5raW5kLCBub0VtcHR5U3BhY2UoKSxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIua2V5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVGdW5jdGlvbkJvZHkoZXhwci52YWx1ZSlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwci5zaG9ydGhhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIua2V5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHIubWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhwci52YWx1ZS5nZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcqJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIua2V5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRnVuY3Rpb25Cb2R5KGV4cHIudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5rZXksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICc6JyArIHNwYWNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIudmFsdWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguT2JqZWN0RXhwcmVzc2lvbjpcbiAgICAgICAgICAgIGlmICghZXhwci5wcm9wZXJ0aWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICd7fSc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtdWx0aWxpbmUgPSBleHByLnByb3BlcnRpZXMubGVuZ3RoID4gMTtcblxuICAgICAgICAgICAgd2l0aEluZGVudChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5wcm9wZXJ0aWVzWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlByb3BlcnR5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFtdWx0aWxpbmUpIHtcbiAgICAgICAgICAgICAgICAvLyBpc3N1ZXMgNFxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCB0cmFuc2Zvcm0gZnJvbVxuICAgICAgICAgICAgICAgIC8vICAgZGVqYXZ1LkNsYXNzLmRlY2xhcmUoe1xuICAgICAgICAgICAgICAgIC8vICAgICAgIG1ldGhvZDI6IGZ1bmN0aW9uICgpIHt9XG4gICAgICAgICAgICAgICAgLy8gICB9KTtcbiAgICAgICAgICAgICAgICAvLyB0b1xuICAgICAgICAgICAgICAgIC8vICAgZGVqYXZ1LkNsYXNzLmRlY2xhcmUoe21ldGhvZDI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICB9fSk7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMaW5lVGVybWluYXRvcih0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKGZyYWdtZW50KS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbICd7Jywgc3BhY2UsIGZyYWdtZW50LCBzcGFjZSwgJ30nIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2l0aEluZGVudChmdW5jdGlvbiAoaW5kZW50KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gWyAneycsIG5ld2xpbmUsIGluZGVudCwgZnJhZ21lbnQgXTtcblxuICAgICAgICAgICAgICAgIGlmIChtdWx0aWxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnICsgbmV3bGluZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDEsIGxlbiA9IGV4cHIucHJvcGVydGllcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaW5kZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihleHByLnByb3BlcnRpZXNbaV0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Qcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgKyAxIDwgbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnICsgbmV3bGluZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHRvU291cmNlTm9kZVdoZW5OZWVkZWQocmVzdWx0KS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ld2xpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goYmFzZSk7XG4gICAgICAgICAgICByZXN1bHQucHVzaCgnfScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguT2JqZWN0UGF0dGVybjpcbiAgICAgICAgICAgIGlmICghZXhwci5wcm9wZXJ0aWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICd7fSc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG11bHRpbGluZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGV4cHIucHJvcGVydGllcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGV4cHIucHJvcGVydGllc1swXTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkudmFsdWUudHlwZSAhPT0gU3ludGF4LklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlsaW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGV4cHIucHJvcGVydGllcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGV4cHIucHJvcGVydGllc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm9wZXJ0eS5zaG9ydGhhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpbGluZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCA9IFsneycsIG11bHRpbGluZSA/IG5ld2xpbmUgOiAnJyBdO1xuXG4gICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uIChpbmRlbnQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBleHByLnByb3BlcnRpZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobXVsdGlsaW5lID8gaW5kZW50IDogJycpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5wcm9wZXJ0aWVzW2ldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICsgMSA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJywnICsgKG11bHRpbGluZSA/IG5ld2xpbmUgOiBzcGFjZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChtdWx0aWxpbmUgJiYgIWVuZHNXaXRoTGluZVRlcm1pbmF0b3IodG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3bGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChtdWx0aWxpbmUgPyBiYXNlIDogJycpO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goJ30nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LlRoaXNFeHByZXNzaW9uOlxuICAgICAgICAgICAgcmVzdWx0ID0gJ3RoaXMnO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguSWRlbnRpZmllcjpcbiAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRlSWRlbnRpZmllcihleHByKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkxpdGVyYWw6XG4gICAgICAgICAgICBpZiAoZXhwci5oYXNPd25Qcm9wZXJ0eSgncmF3JykgJiYgcGFyc2UgJiYgZXh0cmEucmF3KSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmF3ID0gcGFyc2UoZXhwci5yYXcpLmJvZHlbMF0uZXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJhdy50eXBlID09PSBTeW50YXguTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhdy52YWx1ZSA9PT0gZXhwci52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGV4cHIucmF3O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBub3QgdXNlIHJhdyBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4cHIudmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAnbnVsbCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwci52YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlc2NhcGVTdHJpbmcoZXhwci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwci52YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0ZU51bWJlcihleHByLnZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHByLnZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBleHByLnZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdGVSZWdFeHAoZXhwci52YWx1ZSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5HZW5lcmF0b3JFeHByZXNzaW9uOlxuICAgICAgICBjYXNlIFN5bnRheC5Db21wcmVoZW5zaW9uRXhwcmVzc2lvbjpcbiAgICAgICAgICAgIC8vIEdlbmVyYXRvckV4cHJlc3Npb24gc2hvdWxkIGJlIHBhcmVudGhlc2l6ZWQgd2l0aCAoLi4uKSwgQ29tcHJlaGVuc2lvbkV4cHJlc3Npb24gd2l0aCBbLi4uXVxuICAgICAgICAgICAgLy8gRHVlIHRvIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTg4MzQ2OCBwb3NpdGlvbiBvZiBleHByLmJvZHkgY2FuIGRpZmZlciBpbiBTcGlkZXJtb25rZXkgYW5kIEVTNlxuICAgICAgICAgICAgcmVzdWx0ID0gKHR5cGUgPT09IFN5bnRheC5HZW5lcmF0b3JFeHByZXNzaW9uKSA/IFsnKCddIDogWydbJ107XG5cbiAgICAgICAgICAgIGlmIChleHRyYS5tb3ouY29tcHJlaGVuc2lvbkV4cHJlc3Npb25TdGFydHNXaXRoQXNzaWdubWVudCkge1xuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIuYm9keSwge1xuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZnJhZ21lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXhwci5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZXhwci5ibG9ja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIuYmxvY2tzW2ldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCB8fCBleHRyYS5tb3ouY29tcHJlaGVuc2lvbkV4cHJlc3Npb25TdGFydHNXaXRoQXNzaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBmcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXhwci5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgJ2lmJyArIHNwYWNlKTtcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGdlbmVyYXRlRXhwcmVzc2lvbihleHByLmZpbHRlciwge1xuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZXh0cmEubW96LnBhcmVudGhlc2l6ZWRDb21wcmVoZW5zaW9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gam9pbihyZXN1bHQsIFsgJygnLCBmcmFnbWVudCwgJyknIF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBmcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWV4dHJhLm1vei5jb21wcmVoZW5zaW9uRXhwcmVzc2lvblN0YXJ0c1dpdGhBc3NpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBnZW5lcmF0ZUV4cHJlc3Npb24oZXhwci5ib2R5LCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQXNzaWdubWVudCxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgZnJhZ21lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXN1bHQucHVzaCgodHlwZSA9PT0gU3ludGF4LkdlbmVyYXRvckV4cHJlc3Npb24pID8gJyknIDogJ10nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkNvbXByZWhlbnNpb25CbG9jazpcbiAgICAgICAgICAgIGlmIChleHByLmxlZnQudHlwZSA9PT0gU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IFtcbiAgICAgICAgICAgICAgICAgICAgZXhwci5sZWZ0LmtpbmQsIG5vRW1wdHlTcGFjZSgpLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZVN0YXRlbWVudChleHByLmxlZnQuZGVjbGFyYXRpb25zWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZ2VuZXJhdGVFeHByZXNzaW9uKGV4cHIubGVmdCwge1xuICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkNhbGwsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcmFnbWVudCA9IGpvaW4oZnJhZ21lbnQsIGV4cHIub2YgPyAnb2YnIDogJ2luJyk7XG4gICAgICAgICAgICBmcmFnbWVudCA9IGpvaW4oZnJhZ21lbnQsIGdlbmVyYXRlRXhwcmVzc2lvbihleHByLnJpZ2h0LCB7XG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBpZiAoZXh0cmEubW96LnBhcmVudGhlc2l6ZWRDb21wcmVoZW5zaW9uQmxvY2spIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbICdmb3InICsgc3BhY2UgKyAnKCcsIGZyYWdtZW50LCAnKScgXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gam9pbignZm9yJyArIHNwYWNlLCBmcmFnbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGV4cHJlc3Npb24gdHlwZTogJyArIGV4cHIudHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXh0cmEuY29tbWVudCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gYWRkQ29tbWVudHMoZXhwcixyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKHJlc3VsdCwgZXhwcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVTdGF0ZW1lbnQoc3RtdCwgb3B0aW9uKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgbGVuLFxuICAgICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIGFsbG93SW4sXG4gICAgICAgICAgICBmdW5jdGlvbkJvZHksXG4gICAgICAgICAgICBkaXJlY3RpdmVDb250ZXh0LFxuICAgICAgICAgICAgZnJhZ21lbnQsXG4gICAgICAgICAgICBzZW1pY29sb24sXG4gICAgICAgICAgICBpc0dlbmVyYXRvcjtcblxuICAgICAgICBhbGxvd0luID0gdHJ1ZTtcbiAgICAgICAgc2VtaWNvbG9uID0gJzsnO1xuICAgICAgICBmdW5jdGlvbkJvZHkgPSBmYWxzZTtcbiAgICAgICAgZGlyZWN0aXZlQ29udGV4dCA9IGZhbHNlO1xuICAgICAgICBpZiAob3B0aW9uKSB7XG4gICAgICAgICAgICBhbGxvd0luID0gb3B0aW9uLmFsbG93SW4gPT09IHVuZGVmaW5lZCB8fCBvcHRpb24uYWxsb3dJbjtcbiAgICAgICAgICAgIGlmICghc2VtaWNvbG9ucyAmJiBvcHRpb24uc2VtaWNvbG9uT3B0aW9uYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBzZW1pY29sb24gPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uQm9keSA9IG9wdGlvbi5mdW5jdGlvbkJvZHk7XG4gICAgICAgICAgICBkaXJlY3RpdmVDb250ZXh0ID0gb3B0aW9uLmRpcmVjdGl2ZUNvbnRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHN0bXQudHlwZSkge1xuICAgICAgICBjYXNlIFN5bnRheC5CbG9ja1N0YXRlbWVudDpcbiAgICAgICAgICAgIHJlc3VsdCA9IFsneycsIG5ld2xpbmVdO1xuXG4gICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdG10LmJvZHkubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBhZGRJbmRlbnQoZ2VuZXJhdGVTdGF0ZW1lbnQoc3RtdC5ib2R5W2ldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW1pY29sb25PcHRpb25hbDogaSA9PT0gbGVuIC0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUNvbnRleHQ6IGZ1bmN0aW9uQm9keVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHRvU291cmNlTm9kZVdoZW5OZWVkZWQoZnJhZ21lbnQpLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXdsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXN1bHQucHVzaChhZGRJbmRlbnQoJ30nKSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5CcmVha1N0YXRlbWVudDpcbiAgICAgICAgICAgIGlmIChzdG10LmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gJ2JyZWFrICcgKyBzdG10LmxhYmVsLm5hbWUgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdicmVhaycgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5Db250aW51ZVN0YXRlbWVudDpcbiAgICAgICAgICAgIGlmIChzdG10LmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gJ2NvbnRpbnVlICcgKyBzdG10LmxhYmVsLm5hbWUgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdjb250aW51ZScgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5EaXJlY3RpdmVTdGF0ZW1lbnQ6XG4gICAgICAgICAgICBpZiAoZXh0cmEucmF3ICYmIHN0bXQucmF3KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gc3RtdC5yYXcgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGVzY2FwZURpcmVjdGl2ZShzdG10LmRpcmVjdGl2ZSkgKyBzZW1pY29sb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5Eb1doaWxlU3RhdGVtZW50OlxuICAgICAgICAgICAgLy8gQmVjYXVzZSBgZG8gNDIgd2hpbGUgKGNvbmQpYCBpcyBTeW50YXggRXJyb3IuIFdlIG5lZWQgc2VtaWNvbG9uLlxuICAgICAgICAgICAgcmVzdWx0ID0gam9pbignZG8nLCBtYXliZUJsb2NrKHN0bXQuYm9keSkpO1xuICAgICAgICAgICAgcmVzdWx0ID0gbWF5YmVCbG9ja1N1ZmZpeChzdG10LmJvZHksIHJlc3VsdCk7XG4gICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgW1xuICAgICAgICAgICAgICAgICd3aGlsZScgKyBzcGFjZSArICcoJyxcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oc3RtdC50ZXN0LCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICcpJyArIHNlbWljb2xvblxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5DYXRjaENsYXVzZTpcbiAgICAgICAgICAgIHdpdGhJbmRlbnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBndWFyZDtcblxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ2NhdGNoJyArIHNwYWNlICsgJygnLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oc3RtdC5wYXJhbSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICcpJ1xuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RtdC5ndWFyZCkge1xuICAgICAgICAgICAgICAgICAgICBndWFyZCA9IGdlbmVyYXRlRXhwcmVzc2lvbihzdG10Lmd1YXJkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuc3BsaWNlKDIsIDAsICcgaWYgJywgZ3VhcmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobWF5YmVCbG9jayhzdG10LmJvZHkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkRlYnVnZ2VyU3RhdGVtZW50OlxuICAgICAgICAgICAgcmVzdWx0ID0gJ2RlYnVnZ2VyJyArIHNlbWljb2xvbjtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkVtcHR5U3RhdGVtZW50OlxuICAgICAgICAgICAgcmVzdWx0ID0gJzsnO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguRXhwb3J0RGVjbGFyYXRpb246XG4gICAgICAgICAgICByZXN1bHQgPSAnZXhwb3J0ICc7XG4gICAgICAgICAgICBpZiAoc3RtdC5kZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgICAgIC8vIEZ1bmN0aW9uRGVjbGFyYXRpb24gb3IgVmFyaWFibGVEZWNsYXJhdGlvblxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtyZXN1bHQsIGdlbmVyYXRlU3RhdGVtZW50KHN0bXQuZGVjbGFyYXRpb24sIHsgc2VtaWNvbG9uT3B0aW9uYWw6IHNlbWljb2xvbiA9PT0gJycgfSldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguRXhwcmVzc2lvblN0YXRlbWVudDpcbiAgICAgICAgICAgIHJlc3VsdCA9IFtnZW5lcmF0ZUV4cHJlc3Npb24oc3RtdC5leHByZXNzaW9uLCB7XG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgfSldO1xuICAgICAgICAgICAgLy8gMTIuNCAneycsICdmdW5jdGlvbicgaXMgbm90IGFsbG93ZWQgaW4gdGhpcyBwb3NpdGlvbi5cbiAgICAgICAgICAgIC8vIHdyYXAgZXhwcmVzc2lvbiB3aXRoIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBmcmFnbWVudCA9IHRvU291cmNlTm9kZVdoZW5OZWVkZWQocmVzdWx0KS50b1N0cmluZygpO1xuICAgICAgICAgICAgaWYgKGZyYWdtZW50LmNoYXJBdCgwKSA9PT0gJ3snIHx8ICAvLyBPYmplY3RFeHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIChmcmFnbWVudC5zbGljZSgwLCA4KSA9PT0gJ2Z1bmN0aW9uJyAmJiAnKiAoJy5pbmRleE9mKGZyYWdtZW50LmNoYXJBdCg4KSkgPj0gMCkgfHwgIC8vIGZ1bmN0aW9uIG9yIGdlbmVyYXRvclxuICAgICAgICAgICAgICAgICAgICAoZGlyZWN0aXZlICYmIGRpcmVjdGl2ZUNvbnRleHQgJiYgc3RtdC5leHByZXNzaW9uLnR5cGUgPT09IFN5bnRheC5MaXRlcmFsICYmIHR5cGVvZiBzdG10LmV4cHJlc3Npb24udmFsdWUgPT09ICdzdHJpbmcnKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFsnKCcsIHJlc3VsdCwgJyknICsgc2VtaWNvbG9uXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2VtaWNvbG9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRvcjpcbiAgICAgICAgICAgIGlmIChzdG10LmluaXQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LmlkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZSxcbiAgICAgICAgICAgICAgICAgICAgJz0nLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZSxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKHN0bXQuaW5pdCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5Bc3NpZ25tZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogYWxsb3dJbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRlUGF0dGVybihzdG10LmlkLCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuQXNzaWdubWVudCxcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogYWxsb3dJblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguVmFyaWFibGVEZWNsYXJhdGlvbjpcbiAgICAgICAgICAgIHJlc3VsdCA9IFtzdG10LmtpbmRdO1xuICAgICAgICAgICAgLy8gc3BlY2lhbCBwYXRoIGZvclxuICAgICAgICAgICAgLy8gdmFyIHggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB9O1xuICAgICAgICAgICAgaWYgKHN0bXQuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMSAmJiBzdG10LmRlY2xhcmF0aW9uc1swXS5pbml0ICYmXG4gICAgICAgICAgICAgICAgICAgIHN0bXQuZGVjbGFyYXRpb25zWzBdLmluaXQudHlwZSA9PT0gU3ludGF4LkZ1bmN0aW9uRXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vRW1wdHlTcGFjZSgpKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZVN0YXRlbWVudChzdG10LmRlY2xhcmF0aW9uc1swXSwge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBWYXJpYWJsZURlY2xhcmF0b3IgaXMgdHlwZWQgYXMgU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIC8vIGJ1dCBqb2luZWQgd2l0aCBjb21tYSAobm90IExpbmVUZXJtaW5hdG9yKS5cbiAgICAgICAgICAgICAgICAvLyBTbyBpZiBjb21tZW50IGlzIGF0dGFjaGVkIHRvIHRhcmdldCBub2RlLCB3ZSBzaG91bGQgc3BlY2lhbGl6ZS5cbiAgICAgICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHN0bXQuZGVjbGFyYXRpb25zWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmEuY29tbWVudCAmJiBub2RlLmxlYWRpbmdDb21tZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYWRkSW5kZW50KGdlbmVyYXRlU3RhdGVtZW50KG5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobm9FbXB0eVNwYWNlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVTdGF0ZW1lbnQobm9kZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDEsIGxlbiA9IHN0bXQuZGVjbGFyYXRpb25zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlID0gc3RtdC5kZWNsYXJhdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmEuY29tbWVudCAmJiBub2RlLmxlYWRpbmdDb21tZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcsJyArIG5ld2xpbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFkZEluZGVudChnZW5lcmF0ZVN0YXRlbWVudChub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGFsbG93SW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnLCcgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZ2VuZXJhdGVTdGF0ZW1lbnQobm9kZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiBhbGxvd0luXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQucHVzaChzZW1pY29sb24pO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguVGhyb3dTdGF0ZW1lbnQ6XG4gICAgICAgICAgICByZXN1bHQgPSBbam9pbihcbiAgICAgICAgICAgICAgICAndGhyb3cnLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LmFyZ3VtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApLCBzZW1pY29sb25dO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguVHJ5U3RhdGVtZW50OlxuICAgICAgICAgICAgcmVzdWx0ID0gWyd0cnknLCBtYXliZUJsb2NrKHN0bXQuYmxvY2spXTtcbiAgICAgICAgICAgIHJlc3VsdCA9IG1heWJlQmxvY2tTdWZmaXgoc3RtdC5ibG9jaywgcmVzdWx0KTtcblxuICAgICAgICAgICAgaWYgKHN0bXQuaGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICAvLyBvbGQgaW50ZXJmYWNlXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc3RtdC5oYW5kbGVycy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgZ2VuZXJhdGVTdGF0ZW1lbnQoc3RtdC5oYW5kbGVyc1tpXSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RtdC5maW5hbGl6ZXIgfHwgaSArIDEgIT09IGxlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbWF5YmVCbG9ja1N1ZmZpeChzdG10LmhhbmRsZXJzW2ldLmJvZHksIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0bXQuZ3VhcmRlZEhhbmRsZXJzID0gc3RtdC5ndWFyZGVkSGFuZGxlcnMgfHwgW107XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdG10Lmd1YXJkZWRIYW5kbGVycy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgZ2VuZXJhdGVTdGF0ZW1lbnQoc3RtdC5ndWFyZGVkSGFuZGxlcnNbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0bXQuZmluYWxpemVyIHx8IGkgKyAxICE9PSBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG1heWJlQmxvY2tTdWZmaXgoc3RtdC5ndWFyZGVkSGFuZGxlcnNbaV0uYm9keSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIG5ldyBpbnRlcmZhY2VcbiAgICAgICAgICAgICAgICBpZiAoc3RtdC5oYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHN0bXQuaGFuZGxlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHN0bXQuaGFuZGxlci5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBnZW5lcmF0ZVN0YXRlbWVudChzdG10LmhhbmRsZXJbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RtdC5maW5hbGl6ZXIgfHwgaSArIDEgIT09IGxlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBtYXliZUJsb2NrU3VmZml4KHN0bXQuaGFuZGxlcltpXS5ib2R5LCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBnZW5lcmF0ZVN0YXRlbWVudChzdG10LmhhbmRsZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG10LmZpbmFsaXplcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG1heWJlQmxvY2tTdWZmaXgoc3RtdC5oYW5kbGVyLmJvZHksIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RtdC5maW5hbGl6ZXIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgWydmaW5hbGx5JywgbWF5YmVCbG9jayhzdG10LmZpbmFsaXplcildKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LlN3aXRjaFN0YXRlbWVudDpcbiAgICAgICAgICAgIHdpdGhJbmRlbnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3N3aXRjaCcgKyBzcGFjZSArICcoJyxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKHN0bXQuZGlzY3JpbWluYW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgJyknICsgc3BhY2UgKyAneycgKyBuZXdsaW5lXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHN0bXQuY2FzZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdG10LmNhc2VzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gYWRkSW5kZW50KGdlbmVyYXRlU3RhdGVtZW50KHN0bXQuY2FzZXNbaV0sIHtzZW1pY29sb25PcHRpb25hbDogaSA9PT0gbGVuIC0gMX0pKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWVuZHNXaXRoTGluZVRlcm1pbmF0b3IodG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChmcmFnbWVudCkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ld2xpbmUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnB1c2goYWRkSW5kZW50KCd9JykpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguU3dpdGNoQ2FzZTpcbiAgICAgICAgICAgIHdpdGhJbmRlbnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzdG10LnRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgam9pbignY2FzZScsIGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LnRlc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAnOidcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbJ2RlZmF1bHQ6J107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgbGVuID0gc3RtdC5jb25zZXF1ZW50Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobGVuICYmIHN0bXQuY29uc2VxdWVudFswXS50eXBlID09PSBTeW50YXguQmxvY2tTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBtYXliZUJsb2NrKHN0bXQuY29uc2VxdWVudFswXSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGkgIT09IGxlbiAmJiAhZW5kc1dpdGhMaW5lVGVybWluYXRvcih0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKHJlc3VsdCkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3bGluZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGFkZEluZGVudChnZW5lcmF0ZVN0YXRlbWVudChzdG10LmNvbnNlcXVlbnRbaV0sIHtzZW1pY29sb25PcHRpb25hbDogaSA9PT0gbGVuIC0gMSAmJiBzZW1pY29sb24gPT09ICcnfSkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChmcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICsgMSAhPT0gbGVuICYmICFlbmRzV2l0aExpbmVUZXJtaW5hdG9yKHRvU291cmNlTm9kZVdoZW5OZWVkZWQoZnJhZ21lbnQpLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXdsaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguSWZTdGF0ZW1lbnQ6XG4gICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbXG4gICAgICAgICAgICAgICAgICAgICdpZicgKyBzcGFjZSArICcoJyxcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVFeHByZXNzaW9uKHN0bXQudGVzdCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICcpJ1xuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzdG10LmFsdGVybmF0ZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1heWJlQmxvY2soc3RtdC5jb25zZXF1ZW50KSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbWF5YmVCbG9ja1N1ZmZpeChzdG10LmNvbnNlcXVlbnQsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0bXQuYWx0ZXJuYXRlLnR5cGUgPT09IFN5bnRheC5JZlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBqb2luKHJlc3VsdCwgWydlbHNlICcsIGdlbmVyYXRlU3RhdGVtZW50KHN0bXQuYWx0ZXJuYXRlLCB7c2VtaWNvbG9uT3B0aW9uYWw6IHNlbWljb2xvbiA9PT0gJyd9KV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGpvaW4ocmVzdWx0LCBqb2luKCdlbHNlJywgbWF5YmVCbG9jayhzdG10LmFsdGVybmF0ZSwgc2VtaWNvbG9uID09PSAnJykpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1heWJlQmxvY2soc3RtdC5jb25zZXF1ZW50LCBzZW1pY29sb24gPT09ICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5Gb3JTdGF0ZW1lbnQ6XG4gICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbJ2ZvcicgKyBzcGFjZSArICcoJ107XG4gICAgICAgICAgICAgICAgaWYgKHN0bXQuaW5pdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RtdC5pbml0LnR5cGUgPT09IFN5bnRheC5WYXJpYWJsZURlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChnZW5lcmF0ZVN0YXRlbWVudChzdG10LmluaXQsIHthbGxvd0luOiBmYWxzZX0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LmluaXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJzsnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCc7Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHN0bXQudGVzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LnRlc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJzsnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnOycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzdG10LnVwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LnVwZGF0ZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93SW46IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCcpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKG1heWJlQmxvY2soc3RtdC5ib2R5LCBzZW1pY29sb24gPT09ICcnKSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5Gb3JJblN0YXRlbWVudDpcbiAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRlSXRlcmF0aW9uRm9yU3RhdGVtZW50KCdpbicsIHN0bXQsIHNlbWljb2xvbiA9PT0gJycpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguRm9yT2ZTdGF0ZW1lbnQ6XG4gICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0ZUl0ZXJhdGlvbkZvclN0YXRlbWVudCgnb2YnLCBzdG10LCBzZW1pY29sb24gPT09ICcnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkxhYmVsZWRTdGF0ZW1lbnQ6XG4gICAgICAgICAgICByZXN1bHQgPSBbc3RtdC5sYWJlbC5uYW1lICsgJzonLCBtYXliZUJsb2NrKHN0bXQuYm9keSwgc2VtaWNvbG9uID09PSAnJyldO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguUHJvZ3JhbTpcbiAgICAgICAgICAgIGxlbiA9IHN0bXQuYm9keS5sZW5ndGg7XG4gICAgICAgICAgICByZXN1bHQgPSBbc2FmZUNvbmNhdGVuYXRpb24gJiYgbGVuID4gMCA/ICdcXG4nIDogJyddO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBhZGRJbmRlbnQoXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlU3RhdGVtZW50KHN0bXQuYm9keVtpXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VtaWNvbG9uT3B0aW9uYWw6ICFzYWZlQ29uY2F0ZW5hdGlvbiAmJiBpID09PSBsZW4gLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlQ29udGV4dDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIGlmIChpICsgMSA8IGxlbiAmJiAhZW5kc1dpdGhMaW5lVGVybWluYXRvcih0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKGZyYWdtZW50KS50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXdsaW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5GdW5jdGlvbkRlY2xhcmF0aW9uOlxuICAgICAgICAgICAgaXNHZW5lcmF0b3IgPSBzdG10LmdlbmVyYXRvciAmJiAhZXh0cmEubW96LnN0YXJsZXNzR2VuZXJhdG9yO1xuICAgICAgICAgICAgcmVzdWx0ID0gW1xuICAgICAgICAgICAgICAgIChpc0dlbmVyYXRvciA/ICdmdW5jdGlvbionIDogJ2Z1bmN0aW9uJyksXG4gICAgICAgICAgICAgICAgKGlzR2VuZXJhdG9yID8gc3BhY2UgOiBub0VtcHR5U3BhY2UoKSksXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVJZGVudGlmaWVyKHN0bXQuaWQpLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlRnVuY3Rpb25Cb2R5KHN0bXQpXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBTeW50YXguUmV0dXJuU3RhdGVtZW50OlxuICAgICAgICAgICAgaWYgKHN0bXQuYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbam9pbihcbiAgICAgICAgICAgICAgICAgICAgJ3JldHVybicsXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlRXhwcmVzc2lvbihzdG10LmFyZ3VtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICksIHNlbWljb2xvbl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFsncmV0dXJuJyArIHNlbWljb2xvbl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFN5bnRheC5XaGlsZVN0YXRlbWVudDpcbiAgICAgICAgICAgIHdpdGhJbmRlbnQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3doaWxlJyArIHNwYWNlICsgJygnLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oc3RtdC50ZXN0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93Q2FsbDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgJyknXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobWF5YmVCbG9jayhzdG10LmJvZHksIHNlbWljb2xvbiA9PT0gJycpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LldpdGhTdGF0ZW1lbnQ6XG4gICAgICAgICAgICB3aXRoSW5kZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbXG4gICAgICAgICAgICAgICAgICAgICd3aXRoJyArIHNwYWNlICsgJygnLFxuICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUV4cHJlc3Npb24oc3RtdC5vYmplY3QsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDYWxsOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAnKSdcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHQucHVzaChtYXliZUJsb2NrKHN0bXQuYm9keSwgc2VtaWNvbG9uID09PSAnJykpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBzdGF0ZW1lbnQgdHlwZTogJyArIHN0bXQudHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdHRhY2ggY29tbWVudHNcblxuICAgICAgICBpZiAoZXh0cmEuY29tbWVudCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gYWRkQ29tbWVudHMoc3RtdCwgcmVzdWx0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZyYWdtZW50ID0gdG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmIChzdG10LnR5cGUgPT09IFN5bnRheC5Qcm9ncmFtICYmICFzYWZlQ29uY2F0ZW5hdGlvbiAmJiBuZXdsaW5lID09PSAnJyAmJiAgZnJhZ21lbnQuY2hhckF0KGZyYWdtZW50Lmxlbmd0aCAtIDEpID09PSAnXFxuJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gc291cmNlTWFwID8gdG9Tb3VyY2VOb2RlV2hlbk5lZWRlZChyZXN1bHQpLnJlcGxhY2VSaWdodCgvXFxzKyQvLCAnJykgOiBmcmFnbWVudC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b1NvdXJjZU5vZGVXaGVuTmVlZGVkKHJlc3VsdCwgc3RtdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGUobm9kZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSBnZXREZWZhdWx0T3B0aW9ucygpLCByZXN1bHQsIHBhaXI7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gT2Jzb2xldGUgb3B0aW9uc1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICAgYG9wdGlvbnMuaW5kZW50YFxuICAgICAgICAgICAgLy8gICBgb3B0aW9ucy5iYXNlYFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEluc3RlYWQgb2YgdGhlbSwgd2UgY2FuIHVzZSBgb3B0aW9uLmZvcm1hdC5pbmRlbnRgLlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmluZGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0T3B0aW9ucy5mb3JtYXQuaW5kZW50LnN0eWxlID0gb3B0aW9ucy5pbmRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYmFzZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0T3B0aW9ucy5mb3JtYXQuaW5kZW50LmJhc2UgPSBvcHRpb25zLmJhc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcHRpb25zID0gdXBkYXRlRGVlcGx5KGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGluZGVudCA9IG9wdGlvbnMuZm9ybWF0LmluZGVudC5zdHlsZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5iYXNlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGJhc2UgPSBvcHRpb25zLmJhc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJhc2UgPSBzdHJpbmdSZXBlYXQoaW5kZW50LCBvcHRpb25zLmZvcm1hdC5pbmRlbnQuYmFzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gICAgICAgICAgICBpbmRlbnQgPSBvcHRpb25zLmZvcm1hdC5pbmRlbnQuc3R5bGU7XG4gICAgICAgICAgICBiYXNlID0gc3RyaW5nUmVwZWF0KGluZGVudCwgb3B0aW9ucy5mb3JtYXQuaW5kZW50LmJhc2UpO1xuICAgICAgICB9XG4gICAgICAgIGpzb24gPSBvcHRpb25zLmZvcm1hdC5qc29uO1xuICAgICAgICByZW51bWJlciA9IG9wdGlvbnMuZm9ybWF0LnJlbnVtYmVyO1xuICAgICAgICBoZXhhZGVjaW1hbCA9IGpzb24gPyBmYWxzZSA6IG9wdGlvbnMuZm9ybWF0LmhleGFkZWNpbWFsO1xuICAgICAgICBxdW90ZXMgPSBqc29uID8gJ2RvdWJsZScgOiBvcHRpb25zLmZvcm1hdC5xdW90ZXM7XG4gICAgICAgIGVzY2FwZWxlc3MgPSBvcHRpb25zLmZvcm1hdC5lc2NhcGVsZXNzO1xuICAgICAgICBuZXdsaW5lID0gb3B0aW9ucy5mb3JtYXQubmV3bGluZTtcbiAgICAgICAgc3BhY2UgPSBvcHRpb25zLmZvcm1hdC5zcGFjZTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZm9ybWF0LmNvbXBhY3QpIHtcbiAgICAgICAgICAgIG5ld2xpbmUgPSBzcGFjZSA9IGluZGVudCA9IGJhc2UgPSAnJztcbiAgICAgICAgfVxuICAgICAgICBwYXJlbnRoZXNlcyA9IG9wdGlvbnMuZm9ybWF0LnBhcmVudGhlc2VzO1xuICAgICAgICBzZW1pY29sb25zID0gb3B0aW9ucy5mb3JtYXQuc2VtaWNvbG9ucztcbiAgICAgICAgc2FmZUNvbmNhdGVuYXRpb24gPSBvcHRpb25zLmZvcm1hdC5zYWZlQ29uY2F0ZW5hdGlvbjtcbiAgICAgICAgZGlyZWN0aXZlID0gb3B0aW9ucy5kaXJlY3RpdmU7XG4gICAgICAgIHBhcnNlID0ganNvbiA/IG51bGwgOiBvcHRpb25zLnBhcnNlO1xuICAgICAgICBzb3VyY2VNYXAgPSBvcHRpb25zLnNvdXJjZU1hcDtcbiAgICAgICAgZXh0cmEgPSBvcHRpb25zO1xuXG4gICAgICAgIGlmIChzb3VyY2VNYXApIHtcbiAgICAgICAgICAgIGlmICghZXhwb3J0cy5icm93c2VyKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgYXNzdW1lIGVudmlyb25tZW50IGlzIG5vZGUuanNcbiAgICAgICAgICAgICAgICAvLyBBbmQgcHJldmVudCBmcm9tIGluY2x1ZGluZyBzb3VyY2UtbWFwIGJ5IGJyb3dzZXJpZnlcbiAgICAgICAgICAgICAgICBTb3VyY2VOb2RlID0gcmVxdWlyZSgnc291cmNlLW1hcCcpLlNvdXJjZU5vZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFNvdXJjZU5vZGUgPSBnbG9iYWwuc291cmNlTWFwLlNvdXJjZU5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgICBjYXNlIFN5bnRheC5CbG9ja1N0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguQnJlYWtTdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LkNhdGNoQ2xhdXNlOlxuICAgICAgICBjYXNlIFN5bnRheC5Db250aW51ZVN0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguRGlyZWN0aXZlU3RhdGVtZW50OlxuICAgICAgICBjYXNlIFN5bnRheC5Eb1doaWxlU3RhdGVtZW50OlxuICAgICAgICBjYXNlIFN5bnRheC5EZWJ1Z2dlclN0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguRW1wdHlTdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LkV4cHJlc3Npb25TdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LkZvclN0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguRm9ySW5TdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LkZvck9mU3RhdGVtZW50OlxuICAgICAgICBjYXNlIFN5bnRheC5GdW5jdGlvbkRlY2xhcmF0aW9uOlxuICAgICAgICBjYXNlIFN5bnRheC5JZlN0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguTGFiZWxlZFN0YXRlbWVudDpcbiAgICAgICAgY2FzZSBTeW50YXguUHJvZ3JhbTpcbiAgICAgICAgY2FzZSBTeW50YXguUmV0dXJuU3RhdGVtZW50OlxuICAgICAgICBjYXNlIFN5bnRheC5Td2l0Y2hTdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LlN3aXRjaENhc2U6XG4gICAgICAgIGNhc2UgU3ludGF4LlRocm93U3RhdGVtZW50OlxuICAgICAgICBjYXNlIFN5bnRheC5UcnlTdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRpb246XG4gICAgICAgIGNhc2UgU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRvcjpcbiAgICAgICAgY2FzZSBTeW50YXguV2hpbGVTdGF0ZW1lbnQ6XG4gICAgICAgIGNhc2UgU3ludGF4LldpdGhTdGF0ZW1lbnQ6XG4gICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0ZVN0YXRlbWVudChub2RlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgU3ludGF4LkFzc2lnbm1lbnRFeHByZXNzaW9uOlxuICAgICAgICBjYXNlIFN5bnRheC5BcnJheUV4cHJlc3Npb246XG4gICAgICAgIGNhc2UgU3ludGF4LkFycmF5UGF0dGVybjpcbiAgICAgICAgY2FzZSBTeW50YXguQmluYXJ5RXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguQ2FsbEV4cHJlc3Npb246XG4gICAgICAgIGNhc2UgU3ludGF4LkNvbmRpdGlvbmFsRXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguRnVuY3Rpb25FeHByZXNzaW9uOlxuICAgICAgICBjYXNlIFN5bnRheC5JZGVudGlmaWVyOlxuICAgICAgICBjYXNlIFN5bnRheC5MaXRlcmFsOlxuICAgICAgICBjYXNlIFN5bnRheC5Mb2dpY2FsRXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguTWVtYmVyRXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguTmV3RXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguT2JqZWN0RXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguT2JqZWN0UGF0dGVybjpcbiAgICAgICAgY2FzZSBTeW50YXguUHJvcGVydHk6XG4gICAgICAgIGNhc2UgU3ludGF4LlNlcXVlbmNlRXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguVGhpc0V4cHJlc3Npb246XG4gICAgICAgIGNhc2UgU3ludGF4LlVuYXJ5RXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguVXBkYXRlRXhwcmVzc2lvbjpcbiAgICAgICAgY2FzZSBTeW50YXguWWllbGRFeHByZXNzaW9uOlxuXG4gICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0ZUV4cHJlc3Npb24obm9kZSwge1xuICAgICAgICAgICAgICAgIHByZWNlZGVuY2U6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhbGxvd0NhbGw6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBub2RlIHR5cGU6ICcgKyBub2RlLnR5cGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzb3VyY2VNYXApIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgcGFpciA9IHJlc3VsdC50b1N0cmluZ1dpdGhTb3VyY2VNYXAoe1xuICAgICAgICAgICAgZmlsZTogb3B0aW9ucy5maWxlLFxuICAgICAgICAgICAgc291cmNlUm9vdDogb3B0aW9ucy5zb3VyY2VNYXBSb290XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNvdXJjZUNvbnRlbnQpIHtcbiAgICAgICAgICAgIHBhaXIubWFwLnNldFNvdXJjZUNvbnRlbnQob3B0aW9ucy5zb3VyY2VNYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc291cmNlQ29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5zb3VyY2VNYXBXaXRoQ29kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhaXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFpci5tYXAudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBGT1JNQVRfTUlOSUZZID0ge1xuICAgICAgICBpbmRlbnQ6IHtcbiAgICAgICAgICAgIHN0eWxlOiAnJyxcbiAgICAgICAgICAgIGJhc2U6IDBcbiAgICAgICAgfSxcbiAgICAgICAgcmVudW1iZXI6IHRydWUsXG4gICAgICAgIGhleGFkZWNpbWFsOiB0cnVlLFxuICAgICAgICBxdW90ZXM6ICdhdXRvJyxcbiAgICAgICAgZXNjYXBlbGVzczogdHJ1ZSxcbiAgICAgICAgY29tcGFjdDogdHJ1ZSxcbiAgICAgICAgcGFyZW50aGVzZXM6IGZhbHNlLFxuICAgICAgICBzZW1pY29sb25zOiBmYWxzZVxuICAgIH07XG5cbiAgICBGT1JNQVRfREVGQVVMVFMgPSBnZXREZWZhdWx0T3B0aW9ucygpLmZvcm1hdDtcblxuICAgIGV4cG9ydHMudmVyc2lvbiA9IHJlcXVpcmUoJy4vcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgICBleHBvcnRzLmdlbmVyYXRlID0gZ2VuZXJhdGU7XG4gICAgZXhwb3J0cy5hdHRhY2hDb21tZW50cyA9IGVzdHJhdmVyc2UuYXR0YWNoQ29tbWVudHM7XG4gICAgZXhwb3J0cy5QcmVjZWRlbmNlID0gdXBkYXRlRGVlcGx5KHt9LCBQcmVjZWRlbmNlKTtcbiAgICBleHBvcnRzLmJyb3dzZXIgPSBmYWxzZTtcbiAgICBleHBvcnRzLkZPUk1BVF9NSU5JRlkgPSBGT1JNQVRfTUlOSUZZO1xuICAgIGV4cG9ydHMuRk9STUFUX0RFRkFVTFRTID0gRk9STUFUX0RFRkFVTFRTO1xufSgpKTtcbi8qIHZpbTogc2V0IHN3PTQgdHM9NCBldCB0dz04MCA6ICovXG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEzIFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBSZWdleDtcblxuICAgIC8vIFNlZSBhbHNvIHRvb2xzL2dlbmVyYXRlLXVuaWNvZGUtcmVnZXgucHkuXG4gICAgUmVnZXggPSB7XG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclN0YXJ0OiBuZXcgUmVnRXhwKCdbXFx4QUFcXHhCNVxceEJBXFx4QzAtXFx4RDZcXHhEOC1cXHhGNlxceEY4LVxcdTAyQzFcXHUwMkM2LVxcdTAyRDFcXHUwMkUwLVxcdTAyRTRcXHUwMkVDXFx1MDJFRVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3QS1cXHUwMzdEXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDhBLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYyMC1cXHUwNjRBXFx1MDY2RVxcdTA2NkZcXHUwNjcxLVxcdTA2RDNcXHUwNkQ1XFx1MDZFNVxcdTA2RTZcXHUwNkVFXFx1MDZFRlxcdTA2RkEtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwXFx1MDcxMi1cXHUwNzJGXFx1MDc0RC1cXHUwN0E1XFx1MDdCMVxcdTA3Q0EtXFx1MDdFQVxcdTA3RjRcXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgxNVxcdTA4MUFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4QTBcXHUwOEEyLVxcdTA4QUNcXHUwOTA0LVxcdTA5MzlcXHUwOTNEXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3RlxcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkRcXHUwOUNFXFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTFcXHUwOUYwXFx1MDlGMVxcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEE1OS1cXHUwQTVDXFx1MEE1RVxcdTBBNzItXFx1MEE3NFxcdTBBODUtXFx1MEE4RFxcdTBBOEYtXFx1MEE5MVxcdTBBOTMtXFx1MEFBOFxcdTBBQUEtXFx1MEFCMFxcdTBBQjJcXHUwQUIzXFx1MEFCNS1cXHUwQUI5XFx1MEFCRFxcdTBBRDBcXHUwQUUwXFx1MEFFMVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjcxXFx1MEI4M1xcdTBCODUtXFx1MEI4QVxcdTBCOEUtXFx1MEI5MFxcdTBCOTItXFx1MEI5NVxcdTBCOTlcXHUwQjlBXFx1MEI5Q1xcdTBCOUVcXHUwQjlGXFx1MEJBM1xcdTBCQTRcXHUwQkE4LVxcdTBCQUFcXHUwQkFFLVxcdTBCQjlcXHUwQkQwXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzMzXFx1MEMzNS1cXHUwQzM5XFx1MEMzRFxcdTBDNThcXHUwQzU5XFx1MEM2MFxcdTBDNjFcXHUwQzg1LVxcdTBDOENcXHUwQzhFLVxcdTBDOTBcXHUwQzkyLVxcdTBDQThcXHUwQ0FBLVxcdTBDQjNcXHUwQ0I1LVxcdTBDQjlcXHUwQ0JEXFx1MENERVxcdTBDRTBcXHUwQ0UxXFx1MENGMVxcdTBDRjJcXHUwRDA1LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNEXFx1MEQ0RVxcdTBENjBcXHUwRDYxXFx1MEQ3QS1cXHUwRDdGXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBFMDEtXFx1MEUzMFxcdTBFMzJcXHUwRTMzXFx1MEU0MC1cXHUwRTQ2XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjBcXHUwRUIyXFx1MEVCM1xcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGNDAtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGODgtXFx1MEY4Q1xcdTEwMDAtXFx1MTAyQVxcdTEwM0ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVBLVxcdTEwNURcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZFLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhFXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGMFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3ODAtXFx1MTdCM1xcdTE3RDdcXHUxN0RDXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEE4XFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxQ1xcdTE5NTAtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QzEtXFx1MTlDN1xcdTFBMDAtXFx1MUExNlxcdTFBMjAtXFx1MUE1NFxcdTFBQTdcXHUxQjA1LVxcdTFCMzNcXHUxQjQ1LVxcdTFCNEJcXHUxQjgzLVxcdTFCQTBcXHUxQkFFXFx1MUJBRlxcdTFCQkEtXFx1MUJFNVxcdTFDMDAtXFx1MUMyM1xcdTFDNEQtXFx1MUM0RlxcdTFDNUEtXFx1MUM3RFxcdTFDRTktXFx1MUNFQ1xcdTFDRUUtXFx1MUNGMVxcdTFDRjVcXHUxQ0Y2XFx1MUQwMC1cXHUxREJGXFx1MUUwMC1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwNzFcXHUyMDdGXFx1MjA5MC1cXHUyMDlDXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNFRVxcdTJDRjJcXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ4MC1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYxRlxcdUE2MkFcXHVBNjJCXFx1QTY0MC1cXHVBNjZFXFx1QTY3Ri1cXHVBNjk3XFx1QTZBMC1cXHVBNkVGXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBNzkzXFx1QTdBMC1cXHVBN0FBXFx1QTdGOC1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE5MEEtXFx1QTkyNVxcdUE5MzAtXFx1QTk0NlxcdUE5NjAtXFx1QTk3Q1xcdUE5ODQtXFx1QTlCMlxcdUE5Q0ZcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE4MC1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQkMwLVxcdUFCRTJcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFEXFx1RkIxRi1cXHVGQjI4XFx1RkIyQS1cXHVGQjM2XFx1RkIzOC1cXHVGQjNDXFx1RkIzRVxcdUZCNDBcXHVGQjQxXFx1RkI0M1xcdUZCNDRcXHVGQjQ2LVxcdUZCQjFcXHVGQkQzLVxcdUZEM0RcXHVGRDUwLVxcdUZEOEZcXHVGRDkyLVxcdUZEQzdcXHVGREYwLVxcdUZERkJcXHVGRTcwLVxcdUZFNzRcXHVGRTc2LVxcdUZFRkNcXHVGRjIxLVxcdUZGM0FcXHVGRjQxLVxcdUZGNUFcXHVGRjY2LVxcdUZGQkVcXHVGRkMyLVxcdUZGQzdcXHVGRkNBLVxcdUZGQ0ZcXHVGRkQyLVxcdUZGRDdcXHVGRkRBLVxcdUZGRENdJyksXG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclBhcnQ6IG5ldyBSZWdFeHAoJ1tcXHhBQVxceEI1XFx4QkFcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDMwMC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0ODMtXFx1MDQ4N1xcdTA0OEEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNTkxLVxcdTA1QkRcXHUwNUJGXFx1MDVDMVxcdTA1QzJcXHUwNUM0XFx1MDVDNVxcdTA1QzdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjEwLVxcdTA2MUFcXHUwNjIwLVxcdTA2NjlcXHUwNjZFLVxcdTA2RDNcXHUwNkQ1LVxcdTA2RENcXHUwNkRGLVxcdTA2RThcXHUwNkVBLVxcdTA2RkNcXHUwNkZGXFx1MDcxMC1cXHUwNzRBXFx1MDc0RC1cXHUwN0IxXFx1MDdDMC1cXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgyRFxcdTA4NDAtXFx1MDg1QlxcdTA4QTBcXHUwOEEyLVxcdTA4QUNcXHUwOEU0LVxcdTA4RkVcXHUwOTAwLVxcdTA5NjNcXHUwOTY2LVxcdTA5NkZcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N0ZcXHUwOTgxLVxcdTA5ODNcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJDLVxcdTA5QzRcXHUwOUM3XFx1MDlDOFxcdTA5Q0ItXFx1MDlDRVxcdTA5RDdcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFM1xcdTA5RTYtXFx1MDlGMVxcdTBBMDEtXFx1MEEwM1xcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEEzQ1xcdTBBM0UtXFx1MEE0MlxcdTBBNDdcXHUwQTQ4XFx1MEE0Qi1cXHUwQTREXFx1MEE1MVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTY2LVxcdTBBNzVcXHUwQTgxLVxcdTBBODNcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkMtXFx1MEFDNVxcdTBBQzctXFx1MEFDOVxcdTBBQ0ItXFx1MEFDRFxcdTBBRDBcXHUwQUUwLVxcdTBBRTNcXHUwQUU2LVxcdTBBRUZcXHUwQjAxLVxcdTBCMDNcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzQy1cXHUwQjQ0XFx1MEI0N1xcdTBCNDhcXHUwQjRCLVxcdTBCNERcXHUwQjU2XFx1MEI1N1xcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYzXFx1MEI2Ni1cXHUwQjZGXFx1MEI3MVxcdTBCODJcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCQkUtXFx1MEJDMlxcdTBCQzYtXFx1MEJDOFxcdTBCQ0EtXFx1MEJDRFxcdTBCRDBcXHUwQkQ3XFx1MEJFNi1cXHUwQkVGXFx1MEMwMS1cXHUwQzAzXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzMzXFx1MEMzNS1cXHUwQzM5XFx1MEMzRC1cXHUwQzQ0XFx1MEM0Ni1cXHUwQzQ4XFx1MEM0QS1cXHUwQzREXFx1MEM1NVxcdTBDNTZcXHUwQzU4XFx1MEM1OVxcdTBDNjAtXFx1MEM2M1xcdTBDNjYtXFx1MEM2RlxcdTBDODJcXHUwQzgzXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCQy1cXHUwQ0M0XFx1MENDNi1cXHUwQ0M4XFx1MENDQS1cXHUwQ0NEXFx1MENENVxcdTBDRDZcXHUwQ0RFXFx1MENFMC1cXHUwQ0UzXFx1MENFNi1cXHUwQ0VGXFx1MENGMVxcdTBDRjJcXHUwRDAyXFx1MEQwM1xcdTBEMDUtXFx1MEQwQ1xcdTBEMEUtXFx1MEQxMFxcdTBEMTItXFx1MEQzQVxcdTBEM0QtXFx1MEQ0NFxcdTBENDYtXFx1MEQ0OFxcdTBENEEtXFx1MEQ0RVxcdTBENTdcXHUwRDYwLVxcdTBENjNcXHUwRDY2LVxcdTBENkZcXHUwRDdBLVxcdTBEN0ZcXHUwRDgyXFx1MEQ4M1xcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwRENBXFx1MERDRi1cXHUwREQ0XFx1MERENlxcdTBERDgtXFx1MERERlxcdTBERjJcXHUwREYzXFx1MEUwMS1cXHUwRTNBXFx1MEU0MC1cXHUwRTRFXFx1MEU1MC1cXHUwRTU5XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjlcXHUwRUJCLVxcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVDOC1cXHUwRUNEXFx1MEVEMC1cXHUwRUQ5XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGMThcXHUwRjE5XFx1MEYyMC1cXHUwRjI5XFx1MEYzNVxcdTBGMzdcXHUwRjM5XFx1MEYzRS1cXHUwRjQ3XFx1MEY0OS1cXHUwRjZDXFx1MEY3MS1cXHUwRjg0XFx1MEY4Ni1cXHUwRjk3XFx1MEY5OS1cXHUwRkJDXFx1MEZDNlxcdTEwMDAtXFx1MTA0OVxcdTEwNTAtXFx1MTA5RFxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzVELVxcdTEzNUZcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNkVFLVxcdTE2RjBcXHUxNzAwLVxcdTE3MENcXHUxNzBFLVxcdTE3MTRcXHUxNzIwLVxcdTE3MzRcXHUxNzQwLVxcdTE3NTNcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdEM1xcdTE3RDdcXHUxN0RDXFx1MTdERFxcdTE3RTAtXFx1MTdFOVxcdTE4MEItXFx1MTgwRFxcdTE4MTAtXFx1MTgxOVxcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxQ1xcdTE5MjAtXFx1MTkyQlxcdTE5MzAtXFx1MTkzQlxcdTE5NDYtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QjAtXFx1MTlDOVxcdTE5RDAtXFx1MTlEOVxcdTFBMDAtXFx1MUExQlxcdTFBMjAtXFx1MUE1RVxcdTFBNjAtXFx1MUE3Q1xcdTFBN0YtXFx1MUE4OVxcdTFBOTAtXFx1MUE5OVxcdTFBQTdcXHUxQjAwLVxcdTFCNEJcXHUxQjUwLVxcdTFCNTlcXHUxQjZCLVxcdTFCNzNcXHUxQjgwLVxcdTFCRjNcXHUxQzAwLVxcdTFDMzdcXHUxQzQwLVxcdTFDNDlcXHUxQzRELVxcdTFDN0RcXHUxQ0QwLVxcdTFDRDJcXHUxQ0Q0LVxcdTFDRjZcXHUxRDAwLVxcdTFERTZcXHUxREZDLVxcdTFGMTVcXHUxRjE4LVxcdTFGMURcXHUxRjIwLVxcdTFGNDVcXHUxRjQ4LVxcdTFGNERcXHUxRjUwLVxcdTFGNTdcXHUxRjU5XFx1MUY1QlxcdTFGNURcXHUxRjVGLVxcdTFGN0RcXHUxRjgwLVxcdTFGQjRcXHUxRkI2LVxcdTFGQkNcXHUxRkJFXFx1MUZDMi1cXHUxRkM0XFx1MUZDNi1cXHUxRkNDXFx1MUZEMC1cXHUxRkQzXFx1MUZENi1cXHUxRkRCXFx1MUZFMC1cXHUxRkVDXFx1MUZGMi1cXHUxRkY0XFx1MUZGNi1cXHUxRkZDXFx1MjAwQ1xcdTIwMERcXHUyMDNGXFx1MjA0MFxcdTIwNTRcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIwRDAtXFx1MjBEQ1xcdTIwRTFcXHUyMEU1LVxcdTIwRjBcXHUyMTAyXFx1MjEwN1xcdTIxMEEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMURcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJBLVxcdTIxMkRcXHUyMTJGLVxcdTIxMzlcXHUyMTNDLVxcdTIxM0ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRFXFx1MjE2MC1cXHUyMTg4XFx1MkMwMC1cXHUyQzJFXFx1MkMzMC1cXHUyQzVFXFx1MkM2MC1cXHUyQ0U0XFx1MkNFQi1cXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ3Ri1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkRFMC1cXHUyREZGXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyRlxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOTlcXHUzMDlBXFx1MzA5RC1cXHUzMDlGXFx1MzBBMS1cXHUzMEZBXFx1MzBGQy1cXHUzMEZGXFx1MzEwNS1cXHUzMTJEXFx1MzEzMS1cXHUzMThFXFx1MzFBMC1cXHUzMUJBXFx1MzFGMC1cXHUzMUZGXFx1MzQwMC1cXHU0REI1XFx1NEUwMC1cXHU5RkNDXFx1QTAwMC1cXHVBNDhDXFx1QTREMC1cXHVBNEZEXFx1QTUwMC1cXHVBNjBDXFx1QTYxMC1cXHVBNjJCXFx1QTY0MC1cXHVBNjZGXFx1QTY3NC1cXHVBNjdEXFx1QTY3Ri1cXHVBNjk3XFx1QTY5Ri1cXHVBNkYxXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBNzkzXFx1QTdBMC1cXHVBN0FBXFx1QTdGOC1cXHVBODI3XFx1QTg0MC1cXHVBODczXFx1QTg4MC1cXHVBOEM0XFx1QThEMC1cXHVBOEQ5XFx1QThFMC1cXHVBOEY3XFx1QThGQlxcdUE5MDAtXFx1QTkyRFxcdUE5MzAtXFx1QTk1M1xcdUE5NjAtXFx1QTk3Q1xcdUE5ODAtXFx1QTlDMFxcdUE5Q0YtXFx1QTlEOVxcdUFBMDAtXFx1QUEzNlxcdUFBNDAtXFx1QUE0RFxcdUFBNTAtXFx1QUE1OVxcdUFBNjAtXFx1QUE3NlxcdUFBN0FcXHVBQTdCXFx1QUE4MC1cXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVGXFx1QUFGMi1cXHVBQUY2XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUJDMC1cXHVBQkVBXFx1QUJFQ1xcdUFCRURcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFELVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFMDAtXFx1RkUwRlxcdUZFMjAtXFx1RkUyNlxcdUZFMzNcXHVGRTM0XFx1RkU0RC1cXHVGRTRGXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkYzRlxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpc0RlY2ltYWxEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gKGNoID49IDQ4ICYmIGNoIDw9IDU3KTsgICAvLyAwLi45XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gaXNEZWNpbWFsRGlnaXQoY2gpIHx8ICg5NyA8PSBjaCAmJiBjaCA8PSAxMDIpIHx8ICg2NSA8PSBjaCAmJiBjaCA8PSA3MCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNPY3RhbERpZ2l0KGNoKSB7XG4gICAgICAgIHJldHVybiAoY2ggPj0gNDggJiYgY2ggPD0gNTUpOyAgIC8vIDAuLjdcbiAgICB9XG5cbiAgICAvLyA3LjIgV2hpdGUgU3BhY2VcblxuICAgIGZ1bmN0aW9uIGlzV2hpdGVTcGFjZShjaCkge1xuICAgICAgICByZXR1cm4gKGNoID09PSAweDIwKSB8fCAoY2ggPT09IDB4MDkpIHx8IChjaCA9PT0gMHgwQikgfHwgKGNoID09PSAweDBDKSB8fCAoY2ggPT09IDB4QTApIHx8XG4gICAgICAgICAgICAoY2ggPj0gMHgxNjgwICYmIFsweDE2ODAsIDB4MTgwRSwgMHgyMDAwLCAweDIwMDEsIDB4MjAwMiwgMHgyMDAzLCAweDIwMDQsIDB4MjAwNSwgMHgyMDA2LCAweDIwMDcsIDB4MjAwOCwgMHgyMDA5LCAweDIwMEEsIDB4MjAyRiwgMHgyMDVGLCAweDMwMDAsIDB4RkVGRl0uaW5kZXhPZihjaCkgPj0gMCk7XG4gICAgfVxuXG4gICAgLy8gNy4zIExpbmUgVGVybWluYXRvcnNcblxuICAgIGZ1bmN0aW9uIGlzTGluZVRlcm1pbmF0b3IoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gMHgwQSkgfHwgKGNoID09PSAweDBEKSB8fCAoY2ggPT09IDB4MjAyOCkgfHwgKGNoID09PSAweDIwMjkpO1xuICAgIH1cblxuICAgIC8vIDcuNiBJZGVudGlmaWVyIE5hbWVzIGFuZCBJZGVudGlmaWVyc1xuXG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyU3RhcnQoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gMzYpIHx8IChjaCA9PT0gOTUpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgICAgKGNoID49IDY1ICYmIGNoIDw9IDkwKSB8fCAgICAgICAgIC8vIEEuLlpcbiAgICAgICAgICAgIChjaCA+PSA5NyAmJiBjaCA8PSAxMjIpIHx8ICAgICAgICAvLyBhLi56XG4gICAgICAgICAgICAoY2ggPT09IDkyKSB8fCAgICAgICAgICAgICAgICAgICAgLy8gXFwgKGJhY2tzbGFzaClcbiAgICAgICAgICAgICgoY2ggPj0gMHg4MCkgJiYgUmVnZXguTm9uQXNjaWlJZGVudGlmaWVyU3RhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllclBhcnQoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gMzYpIHx8IChjaCA9PT0gOTUpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgICAgKGNoID49IDY1ICYmIGNoIDw9IDkwKSB8fCAgICAgICAgIC8vIEEuLlpcbiAgICAgICAgICAgIChjaCA+PSA5NyAmJiBjaCA8PSAxMjIpIHx8ICAgICAgICAvLyBhLi56XG4gICAgICAgICAgICAoY2ggPj0gNDggJiYgY2ggPD0gNTcpIHx8ICAgICAgICAgLy8gMC4uOVxuICAgICAgICAgICAgKGNoID09PSA5MikgfHwgICAgICAgICAgICAgICAgICAgIC8vIFxcIChiYWNrc2xhc2gpXG4gICAgICAgICAgICAoKGNoID49IDB4ODApICYmIFJlZ2V4Lk5vbkFzY2lpSWRlbnRpZmllclBhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBpc0RlY2ltYWxEaWdpdDogaXNEZWNpbWFsRGlnaXQsXG4gICAgICAgIGlzSGV4RGlnaXQ6IGlzSGV4RGlnaXQsXG4gICAgICAgIGlzT2N0YWxEaWdpdDogaXNPY3RhbERpZ2l0LFxuICAgICAgICBpc1doaXRlU3BhY2U6IGlzV2hpdGVTcGFjZSxcbiAgICAgICAgaXNMaW5lVGVybWluYXRvcjogaXNMaW5lVGVybWluYXRvcixcbiAgICAgICAgaXNJZGVudGlmaWVyU3RhcnQ6IGlzSWRlbnRpZmllclN0YXJ0LFxuICAgICAgICBpc0lkZW50aWZpZXJQYXJ0OiBpc0lkZW50aWZpZXJQYXJ0XG4gICAgfTtcbn0oKSk7XG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEzIFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjb2RlID0gcmVxdWlyZSgnLi9jb2RlJyk7XG5cbiAgICBmdW5jdGlvbiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzYoaWQpIHtcbiAgICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgICBjYXNlICdpbXBsZW1lbnRzJzpcbiAgICAgICAgY2FzZSAnaW50ZXJmYWNlJzpcbiAgICAgICAgY2FzZSAncGFja2FnZSc6XG4gICAgICAgIGNhc2UgJ3ByaXZhdGUnOlxuICAgICAgICBjYXNlICdwcm90ZWN0ZWQnOlxuICAgICAgICBjYXNlICdwdWJsaWMnOlxuICAgICAgICBjYXNlICdzdGF0aWMnOlxuICAgICAgICBjYXNlICdsZXQnOlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0tleXdvcmRFUzUoaWQsIHN0cmljdCkge1xuICAgICAgICAvLyB5aWVsZCBzaG91bGQgbm90IGJlIHRyZWF0ZWQgYXMga2V5d29yZCB1bmRlciBub24tc3RyaWN0IG1vZGUuXG4gICAgICAgIGlmICghc3RyaWN0ICYmIGlkID09PSAneWllbGQnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzS2V5d29yZEVTNihpZCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0tleXdvcmRFUzYoaWQsIHN0cmljdCkge1xuICAgICAgICBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZEVTNihpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2lmJykgfHwgKGlkID09PSAnaW4nKSB8fCAoaWQgPT09ICdkbycpO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKGlkID09PSAndmFyJykgfHwgKGlkID09PSAnZm9yJykgfHwgKGlkID09PSAnbmV3JykgfHwgKGlkID09PSAndHJ5Jyk7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiAoaWQgPT09ICd0aGlzJykgfHwgKGlkID09PSAnZWxzZScpIHx8IChpZCA9PT0gJ2Nhc2UnKSB8fFxuICAgICAgICAgICAgICAgIChpZCA9PT0gJ3ZvaWQnKSB8fCAoaWQgPT09ICd3aXRoJykgfHwgKGlkID09PSAnZW51bScpO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICByZXR1cm4gKGlkID09PSAnd2hpbGUnKSB8fCAoaWQgPT09ICdicmVhaycpIHx8IChpZCA9PT0gJ2NhdGNoJykgfHxcbiAgICAgICAgICAgICAgICAoaWQgPT09ICd0aHJvdycpIHx8IChpZCA9PT0gJ2NvbnN0JykgfHwgKGlkID09PSAneWllbGQnKSB8fFxuICAgICAgICAgICAgICAgIChpZCA9PT0gJ2NsYXNzJykgfHwgKGlkID09PSAnc3VwZXInKTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3JldHVybicpIHx8IChpZCA9PT0gJ3R5cGVvZicpIHx8IChpZCA9PT0gJ2RlbGV0ZScpIHx8XG4gICAgICAgICAgICAgICAgKGlkID09PSAnc3dpdGNoJykgfHwgKGlkID09PSAnZXhwb3J0JykgfHwgKGlkID09PSAnaW1wb3J0Jyk7XG4gICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHJldHVybiAoaWQgPT09ICdkZWZhdWx0JykgfHwgKGlkID09PSAnZmluYWxseScpIHx8IChpZCA9PT0gJ2V4dGVuZHMnKTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2Z1bmN0aW9uJykgfHwgKGlkID09PSAnY29udGludWUnKSB8fCAoaWQgPT09ICdkZWJ1Z2dlcicpO1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2luc3RhbmNlb2YnKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUmVzdHJpY3RlZFdvcmQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkID09PSAnZXZhbCcgfHwgaWQgPT09ICdhcmd1bWVudHMnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllck5hbWUoaWQpIHtcbiAgICAgICAgdmFyIGksIGl6LCBjaDtcblxuICAgICAgICBpZiAoaWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjaCA9IGlkLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgIGlmICghY29kZS5pc0lkZW50aWZpZXJTdGFydChjaCkgfHwgY2ggPT09IDkyKSB7ICAvLyBcXCAoYmFja3NsYXNoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMSwgaXogPSBpZC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBjaCA9IGlkLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgICAgICBpZiAoIWNvZGUuaXNJZGVudGlmaWVyUGFydChjaCkgfHwgY2ggPT09IDkyKSB7ICAvLyBcXCAoYmFja3NsYXNoKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgaXNLZXl3b3JkRVM1OiBpc0tleXdvcmRFUzUsXG4gICAgICAgIGlzS2V5d29yZEVTNjogaXNLZXl3b3JkRVM2LFxuICAgICAgICBpc1Jlc3RyaWN0ZWRXb3JkOiBpc1Jlc3RyaWN0ZWRXb3JkLFxuICAgICAgICBpc0lkZW50aWZpZXJOYW1lOiBpc0lkZW50aWZpZXJOYW1lXG4gICAgfTtcbn0oKSk7XG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEzIFl1c3VrZSBTdXp1a2kgPHV0YXRhbmUudGVhQGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZXhwb3J0cy5jb2RlID0gcmVxdWlyZSgnLi9jb2RlJyk7XG4gICAgZXhwb3J0cy5rZXl3b3JkID0gcmVxdWlyZSgnLi9rZXl3b3JkJyk7XG59KCkpO1xuLyogdmltOiBzZXQgc3c9NCB0cz00IGV0IHR3PTgwIDogKi9cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRS50eHQgb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKi9cbmV4cG9ydHMuU291cmNlTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9zb3VyY2UtbWFwL3NvdXJjZS1tYXAtZ2VuZXJhdG9yJykuU291cmNlTWFwR2VuZXJhdG9yO1xuZXhwb3J0cy5Tb3VyY2VNYXBDb25zdW1lciA9IHJlcXVpcmUoJy4vc291cmNlLW1hcC9zb3VyY2UtbWFwLWNvbnN1bWVyJykuU291cmNlTWFwQ29uc3VtZXI7XG5leHBvcnRzLlNvdXJjZU5vZGUgPSByZXF1aXJlKCcuL3NvdXJjZS1tYXAvc291cmNlLW5vZGUnKS5Tb3VyY2VOb2RlO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIC8qKlxuICAgKiBBIGRhdGEgc3RydWN0dXJlIHdoaWNoIGlzIGEgY29tYmluYXRpb24gb2YgYW4gYXJyYXkgYW5kIGEgc2V0LiBBZGRpbmcgYSBuZXdcbiAgICogbWVtYmVyIGlzIE8oMSksIHRlc3RpbmcgZm9yIG1lbWJlcnNoaXAgaXMgTygxKSwgYW5kIGZpbmRpbmcgdGhlIGluZGV4IG9mIGFuXG4gICAqIGVsZW1lbnQgaXMgTygxKS4gUmVtb3ZpbmcgZWxlbWVudHMgZnJvbSB0aGUgc2V0IGlzIG5vdCBzdXBwb3J0ZWQuIE9ubHlcbiAgICogc3RyaW5ncyBhcmUgc3VwcG9ydGVkIGZvciBtZW1iZXJzaGlwLlxuICAgKi9cbiAgZnVuY3Rpb24gQXJyYXlTZXQoKSB7XG4gICAgdGhpcy5fYXJyYXkgPSBbXTtcbiAgICB0aGlzLl9zZXQgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGF0aWMgbWV0aG9kIGZvciBjcmVhdGluZyBBcnJheVNldCBpbnN0YW5jZXMgZnJvbSBhbiBleGlzdGluZyBhcnJheS5cbiAgICovXG4gIEFycmF5U2V0LmZyb21BcnJheSA9IGZ1bmN0aW9uIEFycmF5U2V0X2Zyb21BcnJheShhQXJyYXksIGFBbGxvd0R1cGxpY2F0ZXMpIHtcbiAgICB2YXIgc2V0ID0gbmV3IEFycmF5U2V0KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFBcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgc2V0LmFkZChhQXJyYXlbaV0sIGFBbGxvd0R1cGxpY2F0ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gc2V0O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgdGhlIGdpdmVuIHN0cmluZyB0byB0aGlzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIFN0cmluZyBhU3RyXG4gICAqL1xuICBBcnJheVNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gQXJyYXlTZXRfYWRkKGFTdHIsIGFBbGxvd0R1cGxpY2F0ZXMpIHtcbiAgICB2YXIgaXNEdXBsaWNhdGUgPSB0aGlzLmhhcyhhU3RyKTtcbiAgICB2YXIgaWR4ID0gdGhpcy5fYXJyYXkubGVuZ3RoO1xuICAgIGlmICghaXNEdXBsaWNhdGUgfHwgYUFsbG93RHVwbGljYXRlcykge1xuICAgICAgdGhpcy5fYXJyYXkucHVzaChhU3RyKTtcbiAgICB9XG4gICAgaWYgKCFpc0R1cGxpY2F0ZSkge1xuICAgICAgdGhpcy5fc2V0W3V0aWwudG9TZXRTdHJpbmcoYVN0cildID0gaWR4O1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogSXMgdGhlIGdpdmVuIHN0cmluZyBhIG1lbWJlciBvZiB0aGlzIHNldD9cbiAgICpcbiAgICogQHBhcmFtIFN0cmluZyBhU3RyXG4gICAqL1xuICBBcnJheVNldC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gQXJyYXlTZXRfaGFzKGFTdHIpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuX3NldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwudG9TZXRTdHJpbmcoYVN0cikpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXaGF0IGlzIHRoZSBpbmRleCBvZiB0aGUgZ2l2ZW4gc3RyaW5nIGluIHRoZSBhcnJheT9cbiAgICpcbiAgICogQHBhcmFtIFN0cmluZyBhU3RyXG4gICAqL1xuICBBcnJheVNldC5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIEFycmF5U2V0X2luZGV4T2YoYVN0cikge1xuICAgIGlmICh0aGlzLmhhcyhhU3RyKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldFt1dGlsLnRvU2V0U3RyaW5nKGFTdHIpXTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhU3RyICsgJ1wiIGlzIG5vdCBpbiB0aGUgc2V0LicpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXaGF0IGlzIHRoZSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleD9cbiAgICpcbiAgICogQHBhcmFtIE51bWJlciBhSWR4XG4gICAqL1xuICBBcnJheVNldC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBBcnJheVNldF9hdChhSWR4KSB7XG4gICAgaWYgKGFJZHggPj0gMCAmJiBhSWR4IDwgdGhpcy5fYXJyYXkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXJyYXlbYUlkeF07XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignTm8gZWxlbWVudCBpbmRleGVkIGJ5ICcgKyBhSWR4KTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBzZXQgKHdoaWNoIGhhcyB0aGUgcHJvcGVyIGluZGljZXNcbiAgICogaW5kaWNhdGVkIGJ5IGluZGV4T2YpLiBOb3RlIHRoYXQgdGhpcyBpcyBhIGNvcHkgb2YgdGhlIGludGVybmFsIGFycmF5IHVzZWRcbiAgICogZm9yIHN0b3JpbmcgdGhlIG1lbWJlcnMgc28gdGhhdCBubyBvbmUgY2FuIG1lc3Mgd2l0aCBpbnRlcm5hbCBzdGF0ZS5cbiAgICovXG4gIEFycmF5U2V0LnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gQXJyYXlTZXRfdG9BcnJheSgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXJyYXkuc2xpY2UoKTtcbiAgfTtcblxuICBleHBvcnRzLkFycmF5U2V0ID0gQXJyYXlTZXQ7XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqXG4gKiBCYXNlZCBvbiB0aGUgQmFzZSA2NCBWTFEgaW1wbGVtZW50YXRpb24gaW4gQ2xvc3VyZSBDb21waWxlcjpcbiAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2xvc3VyZS1jb21waWxlci9zb3VyY2UvYnJvd3NlL3RydW5rL3NyYy9jb20vZ29vZ2xlL2RlYnVnZ2luZy9zb3VyY2VtYXAvQmFzZTY0VkxRLmphdmFcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMSBUaGUgQ2xvc3VyZSBDb21waWxlciBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlXG4gKiBtZXQ6XG4gKlxuICogICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmVcbiAqICAgIGNvcHlyaWdodCBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nXG4gKiAgICBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWRcbiAqICAgIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgR29vZ2xlIEluYy4gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICAgIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZFxuICogICAgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlNcbiAqIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1RcbiAqIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUlxuICogQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFRcbiAqIE9XTkVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLFxuICogU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVFxuICogTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsXG4gKiBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTllcbiAqIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAqIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICogT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgYmFzZTY0ID0gcmVxdWlyZSgnLi9iYXNlNjQnKTtcblxuICAvLyBBIHNpbmdsZSBiYXNlIDY0IGRpZ2l0IGNhbiBjb250YWluIDYgYml0cyBvZiBkYXRhLiBGb3IgdGhlIGJhc2UgNjQgdmFyaWFibGVcbiAgLy8gbGVuZ3RoIHF1YW50aXRpZXMgd2UgdXNlIGluIHRoZSBzb3VyY2UgbWFwIHNwZWMsIHRoZSBmaXJzdCBiaXQgaXMgdGhlIHNpZ24sXG4gIC8vIHRoZSBuZXh0IGZvdXIgYml0cyBhcmUgdGhlIGFjdHVhbCB2YWx1ZSwgYW5kIHRoZSA2dGggYml0IGlzIHRoZVxuICAvLyBjb250aW51YXRpb24gYml0LiBUaGUgY29udGludWF0aW9uIGJpdCB0ZWxscyB1cyB3aGV0aGVyIHRoZXJlIGFyZSBtb3JlXG4gIC8vIGRpZ2l0cyBpbiB0aGlzIHZhbHVlIGZvbGxvd2luZyB0aGlzIGRpZ2l0LlxuICAvL1xuICAvLyAgIENvbnRpbnVhdGlvblxuICAvLyAgIHwgICAgU2lnblxuICAvLyAgIHwgICAgfFxuICAvLyAgIFYgICAgVlxuICAvLyAgIDEwMTAxMVxuXG4gIHZhciBWTFFfQkFTRV9TSElGVCA9IDU7XG5cbiAgLy8gYmluYXJ5OiAxMDAwMDBcbiAgdmFyIFZMUV9CQVNFID0gMSA8PCBWTFFfQkFTRV9TSElGVDtcblxuICAvLyBiaW5hcnk6IDAxMTExMVxuICB2YXIgVkxRX0JBU0VfTUFTSyA9IFZMUV9CQVNFIC0gMTtcblxuICAvLyBiaW5hcnk6IDEwMDAwMFxuICB2YXIgVkxRX0NPTlRJTlVBVElPTl9CSVQgPSBWTFFfQkFTRTtcblxuICAvKipcbiAgICogQ29udmVydHMgZnJvbSBhIHR3by1jb21wbGVtZW50IHZhbHVlIHRvIGEgdmFsdWUgd2hlcmUgdGhlIHNpZ24gYml0IGlzXG4gICAqIGlzIHBsYWNlZCBpbiB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgYml0LiAgRm9yIGV4YW1wbGUsIGFzIGRlY2ltYWxzOlxuICAgKiAgIDEgYmVjb21lcyAyICgxMCBiaW5hcnkpLCAtMSBiZWNvbWVzIDMgKDExIGJpbmFyeSlcbiAgICogICAyIGJlY29tZXMgNCAoMTAwIGJpbmFyeSksIC0yIGJlY29tZXMgNSAoMTAxIGJpbmFyeSlcbiAgICovXG4gIGZ1bmN0aW9uIHRvVkxRU2lnbmVkKGFWYWx1ZSkge1xuICAgIHJldHVybiBhVmFsdWUgPCAwXG4gICAgICA/ICgoLWFWYWx1ZSkgPDwgMSkgKyAxXG4gICAgICA6IChhVmFsdWUgPDwgMSkgKyAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRvIGEgdHdvLWNvbXBsZW1lbnQgdmFsdWUgZnJvbSBhIHZhbHVlIHdoZXJlIHRoZSBzaWduIGJpdCBpc1xuICAgKiBpcyBwbGFjZWQgaW4gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdC4gIEZvciBleGFtcGxlLCBhcyBkZWNpbWFsczpcbiAgICogICAyICgxMCBiaW5hcnkpIGJlY29tZXMgMSwgMyAoMTEgYmluYXJ5KSBiZWNvbWVzIC0xXG4gICAqICAgNCAoMTAwIGJpbmFyeSkgYmVjb21lcyAyLCA1ICgxMDEgYmluYXJ5KSBiZWNvbWVzIC0yXG4gICAqL1xuICBmdW5jdGlvbiBmcm9tVkxRU2lnbmVkKGFWYWx1ZSkge1xuICAgIHZhciBpc05lZ2F0aXZlID0gKGFWYWx1ZSAmIDEpID09PSAxO1xuICAgIHZhciBzaGlmdGVkID0gYVZhbHVlID4+IDE7XG4gICAgcmV0dXJuIGlzTmVnYXRpdmVcbiAgICAgID8gLXNoaWZ0ZWRcbiAgICAgIDogc2hpZnRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBiYXNlIDY0IFZMUSBlbmNvZGVkIHZhbHVlLlxuICAgKi9cbiAgZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiBiYXNlNjRWTFFfZW5jb2RlKGFWYWx1ZSkge1xuICAgIHZhciBlbmNvZGVkID0gXCJcIjtcbiAgICB2YXIgZGlnaXQ7XG5cbiAgICB2YXIgdmxxID0gdG9WTFFTaWduZWQoYVZhbHVlKTtcblxuICAgIGRvIHtcbiAgICAgIGRpZ2l0ID0gdmxxICYgVkxRX0JBU0VfTUFTSztcbiAgICAgIHZscSA+Pj49IFZMUV9CQVNFX1NISUZUO1xuICAgICAgaWYgKHZscSA+IDApIHtcbiAgICAgICAgLy8gVGhlcmUgYXJlIHN0aWxsIG1vcmUgZGlnaXRzIGluIHRoaXMgdmFsdWUsIHNvIHdlIG11c3QgbWFrZSBzdXJlIHRoZVxuICAgICAgICAvLyBjb250aW51YXRpb24gYml0IGlzIG1hcmtlZC5cbiAgICAgICAgZGlnaXQgfD0gVkxRX0NPTlRJTlVBVElPTl9CSVQ7XG4gICAgICB9XG4gICAgICBlbmNvZGVkICs9IGJhc2U2NC5lbmNvZGUoZGlnaXQpO1xuICAgIH0gd2hpbGUgKHZscSA+IDApO1xuXG4gICAgcmV0dXJuIGVuY29kZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY29kZXMgdGhlIG5leHQgYmFzZSA2NCBWTFEgdmFsdWUgZnJvbSB0aGUgZ2l2ZW4gc3RyaW5nIGFuZCByZXR1cm5zIHRoZVxuICAgKiB2YWx1ZSBhbmQgdGhlIHJlc3Qgb2YgdGhlIHN0cmluZy5cbiAgICovXG4gIGV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0VkxRX2RlY29kZShhU3RyKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzdHJMZW4gPSBhU3RyLmxlbmd0aDtcbiAgICB2YXIgcmVzdWx0ID0gMDtcbiAgICB2YXIgc2hpZnQgPSAwO1xuICAgIHZhciBjb250aW51YXRpb24sIGRpZ2l0O1xuXG4gICAgZG8ge1xuICAgICAgaWYgKGkgPj0gc3RyTGVuKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIG1vcmUgZGlnaXRzIGluIGJhc2UgNjQgVkxRIHZhbHVlLlwiKTtcbiAgICAgIH1cbiAgICAgIGRpZ2l0ID0gYmFzZTY0LmRlY29kZShhU3RyLmNoYXJBdChpKyspKTtcbiAgICAgIGNvbnRpbnVhdGlvbiA9ICEhKGRpZ2l0ICYgVkxRX0NPTlRJTlVBVElPTl9CSVQpO1xuICAgICAgZGlnaXQgJj0gVkxRX0JBU0VfTUFTSztcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCArIChkaWdpdCA8PCBzaGlmdCk7XG4gICAgICBzaGlmdCArPSBWTFFfQkFTRV9TSElGVDtcbiAgICB9IHdoaWxlIChjb250aW51YXRpb24pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlOiBmcm9tVkxRU2lnbmVkKHJlc3VsdCksXG4gICAgICByZXN0OiBhU3RyLnNsaWNlKGkpXG4gICAgfTtcbiAgfTtcblxufSk7XG4iLCIvKiAtKi0gTW9kZToganM7IGpzLWluZGVudC1sZXZlbDogMjsgLSotICovXG4vKlxuICogQ29weXJpZ2h0IDIwMTEgTW96aWxsYSBGb3VuZGF0aW9uIGFuZCBjb250cmlidXRvcnNcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIGxpY2Vuc2UuIFNlZSBMSUNFTlNFIG9yOlxuICogaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL0JTRC0zLUNsYXVzZVxuICovXG5pZiAodHlwZW9mIGRlZmluZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBkZWZpbmUgPSByZXF1aXJlKCdhbWRlZmluZScpKG1vZHVsZSwgcmVxdWlyZSk7XG59XG5kZWZpbmUoZnVuY3Rpb24gKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG4gIHZhciBjaGFyVG9JbnRNYXAgPSB7fTtcbiAgdmFyIGludFRvQ2hhck1hcCA9IHt9O1xuXG4gICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuICAgIC5zcGxpdCgnJylcbiAgICAuZm9yRWFjaChmdW5jdGlvbiAoY2gsIGluZGV4KSB7XG4gICAgICBjaGFyVG9JbnRNYXBbY2hdID0gaW5kZXg7XG4gICAgICBpbnRUb0NoYXJNYXBbaW5kZXhdID0gY2g7XG4gICAgfSk7XG5cbiAgLyoqXG4gICAqIEVuY29kZSBhbiBpbnRlZ2VyIGluIHRoZSByYW5nZSBvZiAwIHRvIDYzIHRvIGEgc2luZ2xlIGJhc2UgNjQgZGlnaXQuXG4gICAqL1xuICBleHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NF9lbmNvZGUoYU51bWJlcikge1xuICAgIGlmIChhTnVtYmVyIGluIGludFRvQ2hhck1hcCkge1xuICAgICAgcmV0dXJuIGludFRvQ2hhck1hcFthTnVtYmVyXTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk11c3QgYmUgYmV0d2VlbiAwIGFuZCA2MzogXCIgKyBhTnVtYmVyKTtcbiAgfTtcblxuICAvKipcbiAgICogRGVjb2RlIGEgc2luZ2xlIGJhc2UgNjQgZGlnaXQgdG8gYW4gaW50ZWdlci5cbiAgICovXG4gIGV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0X2RlY29kZShhQ2hhcikge1xuICAgIGlmIChhQ2hhciBpbiBjaGFyVG9JbnRNYXApIHtcbiAgICAgIHJldHVybiBjaGFyVG9JbnRNYXBbYUNoYXJdO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTm90IGEgdmFsaWQgYmFzZSA2NCBkaWdpdDogXCIgKyBhQ2hhcik7XG4gIH07XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICAvKipcbiAgICogUmVjdXJzaXZlIGltcGxlbWVudGF0aW9uIG9mIGJpbmFyeSBzZWFyY2guXG4gICAqXG4gICAqIEBwYXJhbSBhTG93IEluZGljZXMgaGVyZSBhbmQgbG93ZXIgZG8gbm90IGNvbnRhaW4gdGhlIG5lZWRsZS5cbiAgICogQHBhcmFtIGFIaWdoIEluZGljZXMgaGVyZSBhbmQgaGlnaGVyIGRvIG5vdCBjb250YWluIHRoZSBuZWVkbGUuXG4gICAqIEBwYXJhbSBhTmVlZGxlIFRoZSBlbGVtZW50IGJlaW5nIHNlYXJjaGVkIGZvci5cbiAgICogQHBhcmFtIGFIYXlzdGFjayBUaGUgbm9uLWVtcHR5IGFycmF5IGJlaW5nIHNlYXJjaGVkLlxuICAgKiBAcGFyYW0gYUNvbXBhcmUgRnVuY3Rpb24gd2hpY2ggdGFrZXMgdHdvIGVsZW1lbnRzIGFuZCByZXR1cm5zIC0xLCAwLCBvciAxLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVjdXJzaXZlU2VhcmNoKGFMb3csIGFIaWdoLCBhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiB0ZXJtaW5hdGVzIHdoZW4gb25lIG9mIHRoZSBmb2xsb3dpbmcgaXMgdHJ1ZTpcbiAgICAvL1xuICAgIC8vICAgMS4gV2UgZmluZCB0aGUgZXhhY3QgZWxlbWVudCB3ZSBhcmUgbG9va2luZyBmb3IuXG4gICAgLy9cbiAgICAvLyAgIDIuIFdlIGRpZCBub3QgZmluZCB0aGUgZXhhY3QgZWxlbWVudCwgYnV0IHdlIGNhbiByZXR1cm4gdGhlIG5leHRcbiAgICAvLyAgICAgIGNsb3Nlc3QgZWxlbWVudCB0aGF0IGlzIGxlc3MgdGhhbiB0aGF0IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyAgIDMuIFdlIGRpZCBub3QgZmluZCB0aGUgZXhhY3QgZWxlbWVudCwgYW5kIHRoZXJlIGlzIG5vIG5leHQtY2xvc2VzdFxuICAgIC8vICAgICAgZWxlbWVudCB3aGljaCBpcyBsZXNzIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvciwgc28gd2VcbiAgICAvLyAgICAgIHJldHVybiBudWxsLlxuICAgIHZhciBtaWQgPSBNYXRoLmZsb29yKChhSGlnaCAtIGFMb3cpIC8gMikgKyBhTG93O1xuICAgIHZhciBjbXAgPSBhQ29tcGFyZShhTmVlZGxlLCBhSGF5c3RhY2tbbWlkXSwgdHJ1ZSk7XG4gICAgaWYgKGNtcCA9PT0gMCkge1xuICAgICAgLy8gRm91bmQgdGhlIGVsZW1lbnQgd2UgYXJlIGxvb2tpbmcgZm9yLlxuICAgICAgcmV0dXJuIGFIYXlzdGFja1ttaWRdO1xuICAgIH1cbiAgICBlbHNlIGlmIChjbXAgPiAwKSB7XG4gICAgICAvLyBhSGF5c3RhY2tbbWlkXSBpcyBncmVhdGVyIHRoYW4gb3VyIG5lZWRsZS5cbiAgICAgIGlmIChhSGlnaCAtIG1pZCA+IDEpIHtcbiAgICAgICAgLy8gVGhlIGVsZW1lbnQgaXMgaW4gdGhlIHVwcGVyIGhhbGYuXG4gICAgICAgIHJldHVybiByZWN1cnNpdmVTZWFyY2gobWlkLCBhSGlnaCwgYU5lZWRsZSwgYUhheXN0YWNrLCBhQ29tcGFyZSk7XG4gICAgICB9XG4gICAgICAvLyBXZSBkaWQgbm90IGZpbmQgYW4gZXhhY3QgbWF0Y2gsIHJldHVybiB0aGUgbmV4dCBjbG9zZXN0IG9uZVxuICAgICAgLy8gKHRlcm1pbmF0aW9uIGNhc2UgMikuXG4gICAgICByZXR1cm4gYUhheXN0YWNrW21pZF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gYUhheXN0YWNrW21pZF0gaXMgbGVzcyB0aGFuIG91ciBuZWVkbGUuXG4gICAgICBpZiAobWlkIC0gYUxvdyA+IDEpIHtcbiAgICAgICAgLy8gVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGxvd2VyIGhhbGYuXG4gICAgICAgIHJldHVybiByZWN1cnNpdmVTZWFyY2goYUxvdywgbWlkLCBhTmVlZGxlLCBhSGF5c3RhY2ssIGFDb21wYXJlKTtcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBleGFjdCBuZWVkbGUgZWxlbWVudCB3YXMgbm90IGZvdW5kIGluIHRoaXMgaGF5c3RhY2suIERldGVybWluZSBpZlxuICAgICAgLy8gd2UgYXJlIGluIHRlcm1pbmF0aW9uIGNhc2UgKDIpIG9yICgzKSBhbmQgcmV0dXJuIHRoZSBhcHByb3ByaWF0ZSB0aGluZy5cbiAgICAgIHJldHVybiBhTG93IDwgMFxuICAgICAgICA/IG51bGxcbiAgICAgICAgOiBhSGF5c3RhY2tbYUxvd107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgYmluYXJ5IHNlYXJjaCB3aGljaCB3aWxsIGFsd2F5cyB0cnkgYW5kIHJldHVyblxuICAgKiB0aGUgbmV4dCBsb3dlc3QgdmFsdWUgY2hlY2tlZCBpZiB0aGVyZSBpcyBubyBleGFjdCBoaXQuIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBtYXBwaW5ncyBiZXR3ZWVuIG9yaWdpbmFsIGFuZCBnZW5lcmF0ZWQgbGluZS9jb2wgcGFpcnMgYXJlIHNpbmdsZSBwb2ludHMsXG4gICAqIGFuZCB0aGVyZSBpcyBhbiBpbXBsaWNpdCByZWdpb24gYmV0d2VlbiBlYWNoIG9mIHRoZW0sIHNvIGEgbWlzcyBqdXN0IG1lYW5zXG4gICAqIHRoYXQgeW91IGFyZW4ndCBvbiB0aGUgdmVyeSBzdGFydCBvZiBhIHJlZ2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGFOZWVkbGUgVGhlIGVsZW1lbnQgeW91IGFyZSBsb29raW5nIGZvci5cbiAgICogQHBhcmFtIGFIYXlzdGFjayBUaGUgYXJyYXkgdGhhdCBpcyBiZWluZyBzZWFyY2hlZC5cbiAgICogQHBhcmFtIGFDb21wYXJlIEEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgdGhlIG5lZWRsZSBhbmQgYW4gZWxlbWVudCBpbiB0aGVcbiAgICogICAgIGFycmF5IGFuZCByZXR1cm5zIC0xLCAwLCBvciAxIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBuZWVkbGUgaXMgbGVzc1xuICAgKiAgICAgdGhhbiwgZXF1YWwgdG8sIG9yIGdyZWF0ZXIgdGhhbiB0aGUgZWxlbWVudCwgcmVzcGVjdGl2ZWx5LlxuICAgKi9cbiAgZXhwb3J0cy5zZWFyY2ggPSBmdW5jdGlvbiBzZWFyY2goYU5lZWRsZSwgYUhheXN0YWNrLCBhQ29tcGFyZSkge1xuICAgIHJldHVybiBhSGF5c3RhY2subGVuZ3RoID4gMFxuICAgICAgPyByZWN1cnNpdmVTZWFyY2goLTEsIGFIYXlzdGFjay5sZW5ndGgsIGFOZWVkbGUsIGFIYXlzdGFjaywgYUNvbXBhcmUpXG4gICAgICA6IG51bGw7XG4gIH07XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuICB2YXIgYmluYXJ5U2VhcmNoID0gcmVxdWlyZSgnLi9iaW5hcnktc2VhcmNoJyk7XG4gIHZhciBBcnJheVNldCA9IHJlcXVpcmUoJy4vYXJyYXktc2V0JykuQXJyYXlTZXQ7XG4gIHZhciBiYXNlNjRWTFEgPSByZXF1aXJlKCcuL2Jhc2U2NC12bHEnKTtcblxuICAvKipcbiAgICogQSBTb3VyY2VNYXBDb25zdW1lciBpbnN0YW5jZSByZXByZXNlbnRzIGEgcGFyc2VkIHNvdXJjZSBtYXAgd2hpY2ggd2UgY2FuXG4gICAqIHF1ZXJ5IGZvciBpbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JpZ2luYWwgZmlsZSBwb3NpdGlvbnMgYnkgZ2l2aW5nIGl0IGEgZmlsZVxuICAgKiBwb3NpdGlvbiBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAgICpcbiAgICogVGhlIG9ubHkgcGFyYW1ldGVyIGlzIHRoZSByYXcgc291cmNlIG1hcCAoZWl0aGVyIGFzIGEgSlNPTiBzdHJpbmcsIG9yXG4gICAqIGFscmVhZHkgcGFyc2VkIHRvIGFuIG9iamVjdCkuIEFjY29yZGluZyB0byB0aGUgc3BlYywgc291cmNlIG1hcHMgaGF2ZSB0aGVcbiAgICogZm9sbG93aW5nIGF0dHJpYnV0ZXM6XG4gICAqXG4gICAqICAgLSB2ZXJzaW9uOiBXaGljaCB2ZXJzaW9uIG9mIHRoZSBzb3VyY2UgbWFwIHNwZWMgdGhpcyBtYXAgaXMgZm9sbG93aW5nLlxuICAgKiAgIC0gc291cmNlczogQW4gYXJyYXkgb2YgVVJMcyB0byB0aGUgb3JpZ2luYWwgc291cmNlIGZpbGVzLlxuICAgKiAgIC0gbmFtZXM6IEFuIGFycmF5IG9mIGlkZW50aWZpZXJzIHdoaWNoIGNhbiBiZSByZWZlcnJlbmNlZCBieSBpbmRpdmlkdWFsIG1hcHBpbmdzLlxuICAgKiAgIC0gc291cmNlUm9vdDogT3B0aW9uYWwuIFRoZSBVUkwgcm9vdCBmcm9tIHdoaWNoIGFsbCBzb3VyY2VzIGFyZSByZWxhdGl2ZS5cbiAgICogICAtIHNvdXJjZXNDb250ZW50OiBPcHRpb25hbC4gQW4gYXJyYXkgb2YgY29udGVudHMgb2YgdGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlcy5cbiAgICogICAtIG1hcHBpbmdzOiBBIHN0cmluZyBvZiBiYXNlNjQgVkxRcyB3aGljaCBjb250YWluIHRoZSBhY3R1YWwgbWFwcGluZ3MuXG4gICAqICAgLSBmaWxlOiBPcHRpb25hbC4gVGhlIGdlbmVyYXRlZCBmaWxlIHRoaXMgc291cmNlIG1hcCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqXG4gICAqIEhlcmUgaXMgYW4gZXhhbXBsZSBzb3VyY2UgbWFwLCB0YWtlbiBmcm9tIHRoZSBzb3VyY2UgbWFwIHNwZWNbMF06XG4gICAqXG4gICAqICAgICB7XG4gICAqICAgICAgIHZlcnNpb24gOiAzLFxuICAgKiAgICAgICBmaWxlOiBcIm91dC5qc1wiLFxuICAgKiAgICAgICBzb3VyY2VSb290IDogXCJcIixcbiAgICogICAgICAgc291cmNlczogW1wiZm9vLmpzXCIsIFwiYmFyLmpzXCJdLFxuICAgKiAgICAgICBuYW1lczogW1wic3JjXCIsIFwibWFwc1wiLCBcImFyZVwiLCBcImZ1blwiXSxcbiAgICogICAgICAgbWFwcGluZ3M6IFwiQUEsQUI7O0FCQ0RFO1wiXG4gICAqICAgICB9XG4gICAqXG4gICAqIFswXTogaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZG9jdW1lbnQvZC8xVTFSR0FlaFF3UnlwVVRvdkYxS1JscGlPRnplMGItXzJnYzZmQUgwS1kway9lZGl0P3BsaT0xI1xuICAgKi9cbiAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXIoYVNvdXJjZU1hcCkge1xuICAgIHZhciBzb3VyY2VNYXAgPSBhU291cmNlTWFwO1xuICAgIGlmICh0eXBlb2YgYVNvdXJjZU1hcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNvdXJjZU1hcCA9IEpTT04ucGFyc2UoYVNvdXJjZU1hcC5yZXBsYWNlKC9eXFwpXFxdXFx9Jy8sICcnKSk7XG4gICAgfVxuXG4gICAgdmFyIHZlcnNpb24gPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICd2ZXJzaW9uJyk7XG4gICAgdmFyIHNvdXJjZXMgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VzJyk7XG4gICAgLy8gU2FzcyAzLjMgbGVhdmVzIG91dCB0aGUgJ25hbWVzJyBhcnJheSwgc28gd2UgZGV2aWF0ZSBmcm9tIHRoZSBzcGVjICh3aGljaFxuICAgIC8vIHJlcXVpcmVzIHRoZSBhcnJheSkgdG8gcGxheSBuaWNlIGhlcmUuXG4gICAgdmFyIG5hbWVzID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnbmFtZXMnLCBbXSk7XG4gICAgdmFyIHNvdXJjZVJvb3QgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdzb3VyY2VSb290JywgbnVsbCk7XG4gICAgdmFyIHNvdXJjZXNDb250ZW50ID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnc291cmNlc0NvbnRlbnQnLCBudWxsKTtcbiAgICB2YXIgbWFwcGluZ3MgPSB1dGlsLmdldEFyZyhzb3VyY2VNYXAsICdtYXBwaW5ncycpO1xuICAgIHZhciBmaWxlID0gdXRpbC5nZXRBcmcoc291cmNlTWFwLCAnZmlsZScsIG51bGwpO1xuXG4gICAgLy8gT25jZSBhZ2FpbiwgU2FzcyBkZXZpYXRlcyBmcm9tIHRoZSBzcGVjIGFuZCBzdXBwbGllcyB0aGUgdmVyc2lvbiBhcyBhXG4gICAgLy8gc3RyaW5nIHJhdGhlciB0aGFuIGEgbnVtYmVyLCBzbyB3ZSB1c2UgbG9vc2UgZXF1YWxpdHkgY2hlY2tpbmcgaGVyZS5cbiAgICBpZiAodmVyc2lvbiAhPSB0aGlzLl92ZXJzaW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIHZlcnNpb246ICcgKyB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBQYXNzIGB0cnVlYCBiZWxvdyB0byBhbGxvdyBkdXBsaWNhdGUgbmFtZXMgYW5kIHNvdXJjZXMuIFdoaWxlIHNvdXJjZSBtYXBzXG4gICAgLy8gYXJlIGludGVuZGVkIHRvIGJlIGNvbXByZXNzZWQgYW5kIGRlZHVwbGljYXRlZCwgdGhlIFR5cGVTY3JpcHQgY29tcGlsZXJcbiAgICAvLyBzb21ldGltZXMgZ2VuZXJhdGVzIHNvdXJjZSBtYXBzIHdpdGggZHVwbGljYXRlcyBpbiB0aGVtLiBTZWUgR2l0aHViIGlzc3VlXG4gICAgLy8gIzcyIGFuZCBidWd6aWwubGEvODg5NDkyLlxuICAgIHRoaXMuX25hbWVzID0gQXJyYXlTZXQuZnJvbUFycmF5KG5hbWVzLCB0cnVlKTtcbiAgICB0aGlzLl9zb3VyY2VzID0gQXJyYXlTZXQuZnJvbUFycmF5KHNvdXJjZXMsIHRydWUpO1xuXG4gICAgdGhpcy5zb3VyY2VSb290ID0gc291cmNlUm9vdDtcbiAgICB0aGlzLnNvdXJjZXNDb250ZW50ID0gc291cmNlc0NvbnRlbnQ7XG4gICAgdGhpcy5fbWFwcGluZ3MgPSBtYXBwaW5ncztcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFNvdXJjZU1hcENvbnN1bWVyIGZyb20gYSBTb3VyY2VNYXBHZW5lcmF0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBTb3VyY2VNYXBHZW5lcmF0b3IgYVNvdXJjZU1hcFxuICAgKiAgICAgICAgVGhlIHNvdXJjZSBtYXAgdGhhdCB3aWxsIGJlIGNvbnN1bWVkLlxuICAgKiBAcmV0dXJucyBTb3VyY2VNYXBDb25zdW1lclxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIuZnJvbVNvdXJjZU1hcCA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfZnJvbVNvdXJjZU1hcChhU291cmNlTWFwKSB7XG4gICAgICB2YXIgc21jID0gT2JqZWN0LmNyZWF0ZShTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUpO1xuXG4gICAgICBzbWMuX25hbWVzID0gQXJyYXlTZXQuZnJvbUFycmF5KGFTb3VyY2VNYXAuX25hbWVzLnRvQXJyYXkoKSwgdHJ1ZSk7XG4gICAgICBzbWMuX3NvdXJjZXMgPSBBcnJheVNldC5mcm9tQXJyYXkoYVNvdXJjZU1hcC5fc291cmNlcy50b0FycmF5KCksIHRydWUpO1xuICAgICAgc21jLnNvdXJjZVJvb3QgPSBhU291cmNlTWFwLl9zb3VyY2VSb290O1xuICAgICAgc21jLnNvdXJjZXNDb250ZW50ID0gYVNvdXJjZU1hcC5fZ2VuZXJhdGVTb3VyY2VzQ29udGVudChzbWMuX3NvdXJjZXMudG9BcnJheSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbWMuc291cmNlUm9vdCk7XG4gICAgICBzbWMuZmlsZSA9IGFTb3VyY2VNYXAuX2ZpbGU7XG5cbiAgICAgIHNtYy5fX2dlbmVyYXRlZE1hcHBpbmdzID0gYVNvdXJjZU1hcC5fbWFwcGluZ3Muc2xpY2UoKVxuICAgICAgICAuc29ydCh1dGlsLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9ucyk7XG4gICAgICBzbWMuX19vcmlnaW5hbE1hcHBpbmdzID0gYVNvdXJjZU1hcC5fbWFwcGluZ3Muc2xpY2UoKVxuICAgICAgICAuc29ydCh1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcblxuICAgICAgcmV0dXJuIHNtYztcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgdmVyc2lvbiBvZiB0aGUgc291cmNlIG1hcHBpbmcgc3BlYyB0aGF0IHdlIGFyZSBjb25zdW1pbmcuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3ZlcnNpb24gPSAzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBvcmlnaW5hbCBzb3VyY2VzLlxuICAgKi9cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSwgJ3NvdXJjZXMnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc291cmNlcy50b0FycmF5KCkubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZVJvb3QgPyB1dGlsLmpvaW4odGhpcy5zb3VyY2VSb290LCBzKSA6IHM7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIGBfX2dlbmVyYXRlZE1hcHBpbmdzYCBhbmQgYF9fb3JpZ2luYWxNYXBwaW5nc2AgYXJlIGFycmF5cyB0aGF0IGhvbGQgdGhlXG4gIC8vIHBhcnNlZCBtYXBwaW5nIGNvb3JkaW5hdGVzIGZyb20gdGhlIHNvdXJjZSBtYXAncyBcIm1hcHBpbmdzXCIgYXR0cmlidXRlLiBUaGV5XG4gIC8vIGFyZSBsYXppbHkgaW5zdGFudGlhdGVkLCBhY2Nlc3NlZCB2aWEgdGhlIGBfZ2VuZXJhdGVkTWFwcGluZ3NgIGFuZFxuICAvLyBgX29yaWdpbmFsTWFwcGluZ3NgIGdldHRlcnMgcmVzcGVjdGl2ZWx5LCBhbmQgd2Ugb25seSBwYXJzZSB0aGUgbWFwcGluZ3NcbiAgLy8gYW5kIGNyZWF0ZSB0aGVzZSBhcnJheXMgb25jZSBxdWVyaWVkIGZvciBhIHNvdXJjZSBsb2NhdGlvbi4gV2UganVtcCB0aHJvdWdoXG4gIC8vIHRoZXNlIGhvb3BzIGJlY2F1c2UgdGhlcmUgY2FuIGJlIG1hbnkgdGhvdXNhbmRzIG9mIG1hcHBpbmdzLCBhbmQgcGFyc2luZ1xuICAvLyB0aGVtIGlzIGV4cGVuc2l2ZSwgc28gd2Ugb25seSB3YW50IHRvIGRvIGl0IGlmIHdlIG11c3QuXG4gIC8vXG4gIC8vIEVhY2ggb2JqZWN0IGluIHRoZSBhcnJheXMgaXMgb2YgdGhlIGZvcm06XG4gIC8vXG4gIC8vICAgICB7XG4gIC8vICAgICAgIGdlbmVyYXRlZExpbmU6IFRoZSBsaW5lIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIGNvZGUsXG4gIC8vICAgICAgIGdlbmVyYXRlZENvbHVtbjogVGhlIGNvbHVtbiBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBjb2RlLFxuICAvLyAgICAgICBzb3VyY2U6IFRoZSBwYXRoIHRvIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZSB0aGF0IGdlbmVyYXRlZCB0aGlzXG4gIC8vICAgICAgICAgICAgICAgY2h1bmsgb2YgY29kZSxcbiAgLy8gICAgICAgb3JpZ2luYWxMaW5lOiBUaGUgbGluZSBudW1iZXIgaW4gdGhlIG9yaWdpbmFsIHNvdXJjZSB0aGF0XG4gIC8vICAgICAgICAgICAgICAgICAgICAgY29ycmVzcG9uZHMgdG8gdGhpcyBjaHVuayBvZiBnZW5lcmF0ZWQgY29kZSxcbiAgLy8gICAgICAgb3JpZ2luYWxDb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UgdGhhdFxuICAvLyAgICAgICAgICAgICAgICAgICAgICAgY29ycmVzcG9uZHMgdG8gdGhpcyBjaHVuayBvZiBnZW5lcmF0ZWQgY29kZSxcbiAgLy8gICAgICAgbmFtZTogVGhlIG5hbWUgb2YgdGhlIG9yaWdpbmFsIHN5bWJvbCB3aGljaCBnZW5lcmF0ZWQgdGhpcyBjaHVuayBvZlxuICAvLyAgICAgICAgICAgICBjb2RlLlxuICAvLyAgICAgfVxuICAvL1xuICAvLyBBbGwgcHJvcGVydGllcyBleGNlcHQgZm9yIGBnZW5lcmF0ZWRMaW5lYCBhbmQgYGdlbmVyYXRlZENvbHVtbmAgY2FuIGJlXG4gIC8vIGBudWxsYC5cbiAgLy9cbiAgLy8gYF9nZW5lcmF0ZWRNYXBwaW5nc2AgaXMgb3JkZXJlZCBieSB0aGUgZ2VuZXJhdGVkIHBvc2l0aW9ucy5cbiAgLy9cbiAgLy8gYF9vcmlnaW5hbE1hcHBpbmdzYCBpcyBvcmRlcmVkIGJ5IHRoZSBvcmlnaW5hbCBwb3NpdGlvbnMuXG5cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLCAnX2dlbmVyYXRlZE1hcHBpbmdzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MpIHtcbiAgICAgICAgdGhpcy5fX2dlbmVyYXRlZE1hcHBpbmdzID0gW107XG4gICAgICAgIHRoaXMuX19vcmlnaW5hbE1hcHBpbmdzID0gW107XG4gICAgICAgIHRoaXMuX3BhcnNlTWFwcGluZ3ModGhpcy5fbWFwcGluZ3MsIHRoaXMuc291cmNlUm9vdCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3M7XG4gICAgfVxuICB9KTtcblxuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX19vcmlnaW5hbE1hcHBpbmdzID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZSwgJ19vcmlnaW5hbE1hcHBpbmdzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncykge1xuICAgICAgICB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fX29yaWdpbmFsTWFwcGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5fcGFyc2VNYXBwaW5ncyh0aGlzLl9tYXBwaW5ncywgdGhpcy5zb3VyY2VSb290KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuX19vcmlnaW5hbE1hcHBpbmdzO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBtYXBwaW5ncyBpbiBhIHN0cmluZyBpbiB0byBhIGRhdGEgc3RydWN0dXJlIHdoaWNoIHdlIGNhbiBlYXNpbHlcbiAgICogcXVlcnkgKHRoZSBvcmRlcmVkIGFycmF5cyBpbiB0aGUgYHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5nc2AgYW5kXG4gICAqIGB0aGlzLl9fb3JpZ2luYWxNYXBwaW5nc2AgcHJvcGVydGllcykuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuX3BhcnNlTWFwcGluZ3MgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX3BhcnNlTWFwcGluZ3MoYVN0ciwgYVNvdXJjZVJvb3QpIHtcbiAgICAgIHZhciBnZW5lcmF0ZWRMaW5lID0gMTtcbiAgICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNPcmlnaW5hbExpbmUgPSAwO1xuICAgICAgdmFyIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSAwO1xuICAgICAgdmFyIHByZXZpb3VzU291cmNlID0gMDtcbiAgICAgIHZhciBwcmV2aW91c05hbWUgPSAwO1xuICAgICAgdmFyIG1hcHBpbmdTZXBhcmF0b3IgPSAvXlssO10vO1xuICAgICAgdmFyIHN0ciA9IGFTdHI7XG4gICAgICB2YXIgbWFwcGluZztcbiAgICAgIHZhciB0ZW1wO1xuXG4gICAgICB3aGlsZSAoc3RyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKHN0ci5jaGFyQXQoMCkgPT09ICc7Jykge1xuICAgICAgICAgIGdlbmVyYXRlZExpbmUrKztcbiAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMSk7XG4gICAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHN0ci5jaGFyQXQoMCkgPT09ICcsJykge1xuICAgICAgICAgIHN0ciA9IHN0ci5zbGljZSgxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBtYXBwaW5nID0ge307XG4gICAgICAgICAgbWFwcGluZy5nZW5lcmF0ZWRMaW5lID0gZ2VuZXJhdGVkTGluZTtcblxuICAgICAgICAgIC8vIEdlbmVyYXRlZCBjb2x1bW4uXG4gICAgICAgICAgdGVtcCA9IGJhc2U2NFZMUS5kZWNvZGUoc3RyKTtcbiAgICAgICAgICBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbiA9IHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uICsgdGVtcC52YWx1ZTtcbiAgICAgICAgICBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uO1xuICAgICAgICAgIHN0ciA9IHRlbXAucmVzdDtcblxuICAgICAgICAgIGlmIChzdHIubGVuZ3RoID4gMCAmJiAhbWFwcGluZ1NlcGFyYXRvci50ZXN0KHN0ci5jaGFyQXQoMCkpKSB7XG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBzb3VyY2UuXG4gICAgICAgICAgICB0ZW1wID0gYmFzZTY0VkxRLmRlY29kZShzdHIpO1xuICAgICAgICAgICAgbWFwcGluZy5zb3VyY2UgPSB0aGlzLl9zb3VyY2VzLmF0KHByZXZpb3VzU291cmNlICsgdGVtcC52YWx1ZSk7XG4gICAgICAgICAgICBwcmV2aW91c1NvdXJjZSArPSB0ZW1wLnZhbHVlO1xuICAgICAgICAgICAgc3RyID0gdGVtcC5yZXN0O1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGggPT09IDAgfHwgbWFwcGluZ1NlcGFyYXRvci50ZXN0KHN0ci5jaGFyQXQoMCkpKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRm91bmQgYSBzb3VyY2UsIGJ1dCBubyBsaW5lIGFuZCBjb2x1bW4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgbGluZS5cbiAgICAgICAgICAgIHRlbXAgPSBiYXNlNjRWTFEuZGVjb2RlKHN0cik7XG4gICAgICAgICAgICBtYXBwaW5nLm9yaWdpbmFsTGluZSA9IHByZXZpb3VzT3JpZ2luYWxMaW5lICsgdGVtcC52YWx1ZTtcbiAgICAgICAgICAgIHByZXZpb3VzT3JpZ2luYWxMaW5lID0gbWFwcGluZy5vcmlnaW5hbExpbmU7XG4gICAgICAgICAgICAvLyBMaW5lcyBhcmUgc3RvcmVkIDAtYmFzZWRcbiAgICAgICAgICAgIG1hcHBpbmcub3JpZ2luYWxMaW5lICs9IDE7XG4gICAgICAgICAgICBzdHIgPSB0ZW1wLnJlc3Q7XG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCB8fCBtYXBwaW5nU2VwYXJhdG9yLnRlc3Qoc3RyLmNoYXJBdCgwKSkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCBhIHNvdXJjZSBhbmQgbGluZSwgYnV0IG5vIGNvbHVtbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBjb2x1bW4uXG4gICAgICAgICAgICB0ZW1wID0gYmFzZTY0VkxRLmRlY29kZShzdHIpO1xuICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbENvbHVtbiA9IHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gKyB0ZW1wLnZhbHVlO1xuICAgICAgICAgICAgcHJldmlvdXNPcmlnaW5hbENvbHVtbiA9IG1hcHBpbmcub3JpZ2luYWxDb2x1bW47XG4gICAgICAgICAgICBzdHIgPSB0ZW1wLnJlc3Q7XG5cbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID4gMCAmJiAhbWFwcGluZ1NlcGFyYXRvci50ZXN0KHN0ci5jaGFyQXQoMCkpKSB7XG4gICAgICAgICAgICAgIC8vIE9yaWdpbmFsIG5hbWUuXG4gICAgICAgICAgICAgIHRlbXAgPSBiYXNlNjRWTFEuZGVjb2RlKHN0cik7XG4gICAgICAgICAgICAgIG1hcHBpbmcubmFtZSA9IHRoaXMuX25hbWVzLmF0KHByZXZpb3VzTmFtZSArIHRlbXAudmFsdWUpO1xuICAgICAgICAgICAgICBwcmV2aW91c05hbWUgKz0gdGVtcC52YWx1ZTtcbiAgICAgICAgICAgICAgc3RyID0gdGVtcC5yZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX19nZW5lcmF0ZWRNYXBwaW5ncy5wdXNoKG1hcHBpbmcpO1xuICAgICAgICAgIGlmICh0eXBlb2YgbWFwcGluZy5vcmlnaW5hbExpbmUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncy5wdXNoKG1hcHBpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9fZ2VuZXJhdGVkTWFwcGluZ3Muc29ydCh1dGlsLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9ucyk7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxNYXBwaW5ncy5zb3J0KHV0aWwuY29tcGFyZUJ5T3JpZ2luYWxQb3NpdGlvbnMpO1xuICAgIH07XG5cbiAgLyoqXG4gICAqIEZpbmQgdGhlIG1hcHBpbmcgdGhhdCBiZXN0IG1hdGNoZXMgdGhlIGh5cG90aGV0aWNhbCBcIm5lZWRsZVwiIG1hcHBpbmcgdGhhdFxuICAgKiB3ZSBhcmUgc2VhcmNoaW5nIGZvciBpbiB0aGUgZ2l2ZW4gXCJoYXlzdGFja1wiIG9mIG1hcHBpbmdzLlxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLl9maW5kTWFwcGluZyA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfZmluZE1hcHBpbmcoYU5lZWRsZSwgYU1hcHBpbmdzLCBhTGluZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYUNvbHVtbk5hbWUsIGFDb21wYXJhdG9yKSB7XG4gICAgICAvLyBUbyByZXR1cm4gdGhlIHBvc2l0aW9uIHdlIGFyZSBzZWFyY2hpbmcgZm9yLCB3ZSBtdXN0IGZpcnN0IGZpbmQgdGhlXG4gICAgICAvLyBtYXBwaW5nIGZvciB0aGUgZ2l2ZW4gcG9zaXRpb24gYW5kIHRoZW4gcmV0dXJuIHRoZSBvcHBvc2l0ZSBwb3NpdGlvbiBpdFxuICAgICAgLy8gcG9pbnRzIHRvLiBCZWNhdXNlIHRoZSBtYXBwaW5ncyBhcmUgc29ydGVkLCB3ZSBjYW4gdXNlIGJpbmFyeSBzZWFyY2ggdG9cbiAgICAgIC8vIGZpbmQgdGhlIGJlc3QgbWFwcGluZy5cblxuICAgICAgaWYgKGFOZWVkbGVbYUxpbmVOYW1lXSA8PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpbmUgbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMSwgZ290ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGFOZWVkbGVbYUxpbmVOYW1lXSk7XG4gICAgICB9XG4gICAgICBpZiAoYU5lZWRsZVthQ29sdW1uTmFtZV0gPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbHVtbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAwLCBnb3QgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgYU5lZWRsZVthQ29sdW1uTmFtZV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmluYXJ5U2VhcmNoLnNlYXJjaChhTmVlZGxlLCBhTWFwcGluZ3MsIGFDb21wYXJhdG9yKTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBzb3VyY2UsIGxpbmUsIGFuZCBjb2x1bW4gaW5mb3JtYXRpb24gZm9yIHRoZSBnZW5lcmF0ZWRcbiAgICogc291cmNlJ3MgbGluZSBhbmQgY29sdW1uIHBvc2l0aW9ucyBwcm92aWRlZC4gVGhlIG9ubHkgYXJndW1lbnQgaXMgYW4gb2JqZWN0XG4gICAqIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKlxuICAgKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLlxuICAgKiAgIC0gY29sdW1uOiBUaGUgY29sdW1uIG51bWJlciBpbiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAgICpcbiAgICogYW5kIGFuIG9iamVjdCBpcyByZXR1cm5lZCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIHNvdXJjZTogVGhlIG9yaWdpbmFsIHNvdXJjZSBmaWxlLCBvciBudWxsLlxuICAgKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UsIG9yIG51bGwuXG4gICAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UsIG9yIG51bGwuXG4gICAqICAgLSBuYW1lOiBUaGUgb3JpZ2luYWwgaWRlbnRpZmllciwgb3IgbnVsbC5cbiAgICovXG4gIFNvdXJjZU1hcENvbnN1bWVyLnByb3RvdHlwZS5vcmlnaW5hbFBvc2l0aW9uRm9yID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9vcmlnaW5hbFBvc2l0aW9uRm9yKGFBcmdzKSB7XG4gICAgICB2YXIgbmVlZGxlID0ge1xuICAgICAgICBnZW5lcmF0ZWRMaW5lOiB1dGlsLmdldEFyZyhhQXJncywgJ2xpbmUnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ29sdW1uOiB1dGlsLmdldEFyZyhhQXJncywgJ2NvbHVtbicpXG4gICAgICB9O1xuXG4gICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX2ZpbmRNYXBwaW5nKG5lZWRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ2VuZXJhdGVkTGluZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdlbmVyYXRlZENvbHVtblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9ucyk7XG5cbiAgICAgIGlmIChtYXBwaW5nICYmIG1hcHBpbmcuZ2VuZXJhdGVkTGluZSA9PT0gbmVlZGxlLmdlbmVyYXRlZExpbmUpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IHV0aWwuZ2V0QXJnKG1hcHBpbmcsICdzb3VyY2UnLCBudWxsKTtcbiAgICAgICAgaWYgKHNvdXJjZSAmJiB0aGlzLnNvdXJjZVJvb3QpIHtcbiAgICAgICAgICBzb3VyY2UgPSB1dGlsLmpvaW4odGhpcy5zb3VyY2VSb290LCBzb3VyY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgbGluZTogdXRpbC5nZXRBcmcobWFwcGluZywgJ29yaWdpbmFsTGluZScsIG51bGwpLFxuICAgICAgICAgIGNvbHVtbjogdXRpbC5nZXRBcmcobWFwcGluZywgJ29yaWdpbmFsQ29sdW1uJywgbnVsbCksXG4gICAgICAgICAgbmFtZTogdXRpbC5nZXRBcmcobWFwcGluZywgJ25hbWUnLCBudWxsKVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2U6IG51bGwsXG4gICAgICAgIGxpbmU6IG51bGwsXG4gICAgICAgIGNvbHVtbjogbnVsbCxcbiAgICAgICAgbmFtZTogbnVsbFxuICAgICAgfTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBzb3VyY2UgY29udGVudC4gVGhlIG9ubHkgYXJndW1lbnQgaXMgdGhlIHVybCBvZiB0aGVcbiAgICogb3JpZ2luYWwgc291cmNlIGZpbGUuIFJldHVybnMgbnVsbCBpZiBubyBvcmlnaW5hbCBzb3VyY2UgY29udGVudCBpc1xuICAgKiBhdmFpbGlibGUuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuc291cmNlQ29udGVudEZvciA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwQ29uc3VtZXJfc291cmNlQ29udGVudEZvcihhU291cmNlKSB7XG4gICAgICBpZiAoIXRoaXMuc291cmNlc0NvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNvdXJjZVJvb3QpIHtcbiAgICAgICAgYVNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5zb3VyY2VSb290LCBhU291cmNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3NvdXJjZXMuaGFzKGFTb3VyY2UpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZXNDb250ZW50W3RoaXMuX3NvdXJjZXMuaW5kZXhPZihhU291cmNlKV07XG4gICAgICB9XG5cbiAgICAgIHZhciB1cmw7XG4gICAgICBpZiAodGhpcy5zb3VyY2VSb290XG4gICAgICAgICAgJiYgKHVybCA9IHV0aWwudXJsUGFyc2UodGhpcy5zb3VyY2VSb290KSkpIHtcbiAgICAgICAgLy8gWFhYOiBmaWxlOi8vIFVSSXMgYW5kIGFic29sdXRlIHBhdGhzIGxlYWQgdG8gdW5leHBlY3RlZCBiZWhhdmlvciBmb3JcbiAgICAgICAgLy8gbWFueSB1c2Vycy4gV2UgY2FuIGhlbHAgdGhlbSBvdXQgd2hlbiB0aGV5IGV4cGVjdCBmaWxlOi8vIFVSSXMgdG9cbiAgICAgICAgLy8gYmVoYXZlIGxpa2UgaXQgd291bGQgaWYgdGhleSB3ZXJlIHJ1bm5pbmcgYSBsb2NhbCBIVFRQIHNlcnZlci4gU2VlXG4gICAgICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTg4NTU5Ny5cbiAgICAgICAgdmFyIGZpbGVVcmlBYnNQYXRoID0gYVNvdXJjZS5yZXBsYWNlKC9eZmlsZTpcXC9cXC8vLCBcIlwiKTtcbiAgICAgICAgaWYgKHVybC5zY2hlbWUgPT0gXCJmaWxlXCJcbiAgICAgICAgICAgICYmIHRoaXMuX3NvdXJjZXMuaGFzKGZpbGVVcmlBYnNQYXRoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNvdXJjZXNDb250ZW50W3RoaXMuX3NvdXJjZXMuaW5kZXhPZihmaWxlVXJpQWJzUGF0aCldXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCF1cmwucGF0aCB8fCB1cmwucGF0aCA9PSBcIi9cIilcbiAgICAgICAgICAgICYmIHRoaXMuX3NvdXJjZXMuaGFzKFwiL1wiICsgYVNvdXJjZSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2VzQ29udGVudFt0aGlzLl9zb3VyY2VzLmluZGV4T2YoXCIvXCIgKyBhU291cmNlKV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBhU291cmNlICsgJ1wiIGlzIG5vdCBpbiB0aGUgU291cmNlTWFwLicpO1xuICAgIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGdlbmVyYXRlZCBsaW5lIGFuZCBjb2x1bW4gaW5mb3JtYXRpb24gZm9yIHRoZSBvcmlnaW5hbCBzb3VyY2UsXG4gICAqIGxpbmUsIGFuZCBjb2x1bW4gcG9zaXRpb25zIHByb3ZpZGVkLiBUaGUgb25seSBhcmd1bWVudCBpcyBhbiBvYmplY3Qgd2l0aFxuICAgKiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqICAgLSBzb3VyY2U6IFRoZSBmaWxlbmFtZSBvZiB0aGUgb3JpZ2luYWwgc291cmNlLlxuICAgKiAgIC0gbGluZTogVGhlIGxpbmUgbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gICAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBvcmlnaW5hbCBzb3VyY2UuXG4gICAqXG4gICAqIGFuZCBhbiBvYmplY3QgaXMgcmV0dXJuZWQgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqXG4gICAqICAgLSBsaW5lOiBUaGUgbGluZSBudW1iZXIgaW4gdGhlIGdlbmVyYXRlZCBzb3VyY2UsIG9yIG51bGwuXG4gICAqICAgLSBjb2x1bW46IFRoZSBjb2x1bW4gbnVtYmVyIGluIHRoZSBnZW5lcmF0ZWQgc291cmNlLCBvciBudWxsLlxuICAgKi9cbiAgU291cmNlTWFwQ29uc3VtZXIucHJvdG90eXBlLmdlbmVyYXRlZFBvc2l0aW9uRm9yID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBDb25zdW1lcl9nZW5lcmF0ZWRQb3NpdGlvbkZvcihhQXJncykge1xuICAgICAgdmFyIG5lZWRsZSA9IHtcbiAgICAgICAgc291cmNlOiB1dGlsLmdldEFyZyhhQXJncywgJ3NvdXJjZScpLFxuICAgICAgICBvcmlnaW5hbExpbmU6IHV0aWwuZ2V0QXJnKGFBcmdzLCAnbGluZScpLFxuICAgICAgICBvcmlnaW5hbENvbHVtbjogdXRpbC5nZXRBcmcoYUFyZ3MsICdjb2x1bW4nKVxuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuc291cmNlUm9vdCkge1xuICAgICAgICBuZWVkbGUuc291cmNlID0gdXRpbC5yZWxhdGl2ZSh0aGlzLnNvdXJjZVJvb3QsIG5lZWRsZS5zb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICB2YXIgbWFwcGluZyA9IHRoaXMuX2ZpbmRNYXBwaW5nKG5lZWRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3JpZ2luYWxNYXBwaW5ncyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExpbmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbENvbHVtblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLmNvbXBhcmVCeU9yaWdpbmFsUG9zaXRpb25zKTtcblxuICAgICAgaWYgKG1hcHBpbmcpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsaW5lOiB1dGlsLmdldEFyZyhtYXBwaW5nLCAnZ2VuZXJhdGVkTGluZScsIG51bGwpLFxuICAgICAgICAgIGNvbHVtbjogdXRpbC5nZXRBcmcobWFwcGluZywgJ2dlbmVyYXRlZENvbHVtbicsIG51bGwpXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxpbmU6IG51bGwsXG4gICAgICAgIGNvbHVtbjogbnVsbFxuICAgICAgfTtcbiAgICB9O1xuXG4gIFNvdXJjZU1hcENvbnN1bWVyLkdFTkVSQVRFRF9PUkRFUiA9IDE7XG4gIFNvdXJjZU1hcENvbnN1bWVyLk9SSUdJTkFMX09SREVSID0gMjtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGVhY2ggbWFwcGluZyBiZXR3ZWVuIGFuIG9yaWdpbmFsIHNvdXJjZS9saW5lL2NvbHVtbiBhbmQgYVxuICAgKiBnZW5lcmF0ZWQgbGluZS9jb2x1bW4gaW4gdGhpcyBzb3VyY2UgbWFwLlxuICAgKlxuICAgKiBAcGFyYW0gRnVuY3Rpb24gYUNhbGxiYWNrXG4gICAqICAgICAgICBUaGUgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2l0aCBlYWNoIG1hcHBpbmcuXG4gICAqIEBwYXJhbSBPYmplY3QgYUNvbnRleHRcbiAgICogICAgICAgIE9wdGlvbmFsLiBJZiBzcGVjaWZpZWQsIHRoaXMgb2JqZWN0IHdpbGwgYmUgdGhlIHZhbHVlIG9mIGB0aGlzYCBldmVyeVxuICAgKiAgICAgICAgdGltZSB0aGF0IGBhQ2FsbGJhY2tgIGlzIGNhbGxlZC5cbiAgICogQHBhcmFtIGFPcmRlclxuICAgKiAgICAgICAgRWl0aGVyIGBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVJgIG9yXG4gICAqICAgICAgICBgU291cmNlTWFwQ29uc3VtZXIuT1JJR0lOQUxfT1JERVJgLiBTcGVjaWZpZXMgd2hldGhlciB5b3Ugd2FudCB0b1xuICAgKiAgICAgICAgaXRlcmF0ZSBvdmVyIHRoZSBtYXBwaW5ncyBzb3J0ZWQgYnkgdGhlIGdlbmVyYXRlZCBmaWxlJ3MgbGluZS9jb2x1bW5cbiAgICogICAgICAgIG9yZGVyIG9yIHRoZSBvcmlnaW5hbCdzIHNvdXJjZS9saW5lL2NvbHVtbiBvcmRlciwgcmVzcGVjdGl2ZWx5LiBEZWZhdWx0cyB0b1xuICAgKiAgICAgICAgYFNvdXJjZU1hcENvbnN1bWVyLkdFTkVSQVRFRF9PUkRFUmAuXG4gICAqL1xuICBTb3VyY2VNYXBDb25zdW1lci5wcm90b3R5cGUuZWFjaE1hcHBpbmcgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcENvbnN1bWVyX2VhY2hNYXBwaW5nKGFDYWxsYmFjaywgYUNvbnRleHQsIGFPcmRlcikge1xuICAgICAgdmFyIGNvbnRleHQgPSBhQ29udGV4dCB8fCBudWxsO1xuICAgICAgdmFyIG9yZGVyID0gYU9yZGVyIHx8IFNvdXJjZU1hcENvbnN1bWVyLkdFTkVSQVRFRF9PUkRFUjtcblxuICAgICAgdmFyIG1hcHBpbmdzO1xuICAgICAgc3dpdGNoIChvcmRlcikge1xuICAgICAgY2FzZSBTb3VyY2VNYXBDb25zdW1lci5HRU5FUkFURURfT1JERVI6XG4gICAgICAgIG1hcHBpbmdzID0gdGhpcy5fZ2VuZXJhdGVkTWFwcGluZ3M7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBTb3VyY2VNYXBDb25zdW1lci5PUklHSU5BTF9PUkRFUjpcbiAgICAgICAgbWFwcGluZ3MgPSB0aGlzLl9vcmlnaW5hbE1hcHBpbmdzO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gb3JkZXIgb2YgaXRlcmF0aW9uLlwiKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNvdXJjZVJvb3QgPSB0aGlzLnNvdXJjZVJvb3Q7XG4gICAgICBtYXBwaW5ncy5tYXAoZnVuY3Rpb24gKG1hcHBpbmcpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IG1hcHBpbmcuc291cmNlO1xuICAgICAgICBpZiAoc291cmNlICYmIHNvdXJjZVJvb3QpIHtcbiAgICAgICAgICBzb3VyY2UgPSB1dGlsLmpvaW4oc291cmNlUm9vdCwgc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICAgIGdlbmVyYXRlZExpbmU6IG1hcHBpbmcuZ2VuZXJhdGVkTGluZSxcbiAgICAgICAgICBnZW5lcmF0ZWRDb2x1bW46IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uLFxuICAgICAgICAgIG9yaWdpbmFsTGluZTogbWFwcGluZy5vcmlnaW5hbExpbmUsXG4gICAgICAgICAgb3JpZ2luYWxDb2x1bW46IG1hcHBpbmcub3JpZ2luYWxDb2x1bW4sXG4gICAgICAgICAgbmFtZTogbWFwcGluZy5uYW1lXG4gICAgICAgIH07XG4gICAgICB9KS5mb3JFYWNoKGFDYWxsYmFjaywgY29udGV4dCk7XG4gICAgfTtcblxuICBleHBvcnRzLlNvdXJjZU1hcENvbnN1bWVyID0gU291cmNlTWFwQ29uc3VtZXI7XG5cbn0pO1xuIiwiLyogLSotIE1vZGU6IGpzOyBqcy1pbmRlbnQtbGV2ZWw6IDI7IC0qLSAqL1xuLypcbiAqIENvcHlyaWdodCAyMDExIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBsaWNlbnNlLiBTZWUgTElDRU5TRSBvcjpcbiAqIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2VcbiAqL1xuaWYgKHR5cGVvZiBkZWZpbmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgZGVmaW5lID0gcmVxdWlyZSgnYW1kZWZpbmUnKShtb2R1bGUsIHJlcXVpcmUpO1xufVxuZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblxuICB2YXIgYmFzZTY0VkxRID0gcmVxdWlyZSgnLi9iYXNlNjQtdmxxJyk7XG4gIHZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG4gIHZhciBBcnJheVNldCA9IHJlcXVpcmUoJy4vYXJyYXktc2V0JykuQXJyYXlTZXQ7XG5cbiAgLyoqXG4gICAqIEFuIGluc3RhbmNlIG9mIHRoZSBTb3VyY2VNYXBHZW5lcmF0b3IgcmVwcmVzZW50cyBhIHNvdXJjZSBtYXAgd2hpY2ggaXNcbiAgICogYmVpbmcgYnVpbHQgaW5jcmVtZW50YWxseS4gWW91IG1heSBwYXNzIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmdcbiAgICogcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIGZpbGU6IFRoZSBmaWxlbmFtZSBvZiB0aGUgZ2VuZXJhdGVkIHNvdXJjZS5cbiAgICogICAtIHNvdXJjZVJvb3Q6IEEgcm9vdCBmb3IgYWxsIHJlbGF0aXZlIFVSTHMgaW4gdGhpcyBzb3VyY2UgbWFwLlxuICAgKi9cbiAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yKGFBcmdzKSB7XG4gICAgaWYgKCFhQXJncykge1xuICAgICAgYUFyZ3MgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5fZmlsZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnZmlsZScsIG51bGwpO1xuICAgIHRoaXMuX3NvdXJjZVJvb3QgPSB1dGlsLmdldEFyZyhhQXJncywgJ3NvdXJjZVJvb3QnLCBudWxsKTtcbiAgICB0aGlzLl9zb3VyY2VzID0gbmV3IEFycmF5U2V0KCk7XG4gICAgdGhpcy5fbmFtZXMgPSBuZXcgQXJyYXlTZXQoKTtcbiAgICB0aGlzLl9tYXBwaW5ncyA9IFtdO1xuICAgIHRoaXMuX3NvdXJjZXNDb250ZW50cyA9IG51bGw7XG4gIH1cblxuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl92ZXJzaW9uID0gMztcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBTb3VyY2VNYXBHZW5lcmF0b3IgYmFzZWQgb24gYSBTb3VyY2VNYXBDb25zdW1lclxuICAgKlxuICAgKiBAcGFyYW0gYVNvdXJjZU1hcENvbnN1bWVyIFRoZSBTb3VyY2VNYXAuXG4gICAqL1xuICBTb3VyY2VNYXBHZW5lcmF0b3IuZnJvbVNvdXJjZU1hcCA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2Zyb21Tb3VyY2VNYXAoYVNvdXJjZU1hcENvbnN1bWVyKSB7XG4gICAgICB2YXIgc291cmNlUm9vdCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VSb290O1xuICAgICAgdmFyIGdlbmVyYXRvciA9IG5ldyBTb3VyY2VNYXBHZW5lcmF0b3Ioe1xuICAgICAgICBmaWxlOiBhU291cmNlTWFwQ29uc3VtZXIuZmlsZSxcbiAgICAgICAgc291cmNlUm9vdDogc291cmNlUm9vdFxuICAgICAgfSk7XG4gICAgICBhU291cmNlTWFwQ29uc3VtZXIuZWFjaE1hcHBpbmcoZnVuY3Rpb24gKG1hcHBpbmcpIHtcbiAgICAgICAgdmFyIG5ld01hcHBpbmcgPSB7XG4gICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICBsaW5lOiBtYXBwaW5nLmdlbmVyYXRlZExpbmUsXG4gICAgICAgICAgICBjb2x1bW46IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChtYXBwaW5nLnNvdXJjZSkge1xuICAgICAgICAgIG5ld01hcHBpbmcuc291cmNlID0gbWFwcGluZy5zb3VyY2U7XG4gICAgICAgICAgaWYgKHNvdXJjZVJvb3QpIHtcbiAgICAgICAgICAgIG5ld01hcHBpbmcuc291cmNlID0gdXRpbC5yZWxhdGl2ZShzb3VyY2VSb290LCBuZXdNYXBwaW5nLnNvdXJjZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbmV3TWFwcGluZy5vcmlnaW5hbCA9IHtcbiAgICAgICAgICAgIGxpbmU6IG1hcHBpbmcub3JpZ2luYWxMaW5lLFxuICAgICAgICAgICAgY29sdW1uOiBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChtYXBwaW5nLm5hbWUpIHtcbiAgICAgICAgICAgIG5ld01hcHBpbmcubmFtZSA9IG1hcHBpbmcubmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZW5lcmF0b3IuYWRkTWFwcGluZyhuZXdNYXBwaW5nKTtcbiAgICAgIH0pO1xuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgIGdlbmVyYXRvci5zZXRTb3VyY2VDb250ZW50KHNvdXJjZUZpbGUsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gICAgfTtcblxuICAvKipcbiAgICogQWRkIGEgc2luZ2xlIG1hcHBpbmcgZnJvbSBvcmlnaW5hbCBzb3VyY2UgbGluZSBhbmQgY29sdW1uIHRvIHRoZSBnZW5lcmF0ZWRcbiAgICogc291cmNlJ3MgbGluZSBhbmQgY29sdW1uIGZvciB0aGlzIHNvdXJjZSBtYXAgYmVpbmcgY3JlYXRlZC4gVGhlIG1hcHBpbmdcbiAgICogb2JqZWN0IHNob3VsZCBoYXZlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICpcbiAgICogICAtIGdlbmVyYXRlZDogQW4gb2JqZWN0IHdpdGggdGhlIGdlbmVyYXRlZCBsaW5lIGFuZCBjb2x1bW4gcG9zaXRpb25zLlxuICAgKiAgIC0gb3JpZ2luYWw6IEFuIG9iamVjdCB3aXRoIHRoZSBvcmlnaW5hbCBsaW5lIGFuZCBjb2x1bW4gcG9zaXRpb25zLlxuICAgKiAgIC0gc291cmNlOiBUaGUgb3JpZ2luYWwgc291cmNlIGZpbGUgKHJlbGF0aXZlIHRvIHRoZSBzb3VyY2VSb290KS5cbiAgICogICAtIG5hbWU6IEFuIG9wdGlvbmFsIG9yaWdpbmFsIHRva2VuIG5hbWUgZm9yIHRoaXMgbWFwcGluZy5cbiAgICovXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuYWRkTWFwcGluZyA9XG4gICAgZnVuY3Rpb24gU291cmNlTWFwR2VuZXJhdG9yX2FkZE1hcHBpbmcoYUFyZ3MpIHtcbiAgICAgIHZhciBnZW5lcmF0ZWQgPSB1dGlsLmdldEFyZyhhQXJncywgJ2dlbmVyYXRlZCcpO1xuICAgICAgdmFyIG9yaWdpbmFsID0gdXRpbC5nZXRBcmcoYUFyZ3MsICdvcmlnaW5hbCcsIG51bGwpO1xuICAgICAgdmFyIHNvdXJjZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnc291cmNlJywgbnVsbCk7XG4gICAgICB2YXIgbmFtZSA9IHV0aWwuZ2V0QXJnKGFBcmdzLCAnbmFtZScsIG51bGwpO1xuXG4gICAgICB0aGlzLl92YWxpZGF0ZU1hcHBpbmcoZ2VuZXJhdGVkLCBvcmlnaW5hbCwgc291cmNlLCBuYW1lKTtcblxuICAgICAgaWYgKHNvdXJjZSAmJiAhdGhpcy5fc291cmNlcy5oYXMoc291cmNlKSkge1xuICAgICAgICB0aGlzLl9zb3VyY2VzLmFkZChzb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZSAmJiAhdGhpcy5fbmFtZXMuaGFzKG5hbWUpKSB7XG4gICAgICAgIHRoaXMuX25hbWVzLmFkZChuYW1lKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fbWFwcGluZ3MucHVzaCh7XG4gICAgICAgIGdlbmVyYXRlZExpbmU6IGdlbmVyYXRlZC5saW5lLFxuICAgICAgICBnZW5lcmF0ZWRDb2x1bW46IGdlbmVyYXRlZC5jb2x1bW4sXG4gICAgICAgIG9yaWdpbmFsTGluZTogb3JpZ2luYWwgIT0gbnVsbCAmJiBvcmlnaW5hbC5saW5lLFxuICAgICAgICBvcmlnaW5hbENvbHVtbjogb3JpZ2luYWwgIT0gbnVsbCAmJiBvcmlnaW5hbC5jb2x1bW4sXG4gICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICBuYW1lOiBuYW1lXG4gICAgICB9KTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNvdXJjZSBjb250ZW50IGZvciBhIHNvdXJjZSBmaWxlLlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5zZXRTb3VyY2VDb250ZW50ID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3Jfc2V0U291cmNlQ29udGVudChhU291cmNlRmlsZSwgYVNvdXJjZUNvbnRlbnQpIHtcbiAgICAgIHZhciBzb3VyY2UgPSBhU291cmNlRmlsZTtcbiAgICAgIGlmICh0aGlzLl9zb3VyY2VSb290KSB7XG4gICAgICAgIHNvdXJjZSA9IHV0aWwucmVsYXRpdmUodGhpcy5fc291cmNlUm9vdCwgc291cmNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFTb3VyY2VDb250ZW50ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEFkZCB0aGUgc291cmNlIGNvbnRlbnQgdG8gdGhlIF9zb3VyY2VzQ29udGVudHMgbWFwLlxuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgX3NvdXJjZXNDb250ZW50cyBtYXAgaWYgdGhlIHByb3BlcnR5IGlzIG51bGwuXG4gICAgICAgIGlmICghdGhpcy5fc291cmNlc0NvbnRlbnRzKSB7XG4gICAgICAgICAgdGhpcy5fc291cmNlc0NvbnRlbnRzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291cmNlc0NvbnRlbnRzW3V0aWwudG9TZXRTdHJpbmcoc291cmNlKV0gPSBhU291cmNlQ29udGVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlbW92ZSB0aGUgc291cmNlIGZpbGUgZnJvbSB0aGUgX3NvdXJjZXNDb250ZW50cyBtYXAuXG4gICAgICAgIC8vIElmIHRoZSBfc291cmNlc0NvbnRlbnRzIG1hcCBpcyBlbXB0eSwgc2V0IHRoZSBwcm9wZXJ0eSB0byBudWxsLlxuICAgICAgICBkZWxldGUgdGhpcy5fc291cmNlc0NvbnRlbnRzW3V0aWwudG9TZXRTdHJpbmcoc291cmNlKV07XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLl9zb3VyY2VzQ29udGVudHMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX3NvdXJjZXNDb250ZW50cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHRoZSBtYXBwaW5ncyBvZiBhIHN1Yi1zb3VyY2UtbWFwIGZvciBhIHNwZWNpZmljIHNvdXJjZSBmaWxlIHRvIHRoZVxuICAgKiBzb3VyY2UgbWFwIGJlaW5nIGdlbmVyYXRlZC4gRWFjaCBtYXBwaW5nIHRvIHRoZSBzdXBwbGllZCBzb3VyY2UgZmlsZSBpc1xuICAgKiByZXdyaXR0ZW4gdXNpbmcgdGhlIHN1cHBsaWVkIHNvdXJjZSBtYXAuIE5vdGU6IFRoZSByZXNvbHV0aW9uIGZvciB0aGVcbiAgICogcmVzdWx0aW5nIG1hcHBpbmdzIGlzIHRoZSBtaW5pbWl1bSBvZiB0aGlzIG1hcCBhbmQgdGhlIHN1cHBsaWVkIG1hcC5cbiAgICpcbiAgICogQHBhcmFtIGFTb3VyY2VNYXBDb25zdW1lciBUaGUgc291cmNlIG1hcCB0byBiZSBhcHBsaWVkLlxuICAgKiBAcGFyYW0gYVNvdXJjZUZpbGUgT3B0aW9uYWwuIFRoZSBmaWxlbmFtZSBvZiB0aGUgc291cmNlIGZpbGUuXG4gICAqICAgICAgICBJZiBvbWl0dGVkLCBTb3VyY2VNYXBDb25zdW1lcidzIGZpbGUgcHJvcGVydHkgd2lsbCBiZSB1c2VkLlxuICAgKiBAcGFyYW0gYVNvdXJjZU1hcFBhdGggT3B0aW9uYWwuIFRoZSBkaXJuYW1lIG9mIHRoZSBwYXRoIHRvIHRoZSBzb3VyY2UgbWFwXG4gICAqICAgICAgICB0byBiZSBhcHBsaWVkLiBJZiByZWxhdGl2ZSwgaXQgaXMgcmVsYXRpdmUgdG8gdGhlIFNvdXJjZU1hcENvbnN1bWVyLlxuICAgKiAgICAgICAgVGhpcyBwYXJhbWV0ZXIgaXMgbmVlZGVkIHdoZW4gdGhlIHR3byBzb3VyY2UgbWFwcyBhcmVuJ3QgaW4gdGhlIHNhbWVcbiAgICogICAgICAgIGRpcmVjdG9yeSwgYW5kIHRoZSBzb3VyY2UgbWFwIHRvIGJlIGFwcGxpZWQgY29udGFpbnMgcmVsYXRpdmUgc291cmNlXG4gICAqICAgICAgICBwYXRocy4gSWYgc28sIHRob3NlIHJlbGF0aXZlIHNvdXJjZSBwYXRocyBuZWVkIHRvIGJlIHJld3JpdHRlblxuICAgKiAgICAgICAgcmVsYXRpdmUgdG8gdGhlIFNvdXJjZU1hcEdlbmVyYXRvci5cbiAgICovXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuYXBwbHlTb3VyY2VNYXAgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl9hcHBseVNvdXJjZU1hcChhU291cmNlTWFwQ29uc3VtZXIsIGFTb3VyY2VGaWxlLCBhU291cmNlTWFwUGF0aCkge1xuICAgICAgLy8gSWYgYVNvdXJjZUZpbGUgaXMgb21pdHRlZCwgd2Ugd2lsbCB1c2UgdGhlIGZpbGUgcHJvcGVydHkgb2YgdGhlIFNvdXJjZU1hcFxuICAgICAgaWYgKCFhU291cmNlRmlsZSkge1xuICAgICAgICBpZiAoIWFTb3VyY2VNYXBDb25zdW1lci5maWxlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ1NvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUuYXBwbHlTb3VyY2VNYXAgcmVxdWlyZXMgZWl0aGVyIGFuIGV4cGxpY2l0IHNvdXJjZSBmaWxlLCAnICtcbiAgICAgICAgICAgICdvciB0aGUgc291cmNlIG1hcFxcJ3MgXCJmaWxlXCIgcHJvcGVydHkuIEJvdGggd2VyZSBvbWl0dGVkLidcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGFTb3VyY2VGaWxlID0gYVNvdXJjZU1hcENvbnN1bWVyLmZpbGU7XG4gICAgICB9XG4gICAgICB2YXIgc291cmNlUm9vdCA9IHRoaXMuX3NvdXJjZVJvb3Q7XG4gICAgICAvLyBNYWtlIFwiYVNvdXJjZUZpbGVcIiByZWxhdGl2ZSBpZiBhbiBhYnNvbHV0ZSBVcmwgaXMgcGFzc2VkLlxuICAgICAgaWYgKHNvdXJjZVJvb3QpIHtcbiAgICAgICAgYVNvdXJjZUZpbGUgPSB1dGlsLnJlbGF0aXZlKHNvdXJjZVJvb3QsIGFTb3VyY2VGaWxlKTtcbiAgICAgIH1cbiAgICAgIC8vIEFwcGx5aW5nIHRoZSBTb3VyY2VNYXAgY2FuIGFkZCBhbmQgcmVtb3ZlIGl0ZW1zIGZyb20gdGhlIHNvdXJjZXMgYW5kXG4gICAgICAvLyB0aGUgbmFtZXMgYXJyYXkuXG4gICAgICB2YXIgbmV3U291cmNlcyA9IG5ldyBBcnJheVNldCgpO1xuICAgICAgdmFyIG5ld05hbWVzID0gbmV3IEFycmF5U2V0KCk7XG5cbiAgICAgIC8vIEZpbmQgbWFwcGluZ3MgZm9yIHRoZSBcImFTb3VyY2VGaWxlXCJcbiAgICAgIHRoaXMuX21hcHBpbmdzLmZvckVhY2goZnVuY3Rpb24gKG1hcHBpbmcpIHtcbiAgICAgICAgaWYgKG1hcHBpbmcuc291cmNlID09PSBhU291cmNlRmlsZSAmJiBtYXBwaW5nLm9yaWdpbmFsTGluZSkge1xuICAgICAgICAgIC8vIENoZWNrIGlmIGl0IGNhbiBiZSBtYXBwZWQgYnkgdGhlIHNvdXJjZSBtYXAsIHRoZW4gdXBkYXRlIHRoZSBtYXBwaW5nLlxuICAgICAgICAgIHZhciBvcmlnaW5hbCA9IGFTb3VyY2VNYXBDb25zdW1lci5vcmlnaW5hbFBvc2l0aW9uRm9yKHtcbiAgICAgICAgICAgIGxpbmU6IG1hcHBpbmcub3JpZ2luYWxMaW5lLFxuICAgICAgICAgICAgY29sdW1uOiBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKG9yaWdpbmFsLnNvdXJjZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gQ29weSBtYXBwaW5nXG4gICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IG9yaWdpbmFsLnNvdXJjZTtcbiAgICAgICAgICAgIGlmIChhU291cmNlTWFwUGF0aCkge1xuICAgICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IHV0aWwuam9pbihhU291cmNlTWFwUGF0aCwgbWFwcGluZy5zb3VyY2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc291cmNlUm9vdCkge1xuICAgICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSA9IHV0aWwucmVsYXRpdmUoc291cmNlUm9vdCwgbWFwcGluZy5zb3VyY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbExpbmUgPSBvcmlnaW5hbC5saW5lO1xuICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbENvbHVtbiA9IG9yaWdpbmFsLmNvbHVtbjtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbC5uYW1lICE9PSBudWxsICYmIG1hcHBpbmcubmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyBPbmx5IHVzZSB0aGUgaWRlbnRpZmllciBuYW1lIGlmIGl0J3MgYW4gaWRlbnRpZmllclxuICAgICAgICAgICAgICAvLyBpbiBib3RoIFNvdXJjZU1hcHNcbiAgICAgICAgICAgICAgbWFwcGluZy5uYW1lID0gb3JpZ2luYWwubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc291cmNlID0gbWFwcGluZy5zb3VyY2U7XG4gICAgICAgIGlmIChzb3VyY2UgJiYgIW5ld1NvdXJjZXMuaGFzKHNvdXJjZSkpIHtcbiAgICAgICAgICBuZXdTb3VyY2VzLmFkZChzb3VyY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5hbWUgPSBtYXBwaW5nLm5hbWU7XG4gICAgICAgIGlmIChuYW1lICYmICFuZXdOYW1lcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICBuZXdOYW1lcy5hZGQobmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgfSwgdGhpcyk7XG4gICAgICB0aGlzLl9zb3VyY2VzID0gbmV3U291cmNlcztcbiAgICAgIHRoaXMuX25hbWVzID0gbmV3TmFtZXM7XG5cbiAgICAgIC8vIENvcHkgc291cmNlc0NvbnRlbnRzIG9mIGFwcGxpZWQgbWFwLlxuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgIGlmIChzb3VyY2VSb290KSB7XG4gICAgICAgICAgICBzb3VyY2VGaWxlID0gdXRpbC5yZWxhdGl2ZShzb3VyY2VSb290LCBzb3VyY2VGaWxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zZXRTb3VyY2VDb250ZW50KHNvdXJjZUZpbGUsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICB9LCB0aGlzKTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBBIG1hcHBpbmcgY2FuIGhhdmUgb25lIG9mIHRoZSB0aHJlZSBsZXZlbHMgb2YgZGF0YTpcbiAgICpcbiAgICogICAxLiBKdXN0IHRoZSBnZW5lcmF0ZWQgcG9zaXRpb24uXG4gICAqICAgMi4gVGhlIEdlbmVyYXRlZCBwb3NpdGlvbiwgb3JpZ2luYWwgcG9zaXRpb24sIGFuZCBvcmlnaW5hbCBzb3VyY2UuXG4gICAqICAgMy4gR2VuZXJhdGVkIGFuZCBvcmlnaW5hbCBwb3NpdGlvbiwgb3JpZ2luYWwgc291cmNlLCBhcyB3ZWxsIGFzIGEgbmFtZVxuICAgKiAgICAgIHRva2VuLlxuICAgKlxuICAgKiBUbyBtYWludGFpbiBjb25zaXN0ZW5jeSwgd2UgdmFsaWRhdGUgdGhhdCBhbnkgbmV3IG1hcHBpbmcgYmVpbmcgYWRkZWQgZmFsbHNcbiAgICogaW4gdG8gb25lIG9mIHRoZXNlIGNhdGVnb3JpZXMuXG4gICAqL1xuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0ZU1hcHBpbmcgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl92YWxpZGF0ZU1hcHBpbmcoYUdlbmVyYXRlZCwgYU9yaWdpbmFsLCBhU291cmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYU5hbWUpIHtcbiAgICAgIGlmIChhR2VuZXJhdGVkICYmICdsaW5lJyBpbiBhR2VuZXJhdGVkICYmICdjb2x1bW4nIGluIGFHZW5lcmF0ZWRcbiAgICAgICAgICAmJiBhR2VuZXJhdGVkLmxpbmUgPiAwICYmIGFHZW5lcmF0ZWQuY29sdW1uID49IDBcbiAgICAgICAgICAmJiAhYU9yaWdpbmFsICYmICFhU291cmNlICYmICFhTmFtZSkge1xuICAgICAgICAvLyBDYXNlIDEuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFHZW5lcmF0ZWQgJiYgJ2xpbmUnIGluIGFHZW5lcmF0ZWQgJiYgJ2NvbHVtbicgaW4gYUdlbmVyYXRlZFxuICAgICAgICAgICAgICAgJiYgYU9yaWdpbmFsICYmICdsaW5lJyBpbiBhT3JpZ2luYWwgJiYgJ2NvbHVtbicgaW4gYU9yaWdpbmFsXG4gICAgICAgICAgICAgICAmJiBhR2VuZXJhdGVkLmxpbmUgPiAwICYmIGFHZW5lcmF0ZWQuY29sdW1uID49IDBcbiAgICAgICAgICAgICAgICYmIGFPcmlnaW5hbC5saW5lID4gMCAmJiBhT3JpZ2luYWwuY29sdW1uID49IDBcbiAgICAgICAgICAgICAgICYmIGFTb3VyY2UpIHtcbiAgICAgICAgLy8gQ2FzZXMgMiBhbmQgMy5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtYXBwaW5nOiAnICsgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGdlbmVyYXRlZDogYUdlbmVyYXRlZCxcbiAgICAgICAgICBzb3VyY2U6IGFTb3VyY2UsXG4gICAgICAgICAgb3JpZ2luYWw6IGFPcmlnaW5hbCxcbiAgICAgICAgICBuYW1lOiBhTmFtZVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfTtcblxuICAvKipcbiAgICogU2VyaWFsaXplIHRoZSBhY2N1bXVsYXRlZCBtYXBwaW5ncyBpbiB0byB0aGUgc3RyZWFtIG9mIGJhc2UgNjQgVkxRc1xuICAgKiBzcGVjaWZpZWQgYnkgdGhlIHNvdXJjZSBtYXAgZm9ybWF0LlxuICAgKi9cbiAgU291cmNlTWFwR2VuZXJhdG9yLnByb3RvdHlwZS5fc2VyaWFsaXplTWFwcGluZ3MgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl9zZXJpYWxpemVNYXBwaW5ncygpIHtcbiAgICAgIHZhciBwcmV2aW91c0dlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNHZW5lcmF0ZWRMaW5lID0gMTtcbiAgICAgIHZhciBwcmV2aW91c09yaWdpbmFsQ29sdW1uID0gMDtcbiAgICAgIHZhciBwcmV2aW91c09yaWdpbmFsTGluZSA9IDA7XG4gICAgICB2YXIgcHJldmlvdXNOYW1lID0gMDtcbiAgICAgIHZhciBwcmV2aW91c1NvdXJjZSA9IDA7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICB2YXIgbWFwcGluZztcblxuICAgICAgLy8gVGhlIG1hcHBpbmdzIG11c3QgYmUgZ3VhcmFudGVlZCB0byBiZSBpbiBzb3J0ZWQgb3JkZXIgYmVmb3JlIHdlIHN0YXJ0XG4gICAgICAvLyBzZXJpYWxpemluZyB0aGVtIG9yIGVsc2UgdGhlIGdlbmVyYXRlZCBsaW5lIG51bWJlcnMgKHdoaWNoIGFyZSBkZWZpbmVkXG4gICAgICAvLyB2aWEgdGhlICc7JyBzZXBhcmF0b3JzKSB3aWxsIGJlIGFsbCBtZXNzZWQgdXAuIE5vdGU6IGl0IG1pZ2h0IGJlIG1vcmVcbiAgICAgIC8vIHBlcmZvcm1hbnQgdG8gbWFpbnRhaW4gdGhlIHNvcnRpbmcgYXMgd2UgaW5zZXJ0IHRoZW0sIHJhdGhlciB0aGFuIGFzIHdlXG4gICAgICAvLyBzZXJpYWxpemUgdGhlbSwgYnV0IHRoZSBiaWcgTyBpcyB0aGUgc2FtZSBlaXRoZXIgd2F5LlxuICAgICAgdGhpcy5fbWFwcGluZ3Muc29ydCh1dGlsLmNvbXBhcmVCeUdlbmVyYXRlZFBvc2l0aW9ucyk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9tYXBwaW5ncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBtYXBwaW5nID0gdGhpcy5fbWFwcGluZ3NbaV07XG5cbiAgICAgICAgaWYgKG1hcHBpbmcuZ2VuZXJhdGVkTGluZSAhPT0gcHJldmlvdXNHZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgICAgcHJldmlvdXNHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuICAgICAgICAgIHdoaWxlIChtYXBwaW5nLmdlbmVyYXRlZExpbmUgIT09IHByZXZpb3VzR2VuZXJhdGVkTGluZSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICc7JztcbiAgICAgICAgICAgIHByZXZpb3VzR2VuZXJhdGVkTGluZSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgIGlmICghdXRpbC5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMobWFwcGluZywgdGhpcy5fbWFwcGluZ3NbaSAtIDFdKSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdCArPSAnLCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ICs9IGJhc2U2NFZMUS5lbmNvZGUobWFwcGluZy5nZW5lcmF0ZWRDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBwcmV2aW91c0dlbmVyYXRlZENvbHVtbik7XG4gICAgICAgIHByZXZpb3VzR2VuZXJhdGVkQ29sdW1uID0gbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW47XG5cbiAgICAgICAgaWYgKG1hcHBpbmcuc291cmNlKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IGJhc2U2NFZMUS5lbmNvZGUodGhpcy5fc291cmNlcy5pbmRleE9mKG1hcHBpbmcuc291cmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gcHJldmlvdXNTb3VyY2UpO1xuICAgICAgICAgIHByZXZpb3VzU291cmNlID0gdGhpcy5fc291cmNlcy5pbmRleE9mKG1hcHBpbmcuc291cmNlKTtcblxuICAgICAgICAgIC8vIGxpbmVzIGFyZSBzdG9yZWQgMC1iYXNlZCBpbiBTb3VyY2VNYXAgc3BlYyB2ZXJzaW9uIDNcbiAgICAgICAgICByZXN1bHQgKz0gYmFzZTY0VkxRLmVuY29kZShtYXBwaW5nLm9yaWdpbmFsTGluZSAtIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzT3JpZ2luYWxMaW5lKTtcbiAgICAgICAgICBwcmV2aW91c09yaWdpbmFsTGluZSA9IG1hcHBpbmcub3JpZ2luYWxMaW5lIC0gMTtcblxuICAgICAgICAgIHJlc3VsdCArPSBiYXNlNjRWTFEuZW5jb2RlKG1hcHBpbmcub3JpZ2luYWxDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4pO1xuICAgICAgICAgIHByZXZpb3VzT3JpZ2luYWxDb2x1bW4gPSBtYXBwaW5nLm9yaWdpbmFsQ29sdW1uO1xuXG4gICAgICAgICAgaWYgKG1hcHBpbmcubmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9IGJhc2U2NFZMUS5lbmNvZGUodGhpcy5fbmFtZXMuaW5kZXhPZihtYXBwaW5nLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIHByZXZpb3VzTmFtZSk7XG4gICAgICAgICAgICBwcmV2aW91c05hbWUgPSB0aGlzLl9uYW1lcy5pbmRleE9mKG1hcHBpbmcubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICBTb3VyY2VNYXBHZW5lcmF0b3IucHJvdG90eXBlLl9nZW5lcmF0ZVNvdXJjZXNDb250ZW50ID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3JfZ2VuZXJhdGVTb3VyY2VzQ29udGVudChhU291cmNlcywgYVNvdXJjZVJvb3QpIHtcbiAgICAgIHJldHVybiBhU291cmNlcy5tYXAoZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgICBpZiAoIXRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhU291cmNlUm9vdCkge1xuICAgICAgICAgIHNvdXJjZSA9IHV0aWwucmVsYXRpdmUoYVNvdXJjZVJvb3QsIHNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSA9IHV0aWwudG9TZXRTdHJpbmcoc291cmNlKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLl9zb3VyY2VzQ29udGVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5KVxuICAgICAgICAgID8gdGhpcy5fc291cmNlc0NvbnRlbnRzW2tleV1cbiAgICAgICAgICA6IG51bGw7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9O1xuXG4gIC8qKlxuICAgKiBFeHRlcm5hbGl6ZSB0aGUgc291cmNlIG1hcC5cbiAgICovXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUudG9KU09OID1cbiAgICBmdW5jdGlvbiBTb3VyY2VNYXBHZW5lcmF0b3JfdG9KU09OKCkge1xuICAgICAgdmFyIG1hcCA9IHtcbiAgICAgICAgdmVyc2lvbjogdGhpcy5fdmVyc2lvbixcbiAgICAgICAgZmlsZTogdGhpcy5fZmlsZSxcbiAgICAgICAgc291cmNlczogdGhpcy5fc291cmNlcy50b0FycmF5KCksXG4gICAgICAgIG5hbWVzOiB0aGlzLl9uYW1lcy50b0FycmF5KCksXG4gICAgICAgIG1hcHBpbmdzOiB0aGlzLl9zZXJpYWxpemVNYXBwaW5ncygpXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMuX3NvdXJjZVJvb3QpIHtcbiAgICAgICAgbWFwLnNvdXJjZVJvb3QgPSB0aGlzLl9zb3VyY2VSb290O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3NvdXJjZXNDb250ZW50cykge1xuICAgICAgICBtYXAuc291cmNlc0NvbnRlbnQgPSB0aGlzLl9nZW5lcmF0ZVNvdXJjZXNDb250ZW50KG1hcC5zb3VyY2VzLCBtYXAuc291cmNlUm9vdCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtYXA7XG4gICAgfTtcblxuICAvKipcbiAgICogUmVuZGVyIHRoZSBzb3VyY2UgbWFwIGJlaW5nIGdlbmVyYXRlZCB0byBhIHN0cmluZy5cbiAgICovXG4gIFNvdXJjZU1hcEdlbmVyYXRvci5wcm90b3R5cGUudG9TdHJpbmcgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU1hcEdlbmVyYXRvcl90b1N0cmluZygpIHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzKTtcbiAgICB9O1xuXG4gIGV4cG9ydHMuU291cmNlTWFwR2VuZXJhdG9yID0gU291cmNlTWFwR2VuZXJhdG9yO1xuXG59KTtcbiIsIi8qIC0qLSBNb2RlOiBqczsganMtaW5kZW50LWxldmVsOiAyOyAtKi0gKi9cbi8qXG4gKiBDb3B5cmlnaHQgMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0Ugb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKi9cbmlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlLCByZXF1aXJlKTtcbn1cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbiAgdmFyIFNvdXJjZU1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4vc291cmNlLW1hcC1nZW5lcmF0b3InKS5Tb3VyY2VNYXBHZW5lcmF0b3I7XG4gIHZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgLyoqXG4gICAqIFNvdXJjZU5vZGVzIHByb3ZpZGUgYSB3YXkgdG8gYWJzdHJhY3Qgb3ZlciBpbnRlcnBvbGF0aW5nL2NvbmNhdGVuYXRpbmdcbiAgICogc25pcHBldHMgb2YgZ2VuZXJhdGVkIEphdmFTY3JpcHQgc291cmNlIGNvZGUgd2hpbGUgbWFpbnRhaW5pbmcgdGhlIGxpbmUgYW5kXG4gICAqIGNvbHVtbiBpbmZvcm1hdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlIG9yaWdpbmFsIHNvdXJjZSBjb2RlLlxuICAgKlxuICAgKiBAcGFyYW0gYUxpbmUgVGhlIG9yaWdpbmFsIGxpbmUgbnVtYmVyLlxuICAgKiBAcGFyYW0gYUNvbHVtbiBUaGUgb3JpZ2luYWwgY29sdW1uIG51bWJlci5cbiAgICogQHBhcmFtIGFTb3VyY2UgVGhlIG9yaWdpbmFsIHNvdXJjZSdzIGZpbGVuYW1lLlxuICAgKiBAcGFyYW0gYUNodW5rcyBPcHRpb25hbC4gQW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGljaCBhcmUgc25pcHBldHMgb2ZcbiAgICogICAgICAgIGdlbmVyYXRlZCBKUywgb3Igb3RoZXIgU291cmNlTm9kZXMuXG4gICAqIEBwYXJhbSBhTmFtZSBUaGUgb3JpZ2luYWwgaWRlbnRpZmllci5cbiAgICovXG4gIGZ1bmN0aW9uIFNvdXJjZU5vZGUoYUxpbmUsIGFDb2x1bW4sIGFTb3VyY2UsIGFDaHVua3MsIGFOYW1lKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuc291cmNlQ29udGVudHMgPSB7fTtcbiAgICB0aGlzLmxpbmUgPSBhTGluZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFMaW5lO1xuICAgIHRoaXMuY29sdW1uID0gYUNvbHVtbiA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFDb2x1bW47XG4gICAgdGhpcy5zb3VyY2UgPSBhU291cmNlID09PSB1bmRlZmluZWQgPyBudWxsIDogYVNvdXJjZTtcbiAgICB0aGlzLm5hbWUgPSBhTmFtZSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFOYW1lO1xuICAgIGlmIChhQ2h1bmtzICE9IG51bGwpIHRoaXMuYWRkKGFDaHVua3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTb3VyY2VOb2RlIGZyb20gZ2VuZXJhdGVkIGNvZGUgYW5kIGEgU291cmNlTWFwQ29uc3VtZXIuXG4gICAqXG4gICAqIEBwYXJhbSBhR2VuZXJhdGVkQ29kZSBUaGUgZ2VuZXJhdGVkIGNvZGVcbiAgICogQHBhcmFtIGFTb3VyY2VNYXBDb25zdW1lciBUaGUgU291cmNlTWFwIGZvciB0aGUgZ2VuZXJhdGVkIGNvZGVcbiAgICovXG4gIFNvdXJjZU5vZGUuZnJvbVN0cmluZ1dpdGhTb3VyY2VNYXAgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU5vZGVfZnJvbVN0cmluZ1dpdGhTb3VyY2VNYXAoYUdlbmVyYXRlZENvZGUsIGFTb3VyY2VNYXBDb25zdW1lcikge1xuICAgICAgLy8gVGhlIFNvdXJjZU5vZGUgd2Ugd2FudCB0byBmaWxsIHdpdGggdGhlIGdlbmVyYXRlZCBjb2RlXG4gICAgICAvLyBhbmQgdGhlIFNvdXJjZU1hcFxuICAgICAgdmFyIG5vZGUgPSBuZXcgU291cmNlTm9kZSgpO1xuXG4gICAgICAvLyBUaGUgZ2VuZXJhdGVkIGNvZGVcbiAgICAgIC8vIFByb2Nlc3NlZCBmcmFnbWVudHMgYXJlIHJlbW92ZWQgZnJvbSB0aGlzIGFycmF5LlxuICAgICAgdmFyIHJlbWFpbmluZ0xpbmVzID0gYUdlbmVyYXRlZENvZGUuc3BsaXQoJ1xcbicpO1xuXG4gICAgICAvLyBXZSBuZWVkIHRvIHJlbWVtYmVyIHRoZSBwb3NpdGlvbiBvZiBcInJlbWFpbmluZ0xpbmVzXCJcbiAgICAgIHZhciBsYXN0R2VuZXJhdGVkTGluZSA9IDEsIGxhc3RHZW5lcmF0ZWRDb2x1bW4gPSAwO1xuXG4gICAgICAvLyBUaGUgZ2VuZXJhdGUgU291cmNlTm9kZXMgd2UgbmVlZCBhIGNvZGUgcmFuZ2UuXG4gICAgICAvLyBUbyBleHRyYWN0IGl0IGN1cnJlbnQgYW5kIGxhc3QgbWFwcGluZyBpcyB1c2VkLlxuICAgICAgLy8gSGVyZSB3ZSBzdG9yZSB0aGUgbGFzdCBtYXBwaW5nLlxuICAgICAgdmFyIGxhc3RNYXBwaW5nID0gbnVsbDtcblxuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLmVhY2hNYXBwaW5nKGZ1bmN0aW9uIChtYXBwaW5nKSB7XG4gICAgICAgIGlmIChsYXN0TWFwcGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIFdlIGFkZCB0aGUgY29kZSBmcm9tIFwibGFzdE1hcHBpbmdcIiB0byBcIm1hcHBpbmdcIjpcbiAgICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGVyZSBpcyBhIG5ldyBsaW5lIGluIGJldHdlZW4uXG4gICAgICAgICAgaWYgKGxhc3RHZW5lcmF0ZWRMaW5lIDwgbWFwcGluZy5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IFwiXCI7XG4gICAgICAgICAgICAvLyBBc3NvY2lhdGUgZmlyc3QgbGluZSB3aXRoIFwibGFzdE1hcHBpbmdcIlxuICAgICAgICAgICAgYWRkTWFwcGluZ1dpdGhDb2RlKGxhc3RNYXBwaW5nLCByZW1haW5pbmdMaW5lcy5zaGlmdCgpICsgXCJcXG5cIik7XG4gICAgICAgICAgICBsYXN0R2VuZXJhdGVkTGluZSsrO1xuICAgICAgICAgICAgbGFzdEdlbmVyYXRlZENvbHVtbiA9IDA7XG4gICAgICAgICAgICAvLyBUaGUgcmVtYWluaW5nIGNvZGUgaXMgYWRkZWQgd2l0aG91dCBtYXBwaW5nXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIG5ldyBsaW5lIGluIGJldHdlZW4uXG4gICAgICAgICAgICAvLyBBc3NvY2lhdGUgdGhlIGNvZGUgYmV0d2VlbiBcImxhc3RHZW5lcmF0ZWRDb2x1bW5cIiBhbmRcbiAgICAgICAgICAgIC8vIFwibWFwcGluZy5nZW5lcmF0ZWRDb2x1bW5cIiB3aXRoIFwibGFzdE1hcHBpbmdcIlxuICAgICAgICAgICAgdmFyIG5leHRMaW5lID0gcmVtYWluaW5nTGluZXNbMF07XG4gICAgICAgICAgICB2YXIgY29kZSA9IG5leHRMaW5lLnN1YnN0cigwLCBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbiAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uKTtcbiAgICAgICAgICAgIHJlbWFpbmluZ0xpbmVzWzBdID0gbmV4dExpbmUuc3Vic3RyKG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RHZW5lcmF0ZWRDb2x1bW4pO1xuICAgICAgICAgICAgbGFzdEdlbmVyYXRlZENvbHVtbiA9IG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uO1xuICAgICAgICAgICAgYWRkTWFwcGluZ1dpdGhDb2RlKGxhc3RNYXBwaW5nLCBjb2RlKTtcbiAgICAgICAgICAgIC8vIE5vIG1vcmUgcmVtYWluaW5nIGNvZGUsIGNvbnRpbnVlXG4gICAgICAgICAgICBsYXN0TWFwcGluZyA9IG1hcHBpbmc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGFkZCB0aGUgZ2VuZXJhdGVkIGNvZGUgdW50aWwgdGhlIGZpcnN0IG1hcHBpbmdcbiAgICAgICAgLy8gdG8gdGhlIFNvdXJjZU5vZGUgd2l0aG91dCBhbnkgbWFwcGluZy5cbiAgICAgICAgLy8gRWFjaCBsaW5lIGlzIGFkZGVkIGFzIHNlcGFyYXRlIHN0cmluZy5cbiAgICAgICAgd2hpbGUgKGxhc3RHZW5lcmF0ZWRMaW5lIDwgbWFwcGluZy5nZW5lcmF0ZWRMaW5lKSB7XG4gICAgICAgICAgbm9kZS5hZGQocmVtYWluaW5nTGluZXMuc2hpZnQoKSArIFwiXFxuXCIpO1xuICAgICAgICAgIGxhc3RHZW5lcmF0ZWRMaW5lKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3RHZW5lcmF0ZWRDb2x1bW4gPCBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbikge1xuICAgICAgICAgIHZhciBuZXh0TGluZSA9IHJlbWFpbmluZ0xpbmVzWzBdO1xuICAgICAgICAgIG5vZGUuYWRkKG5leHRMaW5lLnN1YnN0cigwLCBtYXBwaW5nLmdlbmVyYXRlZENvbHVtbikpO1xuICAgICAgICAgIHJlbWFpbmluZ0xpbmVzWzBdID0gbmV4dExpbmUuc3Vic3RyKG1hcHBpbmcuZ2VuZXJhdGVkQ29sdW1uKTtcbiAgICAgICAgICBsYXN0R2VuZXJhdGVkQ29sdW1uID0gbWFwcGluZy5nZW5lcmF0ZWRDb2x1bW47XG4gICAgICAgIH1cbiAgICAgICAgbGFzdE1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgfSwgdGhpcyk7XG4gICAgICAvLyBXZSBoYXZlIHByb2Nlc3NlZCBhbGwgbWFwcGluZ3MuXG4gICAgICBpZiAocmVtYWluaW5nTGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAobGFzdE1hcHBpbmcpIHtcbiAgICAgICAgICAvLyBBc3NvY2lhdGUgdGhlIHJlbWFpbmluZyBjb2RlIGluIHRoZSBjdXJyZW50IGxpbmUgd2l0aCBcImxhc3RNYXBwaW5nXCJcbiAgICAgICAgICB2YXIgbGFzdExpbmUgPSByZW1haW5pbmdMaW5lcy5zaGlmdCgpO1xuICAgICAgICAgIGlmIChyZW1haW5pbmdMaW5lcy5sZW5ndGggPiAwKSBsYXN0TGluZSArPSBcIlxcblwiO1xuICAgICAgICAgIGFkZE1hcHBpbmdXaXRoQ29kZShsYXN0TWFwcGluZywgbGFzdExpbmUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFuZCBhZGQgdGhlIHJlbWFpbmluZyBsaW5lcyB3aXRob3V0IGFueSBtYXBwaW5nXG4gICAgICAgIG5vZGUuYWRkKHJlbWFpbmluZ0xpbmVzLmpvaW4oXCJcXG5cIikpO1xuICAgICAgfVxuXG4gICAgICAvLyBDb3B5IHNvdXJjZXNDb250ZW50IGludG8gU291cmNlTm9kZVxuICAgICAgYVNvdXJjZU1hcENvbnN1bWVyLnNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlRmlsZSkge1xuICAgICAgICB2YXIgY29udGVudCA9IGFTb3VyY2VNYXBDb25zdW1lci5zb3VyY2VDb250ZW50Rm9yKHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgIG5vZGUuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlLCBjb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBub2RlO1xuXG4gICAgICBmdW5jdGlvbiBhZGRNYXBwaW5nV2l0aENvZGUobWFwcGluZywgY29kZSkge1xuICAgICAgICBpZiAobWFwcGluZyA9PT0gbnVsbCB8fCBtYXBwaW5nLnNvdXJjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbm9kZS5hZGQoY29kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9kZS5hZGQobmV3IFNvdXJjZU5vZGUobWFwcGluZy5vcmlnaW5hbExpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwcGluZy5vcmlnaW5hbENvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBwaW5nLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcHBpbmcubmFtZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAvKipcbiAgICogQWRkIGEgY2h1bmsgb2YgZ2VuZXJhdGVkIEpTIHRvIHRoaXMgc291cmNlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBhQ2h1bmsgQSBzdHJpbmcgc25pcHBldCBvZiBnZW5lcmF0ZWQgSlMgY29kZSwgYW5vdGhlciBpbnN0YW5jZSBvZlxuICAgKiAgICAgICAgU291cmNlTm9kZSwgb3IgYW4gYXJyYXkgd2hlcmUgZWFjaCBtZW1iZXIgaXMgb25lIG9mIHRob3NlIHRoaW5ncy5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfYWRkKGFDaHVuaykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFDaHVuaykpIHtcbiAgICAgIGFDaHVuay5mb3JFYWNoKGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICB0aGlzLmFkZChjaHVuayk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYUNodW5rIGluc3RhbmNlb2YgU291cmNlTm9kZSB8fCB0eXBlb2YgYUNodW5rID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpZiAoYUNodW5rKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChhQ2h1bmspO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiRXhwZWN0ZWQgYSBTb3VyY2VOb2RlLCBzdHJpbmcsIG9yIGFuIGFycmF5IG9mIFNvdXJjZU5vZGVzIGFuZCBzdHJpbmdzLiBHb3QgXCIgKyBhQ2h1bmtcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgYSBjaHVuayBvZiBnZW5lcmF0ZWQgSlMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGlzIHNvdXJjZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gYUNodW5rIEEgc3RyaW5nIHNuaXBwZXQgb2YgZ2VuZXJhdGVkIEpTIGNvZGUsIGFub3RoZXIgaW5zdGFuY2Ugb2ZcbiAgICogICAgICAgIFNvdXJjZU5vZGUsIG9yIGFuIGFycmF5IHdoZXJlIGVhY2ggbWVtYmVyIGlzIG9uZSBvZiB0aG9zZSB0aGluZ3MuXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS5wcmVwZW5kID0gZnVuY3Rpb24gU291cmNlTm9kZV9wcmVwZW5kKGFDaHVuaykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFDaHVuaykpIHtcbiAgICAgIGZvciAodmFyIGkgPSBhQ2h1bmsubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHRoaXMucHJlcGVuZChhQ2h1bmtbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChhQ2h1bmsgaW5zdGFuY2VvZiBTb3VyY2VOb2RlIHx8IHR5cGVvZiBhQ2h1bmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuY2hpbGRyZW4udW5zaGlmdChhQ2h1bmspO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiRXhwZWN0ZWQgYSBTb3VyY2VOb2RlLCBzdHJpbmcsIG9yIGFuIGFycmF5IG9mIFNvdXJjZU5vZGVzIGFuZCBzdHJpbmdzLiBHb3QgXCIgKyBhQ2h1bmtcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBXYWxrIG92ZXIgdGhlIHRyZWUgb2YgSlMgc25pcHBldHMgaW4gdGhpcyBub2RlIGFuZCBpdHMgY2hpbGRyZW4uIFRoZVxuICAgKiB3YWxraW5nIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmNlIGZvciBlYWNoIHNuaXBwZXQgb2YgSlMgYW5kIGlzIHBhc3NlZCB0aGF0XG4gICAqIHNuaXBwZXQgYW5kIHRoZSBpdHMgb3JpZ2luYWwgYXNzb2NpYXRlZCBzb3VyY2UncyBsaW5lL2NvbHVtbiBsb2NhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGFGbiBUaGUgdHJhdmVyc2FsIGZ1bmN0aW9uLlxuICAgKi9cbiAgU291cmNlTm9kZS5wcm90b3R5cGUud2FsayA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfd2FsayhhRm4pIHtcbiAgICB2YXIgY2h1bms7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNodW5rID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgIGlmIChjaHVuayBpbnN0YW5jZW9mIFNvdXJjZU5vZGUpIHtcbiAgICAgICAgY2h1bmsud2FsayhhRm4pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChjaHVuayAhPT0gJycpIHtcbiAgICAgICAgICBhRm4oY2h1bmssIHsgc291cmNlOiB0aGlzLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgbGluZTogdGhpcy5saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICBjb2x1bW46IHRoaXMuY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIExpa2UgYFN0cmluZy5wcm90b3R5cGUuam9pbmAgZXhjZXB0IGZvciBTb3VyY2VOb2Rlcy4gSW5zZXJ0cyBgYVN0cmAgYmV0d2VlblxuICAgKiBlYWNoIG9mIGB0aGlzLmNoaWxkcmVuYC5cbiAgICpcbiAgICogQHBhcmFtIGFTZXAgVGhlIHNlcGFyYXRvci5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiBTb3VyY2VOb2RlX2pvaW4oYVNlcCkge1xuICAgIHZhciBuZXdDaGlsZHJlbjtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7XG4gICAgaWYgKGxlbiA+IDApIHtcbiAgICAgIG5ld0NoaWxkcmVuID0gW107XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuLTE7IGkrKykge1xuICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKHRoaXMuY2hpbGRyZW5baV0pO1xuICAgICAgICBuZXdDaGlsZHJlbi5wdXNoKGFTZXApO1xuICAgICAgfVxuICAgICAgbmV3Q2hpbGRyZW4ucHVzaCh0aGlzLmNoaWxkcmVuW2ldKTtcbiAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXdDaGlsZHJlbjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGwgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlIG9uIHRoZSB2ZXJ5IHJpZ2h0LW1vc3Qgc291cmNlIHNuaXBwZXQuIFVzZWZ1bFxuICAgKiBmb3IgdHJpbW1pbmcgd2hpdGVzcGFjZSBmcm9tIHRoZSBlbmQgb2YgYSBzb3VyY2Ugbm9kZSwgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0gYVBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gcmVwbGFjZS5cbiAgICogQHBhcmFtIGFSZXBsYWNlbWVudCBUaGUgdGhpbmcgdG8gcmVwbGFjZSB0aGUgcGF0dGVybiB3aXRoLlxuICAgKi9cbiAgU291cmNlTm9kZS5wcm90b3R5cGUucmVwbGFjZVJpZ2h0ID0gZnVuY3Rpb24gU291cmNlTm9kZV9yZXBsYWNlUmlnaHQoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCkge1xuICAgIHZhciBsYXN0Q2hpbGQgPSB0aGlzLmNoaWxkcmVuW3RoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3RDaGlsZCBpbnN0YW5jZW9mIFNvdXJjZU5vZGUpIHtcbiAgICAgIGxhc3RDaGlsZC5yZXBsYWNlUmlnaHQoYVBhdHRlcm4sIGFSZXBsYWNlbWVudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBsYXN0Q2hpbGQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuW3RoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMV0gPSBsYXN0Q2hpbGQucmVwbGFjZShhUGF0dGVybiwgYVJlcGxhY2VtZW50KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goJycucmVwbGFjZShhUGF0dGVybiwgYVJlcGxhY2VtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNvdXJjZSBjb250ZW50IGZvciBhIHNvdXJjZSBmaWxlLiBUaGlzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIFNvdXJjZU1hcEdlbmVyYXRvclxuICAgKiBpbiB0aGUgc291cmNlc0NvbnRlbnQgZmllbGQuXG4gICAqXG4gICAqIEBwYXJhbSBhU291cmNlRmlsZSBUaGUgZmlsZW5hbWUgb2YgdGhlIHNvdXJjZSBmaWxlXG4gICAqIEBwYXJhbSBhU291cmNlQ29udGVudCBUaGUgY29udGVudCBvZiB0aGUgc291cmNlIGZpbGVcbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLnNldFNvdXJjZUNvbnRlbnQgPVxuICAgIGZ1bmN0aW9uIFNvdXJjZU5vZGVfc2V0U291cmNlQ29udGVudChhU291cmNlRmlsZSwgYVNvdXJjZUNvbnRlbnQpIHtcbiAgICAgIHRoaXMuc291cmNlQ29udGVudHNbdXRpbC50b1NldFN0cmluZyhhU291cmNlRmlsZSldID0gYVNvdXJjZUNvbnRlbnQ7XG4gICAgfTtcblxuICAvKipcbiAgICogV2FsayBvdmVyIHRoZSB0cmVlIG9mIFNvdXJjZU5vZGVzLiBUaGUgd2Fsa2luZyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIGVhY2hcbiAgICogc291cmNlIGZpbGUgY29udGVudCBhbmQgaXMgcGFzc2VkIHRoZSBmaWxlbmFtZSBhbmQgc291cmNlIGNvbnRlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBhRm4gVGhlIHRyYXZlcnNhbCBmdW5jdGlvbi5cbiAgICovXG4gIFNvdXJjZU5vZGUucHJvdG90eXBlLndhbGtTb3VyY2VDb250ZW50cyA9XG4gICAgZnVuY3Rpb24gU291cmNlTm9kZV93YWxrU291cmNlQ29udGVudHMoYUZuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltpXSBpbnN0YW5jZW9mIFNvdXJjZU5vZGUpIHtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuW2ldLndhbGtTb3VyY2VDb250ZW50cyhhRm4pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBzb3VyY2VzID0gT2JqZWN0LmtleXModGhpcy5zb3VyY2VDb250ZW50cyk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gc291cmNlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBhRm4odXRpbC5mcm9tU2V0U3RyaW5nKHNvdXJjZXNbaV0pLCB0aGlzLnNvdXJjZUNvbnRlbnRzW3NvdXJjZXNbaV1dKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHNvdXJjZSBub2RlLiBXYWxrcyBvdmVyIHRoZSB0cmVlXG4gICAqIGFuZCBjb25jYXRlbmF0ZXMgYWxsIHRoZSB2YXJpb3VzIHNuaXBwZXRzIHRvZ2V0aGVyIHRvIG9uZSBzdHJpbmcuXG4gICAqL1xuICBTb3VyY2VOb2RlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIFNvdXJjZU5vZGVfdG9TdHJpbmcoKSB7XG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgdGhpcy53YWxrKGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgc3RyICs9IGNodW5rO1xuICAgIH0pO1xuICAgIHJldHVybiBzdHI7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHNvdXJjZSBub2RlIGFsb25nIHdpdGggYSBzb3VyY2VcbiAgICogbWFwLlxuICAgKi9cbiAgU291cmNlTm9kZS5wcm90b3R5cGUudG9TdHJpbmdXaXRoU291cmNlTWFwID0gZnVuY3Rpb24gU291cmNlTm9kZV90b1N0cmluZ1dpdGhTb3VyY2VNYXAoYUFyZ3MpIHtcbiAgICB2YXIgZ2VuZXJhdGVkID0ge1xuICAgICAgY29kZTogXCJcIixcbiAgICAgIGxpbmU6IDEsXG4gICAgICBjb2x1bW46IDBcbiAgICB9O1xuICAgIHZhciBtYXAgPSBuZXcgU291cmNlTWFwR2VuZXJhdG9yKGFBcmdzKTtcbiAgICB2YXIgc291cmNlTWFwcGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgIHZhciBsYXN0T3JpZ2luYWxTb3VyY2UgPSBudWxsO1xuICAgIHZhciBsYXN0T3JpZ2luYWxMaW5lID0gbnVsbDtcbiAgICB2YXIgbGFzdE9yaWdpbmFsQ29sdW1uID0gbnVsbDtcbiAgICB2YXIgbGFzdE9yaWdpbmFsTmFtZSA9IG51bGw7XG4gICAgdGhpcy53YWxrKGZ1bmN0aW9uIChjaHVuaywgb3JpZ2luYWwpIHtcbiAgICAgIGdlbmVyYXRlZC5jb2RlICs9IGNodW5rO1xuICAgICAgaWYgKG9yaWdpbmFsLnNvdXJjZSAhPT0gbnVsbFxuICAgICAgICAgICYmIG9yaWdpbmFsLmxpbmUgIT09IG51bGxcbiAgICAgICAgICAmJiBvcmlnaW5hbC5jb2x1bW4gIT09IG51bGwpIHtcbiAgICAgICAgaWYobGFzdE9yaWdpbmFsU291cmNlICE9PSBvcmlnaW5hbC5zb3VyY2VcbiAgICAgICAgICAgfHwgbGFzdE9yaWdpbmFsTGluZSAhPT0gb3JpZ2luYWwubGluZVxuICAgICAgICAgICB8fCBsYXN0T3JpZ2luYWxDb2x1bW4gIT09IG9yaWdpbmFsLmNvbHVtblxuICAgICAgICAgICB8fCBsYXN0T3JpZ2luYWxOYW1lICE9PSBvcmlnaW5hbC5uYW1lKSB7XG4gICAgICAgICAgbWFwLmFkZE1hcHBpbmcoe1xuICAgICAgICAgICAgc291cmNlOiBvcmlnaW5hbC5zb3VyY2UsXG4gICAgICAgICAgICBvcmlnaW5hbDoge1xuICAgICAgICAgICAgICBsaW5lOiBvcmlnaW5hbC5saW5lLFxuICAgICAgICAgICAgICBjb2x1bW46IG9yaWdpbmFsLmNvbHVtblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbmVyYXRlZDoge1xuICAgICAgICAgICAgICBsaW5lOiBnZW5lcmF0ZWQubGluZSxcbiAgICAgICAgICAgICAgY29sdW1uOiBnZW5lcmF0ZWQuY29sdW1uXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFtZTogb3JpZ2luYWwubmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RPcmlnaW5hbFNvdXJjZSA9IG9yaWdpbmFsLnNvdXJjZTtcbiAgICAgICAgbGFzdE9yaWdpbmFsTGluZSA9IG9yaWdpbmFsLmxpbmU7XG4gICAgICAgIGxhc3RPcmlnaW5hbENvbHVtbiA9IG9yaWdpbmFsLmNvbHVtbjtcbiAgICAgICAgbGFzdE9yaWdpbmFsTmFtZSA9IG9yaWdpbmFsLm5hbWU7XG4gICAgICAgIHNvdXJjZU1hcHBpbmdBY3RpdmUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChzb3VyY2VNYXBwaW5nQWN0aXZlKSB7XG4gICAgICAgIG1hcC5hZGRNYXBwaW5nKHtcbiAgICAgICAgICBnZW5lcmF0ZWQ6IHtcbiAgICAgICAgICAgIGxpbmU6IGdlbmVyYXRlZC5saW5lLFxuICAgICAgICAgICAgY29sdW1uOiBnZW5lcmF0ZWQuY29sdW1uXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgbGFzdE9yaWdpbmFsU291cmNlID0gbnVsbDtcbiAgICAgICAgc291cmNlTWFwcGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY2h1bmsuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGNoLCBpZHgsIGFycmF5KSB7XG4gICAgICAgIGlmIChjaCA9PT0gJ1xcbicpIHtcbiAgICAgICAgICBnZW5lcmF0ZWQubGluZSsrO1xuICAgICAgICAgIGdlbmVyYXRlZC5jb2x1bW4gPSAwO1xuICAgICAgICAgIC8vIE1hcHBpbmdzIGVuZCBhdCBlb2xcbiAgICAgICAgICBpZiAoaWR4ICsgMSA9PT0gYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBsYXN0T3JpZ2luYWxTb3VyY2UgPSBudWxsO1xuICAgICAgICAgICAgc291cmNlTWFwcGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlTWFwcGluZ0FjdGl2ZSkge1xuICAgICAgICAgICAgbWFwLmFkZE1hcHBpbmcoe1xuICAgICAgICAgICAgICBzb3VyY2U6IG9yaWdpbmFsLnNvdXJjZSxcbiAgICAgICAgICAgICAgb3JpZ2luYWw6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBvcmlnaW5hbC5saW5lLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogb3JpZ2luYWwuY29sdW1uXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGdlbmVyYXRlZDoge1xuICAgICAgICAgICAgICAgIGxpbmU6IGdlbmVyYXRlZC5saW5lLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogZ2VuZXJhdGVkLmNvbHVtblxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBuYW1lOiBvcmlnaW5hbC5uYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ2VuZXJhdGVkLmNvbHVtbisrO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLndhbGtTb3VyY2VDb250ZW50cyhmdW5jdGlvbiAoc291cmNlRmlsZSwgc291cmNlQ29udGVudCkge1xuICAgICAgbWFwLnNldFNvdXJjZUNvbnRlbnQoc291cmNlRmlsZSwgc291cmNlQ29udGVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBjb2RlOiBnZW5lcmF0ZWQuY29kZSwgbWFwOiBtYXAgfTtcbiAgfTtcblxuICBleHBvcnRzLlNvdXJjZU5vZGUgPSBTb3VyY2VOb2RlO1xuXG59KTtcbiIsIi8qIC0qLSBNb2RlOiBqczsganMtaW5kZW50LWxldmVsOiAyOyAtKi0gKi9cbi8qXG4gKiBDb3B5cmlnaHQgMjAxMSBNb3ppbGxhIEZvdW5kYXRpb24gYW5kIGNvbnRyaWJ1dG9yc1xuICogTGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgbGljZW5zZS4gU2VlIExJQ0VOU0Ugb3I6XG4gKiBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvQlNELTMtQ2xhdXNlXG4gKi9cbmlmICh0eXBlb2YgZGVmaW5lICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFyIGRlZmluZSA9IHJlcXVpcmUoJ2FtZGVmaW5lJykobW9kdWxlLCByZXF1aXJlKTtcbn1cbmRlZmluZShmdW5jdGlvbiAocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBoZWxwZXIgZnVuY3Rpb24gZm9yIGdldHRpbmcgdmFsdWVzIGZyb20gcGFyYW1ldGVyL29wdGlvbnNcbiAgICogb2JqZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIGFyZ3MgVGhlIG9iamVjdCB3ZSBhcmUgZXh0cmFjdGluZyB2YWx1ZXMgZnJvbVxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgd2UgYXJlIGdldHRpbmcuXG4gICAqIEBwYXJhbSBkZWZhdWx0VmFsdWUgQW4gb3B0aW9uYWwgdmFsdWUgdG8gcmV0dXJuIGlmIHRoZSBwcm9wZXJ0eSBpcyBtaXNzaW5nXG4gICAqIGZyb20gdGhlIG9iamVjdC4gSWYgdGhpcyBpcyBub3Qgc3BlY2lmaWVkIGFuZCB0aGUgcHJvcGVydHkgaXMgbWlzc2luZywgYW5cbiAgICogZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gICAqL1xuICBmdW5jdGlvbiBnZXRBcmcoYUFyZ3MsIGFOYW1lLCBhRGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKGFOYW1lIGluIGFBcmdzKSB7XG4gICAgICByZXR1cm4gYUFyZ3NbYU5hbWVdO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgcmV0dXJuIGFEZWZhdWx0VmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCInICsgYU5hbWUgKyAnXCIgaXMgYSByZXF1aXJlZCBhcmd1bWVudC4nKTtcbiAgICB9XG4gIH1cbiAgZXhwb3J0cy5nZXRBcmcgPSBnZXRBcmc7XG5cbiAgdmFyIHVybFJlZ2V4cCA9IC9eKD86KFtcXHcrXFwtLl0rKTopP1xcL1xcLyg/OihcXHcrOlxcdyspQCk/KFtcXHcuXSopKD86OihcXGQrKSk/KFxcUyopJC87XG4gIHZhciBkYXRhVXJsUmVnZXhwID0gL15kYXRhOi4rXFwsLiskLztcblxuICBmdW5jdGlvbiB1cmxQYXJzZShhVXJsKSB7XG4gICAgdmFyIG1hdGNoID0gYVVybC5tYXRjaCh1cmxSZWdleHApO1xuICAgIGlmICghbWF0Y2gpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgc2NoZW1lOiBtYXRjaFsxXSxcbiAgICAgIGF1dGg6IG1hdGNoWzJdLFxuICAgICAgaG9zdDogbWF0Y2hbM10sXG4gICAgICBwb3J0OiBtYXRjaFs0XSxcbiAgICAgIHBhdGg6IG1hdGNoWzVdXG4gICAgfTtcbiAgfVxuICBleHBvcnRzLnVybFBhcnNlID0gdXJsUGFyc2U7XG5cbiAgZnVuY3Rpb24gdXJsR2VuZXJhdGUoYVBhcnNlZFVybCkge1xuICAgIHZhciB1cmwgPSAnJztcbiAgICBpZiAoYVBhcnNlZFVybC5zY2hlbWUpIHtcbiAgICAgIHVybCArPSBhUGFyc2VkVXJsLnNjaGVtZSArICc6JztcbiAgICB9XG4gICAgdXJsICs9ICcvLyc7XG4gICAgaWYgKGFQYXJzZWRVcmwuYXV0aCkge1xuICAgICAgdXJsICs9IGFQYXJzZWRVcmwuYXV0aCArICdAJztcbiAgICB9XG4gICAgaWYgKGFQYXJzZWRVcmwuaG9zdCkge1xuICAgICAgdXJsICs9IGFQYXJzZWRVcmwuaG9zdDtcbiAgICB9XG4gICAgaWYgKGFQYXJzZWRVcmwucG9ydCkge1xuICAgICAgdXJsICs9IFwiOlwiICsgYVBhcnNlZFVybC5wb3J0XG4gICAgfVxuICAgIGlmIChhUGFyc2VkVXJsLnBhdGgpIHtcbiAgICAgIHVybCArPSBhUGFyc2VkVXJsLnBhdGg7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG4gIH1cbiAgZXhwb3J0cy51cmxHZW5lcmF0ZSA9IHVybEdlbmVyYXRlO1xuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgcGF0aCwgb3IgdGhlIHBhdGggcG9ydGlvbiBvZiBhIFVSTDpcbiAgICpcbiAgICogLSBSZXBsYWNlcyBjb25zZXF1dGl2ZSBzbGFzaGVzIHdpdGggb25lIHNsYXNoLlxuICAgKiAtIFJlbW92ZXMgdW5uZWNlc3NhcnkgJy4nIHBhcnRzLlxuICAgKiAtIFJlbW92ZXMgdW5uZWNlc3NhcnkgJzxkaXI+Ly4uJyBwYXJ0cy5cbiAgICpcbiAgICogQmFzZWQgb24gY29kZSBpbiB0aGUgTm9kZS5qcyAncGF0aCcgY29yZSBtb2R1bGUuXG4gICAqXG4gICAqIEBwYXJhbSBhUGF0aCBUaGUgcGF0aCBvciB1cmwgdG8gbm9ybWFsaXplLlxuICAgKi9cbiAgZnVuY3Rpb24gbm9ybWFsaXplKGFQYXRoKSB7XG4gICAgdmFyIHBhdGggPSBhUGF0aDtcbiAgICB2YXIgdXJsID0gdXJsUGFyc2UoYVBhdGgpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgIGlmICghdXJsLnBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGFQYXRoO1xuICAgICAgfVxuICAgICAgcGF0aCA9IHVybC5wYXRoO1xuICAgIH1cbiAgICB2YXIgaXNBYnNvbHV0ZSA9IChwYXRoLmNoYXJBdCgwKSA9PT0gJy8nKTtcblxuICAgIHZhciBwYXJ0cyA9IHBhdGguc3BsaXQoL1xcLysvKTtcbiAgICBmb3IgKHZhciBwYXJ0LCB1cCA9IDAsIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgaWYgKHBhcnQgPT09ICcuJykge1xuICAgICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcuLicpIHtcbiAgICAgICAgdXArKztcbiAgICAgIH0gZWxzZSBpZiAodXAgPiAwKSB7XG4gICAgICAgIGlmIChwYXJ0ID09PSAnJykge1xuICAgICAgICAgIC8vIFRoZSBmaXJzdCBwYXJ0IGlzIGJsYW5rIGlmIHRoZSBwYXRoIGlzIGFic29sdXRlLiBUcnlpbmcgdG8gZ29cbiAgICAgICAgICAvLyBhYm92ZSB0aGUgcm9vdCBpcyBhIG5vLW9wLiBUaGVyZWZvcmUgd2UgY2FuIHJlbW92ZSBhbGwgJy4uJyBwYXJ0c1xuICAgICAgICAgIC8vIGRpcmVjdGx5IGFmdGVyIHRoZSByb290LlxuICAgICAgICAgIHBhcnRzLnNwbGljZShpICsgMSwgdXApO1xuICAgICAgICAgIHVwID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJ0cy5zcGxpY2UoaSwgMik7XG4gICAgICAgICAgdXAtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBwYXRoID0gcGFydHMuam9pbignLycpO1xuXG4gICAgaWYgKHBhdGggPT09ICcnKSB7XG4gICAgICBwYXRoID0gaXNBYnNvbHV0ZSA/ICcvJyA6ICcuJztcbiAgICB9XG5cbiAgICBpZiAodXJsKSB7XG4gICAgICB1cmwucGF0aCA9IHBhdGg7XG4gICAgICByZXR1cm4gdXJsR2VuZXJhdGUodXJsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cbiAgZXhwb3J0cy5ub3JtYWxpemUgPSBub3JtYWxpemU7XG5cbiAgLyoqXG4gICAqIEpvaW5zIHR3byBwYXRocy9VUkxzLlxuICAgKlxuICAgKiBAcGFyYW0gYVJvb3QgVGhlIHJvb3QgcGF0aCBvciBVUkwuXG4gICAqIEBwYXJhbSBhUGF0aCBUaGUgcGF0aCBvciBVUkwgdG8gYmUgam9pbmVkIHdpdGggdGhlIHJvb3QuXG4gICAqXG4gICAqIC0gSWYgYVBhdGggaXMgYSBVUkwgb3IgYSBkYXRhIFVSSSwgYVBhdGggaXMgcmV0dXJuZWQsIHVubGVzcyBhUGF0aCBpcyBhXG4gICAqICAgc2NoZW1lLXJlbGF0aXZlIFVSTDogVGhlbiB0aGUgc2NoZW1lIG9mIGFSb290LCBpZiBhbnksIGlzIHByZXBlbmRlZFxuICAgKiAgIGZpcnN0LlxuICAgKiAtIE90aGVyd2lzZSBhUGF0aCBpcyBhIHBhdGguIElmIGFSb290IGlzIGEgVVJMLCB0aGVuIGl0cyBwYXRoIHBvcnRpb25cbiAgICogICBpcyB1cGRhdGVkIHdpdGggdGhlIHJlc3VsdCBhbmQgYVJvb3QgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSB0aGUgcmVzdWx0XG4gICAqICAgaXMgcmV0dXJuZWQuXG4gICAqICAgLSBJZiBhUGF0aCBpcyBhYnNvbHV0ZSwgdGhlIHJlc3VsdCBpcyBhUGF0aC5cbiAgICogICAtIE90aGVyd2lzZSB0aGUgdHdvIHBhdGhzIGFyZSBqb2luZWQgd2l0aCBhIHNsYXNoLlxuICAgKiAtIEpvaW5pbmcgZm9yIGV4YW1wbGUgJ2h0dHA6Ly8nIGFuZCAnd3d3LmV4YW1wbGUuY29tJyBpcyBhbHNvIHN1cHBvcnRlZC5cbiAgICovXG4gIGZ1bmN0aW9uIGpvaW4oYVJvb3QsIGFQYXRoKSB7XG4gICAgdmFyIGFQYXRoVXJsID0gdXJsUGFyc2UoYVBhdGgpO1xuICAgIHZhciBhUm9vdFVybCA9IHVybFBhcnNlKGFSb290KTtcbiAgICBpZiAoYVJvb3RVcmwpIHtcbiAgICAgIGFSb290ID0gYVJvb3RVcmwucGF0aCB8fCAnLyc7XG4gICAgfVxuXG4gICAgLy8gYGpvaW4oZm9vLCAnLy93d3cuZXhhbXBsZS5vcmcnKWBcbiAgICBpZiAoYVBhdGhVcmwgJiYgIWFQYXRoVXJsLnNjaGVtZSkge1xuICAgICAgaWYgKGFSb290VXJsKSB7XG4gICAgICAgIGFQYXRoVXJsLnNjaGVtZSA9IGFSb290VXJsLnNjaGVtZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB1cmxHZW5lcmF0ZShhUGF0aFVybCk7XG4gICAgfVxuXG4gICAgaWYgKGFQYXRoVXJsIHx8IGFQYXRoLm1hdGNoKGRhdGFVcmxSZWdleHApKSB7XG4gICAgICByZXR1cm4gYVBhdGg7XG4gICAgfVxuXG4gICAgLy8gYGpvaW4oJ2h0dHA6Ly8nLCAnd3d3LmV4YW1wbGUuY29tJylgXG4gICAgaWYgKGFSb290VXJsICYmICFhUm9vdFVybC5ob3N0ICYmICFhUm9vdFVybC5wYXRoKSB7XG4gICAgICBhUm9vdFVybC5ob3N0ID0gYVBhdGg7XG4gICAgICByZXR1cm4gdXJsR2VuZXJhdGUoYVJvb3RVcmwpO1xuICAgIH1cblxuICAgIHZhciBqb2luZWQgPSBhUGF0aC5jaGFyQXQoMCkgPT09ICcvJ1xuICAgICAgPyBhUGF0aFxuICAgICAgOiBub3JtYWxpemUoYVJvb3QucmVwbGFjZSgvXFwvKyQvLCAnJykgKyAnLycgKyBhUGF0aCk7XG5cbiAgICBpZiAoYVJvb3RVcmwpIHtcbiAgICAgIGFSb290VXJsLnBhdGggPSBqb2luZWQ7XG4gICAgICByZXR1cm4gdXJsR2VuZXJhdGUoYVJvb3RVcmwpO1xuICAgIH1cbiAgICByZXR1cm4gam9pbmVkO1xuICB9XG4gIGV4cG9ydHMuam9pbiA9IGpvaW47XG5cbiAgLyoqXG4gICAqIEJlY2F1c2UgYmVoYXZpb3IgZ29lcyB3YWNreSB3aGVuIHlvdSBzZXQgYF9fcHJvdG9fX2Agb24gb2JqZWN0cywgd2VcbiAgICogaGF2ZSB0byBwcmVmaXggYWxsIHRoZSBzdHJpbmdzIGluIG91ciBzZXQgd2l0aCBhbiBhcmJpdHJhcnkgY2hhcmFjdGVyLlxuICAgKlxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc291cmNlLW1hcC9wdWxsLzMxIGFuZFxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9zb3VyY2UtbWFwL2lzc3Vlcy8zMFxuICAgKlxuICAgKiBAcGFyYW0gU3RyaW5nIGFTdHJcbiAgICovXG4gIGZ1bmN0aW9uIHRvU2V0U3RyaW5nKGFTdHIpIHtcbiAgICByZXR1cm4gJyQnICsgYVN0cjtcbiAgfVxuICBleHBvcnRzLnRvU2V0U3RyaW5nID0gdG9TZXRTdHJpbmc7XG5cbiAgZnVuY3Rpb24gZnJvbVNldFN0cmluZyhhU3RyKSB7XG4gICAgcmV0dXJuIGFTdHIuc3Vic3RyKDEpO1xuICB9XG4gIGV4cG9ydHMuZnJvbVNldFN0cmluZyA9IGZyb21TZXRTdHJpbmc7XG5cbiAgZnVuY3Rpb24gcmVsYXRpdmUoYVJvb3QsIGFQYXRoKSB7XG4gICAgYVJvb3QgPSBhUm9vdC5yZXBsYWNlKC9cXC8kLywgJycpO1xuXG4gICAgdmFyIHVybCA9IHVybFBhcnNlKGFSb290KTtcbiAgICBpZiAoYVBhdGguY2hhckF0KDApID09IFwiL1wiICYmIHVybCAmJiB1cmwucGF0aCA9PSBcIi9cIikge1xuICAgICAgcmV0dXJuIGFQYXRoLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIHJldHVybiBhUGF0aC5pbmRleE9mKGFSb290ICsgJy8nKSA9PT0gMFxuICAgICAgPyBhUGF0aC5zdWJzdHIoYVJvb3QubGVuZ3RoICsgMSlcbiAgICAgIDogYVBhdGg7XG4gIH1cbiAgZXhwb3J0cy5yZWxhdGl2ZSA9IHJlbGF0aXZlO1xuXG4gIGZ1bmN0aW9uIHN0cmNtcChhU3RyMSwgYVN0cjIpIHtcbiAgICB2YXIgczEgPSBhU3RyMSB8fCBcIlwiO1xuICAgIHZhciBzMiA9IGFTdHIyIHx8IFwiXCI7XG4gICAgcmV0dXJuIChzMSA+IHMyKSAtIChzMSA8IHMyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wYXJhdG9yIGJldHdlZW4gdHdvIG1hcHBpbmdzIHdoZXJlIHRoZSBvcmlnaW5hbCBwb3NpdGlvbnMgYXJlIGNvbXBhcmVkLlxuICAgKlxuICAgKiBPcHRpb25hbGx5IHBhc3MgaW4gYHRydWVgIGFzIGBvbmx5Q29tcGFyZUdlbmVyYXRlZGAgdG8gY29uc2lkZXIgdHdvXG4gICAqIG1hcHBpbmdzIHdpdGggdGhlIHNhbWUgb3JpZ2luYWwgc291cmNlL2xpbmUvY29sdW1uLCBidXQgZGlmZmVyZW50IGdlbmVyYXRlZFxuICAgKiBsaW5lIGFuZCBjb2x1bW4gdGhlIHNhbWUuIFVzZWZ1bCB3aGVuIHNlYXJjaGluZyBmb3IgYSBtYXBwaW5nIHdpdGggYVxuICAgKiBzdHViYmVkIG91dCBtYXBwaW5nLlxuICAgKi9cbiAgZnVuY3Rpb24gY29tcGFyZUJ5T3JpZ2luYWxQb3NpdGlvbnMobWFwcGluZ0EsIG1hcHBpbmdCLCBvbmx5Q29tcGFyZU9yaWdpbmFsKSB7XG4gICAgdmFyIGNtcDtcblxuICAgIGNtcCA9IHN0cmNtcChtYXBwaW5nQS5zb3VyY2UsIG1hcHBpbmdCLnNvdXJjZSk7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbExpbmUgLSBtYXBwaW5nQi5vcmlnaW5hbExpbmU7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbENvbHVtbiAtIG1hcHBpbmdCLm9yaWdpbmFsQ29sdW1uO1xuICAgIGlmIChjbXAgfHwgb25seUNvbXBhcmVPcmlnaW5hbCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBzdHJjbXAobWFwcGluZ0EubmFtZSwgbWFwcGluZ0IubmFtZSk7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5nZW5lcmF0ZWRMaW5lIC0gbWFwcGluZ0IuZ2VuZXJhdGVkTGluZTtcbiAgICBpZiAoY21wKSB7XG4gICAgICByZXR1cm4gY21wO1xuICAgIH1cblxuICAgIHJldHVybiBtYXBwaW5nQS5nZW5lcmF0ZWRDb2x1bW4gLSBtYXBwaW5nQi5nZW5lcmF0ZWRDb2x1bW47XG4gIH07XG4gIGV4cG9ydHMuY29tcGFyZUJ5T3JpZ2luYWxQb3NpdGlvbnMgPSBjb21wYXJlQnlPcmlnaW5hbFBvc2l0aW9ucztcblxuICAvKipcbiAgICogQ29tcGFyYXRvciBiZXR3ZWVuIHR3byBtYXBwaW5ncyB3aGVyZSB0aGUgZ2VuZXJhdGVkIHBvc2l0aW9ucyBhcmVcbiAgICogY29tcGFyZWQuXG4gICAqXG4gICAqIE9wdGlvbmFsbHkgcGFzcyBpbiBgdHJ1ZWAgYXMgYG9ubHlDb21wYXJlR2VuZXJhdGVkYCB0byBjb25zaWRlciB0d29cbiAgICogbWFwcGluZ3Mgd2l0aCB0aGUgc2FtZSBnZW5lcmF0ZWQgbGluZSBhbmQgY29sdW1uLCBidXQgZGlmZmVyZW50XG4gICAqIHNvdXJjZS9uYW1lL29yaWdpbmFsIGxpbmUgYW5kIGNvbHVtbiB0aGUgc2FtZS4gVXNlZnVsIHdoZW4gc2VhcmNoaW5nIGZvciBhXG4gICAqIG1hcHBpbmcgd2l0aCBhIHN0dWJiZWQgb3V0IG1hcHBpbmcuXG4gICAqL1xuICBmdW5jdGlvbiBjb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMobWFwcGluZ0EsIG1hcHBpbmdCLCBvbmx5Q29tcGFyZUdlbmVyYXRlZCkge1xuICAgIHZhciBjbXA7XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5nZW5lcmF0ZWRMaW5lIC0gbWFwcGluZ0IuZ2VuZXJhdGVkTGluZTtcbiAgICBpZiAoY21wKSB7XG4gICAgICByZXR1cm4gY21wO1xuICAgIH1cblxuICAgIGNtcCA9IG1hcHBpbmdBLmdlbmVyYXRlZENvbHVtbiAtIG1hcHBpbmdCLmdlbmVyYXRlZENvbHVtbjtcbiAgICBpZiAoY21wIHx8IG9ubHlDb21wYXJlR2VuZXJhdGVkKSB7XG4gICAgICByZXR1cm4gY21wO1xuICAgIH1cblxuICAgIGNtcCA9IHN0cmNtcChtYXBwaW5nQS5zb3VyY2UsIG1hcHBpbmdCLnNvdXJjZSk7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbExpbmUgLSBtYXBwaW5nQi5vcmlnaW5hbExpbmU7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGNtcDtcbiAgICB9XG5cbiAgICBjbXAgPSBtYXBwaW5nQS5vcmlnaW5hbENvbHVtbiAtIG1hcHBpbmdCLm9yaWdpbmFsQ29sdW1uO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBjbXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmNtcChtYXBwaW5nQS5uYW1lLCBtYXBwaW5nQi5uYW1lKTtcbiAgfTtcbiAgZXhwb3J0cy5jb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnMgPSBjb21wYXJlQnlHZW5lcmF0ZWRQb3NpdGlvbnM7XG5cbn0pO1xuIiwiKGZ1bmN0aW9uIChwcm9jZXNzLF9fZmlsZW5hbWUpe1xuLyoqIHZpbTogZXQ6dHM9NDpzdz00OnN0cz00XG4gKiBAbGljZW5zZSBhbWRlZmluZSAwLjEuMCBDb3B5cmlnaHQgKGMpIDIwMTEsIFRoZSBEb2pvIEZvdW5kYXRpb24gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIEF2YWlsYWJsZSB2aWEgdGhlIE1JVCBvciBuZXcgQlNEIGxpY2Vuc2UuXG4gKiBzZWU6IGh0dHA6Ly9naXRodWIuY29tL2pyYnVya2UvYW1kZWZpbmUgZm9yIGRldGFpbHNcbiAqL1xuXG4vKmpzbGludCBub2RlOiB0cnVlICovXG4vKmdsb2JhbCBtb2R1bGUsIHByb2Nlc3MgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVmaW5lIGZvciBub2RlLlxuICogQHBhcmFtIHtPYmplY3R9IG1vZHVsZSB0aGUgXCJtb2R1bGVcIiBvYmplY3QgdGhhdCBpcyBkZWZpbmVkIGJ5IE5vZGUgZm9yIHRoZVxuICogY3VycmVudCBtb2R1bGUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbcmVxdWlyZUZuXS4gTm9kZSdzIHJlcXVpcmUgZnVuY3Rpb24gZm9yIHRoZSBjdXJyZW50IG1vZHVsZS5cbiAqIEl0IG9ubHkgbmVlZHMgdG8gYmUgcGFzc2VkIGluIE5vZGUgdmVyc2lvbnMgYmVmb3JlIDAuNSwgd2hlbiBtb2R1bGUucmVxdWlyZVxuICogZGlkIG5vdCBleGlzdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gYSBkZWZpbmUgZnVuY3Rpb24gdGhhdCBpcyB1c2FibGUgZm9yIHRoZSBjdXJyZW50IG5vZGVcbiAqIG1vZHVsZS5cbiAqL1xuZnVuY3Rpb24gYW1kZWZpbmUobW9kdWxlLCByZXF1aXJlRm4pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGRlZmluZUNhY2hlID0ge30sXG4gICAgICAgIGxvYWRlckNhY2hlID0ge30sXG4gICAgICAgIGFscmVhZHlDYWxsZWQgPSBmYWxzZSxcbiAgICAgICAgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKSxcbiAgICAgICAgbWFrZVJlcXVpcmUsIHN0cmluZ1JlcXVpcmU7XG5cbiAgICAvKipcbiAgICAgKiBUcmltcyB0aGUgLiBhbmQgLi4gZnJvbSBhbiBhcnJheSBvZiBwYXRoIHNlZ21lbnRzLlxuICAgICAqIEl0IHdpbGwga2VlcCBhIGxlYWRpbmcgcGF0aCBzZWdtZW50IGlmIGEgLi4gd2lsbCBiZWNvbWVcbiAgICAgKiB0aGUgZmlyc3QgcGF0aCBzZWdtZW50LCB0byBoZWxwIHdpdGggbW9kdWxlIG5hbWUgbG9va3VwcyxcbiAgICAgKiB3aGljaCBhY3QgbGlrZSBwYXRocywgYnV0IGNhbiBiZSByZW1hcHBlZC4gQnV0IHRoZSBlbmQgcmVzdWx0LFxuICAgICAqIGFsbCBwYXRocyB0aGF0IHVzZSB0aGlzIGZ1bmN0aW9uIHNob3VsZCBsb29rIG5vcm1hbGl6ZWQuXG4gICAgICogTk9URTogdGhpcyBtZXRob2QgTU9ESUZJRVMgdGhlIGlucHV0IGFycmF5LlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFyeSB0aGUgYXJyYXkgb2YgcGF0aCBzZWdtZW50cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0cmltRG90cyhhcnkpIHtcbiAgICAgICAgdmFyIGksIHBhcnQ7XG4gICAgICAgIGZvciAoaSA9IDA7IGFyeVtpXTsgaSs9IDEpIHtcbiAgICAgICAgICAgIHBhcnQgPSBhcnlbaV07XG4gICAgICAgICAgICBpZiAocGFydCA9PT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgYXJ5LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpIC09IDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcuLicpIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMSAmJiAoYXJ5WzJdID09PSAnLi4nIHx8IGFyeVswXSA9PT0gJy4uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9FbmQgb2YgdGhlIGxpbmUuIEtlZXAgYXQgbGVhc3Qgb25lIG5vbi1kb3RcbiAgICAgICAgICAgICAgICAgICAgLy9wYXRoIHNlZ21lbnQgYXQgdGhlIGZyb250IHNvIGl0IGNhbiBiZSBtYXBwZWRcbiAgICAgICAgICAgICAgICAgICAgLy9jb3JyZWN0bHkgdG8gZGlzay4gT3RoZXJ3aXNlLCB0aGVyZSBpcyBsaWtlbHlcbiAgICAgICAgICAgICAgICAgICAgLy9ubyBwYXRoIG1hcHBpbmcgZm9yIGEgcGF0aCBzdGFydGluZyB3aXRoICcuLicuXG4gICAgICAgICAgICAgICAgICAgIC8vVGhpcyBjYW4gc3RpbGwgZmFpbCwgYnV0IGNhdGNoZXMgdGhlIG1vc3QgcmVhc29uYWJsZVxuICAgICAgICAgICAgICAgICAgICAvL3VzZXMgb2YgLi5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBhcnkuc3BsaWNlKGkgLSAxLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgaSAtPSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCBiYXNlTmFtZSkge1xuICAgICAgICB2YXIgYmFzZVBhcnRzO1xuXG4gICAgICAgIC8vQWRqdXN0IGFueSByZWxhdGl2ZSBwYXRocy5cbiAgICAgICAgaWYgKG5hbWUgJiYgbmFtZS5jaGFyQXQoMCkgPT09ICcuJykge1xuICAgICAgICAgICAgLy9JZiBoYXZlIGEgYmFzZSBuYW1lLCB0cnkgdG8gbm9ybWFsaXplIGFnYWluc3QgaXQsXG4gICAgICAgICAgICAvL290aGVyd2lzZSwgYXNzdW1lIGl0IGlzIGEgdG9wLWxldmVsIHJlcXVpcmUgdGhhdCB3aWxsXG4gICAgICAgICAgICAvL2JlIHJlbGF0aXZlIHRvIGJhc2VVcmwgaW4gdGhlIGVuZC5cbiAgICAgICAgICAgIGlmIChiYXNlTmFtZSkge1xuICAgICAgICAgICAgICAgIGJhc2VQYXJ0cyA9IGJhc2VOYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgYmFzZVBhcnRzID0gYmFzZVBhcnRzLnNsaWNlKDAsIGJhc2VQYXJ0cy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgICBiYXNlUGFydHMgPSBiYXNlUGFydHMuY29uY2F0KG5hbWUuc3BsaXQoJy8nKSk7XG4gICAgICAgICAgICAgICAgdHJpbURvdHMoYmFzZVBhcnRzKTtcbiAgICAgICAgICAgICAgICBuYW1lID0gYmFzZVBhcnRzLmpvaW4oJy8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSB0aGUgbm9ybWFsaXplKCkgZnVuY3Rpb24gcGFzc2VkIHRvIGEgbG9hZGVyIHBsdWdpbidzXG4gICAgICogbm9ybWFsaXplIG1ldGhvZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtYWtlTm9ybWFsaXplKHJlbE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplKG5hbWUsIHJlbE5hbWUpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VMb2FkKGlkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGxvYWQodmFsdWUpIHtcbiAgICAgICAgICAgIGxvYWRlckNhY2hlW2lkXSA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9hZC5mcm9tVGV4dCA9IGZ1bmN0aW9uIChpZCwgdGV4dCkge1xuICAgICAgICAgICAgLy9UaGlzIG9uZSBpcyBkaWZmaWN1bHQgYmVjYXVzZSB0aGUgdGV4dCBjYW4vcHJvYmFibHkgdXNlc1xuICAgICAgICAgICAgLy9kZWZpbmUsIGFuZCBhbnkgcmVsYXRpdmUgcGF0aHMgYW5kIHJlcXVpcmVzIHNob3VsZCBiZSByZWxhdGl2ZVxuICAgICAgICAgICAgLy90byB0aGF0IGlkIHdhcyBpdCB3b3VsZCBiZSBmb3VuZCBvbiBkaXNrLiBCdXQgdGhpcyB3b3VsZCByZXF1aXJlXG4gICAgICAgICAgICAvL2Jvb3RzdHJhcHBpbmcgYSBtb2R1bGUvcmVxdWlyZSBmYWlybHkgZGVlcGx5IGZyb20gbm9kZSBjb3JlLlxuICAgICAgICAgICAgLy9Ob3Qgc3VyZSBob3cgYmVzdCB0byBnbyBhYm91dCB0aGF0IHlldC5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYW1kZWZpbmUgZG9lcyBub3QgaW1wbGVtZW50IGxvYWQuZnJvbVRleHQnKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbG9hZDtcbiAgICB9XG5cbiAgICBtYWtlUmVxdWlyZSA9IGZ1bmN0aW9uIChzeXN0ZW1SZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUsIHJlbElkKSB7XG4gICAgICAgIGZ1bmN0aW9uIGFtZFJlcXVpcmUoZGVwcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVwcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAvL1N5bmNocm9ub3VzLCBzaW5nbGUgbW9kdWxlIHJlcXVpcmUoJycpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmluZ1JlcXVpcmUoc3lzdGVtUmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCBkZXBzLCByZWxJZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vQXJyYXkgb2YgZGVwZW5kZW5jaWVzIHdpdGggYSBjYWxsYmFjay5cblxuICAgICAgICAgICAgICAgIC8vQ29udmVydCB0aGUgZGVwZW5kZW5jaWVzIHRvIG1vZHVsZXMuXG4gICAgICAgICAgICAgICAgZGVwcyA9IGRlcHMubWFwKGZ1bmN0aW9uIChkZXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmdSZXF1aXJlKHN5c3RlbVJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgZGVwTmFtZSwgcmVsSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy9XYWl0IGZvciBuZXh0IHRpY2sgdG8gY2FsbCBiYWNrIHRoZSByZXF1aXJlIGNhbGwuXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGRlcHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYW1kUmVxdWlyZS50b1VybCA9IGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAgICAgaWYgKGZpbGVQYXRoLmluZGV4T2YoJy4nKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub3JtYWxpemUoZmlsZVBhdGgsIHBhdGguZGlybmFtZShtb2R1bGUuZmlsZW5hbWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVQYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBhbWRSZXF1aXJlO1xuICAgIH07XG5cbiAgICAvL0Zhdm9yIGV4cGxpY2l0IHZhbHVlLCBwYXNzZWQgaW4gaWYgdGhlIG1vZHVsZSB3YW50cyB0byBzdXBwb3J0IE5vZGUgMC40LlxuICAgIHJlcXVpcmVGbiA9IHJlcXVpcmVGbiB8fCBmdW5jdGlvbiByZXEoKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGUucmVxdWlyZS5hcHBseShtb2R1bGUsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHJ1bkZhY3RvcnkoaWQsIGRlcHMsIGZhY3RvcnkpIHtcbiAgICAgICAgdmFyIHIsIGUsIG0sIHJlc3VsdDtcblxuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIGUgPSBsb2FkZXJDYWNoZVtpZF0gPSB7fTtcbiAgICAgICAgICAgIG0gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIHVyaTogX19maWxlbmFtZSxcbiAgICAgICAgICAgICAgICBleHBvcnRzOiBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgciA9IG1ha2VSZXF1aXJlKHJlcXVpcmVGbiwgZSwgbSwgaWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9Pbmx5IHN1cHBvcnQgb25lIGRlZmluZSBjYWxsIHBlciBmaWxlXG4gICAgICAgICAgICBpZiAoYWxyZWFkeUNhbGxlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYW1kZWZpbmUgd2l0aCBubyBtb2R1bGUgSUQgY2Fubm90IGJlIGNhbGxlZCBtb3JlIHRoYW4gb25jZSBwZXIgZmlsZS4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFscmVhZHlDYWxsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvL1VzZSB0aGUgcmVhbCB2YXJpYWJsZXMgZnJvbSBub2RlXG4gICAgICAgICAgICAvL1VzZSBtb2R1bGUuZXhwb3J0cyBmb3IgZXhwb3J0cywgc2luY2VcbiAgICAgICAgICAgIC8vdGhlIGV4cG9ydHMgaW4gaGVyZSBpcyBhbWRlZmluZSBleHBvcnRzLlxuICAgICAgICAgICAgZSA9IG1vZHVsZS5leHBvcnRzO1xuICAgICAgICAgICAgbSA9IG1vZHVsZTtcbiAgICAgICAgICAgIHIgPSBtYWtlUmVxdWlyZShyZXF1aXJlRm4sIGUsIG0sIG1vZHVsZS5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL0lmIHRoZXJlIGFyZSBkZXBlbmRlbmNpZXMsIHRoZXkgYXJlIHN0cmluZ3MsIHNvIG5lZWRcbiAgICAgICAgLy90byBjb252ZXJ0IHRoZW0gdG8gZGVwZW5kZW5jeSB2YWx1ZXMuXG4gICAgICAgIGlmIChkZXBzKSB7XG4gICAgICAgICAgICBkZXBzID0gZGVwcy5tYXAoZnVuY3Rpb24gKGRlcE5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcihkZXBOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9DYWxsIHRoZSBmYWN0b3J5IHdpdGggdGhlIHJpZ2h0IGRlcGVuZGVuY2llcy5cbiAgICAgICAgaWYgKHR5cGVvZiBmYWN0b3J5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmYWN0b3J5LmFwcGx5KG0uZXhwb3J0cywgZGVwcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmYWN0b3J5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBtLmV4cG9ydHMgPSByZXN1bHQ7XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkZXJDYWNoZVtpZF0gPSBtLmV4cG9ydHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdHJpbmdSZXF1aXJlID0gZnVuY3Rpb24gKHN5c3RlbVJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgaWQsIHJlbElkKSB7XG4gICAgICAgIC8vU3BsaXQgdGhlIElEIGJ5IGEgISBzbyB0aGF0XG4gICAgICAgIHZhciBpbmRleCA9IGlkLmluZGV4T2YoJyEnKSxcbiAgICAgICAgICAgIG9yaWdpbmFsSWQgPSBpZCxcbiAgICAgICAgICAgIHByZWZpeCwgcGx1Z2luO1xuXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIGlkID0gbm9ybWFsaXplKGlkLCByZWxJZCk7XG5cbiAgICAgICAgICAgIC8vU3RyYWlnaHQgbW9kdWxlIGxvb2t1cC4gSWYgaXQgaXMgb25lIG9mIHRoZSBzcGVjaWFsIGRlcGVuZGVuY2llcyxcbiAgICAgICAgICAgIC8vZGVhbCB3aXRoIGl0LCBvdGhlcndpc2UsIGRlbGVnYXRlIHRvIG5vZGUuXG4gICAgICAgICAgICBpZiAoaWQgPT09ICdyZXF1aXJlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYWtlUmVxdWlyZShzeXN0ZW1SZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUsIHJlbElkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaWQgPT09ICdleHBvcnRzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBleHBvcnRzO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpZCA9PT0gJ21vZHVsZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsb2FkZXJDYWNoZS5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGVyQ2FjaGVbaWRdO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkZWZpbmVDYWNoZVtpZF0pIHtcbiAgICAgICAgICAgICAgICBydW5GYWN0b3J5LmFwcGx5KG51bGwsIGRlZmluZUNhY2hlW2lkXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlckNhY2hlW2lkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYoc3lzdGVtUmVxdWlyZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3lzdGVtUmVxdWlyZShvcmlnaW5hbElkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIG1vZHVsZSB3aXRoIElEOiAnICsgaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vVGhlcmUgaXMgYSBwbHVnaW4gaW4gcGxheS5cbiAgICAgICAgICAgIHByZWZpeCA9IGlkLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICBpZCA9IGlkLnN1YnN0cmluZyhpbmRleCArIDEsIGlkLmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHBsdWdpbiA9IHN0cmluZ1JlcXVpcmUoc3lzdGVtUmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCBwcmVmaXgsIHJlbElkKTtcblxuICAgICAgICAgICAgaWYgKHBsdWdpbi5ub3JtYWxpemUpIHtcbiAgICAgICAgICAgICAgICBpZCA9IHBsdWdpbi5ub3JtYWxpemUoaWQsIG1ha2VOb3JtYWxpemUocmVsSWQpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy9Ob3JtYWxpemUgdGhlIElEIG5vcm1hbGx5LlxuICAgICAgICAgICAgICAgIGlkID0gbm9ybWFsaXplKGlkLCByZWxJZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsb2FkZXJDYWNoZVtpZF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9hZGVyQ2FjaGVbaWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwbHVnaW4ubG9hZChpZCwgbWFrZVJlcXVpcmUoc3lzdGVtUmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCByZWxJZCksIG1ha2VMb2FkKGlkKSwge30pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlckNhY2hlW2lkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL0NyZWF0ZSBhIGRlZmluZSBmdW5jdGlvbiBzcGVjaWZpYyB0byB0aGUgbW9kdWxlIGFza2luZyBmb3IgYW1kZWZpbmUuXG4gICAgZnVuY3Rpb24gZGVmaW5lKGlkLCBkZXBzLCBmYWN0b3J5KSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGlkKSkge1xuICAgICAgICAgICAgZmFjdG9yeSA9IGRlcHM7XG4gICAgICAgICAgICBkZXBzID0gaWQ7XG4gICAgICAgICAgICBpZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmYWN0b3J5ID0gaWQ7XG4gICAgICAgICAgICBpZCA9IGRlcHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVwcyAmJiAhQXJyYXkuaXNBcnJheShkZXBzKSkge1xuICAgICAgICAgICAgZmFjdG9yeSA9IGRlcHM7XG4gICAgICAgICAgICBkZXBzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFkZXBzKSB7XG4gICAgICAgICAgICBkZXBzID0gWydyZXF1aXJlJywgJ2V4cG9ydHMnLCAnbW9kdWxlJ107XG4gICAgICAgIH1cblxuICAgICAgICAvL1NldCB1cCBwcm9wZXJ0aWVzIGZvciB0aGlzIG1vZHVsZS4gSWYgYW4gSUQsIHRoZW4gdXNlXG4gICAgICAgIC8vaW50ZXJuYWwgY2FjaGUuIElmIG5vIElELCB0aGVuIHVzZSB0aGUgZXh0ZXJuYWwgdmFyaWFibGVzXG4gICAgICAgIC8vZm9yIHRoaXMgbm9kZSBtb2R1bGUuXG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgLy9QdXQgdGhlIG1vZHVsZSBpbiBkZWVwIGZyZWV6ZSB1bnRpbCB0aGVyZSBpcyBhXG4gICAgICAgICAgICAvL3JlcXVpcmUgY2FsbCBmb3IgaXQuXG4gICAgICAgICAgICBkZWZpbmVDYWNoZVtpZF0gPSBbaWQsIGRlcHMsIGZhY3RvcnldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcnVuRmFjdG9yeShpZCwgZGVwcywgZmFjdG9yeSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvL2RlZmluZS5yZXF1aXJlLCB3aGljaCBoYXMgYWNjZXNzIHRvIGFsbCB0aGUgdmFsdWVzIGluIHRoZVxuICAgIC8vY2FjaGUuIFVzZWZ1bCBmb3IgQU1EIG1vZHVsZXMgdGhhdCBhbGwgaGF2ZSBJRHMgaW4gdGhlIGZpbGUsXG4gICAgLy9idXQgbmVlZCB0byBmaW5hbGx5IGV4cG9ydCBhIHZhbHVlIHRvIG5vZGUgYmFzZWQgb24gb25lIG9mIHRob3NlXG4gICAgLy9JRHMuXG4gICAgZGVmaW5lLnJlcXVpcmUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWYgKGxvYWRlckNhY2hlW2lkXSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRlckNhY2hlW2lkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZWZpbmVDYWNoZVtpZF0pIHtcbiAgICAgICAgICAgIHJ1bkZhY3RvcnkuYXBwbHkobnVsbCwgZGVmaW5lQ2FjaGVbaWRdKTtcbiAgICAgICAgICAgIHJldHVybiBsb2FkZXJDYWNoZVtpZF07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZGVmaW5lLmFtZCA9IHt9O1xuXG4gICAgcmV0dXJuIGRlZmluZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhbWRlZmluZTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJLL203eHZcIiksXCIvbm9kZV9tb2R1bGVzL2VzY29kZWdlbi9ub2RlX21vZHVsZXMvc291cmNlLW1hcC9ub2RlX21vZHVsZXMvYW1kZWZpbmUvYW1kZWZpbmUuanNcIikiLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcImVzY29kZWdlblwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiRUNNQVNjcmlwdCBjb2RlIGdlbmVyYXRvclwiLFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cDovL2dpdGh1Yi5jb20vQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW5cIixcbiAgXCJtYWluXCI6IFwiZXNjb2RlZ2VuLmpzXCIsXG4gIFwiYmluXCI6IHtcbiAgICBcImVzZ2VuZXJhdGVcIjogXCIuL2Jpbi9lc2dlbmVyYXRlLmpzXCIsXG4gICAgXCJlc2NvZGVnZW5cIjogXCIuL2Jpbi9lc2NvZGVnZW4uanNcIlxuICB9LFxuICBcInZlcnNpb25cIjogXCIxLjMuMlwiLFxuICBcImVuZ2luZXNcIjoge1xuICAgIFwibm9kZVwiOiBcIj49MC40LjBcIlxuICB9LFxuICBcIm1haW50YWluZXJzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJZdXN1a2UgU3V6dWtpXCIsXG4gICAgICBcImVtYWlsXCI6IFwidXRhdGFuZS50ZWFAZ21haWwuY29tXCIsXG4gICAgICBcInVybFwiOiBcImh0dHA6Ly9naXRodWIuY29tL0NvbnN0ZWxsYXRpb25cIlxuICAgIH1cbiAgXSxcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImh0dHA6Ly9naXRodWIuY29tL0NvbnN0ZWxsYXRpb24vZXNjb2RlZ2VuLmdpdFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImVzdXRpbHNcIjogXCJ+MS4wLjBcIixcbiAgICBcImVzdHJhdmVyc2VcIjogXCJ+MS41LjBcIixcbiAgICBcImVzcHJpbWFcIjogXCJ+MS4xLjFcIixcbiAgICBcInNvdXJjZS1tYXBcIjogXCJ+MC4xLjMzXCJcbiAgfSxcbiAgXCJvcHRpb25hbERlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJzb3VyY2UtbWFwXCI6IFwifjAuMS4zM1wiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImVzcHJpbWEtbW96XCI6IFwiKlwiLFxuICAgIFwic2VtdmVyXCI6IFwiKlwiLFxuICAgIFwiY2hhaVwiOiBcIn4xLjcuMlwiLFxuICAgIFwiZ3VscFwiOiBcIn4zLjUuMFwiLFxuICAgIFwiZ3VscC1tb2NoYVwiOiBcIn4wLjQuMVwiLFxuICAgIFwiZ3VscC1lc2xpbnRcIjogXCJ+MC4xLjJcIixcbiAgICBcImpzaGludC1zdHlsaXNoXCI6IFwifjAuMS41XCIsXG4gICAgXCJndWxwLWpzaGludFwiOiBcIn4xLjQuMFwiLFxuICAgIFwiY29tbW9uanMtZXZlcnl3aGVyZVwiOiBcIn4wLjkuNlwiLFxuICAgIFwiYmx1ZWJpcmRcIjogXCJ+MS4yLjBcIixcbiAgICBcImJvd2VyLXJlZ2lzdHJ5LWNsaWVudFwiOiBcIn4wLjIuMFwiXG4gIH0sXG4gIFwibGljZW5zZXNcIjogW1xuICAgIHtcbiAgICAgIFwidHlwZVwiOiBcIkJTRFwiLFxuICAgICAgXCJ1cmxcIjogXCJodHRwOi8vZ2l0aHViLmNvbS9Db25zdGVsbGF0aW9uL2VzY29kZWdlbi9yYXcvbWFzdGVyL0xJQ0VOU0UuQlNEXCJcbiAgICB9XG4gIF0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJ0ZXN0XCI6IFwiZ3VscCB0cmF2aXNcIixcbiAgICBcInVuaXQtdGVzdFwiOiBcImd1bHAgdGVzdFwiLFxuICAgIFwibGludFwiOiBcImd1bHAgbGludFwiLFxuICAgIFwicmVsZWFzZVwiOiBcIm5vZGUgdG9vbHMvcmVsZWFzZS5qc1wiLFxuICAgIFwiYnVpbGQtbWluXCI6IFwiY2pzaWZ5IC1tYSBwYXRoOiB0b29scy9lbnRyeS1wb2ludC5qcyA+IGVzY29kZWdlbi5icm93c2VyLm1pbi5qc1wiLFxuICAgIFwiYnVpbGRcIjogXCJjanNpZnkgLWEgcGF0aDogdG9vbHMvZW50cnktcG9pbnQuanMgPiBlc2NvZGVnZW4uYnJvd3Nlci5qc1wiXG4gIH0sXG4gIFwicmVhZG1lXCI6IFwiIyMjIEVzY29kZWdlbiBbIVtCdWlsZCBTdGF0dXNdKGh0dHBzOi8vc2VjdXJlLnRyYXZpcy1jaS5vcmcvQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW4uc3ZnKV0oaHR0cDovL3RyYXZpcy1jaS5vcmcvQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW4pIFshW0J1aWxkIFN0YXR1c10oaHR0cHM6Ly9kcm9uZS5pby9naXRodWIuY29tL0NvbnN0ZWxsYXRpb24vZXNjb2RlZ2VuL3N0YXR1cy5wbmcpXShodHRwczovL2Ryb25lLmlvL2dpdGh1Yi5jb20vQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW4vbGF0ZXN0KVxcblxcbkVzY29kZWdlbiAoW2VzY29kZWdlbl0oaHR0cDovL2dpdGh1Yi5jb20vQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW4pKSBpc1xcbltFQ01BU2NyaXB0XShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvcHVibGljYXRpb25zL3N0YW5kYXJkcy9FY21hLTI2Mi5odG0pXFxuKGFsc28gcG9wdWxhcmx5IGtub3duIGFzIFtKYXZhU2NyaXB0XShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0phdmFTY3JpcHQ+SmF2YVNjcmlwdCkpXFxuY29kZSBnZW5lcmF0b3IgZnJvbSBbUGFyc2VyIEFQSV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vU3BpZGVyTW9ua2V5L1BhcnNlcl9BUEkpIEFTVC5cXG5TZWUgW29ubGluZSBnZW5lcmF0b3IgZGVtb10oaHR0cDovL2NvbnN0ZWxsYXRpb24uZ2l0aHViLmNvbS9lc2NvZGVnZW4vZGVtby9pbmRleC5odG1sKS5cXG5cXG5cXG4jIyMgSW5zdGFsbFxcblxcbkVzY29kZWdlbiBjYW4gYmUgdXNlZCBpbiBhIHdlYiBicm93c2VyOlxcblxcbiAgICA8c2NyaXB0IHNyYz1cXFwiZXNjb2RlZ2VuLmJyb3dzZXIuanNcXFwiPjwvc2NyaXB0PlxcblxcbmVzY29kZWdlbi5icm93c2VyLmpzIGlzIGZvdW5kIGluIHRhZ2dlZC1yZXZpc2lvbi4gU2VlIFRhZ3Mgb24gR2l0SHViLlxcblxcbk9yIGluIGEgTm9kZS5qcyBhcHBsaWNhdGlvbiB2aWEgdGhlIHBhY2thZ2UgbWFuYWdlcjpcXG5cXG4gICAgbnBtIGluc3RhbGwgZXNjb2RlZ2VuXFxuXFxuIyMjIFVzYWdlXFxuXFxuQSBzaW1wbGUgZXhhbXBsZTogdGhlIHByb2dyYW1cXG5cXG4gICAgZXNjb2RlZ2VuLmdlbmVyYXRlKHtcXG4gICAgICAgIHR5cGU6ICdCaW5hcnlFeHByZXNzaW9uJyxcXG4gICAgICAgIG9wZXJhdG9yOiAnKycsXFxuICAgICAgICBsZWZ0OiB7IHR5cGU6ICdMaXRlcmFsJywgdmFsdWU6IDQwIH0sXFxuICAgICAgICByaWdodDogeyB0eXBlOiAnTGl0ZXJhbCcsIHZhbHVlOiAyIH1cXG4gICAgfSk7XFxuXFxucHJvZHVjZXMgdGhlIHN0cmluZyBgJzQwICsgMidgXFxuXFxuU2VlIHRoZSBbQVBJIHBhZ2VdKGh0dHBzOi8vZ2l0aHViLmNvbS9Db25zdGVsbGF0aW9uL2VzY29kZWdlbi93aWtpL0FQSSkgZm9yXFxub3B0aW9ucy4gVG8gcnVuIHRoZSB0ZXN0cywgZXhlY3V0ZSBgbnBtIHRlc3RgIGluIHRoZSByb290IGRpcmVjdG9yeS5cXG5cXG4jIyMgQnVpbGRpbmcgYnJvd3NlciBidW5kbGUgLyBtaW5pZmllZCBicm93c2VyIGJ1bmRsZVxcblxcbkF0IGZpcnN0LCBleGVjdXRpbmcgYG5wbSBpbnN0YWxsYCB0byBpbnN0YWxsIHRoZSBhbGwgZGV2IGRlcGVuZGVuY2llcy5cXG5BZnRlciB0aGF0LFxcblxcbiAgICBucG0gcnVuLXNjcmlwdCBidWlsZFxcblxcbndpbGwgZ2VuZXJhdGUgYGVzY29kZWdlbi5icm93c2VyLmpzYCwgaXQgaXMgdXNlZCBvbiB0aGUgYnJvd3NlciBlbnZpcm9ubWVudC5cXG5cXG5BbmQsXFxuXFxuICAgIG5wbSBydW4tc2NyaXB0IGJ1aWxkLW1pblxcblxcbndpbGwgZ2VuZXJhdGUgbWluaWZpZWQgYGVzY29kZWdlbi5icm93c2VyLm1pbi5qc2AuXFxuXFxuIyMjIExpY2Vuc2VcXG5cXG4jIyMjIEVzY29kZWdlblxcblxcbkNvcHlyaWdodCAoQykgMjAxMiBbWXVzdWtlIFN1enVraV0oaHR0cDovL2dpdGh1Yi5jb20vQ29uc3RlbGxhdGlvbilcXG4gKHR3aXR0ZXI6IFtAQ29uc3RlbGxhdGlvbl0oaHR0cDovL3R3aXR0ZXIuY29tL0NvbnN0ZWxsYXRpb24pKSBhbmQgb3RoZXIgY29udHJpYnV0b3JzLlxcblxcblJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxcbm1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxcblxcbiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxcbiAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXFxuXFxuICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XFxuICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcXG4gICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cXG5cXG5USElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFxcXCJBUyBJU1xcXCJcXG5BTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXFxuSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcXG5BUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXFxuRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcXG4oSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XFxuTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXFxuT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcXG4oSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0ZcXG5USElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxcblxcbiMjIyMgc291cmNlLW1hcFxcblxcblNvdXJjZU5vZGVNb2NrcyBoYXMgYSBsaW1pdGVkIGludGVyZmFjZSBvZiBtb3ppbGxhL3NvdXJjZS1tYXAgU291cmNlTm9kZSBpbXBsZW1lbnRhdGlvbnMuXFxuXFxuQ29weXJpZ2h0IChjKSAyMDA5LTIwMTEsIE1vemlsbGEgRm91bmRhdGlvbiBhbmQgY29udHJpYnV0b3JzXFxuQWxsIHJpZ2h0cyByZXNlcnZlZC5cXG5cXG5SZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcXG5tb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcXG5cXG4qIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xcbiAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXFxuXFxuKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXFxuICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uXFxuICBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cXG5cXG4qIE5laXRoZXIgdGhlIG5hbWVzIG9mIHRoZSBNb3ppbGxhIEZvdW5kYXRpb24gbm9yIHRoZSBuYW1lcyBvZiBwcm9qZWN0XFxuICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzXFxuICBzb2Z0d2FyZSB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cXG5cXG5USElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFxcXCJBUyBJU1xcXCIgQU5EXFxuQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcXG5XQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXFxuRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxcbkZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXFxuREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1JcXG5TRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxcbkNBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXFxuT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcXG5PRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxcblwiLFxuICBcInJlYWRtZUZpbGVuYW1lXCI6IFwiUkVBRE1FLm1kXCIsXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vQ29uc3RlbGxhdGlvbi9lc2NvZGVnZW4vaXNzdWVzXCJcbiAgfSxcbiAgXCJfaWRcIjogXCJlc2NvZGVnZW5AMS4zLjJcIixcbiAgXCJkaXN0XCI6IHtcbiAgICBcInNoYXN1bVwiOiBcImJiMGY0MzRkYmQ1OTRmMjA2MDYzOWE3OWI0YjA2MjU5ZGQ1MzcyZGVcIlxuICB9LFxuICBcIl9mcm9tXCI6IFwiZXNjb2RlZ2VuQFwiLFxuICBcIl9yZXNvbHZlZFwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL2VzY29kZWdlbi8tL2VzY29kZWdlbi0xLjMuMi50Z3pcIlxufVxuIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEzIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTMgVGhhZGRlZSBUeWwgPHRoYWRkZWUudHlsQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBKb29zdC1XaW0gQm9la2VzdGVpam4gPGpvb3N0LXdpbUBib2VrZXN0ZWlqbi5ubD5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEtyaXMgS293YWwgPGtyaXMua293YWxAY2l4YXIuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgQXJwYWQgQm9yc29zIDxhcnBhZC5ib3Jzb3NAZ29vZ2xlbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMSBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xuXG4vKmpzbGludCBiaXR3aXNlOnRydWUgcGx1c3BsdXM6dHJ1ZSAqL1xuLypnbG9iYWwgZXNwcmltYTp0cnVlLCBkZWZpbmU6dHJ1ZSwgZXhwb3J0czp0cnVlLCB3aW5kb3c6IHRydWUsXG50aHJvd0Vycm9yVG9sZXJhbnQ6IHRydWUsXG50aHJvd0Vycm9yOiB0cnVlLCBnZW5lcmF0ZVN0YXRlbWVudDogdHJ1ZSwgcGVlazogdHJ1ZSxcbnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb246IHRydWUsIHBhcnNlQmxvY2s6IHRydWUsIHBhcnNlRXhwcmVzc2lvbjogdHJ1ZSxcbnBhcnNlRnVuY3Rpb25EZWNsYXJhdGlvbjogdHJ1ZSwgcGFyc2VGdW5jdGlvbkV4cHJlc3Npb246IHRydWUsXG5wYXJzZUZ1bmN0aW9uU291cmNlRWxlbWVudHM6IHRydWUsIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyOiB0cnVlLFxucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uOiB0cnVlLFxucGFyc2VVbmFyeUV4cHJlc3Npb246IHRydWUsXG5wYXJzZVN0YXRlbWVudDogdHJ1ZSwgcGFyc2VTb3VyY2VFbGVtZW50OiB0cnVlICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcyxcbiAgICAvLyBSaGlubywgYW5kIHBsYWluIGJyb3dzZXIgbG9hZGluZy5cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZhY3RvcnkoZXhwb3J0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeSgocm9vdC5lc3ByaW1hID0ge30pKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uIChleHBvcnRzKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFRva2VuLFxuICAgICAgICBUb2tlbk5hbWUsXG4gICAgICAgIEZuRXhwclRva2VucyxcbiAgICAgICAgU3ludGF4LFxuICAgICAgICBQcm9wZXJ0eUtpbmQsXG4gICAgICAgIE1lc3NhZ2VzLFxuICAgICAgICBSZWdleCxcbiAgICAgICAgU3ludGF4VHJlZURlbGVnYXRlLFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIHN0cmljdCxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIGxpbmVOdW1iZXIsXG4gICAgICAgIGxpbmVTdGFydCxcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBkZWxlZ2F0ZSxcbiAgICAgICAgbG9va2FoZWFkLFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZXh0cmE7XG5cbiAgICBUb2tlbiA9IHtcbiAgICAgICAgQm9vbGVhbkxpdGVyYWw6IDEsXG4gICAgICAgIEVPRjogMixcbiAgICAgICAgSWRlbnRpZmllcjogMyxcbiAgICAgICAgS2V5d29yZDogNCxcbiAgICAgICAgTnVsbExpdGVyYWw6IDUsXG4gICAgICAgIE51bWVyaWNMaXRlcmFsOiA2LFxuICAgICAgICBQdW5jdHVhdG9yOiA3LFxuICAgICAgICBTdHJpbmdMaXRlcmFsOiA4LFxuICAgICAgICBSZWd1bGFyRXhwcmVzc2lvbjogOVxuICAgIH07XG5cbiAgICBUb2tlbk5hbWUgPSB7fTtcbiAgICBUb2tlbk5hbWVbVG9rZW4uQm9vbGVhbkxpdGVyYWxdID0gJ0Jvb2xlYW4nO1xuICAgIFRva2VuTmFtZVtUb2tlbi5FT0ZdID0gJzxlbmQ+JztcbiAgICBUb2tlbk5hbWVbVG9rZW4uSWRlbnRpZmllcl0gPSAnSWRlbnRpZmllcic7XG4gICAgVG9rZW5OYW1lW1Rva2VuLktleXdvcmRdID0gJ0tleXdvcmQnO1xuICAgIFRva2VuTmFtZVtUb2tlbi5OdWxsTGl0ZXJhbF0gPSAnTnVsbCc7XG4gICAgVG9rZW5OYW1lW1Rva2VuLk51bWVyaWNMaXRlcmFsXSA9ICdOdW1lcmljJztcbiAgICBUb2tlbk5hbWVbVG9rZW4uUHVuY3R1YXRvcl0gPSAnUHVuY3R1YXRvcic7XG4gICAgVG9rZW5OYW1lW1Rva2VuLlN0cmluZ0xpdGVyYWxdID0gJ1N0cmluZyc7XG4gICAgVG9rZW5OYW1lW1Rva2VuLlJlZ3VsYXJFeHByZXNzaW9uXSA9ICdSZWd1bGFyRXhwcmVzc2lvbic7XG5cbiAgICAvLyBBIGZ1bmN0aW9uIGZvbGxvd2luZyBvbmUgb2YgdGhvc2UgdG9rZW5zIGlzIGFuIGV4cHJlc3Npb24uXG4gICAgRm5FeHByVG9rZW5zID0gWycoJywgJ3snLCAnWycsICdpbicsICd0eXBlb2YnLCAnaW5zdGFuY2VvZicsICduZXcnLFxuICAgICAgICAgICAgICAgICAgICAncmV0dXJuJywgJ2Nhc2UnLCAnZGVsZXRlJywgJ3Rocm93JywgJ3ZvaWQnLFxuICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ25tZW50IG9wZXJhdG9yc1xuICAgICAgICAgICAgICAgICAgICAnPScsICcrPScsICctPScsICcqPScsICcvPScsICclPScsICc8PD0nLCAnPj49JywgJz4+Pj0nLFxuICAgICAgICAgICAgICAgICAgICAnJj0nLCAnfD0nLCAnXj0nLCAnLCcsXG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbmFyeS91bmFyeSBvcGVyYXRvcnNcbiAgICAgICAgICAgICAgICAgICAgJysnLCAnLScsICcqJywgJy8nLCAnJScsICcrKycsICctLScsICc8PCcsICc+PicsICc+Pj4nLCAnJicsXG4gICAgICAgICAgICAgICAgICAgICd8JywgJ14nLCAnIScsICd+JywgJyYmJywgJ3x8JywgJz8nLCAnOicsICc9PT0nLCAnPT0nLCAnPj0nLFxuICAgICAgICAgICAgICAgICAgICAnPD0nLCAnPCcsICc+JywgJyE9JywgJyE9PSddO1xuXG4gICAgU3ludGF4ID0ge1xuICAgICAgICBBc3NpZ25tZW50RXhwcmVzc2lvbjogJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyxcbiAgICAgICAgQXJyYXlFeHByZXNzaW9uOiAnQXJyYXlFeHByZXNzaW9uJyxcbiAgICAgICAgQmxvY2tTdGF0ZW1lbnQ6ICdCbG9ja1N0YXRlbWVudCcsXG4gICAgICAgIEJpbmFyeUV4cHJlc3Npb246ICdCaW5hcnlFeHByZXNzaW9uJyxcbiAgICAgICAgQnJlYWtTdGF0ZW1lbnQ6ICdCcmVha1N0YXRlbWVudCcsXG4gICAgICAgIENhbGxFeHByZXNzaW9uOiAnQ2FsbEV4cHJlc3Npb24nLFxuICAgICAgICBDYXRjaENsYXVzZTogJ0NhdGNoQ2xhdXNlJyxcbiAgICAgICAgQ29uZGl0aW9uYWxFeHByZXNzaW9uOiAnQ29uZGl0aW9uYWxFeHByZXNzaW9uJyxcbiAgICAgICAgQ29udGludWVTdGF0ZW1lbnQ6ICdDb250aW51ZVN0YXRlbWVudCcsXG4gICAgICAgIERvV2hpbGVTdGF0ZW1lbnQ6ICdEb1doaWxlU3RhdGVtZW50JyxcbiAgICAgICAgRGVidWdnZXJTdGF0ZW1lbnQ6ICdEZWJ1Z2dlclN0YXRlbWVudCcsXG4gICAgICAgIEVtcHR5U3RhdGVtZW50OiAnRW1wdHlTdGF0ZW1lbnQnLFxuICAgICAgICBFeHByZXNzaW9uU3RhdGVtZW50OiAnRXhwcmVzc2lvblN0YXRlbWVudCcsXG4gICAgICAgIEZvclN0YXRlbWVudDogJ0ZvclN0YXRlbWVudCcsXG4gICAgICAgIEZvckluU3RhdGVtZW50OiAnRm9ySW5TdGF0ZW1lbnQnLFxuICAgICAgICBGdW5jdGlvbkRlY2xhcmF0aW9uOiAnRnVuY3Rpb25EZWNsYXJhdGlvbicsXG4gICAgICAgIEZ1bmN0aW9uRXhwcmVzc2lvbjogJ0Z1bmN0aW9uRXhwcmVzc2lvbicsXG4gICAgICAgIElkZW50aWZpZXI6ICdJZGVudGlmaWVyJyxcbiAgICAgICAgSWZTdGF0ZW1lbnQ6ICdJZlN0YXRlbWVudCcsXG4gICAgICAgIExpdGVyYWw6ICdMaXRlcmFsJyxcbiAgICAgICAgTGFiZWxlZFN0YXRlbWVudDogJ0xhYmVsZWRTdGF0ZW1lbnQnLFxuICAgICAgICBMb2dpY2FsRXhwcmVzc2lvbjogJ0xvZ2ljYWxFeHByZXNzaW9uJyxcbiAgICAgICAgTWVtYmVyRXhwcmVzc2lvbjogJ01lbWJlckV4cHJlc3Npb24nLFxuICAgICAgICBOZXdFeHByZXNzaW9uOiAnTmV3RXhwcmVzc2lvbicsXG4gICAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgICAgUHJvZ3JhbTogJ1Byb2dyYW0nLFxuICAgICAgICBQcm9wZXJ0eTogJ1Byb3BlcnR5JyxcbiAgICAgICAgUmV0dXJuU3RhdGVtZW50OiAnUmV0dXJuU3RhdGVtZW50JyxcbiAgICAgICAgU2VxdWVuY2VFeHByZXNzaW9uOiAnU2VxdWVuY2VFeHByZXNzaW9uJyxcbiAgICAgICAgU3dpdGNoU3RhdGVtZW50OiAnU3dpdGNoU3RhdGVtZW50JyxcbiAgICAgICAgU3dpdGNoQ2FzZTogJ1N3aXRjaENhc2UnLFxuICAgICAgICBUaGlzRXhwcmVzc2lvbjogJ1RoaXNFeHByZXNzaW9uJyxcbiAgICAgICAgVGhyb3dTdGF0ZW1lbnQ6ICdUaHJvd1N0YXRlbWVudCcsXG4gICAgICAgIFRyeVN0YXRlbWVudDogJ1RyeVN0YXRlbWVudCcsXG4gICAgICAgIFVuYXJ5RXhwcmVzc2lvbjogJ1VuYXJ5RXhwcmVzc2lvbicsXG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdVcGRhdGVFeHByZXNzaW9uJyxcbiAgICAgICAgVmFyaWFibGVEZWNsYXJhdGlvbjogJ1ZhcmlhYmxlRGVjbGFyYXRpb24nLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0b3I6ICdWYXJpYWJsZURlY2xhcmF0b3InLFxuICAgICAgICBXaGlsZVN0YXRlbWVudDogJ1doaWxlU3RhdGVtZW50JyxcbiAgICAgICAgV2l0aFN0YXRlbWVudDogJ1dpdGhTdGF0ZW1lbnQnXG4gICAgfTtcblxuICAgIFByb3BlcnR5S2luZCA9IHtcbiAgICAgICAgRGF0YTogMSxcbiAgICAgICAgR2V0OiAyLFxuICAgICAgICBTZXQ6IDRcbiAgICB9O1xuXG4gICAgLy8gRXJyb3IgbWVzc2FnZXMgc2hvdWxkIGJlIGlkZW50aWNhbCB0byBWOC5cbiAgICBNZXNzYWdlcyA9IHtcbiAgICAgICAgVW5leHBlY3RlZFRva2VuOiAgJ1VuZXhwZWN0ZWQgdG9rZW4gJTAnLFxuICAgICAgICBVbmV4cGVjdGVkTnVtYmVyOiAgJ1VuZXhwZWN0ZWQgbnVtYmVyJyxcbiAgICAgICAgVW5leHBlY3RlZFN0cmluZzogICdVbmV4cGVjdGVkIHN0cmluZycsXG4gICAgICAgIFVuZXhwZWN0ZWRJZGVudGlmaWVyOiAgJ1VuZXhwZWN0ZWQgaWRlbnRpZmllcicsXG4gICAgICAgIFVuZXhwZWN0ZWRSZXNlcnZlZDogICdVbmV4cGVjdGVkIHJlc2VydmVkIHdvcmQnLFxuICAgICAgICBVbmV4cGVjdGVkRU9TOiAgJ1VuZXhwZWN0ZWQgZW5kIG9mIGlucHV0JyxcbiAgICAgICAgTmV3bGluZUFmdGVyVGhyb3c6ICAnSWxsZWdhbCBuZXdsaW5lIGFmdGVyIHRocm93JyxcbiAgICAgICAgSW52YWxpZFJlZ0V4cDogJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uJyxcbiAgICAgICAgVW50ZXJtaW5hdGVkUmVnRXhwOiAgJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiBtaXNzaW5nIC8nLFxuICAgICAgICBJbnZhbGlkTEhTSW5Bc3NpZ25tZW50OiAgJ0ludmFsaWQgbGVmdC1oYW5kIHNpZGUgaW4gYXNzaWdubWVudCcsXG4gICAgICAgIEludmFsaWRMSFNJbkZvckluOiAgJ0ludmFsaWQgbGVmdC1oYW5kIHNpZGUgaW4gZm9yLWluJyxcbiAgICAgICAgTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoOiAnTW9yZSB0aGFuIG9uZSBkZWZhdWx0IGNsYXVzZSBpbiBzd2l0Y2ggc3RhdGVtZW50JyxcbiAgICAgICAgTm9DYXRjaE9yRmluYWxseTogICdNaXNzaW5nIGNhdGNoIG9yIGZpbmFsbHkgYWZ0ZXIgdHJ5JyxcbiAgICAgICAgVW5rbm93bkxhYmVsOiAnVW5kZWZpbmVkIGxhYmVsIFxcJyUwXFwnJyxcbiAgICAgICAgUmVkZWNsYXJhdGlvbjogJyUwIFxcJyUxXFwnIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWQnLFxuICAgICAgICBJbGxlZ2FsQ29udGludWU6ICdJbGxlZ2FsIGNvbnRpbnVlIHN0YXRlbWVudCcsXG4gICAgICAgIElsbGVnYWxCcmVhazogJ0lsbGVnYWwgYnJlYWsgc3RhdGVtZW50JyxcbiAgICAgICAgSWxsZWdhbFJldHVybjogJ0lsbGVnYWwgcmV0dXJuIHN0YXRlbWVudCcsXG4gICAgICAgIFN0cmljdE1vZGVXaXRoOiAgJ1N0cmljdCBtb2RlIGNvZGUgbWF5IG5vdCBpbmNsdWRlIGEgd2l0aCBzdGF0ZW1lbnQnLFxuICAgICAgICBTdHJpY3RDYXRjaFZhcmlhYmxlOiAgJ0NhdGNoIHZhcmlhYmxlIG1heSBub3QgYmUgZXZhbCBvciBhcmd1bWVudHMgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RWYXJOYW1lOiAgJ1ZhcmlhYmxlIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFBhcmFtTmFtZTogICdQYXJhbWV0ZXIgbmFtZSBldmFsIG9yIGFyZ3VtZW50cyBpcyBub3QgYWxsb3dlZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFBhcmFtRHVwZTogJ1N0cmljdCBtb2RlIGZ1bmN0aW9uIG1heSBub3QgaGF2ZSBkdXBsaWNhdGUgcGFyYW1ldGVyIG5hbWVzJyxcbiAgICAgICAgU3RyaWN0RnVuY3Rpb25OYW1lOiAgJ0Z1bmN0aW9uIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdE9jdGFsTGl0ZXJhbDogICdPY3RhbCBsaXRlcmFscyBhcmUgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUuJyxcbiAgICAgICAgU3RyaWN0RGVsZXRlOiAgJ0RlbGV0ZSBvZiBhbiB1bnF1YWxpZmllZCBpZGVudGlmaWVyIGluIHN0cmljdCBtb2RlLicsXG4gICAgICAgIFN0cmljdER1cGxpY2F0ZVByb3BlcnR5OiAgJ0R1cGxpY2F0ZSBkYXRhIHByb3BlcnR5IGluIG9iamVjdCBsaXRlcmFsIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlJyxcbiAgICAgICAgQWNjZXNzb3JEYXRhUHJvcGVydHk6ICAnT2JqZWN0IGxpdGVyYWwgbWF5IG5vdCBoYXZlIGRhdGEgYW5kIGFjY2Vzc29yIHByb3BlcnR5IHdpdGggdGhlIHNhbWUgbmFtZScsXG4gICAgICAgIEFjY2Vzc29yR2V0U2V0OiAgJ09iamVjdCBsaXRlcmFsIG1heSBub3QgaGF2ZSBtdWx0aXBsZSBnZXQvc2V0IGFjY2Vzc29ycyB3aXRoIHRoZSBzYW1lIG5hbWUnLFxuICAgICAgICBTdHJpY3RMSFNBc3NpZ25tZW50OiAgJ0Fzc2lnbm1lbnQgdG8gZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgICBTdHJpY3RMSFNQb3N0Zml4OiAgJ1Bvc3RmaXggaW5jcmVtZW50L2RlY3JlbWVudCBtYXkgbm90IGhhdmUgZXZhbCBvciBhcmd1bWVudHMgb3BlcmFuZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdExIU1ByZWZpeDogICdQcmVmaXggaW5jcmVtZW50L2RlY3JlbWVudCBtYXkgbm90IGhhdmUgZXZhbCBvciBhcmd1bWVudHMgb3BlcmFuZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICAgIFN0cmljdFJlc2VydmVkV29yZDogICdVc2Ugb2YgZnV0dXJlIHJlc2VydmVkIHdvcmQgaW4gc3RyaWN0IG1vZGUnXG4gICAgfTtcblxuICAgIC8vIFNlZSBhbHNvIHRvb2xzL2dlbmVyYXRlLXVuaWNvZGUtcmVnZXgucHkuXG4gICAgUmVnZXggPSB7XG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclN0YXJ0OiBuZXcgUmVnRXhwKCdbXFx4QUFcXHhCNVxceEJBXFx4QzAtXFx4RDZcXHhEOC1cXHhGNlxceEY4LVxcdTAyQzFcXHUwMkM2LVxcdTAyRDFcXHUwMkUwLVxcdTAyRTRcXHUwMkVDXFx1MDJFRVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3QS1cXHUwMzdEXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDhBLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYyMC1cXHUwNjRBXFx1MDY2RVxcdTA2NkZcXHUwNjcxLVxcdTA2RDNcXHUwNkQ1XFx1MDZFNVxcdTA2RTZcXHUwNkVFXFx1MDZFRlxcdTA2RkEtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwXFx1MDcxMi1cXHUwNzJGXFx1MDc0RC1cXHUwN0E1XFx1MDdCMVxcdTA3Q0EtXFx1MDdFQVxcdTA3RjRcXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgxNVxcdTA4MUFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4QTBcXHUwOEEyLVxcdTA4QUNcXHUwOTA0LVxcdTA5MzlcXHUwOTNEXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3RlxcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkRcXHUwOUNFXFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTFcXHUwOUYwXFx1MDlGMVxcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEE1OS1cXHUwQTVDXFx1MEE1RVxcdTBBNzItXFx1MEE3NFxcdTBBODUtXFx1MEE4RFxcdTBBOEYtXFx1MEE5MVxcdTBBOTMtXFx1MEFBOFxcdTBBQUEtXFx1MEFCMFxcdTBBQjJcXHUwQUIzXFx1MEFCNS1cXHUwQUI5XFx1MEFCRFxcdTBBRDBcXHUwQUUwXFx1MEFFMVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjcxXFx1MEI4M1xcdTBCODUtXFx1MEI4QVxcdTBCOEUtXFx1MEI5MFxcdTBCOTItXFx1MEI5NVxcdTBCOTlcXHUwQjlBXFx1MEI5Q1xcdTBCOUVcXHUwQjlGXFx1MEJBM1xcdTBCQTRcXHUwQkE4LVxcdTBCQUFcXHUwQkFFLVxcdTBCQjlcXHUwQkQwXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzMzXFx1MEMzNS1cXHUwQzM5XFx1MEMzRFxcdTBDNThcXHUwQzU5XFx1MEM2MFxcdTBDNjFcXHUwQzg1LVxcdTBDOENcXHUwQzhFLVxcdTBDOTBcXHUwQzkyLVxcdTBDQThcXHUwQ0FBLVxcdTBDQjNcXHUwQ0I1LVxcdTBDQjlcXHUwQ0JEXFx1MENERVxcdTBDRTBcXHUwQ0UxXFx1MENGMVxcdTBDRjJcXHUwRDA1LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNEXFx1MEQ0RVxcdTBENjBcXHUwRDYxXFx1MEQ3QS1cXHUwRDdGXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBFMDEtXFx1MEUzMFxcdTBFMzJcXHUwRTMzXFx1MEU0MC1cXHUwRTQ2XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjBcXHUwRUIyXFx1MEVCM1xcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGNDAtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGODgtXFx1MEY4Q1xcdTEwMDAtXFx1MTAyQVxcdTEwM0ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVBLVxcdTEwNURcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZFLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhFXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGMFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3ODAtXFx1MTdCM1xcdTE3RDdcXHUxN0RDXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEE4XFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxQ1xcdTE5NTAtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QzEtXFx1MTlDN1xcdTFBMDAtXFx1MUExNlxcdTFBMjAtXFx1MUE1NFxcdTFBQTdcXHUxQjA1LVxcdTFCMzNcXHUxQjQ1LVxcdTFCNEJcXHUxQjgzLVxcdTFCQTBcXHUxQkFFXFx1MUJBRlxcdTFCQkEtXFx1MUJFNVxcdTFDMDAtXFx1MUMyM1xcdTFDNEQtXFx1MUM0RlxcdTFDNUEtXFx1MUM3RFxcdTFDRTktXFx1MUNFQ1xcdTFDRUUtXFx1MUNGMVxcdTFDRjVcXHUxQ0Y2XFx1MUQwMC1cXHUxREJGXFx1MUUwMC1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwNzFcXHUyMDdGXFx1MjA5MC1cXHUyMDlDXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNFRVxcdTJDRjJcXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ4MC1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYxRlxcdUE2MkFcXHVBNjJCXFx1QTY0MC1cXHVBNjZFXFx1QTY3Ri1cXHVBNjk3XFx1QTZBMC1cXHVBNkVGXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBNzkzXFx1QTdBMC1cXHVBN0FBXFx1QTdGOC1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE5MEEtXFx1QTkyNVxcdUE5MzAtXFx1QTk0NlxcdUE5NjAtXFx1QTk3Q1xcdUE5ODQtXFx1QTlCMlxcdUE5Q0ZcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE4MC1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQkMwLVxcdUFCRTJcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFEXFx1RkIxRi1cXHVGQjI4XFx1RkIyQS1cXHVGQjM2XFx1RkIzOC1cXHVGQjNDXFx1RkIzRVxcdUZCNDBcXHVGQjQxXFx1RkI0M1xcdUZCNDRcXHVGQjQ2LVxcdUZCQjFcXHVGQkQzLVxcdUZEM0RcXHVGRDUwLVxcdUZEOEZcXHVGRDkyLVxcdUZEQzdcXHVGREYwLVxcdUZERkJcXHVGRTcwLVxcdUZFNzRcXHVGRTc2LVxcdUZFRkNcXHVGRjIxLVxcdUZGM0FcXHVGRjQxLVxcdUZGNUFcXHVGRjY2LVxcdUZGQkVcXHVGRkMyLVxcdUZGQzdcXHVGRkNBLVxcdUZGQ0ZcXHVGRkQyLVxcdUZGRDdcXHVGRkRBLVxcdUZGRENdJyksXG4gICAgICAgIE5vbkFzY2lpSWRlbnRpZmllclBhcnQ6IG5ldyBSZWdFeHAoJ1tcXHhBQVxceEI1XFx4QkFcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDMwMC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0ODMtXFx1MDQ4N1xcdTA0OEEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNTkxLVxcdTA1QkRcXHUwNUJGXFx1MDVDMVxcdTA1QzJcXHUwNUM0XFx1MDVDNVxcdTA1QzdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjEwLVxcdTA2MUFcXHUwNjIwLVxcdTA2NjlcXHUwNjZFLVxcdTA2RDNcXHUwNkQ1LVxcdTA2RENcXHUwNkRGLVxcdTA2RThcXHUwNkVBLVxcdTA2RkNcXHUwNkZGXFx1MDcxMC1cXHUwNzRBXFx1MDc0RC1cXHUwN0IxXFx1MDdDMC1cXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgyRFxcdTA4NDAtXFx1MDg1QlxcdTA4QTBcXHUwOEEyLVxcdTA4QUNcXHUwOEU0LVxcdTA4RkVcXHUwOTAwLVxcdTA5NjNcXHUwOTY2LVxcdTA5NkZcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N0ZcXHUwOTgxLVxcdTA5ODNcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJDLVxcdTA5QzRcXHUwOUM3XFx1MDlDOFxcdTA5Q0ItXFx1MDlDRVxcdTA5RDdcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFM1xcdTA5RTYtXFx1MDlGMVxcdTBBMDEtXFx1MEEwM1xcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEEzQ1xcdTBBM0UtXFx1MEE0MlxcdTBBNDdcXHUwQTQ4XFx1MEE0Qi1cXHUwQTREXFx1MEE1MVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTY2LVxcdTBBNzVcXHUwQTgxLVxcdTBBODNcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkMtXFx1MEFDNVxcdTBBQzctXFx1MEFDOVxcdTBBQ0ItXFx1MEFDRFxcdTBBRDBcXHUwQUUwLVxcdTBBRTNcXHUwQUU2LVxcdTBBRUZcXHUwQjAxLVxcdTBCMDNcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzQy1cXHUwQjQ0XFx1MEI0N1xcdTBCNDhcXHUwQjRCLVxcdTBCNERcXHUwQjU2XFx1MEI1N1xcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYzXFx1MEI2Ni1cXHUwQjZGXFx1MEI3MVxcdTBCODJcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCQkUtXFx1MEJDMlxcdTBCQzYtXFx1MEJDOFxcdTBCQ0EtXFx1MEJDRFxcdTBCRDBcXHUwQkQ3XFx1MEJFNi1cXHUwQkVGXFx1MEMwMS1cXHUwQzAzXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzMzXFx1MEMzNS1cXHUwQzM5XFx1MEMzRC1cXHUwQzQ0XFx1MEM0Ni1cXHUwQzQ4XFx1MEM0QS1cXHUwQzREXFx1MEM1NVxcdTBDNTZcXHUwQzU4XFx1MEM1OVxcdTBDNjAtXFx1MEM2M1xcdTBDNjYtXFx1MEM2RlxcdTBDODJcXHUwQzgzXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCQy1cXHUwQ0M0XFx1MENDNi1cXHUwQ0M4XFx1MENDQS1cXHUwQ0NEXFx1MENENVxcdTBDRDZcXHUwQ0RFXFx1MENFMC1cXHUwQ0UzXFx1MENFNi1cXHUwQ0VGXFx1MENGMVxcdTBDRjJcXHUwRDAyXFx1MEQwM1xcdTBEMDUtXFx1MEQwQ1xcdTBEMEUtXFx1MEQxMFxcdTBEMTItXFx1MEQzQVxcdTBEM0QtXFx1MEQ0NFxcdTBENDYtXFx1MEQ0OFxcdTBENEEtXFx1MEQ0RVxcdTBENTdcXHUwRDYwLVxcdTBENjNcXHUwRDY2LVxcdTBENkZcXHUwRDdBLVxcdTBEN0ZcXHUwRDgyXFx1MEQ4M1xcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwRENBXFx1MERDRi1cXHUwREQ0XFx1MERENlxcdTBERDgtXFx1MERERlxcdTBERjJcXHUwREYzXFx1MEUwMS1cXHUwRTNBXFx1MEU0MC1cXHUwRTRFXFx1MEU1MC1cXHUwRTU5XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjlcXHUwRUJCLVxcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVDOC1cXHUwRUNEXFx1MEVEMC1cXHUwRUQ5XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGMThcXHUwRjE5XFx1MEYyMC1cXHUwRjI5XFx1MEYzNVxcdTBGMzdcXHUwRjM5XFx1MEYzRS1cXHUwRjQ3XFx1MEY0OS1cXHUwRjZDXFx1MEY3MS1cXHUwRjg0XFx1MEY4Ni1cXHUwRjk3XFx1MEY5OS1cXHUwRkJDXFx1MEZDNlxcdTEwMDAtXFx1MTA0OVxcdTEwNTAtXFx1MTA5RFxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzVELVxcdTEzNUZcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNkVFLVxcdTE2RjBcXHUxNzAwLVxcdTE3MENcXHUxNzBFLVxcdTE3MTRcXHUxNzIwLVxcdTE3MzRcXHUxNzQwLVxcdTE3NTNcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdEM1xcdTE3RDdcXHUxN0RDXFx1MTdERFxcdTE3RTAtXFx1MTdFOVxcdTE4MEItXFx1MTgwRFxcdTE4MTAtXFx1MTgxOVxcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxQ1xcdTE5MjAtXFx1MTkyQlxcdTE5MzAtXFx1MTkzQlxcdTE5NDYtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QjAtXFx1MTlDOVxcdTE5RDAtXFx1MTlEOVxcdTFBMDAtXFx1MUExQlxcdTFBMjAtXFx1MUE1RVxcdTFBNjAtXFx1MUE3Q1xcdTFBN0YtXFx1MUE4OVxcdTFBOTAtXFx1MUE5OVxcdTFBQTdcXHUxQjAwLVxcdTFCNEJcXHUxQjUwLVxcdTFCNTlcXHUxQjZCLVxcdTFCNzNcXHUxQjgwLVxcdTFCRjNcXHUxQzAwLVxcdTFDMzdcXHUxQzQwLVxcdTFDNDlcXHUxQzRELVxcdTFDN0RcXHUxQ0QwLVxcdTFDRDJcXHUxQ0Q0LVxcdTFDRjZcXHUxRDAwLVxcdTFERTZcXHUxREZDLVxcdTFGMTVcXHUxRjE4LVxcdTFGMURcXHUxRjIwLVxcdTFGNDVcXHUxRjQ4LVxcdTFGNERcXHUxRjUwLVxcdTFGNTdcXHUxRjU5XFx1MUY1QlxcdTFGNURcXHUxRjVGLVxcdTFGN0RcXHUxRjgwLVxcdTFGQjRcXHUxRkI2LVxcdTFGQkNcXHUxRkJFXFx1MUZDMi1cXHUxRkM0XFx1MUZDNi1cXHUxRkNDXFx1MUZEMC1cXHUxRkQzXFx1MUZENi1cXHUxRkRCXFx1MUZFMC1cXHUxRkVDXFx1MUZGMi1cXHUxRkY0XFx1MUZGNi1cXHUxRkZDXFx1MjAwQ1xcdTIwMERcXHUyMDNGXFx1MjA0MFxcdTIwNTRcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIwRDAtXFx1MjBEQ1xcdTIwRTFcXHUyMEU1LVxcdTIwRjBcXHUyMTAyXFx1MjEwN1xcdTIxMEEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMURcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJBLVxcdTIxMkRcXHUyMTJGLVxcdTIxMzlcXHUyMTNDLVxcdTIxM0ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRFXFx1MjE2MC1cXHUyMTg4XFx1MkMwMC1cXHUyQzJFXFx1MkMzMC1cXHUyQzVFXFx1MkM2MC1cXHUyQ0U0XFx1MkNFQi1cXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ3Ri1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkRFMC1cXHUyREZGXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyRlxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOTlcXHUzMDlBXFx1MzA5RC1cXHUzMDlGXFx1MzBBMS1cXHUzMEZBXFx1MzBGQy1cXHUzMEZGXFx1MzEwNS1cXHUzMTJEXFx1MzEzMS1cXHUzMThFXFx1MzFBMC1cXHUzMUJBXFx1MzFGMC1cXHUzMUZGXFx1MzQwMC1cXHU0REI1XFx1NEUwMC1cXHU5RkNDXFx1QTAwMC1cXHVBNDhDXFx1QTREMC1cXHVBNEZEXFx1QTUwMC1cXHVBNjBDXFx1QTYxMC1cXHVBNjJCXFx1QTY0MC1cXHVBNjZGXFx1QTY3NC1cXHVBNjdEXFx1QTY3Ri1cXHVBNjk3XFx1QTY5Ri1cXHVBNkYxXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBNzkzXFx1QTdBMC1cXHVBN0FBXFx1QTdGOC1cXHVBODI3XFx1QTg0MC1cXHVBODczXFx1QTg4MC1cXHVBOEM0XFx1QThEMC1cXHVBOEQ5XFx1QThFMC1cXHVBOEY3XFx1QThGQlxcdUE5MDAtXFx1QTkyRFxcdUE5MzAtXFx1QTk1M1xcdUE5NjAtXFx1QTk3Q1xcdUE5ODAtXFx1QTlDMFxcdUE5Q0YtXFx1QTlEOVxcdUFBMDAtXFx1QUEzNlxcdUFBNDAtXFx1QUE0RFxcdUFBNTAtXFx1QUE1OVxcdUFBNjAtXFx1QUE3NlxcdUFBN0FcXHVBQTdCXFx1QUE4MC1cXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVGXFx1QUFGMi1cXHVBQUY2XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUJDMC1cXHVBQkVBXFx1QUJFQ1xcdUFCRURcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFELVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFMDAtXFx1RkUwRlxcdUZFMjAtXFx1RkUyNlxcdUZFMzNcXHVGRTM0XFx1RkU0RC1cXHVGRTRGXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkYzRlxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKVxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgdGhlIGNvbmRpdGlvbiBpcyB0cnVlLCBvdGhlcndpc2UgdGhyb3cgYW4gZXJyb3IuXG4gICAgLy8gVGhpcyBpcyBvbmx5IHRvIGhhdmUgYSBiZXR0ZXIgY29udHJhY3Qgc2VtYW50aWMsIGkuZS4gYW5vdGhlciBzYWZldHkgbmV0XG4gICAgLy8gdG8gY2F0Y2ggYSBsb2dpYyBlcnJvci4gVGhlIGNvbmRpdGlvbiBzaGFsbCBiZSBmdWxmaWxsZWQgaW4gbm9ybWFsIGNhc2UuXG4gICAgLy8gRG8gTk9UIHVzZSB0aGlzIHRvIGVuZm9yY2UgYSBjZXJ0YWluIGNvbmRpdGlvbiBvbiBhbnkgdXNlciBpbnB1dC5cblxuICAgIGZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FTU0VSVDogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEZWNpbWFsRGlnaXQoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA+PSA0OCAmJiBjaCA8PSA1Nyk7ICAgLy8gMC4uOVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzSGV4RGlnaXQoY2gpIHtcbiAgICAgICAgcmV0dXJuICcwMTIzNDU2Nzg5YWJjZGVmQUJDREVGJy5pbmRleE9mKGNoKSA+PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzT2N0YWxEaWdpdChjaCkge1xuICAgICAgICByZXR1cm4gJzAxMjM0NTY3Jy5pbmRleE9mKGNoKSA+PSAwO1xuICAgIH1cblxuXG4gICAgLy8gNy4yIFdoaXRlIFNwYWNlXG5cbiAgICBmdW5jdGlvbiBpc1doaXRlU3BhY2UoY2gpIHtcbiAgICAgICAgcmV0dXJuIChjaCA9PT0gMHgyMCkgfHwgKGNoID09PSAweDA5KSB8fCAoY2ggPT09IDB4MEIpIHx8IChjaCA9PT0gMHgwQykgfHwgKGNoID09PSAweEEwKSB8fFxuICAgICAgICAgICAgKGNoID49IDB4MTY4MCAmJiBbMHgxNjgwLCAweDE4MEUsIDB4MjAwMCwgMHgyMDAxLCAweDIwMDIsIDB4MjAwMywgMHgyMDA0LCAweDIwMDUsIDB4MjAwNiwgMHgyMDA3LCAweDIwMDgsIDB4MjAwOSwgMHgyMDBBLCAweDIwMkYsIDB4MjA1RiwgMHgzMDAwLCAweEZFRkZdLmluZGV4T2YoY2gpID49IDApO1xuICAgIH1cblxuICAgIC8vIDcuMyBMaW5lIFRlcm1pbmF0b3JzXG5cbiAgICBmdW5jdGlvbiBpc0xpbmVUZXJtaW5hdG9yKGNoKSB7XG4gICAgICAgIHJldHVybiAoY2ggPT09IDB4MEEpIHx8IChjaCA9PT0gMHgwRCkgfHwgKGNoID09PSAweDIwMjgpIHx8IChjaCA9PT0gMHgyMDI5KTtcbiAgICB9XG5cbiAgICAvLyA3LjYgSWRlbnRpZmllciBOYW1lcyBhbmQgSWRlbnRpZmllcnNcblxuICAgIGZ1bmN0aW9uIGlzSWRlbnRpZmllclN0YXJ0KGNoKSB7XG4gICAgICAgIHJldHVybiAoY2ggPT09IDB4MjQpIHx8IChjaCA9PT0gMHg1RikgfHwgIC8vICQgKGRvbGxhcikgYW5kIF8gKHVuZGVyc2NvcmUpXG4gICAgICAgICAgICAoY2ggPj0gMHg0MSAmJiBjaCA8PSAweDVBKSB8fCAgICAgICAgIC8vIEEuLlpcbiAgICAgICAgICAgIChjaCA+PSAweDYxICYmIGNoIDw9IDB4N0EpIHx8ICAgICAgICAgLy8gYS4uelxuICAgICAgICAgICAgKGNoID09PSAweDVDKSB8fCAgICAgICAgICAgICAgICAgICAgICAvLyBcXCAoYmFja3NsYXNoKVxuICAgICAgICAgICAgKChjaCA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyUGFydChjaCkge1xuICAgICAgICByZXR1cm4gKGNoID09PSAweDI0KSB8fCAoY2ggPT09IDB4NUYpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgICAgKGNoID49IDB4NDEgJiYgY2ggPD0gMHg1QSkgfHwgICAgICAgICAvLyBBLi5aXG4gICAgICAgICAgICAoY2ggPj0gMHg2MSAmJiBjaCA8PSAweDdBKSB8fCAgICAgICAgIC8vIGEuLnpcbiAgICAgICAgICAgIChjaCA+PSAweDMwICYmIGNoIDw9IDB4MzkpIHx8ICAgICAgICAgLy8gMC4uOVxuICAgICAgICAgICAgKGNoID09PSAweDVDKSB8fCAgICAgICAgICAgICAgICAgICAgICAvLyBcXCAoYmFja3NsYXNoKVxuICAgICAgICAgICAgKChjaCA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJQYXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjaCkpKTtcbiAgICB9XG5cbiAgICAvLyA3LjYuMS4yIEZ1dHVyZSBSZXNlcnZlZCBXb3Jkc1xuXG4gICAgZnVuY3Rpb24gaXNGdXR1cmVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgICBjYXNlICdjbGFzcyc6XG4gICAgICAgIGNhc2UgJ2VudW0nOlxuICAgICAgICBjYXNlICdleHBvcnQnOlxuICAgICAgICBjYXNlICdleHRlbmRzJzpcbiAgICAgICAgY2FzZSAnaW1wb3J0JzpcbiAgICAgICAgY2FzZSAnc3VwZXInOlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgICBjYXNlICdpbXBsZW1lbnRzJzpcbiAgICAgICAgY2FzZSAnaW50ZXJmYWNlJzpcbiAgICAgICAgY2FzZSAncGFja2FnZSc6XG4gICAgICAgIGNhc2UgJ3ByaXZhdGUnOlxuICAgICAgICBjYXNlICdwcm90ZWN0ZWQnOlxuICAgICAgICBjYXNlICdwdWJsaWMnOlxuICAgICAgICBjYXNlICdzdGF0aWMnOlxuICAgICAgICBjYXNlICd5aWVsZCc6XG4gICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUmVzdHJpY3RlZFdvcmQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkID09PSAnZXZhbCcgfHwgaWQgPT09ICdhcmd1bWVudHMnO1xuICAgIH1cblxuICAgIC8vIDcuNi4xLjEgS2V5d29yZHNcblxuICAgIGZ1bmN0aW9uIGlzS2V5d29yZChpZCkge1xuICAgICAgICBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ2NvbnN0JyBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgICAgICAvLyAneWllbGQnIGFuZCAnbGV0JyBhcmUgZm9yIGNvbXBhdGlibGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAgICAgLy8gU29tZSBvdGhlcnMgYXJlIGZyb20gZnV0dXJlIHJlc2VydmVkIHdvcmRzLlxuXG4gICAgICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoaWQgPT09ICdpZicpIHx8IChpZCA9PT0gJ2luJykgfHwgKGlkID09PSAnZG8nKTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3ZhcicpIHx8IChpZCA9PT0gJ2ZvcicpIHx8IChpZCA9PT0gJ25ldycpIHx8XG4gICAgICAgICAgICAgICAgKGlkID09PSAndHJ5JykgfHwgKGlkID09PSAnbGV0Jyk7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiAoaWQgPT09ICd0aGlzJykgfHwgKGlkID09PSAnZWxzZScpIHx8IChpZCA9PT0gJ2Nhc2UnKSB8fFxuICAgICAgICAgICAgICAgIChpZCA9PT0gJ3ZvaWQnKSB8fCAoaWQgPT09ICd3aXRoJykgfHwgKGlkID09PSAnZW51bScpO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICByZXR1cm4gKGlkID09PSAnd2hpbGUnKSB8fCAoaWQgPT09ICdicmVhaycpIHx8IChpZCA9PT0gJ2NhdGNoJykgfHxcbiAgICAgICAgICAgICAgICAoaWQgPT09ICd0aHJvdycpIHx8IChpZCA9PT0gJ2NvbnN0JykgfHwgKGlkID09PSAneWllbGQnKSB8fFxuICAgICAgICAgICAgICAgIChpZCA9PT0gJ2NsYXNzJykgfHwgKGlkID09PSAnc3VwZXInKTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3JldHVybicpIHx8IChpZCA9PT0gJ3R5cGVvZicpIHx8IChpZCA9PT0gJ2RlbGV0ZScpIHx8XG4gICAgICAgICAgICAgICAgKGlkID09PSAnc3dpdGNoJykgfHwgKGlkID09PSAnZXhwb3J0JykgfHwgKGlkID09PSAnaW1wb3J0Jyk7XG4gICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHJldHVybiAoaWQgPT09ICdkZWZhdWx0JykgfHwgKGlkID09PSAnZmluYWxseScpIHx8IChpZCA9PT0gJ2V4dGVuZHMnKTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2Z1bmN0aW9uJykgfHwgKGlkID09PSAnY29udGludWUnKSB8fCAoaWQgPT09ICdkZWJ1Z2dlcicpO1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2luc3RhbmNlb2YnKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDcuNCBDb21tZW50c1xuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudCh0eXBlLCB2YWx1ZSwgc3RhcnQsIGVuZCwgbG9jKSB7XG4gICAgICAgIHZhciBjb21tZW50LCBhdHRhY2hlcjtcblxuICAgICAgICBhc3NlcnQodHlwZW9mIHN0YXJ0ID09PSAnbnVtYmVyJywgJ0NvbW1lbnQgbXVzdCBoYXZlIHZhbGlkIHBvc2l0aW9uJyk7XG5cbiAgICAgICAgLy8gQmVjYXVzZSB0aGUgd2F5IHRoZSBhY3R1YWwgdG9rZW4gaXMgc2Nhbm5lZCwgb2Z0ZW4gdGhlIGNvbW1lbnRzXG4gICAgICAgIC8vIChpZiBhbnkpIGFyZSBza2lwcGVkIHR3aWNlIGR1cmluZyB0aGUgbGV4aWNhbCBhbmFseXNpcy5cbiAgICAgICAgLy8gVGh1cywgd2UgbmVlZCB0byBza2lwIGFkZGluZyBhIGNvbW1lbnQgaWYgdGhlIGNvbW1lbnQgYXJyYXkgYWxyZWFkeVxuICAgICAgICAvLyBoYW5kbGVkIGl0LlxuICAgICAgICBpZiAoc3RhdGUubGFzdENvbW1lbnRTdGFydCA+PSBzdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLmxhc3RDb21tZW50U3RhcnQgPSBzdGFydDtcblxuICAgICAgICBjb21tZW50ID0ge1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgIGNvbW1lbnQucmFuZ2UgPSBbc3RhcnQsIGVuZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgY29tbWVudC5sb2MgPSBsb2M7XG4gICAgICAgIH1cbiAgICAgICAgZXh0cmEuY29tbWVudHMucHVzaChjb21tZW50KTtcbiAgICAgICAgaWYgKGV4dHJhLmF0dGFjaENvbW1lbnQpIHtcbiAgICAgICAgICAgIGV4dHJhLmxlYWRpbmdDb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgICAgICAgICAgZXh0cmEudHJhaWxpbmdDb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2tpcFNpbmdsZUxpbmVDb21tZW50KG9mZnNldCkge1xuICAgICAgICB2YXIgc3RhcnQsIGxvYywgY2gsIGNvbW1lbnQ7XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleCAtIG9mZnNldDtcbiAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnQgLSBvZmZzZXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChleHRyYS5jb21tZW50cykge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gc291cmNlLnNsaWNlKHN0YXJ0ICsgb2Zmc2V0LCBpbmRleCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnQgLSAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGFkZENvbW1lbnQoJ0xpbmUnLCBjb21tZW50LCBzdGFydCwgaW5kZXggLSAxLCBsb2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IDEzICYmIHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSA9PT0gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHRyYS5jb21tZW50cykge1xuICAgICAgICAgICAgY29tbWVudCA9IHNvdXJjZS5zbGljZShzdGFydCArIG9mZnNldCwgaW5kZXgpO1xuICAgICAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRDb21tZW50KCdMaW5lJywgY29tbWVudCwgc3RhcnQsIGluZGV4LCBsb2MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgICAgIHZhciBzdGFydCwgbG9jLCBjaCwgY29tbWVudDtcblxuICAgICAgICBpZiAoZXh0cmEuY29tbWVudHMpIHtcbiAgICAgICAgICAgIHN0YXJ0ID0gaW5kZXggLSAyO1xuICAgICAgICAgICAgbG9jID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnQgLSAyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IDB4MEQgJiYgc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKSA9PT0gMHgwQSkge1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICArK2xpbmVOdW1iZXI7XG4gICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAweDJBKSB7XG4gICAgICAgICAgICAgICAgLy8gQmxvY2sgY29tbWVudCBlbmRzIHdpdGggJyovJy5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKSA9PT0gMHgyRikge1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmEuY29tbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBzb3VyY2Uuc2xpY2Uoc3RhcnQgKyAyLCBpbmRleCAtIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDb21tZW50KCdCbG9jaycsIGNvbW1lbnQsIHN0YXJ0LCBpbmRleCwgbG9jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2tpcENvbW1lbnQoKSB7XG4gICAgICAgIHZhciBjaCwgc3RhcnQ7XG5cbiAgICAgICAgc3RhcnQgPSAoaW5kZXggPT09IDApO1xuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgICAgICAgICBpZiAoaXNXaGl0ZVNwYWNlKGNoKSkge1xuICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IDB4MEQgJiYgc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDBBKSB7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICBzdGFydCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAweDJGKSB7IC8vIFUrMDAyRiBpcyAnLydcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAweDJGKSB7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIHNraXBTaW5nbGVMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MkEpIHsgIC8vIFUrMDAyQSBpcyAnKidcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgc2tpcE11bHRpTGluZUNvbW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0ICYmIGNoID09PSAweDJEKSB7IC8vIFUrMDAyRCBpcyAnLSdcbiAgICAgICAgICAgICAgICAvLyBVKzAwM0UgaXMgJz4nXG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2UuY2hhckNvZGVBdChpbmRleCArIDEpID09PSAweDJEKSAmJiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAyKSA9PT0gMHgzRSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gJy0tPicgaXMgYSBzaW5nbGUtbGluZSBjb21tZW50XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgICAgICAgICAgIHNraXBTaW5nbGVMaW5lQ29tbWVudCgzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAweDNDKSB7IC8vIFUrMDAzQyBpcyAnPCdcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLnNsaWNlKGluZGV4ICsgMSwgaW5kZXggKyA0KSA9PT0gJyEtLScpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDsgLy8gYDxgXG4gICAgICAgICAgICAgICAgICAgICsraW5kZXg7IC8vIGAhYFxuICAgICAgICAgICAgICAgICAgICArK2luZGV4OyAvLyBgLWBcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDsgLy8gYC1gXG4gICAgICAgICAgICAgICAgICAgIHNraXBTaW5nbGVMaW5lQ29tbWVudCg0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbkhleEVzY2FwZShwcmVmaXgpIHtcbiAgICAgICAgdmFyIGksIGxlbiwgY2gsIGNvZGUgPSAwO1xuXG4gICAgICAgIGxlbiA9IChwcmVmaXggPT09ICd1JykgPyA0IDogMjtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGggJiYgaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlICogMTYgKyAnMDEyMzQ1Njc4OWFiY2RlZicuaW5kZXhPZihjaC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgICAgICB2YXIgY2gsIGlkO1xuXG4gICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgrKyk7XG4gICAgICAgIGlkID0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG5cbiAgICAgICAgLy8gJ1xcdScgKFUrMDA1QywgVSswMDc1KSBkZW5vdGVzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICBpZiAoY2ggPT09IDB4NUMpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgIT09IDB4NzUpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgY2ggPSBzY2FuSGV4RXNjYXBlKCd1Jyk7XG4gICAgICAgICAgICBpZiAoIWNoIHx8IGNoID09PSAnXFxcXCcgfHwgIWlzSWRlbnRpZmllclN0YXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWQgPSBjaDtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgaWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG5cbiAgICAgICAgICAgIC8vICdcXHUnIChVKzAwNUMsIFUrMDA3NSkgZGVub3RlcyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgICAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDAsIGlkLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgIT09IDB4NzUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICAgIGlmICghY2ggfHwgY2ggPT09ICdcXFxcJyB8fCAhaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldElkZW50aWZpZXIoKSB7XG4gICAgICAgIHZhciBzdGFydCwgY2g7XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleCsrO1xuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgICAgaWYgKGNoID09PSAweDVDKSB7XG4gICAgICAgICAgICAgICAgLy8gQmxhY2tzbGFzaCAoVSswMDVDKSBtYXJrcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICBpbmRleCA9IHN0YXJ0O1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRFc2NhcGVkSWRlbnRpZmllcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlLnNsaWNlKHN0YXJ0LCBpbmRleCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhbklkZW50aWZpZXIoKSB7XG4gICAgICAgIHZhciBzdGFydCwgaWQsIHR5cGU7XG5cbiAgICAgICAgc3RhcnQgPSBpbmRleDtcblxuICAgICAgICAvLyBCYWNrc2xhc2ggKFUrMDA1Qykgc3RhcnRzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICBpZCA9IChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4NUMpID8gZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IGdldElkZW50aWZpZXIoKTtcblxuICAgICAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICAgICAgaWYgKGlkLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdHlwZSA9IFRva2VuLklkZW50aWZpZXI7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNLZXl3b3JkKGlkKSkge1xuICAgICAgICAgICAgdHlwZSA9IFRva2VuLktleXdvcmQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaWQgPT09ICdudWxsJykge1xuICAgICAgICAgICAgdHlwZSA9IFRva2VuLk51bGxMaXRlcmFsO1xuICAgICAgICB9IGVsc2UgaWYgKGlkID09PSAndHJ1ZScgfHwgaWQgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHR5cGUgPSBUb2tlbi5Cb29sZWFuTGl0ZXJhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR5cGUgPSBUb2tlbi5JZGVudGlmaWVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogaWQsXG4gICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICAvLyA3LjcgUHVuY3R1YXRvcnNcblxuICAgIGZ1bmN0aW9uIHNjYW5QdW5jdHVhdG9yKCkge1xuICAgICAgICB2YXIgc3RhcnQgPSBpbmRleCxcbiAgICAgICAgICAgIGNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCksXG4gICAgICAgICAgICBjb2RlMixcbiAgICAgICAgICAgIGNoMSA9IHNvdXJjZVtpbmRleF0sXG4gICAgICAgICAgICBjaDIsXG4gICAgICAgICAgICBjaDMsXG4gICAgICAgICAgICBjaDQ7XG5cbiAgICAgICAgc3dpdGNoIChjb2RlKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIG1vc3QgY29tbW9uIHNpbmdsZS1jaGFyYWN0ZXIgcHVuY3R1YXRvcnMuXG4gICAgICAgIGNhc2UgMHgyRTogIC8vIC4gZG90XG4gICAgICAgIGNhc2UgMHgyODogIC8vICggb3BlbiBicmFja2V0XG4gICAgICAgIGNhc2UgMHgyOTogIC8vICkgY2xvc2UgYnJhY2tldFxuICAgICAgICBjYXNlIDB4M0I6ICAvLyA7IHNlbWljb2xvblxuICAgICAgICBjYXNlIDB4MkM6ICAvLyAsIGNvbW1hXG4gICAgICAgIGNhc2UgMHg3QjogIC8vIHsgb3BlbiBjdXJseSBicmFjZVxuICAgICAgICBjYXNlIDB4N0Q6ICAvLyB9IGNsb3NlIGN1cmx5IGJyYWNlXG4gICAgICAgIGNhc2UgMHg1QjogIC8vIFtcbiAgICAgICAgY2FzZSAweDVEOiAgLy8gXVxuICAgICAgICBjYXNlIDB4M0E6ICAvLyA6XG4gICAgICAgIGNhc2UgMHgzRjogIC8vID9cbiAgICAgICAgY2FzZSAweDdFOiAgLy8gflxuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgIGlmIChleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSAweDI4KSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJhLm9wZW5QYXJlblRva2VuID0gZXh0cmEudG9rZW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4N0IpIHtcbiAgICAgICAgICAgICAgICAgICAgZXh0cmEub3BlbkN1cmx5VG9rZW4gPSBleHRyYS50b2tlbnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb2RlMiA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4ICsgMSk7XG5cbiAgICAgICAgICAgIC8vICc9JyAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgICAgICBpZiAoY29kZTIgPT09IDB4M0QpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDB4MkI6ICAvLyArXG4gICAgICAgICAgICAgICAgY2FzZSAweDJEOiAgLy8gLVxuICAgICAgICAgICAgICAgIGNhc2UgMHgyRjogIC8vIC9cbiAgICAgICAgICAgICAgICBjYXNlIDB4M0M6ICAvLyA8XG4gICAgICAgICAgICAgICAgY2FzZSAweDNFOiAgLy8gPlxuICAgICAgICAgICAgICAgIGNhc2UgMHg1RTogIC8vIF5cbiAgICAgICAgICAgICAgICBjYXNlIDB4N0M6ICAvLyB8XG4gICAgICAgICAgICAgICAgY2FzZSAweDI1OiAgLy8gJVxuICAgICAgICAgICAgICAgIGNhc2UgMHgyNjogIC8vICZcbiAgICAgICAgICAgICAgICBjYXNlIDB4MkE6ICAvLyAqXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNhc2UgMHgyMTogLy8gIVxuICAgICAgICAgICAgICAgIGNhc2UgMHgzRDogLy8gPVxuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vICE9PSBhbmQgPT09XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4M0QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc291cmNlLnNsaWNlKHN0YXJ0LCBpbmRleCksXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuXG4gICAgICAgIGNoNCA9IHNvdXJjZS5zdWJzdHIoaW5kZXgsIDQpO1xuXG4gICAgICAgIGlmIChjaDQgPT09ICc+Pj49Jykge1xuICAgICAgICAgICAgaW5kZXggKz0gNDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZTogY2g0LFxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyAzLWNoYXJhY3RlciBwdW5jdHVhdG9yczogPT09ICE9PSA+Pj4gPDw9ID4+PVxuXG4gICAgICAgIGNoMyA9IGNoNC5zdWJzdHIoMCwgMyk7XG5cbiAgICAgICAgaWYgKGNoMyA9PT0gJz4+PicgfHwgY2gzID09PSAnPDw9JyB8fCBjaDMgPT09ICc+Pj0nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAzO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBjaDMsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgICBjaDIgPSBjaDMuc3Vic3RyKDAsIDIpO1xuXG4gICAgICAgIGlmICgoY2gxID09PSBjaDJbMV0gJiYgKCcrLTw+JnwnLmluZGV4T2YoY2gxKSA+PSAwKSkgfHwgY2gyID09PSAnPT4nKSB7XG4gICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBjaDIsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDEtY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiA8ID4gPSAhICsgLSAqICUgJiB8IF4gL1xuICAgICAgICBpZiAoJzw+PSErLSolJnxeLycuaW5kZXhPZihjaDEpID49IDApIHtcbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNoMSxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgIH1cblxuICAgIC8vIDcuOC4zIE51bWVyaWMgTGl0ZXJhbHNcblxuICAgIGZ1bmN0aW9uIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KSB7XG4gICAgICAgIHZhciBudW1iZXIgPSAnJztcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICghaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChudW1iZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgICAgdmFsdWU6IHBhcnNlSW50KCcweCcgKyBudW1iZXIsIDE2KSxcbiAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KSB7XG4gICAgICAgIHZhciBudW1iZXIgPSAnMCcgKyBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKCFpc09jdGFsRGlnaXQoc291cmNlW2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSB8fCBpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogcGFyc2VJbnQobnVtYmVyLCA4KSxcbiAgICAgICAgICAgIG9jdGFsOiB0cnVlLFxuICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5OdW1lcmljTGl0ZXJhbCgpIHtcbiAgICAgICAgdmFyIG51bWJlciwgc3RhcnQsIGNoO1xuXG4gICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgYXNzZXJ0KGlzRGVjaW1hbERpZ2l0KGNoLmNoYXJDb2RlQXQoMCkpIHx8IChjaCA9PT0gJy4nKSxcbiAgICAgICAgICAgICdOdW1lcmljIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgZGVjaW1hbCBkaWdpdCBvciBhIGRlY2ltYWwgcG9pbnQnKTtcblxuICAgICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgICBudW1iZXIgPSAnJztcbiAgICAgICAgaWYgKGNoICE9PSAnLicpIHtcbiAgICAgICAgICAgIG51bWJlciA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcblxuICAgICAgICAgICAgLy8gSGV4IG51bWJlciBzdGFydHMgd2l0aCAnMHgnLlxuICAgICAgICAgICAgLy8gT2N0YWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJy5cbiAgICAgICAgICAgIGlmIChudW1iZXIgPT09ICcwJykge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3gnIHx8IGNoID09PSAnWCcpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5PY3RhbExpdGVyYWwoc3RhcnQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJyBzdWNoIGFzICcwOScgaXMgaWxsZWdhbC5cbiAgICAgICAgICAgICAgICBpZiAoY2ggJiYgaXNEZWNpbWFsRGlnaXQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSAnLicpIHtcbiAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICB3aGlsZSAoaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2ggPT09ICdlJyB8fCBjaCA9PT0gJ0UnKSB7XG4gICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICBpZiAoY2ggPT09ICcrJyB8fCBjaCA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogcGFyc2VGbG9hdChudW1iZXIpLFxuICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuXG4gICAgZnVuY3Rpb24gc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgICAgIHZhciBzdHIgPSAnJywgcXVvdGUsIHN0YXJ0LCBjaCwgY29kZSwgdW5lc2NhcGVkLCByZXN0b3JlLCBvY3RhbCA9IGZhbHNlLCBzdGFydExpbmVOdW1iZXIsIHN0YXJ0TGluZVN0YXJ0O1xuICAgICAgICBzdGFydExpbmVOdW1iZXIgPSBsaW5lTnVtYmVyO1xuICAgICAgICBzdGFydExpbmVTdGFydCA9IGxpbmVTdGFydDtcblxuICAgICAgICBxdW90ZSA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgIGFzc2VydCgocXVvdGUgPT09ICdcXCcnIHx8IHF1b3RlID09PSAnXCInKSxcbiAgICAgICAgICAgICdTdHJpbmcgbGl0ZXJhbCBtdXN0IHN0YXJ0cyB3aXRoIGEgcXVvdGUnKTtcblxuICAgICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgICArK2luZGV4O1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG5cbiAgICAgICAgICAgIGlmIChjaCA9PT0gcXVvdGUpIHtcbiAgICAgICAgICAgICAgICBxdW90ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgaWYgKCFjaCB8fCAhaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd4JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuZXNjYXBlZCA9IHNjYW5IZXhFc2NhcGUoY2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuZXNjYXBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xccic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcdCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcYic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcZic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndic6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xceDBCJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSAnMDEyMzQ1NjcnLmluZGV4T2YoY2gpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXFwwIGlzIG5vdCBvY3RhbCBlc2NhcGUgc2VxdWVuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvY3RhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoICYmIGlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvY3RhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlICogOCArICcwMTIzNDU2NycuaW5kZXhPZihzb3VyY2VbaW5kZXgrK10pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpdGggMCwgMSwgMiwgM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJzAxMjMnLmluZGV4T2YoY2gpID49IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA8IGxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICAnXFxyJyAmJiBzb3VyY2VbaW5kZXhdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHF1b3RlICE9PSAnJykge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFRva2VuLlN0cmluZ0xpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogc3RyLFxuICAgICAgICAgICAgb2N0YWw6IG9jdGFsLFxuICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBzdGFydExpbmVOdW1iZXIsXG4gICAgICAgICAgICBzdGFydExpbmVTdGFydDogc3RhcnRMaW5lU3RhcnQsXG4gICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVzdFJlZ0V4cChwYXR0ZXJuLCBmbGFncykge1xuICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAocGF0dGVybiwgZmxhZ3MpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbnZhbGlkUmVnRXhwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2NhblJlZ0V4cEJvZHkoKSB7XG4gICAgICAgIHZhciBjaCwgc3RyLCBjbGFzc01hcmtlciwgdGVybWluYXRlZCwgYm9keTtcblxuICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgIGFzc2VydChjaCA9PT0gJy8nLCAnUmVndWxhciBleHByZXNzaW9uIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgc2xhc2gnKTtcbiAgICAgICAgc3RyID0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgIHRlcm1pbmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRlcm1pbmF0ZWQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeGNsdWRlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoLlxuICAgICAgICBib2R5ID0gc3RyLnN1YnN0cigxLCBzdHIubGVuZ3RoIC0gMik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogYm9keSxcbiAgICAgICAgICAgIGxpdGVyYWw6IHN0clxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5SZWdFeHBGbGFncygpIHtcbiAgICAgICAgdmFyIGNoLCBzdHIsIGZsYWdzLCByZXN0b3JlO1xuXG4gICAgICAgIHN0ciA9ICcnO1xuICAgICAgICBmbGFncyA9ICcnO1xuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcgJiYgaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdG9yZSA9IGluZGV4O1xuICAgICAgICAgICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGFncyArPSBjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoc3RyICs9ICdcXFxcdSc7IHJlc3RvcmUgPCBpbmRleDsgKytyZXN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IHNvdXJjZVtyZXN0b3JlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICs9ICd1JztcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXHUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXCc7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MgKz0gY2g7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHZhbHVlOiBmbGFncyxcbiAgICAgICAgICAgIGxpdGVyYWw6IHN0clxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNjYW5SZWdFeHAoKSB7XG4gICAgICAgIHZhciBzdGFydCwgYm9keSwgZmxhZ3MsIHBhdHRlcm4sIHZhbHVlO1xuXG4gICAgICAgIGxvb2thaGVhZCA9IG51bGw7XG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIHN0YXJ0ID0gaW5kZXg7XG5cbiAgICAgICAgYm9keSA9IHNjYW5SZWdFeHBCb2R5KCk7XG4gICAgICAgIGZsYWdzID0gc2NhblJlZ0V4cEZsYWdzKCk7XG4gICAgICAgIHZhbHVlID0gdGVzdFJlZ0V4cChib2R5LnZhbHVlLCBmbGFncy52YWx1ZSk7XG5cbiAgICAgICAgaWYgKGV4dHJhLnRva2VuaXplKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlJlZ3VsYXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxpdGVyYWw6IGJvZHkubGl0ZXJhbCArIGZsYWdzLmxpdGVyYWwsXG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29sbGVjdFJlZ2V4KCkge1xuICAgICAgICB2YXIgcG9zLCBsb2MsIHJlZ2V4LCB0b2tlbjtcblxuICAgICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgICBsb2MgPSB7XG4gICAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJlZ2V4ID0gc2NhblJlZ0V4cCgpO1xuICAgICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBpZiAoIWV4dHJhLnRva2VuaXplKSB7XG4gICAgICAgICAgICAvLyBQb3AgdGhlIHByZXZpb3VzIHRva2VuLCB3aGljaCBpcyBsaWtlbHkgJy8nIG9yICcvPSdcbiAgICAgICAgICAgIGlmIChleHRyYS50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRva2VuID0gZXh0cmEudG9rZW5zW2V4dHJhLnRva2Vucy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4ucmFuZ2VbMF0gPT09IHBvcyAmJiB0b2tlbi50eXBlID09PSAnUHVuY3R1YXRvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnLycgfHwgdG9rZW4udmFsdWUgPT09ICcvPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLnRva2Vucy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXh0cmEudG9rZW5zLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdSZWd1bGFyRXhwcmVzc2lvbicsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlZ2V4LmxpdGVyYWwsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtwb3MsIGluZGV4XSxcbiAgICAgICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVnZXg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNJZGVudGlmaWVyTmFtZSh0b2tlbikge1xuICAgICAgICByZXR1cm4gdG9rZW4udHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllciB8fFxuICAgICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCB8fFxuICAgICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uQm9vbGVhbkxpdGVyYWwgfHxcbiAgICAgICAgICAgIHRva2VuLnR5cGUgPT09IFRva2VuLk51bGxMaXRlcmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkdmFuY2VTbGFzaCgpIHtcbiAgICAgICAgdmFyIHByZXZUb2tlbixcbiAgICAgICAgICAgIGNoZWNrVG9rZW47XG4gICAgICAgIC8vIFVzaW5nIHRoZSBmb2xsb3dpbmcgYWxnb3JpdGhtOlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW96aWxsYS9zd2VldC5qcy93aWtpL2Rlc2lnblxuICAgICAgICBwcmV2VG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEudG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAoIXByZXZUb2tlbikge1xuICAgICAgICAgICAgLy8gTm90aGluZyBiZWZvcmUgdGhhdDogaXQgY2Fubm90IGJlIGEgZGl2aXNpb24uXG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZUb2tlbi50eXBlID09PSAnUHVuY3R1YXRvcicpIHtcbiAgICAgICAgICAgIGlmIChwcmV2VG9rZW4udmFsdWUgPT09ICddJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByZXZUb2tlbi52YWx1ZSA9PT0gJyknKSB7XG4gICAgICAgICAgICAgICAgY2hlY2tUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuUGFyZW5Ub2tlbiAtIDFdO1xuICAgICAgICAgICAgICAgIGlmIChjaGVja1Rva2VuICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnR5cGUgPT09ICdLZXl3b3JkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGNoZWNrVG9rZW4udmFsdWUgPT09ICdpZicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnZhbHVlID09PSAnd2hpbGUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ2ZvcicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnZhbHVlID09PSAnd2l0aCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJldlRva2VuLnZhbHVlID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAvLyBEaXZpZGluZyBhIGZ1bmN0aW9uIGJ5IGFueXRoaW5nIG1ha2VzIGxpdHRsZSBzZW5zZSxcbiAgICAgICAgICAgICAgICAvLyBidXQgd2UgaGF2ZSB0byBjaGVjayBmb3IgdGhhdC5cbiAgICAgICAgICAgICAgICBpZiAoZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gM10gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDNdLnR5cGUgPT09ICdLZXl3b3JkJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA0XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gNF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDRdLnR5cGUgPT09ICdLZXl3b3JkJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBOYW1lZCBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDVdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrVG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjaGVja1Rva2VuIGRldGVybWluZXMgd2hldGhlciB0aGUgZnVuY3Rpb24gaXNcbiAgICAgICAgICAgICAgICAvLyBhIGRlY2xhcmF0aW9uIG9yIGFuIGV4cHJlc3Npb24uXG4gICAgICAgICAgICAgICAgaWYgKEZuRXhwclRva2Vucy5pbmRleE9mKGNoZWNrVG9rZW4udmFsdWUpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gZXhwcmVzc2lvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEl0IGlzIGEgZGVjbGFyYXRpb24uXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2VG9rZW4udHlwZSA9PT0gJ0tleXdvcmQnKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWR2YW5jZSgpIHtcbiAgICAgICAgdmFyIGNoO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG5cbiAgICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5FT0YsXG4gICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2FuSWRlbnRpZmllcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyeSBjb21tb246ICggYW5kICkgYW5kIDtcbiAgICAgICAgaWYgKGNoID09PSAweDI4IHx8IGNoID09PSAweDI5IHx8IGNoID09PSAweDNCKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0cmluZyBsaXRlcmFsIHN0YXJ0cyB3aXRoIHNpbmdsZSBxdW90ZSAoVSswMDI3KSBvciBkb3VibGUgcXVvdGUgKFUrMDAyMikuXG4gICAgICAgIGlmIChjaCA9PT0gMHgyNyB8fCBjaCA9PT0gMHgyMikge1xuICAgICAgICAgICAgcmV0dXJuIHNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9pbnQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgICAvLyB0byBjaGVjayB0aGUgbmV4dCBjaGFyYWN0ZXIuXG4gICAgICAgIGlmIChjaCA9PT0gMHgyRSkge1xuICAgICAgICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5OdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNEZWNpbWFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTbGFzaCAoLykgVSswMDJGIGNhbiBhbHNvIHN0YXJ0IGEgcmVnZXguXG4gICAgICAgIGlmIChleHRyYS50b2tlbml6ZSAmJiBjaCA9PT0gMHgyRikge1xuICAgICAgICAgICAgcmV0dXJuIGFkdmFuY2VTbGFzaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29sbGVjdFRva2VuKCkge1xuICAgICAgICB2YXIgbG9jLCB0b2tlbiwgcmFuZ2UsIHZhbHVlO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIGxvYyA9IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdG9rZW4gPSBhZHZhbmNlKCk7XG4gICAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgIHZhbHVlID0gc291cmNlLnNsaWNlKHRva2VuLnN0YXJ0LCB0b2tlbi5lbmQpO1xuICAgICAgICAgICAgZXh0cmEudG9rZW5zLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuTmFtZVt0b2tlbi50eXBlXSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFt0b2tlbi5zdGFydCwgdG9rZW4uZW5kXSxcbiAgICAgICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgdG9rZW47XG5cbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIGluZGV4ID0gdG9rZW4uZW5kO1xuICAgICAgICBsaW5lTnVtYmVyID0gdG9rZW4ubGluZU51bWJlcjtcbiAgICAgICAgbGluZVN0YXJ0ID0gdG9rZW4ubGluZVN0YXJ0O1xuXG4gICAgICAgIGxvb2thaGVhZCA9ICh0eXBlb2YgZXh0cmEudG9rZW5zICE9PSAndW5kZWZpbmVkJykgPyBjb2xsZWN0VG9rZW4oKSA6IGFkdmFuY2UoKTtcblxuICAgICAgICBpbmRleCA9IHRva2VuLmVuZDtcbiAgICAgICAgbGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICAgIGxpbmVTdGFydCA9IHRva2VuLmxpbmVTdGFydDtcblxuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgICAgdmFyIHBvcywgbGluZSwgc3RhcnQ7XG5cbiAgICAgICAgcG9zID0gaW5kZXg7XG4gICAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgICBzdGFydCA9IGxpbmVTdGFydDtcbiAgICAgICAgbG9va2FoZWFkID0gKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSA/IGNvbGxlY3RUb2tlbigpIDogYWR2YW5jZSgpO1xuICAgICAgICBpbmRleCA9IHBvcztcbiAgICAgICAgbGluZU51bWJlciA9IGxpbmU7XG4gICAgICAgIGxpbmVTdGFydCA9IHN0YXJ0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFBvc2l0aW9uKGxpbmUsIGNvbHVtbikge1xuICAgICAgICB0aGlzLmxpbmUgPSBsaW5lO1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBTb3VyY2VMb2NhdGlvbihzdGFydExpbmUsIHN0YXJ0Q29sdW1uLCBsaW5lLCBjb2x1bW4pIHtcbiAgICAgICAgdGhpcy5zdGFydCA9IG5ldyBQb3NpdGlvbihzdGFydExpbmUsIHN0YXJ0Q29sdW1uKTtcbiAgICAgICAgdGhpcy5lbmQgPSBuZXcgUG9zaXRpb24obGluZSwgY29sdW1uKTtcbiAgICB9XG5cbiAgICBTeW50YXhUcmVlRGVsZWdhdGUgPSB7XG5cbiAgICAgICAgbmFtZTogJ1N5bnRheFRyZWUnLFxuXG4gICAgICAgIHByb2Nlc3NDb21tZW50OiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhc3RDaGlsZCwgdHJhaWxpbmdDb21tZW50cztcblxuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gU3ludGF4LlByb2dyYW0pIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5ib2R5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGVlaygpO1xuXG4gICAgICAgICAgICBpZiAoZXh0cmEudHJhaWxpbmdDb21tZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dHJhLnRyYWlsaW5nQ29tbWVudHNbMF0ucmFuZ2VbMF0gPj0gbm9kZS5yYW5nZVsxXSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFpbGluZ0NvbW1lbnRzID0gZXh0cmEudHJhaWxpbmdDb21tZW50cztcbiAgICAgICAgICAgICAgICAgICAgZXh0cmEudHJhaWxpbmdDb21tZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4dHJhLnRyYWlsaW5nQ29tbWVudHMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChleHRyYS5ib3R0b21SaWdodFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLmJvdHRvbVJpZ2h0U3RhY2tbZXh0cmEuYm90dG9tUmlnaHRTdGFjay5sZW5ndGggLSAxXS50cmFpbGluZ0NvbW1lbnRzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYS5ib3R0b21SaWdodFN0YWNrW2V4dHJhLmJvdHRvbVJpZ2h0U3RhY2subGVuZ3RoIC0gMV0udHJhaWxpbmdDb21tZW50c1swXS5yYW5nZVswXSA+PSBub2RlLnJhbmdlWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWlsaW5nQ29tbWVudHMgPSBleHRyYS5ib3R0b21SaWdodFN0YWNrW2V4dHJhLmJvdHRvbVJpZ2h0U3RhY2subGVuZ3RoIC0gMV0udHJhaWxpbmdDb21tZW50cztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV4dHJhLmJvdHRvbVJpZ2h0U3RhY2tbZXh0cmEuYm90dG9tUmlnaHRTdGFjay5sZW5ndGggLSAxXS50cmFpbGluZ0NvbW1lbnRzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRWF0aW5nIHRoZSBzdGFjay5cbiAgICAgICAgICAgIHdoaWxlIChleHRyYS5ib3R0b21SaWdodFN0YWNrLmxlbmd0aCA+IDAgJiYgZXh0cmEuYm90dG9tUmlnaHRTdGFja1tleHRyYS5ib3R0b21SaWdodFN0YWNrLmxlbmd0aCAtIDFdLnJhbmdlWzBdID49IG5vZGUucmFuZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICBsYXN0Q2hpbGQgPSBleHRyYS5ib3R0b21SaWdodFN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGFzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RDaGlsZC5sZWFkaW5nQ29tbWVudHMgJiYgbGFzdENoaWxkLmxlYWRpbmdDb21tZW50c1tsYXN0Q2hpbGQubGVhZGluZ0NvbW1lbnRzLmxlbmd0aCAtIDFdLnJhbmdlWzFdIDw9IG5vZGUucmFuZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5sZWFkaW5nQ29tbWVudHMgPSBsYXN0Q2hpbGQubGVhZGluZ0NvbW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgbGFzdENoaWxkLmxlYWRpbmdDb21tZW50cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV4dHJhLmxlYWRpbmdDb21tZW50cy5sZW5ndGggPiAwICYmIGV4dHJhLmxlYWRpbmdDb21tZW50c1tleHRyYS5sZWFkaW5nQ29tbWVudHMubGVuZ3RoIC0gMV0ucmFuZ2VbMV0gPD0gbm9kZS5yYW5nZVswXSkge1xuICAgICAgICAgICAgICAgIG5vZGUubGVhZGluZ0NvbW1lbnRzID0gZXh0cmEubGVhZGluZ0NvbW1lbnRzO1xuICAgICAgICAgICAgICAgIGV4dHJhLmxlYWRpbmdDb21tZW50cyA9IFtdO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGlmICh0cmFpbGluZ0NvbW1lbnRzKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50cmFpbGluZ0NvbW1lbnRzID0gdHJhaWxpbmdDb21tZW50cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXh0cmEuYm90dG9tUmlnaHRTdGFjay5wdXNoKG5vZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1hcmtFbmQ6IGZ1bmN0aW9uIChub2RlLCBzdGFydFRva2VuKSB7XG4gICAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJhbmdlID0gW3N0YXJ0VG9rZW4uc3RhcnQsIGluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICAgICAgICBub2RlLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbihcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUb2tlbi5zdGFydExpbmVOdW1iZXIgPT09IHVuZGVmaW5lZCA/ICBzdGFydFRva2VuLmxpbmVOdW1iZXIgOiBzdGFydFRva2VuLnN0YXJ0TGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRUb2tlbi5zdGFydCAtIChzdGFydFRva2VuLnN0YXJ0TGluZVN0YXJ0ID09PSB1bmRlZmluZWQgPyAgc3RhcnRUb2tlbi5saW5lU3RhcnQgOiBzdGFydFRva2VuLnN0YXJ0TGluZVN0YXJ0KSxcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHRoaXMucG9zdFByb2Nlc3Mobm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleHRyYS5hdHRhY2hDb21tZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQ29tbWVudChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBvc3RQcm9jZXNzOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLnNvdXJjZSkge1xuICAgICAgICAgICAgICAgIG5vZGUubG9jLnNvdXJjZSA9IGV4dHJhLnNvdXJjZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUFycmF5RXhwcmVzc2lvbjogZnVuY3Rpb24gKGVsZW1lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5BcnJheUV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgZWxlbWVudHM6IGVsZW1lbnRzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUFzc2lnbm1lbnRFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Bc3NpZ25tZW50RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgICAgICByaWdodDogcmlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlQmluYXJ5RXhwcmVzc2lvbjogZnVuY3Rpb24gKG9wZXJhdG9yLCBsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSAob3BlcmF0b3IgPT09ICd8fCcgfHwgb3BlcmF0b3IgPT09ICcmJicpID8gU3ludGF4LkxvZ2ljYWxFeHByZXNzaW9uIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIFN5bnRheC5CaW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICAgICAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICAgICAgICAgIHJpZ2h0OiByaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVCbG9ja1N0YXRlbWVudDogZnVuY3Rpb24gKGJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkJsb2NrU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlQnJlYWtTdGF0ZW1lbnQ6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQnJlYWtTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUNhbGxFeHByZXNzaW9uOiBmdW5jdGlvbiAoY2FsbGVlLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5DYWxsRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBjYWxsZWU6IGNhbGxlZSxcbiAgICAgICAgICAgICAgICAnYXJndW1lbnRzJzogYXJnc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVDYXRjaENsYXVzZTogZnVuY3Rpb24gKHBhcmFtLCBib2R5KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5DYXRjaENsYXVzZSxcbiAgICAgICAgICAgICAgICBwYXJhbTogcGFyYW0sXG4gICAgICAgICAgICAgICAgYm9keTogYm9keVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVDb25kaXRpb25hbEV4cHJlc3Npb246IGZ1bmN0aW9uICh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkNvbmRpdGlvbmFsRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgICAgIGNvbnNlcXVlbnQ6IGNvbnNlcXVlbnQsXG4gICAgICAgICAgICAgICAgYWx0ZXJuYXRlOiBhbHRlcm5hdGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlQ29udGludWVTdGF0ZW1lbnQ6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguQ29udGludWVTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGFiZWw6IGxhYmVsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZURlYnVnZ2VyU3RhdGVtZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5EZWJ1Z2dlclN0YXRlbWVudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVEb1doaWxlU3RhdGVtZW50OiBmdW5jdGlvbiAoYm9keSwgdGVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguRG9XaGlsZVN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlRW1wdHlTdGF0ZW1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkVtcHR5U3RhdGVtZW50XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUV4cHJlc3Npb25TdGF0ZW1lbnQ6IGZ1bmN0aW9uIChleHByZXNzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5FeHByZXNzaW9uU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGV4cHJlc3Npb25cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlRm9yU3RhdGVtZW50OiBmdW5jdGlvbiAoaW5pdCwgdGVzdCwgdXBkYXRlLCBib2R5KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5Gb3JTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgaW5pdDogaW5pdCxcbiAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgICAgIHVwZGF0ZTogdXBkYXRlLFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlRm9ySW5TdGF0ZW1lbnQ6IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguRm9ySW5TdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgICAgICByaWdodDogcmlnaHQsXG4gICAgICAgICAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgICAgICAgICBlYWNoOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVGdW5jdGlvbkRlY2xhcmF0aW9uOiBmdW5jdGlvbiAoaWQsIHBhcmFtcywgZGVmYXVsdHMsIGJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkZ1bmN0aW9uRGVjbGFyYXRpb24sXG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRzOiBkZWZhdWx0cyxcbiAgICAgICAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgICAgICAgIHJlc3Q6IG51bGwsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdG9yOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVGdW5jdGlvbkV4cHJlc3Npb246IGZ1bmN0aW9uIChpZCwgcGFyYW1zLCBkZWZhdWx0cywgYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguRnVuY3Rpb25FeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0czogZGVmYXVsdHMsXG4gICAgICAgICAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgICAgICAgICByZXN0OiBudWxsLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSWRlbnRpZmllcjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgbmFtZTogbmFtZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVJZlN0YXRlbWVudDogZnVuY3Rpb24gKHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguSWZTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgICAgICBjb25zZXF1ZW50OiBjb25zZXF1ZW50LFxuICAgICAgICAgICAgICAgIGFsdGVybmF0ZTogYWx0ZXJuYXRlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUxhYmVsZWRTdGF0ZW1lbnQ6IGZ1bmN0aW9uIChsYWJlbCwgYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTGFiZWxlZFN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBsYWJlbDogbGFiZWwsXG4gICAgICAgICAgICAgICAgYm9keTogYm9keVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVMaXRlcmFsOiBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LkxpdGVyYWwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRva2VuLnZhbHVlLFxuICAgICAgICAgICAgICAgIHJhdzogc291cmNlLnNsaWNlKHRva2VuLnN0YXJ0LCB0b2tlbi5lbmQpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZU1lbWJlckV4cHJlc3Npb246IGZ1bmN0aW9uIChhY2Nlc3Nvciwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTWVtYmVyRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBjb21wdXRlZDogYWNjZXNzb3IgPT09ICdbJyxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlTmV3RXhwcmVzc2lvbjogZnVuY3Rpb24gKGNhbGxlZSwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguTmV3RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBjYWxsZWU6IGNhbGxlZSxcbiAgICAgICAgICAgICAgICAnYXJndW1lbnRzJzogYXJnc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVPYmplY3RFeHByZXNzaW9uOiBmdW5jdGlvbiAocHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguT2JqZWN0RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVBvc3RmaXhFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGFyZ3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5VcGRhdGVFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICAgICAgICAgICAgICBhcmd1bWVudDogYXJndW1lbnQsXG4gICAgICAgICAgICAgICAgcHJlZml4OiBmYWxzZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVQcm9ncmFtOiBmdW5jdGlvbiAoYm9keSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvZ3JhbSxcbiAgICAgICAgICAgICAgICBib2R5OiBib2R5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVByb3BlcnR5OiBmdW5jdGlvbiAoa2luZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBTeW50YXguUHJvcGVydHksXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGtpbmQ6IGtpbmRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlUmV0dXJuU3RhdGVtZW50OiBmdW5jdGlvbiAoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlJldHVyblN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBhcmd1bWVudDogYXJndW1lbnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlU2VxdWVuY2VFeHByZXNzaW9uOiBmdW5jdGlvbiAoZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlNlcXVlbmNlRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uczogZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlU3dpdGNoQ2FzZTogZnVuY3Rpb24gKHRlc3QsIGNvbnNlcXVlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlN3aXRjaENhc2UsXG4gICAgICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgICAgICBjb25zZXF1ZW50OiBjb25zZXF1ZW50XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVN3aXRjaFN0YXRlbWVudDogZnVuY3Rpb24gKGRpc2NyaW1pbmFudCwgY2FzZXMpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlN3aXRjaFN0YXRlbWVudCxcbiAgICAgICAgICAgICAgICBkaXNjcmltaW5hbnQ6IGRpc2NyaW1pbmFudCxcbiAgICAgICAgICAgICAgICBjYXNlczogY2FzZXNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlVGhpc0V4cHJlc3Npb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlRoaXNFeHByZXNzaW9uXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVRocm93U3RhdGVtZW50OiBmdW5jdGlvbiAoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlRocm93U3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBhcmd1bWVudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVUcnlTdGF0ZW1lbnQ6IGZ1bmN0aW9uIChibG9jaywgZ3VhcmRlZEhhbmRsZXJzLCBoYW5kbGVycywgZmluYWxpemVyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5UcnlTdGF0ZW1lbnQsXG4gICAgICAgICAgICAgICAgYmxvY2s6IGJsb2NrLFxuICAgICAgICAgICAgICAgIGd1YXJkZWRIYW5kbGVyczogZ3VhcmRlZEhhbmRsZXJzLFxuICAgICAgICAgICAgICAgIGhhbmRsZXJzOiBoYW5kbGVycyxcbiAgICAgICAgICAgICAgICBmaW5hbGl6ZXI6IGZpbmFsaXplclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVVbmFyeUV4cHJlc3Npb246IGZ1bmN0aW9uIChvcGVyYXRvciwgYXJndW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChvcGVyYXRvciA9PT0gJysrJyB8fCBvcGVyYXRvciA9PT0gJy0tJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5VcGRhdGVFeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50OiBhcmd1bWVudCxcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4OiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlVuYXJ5RXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgYXJndW1lbnQ6IGFyZ3VtZW50LFxuICAgICAgICAgICAgICAgIHByZWZpeDogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uOiBmdW5jdGlvbiAoZGVjbGFyYXRpb25zLCBraW5kKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5WYXJpYWJsZURlY2xhcmF0aW9uLFxuICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uczogZGVjbGFyYXRpb25zLFxuICAgICAgICAgICAgICAgIGtpbmQ6IGtpbmRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlVmFyaWFibGVEZWNsYXJhdG9yOiBmdW5jdGlvbiAoaWQsIGluaXQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LlZhcmlhYmxlRGVjbGFyYXRvcixcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgaW5pdDogaW5pdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVXaGlsZVN0YXRlbWVudDogZnVuY3Rpb24gKHRlc3QsIGJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogU3ludGF4LldoaWxlU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICAgICAgYm9keTogYm9keVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVXaXRoU3RhdGVtZW50OiBmdW5jdGlvbiAob2JqZWN0LCBib2R5KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IFN5bnRheC5XaXRoU3RhdGVtZW50LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIGJvZHk6IGJvZHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlcmUgaXMgYSBsaW5lIHRlcm1pbmF0b3IgYmVmb3JlIHRoZSBuZXh0IHRva2VuLlxuXG4gICAgZnVuY3Rpb24gcGVla0xpbmVUZXJtaW5hdG9yKCkge1xuICAgICAgICB2YXIgcG9zLCBsaW5lLCBzdGFydCwgZm91bmQ7XG5cbiAgICAgICAgcG9zID0gaW5kZXg7XG4gICAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgICBzdGFydCA9IGxpbmVTdGFydDtcbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgZm91bmQgPSBsaW5lTnVtYmVyICE9PSBsaW5lO1xuICAgICAgICBpbmRleCA9IHBvcztcbiAgICAgICAgbGluZU51bWJlciA9IGxpbmU7XG4gICAgICAgIGxpbmVTdGFydCA9IHN0YXJ0O1xuXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG5cbiAgICAvLyBUaHJvdyBhbiBleGNlcHRpb25cblxuICAgIGZ1bmN0aW9uIHRocm93RXJyb3IodG9rZW4sIG1lc3NhZ2VGb3JtYXQpIHtcbiAgICAgICAgdmFyIGVycm9yLFxuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICBtc2cgPSBtZXNzYWdlRm9ybWF0LnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgLyUoXFxkKS9nLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh3aG9sZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KGluZGV4IDwgYXJncy5sZW5ndGgsICdNZXNzYWdlIHJlZmVyZW5jZSBtdXN0IGJlIGluIHJhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW2luZGV4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4ubGluZU51bWJlciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKCdMaW5lICcgKyB0b2tlbi5saW5lTnVtYmVyICsgJzogJyArIG1zZyk7XG4gICAgICAgICAgICBlcnJvci5pbmRleCA9IHRva2VuLnN0YXJ0O1xuICAgICAgICAgICAgZXJyb3IubGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICAgICAgICBlcnJvci5jb2x1bW4gPSB0b2tlbi5zdGFydCAtIGxpbmVTdGFydCArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcignTGluZSAnICsgbGluZU51bWJlciArICc6ICcgKyBtc2cpO1xuICAgICAgICAgICAgZXJyb3IuaW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSBsaW5lTnVtYmVyO1xuICAgICAgICAgICAgZXJyb3IuY29sdW1uID0gaW5kZXggLSBsaW5lU3RhcnQgKyAxO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyb3IuZGVzY3JpcHRpb24gPSBtc2c7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRocm93RXJyb3JUb2xlcmFudCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93RXJyb3IuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGV4dHJhLmVycm9ycykge1xuICAgICAgICAgICAgICAgIGV4dHJhLmVycm9ycy5wdXNoKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvLyBUaHJvdyBhbiBleGNlcHRpb24gYmVjYXVzZSBvZiB0aGUgdG9rZW4uXG5cbiAgICBmdW5jdGlvbiB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZEVPUyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWROdW1iZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRTdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBpZiAoaXNGdXR1cmVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFJlc2VydmVkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdFJlc2VydmVkV29yZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCb29sZWFuTGl0ZXJhbCwgTnVsbExpdGVyYWwsIG9yIFB1bmN0dWF0b3IuXG4gICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgIH1cblxuICAgIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIHB1bmN0dWF0b3IuXG4gICAgLy8gSWYgbm90LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG5cbiAgICBmdW5jdGlvbiBleHBlY3QodmFsdWUpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yIHx8IHRva2VuLnZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIGtleXdvcmQuXG4gICAgLy8gSWYgbm90LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG5cbiAgICBmdW5jdGlvbiBleHBlY3RLZXl3b3JkKGtleXdvcmQpIHtcbiAgICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkIHx8IHRva2VuLnZhbHVlICE9PSBrZXl3b3JkKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIG5leHQgdG9rZW4gbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIHB1bmN0dWF0b3IuXG5cbiAgICBmdW5jdGlvbiBtYXRjaCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbG9va2FoZWFkLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnZhbHVlID09PSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQga2V5d29yZFxuXG4gICAgZnVuY3Rpb24gbWF0Y2hLZXl3b3JkKGtleXdvcmQpIHtcbiAgICAgICAgcmV0dXJuIGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5LZXl3b3JkICYmIGxvb2thaGVhZC52YWx1ZSA9PT0ga2V5d29yZDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBpcyBhbiBhc3NpZ25tZW50IG9wZXJhdG9yXG5cbiAgICBmdW5jdGlvbiBtYXRjaEFzc2lnbigpIHtcbiAgICAgICAgdmFyIG9wO1xuXG4gICAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG9wID0gbG9va2FoZWFkLnZhbHVlO1xuICAgICAgICByZXR1cm4gb3AgPT09ICc9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICcqPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnLz0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJyU9JyB8fFxuICAgICAgICAgICAgb3AgPT09ICcrPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnLT0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJzw8PScgfHxcbiAgICAgICAgICAgIG9wID09PSAnPj49JyB8fFxuICAgICAgICAgICAgb3AgPT09ICc+Pj49JyB8fFxuICAgICAgICAgICAgb3AgPT09ICcmPScgfHxcbiAgICAgICAgICAgIG9wID09PSAnXj0nIHx8XG4gICAgICAgICAgICBvcCA9PT0gJ3w9JztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25zdW1lU2VtaWNvbG9uKCkge1xuICAgICAgICB2YXIgbGluZTtcblxuICAgICAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4M0IgfHwgbWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgICAgaWYgKGxpbmVOdW1iZXIgIT09IGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GICYmICFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJldHVybiB0cnVlIGlmIHByb3ZpZGVkIGV4cHJlc3Npb24gaXMgTGVmdEhhbmRTaWRlRXhwcmVzc2lvblxuXG4gICAgZnVuY3Rpb24gaXNMZWZ0SGFuZFNpZGUoZXhwcikge1xuICAgICAgICByZXR1cm4gZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciB8fCBleHByLnR5cGUgPT09IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uO1xuICAgIH1cblxuICAgIC8vIDExLjEuNCBBcnJheSBJbml0aWFsaXNlclxuXG4gICAgZnVuY3Rpb24gcGFyc2VBcnJheUluaXRpYWxpc2VyKCkge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBbXSwgc3RhcnRUb2tlbjtcblxuICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICBleHBlY3QoJ1snKTtcblxuICAgICAgICB3aGlsZSAoIW1hdGNoKCddJykpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChudWxsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCgnXScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxleCgpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZUFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDExLjEuNSBPYmplY3QgSW5pdGlhbGlzZXJcblxuICAgIGZ1bmN0aW9uIHBhcnNlUHJvcGVydHlGdW5jdGlvbihwYXJhbSwgZmlyc3QpIHtcbiAgICAgICAgdmFyIHByZXZpb3VzU3RyaWN0LCBib2R5LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHByZXZpb3VzU3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICBib2R5ID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICAgIGlmIChmaXJzdCAmJiBzdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChwYXJhbVswXS5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KGZpcnN0LCBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVGdW5jdGlvbkV4cHJlc3Npb24obnVsbCwgcGFyYW0sIFtdLCBib2R5KSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpIHtcbiAgICAgICAgdmFyIHRva2VuLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIHRva2VuID0gbGV4KCk7XG5cbiAgICAgICAgLy8gTm90ZTogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb25seSBmcm9tIHBhcnNlT2JqZWN0UHJvcGVydHkoKSwgd2hlcmVcbiAgICAgICAgLy8gRU9GIGFuZCBQdW5jdHVhdG9yIHRva2VucyBhcmUgYWxyZWFkeSBmaWx0ZXJlZCBvdXQuXG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwgfHwgdG9rZW4udHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVMaXRlcmFsKHRva2VuKSwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVJZGVudGlmaWVyKHRva2VuLnZhbHVlKSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VPYmplY3RQcm9wZXJ0eSgpIHtcbiAgICAgICAgdmFyIHRva2VuLCBrZXksIGlkLCB2YWx1ZSwgcGFyYW0sIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcblxuICAgICAgICAgICAgaWQgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG5cbiAgICAgICAgICAgIC8vIFByb3BlcnR5IEFzc2lnbm1lbnQ6IEdldHRlciBhbmQgU2V0dGVyLlxuXG4gICAgICAgICAgICBpZiAodG9rZW4udmFsdWUgPT09ICdnZXQnICYmICFtYXRjaCgnOicpKSB7XG4gICAgICAgICAgICAgICAga2V5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnKCcpO1xuICAgICAgICAgICAgICAgIGV4cGVjdCgnKScpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VQcm9wZXJ0eUZ1bmN0aW9uKFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVQcm9wZXJ0eSgnZ2V0Jywga2V5LCB2YWx1ZSksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnc2V0JyAmJiAhbWF0Y2goJzonKSkge1xuICAgICAgICAgICAgICAgIGtleSA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoJygnKTtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3QoJyknKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZVByb3BlcnR5RnVuY3Rpb24oW10pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtID0gWyBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpIF07XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdCgnKScpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlUHJvcGVydHlGdW5jdGlvbihwYXJhbSwgdG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVQcm9wZXJ0eSgnc2V0Jywga2V5LCB2YWx1ZSksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZVByb3BlcnR5KCdpbml0JywgaWQsIHZhbHVlKSwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRiB8fCB0b2tlbi50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZVByb3BlcnR5KCdpbml0Jywga2V5LCB2YWx1ZSksIHN0YXJ0VG9rZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpIHtcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBbXSwgcHJvcGVydHksIG5hbWUsIGtleSwga2luZCwgbWFwID0ge30sIHRvU3RyaW5nID0gU3RyaW5nLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgd2hpbGUgKCFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICBwcm9wZXJ0eSA9IHBhcnNlT2JqZWN0UHJvcGVydHkoKTtcblxuICAgICAgICAgICAgaWYgKHByb3BlcnR5LmtleS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBwcm9wZXJ0eS5rZXkubmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IHRvU3RyaW5nKHByb3BlcnR5LmtleS52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBraW5kID0gKHByb3BlcnR5LmtpbmQgPT09ICdpbml0JykgPyBQcm9wZXJ0eUtpbmQuRGF0YSA6IChwcm9wZXJ0eS5raW5kID09PSAnZ2V0JykgPyBQcm9wZXJ0eUtpbmQuR2V0IDogUHJvcGVydHlLaW5kLlNldDtcblxuICAgICAgICAgICAga2V5ID0gJyQnICsgbmFtZTtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWFwLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcFtrZXldID09PSBQcm9wZXJ0eUtpbmQuRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGtpbmQgPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdER1cGxpY2F0ZVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChraW5kICE9PSBQcm9wZXJ0eUtpbmQuRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckRhdGFQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2luZCA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuQWNjZXNzb3JEYXRhUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1hcFtrZXldICYga2luZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckdldFNldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbWFwW2tleV0gfD0ga2luZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwW2tleV0gPSBraW5kO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xuXG4gICAgICAgICAgICBpZiAoIW1hdGNoKCd9JykpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoJywnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cGVjdCgnfScpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZU9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDExLjEuNiBUaGUgR3JvdXBpbmcgT3BlcmF0b3JcblxuICAgIGZ1bmN0aW9uIHBhcnNlR3JvdXBFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwcjtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG5cbiAgICAvLyAxMS4xIFByaW1hcnkgRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciB0eXBlLCB0b2tlbiwgZXhwciwgc3RhcnRUb2tlbjtcblxuICAgICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1hdGNoKCd7JykpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZU9iamVjdEluaXRpYWxpc2VyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0eXBlID0gbG9va2FoZWFkLnR5cGU7XG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIGV4cHIgPSAgZGVsZWdhdGUuY3JlYXRlSWRlbnRpZmllcihsZXgoKS52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBsb29rYWhlYWQub2N0YWwpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQobG9va2FoZWFkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwciA9IGRlbGVnYXRlLmNyZWF0ZUxpdGVyYWwobGV4KCkpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGdW5jdGlvbkV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ3RoaXMnKSkge1xuICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVUaGlzRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobGV4KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRva2VuLkJvb2xlYW5MaXRlcmFsKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgICAgdG9rZW4udmFsdWUgPSAodG9rZW4udmFsdWUgPT09ICd0cnVlJyk7XG4gICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlTGl0ZXJhbCh0b2tlbik7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uTnVsbExpdGVyYWwpIHtcbiAgICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgICB0b2tlbi52YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlTGl0ZXJhbCh0b2tlbik7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJy8nKSB8fCBtYXRjaCgnLz0nKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IGRlbGVnYXRlLmNyZWF0ZUxpdGVyYWwoY29sbGVjdFJlZ2V4KCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlTGl0ZXJhbChzY2FuUmVnRXhwKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGVlaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKGxleCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGV4cHIsIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlQXJndW1lbnRzKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtdO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgcmV0dXJuIGFyZ3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCkge1xuICAgICAgICB2YXIgdG9rZW4sIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgICBpZiAoIWlzSWRlbnRpZmllck5hbWUodG9rZW4pKSB7XG4gICAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlSWRlbnRpZmllcih0b2tlbi52YWx1ZSksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgICAgIGV4cGVjdCgnLicpO1xuXG4gICAgICAgIHJldHVybiBwYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgICAgICB2YXIgZXhwcjtcblxuICAgICAgICBleHBlY3QoJ1snKTtcblxuICAgICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCddJyk7XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VOZXdFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgY2FsbGVlLCBhcmdzLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ25ldycpO1xuICAgICAgICBjYWxsZWUgPSBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcbiAgICAgICAgYXJncyA9IG1hdGNoKCcoJykgPyBwYXJzZUFyZ3VtZW50cygpIDogW107XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlTmV3RXhwcmVzc2lvbihjYWxsZWUsIGFyZ3MpLCBzdGFydFRva2VuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSB7XG4gICAgICAgIHZhciBwcmV2aW91c0FsbG93SW4sIGV4cHIsIGFyZ3MsIHByb3BlcnR5LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcbiAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHRydWU7XG4gICAgICAgIGV4cHIgPSBtYXRjaEtleXdvcmQoJ25ldycpID8gcGFyc2VOZXdFeHByZXNzaW9uKCkgOiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG4gICAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgaWYgKG1hdGNoKCcuJykpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKTtcbiAgICAgICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlTWVtYmVyRXhwcmVzc2lvbignLicsIGV4cHIsIHByb3BlcnR5KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBwYXJzZUFyZ3VtZW50cygpO1xuICAgICAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVDYWxsRXhwcmVzc2lvbihleHByLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VDb21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVNZW1iZXJFeHByZXNzaW9uKCdbJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGVnYXRlLm1hcmtFbmQoZXhwciwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBwcmV2aW91c0FsbG93SW4sIGV4cHIsIHByb3BlcnR5LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcbiAgICAgICAgZXhwciA9IG1hdGNoS2V5d29yZCgnbmV3JykgPyBwYXJzZU5ld0V4cHJlc3Npb24oKSA6IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICB3aGlsZSAobWF0Y2goJy4nKSB8fCBtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VDb21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVNZW1iZXJFeHByZXNzaW9uKCdbJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKTtcbiAgICAgICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlTWVtYmVyRXhwcmVzc2lvbignLicsIGV4cHIsIHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGVnYXRlLm1hcmtFbmQoZXhwciwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4zIFBvc3RmaXggRXhwcmVzc2lvbnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgICAgIHZhciBleHByLCB0b2tlbiwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgICBleHByID0gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCk7XG5cbiAgICAgICAgaWYgKGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yKSB7XG4gICAgICAgICAgICBpZiAoKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSAmJiAhcGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgICAgICAvLyAxMS4zLjEsIDExLjMuMlxuICAgICAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RMSFNQb3N0Zml4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlzTGVmdEhhbmRTaWRlKGV4cHIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luQXNzaWdubWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICAgICAgICBleHByID0gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVQb3N0Zml4RXhwcmVzc2lvbih0b2tlbi52YWx1ZSwgZXhwciksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgLy8gMTEuNCBVbmFyeSBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlVW5hcnlFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgdG9rZW4sIGV4cHIsIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgaWYgKGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yICYmIGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBleHByID0gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSB7XG4gICAgICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICAgIGV4cHIgPSBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgLy8gMTEuNC40LCAxMS40LjVcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdExIU1ByZWZpeCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNMZWZ0SGFuZFNpZGUoZXhwcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkludmFsaWRMSFNJbkFzc2lnbm1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlVW5hcnlFeHByZXNzaW9uKHRva2VuLnZhbHVlLCBleHByKTtcbiAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5tYXJrRW5kKGV4cHIsIHN0YXJ0VG9rZW4pO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCcrJykgfHwgbWF0Y2goJy0nKSB8fCBtYXRjaCgnficpIHx8IG1hdGNoKCchJykpIHtcbiAgICAgICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgICAgZXhwciA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlVW5hcnlFeHByZXNzaW9uKHRva2VuLnZhbHVlLCBleHByKTtcbiAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5tYXJrRW5kKGV4cHIsIHN0YXJ0VG9rZW4pO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoS2V5d29yZCgnZGVsZXRlJykgfHwgbWF0Y2hLZXl3b3JkKCd2b2lkJykgfHwgbWF0Y2hLZXl3b3JkKCd0eXBlb2YnKSkge1xuICAgICAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVVbmFyeUV4cHJlc3Npb24odG9rZW4udmFsdWUsIGV4cHIpO1xuICAgICAgICAgICAgZXhwciA9IGRlbGVnYXRlLm1hcmtFbmQoZXhwciwgc3RhcnRUb2tlbik7XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGV4cHIub3BlcmF0b3IgPT09ICdkZWxldGUnICYmIGV4cHIuYXJndW1lbnQudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdERlbGV0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHByID0gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmluYXJ5UHJlY2VkZW5jZSh0b2tlbiwgYWxsb3dJbikge1xuICAgICAgICB2YXIgcHJlYyA9IDA7XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgJiYgdG9rZW4udHlwZSAhPT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ3x8JzpcbiAgICAgICAgICAgIHByZWMgPSAxO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnJiYnOlxuICAgICAgICAgICAgcHJlYyA9IDI7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd8JzpcbiAgICAgICAgICAgIHByZWMgPSAzO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgICBwcmVjID0gNDtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgICAgcHJlYyA9IDU7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICc9PSc6XG4gICAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgY2FzZSAnPT09JzpcbiAgICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgICAgIHByZWMgPSA2O1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnPCc6XG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICBjYXNlICc8PSc6XG4gICAgICAgIGNhc2UgJz49JzpcbiAgICAgICAgY2FzZSAnaW5zdGFuY2VvZic6XG4gICAgICAgICAgICBwcmVjID0gNztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2luJzpcbiAgICAgICAgICAgIHByZWMgPSBhbGxvd0luID8gNyA6IDA7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICc8PCc6XG4gICAgICAgIGNhc2UgJz4+JzpcbiAgICAgICAgY2FzZSAnPj4+JzpcbiAgICAgICAgICAgIHByZWMgPSA4O1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgcHJlYyA9IDk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICcqJzpcbiAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgIGNhc2UgJyUnOlxuICAgICAgICAgICAgcHJlYyA9IDExO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByZWM7XG4gICAgfVxuXG4gICAgLy8gMTEuNSBNdWx0aXBsaWNhdGl2ZSBPcGVyYXRvcnNcbiAgICAvLyAxMS42IEFkZGl0aXZlIE9wZXJhdG9yc1xuICAgIC8vIDExLjcgQml0d2lzZSBTaGlmdCBPcGVyYXRvcnNcbiAgICAvLyAxMS44IFJlbGF0aW9uYWwgT3BlcmF0b3JzXG4gICAgLy8gMTEuOSBFcXVhbGl0eSBPcGVyYXRvcnNcbiAgICAvLyAxMS4xMCBCaW5hcnkgQml0d2lzZSBPcGVyYXRvcnNcbiAgICAvLyAxMS4xMSBCaW5hcnkgTG9naWNhbCBPcGVyYXRvcnNcblxuICAgIGZ1bmN0aW9uIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgbWFya2VycywgZXhwciwgdG9rZW4sIHByZWMsIHN0YWNrLCByaWdodCwgb3BlcmF0b3IsIGxlZnQsIGk7XG5cbiAgICAgICAgbWFya2VyID0gbG9va2FoZWFkO1xuICAgICAgICBsZWZ0ID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgcHJlYyA9IGJpbmFyeVByZWNlZGVuY2UodG9rZW4sIHN0YXRlLmFsbG93SW4pO1xuICAgICAgICBpZiAocHJlYyA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGxlZnQ7XG4gICAgICAgIH1cbiAgICAgICAgdG9rZW4ucHJlYyA9IHByZWM7XG4gICAgICAgIGxleCgpO1xuXG4gICAgICAgIG1hcmtlcnMgPSBbbWFya2VyLCBsb29rYWhlYWRdO1xuICAgICAgICByaWdodCA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgc3RhY2sgPSBbbGVmdCwgdG9rZW4sIHJpZ2h0XTtcblxuICAgICAgICB3aGlsZSAoKHByZWMgPSBiaW5hcnlQcmVjZWRlbmNlKGxvb2thaGVhZCwgc3RhdGUuYWxsb3dJbikpID4gMCkge1xuXG4gICAgICAgICAgICAvLyBSZWR1Y2U6IG1ha2UgYSBiaW5hcnkgZXhwcmVzc2lvbiBmcm9tIHRoZSB0aHJlZSB0b3Btb3N0IGVudHJpZXMuXG4gICAgICAgICAgICB3aGlsZSAoKHN0YWNrLmxlbmd0aCA+IDIpICYmIChwcmVjIDw9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDJdLnByZWMpKSB7XG4gICAgICAgICAgICAgICAgcmlnaHQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICBvcGVyYXRvciA9IHN0YWNrLnBvcCgpLnZhbHVlO1xuICAgICAgICAgICAgICAgIGxlZnQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlQmluYXJ5RXhwcmVzc2lvbihvcGVyYXRvciwgbGVmdCwgcmlnaHQpO1xuICAgICAgICAgICAgICAgIG1hcmtlcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgbWFya2VyID0gbWFya2Vyc1ttYXJrZXJzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRlLm1hcmtFbmQoZXhwciwgbWFya2VyKTtcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGV4cHIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaGlmdC5cbiAgICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgICB0b2tlbi5wcmVjID0gcHJlYztcbiAgICAgICAgICAgIHN0YWNrLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgbWFya2Vycy5wdXNoKGxvb2thaGVhZCk7XG4gICAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgIHN0YWNrLnB1c2goZXhwcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgICAgICBpID0gc3RhY2subGVuZ3RoIC0gMTtcbiAgICAgICAgZXhwciA9IHN0YWNrW2ldO1xuICAgICAgICBtYXJrZXJzLnBvcCgpO1xuICAgICAgICB3aGlsZSAoaSA+IDEpIHtcbiAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVCaW5hcnlFeHByZXNzaW9uKHN0YWNrW2kgLSAxXS52YWx1ZSwgc3RhY2tbaSAtIDJdLCBleHByKTtcbiAgICAgICAgICAgIGkgLT0gMjtcbiAgICAgICAgICAgIG1hcmtlciA9IG1hcmtlcnMucG9wKCk7XG4gICAgICAgICAgICBkZWxlZ2F0ZS5tYXJrRW5kKGV4cHIsIG1hcmtlcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cblxuICAgIC8vIDExLjEyIENvbmRpdGlvbmFsIE9wZXJhdG9yXG5cbiAgICBmdW5jdGlvbiBwYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIGV4cHIsIHByZXZpb3VzQWxsb3dJbiwgY29uc2VxdWVudCwgYWx0ZXJuYXRlLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgZXhwciA9IHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGlmIChtYXRjaCgnPycpKSB7XG4gICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgIHByZXZpb3VzQWxsb3dJbiA9IHN0YXRlLmFsbG93SW47XG4gICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNlcXVlbnQgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgICBhbHRlcm5hdGUgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICAgIGV4cHIgPSBkZWxlZ2F0ZS5jcmVhdGVDb25kaXRpb25hbEV4cHJlc3Npb24oZXhwciwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKTtcbiAgICAgICAgICAgIGRlbGVnYXRlLm1hcmtFbmQoZXhwciwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICAvLyAxMS4xMyBBc3NpZ25tZW50IE9wZXJhdG9yc1xuXG4gICAgZnVuY3Rpb24gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICAgICAgdmFyIHRva2VuLCBsZWZ0LCByaWdodCwgbm9kZSwgc3RhcnRUb2tlbjtcblxuICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgICBub2RlID0gbGVmdCA9IHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgaWYgKG1hdGNoQXNzaWduKCkpIHtcbiAgICAgICAgICAgIC8vIExlZnRIYW5kU2lkZUV4cHJlc3Npb25cbiAgICAgICAgICAgIGlmICghaXNMZWZ0SGFuZFNpZGUobGVmdCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkludmFsaWRMSFNJbkFzc2lnbm1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyAxMS4xMy4xXG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGxlZnQudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgJiYgaXNSZXN0cmljdGVkV29yZChsZWZ0Lm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RMSFNBc3NpZ25tZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgbm9kZSA9IGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlQXNzaWdubWVudEV4cHJlc3Npb24odG9rZW4udmFsdWUsIGxlZnQsIHJpZ2h0KSwgc3RhcnRUb2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICAvLyAxMS4xNCBDb21tYSBPcGVyYXRvclxuXG4gICAgZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgZXhwciwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgICBleHByID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICBleHByID0gZGVsZWdhdGUuY3JlYXRlU2VxdWVuY2VFeHByZXNzaW9uKFsgZXhwciBdKTtcblxuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgICBleHByLmV4cHJlc3Npb25zLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZWdhdGUubWFya0VuZChleHByLCBzdGFydFRva2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIC8vIDEyLjEgQmxvY2tcblxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGVtZW50TGlzdCgpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBbXSxcbiAgICAgICAgICAgIHN0YXRlbWVudDtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZW1lbnQgPSBwYXJzZVNvdXJjZUVsZW1lbnQoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGlzdC5wdXNoKHN0YXRlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUJsb2NrKCkge1xuICAgICAgICB2YXIgYmxvY2ssIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgYmxvY2sgPSBwYXJzZVN0YXRlbWVudExpc3QoKTtcblxuICAgICAgICBleHBlY3QoJ30nKTtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVCbG9ja1N0YXRlbWVudChibG9jayksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDEyLjIgVmFyaWFibGUgU3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpIHtcbiAgICAgICAgdmFyIHRva2VuLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIHRva2VuID0gbGV4KCk7XG5cbiAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVJZGVudGlmaWVyKHRva2VuLnZhbHVlKSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKGtpbmQpIHtcbiAgICAgICAgdmFyIGluaXQgPSBudWxsLCBpZCwgc3RhcnRUb2tlbjtcblxuICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICBpZCA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgICAgLy8gMTIuMi4xXG4gICAgICAgIGlmIChzdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RWYXJOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChraW5kID09PSAnY29uc3QnKSB7XG4gICAgICAgICAgICBleHBlY3QoJz0nKTtcbiAgICAgICAgICAgIGluaXQgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJz0nKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBpbml0ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlVmFyaWFibGVEZWNsYXJhdG9yKGlkLCBpbml0KSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uTGlzdChraW5kKSB7XG4gICAgICAgIHZhciBsaXN0ID0gW107XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgbGlzdC5wdXNoKHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbihraW5kKSk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKCcsJykpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICB9IHdoaWxlIChpbmRleCA8IGxlbmd0aCk7XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucztcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd2YXInKTtcblxuICAgICAgICBkZWNsYXJhdGlvbnMgPSBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KCk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9ucywgJ3ZhcicpO1xuICAgIH1cblxuICAgIC8vIGtpbmQgbWF5IGJlIGBjb25zdGAgb3IgYGxldGBcbiAgICAvLyBCb3RoIGFyZSBleHBlcmltZW50YWwgYW5kIG5vdCBpbiB0aGUgc3BlY2lmaWNhdGlvbiB5ZXQuXG4gICAgLy8gc2VlIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6Y29uc3RcbiAgICAvLyBhbmQgaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTpsZXRcbiAgICBmdW5jdGlvbiBwYXJzZUNvbnN0TGV0RGVjbGFyYXRpb24oa2luZCkge1xuICAgICAgICB2YXIgZGVjbGFyYXRpb25zLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZChraW5kKTtcblxuICAgICAgICBkZWNsYXJhdGlvbnMgPSBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25MaXN0KGtpbmQpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9ucywga2luZCksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDEyLjMgRW1wdHkgU3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgICAgICBleHBlY3QoJzsnKTtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZUVtcHR5U3RhdGVtZW50KCk7XG4gICAgfVxuXG4gICAgLy8gMTIuNCBFeHByZXNzaW9uIFN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVFeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICAgIH1cblxuICAgIC8vIDEyLjUgSWYgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2lmJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIGNvbnNlcXVlbnQgPSBwYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgICAgIGlmIChtYXRjaEtleXdvcmQoJ2Vsc2UnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICBhbHRlcm5hdGUgPSBwYXJzZVN0YXRlbWVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWx0ZXJuYXRlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVJZlN0YXRlbWVudCh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpO1xuICAgIH1cblxuICAgIC8vIDEyLjYgSXRlcmF0aW9uIFN0YXRlbWVudHNcblxuICAgIGZ1bmN0aW9uIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGJvZHksIHRlc3QsIG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2RvJyk7XG5cbiAgICAgICAgb2xkSW5JdGVyYXRpb24gPSBzdGF0ZS5pbkl0ZXJhdGlvbjtcbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSB0cnVlO1xuXG4gICAgICAgIGJvZHkgPSBwYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnd2hpbGUnKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICB0ZXN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgaWYgKG1hdGNoKCc7JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZURvV2hpbGVTdGF0ZW1lbnQoYm9keSwgdGVzdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VXaGlsZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIHRlc3QsIGJvZHksIG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3doaWxlJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICAgIG9sZEluSXRlcmF0aW9uID0gc3RhdGUuaW5JdGVyYXRpb247XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gdHJ1ZTtcblxuICAgICAgICBib2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcblxuICAgICAgICBzdGF0ZS5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVXaGlsZVN0YXRlbWVudCh0ZXN0LCBib2R5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24oKSB7XG4gICAgICAgIHZhciB0b2tlbiwgZGVjbGFyYXRpb25zLCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgIGRlY2xhcmF0aW9ucyA9IHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3QoKTtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9ucywgdG9rZW4udmFsdWUpLCBzdGFydFRva2VuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZvclN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGluaXQsIHRlc3QsIHVwZGF0ZSwgbGVmdCwgcmlnaHQsIGJvZHksIG9sZEluSXRlcmF0aW9uO1xuXG4gICAgICAgIGluaXQgPSB0ZXN0ID0gdXBkYXRlID0gbnVsbDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCdmb3InKTtcblxuICAgICAgICBleHBlY3QoJygnKTtcblxuICAgICAgICBpZiAobWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCd2YXInKSB8fCBtYXRjaEtleXdvcmQoJ2xldCcpKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGluaXQgPSBwYXJzZUZvclZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0LmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDEgJiYgbWF0Y2hLZXl3b3JkKCdpbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gaW5pdDtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICAgICAgICAgICAgaW5pdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaW5pdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoS2V5d29yZCgnaW4nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNMZWZ0SGFuZFNpZGUoaW5pdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSW52YWxpZExIU0luRm9ySW4pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSBpbml0O1xuICAgICAgICAgICAgICAgICAgICByaWdodCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgICAgICBpbml0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBleHBlY3QoJzsnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCgnOycpKSB7XG4gICAgICAgICAgICAgICAgdGVzdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwZWN0KCc7Jyk7XG5cbiAgICAgICAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgb2xkSW5JdGVyYXRpb24gPSBzdGF0ZS5pbkl0ZXJhdGlvbjtcbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSB0cnVlO1xuXG4gICAgICAgIGJvZHkgPSBwYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICAgICAgcmV0dXJuICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcpID9cbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZS5jcmVhdGVGb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgdXBkYXRlLCBib2R5KSA6XG4gICAgICAgICAgICAgICAgZGVsZWdhdGUuY3JlYXRlRm9ySW5TdGF0ZW1lbnQobGVmdCwgcmlnaHQsIGJvZHkpO1xuICAgIH1cblxuICAgIC8vIDEyLjcgVGhlIGNvbnRpbnVlIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGxhYmVsID0gbnVsbCwga2V5O1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2NvbnRpbnVlJyk7XG5cbiAgICAgICAgLy8gT3B0aW1pemUgdGhlIG1vc3QgY29tbW9uIGZvcm06ICdjb250aW51ZTsnLlxuICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDNCKSB7XG4gICAgICAgICAgICBsZXgoKTtcblxuICAgICAgICAgICAgaWYgKCFzdGF0ZS5pbkl0ZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxDb250aW51ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVDb250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgaWYgKCFzdGF0ZS5pbkl0ZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxDb250aW51ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVDb250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgICAgbGFiZWwgPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuXG4gICAgICAgICAgICBrZXkgPSAnJCcgKyBsYWJlbC5uYW1lO1xuICAgICAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3RhdGUubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5Vbmtub3duTGFiZWwsIGxhYmVsLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIGlmIChsYWJlbCA9PT0gbnVsbCAmJiAhc3RhdGUuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxDb250aW51ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlQ29udGludWVTdGF0ZW1lbnQobGFiZWwpO1xuICAgIH1cblxuICAgIC8vIDEyLjggVGhlIGJyZWFrIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIGxhYmVsID0gbnVsbCwga2V5O1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ2JyZWFrJyk7XG5cbiAgICAgICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDNCKSB7XG4gICAgICAgICAgICBsZXgoKTtcblxuICAgICAgICAgICAgaWYgKCEoc3RhdGUuaW5JdGVyYXRpb24gfHwgc3RhdGUuaW5Td2l0Y2gpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSWxsZWdhbEJyZWFrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZUJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBlZWtMaW5lVGVybWluYXRvcigpKSB7XG4gICAgICAgICAgICBpZiAoIShzdGF0ZS5pbkl0ZXJhdGlvbiB8fCBzdGF0ZS5pblN3aXRjaCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbGxlZ2FsQnJlYWspO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9va2FoZWFkLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgIGxhYmVsID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgICAgICAga2V5ID0gJyQnICsgbGFiZWwubmFtZTtcbiAgICAgICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5rbm93bkxhYmVsLCBsYWJlbC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICBpZiAobGFiZWwgPT09IG51bGwgJiYgIShzdGF0ZS5pbkl0ZXJhdGlvbiB8fCBzdGF0ZS5pblN3aXRjaCkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLklsbGVnYWxCcmVhayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlQnJlYWtTdGF0ZW1lbnQobGFiZWwpO1xuICAgIH1cblxuICAgIC8vIDEyLjkgVGhlIHJldHVybiBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlUmV0dXJuU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgICAgIGV4cGVjdEtleXdvcmQoJ3JldHVybicpO1xuXG4gICAgICAgIGlmICghc3RhdGUuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuSWxsZWdhbFJldHVybik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyAncmV0dXJuJyBmb2xsb3dlZCBieSBhIHNwYWNlIGFuZCBhbiBpZGVudGlmaWVyIGlzIHZlcnkgY29tbW9uLlxuICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDIwKSB7XG4gICAgICAgICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZVJldHVyblN0YXRlbWVudChudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWF0Y2goJzsnKSkge1xuICAgICAgICAgICAgaWYgKCFtYXRjaCgnfScpICYmIGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgICAgICBhcmd1bWVudCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVSZXR1cm5TdGF0ZW1lbnQoYXJndW1lbnQpO1xuICAgIH1cblxuICAgIC8vIDEyLjEwIFRoZSB3aXRoIHN0YXRlbWVudFxuXG4gICAgZnVuY3Rpb24gcGFyc2VXaXRoU3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgb2JqZWN0LCBib2R5O1xuXG4gICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgIC8vIFRPRE8oaWthcmllbmF0b3IpOiBTaG91bGQgd2UgdXBkYXRlIHRoZSB0ZXN0IGNhc2VzIGluc3RlYWQ/XG4gICAgICAgICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3RNb2RlV2l0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd3aXRoJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgb2JqZWN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZVdpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgICB9XG5cbiAgICAvLyAxMi4xMCBUaGUgc3dpdGggc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVN3aXRjaENhc2UoKSB7XG4gICAgICAgIHZhciB0ZXN0LCBjb25zZXF1ZW50ID0gW10sIHN0YXRlbWVudCwgc3RhcnRUb2tlbjtcblxuICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdkZWZhdWx0JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgdGVzdCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBlY3RLZXl3b3JkKCdjYXNlJyk7XG4gICAgICAgICAgICB0ZXN0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwZWN0KCc6Jyk7XG5cbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goJ30nKSB8fCBtYXRjaEtleXdvcmQoJ2RlZmF1bHQnKSB8fCBtYXRjaEtleXdvcmQoJ2Nhc2UnKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGVtZW50ID0gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnNlcXVlbnQucHVzaChzdGF0ZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlU3dpdGNoQ2FzZSh0ZXN0LCBjb25zZXF1ZW50KSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBkaXNjcmltaW5hbnQsIGNhc2VzLCBjbGF1c2UsIG9sZEluU3dpdGNoLCBkZWZhdWx0Rm91bmQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnc3dpdGNoJyk7XG5cbiAgICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICAgZGlzY3JpbWluYW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgICAgY2FzZXMgPSBbXTtcblxuICAgICAgICBpZiAobWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgb2xkSW5Td2l0Y2ggPSBzdGF0ZS5pblN3aXRjaDtcbiAgICAgICAgc3RhdGUuaW5Td2l0Y2ggPSB0cnVlO1xuICAgICAgICBkZWZhdWx0Rm91bmQgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGF1c2UgPSBwYXJzZVN3aXRjaENhc2UoKTtcbiAgICAgICAgICAgIGlmIChjbGF1c2UudGVzdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0Rm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmYXVsdEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2VzLnB1c2goY2xhdXNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmNyZWF0ZVN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIGNhc2VzKTtcbiAgICB9XG5cbiAgICAvLyAxMi4xMyBUaGUgdGhyb3cgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZVRocm93U3RhdGVtZW50KCkge1xuICAgICAgICB2YXIgYXJndW1lbnQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgndGhyb3cnKTtcblxuICAgICAgICBpZiAocGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLk5ld2xpbmVBZnRlclRocm93KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3VtZW50ID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVUaHJvd1N0YXRlbWVudChhcmd1bWVudCk7XG4gICAgfVxuXG4gICAgLy8gMTIuMTQgVGhlIHRyeSBzdGF0ZW1lbnRcblxuICAgIGZ1bmN0aW9uIHBhcnNlQ2F0Y2hDbGF1c2UoKSB7XG4gICAgICAgIHZhciBwYXJhbSwgYm9keSwgc3RhcnRUb2tlbjtcblxuICAgICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICBleHBlY3RLZXl3b3JkKCdjYXRjaCcpO1xuXG4gICAgICAgIGV4cGVjdCgnKCcpO1xuICAgICAgICBpZiAobWF0Y2goJyknKSkge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKGxvb2thaGVhZCk7XG4gICAgICAgIH1cblxuICAgICAgICBwYXJhbSA9IHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgIC8vIDEyLjE0LjFcbiAgICAgICAgaWYgKHN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdENhdGNoVmFyaWFibGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCcpJyk7XG4gICAgICAgIGJvZHkgPSBwYXJzZUJsb2NrKCk7XG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZUNhdGNoQ2xhdXNlKHBhcmFtLCBib2R5KSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgICAgIHZhciBibG9jaywgaGFuZGxlcnMgPSBbXSwgZmluYWxpemVyID0gbnVsbDtcblxuICAgICAgICBleHBlY3RLZXl3b3JkKCd0cnknKTtcblxuICAgICAgICBibG9jayA9IHBhcnNlQmxvY2soKTtcblxuICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdjYXRjaCcpKSB7XG4gICAgICAgICAgICBoYW5kbGVycy5wdXNoKHBhcnNlQ2F0Y2hDbGF1c2UoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hLZXl3b3JkKCdmaW5hbGx5JykpIHtcbiAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgZmluYWxpemVyID0gcGFyc2VCbG9jaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCAmJiAhZmluYWxpemVyKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5Ob0NhdGNoT3JGaW5hbGx5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5jcmVhdGVUcnlTdGF0ZW1lbnQoYmxvY2ssIFtdLCBoYW5kbGVycywgZmluYWxpemVyKTtcbiAgICB9XG5cbiAgICAvLyAxMi4xNSBUaGUgZGVidWdnZXIgc3RhdGVtZW50XG5cbiAgICBmdW5jdGlvbiBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgICAgICBleHBlY3RLZXl3b3JkKCdkZWJ1Z2dlcicpO1xuXG4gICAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUuY3JlYXRlRGVidWdnZXJTdGF0ZW1lbnQoKTtcbiAgICB9XG5cbiAgICAvLyAxMiBTdGF0ZW1lbnRzXG5cbiAgICBmdW5jdGlvbiBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBsb29rYWhlYWQudHlwZSxcbiAgICAgICAgICAgIGV4cHIsXG4gICAgICAgICAgICBsYWJlbGVkQm9keSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKGxvb2thaGVhZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvciAmJiBsb29rYWhlYWQudmFsdWUgPT09ICd7Jykge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlQmxvY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICAgIHN3aXRjaCAobG9va2FoZWFkLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlICc7JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZUVtcHR5U3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAnKCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGxvb2thaGVhZC52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnYnJlYWsnOlxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbik7XG4gICAgICAgICAgICBjYXNlICdjb250aW51ZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VDb250aW51ZVN0YXRlbWVudCgpLCBzdGFydFRva2VuKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlYnVnZ2VyJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAnZG8nOlxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuKTtcbiAgICAgICAgICAgIGNhc2UgJ2Zvcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VGb3JTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbik7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VGdW5jdGlvbkRlY2xhcmF0aW9uKCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAnaWYnOlxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKHBhcnNlSWZTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbik7XG4gICAgICAgICAgICBjYXNlICdyZXR1cm4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKHBhcnNlUmV0dXJuU3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAnc3dpdGNoJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZVN3aXRjaFN0YXRlbWVudCgpLCBzdGFydFRva2VuKTtcbiAgICAgICAgICAgIGNhc2UgJ3Rocm93JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZVRocm93U3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAndHJ5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZVRyeVN0YXRlbWVudCgpLCBzdGFydFRva2VuKTtcbiAgICAgICAgICAgIGNhc2UgJ3Zhcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VWYXJpYWJsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuKTtcbiAgICAgICAgICAgIGNhc2UgJ3doaWxlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChwYXJzZVdoaWxlU3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgY2FzZSAnd2l0aCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQocGFyc2VXaXRoU3RhdGVtZW50KCksIHN0YXJ0VG9rZW4pO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzXG4gICAgICAgIGlmICgoZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikgJiYgbWF0Y2goJzonKSkge1xuICAgICAgICAgICAgbGV4KCk7XG5cbiAgICAgICAgICAgIGtleSA9ICckJyArIGV4cHIubmFtZTtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc3RhdGUubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5SZWRlY2xhcmF0aW9uLCAnTGFiZWwnLCBleHByLm5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0ZS5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICAgIGRlbGV0ZSBzdGF0ZS5sYWJlbFNldFtrZXldO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlTGFiZWxlZFN0YXRlbWVudChleHByLCBsYWJlbGVkQm9keSksIHN0YXJ0VG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5tYXJrRW5kKGRlbGVnYXRlLmNyZWF0ZUV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwciksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIC8vIDEzIEZ1bmN0aW9uIERlZmluaXRpb25cblxuICAgIGZ1bmN0aW9uIHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cygpIHtcbiAgICAgICAgdmFyIHNvdXJjZUVsZW1lbnQsIHNvdXJjZUVsZW1lbnRzID0gW10sIHRva2VuLCBkaXJlY3RpdmUsIGZpcnN0UmVzdHJpY3RlZCxcbiAgICAgICAgICAgIG9sZExhYmVsU2V0LCBvbGRJbkl0ZXJhdGlvbiwgb2xkSW5Td2l0Y2gsIG9sZEluRnVuY3Rpb25Cb2R5LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIGV4cGVjdCgneycpO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VFbGVtZW50LmV4cHJlc3Npb24udHlwZSAhPT0gU3ludGF4LkxpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIG5vdCBkaXJlY3RpdmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcmVjdGl2ZSA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCArIDEsIHRva2VuLmVuZCAtIDEpO1xuICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZSA9PT0gJ3VzZSBzdHJpY3QnKSB7XG4gICAgICAgICAgICAgICAgc3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChmaXJzdFJlc3RyaWN0ZWQsIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0UmVzdHJpY3RlZCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvbGRMYWJlbFNldCA9IHN0YXRlLmxhYmVsU2V0O1xuICAgICAgICBvbGRJbkl0ZXJhdGlvbiA9IHN0YXRlLmluSXRlcmF0aW9uO1xuICAgICAgICBvbGRJblN3aXRjaCA9IHN0YXRlLmluU3dpdGNoO1xuICAgICAgICBvbGRJbkZ1bmN0aW9uQm9keSA9IHN0YXRlLmluRnVuY3Rpb25Cb2R5O1xuXG4gICAgICAgIHN0YXRlLmxhYmVsU2V0ID0ge307XG4gICAgICAgIHN0YXRlLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLmluU3dpdGNoID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZUVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgICAgc3RhdGUubGFiZWxTZXQgPSBvbGRMYWJlbFNldDtcbiAgICAgICAgc3RhdGUuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICAgICAgc3RhdGUuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgc3RhdGUuaW5GdW5jdGlvbkJvZHkgPSBvbGRJbkZ1bmN0aW9uQm9keTtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVCbG9ja1N0YXRlbWVudChzb3VyY2VFbGVtZW50cyksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICB2YXIgcGFyYW0sIHBhcmFtcyA9IFtdLCB0b2tlbiwgc3RyaWN0ZWQsIHBhcmFtU2V0LCBrZXksIG1lc3NhZ2U7XG4gICAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgICAgcGFyYW1TZXQgPSB7fTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICAgICAgICAgIHBhcmFtID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgICAgICAgICBrZXkgPSAnJCcgKyB0b2tlbi52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbUR1cGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RQYXJhbU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UGFyYW1EdXBlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmFtcy5wdXNoKHBhcmFtKTtcbiAgICAgICAgICAgICAgICBwYXJhbVNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2goJyknKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhwZWN0KCcsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBlY3QoJyknKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICBzdHJpY3RlZDogc3RyaWN0ZWQsXG4gICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQ6IGZpcnN0UmVzdHJpY3RlZCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24oKSB7XG4gICAgICAgIHZhciBpZCwgcGFyYW1zID0gW10sIGJvZHksIHRva2VuLCBzdHJpY3RlZCwgdG1wLCBmaXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UsIHByZXZpb3VzU3RyaWN0LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgICAgZXhwZWN0S2V5d29yZCgnZnVuY3Rpb24nKTtcbiAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgIGlkID0gcGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RGdW5jdGlvbk5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IE1lc3NhZ2VzLlN0cmljdEZ1bmN0aW9uTmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0bXAgPSBwYXJzZVBhcmFtcyhmaXJzdFJlc3RyaWN0ZWQpO1xuICAgICAgICBwYXJhbXMgPSB0bXAucGFyYW1zO1xuICAgICAgICBzdHJpY3RlZCA9IHRtcC5zdHJpY3RlZDtcbiAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG1wLmZpcnN0UmVzdHJpY3RlZDtcbiAgICAgICAgaWYgKHRtcC5tZXNzYWdlKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gdG1wLm1lc3NhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2aW91c1N0cmljdCA9IHN0cmljdDtcbiAgICAgICAgYm9keSA9IHBhcnNlRnVuY3Rpb25Tb3VyY2VFbGVtZW50cygpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmIGZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihmaXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJpY3QgJiYgc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG5cbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlRnVuY3Rpb25EZWNsYXJhdGlvbihpZCwgcGFyYW1zLCBbXSwgYm9keSksIHN0YXJ0VG9rZW4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRnVuY3Rpb25FeHByZXNzaW9uKCkge1xuICAgICAgICB2YXIgdG9rZW4sIGlkID0gbnVsbCwgc3RyaWN0ZWQsIGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSwgdG1wLCBwYXJhbXMgPSBbXSwgYm9keSwgcHJldmlvdXNTdHJpY3QsIHN0YXJ0VG9rZW47XG5cbiAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgZXhwZWN0S2V5d29yZCgnZnVuY3Rpb24nKTtcblxuICAgICAgICBpZiAoIW1hdGNoKCcoJykpIHtcbiAgICAgICAgICAgIHRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICAgICAgaWQgPSBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdEZ1bmN0aW9uTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBNZXNzYWdlcy5TdHJpY3RGdW5jdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRtcCA9IHBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG4gICAgICAgIHBhcmFtcyA9IHRtcC5wYXJhbXM7XG4gICAgICAgIHN0cmljdGVkID0gdG1wLnN0cmljdGVkO1xuICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0bXAuZmlyc3RSZXN0cmljdGVkO1xuICAgICAgICBpZiAodG1wLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSB0bXAubWVzc2FnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZpb3VzU3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBib2R5ID0gcGFyc2VGdW5jdGlvblNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKGZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdCAmJiBzdHJpY3RlZCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBzdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcblxuICAgICAgICByZXR1cm4gZGVsZWdhdGUubWFya0VuZChkZWxlZ2F0ZS5jcmVhdGVGdW5jdGlvbkV4cHJlc3Npb24oaWQsIHBhcmFtcywgW10sIGJvZHkpLCBzdGFydFRva2VuKTtcbiAgICB9XG5cbiAgICAvLyAxNCBQcm9ncmFtXG5cbiAgICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnQoKSB7XG4gICAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgICAgc3dpdGNoIChsb29rYWhlYWQudmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NvbnN0JzpcbiAgICAgICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlQ29uc3RMZXREZWNsYXJhdGlvbihsb29rYWhlYWQudmFsdWUpO1xuICAgICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZ1bmN0aW9uRGVjbGFyYXRpb24oKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9va2FoZWFkLnR5cGUgIT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnRzKCkge1xuICAgICAgICB2YXIgc291cmNlRWxlbWVudCwgc291cmNlRWxlbWVudHMgPSBbXSwgdG9rZW4sIGRpcmVjdGl2ZSwgZmlyc3RSZXN0cmljdGVkO1xuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZUVsZW1lbnQuZXhwcmVzc2lvbi50eXBlICE9PSBTeW50YXguTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IGRpcmVjdGl2ZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlyZWN0aXZlID0gc291cmNlLnNsaWNlKHRva2VuLnN0YXJ0ICsgMSwgdG9rZW4uZW5kIC0gMSk7XG4gICAgICAgICAgICBpZiAoZGlyZWN0aXZlID09PSAndXNlIHN0cmljdCcpIHtcbiAgICAgICAgICAgICAgICBzdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KGZpcnN0UmVzdHJpY3RlZCwgTWVzc2FnZXMuU3RyaWN0T2N0YWxMaXRlcmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghZmlyc3RSZXN0cmljdGVkICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZUVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb3VyY2VFbGVtZW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVByb2dyYW0oKSB7XG4gICAgICAgIHZhciBib2R5LCBzdGFydFRva2VuO1xuXG4gICAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICAgIHBlZWsoKTtcbiAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgc3RyaWN0ID0gZmFsc2U7XG5cbiAgICAgICAgYm9keSA9IHBhcnNlU291cmNlRWxlbWVudHMoKTtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLm1hcmtFbmQoZGVsZWdhdGUuY3JlYXRlUHJvZ3JhbShib2R5KSwgc3RhcnRUb2tlbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVyVG9rZW5Mb2NhdGlvbigpIHtcbiAgICAgICAgdmFyIGksIGVudHJ5LCB0b2tlbiwgdG9rZW5zID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGV4dHJhLnRva2Vucy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgZW50cnkgPSBleHRyYS50b2tlbnNbaV07XG4gICAgICAgICAgICB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBlbnRyeS50eXBlLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbnRyeS52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICAgIHRva2VuLnJhbmdlID0gZW50cnkucmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4ubG9jID0gZW50cnkubG9jO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgZXh0cmEudG9rZW5zID0gdG9rZW5zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRva2VuaXplKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHRvU3RyaW5nLFxuICAgICAgICAgICAgdG9rZW4sXG4gICAgICAgICAgICB0b2tlbnM7XG5cbiAgICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gJ3N0cmluZycgJiYgIShjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgICAgY29kZSA9IHRvU3RyaW5nKGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZWdhdGUgPSBTeW50YXhUcmVlRGVsZWdhdGU7XG4gICAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgbGluZU51bWJlciA9IChzb3VyY2UubGVuZ3RoID4gMCkgPyAxIDogMDtcbiAgICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICAgICAgbG9va2FoZWFkID0gbnVsbDtcbiAgICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWxTZXQ6IHt9LFxuICAgICAgICAgICAgaW5GdW5jdGlvbkJvZHk6IGZhbHNlLFxuICAgICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgaW5Td2l0Y2g6IGZhbHNlLFxuICAgICAgICAgICAgbGFzdENvbW1lbnRTdGFydDogLTFcbiAgICAgICAgfTtcblxuICAgICAgICBleHRyYSA9IHt9O1xuXG4gICAgICAgIC8vIE9wdGlvbnMgbWF0Y2hpbmcuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIE9mIGNvdXJzZSB3ZSBjb2xsZWN0IHRva2VucyBoZXJlLlxuICAgICAgICBvcHRpb25zLnRva2VucyA9IHRydWU7XG4gICAgICAgIGV4dHJhLnRva2VucyA9IFtdO1xuICAgICAgICBleHRyYS50b2tlbml6ZSA9IHRydWU7XG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdHdvIGZpZWxkcyBhcmUgbmVjZXNzYXJ5IHRvIGNvbXB1dGUgdGhlIFJlZ2V4IHRva2Vucy5cbiAgICAgICAgZXh0cmEub3BlblBhcmVuVG9rZW4gPSAtMTtcbiAgICAgICAgZXh0cmEub3BlbkN1cmx5VG9rZW4gPSAtMTtcblxuICAgICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgICBleHRyYS5sb2MgPSAodHlwZW9mIG9wdGlvbnMubG9jID09PSAnYm9vbGVhbicpICYmIG9wdGlvbnMubG9jO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jb21tZW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy5jb21tZW50KSB7XG4gICAgICAgICAgICBleHRyYS5jb21tZW50cyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50b2xlcmFudCA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMudG9sZXJhbnQpIHtcbiAgICAgICAgICAgIGV4dHJhLmVycm9ycyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBlZWsoKTtcbiAgICAgICAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhLnRva2VucztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICAgIHdoaWxlIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChsZXhFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4dHJhLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzLnB1c2gobGV4RXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBicmVhayBvbiB0aGUgZmlyc3QgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzLlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBsZXhFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsdGVyVG9rZW5Mb2NhdGlvbigpO1xuICAgICAgICAgICAgdG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5jb21tZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0b2tlbnMuY29tbWVudHMgPSBleHRyYS5jb21tZW50cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEuZXJyb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRva2Vucy5lcnJvcnMgPSBleHRyYS5lcnJvcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBleHRyYSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2UoY29kZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcHJvZ3JhbSwgdG9TdHJpbmc7XG5cbiAgICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gJ3N0cmluZycgJiYgIShjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgICAgY29kZSA9IHRvU3RyaW5nKGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZWdhdGUgPSBTeW50YXhUcmVlRGVsZWdhdGU7XG4gICAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgbGluZU51bWJlciA9IChzb3VyY2UubGVuZ3RoID4gMCkgPyAxIDogMDtcbiAgICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICAgICAgbG9va2FoZWFkID0gbnVsbDtcbiAgICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgICAgbGFiZWxTZXQ6IHt9LFxuICAgICAgICAgICAgaW5GdW5jdGlvbkJvZHk6IGZhbHNlLFxuICAgICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgaW5Td2l0Y2g6IGZhbHNlLFxuICAgICAgICAgICAgbGFzdENvbW1lbnRTdGFydDogLTFcbiAgICAgICAgfTtcblxuICAgICAgICBleHRyYSA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgICAgICAgZXh0cmEubG9jID0gKHR5cGVvZiBvcHRpb25zLmxvYyA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmxvYztcbiAgICAgICAgICAgIGV4dHJhLmF0dGFjaENvbW1lbnQgPSAodHlwZW9mIG9wdGlvbnMuYXR0YWNoQ29tbWVudCA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmF0dGFjaENvbW1lbnQ7XG5cbiAgICAgICAgICAgIGlmIChleHRyYS5sb2MgJiYgb3B0aW9ucy5zb3VyY2UgIT09IG51bGwgJiYgb3B0aW9ucy5zb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGV4dHJhLnNvdXJjZSA9IHRvU3RyaW5nKG9wdGlvbnMuc291cmNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRva2VucyA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMudG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgZXh0cmEudG9rZW5zID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29tbWVudCA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMuY29tbWVudCkge1xuICAgICAgICAgICAgICAgIGV4dHJhLmNvbW1lbnRzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9sZXJhbnQgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRvbGVyYW50KSB7XG4gICAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0cmEuYXR0YWNoQ29tbWVudCkge1xuICAgICAgICAgICAgICAgIGV4dHJhLnJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBleHRyYS5jb21tZW50cyA9IFtdO1xuICAgICAgICAgICAgICAgIGV4dHJhLmJvdHRvbVJpZ2h0U3RhY2sgPSBbXTtcbiAgICAgICAgICAgICAgICBleHRyYS50cmFpbGluZ0NvbW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgZXh0cmEubGVhZGluZ0NvbW1lbnRzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvZ3JhbSA9IHBhcnNlUHJvZ3JhbSgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5jb21tZW50cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmFtLmNvbW1lbnRzID0gZXh0cmEuY29tbWVudHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbS50b2tlbnMgPSBleHRyYS50b2tlbnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLmVycm9ycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmFtLmVycm9ycyA9IGV4dHJhLmVycm9ycztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGV4dHJhID0ge307XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcbiAgICB9XG5cbiAgICAvLyBTeW5jIHdpdGggKi5qc29uIG1hbmlmZXN0cy5cbiAgICBleHBvcnRzLnZlcnNpb24gPSAnMS4yLjEnO1xuXG4gICAgZXhwb3J0cy50b2tlbml6ZSA9IHRva2VuaXplO1xuXG4gICAgZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xuXG4gICAgLy8gRGVlcCBjb3B5LlxuICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBleHBvcnRzLlN5bnRheCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYW1lLCB0eXBlcyA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHlwZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChuYW1lIGluIFN5bnRheCkge1xuICAgICAgICAgICAgaWYgKFN5bnRheC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIHR5cGVzW25hbWVdID0gU3ludGF4W25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZnJlZXplID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBPYmplY3QuZnJlZXplKHR5cGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0eXBlcztcbiAgICB9KCkpO1xuXG59KSk7XG4vKiB2aW06IHNldCBzdz00IHRzPTQgZXQgdHc9ODAgOiAqL1xuIiwiLypcbiAgQ29weXJpZ2h0IChDKSAyMDEyLTIwMTMgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgQXJpeWEgSGlkYXlhdCA8YXJpeWEuaGlkYXlhdEBnbWFpbC5jb20+XG5cbiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAgICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICBBUkUgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgPENPUFlSSUdIVCBIT0xERVI+IEJFIExJQUJMRSBGT1IgQU5ZXG4gIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbiAgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EXG4gIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRlxuICBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuKi9cbi8qanNsaW50IHZhcnM6ZmFsc2UsIGJpdHdpc2U6dHJ1ZSovXG4vKmpzaGludCBpbmRlbnQ6NCovXG4vKmdsb2JhbCBleHBvcnRzOnRydWUsIGRlZmluZTp0cnVlKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbiAoVU1EKSB0byBzdXBwb3J0IEFNRCwgQ29tbW9uSlMvTm9kZS5qcyxcbiAgICAvLyBhbmQgcGxhaW4gYnJvd3NlciBsb2FkaW5nLFxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmYWN0b3J5KGV4cG9ydHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoKHJvb3QuZXN0cmF2ZXJzZSA9IHt9KSk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBTeW50YXgsXG4gICAgICAgIGlzQXJyYXksXG4gICAgICAgIFZpc2l0b3JPcHRpb24sXG4gICAgICAgIFZpc2l0b3JLZXlzLFxuICAgICAgICBCUkVBSyxcbiAgICAgICAgU0tJUDtcblxuICAgIFN5bnRheCA9IHtcbiAgICAgICAgQXNzaWdubWVudEV4cHJlc3Npb246ICdBc3NpZ25tZW50RXhwcmVzc2lvbicsXG4gICAgICAgIEFycmF5RXhwcmVzc2lvbjogJ0FycmF5RXhwcmVzc2lvbicsXG4gICAgICAgIEFycmF5UGF0dGVybjogJ0FycmF5UGF0dGVybicsXG4gICAgICAgIEFycm93RnVuY3Rpb25FeHByZXNzaW9uOiAnQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24nLFxuICAgICAgICBCbG9ja1N0YXRlbWVudDogJ0Jsb2NrU3RhdGVtZW50JyxcbiAgICAgICAgQmluYXJ5RXhwcmVzc2lvbjogJ0JpbmFyeUV4cHJlc3Npb24nLFxuICAgICAgICBCcmVha1N0YXRlbWVudDogJ0JyZWFrU3RhdGVtZW50JyxcbiAgICAgICAgQ2FsbEV4cHJlc3Npb246ICdDYWxsRXhwcmVzc2lvbicsXG4gICAgICAgIENhdGNoQ2xhdXNlOiAnQ2F0Y2hDbGF1c2UnLFxuICAgICAgICBDbGFzc0JvZHk6ICdDbGFzc0JvZHknLFxuICAgICAgICBDbGFzc0RlY2xhcmF0aW9uOiAnQ2xhc3NEZWNsYXJhdGlvbicsXG4gICAgICAgIENsYXNzRXhwcmVzc2lvbjogJ0NsYXNzRXhwcmVzc2lvbicsXG4gICAgICAgIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogJ0NvbmRpdGlvbmFsRXhwcmVzc2lvbicsXG4gICAgICAgIENvbnRpbnVlU3RhdGVtZW50OiAnQ29udGludWVTdGF0ZW1lbnQnLFxuICAgICAgICBEZWJ1Z2dlclN0YXRlbWVudDogJ0RlYnVnZ2VyU3RhdGVtZW50JyxcbiAgICAgICAgRGlyZWN0aXZlU3RhdGVtZW50OiAnRGlyZWN0aXZlU3RhdGVtZW50JyxcbiAgICAgICAgRG9XaGlsZVN0YXRlbWVudDogJ0RvV2hpbGVTdGF0ZW1lbnQnLFxuICAgICAgICBFbXB0eVN0YXRlbWVudDogJ0VtcHR5U3RhdGVtZW50JyxcbiAgICAgICAgRXhwcmVzc2lvblN0YXRlbWVudDogJ0V4cHJlc3Npb25TdGF0ZW1lbnQnLFxuICAgICAgICBGb3JTdGF0ZW1lbnQ6ICdGb3JTdGF0ZW1lbnQnLFxuICAgICAgICBGb3JJblN0YXRlbWVudDogJ0ZvckluU3RhdGVtZW50JyxcbiAgICAgICAgRnVuY3Rpb25EZWNsYXJhdGlvbjogJ0Z1bmN0aW9uRGVjbGFyYXRpb24nLFxuICAgICAgICBGdW5jdGlvbkV4cHJlc3Npb246ICdGdW5jdGlvbkV4cHJlc3Npb24nLFxuICAgICAgICBJZGVudGlmaWVyOiAnSWRlbnRpZmllcicsXG4gICAgICAgIElmU3RhdGVtZW50OiAnSWZTdGF0ZW1lbnQnLFxuICAgICAgICBMaXRlcmFsOiAnTGl0ZXJhbCcsXG4gICAgICAgIExhYmVsZWRTdGF0ZW1lbnQ6ICdMYWJlbGVkU3RhdGVtZW50JyxcbiAgICAgICAgTG9naWNhbEV4cHJlc3Npb246ICdMb2dpY2FsRXhwcmVzc2lvbicsXG4gICAgICAgIE1lbWJlckV4cHJlc3Npb246ICdNZW1iZXJFeHByZXNzaW9uJyxcbiAgICAgICAgTWV0aG9kRGVmaW5pdGlvbjogJ01ldGhvZERlZmluaXRpb24nLFxuICAgICAgICBOZXdFeHByZXNzaW9uOiAnTmV3RXhwcmVzc2lvbicsXG4gICAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgICAgT2JqZWN0UGF0dGVybjogJ09iamVjdFBhdHRlcm4nLFxuICAgICAgICBQcm9ncmFtOiAnUHJvZ3JhbScsXG4gICAgICAgIFByb3BlcnR5OiAnUHJvcGVydHknLFxuICAgICAgICBSZXR1cm5TdGF0ZW1lbnQ6ICdSZXR1cm5TdGF0ZW1lbnQnLFxuICAgICAgICBTZXF1ZW5jZUV4cHJlc3Npb246ICdTZXF1ZW5jZUV4cHJlc3Npb24nLFxuICAgICAgICBTd2l0Y2hTdGF0ZW1lbnQ6ICdTd2l0Y2hTdGF0ZW1lbnQnLFxuICAgICAgICBTd2l0Y2hDYXNlOiAnU3dpdGNoQ2FzZScsXG4gICAgICAgIFRoaXNFeHByZXNzaW9uOiAnVGhpc0V4cHJlc3Npb24nLFxuICAgICAgICBUaHJvd1N0YXRlbWVudDogJ1Rocm93U3RhdGVtZW50JyxcbiAgICAgICAgVHJ5U3RhdGVtZW50OiAnVHJ5U3RhdGVtZW50JyxcbiAgICAgICAgVW5hcnlFeHByZXNzaW9uOiAnVW5hcnlFeHByZXNzaW9uJyxcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1VwZGF0ZUV4cHJlc3Npb24nLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0aW9uOiAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG4gICAgICAgIFZhcmlhYmxlRGVjbGFyYXRvcjogJ1ZhcmlhYmxlRGVjbGFyYXRvcicsXG4gICAgICAgIFdoaWxlU3RhdGVtZW50OiAnV2hpbGVTdGF0ZW1lbnQnLFxuICAgICAgICBXaXRoU3RhdGVtZW50OiAnV2l0aFN0YXRlbWVudCcsXG4gICAgICAgIFlpZWxkRXhwcmVzc2lvbjogJ1lpZWxkRXhwcmVzc2lvbidcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaWdub3JlSlNIaW50RXJyb3IoKSB7IH1cblxuICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIGlmICghaXNBcnJheSkge1xuICAgICAgICBpc0FycmF5ID0gZnVuY3Rpb24gaXNBcnJheShhcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVlcENvcHkob2JqKSB7XG4gICAgICAgIHZhciByZXQgPSB7fSwga2V5LCB2YWw7XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXRba2V5XSA9IGRlZXBDb3B5KHZhbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hhbGxvd0NvcHkob2JqKSB7XG4gICAgICAgIHZhciByZXQgPSB7fSwga2V5O1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldFtrZXldID0gb2JqW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgaWdub3JlSlNIaW50RXJyb3Ioc2hhbGxvd0NvcHkpO1xuXG4gICAgLy8gYmFzZWQgb24gTExWTSBsaWJjKysgdXBwZXJfYm91bmQgLyBsb3dlcl9ib3VuZFxuICAgIC8vIE1JVCBMaWNlbnNlXG5cbiAgICBmdW5jdGlvbiB1cHBlckJvdW5kKGFycmF5LCBmdW5jKSB7XG4gICAgICAgIHZhciBkaWZmLCBsZW4sIGksIGN1cnJlbnQ7XG5cbiAgICAgICAgbGVuID0gYXJyYXkubGVuZ3RoO1xuICAgICAgICBpID0gMDtcblxuICAgICAgICB3aGlsZSAobGVuKSB7XG4gICAgICAgICAgICBkaWZmID0gbGVuID4+PiAxO1xuICAgICAgICAgICAgY3VycmVudCA9IGkgKyBkaWZmO1xuICAgICAgICAgICAgaWYgKGZ1bmMoYXJyYXlbY3VycmVudF0pKSB7XG4gICAgICAgICAgICAgICAgbGVuID0gZGlmZjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaSA9IGN1cnJlbnQgKyAxO1xuICAgICAgICAgICAgICAgIGxlbiAtPSBkaWZmICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb3dlckJvdW5kKGFycmF5LCBmdW5jKSB7XG4gICAgICAgIHZhciBkaWZmLCBsZW4sIGksIGN1cnJlbnQ7XG5cbiAgICAgICAgbGVuID0gYXJyYXkubGVuZ3RoO1xuICAgICAgICBpID0gMDtcblxuICAgICAgICB3aGlsZSAobGVuKSB7XG4gICAgICAgICAgICBkaWZmID0gbGVuID4+PiAxO1xuICAgICAgICAgICAgY3VycmVudCA9IGkgKyBkaWZmO1xuICAgICAgICAgICAgaWYgKGZ1bmMoYXJyYXlbY3VycmVudF0pKSB7XG4gICAgICAgICAgICAgICAgaSA9IGN1cnJlbnQgKyAxO1xuICAgICAgICAgICAgICAgIGxlbiAtPSBkaWZmICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGVuID0gZGlmZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaTtcbiAgICB9XG4gICAgaWdub3JlSlNIaW50RXJyb3IobG93ZXJCb3VuZCk7XG5cbiAgICBWaXNpdG9yS2V5cyA9IHtcbiAgICAgICAgQXNzaWdubWVudEV4cHJlc3Npb246IFsnbGVmdCcsICdyaWdodCddLFxuICAgICAgICBBcnJheUV4cHJlc3Npb246IFsnZWxlbWVudHMnXSxcbiAgICAgICAgQXJyYXlQYXR0ZXJuOiBbJ2VsZW1lbnRzJ10sXG4gICAgICAgIEFycm93RnVuY3Rpb25FeHByZXNzaW9uOiBbJ3BhcmFtcycsICdkZWZhdWx0cycsICdyZXN0JywgJ2JvZHknXSxcbiAgICAgICAgQmxvY2tTdGF0ZW1lbnQ6IFsnYm9keSddLFxuICAgICAgICBCaW5hcnlFeHByZXNzaW9uOiBbJ2xlZnQnLCAncmlnaHQnXSxcbiAgICAgICAgQnJlYWtTdGF0ZW1lbnQ6IFsnbGFiZWwnXSxcbiAgICAgICAgQ2FsbEV4cHJlc3Npb246IFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLFxuICAgICAgICBDYXRjaENsYXVzZTogWydwYXJhbScsICdib2R5J10sXG4gICAgICAgIENsYXNzQm9keTogWydib2R5J10sXG4gICAgICAgIENsYXNzRGVjbGFyYXRpb246IFsnaWQnLCAnYm9keScsICdzdXBlckNsYXNzJ10sXG4gICAgICAgIENsYXNzRXhwcmVzc2lvbjogWydpZCcsICdib2R5JywgJ3N1cGVyQ2xhc3MnXSxcbiAgICAgICAgQ29uZGl0aW9uYWxFeHByZXNzaW9uOiBbJ3Rlc3QnLCAnY29uc2VxdWVudCcsICdhbHRlcm5hdGUnXSxcbiAgICAgICAgQ29udGludWVTdGF0ZW1lbnQ6IFsnbGFiZWwnXSxcbiAgICAgICAgRGVidWdnZXJTdGF0ZW1lbnQ6IFtdLFxuICAgICAgICBEaXJlY3RpdmVTdGF0ZW1lbnQ6IFtdLFxuICAgICAgICBEb1doaWxlU3RhdGVtZW50OiBbJ2JvZHknLCAndGVzdCddLFxuICAgICAgICBFbXB0eVN0YXRlbWVudDogW10sXG4gICAgICAgIEV4cHJlc3Npb25TdGF0ZW1lbnQ6IFsnZXhwcmVzc2lvbiddLFxuICAgICAgICBGb3JTdGF0ZW1lbnQ6IFsnaW5pdCcsICd0ZXN0JywgJ3VwZGF0ZScsICdib2R5J10sXG4gICAgICAgIEZvckluU3RhdGVtZW50OiBbJ2xlZnQnLCAncmlnaHQnLCAnYm9keSddLFxuICAgICAgICBGdW5jdGlvbkRlY2xhcmF0aW9uOiBbJ2lkJywgJ3BhcmFtcycsICdkZWZhdWx0cycsICdyZXN0JywgJ2JvZHknXSxcbiAgICAgICAgRnVuY3Rpb25FeHByZXNzaW9uOiBbJ2lkJywgJ3BhcmFtcycsICdkZWZhdWx0cycsICdyZXN0JywgJ2JvZHknXSxcbiAgICAgICAgSWRlbnRpZmllcjogW10sXG4gICAgICAgIElmU3RhdGVtZW50OiBbJ3Rlc3QnLCAnY29uc2VxdWVudCcsICdhbHRlcm5hdGUnXSxcbiAgICAgICAgTGl0ZXJhbDogW10sXG4gICAgICAgIExhYmVsZWRTdGF0ZW1lbnQ6IFsnbGFiZWwnLCAnYm9keSddLFxuICAgICAgICBMb2dpY2FsRXhwcmVzc2lvbjogWydsZWZ0JywgJ3JpZ2h0J10sXG4gICAgICAgIE1lbWJlckV4cHJlc3Npb246IFsnb2JqZWN0JywgJ3Byb3BlcnR5J10sXG4gICAgICAgIE1ldGhvZERlZmluaXRpb246IFsna2V5JywgJ3ZhbHVlJ10sXG4gICAgICAgIE5ld0V4cHJlc3Npb246IFsnY2FsbGVlJywgJ2FyZ3VtZW50cyddLFxuICAgICAgICBPYmplY3RFeHByZXNzaW9uOiBbJ3Byb3BlcnRpZXMnXSxcbiAgICAgICAgT2JqZWN0UGF0dGVybjogWydwcm9wZXJ0aWVzJ10sXG4gICAgICAgIFByb2dyYW06IFsnYm9keSddLFxuICAgICAgICBQcm9wZXJ0eTogWydrZXknLCAndmFsdWUnXSxcbiAgICAgICAgUmV0dXJuU3RhdGVtZW50OiBbJ2FyZ3VtZW50J10sXG4gICAgICAgIFNlcXVlbmNlRXhwcmVzc2lvbjogWydleHByZXNzaW9ucyddLFxuICAgICAgICBTd2l0Y2hTdGF0ZW1lbnQ6IFsnZGlzY3JpbWluYW50JywgJ2Nhc2VzJ10sXG4gICAgICAgIFN3aXRjaENhc2U6IFsndGVzdCcsICdjb25zZXF1ZW50J10sXG4gICAgICAgIFRoaXNFeHByZXNzaW9uOiBbXSxcbiAgICAgICAgVGhyb3dTdGF0ZW1lbnQ6IFsnYXJndW1lbnQnXSxcbiAgICAgICAgVHJ5U3RhdGVtZW50OiBbJ2Jsb2NrJywgJ2hhbmRsZXJzJywgJ2hhbmRsZXInLCAnZ3VhcmRlZEhhbmRsZXJzJywgJ2ZpbmFsaXplciddLFxuICAgICAgICBVbmFyeUV4cHJlc3Npb246IFsnYXJndW1lbnQnXSxcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogWydhcmd1bWVudCddLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0aW9uOiBbJ2RlY2xhcmF0aW9ucyddLFxuICAgICAgICBWYXJpYWJsZURlY2xhcmF0b3I6IFsnaWQnLCAnaW5pdCddLFxuICAgICAgICBXaGlsZVN0YXRlbWVudDogWyd0ZXN0JywgJ2JvZHknXSxcbiAgICAgICAgV2l0aFN0YXRlbWVudDogWydvYmplY3QnLCAnYm9keSddLFxuICAgICAgICBZaWVsZEV4cHJlc3Npb246IFsnYXJndW1lbnQnXVxuICAgIH07XG5cbiAgICAvLyB1bmlxdWUgaWRcbiAgICBCUkVBSyA9IHt9O1xuICAgIFNLSVAgPSB7fTtcblxuICAgIFZpc2l0b3JPcHRpb24gPSB7XG4gICAgICAgIEJyZWFrOiBCUkVBSyxcbiAgICAgICAgU2tpcDogU0tJUFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBSZWZlcmVuY2UocGFyZW50LCBrZXkpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xuICAgIH1cblxuICAgIFJlZmVyZW5jZS5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2Uobm9kZSkge1xuICAgICAgICB0aGlzLnBhcmVudFt0aGlzLmtleV0gPSBub2RlO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBFbGVtZW50KG5vZGUsIHBhdGgsIHdyYXAsIHJlZikge1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgICB0aGlzLndyYXAgPSB3cmFwO1xuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBDb250cm9sbGVyKCkgeyB9XG5cbiAgICAvLyBBUEk6XG4gICAgLy8gcmV0dXJuIHByb3BlcnR5IHBhdGggYXJyYXkgZnJvbSByb290IHRvIGN1cnJlbnQgbm9kZVxuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLnBhdGggPSBmdW5jdGlvbiBwYXRoKCkge1xuICAgICAgICB2YXIgaSwgaXosIGosIGp6LCByZXN1bHQsIGVsZW1lbnQ7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkVG9QYXRoKHJlc3VsdCwgcGF0aCkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkocGF0aCkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqeiA9IHBhdGgubGVuZ3RoOyBqIDwgano7ICsraikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwYXRoW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcm9vdCBub2RlXG4gICAgICAgIGlmICghdGhpcy5fX2N1cnJlbnQucGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaXJzdCBub2RlIGlzIHNlbnRpbmVsLCBzZWNvbmQgbm9kZSBpcyByb290IGVsZW1lbnRcbiAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDIsIGl6ID0gdGhpcy5fX2xlYXZlbGlzdC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5fX2xlYXZlbGlzdFtpXTtcbiAgICAgICAgICAgIGFkZFRvUGF0aChyZXN1bHQsIGVsZW1lbnQucGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkVG9QYXRoKHJlc3VsdCwgdGhpcy5fX2N1cnJlbnQucGF0aCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8vIEFQSTpcbiAgICAvLyByZXR1cm4gYXJyYXkgb2YgcGFyZW50IGVsZW1lbnRzXG4gICAgQ29udHJvbGxlci5wcm90b3R5cGUucGFyZW50cyA9IGZ1bmN0aW9uIHBhcmVudHMoKSB7XG4gICAgICAgIHZhciBpLCBpeiwgcmVzdWx0O1xuXG4gICAgICAgIC8vIGZpcnN0IG5vZGUgaXMgc2VudGluZWxcbiAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDEsIGl6ID0gdGhpcy5fX2xlYXZlbGlzdC5sZW5ndGg7IGkgPCBpejsgKytpKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzLl9fbGVhdmVsaXN0W2ldLm5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gQVBJOlxuICAgIC8vIHJldHVybiBjdXJyZW50IG5vZGVcbiAgICBDb250cm9sbGVyLnByb3RvdHlwZS5jdXJyZW50ID0gZnVuY3Rpb24gY3VycmVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19jdXJyZW50Lm5vZGU7XG4gICAgfTtcblxuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLl9fZXhlY3V0ZSA9IGZ1bmN0aW9uIF9fZXhlY3V0ZShjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICB2YXIgcHJldmlvdXMsIHJlc3VsdDtcblxuICAgICAgICByZXN1bHQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgcHJldmlvdXMgID0gdGhpcy5fX2N1cnJlbnQ7XG4gICAgICAgIHRoaXMuX19jdXJyZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5fX3N0YXRlID0gbnVsbDtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIGVsZW1lbnQubm9kZSwgdGhpcy5fX2xlYXZlbGlzdFt0aGlzLl9fbGVhdmVsaXN0Lmxlbmd0aCAtIDFdLm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19jdXJyZW50ID0gcHJldmlvdXM7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLy8gQVBJOlxuICAgIC8vIG5vdGlmeSBjb250cm9sIHNraXAgLyBicmVha1xuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uIG5vdGlmeShmbGFnKSB7XG4gICAgICAgIHRoaXMuX19zdGF0ZSA9IGZsYWc7XG4gICAgfTtcblxuICAgIC8vIEFQSTpcbiAgICAvLyBza2lwIGNoaWxkIG5vZGVzIG9mIGN1cnJlbnQgbm9kZVxuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubm90aWZ5KFNLSVApO1xuICAgIH07XG5cbiAgICAvLyBBUEk6XG4gICAgLy8gYnJlYWsgdHJhdmVyc2Fsc1xuICAgIENvbnRyb2xsZXIucHJvdG90eXBlWydicmVhayddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm5vdGlmeShCUkVBSyk7XG4gICAgfTtcblxuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLl9faW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKHJvb3QsIHZpc2l0b3IpIHtcbiAgICAgICAgdGhpcy52aXNpdG9yID0gdmlzaXRvcjtcbiAgICAgICAgdGhpcy5yb290ID0gcm9vdDtcbiAgICAgICAgdGhpcy5fX3dvcmtsaXN0ID0gW107XG4gICAgICAgIHRoaXMuX19sZWF2ZWxpc3QgPSBbXTtcbiAgICAgICAgdGhpcy5fX2N1cnJlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9fc3RhdGUgPSBudWxsO1xuICAgIH07XG5cbiAgICBDb250cm9sbGVyLnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uIHRyYXZlcnNlKHJvb3QsIHZpc2l0b3IpIHtcbiAgICAgICAgdmFyIHdvcmtsaXN0LFxuICAgICAgICAgICAgbGVhdmVsaXN0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBub2RlVHlwZSxcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICBjdXJyZW50MixcbiAgICAgICAgICAgIGNhbmRpZGF0ZXMsXG4gICAgICAgICAgICBjYW5kaWRhdGUsXG4gICAgICAgICAgICBzZW50aW5lbDtcblxuICAgICAgICB0aGlzLl9faW5pdGlhbGl6ZShyb290LCB2aXNpdG9yKTtcblxuICAgICAgICBzZW50aW5lbCA9IHt9O1xuXG4gICAgICAgIC8vIHJlZmVyZW5jZVxuICAgICAgICB3b3JrbGlzdCA9IHRoaXMuX193b3JrbGlzdDtcbiAgICAgICAgbGVhdmVsaXN0ID0gdGhpcy5fX2xlYXZlbGlzdDtcblxuICAgICAgICAvLyBpbml0aWFsaXplXG4gICAgICAgIHdvcmtsaXN0LnB1c2gobmV3IEVsZW1lbnQocm9vdCwgbnVsbCwgbnVsbCwgbnVsbCkpO1xuICAgICAgICBsZWF2ZWxpc3QucHVzaChuZXcgRWxlbWVudChudWxsLCBudWxsLCBudWxsLCBudWxsKSk7XG5cbiAgICAgICAgd2hpbGUgKHdvcmtsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudCA9IHdvcmtsaXN0LnBvcCgpO1xuXG4gICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gc2VudGluZWwpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gbGVhdmVsaXN0LnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgcmV0ID0gdGhpcy5fX2V4ZWN1dGUodmlzaXRvci5sZWF2ZSwgZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fX3N0YXRlID09PSBCUkVBSyB8fCByZXQgPT09IEJSRUFLKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50Lm5vZGUpIHtcblxuICAgICAgICAgICAgICAgIHJldCA9IHRoaXMuX19leGVjdXRlKHZpc2l0b3IuZW50ZXIsIGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX19zdGF0ZSA9PT0gQlJFQUsgfHwgcmV0ID09PSBCUkVBSykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd29ya2xpc3QucHVzaChzZW50aW5lbCk7XG4gICAgICAgICAgICAgICAgbGVhdmVsaXN0LnB1c2goZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fX3N0YXRlID09PSBTS0lQIHx8IHJldCA9PT0gU0tJUCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBub2RlID0gZWxlbWVudC5ub2RlO1xuICAgICAgICAgICAgICAgIG5vZGVUeXBlID0gZWxlbWVudC53cmFwIHx8IG5vZGUudHlwZTtcbiAgICAgICAgICAgICAgICBjYW5kaWRhdGVzID0gVmlzaXRvcktleXNbbm9kZVR5cGVdO1xuXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGNhbmRpZGF0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCAtPSAxKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IGNhbmRpZGF0ZXNbY3VycmVudF07XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZSA9IG5vZGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0FycmF5KGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtsaXN0LnB1c2gobmV3IEVsZW1lbnQoY2FuZGlkYXRlLCBrZXksIG51bGwsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3VycmVudDIgPSBjYW5kaWRhdGUubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGN1cnJlbnQyIC09IDEpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2FuZGlkYXRlW2N1cnJlbnQyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChub2RlVHlwZSA9PT0gU3ludGF4Lk9iamVjdEV4cHJlc3Npb24gfHwgbm9kZVR5cGUgPT09IFN5bnRheC5PYmplY3RQYXR0ZXJuKSAmJiAncHJvcGVydGllcycgPT09IGNhbmRpZGF0ZXNbY3VycmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gbmV3IEVsZW1lbnQoY2FuZGlkYXRlW2N1cnJlbnQyXSwgW2tleSwgY3VycmVudDJdLCAnUHJvcGVydHknLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IG5ldyBFbGVtZW50KGNhbmRpZGF0ZVtjdXJyZW50Ml0sIFtrZXksIGN1cnJlbnQyXSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrbGlzdC5wdXNoKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIENvbnRyb2xsZXIucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHJvb3QsIHZpc2l0b3IpIHtcbiAgICAgICAgdmFyIHdvcmtsaXN0LFxuICAgICAgICAgICAgbGVhdmVsaXN0LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG5vZGVUeXBlLFxuICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICBjdXJyZW50MixcbiAgICAgICAgICAgIGNhbmRpZGF0ZXMsXG4gICAgICAgICAgICBjYW5kaWRhdGUsXG4gICAgICAgICAgICBzZW50aW5lbCxcbiAgICAgICAgICAgIG91dGVyLFxuICAgICAgICAgICAga2V5O1xuXG4gICAgICAgIHRoaXMuX19pbml0aWFsaXplKHJvb3QsIHZpc2l0b3IpO1xuXG4gICAgICAgIHNlbnRpbmVsID0ge307XG5cbiAgICAgICAgLy8gcmVmZXJlbmNlXG4gICAgICAgIHdvcmtsaXN0ID0gdGhpcy5fX3dvcmtsaXN0O1xuICAgICAgICBsZWF2ZWxpc3QgPSB0aGlzLl9fbGVhdmVsaXN0O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemVcbiAgICAgICAgb3V0ZXIgPSB7XG4gICAgICAgICAgICByb290OiByb290XG4gICAgICAgIH07XG4gICAgICAgIGVsZW1lbnQgPSBuZXcgRWxlbWVudChyb290LCBudWxsLCBudWxsLCBuZXcgUmVmZXJlbmNlKG91dGVyLCAncm9vdCcpKTtcbiAgICAgICAgd29ya2xpc3QucHVzaChlbGVtZW50KTtcbiAgICAgICAgbGVhdmVsaXN0LnB1c2goZWxlbWVudCk7XG5cbiAgICAgICAgd2hpbGUgKHdvcmtsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgZWxlbWVudCA9IHdvcmtsaXN0LnBvcCgpO1xuXG4gICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gc2VudGluZWwpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gbGVhdmVsaXN0LnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcy5fX2V4ZWN1dGUodmlzaXRvci5sZWF2ZSwgZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAvLyBub2RlIG1heSBiZSByZXBsYWNlZCB3aXRoIG51bGwsXG4gICAgICAgICAgICAgICAgLy8gc28gZGlzdGluZ3Vpc2ggYmV0d2VlbiB1bmRlZmluZWQgYW5kIG51bGwgaW4gdGhpcyBwbGFjZVxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXQgIT09IEJSRUFLICYmIHRhcmdldCAhPT0gU0tJUCkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVmLnJlcGxhY2UodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fX3N0YXRlID09PSBCUkVBSyB8fCB0YXJnZXQgPT09IEJSRUFLKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXRlci5yb290O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcy5fX2V4ZWN1dGUodmlzaXRvci5lbnRlciwgZWxlbWVudCk7XG5cbiAgICAgICAgICAgIC8vIG5vZGUgbWF5IGJlIHJlcGxhY2VkIHdpdGggbnVsbCxcbiAgICAgICAgICAgIC8vIHNvIGRpc3Rpbmd1aXNoIGJldHdlZW4gdW5kZWZpbmVkIGFuZCBudWxsIGluIHRoaXMgcGxhY2VcbiAgICAgICAgICAgIGlmICh0YXJnZXQgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXQgIT09IEJSRUFLICYmIHRhcmdldCAhPT0gU0tJUCkge1xuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2VcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlZi5yZXBsYWNlKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5ub2RlID0gdGFyZ2V0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fX3N0YXRlID09PSBCUkVBSyB8fCB0YXJnZXQgPT09IEJSRUFLKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dGVyLnJvb3Q7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG5vZGUgbWF5IGJlIG51bGxcbiAgICAgICAgICAgIG5vZGUgPSBlbGVtZW50Lm5vZGU7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd29ya2xpc3QucHVzaChzZW50aW5lbCk7XG4gICAgICAgICAgICBsZWF2ZWxpc3QucHVzaChlbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX19zdGF0ZSA9PT0gU0tJUCB8fCB0YXJnZXQgPT09IFNLSVApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZVR5cGUgPSBlbGVtZW50LndyYXAgfHwgbm9kZS50eXBlO1xuICAgICAgICAgICAgY2FuZGlkYXRlcyA9IFZpc2l0b3JLZXlzW25vZGVUeXBlXTtcblxuICAgICAgICAgICAgY3VycmVudCA9IGNhbmRpZGF0ZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKChjdXJyZW50IC09IDEpID49IDApIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBjYW5kaWRhdGVzW2N1cnJlbnRdO1xuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZSA9IG5vZGVba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoIWNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlzQXJyYXkoY2FuZGlkYXRlKSkge1xuICAgICAgICAgICAgICAgICAgICB3b3JrbGlzdC5wdXNoKG5ldyBFbGVtZW50KGNhbmRpZGF0ZSwga2V5LCBudWxsLCBuZXcgUmVmZXJlbmNlKG5vZGUsIGtleSkpKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudDIgPSBjYW5kaWRhdGUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlICgoY3VycmVudDIgLT0gMSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhbmRpZGF0ZVtjdXJyZW50Ml0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlVHlwZSA9PT0gU3ludGF4Lk9iamVjdEV4cHJlc3Npb24gJiYgJ3Byb3BlcnRpZXMnID09PSBjYW5kaWRhdGVzW2N1cnJlbnRdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gbmV3IEVsZW1lbnQoY2FuZGlkYXRlW2N1cnJlbnQyXSwgW2tleSwgY3VycmVudDJdLCAnUHJvcGVydHknLCBuZXcgUmVmZXJlbmNlKGNhbmRpZGF0ZSwgY3VycmVudDIpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBuZXcgRWxlbWVudChjYW5kaWRhdGVbY3VycmVudDJdLCBba2V5LCBjdXJyZW50Ml0sIG51bGwsIG5ldyBSZWZlcmVuY2UoY2FuZGlkYXRlLCBjdXJyZW50MikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtsaXN0LnB1c2goZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dGVyLnJvb3Q7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHRyYXZlcnNlKHJvb3QsIHZpc2l0b3IpIHtcbiAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcigpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlci50cmF2ZXJzZShyb290LCB2aXNpdG9yKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlKHJvb3QsIHZpc2l0b3IpIHtcbiAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcigpO1xuICAgICAgICByZXR1cm4gY29udHJvbGxlci5yZXBsYWNlKHJvb3QsIHZpc2l0b3IpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dGVuZENvbW1lbnRSYW5nZShjb21tZW50LCB0b2tlbnMpIHtcbiAgICAgICAgdmFyIHRhcmdldDtcblxuICAgICAgICB0YXJnZXQgPSB1cHBlckJvdW5kKHRva2VucywgZnVuY3Rpb24gc2VhcmNoKHRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gdG9rZW4ucmFuZ2VbMF0gPiBjb21tZW50LnJhbmdlWzBdO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb21tZW50LmV4dGVuZGVkUmFuZ2UgPSBbY29tbWVudC5yYW5nZVswXSwgY29tbWVudC5yYW5nZVsxXV07XG5cbiAgICAgICAgaWYgKHRhcmdldCAhPT0gdG9rZW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgY29tbWVudC5leHRlbmRlZFJhbmdlWzFdID0gdG9rZW5zW3RhcmdldF0ucmFuZ2VbMF07XG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXQgLT0gMTtcbiAgICAgICAgaWYgKHRhcmdldCA+PSAwKSB7XG4gICAgICAgICAgICBjb21tZW50LmV4dGVuZGVkUmFuZ2VbMF0gPSB0b2tlbnNbdGFyZ2V0XS5yYW5nZVsxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb21tZW50O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGF0dGFjaENvbW1lbnRzKHRyZWUsIHByb3ZpZGVkQ29tbWVudHMsIHRva2Vucykge1xuICAgICAgICAvLyBBdCBmaXJzdCwgd2Ugc2hvdWxkIGNhbGN1bGF0ZSBleHRlbmRlZCBjb21tZW50IHJhbmdlcy5cbiAgICAgICAgdmFyIGNvbW1lbnRzID0gW10sIGNvbW1lbnQsIGxlbiwgaSwgY3Vyc29yO1xuXG4gICAgICAgIGlmICghdHJlZS5yYW5nZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhdHRhY2hDb21tZW50cyBuZWVkcyByYW5nZSBpbmZvcm1hdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9rZW5zIGFycmF5IGlzIGVtcHR5LCB3ZSBhdHRhY2ggY29tbWVudHMgdG8gdHJlZSBhcyAnbGVhZGluZ0NvbW1lbnRzJ1xuICAgICAgICBpZiAoIXRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChwcm92aWRlZENvbW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHByb3ZpZGVkQ29tbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGRlZXBDb3B5KHByb3ZpZGVkQ29tbWVudHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50LmV4dGVuZGVkUmFuZ2UgPSBbMCwgdHJlZS5yYW5nZVswXV07XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyZWUubGVhZGluZ0NvbW1lbnRzID0gY29tbWVudHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHByb3ZpZGVkQ29tbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvbW1lbnRzLnB1c2goZXh0ZW5kQ29tbWVudFJhbmdlKGRlZXBDb3B5KHByb3ZpZGVkQ29tbWVudHNbaV0pLCB0b2tlbnMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgaXMgYmFzZWQgb24gSm9obiBGcmVlbWFuJ3MgaW1wbGVtZW50YXRpb24uXG4gICAgICAgIGN1cnNvciA9IDA7XG4gICAgICAgIHRyYXZlcnNlKHRyZWUsIHtcbiAgICAgICAgICAgIGVudGVyOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50O1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1cnNvciA8IGNvbW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudHNbY3Vyc29yXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQuZXh0ZW5kZWRSYW5nZVsxXSA+IG5vZGUucmFuZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQuZXh0ZW5kZWRSYW5nZVsxXSA9PT0gbm9kZS5yYW5nZVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLmxlYWRpbmdDb21tZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUubGVhZGluZ0NvbW1lbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmxlYWRpbmdDb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHMuc3BsaWNlKGN1cnNvciwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgb3V0IG9mIG93bmVkIG5vZGVcbiAgICAgICAgICAgICAgICBpZiAoY3Vyc29yID09PSBjb21tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZpc2l0b3JPcHRpb24uQnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1lbnRzW2N1cnNvcl0uZXh0ZW5kZWRSYW5nZVswXSA+IG5vZGUucmFuZ2VbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZpc2l0b3JPcHRpb24uU2tpcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN1cnNvciA9IDA7XG4gICAgICAgIHRyYXZlcnNlKHRyZWUsIHtcbiAgICAgICAgICAgIGxlYXZlOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50O1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGN1cnNvciA8IGNvbW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gY29tbWVudHNbY3Vyc29yXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUucmFuZ2VbMV0gPCBjb21tZW50LmV4dGVuZGVkUmFuZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUucmFuZ2VbMV0gPT09IGNvbW1lbnQuZXh0ZW5kZWRSYW5nZVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLnRyYWlsaW5nQ29tbWVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnRyYWlsaW5nQ29tbWVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUudHJhaWxpbmdDb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHMuc3BsaWNlKGN1cnNvciwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgb3V0IG9mIG93bmVkIG5vZGVcbiAgICAgICAgICAgICAgICBpZiAoY3Vyc29yID09PSBjb21tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZpc2l0b3JPcHRpb24uQnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1lbnRzW2N1cnNvcl0uZXh0ZW5kZWRSYW5nZVswXSA+IG5vZGUucmFuZ2VbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZpc2l0b3JPcHRpb24uU2tpcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cmVlO1xuICAgIH1cblxuICAgIGV4cG9ydHMudmVyc2lvbiA9ICcxLjMuMy1kZXYnO1xuICAgIGV4cG9ydHMuU3ludGF4ID0gU3ludGF4O1xuICAgIGV4cG9ydHMudHJhdmVyc2UgPSB0cmF2ZXJzZTtcbiAgICBleHBvcnRzLnJlcGxhY2UgPSByZXBsYWNlO1xuICAgIGV4cG9ydHMuYXR0YWNoQ29tbWVudHMgPSBhdHRhY2hDb21tZW50cztcbiAgICBleHBvcnRzLlZpc2l0b3JLZXlzID0gVmlzaXRvcktleXM7XG4gICAgZXhwb3J0cy5WaXNpdG9yT3B0aW9uID0gVmlzaXRvck9wdGlvbjtcbiAgICBleHBvcnRzLkNvbnRyb2xsZXIgPSBDb250cm9sbGVyO1xufSkpO1xuLyogdmltOiBzZXQgc3c9NCB0cz00IGV0IHR3PTgwIDogKi9cbiIsInZhciBlc3ByaW1hID0gcmVxdWlyZSgnZXNwcmltYScpLFxuICAgIGVzdHJhdmVyc2UgPSByZXF1aXJlKCdlc3RyYXZlcnNlJyksXG4gICAgZXNjb2RlZ2VuID0gcmVxdWlyZSgnZXNjb2RlZ2VuJyk7XG5cbi8vIC8vIFBvbGx1dGUgZ2xvYmFsIC0gbWFrZXMgdGVzdGluZyBpbiBDaHJvbWUgZWFzaWVyXG4vLyBlc3ByaW1hID0gcmVxdWlyZSgnZXNwcmltYScpLFxuLy8gZXN0cmF2ZXJzZSA9IHJlcXVpcmUoJ2VzdHJhdmVyc2UnKSxcbi8vIGVzY29kZWdlbiA9IHJlcXVpcmUoJ2VzY29kZWdlbicpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFByb2JsZW0gMi0xOiBzdHJpbmcgbGl0ZXJhbHMgLS0tLS0tLS0tLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIGNoaWxkcmVuQXJlU3RyaW5ncyAobGVmdCwgcmlnaHQpIHtcbiAgICByZXR1cm4gKGxlZnQudHlwZSA9PT0gXCJMaXRlcmFsXCIgJiYgdHlwZW9mIGxlZnQudmFsdWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIHJpZ2h0LnR5cGUgPT09IFwiTGl0ZXJhbFwiICYmIHR5cGVvZiByaWdodC52YWx1ZSA9PT0gXCJzdHJpbmdcIik7XG59XG5cbmZ1bmN0aW9uIHRvTGl0ZXJhbChzcmMpIHtcbiAgICB2YXIgYXN0ID0gZXNwcmltYS5wYXJzZShzcmMpO1xuICAgIGVzdHJhdmVyc2UucmVwbGFjZShhc3QsIHtcbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uKG5vZGUsIHBhcmVudCkge1xuICAgICAgICAgICAgaWYobm9kZS50eXBlID09PSAnQmluYXJ5RXhwcmVzc2lvbicgJiZcbiAgICAgICAgICAgICAgIG5vZGUub3BlcmF0b3IgPT09ICcrJyAmJlxuICAgICAgICAgICAgICAgY2hpbGRyZW5BcmVTdHJpbmdzKG5vZGUubGVmdCwgbm9kZS5yaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlIDogXCJMaXRlcmFsXCIsIHZhbHVlIDogbm9kZS5sZWZ0LnZhbHVlICsgbm9kZS5yaWdodC52YWx1ZX07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZXNjb2RlZ2VuLmdlbmVyYXRlKGFzdCk7XG59XG5cbmV4cG9ydHMudG9MaXRlcmFsID0gdG9MaXRlcmFsO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFByb2JsZW0gMi0yOiBvYmpba2V5XSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIGlkZW50aWZpZXJMaWtlKHN0cikge1xuICAgIHZhciB0b2tzID0gZXNwcmltYS50b2tlbml6ZShzdHIpO1xuICAgIHJldHVybiB0b2tzLmxlbmd0aCA9PT0gMSAmJiB0b2tzWzBdLnR5cGUgPT09IFwiSWRlbnRpZmllclwiO1xufVxuXG5mdW5jdGlvbiB0b0RvdChzcmMpIHtcbiAgICB2YXIgYXN0ID0gZXNwcmltYS5wYXJzZShzcmMpO1xuICAgIGVzdHJhdmVyc2UudHJhdmVyc2UoYXN0LCB7XG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbihub2RlLCBwYXJlbnQpIHtcbiAgICAgICAgICAgIGlmKG5vZGUudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nICYmIG5vZGUuY29tcHV0ZWQgJiYgLy8gYWNjZXNzaW5nIG9iamVjdCB3aXRoIG9ialtrZXldXG4gICAgICAgICAgICAgICBub2RlLnByb3BlcnR5LnR5cGUgPT09IFwiTGl0ZXJhbFwiICYmICAgICAgICAgICAgICAgICAgLy8ga2V5IGlzIGEgTGl0ZXJhbFxuICAgICAgICAgICAgICAgdHlwZW9mIG5vZGUucHJvcGVydHkudmFsdWUgPT09IFwic3RyaW5nXCIgJiYgICAgICAgICAgIC8vIGtleSBpcyBhIFN0cmluZ1xuICAgICAgICAgICAgICAgaWRlbnRpZmllckxpa2Uobm9kZS5wcm9wZXJ0eS52YWx1ZSkpIHsgICAgICAgICAgICAgICAvLyBrZXkgY2FuIGJlIHVzZWQgYWZ0ZXIgZG90IGluIG9iai5rZXlcbiAgICAgICAgICAgICAgICBub2RlLmNvbXB1dGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbm9kZS5wcm9wZXJ0eSA9IChlc3ByaW1hLnBhcnNlKCdvYmouJyArIG5vZGUucHJvcGVydHkudmFsdWUpKS5ib2R5WzBdLmV4cHJlc3Npb24ucHJvcGVydHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZXNjb2RlZ2VuLmdlbmVyYXRlKGFzdCk7XG59XG5cbmV4cG9ydHMudG9Eb3QgPSB0b0RvdDtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQcm9ibGVtIDItMzogc2NvcGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiSy9tN3h2XCIpKSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIl19
