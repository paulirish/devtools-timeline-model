
var sb = { }, slice = [].slice, toString = sb.toString
/* create constructors that return rewired natives */
// ES5 15.4.1
sb.Array = function (length) {
  var result = [], argLen = arguments.length
  if (argLen) {
    // ensure sb.Array acts like window.Array
    if (argLen === 1 && typeof length === 'number') {
      result.length = length
    } else {
      result.push.apply(result, arguments)
    }
  }
  // rewire the array’s __proto__ making it use
  // sb.Array.prototype instead of window.Array.prototype
  // when looking up methods/properties
  result.__proto__ = sb.Array.prototype
  return result
}
// ES5 15.6
sb.Boolean = function (value) {
  var result = new Boolean(value)
  result.__proto__ = sb.Boolean.prototype
  return result
}
// ES5 15.9.2
sb.Date = function (year, month, date, hours, minutes, seconds, ms) {
  var result
  if (this.constructor === result.Date) {
    result = arguments.length === 1
      ? new Date(year)
      : new Date(year, month, date || 1, hours || 0, minutes || 0, seconds || 0, ms || 0)
    result.__proto__ = sb.Date.prototype
  } else {
    result = sb.String(new Date)
  }
  return result
}
// ES5 15.3.1
sb.Function = function (argN, body) {
  var result = arguments.length < 3
    ? Function(argN || '', body || '')
    : Function.apply(Function, arguments)
  result.__proto__ = sb.Function.prototype
  return result
}
// ES5 15.7.1
sb.Number = function (value) {
  var result = new Number(value)
  result.__proto__ = sb.Number.prototype
  return result
}
// ES5 15.2.1
// convert global natives to sandboxed natives
sb.Object = function (value) {
  var classOf, result
  if (value != null) {
    switch (classOf = toString.call(value)) {
      case '[object Array]':
        if (value.constructor !== sb.Array) {
          result = sb.Array()
          result.push.apply(result, value)
          return result
        }
        break
      case '[object Boolean]':
        if (value.constructor !== sb.Boolean) {
          return sb.Boolean(value == true)
        }
        break
      case '[object RegExp]':
        if (value.constructor !== sb.RegExp) {
          return sb.RegExp(value.source,
            (value.global ? 'g' : '') +
            (value.ignoreCase ? 'i' : '') +
            (value.multiline ? 'm' : ''))
        }
        break
      case '[object Date]':
      case '[object Number]':
      case '[object String]':
        classOf = classOf.slice(8, -1)
        if (value.constructor !== sb[classOf]) {
          return new sb[classOf](value)
        }
    }
    return value
  }
  result = { }
  result.__proto__ = sb.Object.prototype
  return result
}
// ES5 15.10.4
sb.RegExp = function (pattern, flags) {
  var result = new RegExp(pattern, flags)
  result.__proto__ = sb.RegExp.prototype
  return result
}
// ES5 15.5
sb.String = function (value) {
  var result = new String(arguments.length ? value : '')
  result.__proto__ = sb.String.prototype
  return result
}
// set constructor's prototype as global native instances
sb.Array.prototype = []
sb.Boolean.prototype = new Boolean
sb.Date.prototype = new Date
sb.Function.prototype = new Function
sb.Number.prototype = new Number
sb.RegExp.prototype = new RegExp
sb.String.prototype = new String

module.exports = sb;
