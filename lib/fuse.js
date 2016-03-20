/*  Fuse JavaScript framework, version Alpha
 *  (c) 2008-2009 John-David Dalton
 *
 *  FuseJS is freely distributable under the terms of an MIT-style license.
 *  For details, see the FuseJS web site: http://www.fusejs.com/
 *
 *--------------------------------------------------------------------------*/
var fuse;
(function(global) {
  global.Array = Array;
  global.Object = Object;
  var window = global;
  // private vars
  var DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE, TEXT_NODE, Class,
   Data, Document, Element, Enumerable, Form, Func, Obj, Node, NodeList,
   RawList, $break, _extend, fuse, addArrayMethods, bind, capitalize, clone,
   concatList, defer, eachKey, emptyFunction, envAddTest, envTest,
   escapeRegExpChars, expando, fromElement, getDocument, getNodeName, getWindow,
   hasKey, inspect, isArray, isElement, isEmpty, isHash, isHostObject, isFunction,
   isNumber, isPrimitive, isRegExp, isSameOrigin, isString, isUndefined, K, nil,
   prependList, returnOffset, slice, toInteger, toString, undef, userAgent;

  fuse =
  global.fuse = function fuse() { };

  fuse._body  =
  fuse._div   =
  fuse._doc   =
  fuse._docEl =
  fuse._info  =
  fuse._root  =
  fuse._scrollEl = null;

  fuse.debug   = false;
  fuse.version = 'Alpha';

  /*--------------------------------------------------------------------------*/

  // Host objects have a range of typeof values. For example:
  // document.createElement('div').offsetParent -> unknown
  // document.createElement -> object
  isHostObject = (function() {
    var NON_HOST_TYPES = { 'boolean': 1, 'number': 1, 'string': 1, 'undefined': 1 };
    return function(object, property) {
      var type = typeof object[property];
      return type === 'object' ? !!object[property] : !NON_HOST_TYPES[type];
    };
  })();

  $break =
  fuse.$break = function $break() { };

  emptyFunction =
  fuse.emptyFunction = function emptyFunction() { };

  K =
  fuse.K = function K(x) { return x };

  concatList = function(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  };

  // Allow a pre-sugared array to be passed
  prependList = function(list, value, results) {
    (results = results || [])[0] = value;
    var length = list.length;
    while (length--) results[1 + length] = list[length];
    return results;
  };

  escapeRegExpChars = (function() {
    var matchSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return function(string) {
      return String(string).replace(matchSpecialChars, '\\$1');
    };
  })();

  // ECMA-5 9.4 ToInteger implementation
  toInteger = (function() {
    var abs = Math.abs, floor = Math.floor,
     maxBitwiseNumber = Math.pow(2, 31);

    return function(object) {
      var number = +object; // fast coerce to number
      if (number == 0 || !isFinite(number)) return number || 0;

      // avoid issues with large numbers against bitwise operators
      return number < maxBitwiseNumber
        ? number | 0
        : (number < 0 ? -1 : 1) * floor(abs(number));
    };
  })();

  // global.document.createDocumentFragment() nodeType
  DOCUMENT_FRAGMENT_NODE = 11;

  // global.document node type
  DOCUMENT_NODE = 9;

  // element node type
  ELEMENT_NODE = 1;

  // textNode type
  TEXT_NODE = 3;

  // a unqiue 15 char id used throughout fuse
  expando = '_fuse' + String(+new Date).slice(0, 10);

  // helps minify nullifying the JScript function declarations
  nil = null;

  // a quick way to copy an array slice.call(array, 0)
  slice = global.Array.prototype.slice;

  // used to access the an object's internal [[Class]] property
  toString = global.Object.prototype.toString;

  // used for some required browser sniffing
  userAgent = global.navigator && navigator.userAgent || '';

  /*--------------------------------------------------------------------------*/

  (function() {

    function getNS(path) {
      var key, i = 0, keys = path.split('.'), object = this;
      while (key = keys[i++])
        if (!(object = object[key])) return false;
      return object;
    }

    function addNS(path) {
      var Klass, Parent, key, i = 0,
       object     = this,
       keys       = path.split('.'),
       length     = keys.length,
       properties = slice.call(arguments, 1);

      if (typeof properties[0] === 'function')
        Parent = properties.shift();

      while (key = keys[i++]) {
        if (!object[key]) {
          if (i === length) {
            if (!hasKey(properties, 'constructor')) properties.constructor = key;
            Klass = Class(Parent || object, properties);
          }
          else Klass = Class(object, { 'constructor': key });
          object = object[key] = new Klass;
        }
        else object = object[key];
      }
      return object;
    }

    function updateSubClassGenerics(object) {
      var subclass, subclasses = object.subclasses || [], i = 0;
      while (subclass = subclasses[i++]) {
        subclass.updateGenerics && subclass.updateGenerics();
        updateSubClassGenerics(subclass);
      }
    }

    function updateGenerics(path, deep) {
      var paths, object, i = 0;
      if (isString(paths)) paths = [paths];
      if (!isArray(paths)) deep  = path;
      if (!paths) paths = ['Array', 'Date', 'Number', 'Object', 'RegExp', 'String', 'dom.Node'];

      while (path = paths[i++]) {
        object = isString(path) ? fuse.getNS(path) : path;
        if (object) {
          object.updateGenerics && object.updateGenerics();
          deep && updateSubClassGenerics(object);
        }
      }
    }

    fuse.getNS =
    fuse.prototype.getNS = getNS;

    fuse.addNS =
    fuse.prototype.addNS = addNS;

    fuse.updateGenerics  = updateGenerics;
  })();

  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  fuse.env = {
    'agent': {
      'IE':           isHostObject(global, 'attachEvent') && userAgent.indexOf('Opera') < 0,
      'Opera':        /Opera/.test(toString.call(window.opera)),
      'WebKit':       userAgent.indexOf('AppleWebKit/') > -1,
      'Gecko':        userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'MobileSafari': userAgent.search(/AppleWebKit.*Mobile/) > -1
    }
  };

  /*--------------------------- FEATURE/BUG TESTER ---------------------------*/

  (function(env) {
    function addTest(name, value) {
      if (typeof name === 'object') {
        for (var i in name) cache[i] = name[i];
      } else cache[name] = value;
    }

    function removeTest(name) {
      name = name.valueOf();
      if (typeof name === 'string') delete cache[name];
      else { for (var i in name) delete cache[i]; }
    }

    function test(name) {
      var i = 0;
      while (name = arguments[i++]) {
        if (typeof cache[name] === 'function')
          cache[name] = cache[name]();
        if (cache[name] !== true) return false;
      }
      return true;
    }

    var cache = { };

    envAddTest =
    env.addTest = addTest;

    envTest =
    env.test = test;

    env.removeText = removeTest;
  })(fuse.env);

  /*----------------------------- LANG FEATURES ------------------------------*/

  envAddTest({
    'ACTIVE_X_OBJECT': function() {
      // true for IE
      return isHostObject(global, 'ActiveXObject');
    },

    'OBJECT__PROTO__': function() {
      // true for Gecko and Webkit
      if ([ ]['__proto__'] === Array.prototype  &&
          { }['__proto__'] === Object.prototype) {
        // test if it's writable and restorable
        var result, list = [], backup = list['__proto__'];
        list['__proto__'] = { };
        result = typeof list.push === 'undefined';
        list['__proto__'] = backup;
        return result && typeof list.push === 'function';
      }
    },

    'OBJECT__COUNT__': function() {
      // true for Gecko
      if (envTest('OBJECT__PROTO__')) {
        var o = { 'x':0 };
        delete o['__count__'];
        return typeof o['__count__'] === 'number' && o['__count__'] === 1;
      }
    }
  });

  /*-------------------------------- LANG BUGS -------------------------------*/

  envAddTest({
    'ARRAY_CONCAT_ARGUMENTS_BUGGY': function() {
      // true for Opera
      var array = [];
      return (function() { return array.concat &&
        array.concat(arguments).length === 2; })(1, 2);
    },

    'ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES': function() {
      // true for Opera 9.25
      var array = [1]; array[2] = 1;
      return array.slice && array.slice(0, 2).length === 1;
    },

    'STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION': function() {
       // true for Chrome 1 and 2
       return 'x'.lastIndexOf('x', -1) !== 0;
    },

    'STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX': function() {
      // true for IE
      var string = 'oxo', data = [], pattern = /x/;
      string.replace(pattern, '');
      data[0] = !!pattern.lastIndex;
      string.match(pattern);
      data[1] = !!pattern.lastIndex;
      return data[0] || data[1];
    },

    'STRING_REPLACE_COERCE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return ''; };
      return 'a'.replace(/a/, func) === String(func);
    },

    'STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN': function() {
      // true for Chrome 1
      var string = 'xy', replacement = function() { return 'o'; };
      return !(string.replace(/()/g, 'o') === 'oxoyo' &&
        string.replace(new RegExp('', 'g'), replacement) === 'oxoyo' &&
        string.replace(/(y|)/g, replacement) === 'oxoo');
    }
  });

  /*----------------------------- LANG: FUSEBOX ------------------------------*/

  fuse.Fusebox = (function() {

    var SKIP_METHODS_RETURNING_ARRAYS,

    ACTIVE_X_OBJECT = 1,

    OBJECT__PROTO__ = 2,

    IFRAME = 3,

    cache = [],

    mode = (function()  {
      // true for IE >= 5.5 (ActiveX object by itself is supported by IE4)
      // note: use iframes when served from the file protocol to avoid an ActiveX warning.

      // The htmlfile ActiveX object avoids https mixed content warnings and is a
      // workaround for access denied errors thrown when using iframes to create
      // sandboxes after the document.domain is set. Access will be denied until
      // the iframe is loaded which disqualifies its use as a synchronous solution
      // (Opera 9.25 is out of luck here).
      if (envTest('ACTIVE_X_OBJECT') &&
          global.location && global.location.protocol !== 'file:') {
        try {
          // ensure ActiveX is enabled
          result = new ActiveXObject('htmlfile') && ACTIVE_X_OBJECT;
          return result;
        } catch (e) { }
      }

      // true for JavaScriptCore, KJS, Rhino, SpiderMonkey, SquirrelFish, Tamarin, TraceMonkey, V8

      // Check "OBJECT__PROTO__" first because Firefox will permanently screw up
      // other iframes on the page if an iframe is inserted and removed before the
      // dom has loaded.
      if (envTest('OBJECT__PROTO__'))
        return OBJECT__PROTO__;

      var doc = global.document;
      if (isHostObject(global, 'frames') && doc &&
          isHostObject(doc, 'createElement'))
        return IFRAME;
    })(),

    createSandbox = (function() {
      if (mode === OBJECT__PROTO__)
        return function() { return global; };

      // IE requires the iframe/htmlfile remain in the cache or it will be
      // marked for garbage collection
      var counter = 0, doc = global.document;
      if (mode === ACTIVE_X_OBJECT)
        return function() {
          var htmlfile = new ActiveXObject('htmlfile');
          htmlfile.open();
          htmlfile.write('<script>document.global = this;<\/script>');
          htmlfile.close();
          cache.push(htmlfile);
          return htmlfile.global;
        };

      if (mode === IFRAME)
        return function() {
          var idoc, iframe, result,
           parentNode = doc.body || doc.documentElement,
           name       = 'sb_' + expando + counter++;

          try {
            // set name attribute for IE6/7
            iframe = doc.createElement('<iframe name="' + name + '">');
          } catch (e) {
            (iframe = doc.createElement('iframe')).name = name;
          }

          iframe.style.display = 'none';
          parentNode.insertBefore(iframe, parentNode.firstChild);

          try {
            (idoc = global.frames[name].document).open();
            idoc.write('<script>parent.fuse.' + expando + ' = this;<\/script>');
            idoc.close();
          } catch (e) {
            // Opera 9.25 throws security error when trying to write to an iframe
            // after the document.domain is set. Also Opera < 9 doesn't support
            // inserting an iframe into the document.documentElement.
            throw new Error('Fusebox failed to create a sandbox by iframe.');
          }

          result = global.fuse[expando];
          delete global.fuse[expando];

          cache.push(iframe);
          return result;
        };

      return function() {
        throw new Error('Fusebox failed to create a sandbox.');
      };
    })(),

    createFusebox = function(instance) {
      var Array, Boolean, Date, Function, Number, Object, RegExp, String,
       glSlice     = global.Array.prototype.slice,
       glFunction  = global.Function,
       matchStrict = /^\s*(['"])use strict\1/,
       sandbox     = createSandbox(),
       toString    = global.Object.prototype.toString,
       __Array     = sandbox.Array,
       __Boolean   = sandbox.Boolean,
       __Date      = sandbox.Date,
       __Function  = sandbox.Function,
       __Number    = sandbox.Number,
       __Object    = sandbox.Object,
       __RegExp    = sandbox.RegExp,
       __String    = sandbox.String;

      instance || (instance = new Klass);

      if (mode === OBJECT__PROTO__) {
        Array = function Array(length) {
          var result, args = arguments, argLen = args.length;
          if (argLen) {
            result = argLen === 1 && length > -1
              ? new __Array(length)
              : Array.fromArray(args);
          } else result = new __Array();

          result['__proto__'] = arrPlugin;
          return result;
        };

        Boolean = function Boolean(value) {
          var result = new __Boolean(value);
          result['__proto__'] = boolPlugin;
          return result;
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          var result;
          if (this.constructor === Date) {
           result = arguments.length === 1
             ? new __Date(year)
             : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
           result['__proto__'] = datePlugin;
          }
          else result = instance.String(new __Date);
          return result;
        };

        Function = function Function(argN, body) {
          var args = arguments,
          result = args.length < 3
           ? __Function(argN, body)
           : __Function.apply(__Function, args);
          result['__proto__'] = funcPlugin;
          return result;
        };

        // Number = function Number(value) {
        //   var result = new __Number(value);
        //   result['__proto__'] = numPlugin;
        //   return result;
        // };

        Object = function Object(value) {
          if (value != null) {
           switch (toString.call(value)) {
             case '[object Boolean]': return instance.Boolean(value);
             case '[object Number]':  return instance.Number(value);
             case '[object String]':  return instance.String(value);
             case '[object Array]':
               if (value.constructor !== instance.Array)
                 return instance.Array.fromArray(value);
           }
           return value;
          }
          var result = new __Object;
          result['__proto__'] = objPlugin;
          return result;
        };

        // RegExp = function RegExp(pattern, flags) {
        //   var result = new __RegExp(pattern, flags);
        //   result['__proto__'] = rePlugin;
        //   return result;
        // };

        String = function String(value) {
          var result = new __String(arguments.length ? value : '');
          result['__proto__'] = strPlugin;
          return result;
        };

        // make prototype values conform to ECMA spec and inherit from regular natives
        Object.prototype['__proto__']   = __Object.prototype;
        (Array.prototype    = [ ])['__proto__']            = __Array.prototype;
        // (Boolean.prototype  = new __Boolean)['__proto__']  = __Boolean.prototype;
        // (Date.prototype     = new __Date)['__proto__']     = __Date.prototype;
        // (Function.prototype = new __Function)['__proto__'] = __Function.prototype;
        // (Number.prototype   = new __Number)['__proto__']   = __Number.prototype;
        // (RegExp.prototype   = new __RegExp)['__proto__']   = __RegExp.prototype;
        // (String.prototype   = new __String)['__proto__']   = __String.prototype;
      }
      else {
        Array = function Array(length) {
          var args = arguments, argLen = args.length;
          if (argLen) {
            return argLen === 1 && length > -1
             ? new __Array(length)
             : Array.fromArray(args);
          }
          return new __Array();
        };

        Boolean = function Boolean(value) {
          return new __Boolean(value);
        };

        Date = function Date(year, month, date, hours, minutes, seconds, ms) {
          if (this.constructor === Date) {
           return arguments.length === 1
             ? new __Date(year)
             : new __Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0);
          }
          return instance.String(new __Date);
        };

        Function = function Function(argN, body) {
          var fn, result, args = glSlice.call(arguments, 0),
          originalBody = body = args.pop();
          argN = args.join(',');

          // ensure we aren't in strict mode and map arguments.callee to the wrapper
          if (body && body.search(matchStrict) < 0)
            body = 'arguments.callee = arguments.callee.' + expando + '; ' + body;

          // create function using global.Function constructor
          fn = new glFunction(argN, body);

          // ensure `thisArg` isn't set to the sandboxed global
          result = fn[expando] = new __Function('global, fn',
            'var sandbox = this; return function() { return fn.apply(this == sandbox ? global : this, arguments) }')(global, fn);

          // make toString() return the unmodified function body
          function toString() { return originalBody; }
          result.toString = toString;

          return result;
        };

        Number = function Number(value) {
          return new __Number(value);
        };

        Object = function Object(value) {
          if (value != null) {
           switch (toString.call(value)) {
             case '[object Boolean]': return instance.Boolean(value);
             case '[object Number]':  return instance.Number(value);
             case '[object String]':  return instance.String(value);
             case '[object Array]':
               if (value.constructor !== instance.Array)
                 return instance.Array.fromArray(value);
           }
           return value;
          }
          return new __Object;
        };

        RegExp = function RegExp(pattern, flags) {
          return new __RegExp(pattern, flags);
        };

        String = function String(value) {
          return new __String(arguments.length ? value : '');
        };

        // map native wrappers prototype to those of the sandboxed natives
        Array.prototype    = __Array.prototype;
        Boolean.prototype  = __Boolean.prototype;
        Date.prototype     = __Date.prototype;
        Function.prototype = __Function.prototype;
        Number.prototype   = __Number.prototype;
        Object.prototype   = __Object.prototype;
        RegExp.prototype   = __RegExp.prototype;
        String.prototype   = __String.prototype;
      }

      /*----------------------------------------------------------------------*/

      var arrPlugin         = Array.plugin    = Array.prototype,
       boolPlugin           = Boolean.plugin  = Boolean.prototype,
       datePlugin           = Date.plugin     = Date.prototype,
       funcPlugin           = Function.plugin = Function.prototype,
       objPlugin            = Object.plugin   = Object.prototype,
      //  numPlugin            = Number.plugin   = Number.prototype,
      //  rePlugin             = RegExp.plugin   = RegExp.prototype,
       strPlugin            = String.plugin   = String.prototype,
       __concat             = arrPlugin.concat,
       __every              = arrPlugin.every,
       __filter             = arrPlugin.filter,
       __join               = arrPlugin.join,
       __indexOf            = arrPlugin.indexOf,
       __lastIndexOf        = arrPlugin.lastIndexOf,
       __map                = arrPlugin.map,
       __push               = arrPlugin.push,
       __reverse            = arrPlugin.reverse,
       __slice              = arrPlugin.slice,
       __splice             = arrPlugin.splice,
       __some               = arrPlugin.some,
       __sort               = arrPlugin.sort,
       __unshift            = arrPlugin.unshift,
       __getDate            = datePlugin.getDate,
       __getDay             = datePlugin.getDay,
       __getFullYear        = datePlugin.getFullYear,
       __getHours           = datePlugin.getHours,
       __getMilliseconds    = datePlugin.getMilliseconds,
       __getMinutes         = datePlugin.getMinutes,
       __getMonth           = datePlugin.getMonth,
       __getSeconds         = datePlugin.getSeconds,
       __getTime            = datePlugin.getTime,
       __getTimezoneOffset  = datePlugin.getTimezoneOffset,
       __getUTCDate         = datePlugin.getUTCDate,
       __getUTCDay          = datePlugin.getUTCDay,
       __getUTCFullYear     = datePlugin.getUTCFullYear,
       __getUTCHours        = datePlugin.getUTCHours,
       __getUTCMilliseconds = datePlugin.getUTCMilliseconds,
       __getUTCMinutes      = datePlugin.getUTCMinutes,
       __getUTCMonth        = datePlugin.getUTCMonth,
       __getUTCSeconds      = datePlugin.getUTCSeconds,
       __getYear            = datePlugin.getYear,
       __toISOString        = datePlugin.toISOString,
       __toJSON             = datePlugin.toJSON,
      //  __toExponential      = numPlugin.toExponential,
      //  __toFixed            = numPlugin.toFixed,
      //  __toPrecision        = numPlugin.toPrecision,
      //  __exec               = rePlugin.exec,
       __charAt             = strPlugin.charAt,
       __charCodeAt         = strPlugin.charCodeAt,
       __strConcat          = strPlugin.concat,
       __strIndexOf         = strPlugin.indexOf,
       __strLastIndexOf     = strPlugin.lastIndexOf,
       __localeCompare      = strPlugin.localeCompare,
       __match              = strPlugin.match,
       __replace            = strPlugin.replace,
       __search             = strPlugin.search,
       __strSlice           = strPlugin.slice,
       __split              = strPlugin.split,
       __substr             = strPlugin.substr,
       __substring          = strPlugin.substring,
       __toLowerCase        = strPlugin.toLowerCase,
       __toLocaleLowerCase  = strPlugin.toLocaleLowerCase,
       __toLocaleUpperCase  = strPlugin.toLocaleUpperCase,
       __toUpperCase        = strPlugin.toUpperCase,
       __trim               = strPlugin.trim;

      // Number.MAX_VALUE         = 1.7976931348623157e+308;

      // Number.MIN_VALUE         = 5e-324;

      // Number.NaN               = +'x';

      // Number.NEGATIVE_INFINITY = __Number.NEGATIVE_INFINITY;

      // Number.POSITIVE_INFINITY = __Number.POSITIVE_INFINITY;
      // if (!this.RegExp) var RegExp = {}
      // RegExp.SPECIAL_CHARS =

      Array.fromArray = (function() {
        var fromArray = function fromArray(array) {
          var result = new __Array;
          result.push.apply(result, array);
          return result;
        };

        if (mode === OBJECT__PROTO__) {
          fromArray = function fromArray(array) {
            var result = glSlice.call(array, 0);
            result['__proto__'] = arrPlugin;
            return result;
          };
        }
        else if (SKIP_METHODS_RETURNING_ARRAYS) {
          var sbSlice = __Array.prototype.slice;
          fromArray = function fromArray(array) {
            return sbSlice.call(array, 0);
          };
        }
        return fromArray;
      })();

      Array.create = function create() {
        return Array.fromArray(arguments);
      };

      // ECMA-5 15.4.3.2
      if (!(Array.isArray = __Array.isArray))
        Array.isArray = function isArray(value) {
          return toString.call(value) === '[object Array]';
        };

      // ECMA-5 15.9.4.4
      // Date.now = (function() {
      //   var now = function now() { return instance.Number(+new Date()); };
      //   if (__Date.now)
      //     now = function now() { return instance.Number(__Date.now()); };
      //   return now;
      // })();

      // ECMA-5 15.9.4.2
      Date.parse = function parse(dateString) {
        return instance.Number(__Date.parse(dateString));
      };

      // ECMA-5 15.9.4.3
      Date.UTC = function UTC(year, month, date, hours, minutes, seconds, ms) {
        return instance.Number(__Date.UTC(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0));
      };

      // ECMA-5 15.5.3.2
      String.fromCharCode = function fromCharCode(charCode) {
        var args = arguments;
        return String(args.length > 1
          ? __String.fromCharCode.apply(__String, arguments)
          : __String.fromCharCode(charCode));
      };

      // versions of WebKit and IE have non-spec-conforming /\s/
      // so we standardize it (see: ECMA-5 15.10.2.12)
      // http://www.unicode.org/Public/UNIDATA/PropList.txt
      // RegExp = (function(RE) {
      //   var character,
      //    RegExp = RE,
      //    matchCharClass = /\\s/g,
      //    newCharClass = [],
      //    charMap = RE.SPECIAL_CHARS.s;

      //   // catch whitespace chars that are missed by erroneous \s
      //   for (character in charMap) {
      //     if (character.replace(/\s/, '').length)
      //       newCharClass.push(charMap[character]);
      //   }

      //   if (newCharClass.length) {
      //     newCharClass.push('\\s');
      //     newCharClass = '(?:' + newCharClass.join('|') + ')';

      //     // redefine RegExp to auto-fix \s issues
      //     RegExp = function RegExp(pattern, flags) {
      //       return new RE((toString.call(pattern) === '[object RegExp]' ?
      //         pattern.source : String(pattern))
      //           .replace(matchCharClass, newCharClass), flags);
      //     };

      //     // associate properties of old RegExp to the redefined one
      //     RegExp.SPECIAL_CHARS = RE.SPECIAL_CHARS;
      //     rePlugin = RegExp.plugin = RegExp.prototype = RE.prototype;
      //   }

      //   return RegExp;
      // })(RegExp);

      /*----------------------------------------------------------------------*/

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.concat = function concat() {
          var args = arguments;
          return Array.fromArray(args.length
            ? __concat.apply(this, args)
            : __concat.call(this));
        };

      if (arrPlugin.every)
        arrPlugin.every = function every(callback, thisArg) {
          return __every.call(this, callback || K, thisArg);
        };

      if (arrPlugin.filter)
        arrPlugin.filter = function filter(callback, thisArg) {
          var result = __filter.call(this, callback ||
            function(value) { return value != null; }, thisArg);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      arrPlugin.join = function join(separator) {
        return String(__join.call(this, separator));
      };

      if (arrPlugin.indexOf)
        arrPlugin.indexOf = function indexOf(item, fromIndex) {
          return instance.Number(__indexOf.call(this, item,
            fromIndex == null ? 0 : fromIndex));
        };

      if (arrPlugin.lastIndexOf)
        arrPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          return instance.Number(__lastIndexOf.call(this, item,
            fromIndex == null ? this.length : fromIndex));
        };

      if (arrPlugin.map && !SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.map = function map(callback, thisArg) {
          var result = __map.call(this, callback || K, thisArg);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      // arrPlugin.push = function push(item) {
      //   var args = arguments;
      //   return instance.Number(args.length > 1
      //     ? __push.apply(this, args)
      //     : __push.call(this, item));
      // };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.reverse = function reverse() {
          return this.length > 0
            ? Array.fromArray(__reverse.call(this))
            : Array();
        };

    if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.slice = function slice(start, end) {
          var result = __slice.call(this, start, end == null ? this.length : end);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      if (arrPlugin.some)
        arrPlugin.some = function some(callback, thisArg) {
          return __some.call(this, callback || K, thisArg);
        };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.sort = function sort(compareFn) {
          return this.length > 0
            ? Array.fromArray(compareFn ? __sort.call(this, compareFn) : __sort.call(this))
            : Array();
        };

      if (!SKIP_METHODS_RETURNING_ARRAYS)
        arrPlugin.splice = function splice(start, deleteCount) {
          var result = __splice.apply(this, arguments);
          return result.length
            ? Array.fromArray(result)
            : Array();
        };

      arrPlugin.unshift = function unshift(item) {
        var args = arguments;
        return instance.Number(args.length > 1
          ? __unshift.apply(this, args)
          : __unshift.call(this, item));
      };

      datePlugin.getDate = function getDate() {
        return instance.Number(__getDate.call(this));
      };

      datePlugin.getDay = function getDay() {
        return instance.Number(__getDay.call(this));
      };

      datePlugin.getFullYear = function getFullYear() {
        return instance.Number(__getFullYear.call(this));
      };

      datePlugin.getHours = function getHours() {
        return instance.Number(__getHours.call(this));
      };

      datePlugin.getMilliseconds = function getMilliseconds() {
        return instance.Number(__getMilliseconds.call(this));
      };

      datePlugin.getMinutes = function getMinutes() {
        return instance.Number(__getMinutes.call(this));
      };

      datePlugin.getMonth  = function getMonth () {
        return instance.Number(__getMonth.call(this));
      };

      datePlugin.getSeconds = function getSeconds() {
        return instance.Number(__getSeconds.call(this));
      };

      datePlugin.getTime = function getTime() {
        return instance.Number(__getTime.call(this));
      };

      datePlugin.getTimezoneOffset = function getTimezoneOffset() {
        return instance.Number(__getTimezoneOffset.call(this));
      };

      datePlugin.getUTCDate = function getUTCDate() {
        return instance.Number(__getUTCDate.call(this));
      };

      datePlugin.getUTCDay = function getUTCDay() {
        return instance.Number(__getUTCDay.call(this));
      };

      datePlugin.getUTCFullYear = function getUTCFullYear() {
        return instance.Number(__getUTCFullYear.call(this));
      };

      datePlugin.getUTCHours = function getUTCHours() {
        return instance.Number(__getUTCHours.call(this));
      };

      datePlugin.getUTCMilliseconds = function getUTCMilliseconds() {
        return instance.Number(__getUTCMilliseconds.call(this));
      };

      datePlugin.getUTCMinutes = function getUTCMinutes() {
        return instance.Number(__getUTCMinutes.call(this));
      };

      datePlugin.getUTCMonth = function getUTCMonth() {
        return instance.Number(__getUTCMonth.call(this));
      };

      datePlugin.getUTCSeconds = function getUTCSeconds() {
        return instance.Number(__getUTCSeconds.call(this));
      };

      datePlugin.getYear = function getYear() {
        return instance.Number(__getYear.call(this));
      };

      if (datePlugin.toISOString)
        datePlugin.toISOString = function toISOString() {
          return instance.String(__toISOString.call(this));
        };

      if (datePlugin.toJSON)
        datePlugin.toJSON= function toJSON() {
          return instance.String(__toJSON.call(this));
        };

      // numPlugin.toExponential = function toExponential() {
      //   return Number(__toExponential.call(this));
      // };

      // numPlugin.toFixed = function toFixed() {
      //   return Number(__toFixed.call(this));
      // };

      // numPlugin.toPrecision = function toPrecision() {
      //   return Number(__toPrecision.call(this));
      // };

      // rePlugin.exec = function exec(string) {
      //   var length, results, output = __exec.call(this, string);
      //   if (output) {
      //     length = output.length; results = instance.Array();
      //     while (length--) results[length] = instance.String(output[length]);
      //   }
      //   return output && results;
      // };

      strPlugin.charAt = function charAt(pos) {
        return String(__charAt.call(this, pos));
      };

      strPlugin.charCodeAt = function charCodeAt(pos) {
        return instance.Number(__charCodeAt.call(this, pos));
      };

      strPlugin.concat = function concat(item) {
        var args = arguments;
        return String(args.length > 1
          ? __strConcat.apply(this, args)
          : __strConcat.call(this, item));
      };

      strPlugin.indexOf = function indexOf(item, fromIndex) {
        return instance.Number(__strIndexOf.call(this, item,
          fromIndex == null ? 0 : fromIndex));
      };

      strPlugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        return instance.Number(__strLastIndexOf.call(this, item,
          fromIndex == null ? this.length : fromIndex));
      };

      strPlugin.localeCompare = function localeCompare(that) {
        return instance.Number(__localeCompate.call(this, that));
      };

      strPlugin.match = function match(pattern) {
        var length, results, output = __match.call(this, pattern);
        if (output) {
          length = output.length; results = instance.Array();
          while (length--) results[length] = String(output[length]);
        }
        return output && results;
      };

      strPlugin.replace = function replace(pattern, replacement) {
        return String(__replace.call(this, pattern, replacement));
      };

      strPlugin.search = function search(pattern) {
        return instance.Number(__search.call(pattern));
      };

      strPlugin.slice = function slice(start, end) {
        return String(__strSlice.call(this, start,
          end == null ? this.length : end));
      };

      strPlugin.split = function split(separator, limit) {
        var output = __split.call(this, separator, limit),
         length = output.length, results = instance.Array();
        while (length--) results[length] = String(output[length]);
        return results;
      };

      strPlugin.substr = function substr(start, length) {
        return String(__substr.call(start, length == null ? this.length : length));
      };

      strPlugin.substring = function substring(start, end) {
        return String(__substring.call(this, start,
          end == null ? this.length : end));
      };

      strPlugin.toLowerCase = function toLowerCase() {
        return String(__toLowerCase.call(this));
      };

      strPlugin.toLocaleLowerCase = function toLocaleLowerCase() {
        return String(__toLocaleLowerCase.call(this));
      };

      strPlugin.toLocaleUpperCase = function toLocaleUpperCase() {
        return String(__toLocaleUpperCase.call(this));
      };

      strPlugin.toUpperCase = function toUpperCase() {
        return String(__toUpperCase.call(this));
      };

      if (strPlugin.trim)
        strPlugin.trim = function trim() {
          return String(__trim.call(this));
        };

      // point constructor properties to the native wrappers
      arrPlugin.constructor  = Array;
      boolPlugin.constructor = Boolean;
      datePlugin.constructor = Date;
      funcPlugin.constructor = Function;
      objPlugin.constructor  = Object;
      // numPlugin.constructor  = Number;
      // rePlugin.constructor   = RegExp;
      strPlugin.constructor  = String;

      /*----------------------------------------------------------------------*/

      // prevent JScript bug with named function expressions
      var charAt = nil, charCodeAt = nil, create = nil, concat = nil,
       every = nil, exec = nil, filter = nil, getDate = nil, getDay = nil,
       getFullYear = nil, getHours = nil, getMilliseconds = nil,
       getMinutes = nil, getMonth = nil, getSeconds = nil, getTime = nil,
       getTimezoneOffset = nil, getUTCDate = nil, getUTCDay = nil,
       getUTCFullYear = nil, getUTCHours = nil, getUTCMilliseconds = nil,
       getUTCMinutes = nil, getUTCMonth = nil, getUTCSeconds = nil,
       getYear = nil, join = nil, indexOf = nil, lastIndexOf = nil,
       localeCompare = nil, match = nil, map = nil, push = nil, replace = nil,
       reverse = nil, search = nil, slice = nil, some = nil, sort = nil,
       split = nil, splice = nil, substr = nil, substring = nil,
       toExponential = nil, toFixed = nil, toISOString = nil, toJSON = nil,
       toLowerCase = nil, toLocaleLowerCase = nil, toLocaleUpperCase = nil,
       toPrecision = nil, toUpperCase = nil, trim = nil, unshift = nil;

      // assign native wrappers to Fusebox instance and return
      instance.Array    = Array;
      instance.Boolean  = Boolean;
      instance.Date     = Date;
      instance.Function = Function;
      instance.Number   = Number;
      instance.Object   = Object;
      instance.RegExp   = RegExp;
      instance.String   = String;

      return instance;
    },

    postProcess = emptyFunction,

    Klass = function() { },

    Fusebox = function Fusebox(instance) { return createFusebox(instance); };

    /*------------------------------------------------------------------------*/

    // redefine Fusebox to remove the iframe from the document
    if (mode === IFRAME) {
      Fusebox = function Fusebox(instance) {
        return postProcess(createFusebox(instance));
      };

      postProcess = function(instance) {
        // remove iframe
        var iframe = cache[cache.length -1];
        iframe.parentNode.removeChild(iframe);
        return instance;
      };
    }

    if (mode != OBJECT__PROTO__) {
      (function() {
        var div,
         sandbox = createSandbox(),
         Array = sandbox.Array;

        // IE and Opera's Array accessors return
        // sandboxed arrays so we can skip wrapping them
        SKIP_METHODS_RETURNING_ARRAYS =
          !(Array().slice(0) instanceof global.Array);

        if (mode === IFRAME) {
          // remove iframe from document
          postProcess();

          // Opera 9.5 - 10a throws a security error when calling Array#map or String#lastIndexOf
          // Opera 9.5 - 9.64 will error by simply calling the methods.
          // Opera 10 will error when first accessing the contentDocument of
          // another iframe and then accessing the methods.
          if (Array.prototype.map) {
            // create second iframe
            createSandbox();
            // remove second iframe from document
            postProcess();
            // test to see if Array#map is corrupted
            try { Array().map(K); }
            catch (e) {
              postProcess = (function(__postProcess) {
                return function(instance) {
                  instance.Array.prototype.map =
                  instance.String.prototype.lastIndexOf = nil;
                  return __postProcess(instance);
                };
              })(postProcess);
            }
          }

          // pave cache
          // avoid IE memory leak with nodes removed by removeChild()
          div = global.document.createElement('div');
          while (cache.length) {
            div.appendChild(cache.pop());
            div.innerHTML = '';
          }
        }

        // cleanup
        cache = [];
        div = sandbox = nil;
      })();
    }

    // map Fusebox.prototype to Klass so Fusebox can be called without the `new` expression
    Klass.prototype = Fusebox.prototype;

    /*--------------------------------------------------------------------------*/

    // assign Fusebox natives to Fuse object
    (function() {
      var backup, key, i = -1,
       SKIPPED_KEYS = { 'constructor': 1 };

      function createGeneric(proto, methodName) {
        return new Function('proto, slice',
          'function ' + methodName + '(thisArg) {' +
          'var args = arguments;' +
          'return args.length ? proto.' + methodName +
          '.apply(thisArg, slice.call(args, 1)) : ' +
          'proto.' + methodName + '.call(thisArg); }' +
          'return ' + methodName)(proto, slice);
      }

      function updateGenerics(deep) {
        var Klass = this;
        if (deep) fuse.updateGenerics(Klass, deep);
        else Obj._each(Klass.prototype, function(value, key, proto) {
          if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
            Klass[key] = createGeneric(proto, key);
        });
      }

      Fusebox(fuse);

      // break fuse.Object.prototype's relationship to other fuse natives
      // for consistency across sandbox variations.
      if (mode !== OBJECT__PROTO__) {
        backup = {
          'Array':    fuse.Array,
          'Boolean':  fuse.Boolean,
          'Date':     fuse.Date,
          'Function': fuse.Function,
          'Number':   fuse.Number,
          'RegExp':   fuse.RegExp,
          'String':   fuse.String
        };

        Fusebox(fuse);

        fuse.Array    = backup.Array;
        fuse.Boolean  = backup.Boolean;
        fuse.Date     = backup.Date;
        fuse.Function = backup.Function;
        fuse.Number   = backup.Number;
        fuse.RegExp   = backup.RegExp;
        fuse.String   = backup.String;
      }

      // assign sandboxed natives to Fuse and add `updateGeneric` methods
      while (key = arguments[++i]) {
        // if (fuse[key])
        fuse[key].updateGenerics = updateGenerics;
      }
    })('Array',  'Object', 'String'); // 'Boolean', 'Date', 'Function',

    return Fusebox;
  })();

  /*------------------------------ LANG: OBJECT ------------------------------*/

  Obj = fuse.Object;

  eachKey =
  Obj._each = (function() {
    // use switch statement to avoid creating a temp variable
    var _each;
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1; };
      klass.prototype.toString = 1;
      for (key in new klass()) count++;
      return count;
    }()) {
      case 0: // IE
        var dontEnumProperties = ['constructor', 'hasOwnkey', 'isPrototypeOf',
          'propertyIsEnumerable', 'prototype', 'toLocaleString', 'toString', 'valueOf'];
        return _each = function _each(object, callback) {
          if (object) {
            var key, i = 0;
            for (key in object)
              callback(object[key], key, object);

            while(key = dontEnumProperties[i++])
              if (hasKey(object, key))
                callback(object[key], key, object);
          }
          return object;
        };

      case 2:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        return _each = function _each(object, callback) {
          var key, keys = { };
          for (key in object)
            if (!hasKey(keys, key) && (keys[key] = 1))
              callback(object[key], key, object);
          return object;
        };

      default: // Others
        return _each = function _each(object, callback) {
          for (var key in object) callback(object[key], key, object);
          return object;
        };
    }
  })();

  /*--------------------------------------------------------------------------*/

  // Use fuse.Object.hasKey() on object Objects only as it may error on DOM Classes
  // https://bugzilla.mozilla.org/show_bug.cgi?id=375344
  hasKey =
  Obj.hasKey = (function() {
    var objectProto = Object.prototype,
     hasOwnProperty = objectProto.hasOwnProperty;

    if (typeof hasOwnProperty !== 'function') {
      if (envTest('OBJECT__PROTO__')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives to objects so IN operator will work
          object = Object(object);

          var result, proto = object['__proto__'];
          object['__proto__'] = null;
          result = property in object;
          object['__proto__'] = proto;
          return result;
        };
      } else {
        // Other
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          object = Object(object);
          var constructor = object.constructor;
          return property in object &&
            (constructor && constructor.prototype
              ? object[property] !== constructor.prototype[property]
              : object[property] !== objectProto[property]);
        };
      }
    }
    else hasKey = function hasKey(object, property) {
      // ECMA-5 15.2.4.5
      if (object == null) throw new TypeError;
      return hasOwnProperty.call(object, property);
    };

    // Garrett Smith found an Opera bug that occurs with the window object and not the global
    if (typeof window !== 'undefined' && window.Object && !hasKey(window, 'Object')) {
      var __hasKey = hasKey;
      hasKey = function hasKey(object, property) {
        if (object == null) throw new TypeError;
        if(object == global) {
          return property in object &&
            object[property] !== objectProto[property];
        }
        return __hasKey(object, property);
      };
    }
    return hasKey;
  })();

  /*--------------------------------------------------------------------------*/

  _extend =
  Obj._extend = function _extend(destination, source) {
    for (var key in source)
       destination[key] = source[key];
    return destination;
  };

  clone =
  Obj.clone = function clone(object) {
    if (object && typeof object.clone === 'function')
      return object.clone();
    return Obj.extend(fuse.Object(), object);
  };

  isArray =
  Obj.isArray = fuse.Array.isArray;

  isElement =
  Obj.isElement = function isElement(value) {
    return !!value && value.nodeType === ELEMENT_NODE;
  };

  isEmpty =
  Obj.isEmpty = (function() {
    var isEmpty = function isEmpty(object) {
      for (var key in object)
        if (hasKey(object, key)) return false;
      return true;
    };

    if (envTest('OBJECT__COUNT__')) {
      // __count__ is buggy on arrays so we check for push because it's fast.
      var _isEmpty = isEmpty;
      isEmpty = function isEmpty(object) {
        return !object || object.push ? _isEmpty(object) : !object['__count__'];
      };
    }
    return isEmpty;
  })();

  isFunction =
  Obj.isFunction = function isFunction(value) {
    return toString.call(value) === '[object Function]';
  };

  isHash =
  Obj.isHash = function isHash(value) {
    var Hash = fuse.Hash;
    return !!value && value.constructor === Hash && value !== Hash.prototype;
  };

  isNumber =
  Obj.isNumber = function isNumber(value) {
    return toString.call(value) === '[object Number]' && isFinite(value);
  };

  // ECMA-5 4.3.2
  isPrimitive =
  Obj.isPrimitive = function isPrimitive(value) {
    var type = typeof value;
    return value == null || type === 'boolean' || type === 'number' || type === 'string';
  };

  isRegExp =
  Obj.isRegExp = function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  };

  // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
  // http://www.iana.org/assignments/port-numbers
  isSameOrigin =
  Obj.isSameOrigin = (function() {
    function isSameOrigin(url) {
      var domainIndex, urlDomain,
       result    = true,
       docDomain = fuse._doc.domain,
       parts     = String(url).match(matchUrlParts) || [];

      if (parts[0]) {
        urlDomain = parts[2];
        domainIndex = urlDomain.indexOf(docDomain);
        result = parts[1] === protocol &&
          (!domainIndex || urlDomain.charAt(domainIndex -1) == '.') &&
            (parts[3] || defaultPort) === (port || defaultPort);
      }
      return result;
    }

    // var loc = global.location, protocol = loc.protocol, port = loc.port,
    //  matchUrlParts = /([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/,
    //  defaultPort = protocol === 'ftp:' ? 21 : protocol === 'https:' ? 443 : 80;

    return isSameOrigin;
  })();

  isString =
  Obj.isString = function isString(value) {
    return toString.call(value) === '[object String]';
  };

  isUndefined =
  Obj.isUndefined = function isUndefined(value) {
    return typeof value === 'undefined';
  };

  /*--------------------------------------------------------------------------*/

  (function() {
    Obj.each = function each(object, callback, thisArg) {
      try {
        eachKey(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return object;
    };

    Obj.extend = function extend(destination, source) {
      if (source)
        eachKey(source, function(value, key) { destination[key] = value; });
      return destination;
    };

    // ECMA-5 15.2.3.14
    if (!Obj.keys) Obj.keys = function keys(object) {
      if (isPrimitive(object)) throw new TypeError;

      var results = fuse.Array();
      eachKey(object, function(value, key) {
        hasKey(object, key) && results.push(key);
      });
      return results;
    };

    Obj.values = function values(object) {
      if (isPrimitive(object)) throw new TypeError;

      var results = fuse.Array();
      eachKey(object, function(value, key) {
        hasKey(object, key) && results.push(value);
      });
      return results;
    };

    Obj.toHTML = function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? fuse.String(object.toHTML())
        : fuse.String.interpret(object);
    };

    Obj.toQueryString = (function() {
      function toQueryPair(key, value) {
        return fuse.String(typeof value === 'undefined' ? key :
          key + '=' + encodeURIComponent(value == null ? '' : value));
      }

      function toQueryString(object) {
        var results = [];
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) {
            key = encodeURIComponent(key);
            if (value && isArray(value)) {
              var i = results.length, j = 0, length = i + value.length;
              while (i < length) results[i++] = toQueryPair(key, value[j++]);
            }
            else if (!value || toString.call(value) !== '[object Object]') {
              results.push(toQueryPair(key, value));
            }
          }
        });
        return fuse.String(results.join('&'));
      }

      return toQueryString;
    })();

    // prevent JScript bug with named function expressions
    var each = nil, extend = nil, keys = nil, values = nil, toHTML = nil;
  })();

  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, John Resig, T.J. Crowder and Prototype core */

  Class =
  fuse.Class = (function() {
    function Subclass() { };

    function createNamedClass(name) {
      return new Function('',
        'function ' + name + '() {' +
        'return this.initialize && this.initialize.apply(this, arguments);' +
        '} return ' + name)();
    }

    function createCallSuper(plugin) {
      function callSuper(thisArg, name) {
        var args = arguments, fn = name.callee || plugin[name],
         $super = fn.$super || fn.superclass;
        return args.length
          ? $super.apply(thisArg, slice.call(args, 2))
          : $super.call(thisArg);
      }
      return callSuper;
    }

    function Class() {
      var Klass, Parent, plugin, props, i = 0,
       properties = slice.call(arguments, 0),
       first = properties[0];

      if (isString(first))
        Parent = createNamedClass(properties.shift());
      else if (typeof first === 'function')
        Parent = properties.shift();

      // search properties for a custom `constructor` method
      while (props = properties[i++]) {
        if (hasKey(props, 'constructor')) {
          if (typeof props.constructor === 'function')
            Klass = props.constructor;
          else if (isString(props.constructor))
            Klass = createNamedClass(props.constructor);
          delete props.constructor;
        }
      }

      Klass = Klass || createNamedClass('UnnamedClass');

      if (Parent) {
        // note: Safari 2, inheritance won't work with subclass = new Function;
        Subclass.prototype = Parent.prototype;
        Klass.prototype = new Subclass;
        Parent.subclasses.push(Klass);
      }

      // add static methods/properties to the Klass
      plugin = Klass.plugin = Klass.prototype;
      Obj.extend(Klass, Class.Methods);

      Klass.callSuper  = createCallSuper(plugin);
      Klass.subclasses = fuse.Array();
      Klass.superclass = Parent;

      // add methods to Klass.plugin
      i = 0;
      while (props = properties[i++]) Klass.extend(props);

      plugin.constructor = Klass;
      return Klass;
    }

    return Class;
  })();

  /*--------------------------------------------------------------------------*/

  Class.Methods = { };

  (function() {
     function extend(statics, plugins, mixins) {
      var i, otherMethod,
       Klass      = this,
       prototype  = Klass.prototype,
       superProto = Klass.superclass && Klass.superclass.prototype,
       subclasses = Klass.subclasses,
       subLength  = subclasses.length;

       if (!plugins && !mixins) {
         plugins = statics; statics = null;
       }

      if (statics)
        eachKey(statics, function(method, key) { Klass[key] = method; });

      if (mixins)
        eachKey(mixins, function(method, key) { prototype[key] = method; });

      if (plugins)
        eachKey(plugins, function(method, key) {
          var protoMethod = prototype[key],
           superMethod = superProto && superProto[key];

          // avoid typeof === `function` because Safari 3.1+ mistakes
          // regexp instances as typeof `function`
          if (isFunction(method)) {
            if (isFunction(superMethod))
              method.$super = superMethod;

            if (isFunction(protoMethod)) {
              i = subLength;
              while (i--) {
                otherMethod = subclasses[i].prototype[key];
                if (otherMethod && otherMethod.$super)
                  otherMethod.$super = method;
              }
            }
          }
          prototype[key] = method;
        });

      return Klass;
    }

    Class.Methods.extend = extend;
  })();

  /*--------------------------------------------------------------------------*/

  // replace placeholder objects with inheritable namespaces
  global.fuse = Class({ 'constructor': fuse });

  (function(__env) {
    delete fuse.env;
    var env        = fuse.addNS('env');
    env.addTest    = __env.addTest;
    env.removeTest = __env.removeTest;
    env.test       = __env.test;

    env.addNS('agent');
    _extend(env.agent, __env.agent);
  })(fuse.env);

  /*------------------------------ LANG: CONSOLE -----------------------------*/

  fuse.addNS('Console');

  (function(Console) {

    var object,

    error = function() { return false; },

    info = error,

    consoleWrite = function(type, message) {
      fuse._div.innerHTML = '<div id="fusejs-console"><pre>x</pre></div>';
      var consoleElement = fuse._body.appendChild(fuse._div.firstChild),
       textNode = consoleElement.firstChild.firstChild;
      textNode.data = '';

      return (consoleWrite = function(type, message) {
        // append text and scroll to bottom of console
        textNode.data += type + ': ' + message + '\r\n\r\n';
        consoleElement.scrollTop = consoleElement.scrollHeight;
      })(type, message);
    },

    hasGlobalConsole = (
      isHostObject(global, 'console') &&
      isHostObject(global.console, 'info') &&
      isHostObject(global.console, 'error')),

    hasOperaConsole = (
      isHostObject(global, 'opera') &&
      isHostObject(global.opera, 'postError')),

    hasJaxerConsole = (
      isHostObject(global, 'Jaxer') &&
      isHostObject(global.Jaxer, 'Log') &&
      isHostObject(global.Jaxer.Log, 'info') &&
      isHostObject(global.Jaxer.Log, 'error'));

    if (hasOperaConsole) {
      object = global.opera;
      info   = function info(message) { object.postError('Info: ' + message); };
      error  = function error(message, exception) {
        object.postError(['Error: ' + message + '\n', exception]);
      };
    }
    else if (hasGlobalConsole || hasJaxerConsole) {
      object = hasGlobalConsole ? global.console : global.Jaxer.Log;
      info   = function info(message) { object.info(message); };
      error  = function error(message, exception) {
        object.error(message, exception);
      };
    }
    else if (fuse._doc) {
      info  = function info (message) { consoleWrite('Info', message); };
      error = function error(message, error) {
        var result = message ? [message] : [];
        if (error) result.push(
          '[Error:',
          'name: '    + error.name,
          'message: ' + (error.description || error.message),
          ']');

        consoleWrite('Error', result.join('\r\n'));
      };
    }

    Console.error = error;
    Console.info  = info;
  })(fuse.Console);

  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  Func =
  fuse.Function;

  // ECMA-5 15.3.4.5
  bind =
  Func.bind = (function() {
    var bind = function bind(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      if (typeof thisArg === 'undefined')
        return f || context[name];

      // simple bind
      if (args.length < 3 )
        return function() {
          var args = arguments, fn = f || context[name];
          return args.length
            ? fn.apply(thisArg, args)
            : fn.call(thisArg);
        };

      // bind with curry
      curried = slice.call(args, 2);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(thisArg, args.length ?
          concatList(curried, args) : curried);
      };
    };

    // native support
    if (typeof Func.prototype.bind === 'function') {
      var plugin = Func.plugin;
      bind = function bind(fn, thisArg) {
        return plugin.bind.call(f || context[name], thisArg);
      };
    }

    return bind;
  })();

  defer =
  Func.defer = function defer(fn) {
    return Func.delay.apply(global,
      concatList([fn, 0.01], slice.call(arguments, 1)));
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    Func.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, name, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      // simple bind
      if (args.length < 3 ) {
        return function(event) {
          return (f || context[name]).call(thisArg, event || getWindow(this).event);
        };
      }

      // bind with curry
      args = slice.call(args, 2);
      return function(event) {
        return (f || context[name]).apply(thisArg,
          prependList(args, event || getWindow(this).event));
      };
    };

    Func.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, curried, name, reset, args = arguments;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      if (args.length === 1)
        return f || context[name];

      curried = slice.call(args, 1);
      reset   = curried.length;

      return function() {
        curried.length = reset; // reset arg length
        var args = arguments, fn = f || context[name];
        return fn.apply(this, args.length ?
          concatList(curried, args) : curried);
      };
    };

    Func.delay = function delay(fn, timeout) {
      timeout *= 1000;

      // allows lazy loading the target method
      var f, context, name, args = slice.call(arguments, 2);
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return global.setTimeout(function() {
        var fn = f || context[name];
        return fn.apply(fn, args);
      }, timeout);
    };

    Func.methodize = function methodize(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else f = fn;

      return fn._methodized || (fn._methodized = function() {
        var args = arguments, fn = f || context[name];
        return args.length
          ? fn.apply(global, prependList(args, this))
          : fn.call(global, this);
      });
    };

    Func.wrap = function wrap(fn, wrapper) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else f = fn;

      return function() {
        var args = arguments, fn = f || context[name];
        return args.length
          ? wrapper.apply(this, prependList(args, bind(fn, this)))
          : wrapper.call(this, bind(fn, this));
      };
    };

    /*------------------------------------------------------------------------*/

     if (!plugin.bind)
       plugin.bind = (function() {
         function bind(thisArg) {
           var args = arguments;
           return args.length > 1
             ? Func.bind.apply(Func, prependList(args, this))
             : Func.bind(this, thisArg);
         }
         return bind;
       })();

     plugin.bindAsEventListener = function bindAdEventListener(thisArg) {
       var args = arguments;
       return args.length > 1
         ? Func.bindAdEventListener.apply(Func, prependList(args, this))
         : Func.bindAdEventListener(this, thisArg);
     };

     plugin.curry = function curry() {
       var args = arguments;
       return args.length
         ? Func.curry.apply(Func, prependList(args, this))
         : this;
     };

     plugin.delay = function delay(timeout) {
       var args = arguments;
       return args.length > 1
         ? Func.delay.apply(Func, prependList(args, this))
         : Func.delay(this, timeout);
     };

     plugin.defer = function defer() {
       var args = arguments;
       return args.length
         ? Func.defer.apply(Func, prependList(args, this))
         : Func.defer(this);
     };

     plugin.methodize = function methodize() {
       return Func.methodize(this);
     };

     plugin.wrap = function wrap(wrapper) {
       Func.wrap(this, wrapper);
     };

    // prevent JScript bug with named function expressions
    var bindAsEventListener = nil, curry = nil, methodize = nil, wrap = nil;
  })(Func.plugin);

  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  Enumerable =
  fuse.Enumerable = { };

  (function(mixin) {
    mixin.contains = function contains(value) {
      var result = 0;
      this.each(function(item) {
        // basic strict match
        if (item === value && result++) throw $break;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf() && result++) throw $break; }
        catch (e) { }
      });

      return !!result;
    };

    mixin.each = function each(callback, thisArg) {
      try {
        this._each(function(value, index, iterable) {
          callback.call(thisArg, value, index, iterable);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    };

    mixin.eachSlice = function eachSlice(size, callback, thisArg) {
      var index = -size, slices = fuse.Array(), list = this.toArray();
      if (size < 1) return list;
      while ((index += size) < list.length)
        slices[slices.length] = list.slice(index, index + size);
      return callback
        ? slices.map(callback, thisArg)
        : slices;
    };

    mixin.every = function every(callback, thisArg) {
      callback = callback || K;
      var result = true;
      this.each(function(value, index, iterable) {
        if (!callback.call(thisArg, value, index, iterable)) {
          result = false; throw $break;
        }
      });
      return result;
    };

    mixin.filter = function filter(callback, thisArg) {
      var results = fuse.Array();
      callback = callback || function(value) { return value != null; };
      this._each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable))
          results.push(value);
      });
      return results;
    };

    mixin.first = function first(callback, thisArg) {
      if (callback == null) {
        var result;
        this.each(function(value) { result = value; throw $break; });
        return result;
      }
      return this.toArray().first(callback, thisArg);
    };

    mixin.inGroupsOf = function inGroupsOf(size, filler) {
      filler = typeof filler === 'undefined' ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    };

    mixin.inject = function inject(accumulator, callback, thisArg) {
      this._each(function(value, index, iterable) {
        accumulator = callback.call(thisArg, accumulator, value, index, iterable);
      });
      return accumulator;
    };

    mixin.invoke = function invoke(method) {
      var args = slice.call(arguments, 1), funcProto = Function.prototype;
      return this.map(function(value) {
        return funcProto.apply.call(value[method], value, args);
      });
    };

    mixin.last = function last(callback, thisArg) {
      return this.toArray().last(callback, thisArg);
    };

    mixin.map = function map(callback, thisArg) {
      if (!callback) return this.toArray();
      var results = fuse.Array();
      if (thisArg) {
        this._each(function(value, index, iterable) {
          results.push(callback.call(thisArg, value, index, iterable));
        });
      } else {
        this._each(function(value, index, iterable) {
          results.push(callback(value, index, iterable));
        });
      }
      return results;
    };

    mixin.max = function max(callback, thisArg) {
      callback = callback || K;
      var comparable, max, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (max == null || comparable > max) {
          max = comparable; result = value;
        }
      });
      return result;
    };

    mixin.min = function min(callback, thisArg) {
      callback = callback || K;
      var comparable, min, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (min == null || comparable < min) {
          min = comparable; result = value;
        }
      });
      return result;
    };

    mixin.partition = function partition(callback, thisArg) {
      callback = callback || K;
      var trues = fuse.Array(), falses = fuse.Array();
      this._each(function(value, index, iterable) {
        (callback.call(thisArg, value, index, iterable) ?
          trues : falses).push(value);
      });
      return fuse.Array(trues, falses);
    };

    mixin.pluck = function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    };

    mixin.size = function size() {
      return fuse.Number(this.toArray().length);
    };

    mixin.some = function some(callback, thisArg) {
      callback = callback || K;
      var result = false;
      this.each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable)) {
          result = true; throw $break;
        }
      });
      return result;
    };

    mixin.sortBy = function sortBy(callback, thisArg) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': callback.call(thisArg, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    mixin.toArray = function toArray() {
      var results = fuse.Array();
      this._each(function(value, index) { results[index] = value; });
      return results;
    };

    mixin.zip = function zip() {
      var callback = K, args = slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length-1] === 'function')
        callback = args.pop();

      var collection = prependList(fuse.Array.prototype.map.call(args, fuse.util.$A),
        this.toArray(), fuse.Array());

      return this.map(function(value, index, iterable) {
        return callback(collection.pluck(index), index, iterable);
      });
    };

    // prevent JScript bug with named function expressions
    var contains = nil,
     each =        nil,
     eachSlice =   nil,
     every =       nil,
     filter =      nil,
     first =       nil,
     inject =      nil,
     inGroupsOf =  nil,
     invoke =      nil,
     last =        nil,
     map =         nil,
     max =         nil,
     min =         nil,
     partition =   nil,
     pluck =       nil,
     size =        nil,
     some =        nil,
     sortBy =      nil,
     toArray =     nil,
     zip =         nil;
  })(Enumerable);

  /*------------------------------ LANG: ARRAY -------------------------------*/

  addArrayMethods = function(List) {
    (function() {
      List.from = function from(iterable) {
        if (!iterable || iterable == '') return List();

        // Safari 2.x will crash when accessing a non-existent property of a
        // node list, not in the document, that contains a text node unless we
        // use the `in` operator
        var object = fuse.Object(iterable);
        if ('toArray' in object) return object.toArray();
        if ('item' in iterable)  return List.fromNodeList(iterable);

        var length = iterable.length >>> 0, results = List(length);
        while (length--) if (length in object) results[length] = iterable[length];
        return results;
      };

      List.fromNodeList = function fromNodeList(nodeList) {
        var i = 0, results = List();
        while (results[i] = nodeList[i++]) { }
        return results.length-- && results;
      };

      // prevent JScript bug with named function expressions
      var from = nil, fromNodeList = nil;
    })();

    /*--------------------------------------------------------------------------*/

    (function(plugin) {
      plugin._each = function _each(callback) {
        this.forEach(callback);
        return this;
      };

      plugin.clear = function clear() {
        if (this == null) throw new TypeError;
        var object = Object(this);

        if (!isArray(object)) {
          var length = object.length >>> 0;
          while (length--) if (length in object) delete object[length];
        }
        object.length = 0;
        return object;
      };

      plugin.clone = (function() {
        function clone() {
          var object = Object(this);
          if (this == null) throw new TypeError;

          if (isArray(object)) {
            return object.constructor !== List
              ? List.fromArray(object)
              : object.slice(0);
          }
          return List.from(object);
        }
        return clone;
      })();

      plugin.compact = function compact(falsy) {
        if (this == null) throw new TypeError;
        var i = 0, results = List(), object = Object(this),
         length = object.length >>> 0;

        if (falsy) {
          for ( ; i < length; i++)
            if (object[i] && object[i] != '') results.push(object[i]);
        } else {
          for ( ; i < length; i++)
            if (object[i] != null) results.push(object[i]);
        }
        return results;
      };

      plugin.flatten = function flatten() {
        if (this == null) throw new TypeError;
        var i = 0, results = List(),
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (isArray(object[i]))
            concatList(results, plugin.flatten.call(object[i]));
          else results.push(object[i]);
        }
        return results;
      };

      plugin.insert = function insert(index, value) {
        if (this == null) throw new TypeError;
        var object = Object(this),
         length = object.length >>> 0;

        if (length < index) object.length = index;
        if (index < 0) index = length;
        if (arguments.length > 2)
          plugin.splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
        else plugin.splice.call(object, index, 0, value);
        return object;
      };

      plugin.unique = function unique() {
        var item, i = 0, results = List(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++)
          if (i in object && !results.contains(item = object[i]))
            results.push(item);
        return results;
      };

      plugin.without = function without() {
        if (this == null) throw new TypeError;
        var i = 0, args = slice.call(arguments, 0), indexOf = plugin.indexOf,
         results = List(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++)
          if (i in object && indexOf.call(args, object[i]) == -1)
            results.push(object[i]);
        return results;
      };

      /* Create optimized Enumerable equivalents */

      plugin.contains = (function() {
        var contains = function contains(value) {
          if (this == null) throw new TypeError;
          var item, object = Object(this), length = object.length >>> 0;

          while (length--) {
            if (length in object) {
              // basic strict match
              if ((item = object[length]) === value) return true;
              // match String and Number object instances
              try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
            }
          }
          return false;
        };

        if (typeof plugin.indexOf === 'function') {
          var __contains = contains;
          contains = function contains(value) {
            // attempt a fast strict search first
            if (this == null) throw new TypeError;
            var object = Object(this);

            if (plugin.indexOf.call(object, value) > -1) return true;
            return __contains.call(object, value);
          };
        }
        return contains;
      })();

      plugin.each = function each(callback, thisArg) {
        try {
          plugin.forEach.call(this, callback, thisArg);
        } catch (e) {
          if (e !== $break) throw e;
        }
        return this;
      };

      plugin.first = function first(callback, thisArg) {
        if (this == null) throw new TypeError;
        var i = 0, object = Object(this),
         length = object.length >>> 0;

        if (callback == null) {
          for ( ; i < length; i++)
            if (i in object) return object[i];
        }
        else if (typeof callback === 'function') {
          for ( ; i < length; i++)
            if (callback.call(thisArg, object[i], i))
              return object[i];
        }
        else {
          var count = +callback; // fast coerce to number
          if (isNaN(count)) return List();
          count = count < 1 ? 1 : count > length ? length : count;
          return plugin.slice.call(object, 0, count);
        }
      };

      plugin.inject = (function() {
        var inject = function inject(accumulator, callback, thisArg) {
          if (this == null) throw new TypeError;
          var i = 0, object = Object(this), length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++) if (i in object)
              accumulator = callback.call(thisArg, accumulator, object[i], i, object);
          }
          else {
            for ( ; i < length; i++) if (i in object)
              accumulator = callback(accumulator, object[i], i, object);
          }
          return accumulator;
        };

        // use Array#reduce if available
        if (typeof plugin.reduce === 'function') {
          var __inject = inject;

          inject = function inject(accumulator, callback, thisArg) {
            return thisArg
              ? __inject.call(this, accumulator, callback, thisArg)
              : plugin.reduce.call(this, callback, accumulator);
          };
        }
        return inject;
      })();

      plugin.intersect = (function() {
        function intersect(array) {
          if (this == null) throw new TypeError;
          var item, i = 0, results = List(),
           object = Object(this), length = object.length >>> 0;

          for ( ; i < length; i++) {
            if (i in object &&
                contains.call(array, item = object[i]) && !results.contains(item))
              results.push(item);
          }
          return results;
        }

        var contains = plugin.contains;
        return intersect;
      })();

      plugin.invoke = function invoke(method) {
        if (this == null) throw new TypeError;
        var args, i = 0, results = fuse.Array(), object = Object(this),
         length = object.length >>> 0, funcProto = Function.prototype;

        if (arguments.length < 2) {
          while (length--) if (length in object)
            results[length] = funcProto.call.call(object[length][method], object[length]);
        } else {
          args = slice.call(arguments, 1);
          while (length--) if (length in object)
            results[length] = funcProto.apply.call(object[length][method], object[length], args);
        }
        return results;
      };

      plugin.last = function last(callback, thisArg) {
        if (this == null) throw new TypeError;
        var object = Object(this), length = object.length >>> 0;

        if (callback == null)
          return object[length && length - 1];
        if (typeof callback === 'function') {
          while (length--)
            if (callback.call(thisArg, object[length], length, object))
              return object[length];
        }
        else {
          var results = List(), count = +callback;
          if (isNaN(count)) return results;

          count = count < 1 ? 1 : count > length ? length : count;
          return plugin.slice.call(object, length - count);
        }
      };

      plugin.max = function max(callback, thisArg) {
        if (this == null) throw new TypeError;
        var result;

        if (!callback && (callback = K) && isArray(this)) {
          // John Resig's fast Array max|min:
          // http://ejohn.org/blog/fast-javascript-maxmin
          result = Math.max.apply(Math, this);
          if (!isNaN(result)) return result;
          result = undef;
        }

        var comparable, max, value, i = 0,
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (i in object) {
            comparable = callback.call(thisArg, value = object[i], i, object);
            if (max == null || comparable > max) {
              max = comparable; result = value;
            }
          }
        }
        return result;
      };

      plugin.min = function min(callback, thisArg) {
        if (this == null) throw new TypeError;
        var result;

        if (!callback && (callback = K) && isArray(this)) {
          result = Math.min.apply(Math, this);
          if (!isNaN(result)) return result;
          result = undef;
        }

        var comparable, min, value, i = 0,
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) {
          if (i in object) {
            comparable = callback.call(thisArg, value = object[i], i, object);
            if (min == null || comparable < min) {
              min = comparable; result = value;
            }
          }
        }
        return result;
      };

      plugin.partition = function partition(callback, thisArg) {
        if (this == null) throw new TypeError;

        callback = callback || K;
        var i = 0, trues = List(), falses = List(),
         object = Object(this), length = object.length >>> 0;

        for ( ; i < length; i++) if (i in object)
          (callback.call(thisArg, object[i], i, object) ?
            trues : falses).push(object[i]);
        return fuse.Array(trues, falses);
      };

      plugin.pluck = function pluck(property) {
        if (this == null) throw new TypeError;
        var i = 0, results = fuse.Array(), object = Object(this),
         length = object.length >>> 0;

        for ( ; i < length; i++) if (i in object)
          results[i] = object[i][property];
        return results;
      };

      plugin.size = function size() {
        if (this == null) throw new TypeError;
        return fuse.Number(Object(this).length >>> 0);
      };

      plugin.sortBy = function sortBy(callback, thisArg) {
        if (this == null) throw new TypeError;

        callback = callback || K;
        var value, results = List(), object = Object(this),
         length = object.length >>> 0;

        while (length--) {
          value = object[length];
          results[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
        }

        return results.sort(function(left, right) {
          var a = left.criteria, b = right.criteria;
          return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
      };

      plugin.zip = function zip() {
        if (this == null) throw new TypeError;
        var i = 0, results = fuse.Array(), callback = K,
         args = slice.call(arguments, 0), object = Object(this),
         length = object.length >>> 0;

        // if last argument is a function it is the callback
        if (typeof args[args.length - 1] === 'function')
          callback = args.pop();

        var collection = prependList(plugin.map.call(args, List.from), object, fuse.Array());
        for ( ; i < length; i++)
          results.push(callback(collection.pluck(i), i, object));
        return results;
      };

      // aliases
      plugin.toArray = plugin.clone;

      // prevent JScript bug with named function expressions
      var _each =  nil,
       clear =     nil,
       compact =   nil,
       each =      nil,
       first =     nil,
       flatten =   nil,
       insert =    nil,
       invoke =    nil,
       last =      nil,
       max =       nil,
       min =       nil,
       partition = nil,
       pluck =     nil,
       size =      nil,
       sortBy =    nil,
       unique =    nil,
       without =   nil,
       zip =       nil;
    })(List.plugin);

    /*--------------------------------------------------------------------------*/

    /* Use native browser JS 1.6 implementations if available */

    (function(plugin) {

      // Opera's implementation of Array.prototype.concat treats a functions arguments
      // object as an array so we overwrite concat to fix it.
      // ECMA-5 15.4.4.4
      if (!plugin.concat || envTest('ARRAY_CONCAT_ARGUMENTS_BUGGY'))
        plugin.concat = function concat() {
          if (this == null) throw new TypeError;

          var item, j, i = 0,
           args    = arguments,
           length  = args.length,
           object  = Object(this),
           results = isArray(object) ? List.fromArray(object) : List(object),
           n       = results.length;

          for ( ; i < length; i++) {
            item = args[i];
            if (isArray(item)) {
              j = 0; itemLen = item.length;
              for ( ; j < itemLen; j++, n++) if (j in item)
                results[n] = item[j];
            }
            else results[n++] = item;
          }
          return results;
        };

      // ECMA-5 15.4.4.16
      if (!plugin.every)
        plugin.every = function every(callback, thisArg) {
          callback = callback || K;
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, object = Object(this), length = object.length >>> 0;
          for ( ; i < length; i++)
            if (i in object && !callback.call(thisArg, object[i], i, object))
              return false;
          return true;
        };

      // ECMA-5 15.4.4.20
      if (!plugin.filter)
        plugin.filter = function filter(callback, thisArg) {
          callback = callback || function(value) { return value != null; };
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, results = List(), object = Object(this),
           length = object.length >>> 0;

          for ( ; i < length; i++)
            if (i in object && callback.call(thisArg, object[i], i, object))
              results.push(object[i]);
          return results;
        };

      // ECMA-5 15.4.4.18
      if (!plugin.forEach)
        plugin.forEach = function forEach(callback, thisArg) {
          if (this == null || !isFunction(callback)) throw new TypeError;
          var i = 0, object = Object(this), length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++)
              i in object && callback.call(thisArg, object[i], i, object);
          } else {
            for ( ; i < length; i++)
              i in object && callback(object[i], i, object);
          }
        };

      // ECMA-5 15.4.4.14
      if (!plugin.indexOf)
        plugin.indexOf = function indexOf(item, fromIndex) {
          if (this == null) throw new TypeError;

          fromIndex = toInteger(fromIndex);
          var object = Object(this), length = object.length >>> 0;
          if (fromIndex < 0) fromIndex = length + fromIndex;

          // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
          for ( ; fromIndex < length; fromIndex++)
            if (fromIndex in object && object[fromIndex] === item)
              return fuse.Number(fromIndex);
          return fuse.Number(-1);
        };

      // ECMA-5 15.4.4.15
      if (!plugin.lastIndexOf)
        plugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
          if (this == null) throw new TypeError;
          var object = Object(this), length = object.length >>> 0;
          fromIndex = fromIndex == null ? length : toInteger(fromIndex);

          if (!length) return fuse.Number(-1);
          if (fromIndex > length) fromIndex = length - 1;
          if (fromIndex < 0) fromIndex = length + fromIndex;

          // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
          for ( ; fromIndex > -1; fromIndex--)
            if (fromIndex in object && object[fromIndex] === item) break;
          return fuse.Number(fromIndex);
        };

      // ECMA-5 15.4.4.19
      if (!plugin.map)
        plugin.map = function map(callback, thisArg) {
          if (!callback) return plugin.clone.call(this);
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, results = List(), object = Object(this),
           length = object.length >>> 0;

          if (thisArg) {
            for ( ; i < length; i++)
              if (i in object) results[i] = callback.call(thisArg, object[i], i, object);
          } else {
            for ( ; i < length; i++)
              if (i in object) results[i] = callback(object[i], i, object);
          }
          return results;
        };

      // ECMA-5 15.4.4.10
      if (envTest('ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES'))
        plugin.slice = (function(__slice) {
          function slice(start, end) {
            if (this == null) throw new TypeError;

            var endIndex, result, object = Object(this),
             length = object.length >>> 0;

            end = typeof end === 'undefined' ? length : toInteger(end);
            endIndex = end - 1;

            if (end > length || endIndex in object)
              return __slice.call(object, start, end);

            object[endIndex] = undef;
            result = __slice.call(object, start, end);
            delete object[endIndex];
            return result;
          }

          return slice;
        })(plugin.slice);

      // ECMA-5 15.4.4.17
      if (!plugin.some)
        plugin.some = function some(callback, thisArg) {
          callback = callback || K;
          if (this == null || !isFunction(callback)) throw new TypeError;

          var i = 0, object = Object(this), length = object.length >>> 0;
          for ( ; i < length; i++)
            if (i in object && callback.call(thisArg, object[i], i, object))
              return true;
          return false;
        };

      // assign any missing Enumerable methods
      if (Enumerable) {
        eachKey(Enumerable, function(value, key, object) {
          if (hasKey(object, key) && typeof plugin[key] !== 'function')
            plugin[key] = value;
        });
      }

      // prevent JScript bug with named function expressions
      var concat =   nil,
       every =       nil,
       filter =      nil,
       forEach =     nil,
       indexOf =     nil,
       lastIndexOf = nil,
       map =         nil,
       some =        nil;
    })(List.plugin);
  };

  /*--------------------------------------------------------------------------*/

  addArrayMethods(fuse.Array);

  fuse.addNS('util');

  fuse.util.$A = fuse.Array.from;

  // /*------------------------------ LANG: NUMBER ------------------------------*/

  // (function(plugin) {
  //   plugin.abs = (function() {
  //     function abs() { return fuse.Number(__abs(this)); }
  //     var __abs = Math.abs;
  //     return abs;
  //   })();

  //   plugin.ceil = (function() {
  //     function ceil() { return fuse.Number(__ceil(this)); }
  //     var __ceil = Math.ceil;
  //     return ceil;
  //   })();

  //   plugin.floor = (function() {
  //     function floor() { return fuse.Number(__floor(this)); }
  //     var __floor = Math.floor;
  //     return floor;
  //   })();

  //   plugin.round = (function() {
  //     function round() { return fuse.Number(__round(this)); }
  //     var __round = Math.round;
  //     return round;
  //   })();

  //   plugin.times = function times(callback, thisArg) {
  //     var i = 0, length = toInteger(this);
  //     if (arguments.length === 1) {
  //       while (i < length) callback(i, i++);
  //     } else {
  //       while (i < length) callback.call(thisArg, i, i++);
  //     }
  //     return this;
  //   };

  //   plugin.toColorPart = function toColorPart() {
  //     return plugin.toPaddedString.call(this, 2, 16);
  //   };

  //   plugin.toPaddedString = (function() {
  //     function toPaddedString(length, radix) {
  //       var string = toInteger(this).toString(radix || 10);
  //       if (length <= string.length) return fuse.String(string);
  //       if (length > pad.length) pad = new Array(length + 1).join('0');
  //       return fuse.String((pad + string).slice(-length));
  //     }

  //     var pad = '000000';
  //     return toPaddedString;
  //   })();

  //   // prevent JScript bug with named function expressions
  //   var times = nil, toColorPart = nil;
  // })(fuse.Number.plugin);

  /*------------------------------ LANG: REGEXP ------------------------------*/

  // (function(plugin) {
  //   fuse.RegExp.escape = function escape(string) {
  //     return fuse.String(escapeRegExpChars(string));
  //   };

  //   plugin.clone = function clone(options) {
  //     options = _extend({
  //       'global':     this.global,
  //       'ignoreCase': this.ignoreCase,
  //       'multiline':  this.multiline
  //     }, options);

  //     return fuse.RegExp(this.source,
  //       (options.global     ? 'g' : '') +
  //       (options.ignoreCase ? 'i' : '') +
  //       (options.multiline  ? 'm' : ''));
  //   };

  //   // alias
  //   plugin.match = plugin.test;

  //   // prevent JScript bug with named function expressions
  //   var clone = nil, escape = nil;
  // })(fuse.RegExp.plugin);

  /*------------------------------ LANG: STRING ------------------------------*/

  fuse.scriptFragment = '<script[^>]*>([^\\x00]*?)<\/script>';

  fuse.addNS('util');

  fuse.util.$w = (function() {
    function $w(string) {
      if (!isString(string)) return fuse.Array();
      string = plugin.trim.call(string);
      return string != '' ? string.split(/\s+/) : fuse.Array();
    }
    var plugin = fuse.String.plugin;
    return $w;
  })();

  fuse.String.interpret = (function() {
    function interpret(value) { return fuse.String(value == null ? '' : value); }
    return interpret;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var SPECIAL_CHARS = {
        's': {
          // whitespace
          '\x09': '\\x09', '\x0B': '\\x0B', '\x0C': '\\x0C', '\x20': '\\x20', '\xA0': '\\xA0',

          // line terminators
          '\x0A': '\\x0A', '\x0D': '\\x0D', '\u2028': '\\u2028', '\u2029': '\\u2029',

          // unicode category "Zs" space separators
          '\u1680': '\\u1680', '\u180e': '\\u180e', '\u2000': '\\u2000',
          '\u2001': '\\u2001', '\u2002': '\\u2002', '\u2003': '\\u2003',
          '\u2004': '\\u2004', '\u2005': '\\u2005', '\u2006': '\\u2006',
          '\u2007': '\\u2007', '\u2008': '\\u2008', '\u2009': '\\u2009',
          '\u200a': '\\u200a', '\u202f': '\\u202f', '\u205f': '\\u205f',
          '\u3000': '\\u3000'
        }
      };
    var sMap = SPECIAL_CHARS.s;

    // ECMA-5 15.5.4.11
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          var __replacement, result;
          if (typeof replacement === 'function') {
            // ensure string `null` and `undefined` are returned
            __replacement = replacement;
            replacement = function() {
              var result = __replacement.apply(global, arguments);
              return result || String(result);
            };
          }
          result = __replace.call(this, pattern, replacement);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return replace;
      })(plugin.replace);

    // For Safari 2.0.2- and Chrome 1+
    // Based on work by Dean Edwards:
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ||
        envTest('STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN'))
      plugin.replace = (function(__replace) {
        function replace(pattern, replacement) {
          if (typeof replacement !== 'function')
            return __replace.call(this, pattern, replacement);

          if (this == null) throw new TypeError;
          if (!isRegExp(pattern))
            pattern = new RegExp(escapeRegExpChars(pattern));

          // set pattern.lastIndex to 0 before we perform string operations
          var match, index = 0, nonGlobal = !pattern.global,
           lastIndex = pattern.lastIndex = 0,
           result = '', source = String(this),
           srcLength = source.length;

          while (match = exec.call(pattern, source)) {
            index = match.index;
            result += source.slice(lastIndex, index);

            // set lastIndex before replacement call to avoid potential
            // pattern.lastIndex tampering
            lastIndex = pattern.lastIndex;
            result += replacement.apply(global, concatList(match, [index, source]));

            if (nonGlobal) {
              pattern.lastIndex = lastIndex = index + match[0].length;
              break;
            }
            // handle empty pattern matches like /()/g
            if (lastIndex === index) {
              if (lastIndex === srcLength) break;
              result += source.charAt(lastIndex++);
            }
            pattern.lastIndex = lastIndex;
          }

          // append the remaining source to the result
          if (lastIndex < srcLength)
            result += source.slice(lastIndex, srcLength);
          return fuse.String(result);
        }

        var exec = RegExp.prototype.exec;
        return replace;
      })(plugin.replace);


    // ECMA-5 15.5.4.8
    if (!plugin.lastIndexOf)
      plugin.lastIndexOf = function lastIndexOf(searchString, position) {
        if (this == null) throw new TypeError;
        searchString = String(searchString);
        position = +position;

        var string = String(this),
         len = string.length,
         searchLen = searchString.length;

        if (searchLen > len)
          return fuse.Number(-1);

        if (position < 0) position = 0;
        else if (isNaN(position) || position > len - searchLen)
          position = len - searchLen;

        if (!searchLen)
          return fuse.Number(position);

        position++;
        while (position--)
          if (string.slice(position, position + searchLen) === searchString)
            return fuse.Number(position);
        return fuse.Number(-1);
      };

    // For Chome 1+
    if (envTest('STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_POSITION'))
      plugin.lastIndexOf = (function(__lastIndexOf) {
        function lastIndexOf(searchString, position) {
          position = +position;
          return __lastIndexOf.call(this, searchString, position < 0 ? 0 : position);
        }

        return lastIndexOf;
      })(plugin.lastIndexOf);


    // ECMA-5 15.5.4.10
    // For IE
    if (envTest('STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX'))
      plugin.match = (function(__match) {
        function match(pattern) {
          var result = __match.call(this, pattern);
          if (isRegExp(pattern)) pattern.lastIndex = 0;
          return result;
        }

        return match;
      })(plugin.match);


    // ECMA-5 15.5.4.20
    if (!plugin.trim)
      plugin.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        if (start === end) return fuse.String('');

        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(start, end + 1));
      };

    // non-standard
    if (!plugin.trimLeft)
      plugin.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        return fuse.String(string.slice(start));
      };

    // non-standard
    if (!plugin.trimRight)
      plugin.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(0, end + 1));
      };

    // prevent JScript bug with named function expressions
    var lastIndexOf = nil, match = nil, trim = nil, trimLeft = nil, trimRight = nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var replace         = plugin.replace,
     matchBlank         = /^\\s*$/,
     matchCapped        = /([A-Z]+)([A-Z][a-z])/g,
     matchCamelCases    = /([a-z\d])([A-Z])/g,
     matchDoubleColons  = /::/g,
     matchHyphens       = /-/g,
     matchHyphenated    = /-+(.)?/g,
     matchOpenScriptTag = /<script/i,
     matchUnderscores   = /_/g,
     matchScripts       = new RegExp(fuse.scriptFragment, 'gi'),
     matchHTMLComments  = new RegExp('<!--[\\x20\\t\\n\\r]*' +
       fuse.scriptFragment + '[\\x20\\t\\n\\r]*-->', 'gi');

    plugin.blank = function blank() {
      if (this == null) throw new TypeError;
      return matchBlank.test(this);
    };

    plugin.camelize = (function() {
      function toUpperCase(match, character) {
        return character ? character.toUpperCase() : '';
      }

      function camelize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = replace.call(string, matchHyphenated, toUpperCase));
      }

      var cache = { };
      return camelize;
    })();

    // set private reference
    capitalize =
    plugin.capitalize = (function() {
      function capitalize() {
        if (this == null) throw new TypeError;
        var string = String(this), expandoKey = expando + string;
        return cache[expandoKey] ||
          (cache[expandoKey] = fuse.String(string.charAt(0).toUpperCase() +
            string.slice(1).toLowerCase()));
      }

      var cache = { };
      return capitalize;
    })();

    plugin.contains = function contains(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isEmpty = function isEmpty() {
      if (this == null) throw new TypeError;
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      if (this == null) throw new TypeError;
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    };

    plugin.evalScripts = function evalScripts() {
      if (this == null) throw new TypeError;
      results = fuse.Array();
      fuse.String(this).extractScripts(function(script) {
        results.push(global.eval(String(script)));
      });

      return results;
    };

    plugin.extractScripts = function extractScripts(callback) {
      if (this == null) throw new TypeError;
      var match, script, striptTags,
       string = String(this), results = fuse.Array();

      if (!matchOpenScriptTag.test(string)) return results;

      matchHTMLComments.lastIndex =
      matchScripts.lastIndex      = 0;
      scriptTags = string.replace(matchHTMLComments, '');

      if (callback) {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) { callback(script); results.push(script); }
      } else {
        while (match = matchScripts.exec(scriptTags))
          if (script = match[1]) results.push(script);
      }
      return results;
    };

    plugin.hyphenate = function hyphenate() {
      if (this == null) throw new TypeError;
      matchUnderscores.lastIndex = 0;
      return fuse.String(String(this).replace(matchUnderscores, '-'));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      if (this == null) throw new TypeError;
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.stripScripts = function stripScripts() {
      if (this == null) throw new TypeError;
      matchScripts.lastIndex = 0;
      return fuse.String(String(this).replace(matchScripts, ''));
    };

    plugin.times = (function() {
      function __times(string, count) {
        // Based on work by Yaffle and Dr. J.R.Stockton.
        // Uses the `Exponentiation by squaring` algorithm.
        // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
        if (count < 1) return '';
        if (count % 2) return __times(string, count - 1) + string;
        var half = __times(string, count / 2);
        return half + half;
      }

      function times(count) {
        if (this == null) throw new TypeError;
        return fuse.String(__times(String(this), toInteger(count)));
      }

      return times;
    })();

    plugin.toArray = function toArray() {
      if (this == null) throw new TypeError;
      return fuse.String(this).split('');
    };

    plugin.toQueryParams = function toQueryParams(separator) {
      if (this == null) throw new TypeError;
      var match = String(this).split('?'), object = fuse.Object();

      // if ? (question mark) is present and there is no query after it
      if (match.length > 1 && !match[1]) return object;

      // grab the query before the # (hash) and\or spaces
      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);

      // bail if empty string
      if (!match) return object;

      var pair, key, value, index, i = 0,
       pairs = match.split(separator || '&'), length = pairs.length;

      // iterate over key-value pairs
      for ( ; i < length; i++) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (!pair || index == 0) continue;

        if (index != -1) {
          key = decodeURIComponent(pair.slice(0, index));
          value = pair.slice(index + 1);
          if (value) value = decodeURIComponent(value);
        } else key = pair;

        if (hasKey(object, key)) {
          if (!isArray(object[key])) object[key] = [object[key]];
          object[key].push(value);
        }
        else object[key] = value;
      }
      return object;
    };

    plugin.truncate = function truncate(length, truncation) {
      if (this == null) throw new TypeError;
      var endIndex, string = String(this);

      length = +length;
      if (isNaN(length)) length = 30;

      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      if (this == null) throw new TypeError;
      matchDoubleColons.lastIndex =
      matchCapped.lastIndex       =
      matchCamelCases.lastIndex   =
      matchHyphens.lastIndex      = 0;

      return fuse.String(String(this)
        .replace(matchDoubleColons, '/')
        .replace(matchCapped,       '$1_$2')
        .replace(matchCamelCases,   '$1_$2')
        .replace(matchHyphens,      '_').toLowerCase());
    };

    // aliases
    plugin.parseQuery = plugin.toQueryParams;

    // prevent JScript bug with named function expressions
    var blank =        nil,
      contains =       nil,
      endsWith =       nil,
      evalScripts =    nil,
      extractScripts = nil,
      hyphenate =      nil,
      isEmpty =        nil,
      startsWith =     nil,
      stripScripts =   nil,
      toArray =        nil,
      toQueryParams =  nil,
      truncate =       nil,
      underscore =     nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    // Tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    var matchTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })();

    function define() {
      var tags      = [],
       count        = 0,
       div          = fuse._div,
       container    = fuse._doc.createElement('pre'),
       textNode     = container.appendChild(fuse._doc.createTextNode('')),
       replace      = plugin.replace,
       matchTagEnds = />/g,
       matchTokens  = /@fusetoken/g;

       escapeHTML = function escapeHTML() {
         if (this == null) throw new TypeError;
         textNode.data = String(this);
         return fuse.String(container.innerHTML);
       },

       getText = function() {
         return div.textContent;
       };

      function swapTagsToTokens(tag) {
        tags.push(tag);
        return '@fusetoken';
      }

      function swapTokensToTags() {
        return tags[count++];
      }

      function unescapeHTML() {
        if (this == null) throw new TypeError;
        var result, tokenized, string = String(this);

        // tokenize tags before setting innerHTML then swap them after
        if (tokenized = string.indexOf('<') > -1) {
          tags.length = count = 0;
          string = replace.call(string, matchTags, swapTagsToTokens);
        }

        div.innerHTML = '<pre>' + string + '<\/pre>';
        result = getText();

        return fuse.String(tokenized
          ? replace.call(result, matchTokens, swapTokensToTags)
          : result);
      }


      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML !== '&amp;')
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));

      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML !== '&gt;')
        escapeHTML = function escapeHTML() {
          if (this == null) throw new TypeError;
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(matchTagEnds, '&gt;'));
        };

      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };

        else if (div.firstChild.innerHTML === '<p>x<\/p>')
          getText = function() { return div.firstChild.innerHTML; };

        else getText = function() {
          var node, nodes = div.firstChild.childNodes, parts = [], i = 0;
          while (node = nodes[i++]) parts.push(node.nodeValue);
          return parts.join('');
        };
      }

      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    }

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(matchTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = nil, stripTags = nil, unescapeHTML = nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  // update native generics and element methods
  fuse.updateGenerics(true);

  if (global.Event && global.Event.Methods)
    Event.addMethods();
})(this);

// module.exports = fuse;
