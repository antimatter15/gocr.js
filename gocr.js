function GOCR(image){
	Module = {
		arguments: ['-i', 'in.pnm', '-f', 'UTF8']
	}
	
	if(image.getContext) image = image.getContext('2d');
	if(image.getImageData) image = image.getImageData(0, 0, image.canvas.width, image.canvas.height);
	// if(image.data){
	var width = image.width, height = image.height;
	var header = "P5\n" + width + " " + height + "\n255\n";
	var dst = new Uint8Array(header.length + width * height);
	var src = image.data;
	var srcLength = src.length | 0, srcLength_16 = (srcLength - 16) | 0;
	var j = header.length;
	for(var i = 0; i < j; i++){
		dst[i] = header.charCodeAt(i) // write the header
	}
	var coeff_r = 4899, coeff_g = 9617, coeff_b = 1868;
	for (var i = 0; i <= srcLength_16; i += 16, j += 4) {
		dst[j]     = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
		dst[j + 1] = (src[i+4] * coeff_r + src[i+5] * coeff_g + src[i+6] * coeff_b + 8192) >> 14;
		dst[j + 2] = (src[i+8] * coeff_r + src[i+9] * coeff_g + src[i+10] * coeff_b + 8192) >> 14;
		dst[j + 3] = (src[i+12] * coeff_r + src[i+13] * coeff_g + src[i+14] * coeff_b + 8192) >> 14;
	}
	for (; i < srcLength; i += 4, ++j) {
		dst[j] = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
	}
	var recognizedText = "";
	var utf8;
	Module['preRun'] = function(){
	  utf8 = new Runtime.UTF8Processor();
	  FS.writeFile('/in.pnm', dst, { encoding: 'binary' })
	}
	
	Module['stdout'] = function(x){
		recognizedText += utf8.processCChar(x)
	}
	// Module['print'] = function(text) {
	// console.log('print', text)
	// }
	// Module['abort'] = function(){
	// 	console.log('aborted')
	// }
	// Module['printErr'] = function(text) {
	// console.error(text)
	// }
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 28144;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([80,30,0,0,168,76,0,0,192,59,0,0,168,76,0,0,32,42,0,0,168,76,0,0,96,35,0,0,168,76,0,0,216,31,0,0,248,26,0,0,32,23,0,0,248,26,0,0,80,19,0,0,248,26,0,0,176,15,0,0,248,26,0,0,32,97,0,0,128,94,0,0,40,91,0,0,128,94,0,0,72,85,0,0,80,80,0,0,152,77,0,0,24,75,0,0,72,72,0,0,240,69,0,0,160,68,0,0,64,67,0,0,16,66,0,0,96,64,0,0,64,63,0,0,96,64,0,0,136,61,0,0,80,60,0,0,0,0,0,0,0,0,0,0,0,224,0,0,95,0,0,0,46,0,0,0,44,0,0,0,39,0,0,0,33,0,0,0,59,0,0,0,63,0,0,0,58,0,0,0,45,0,0,0,61,0,0,0,40,0,0,0,41,0,0,0,47,0,0,0,92,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,224,91,0,0,0,0,0,0,184,33,0,0,152,33,0,0,40,33,0,0,224,32,0,0,56,32,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,255,255,255,255,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,255,255,255,255,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,1,0,0,1,0,2,1,1,0,0,1,0,0,0,2,1,0,0,1,0,0,0,0,1,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,0,0,0,0,7,0,0,0,10,0,0,0,13,0,0,0,17,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,44,0,0,0,7,0,0,0,10,0,0,0,16,0,0,0,22,0,0,0,28,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,70,0,0,0,7,0,0,0,15,0,0,0,26,0,0,0,36,0,0,0,44,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,100,0,0,0,7,0,0,0,20,0,0,0,36,0,0,0,52,0,0,0,64,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,134,0,0,0,7,0,0,0,26,0,0,0,48,0,0,0,72,0,0,0,88,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,172,0,0,0,7,0,0,0,36,0,0,0,64,0,0,0,96,0,0,0,112,0,0,0,2,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,196,0,0,0,0,0,0,0,40,0,0,0,72,0,0,0,108,0,0,0,130,0,0,0,2,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,242,0,0,0,0,0,0,0,48,0,0,0,88,0,0,0,132,0,0,0,156,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,2,0,0,0,36,1,0,0,0,0,0,0,60,0,0,0,110,0,0,0,160,0,0,0,192,0,0,0,2,0,0,0,0,0,0,0,3,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,90,1,0,0,0,0,0,0,72,0,0,0,130,0,0,0,192,0,0,0,224,0,0,0,2,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,6,0,0,0,2,0,0,0,6,0,0,0,2,0,0,0,148,1,0,0,0,0,0,0,80,0,0,0,150,0,0,0,224,0,0,0,8,1,0,0,4,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,8,0,0,0,210,1,0,0,0,0,0,0,96,0,0,0,176,0,0,0,4,1,0,0,52,1,0,0,2,0,0,0,2,0,0,0,6,0,0,0,2,0,0,0,4,0,0,0,6,0,0,0,7,0,0,0,4,0,0,0,20,2,0,0,0,0,0,0,104,0,0,0,198,0,0,0,32,1,0,0,96,1,0,0,4,0,0,0,0,0,0,0,8,0,0,0,1,0,0,0,8,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,69,2,0,0,3,0,0,0,120,0,0,0,216,0,0,0,64,1,0,0,128,1,0,0,3,0,0,0,1,0,0,0,4,0,0,0,5,0,0,0,11,0,0,0,5,0,0,0,11,0,0,0,5,0,0,0,143,2,0,0,3,0,0,0,132,0,0,0,240,0,0,0,104,1,0,0,176,1,0,0,5,0,0,0,1,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,7,0,0,0,11,0,0,0,7,0,0,0,221,2,0,0,3,0,0,0,144,0,0,0,24,1,0,0,152,1,0,0,224,1,0,0,5,0,0,0,1,0,0,0,7,0,0,0,3,0,0,0,15,0,0,0,2,0,0,0,3,0,0,0,13,0,0,0,47,3,0,0,3,0,0,0,168,0,0,0,52,1,0,0,192,1,0,0,20,2,0,0,1,0,0,0,5,0,0,0,10,0,0,0,1,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,17,0,0,0,133,3,0,0,3,0,0,0,180,0,0,0,82,1,0,0,248,1,0,0,76,2,0,0,5,0,0,0,1,0,0,0,9,0,0,0,4,0,0,0,17,0,0,0,1,0,0,0,2,0,0,0,19,0,0,0,223,3,0,0,3,0,0,0,196,0,0,0,108,1,0,0,34,2,0,0,138,2,0,0,3,0,0,0,4,0,0,0,3,0,0,0,11,0,0,0,17,0,0,0,4,0,0,0,9,0,0,0,16,0,0,0,61,4,0,0,3,0,0,0,224,0,0,0,160,1,0,0,88,2,0,0,188,2,0,0,3,0,0,0,5,0,0,0,3,0,0,0,13,0,0,0,15,0,0,0,5,0,0,0,15,0,0,0,10,0,0,0,132,4,0,0,4,0,0,0,224,0,0,0,186,1,0,0,132,2,0,0,238,2,0,0,4,0,0,0,4,0,0,0,17,0,0,0,0,0,0,0,17,0,0,0,6,0,0,0,19,0,0,0,6,0,0,0,234,4,0,0,4,0,0,0,252,0,0,0,220,1,0,0,178,2,0,0,48,3,0,0,2,0,0,0,7,0,0,0,17,0,0,0,0,0,0,0,7,0,0,0,16,0,0,0,34,0,0,0,0,0,0,0,84,5,0,0,4,0,0,0,14,1,0,0,248,1,0,0,238,2,0,0,132,3,0,0,4,0,0,0,5,0,0,0,4,0,0,0,14,0,0,0,11,0,0,0,14,0,0,0,16,0,0,0,14,0,0,0,194,5,0,0,4,0,0,0,44,1,0,0,48,2,0,0,42,3,0,0,192,3,0,0,6,0,0,0,4,0,0,0,6,0,0,0,14,0,0,0,11,0,0,0,16,0,0,0,30,0,0,0,2,0,0,0,52,6,0,0,4,0,0,0,56,1,0,0,76,2,0,0,102,3,0,0,26,4,0,0,8,0,0,0,4,0,0,0,8,0,0,0,13,0,0,0,7,0,0,0,22,0,0,0,22,0,0,0,13,0,0,0,170,6,0,0,4,0,0,0,80,1,0,0,132,2,0,0,184,3,0,0,86,4,0,0,10,0,0,0,2,0,0,0,19,0,0,0,4,0,0,0,28,0,0,0,6,0,0,0,33,0,0,0,4,0,0,0,36,7,0,0,4,0,0,0,104,1,0,0,188,2,0,0,252,3,0,0,176,4,0,0,8,0,0,0,4,0,0,0,22,0,0,0,3,0,0,0,8,0,0,0,26,0,0,0,12,0,0,0,28,0,0,0,129,7,0,0,3,0,0,0,134,1,0,0,216,2,0,0,26,4,0,0,236,4,0,0,3,0,0,0,10,0,0,0,3,0,0,0,23,0,0,0,4,0,0,0,31,0,0,0,11,0,0,0,31,0,0,0,3,8,0,0,3,0,0,0,164,1,0,0,16,3,0,0,116,4,0,0,70,5,0,0,7,0,0,0,7,0,0,0,21,0,0,0,7,0,0,0,1,0,0,0,37,0,0,0,19,0,0,0,26,0,0,0,137,8,0,0,3,0,0,0,194,1,0,0,44,3,0,0,176,4,0,0,160,5,0,0,5,0,0,0,10,0,0,0,19,0,0,0,10,0,0,0,15,0,0,0,25,0,0,0,23,0,0,0,25,0,0,0,19,9,0,0,3,0,0,0,224,1,0,0,100,3,0,0,10,5,0,0,250,5,0,0,13,0,0,0,3,0,0,0,2,0,0,0,29,0,0,0,42,0,0,0,1,0,0,0,23,0,0,0,28,0,0,0,161,9,0,0,3,0,0,0,254,1,0,0,156,3,0,0,70,5,0,0,84,6,0,0,17,0,0,0,0,0,0,0,10,0,0,0,23,0,0,0,10,0,0,0,35,0,0,0,19,0,0,0,35,0,0,0,51,10,0,0,3,0,0,0,28,2,0,0,212,3,0,0,160,5,0,0,174,6,0,0,17,0,0,0,1,0,0,0,14,0,0,0,21,0,0,0,29,0,0,0,19,0,0,0,11,0,0,0,46,0,0,0,201,10,0,0,3,0,0,0,58,2,0,0,12,4,0,0,250,5,0,0,8,7,0,0,13,0,0,0,6,0,0,0,14,0,0,0,23,0,0,0,44,0,0,0,7,0,0,0,59,0,0,0,1,0,0,0,60,11,0,0,0,0,0,0,58,2,0,0,40,4,0,0,54,6,0,0,98,7,0,0,12,0,0,0,7,0,0,0,12,0,0,0,26,0,0,0,39,0,0,0,14,0,0,0,22,0,0,0,41,0,0,0,218,11,0,0,0,0,0,0,88,2,0,0,96,4,0,0,144,6,0,0,188,7,0,0,6,0,0,0,14,0,0,0,6,0,0,0,34,0,0,0,46,0,0,0,10,0,0,0,2,0,0,0,64,0,0,0,124,12,0,0,0,0,0,0,118,2,0,0,180,4,0,0,234,6,0,0,52,8,0,0,17,0,0,0,4,0,0,0,29,0,0,0,14,0,0,0,49,0,0,0,10,0,0,0,24,0,0,0,46,0,0,0,34,13,0,0,0,0,0,0,148,2,0,0,236,4,0,0,68,7,0,0,172,8,0,0,4,0,0,0,18,0,0,0,13,0,0,0,32,0,0,0,48,0,0,0,14,0,0,0,42,0,0,0,32,0,0,0,204,13,0,0,0,0,0,0,208,2,0,0,36,5,0,0,158,7,0,0,6,9,0,0,20,0,0,0,4,0,0,0,40,0,0,0,7,0,0,0,43,0,0,0,22,0,0,0,10,0,0,0,67,0,0,0,122,14,0,0,0,0,0,0,238,2,0,0,92,5,0,0,248,7,0,0,126,9,0,0,19,0,0,0,6,0,0,0,18,0,0,0,31,0,0,0,34,0,0,0,34,0,0,0,20,0,0,0,61,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,254,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,255,255,255,255,255,255,255,254,255,255,255,254,255,255,255,254,255,255,255,253,255,255,255,253,255,255,255,252,255,255,255,253,255,255,255,251,255,255,255,253,255,255,255,253,255,255,255,252,255,255,255,252,255,255,255,252,255,255,255,251,255,255,255,252,255,255,255,253,255,255,255,251,255,255,255,254,255,255,255,251,255,255,255,255,255,255,255,5,0,0,0,255,255,255,255,4,0,0,0,255,255,255,255,3,0,0,0,255,255,255,255,2,0,0,0,254,255,255,255,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,3,0,0,0,255,255,255,255,2,0,0,0,254,255,255,255,2,0,0,0,253,255,255,255,2,0,0,0,252,255,255,255,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,3,0,0,0,255,255,255,255,2,0,0,0,255,255,255,255,1,0,0,0,255,255,255,255,0,0,0,0,254,255,255,255,0,0,0,0,2,0,0,0,255,255,255,255,1,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,18,0,0,0,17,0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,15,0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,13,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,36,37,42,43,45,46,47,58,0,0,0,0,0,0,0,0,107,0,0,0,0,0,0,46,46,46,46,46,46,0,0,40,96,0,0,16,96,0,0,216,95,0,0,80,95,0,0,240,94,0,0,176,94,0,0,152,94,0,0,32,94,0,0,152,93,0,0,56,93,0,0,8,93,0,0,216,92,0,0,160,92,0,0,24,92,0,0,216,91,0,0,96,91,0,0,48,91,0,0,224,90,0,0,152,90,0,0,88,90,0,0,56,90,0,0,0,0,0,0,0,87,0,0,0,0,0,0,24,84,0,0,0,0,0,0,208,85,0,0,0,0,0,0,216,98,0,0,208,98,0,0,64,68,0,0,248,53,0,0,120,38,0,0,200,33,0,0,240,29,0,0,208,25,0,0,176,21,0,0,56,18,0,0,200,98,0,0,48,96,0,0,16,93,0,0,64,90,0,0,16,83,0,0,120,79,0,0,152,76,0,0,56,74,0,0,72,71,0,0,120,69,0,0,56,68,0,0,192,66,0,0,176,65,0,0,16,64,0,0,144,62,0,0,80,61,0,0,184,59,0,0,240,57,0,0,112,56,0,0,8,55,0,0,240,53,0,0,88,51,0,0,88,48,0,0,168,46,0,0,40,44,0,0,0,43,0,0,24,42,0,0,240,40,0,0,168,39,0,0,40,39,0,0,112,38,0,0,8,38,0,0,112,37,0,0,240,36,0,0,80,36,0,0,192,35,0,0,88,35,0,0,232,34,0,0,120,34,0,0,16,34,0,0,192,33,0,0,160,33,0,0,104,33,0,0,248,32,0,0,144,32,0,0,32,32,0,0,208,31,0,0,96,31,0,0,208,30,0,0,88,30,0,0,232,29,0,0,136,29,0,0,16,29,0,0,168,28,0,0,24,28,0,0,72,27,0,0,240,26,0,0,160,26,0,0,48,26,0,0,248,25,0,0,200,25,0,0,160,25,0,0,248,24,0,0,88,24,0,0,224,23,0,0,72,23,0,0,24,23,0,0,208,22,0,0,80,22,0,0,24,22,0,0,168,21,0,0,88,21,0,0,208,20,0,0,80,20,0,0,152,19,0,0,112,19,0,0,72,19,0,0,232,18,0,0,152,18,0,0,104,18,0,0,48,18,0,0,16,18,0,0,144,17,0,0,208,16,0,0,80,16,0,0,232,15,0,0,168,15,0,0,120,15,0,0,48,15,0,0,24,15,0,0,192,98,0,0,128,98,0,0,16,98,0,0,184,97,0,0,136,97,0,0,64,97,0,0,40,97,0,0,0,97,0,0,92,94,73,0,0,0,0,0,108,49,0,0,0,0,0,0,49,49,51,49,52,49,0,0,92,39,73,0,0,0,0,0,79,48,0,0,0,0,0,0,52,49,49,51,49,49,0,0,92,96,73,0,0,0,0,0,58,32,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,67,73,82,67,85,77,70,76,69,88,95,65,67,67,69,78,84,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,52,49,49,49,49,51,0,0,92,34,69,0,0,0,0,0,79,48,108,73,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,97,98,99,100,101,102,0,0,0,0,0,0,0,49,49,52,51,49,49,0,0,46,112,112,109,46,98,122,50,0,0,0,0,0,0,0,0,92,94,69,0,0,0,0,0,35,32,99,111,110,116,101,120,116,32,99,111,114,114,101,99,116,105,111,110,32,73,108,49,32,48,79,0,0,0,0,0,49,49,52,49,49,51,0,0,92,118,123,69,125,0,0,0,98,99,100,102,103,104,106,107,108,109,110,112,113,114,115,116,118,119,120,122,66,67,68,70,71,72,74,75,76,77,78,80,81,82,83,84,86,87,88,90,0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,114,101,97,100,32,112,97,108,101,116,116,101,10,0,0,49,51,49,49,52,49,0,0,37,99,0,0,0,0,0,0,92,39,69,0,0,0,0,0,69,82,82,79,82,32,116,104,32,121,120,61,32,37,50,100,32,37,50,100,32,116,61,32,37,100,32,118,61,32,37,51,100,32,109,105,110,47,109,97,120,61,32,37,100,32,37,100,10,0,0,0,0,0,0,0,97,101,105,111,117,121,0,0,60,98,108,111,99,107,32,120,61,34,37,100,34,32,121,61,34,37,100,34,32,100,120,61,34,37,100,34,32,100,121,61,34,37,100,34,62,10,0,0,49,49,49,51,52,49,0,0,92,96,69,0,0,0,0,0,32,118,101,114,115,105,111,110,32,52,46,50,46,49,32,67,111,109,112,97,116,105,98,108,101,32,85,98,117,110,116,117,32,67,108,97,110,103,32,51,46,50,32,40,116,97,103,115,47,82,69,76,69,65,83,69,95,51,50,47,102,105,110,97,108,41,0,0,0,0,0,0,10,35,32,32,99,104,97,110,103,101,32,91,37,100,93,32,37,115,32,37,115,32,37,51,100,32,37,51,100,32,32,116,111,32,37,115,32,37,51,100,32,97,116,32,37,52,100,32,37,52,100,0,0,0,0,0,32,76,37,48,50,100,32,119,61,32,37,51,100,32,121,61,32,37,51,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,10,35,32,32,0,0,49,49,49,49,52,51,0,0,109,97,108,108,111,99,32,101,114,114,111,114,32,105,110,32,108,111,97,100,95,100,98,32,115,51,10,0,0,0,0,0,10,68,66,71,32,99,117,116,95,98,111,120,95,114,101,115,117,108,116,58,0,0,0,0,92,67,0,0,0,0,0,0,10,35,32,32,99,104,97,110,103,101,32,91,37,100,93,32,37,115,32,32,32,37,51,100,32,32,32,32,32,32,116,111,32,37,115,32,37,51,100,32,97,116,32,37,52,100,32,37,52,100,0,0,0,0,0,0,52,49,50,49,50,49,0,0,92,118,123,67,125,0,0,0,69,82,82,79,82,32,108,105,115,116,95,105,110,115,10,0,50,49,52,49,50,49,0,0,50,50,49,50,49,51,0,0,92,65,69,0,0,0,0,0,10,35,32,100,105,118,105,100,101,32,98,111,120,32,98,101,108,111,119,32,121,61,37,52,100,0,0,0,0,0,0,0,50,49,50,49,52,49,0,0,92,65,65,0,0,0,0,0,35,32,100,105,118,105,100,101,32,118,101,114,116,105,99,97,108,32,103,108,117,101,100,32,98,111,120,101,115,0,0,0,52,50,49,50,49,49,0,0,92,34,65,0,0,0,0,0,44,32,110,117,109,67,32,37,100,10,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,68,73,65,69,82,69,83,73,83,43,37,48,52,120,32,40,37,99,41,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,52,50,49,49,49,50,0,0,92,126,65,0,0,0,0,0,35,32,46,46,46,32,37,51,100,32,119,104,105,116,101,32,112,105,120,101,108,115,32,114,101,109,111,118,101,100,44,32,99,115,61,37,100,32,110,67,61,32,37,51,100,10,0,0,10,32,115,112,108,105,116,32,114,101,115,117,108,116,61,32,37,115,32,40,37,51,100,41,32,0,0,0,0,0,0,0,52,49,49,50,49,50,0,0,46,112,103,109,46,98,122,50,0,0,0,0,0,0,0,0,92,94,65,0,0,0,0,0,10,0,0,0,0,0,0,0,49,50,52,50,49,49,0,0,92,39,65,0,0,0,0,0,32,32,37,50,100,32,37,115,32,40,37,51,100,41,0,0,50,61,103,114,97,121,0,0,49,50,52,49,49,50,0,0,35,32,108,105,115,116,32,112,97,116,116,101,114,110,32,32,120,61,32,37,52,100,32,37,52,100,32,100,61,32,37,51,100,32,37,51,100,32,116,61,32,37,100,32,37,100,32,121,121,48,61,32,37,100,10,0,92,96,65,0,0,0,0,0,35,32,116,104,114,101,115,104,111,108,100,86,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,32,37,100,46,46,37,100,44,32,114,101,115,101,116,32,116,111,32,37,100,10,0,0,0,0,0,0,10,32,115,112,108,105,116,32,97,116,47,116,111,58,32,0,60,112,97,103,101,32,120,61,34,37,100,34,32,121,61,34,37,100,34,32,100,120,61,34,37,100,34,32,100,121,61,34,37,100,34,62,10,0,0,0,49,49,52,50,49,50,0,0,63,39,0,0,0,0,0,0,32,117,110,105,120,0,0,0,10,32,116,114,121,32,101,110,100,32,115,112,108,105,116,32,91,37,100,93,61,37,100,32,91,37,100,93,61,37,100,32,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,115,116,101,112,32,50,32,121,61,37,52,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,32,120,61,32,37,51,100,32,37,43,51,100,10,35,32,32,0,0,0,0,0,0,0,49,50,49,50,52,49,0,0,109,97,108,108,111,99,32,101,114,114,111,114,32,105,110,32,108,111,97,100,95,100,98,32,98,111,120,49,10,0,0,0,10,32,114,101,109,111,118,101,32,118,101,99,116,111,114,91,37,100,93,91,37,100,93,32,120,61,32,37,50,100,32,37,50,100,0,0,0,0,0,0,92,40,32,51,92,111,118,101,114,32,52,32,92,41,0,0,10,35,32,32,99,101,114,116,97,105,110,116,121,32,37,100,32,32,108,105,109,105,116,61,32,37,100,32,32,99,98,101,115,116,61,32,37,100,32,0,49,50,49,49,52,50,0,0,92,40,32,49,92,111,118,101,114,32,50,32,92,41,0,0,10,35,32,116,114,121,32,116,111,32,115,112,108,105,116,44,32,110,101,119,98,111,120,91,37,100,93,46,120,61,32,37,50,100,32,46,46,46,32,37,50,100,32,100,121,61,32,37,100,32,0,0,0,0,0,0,49,49,49,50,52,50,0,0,49,51,50,50,49,50,0,0,92,40,32,49,92,111,118,101,114,32,52,32,92,41,0,0,10,35,32,116,101,115,116,32,105,102,32,116,111,32,115,112,108,105,116,32,97,116,32,120,37,100,61,32,37,50,100,32,37,50,100,32,37,50,100,32,98,111,119,44,40,109,97,120,45,109,105,110,41,91,105,44,48,44,49,93,32,37,100,32,37,51,100,32,37,51,100,32,37,51,100,0,0,0,0,0,49,51,52,49,49,49,0,0,92,102,114,113,113,123,125,0,10,35,10,35,32,100,105,118,105,100,101,32,98,111,120,58,32,37,52,100,32,37,52,100,32,37,51,100,32,37,51,100,10,0,0,0,0,0,0,0,50,52,49,49,49,50,0,0,36,94,123,92,117,110,100,101,114,98,97,114,123,111,125,125,36,0,0,0,0,0,0,0,35,32,116,114,121,32,116,111,32,100,105,118,105,100,101,32,117,110,107,110,111,119,110,32,99,104,97,114,115,32,33,40,109,111,100,101,38,49,54,41,0,0,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,71,82,65,86,69,95,65,67,67,69,78,84,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,0,52,49,51,49,49,49,0,0,36,94,123,49,125,36,0,0,32,37,51,100,32,99,108,117,115,116,101,114,32,114,101,109,111,118,101,100,44,32,110,67,61,32,37,51,100,10,0,0,32,45,32,102,111,117,110,100,32,37,100,32,40,110,67,61,37,100,41,10,0,0,0,0,50,50,49,49,49,52,0,0,46,112,98,109,46,98,122,50,0,0,0,0,0,0,0,0,92,44,0,0,0,0,0,0,32,119,61,32,37,51,100,37,37,0,0,0,0,0,0,0,50,52,49,50,49,49,0,0,36,92,99,100,111,116,36,0,10,35,32,32,76,37,48,50,100,32,120,121,61,32,37,52,100,32,37,52,100,32,98,101,115,116,32,102,105,116,32,119,97,115,32,37,48,52,120,61,37,99,32,100,105,115,116,61,37,51,100,37,37,32,105,61,37,100,0,0,0,0,0,0,10,35,68,69,66,85,71,58,32,84,104,101,114,101,32,105,115,32,115,111,109,101,116,104,105,110,103,32,119,114,111,110,103,32,119,105,116,104,32,116,101,115,116,97,99,40,41,33,0,0,0,0,0,0,0,0,49,61,99,111,108,111,114,47,98,119,0,0,0,0,0,0,49,52,50,50,49,49,0,0,10,0,0,0,0,0,0,0,92,80,0,0,0,0,0,0,35,32,116,104,114,101,115,104,111,108,100,58,32,105,110,118,101,114,116,32,116,104,101,32,105,109,97,103,101,10,0,0,99,111,109,112,97,114,101,95,99,104,97,114,115,0,0,0,35,32,87,97,114,110,105,110,103,58,32,110,111,110,45,112,111,115,105,116,105,118,101,32,109,101,100,105,97,110,32,108,105,110,101,32,103,97,112,32,111,102,32,37,100,10,0,0,49,52,50,49,49,50,0,0,36,92,109,117,36,0,0,0,46,37,100,0,0,0,0,0,35,32,116,114,121,32,116,111,32,99,111,109,112,97,114,101,32,117,110,107,110,111,119,110,32,119,105,116,104,32,107,110,111,119,110,32,99,104,97,114,115,32,33,40,109,111,100,101,38,56,41,0,0,0,0,0,32,76,37,48,50,100,32,115,116,101,112,32,49,32,121,61,37,52,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,32,120,61,32,37,51,100,32,37,43,51,100,32,109,121,61,37,50,100,32,99,104,97,114,115,61,37,51,100,10,35,32,32,0,0,0,0,0,0,49,50,50,52,49,49,0,0,10,100,97,116,97,98,97,115,101,32,101,114,114,111,114,58,32,114,101,97,100,112,103,109,32,37,115,10,0,0,0,0,10,32,99,104,101,99,107,32,99,117,116,116,105,110,103,32,118,101,99,116,111,114,115,32,111,110,32,102,114,97,109,101,32,37,100,0,0,0,0,0,92,40,32,92,112,114,105,109,101,32,92,41,0,0,0,0,32,37,100,32,111,102,32,37,100,32,99,104,97,114,115,32,117,110,105,100,101,110,116,105,102,105,101,100,10,0,0,0,35,32,87,97,114,110,105,110,103,32,99,111,109,112,111,115,101,32,37,48,52,120,32,43,32,37,48,52,120,62,49,50,55,10,0,0,0,0,0,0,49,50,50,49,49,52,0,0,36,94,123,51,125,36,0,0,10,35,32,99,111,100,101,61,32,37,48,52,108,120,32,37,99,0,0,0,0,0,0,0,49,49,50,52,49,50,0,0,49,50,50,51,49,50,0,0,36,94,123,50,125,36,0,0,99,104,97,114,95,114,101,99,111,103,110,105,116,105,111,110,0,0,0,0,0,0,0,0,49,49,50,50,49,52,0,0,36,92,112,109,36,0,0,0,32,117,110,107,110,111,119,110,61,32,37,100,32,112,105,99,116,115,61,32,37,100,32,98,111,120,101,115,61,32,37,100,10,35,32,0,0,0,0,0,49,52,49,50,50,49,0,0,36,94,123,111,125,36,0,0,35,32,99,104,97,114,32,114,101,99,111,103,110,105,116,105,111,110,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,84,73,76,68,69,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,35,32,114,101,109,111,118,101,46,99,32,114,101,109,111,118,101,95,100,117,115,116,40,41,58,0,0,0,0,0,0,0,49,52,49,49,50,50,0,0,92,116,101,120,116,97,115,99,105,105,109,97,99,114,111,110,0,0,0,0,0,0,0,0,32,104,105,115,116,111,61,37,100,44,37,100,40,63,61,37,100,41,44,37,100,40,63,61,37,100,41,44,46,46,46,10,35,32,46,46,46,0,0,0,32,111,107,10,0,0,0,0,49,50,49,52,50,49,0,0,98,122,105,112,50,32,45,99,100,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,92,116,101,120,116,114,101,103,105,115,116,101,114,101,100,0,32,110,111,32,37,100,32,99,104,97,114,32,37,52,100,32,37,53,100,32,116,105,109,101,115,32,115,117,109,61,37,100,10,0,0,0,0,0,0,0,49,50,49,49,50,52,0,0,92,45,0,0,0,0,0,0,32,110,111,32,37,100,32,99,104,97,114,32,37,52,100,32,37,53,100,32,116,105,109,101,115,32,109,97,120,100,105,115,116,61,37,100,10,0,0,0,10,68,66,71,32,37,115,32,115,101,116,97,99,32,40,37,100,44,37,100,41,58,32,99,111,109,112,111,115,101,32,119,97,115,32,117,115,101,108,101,115,115,44,32,119,97,99,61,37,100,0,0,0,0,0,0,35,32,80,67,88,32,118,101,114,115,105,111,110,61,37,100,32,98,105,116,115,61,37,100,32,120,61,37,100,32,121,61,37,100,32,72,82,101,115,61,37,100,32,86,82,101,115,61,37,100,10,35,32,78,80,108,97,110,101,115,61,37,100,32,66,121,116,101,115,80,101,114,76,105,110,101,61,37,100,32,80,97,108,101,116,116,101,61,37,115,0,0,0,0,0,0,49,49,49,52,50,50,0,0,32,37,115,40,37,100,41,0,36,92,108,110,111,116,36,0,35,32,116,104,114,101,115,104,111,108,100,58,32,86,97,108,117,101,32,61,32,37,100,32,103,109,105,110,61,37,100,32,103,109,97,120,61,37,100,32,99,109,97,120,61,37,100,32,98,47,119,61,32,37,100,32,37,100,10,0,0,0,0,0,32,37,100,32,100,105,102,102,101,114,101,110,116,32,99,104,97,114,115,0,0,0,0,0,35,32,115,116,111,114,101,32,98,111,120,116,114,101,101,32,116,111,32,108,105,110,101,115,32,46,46,46,0,0,0,0,49,49,49,50,50,52,0,0,92,102,108,113,113,123,125,0,32,71,78,85,67,45,37,100,0,0,0,0,0,0,0,0,13,35,32,112,97,99,107,105,110,103,32,37,53,100,0,0,32,115,101,116,32,109,51,61,32,37,51,100,32,37,43,51,100,32,121,121,61,32,37,100,32,32,114,101,97,115,111,110,50,32,120,121,61,32,37,52,100,32,37,52,100,10,35,32,32,0,0,0,0,0,0,0,52,51,49,49,49,49,0,0,109,97,108,108,111,99,32,101,114,114,111,114,32,105,110,32,108,111,97,100,95,100,98,32,112,105,120,10,0,0,0,0,32,114,101,109,111,118,101,32,102,114,97,109,101,32,37,100,0,0,0,0,0,0,0,0,36,94,123,92,117,110,100,101,114,98,97,114,123,97,125,125,36,0,0,0,0,0,0,0,80,52,10,37,100,32,37,100,10,0,0,0,0,0,0,0,35,32,112,97,99,107,105,110,103,0,0,0,0,0,0,0,50,50,49,52,49,49,0,0,92,99,111,112,121,114,105,103,104,116,0,0,0,0,0,0,80,54,10,37,100,32,37,100,10,50,53,53,10,0,0,0,32,106,111,105,110,101,100,58,32,37,51,100,32,102,114,97,103,109,101,110,116,115,32,40,102,111,117,110,100,32,37,51,100,41,44,32,37,51,100,32,114,101,115,116,44,32,110,67,61,32,37,100,10,0,0,0,51,49,52,49,49,49,0,0,49,50,50,50,49,51,0,0,34,0,0,0,0,0,0,0,112,111,112,101,110,32,103,122,105,112,32,45,99,10,0,0,32,106,111,105,110,32,111,98,106,101,99,116,115,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,43,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,110,104,10,35,32,46,46,46,0,0,0,0,46,112,110,109,46,103,122,0,51,51,50,49,49,49,0,0,92,83,0,0,0,0,0,0,103,122,105,112,32,45,99,32,62,32,0,0,0,0,0,0,32,106,111,105,110,32,111,98,106,101,99,116,115,32,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,43,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,119,39,75,39,10,35,32,46,46,46,0,105,32,62,61,32,48,32,38,38,32,105,32,60,61,32,57,0,0,0,0,0,0,0,0,51,49,50,51,49,49,0,0,92,116,101,120,116,98,114,111,107,101,110,98,97,114,0,0,112,111,112,101,110,32,112,110,109,116,111,112,110,103,10,0,32,106,111,105,110,32,111,98,106,101,99,116,115,32,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,43,32,37,51,100,32,37,51,100,32,37,43,52,100,32,37,43,52,100,32,37,115,10,35,32,46,46,46,0,0,0,32,67,79,77,80,79,83,69,58,32,67,69,68,73,76,76,65,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,51,49,50,49,49,51,0,0,92,116,101,120,116,121,101,110,0,0,0,0,0,0,0,0,35,32,32,114,101,109,111,118,101,32,100,117,115,116,32,111,102,32,115,105,122,101,32,37,50,100,0,0,0,0,0,0,119,0,0,0,0,0,0,0,35,32,103,108,117,101,32,98,114,111,107,101,110,32,99,104,97,114,115,32,110,67,61,32,37,100,32,97,118,88,61,32,37,100,10,35,32,46,46,46,0,0,0,0,0,0,0,0,51,51,49,49,50,49,0,0,46,112,110,109,46,98,122,50,0,0,0,0,0,0,0,0,92,116,101,120,116,99,117,114,114,101,110,99,121,0,0,0,112,110,109,116,111,112,110,103,32,62,32,0,0,0,0,0,103,108,117,101,95,98,114,111,107,101,110,95,99,104,97,114,115,0,0,0,0,0,0,0,51,49,49,51,50,49,0,0,92,101,117,114,111,0,0,0,46,112,112,109,0,0,0,0,39,39,44,44,0,0,0,0,10,68,66,71,58,32,115,101,116,97,99,40,48,41,32,109,97,107,101,115,32,110,111,32,115,101,110,115,101,33,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,111,110,108,121,32,49,32,111,114,32,56,32,98,105,116,115,32,115,117,112,112,111,114,116,101,100,10,0,0,0,0,51,49,49,49,50,51,0,0,10,35,32,108,105,115,116,32,98,111,120,32,99,104,97,114,58,32,0,0,0,0,0,0,92,112,111,117,110,100,115,0,35,32,116,104,114,101,115,104,111,108,100,58,32,86,97,108,117,101,60,61,103,109,105,110,10,0,0,0,0,0,0,0,119,114,105,116,101,10,0,0,61,58,59,0,0,0,0,0,109,97,108,108,111,99,32,102,97,105,108,101,100,33,10,0,50,49,51,49,51,49,0,0,92,116,101,120,116,99,101,110,116,0,0,0,0,0,0,0,35,32,99,111,109,112,105,108,101,100,58,32,68,101,99,32,51,48,32,50,48,49,51,0,33,63,59,37,0,0,0,0,32,115,101,116,32,109,51,61,32,37,51,100,32,37,43,51,100,32,121,121,61,32,37,100,32,32,114,101,97,115,111,110,49,32,120,121,61,32,37,52,100,32,37,52,100,10,35,32,32,0,0,0,0,0,0,0,50,49,51,51,49,49,0,0,32,9,0,0,0,0,0,0,105,110,49,43,111,117,116,50,61,32,37,100,0,0,0,0,33,39,0,0,0,0,0,0,111,112,101,110,10,0,0,0,34,65,34,85,105,106,37,0,50,49,51,49,49,51,0,0,92,94,123,125,0,0,0,0,119,98,0,0,0,0,0,0,110,111,0,0,0,0,0,0,50,51,49,49,51,49,0,0,49,51,49,50,50,50,0,0,92,126,123,125,0,0,0,0,35,32,80,78,77,32,69,79,70,10,0,0,0,0,0,0,32,106,111,105,110,101,100,58,32,37,51,100,32,104,111,108,101,115,44,32,37,51,100,32,115,97,109,101,44,32,110,67,61,32,37,100,10,0,0,0,50,49,49,51,51,49,0,0,92,116,101,120,116,98,97,99,107,115,108,97,115,104,0,0,10,0,0,0,0,0,0,0,32,106,111,105,110,32,104,111,108,101,32,37,52,100,32,37,52,100,32,37,43,52,100,32,37,43,52,100,32,37,43,54,100,32,43,32,37,52,100,32,37,52,100,32,37,43,52,100,32,37,43,52,100,32,37,43,54,100,32,37,100,10,35,32,46,46,46,0,0,0,0,0,51,49,51,49,50,49,0,0,92,125,0,0,0,0,0,0,32,109,105,110,61,37,100,32,109,97,120,61,37,100,0,0,35,32,103,108,117,101,32,104,111,108,101,115,32,116,111,32,99,104,97,114,115,32,110,67,61,32,37,100,10,35,32,46,46,46,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,67,65,82,79,78,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,49,51,51,49,50,49,0,0,92,123,0,0,0,0,0,0,10,35,32,32,97,117,116,111,32,100,117,115,116,32,115,105,122,101,32,61,32,37,100,32,110,67,61,32,37,51,100,32,46,46,32,37,51,100,32,97,118,68,61,32,37,50,100,32,37,50,100,32,46,46,32,37,50,100,32,37,50,100,10,0,114,101,97,100,10,0,0,0,103,108,117,101,95,104,111,108,101,115,95,105,110,115,105,100,101,95,99,104,97,114,115,0,49,49,51,51,50,49,0,0,46,112,112,109,46,103,122,0,92,95,0,0,0,0,0,0,117,110,101,120,112,101,99,116,101,100,32,99,104,97,114,10,0,0,0,0,0,0,0,0,32,37,51,100,32,115,117,98,98,111,120,101,115,32,99,111,117,110,116,101,100,32,40,109,105,110,105,61,37,100,44,32,115,97,109,101,61,37,100,41,32,110,67,61,32,37,100,10,0,0,0,0,0,0,0,0,49,49,51,49,50,51,0,0,92,35,0,0,0,0,0,0,32,69,82,82,79,82,32,114,101,97,100,105,110,103,32,97,116,32,104,101,97,100,43,51,42,37,100,42,37,100,10,0,99,111,117,110,116,95,115,117,98,98,111,120,101,115,0,0,10,68,66,71,58,32,84,104,105,115,32,105,115,32,97,32,98,97,100,32,99,97,108,108,32,116,111,32,115,101,116,97,99,40,41,33,0,0,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,117,110,107,110,111,119,110,32,99,111,100,105,110,103,10,0,0,0,0,0,0,0,0,49,51,50,49,51,49,0,0,32,35,37,48,50,100,32,37,50,100,32,37,50,100,0,0,92,37,0,0,0,0,0,0,35,32,116,104,114,101,115,104,111,108,100,58,32,86,97,108,117,101,32,62,103,109,97,120,10,0,0,0,0,0,0,0,32,69,82,82,79,82,32,114,101,97,100,105,110,103,32,97,116,32,104,101,97,100,43,37,100,42,37,100,10,0,0,0,35,32,99,111,117,110,116,32,115,117,98,98,111,120,101,115,10,35,32,46,46,46,0,0,35,32,77,105,110,105,109,117,109,32,97,100,106,117,115,116,101,100,32,120,58,32,37,100,32,40,109,105,110,95,105,110,100,101,110,116,41,10,0,0,49,49,50,51,51,49,0,0,92,38,0,0,0,0,0,0,46,112,99,120,0,0,0,0,109,101,109,111,114,121,32,102,97,105,108,101,100,10,0,0,112,114,111,112,111,114,116,105,111,110,97,108,0,0,0,0,32,115,101,116,32,109,52,61,32,37,51,100,32,37,43,51,100,32,121,121,61,32,37,100,32,32,114,101,97,115,111,110,49,32,120,121,61,32,37,52,100,32,37,52,100,10,35,32,32,0,0,0,0,0,0,0,32,37,100,32,45,32,98,111,120,101,115,32,37,100,10,0,49,49,50,49,51,51,0,0,32,9,44,59,0,0,0,0,45,45,0,0,0,0,0,0,10,32,99,104,101,99,107,105,110,103,32,102,114,97,109,101,32,37,100,32,0,0,0,0,92,36,0,0,0,0,0,0,69,114,114,111,114,32,105,110,116,101,103,101,114,32,111,118,101,114,102,108,111,119,10,0,109,111,110,111,115,112,97,99,101,100,0,0,0,0,0,0,35,32,100,101,116,101,99,116,46,99,32,76,37,100,32,112,105,99,116,117,114,101,115,44,32,102,114,97,109,101,115,44,32,109,88,109,89,61,32,37,100,32,37,100,32,46,46,46,32,0,0,0,0,0,0,0,50,51,49,51,49,49,0,0,92,99,111,100,101,40,37,48,52,120,41,0,0,0,0,0,32,80,66,77,50,80,71,77,32,110,120,32,37,100,0,0,32,111,118,101,114,97,108,108,32,115,112,97,99,101,32,119,105,100,116,104,32,105,115,32,37,100,32,37,115,10,0,0,35,32,100,101,116,101,99,116,46,99,32,76,37,100,32,87,97,114,110,105,110,103,58,32,110,117,109,67,61,48,10,0,50,51,49,49,49,51,0,0,49,50,49,51,50,50,0,0,114,98,0,0,0,0,0,0,95,0,0,0,0,0,0,0,35,32,80,78,77,32,80,37,99,32,104,42,119,61,37,100,42,37,100,32,99,61,37,100,32,104,101,97,100,61,37,108,100,0,0,0,0,0,0,0,32,76,37,48,50,100,32,114,101,115,117,108,116,58,32,109,111,110,111,61,37,100,32,32,100,105,115,116,97,110,99,101,32,62,61,32,37,100,32,99,111,110,115,105,100,101,114,101,100,32,97,115,32,115,112,97,99,101,10,35,32,46,46,46,0,0,0,0,0,0,0,0,35,32,97,118,101,114,97,103,101,115,58,32,109,88,109,89,61,32,37,100,32,37,100,32,110,67,61,32,37,100,32,110,61,32,37,100,10,0,0,0,50,49,49,51,49,51,0,0,115,116,0,0,0,0,0,0,117,110,101,120,112,101,99,116,101,100,32,99,104,97,114,97,99,116,101,114,10,0,0,0,32,76,37,48,50,100,32,112,114,111,112,58,32,110,117,109,61,37,51,100,32,109,105,110,61,37,51,100,32,109,97,120,61,37,51,100,32,112,105,116,99,104,61,37,51,100,32,64,32,37,50,100,37,37,10,35,32,46,46,46,0,0,0,0,10,35,32,32,99,104,97,110,103,101,100,95,99,104,97,114,115,61,32,37,100,10,0,0,49,51,50,51,49,49,0,0,102,102,108,0,0,0,0,0,10,35,32,108,105,115,116,32,98,111,120,32,32,32,32,32,32,120,61,32,37,52,100,32,37,52,100,32,100,61,32,37,51,100,32,37,51,100,32,114,61,32,37,51,100,32,37,51,100,32,110,114,117,110,61,37,100,32,112,61,37,112,0,0,10,114,101,97,100,45,80,78,77,45,101,114,114,111,114,58].concat([32,98,97,100,32,109,97,103,105,99,32,98,121,116,101,115,44,32,101,120,112,101,99,116,32,48,120,53,48,32,48,120,51,91,49,45,54,93,32,98,117,116,32,103,111,116,32,48,120,37,48,50,120,32,48,120,37,48,50,120,0,0,0,0,32,76,37,48,50,100,32,109,111,110,111,58,32,110,117,109,61,37,51,100,32,109,105,110,61,37,51,100,32,109,97,120,61,37,51,100,32,112,105,116,99,104,61,37,51,100,10,35,32,46,46,46,0,0,0,0,99,67,111,79,112,80,115,83,117,85,118,86,119,87,120,88,121,89,122,90,0,0,0,0,32,103,111,116,32,32,99,104,97,114,61,32,37,99,32,32,49,54,98,105,116,61,32,48,120,37,48,52,120,32,32,115,116,114,105,110,103,61,32,34,37,115,34,10,0,0,0,0,32,67,79,77,80,79,83,69,58,32,66,82,69,86,69,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,49,51,50,49,49,51,0,0,102,102,105,0,0,0,0,0,32,98,114,101,97,107,0,0,35,32,116,104,114,101,115,104,111,108,100,58,32,109,97,120,95,99,111,110,116,114,97,115,116,61,32,37,100,10,0,0,10,114,101,97,100,45,80,78,77,45,101,114,114,111,114,58,32,102,105,108,101,32,110,117,109,98,101,114,32,105,115,32,37,50,100,44,32,112,111,115,105,116,105,111,110,32,37,108,100,0,0,0,0,0,0,0,32,112,114,111,103,114,101,115,115,32,37,115,32,37,53,100,32,47,32,37,100,32,32,116,105,109,101,91,115,93,32,37,53,100,32,47,32,37,53,100,32,32,40,115,107,105,112,61,37,100,41,37,99,0,0,0,32,76,37,48,50,100,32,109,97,120,100,105,102,102,61,37,100,32,109,105,110,95,115,97,109,101,100,105,102,102,115,61,37,100,0,0,0,0,0,0,10,35,32,32,108,105,110,101,61,32,37,51,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,32,32,110,61,32,37,50,100,32,37,50,100,32,37,50,100,32,37,50,100,32,32,119,61,32,37,51,100,32,100,105,102,102,61,32,37,100,0,0,0,0,0,0,0,0,10,35,0,0,0,0,0,0,49,49,50,51,49,51,0,0,46,112,103,109,46,103,122,0,116,114,101,101,91,110,93,32,61,61,32,48,32,124,124,32,116,114,101,101,91,110,93,32,61,61,32,49,32,124,124,32,116,114,101,101,91,110,93,32,61,61,32,50,0,0,0,0,69,114,114,111,114,32,105,110,32,111,99,114,48,46,99,32,76,37,100,58,32,105,100,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,102,108,0,0,0,0,0,0,117,110,101,120,112,101,99,116,101,100,32,69,79,70,10,0,32,60,45,32,112,100,105,115,116,91,37,100,93,32,115,111,114,116,101,100,10,35,32,46,46,46,0,0,0,0,0,0,32,109,105,114,114,111,114,58,32,32,104,116,116,112,58,47,47,119,119,119,45,101,46,117,110,105,45,109,97,103,100,101,98,117,114,103,46,100,101,47,106,115,99,104,117,108,101,110,47,111,99,114,47,10,0,0,103,113,0,0,0,0,0,0,32,37,48,50,120,0,0,0,49,51,49,51,50,49,0,0,102,105,0,0,0,0,0,0,111,112,101,110,105,110,103,32,112,105,112,101,32,37,115,10,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,98,101,115,116,95,112,61,37,51,100,32,110,105,95,109,105,110,61,37,51,100,10,35,32,46,46,46,0,0,0,0,0,0,32,119,101,98,112,97,103,101,58,32,104,116,116,112,58,47,47,106,111,99,114,46,115,111,117,114,99,101,102,111,114,103,101,46,110,101,116,47,32,40,109,97,121,32,111,117,116,32,111,102,32,100,97,116,101,41,10,0,0,0,0,0,0,0,98,100,104,107,108,65,66,68,69,70,71,72,73,75,76,77,78,82,84,49,50,51,52,54,55,56,57,0,0,0,0,0,10,35,32,102,103,101,116,115,32,91,37,100,93,58,0,0,10,68,66,71,58,32,115,101,116,97,115,40,34,34,41,32,109,97,107,101,115,32,110,111,32,115,101,110,115,101,33,32,120,61,32,37,100,32,37,100,0,0,0,0,0,0,0,0,32,114,101,97,108,108,111,99,32,102,97,105,108,101,100,33,32,97,98,111,114,116,10,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,110,111,32,90,83,111,102,116,32,115,105,103,110,10,0,49,51,49,49,50,51,0,0,10,35,32,32,102,114,97,109,101,32,37,100,32,40,37,43,52,100,44,37,51,100,44,37,50,100,41,32,0,0,0,0,102,102,0,0,0,0,0,0,35,32,116,104,114,101,115,104,111,108,100,58,32,37,51,100,32,37,54,100,32,37,54,100,32,37,56,46,51,102,32,37,52,100,10,0,0,0,0,0,114,0,0,0,0,0,0,0,40,48,120,37,48,50,120,41,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,98,101,115,116,95,112,61,32,37,51,100,32,43,32,109,97,120,100,105,102,102,61,37,51,100,10,35,32,46,46,46,0,0,40,48,120,37,48,52,120,41,0,0,0,0,0,0,0,0,32,101,120,97,109,112,108,101,115,58,10,9,103,111,99,114,32,45,109,32,52,32,116,101,120,116,49,46,112,98,109,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,35,32,100,111,32,108,97,121,111,117,116,32,97,110,97,108,121,122,105,115,10,9,103,111,99,114,32,45,109,32,49,51,48,32,45,112,32,46,47,100,97,116,97,98,97,115,101,47,32,116,101,120,116,49,46,112,98,109,32,32,35,32,101,120,116,101,110,100,32,100,97,116,97,98,97,115,101,10,9,100,106,112,101,103,32,45,112,110,109,32,45,103,114,97,121,32,116,101,120,116,46,106,112,103,32,124,32,103,111,99,114,32,45,32,32,32,32,35,32,117,115,101,32,106,112,101,103,45,102,105,108,101,32,118,105,97,32,112,105,112,101,10,10,0,0,0,0,0,0,0,40,63,41,0,0,0,0,0,97,101,109,110,114,0,0,0,84,104,101,32,97,98,111,118,101,32,112,97,116,116,101,114,110,32,119,97,115,32,110,111,116,32,114,101,99,111,103,110,105,122,101,100,46,10,69,110,116,101,114,32,85,84,70,56,32,99,104,97,114,32,111,114,32,115,116,114,105,110,103,32,102,111,114,32,97,98,111,118,101,32,112,97,116,116,101,114,110,46,32,76,101,97,118,101,32,101,109,112,116,121,32,105,102,32,117,110,115,117,114,101,46,10,80,114,101,115,115,32,82,69,84,32,97,116,32,116,104,101,32,101,110,100,32,40,65,76,84,43,82,69,84,32,116,111,32,115,116,111,114,101,32,105,110,116,111,32,82,65,77,32,111,110,108,121,41,32,58,32,0,0,0,0,0,0,38,35,120,37,48,51,120,59,0,0,0,0,0,0,0,0,35,32,76,105,110,101,32,37,50,100,44,32,117,110,97,100,106,117,115,116,101,100,32,120,121,32,37,51,100,32,37,51,100,44,32,97,100,106,117,115,116,101,100,32,120,32,37,50,100,10,0,0,0,0,0,0,38,35,37,117,59,0,0,0,38,101,117,114,111,59,0,0,49,49,49,51,50,51,0,0,38,122,99,97,114,111,110,59,0,0,0,0,0,0,0,0,38,121,117,109,108,59,0,0,69,85,82,0,0,0,0,0,69,108,97,112,115,101,100,32,116,105,109,101,58,32,37,100,58,37,48,50,100,58,37,51,46,51,102,46,10,0,0,0,38,116,104,111,114,110,59,0,35,32,112,111,112,101,110,40,32,37,115,32,41,10,0,0,38,121,97,99,117,116,101,59,0,0,0,0,0,0,0,0,38,117,117,109,108,59,0,0,32,60,45,32,112,100,105,115,116,91,37,100,93,10,35,32,46,46,46,0,0,0,0,0,38,117,99,105,114,99,59,0,32,45,97,32,110,117,109,32,32,32,32,45,32,118,97,108,117,101,32,111,102,32,99,101,114,116,97,105,110,116,121,32,40,105,110,32,112,101,114,99,101,110,116,44,32,48,46,46,49,48,48,44,32,100,101,102,97,117,108,116,61,57,53,41,10,32,45,117,32,115,116,114,105,110,103,32,45,32,111,117,116,112,117,116,32,116,104,105,115,32,115,116,114,105,110,103,32,102,111,114,32,101,118,101,114,121,32,117,110,114,101,99,111,103,110,105,122,101,100,32,99,104,97,114,97,99,116,101,114,10,0,0,0,0,0,0,38,117,97,99,117,116,101,59,0,0,0,0,0,0,0,0,32,115,101,116,32,109,50,61,32,37,51,100,32,37,43,51,100,32,121,121,61,32,37,100,32,32,114,101,97,115,111,110,49,32,120,121,61,32,37,52,100,32,37,52,100,10,35,32,32,0,0,0,0,0,0,0,32,109,97,108,108,111,99,32,102,97,105,108,101,100,10,0,108,49,124,73,48,79,0,0,38,117,103,114,97,118,101,59,0,0,0,0,0,0,0,0,38,115,99,97,114,111,110,59,0,0,0,0,0,0,0,0,38,111,115,108,97,115,104,59,0,0,0,0,0,0,0,0,50,51,50,49,50,49,0,0,32,68,66,32,37,115,32,110,111,116,32,102,111,117,110,100,10,0,0,0,0,0,0,0,38,100,105,118,105,100,101,59,0,0,0,0,0,0,0,0,38,111,117,109,108,59,0,0,10,32,99,117,116,32,98,111,120,32,120,61,32,37,51,100,32,37,51,100,0,0,0,0,62,0,0,0,0,0,0,0,32,37,51,100,32,43,32,37,51,100,32,98,111,120,101,115,32,100,101,108,101,116,101,100,44,32,110,67,61,32,37,100,32,63,10,0,0,0,0,0,38,111,116,105,108,100,101,59,0,0,0,0,0,0,0,0,37,115,32,34,37,115,34,0,38,111,99,105,114,99,59,0,38,111,97,99,117,116,101,59,0,0,0,0,0,0,0,0,10,35,66,85,71,58,32,97,112,112,101,110,100,105,110,103,32,48,32,116,111,32,97,32,108,105,110,101,32,109,97,107,101,115,32,110,111,32,115,101,110,115,101,33,0,0,0,0,32,37,50,100,0,0,0,0,38,111,103,114,97,118,101,59,0,0,0,0,0,0,0,0,32,45,102,32,102,109,116,32,32,32,32,45,32,111,117,116,112,117,116,32,102,111,114,109,97,116,32,40,73,83,79,56,56,53,57,95,49,32,84,101,88,32,72,84,77,76,32,88,77,76,32,85,84,70,56,32,65,83,67,73,73,41,10,32,45,108,32,110,117,109,32,32,32,32,45,32,116,104,114,101,115,104,111,108,100,32,103,114,101,121,32,108,101,118,101,108,32,48,60,49,54,48,60,61,50,53,53,32,40,48,32,61,32,97,117,116,111,100,101,116,101,99,116,41,10,32,45,100,32,110,117,109,32,32,32,32,45,32,100,117,115,116,95,115,105,122,101,32,40,114,101,109,111,118,101,32,115,109,97,108,108,32,99,108,117,115,116,101,114,115,44,32,45,49,32,61,32,97,117,116,111,100,101,116,101,99,116,41,10,32,45,115,32,110,117,109,32,32,32,32,45,32,115,112,97,99,101,119,105,100,116,104,47,100,111,116,115,32,40,48,32,61,32,97,117,116,111,100,101,116,101,99,116,41,10,32,45,118,32,110,117,109,32,32,32,32,45,32,118,101,114,98,111,115,101,32,40,115,101,101,32,109,97,110,117,97,108,32,112,97,103,101,41,10,32,45,99,32,115,116,114,105,110,103,32,45,32,108,105,115,116,32,111,102,32,99,104,97,114,115,32,40,100,101,98,117,103,103,105,110,103,44,32,115,101,101,32,109,97,110,117,97,108,41,10,32,45,67,32,115,116,114,105,110,103,32,45,32,99,104,97,114,32,102,105,108,116,101,114,32,40,101,120,46,32,104,101,120,100,105,103,105,116,115,58,32,48,45,57,65,45,70,120,44,32,111,110,108,121,32,65,83,67,73,73,41,10,32,45,109,32,110,117,109,32,32,32,32,45,32,111,112,101,114,97,116,105,111,110,32,109,111,100,101,115,32,40,98,105,116,112,97,116,116,101,114,110,44,32,115,101,101,32,109,97,110,117,97,108,41,10,0,0,0,0,0,0,0,38,110,116,105,108,100,101,59,0,0,0,0,0,0,0,0,35,32,100,101,116,101,99,116,46,99,32,97,100,106,117,115,116,95,116,101,120,116,95,108,105,110,101,115,40,41,32,0,38,101,116,104,59,0,0,0,38,105,117,109,108,59,0,0,38,105,99,105,114,99,59,0,50,49,50,51,50,49,0,0,38,105,97,99,117,116,101,59,0,0,0,0,0,0,0,0,38,105,103,114,97,118,101,59,0,0,0,0,0,0,0,0,38,101,117,109,108,59,0,0,60,0,0,0,0,0,0,0,10,35,32,32,114,101,109,111,118,101,50,32,37,51,100,32,37,51,100,32,0,0,0,0,45,0,0,0,0,0,0,0,111,112,101,110,105,110,103,32,102,105,108,101,32,37,115,10,0,0,0,0,0,0,0,0,38,101,99,105,114,99,59,0,38,101,99,97,114,111,110,59,0,0,0,0,0,0,0,0,10,35,32,46,46,46,0,0,38,101,97,99,117,116,101,59,0,0,0,0,0,0,0,0,32,117,115,105,110,103,58,32,103,111,99,114,32,91,111,112,116,105,111,110,115,93,32,112,110,109,95,102,105,108,101,95,110,97,109,101,32,32,35,32,117,115,101,32,45,32,102,111,114,32,115,116,100,105,110,10,32,111,112,116,105,111,110,115,32,40,115,101,101,32,103,111,99,114,32,109,97,110,117,97,108,32,112,97,103,101,115,32,102,111,114,32,109,111,114,101,32,100,101,116,97,105,108,115,41,58,10,32,45,104,44,32,45,45,104,101,108,112,10,32,45,105,32,110,97,109,101,32,32,32,45,32,105,110,112,117,116,32,105,109,97,103,101,32,102,105,108,101,32,40,112,110,109,44,112,103,109,44,112,98,109,44,112,112,109,44,112,99,120,44,46,46,46,41,10,32,45,111,32,110,97,109,101,32,32,32,45,32,111,117,116,112,117,116,32,102,105,108,101,32,32,40,114,101,100,105,114,101,99,116,105,111,110,32,111,102,32,115,116,100,111,117,116,41,10,32,45,101,32,110,97,109,101,32,32,32,45,32,108,111,103,103,105,110,103,32,102,105,108,101,32,40,114,101,100,105,114,101,99,116,105,111,110,32,111,102,32,115,116,100,101,114,114,41,10,32,45,120,32,110,97,109,101,32,32,32,45,32,112,114,111,103,114,101,115,115,32,111,117,116,112,117,116,32,116,111,32,102,105,102,111,32,40,115,101,101,32,109,97,110,117,97,108,41,10,32,45,112,32,110,97,109,101,32,32,32,45,32,100,97,116,97,98,97,115,101,32,112,97,116,104,32,105,110,99,108,117,100,105,110,103,32,102,105,110,97,108,32,115,108,97,115,104,32,40,100,101,102,97,117,108,116,32,105,115,32,46,47,100,98,47,41,10,0,0,0,0,0,0,0,38,101,103,114,97,118,101,59,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,32,100,105,115,116,61,37,52,100,32,99,61,32,37,99,32,48,120,37,48,50,120,32,37,115,32,32,119,99,61,32,37,51,100,0,0,0,0,0,0,38,99,99,101,100,105,108,59,0,0,0,0,0,0,0,0,38,99,99,97,114,111,110,59,0,0,0,0,0,0,0,0,38,97,101,108,105,103,59,0,50,49,50,49,50,51,0,0,49,50,49,50,50,51,0,0,38,97,114,105,110,103,59,0,38,97,117,109,108,59,0,0,37,37,0,0,0,0,0,0,38,97,116,105,108,100,101,59,0,0,0,0,0,0,0,0,114,101,109,111,118,101,95,100,117,115,116,50,0,0,0,0,114,98,0,0,0,0,0,0,38,97,99,105,114,99,59,0,38,97,99,97,114,111,110,59,0,0,0,0,0,0,0,0,32,40,87,65,82,78,73,78,71,32,110,117,109,95,103,97,112,115,60,56,41,0,0,0,38,97,98,114,101,118,101,59,0,0,0,0,0,0,0,0,35,32,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,117,115,101,32,45,104,32,102,111,114,32,104,101,108,112,10,0,0,0,0,0,0,0,38,97,97,99,117,116,101,59,0,0,0,0,0,0,0,0,35,32,122,111,110,105,110,103,10,35,32,46,46,46,32,0,10,35,68,69,66,85,71,58,32,111,99,114,95,100,98,32,40,37,100,44,37,100,41,32,0,0,0,0,0,0,0,0,38,97,103,114,97,118,101,59,0,0,0,0,0,0,0,0,38,115,122,108,105,103,59,0,38,84,72,79,82,78,59,0,51,50,50,50,49,49,0,0,38,90,99,97,114,111,110,59,0,0,0,0,0,0,0,0,38,89,97,99,117,116,101,59,0,0,0,0,0,0,0,0,46,46,46,0,0,0,0,0,38,85,117,109,108,59,0,0,10,35,32,32,114,101,109,111,118,101,49,32,37,51,100,32,37,51,100,32,0,0,0,0,114,101,97,100,32,102,101,114,114,111,114,10,0,0,0,0,38,85,99,105,114,99,59,0,38,85,97,99,117,116,101,59,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,110,117,109,95,103,97,112,115,61,32,37,50,100,32,120,95,119,105,100,116,104,61,32,37,50,100,32,45,32,37,50,100,32,109,111,110,111,95,101,109,61,32,37,50,100,32,45,32,37,50,100,32,32,109,111,110,111,61,32,37,100,0,0,0,0,38,85,103,114,97,118,101,59,0,0,0,0,0,0,0,0,38,83,99,97,114,111,110,59,0,0,0,0,0,0,0,0,87,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,102,111,114,109,97,116,32,40,45,102,32,37,115,41,10,0,0,0,0,0,0,0,0,35,32,100,101,116,101,99,116,46,99,32,100,101,116,101,99,116,95,116,101,120,116,95,108,105,110,101,115,32,40,118,118,118,61,49,54,32,102,111,114,32,109,111,114,101,32,105,110,102,111,41,10,0,0,0,0,37,99,37,99,10,0,0,0,38,79,115,108,97,115,104,59,0,0,0,0,0,0,0,0,38,116,105,109,101,115,0,0,38,79,117,109,108,59,0,0,51,50,50,49,49,50,0,0,38,79,116,105,108,100,101,59,0,0,0,0,0,0,0,0,38,79,99,105,114,99,59,0,42,0,0,0,0,0,0,0,38,79,97,99,117,116,101,59,0,0,0,0,0,0,0,0,35,32,114,101,109,111,118,101,95,114,101,115,116,95,111,102,95,100,117,115,116,32,40,97,118,88,44,110,67,41,44,32,46,46,46,32,0,0,0,0,114,101,97,100,32,102,101,111,102,10,0,0,0,0,0,0,38,79,103,114,97,118,101,59,0,0,0,0,0,0,0,0,38,78,116,105,108,100,101,59,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,109,111,110,111,58,61,48,32,32,37,100,32,45,32,37,100,32,32,112,114,101,50,32,37,100,32,37,100,32,32,37,100,32,37,100,10,35,32,46,46,46,0,0,0,0,0,0,0,0,38,69,84,72,59,0,0,0,38,73,117,109,108,59,0,0,65,83,67,73,73,0,0,0,60,33,45,45,32,103,111,99,114,32,119,105,108,108,32,102,97,105,108,44,32,115,116,114,111,110,103,32,114,111,116,97,116,105,111,110,32,97,110,103,108,101,32,100,101,116,101,99,116,101,100,32,45,45,62,10,0,0,0,0,0,0,0,0,37,99,0,0,0,0,0,0,38,73,99,105,114,99,59,0,32,67,79,77,80,79,83,69,58,32,65,67,85,84,69,95,65,67,67,69,78,84,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,0,38,73,97,99,117,116,101,59,0,0,0,0,0,0,0,0,38,73,103,114,97,118,101,59,0,0,0,0,0,0,0,0,51,49,50,50,49,50,0,0,38,69,117,109,108,59,0,0,106,111,98,0,0,0,0,0,38,69,99,105,114,99,59,0,43,0,0,0,0,0,0,0,10,35,32,32,100,117,115,116,32,115,105,122,101,32,104,105,115,116,111,103,114,97,109,32,37,51,100,32,37,53,100,0,38,69,99,97,114,111,110,59,0,0,0,0,0,0,0,0,32,37,51,100,32,99,108,117,115,116,101,114,32,99,111,114,114,101,99,116,101,100,44,32,37,100,32,110,101,119,32,98,111,120,101,115,10,0,0,0,10,69,82,82,79,82,32,112,110,109,46,99,32,76,37,100,58,32,0,0,0,0,0,0,99,111,117,108,100,32,110,111,116,32,111,112,101,110,32,37,115,32,102,111,114,32,112,114,111,103,114,101,115,115,32,111,117,116,112,117,116,10,0,0,38,69,97,99,117,116,101,59,0,0,0,0,0,0,0,0,38,69,103,114,97,118,101,59,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,109,111,110,111,58,61,48,32,32,37,100,32,45,32,37,100,32,32,112,114,101,49,32,37,100,32,37,100,32,32,37,100,32,37,100,10,35,32,46,46,46,0,0,0,0,0,0,0,0,38,67,99,101,100,105,108,59,0,0,0,0,0,0,0,0,38,67,99,97,114,111,110,59,0,0,0,0,0,0,0,0,85,84,70,56,0,0,0,0,35,32,114,111,116,97,116,105,111,110,32,97,110,103,108,101,32,40,120,44,121,44,109,97,120,114,44,110,117,109,41,32,37,54,100,32,37,54,100,32,37,54,100,32,37,52,100,32,112,97,115,115,32,37,100,10,0,0,0,0,0,0,0,0,35,32,115,104,111,119,32,112,97,116,116,101,114,110,32,120,61,32,37,52,100,32,37,52,100,32,100,61,32,37,51,100,32,37,51,100,32,116,61,32,37,100,32,37,100,10,0,0,38,65,69,108,105,103,59,0,38,65,114,105,110,103,59,0,38,65,117,109,108,59,0,0,51,50,49,50,50,49,0,0,46,112,98,109,46,103,122,0,38,65,116,105,108,100,101,59,0,0,0,0,0,0,0,0,110,32,60,32,84,82,69,69,95,65,82,82,65,89,95,83,73,90,69,0,0,0,0,0,38,65,99,105,114,99,59,0,44,44,0,0,0,0,0,0,38,65,98,114,101,118,101,59,0,0,0,0,0,0,0,0,10,35,32,32,108,111,119,101,114,32,115,101,114,105,102,32,120,48,44,121,48,44,106,49,45,120,48,43,120,44,121,49,45,121,32,37,52,100,32,37,52,100,32,37,51,100,32,43,32,37,50,100,32,37,50,100,0,0,0,0,0,0,0,0,102,105,103,50,100,101,118,32,45,76,32,112,112,109,32,45,109,32,51,0,0,0,0,0,38,65,97,99,117,116,101,59,0,0,0,0,0,0,0,0,38,65,103,114,97,118,101,59,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,68,66,71,50,32,120,32,37,51,100,32,37,43,52,100,32,37,51,100,32,37,43,52,100,32,32,100,32,37,51,100,32,37,51,100,32,32,101,109,32,37,50,100,32,37,50,100,32,32,101,120,32,37,50,100,10,35,32,46,46,46,0,0,0,0,38,105,113,117,101,115,116,59,0,0,0,0,0,0,0,0,38,102,114,97,99,51,52,59,0,0,0,0,0,0,0,0,83,71,77,76,0,0,0,0,32,98,111,120,32,100,101,116,101,99,116,101,100,32,97,116,32,37,52,100,32,37,52,100,32,37,52,100,32,37,52,100,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,38,102,114,97,99,49,50,59,0,0,0,0,0,0,0,0,38,102,114,97,99,49,52,59,0,0,0,0,0,0,0,0,38,114,97,113,117,111,59,0,51,50,49,49,50,50,0,0,38,111,114,100,109,59,0,0,38,115,117,112,49,59,0,0,39,39,0,0,0,0,0,0,38,99,101,100,105,108,59,0,32,61,62,32,115,112,108,105,116,116,101,100,0,0,0,0,46,102,105,103,0,0,0,0,38,109,105,100,100,111,116,59,0,0,0,0,0,0,0,0,38,112,97,114,97,59,0,0,32,76,37,48,50,100,32,68,66,71,49,32,120,32,37,51,100,32,37,43,52,100,32,37,51,100,32,37,43,52,100,32,32,100,32,37,51,100,32,37,51,100,32,32,101,109,32,37,50,100,32,37,50,100,32,32,101,120,32,37,50,100,10,35,32,46,46,46,0,0,0,0,38,109,105,99,114,111,59,0,38,97,99,117,116,101,59,0,88,77,76,0,0,0,0,0,32,101,109,112,116,121,32,98,111,120,0,0,0,0,0,0,32,37,115,40,37,100,41,0,10,68,66,71,58,32,115,101,116,97,115,40,78,85,76,76,41,32,109,97,107,101,115,32,110,111,32,115,101,110,115,101,33,0,0,0,0,0,0,0,38,115,117,112,51,59,0,0,38,115,117,112,50,59,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,114,101,97,100,32,80,67,88,32,104,101,97,100,101,114,10,0,0,0,0,0,0,0,38,112,108,117,115,109,110,59,0,0,0,0,0,0,0,0,51,49,49,50,50,50,0,0,38,100,101,103,59,0,0,0,38,109,97,99,114,59,0,0,10,35,32,32,102,114,97,109,101,115,61,32,37,100,32,40,115,117,109,118,101,99,116,115,61,37,100,41,0,0,0,0,96,96,0,0,0,0,0,0,38,114,101,103,59,0,0,0,35,32,109,101,108,116,101,100,32,115,101,114,105,102,115,32,99,111,114,114,101,99,116,101,100,32,111,110,32,37,100,32,37,100,32,106,49,61,37,100,32,106,51,61,37,100,0,0,35,32,116,104,114,101,115,104,111,108,100,58,32,118,97,108,117,101,32,105,104,105,115,116,32,99,104,105,115,116,32,109,97,115,115,95,100,105,112,111,108,95,109,111,109,101,110,116,32,116,114,105,103,103,10,0,46,101,112,115,0,0,0,0,60,33,45,45,69,82,82,79,82,32,53,55,54,45,45,62,0,0,0,0,0,0,0,0,38,115,104,121,59,0,0,0,38,110,111,116,59,0,0,0,10,35,32,32,108,105,110,101,32,37,50,100,10,35,32,46,46,46,0,0,0,0,0,0,38,108,97,113,117,111,59,0,38,111,114,100,102,101,109,59,0,0,0,0,0,0,0,0,72,84,77,76,0,0,0,0,63,0,0,0,0,0,0,0,10,35,32,108,105,115,116,32,98,111,120,32,99,104,97,114,58,32,0,0,0,0,0,0,38,99,111,112,121,59,0,0,103,101,116,95,108,101,97,115,116,95,108,105,110,101,95,105,110,100,101,110,116,58,32,114,111,116,46,118,101,99,116,111,114,32,100,120,100,121,32,37,100,32,37,100,10,0,0,0,38,117,109,108,59,0,0,0,38,115,101,99,116,59,0,0,51,49,50,49,51,49,0,0,38,98,114,118,98,97,114,59,0,0,0,0,0,0,0,0,38,121,101,110,59,0,0,0,126,0,0,0,0,0,0,0,60,98,114,32,47,62,0,0,38,99,117,114,114,101,110,59,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,38,112,111,117,110,100,59,0,112,115,116,111,112,110,109,32,45,115,116,100,111,117,116,32,45,112,111,114,116,114,97,105,116,32,45,112,103,109,0,0,10,35,32,100,101,116,101,99,116,95,108,105,110,101,115,49,40,37,100,32,37,100,32,37,100,32,37,100,41,32,118,118,118,38,49,54,32,99,104,97,114,115,61,37,100,32,109,121,61,37,100,10,35,32,32,0,38,99,101,110,116,59,0,0,35,32,99,104,101,99,107,32,102,111,114,32,119,111,114,100,32,112,105,116,99,104,0,0,38,105,101,120,99,108,59,0,46,46,46,32,37,100,32,108,105,110,101,115,44,32,98,111,120,101,115,61,32,37,100,44,32,99,104,97,114,115,61,32,37,100,10,0,0,0,0,0,60,110,111,98,114,32,47,62,0,0,0,0,0,0,0,0,84,101,88,0,0,0,0,0,32,109,111,115,116,32,117,112,112,101,114,32,98,111,120,32,97,116,32,110,101,119,32,108,105,110,101,32,120,121,61,32,37,52,100,32,37,52,100,32,37,43,52,100,32,37,43,52,100,10,35,32,32,0,0,0,121,0,0,0,0,0,0,0,10,35,32,115,104,111,119,32,98,111,120,32,32,32,32,32,120,61,32,37,52,100,32,37,52,100,32,100,61,32,37,51,100,32,37,51,100,32,114,61,32,37,100,32,37,100,0,0,60,98,114,32,47,62,0,0,60,33,45,45,80,73,67,84,85,82,69,45,45,62,0,0,38,103,116,59,0,0,0,0,50,50,51,49,49,50,0,0,114,0,0,0,0,0,0,0,38,108,116,59,0,0,0,0,38,113,117,111,116,59,0,0,10,68,66,71,32,109,101,114,103,101,95,98,111,120,101,115,32,77,97,120,78,117,109,70,114,97,109,101,115,32,114,101,97,99,104,101,100,0,0,0,44,0,0,0,0,0,0,0,38,97,112,111,115,59,0,0,32,111,107,49,0,0,0,0,46,112,115,0,0,0,0,0,38,97,109,112,59,0,0,0,92,115,121,109,98,111,108,123,37,117,125,0,0,0,0,0,32,110,67,61,32,37,51,100,32,97,118,68,61,32,37,50,100,32,37,50,100,10,0,0,40,80,73,67,84,85,82,69,41,0,0,0,0,0,0,0,60,47,98,108,111,99,107,62,10,60,47,112,97,103,101,62,10,0,0,0,0,0,0,0,73,83,79,56,56,53,57,95,49,0,0,0,0,0,0,0,120,0,0,0,0,0,0,0,10,35,32,115,104,111,119,32,98,111,120,32,43,32,101,110,118,105,114,111,110,109,101,110,116,0,0,0,0,0,0,0,92,105,110,102,116,121,0,0,92,102,114,113,123,125,0,0,92,102,108,113,123,125,0,0,50,49,51,50,49,50,0,0,92,108,100,111,116,115,0,0,36,92,98,108,97,99,107,116,114,105,97,110,103,108,101,114,105,103,104,116,0,0,0,0,39,0,0,0,0,0,0,0,36,92,98,117,108,108,101,116,36,0,0,0,0,0,0,0,10,35,32,32,117,112,112,101,114,32,115,101,114,105,102,32,120,48,44,121,48,44,106,49,45,120,48,43,120,44,121,45,121,48,32,37,52,100,32,37,52,100,32,37,51,100,32,43,32,37,50,100,32,37,50,100,0,0,0,0,0,0,0,0,112,110,103,116,111,112,110,109,0,0,0,0,0,0,0,0,92,100,100,97,103,0,0,0,92,100,97,103,0,0,0,0,10,69,82,82,79,82,32,115,99,97,110,95,98,111,120,101,115,58,32,110,111,32,118,101,99,116,111,114,32,105,110,32,102,114,97,109,101,32,40,37,100,44,37,100,41,0,0,0,92,103,108,113,113,123,125,0,34,32,47,62,10,0,0,0,92,103,108,113,123,125,0,0,115,116,100,111,117,116,32,114,101,100,105,114,101,99,116,105,111,110,32,116,111,32,37,115,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,32,100,105,118,105,100,101,32,97,116,32,37,115,32,120,61,37,52,100,32,121,61,37,52,100,32,100,120,61,37,52,100,32,100,121,61,37,52,100,0,37,115,32,37,48,52,120,10,0,0,0,0,0,0,0,0,92,40,32,92,118,97,114,112,105,32,92,41,0,0,0,0,92,40,32,92,112,104,105,32,92,41,0,0,0,0,0,0,92,40,32,92,118,97,114,116,104,101,116,97,32,92,41,0,50,50,49,50,51,49,0,0,50,50,50,50,50,49,0,0,92,40,32,92,111,109,101,103,97,32,92,41,0,0,0,0,92,40,32,92,112,115,105,32,92,41,0,0,0,0,0,0,96,0,0,0,0,0,0,0,92,40,32,92,99,104,105,32,92,41,0,0,0,0,0,0,35,32,115,101,97,114,99,104,105,110,103,32,109,101,108,116,101,100,32,115,101,114,105,102,115,32,46,46,46,0,0,0,46,112,110,103,0,0,0,0,92,40,32,92,118,97,114,112,104,105,32,92,41,0,0,0,92,40,32,92,117,112,115,105,108,111,110,32,92,41,0,0,35,32,115,99,97,110,95,98,111,120,101,115,0,0,0,0,92,40,32,92,116,97,117,32,92,41,0,0,0,0,0,0,34,32,97,99,104,97,114,115,61,34,0,0,0,0,0,0,92,40,32,92,115,105,103,109,97,32,92,41,0,0,0,0,115,116,100,101,114,114,32,114,101,100,105,114,101,99,116,105,111,110,32,116,111,32,37,115,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,32,105,61,37,100,0,0,0,37,115,32,37,48,56,120,10,0,0,0,0,0,0,0,0,92,40,32,92,118,97,114,115,105,103,109,97,32,92,41,0,92,40,32,92,114,104,111,32,92,41,0,0,0,0,0,0,92,40,32,92,112,105,32,92,41,0,0,0,0,0,0,0,50,50,49,49,51,50,0,0,92,40,32,92,111,109,105,99,114,111,110,32,92,41,0,0,92,40,32,92,120,105,32,92,41,0,0,0,0,0,0,0,35,32,108,111,97,100,32,100,97,116,97,98,97,115,101,32,37,115,32,37,115,32,46,46,46,32,0,0,0,0,0,0,45,45,45,0,0,0,0,0,92,40,32,92,110,117,32,92,41,0,0,0,0,0,0,0,114,101,109,111,118,101,95,109,101,108,116,101,100,95,115,101,114,105,102,115,0,0,0,0,116,105,102,102,116,111,112,110,109,0,0,0,0,0,0,0,92,40,32,92,109,117,32,92,41,0,0,0,0,0,0,0,92,40,32,92,108,97,109,98,100,97,32,92,41,0,0,0,10,68,66,71,32,119,104,97,116,108,101,116,116,101,114,58,32,99,111,109,112,111,115,101,40,37,115,41,32,119,97,115,32,117,115,101,108,101,115,115,32,40,37,100,44,37,100,41,0,0,0,0,0,0,0,0,92,40,32,92,107,97,112,112,97,32,92,41,0,0,0,0,35,32,119,114,105,116,105,110,103,32,37,115,91,46,112,110,103,93,32,120,121,61,32,37,100,32,37,100,10,0,0,0,44,0,0,0,0,0,0,0,92,40,32,92,105,111,116,97,32,92,41,0,0,0,0,0,119,0,0,0,0,0,0,0,10,35,32,114,61,37,50,100,32,0,0,0,0,0,0,0,37,115,32,37,99,10,0,0,92,40,32,92,116,104,101,116,97,32,92,41,0,0,0,0,92,40,32,92,101,116,97,32,92,41,0,0,0,0,0,0,105,110,105,116,95,114,115,32,102,97,105,108,101,100,44,32,98,97,100,32,112,114,105,109,105,116,105,118,101,32,103,102,112,111,108,121,32,120,61,37,100,10,35,32,0,0,0,0,92,40,32,92,122,101,116,97,32,92,41,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,117,110,107,110,111,119,110,32,113,114,99,111,100,101,34,32,47,62,0,0,0,0,0,0,0,50,50,51,50,49,49,0,0,92,40,32,92,101,112,115,105,108,111,110,32,92,41,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,113,114,99,111,100,101,37,100,34,32,99,104,97,114,115,61,34,37,100,34,32,101,99,99,108,101,118,101,108,61,34,37,100,34,32,62,10,37,115,10,60,47,98,97,114,99,111,100,101,62,0,0,0,0,0,0,0,92,40,32,92,100,101,108,116,97,32,92,41,0,0,0,0,113,114,99,111,100,101,46,109,97,108,108,111,99,32,102,97,105,108,101,100,10,0,0,0,92,40,32,92,103,97,109,109,97,32,92,41,0,0,0,0,45,45,0,0,0,0,0,0,113,114,99,111,100,101,46,117,110,101,120,112,101,99,116,101,100,95,111,118,101,114,102,108,111,119,10,0,0,0,0,0,92,40,32,92,98,101,116,97,32,92,41,0,0,0,0,0,32,115,116,97,116,117,115,58,32,112,105,99,116,117,114,101,115,61,32,37,100,32,32,111,116,104,101,114,61,32,37,100,32,32,110,67,61,32,37,100,10,0,0,0,0,0,0,0,46,116,105,102,102,0,0,0,32,101,114,114,111,114,45,99,111,112,121,98,111,120,32,120,61,37,53,100,32,37,53,100,32,32,100,61,37,53,100,32,37,53,100,10,0,0,0,0,92,40,32,92,97,108,112,104,97,32,92,41,0,0,0,0,69,82,82,79,82,32,113,114,99,111,100,101,32,76,37,48,52,100,32,105,61,37,100,32,106,61,37,100,10,0,0,0,92,40,32,92,79,109,101,103,97,32,92,41,0,0,0,0,87,97,114,110,105,110,103,58,32,109,97,108,108,111,99,32,102,97,105,108,101,100,32,76,37,100,10,0,0,0,0,0,35,10,35,32,98,97,114,99,111,100,101,46,99,32,100,101,116,101,99,116,95,98,97,114,99,111,100,101,32,115,101,97,114,99,104,32,113,114,99,111,100,101,32,0,0,0,0,0,35,32,109,97,114,107,32,108,105,110,101,115,32,102,111,114,32,37,115,46,112,112,109,10,0,0,0,0,0,0,0,0,92,40,32,92,80,115,105,32,92,41,0,0,0,0,0,0,37,100,0,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,117,110,107,110,111,119,110,32,100,97,116,97,109,97,116,114,105,120,34,32,47,62,0,0,0,92,40,32,92,67,104,105,32,92,41,0,0,0,0,0,0,32,110,117,109,95,108,105,110,101,115,61,32,37,100,0,0,37,115,32,34,37,115,34,10,0,0,0,0,0,0,0,0,34,32,47,62,0,0,0,0,92,40,32,92,80,104,105,32,92,41,0,0,0,0,0,0,67,79,77,80,79,83,69,58,32,103,111,116,32,65,80,79,83,84,82,79,80,72,69,32,105,110,115,116,101,97,100,32,111,102,32,65,67,85,84,69,95,65,67,67,69,78,84,0,10,35,32,100,97,116,97,109,97,116,114,105,120,32,97,116,32,37,51,100,32,37,51,100,32,115,105,122,101,32,37,51,100,32,37,51,100,32,110,112,105,120,32,37,100,42,37,100,32,117,110,105,116,32,37,100,42,37,100,0,0,0,0,0,92,40,32,92,85,112,115,105,108,111,110,32,92,41,0,0,38,35,37,100,59,0,0,0,49,50,51,50,50,49,0,0,84,0,0,0,0,0,0,0,91,69,79,84,111,114,82,69,84,50,84,101,120,116,93,0,92,40,32,92,83,105,103,109,97,32,92,41,0,0,0,0,91,69,68,73,70,65,67,84,93,0,0,0,0,0,0,0,80,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,10,35,32,32,100,117,115,116,32,115,105,122,101,32,100,101,116,101,99,116,105,111,110,44,32,118,111,108,32,110,117,109,32,111,98,106,61,37,100,32,109,97,120,68,117,115,116,61,37,100,32,109,80,61,32,37,51,100,32,109,88,89,61,32,37,50,100,32,37,50,100,0,91,84,101,120,116,93,0,0,92,40,32,92,80,105,32,92,41,0,0,0,0,0,0,0,32,102,111,117,110,100,32,112,105,99,116,117,114,101,32,97,116,32,37,52,100,32,37,52,100,32,115,105,122,101,32,37,52,100,32,37,52,100,10,35,32,46,46,46,0,0,0,0,98,109,112,116,111,112,112,109,0,0,0,0,0,0,0,0,91,65,110,115,105,88,49,50,93,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,79,0,0,0,0,0,0,0,91,83,104,105,102,116,65,83,67,93,0,0,0,0,0,0,92,40,32,92,88,105,32,92,41,0,0,0,0,0,0,0,10,35,32,32,100,105,115,116,97,110,99,101,32,114,99,61,37,100,32,103,111,111,100,61,37,100,32,98,97,100,61,37,100,0,0,0,0,0,0,0,91,70,78,67,49,93,0,0,10,35,32,108,105,115,116,32,115,104,97,112,101,32,37,51,100,32,120,61,37,52,100,32,37,52,100,32,100,61,32,37,51,100,32,37,51,100,32,118,102,61,37,100,32,97,99,61,37,100,32,37,48,52,120,32,37,115,0,0,0,0,0,0,78,0,0,0,0,0,0,0,34,32,110,117,109,97,99,61,34,37,100,34,32,119,101,105,103,104,116,115,61,34,0,0,91,66,97,115,101,50,53,54,93,0,0,0,0,0,0,0,77,0,0,0,0,0,0,0,45,45,104,101,108,112,0,0,87,97,114,110,105,110,103,58,32,108,105,110,101,115,62,77,65,88,108,105,110,101,115,10,0,0,0,0,0,0,0,0,10,70,65,84,65,76,58,32,109,97,108,108,111,99,32,102,97,105,108,101,100,44,32,115,107,105,112,32,115,116,111,114,101,95,100,98,0,0,0,0,91,67,52,48,93,0,0,0,92,40,32,92,76,97,109,98,100,97,32,92,41,0,0,0,91,80,97,100,100,105,110,103,93,0,0,0,0,0,0,0,75,0,0,0,0,0,0,0,37,48,50,100,0,0,0,0,49,50,51,49,50,50,0,0,73,0,0,0,0,0,0,0,103,122,105,112,32,45,99,100,0,0,0,0,0,0,0,0,37,99,0,0,0,0,0,0,92,40,32,92,84,104,101,116,97,32,92,41,0,0,0,0,112,105,120,101,108,46,99,0,10,35,32,64,32,37,51,100,32,37,51,100,32,58,32,37,48,50,120,32,37,51,100,32,100,32,37,50,100,32,112,111,115,32,37,51,100,32,100,101,99,111,100,101,61,32,0,0,72,0,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,109,111,100,105,102,105,101,114,32,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,100,97,116,97,109,97,116,114,105,120,32,101,99,99,50,48,48,34,32,114,97,119,99,111,100,101,61,34,34,32,47,62,0,90,0,0,0,0,0,0,0,32,100,101,108,101,116,101,100,61,32,37,100,32,110,101,115,116,101,100,32,112,105,99,116,117,114,101,115,10,35,32,46,46,46,0,0,0,0,0,0,46,98,109,112,0,0,0,0,32,69,82,82,79,82,58,32,109,97,108,108,111,99,68,77,50,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,69,0,0,0,0,0,0,0,10,35,32,110,111,119,32,119,105,116,104,111,117,116,32,102,105,110,100,101,114,32,112,97,116,116,101,114,110,10,35,32,32,32,32,32,32,0,0,0,92,40,32,92,68,101,108,116,97,32,92,41,0,0,0,0,10,70,65,84,65,76,58,32,109,97,108,108,111,99,40,37,100,41,32,102,97,105,108,101,100,44,32,115,107,105,112,32,110,117,109,95,111,98,106,0,32,37,99,0,0,0,0,0,10,35,32,32,32,32,32,32,32,32,32,32,32,32,98,111,120,32,102,111,117,110,100,32,105,110,32,99,104,97,114,108,105,115,116,0,0,0,0,0,92,40,32,92,71,97,109,109,97,32,92,41,0,0,0,0,32,60,98,111,120,32,120,61,34,37,100,34,32,121,61,34,37,100,34,32,100,120,61,34,37,100,34,32,100,121,61,34,37,100,34,32,118,97,108,117,101,61,34,0,0,0,0,0,10,35,32,37,51,100,58,32,0,0,0,0,0,0,0,0,66,0,0,0,0,0,0,0,32,117,115,101,32,111,112,116,105,111,110,32,45,104,32,102,111,114,32,104,101,108,112,10,0,0,0,0,0,0,0,0,32,76,37,48,50,100,32,102,105,110,97,108,32,32,121,61,32,37,51,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,32,120,61,32,37,51,100,32,37,43,51,100,32,119,61,32,37,100,10,35,32,32,0,0,0,0,0,0,0,0,115,116,111,114,101,95,100,98,58,32,97,100,100,32,102,105,108,101,32,37,115,32,116,111,32,100,97,116,97,98,97,115,101,32,40,110,97,99,61,37,100,32,99,61,37,48,52,120,41,10,35,0,0,0,0,0,32,37,55,100,0,0,0,0,65,0,0,0,0,0,0,0,32,37,51,100,0,0,0,0,92,118,123,122,125,0,0,0,32,37,49,100,0,0,0,0,49,49,51,50,50,50,0,0,92,34,121,0,0,0,0,0,10,35,32,32,32,32,32,32,0,0,0,0,0,0,0,0,92,39,121,0,0,0,0,0,32,69,82,82,79,82,58,32,109,97,108,108,111,99,68,77,49,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,92,34,117,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,71,82,69,69,75,32,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,0,35,32,98,97,114,99,111,100,101,46,99,32,100,101,116,101,99,116,95,98,97,114,99,111])
.concat([100,101,32,115,101,97,114,99,104,32,100,97,116,97,109,97,116,114,105,120,32,0,0,0,92,94,117,0,0,0,0,0,32,100,101,108,101,116,101,100,61,32,37,100,32,112,105,99,116,117,114,101,115,32,40,111,110,32,98,111,114,100,101,114,41,10,35,32,46,46,46,0,103,105,102,116,111,112,110,109,32,45,105,109,97,103,101,61,97,108,108,0,0,0,0,0,10,35,32,46,46,46,32,98,111,120,101,115,32,37,100,32,110,67,32,37,100,10,0,0,92,39,117,0,0,0,0,0,10,35,32,46,46,46,32,114,101,109,111,118,101,100,32,98,111,120,101,115,58,32,37,100,0,0,0,0,0,0,0,0,92,96,117,0,0,0,0,0,10,70,65,84,65,76,58,32,109,97,108,108,111,99,40,37,100,41,32,102,97,105,108,101,100,44,32,115,107,105,112,32,110,117,109,95,104,111,108,101,0,0,0,0,0,0,0,0,10,35,32,46,46,46,32,100,101,99,111,100,101,100,32,97,115,58,32,37,115,0,0,0,10,35,32,108,105,115,116,32,115,104,97,112,101,32,102,111,114,32,99,104,97,114,108,105,115,116,32,37,115,0,0,0,92,118,123,115,125,0,0,0,32,0,0,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,117,110,107,110,111,119,110,34,32,47,62,0,0,0,0,0,0,92,111,0,0,0,0,0,0,32,79,112,116,105,99,97,108,32,67,104,97,114,97,99,116,101,114,32,82,101,99,111,103,110,105,116,105,111,110,32,45,45,45,32,103,111,99,114,32,48,46,53,48,32,50,48,49,51,48,51,48,53,10,32,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,48,49,45,50,48,49,48,32,74,111,101,114,103,32,83,99,104,117,108,101,110,98,117,114,103,32,32,71,80,71,61,49,48,50,52,68,47,53,51,66,68,70,66,69,51,10,32,114,101,108,101,97,115,101,100,32,117,110,100,101,114,32,116,104,101,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,10,0,0,0,0,32,76,37,48,50,100,32,106,106,32,37,51,100,32,121,61,32,37,51,100,32,109,61,32,37,52,100,32,37,43,51,100,32,37,43,51,100,32,37,43,51,100,32,32,109,121,61,32,37,52,100,10,35,32,32,0,32,99,111,117,108,100,32,110,111,116,32,97,99,99,101,115,115,32,37,115,10,0,0,0,10,68,66,71,58,32,84,104,101,114,101,32,105,115,32,115,111,109,101,116,104,105,110,103,32,119,114,111,110,103,32,119,105,116,104,32,115,101,116,97,115,40,41,33,0,0,0,0,10,35,32,46,46,46,32,116,114,111,117,98,108,101,58,32,110,117,109,95,102,111,117,110,100,95,98,97,114,115,32,33,61,32,110,117,109,95,99,114,111,115,115,0,0,0,0,0,36,92,100,105,118,36,0,0,10,35,32,98,97,114,99,111,100,101,32,97,116,32,37,51,100,32,37,51,100,32,115,105,122,101,32,37,51,100,32,37,51,100,32,110,98,97,114,115,32,37,100,32,40,37,100,41,0,0,0,0,0,0,0,0,92,34,111,0,0,0,0,0,35,32,98,97,114,99,111,100,101,46,99,32,100,101,116,101,99,116,95,98,97,114,99,111,100,101,32,0,0,0,0,0,49,50,50,50,51,49,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,111,112,101,110,10,0,0,92,126,111,0,0,0,0,0,10,35,32,46,46,46,32,100,101,116,101,99,116,32,98,97,114,115,61,37,51,100,32,119,61,37,52,100,0,0,0,0,92,94,111,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,99,111,100,97,98,97,114,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,115,34,32,99,114,99,61,34,37,99,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,0,92,39,111,0,0,0,0,0,10,35,32,32,100,111,116,115,61,37,100,32,98,111,120,101,115,61,37,100,32,115,117,98,98,111,120,101,115,61,37,100,32,99,61,37,115,32,109,111,100,61,37,115,32,108,105,110,101,61,37,100,32,109,61,32,37,100,32,37,100,32,37,100,32,37,100,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,37,48,52,120,43,101,47,69,32,110,111,116,32,100,101,102,105,110,101,100,10,0,48,46,46,46,46,46,45,45,49,46,46,46,46,45,45,46,50,46,46,46,45,46,46,45,51,45,45,46,46,46,46,46,52,46,46,45,46,46,45,46,53,45,46,46,46,46,45,46,54,46,45,46,46,46,46,45,55,46,45,46,46,45,46,46,56,46,45,45,46,46,46,46,57,45,46,46,45,46,46,46,45,46,46,46,45,45,46,46,36,46,46,45,45,46,46,46,58,45,46,46,46,45,46,45,47,45,46,45,46,46,46,45,46,45,46,45,46,45,46,46,43,46,46,45,46,45,46,45,97,46,46,45,45,46,45,46,98,46,45,46,45,46,46,45,99,46,46,46,45,46,45,45,100,46,46,46,45,45,45,46,116,46,46,45,45,46,45,46,110,46,45,46,45,46,46,45,42,46,46,46,45,46,45,45,101,46,46,46,45,45,45,46,63,63,63,63,63,63,63,63,0,0,0,0,0,0,0,0,92,96,111,0,0,0,0,0,32,100,101,108,101,116,101,100,61,32,37,100,32,112,105,99,116,117,114,101,115,32,40,116,97,98,108,101,32,102,114,97,109,101,115,41,10,35,32,46,46,46,0,0,0,0,0,0,78,79,84,32,78,79,82,77,65,76,44,32,116,104,114,101,115,104,111,108,100,86,97,108,117,101,32,61,32,49,54,48,10,0,0,0,0,0,0,0,46,103,105,102,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,105,50,53,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,115,34,32,99,114,99,61,34,37,99,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,0,0,0,0,0,69,114,114,111,114,32,105,110,32,111,99,114,48,46,99,32,76,37,100,58,32,105,100,120,32,37,100,45,37,100,32,111,117,116,32,111,102,32,114,97,110,103,101,10,0,0,0,0,92,126,110,0,0,0,0,0,49,45,46,46,46,45,50,46,45,46,46,45,51,45,45,46,46,46,52,46,46,45,46,45,53,45,46,45,46,46,54,46,45,45,46,46,55,46,46,46,45,45,56,45,46,46,45,46,57,46,45,46,45,46,48,46,46,45,45,46,0,0,0,0,92,34,105,0,0,0,0,0,111,117,116,51,48,0,0,0,69,82,82,79,82,32,102,114,97,109,101,95,118,101,99,116,111,114,58,32,110,111,32,98,111,114,100,101,114,10,0,0,108,105,115,116,95,115,111,114,116,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,51,57,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,115,34,32,99,114,99,61,34,37,99,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,0,0,0,0,0,0,10,35,32,108,105,115,116,32,50,32,112,97,116,116,101,114,110,115,0,0,0,0,0,0,92,94,105,0,0,0,0,0,32,40,37,99,41,61,37,100,0,0,0,0,0,0,0,0,32,60,115,112,97,99,101,32,120,61,34,37,100,34,32,121,61,34,37,100,34,32,100,120,61,34,37,100,34,32,100,121,61,34,37,100,34,32,47,62,10,0,0,0,0,0,0,0,48,46,46,45,45,46,46,45,46,46,49,45,46,46,46,45,46,45,46,46,50,46,45,46,46,45,46,45,46,46,51,45,45,46,46,46,46,45,46,46,52,46,46,45,46,45,46,45,46,46,53,45,46,45,46,46,46,45,46,46,54,46,45,45,46,46,46,45,46,46,55,46,46,46,45,45,46,45,46,46,56,45,46,46,45,46,46,45,46,46,57,46,45,46,45,46,46,45,46,46,65,45,46,46,46,45,46,46,45,46,66,46,45,46,46,45,46,46,45,46,67,45,45,46,46,46,46,46,45,46,68,46,46,45,46,45,46,46,45,46,69,45,46,45,46,46,46,46,45,46,70,46,45,45,46,46,46,46,45,46,71,46,46,46,45,45,46,46,45,46,72,45,46,46,45,46,46,46,45,46,73,46,45,46,45,46,46,46,45,46,74,46,46,45,45,46,46,46,45,46,75,45,46,46,46,45,46,46,46,45,76,46,45,46,46,45,46,46,46,45,77,45,45,46,46,46,46,46,46,45,78,46,46,45,46,45,46,46,46,45,79,45,46,45,46,46,46,46,46,45,80,46,45,45,46,46,46,46,46,45,81,46,46,46,45,45,46,46,46,45,82,45,46,46,45,46,46,46,46,45,83,46,45,46,45,46,46,46,46,45,84,46,46,45,45,46,46,46,46,45,85,45,46,46,46,45,45,46,46,46,86,46,45,46,46,45,45,46,46,46,87,45,45,46,46,46,45,46,46,46,88,46,46,45,46,45,45,46,46,46,89,45,46,45,46,46,45,46,46,46,90,46,45,45,46,46,45,46,46,46,45,46,46,46,45,45,45,46,46,46,46,45,46,46,45,46,45,46,46,46,32,46,45,46,45,46,45,46,46,46,42,46,46,45,45,46,45,46,46,46,36,46,46,46,46,46,45,45,45,46,47,46,46,46,46,46,45,45,46,45,43,46,46,46,46,46,45,46,45,45,37,46,46,46,46,46,46,45,45,45,63,120,120,120,120,120,120,120,120,120,0,0,0,0,0,0,92,39,105,0,0,0,0,0,35,32,117,115,105,110,103,32,117,110,105,99,111,100,101,10,0,0,0,0,0,0,0,0,35,32,100,101,98,117,103,58,32,40,95,41,61,32,37,100,32,112,105,99,116,115,61,32,37,100,32,99,104,97,114,115,61,32,37,100,0,0,0,0,32,97,108,108,32,98,111,120,101,115,32,111,102,32,115,97,109,101,32,108,111,119,101,114,32,98,111,117,110,100,33,10,35,32,32,0,0,0,0,0,97,0,0,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,85,80,67,95,97,100,100,111,110,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,115,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,92,96,105,0,0,0,0,0,114,101,97,108,108,111,99,32,102,97,105,108,101,100,33,10,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,85,80,67,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,100,37,115,34,32,99,114,99,61,34,37,100,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,0,0,0,92,34,101,0,0,0,0,0,95,0,0,0,0,0,0,0,35,32,99,111,110,116,101,120,116,32,99,111,114,114,101,99,116,105,111,110,32,105,102,32,33,40,109,111,100,101,38,51,50,41,10,0,0,0,0,0,63,63,63,63,0,0,0,0,49,50,50,49,51,50,0,0,92,94,101,0,0,0,0,0,111,117,116,50,48,0,0,0,50,49,49,51,0,0,0,0,92,118,123,101,125,0,0,0,35,32,100,101,98,117,103,58,32,117,110,107,110,111,119,110,61,32,37,100,32,112,105,99,116,115,61,32,37,100,32,98,111,120,101,115,61,32,37,100,10,0,0,0,0,0,0,0,51,49,50,49,0,0,0,0,92,39,101,0,0,0,0,0,111,117,116,49,48,0,0,0,32,67,79,77,80,79,83,69,58,32,82,73,78,71,95,65,66,79,86,69,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,103,111,99,114,46,99,0,0,50,49,51,49,0,0,0,0,92,96,101,0,0,0,0,0,32,115,116,97,116,117,115,58,32,112,105,99,116,117,114,101,115,61,32,37,100,32,32,111,116,104,101,114,61,32,37,100,32,32,110,67,61,32,37,100,10,35,32,46,46,46,0,0,111,117,116,48,49,0,0,0,46,106,112,101,103,0,0,0,52,49,49,49,0,0,0,0,92,99,0,0,0,0,0,0,35,32,110,111,32,98,111,120,101,115,32,102,111,117,110,100,32,45,32,115,116,111,112,112,101,100,10,0,0,0,0,0,49,51,50,49,0,0,0,0,92,118,123,99,125,0,0,0,35,32,116,104,114,101,115,104,111,108,100,105,110,103,32,110,101,119,95,116,104,114,101,115,104,111,108,100,61,32,37,100,10,0,0,0,0,0,0,0,35,32,87,97,114,110,105,110,103,58,32,102,114,97,109,101,95,110,110,32,115,116,97,99,107,32,111,101,114,102,108,111,119,10,0,0,0,0,0,0,10,114,101,97,100,32,101,114,114,111,114,32,120,61,37,100,32,121,61,37,100,10,0,0,50,51,49,49,0,0,0,0,79,88,88,88,88,120,120,64,46,44,44,44,44,44,44,44,0,0,0,0,0,0,0,0,92,97,101,0,0,0,0,0,112,103,109,50,97,115,99,95,109,97,105,110,0,0,0,0,10,0,0,0,0,0,0,0,49,49,52,49,0,0,0,0,92,97,97,0,0,0,0,0,35,32,102,105,108,101,58,32,37,115,10,0,0,0,0,0,115,101,97,114,99,104,105,110,103,32,110,101,119,32,108,105,110,101,32,37,100,10,35,32,32,0,0,0,0,0,0,0,106,111,98,0,0,0,0,0,32,97,108,108,32,98,111,120,101,115,32,111,102,32,115,97,109,101,32,117,112,112,101,114,32,98,111,117,110,100,33,10,35,32,32,0,0,0,0,0,100,98,95,37,48,52,120,95,37,48,56,108,120,46,112,98,109,0,0,0,0,0,0,0,50,50,49,50,0,0,0,0,92,34,97,0,0,0,0,0,32,100,111,110,101,44,32,110,117,109,95,108,105,110,101,95,99,104,97,114,115,61,37,100,32,114,101,115,116,61,37,100,10,0,0,0,0,0,0,0,49,50,50,50,0,0,0,0,92,126,97,0,0,0,0,0,35,32,97,100,100,95,108,105,110,101,95,105,110,102,111,32,116,111,32,98,111,120,101,115,32,46,46,46,0,0,0,0,49,49,50,51,0,0,0,0,49,49,50,50,51,50,0,0,92,94,97,0,0,0,0,0,10,35,32,46,46,46,32,102,111,117,110,100,32,37,100,32,115,112,97,99,101,115,10,0,51,49,49,50,0,0,0,0,100,98,46,108,115,116,0,0,92,39,97,0,0,0,0,0,10,35,32,105,110,115,101,114,116,32,115,112,97,99,101,32,38,37,100,59,32,97,116,32,37,52,100,32,37,52,100,32,98,111,120,61,32,37,112,32,109,111,110,111,32,37,100,32,100,120,32,37,50,100,32,112,100,120,44,109,100,120,32,37,50,100,32,37,50,100,0,0,49,50,49,51,0,0,0,0,92,96,97,0,0,0,0,0,69,82,82,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,121,101,116,44,32,84,111,68,111,10,0,0,0,0,35,32,105,110,115,101,114,116,32,115,112,97,99,101,32,98,101,116,119,101,101,110,32,119,111,114,100,115,32,40,100,121,61,37,100,41,32,46,46,46,0,0,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,68,79,84,95,65,66,79,86,69,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,49,51,49,50,0,0,0,0,92,115,115,0,0,0,0,0,35,32,114,101,109,111,118,101,46,99,32,76,37,100,58,32,114,101,109,111,118,101,32,112,105,99,116,117,114,101,115,10,35,32,46,46,46,0,0,0,32,110,117,109,95,99,111,114,114,101,99,116,101,100,61,32,37,100,32,114,101,109,111,118,101,100,95,115,112,97,99,101,115,61,32,37,100,10,0,0,100,106,112,101,103,32,45,103,114,97,121,32,45,112,110,109,0,0,0,0,0,0,0,0,49,49,49,52,0,0,0,0,92,118,123,90,125,0,0,0,46,44,59,58,33,63,41,0,49,50,51,49,0,0,0,0,92,39,89,0,0,0,0,0,53,83,0,0,0,0,0,0,109,97,108,108,111,99,32,102,97,105,108,101,100,32,40,102,114,97,109,101,95,110,110,41,10,0,0,0,0,0,0,0,63,0,0,0,0,0,0,0,49,49,51,50,0,0,0,0,37,99,37,99,10,0,0,0,92,34,85,0,0,0,0,0,10,32,47,58,46,44,45,43,79,0,0,0,0,0,0,0,60,108,105,110,101,32,120,61,34,37,100,34,32,121,61,34,37,100,34,32,100,120,61,34,37,100,34,32,100,121,61,34,37,100,34,32,118,97,108,117,101,61,34,37,100,34,62,10,0,0,0,0,0,0,0,0,49,52,49,49,0,0,0,0,92,94,85,0,0,0,0,0,35,32,111,112,116,105,111,110,115,32,97,114,101,58,32,45,108,32,37,100,32,45,115,32,37,100,32,45,118,32,37,100,32,45,99,32,37,115,32,45,109,32,37,100,32,45,100,32,37,100,32,45,110,32,37,100,32,45,97,32,37,100,32,45,67,32,34,37,115,34,10,0,47,58,45,32,0,0,0,0,32,97,108,108,32,98,111,120,101,115,32,111,102,32,115,97,109,101,32,104,105,103,104,33,32,109,105,61,37,100,10,35,32,32,0,0,0,0,0,0,50,49,50,50,0,0,0,0,32,37,100,32,99,104,97,114,115,32,108,111,97,100,101,100,10,0,0,0,0,0,0,0,92,39,85,0,0,0,0,0,97,98,99,100,65,66,67,68,0,0,0,0,0,0,0,0,50,50,50,49,0,0,0,0,92,96,85,0,0,0,0,0,47,58,46,44,45,43,79,0,51,50,49,49,0,0,0,0,50,51,49,50,49,50,0,0,92,118,123,83,125,0,0,0,73,108,124,0,0,0,0,0,60,98,97,114,99,111,100,101,32,116,121,112,101,61,34,49,50,56,34,32,99,104,97,114,115,61,34,37,100,34,32,99,111,100,101,61,34,37,115,34,32,99,114,99,61,34,37,100,34,32,101,114,114,111,114,61,34,37,46,51,102,34,32,47,62,0,0,0,0,0,0,0,92,79,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,97,98,99,100,0,0,0,0,0,0,32,37,115,61,37,48,50,100,63,32,0,0,0,0,0,0,36,92,116,105,109,101,115,36,0,0,0,0,0,0,0,0,58,45,0,0,0,0,0,0,32,67,79,77,80,79,83,69,58,32,77,65,67,82,79,78,43,37,48,52,120,32,110,111,116,32,100,101,102,105,110,101,100,10,0,0,0,0,0,0,63,63,63,0,0,0,0,0,92,34,79,0,0,0,0,0,79,48,73,49,50,51,52,53,54,55,56,57,0,0,0,0,46,106,112,103,0,0,0,0,50,51,51,49,49,49,50,0,92,126,79,0,0,0,0,0,32,10,0,0,0,0,0,0,50,49,49,50,51,50,0,0,92,94,79,0,0,0,0,0,34,32,10,0,0,0,0,0,112,103,109,50,97,115,99,46,99,0,0,0,0,0,0,0,69,82,82,79,82,32,112,99,120,46,99,32,76,37,100,58,32,110,111,32,109,101,109,111,114,121,10,0,0,0,0,0,50,49,49,50,49,52,0,0,32,32,0,0,0,0,0,0,92,39,79,0,0,0,0,0,73,108,49,124,0,0,0,0,60,47,108,105,110,101,62,10,0,0,0,0,0,0,0,0,50,49,49,52,49,50,0,0,92,96,79,0,0,0,0,0,10,0,0,0,0,0,0,0,34,0,0,0,0,0,0,0,32,76,37,48,50,100,32,32,32,32,32,32,32,32,121,61,32,37,51,100,32,105,61,32,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,32,40,99,111,117,110,116,115,41,10,35,32,32,0,0,0,52,49,49,49,51,49,0,0,108,111,97,100,95,100,98,58,32,115,116,114,105,110,103,32,112,97,114,115,101,32,101,114,114,111,114,32,76,37,100,10,0,0,0,0,0,0,0,0,92,126,78,0,0,0,0,0,10,35,32,32,99,104,97,110,103,101,32,91,37,100,93,32,37,115,32,32,32,37,51,100,32,32,32,32,32,32,116,111,32,37,115,32,37,51,100,32,97,116,32,37,51,100,32,37,51,100,0,0,0,0,0,0,51,49,49,49,52,49,0,0,92,34,73,0,0,0,0,0,10,35,32,32,46,46,46,32,102,111,117,110,100,32,68,79,85,66,76,69,95,76,79,87,95,57,95,81,85,79,84,65,84,73,79,78,95,77,65,82,75,0,0,0,0,0,0,0,49,49,52,49,51,49,0,0,50,50,49,51,49,50,0,0,50,50,50,49,50,50,0,0,50,49,50,50,50,50,0,0,116,117,114,109,105,116,101,0,114,101,99,95,103,101,110,101,114,97,116,101,95,116,114,101,101,0,0,0,0,0,0,0,114,101,97,100,95,112,105,99,116,117,114,101,0,0,0,0,112,114,111,99,101,115,115,95,97,114,103,117,109,101,110,116,115,0,0,0,0,0,0,0,112,114,105,110,116,95,111,117,116,112,117,116,0,0,0,0,112,105,120,101,108,95,102,105,108,116,101,114,95,98,121,95,116,114,101,101,0,0,0,0,112,103,109,50,97,115,99,0,109,97,114,107,95,115,116,97,114,116,0,0,0,0,0,0,109,97,114,107,95,101,110,100,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
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
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
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
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
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
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
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
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _abs=Math_abs;
  Module["_strncpy"] = _strncpy;
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      stream = FS.getStream(stream);
      return Number(stream && stream.eof);
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return 0;
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_
      }
      HEAP8[(((s)+(i))|0)]=0
      return s;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }
  Module["_tolower"] = _tolower;
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }
  function _setvbuf(stream, buf, type, size) {
      // int setvbuf(FILE *restrict stream, char *restrict buf, int type, size_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setvbuf.html
      // TODO: Implement custom buffering.
      return 0;
    }
  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }
  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _fcntl(fildes, cmd, varargs, dup2) {
      // int fcntl(int fildes, int cmd, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/fcntl.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      switch (cmd) {
        case 0:
          var arg = HEAP32[((varargs)>>2)];
          if (arg < 0) {
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          }
          var newStream;
          try {
            newStream = FS.open(stream.path, stream.flags, 0, arg);
          } catch (e) {
            FS.handleFSError(e);
            return -1;
          }
          return newStream.fd;
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4:
          var arg = HEAP32[((varargs)>>2)];
          stream.flags |= arg;
          return 0;
        case 12:
        case 12:
          var arg = HEAP32[((varargs)>>2)];
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2
          return 0;
        case 13:
        case 14:
        case 13:
        case 14:
          // Pretend that the locking is successful.
          return 0;
        case 8:
        case 9:
          // These are for sockets. We don't have them fully implemented yet.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default:
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
      }
      // Should never be reached. Only to silence strict warnings.
      return -1;
    }function _dup2(fildes, fildes2) {
      // int dup2(int fildes, int fildes2);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/dup.html
      var stream = FS.getStream(fildes);
      if (fildes2 < 0) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (fildes === fildes2 && stream) {
        return fildes;
      } else {
        _close(fildes2);
        try {
          var stream2 = FS.open(stream.path, stream.flags, 0, fildes2, fildes2);
          return stream2.fd;
        } catch (e) {
          FS.handleFSError(e);
          return -1;
        }
      }
    }
  function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        var streamObj = FS.getStream(stream);
        if (!streamObj) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(streamObj.path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }
  function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return Module['dynCall_iii'](cmp, base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      stream = FS.getStream(stream);
      return Number(stream && stream.error);
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      }
      stream = FS.getStream(stream);
      stream.eof = false;
      return 0;
    }
  function _strncat(pdest, psrc, num) {
      var len = _strlen(pdest);
      var i = 0;
      while(1) {
        HEAP8[((pdest+len+i)|0)]=HEAP8[((psrc+i)|0)];
        if (HEAP8[(((pdest)+(len+i))|0)] == 0) break;
        i ++;
        if (i == num) {
          HEAP8[(((pdest)+(len+i))|0)]=0
          break;
        }
      }
      return pdest;
    }
  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }
  function _popen(command, mode) {
      // FILE *popen(const char *command, const char *mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/popen.html
      // We allow only one process, so no pipes.
      ___setErrNo(ERRNO_CODES.EMFILE);
      return 0;
    }
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      stream = FS.getStream(stream);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (FS.isChrdev(stream.node.mode)) {
        ___setErrNo(ERRNO_CODES.ESPIPE);
        return -1;
      } else {
        return stream.position;
      }
    }
  function _pclose(stream) {
      // int pclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/pclose.html
      // We allow only one process, so no pipes.
      ___setErrNo(ERRNO_CODES.ECHILD);
      return -1;
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _abort() {
      Module['abort']();
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stdin|0;var n=env._stderr|0;var o=env._stdout|0;var p=+env.NaN;var q=+env.Infinity;var r=0;var s=0;var t=0;var u=0;var v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0,D=0.0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=global.Math.floor;var P=global.Math.abs;var Q=global.Math.sqrt;var R=global.Math.pow;var S=global.Math.cos;var T=global.Math.sin;var U=global.Math.tan;var V=global.Math.acos;var W=global.Math.asin;var X=global.Math.atan;var Y=global.Math.atan2;var Z=global.Math.exp;var _=global.Math.log;var $=global.Math.ceil;var aa=global.Math.imul;var ab=env.abort;var ac=env.assert;var ad=env.asmPrintInt;var ae=env.asmPrintFloat;var af=env.min;var ag=env.invoke_ii;var ah=env.invoke_v;var ai=env.invoke_iii;var aj=env.invoke_vi;var ak=env._strncmp;var al=env._lseek;var am=env._ferror;var an=env._snprintf;var ao=env._fgetc;var ap=env._pclose;var aq=env._fclose;var ar=env._freopen;var as=env._isdigit;var at=env._strncat;var au=env._fprintf;var av=env._toupper;var aw=env._close;var ax=env._fgets;var ay=env._pread;var az=env._fflush;var aA=env._fopen;var aB=env._open;var aC=env._strchr;var aD=env._fputc;var aE=env.___assert_fail;var aF=env.___setErrNo;var aG=env._feof;var aH=env._fseek;var aI=env._qsort;var aJ=env._send;var aK=env._write;var aL=env._fputs;var aM=env._ftell;var aN=env._abs;var aO=env._exit;var aP=env._sprintf;var aQ=env._strrchr;var aR=env._strdup;var aS=env._isspace;var aT=env._sysconf;var aU=env._fcntl;var aV=env._strtol;var aW=env._fread;var aX=env._isalpha;var aY=env._dup2;var aZ=env._read;var a_=env.__reallyNegative;var a$=env._time;var a0=env.__formatString;var a1=env._gettimeofday;var a2=env._atoi;var a3=env._recv;var a4=env._fileno;var a5=env._pwrite;var a6=env._strstr;var a7=env._sbrk;var a8=env._fsync;var a9=env.___errno_location;var ba=env._popen;var bb=env._abort;var bc=env.__parseInt;var bd=env._fwrite;var be=env._islower;var bf=env.__exit;var bg=env._isupper;var bh=env._strcmp;var bi=env._setvbuf;var bj=0.0;
// EMSCRIPTEN_START_FUNCS
function df(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0;b=i;i=i+40|0;d=b|0;e=a;a=c[e>>2]|0;f=c[e+4>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;j=c[a+8>>2]|0;k=c[a+12>>2]|0;l=h-g+1|0;m=k-j+1|0;n=d;eC(n|0,0,36)|0;n=c[e+8>>2]|0;o=57344;p=e+44|0;q=0;if((j<<1|0)<=((c[a+56>>2]<<1)-((c[a+56>>2]|0)-(c[a+52>>2]|0))|0)){q=1}r=0;if((k<<1|0)>=((c[a+60>>2]<<1)+((c[a+64>>2]|0)-(c[a+60>>2]|0))|0)){r=1}do{if((j|0)<(c[a+56>>2]|0)){if((k|0)<=(c[a+60>>2]|0)){break}if((k<<1|0)>=((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){break}if((j-(k-(c[a+60>>2]|0))<<1|0)<=((c[a+56>>2]<<1)-((c[a+56>>2]|0)-(c[a+52>>2]|0))|0)){q=1}}}while(0);do{if((o|0)==57344){if((q|0)==0){break}s=100;t=100;if((l|0)>3){u=(m|0)>6}else{u=0}L3988:do{if(u){if((c[e+108>>2]|0)>2){break}do{if((dv(g,h,j+((m|0)/4|0)|0,j+((m|0)/4|0)|0,c[a+68>>2]|0,n)|0)!=2){if((dv(g,h,j+((m|0)/4|0)+1|0,j+((m|0)/4|0)+1|0,c[a+68>>2]|0,n)|0)==2){break}break L3988}}while(0);v=((m|0)/16|0)+1|0;w=j+((m|0)/8|0)|0;while(1){if((w|0)<(k-((m|0)/4|0)|0)){x=(v|0)>0}else{x=0}if(!x){break}if((w|0)<(k-((m*6|0|0)/16|0)|0)){if((dv(g,h,w,w,c[a+68>>2]|0,n)|0)!=2){v=v-1|0}}else{if((dv(g,h,w,w,c[a+68>>2]|0,n)|0)<2){v=v-1|0}}if(((du(g,g+((l|0)/2|0)|0,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==0){v=v-1|0}if((w|0)<(k-((m*5|0|0)/16|0)|0)){if(((du(h-((l|0)/2|0)|0,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==0){v=v-1|0}}w=w+1|0}if((v|0)<=0){break}w=j+((m|0)/3|0)|0;while(1){if((w|0)>=(k-((m|0)/3|0)|0)){break}v=dC(c[a+68>>2]|0,h,w,l,n,0,4)|0;if((v|0)>=((l|0)/8|0|0)){y=2947;break}v=v+(dC(c[a+68>>2]|0,h-v|0,w,l,n,1,4)|0)|0;if((v|0)>=((l|0)/2|0|0)){y=2949;break}w=w+1|0}if((w|0)>=(k-((m|0)/3|0)|0)){break}w=j+((m|0)/5|0)|0;while(1){if((w|0)>=(j+((m|0)/3|0)|0)){break}if(((du(h-((l|0)/6|0)|0,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=2957;break}w=w+1|0}if((w|0)>=(j+((m|0)/3|0)|0)){break}w=j+((m|0)/2|0)|0;while(1){if((w|0)>=(k|0)){break}if(((du(h-((l|0)/6|0)|0,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=2965;break}w=w+1|0}if((w|0)>=(k|0)){break}w=k-((m|0)/3|0)|0;while(1){if((w|0)>=(k-((m|0)/8|0)|0)){break}v=dC(c[a+68>>2]|0,h,w,l,n,0,4)|0;if((v|0)>((l|0)/4|0|0)){if(((du(h-((l|0)/8|0)|0,h-((l|0)/8|0)|0,w,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=2974;break}}w=w+1|0}if((w|0)<(k-((m|0)/8|0)|0)){break}if((c[a+60>>2]|0)==0){y=2981}else{if((k<<1|0)<((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){y=2981}}if((y|0)==2981){do{if((dC(c[a+68>>2]|0,h,k,l,n,0,4)|0)==0){if((dC(c[a+68>>2]|0,h,k-((m|0)/4|0)|0,l,n,0,4)|0)<=((l|0)/8|0|0)){break}break L3988}}while(0)}z=g+((l|0)/4|0)|0;while(1){if((z|0)>=(h-((l|0)/4|0)|0)){break}if((dv(z,z,j,k,c[a+68>>2]|0,n)|0)==3){y=2988;break}z=z+1|0}if((z|0)>=(h-((l|0)/4|0)|0)){break}v=(dC(f,(l|0)/2|0,m-1|0,m,n,0,1)|0)+((m|0)/64|0)|0;z=(l|0)/5|0;while(1){if((z|0)>=((l|0)/2|0|0)){break}if((dC(f,z,m-1|0,m,n,0,1)|0)>(v|0)){y=2996;break}z=z+1|0}if((z|0)==((l|0)/2|0|0)){break}z=g+(dC(f,0,(m|0)/4|0,l,n,0,3)|0)|0;while(1){if((z|0)>=(h-((l|0)/3|0)|0)){break}if(((du(z,z,j,j+((m|0)/4|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==0){y=3004;break}z=z+1|0}if((z|0)<(h-((l|0)/3|0)|0)){break}do{if((r|0)==0){if((c[e+108>>2]|0)!=0){break L3988}else{break}}}while(0);o=223;dy(a,o,98)|0}}while(0)}}while(0);s=100;t=100;if((l|0)>2){A=(m|0)>2}else{A=0}L4129:do{if(A){if((c[e+108>>2]|0)>1){break}r=((l+1|0)/3|0)-1|0;x=((m+1|0)/3|0)-1|0;if(((du(g,g+r|0,j,j+x|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(g,g+r|0,k-x|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(h-((l+1|0)/4|0)|0,h,j,j+x|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}do{if(((du(h-r|0,h,k-x|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){if(((du(h-r|0,h,k-((m+2|0)/4|0)|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break L4129}else{t=(t*99|0|0)/100|0;break}}}while(0);v=0;w=j+x|0;while(1){if((w|0)>(k-x|0)){break}if(((du(g+((l|0)/9|0)|0,h-((l|0)/9|0)|0,w,w,c[a+68>>2]|0,n,2)|0)<<24>>24|0)==0){y=3034;break}w=w+1|0}if((y|0)==3034){v=w}if((l*3|0|0)<(m<<1|0)){t=(t*99|0|0)/100|0}if((v|0)==0){break}B=43;dy(a,B,t)|0;if((t|0)<100){break}C=B;D=C;i=b;return D|0}}while(0);s=99;t=99;if((l|0)>3){E=(m|0)>6}else{E=0}L4172:do{if(E){if((c[e+108>>2]|0)!=2){break}if(((du(g,g+((l|0)/5|0)|0,j,j+((m|0)/18|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(g,g+((l|0)/9|0)|0,k-((m|0)/23|0)|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(h-((l|0)/9|0)|0,h,j,j+((m|0)/18|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(h-((l|0)/5|0)|0,h,k-((m|0)/23|0)|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(g,g+((l|0)/3|0)|0,j+((m|0)/3|0)|0,j+((m|0)/2|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/3|0)|0,h,k-((m|0)/2|0)|0,k-((m|0)/3|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break}F=g+(dC(c[a+68>>2]|0,g,j,l,n,0,3)|0)|0;do{if((F|0)>=(g+((l|0)/3|0)|0)){if((F|0)>(h-((l|0)/5|0)|0)){break}G=g+(dC(c[a+68>>2]|0,g,k,l,n,0,3)|0)|0;do{if((G|0)>=(g+((l|0)/5|0)|0)){if((G|0)>(F|0)){break}t=(aa(dt(F,j,G,k,c[a+68>>2]|0,n,100)|0,t)|0)/100|0;if((c[e+128>>2]|0)<(c[e+156>>2]|0)){H=0}else{H=1}if((c[e+112+((0^H)*28|0)+24>>2]|0)>(c[e+112+((1^H)*28|0)+16>>2]|0)){break L4172}if((c[e+112+((0^H)*28|0)+12>>2]|0)>((l+1|0)/3|0|0)){break L4172}if((c[e+112+((0^H)*28|0)+20>>2]|0)>(((l|0)/2|0)+((l|0)/4|0)|0)){break L4172}if((c[e+112+((0^H)*28|0)+24>>2]|0)>=(((m|0)/2|0)+((m|0)/8|0)|0)){break L4172}if((c[e+112+((0^H)*28|0)+16>>2]|0)>(((m|0)/2|0)-((m|0)/8|0)|0)){break L4172}if((c[e+112+((1^H)*28|0)+12>>2]|0)<=(((l|0)/2|0)-((l|0)/4|0)|0)){break L4172}if((c[e+112+((1^H)*28|0)+20>>2]|0)<(((l|0)/2|0)+((l|0)/4|0)|0)){break L4172}if((c[e+112+((1^H)*28|0)+24>>2]|0)<(((m|0)/2|0)+((m|0)/8|0)|0)){break L4172}if((c[e+112+((1^H)*28|0)+16>>2]|0)<=(((m|0)/2|0)-((m|0)/8|0)|0)){break L4172}if((t|0)<95){break L4172}B=36;A=a;x=B;r=t;dy(A,x,r)|0;if((t|0)<100){break L4172}C=B;D=C;i=b;return D|0}}while(0);break L4172}}while(0)}}while(0);s=99;t=99;if((l|0)>3){I=(m|0)>6}else{I=0}L4246:do{if(I){if((c[a+196>>2]|0)!=1){break}if(((du(g,g+((l|0)/9|0)|0,k-((m|0)/23|0)|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(h-((l|0)/9|0)|0,h,j,j+((m|0)/18|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(h-((l|0)/5|0)|0,h,k-((m|0)/23|0)|0,k,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if(((du(g,g+((l|0)/3|0)|0,j+((m|0)/3|0)|0,j+((m|0)/2|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/3|0)|0,h,k-((m|0)/2|0)|0,k-((m|0)/3|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break}F=g+(dC(c[a+68>>2]|0,g,j,l,n,0,3)|0)|0;do{if((F|0)>=(g+((l|0)/3|0)|0)){if((F|0)>(h-((l|0)/5|0)|0)){break}G=g+(dC(c[a+68>>2]|0,g,k,l,n,0,3)|0)|0;do{if((G|0)>=(g+((l|0)/5|0)|0)){if((G|0)>(F|0)){break}F=cI(a,c[p+12>>2]|0,c[p+28>>2]|0,h+(l<<1)|0,(j+k|0)/2|0)|0;G=cI(a,c[p+44>>2]|0,c[p+60>>2]|0,g-(l<<1)|0,(j+k|0)/2|0)|0;do{if(((c[a+296+(F<<3)>>2]|0)-g|0)>=((l*3|0|0)/4|0|0)){if(((c[a+296+(G<<3)>>2]|0)-g|0)>((l|0)/4|0|0)){break}if(((c[a+296+(F<<3)+4>>2]|0)-j|0)<((c[a+296+(G<<3)+4>>2]|0)-j|0)){break}if((t|0)<95){break L4246}B=36;H=a;E=B;r=t;dy(H,E,r)|0;if((t|0)<100){break L4246}C=B;D=C;i=b;return D|0}}while(0);break L4246}}while(0);break L4246}}while(0)}}while(0);s=99;t=99;if((l|0)>3){J=(m|0)>4}else{J=0}L4291:do{if(J){if((c[e+108>>2]|0)!=2){break}if(((du(h-((l|0)/9|0)|0,h,j,j+((m|0)/4|0)|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}if((dC(f,(l|0)/2|0,0,m,n,0,2)|0)>((m|0)/2|0|0)){break}F=dC(f,0,(m|0)/8|0,l,n,0,3)|0;if((F|0)>((l|0)/2|0|0)){break}v=dC(f,0,(m|0)/4|0,l,n,0,3)|0;if((F|0)>((l|0)/2|0|0)){break}if((v|0)<(F|0)){F=v}p=dC(f,0,m-((m|0)/4|0)|0,l,n,0,3)|0;if((p|0)>((l|0)/2|0|0)){break}v=dC(f,0,m-((m|0)/4|0)-1|0,l,n,0,3)|0;if((p|0)>((l|0)/2|0|0)){break}if((v|0)<(p|0)){p=v}if((p|0)>(F|0)){break}G=0;w=(m|0)/4|0;while(1){if((w|0)>(((m|0)/2|0)+1|0)){break}v=dC(f,0,w,l,n,0,3)|0;if((v|0)>(G|0)){G=v}w=w+1|0}if(((G<<1)-F-p|0)<1){break}if((dH(g,h-((l|0)/4|0)|0,j,k,c[a+68>>2]|0,n,0)|0)!=2){break}if((dv(l-1|0,l-1|0,(m|0)/4|0,m-1|0,f,n)|0)<1){break}z=l-1|0;while(1){if((z|0)<((l|0)/2|0|0)){break}if((dv(z,z,(m|0)/4|0,m-1|0,f,n)|0)>1){y=3164;break}z=z-1|0}do{if((z|0)<=((l*3|0|0)/4|0|0)){if((z|0)>=(l-2|0)){break}break L4291}}while(0);if((dv(0,l-1|0,m-1-((m|0)/4|0)|0,m-1-((m|0)/4|0)|0,f,n)|0)>3){if((m|0)>15){break}t=(t*96|0|0)/100|0}if((q|0)==0){t=(t*98|0|0)/100|0}o=38;dy(a,o,t)|0;if((t|0)<100){break}C=o;D=C;i=b;return D|0}}while(0);if((o|0)==57344){s=100;t=100;if((l|0)>7){K=(m|0)>7}else{K=0}do{if(K){if((c[e+108>>2]|0)>2){break}if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,f,n)|0)!=3){break}if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,f,n)|0)!=4){break}if((dv((l|0)/2|0,l-1|0,(m|0)/2|0,(m|0)/2|0,f,n)|0)!=2){break}if((dv(0,l-1|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,f,n)|0)!=2){break}if((dv(0,l-1|0,m-1|0,m-1|0,f,n)|0)!=1){break}if((dv(0,0,0,m-1|0,f,n)|0)!=1){break}if((dv((l|0)/3|0,(l|0)/3|0,0,m-1|0,f,n)|0)!=4){break}if((dv((l*13|0|0)/16|0,(l*13|0|0)/16|0,0,(m|0)/8|0,f,n)|0)!=0){break}if((dv((l<<2|0)/8|0,(l<<2|0)/8|0,m-((m|0)/4|0)|0,m-1|0,f,n)|0)!=1){break}if((dv((l*3|0|0)/8|0,(l*3|0|0)/8|0,m-((m|0)/4|0)|0,m-1|0,f,n)|0)!=1){break}if((dv((l*5|0|0)/8|0,(l*5|0|0)/8|0,m-((m|0)/4|0)|0,m-1|0,f,n)|0)!=1){break}if((dH(g,(g+h|0)/2|0,j,k,c[a+68>>2]|0,n,0)|0)!=1){break}if((dH(g+((l|0)/8|0)|0,h-((l|0)/4|0)|0,j,k-((m|0)/4|0)|0,c[a+68>>2]|0,n,0)|0)!=1){break}B=38;J=a;p=B;I=t;dy(J,p,I)|0;if((t|0)<100){break}C=B;D=C;i=b;return D|0}}while(0)}s=98;t=98;if((l|0)>2){L=(m|0)>5}else{L=0}L4427:do{if(L){if((c[e+108>>2]|0)>1){break}if((dv(g,h,j,j,c[a+68>>2]|0,n)|0)!=1){break}if((dv(g,h,k,k,c[a+68>>2]|0,n)|0)>1){break}w=j;while(1){if((w|0)>=(k|0)){break}if(((du(g,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){y=3230;break}w=w+1|0}if((w<<1|0)<(j+k|0)){break}F=k;do{if((w|0)==(k|0)){if((c[a+64>>2]|0)==0){break}if(((du(g+1|0,h-1|0,k+1|0,c[a+64>>2]|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break L4427}F=c[a+64>>2]|0;while(1){if((F|0)<=(k|0)){break}if(((du(g,h,F,F,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=3242;break}F=F-1|0}}}while(0);w=w-1|0;v=w-j+1|0;w=0;while(1){if((w|0)>=((m|0)/2|0|0)){break}if((dv(g,h,j+w|0,j+w|0,c[a+68>>2]|0,n)|0)==2){y=3249;break}w=w+1|0}if((w|0)==((m|0)/2|0|0)){break}if((c[e+108>>2]|0)>0){break}w=j+((m|0)/2|0)|0;while(1){if((w|0)>(F|0)){break}if(((du(g,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==0){y=3259;break}w=w+1|0}if((w|0)==(F|0)){break}while(1){if((w|0)>(F|0)){break}if(((du(g,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=3267;break}w=w+1|0}if(((du(g,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){break}if(((du(g+((l*7|0|0)/8|0)|0,h,w,F,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){break}o=63;dy(a,o,98)|0;C=o;D=C;i=b;return D|0}}while(0);s=99;t=99;if((m|0)>4){M=(m|0)>(l<<1|0)}else{M=0}L4509:do{if(M){if((c[e+108>>2]|0)>1){break}if((dv(g,h,j,j,c[a+68>>2]|0,n)|0)!=1){break}if((dv(g,h,j+((m|0)/2|0)|0,j+((m|0)/2|0)|0,c[a+68>>2]|0,n)|0)!=1){break}w=j;while(1){if((w|0)>=(k|0)){break}if(((du(g,h,w,w,c[a+68>>2]|0,n,1)|0)<<24>>24|0)!=1){y=3288;break}w=w+1|0}if((w<<1|0)<(j+k|0)){break}do{if((w|0)==(k|0)){if((w|0)<=((c[a+60>>2]|0)-((m|0)/8|0)|0)){break}t=(t*97|0|0)/100|0}}while(0);F=k;do{if((w|0)==(k|0)){if((c[a+64>>2]|0)==0){break}if((l|0)>2){if(((du(g+1|0,h-1|0,k+1|0,c[a+64>>2]|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=3302}else{y=3300}}else{y=3300}do{if((y|0)==3300){if((l|0)>=3){break}if(((du(g,h,k+1|0,c[a+64>>2]|0,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=3302}}}while(0);if((y|0)==3302){F=c[a+64>>2]|0;while(1){if((F|0)<=(k|0)){break}if(((du(g,h,F,F,c[a+68>>2]|0,n,1)|0)<<24>>24|0)==1){y=3305;break}F=F-1|0}}}}while(0);G=F;F=0;w=j;while(1){if((w|0)>(G|0)){break}v=dv(g,h,w,w,c[a+68>>2]|0,n)|0;if((v|0)>1){y=3313;break}do{if((v|0)==0){if((F|0)!=0){break}F=w}}while(0);w=w+1|0}do{if((w|0)>(G|0)){if((F|0)==0){break}if((F|0)<(j+((m|0)/2|0)|0)){break}L=dC(f,l-1|0,(m|0)/8|0,l,n,0,4)|0;if((L-(dC(f,l-1|0,0,l,n,0,4)|0)|0)>(((l|0)/4|0)+1|0)){break L4509}if((q|0)==0){t=(t*96|0|0)/100|0}L=a;B=t;dy(L,33,B)|0;break L4509}}while(0)}}while(0);s=99;t=99;if((l|0)>2){N=(m|0)>4}else{N=0}L4583:do{if(N){if((c[e+108>>2]|0)>0){break}do{if((dv(0,l-1|0,0,m-1|0,f,n)|0)!=1){if((dv(0,l-1|0,1,m-2|0,f,n)|0)==1){break}break L4583}}while(0);do{if((dv(0,l-1|0,m-1|0,m-1|0,f,n)|0)!=2){if((dv(0,l-1|0,m-2|0,m-2|0,f,n)|0)==2){break}break L4583}}while(0);z=(l|0)/2|0;w=((m*6|0)+8|0)/16|0;F=dt(z,w,z,0,f,n,100)|0;v=F;c[d>>2]=F;if((v|0)<95){break}do{if((l|0)<8){if(((du(z,z,0,w,f,n,2)|0)<<24>>24|0)==2){break L4583}else{break}}}while(0);F=dt(0,w,l-1|0,w,f,n,100)|0;v=F;c[d+4>>2]=F;if((v|0)<95){break}if((m|0)<8){do{if(((du(0,l-1|0,w,w,f,n,2)|0)<<24>>24|0)==2){if(((du(0,l-1|0,w+1|0,w+1|0,f,n,2)|0)<<24>>24|0)!=2){break}break L4583}}while(0)}v=dt(z,w,((l*5|0)+4|0)/8|0,m-1|0,f,n,100)|0;O=dt(z,w,((l*6|0)+4|0)/8|0,m-1|0,f,n,100)|0;if((O|0)>(v|0)){F=O;v=F;c[d+8>>2]=F}if((v|0)<95){break}F=dt(z,w,((l<<1)+4|0)/8|0,m-1|0,f,n,100)|0;v=F;c[d+12>>2]=F;if((v|0)<95){break}F=(du(z,z,m-1-((m|0)/8|0)|0,m-1|0,f,n,1)|0)<<24>>24;v=F;c[d+16>>2]=F;if((v|0)==1){break}F=dt((l|0)/4|0,(m|0)/4|0,0,0,f,n,101)|0;v=F;c[d+20>>2]=F;if((v|0)<95){break}F=dt(l-1-((l|0)/4|0)|0,(m|0)/4|0,l-1|0,0,f,n,101)|0;v=F;c[d+24>>2]=F;if((v|0)<95){break}else{F=a;G=t;dy(F,42,G)|0;break}}}while(0);s=100;t=100;if((l|0)>4){Q=(m|0)>4}else{Q=0}L4638:do{if(Q){if((c[e+108>>2]|0)>0){break}do{if((dv(0,l-1|0,(m|0)/8|0,(m|0)/8|0,f,n)|0)!=3){if((dv(0,l-1|0,((m|0)/8|0)+1|0,((m|0)/8|0)+1|0,f,n)|0)==3){break}break L4638}}while(0);if((dv(0,l-1|0,m-2-((m|0)/8|0)|0,m-2-((m|0)/8|0)|0,f,n)|0)!=3){break}if((dv(0,0,0,m-1|0,f,n)|0)!=2){break}if((dv(l-1|0,l-1|0,0,m-1|0,f,n)|0)!=2){break}if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,f,n)|0)!=1){break}if((dv(0,(l|0)/8|0,(m|0)/2|0,(m|0)/2|0,f,n)|0)!=0){break}if((dv(l-1-((l|0)/8|0)|0,l-1|0,(m|0)/2|0,(m|0)/2|0,f,n)|0)!=0){break}do{if((l|0)>5){N=dt(0,m-2-((m|0)/8|0)|0,l-1|0,(m|0)/8|0,f,n,100)|0;v=N;c[d>>2]=N;if((v|0)<95){break L4638}N=dt(0,(m|0)/8|0,l-1|0,m-2-((m|0)/8|0)|0,f,n,100)|0;v=N;c[d+4>>2]=N;if((v|0)<95){break L4638}N=dt((l|0)/2|0,0,(l|0)/2|0,m-1|0,f,n,100)|0;v=N;c[d+8>>2]=N;if((v|0)<95){break L4638}else{break}}}while(0);N=a;dy(N,42,99)|0}}while(0);s=100;t=100;if((l|0)>3){R=(m|0)>4}else{R=0}L4682:do{if(R){if((c[e+108>>2]|0)>0){break}do{if((dv((l|0)/8|0,(l|0)/8|0,0,m-1|0,f,n)|0)!=3){if((dv(((l|0)/8|0)+1|0,((l|0)/8|0)+1|0,0,m-1|0,f,n)|0)==3){break}break L4682}}while(0);do{if((dv(l-1-((l|0)/8|0)|0,l-1-((l|0)/8|0)|0,0,m-1|0,f,n)|0)!=3){if((dv(l-2-((l|0)/8|0)|0,l-2-((l|0)/8|0)|0,0,m-1|0,f,n)|0)==3){break}break L4682}}while(0);if((dv(0,l-1|0,0,0,f,n)|0)!=2){break}if((dv(0,l-1|0,m-1|0,m-1|0,f,n)|0)!=2){break}if((dv((l|0)/2|0,(l|0)/2|0,0,m-1|0,f,n)|0)!=1){break}if((dv((l|0)/2|0,(l|0)/2|0,0,(m|0)/8|0,f,n)|0)!=0){break}if((dv((l|0)/2|0,(l|0)/2|0,m-1-((m|0)/8|0)|0,m-1|0,f,n)|0)!=0){break}do{if((l|0)>5){Q=dt(l-2-((l|0)/8|0)|0,0,(l|0)/8|0,m-1|0,f,n,100)|0;v=Q;c[d>>2]=Q;if((v|0)<95){break L4682}Q=dt((l|0)/8|0,0,l-2-((l|0)/8|0)|0,m-1|0,f,n,100)|0;v=Q;c[d+4>>2]=Q;if((v|0)<95){break L4682}Q=dt(0,(m|0)/2|0,l-1|0,(m|0)/2|0,f,n,100)|0;v=Q;c[d+8>>2]=Q;if((v|0)<95){break L4682}else{break}}}while(0);Q=a;dy(Q,42,98)|0}}while(0);if((o|0)==57344){s=99;t=99;if((l|0)>4){S=(m|0)>7}else{S=0}L4729:do{if(S){if((c[e+108>>2]|0)>3){break}do{if((c[e+108>>2]|0)==1){if((c[e+128>>2]|0)>(j+((m|0)/8|0)|0)){break}if((c[e+136>>2]|0)<(k-((m|0)/8|0)|0)){break}break L4729}}while(0);if((dC(f,0,(m|0)/2|0,l,n,0,3)|0)>((l|0)/4|0|0)){break}if((dC(f,l-1|0,(m|0)/2|0,l,n,0,4)|0)>((l|0)/4|0|0)){break}if((dC(f,(l|0)/2|0,m-1|0,m,n,0,1)|0)>((l|0)/8|0|0)){break}if((dC(f,(l|0)/2|0,0,m,n,0,2)|0)>((l|0)/8|0|0)){break}z=((l*7|0)+3|0)/16|0;w=(m|0)/2|0;v=dv(0,l-1|0,w,w,f,n)|0;O=dC(f,0,w,l,n,0,3)|0;O=dC(f,O,w,l,n,1,3)|0;do{if((l|0)>=(O<<2|0)){if((v|0)>=3){if((v|0)<=4){break}}break L4729}}while(0);do{if((l|0)>=(O*5|0|0)){if((v|0)==4){break}t=(t*98|0|0)/100|0}}while(0);v=dv(z,z,0,m-1|0,f,n)|0;if((v|0)<2){break}if((v|0)!=4){O=dv(z+1|0,z+1|0,0,m-1|0,f,n)|0;if((P(4-O|0)|0)<(P(v-4|0)|0)){v=O}}if((v|0)!=4){O=dv(z+2|0,z+2|0,0,m-1|0,f,n)|0;if((P(4-O|0)|0)<(P(v-4|0)|0)){v=O}}do{if((v|0)>=3){if((v|0)>4){break}if((v|0)!=4){t=(t*97|0|0)/100|0}if((dv(0,z,w,w,f,n)|0)!=2){break L4729}do{if((dv(z,l-1|0,w,w,f,n)|0)!=2){if((l|0)<(O<<2|0)){break}break L4729}}while(0);if((dv(z,z,0,w,f,n)|0)!=2){break L4729}if((dv(z,z,w,m-1|0,f,n)|0)!=2){break L4729}do{if((l|0)>7){if((c[e+108>>2]|0)!=1){break L4729}if((dH(g+((l|0)/8|0)|0,h-((l*3|0|0)/16|0)|0,j+((m|0)/8|0)|0,k-((m|0)/8|0)|0,c[a+68>>2]|0,n,0)|0)!=1){break L4729}else{break}}}while(0);d=a;R=t;dy(d,64,R)|0;break L4729}}while(0)}}while(0)}do{if((o|0)==57344){if((q|0)==0){break}s=100;t=100;if((l|0)>4){T=(m|0)>15}else{T=0}do{if(T){if((c[e+108>>2]|0)>3){break}if(((du(0,(l|0)/2|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,f,n,1)|0)<<24>>24|0)==1){break}if(((du((l*3|0|0)/4|0,l-1|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,f,n,1)|0)<<24>>24|0)==0){break}if(((du(0,(l|0)/4|0,(m|0)/4|0,(m|0)/4|0,f,n,1)|0)<<24>>24|0)==0){break}if(((du((l|0)/2|0,l-1|0,(m|0)/4|0,(m|0)/4|0,f,n,1)|0)<<24>>24|0)==1){break}if(((du((l|0)/2|0,(l|0)/2|0,0,(m|0)/4|0,f,n,1)|0)<<24>>24|0)==0){break}if(((du((l|0)/2|0,(l|0)/2|0,m-1-((m|0)/4|0)|0,m-1|0,f,n,1)|0)<<24>>24|0)==0){break}if((dv((l|0)/2|0,(l|0)/2|0,0,m-1|0,f,n)|0)!=4){break}if((dv(g,h,j+((m|0)/2|0)|0,j+((m|0)/2|0)|0,c[a+68>>2]|0,n)|0)!=2){break}if((dH(g,h,j+((m|0)/4|0)|0,k-((m|0)/4|0)|0,c[a+68>>2]|0,n,0)|0)!=1){break}else{w=a;dy(w,167,96)|0;break}}}while(0)}}while(0);C=o;D=C;i=b;return D|0}function dg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[a>>2]|0;f=c[a+4>>2]|0;g=c[a+8>>2]|0;h=c[a+12>>2]|0;i=f-e+1|0;j=h-g+1|0;k=c[b+8>>2]|0;l=b+44|0;m=57344;n=0;if((g<<1|0)<=((c[a+56>>2]<<1)-((c[a+56>>2]|0)-(c[a+52>>2]|0))|0)){n=1}o=0;if((h<<1|0)>=((c[a+60>>2]<<1)+((c[a+64>>2]|0)-(c[a+60>>2]|0))|0)){o=1}do{if((g|0)<(c[a+56>>2]|0)){if((h|0)<=(c[a+60>>2]|0)){break}if((h<<1|0)>=((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){break}if((g-(h-(c[a+60>>2]|0))<<1|0)<=((c[a+56>>2]<<1)-((c[a+56>>2]|0)-(c[a+52>>2]|0))|0)){n=1}}}while(0);if((m|0)==57344){p=98;if((i|0)>4){q=(j|0)>6}else{q=0}L4870:do{if(q){if((c[b+108>>2]|0)>2){break}do{if((dv(0,i-1|0,(j|0)/4|0,(j|0)/4|0,d,k)|0)!=2){if((dv(0,i-1|0,(j*3|0|0)/16|0,(j*3|0|0)/16|0,d,k)|0)==2){break}break L4870}}while(0);do{if((dv(0,i-1|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)!=2){if((dv(0,i-1|0,((j*3|0|0)/4|0)+1|0,((j*3|0|0)/4|0)+1|0,d,k)|0)==2){break}break L4870}}while(0);r=dC(d,0,(j|0)/8|0,i,k,0,3)|0;if((r+(dC(d,i-1|0,(j|0)/8|0,i,k,0,4)|0)|0)>((i|0)/2|0|0)){break}r=0;s=1;t=g+((j|0)/10|0)|0;while(1){if((t|0)<(h-((j|0)/10|0)|0)){u=(s|0)!=0}else{u=0}if(!u){break}v=dC(c[a+68>>2]|0,e,t,i,k,0,3)|0;w=v+(dC(c[a+68>>2]|0,f,t,i,k,0,4)|0)|0;if((w|0)>((i*10|0|0)/16|0|0)){s=0}if((w|0)>(r|0)){r=w}t=t+1|0}if((s|0)==0){break}x=(i|0)/4|0;while(1){if((x|0)>=((i|0)/2|0|0)){break}t=dC(d,x,j-1|0,j,k,0,1)|0;if((t|0)>((j*3|0|0)/8|0|0)){y=3562;break}if((t*10|0|0)>(j|0)){s=dC(d,x,j-t|0,i,k,0,3)|0;if((s|0)>1){if((t+(dC(d,x+s-1|0,j-t|0,j,k,0,1)|0)|0)>((j*3|0|0)/8|0|0)){y=3566;break}}}x=x+1|0}if((x|0)>=((i|0)/2|0|0)){break}r=dC(c[a+68>>2]|0,e,h-((j|0)/8|0)|0,i,k,0,3)|0;x=r+(dC(c[a+68>>2]|0,f,h-((j|0)/8|0)|0,i,k,0,4)|0)|0;s=1;t=(j|0)/4|0;while(1){if((t|0)<(j-1-((j|0)/4|0)|0)){z=(s|0)!=0}else{z=0}if(!z){break}r=dC(d,0,t,i,k,0,3)|0;w=r+(dC(d,i-1|0,t,i,k,0,4)|0)|0;if((w-x|0)>((i|0)/5|0|0)){s=0}t=t+1|0}if((s|0)==0){break}s=0;r=g+((j|0)/4|0)|0;t=r;v=r;while(1){if((t|0)>=(h-((j|0)/3|0)|0)){break}w=dC(c[a+68>>2]|0,e,t,i,k,0,3)|0;w=dC(c[a+68>>2]|0,e+w|0,t,i,k,1,3)|0;if((w|0)>(s|0)){s=w;v=t}t=t+1|0}if((s|0)<=((i|0)/2|0|0)){break}v=v-g|0;do{if((dv(0,i-1|0,v,v,d,k)|0)!=1){if((dv(0,i-1|0,v+1|0,v+1|0,d,k)|0)==1){break}break L4870}}while(0);t=v;while(1){if((t|0)>=(j-((j|0)/4|0)|0)){break}if((dv(0,i-1|0,t,t,d,k)|0)>2){if((dv(0,i-1|0,t+1|0,t+1|0,d,k)|0)>2){y=3597;break}}t=t+1|0}if((t|0)<(j-((j|0)/4|0)|0)){break}s=1;x=e+((i|0)/2|0)|0;while(1){if((x|0)<=(f-((i|0)/4|0)|0)){A=(s|0)!=0}else{A=0}if(!A){break}if(((du(x,x,g,g+((j|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){s=0}x=x+1|0}if((s|0)==0){break}s=1;x=e+((i|0)/4|0)|0;while(1){if((x|0)<=(f-((i|0)/4|0)|0)){B=(s|0)!=0}else{B=0}if(!B){break}if(((du(x,x,h-((j|0)/4|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){s=0}x=x+1|0}if((s|0)!=0){break}s=1;x=e+((i|0)/4|0)|0;while(1){if((x|0)<=(f-((i|0)/4|0)|0)){C=(s|0)!=0}else{C=0}if(!C){break}if((dv(x,x,g+((j|0)/8|0)|0,h-((j|0)/8|0)|0,c[a+68>>2]|0,k)|0)==1){s=0}x=x+1|0}if((s|0)!=0){break}s=1;t=g;while(1){if((t|0)<=(g+((j|0)/4|0)|0)){D=(s|0)!=0}else{D=0}if(!D){break}if((dv(e,f,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){break}s=1;t=h-((j|0)/4|0)|0;while(1){if((t|0)<=(h|0)){E=(s|0)!=0}else{E=0}if(!E){break}if((dv(e,f,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){break}if((dv(e,e+((i|0)/8|0)|0,g+((j|0)/8|0)|0,g,c[a+68>>2]|0,k)|0)!=0){p=(p*96|0|0)/100|0}if(((du(f-((i|0)/8|0)|0,f,g,g+((j|0)/8|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e,e+((i|0)/8|0)|0,h-((j|0)/8|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}F=dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0;if((F|0)>((i|0)/2|0|0)){break}G=dC(d,i-1|0,(j|0)/2|0,i,k,0,4)|0;do{if((G|0)>=(F-((i|0)/4|0)|0)){if((G|0)>(F+((i|0)/8|0)|0)){break}H=dC(d,i-1|0,j-1-((j|0)/4|0)|0,i,k,0,4)|0;do{if((H|0)>=(G-((i|0)/4|0)|0)){if((H|0)>(G+((i|0)/8|0)|0)){break}if((P(F+H-(G<<1)|0)|0)>(((i|0)/16|0)+1|0)){break L4870}if((dH(e,f,g+((j|0)/4|0)|0,h,c[a+68>>2]|0,k,0)|0)!=0){break L4870}if((n|0)==0){p=(p*96|0|0)/100|0}if((o|0)==0){p=(p*99|0|0)/100|0}I=64256;v=a;r=I;J=p;dy(v,r,J)|0;break L4870}}while(0);break L4870}}while(0)}}while(0)}if((m|0)==57344){p=98;if((i|0)>4){K=(j|0)>6}else{K=0}L5073:do{if(K){if((c[b+108>>2]|0)>4){break}do{if((dv((i|0)/4|0,i-1|0,(j*3|0|0)/16|0,(j*3|0|0)/16|0,d,k)|0)!=2){if((dv(i-1-((i|0)/4|0)|0,i-1|0,(j*3|0|0)/16|0,(j*3|0|0)/16|0,d,k)|0)==1){break}break L5073}}while(0);if((dv(0,i-1|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)<2){break}if((dv(0,i-1|0,0,j-1|0,d,k)|0)<3){break}if((dv(i-1|0,0,0,j-1|0,d,k)|0)<3){break}do{if((dv(0,i-1|0,(j|0)/16|0,(j|0)/16|0,d,k)|0)<2){if((dv(0,i-1|0,((j|0)/16|0)+1|0,((j|0)/16|0)+1|0,d,k)|0)<2){break L5073}else{break}}}while(0);if((dv(0,i-1|0,j-1-((j|0)/16|0)|0,j-1-((j|0)/16|0)|0,d,k)|0)<2){break}x=0;E=(j|0)/4|0;t=E;G=E;while(1){if((t|0)>=((j*3|0|0)/4|0|0)){break}w=dC(d,0,t,i,k,0,3)|0;if((w|0)>(x|0)){G=t;x=w}t=t+1|0}do{if((x|0)>=((i|0)/4|0|0)){if((x|0)>((i*3|0|0)/4|0|0)){break}x=0;E=(j|0)/4|0;t=E;L=E;while(1){if((t|0)>=((j*3|0|0)/4|0|0)){break}w=dC(d,i-1|0,t,i,k,0,4)|0;if((w|0)>(x|0)){L=t;x=w}t=t+1|0}do{if((x|0)>=((i|0)/4|0|0)){if((x|0)>((i*3|0|0)/4|0|0)){break}x=0;E=(j|0)/8|0;t=E;L=E;while(1){if((t|0)>=((j*3|0|0)/4|0|0)){break}w=dC(d,i-1|0,t,i,k,0,4)|0;w=dC(d,i-1-w|0,t,i,k,1,4)|0;if((w|0)>(x|0)){L=t;x=w}t=t+1|0}if((x|0)<((i|0)/4|0|0)){break L5073}if((dH(e,e+((i*3|0|0)/4|0)|0,g+((j|0)/4|0)|0,h,c[a+68>>2]|0,k,0)|0)!=1){break L5073}if((dH(e+((i|0)/2|0)-1|0,f,g,h-((j|0)/4|0)|0,c[a+68>>2]|0,k,0)|0)!=1){break L5073}I=230;dy(a,I,p)|0;if((p|0)<100){break L5073}M=I;N=M;return N|0}}while(0);break L5073}}while(0)}}while(0)}if((m|0)==57344){p=98;if((i|0)>5){O=(j|0)>6}else{O=0}L5153:do{if(O){if((c[b+108>>2]|0)>2){break}if((dv(0,i-1|0,(j*3|0|0)/16|0,(j*3|0|0)/16|0,d,k)|0)<2){break}if((dv(0,i-1|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)<2){break}if((dv(0,i-1|0,0,j-1|0,d,k)|0)<3){break}do{if((dv(0,i-1|0,(j|0)/16|0,(j|0)/16|0,d,k)|0)!=1){if((dv(0,i-1|0,(j|0)/32|0,(j|0)/32|0,d,k)|0)==1){break}if((dv(0,i-1|0,0,0,d,k)|0)==1){break}break L5153}}while(0);w=dC(d,i-1|0,0,i,k,0,4)|0;x=w;w=dC(d,i-1-w|0,0,i,k,1,4)|0;s=dC(d,i-1|0,1,i,k,0,4)|0;if((s|0)<(x|0)){x=s}s=dC(d,i-1-s|0,1,i,k,1,4)|0;if((s|0)>(w|0)){w=s}if((x|0)>((i|0)/8|0|0)){break}if((w|0)<((i|0)/4|0|0)){break}x=i;H=0;F=0;K=(j|0)/4|0;t=K;G=K;while(1){if((t|0)>=((j*3|0|0)/4|0|0)){break}w=dC(d,0,t,i,k,0,3)|0;if((w|0)>(x|0)){y=3760;break}x=w;w=dC(d,w,t,i,k,1,3)|0;if((w|0)>(F|0)){F=w;G=t}w=dC(d,i-1|0,t,i,k,0,4)|0;w=dC(d,i-1-w|0,t,i,k,1,4)|0;if((w|0)>(H|0)){H=w;L=t}t=t+1|0}do{if((t|0)>=((j*3|0|0)/4|0|0)){if((F|0)<(((i|0)/4|0)-1|0)){break}if((H|0)<(((i|0)/4|0)-1|0)){break}H=0;F=0;t=0;while(1){if((t|0)>=((j|0)/8|0|0)){break}w=dC(d,i-1|0,t,i,k,0,4)|0;w=dC(d,i-1-w|0,t,i,k,1,4)|0;if((w|0)>(F|0)){F=w}w=dC(d,i-1|0,j-1-t|0,i,k,0,4)|0;w=dC(d,i-1-w|0,j-1-t|0,i,k,1,4)|0;if((w|0)>(H|0)){H=w}t=t+1|0}do{if((F|0)>((i|0)/4|0|0)){if((H|0)<=((i|0)/4|0|0)){break}x=i-1-((i|0)/8|0)|0;while(1){if((x|0)<=((i|0)/2|0|0)){break}if((dv(x,x,0,j-1|0,d,k)|0)==3){if((dv(x,x,0,(j|0)/4|0,d,k)|0)==1){if((dv(x-1|0,i-1-((i|0)/8|0)|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)==0){if((dv(x,x,(j*3|0|0)/4|0,j-1|0,d,k)|0)==1){y=3788;break}}}}x=x-1|0}if((x|0)<=((i|0)/2|0|0)){break L5153}if((c[b+108>>2]|0)!=1){break L5153}if((dH(e,e+((i*3|0|0)/4|0)|0,g,h-((j|0)/4|0)|0,c[a+68>>2]|0,k,0)|0)!=1){break L5153}I=198;dy(a,I,p)|0;if((p|0)<100){break L5153}M=I;N=M;return N|0}}while(0);break L5153}}while(0)}}while(0)}p=99;if((i|0)>4){Q=(j|0)>4}else{Q=0}do{if(Q){if((c[b+108>>2]|0)>3){break}if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=3){break}if((dv((i|0)/2|0,(i|0)/2|0,0,j-1|0,d,k)|0)!=3){break}if((dC(d,i-1|0,(j*3|0|0)/8|0,i,k,0,3)|0)>((i|0)/8|0|0)){break}if((dC(d,0,(j*5|0|0)/8|0,i,k,0,3)|0)>((i|0)/8|0|0)){break}if((dv(0,i-1|0,0,0,d,k)|0)>2){break}if((dv((i|0)/4|0,i-1|0,0,0,d,k)|0)>2){break}if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)>2){break}if((dv(0,(i*3|0|0)/4|0,j-1|0,j-1|0,d,k)|0)>2){break}if((dv(0,0,0,j-1|0,d,k)|0)>2){break}if((dv(i-1|0,i-1|0,0,j-1|0,d,k)|0)>2){break}if((dv(0,0,(j|0)/4|0,j-1|0,d,k)|0)>2){break}if((dv(i-1|0,i-1|0,0,(j*3|0|0)/4|0,d,k)|0)>2){break}F=dC(d,i-1|0,0,i,k,0,4)|0;if((F|0)>((i|0)/8|0|0)){break}F=F+(dC(d,i-1-F|0,0,i,k,1,4)|0)|0;if((F|0)>((i|0)/3|0|0)){break}F=i-1-F|0;G=dC(d,0,j-1|0,i,k,0,3)|0;if((G|0)>((i|0)/8|0|0)){break}t=1;while(1){if((t|0)>=(j-1|0)){break}x=F+((aa(t,G-F|0)|0)/(j|0)|0)-((i|0)/8|0)|0;if((x|0)<0){x=0}w=dC(d,x,t,i,k,0,3)|0;if((w|0)>((i*3|0|0)/16|0|0)){y=3845;break}t=t+1|0}if((t|0)<(j-1|0)){break}if((dv(0,(i|0)/4|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}if((dv(i-1-((i|0)/4|0)|0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}if((dv((i|0)/4|0,i-1-((i|0)/4|0)|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}if((c[b+108>>2]|0)!=2){break}do{if((n|0)!=0){if((g<<1|0)>=((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){y=3861;break}I=216}else{y=3861}}while(0);if((y|0)==3861){I=248}dy(a,I,p)|0;if((p|0)<100){break}M=I;N=M;return N|0}}while(0);if((m|0)==57344){p=98;if((i|0)>4){R=(j|0)>4}else{R=0}do{if(R){if((c[b+108>>2]|0)>2){break}if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=2){break}if((dv(0,i-1-((i|0)/4|0)|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=2){break}if((dv((i|0)/2|0,(i|0)/2|0,0,j-1|0,d,k)|0)!=3){break}if((dv(0,i-1|0,0,0,d,k)|0)>2){break}if((dv((i|0)/4|0,i-1|0,0,0,d,k)|0)>2){break}if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)>2){break}if((dv(0,(i*3|0|0)/4|0,j-1|0,j-1|0,d,k)|0)>2){break}if((dv(0,0,0,j-1|0,d,k)|0)>2){break}if((dv(i-1|0,i-1|0,0,j-1|0,d,k)|0)>3){break}if((dv(0,0,(j|0)/4|0,j-1|0,d,k)|0)>2){break}if((dv(i-1|0,i-1|0,0,(j*3|0|0)/4|0,d,k)|0)>3){break}F=dC(d,i-1|0,0,i,k,0,4)|0;if((F|0)>((i|0)/4|0|0)){break}F=F+(dC(d,i-1-F|0,0,i,k,1,4)|0)|0;if((F|0)>((i|0)/4|0|0)){break}F=i-1-F|0;G=dC(d,0,j-1|0,i,k,0,3)|0;if((G|0)>((i|0)/4|0|0)){break}t=0;while(1){if((t|0)>=(j|0)){break}x=F+((aa(t,G-F|0)|0)/(j|0)|0)|0;if((x|0)>(((i|0)/16|0)+1|0)){x=x-(((i|0)/16|0)+1)|0}w=dC(d,x,t,i,k,0,3)|0;if((w|0)>((i+4|0)/8|0|0)){p=(p*96|0|0)/100|0}if((w|0)>((i+2|0)/4|0|0)){y=3907;break}t=t+1|0}if((t|0)<(j|0)){break}if((dv(0,(i|0)/4|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}if((dv(i-1-((i|0)/4|0)|0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=0){break}if((dv((i|0)/4|0,i-1-((i|0)/4|0)|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}if((c[b+108>>2]|0)!=1){break}I=162;dy(a,I,p)|0;if((p|0)<100){break}M=I;N=M;return N|0}}while(0)}if((m|0)==57344){p=98;if((i|0)>4){S=(j|0)>6}else{S=0}L5435:do{if(S){if((c[b+108>>2]|0)>1){break}if((dv((i|0)/2|0,(i|0)/2|0,0,j-1|0,d,k)|0)!=4){break}if((dv(0,i-1|0,0,0,d,k)|0)!=1){break}if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)!=1){break}if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}s=0;t=(j|0)/4|0;while(1){if((t|0)>=(j-((j|0)/4|0)-1|0)){break}x=dC(d,0,t,i,k,0,3)|0;if((x|0)>((i|0)/4|0|0)){y=3942;break}w=dC(d,x,t,i,k,1,3)|0;if((w|0)>(s|0)){s=w}t=t+1|0}do{if((t|0)>=(j-((j|0)/4|0)-1|0)){if((s|0)<((i|0)/2|0|0)){break}t=(j|0)/4|0;while(1){if((t|0)>=(j-((j|0)/4|0)-1|0)){break}x=dC(d,i-1|0,t,i,k,0,4)|0;if((x|0)>((i|0)/2|0|0)){y=3953;break}t=t+1|0}if((t|0)>=(j-((j|0)/4|0)-1|0)){break L5435}if((c[b+108>>2]|0)!=0){break L5435}I=8364;dy(a,I,p)|0;if((p|0)<100){break L5435}M=I;N=M;return N|0}}while(0)}}while(0)}if((m|0)==57344){if((o|0)!=0){p=98;if((i|0)>3){T=(j|0)>6}else{T=0}L5495:do{if(T){if((c[b+108>>2]|0)>0){break}w=dC(d,i-1|0,(j|0)/16|0,j,k,0,4)|0;x=dC(d,i-1|0,((j|0)/16|0)+1|0,j,k,0,4)|0;if((x|0)<(w|0)){w=x}if((x*3|0|0)>(i|0)){break}if((dv(0,i-1|0,(j*3|0|0)/16|0,(j*3|0|0)/16|0,d,k)|0)>2){break}if((dv(0,i-1|0,0,j-1|0,d,k)|0)<2){break}if((dv(0,i-1|0,(j|0)/16|0,(j|0)/16|0,d,k)|0)>2){break}x=i;S=(j|0)/4|0;t=S;G=S;while(1){if((t|0)>=((j*3|0|0)/4|0|0)){break}w=dC(d,0,t,i,k,0,3)|0;if((w|0)<(x|0)){G=t;x=w}t=t+1|0}if((x|0)>0){break}F=x;x=0;S=(j|0)/4|0;t=S;L=S;while(1){if((t|0)>=((j*5|0|0)/8|0|0)){break}w=dC(d,i-1|0,t,i,k,0,4)|0;if((w|0)>(x|0)){L=t;x=w}t=t+1|0}if((x|0)<((i|0)/2|0|0)){break}H=x;w=dC(d,(i|0)/2|0,0,j,k,0,2)|0;w=w+(dC(d,(i|0)/2|0,w,j,k,1,2)|0)|0;if((w|0)>((j|0)/4|0|0)){break}w=dC(d,(i|0)/2|0,w,j,k,0,2)|0;if((w|0)<((j|0)/2|0|0)){break}w=dC(d,i-1|0,j-1-((j|0)/8|0)|0,i,k,0,4)|0;do{if((w|0)>=((i|0)/4|0|0)){if((w<<2|0)>(i*3|0|0)){break}w=dC(d,i-1-((w|0)/2|0)|0,j-1-((j|0)/8|0)|0,j,k,0,1)|0;if((w|0)>((j|0)/2|0|0)){break L5495}if((c[b+108>>2]|0)!=0){break L5495}if((n|0)!=0){I=199}else{I=231}S=a;R=I;Q=p;dy(S,R,Q)|0;if((p|0)<100){break L5495}M=I;N=M;return N|0}}while(0)}}while(0)}}p=99;if((i|0)>4){U=(j|0)>4}else{U=0}L5568:do{if(U){if((c[b+108>>2]|0)>2){break}if((c[b+108>>2]|0)<1){break}if((dv(0,i-1|0,(j|0)/8|0,(j|0)/8|0,d,k)|0)!=2){break}if((dv(0,i-1|0,j-1-((j|0)/8|0)|0,j-1-((j|0)/8|0)|0,d,k)|0)!=2){break}if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=2){break}if((dv(0,(i|0)/2|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}w=dC(d,0,(j|0)/8|0,i,k,0,3)|0;do{if((w|0)>=1){if((w|0)<((i|0)/16|0|0)){break}if((w|0)<((i|0)/8|0|0)){p=(p*96|0|0)/100|0}w=dC(d,0,(j|0)/2|0,i,k,0,3)|0;do{if((w|0)>=1){if((w|0)<((i|0)/16|0|0)){break}if((w|0)>=((i|0)/2|0|0)){break}if((w|0)<((i|0)/8|0|0)){p=(p*96|0|0)/100|0}w=dC(d,i-1|0,(j|0)/2|0,i,k,0,4)|0;do{if((w|0)>=1){if((w|0)<((i|0)/16|0|0)){break}if((w|0)>=((i|0)/2|0|0)){break}if((w|0)<((i|0)/8|0|0)){p=(p*96|0|0)/100|0}w=dC(d,i-1|0,j-1|0,i,k,0,4)|0;do{if((w|0)>=1){if((w|0)<((i|0)/16|0|0)){break}if((w|0)<((i|0)/8|0|0)){p=(p*96|0|0)/100|0}H=0;F=0;t=(j|0)/4|0;while(1){if((t|0)>=((j|0)/2|0|0)){break}w=dC(d,0,t,i,k,0,3)|0;if((w|0)>((i*3|0|0)/4|0|0)){y=4058;break}w=dC(d,w,t,i,k,1,3)|0;if((w|0)>(F|0)){F=w}w=dC(d,0,j-1-t|0,i,k,0,3)|0;if((w|0)>((i*3|0|0)/4|0|0)){y=4062;break}w=dC(d,w,j-1-t|0,i,k,1,3)|0;if((w|0)>(H|0)){H=w}t=t+1|0}if((y|0)==4058){F=0}else if((y|0)==4062){F=0}do{if((F|0)>=(i-((i|0)/4|0)|0)){if((H|0)<(i-((i|0)/4|0)|0)){break}if((F|0)<(i-((i|0)/8|0)|0)){p=(p*97|0|0)/100|0}if((H|0)<(i-((i|0)/8|0)|0)){p=(p*97|0|0)/100|0}if((c[b+108>>2]|0)!=1){p=(p*95|0|0)/100|0}if((dH(e+((i|0)/8|0)|0,f-((i|0)/8|0)|0,g+((j|0)/8|0)|0,h-((j|0)/8|0)|0,c[a+68>>2]|0,k,0)|0)!=1){break L5568}I=35;if((o|0)!=0){p=(p*99|0|0)/100|0}L=a;T=I;Q=p;dy(L,T,Q)|0;if((p|0)<100){break L5568}M=I;N=M;return N|0}}while(0);break L5568}}while(0);break L5568}}while(0);break L5568}}while(0);break L5568}}while(0)}}while(0);if((m|0)==57344){p=96;do{if((i|0)>4){if((j|0)<=4){V=0;break}V=(i<<1|0)>(j|0)}else{V=0}}while(0);do{if(V){if(((du(e,f,g,h,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){break}I=8226;do{if((o|0)!=0){if((n|0)!=0){break}p=(p*80|0|0)/100|0}}while(0);H=a;t=I;U=p;dy(H,t,U)|0;if((p|0)<100){break}M=I;N=M;return N|0}}while(0)}p=99;if((j|0)>4){W=(i<<1|0)<(j|0)}else{W=0}L5684:do{if(W){if(((du(e+((i|0)/8|0)|0,f-((i|0)/8|0)|0,g+((j|0)/9|0)|0,h-((j|0)/9|0)|0,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){break}if(((du(e,e+((i|0)/8|0)|0,g+((j|0)/9|0)|0,h-((j|0)/9|0)|0,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){p=(p*99|0|0)/100|0}if(((du(f-((i|0)/8|0)|0,f,g+((j|0)/9|0)|0,h-((j|0)/9|0)|0,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){p=(p*99|0|0)/100|0}if(((du(e+((i|0)/8|0)|0,f-((i|0)/8|0)|0,g,g+((j|0)/8|0)|0,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){p=(p*99|0|0)/100|0}if(((du(e+((i|0)/8|0)|0,f-((i|0)/8|0)|0,h-((j|0)/8|0)|0,h,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){p=(p*99|0|0)/100|0}if((i*3|0|0)<(j|0)){p=(p*98|0|0)/100|0}if((i<<2|0)<(j|0)){p=(p*99|0|0)/100|0}do{if((c[a+56>>2]|0)!=0){if((h<<1|0)>=((c[a+56>>2]|0)+(c[a+60>>2]|0)|0)){break}break L5684}}while(0);do{if((c[a+56>>2]|0)!=0){if((h*3|0|0)>=((c[a+56>>2]|0)+(c[a+60>>2]<<1)|0)){break}p=(p*95|0|0)/100|0}}while(0);I=124;if((n|0)==0){p=(p*98|0|0)/100|0}V=a;U=I;t=p;dy(V,U,t)|0}}while(0);if((c[a+196>>2]|0)==2){p=99;if((j|0)>6){X=(i<<1|0)<(j|0)}else{X=0}L5725:do{if(X){W=(P((c[a+200>>2]|0)-(c[a+204>>2]|0)|0)|0)<<3;if((W|0)>((c[a+200>>2]|0)+(c[a+204>>2]|0)|0)){break}if(((c[a+200>>2]|0)+(c[a+204>>2]|0)|0)<(((aa(i,j)|0)*7|0|0)/8|0|0)){break}do{if(((du(e,f,g+((j|0)/2|0)|0,g-((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){if(((du(e,f,g+((j|0)/2|0)-1|0,g-((j|0)/2|0)-1|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}break L5725}}while(0);if((i*3|0|0)<(j|0)){p=(p*98|0|0)/100|0}if((i<<2|0)<(j|0)){p=(p*99|0|0)/100|0}do{if((c[a+56>>2]|0)!=0){if((h<<2|0)>=((c[a+56>>2]|0)+((c[a+60>>2]|0)*3|0)|0)){break}break L5725}}while(0);do{if((c[a+56>>2]|0)!=0){if((h<<2|0)>=(0+(c[a+60>>2]<<2)|0)){break}p=(p*95|0|0)/100|0}}while(0);I=124;if((n|0)==0){p=(p*98|0|0)/100|0}W=a;t=I;U=p;dy(W,t,U)|0}}while(0)}p=100;if((i|0)>5){Y=(j|0)>7}else{Y=0}L5760:do{if(Y){if((c[b+108>>2]|0)>2){break}do{if((c[a+196>>2]|0)!=1){if((c[a+196>>2]|0)==3){break}if((c[a+196>>2]|0)==5){break}break L5760}}while(0);if((c[a+196>>2]|0)==1){break}L5773:do{if((c[a+196>>2]|0)>=3){if((c[a+204>>2]|0)>=0){break}if((c[a+208>>2]|0)>=0){break}do{if(((c[l>>2]|0)-e|0)<=((i|0)/4|0|0)){if(((c[l+4>>2]|0)-g|0)>((j|0)/4|0|0)){break}do{if(((c[l+32>>2]|0)-e|0)>=((i*3|0|0)/4|0|0)){if(((c[l+36>>2]|0)-g|0)<((j*3|0|0)/4|0|0)){break}do{if(((c[l+16>>2]|0)-e|0)<=((i|0)/4|0|0)){if(((c[l+20>>2]|0)-g|0)<((j*3|0|0)/4|0|0)){break}do{if(((c[l+48>>2]|0)-e|0)>=((i*3|0|0)/4|0|0)){if(((c[l+52>>2]|0)-g|0)>((j|0)/4|0|0)){break}w=cI(a,c[l+60>>2]|0,c[l+12>>2]|0,e+((i|0)/2|0)|0,g+((j|0)/2|0)|0)|0;do{if(((c[a+296+(w<<3)>>2]|0)-e|0)>=((i|0)/2|0|0)){if((f-(c[a+296+(w<<3)>>2]|0)|0)<((i|0)/4|0|0)){break}if(((c[a+296+(w<<3)+4>>2]|0)-g|0)<=((j|0)/8|0|0)){break}w=cI(a,c[l+28>>2]|0,c[l+44>>2]|0,e+((i|0)/2|0)|0,g+((j|0)/2|0)|0)|0;do{if(((c[a+296+(w<<3)>>2]|0)-e|0)>=((i|0)/4|0|0)){if((f-(c[a+296+(w<<3)>>2]|0)|0)<((i|0)/2|0|0)){break}if((h-(c[a+296+(w<<3)+4>>2]|0)|0)<=((j|0)/8|0|0)){break}do{if((i|0)>7){if((p|0)!=100){break}p=(p*99|0|0)/100|0}}while(0);G=1;F=1;s=1;while(1){if((s|0)>=(c[a+196>>2]|0)){break}do{if((F|0)==(G|0)){if((s|0)==(F|0)){break}G=s}}while(0);do{if((c[a+200+(s<<2)>>2]|0)<(c[a+200+(G<<2)>>2]|0)){if((s|0)==(F|0)){break}G=s}}while(0);if((c[a+200+(G<<2)>>2]|0)<(c[a+200+(F<<2)>>2]|0)){w=F;F=G;G=w}s=s+1|0}if((F|0)==(G|0)){break L5760}X=P(c[a+200+(F<<2)>>2]|0)|0;if((X|0)>=((c[a+200>>2]|0)/8|0|0)){break L5760}X=P(c[a+200+(G<<2)>>2]|0)|0;if((X|0)>=((c[a+200>>2]|0)/8|0|0)){break L5760}X=P((c[a+200+(F<<2)>>2]|0)-(c[a+200+(G<<2)>>2]|0)|0)|0;if((X|0)>=((P((c[a+200+(F<<2)>>2]|0)+(c[a+200+(G<<2)>>2]|0)|0)|0)/2|0|0)){break L5760}if((p|0)==100){p=(p*99|0|0)/100|0}break L5773}}while(0);break L5760}}while(0);break L5760}}while(0);break L5760}}while(0);break L5760}}while(0);break L5760}}while(0);break L5760}}while(0);L5839:do{if((c[a+196>>2]|0)==3){if((c[a+204>>2]|0)<=0){break}do{if(((c[l>>2]|0)-e|0)<((i|0)/4|0|0)){if(((c[l+4>>2]|0)-g|0)>=((j|0)/4|0|0)){break}break L5760}}while(0);do{if(((c[l+32>>2]|0)-e|0)>((i*3|0|0)/4|0|0)){if(((c[l+36>>2]|0)-g|0)<=((j*3|0|0)/4|0|0)){break}break L5760}}while(0);do{if(((c[l+16>>2]|0)-e|0)<=((i|0)/4|0|0)){if(((c[l+20>>2]|0)-g|0)<((j*3|0|0)/4|0|0)){break}do{if(((c[l+48>>2]|0)-e|0)>=((i*3|0|0)/4|0|0)){if(((c[l+52>>2]|0)-g|0)>((j|0)/4|0|0)){break}do{if((i|0)>7){if((p|0)!=100){break}p=(p*99|0|0)/100|0}}while(0);if((c[a+204>>2]|0)>=(c[a+200>>2]|0)){break L5760}X=P((c[a+204>>2]|0)-(c[a+208>>2]|0)|0)|0;if((X|0)>=((P((c[a+204>>2]|0)+(c[a+208>>2]|0)|0)|0)/8|0|0)){break L5760}if((p|0)==100){p=(p*99|0|0)/100|0}break L5839}}while(0);break L5760}}while(0);break L5760}}while(0);L5872:do{if((c[a+196>>2]|0)==5){if((c[b+108>>2]|0)!=2){break}if((c[a+204>>2]|0)<=0){break}do{if(((c[l>>2]|0)-e|0)<((i|0)/4|0|0)){if(((c[l+4>>2]|0)-g|0)>=((j|0)/4|0|0)){break}break L5760}}while(0);do{if(((c[l+32>>2]|0)-e|0)>((i*3|0|0)/4|0|0)){if(((c[l+36>>2]|0)-g|0)<=((j*3|0|0)/4|0|0)){break}break L5760}}while(0);do{if(((c[l+16>>2]|0)-e|0)<=((i|0)/4|0|0)){if(((c[l+20>>2]|0)-g|0)<((j*3|0|0)/4|0|0)){break}do{if(((c[l+48>>2]|0)-e|0)>=((i*3|0|0)/4|0|0)){if(((c[l+52>>2]|0)-g|0)>((j|0)/4|0|0)){break}do{if((dv(e,f,g+((j|0)/4|0)|0,g+((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=3){if((dv(e,f,g+((j|0)/8|0)|0,g+((j|0)/8|0)|0,c[a+68>>2]|0,k)|0)==3){break}break L5760}}while(0);do{if((dv(e,f+((i|0)/4|0)|0,h-((j|0)/4|0)|0,h-((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=3){if((dv(e,f+((i|0)/4|0)|0,h-((j|0)/8|0)|0,h-((j|0)/8|0)|0,c[a+68>>2]|0,k)|0)==3){break}break L5760}}while(0);do{if((dv(e,f,g,h,c[a+68>>2]|0,k)|0)<4){if((dv(e+((i|0)/8|0)|0,f,g,h,c[a+68>>2]|0,k)|0)>=4){break}if((dv(e,f+((i|0)/4|0)|0,g,h,c[a+68>>2]|0,k)|0)>=4){break}if((i|0)<=7){break}if((j|0)<=15){break}break L5760}}while(0);do{if((i|0)>7){if((j|0)<=12){y=4272;break}if((dH(e,f,g,h-((j|0)/4|0)|0,c[a+68>>2]|0,k,0)|0)!=1){break L5760}if((dH(e+((i|0)/4|0)|0,f+((i|0)/4|0)|0,g+((j|0)/4|0)|0,h,c[a+68>>2]|0,k,0)|0)!=1){break L5760}if((dH(e,f+((i|0)/4|0)|0,g,h,c[a+68>>2]|0,k,0)|0)!=2){break L5760}else{break}}else{y=4272}}while(0);if((y|0)==4272){p=(p*98|0|0)/100|0}break L5872}}while(0);break L5760}}while(0);break L5760}}while(0);X=dC(c[a+68>>2]|0,e,g,i,k,0,3)|0;if((X|0)<(dC(c[a+68>>2]|0,e,g+((j|0)/16|0)+1|0,i,k,0,3)|0)){p=(p*96|0|0)/100|0}X=dC(c[a+68>>2]|0,f,h,i,k,0,4)|0;if((X|0)<(dC(c[a+68>>2]|0,f,h-1-((j|0)/16|0)|0,i,k,0,4)|0)){p=(p*96|0|0)/100|0}x=0;while(1){if((x|0)>=(i|0)){break}if(((du(e+x|0,e+x|0,g+((j|0)/8|0)|0,h-((j|0)/8|0)|0,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=2){y=4281;break}x=x+1|0}if((x|0)<(i|0)){break}if((o|0)!=0){p=(p*98|0|0)/100|0}I=37;dy(a,I,p)|0;if((p|0)<100){break}M=I;N=M;return N|0}}while(0);p=99;if((i|0)>7){Z=(j|0)>7}else{Z=0}L5952:do{if(Z){if(((du(e,e+((i|0)/2|0)|0,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(f-((i|0)/2|0)|0,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break}do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g,g,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g+1|0,g+1|0,c[a+68>>2]|0,k)|0)!=1){break L5952}else{break}}}while(0);do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h,h,c[a+68>>2]|0,k)|0)!=2){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h-1|0,h-1|0,c[a+68>>2]|0,k)|0)!=2){break L5952}else{break}}}while(0);do{if((dv(e,e,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(e+1|0,e+1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L5952}else{break}}}while(0);do{if((dv(f,f,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(f-1|0,f-1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L5952}else{break}}}while(0);if((c[b+108>>2]|0)!=0){break}I=dC(d,0,0,f-e|0,k,0,3)|0;if((I|0)<=(dC(d,0,2,f-e|0,k,0,3)|0)){break}do{if((dC(d,(i|0)/2|0,j-((j|0)/4|0)|0,f-e|0,k,0,3)|0)<=((i|0)/4|0|0)){if((dC(d,(i|0)/2|0,j-((j|0)/4|0)|0,f-e|0,k,0,4)|0)>((i|0)/4|0|0)){break}do{if((dC(d,(i|0)/2|0,(j*3|0|0)/8|0,f-e|0,k,0,3)|0)>=((i|0)/4|0|0)){if((dC(d,(i|0)/2|0,(j*3|0|0)/8|0,f-e|0,k,0,4)|0)<((i|0)/4|0|0)){break}s=dC(d,0,j-1-((j|0)/16|0)|0,f-e|0,k,0,3)|0;if((s|0)>((i|0)/8|0|0)){break L5952}x=dC(d,s,j-1-((j|0)/16|0)|0,f-e|0,k,1,3)|0;s=s+x|0;do{if((s|0)>=((i*3|0|0)/8|0|0)){if((s|0)>((i|0)/2|0|0)){break}x=dC(d,s,j-1-((j|0)/16|0)|0,f-e|0,k,0,3)|0;s=s+x|0;do{if((s|0)>=((i|0)/2|0|0)){if((s|0)>((i*5|0|0)/8|0|0)){break}x=dC(d,s,j-1-((j|0)/16|0)|0,f-e|0,k,1,3)|0;s=s+x|0;if((s|0)<((i*7|0|0)/8|0|0)){break L5952}x=(i|0)/4|0;while(1){if((x|0)>=((i*3|0|0)/4|0|0)){break}s=dC(d,x,j-1|0,h-g|0,k,0,1)|0;if((s|0)>((j*3|0|0)/4|0|0)){y=4344;break}x=x+1|0}if((x|0)>=((i*3|0|0)/4|0|0)){break L5952}if((n|0)==0){p=(p*60|0|0)/100|0}m=937;dy(a,m,p)|0;break L5952}}while(0);break L5952}}while(0);break L5952}}while(0);break L5952}}while(0)}}while(0);M=m;N=M;return N|0}function dh(b,e,f,g,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0.0,S=0.0,T=0,U=0,V=0.0,W=0.0,X=0.0;e=i;i=i+2048|0;o=e|0;p=e+1024|0;q=b;b=f;f=g;g=j;j=k;k=l;l=m;m=0;r=1;s=o;eC(s|0,0,1024)|0;s=p;eC(s|0,0,1024)|0;s=a[q+((aa(g,b)|0)+f)|0]|0;t=s;u=s;v=s;w=s;s=255;x=0;y=((k|0)/512|0)+1|0;z=0;while(1){if((z|0)>=(k|0)){break}A=q+((aa(g+z|0,b)|0)+f)|0;B=0;while(1){if((B|0)>=(j|0)){break}C=o+((d[A]|0)<<2)|0;c[C>>2]=(c[C>>2]|0)+1;if((d[A]|0|0)>(x|0)){x=d[A]|0}if((d[A]|0|0)<(s|0)){s=d[A]|0}if(((d[A]|0)-(u&255)|0)<0){D=-((d[A]|0)-(u&255)|0)|0}else{D=(d[A]|0)-(u&255)|0}if((D|0)>(m|0)){if(((d[A]|0)-(u&255)|0)<0){E=-((d[A]|0)-(u&255)|0)|0}else{E=(d[A]|0)-(u&255)|0}m=E}if(((d[A]|0)-(t&255)|0)<0){F=-((d[A]|0)-(t&255)|0)|0}else{F=(d[A]|0)-(t&255)|0}if((F|0)>(m|0)){if(((d[A]|0)-(t&255)|0)<0){G=-((d[A]|0)-(t&255)|0)|0}else{G=(d[A]|0)-(t&255)|0}m=G}if(((d[A]|0)-(v&255)|0)<0){H=-((d[A]|0)-(v&255)|0)|0}else{H=(d[A]|0)-(v&255)|0}if((H|0)>(m|0)){if(((d[A]|0)-(v&255)|0)<0){I=-((d[A]|0)-(v&255)|0)|0}else{I=(d[A]|0)-(v&255)|0}m=I}if(((d[A]|0)-(w&255)|0)<0){J=-((d[A]|0)-(w&255)|0)|0}else{J=(d[A]|0)-(w&255)|0}if((J|0)>(m|0)){if(((d[A]|0)-(w&255)|0)<0){K=-((d[A]|0)-(w&255)|0)|0}else{K=(d[A]|0)-(w&255)|0}m=K}w=v;v=t;t=u;u=a[A]|0;A=A+1|0;B=B+1|0}z=z+y|0}if((l&1|0)!=0){K=c[n>>2]|0;J=m;au(K|0,10504,(L=i,i=i+8|0,c[L>>2]=J,L)|0)|0;i=L}J=a[q+((aa(g,b)|0)+f)|0]|0;t=J;u=J;v=J;w=J;z=0;while(1){if((z|0)>=(k|0)){break}A=q+((aa(g+z|0,b)|0)+f)|0;B=0;while(1){if((B|0)>=(j|0)){break}if(((d[A]|0)-(u&255)|0)<0){M=-((d[A]|0)-(u&255)|0)|0}else{M=(d[A]|0)-(u&255)|0}do{if((M|0)>=((m|0)/4|0|0)){N=4430}else{if(((d[A]|0)-(t&255)|0)<0){O=-((d[A]|0)-(t&255)|0)|0}else{O=(d[A]|0)-(t&255)|0}if((O|0)>=((m|0)/4|0|0)){N=4430;break}if(((d[A]|0)-(v&255)|0)<0){P=-((d[A]|0)-(v&255)|0)|0}else{P=(d[A]|0)-(v&255)|0}if((P|0)>=((m|0)/4|0|0)){N=4430;break}if(((d[A]|0)-(w&255)|0)<0){Q=-((d[A]|0)-(w&255)|0)|0}else{Q=(d[A]|0)-(w&255)|0}if((Q|0)>=((m|0)/4|0|0)){N=4430}}}while(0);if((N|0)==4430){N=0;J=p+((d[A]|0)<<2)|0;c[J>>2]=(c[J>>2]|0)+1}w=v;v=t;t=u;u=a[A]|0;A=A+1|0;B=B+1|0}z=z+y|0}R=0.0;S=0.0;u=0;t=0;y=0;while(1){if((y|0)>255){break}S=S+ +(y|0)*+(c[p+(y<<2)>>2]|0);u=u+(c[p+(y<<2)>>2]|0)|0;t=t+(c[o+(y<<2)>>2]|0)|0;y=y+1|0}if((u|0)==0){v=c[n>>2]|0;au(v|0,21792,(L=i,i=i+1|0,i=i+7&-8,c[L>>2]=0,L)|0)|0;i=L;T=160;U=T;i=e;return U|0}if((l&1|0)!=0){v=c[n>>2]|0;au(v|0,16136,(L=i,i=i+1|0,i=i+7&-8,c[L>>2]=0,L)|0)|0;i=L}V=-1.0;v=0;y=0;while(1){if((y|0)>=255){break}v=v+(c[p+(y<<2)>>2]|0)|0;if((v|0)!=0){w=u-v|0;if((w|0)==0){N=4448;break}R=R+ +(y|0)*+(c[p+(y<<2)>>2]|0);W=+(v|0)*+(w|0)*((S-R)/+(w|0)-R/+(v|0));if(W>V){V=W;r=y+1|0}do{if((l&1|0)!=0){if((c[o+(y<<2)>>2]|0)==0){break}w=c[n>>2]|0;Q=y;P=c[o+(y<<2)>>2]|0;O=c[p+(y<<2)>>2]|0;X=W*256.0/+(aa(j,k)|0)/+(aa(j,k)|0);M=r;au(w|0,11352,(L=i,i=i+40|0,c[L>>2]=Q,c[L+8>>2]=P,c[L+16>>2]=O,h[L+24>>3]=X,c[L+32>>2]=M,L)|0)|0;i=L}}while(0)}y=y+1|0}p=0;y=0;while(1){if((y|0)>=(r|0)){break}p=p+(c[o+(y<<2)>>2]|0)|0;y=y+1|0}y=t-p|0;if((r|0)>(x|0)){t=c[n>>2]|0;au(t|0,9328,(L=i,i=i+1|0,i=i+7&-8,c[L>>2]=0,L)|0)|0;i=L;r=x}if((r|0)<=(s|0)){t=c[n>>2]|0;au(t|0,8376,(L=i,i=i+1|0,i=i+7&-8,c[L>>2]=0,L)|0)|0;i=L;r=s+1|0}if((l&1|0)!=0){t=c[n>>2]|0;o=r;v=s;s=x;x=m;m=p;N=y;au(t|0,7216,(L=i,i=i+48|0,c[L>>2]=o,c[L+8>>2]=v,c[L+16>>2]=s,c[L+24>>2]=x,c[L+32>>2]=m,c[L+40>>2]=N,L)|0)|0;i=L}if((p<<1|0)>(y*7|0|0)){if((l&1|0)!=0){l=c[n>>2]|0;au(l|0,6136,(L=i,i=i+1|0,i=i+7&-8,c[L>>2]=0,L)|0)|0;i=L}z=0;while(1){if((z|0)>=(k|0)){break}A=q+((aa(g+z|0,b)|0)+f)|0;B=0;while(1){if((B|0)>=(j|0)){break}a[A]=255-(d[A]|0)&255;A=A+1|0;B=B+1|0}z=z+1|0}r=255-r+1|0}T=r;U=T;i=e;return U|0}function di(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;e=i;m=b;b=f;f=g;g=h;h=j;j=k;k=l;l=255;o=0;p=255;q=0;r=g;while(1){if((r|0)>=(g+j|0)){break}s=m+((aa(r,b)|0)+f+1)|0;t=f;while(1){if((t|0)>=(f+h|0)){break}if((d[s]|0|0)>(o|0)){o=d[s]|0}if((d[s]|0|0)<(l|0)){l=d[s]|0}s=s+1|0;t=t+1|0}r=r+1|0}if((k|0)<=(l|0)){u=4496}else{if((k|0)>(o|0)){u=4496}}if((u|0)==4496){k=(l+o+1|0)/2|0;v=c[n>>2]|0;w=l;x=o;y=k;au(v|0,5088,(z=i,i=i+24|0,c[z>>2]=w,c[z+8>>2]=x,c[z+16>>2]=y,z)|0)|0;i=z}r=g;while(1){if((r|0)>=(g+j|0)){break}s=m+((aa(r,b)|0)+f)|0;t=f;while(1){if((t|0)>=(f+h|0)){break}if((d[s]|0|0)>(o|0)){u=4503}else{if((d[s]|0|0)<(l|0)){u=4503}}if((u|0)==4503){u=0;y=c[n>>2]|0;x=r;w=t;v=k;A=d[s]|0;B=l;C=o;au(y|0,4200,(z=i,i=i+48|0,c[z>>2]=x,c[z+8>>2]=w,c[z+16>>2]=v,c[z+24>>2]=A,c[z+32>>2]=B,c[z+40>>2]=C,z)|0)|0;i=z}do{if((d[s]|0|0)>=(k|0)){u=4506}else{if((k|0)==(l|0)){u=4506;break}D=(((d[s]|0)-l|0)*150|0|0)/(k-l|0)|0|0}}while(0);if((u|0)==4506){u=0;D=255-(((o-(d[s]|0)|0)*80|0|0)/(o-k+1|0)|0)|0}a[s]=D&255;if((d[s]|0|0)>(q|0)){q=d[s]|0}if((d[s]|0|0)<(p|0)){p=d[s]|0}s=s+1|0;t=t+1|0}r=r+1|0}i=e;return 160}function dj(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;j=i;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=d;if((k|0)!=0){if((a|0)==0){a=c[k+68>>2]|0;b=c[k>>2]|0;e=(c[k+4>>2]|0)-(c[k>>2]|0)+1|0;d=c[k+8>>2]|0;f=(c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0;h=d}if((g|0)==0){g=c[(c[7036]|0)+37052>>2]|0}l=c[n>>2]|0;m=c[k>>2]|0;o=c[k+8>>2]|0;p=(c[k+4>>2]|0)-(c[k>>2]|0)+1|0;q=(c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0;r=(c[k+16>>2]|0)-(c[k>>2]|0)|0;s=(c[k+20>>2]|0)-(c[k+8>>2]|0)|0;t=c[(c[7036]|0)+44>>2]|0;u=k;au(l|0,10168,(v=i,i=i+64|0,c[v>>2]=m,c[v+8>>2]=o,c[v+16>>2]=p,c[v+24>>2]=q,c[v+32>>2]=r,c[v+40>>2]=s,c[v+48>>2]=t,c[v+56>>2]=u,v)|0)|0;i=v;u=c[n>>2]|0;t=c[k+24>>2]|0;s=c[k+28>>2]|0;r=c[k+32>>2]|0;q=es(c[k+36>>2]|0,6)|0;p=es(c[k+40>>2]|0,6)|0;o=c[k+48>>2]|0;m=(c[k+52>>2]|0)-(c[k+8>>2]|0)|0;l=(c[k+56>>2]|0)-(c[k+8>>2]|0)|0;w=(c[k+60>>2]|0)-(c[k+8>>2]|0)|0;x=(c[k+64>>2]|0)-(c[k+8>>2]|0)|0;au(u|0,21424,(v=i,i=i+80|0,c[v>>2]=t,c[v+8>>2]=s,c[v+16>>2]=r,c[v+24>>2]=q,c[v+32>>2]=p,c[v+40>>2]=o,c[v+48>>2]=m,c[v+56>>2]=l,c[v+64>>2]=w,c[v+72>>2]=x,v)|0)|0;i=v;if((c[k+196>>2]|0)!=0){x=c[n>>2]|0;w=c[k+196>>2]|0;if((c[k+196>>2]|0)!=0){y=c[k+264+((c[k+196>>2]|0)-1<<2)>>2]|0}else{y=-1}au(x|0,16040,(v=i,i=i+16|0,c[v>>2]=w,c[v+8>>2]=y,v)|0)|0;i=v;y=0;w=0;x=0;while(1){if((y|0)>=(c[k+196>>2]|0)){break}l=c[k+200+(y<<2)>>2]|0;m=c[k+232+(y<<2)>>2]|0;o=(c[k+264+(y<<2)>>2]|0)-x|0;au(c[n>>2]|0,11312,(v=i,i=i+32|0,c[v>>2]=y,c[v+8>>2]=l,c[v+16>>2]=m,c[v+24>>2]=o,v)|0)|0;i=v;while(1){if((w|0)<(c[k+264+(y<<2)>>2]|0)){z=(w|0)<128}else{z=0}if(!z){break}o=(c[k+296+(w<<3)>>2]|0)-(c[k>>2]|0)|0;m=(c[k+296+(w<<3)+4>>2]|0)-(c[k+8>>2]|0)|0;au(c[n>>2]|0,9304,(v=i,i=i+24|0,c[v>>2]=w,c[v+8>>2]=o,c[v+16>>2]=m,v)|0)|0;i=v;w=w+1|0}y=y+1|0;x=w}}if((c[k+72>>2]|0)!=0){w=c[n>>2]|0;au(w|0,8344,(v=i,i=i+1|0,i=i+7&-8,c[v>>2]=0,v)|0)|0;i=v;w=0;while(1){if((w|0)<(c[k+72>>2]|0)){A=(w|0)<10}else{A=0}if(!A){break}if((c[k+156+(w<<2)>>2]|0)!=0){x=c[n>>2]|0;y=c[k+156+(w<<2)>>2]|0;z=c[k+116+(w<<2)>>2]|0;au(x|0,7200,(v=i,i=i+16|0,c[v>>2]=y,c[v+8>>2]=z,v)|0)|0;i=v}else{z=c[n>>2]|0;y=es(c[k+76+(w<<2)>>2]|0,6)|0;x=c[k+116+(w<<2)>>2]|0;au(z|0,7200,(v=i,i=i+16|0,c[v>>2]=y,c[v+8>>2]=x,v)|0)|0;i=v}w=w+1|0}}w=c[n>>2]|0;au(w|0,6120,(v=i,i=i+1|0,i=i+7&-8,c[v>>2]=0,v)|0)|0;i=v;do{if((c[k+56>>2]|0)!=0){if((c[k+52>>2]|0)>=(d|0)){break}if((c[k+24>>2]|0)==0){if((d|0)<=(c[k+56>>2]|0)){break}}h=c[k+52>>2]|0;f=(c[k+12>>2]|0)-h+1|0}}while(0)}w=((e|0)/80|0)+1|0;A=((f|0)/40|0)+1|0;au(c[n>>2]|0,5024,(v=i,i=i+56|0,c[v>>2]=b,c[v+8>>2]=d,c[v+16>>2]=e,c[v+24>>2]=f,c[v+32>>2]=w,c[v+40>>2]=A,c[v+48>>2]=h,v)|0)|0;i=v;if((e|0)<=0){i=j;return}x=h;while(1){if((x|0)>=(h+f|0)){break}if((k|0)!=0){B=b;while(1){if((B|0)>=(b+e|0)){break}C=46;D=x;while(1){if((D|0)<(x+A|0)){E=(D|0)<(d+f|0)}else{E=0}if(!E){break}F=B;while(1){if((F|0)<(B+w|0)){G=(F|0)<(b+e|0)}else{G=0}if(!G){break}if((d8(c[k+68>>2]|0,F-b+(c[k>>2]|0)|0,D-d+(c[k+8>>2]|0)|0)|0)<(g|0)){C=64}F=F+1|0}D=D+1|0}if((c[k+196>>2]|0)!=0){do{if((C<<24>>24|0)!=36){if((C<<24>>24|0)==83){break}y=0;while(1){if((y|0)>=(c[k+264+((c[k+196>>2]|0)-1<<2)>>2]|0)){break}if((((c[k+296+(y<<3)>>2]|0)-(c[k>>2]|0)|0)/(w|0)|0|0)==((B-b|0)/(w|0)|0|0)){if((((c[k+296+(y<<3)+4>>2]|0)-(c[k+8>>2]|0)|0)/(A|0)|0|0)==((x-d|0)/(A|0)|0|0)){H=4581;break}}y=y+1|0}if((H|0)==4581){H=0;C=((C<<24>>24|0)==64?36:83)&255}}}while(0)}au(c[n>>2]|0,4184,(v=i,i=i+8|0,c[v>>2]=C<<24>>24,v)|0)|0;i=v;B=B+w|0}}if((e|0)<40){y=c[n>>2]|0;au(y|0,24976,(v=i,i=i+1|0,i=i+7&-8,c[v>>2]=0,v)|0)|0;i=v}if((e|0)<40){B=b;while(1){if((B|0)>=(b+e|0)){break}C=46;D=x;while(1){if((D|0)<(x+A|0)){I=(D|0)<(d+f|0)}else{I=0}if(!I){break}F=B;while(1){if((F|0)<(B+w|0)){J=(F|0)<(b+e|0)}else{J=0}if(!J){break}if((d8(a,F,D)|0)<(g|0)){C=64}F=F+1|0}D=D+1|0}au(c[n>>2]|0,4184,(v=i,i=i+8|0,c[v>>2]=C<<24>>24,v)|0)|0;i=v;B=B+w|0}}y=32;C=32;if((k|0)!=0){do{if((x-d+(c[k+8>>2]|0)|0)==(c[k+52>>2]|0)){H=4616}else{if((x-d+(c[k+8>>2]|0)|0)==(c[k+56>>2]|0)){H=4616;break}if((x-d+(c[k+8>>2]|0)|0)==(c[k+60>>2]|0)){H=4616;break}if((x-d+(c[k+8>>2]|0)|0)==(c[k+64>>2]|0)){H=4616}}}while(0);if((H|0)==4616){H=0;C=60}}if((x|0)==(d|0)){H=4620}else{if((x|0)==(h+f-1|0)){H=4620}}if((H|0)==4620){H=0;y=45}au(c[n>>2]|0,24312,(v=i,i=i+16|0,c[v>>2]=C<<24>>24,c[v+8>>2]=y<<24>>24,v)|0)|0;i=v;x=x+A|0}i=j;return}function dk(a){a=a|0;dj(a,0,0,0,0,0,c[(c[7036]|0)+37052>>2]|0);return}function dl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0;e=i;f=b;b=d;d=(c[7036]|0)+4|0;g=(c[f+12>>2]|0)-(c[f+8>>2]|0)+1|0;if((g|0)<((c[b+12>>2]|0)-(c[b+8>>2]|0)+1|0)){g=(c[b+12>>2]|0)-(c[b+8>>2]|0)+1|0}h=(((c[f+4>>2]|0)-(c[f>>2]|0)|0)/40|0)+1|0;j=(((c[f+12>>2]|0)-(c[f+8>>2]|0)|0)/40|0)+1|0;if((b|0)!=0){k=c[n>>2]|0;au(k|0,22176,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l}k=0;while(1){if((k|0)>=(g|0)){break}au(c[n>>2]|0,6120,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;m=(c[f+8>>2]|0)+k|0;o=c[f>>2]|0;while(1){if((o|0)>(c[f+4>>2]|0)){break}p=c[n>>2]|0;q=d8(d,o,m)|0;r=(q|0)<(c[(c[7036]|0)+37052>>2]|0)?0:8;q=r+(d5(d,o,m)|0)|0;au(p|0,4184,(l=i,i=i+8|0,c[l>>2]=a[(c[56]|0)+q|0]|0,l)|0)|0;i=l;o=o+h|0}if((b|0)!=0){q=c[n>>2]|0;au(q|0,24976,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;m=(c[b+8>>2]|0)+k|0;o=c[b>>2]|0;while(1){if((o|0)>(c[b+4>>2]|0)){break}q=c[n>>2]|0;p=d8(d,o,m)|0;r=(p|0)<(c[(c[7036]|0)+37052>>2]|0)?0:8;p=r+(d5(d,o,m)|0)|0;au(q|0,4184,(l=i,i=i+8|0,c[l>>2]=a[(c[56]|0)+p|0]|0,l)|0)|0;i=l;o=o+h|0}}k=k+j|0}i=e;return}function dm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;b=i;d=a;a=0;e=d+4|0;f=c[d+37080>>2]|0;au(c[n>>2]|0,20728,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;if((cy(d+84|0)|0)!=0){h=c[n>>2]|0;j=au(h|0,6120,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;i=b;return 0}while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){k=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{k=0}if(!k){break}l=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;m=0;while(1){if((m|0)>=(c[l+72>>2]|0)){break}if((f|0)==0){o=4659;break}if((c[l+76+(m<<2)>>2]|0)!=0){if((aC(f|0,c[l+76+(m<<2)>>2]|0)|0)!=0){o=4659;break}}if((c[l+156+(m<<2)>>2]|0)!=0){if((a6(f|0,c[l+156+(m<<2)>>2]|0)|0)!=0){o=4659;break}}m=m+1|0}if((o|0)==4659){o=0}if((m|0)<(c[l+72>>2]|0)){p=c[n>>2]|0;au(p|0,20016,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}L6447:do{if((f|0)!=0){do{if((aC(f|0,c[l+36>>2]|0)|0)!=0){if((c[l+36>>2]|0)>=256){break}if((c[l+36>>2]|0)!=0){o=4671;break L6447}}}while(0);if((aC(f|0,95)|0)!=0){if((c[l+36>>2]|0)==57344){o=4671;break}}if((m|0)<(c[l+72>>2]|0)){o=4671}}else{o=4671}}while(0);if((o|0)==4671){o=0;if((e|0)==0){e=c[l+68>>2]|0}m=c[n>>2]|0;p=a;q=c[l>>2]|0;r=c[l+8>>2]|0;s=(c[l+4>>2]|0)-(c[l>>2]|0)+1|0;t=(c[l+12>>2]|0)-(c[l+8>>2]|0)+1|0;u=c[l+196>>2]|0;v=c[l+72>>2]|0;w=c[l+36>>2]|0;x=es(c[l+36>>2]|0,6)|0;au(m|0,19352,(g=i,i=i+72|0,c[g>>2]=p,c[g+8>>2]=q,c[g+16>>2]=r,c[g+24>>2]=s,c[g+32>>2]=t,c[g+40>>2]=u,c[g+48>>2]=v,c[g+56>>2]=w,c[g+64>>2]=x,g)|0)|0;i=g;if((c[d+37072>>2]&4|0)!=0){dk(l)}}a=a+1|0;c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0);h=c[n>>2]|0;j=au(h|0,6120,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;i=b;return 0}function dn(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;h=b;b=e;e=f;f=b+28|0;if((e&8|0)!=0){j=0;while(1){if((j|0)>=(c[f+8>>2]|0)){break}k=aa(c[f+4>>2]|0,j)|0;l=(c[f>>2]|0)+k|0;m=0;while(1){if((m|0)>=(c[f+4>>2]|0)){break}a[l]=(d[l]|0)&241;l=l+1|0;m=m+1|0}j=j+1|0}}do{if((c[b+37072>>2]&32|0)!=0){if((c[b+160>>2]|0)==0){break}o=0;while(1){if((o|0)>=(c[f+4>>2]|0)){break}j=(c[f+8>>2]|0)/2|0;if((c[b+160>>2]|0)!=0){k=aa(c[b+164>>2]|0,o)|0;j=j+((k|0)/(c[b+160>>2]|0)|0)|0}m=o;do{if((m|0)<0){p=4702}else{if((m|0)>=(c[f+4>>2]|0)){p=4702;break}if((j|0)<0){p=4702;break}if((j|0)>=(c[f+8>>2]|0)){p=4702;break}k=m+(aa(c[f+4>>2]|0,j)|0)|0;l=(c[f>>2]|0)+k|0;if((d[l]|0|0)<160){break}do{if((m&7|0)<5){if((m&1|0)!=0){break}d9(f,m,j,255,8)}}while(0)}}while(0);if((p|0)==4702){p=0}o=o+1|0}}}while(0);(e&2|0)!=0?1:2;if((cy(b+84|0)|0)==0){while(1){if((c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=0){q=(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=(b+96|0)}else{q=0}if(!q){break}k=c[(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[k+36>>2]|0)==32){p=4718}else{if((c[k+36>>2]|0)==10){p=4718;break}r=4;do{if((c[k+36>>2]|0)==57344){if((e&3|0)==0){break}r=2}}while(0);if((c[k>>2]|0)>1){j=c[k+8>>2]|0;while(1){if((j|0)>(c[k+12>>2]|0)){break}s=(c[k>>2]|0)-1+(aa(j,c[f+4>>2]|0)|0)|0;l=(c[f>>2]|0)+s|0;if((d[l]|0|0)>=160){s=l;a[s]=(d[s]|0|r)&255}j=j+1|0}}if(((c[k+12>>2]|0)+1|0)<(c[f+8>>2]|0)){m=c[k>>2]|0;while(1){if((m|0)>(c[k+4>>2]|0)){break}s=m+(aa((c[k+12>>2]|0)+1|0,c[f+4>>2]|0)|0)|0;l=(c[f>>2]|0)+s|0;if((d[l]|0|0)>=160){s=l;a[s]=(d[s]|0|r)&255}m=m+1|0}}if((c[k+36>>2]|0)==57345){m=0;while(1){if((m|0)>=((c[k+4>>2]|0)-(c[k>>2]|0)+1|0)){break}r=aa((c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0,m)|0;j=(r|0)/((c[k+4>>2]|0)-(c[k>>2]|0)+1|0)|0;r=(c[k>>2]|0)+m+(aa((c[k+8>>2]|0)+j|0,c[f+4>>2]|0)|0)|0;s=(c[f>>2]|0)+r|0;a[s]=(d[s]|0|4)&255;s=(c[k+4>>2]|0)-m+(aa((c[k+8>>2]|0)+j|0,c[f+4>>2]|0)|0)|0;r=(c[f>>2]|0)+s|0;a[r]=(d[r]|0|4)&255;m=m+1|0}}}}while(0);if((p|0)==4718){p=0}c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]=c[c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]>>2]}cz(b+84|0)}if((e&4|0)!=0){e=b+156|0;if((c[b+37072>>2]|0)!=0){q=c[n>>2]|0;k=h;au(q|0,18696,(t=i,i=i+8|0,c[t>>2]=k,t)|0)|0;i=t}o=0;while(1){if((o|0)>=(c[e>>2]|0)){break}k=(c[e+20492+(o<<2)>>2]|0)-(c[e+16396+(o<<2)>>2]|0)+1|0;q=-1;while(1){if((q|0)>=(k+1|0)){break}m=(c[e+16396+(o<<2)>>2]|0)+q|0;do{if((m|0)<0){p=4756}else{if((m|0)>=(c[f+4>>2]|0)){p=4756;break}j=c[e+12+(o<<2)>>2]|0;while(1){if((j|0)>(c[e+12300+(o<<2)>>2]|0)){break}do{if((j|0)>=(c[e+4108+(o<<2)>>2]|0)){if((j|0)>(c[e+8204+(o<<2)>>2]|0)){p=4764;break}if((q|0)<=-1){p=4764;break}if((q|0)>=(k|0)){p=4764;break}}else{p=4764}}while(0);L6580:do{if((p|0)==4764){p=0;r=j;if((c[e+4>>2]|0)!=0){s=aa(c[e+8>>2]|0,m)|0;r=r+((s|0)/(c[e+4>>2]|0)|0)|0}do{if((r|0)>=0){if((r|0)>=(c[f+8>>2]|0)){break}s=m+(aa(c[f+4>>2]|0,r)|0)|0;l=(c[f>>2]|0)+s|0;if((d[l]|0|0)<160){break L6580}if((a[l]&6|0)!=0){break L6580}else{d9(f,m,r,255,6);break L6580}}}while(0)}}while(0);j=j+1|0}}}while(0);if((p|0)==4756){p=0}q=q+1|0}o=o+1|0}}if((c[b+37072>>2]&1|0)==0){u=h;v=f;w=ef(u,v)|0;i=g;return 0}b=c[f+4>>2]|0;o=c[f+8>>2]|0;au(c[n>>2]|0,18024,(t=i,i=i+24|0,c[t>>2]=h,c[t+8>>2]=b,c[t+16>>2]=o,t)|0)|0;i=t;u=h;v=f;w=ef(u,v)|0;i=g;return 0}function dp(a){a=a|0;var b=0,d=0;b=a;a=0;a=(ao(b|0)|0)&255;do{if((aG(b|0)|0)==0){if((am(b|0)|0)!=0){break}d=a;return d|0}}while(0);c[6846]=1;d=a;return d|0}function dq(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=i;i=i+3200|0;h=g|0;j=g+3072|0;k=b;b=e;e=f;c[6846]=0;f=0;while(1){if((f|0)>=256){break}l=0;while(1){if((l|0)>=3){break}c[h+(f*12|0)+(l<<2)>>2]=f;l=l+1|0}f=f+1|0}m=aA(k|0,9856)|0;if((m|0)==0){k=c[n>>2]|0;au(k|0,21272,(p=i,i=i+8|0,c[p>>2]=46,p)|0)|0;i=p;aO(1)}if((aW(j|0,1,128,m|0)|0)!=128){k=c[n>>2]|0;au(k|0,15960,(p=i,i=i+8|0,c[p>>2]=47,p)|0)|0;i=p;aO(1)}if((d[j|0]|0|0)!=10){k=c[n>>2]|0;au(k|0,11272,(p=i,i=i+8|0,c[p>>2]=48,p)|0)|0;i=p;aO(1)}if((d[j+2|0]|0|0)>1){k=c[n>>2]|0;au(k|0,9256,(p=i,i=i+8|0,c[p>>2]=49,p)|0)|0;i=p;aO(1)}k=d[j+3|0]|0;do{if((k|0)!=1){if((k|0)==8){break}q=c[n>>2]|0;au(q|0,8288,(p=i,i=i+8|0,c[p>>2]=51,p)|0)|0;i=p;aO(1)}}while(0);q=((d[j+9|0]|0)<<8)+(d[j+8|0]|0)-((d[j+5|0]|0)<<8)-(d[j+4|0]|0)+1|0;r=((d[j+11|0]|0)<<8)+(d[j+10|0]|0)-((d[j+7|0]|0)<<8)-(d[j+6|0]|0)+1|0;s=d[j+65|0]|0;t=(d[j+66|0]|0)+((d[j+67|0]|0)<<8)|0;if((e|0)!=0){u=c[n>>2]|0;v=d[j+1|0]|0;w=k;x=q;y=r;z=(d[j+12|0]|0)+((d[j+13|0]|0)<<8)|0;A=(d[j+14|0]|0)+((d[j+15|0]|0)<<8)|0;B=s;C=t;D=(d[j+68|0]|0|0)==1?6096:5008;au(u|0,7096,(p=i,i=i+72|0,c[p>>2]=v,c[p+8>>2]=w,c[p+16>>2]=x,c[p+24>>2]=y,c[p+32>>2]=z,c[p+40>>2]=A,c[p+48>>2]=B,c[p+56>>2]=C,c[p+64>>2]=D,p)|0)|0;i=p}az(c[o>>2]|0)|0;if((s|0)>1){E=0;while(1){if((E|0)>=16){break}f=0;while(1){if((f|0)>=16){break}l=0;while(1){if((l|0)>=3){break}c[h+(((E<<4)+f|0)*12|0)+(l<<2)>>2]=(d[j+((f*3|0)+16+l)|0]|0)>>2;l=l+1|0}f=f+1|0}E=E+1|0}}if((k|0)>7){D=m;aH(D|0,-768|0,2)|0;if((aW(h|0,3,256,m|0)|0)!=256){D=c[n>>2]|0;au(D|0,4144,(p=i,i=i+8|0,c[p>>2]=67,p)|0)|0;i=p;aO(1)}f=0;while(1){if((f|0)>=256){break}l=0;while(1){if((l|0)>=3){break}D=h+(f*12|0)+(l<<2)|0;c[D>>2]=c[D>>2]>>2;l=l+1|0}f=f+1|0}}aH(m|0,128,0)|0;f=ev(aa(q,r)|0)|0;if((f|0)==0){l=c[n>>2]|0;au(l|0,24936,(p=i,i=i+8|0,c[p>>2]=72,p)|0)|0;i=p;aO(1)}l=0;h=0;do{D=0;while(1){if((D|0)>=(s|0)){break}do{C=1;B=dp(m)|0;A=B;if((C&255|0)==192){z=c[n>>2]|0;au(z|0,24296,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p}do{if((A&255|0)>=192){if((d[j+2|0]|0|0)!=1){break}C=A&255&63;B=dp(m)|0;A=B}}while(0);if((c[6846]|0)!=0){F=4850;break}z=0;while(1){if((z&255|0)>=(C&255|0)){break}E=0;while(1){if((E|0)>=8){break}if((h|0)<(q|0)){B=(A&255)>>8-k-E&~(-1<<k)&255;do{if((k|0)==1){if((B&255|0)!=1){break}B=-16}}while(0);if((D|0)==0){a[f+(h+(aa(q,l)|0))|0]=B}else{y=(B&255)<<(aa(D,k)|0);x=f+(h+(aa(q,l)|0))|0;a[x]=(d[x]|0|y)&255}}E=E+k|0;h=h+1|0}z=z+1&255}}while((h|0)<(aa(9-k|0,t)|0));if((F|0)==4850){F=0;z=c[n>>2]|0;B=h;A=l;au(z|0,23488,(p=i,i=i+16|0,c[p>>2]=B,c[p+8>>2]=A,p)|0)|0;i=p;h=q;l=r}D=D+1|0}h=0;l=l+1|0;}while((l|0)<(r|0));aq(m|0)|0;c[b>>2]=f;c[b+4>>2]=q;c[b+8>>2]=r;c[b+12>>2]=1;if((e|0)==0){i=g;return}au(c[n>>2]|0,22096,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p;i=g;return}function dr(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;j=i;i=i+80|0;k=j|0;l=j+8|0;m=j+16|0;n=j+24|0;o=j+32|0;p=j+40|0;q=j+48|0;r=j+56|0;s=j+64|0;t=j+72|0;c[k>>2]=a;c[l>>2]=b;c[m>>2]=d;c[n>>2]=e;e=f;f=g;g=h;c[o>>2]=P((c[m>>2]|0)-(c[k>>2]|0)|0)|0;c[t>>2]=(c[m>>2]|0)>(c[k>>2]|0)?1:-1;c[p>>2]=P((c[n>>2]|0)-(c[l>>2]|0)|0)|0;c[s>>2]=(c[n>>2]|0)>(c[l>>2]|0)?1:-1;if((c[o>>2]|0)>(c[p>>2]|0)){u=o;v=p;w=q;x=r;y=t;z=s;A=m}else{u=p;v=o;w=r;x=q;y=s;z=t;A=n}if((c[y>>2]|0)<0){ds(k,m);ds(l,n);c[t>>2]=-(c[t>>2]|0);c[s>>2]=-(c[s>>2]|0)}s=(c[v>>2]<<1)-(c[u>>2]|0)|0;t=c[v>>2]<<1;n=(c[v>>2]|0)-(c[u>>2]|0)<<1;c[q>>2]=c[k>>2];c[r>>2]=c[l>>2];l=0;k=0;while(1){if((c[w>>2]|0)>(c[A>>2]|0)){break}u=(d8(e,c[q>>2]|0,c[r>>2]|0)|0)<(f|0);if(((u?1:0)^g&1|0)!=0){k=k+1|0}else{l=l+1|0}u=w;c[u>>2]=(c[u>>2]|0)+1;if((s|0)<=0){s=s+t|0}else{s=s+n|0;u=x;c[u>>2]=(c[u>>2]|0)+(c[z>>2]|0)}}z=(aa(k,g&-2)|0)/(k+l|0)|0;i=j;return z|0}function ds(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=c[d>>2]|0;c[d>>2]=c[a>>2];c[a>>2]=b;return}function dt(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;j=i;i=i+80|0;k=j|0;l=j+8|0;m=j+16|0;n=j+24|0;o=j+32|0;p=j+40|0;q=j+48|0;r=j+56|0;s=j+64|0;t=j+72|0;c[k>>2]=a;c[l>>2]=b;c[m>>2]=d;c[n>>2]=e;e=f;f=g;g=h;c[o>>2]=P((c[m>>2]|0)-(c[k>>2]|0)|0)|0;c[t>>2]=(c[m>>2]|0)>(c[k>>2]|0)?1:-1;c[p>>2]=P((c[n>>2]|0)-(c[l>>2]|0)|0)|0;c[s>>2]=(c[n>>2]|0)>(c[l>>2]|0)?1:-1;if((c[o>>2]|0)>(c[p>>2]|0)){u=o;v=p;w=q;x=r;y=t;z=s;A=m;B=1;C=0}else{u=p;v=o;w=r;x=q;y=s;z=t;A=n;B=0;C=1}if((c[y>>2]|0)<0){ds(k,m);ds(l,n);c[t>>2]=-(c[t>>2]|0);c[s>>2]=-(c[s>>2]|0)}s=(c[v>>2]<<1)-(c[u>>2]|0)|0;t=c[v>>2]<<1;n=(c[v>>2]|0)-(c[u>>2]|0)<<1;c[q>>2]=c[k>>2];c[r>>2]=c[l>>2];l=0;k=0;u=3;while(1){if((c[w>>2]|0)>(c[A>>2]|0)){break}v=(d8(e,c[q>>2]|0,c[r>>2]|0)|0)<(f|0);if(((v?1:0)^g&1|0)!=0){u=3}else{v=(d8(e,(c[q>>2]|0)+C|0,(c[r>>2]|0)+B|0)|0)<(f|0);u=u&((v?1:0)^g&1|-2);v=(d8(e,(c[q>>2]|0)-C|0,(c[r>>2]|0)-B|0)|0)<(f|0);u=u&(((v?1:0)^g&1)<<1|-3)}if((u|0)!=0){k=k+1|0}else{l=l+1|0}v=w;c[v>>2]=(c[v>>2]|0)+1;if((s|0)<=0){s=s+t|0}else{s=s+n|0;v=x;c[v>>2]=(c[v>>2]|0)+(c[z>>2]|0)}}z=(aa(k,g&-2)|0)/(k+l|0)|0;i=j;return z|0}function du(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=0;if((i|0)<0){i=0}if((a|0)>=(c[e+4>>2]|0)){a=(c[e+4>>2]|0)-1|0}if((b|0)<0){b=0}if((d|0)>=(c[e+8>>2]|0)){d=(c[e+8>>2]|0)-1|0}j=b;L6787:while(1){if((j|0)>(d|0)){k=4930;break}b=i;while(1){if((b|0)>(a|0)){break}l=(d8(e,b,j)|0)<(f|0);h=(h<<24>>24|(l?1:2))&255;if((h<<24>>24&g|0)==(g|0)){k=4925;break L6787}b=b+1|0}j=j+1|0}if((k|0)==4925){m=g&255;n=m;return n|0}else if((k|0)==4930){m=h<<24>>24&g&255;n=m;return n|0}return 0}function dv(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;g=a;a=c;c=e;e=f;f=0;h=0;i=b-g|0;b=d-a|0;if((P(i|0)|0)>=(P(b|0)|0)){j=P(i|0)|0}else{j=P(b|0)|0}d=j;j=0;k=g;l=a;while(1){if((j|0)>(d|0)){break}if((d|0)!=0){k=g+((aa(j,i)|0)/(d|0)|0)|0;l=a+((aa(j,b)|0)/(d|0)|0)|0}m=(d8(c,k,l)|0)<(e|0);n=m?1:0;do{if((h|0)==0){if((n|0)!=1){break}f=f+1|0}}while(0);h=n;j=j+1|0}return f|0}function dw(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0;d=b;b=c;if((d|0)==0){e=0;f=e;return f|0}do{if((b|0)==45){g=a6(d|0,9600)|0;if((g|0)==0){break}e=1;f=e;return f|0}else{g=a6(d|0,es(b,5)|0)|0;if((g|0)!=0){e=1;f=e;return f|0}g=d;L6830:while(1){if((g|0)==0){h=4968;break}g=aC(g+1|0,45)|0;if((g|0)==0){h=4960;break}if((a[g|0]|0)==0){h=4960;break}if((a[g+1|0]|0)==0){h=4960;break}do{if((a[g-1|0]|0)!=45){if((a[g+1|0]|0)==45){break}if((a[g-1|0]|0)<=(b|0)){if((a[g+1|0]|0)>=(b|0)){h=4966;break L6830}}continue L6830}}while(0)}if((h|0)==4960){e=0;f=e;return f|0}else if((h|0)==4966){e=1;f=e;return f|0}else if((h|0)==4968){break}}}while(0);e=0;f=e;return f|0}function dx(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0;f=i;g=b;b=d;d=e;e=c[7036]|0;if((c[g+72>>2]|0)>10){h=4979}else{if((c[g+72>>2]|0)<0){h=4979}}if((h|0)==4979){j=c[n>>2]|0;au(j|0,21064,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;c[g+72>>2]=0}if((b|0)==0){j=c[n>>2]|0;au(j|0,15904,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k;l=0;m=l;i=f;return m|0}if((a[b|0]|0)==0){j=c[n>>2]|0;o=c[g>>2]|0;p=c[g+8>>2]|0;au(j|0,11200,(k=i,i=i+16|0,c[k>>2]=o,c[k+8>>2]=p,k)|0)|0;i=k;l=0;m=l;i=f;return m|0}if((c[e+37088>>2]|0)!=0){do{if((a[b|0]|0)>0){if((a[b+1|0]|0)!=0){break}if((dw(c[e+37088>>2]|0,a[b|0]|0)|0)!=0){break}l=0;m=l;i=f;return m|0}}while(0)}d=(aa(100-(c[e+44>>2]|0)|0,d)|0)/100|0;e=0;while(1){if((e|0)>=(c[g+72>>2]|0)){break}if((c[g+156+(e<<2)>>2]|0)!=0){if((bh(b|0,c[g+156+(e<<2)>>2]|0)|0)==0){h=4995;break}}e=e+1|0}do{if((c[g+72>>2]|0)>0){if((e|0)>=(c[g+72>>2]|0)){break}if((d|0)<=(c[g+116+(e<<2)>>2]|0)){l=0;m=l;i=f;return m|0}if((c[g+156+(e<<2)>>2]|0)!=0){ew(c[g+156+(e<<2)>>2]|0)}q=e;while(1){if((q|0)>=((c[g+72>>2]|0)-1|0)){break}c[g+76+(q<<2)>>2]=c[g+76+(q+1<<2)>>2];c[g+156+(q<<2)>>2]=c[g+156+(q+1<<2)>>2];c[g+116+(q<<2)>>2]=c[g+116+(q+1<<2)>>2];q=q+1|0}k=g+72|0;c[k>>2]=(c[k>>2]|0)-1}}while(0);e=0;while(1){if((e|0)>=(c[g+72>>2]|0)){break}if((d|0)>(c[g+116+(e<<2)>>2]|0)){h=5013;break}e=e+1|0}if((c[g+72>>2]|0)<9){h=g+72|0;c[h>>2]=(c[h>>2]|0)+1}q=(c[g+72>>2]|0)-1|0;while(1){if((q|0)<=(e|0)){break}c[g+76+(q<<2)>>2]=c[g+76+(q-1<<2)>>2];c[g+156+(q<<2)>>2]=c[g+156+(q-1<<2)>>2];c[g+116+(q<<2)>>2]=c[g+116+(q-1<<2)>>2];q=q-1|0}if((e|0)<(c[g+72>>2]|0)){c[g+76+(e<<2)>>2]=0;c[g+156+(e<<2)>>2]=ev((eA(b|0)|0)+1|0)|0;if((c[g+156+(e<<2)>>2]|0)!=0){q=c[g+156+(e<<2)>>2]|0;h=b;k=(eA(b|0)|0)+1|0;eB(q|0,h|0,k)|0}c[g+116+(e<<2)>>2]=d}if((e|0)==0){c[g+36>>2]=c[g+76>>2]}l=0;m=l;i=f;return m|0}function dy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;e=i;f=a;a=b;b=d;d=c[7036]|0;do{if((f|0)!=0){if((c[f+72>>2]|0)>10){g=5038;break}if((c[f+72>>2]|0)<0){g=5038}}else{g=5038}}while(0);if((g|0)==5038){h=c[n>>2]|0;au(h|0,9216,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;do{if((f|0)!=0){if((c[d+37072>>2]&6|0)==0){break}dk(f)}}while(0);c[f+72>>2]=0}do{if((a|0)!=0){if((a|0)==57344){break}do{if((c[d+37088>>2]|0)!=0){if((dw(c[d+37088>>2]|0,a)|0)!=0){break}k=0;l=k;i=e;return l|0}}while(0);do{if((c[f+40>>2]|0)!=32){if((c[f+40>>2]|0)==0){break}h=er(a,c[f+40>>2]|0)|0;if((h|0)==(a|0)){if((c[d+37072>>2]&7|0)!=0){m=c[n>>2]|0;o=es(a,6)|0;p=c[f>>2]|0;q=c[f+8>>2]|0;r=b;au(m|0,7040,(j=i,i=i+32|0,c[j>>2]=o,c[j+8>>2]=p,c[j+16>>2]=q,c[j+24>>2]=r,j)|0)|0;i=j}}a=h}}while(0);b=(aa(100-(c[d+44>>2]|0)|0,b)|0)/100|0;h=0;while(1){if((h|0)>=(c[f+72>>2]|0)){break}if((a|0)==(c[f+76+(h<<2)>>2]|0)){g=5059;break}h=h+1|0}do{if((c[f+72>>2]|0)>0){if((h|0)>=(c[f+72>>2]|0)){break}if((b|0)<=(c[f+116+(h<<2)>>2]|0)){k=0;l=k;i=e;return l|0}if((c[f+156+(h<<2)>>2]|0)!=0){ew(c[f+156+(h<<2)>>2]|0)}s=h;while(1){if((s|0)>=((c[f+72>>2]|0)-1|0)){break}c[f+76+(s<<2)>>2]=c[f+76+(s+1<<2)>>2];c[f+156+(s<<2)>>2]=c[f+156+(s+1<<2)>>2];c[f+116+(s<<2)>>2]=c[f+116+(s+1<<2)>>2];s=s+1|0}r=f+72|0;c[r>>2]=(c[r>>2]|0)-1}}while(0);h=0;while(1){if((h|0)>=(c[f+72>>2]|0)){break}if((b|0)>(c[f+116+(h<<2)>>2]|0)){g=5076;break}h=h+1|0}if((c[f+72>>2]|0)<9){r=f+72|0;c[r>>2]=(c[r>>2]|0)+1}s=(c[f+72>>2]|0)-1|0;while(1){if((s|0)<=(h|0)){break}c[f+76+(s<<2)>>2]=c[f+76+(s-1<<2)>>2];c[f+156+(s<<2)>>2]=c[f+156+(s-1<<2)>>2];c[f+116+(s<<2)>>2]=c[f+116+(s-1<<2)>>2];s=s-1|0}if((h|0)<(c[f+72>>2]|0)){c[f+76+(h<<2)>>2]=a;c[f+156+(s<<2)>>2]=0;c[f+116+(h<<2)>>2]=b}if((h|0)==0){c[f+36>>2]=a}k=0;l=k;i=e;return l|0}}while(0);au(c[n>>2]|0,8256,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;k=0;l=k;i=e;return l|0}function dz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;if((c[e+72>>2]|0)>10){f=5097}else{if((c[e+72>>2]|0)<0){f=5097}}if((f|0)==5097){b=c[n>>2]|0;au(b|0,6040,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;c[e+72>>2]=0}b=0;while(1){if((b|0)>=(c[e+72>>2]|0)){f=5104;break}if((a|0)==(c[e+76+(b<<2)>>2]|0)){f=5101;break}b=b+1|0}if((f|0)==5104){g=0;h=g;i=d;return h|0}else if((f|0)==5101){g=c[e+116+(b<<2)>>2]|0;h=g;i=d;return h|0}return 0}function dA(a,b,d,e,f,g,h,i,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0;l=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=k;do{if((d|0)>=0){if((f|0)<0){break}if((d|0)>=(c[l+4>>2]|0)){break}if((f|0)>=(c[l+8>>2]|0)){break}L7036:while(1){do{if((c[a>>2]|0)>=(d|0)){if((c[b>>2]|0)<(f|0)){m=0;break}if((c[a>>2]|0)>(e|0)){m=0;break}m=(c[b>>2]|0)<=(g|0)}else{m=0}}while(0);if(!m){n=5133;break}if((d8(l,c[a>>2]|0,c[b>>2]|0)|0)<(h|0)){o=j}else{o=i}k=o;switch(k|0){case 1:{p=b;c[p>>2]=(c[p>>2]|0)-1;break};case 2:{p=b;c[p>>2]=(c[p>>2]|0)+1;break};case 4:{p=a;c[p>>2]=(c[p>>2]|0)-1;break};case 3:{p=a;c[p>>2]=(c[p>>2]|0)+1;break};case 7:{break};default:{n=5128;break L7036}}if((k|0)==7){n=5130;break}}if((n|0)==5128){aE(4136,24920,507,25312)}else if((n|0)==5130){return}else if((n|0)==5133){return}}}while(0);return}function dB(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=a;a=b;b=c;c=d;d=e;e=f;f=a;h=b;i=1;j=0;if((c|0)>(a|0)){k=a;l=c}else{l=a;k=c}if((d|0)>(b|0)){m=b;n=d}else{n=b;m=d}o=(d8(g,f,h)|0)<(e|0);p=o?1:0;L7072:while(1){o=(d8(g,f+j|0,h-i|0)|0)<(e|0);do{if((p|0)==((o?1:0)|0)){if((f+j|0)<(k|0)){q=5149;break}if((f+j|0)>(l|0)){q=5149;break}if((h-i|0)<(m|0)){q=5149;break}if((h-i|0)>(n|0)){q=5149;break}r=j;j=-i|0;i=r;f=f+i|0;h=h+j|0}else{q=5149}}while(0);if((q|0)==5149){q=0;r=i;i=-j|0;j=r}if((f|0)==(c|0)){if((h|0)==(d|0)){q=5152;break}}do{if((f|0)==(a|0)){if((h|0)!=(b|0)){break}if((i|0)==1){q=5156;break L7072}}}while(0)}if((q|0)==5152){s=1;t=s;return t|0}else if((q|0)==5156){s=0;t=s;return t|0}return 0}function dC(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;i=a;a=b;b=d;d=e;e=f;f=g;g=0;if((a|0)<0){j=g;return j|0}if((b|0)<0){j=g;return j|0}if((a|0)>=(c[i+4>>2]|0)){j=g;return j|0}if((b|0)>=(c[i+8>>2]|0)){j=g;return j|0}k=h;if((k|0)==3){while(1){if((g|0)<(d|0)){l=(a|0)<(c[i+4>>2]|0)}else{l=0}if(!l){break}if(((d8(i,a,b)|0)<(e|0)^f|0)!=0){m=5198;break}g=g+1|0;a=a+1|0}}else if((k|0)==1){while(1){if((g|0)<(d|0)){n=(b|0)>=0}else{n=0}if(!n){break}if(((d8(i,a,b)|0)<(e|0)^f|0)!=0){m=5171;break}g=g+1|0;b=b-1|0}}else if((k|0)==4){while(1){if((g|0)<(d|0)){o=(a|0)>=0}else{o=0}if(!o){break}if(((d8(i,a,b)|0)<(e|0)^f|0)!=0){m=5189;break}g=g+1|0;a=a-1|0}}else if((k|0)==2){while(1){if((g|0)<(d|0)){p=(b|0)<(c[i+8>>2]|0)}else{p=0}if(!p){break}if(((d8(i,a,b)|0)<(e|0)^f|0)!=0){m=5180;break}g=g+1|0;b=b+1|0}}j=g;return j|0}function dD(b,e,f,g,h,j,k,l,m,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;p=i;q=b;b=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=o;o=0;r=0;s=1024;t=0;do{if((b|0)>=0){if((e|0)<0){break}if((b|0)>=(c[q+4>>2]|0)){break}if((e|0)>=(c[q+8>>2]|0)){break}if(((d5(q,b,e)|0)&l|0)==(l|0)){u=0;v=u;i=p;return v|0}w=(d8(q,b,e)|0)<(k|0);x=w?0:1;w=ev(s<<2<<1)|0;if((w|0)==0){y=c[n>>2]|0;au(y|0,24264,(z=i,i=i+1|0,i=i+7&-8,c[z>>2]=0,z)|0)|0;i=z;u=0;v=u;i=p;return v|0}c[w>>2]=b;c[w+4>>2]=e;t=1;while(1){if((t|0)==0){break}if((t|0)>(r|0)){r=t}t=t-1|0;b=c[w+(t<<1<<2)>>2]|0;e=c[w+((t<<1)+1<<2)>>2]|0;if((e|0)<(c[h>>2]|0)){c[h>>2]=e}if((e|0)>(c[j>>2]|0)){c[j>>2]=e}while(1){if((b|0)>0){y=(d8(q,b-1|0,e)|0)<(k|0);A=(x|0)==((y?0:1)|0)}else{A=0}if(!A){break}b=b-1|0}if(((d5(q,b,e)|0)&l|0)==(l|0)){continue}y=-1;while(1){if((y|0)>=2){break}do{if((m|0)!=0){if((b|0)>=(c[q+4>>2]|0)){B=5248;break}if((b-1|0)<=0){B=5248;break}if((e+y|0)<0){B=5248;break}if((e+y|0)>=(c[q+8>>2]|0)){B=5248;break}C=(d8(q,b,e+y|0)|0)<(k|0);if((x|0)==((C?0:1)|0)){B=5248;break}C=(d8(q,b-1|0,e+y|0)|0)<(k|0);if((x|0)!=((C?0:1)|0)){B=5248;break}if(((d5(q,b-1|0,e+y|0)|0)&l|0)==(l|0)){B=5248;break}if((t+1|0)>=(s|0)){c[6842]=c[6842]|1;break}else{c[w+(t<<1<<2)>>2]=b-1;c[w+((t<<1)+1<<2)>>2]=e+y;t=t+1|0;B=5248;break}}else{B=5248}}while(0);if((B|0)==5248){B=0}y=y+2|0}if((b|0)<(c[f>>2]|0)){c[f>>2]=b}while(1){if((b|0)<(c[q+4>>2]|0)){C=(d8(q,b,e)|0)<(k|0);D=(x|0)==((C?0:1)|0)}else{D=0}if(!D){break}C=b+(aa(e,c[q+4>>2]|0)|0)|0;E=(c[q>>2]|0)+C|0;a[E]=(d[E]|0|l&7)&255;o=o+1|0;if((b|0)>(c[g>>2]|0)){c[g>>2]=b}y=-1;while(1){if((y|0)>=2){break}E=(d8(q,b,e+y|0)|0)<(k|0);do{if((x|0)==((E?0:1)|0)){C=(d8(q,b-1|0,e)|0)<(k|0);if((x|0)==((C?0:1)|0)){C=(d8(q,b-1|0,e+y|0)|0)<(k|0);if((x|0)==((C?0:1)|0)){B=5269;break}}if(((d5(q,b,e+y|0)|0)&l|0)==(l|0)){B=5269;break}if((e+y|0)>=(c[q+8>>2]|0)){B=5269;break}if((e+y|0)<0){B=5269;break}if((t+1|0)>=(s|0)){c[6842]=c[6842]|1;break}else{c[w+(t<<1<<2)>>2]=b;c[w+((t<<1)+1<<2)>>2]=e+y;t=t+1|0;B=5269;break}}else{B=5269}}while(0);if((B|0)==5269){B=0}y=y+2|0}b=b+1|0}y=-1;while(1){if((y|0)>=2){break}do{if((m|0)!=0){if((b|0)>=(c[q+4>>2]|0)){B=5288;break}if((b-1|0)<=0){B=5288;break}if((e+y|0)<0){B=5288;break}if((e+y|0)>=(c[q+8>>2]|0)){B=5288;break}E=(d8(q,b-1|0,e)|0)<(k|0);if((x|0)!=((E?0:1)|0)){B=5288;break}E=(d8(q,b,e)|0)<(k|0);if((x|0)==((E?0:1)|0)){B=5288;break}E=(d8(q,b-1|0,e+y|0)|0)<(k|0);if((x|0)==((E?0:1)|0)){B=5288;break}E=(d8(q,b,e+y|0)|0)<(k|0);if((x|0)!=((E?0:1)|0)){B=5288;break}if(((d5(q,b,e+y|0)|0)&l|0)==(l|0)){B=5288;break}if((t+1|0)>=(s|0)){c[6842]=c[6842]|1;break}else{c[w+(t<<1<<2)>>2]=b;c[w+((t<<1)+1<<2)>>2]=e+y;t=t+1|0;B=5288;break}}else{B=5288}}while(0);if((B|0)==5288){B=0}y=y+2|0}}if((c[6842]|0)==1){c[6842]=c[6842]|2;x=c[n>>2]|0;au(x|0,23448,(z=i,i=i+1|0,i=i+7&-8,c[z>>2]=0,z)|0)|0;i=z}ew(w);u=o;v=u;i=p;return v|0}}while(0);u=0;v=u;i=p;return v|0}function dE(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+32|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=a;a=b;b=d;d=e;e=f;do{if((a|0)>=0){if((b|0)<0){break}if((a|0)>=(c[m+4>>2]|0)){break}if((b|0)>=(c[m+8>>2]|0)){break}if(((d5(m,a,b)|0)&e|0)==(e|0)){break}f=a;c[j>>2]=f;c[h>>2]=f;f=b;c[l>>2]=f;c[k>>2]=f;n=dD(m,a,b,h,j,k,l,d,e,c[(c[7036]|0)+44>>2]&1)|0;o=n;i=g;return o|0}}while(0);n=0;o=n;i=g;return o|0}function dF(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;l=i;m=b;b=e;e=f;f=g;g=h;h=j;j=k;k=1;o=1;p=1;q=0;r=0;s=c[m+68>>2]|0;do{if((b|0)>=0){if((e|0)<0){break}if((b|0)>=(c[s+4>>2]|0)){break}if((e|0)>=(c[s+8>>2]|0)){break}t=j;u=(d8(s,b,e)|0)<(f|0);v=u?0:1;u=(d8(s,b+(c[256+(t<<3)>>2]|0)|0,e+(c[260+(t<<3)>>2]|0)|0)|0)<(f|0);w=u?0:1;if((v|0)==(w|0)){u=c[n>>2]|0;au(u|0,22048,(u=i,i=i+1|0,i=i+7&-8,c[u>>2]=0,u)|0)|0;i=u;x=-7;y=x;i=l;return y|0}if((c[m+196>>2]|0)>=8){x=-2;y=x;i=l;return y|0}if((c[m+196>>2]|0)==0){z=0}else{z=c[m+264+(c[m+196>>2]<<2)>>2]|0}w=z;u=z;A=m+196|0;c[A>>2]=(c[A>>2]|0)+1;A=b;B=e;L7304:while(1){if((k|0)!=0){C=b+(aa(e,c[s+4>>2]|0)|0)|0;D=(c[s>>2]|0)+C|0;a[D]=(d[D]|0|g&7)&255}do{if((k|0)!=0){if(((p|0)%(o|0)|0|0)!=0){break}if((w|0)>=128){c[m+264+((c[m+196>>2]|0)-1<<2)>>2]=w;D=m;bW(D,1)|0;w=c[m+264+((c[m+196>>2]|0)-1<<2)>>2]|0;o=(((c[m+12>>2]|0)-(c[m+8>>2]|0)+(c[m+4>>2]|0)-(c[m>>2]|0)|0)/32|0)+1|0}if((w|0)<128){c[m+296+(w<<3)>>2]=b;c[m+296+(w<<3)+4>>2]=e;if((w|0)>1){E=(c[m+296+(w-1<<3)>>2]|0)-(c[m+296+(w-2<<3)>>2]|0)|0;F=(c[m+296+(w-1<<3)+4>>2]|0)-(c[m+296+(w-2<<3)+4>>2]|0)|0;D=b-(c[m+296+(w-1<<3)>>2]|0)|0;C=e-(c[m+296+(w-1<<3)+4>>2]|0)|0;do{if(((aa(E,C)|0)-(aa(F,D)|0)|0)==0){if((aa(E,D)|0)<0){break}if((aa(F,C)|0)<0){break}w=w-1|0;c[m+296+(w<<3)>>2]=b;c[m+296+(w<<3)+4>>2]=e}}while(0)}w=w+1|0;c[m+264+((c[m+196>>2]|0)-1<<2)>>2]=w}}}while(0);k=0;do{if((b|0)==(A|0)){if((e|0)!=(B|0)){break}if((P(q|0)|0)>=8){break L7304}}}while(0);E=b+(c[256+(t<<3)>>2]|0)|0;F=e+(c[260+(t<<3)>>2]|0)|0;do{if((E|0)<0){G=5346}else{if((F|0)<0){G=5346;break}if((E|0)>=(c[s+4>>2]|0)){G=5346;break}if((F|0)>=(c[s+8>>2]|0)){G=5346;break}C=(d8(s,E,F)|0)<(f|0);if((v|0)!=((C?0:1)|0)){G=5346;break}b=E;e=F;t=t+6-h&7;q=q+(2-h-4)|0;p=p+1|0;if((b|0)<(c[m>>2]|0)){c[m>>2]=b}if((b|0)>(c[m+4>>2]|0)){c[m+4>>2]=b}if((e|0)<(c[m+8>>2]|0)){c[m+8>>2]=e}if((e|0)>(c[m+12>>2]|0)){c[m+12>>2]=e}k=1}}while(0);if((G|0)==5346){G=0;do{if((e|0)==(F|0)){if((E|0)<0){break}if((E|0)>=(c[s+4>>2]|0)){break}C=E+(aa(F,c[s+4>>2]|0)|0)|0;D=(c[s>>2]|0)+C|0;a[D]=(d[D]|0|g&7)&255}}while(0);t=t+2-h&7;q=q+(2-h)|0;D=t+h|0;if((D|0)==8){r=r+b|0}else if((D|0)==4){r=r-(b-1)|0}}}c[m+200+((c[m+196>>2]|0)-1<<2)>>2]=r;c[m+232+((c[m+196>>2]|0)-1<<2)>>2]=p-1;if((w-u|0)>1){w=w-1|0;p=p-1|0;c[m+264+((c[m+196>>2]|0)-1<<2)>>2]=w}x=p;y=x;i=l;return y|0}}while(0);x=0;y=x;i=l;return y|0}function dG(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0;i=b;b=e;e=f;f=h;h=g;while(1){if((h|0)>(f|0)){break}g=b;while(1){if((g|0)>(e|0)){break}j=g+(aa(h,c[i+4>>2]|0)|0)|0;k=(c[i>>2]|0)+j|0;a[k]=(d[k]|0)&-8&255;g=g+1|0}h=h+1|0}return}function dH(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;j=i;i=i+48|0;k=j|0;l=j+16|0;m=j+24|0;o=j+32|0;p=j+40|0;q=a;a=d;d=f;f=g;g=h;h=0;r=b-q+1|0;b=e-a+1|0;if((g|0)!=0){c[g>>2]=0}do{if((r|0)>=3){if((b|0)<3){break}e=ev(aa(r,b)|0)|0;c[k>>2]=e;if((e|0)==0){e=c[n>>2]|0;s=aa(r,b)|0;au(e|0,20656,(e=i,i=i+8|0,c[e>>2]=s,e)|0)|0;i=e;t=0;u=t;i=j;return u|0}if((bS(d,q,a,r,b,k,aa(r,b)|0)|0)!=0){ew(c[k>>2]|0);t=-1;u=t;i=j;return u|0}e=0;while(1){if((e|0)>=(c[k+4>>2]|0)){break}if((d8(k,e,0)|0)>=(f|0)){s=e;v=f;dE(k,s,0,v,7)|0}if((d8(k,e,(c[k+8>>2]|0)-1|0)|0)>=(f|0)){v=e;s=(c[k+8>>2]|0)-1|0;w=f;dE(k,v,s,w,7)|0}e=e+1|0}w=0;while(1){if((w|0)>=(c[k+8>>2]|0)){break}if((d8(k,0,w)|0)>=(f|0)){s=w;v=f;dE(k,0,s,v,7)|0}if((d8(k,(c[k+4>>2]|0)-1|0,w)|0)>=(f|0)){v=(c[k+4>>2]|0)-1|0;s=w;x=f;dE(k,v,s,x,7)|0}w=w+1|0}e=0;while(1){if((e|0)>=(c[k+4>>2]|0)){break}w=0;while(1){if((w|0)>=(c[k+8>>2]|0)){break}if(((d5(k,e,w)|0)&7|0)!=7){if((d8(k,e,w)|0)>=(f|0)){x=e;c[m>>2]=x;c[l>>2]=x;x=w;c[p>>2]=x;c[o>>2]=x;x=dD(k,e,w,l,m,o,p,f,7,c[(c[7036]|0)+44>>2]&1)|0;if((x|0)>1){y=5414}else{if((aa(r,b)|0)<=40){y=5414}}if((y|0)==5414){y=0;h=h+1|0;if((g|0)!=0){s=0;while(1){if((s|0)<(c[g>>2]|0)){z=(s|0)<3}else{z=0}if(!z){break}if((c[g+4+(s*28|0)>>2]|0)<(x|0)){y=5420;break}s=s+1|0}if((y|0)==5420){y=0}v=1;while(1){if((v|0)<(s|0)){break}A=g+4+((v+1|0)*28|0)|0;B=g+4+(v*28|0)|0;c[A>>2]=c[B>>2];c[A+4>>2]=c[B+4>>2];c[A+8>>2]=c[B+8>>2];c[A+12>>2]=c[B+12>>2];c[A+16>>2]=c[B+16>>2];c[A+20>>2]=c[B+20>>2];c[A+24>>2]=c[B+24>>2];v=v-1|0}if((s|0)<3){c[g+4+(s*28|0)>>2]=x;c[g+4+(s*28|0)+4>>2]=e;c[g+4+(s*28|0)+8>>2]=w;c[g+4+(s*28|0)+12>>2]=c[l>>2];c[g+4+(s*28|0)+16>>2]=c[o>>2];c[g+4+(s*28|0)+20>>2]=c[m>>2];c[g+4+(s*28|0)+24>>2]=c[p>>2]}v=g|0;c[v>>2]=(c[v>>2]|0)+1}}}}w=w+1|0}e=e+1|0}ew(c[k>>2]|0);t=h;u=t;i=j;return u|0}}while(0);t=0;u=t;i=j;return u|0}function dI(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+16|0;j=h|0;k=a;a=b;b=d;d=e;e=f;f=g;g=0;do{if((a|0)>=(k|0)){if((d|0)<(b|0)){break}l=ev(aa(a-k+1|0,d-b+1|0)|0)|0;c[j>>2]=l;if((l|0)==0){l=c[n>>2]|0;m=aa(a-k+1|0,d-b+1|0)|0;au(l|0,19968,(l=i,i=i+8|0,c[l>>2]=m,l)|0)|0;i=l;o=0;p=o;i=h;return p|0}if((bS(e,k,b,a-k+1|0,d-b+1|0,j,aa(a-k+1|0,d-b+1|0)|0)|0)!=0){ew(c[j>>2]|0);o=-1;p=o;i=h;return p|0}l=0;while(1){if((l|0)>=(c[j+4>>2]|0)){break}m=0;while(1){if((m|0)>=(c[j+8>>2]|0)){break}if((d8(j,l,m)|0)<(f|0)){if(((d5(j,l,m)|0)&7|0)!=7){g=g+1|0;q=l;r=m;s=f;dE(j,q,r,s,7)|0}}m=m+1|0}l=l+1|0}ew(c[j>>2]|0);o=g;p=o;i=h;return p|0}}while(0);o=0;p=o;i=h;return p|0}function dJ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;g=i;h=a;a=b;b=d;d=e;e=f;f=0;j=0;k=0;l=c[a>>2]|0;m=c[a+8>>2]|0;o=c[d>>2]|0;p=c[d+8>>2]|0;q=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;r=(c[d+4>>2]|0)-(c[d>>2]|0)+1|0;if((q|0)>(r|0)){s=q}else{s=r}t=s;s=(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0;u=(c[d+12>>2]|0)-(c[d+8>>2]|0)+1|0;if((s|0)>(u|0)){v=s}else{v=u}w=v;do{if((P(q-r|0)|0)<=(((t|0)/16|0)+1|0)){if((P(s-u|0)|0)>(((w|0)/16|0)+1|0)){break}do{if((c[a+12>>2]<<1|0)>((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){if((c[d+12>>2]<<1|0)>=((c[d+60>>2]|0)+(c[d+64>>2]|0)|0)){break}k=k+128|0}}while(0);do{if((c[a+8>>2]<<1|0)>((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){if((c[d+8>>2]<<1|0)>=((c[d+52>>2]|0)+(c[d+56>>2]|0)|0)){break}k=k+128|0}}while(0);v=0;while(1){if((v|0)>=(w|0)){break}x=0;while(1){if((x|0)>=(t|0)){break}y=(d8(h,l+x|0,m+v|0)|0)<(e|0);z=y?1:0;y=8;A=(d8(b,o+x|0,p+v|0)|0)<(e|0);B=8;if((z|0)==((A?1:0)|0)){j=j+8|0}else{z=-1;y=-1;while(1){if((y|0)>=2){break}B=-1;while(1){if((B|0)>=2){break}if((y|0)!=0){C=5495}else{if((B|0)!=0){C=5495}}if((C|0)==5495){C=0;A=(d8(h,l+x+(aa(y,((t|0)/32|0)+1|0)|0)|0,m+v+(aa(B,((w|0)/32|0)+1|0)|0)|0)|0)<(e|0);D=(d8(b,o+x+(aa(y,((t|0)/32|0)+1|0)|0)|0,p+v+(aa(B,((w|0)/32|0)+1|0)|0)|0)|0)<(e|0);if(((A?1:0)|0)!=((D?1:0)|0)){z=z+1|0}}B=B+1|0}y=y+1|0}if((z|0)>0){k=k+(z<<4)|0}else{k=k+1|0}}x=x+1|0}v=v+1|0}if((j+k|0)!=0){f=((k*100|0)+(j+k-1)|0)/(j+k|0)|0}else{f=99}do{if((f|0)<10){if((c[(c[7036]|0)+37072>>2]&7|0)==0){break}v=c[n>>2]|0;x=f;y=j;B=k;au(v|0,19304,(v=i,i=i+24|0,c[v>>2]=x,c[v+8>>2]=y,c[v+16>>2]=B,v)|0)|0;i=v}}while(0);E=f;F=E;i=g;return F|0}}while(0);E=100;F=E;i=g;return F|0}function dK(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+1344|0;f=e|0;g=e+8|0;h=e+24|0;j=b;b=d;d=57344;c[f>>2]=32;k=c[j+68>>2]|0;l=h;m=j;eB(l|0,m|0,1320)|0;do{if((c[j+72>>2]|0)>0){if((c[j+116>>2]|0)<(c[(c[7036]|0)+37092>>2]|0)){break}if((d|0)!=57344){break}d=c[j+76>>2]|0}}while(0);c[h>>2]=c[j>>2];c[h+8>>2]=c[j+8>>2];c[h+4>>2]=c[j+4>>2];c[h+12>>2]=c[j+12>>2];m=c[j+16>>2]|0;l=c[j+20>>2]|0;o=c[j>>2]|0;p=c[j+8>>2]|0;q=c[j+4>>2]|0;r=c[j+12>>2]|0;while(1){if(((du(o,q,p,p,k,b,1)|0)<<24>>24|0)!=1){s=(p+1|0)<(r|0)}else{s=0}if(!s){break}p=p+1|0}while(1){if(((du(o,q,r,r,k,b,1)|0)<<24>>24|0)!=1){t=(p+1|0)<(r|0)}else{t=0}if(!t){break}r=r-1|0}t=q-o+1|0;s=r-p+1|0;do{if((c[f>>2]|0)==32){if((s|0)<=5){break}if((c[j+28>>2]|0)<=1){break}u=j;v=b;cJ(u,v,2,f)|0}}while(0);v=c[j+24>>2]|0;p=c[j+8>>2]|0;s=r-p+1|0;while(1){if(((du(o,q,p,p,k,b,1)|0)<<24>>24|0)==0){w=(p+1|0)<(r|0)}else{w=0}if(!w){break}p=p+1|0}while(1){if(((du(o,q,r,r,k,b,1)|0)<<24>>24|0)==0){x=(p+1|0)<(r|0)}else{x=0}if(!x){break}r=r-1|0}while(1){if(((du(o,o,p,r,k,b,1)|0)<<24>>24|0)==0){y=(o+1|0)<(q|0)}else{y=0}if(!y){break}o=o+1|0}while(1){if(((du(q,q,p,r,k,b,1)|0)<<24>>24|0)==0){z=(o+1|0)<(q|0)}else{z=0}if(!z){break}q=q-1|0}t=q-o+1|0;s=r-p+1|0;c[j>>2]=o;c[j+8>>2]=p;c[j+4>>2]=q;c[j+12>>2]=r;do{if((m|0)<(o|0)){A=5563}else{if((m|0)>(q|0)){A=5563;break}if((l|0)<(p|0)){A=5563;break}if((l|0)>(r|0)){A=5563;break}if((d8(k,m,l)|0)>=(b|0)){A=5563;break}if((v|0)>0){A=5563}}}while(0);if((A|0)==5563){B=r;while(1){if((B|0)<(p|0)){break}C=(o+q|0)/2|0;v=0;while(1){if((C|0)>=(o|0)){D=(C|0)<=(q|0)}else{D=0}if(!D){break}if((d8(k,C,B)|0)<(b|0)){if((d8(k,C+1|0,B)|0)<(b|0)){A=5572;break}if((d8(k,C,B+1|0)|0)<(b|0)){A=5572;break}}v=v+1|0;C=C+(aa((v<<1&2)-1|0,v)|0)|0}if((A|0)==5572){A=0;m=C;l=B;B=-1}B=B-1|0}}do{if((t|0)>=1){if((s|0)<1){break}c[g>>2]=ev(aa(t,s)|0)|0;if((c[g>>2]|0)==0){A=c[n>>2]|0;au(A|0,18616,(E=i,i=i+8|0,c[E>>2]=1224,E)|0)|0;i=E}if((bS(k,o,p,t,s,g,aa(t,s)|0)|0)!=0){ew(c[g>>2]|0);F=d;G=F;i=e;return G|0}if((p|0)>0){C=o;while(1){if((C|0)>(q|0)){break}do{if((d8(k,C,p-1|0)|0)<(b|0)){if((d8(k,C,p)|0)>=(b|0)){break}if(((d5(g,C-o|0,0)|0)&1|0)==1){break}A=C-o|0;D=b;dE(g,A,0,D,1)|0}}while(0);C=C+1|0}}if((o|0)>0){B=p;while(1){if((B|0)>(r|0)){break}do{if((d8(k,o-1|0,B)|0)<(b|0)){if((d8(k,o,B)|0)>=(b|0)){break}if(((d5(g,0,B-p|0)|0)&1|0)==1){break}D=B-p|0;A=b;dE(g,0,D,A,1)|0}}while(0);B=B+1|0}}if((q|0)<((c[k+4>>2]|0)-1|0)){B=p;while(1){if((B|0)>(r|0)){break}do{if((d8(k,q+1|0,B)|0)<(b|0)){if((d8(k,q,B)|0)>=(b|0)){break}if(((d5(g,q-o|0,B-p|0)|0)&1|0)==1){break}A=q-o|0;D=B-p|0;v=b;dE(g,A,D,v,1)|0}}while(0);B=B+1|0}}v=m-o|0;D=l-p|0;A=b;dE(g,v,D,A,2)|0;C=0;while(1){if((C|0)>=(c[g+4>>2]|0)){break}B=0;while(1){if((B|0)>=(c[g+8>>2]|0)){break}do{if(((d5(g,C,B)|0)&3|0)==1){if((d8(g,C,B)|0)>=(b|0)){break}A=C+(aa(B,c[g+4>>2]|0)|0)|0;a[(c[g>>2]|0)+A|0]=-8}}while(0);B=B+1|0}C=C+1|0}d=cK(j,g,b)|0;do{if((c[j+72>>2]|0)>0){if((c[j+116>>2]|0)<(c[(c[7036]|0)+37092>>2]|0)){break}if((d|0)!=57344){break}d=c[j+76>>2]|0}}while(0);do{if((c[f>>2]|0)!=0){if((c[f>>2]|0)==32){break}if((d|0)>=127){break}A=er(d,c[f>>2]|0)|0;if((A|0)==(d|0)){if((c[(c[7036]|0)+37072>>2]&7|0)!=0){D=c[n>>2]|0;v=es(d,6)|0;z=c[j>>2]|0;y=c[j+8>>2]|0;au(D|0,17952,(E=i,i=i+24|0,c[E>>2]=v,c[E+8>>2]=z,c[E+16>>2]=y,E)|0)|0;i=E}}d=A}}while(0);c[j>>2]=c[h>>2];c[j+8>>2]=c[h+8>>2];c[j+4>>2]=c[h+4>>2];c[j+12>>2]=c[h+12>>2];ew(c[g>>2]|0);F=d;G=F;i=e;return G|0}}while(0);F=d;G=F;i=e;return G|0}function dL(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;e=a;a=b;if((c[e+37072>>2]|0)!=0){b=c[n>>2]|0;au(b|0,17608,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f}b=c[e+37052>>2]|0;c[e+37048>>2]=0;c[e+37044>>2]=0;c[e+37040>>2]=0;dG(a,0,(c[a+4>>2]|0)-1|0,0,(c[a+8>>2]|0)-1|0);g=0;while(1){if((g|0)>=(c[a+8>>2]|0)){break}h=0;while(1){if((h|0)>=(c[a+4>>2]|0)){break}j=2;while(1){if((j|0)>=7){break}k=h+((j|0)==2?-1:1)|0;L7736:do{if((k|0)<0){l=5653}else{if((k|0)>=(c[a+4>>2]|0)){l=5653;break}do{if((d8(a,h,g)|0)<(b|0)){if((d8(a,k,g)|0)<(b|0)){break}do{if(((d5(a,h,g)|0)&1|0)!=0){if(((d5(a,k,g)|0)&1|0)==0){break}break L7736}}while(0);m=bU(0)|0;o=h;c[m+16>>2]=o;c[m+4>>2]=o;c[m>>2]=o;o=g;c[m+20>>2]=o;c[m+12>>2]=o;c[m+8>>2]=o;c[m+196>>2]=0;c[m+24>>2]=0;c[m+28>>2]=1;c[m+32>>2]=0;c[m+40>>2]=0;c[m+44>>2]=c[e+37048>>2];c[m+48>>2]=0;c[m+52>>2]=0;c[m+56>>2]=0;c[m+60>>2]=0;c[m+64>>2]=0;c[m+68>>2]=a;c[m+72>>2]=0;if((dF(m,h,g,b,1,1,j)|0)<0){o=m;bV(o)|0;break L7736}do{if((c[m+196>>2]|0)!=0){if((c[m+264>>2]|0)!=0){break}o=c[n>>2]|0;p=h;q=g;au(o|0,17248,(f=i,i=i+16|0,c[f>>2]=p,c[f+8>>2]=q,f)|0)|0;i=f}}while(0);q=e+37048|0;c[q>>2]=(c[q>>2]|0)+1;q=e+37040|0;c[q>>2]=(c[q>>2]|0)+((c[m+4>>2]|0)-(c[m>>2]|0)+1);q=e+37044|0;c[q>>2]=(c[q>>2]|0)+((c[m+12>>2]|0)-(c[m+8>>2]|0)+1);q=(aa((c[m+12>>2]|0)-(c[m+8>>2]|0)+1|0,(c[m+4>>2]|0)-(c[m>>2]|0)+1|0)|0)>=2e4;c[m+36>>2]=q?57345:57344;q=e+84|0;p=m;cu(q,p)|0;break L7736}}while(0)}}while(0);if((l|0)==5653){l=0}j=j+4|0}h=h+1|0}g=g+1|0}if((c[e+37048>>2]|0)==0){r=e;s=r+84|0;t=s+36964|0;u=c[t>>2]|0;i=d;return u|0}if((c[e+37072>>2]|0)!=0){g=c[n>>2]|0;l=c[e+37048>>2]|0;b=((c[e+37040>>2]|0)+((c[e+37048>>2]|0)/2|0)|0)/(c[e+37048>>2]|0)|0;a=((c[e+37044>>2]|0)+((c[e+37048>>2]|0)/2|0)|0)/(c[e+37048>>2]|0)|0;au(g|0,16944,(f=i,i=i+24|0,c[f>>2]=l,c[f+8>>2]=b,c[f+16>>2]=a,f)|0)|0;i=f}r=e;s=r+84|0;t=s+36964|0;u=c[t>>2]|0;i=d;return u|0}function dM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((c[d>>2]|0)<(c[a>>2]|0)){e=-1;f=e;return f|0}if((c[d>>2]|0)>(c[a>>2]|0)){e=1;f=e;return f|0}else{e=0;f=e;return f|0}return 0}function dN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;b=i;i=i+4096|0;d=b|0;e=a;a=0;f=0;g=2;h=10;j=1;k=1023;l=0;m=0;o=2047;p=0;q=0;if((c[e+37072>>2]|0)!=0){r=c[n>>2]|0;au(r|0,16576,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}r=0;while(1){if((r|0)>=(c[e+156>>2]|0)){break}if((c[e+37072>>2]|0)!=0){t=c[n>>2]|0;u=r;au(t|0,16240,(s=i,i=i+8|0,c[s>>2]=u,s)|0)|0;i=s}a=0;j=1;m=0;o=2047;k=1023;l=0;if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){v=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{v=0}if(!v){break}u=c[(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((r|0)>0){if((c[u+48>>2]|0)==(r|0)){w=5701;break}}else{w=5701}}while(0);do{if((w|0)==5701){w=0;if(((c[u+12>>2]|0)-(c[u+8>>2]|0)+1|0)<4){w=5703}else{if((c[u+36>>2]|0)==57345){w=5703}}if((w|0)==5703){w=0;p=0;q=0}if((p|0)==0){p=u;break}t=(c[u>>2]|0)-(c[p+4>>2]|0)-1|0;if((t|0)<0){q=0;p=u;break}if(((c[u+4>>2]|0)-(c[u>>2]|0)+1|0)>((c[u+12>>2]|0)-(c[u+8>>2]|0)+1<<1|0)){break}if(((c[p+4>>2]|0)-(c[p>>2]|0)+1|0)>((c[p+12>>2]|0)-(c[p+8>>2]|0)+1<<1|0)){p=u;break}if((k|0)>((c[u+4>>2]|0)-(c[u>>2]|0)+1|0)){k=(c[u+4>>2]|0)-(c[u>>2]|0)+1|0}if(((c[u+4>>2]|0)-(c[u>>2]|0)|0)<((c[p+4>>2]|0)-(c[p>>2]|0)<<2|0)){if((l|0)<((c[u+4>>2]|0)-(c[u>>2]|0)+1|0)){l=(c[u+4>>2]|0)-(c[u>>2]|0)+1|0}}if((m|0)<(l+1|0)){m=l+1|0}if((p|0)!=0){x=(c[u>>2]|0)-(c[p>>2]|0)|0;y=(c[u+4>>2]|0)-(c[p+4>>2]|0)|0;if((x|0)>(y|0)){z=y;A=x}else{z=x;A=y}do{if((z|0)>0){if((z|0)>=(l<<1|0)){break}if((A|0)>=(o<<1|0)){break}if((m|0)<(z-1|0)){m=z}}}while(0);if((z|0)>0){if((o|0)>(A+2|0)){o=A}}if((48&c[e+37072>>2]|0)==48){do{if((j|0)!=0){if((r|0)==0){break}B=c[n>>2]|0;C=r;D=c[p>>2]|0;E=(c[p+4>>2]|0)-(c[p>>2]|0)+1|0;F=c[u>>2]|0;G=(c[u+4>>2]|0)-(c[u>>2]|0)+1|0;H=z;I=A;J=m;K=o;L=l;au(B|0,15784,(s=i,i=i+80|0,c[s>>2]=C,c[s+8>>2]=D,c[s+16>>2]=E,c[s+24>>2]=F,c[s+32>>2]=G,c[s+40>>2]=H,c[s+48>>2]=I,c[s+56>>2]=J,c[s+64>>2]=K,c[s+72>>2]=L,s)|0)|0;i=s}}while(0)}}if((q|0)!=0){x=(c[u>>2]|0)-(c[q>>2]|0)|0;y=(c[u+4>>2]|0)-(c[q+4>>2]|0)|0;if((x|0)>(y|0)){z=y;A=x}else{z=x;A=y}do{if((z|0)>0){if((z|0)>=(l*3|0|0)){break}if((A|0)>=(o*3|0|0)){break}if((m<<1|0)<(z|0)){m=(z+1|0)/2|0}}}while(0);if((z|0)>0){if((o<<1|0)>(A|0)){o=(A+1|0)/2|0}}if((48&c[e+37072>>2]|0)==48){do{if((j|0)!=0){if((r|0)==0){break}L=c[n>>2]|0;K=r;J=c[q>>2]|0;I=(c[q+4>>2]|0)-(c[q>>2]|0)+1|0;H=c[u>>2]|0;G=(c[u+4>>2]|0)-(c[u>>2]|0)+1|0;F=z;E=A;D=m;C=o;B=l;au(L|0,15496,(s=i,i=i+80|0,c[s>>2]=K,c[s+8>>2]=J,c[s+16>>2]=I,c[s+24>>2]=H,c[s+32>>2]=G,c[s+40>>2]=F,c[s+48>>2]=E,c[s+56>>2]=D,c[s+64>>2]=C,c[s+72>>2]=B,s)|0)|0;i=s}}while(0)}}do{if((j|0)!=0){if((p|0)==0){break}x=(c[u>>2]|0)-(c[p>>2]|0)|0;y=(c[u+4>>2]|0)-(c[p+4>>2]|0)|0;if((x|0)>(y|0)){z=y;A=x}else{z=x;A=y}if(((c[u>>2]|0)-(c[p+4>>2]|0)|0)<=(m|0)){if(((c[u+4>>2]|0)-(c[p>>2]|0)|0)>(o<<1|0)){w=5770}else{w=5767}}else{w=5767}do{if((w|0)==5767){w=0;if(((c[u>>2]|0)-(c[p+4>>2]|0)|0)<=(o|0)){break}if(((c[u>>2]|0)-(c[p+4>>2]|0)|0)>(m<<1|0)){break}if(((c[u+4>>2]|0)-(c[p>>2]|0)|0)>(o*3|0|0)){w=5770}}}while(0);if((w|0)==5770){w=0;j=0;if((c[e+37072>>2]|0)!=0){B=c[n>>2]|0;C=r;D=m;E=o;F=c[p>>2]|0;G=c[p+4>>2]|0;H=c[u>>2]|0;I=c[u+4>>2]|0;au(B|0,15056,(s=i,i=i+56|0,c[s>>2]=C,c[s+8>>2]=D,c[s+16>>2]=E,c[s+24>>2]=F,c[s+32>>2]=G,c[s+40>>2]=H,c[s+48>>2]=I,s)|0)|0;i=s}}}}while(0);do{if((j|0)!=0){if((q|0)==0){break}if((o*6|0|0)>=(m*7|0|0)){break}x=(c[u>>2]|0)-(c[q>>2]|0)|0;y=(c[u+4>>2]|0)-(c[q+4>>2]|0)|0;if((x|0)>(y|0)){z=y;A=x}else{z=x;A=y}do{if(((c[u>>2]|0)-(c[q+4>>2]|0)|0)>(o|0)){if(((c[u>>2]|0)-(c[q+4>>2]|0)|0)>(m<<1|0)){w=5783;break}if(((c[u+4>>2]|0)-(c[q>>2]|0)|0)>(o*3|0|0)){w=5786}else{w=5783}}else{w=5783}}while(0);do{if((w|0)==5783){w=0;if(((c[u>>2]|0)-(c[q+4>>2]|0)|0)<=(o<<1|0)){break}if(((c[u>>2]|0)-(c[q+4>>2]|0)|0)>(m*3|0|0)){break}if(((c[u+4>>2]|0)-(c[q>>2]|0)|0)>(o<<2|0)){w=5786}}}while(0);if((w|0)==5786){w=0;j=0;if((c[e+37072>>2]|0)!=0){I=c[n>>2]|0;H=r;G=m;F=o;E=c[q>>2]|0;D=c[q+4>>2]|0;C=c[u>>2]|0;B=c[u+4>>2]|0;au(I|0,14592,(s=i,i=i+56|0,c[s>>2]=H,c[s+8>>2]=G,c[s+16>>2]=F,c[s+24>>2]=E,c[s+32>>2]=D,c[s+40>>2]=C,c[s+48>>2]=B,s)|0)|0;i=s}}}}while(0);do{if(0<(t|0)){if((t|0)>=140){break}if((t<<1|0)<(l*5|0|0)){if((a|0)<1024){c[d+(a<<2)>>2]=t;a=a+1|0}}}}while(0);q=p;p=u}}while(0);c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}if((c[e+37072>>2]|0)!=0){u=c[n>>2]|0;t=r;B=a;C=k;D=l;E=m;F=o;G=j;au(u|0,14208,(s=i,i=i+56|0,c[s>>2]=t,c[s+8>>2]=B,c[s+16>>2]=C,c[s+24>>2]=D,c[s+32>>2]=E,c[s+40>>2]=F,c[s+48>>2]=G,s)|0)|0;i=s}if((a|0)<8){do{if((c[e+37072>>2]|0)!=0){if((r|0)!=0){break}G=c[n>>2]|0;au(G|0,13912,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}}while(0)}if((c[e+37072>>2]&48|0)==48){G=c[n>>2]|0;au(G|0,13280,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s;G=0;while(1){if((G|0)>=(a|0)){break}au(c[n>>2]|0,12600,(s=i,i=i+8|0,c[s>>2]=c[d+(G<<2)>>2],s)|0)|0;i=s;G=G+1|0}au(c[n>>2]|0,12064,(s=i,i=i+8|0,c[s>>2]=r,s)|0)|0;i=s}if((a|0)>0){aI(d|0,a|0,4,4);G=(a<<2|0)/5|0;do{if((m|0)>(o+((m|0)/32|0)+1|0)){w=5816}else{if((o|0)>=(m<<1|0)){w=5816;break}if((o|0)<(m*3|0|0)){M=(o+(m*3|0)|0)/4|0}else{M=m}h=M}}while(0);if((w|0)==5816){w=0;j=0}F=1024;E=1024;D=0;if((a|0)<8){N=0}else{N=((a|0)/2|0)+1|0}C=N;L7976:while(1){if((C|0)>=(a|0)){break}L7979:do{if((c[d+(C<<2)>>2]|0)>((k|0)/3|0|0)){if((c[d+(C<<2)>>2]|0)>(l<<1|0)){w=5829;break L7976}do{if((a|0)<16){if((c[d+(C<<2)>>2]|0)<=((l|0)/3|0|0)){break L7979}else{break}}}while(0);B=(c[d+(C<<2)>>2]|0)-(c[d+(C-1<<2)>>2]|0)|0;if((B|0)>(D|0)){D=B;G=C-1|0;if((c[e+37072>>2]&48|0)==48){t=c[n>>2]|0;u=r;H=c[d+(G<<2)>>2]|0;I=D;au(t|0,11416,(s=i,i=i+24|0,c[s>>2]=u,c[s+8>>2]=H,c[s+16>>2]=I,s)|0)|0;i=s}if((D|0)>3){if(((c[d+(C<<2)>>2]|0)*3|0|0)>=(c[d+(C-1<<2)>>2]<<2|0)){w=5839;break L7976}}do{if((D|0)>1){if((C*3|0|0)<=(a<<1|0)){break}if(((c[d+(C<<2)>>2]|0)*3|0|0)>=(c[d+(C-1<<2)>>2]<<2|0)){w=5843;break L7976}}}while(0)}if((B|0)!=0){if((E|0)<(F|0)){F=E;do{if((D|0)<=1){if((a|0)<=16){break}G=C-1|0}}while(0);if((c[e+37072>>2]&48|0)==48){B=c[n>>2]|0;I=r;H=c[d+(G<<2)>>2]|0;u=F;au(B|0,11048,(s=i,i=i+24|0,c[s>>2]=I,c[s+8>>2]=H,c[s+16>>2]=u,s)|0)|0;i=s}}E=1}else{E=E+1|0}}}while(0);C=C+1|0}if((w|0)==5829){w=0}else if((w|0)==5843){w=0}else if((w|0)==5839){w=0}do{if((a|0)<16){if((D|0)>1){break}if((F|0)<=1){break}G=a-1|0}}while(0);if((c[e+37072>>2]&48|0)==48){C=0;while(1){if((C|0)>=(a|0)){break}au(c[n>>2]|0,12600,(s=i,i=i+8|0,c[s>>2]=c[d+(C<<2)>>2],s)|0)|0;i=s;C=C+1|0}au(c[n>>2]|0,10904,(s=i,i=i+8|0,c[s>>2]=r,s)|0)|0;i=s;au(c[n>>2]|0,10648,(s=i,i=i+24|0,c[s>>2]=r,c[s+8>>2]=D,c[s+16>>2]=F,s)|0)|0;i=s}if((G|0)<(a-1|0)){g=(((c[d+(G<<2)>>2]|0)+(c[d+(G+1<<2)>>2]|0)|0)/2|0)+1|0}else{g=(c[d+(G<<2)>>2]|0)+1|0}if((a|0)!=0){if((c[d+(a-1<<2)>>2]<<1|0)<=((c[d>>2]|0)*3|0|0)){w=5873}else{if((c[d+(a-1<<2)>>2]|0)<=((c[d>>2]|0)+3|0)){w=5873}}if((w|0)==5873){w=0;g=(c[d+(a-1<<2)>>2]|0)+10|0}}do{if((r|0)>0){if((c[e+37056>>2]|0)!=0){break}if((j|0)!=0){O=h}else{O=g}c[e+28840+(r<<2)>>2]=O;c[e+32936+(r<<2)>>2]=j}}while(0);if((c[e+37072>>2]|0)!=0){F=c[n>>2]|0;au(F|0,13280,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s;F=c[n>>2]|0;D=r;C=a;E=m;u=o;H=h;au(F|0,10312,(s=i,i=i+40|0,c[s>>2]=D,c[s+8>>2]=C,c[s+16>>2]=E,c[s+24>>2]=u,c[s+32>>2]=H,s)|0)|0;i=s;H=c[n>>2]|0;u=r;E=a;C=c[d>>2]|0;D=c[d+(a-1<<2)>>2]|0;F=g;I=(G*100|0|0)/(a|0)|0;au(H|0,10064,(s=i,i=i+48|0,c[s>>2]=u,c[s+8>>2]=E,c[s+16>>2]=C,c[s+24>>2]=D,c[s+32>>2]=F,c[s+40>>2]=I,s)|0)|0;i=s;I=c[n>>2]|0;F=r;D=j;C=c[e+28840+(r<<2)>>2]|0;au(I|0,9912,(s=i,i=i+24|0,c[s>>2]=F,c[s+8>>2]=D,c[s+16>>2]=C,s)|0)|0;i=s}}if((r|0)==0){f=c[e+37056>>2]|0;if((f|0)==0){if((j|0)!=0){P=h}else{P=g}f=P}C=0;while(1){if((C|0)>=(c[e+156>>2]|0)){break}c[e+28840+(C<<2)>>2]=f;C=C+1|0}}r=r+1|0}if((c[e+37056>>2]|0)==0){c[e+37056>>2]=f}if((c[e+37072>>2]|0)==0){i=b;return}au(c[n>>2]|0,9776,(s=i,i=i+16|0,c[s>>2]=f,c[s+8>>2]=(j|0)!=0?9664:9496,s)|0)|0;i=s;i=b;return}function dO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0;a=i;b=0;d=0;e=0;f=0;g=c[7036]|0;h=0;if((c[g+37072>>2]|0)!=0){j=c[n>>2]|0;au(j|0,9392,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}h=ei(c[g+112>>2]|0,9200)|0;if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){l=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{l=0}if(!l){break}j=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;c[j+32>>2]=0;m=f;f=m+1|0;ek(m,h)|0;do{if(((c[j+4>>2]|0)-(c[j>>2]|0)|0)<2){o=5913}else{if(((c[j+12>>2]|0)-(c[j+8>>2]|0)|0)<2){o=5913;break}if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){p=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{p=0}if(!p){break}m=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[m+8>>2]|0)>(c[j+12>>2]|0)){o=5920;break}if((m|0)!=(j|0)){do{if((c[m>>2]|0)==(c[j>>2]|0)){if((c[m+4>>2]|0)!=(c[j+4>>2]|0)){break}if((c[m+8>>2]|0)!=(c[j+8>>2]|0)){break}if((c[m+12>>2]|0)!=(c[j+12>>2]|0)){break}e=e+1|0}}while(0);do{if((c[m>>2]|0)>=(c[j>>2]|0)){if((c[m+4>>2]|0)>(c[j+4>>2]|0)){break}if((c[m+8>>2]|0)<(c[j+8>>2]|0)){break}if((c[m+12>>2]|0)>(c[j+12>>2]|0)){break}if((c[m+32>>2]|0)!=0){break}q=j+32|0;c[q>>2]=(c[q>>2]|0)+1;b=b+1|0;if((aa((c[m+4>>2]|0)-(c[m>>2]|0)+1|0,(c[m+12>>2]|0)-(c[m+8>>2]|0)+1|0)|0)<17){d=d+1|0}}}while(0)}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}if((o|0)==5920){o=0}cz(g+84|0)}}}while(0);if((o|0)==5913){o=0}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}ej(h)|0;if((c[g+37072>>2]|0)==0){i=a;return 0}au(c[n>>2]|0,9096,(k=i,i=i+32|0,c[k>>2]=b,c[k+8>>2]=d,c[k+16>>2]=(e|0)/2|0,c[k+24>>2]=f,k)|0)|0;i=k;i=a;return 0}function dP(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=i;d=0;e=0;f=0;g=c[7036]|0;h=0;dO(a)|0;h=ei(c[g+112>>2]|0,9024)|0;if((c[g+37072>>2]|0)!=0){a=c[n>>2]|0;j=c[g+37048>>2]|0;au(a|0,8856,(k=i,i=i+8|0,c[k>>2]=j,k)|0)|0;i=k}j=0;if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){l=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{l=0}if(!l){break}a=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;m=c[a>>2]|0;o=c[a+4>>2]|0;p=c[a+8>>2]|0;q=c[a+12>>2]|0;r=d;d=r+1|0;ek(r,h)|0;do{if((c[a+36>>2]|0)==57345){s=5956}else{if((c[a+32>>2]|0)>7){s=5956;break}if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){t=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{t=0}if(!t){break}r=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((r|0)!=(a|0)){if((c[r+36>>2]|0)==57345){break}u=P(c[r+200>>2]|0)|0;if((u|0)>=((P(c[a+200>>2]|0)|0)/512|0|0)){do{if((c[r>>2]|0)==(m|0)){if((c[r+4>>2]|0)!=(o|0)){s=5969;break}if((c[r+8>>2]|0)!=(p|0)){s=5969;break}if((c[r+12>>2]|0)==(q|0)){s=5974}else{s=5969}}else{s=5969}}while(0);do{if((s|0)==5969){s=0;if((c[r>>2]|0)<(m|0)){break}if((c[r+4>>2]|0)>(o|0)){break}if((c[r+8>>2]|0)<(p|0)){break}if((c[r+12>>2]|0)>(q|0)){break}if((c[r+32>>2]|0)<2){s=5974}}}while(0);if((s|0)==5974){s=0;do{if((c[r>>2]|0)==(m|0)){if((c[r+4>>2]|0)!=(o|0)){s=5979;break}if((c[r+8>>2]|0)!=(p|0)){s=5979;break}if((c[r+12>>2]|0)!=(q|0)){s=5979;break}e=e+1|0}else{s=5979}}while(0);if((s|0)==5979){s=0;f=f+1|0}if((c[g+37072>>2]&7|0)==7){u=c[n>>2]|0;v=m;w=p;x=o-m+1|0;y=q-p+1|0;z=c[a+200>>2]|0;A=c[r>>2]|0;B=c[r+8>>2]|0;C=(c[r+4>>2]|0)-(c[r>>2]|0)+1|0;D=(c[r+12>>2]|0)-(c[r+8>>2]|0)+1|0;E=c[r+200>>2]|0;F=e;au(u|0,8752,(k=i,i=i+88|0,c[k>>2]=v,c[k+8>>2]=w,c[k+16>>2]=x,c[k+24>>2]=y,c[k+32>>2]=z,c[k+40>>2]=A,c[k+48>>2]=B,c[k+56>>2]=C,c[k+64>>2]=D,c[k+72>>2]=E,c[k+80>>2]=F,k)|0)|0;i=k}if(((c[r+4>>2]|0)-(c[r>>2]|0)+1|0)<(o-m+1<<3|0)){s=5984}else{if(((c[r+12>>2]|0)-(c[r+8>>2]|0)+1|0)<((q-p+1|0)*12|0|0)){s=5984}}if((s|0)==5984){s=0;F=a;E=r;bX(F,E)|0}m=c[a>>2]|0;o=c[a+4>>2]|0;p=c[a+8>>2]|0;q=c[a+12>>2]|0;E=g+37048|0;c[E>>2]=(c[E>>2]|0)-1;j=j+1|0;E=g+84|0;F=r;cw(E,F)|0;F=r;bV(F)|0}}}}while(0);c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}}}while(0);if((s|0)==5956){s=0}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}if((c[g+37072>>2]|0)==0){G=h;H=ej(G)|0;i=b;return 0}s=c[g+37048>>2]|0;au(c[n>>2]|0,8680,(k=i,i=i+24|0,c[k>>2]=f,c[k+8>>2]=e,c[k+16>>2]=s,k)|0)|0;i=k;G=h;H=ej(G)|0;i=b;return 0}function dQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=i;i=i+24|0;e=d|0;f=a;a=b;b=0;g=0;h=0;j=0;k=0;l=e;c[l>>2]=c[58];c[l+4>>2]=c[59];c[l+8>>2]=c[60];c[l+12>>2]=c[61];c[l+16>>2]=c[62];l=0;m=c[f+37052>>2]|0;dO(a)|0;l=ei(c[f+112>>2]|0,8200)|0;if((c[f+37072>>2]|0)!=0){o=c[n>>2]|0;p=c[f+37048>>2]|0;q=c[f+37032>>2]|0;au(o|0,8096,(r=i,i=i+16|0,c[r>>2]=p,c[r+8>>2]=q,r)|0)|0;i=r}q=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){s=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{s=0}if(!s){break}p=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;o=c[p>>2]|0;t=c[p+4>>2]|0;u=c[p+8>>2]|0;v=c[p+12>>2]|0;w=b;b=w+1|0;ek(w,l)|0;k=0;L8223:do{if((c[p+36>>2]|0)==57345){x=6008}else{if((c[p+32>>2]|0)>7){x=6008;break}do{if((c[p+64>>2]|0)>0){if((u|0)<=(c[p+64>>2]|0)){break}break L8223}}while(0);do{if((c[p+52>>2]|0)>0){if((u|0)>=((c[p+52>>2]|0)-((c[p+60>>2]|0)-(c[p+56>>2]|0))|0)){break}break L8223}}while(0);do{if((v-u<<1|0)<((c[p+64>>2]|0)-(c[p+52>>2]|0)|0)){if((v<<1|0)>((c[p+60>>2]|0)+(c[p+56>>2]|0)|0)){if((u<<1|0)<((c[p+60>>2]|0)+(c[p+56>>2]|0)|0)){break}}w=0;y=0;z=0;g=g+1|0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){A=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{A=0}if(!A){break}z=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;L8247:do{if((z|0)==(p|0)){x=6025}else{if((c[z+36>>2]|0)==57345){x=6025;break}do{if(((c[z+4>>2]|0)-(c[z>>2]|0)+1|0)<(t-o+1|0)){if(((c[z+12>>2]|0)-(c[z+8>>2]|0)+1|0)>=(v-u+1|0)){break}break L8247}}while(0);do{if((c[z+48>>2]|0)>=0){if((c[p+48>>2]|0)<0){break}if((c[z+48>>2]|0)!=(c[p+48>>2]|0)){break}if((w|0)==0){w=z}B=P((c[z>>2]|0)+(c[z+4>>2]|0)-(c[p>>2]<<1)|0)|0;if((B|0)<(P((c[w>>2]|0)+(c[w+4>>2]|0)-(c[p>>2]<<1)|0)|0)){y=w;w=z}}}while(0)}}while(0);if((x|0)==6025){x=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}z=w;if((z|0)!=0){do{if(((c[z+4>>2]|0)-(c[z>>2]|0)+1|0)>((c[f+37032>>2]|0)/2|0|0)){if(((c[p+4>>2]|0)-(c[p>>2]|0)+1|0)<=((c[f+37032>>2]|0)/2|0|0)){break}if((c[p>>2]|0)<=(c[z+4>>2]|0)){if((c[z>>2]|0)<=(c[p+4>>2]|0)){break}}break L8223}}while(0);do{if((v<<2|0)<=(((c[p+56>>2]|0)*3|0)+(c[p+60>>2]|0)|0)){if((c[z+12>>2]<<2|0)<(((c[p+56>>2]|0)*3|0)+(c[p+60>>2]|0)|0)){break}if((v<<1|0)>=((c[z+12>>2]|0)+(c[z+8>>2]|0)|0)){break}if(((c[z+4>>2]|0)+((c[f+37032>>2]|0)/2|0)|0)<(o|0)){break}if(((c[z>>2]|0)-((c[f+37032>>2]|0)/2|0)|0)>(t|0)){break}if((v|0)>=(c[z+8>>2]|0)){if((o|0)>=(c[z+4>>2]|0)){break}}if(((v-(c[z+8>>2]|0)|0)*3|0|0)>((c[z+12>>2]|0)-(c[z+8>>2]|0)<<1|0)){break}if((t-o+1<<3|0)<((c[z+4>>2]|0)-(c[z>>2]|0)+1|0)){break}if(((v-u+1|0)*10|0|0)<((c[z+12>>2]|0)-(c[z+8>>2]|0)+1|0)){break}k=1}}while(0);do{if((k|0)==0){if((c[z+4>>2]<<1|0)<(o+t|0)){break}if((c[z>>2]<<1|0)>(t<<1|0)){break}if((t-o|0)>((c[z+4>>2]|0)-(c[z>>2]|0)+2|0)){break}if((u<<1|0)<((c[p+56>>2]|0)+(c[p+60>>2]|0)|0)){break}if((v<<2|0)<((c[p+56>>2]|0)+((c[p+60>>2]|0)*3|0)|0)){break}if((v-u<<2|0)>=((c[p+64>>2]|0)-(c[p+52>>2]|0)|0)){break}if((c[z+12>>2]<<3|0)>=((c[z+56>>2]|0)+((c[z+60>>2]|0)*7|0)|0)){if(((c[z+64>>2]|0)-(c[z+52>>2]|0)|0)>=16){break}}k=2}}while(0);L8304:do{if((k|0)==0){if((c[z+4>>2]<<1|0)<(o+t|0)){break}if((c[z>>2]<<1|0)>(t<<1|0)){break}if((t-o|0)>((c[z+4>>2]|0)-(c[z>>2]|0)+4|0)){break}if((o<<2|0)>(((c[z+4>>2]|0)*3|0)+(c[z>>2]|0)|0)){break}do{if((c[p+56>>2]|0)!=0){if((c[z+56>>2]|0)==0){x=6078;break}if((v|0)>=(c[p+60>>2]|0)){x=6078;break}if((c[z+12>>2]<<1|0)<=((c[z+60>>2]|0)+(c[z+56>>2]|0)|0)){x=6078;break}if((c[z+8>>2]<<2|0)<(((c[z+56>>2]|0)*3|0)+(c[z+60>>2]|0)|0)){x=6078;break}if((c[p+8>>2]<<1|0)>=((c[p+60>>2]|0)+(c[p+56>>2]|0)|0)){x=6078}}else{x=6078}}while(0);do{if((x|0)==6078){x=0;if((c[p+56>>2]|0)==0){break}if((c[z+56>>2]|0)!=0){break L8304}}}while(0);k=3}}while(0);do{if((P((c[p+12>>2]|0)-(c[z+12>>2]|0)|0)|0)<=(((v-u|0)/8|0)+1|0)){if((P((c[p+8>>2]|0)-(c[z+8>>2]|0)|0)|0)>(((v-u|0)/8|0)+1|0)){break}if((P((c[z+4>>2]|0)-(c[z>>2]|0)-(t-o)|0)|0)>(((t-o|0)/8|0)+1|0)){break}if((t-o|0)>((c[f+37032>>2]|0)/2|0|0)){break}w=P((c[z>>2]|0)-t-1|0)|0;if((w|0)>((c[f+37032>>2]|0)/2|0|0)){w=P(o-(c[z+4>>2]|0)-1|0)|0;if((w|0)>((c[f+37032>>2]|0)/2|0|0)){break}}if((v<<2|0)>(((c[p+56>>2]|0)*3|0)+(c[p+60>>2]|0)|0)){if((u<<2|0)<((c[p+56>>2]<<1)+(c[p+60>>2]<<1)|0)){break}}k=4}}while(0);if((k|0)>0){if((c[f+37072>>2]&7|0)!=0){w=c[n>>2]|0;y=o;B=u;C=t-o+1|0;D=v-u+1|0;E=c[z>>2]|0;F=c[z+8>>2]|0;G=(c[z+4>>2]|0)-(c[z>>2]|0)+1|0;H=(c[z+12>>2]|0)-(c[z+8>>2]|0)+1|0;I=c[e+(k<<2)>>2]|0;au(w|0,7928,(r=i,i=i+72|0,c[r>>2]=y,c[r+8>>2]=B,c[r+16>>2]=C,c[r+24>>2]=D,c[r+32>>2]=E,c[r+40>>2]=F,c[r+48>>2]=G,c[r+56>>2]=H,c[r+64>>2]=I,r)|0)|0;i=r}I=p;H=z;bX(I,H)|0;o=c[p>>2]|0;t=c[p+4>>2]|0;u=c[p+8>>2]|0;v=c[p+12>>2]|0;q=q+1|0;h=h+1|0;H=f+84|0;I=z;cw(H,I)|0;I=z;bV(I)|0}}}}while(0);if((v<<1|0)<((c[p+60>>2]|0)+(c[p+56>>2]|0)|0)){if((v-u<<1|0)<((c[p+60>>2]|0)+(c[p+56>>2]|0)|0)){if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){J=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{J=0}if(!J){break}z=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((z|0)!=(p|0)){if((c[z+36>>2]|0)==57345){break}do{if((c[z+48>>2]|0)>=0){if((c[z+48>>2]|0)!=(c[p+48>>2]|0)){break}if((c[z+4>>2]|0)<(o-1|0)){break}if((c[z+4>>2]|0)>=(o|0)){break}if(((c[z>>2]|0)+((c[z+4>>2]|0)*3|0)|0)>=(o<<2|0)){break}if(((du(o,o,v,v,a,m,1)|0)<<24>>24|0)==1){if(((du(o-2|0,o-1|0,v,v+2|0,a,m,1)|0)<<24>>24|0)==1){if((c[f+37072>>2]&7|0)!=0){I=c[n>>2]|0;H=o;G=u;F=t-o+1|0;E=v-u+1|0;D=c[z>>2]|0;C=c[z+8>>2]|0;B=(c[z+4>>2]|0)-(c[z>>2]|0)+1|0;y=(c[z+12>>2]|0)-(c[z+8>>2]|0)+1|0;au(I|0,7800,(r=i,i=i+64|0,c[r>>2]=H,c[r+8>>2]=G,c[r+16>>2]=F,c[r+24>>2]=E,c[r+32>>2]=D,c[r+40>>2]=C,c[r+48>>2]=B,c[r+56>>2]=y,r)|0)|0;i=r}d9(a,o,v+1|0,-193,0);y=p;B=z;bX(y,B)|0;o=c[p>>2]|0;t=c[p+4>>2]|0;u=c[p+8>>2]|0;v=c[p+12>>2]|0;B=f+37048|0;c[B>>2]=(c[B>>2]|0)-1;q=q+1|0;j=j+1|0;B=f+84|0;y=z;cw(B,y)|0;y=z;bV(y)|0}}}}while(0)}}while(0);c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}}}if((P((c[p+56>>2]|0)-u|0)|0)<=((v-u|0)/8|0|0)){if((P((c[p+60>>2]|0)-v|0)|0)<=((v-u|0)/8|0|0)){if((dv(o,t,(u+v|0)/2|0,(u+v|0)/2|0,a,m)|0)==1){if((dv(o,t,(u+(v*3|0)|0)/4|0,(u+(v*3|0)|0)/4|0,a,m)|0)==1){if(((du(((o*3|0)+t|0)/4|0,((o*3|0)+t|0)/4|0,((u*3|0)+v|0)/4|0,v,a,m,1)|0)<<24>>24|0)==0){if(((du(o,((o*3|0)+t|0)/4|0,((u*3|0)+v|0)/4|0,(u+(v*3|0)|0)/4|0,a,m,1)|0)<<24>>24|0)==0){if(((du(o,o,u,((u*3|0)+v|0)/4|0,a,m,1)|0)<<24>>24|0)==1){if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){K=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{K=0}if(!K){break}z=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;L8400:do{if((z|0)!=(p|0)){if((c[z+36>>2]|0)==57345){x=6148;break}do{if((c[z+48>>2]|0)>=0){if((c[z+48>>2]|0)!=(c[p+48>>2]|0)){break}if((c[z+4>>2]|0)<=(o-3|0)){break}if(((c[z+4>>2]|0)-2|0)>=(o|0)){break}if((P((c[z+12>>2]|0)-(c[p+60>>2]|0)|0)|0)>=2){break}if((c[f+37072>>2]&7|0)!=0){y=c[n>>2]|0;B=o;C=u;D=t-o+1|0;E=v-u+1|0;F=c[z>>2]|0;G=c[z+8>>2]|0;H=(c[z+4>>2]|0)-(c[z>>2]|0)+1|0;I=(c[z+12>>2]|0)-(c[z+8>>2]|0)+1|0;au(y|0,7696,(r=i,i=i+64|0,c[r>>2]=B,c[r+8>>2]=C,c[r+16>>2]=D,c[r+24>>2]=E,c[r+32>>2]=F,c[r+40>>2]=G,c[r+48>>2]=H,c[r+56>>2]=I,r)|0)|0;i=r}I=dC(a,o,u,v-u|0,m,0,2)|0;if((I<<1|0)>(v-u|0)){break L8400}else{d9(a,o-1|0,u+I|0,-193,0);d9(a,o-1|0,u+I+1|0,-193,0);I=p;H=z;bX(I,H)|0;o=c[p>>2]|0;t=c[p+4>>2]|0;u=c[p+8>>2]|0;v=c[p+12>>2]|0;H=f+37048|0;c[H>>2]=(c[H>>2]|0)-1;q=q+1|0;j=j+1|0;H=f+84|0;I=z;cw(H,I)|0;I=z;bV(I)|0;break}}}while(0);x=6148}else{x=6148}}while(0);if((x|0)==6148){x=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}}}}}}}}}}while(0);if((x|0)==6008){x=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((c[f+37072>>2]|0)==0){L=l;M=ej(L)|0;i=d;return 0}x=c[f+37048>>2]|0;au(c[n>>2]|0,7600,(r=i,i=i+32|0,c[r>>2]=h,c[r+8>>2]=g,c[r+16>>2]=j,c[r+24>>2]=x,r)|0)|0;i=r;L=l;M=ej(L)|0;i=d;return 0}function dR(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;b=i;i=i+16|0;d=b|0;e=d;f=a;c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];f=c[7036]|0;e=c[f+37052>>2]|0;if((c[f+37072>>2]|0)!=0){a=c[n>>2]|0;au(a|0,7544,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}a=c[f+112>>2]|0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){h=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{h=0}if(!h){break}j=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;k=j;l=j;j=1e3;m=(c[k+4>>2]|0)-(c[k>>2]|0)+1|0;if((c[f+37072>>2]|0)!=0){o=c[n>>2]|0;p=a;au(o|0,7368,(g=i,i=i+8|0,c[g>>2]=p,g)|0)|0;i=g}if((m|0)>3){m=cA(f+84|0,k)|0;while(1){if((m|0)==0){break}if((c[k+44>>2]|0)!=(c[m+44>>2]|0)){p=dJ(d,k,d,m,e)|0;if((p|0)<(j|0)){j=p;l=m}if((p|0)<5){a=a-1|0;p=c[m+44>>2]|0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){q=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{q=0}if(!q){break}o=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;if((o|0)!=(k|0)){if((c[o+44>>2]|0)==(p|0)){c[o+44>>2]=c[k+44>>2]}}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}}}m=cA(f+84|0,m)|0}}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}q=0;if((c[f+37072>>2]|0)!=0){h=c[n>>2]|0;m=a;au(h|0,7280,(g=i,i=i+8|0,c[g>>2]=m,g)|0)|0;i=g}if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){r=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{r=0}if(!r){break}k=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;m=c[(c[f+84>>2]|0)+8>>2]|0;while(1){if((m|0)!=(k|0)){s=(m|0)!=0}else{s=0}if(!s){break}if((c[m+44>>2]|0)==(c[k+44>>2]|0)){t=6214;break}m=cA(f+84|0,m)|0}if((t|0)==6214){t=0}do{if((m|0)!=(k|0)){if((m|0)==0){t=6220;break}}else{t=6220}}while(0);if((t|0)==6220){t=0;a=a+1|0;h=0;l=k;m=k;j=0;while(1){if((m|0)==0){break}if((c[m+44>>2]|0)==(c[k+44>>2]|0)){j=j+1|0;p=dJ(d,k,d,m,e)|0;if((p|0)>(h|0)){h=p;l=m}}m=cA(f+84|0,m)|0}if((c[f+37072>>2]&8|0)!=0){dl(k,l);m=c[n>>2]|0;p=a;o=c[k+44>>2]|0;u=j;v=h;au(m|0,7e3,(g=i,i=i+32|0,c[g>>2]=p,c[g+8>>2]=o,c[g+16>>2]=u,c[g+24>>2]=v,g)|0)|0;i=g}q=q+j|0;if((c[f+37072>>2]&8|0)!=0){v=c[n>>2]|0;u=a;o=c[k+44>>2]|0;p=j;m=q;au(v|0,6944,(g=i,i=i+32|0,c[g>>2]=u,c[g+8>>2]=o,c[g+16>>2]=p,c[g+24>>2]=m,g)|0)|0;i=g}}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((c[f+37072>>2]|0)==0){i=b;return 0}au(c[n>>2]|0,6888,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;i=b;return 0}function dS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;e=a;a=b;b=c[7036]|0;f=c[b+37052>>2]|0;if((c[b+37072>>2]|0)!=0){g=c[n>>2]|0;au(g|0,6720,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}g=0;j=0;k=0;if((cy(b+84|0)|0)==0){while(1){if((c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=0){l=(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=(b+96|0)}else{l=0}if(!l){break}m=c[(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[m+36>>2]|0)==57344){k=k+1|0}if((c[m+36>>2]|0)==57345){j=j+1|0}g=g+1|0;c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]=c[c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]>>2]}cz(b+84|0)}if((c[b+37072>>2]|0)!=0){l=c[n>>2]|0;o=k;p=j;q=g;au(l|0,6664,(h=i,i=i+24|0,c[h>>2]=o,c[h+8>>2]=p,c[h+16>>2]=q,h)|0)|0;i=h}if((g|0)==0){r=0;s=r;i=d;return s|0}j=0;k=0;q=ei(g,6624)|0;if((cy(b+84|0)|0)==0){while(1){if((c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=0){t=(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)!=(b+96|0)}else{t=0}if(!t){break}m=c[(c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]|0)+8>>2]|0;g=c[m>>2]|0;p=c[m+4>>2]|0;o=c[m+8>>2]|0;l=c[m+12>>2]|0;u=c[m+36>>2]|0;if((u|0)!=57345){if((a&256|0)==0){do{if((u|0)==57344){v=6269}else{if((c[m+72>>2]|0)==0){v=6269;break}if((c[m+116>>2]|0)<(c[b+37092>>2]|0)){v=6269}}}while(0);if((v|0)==6269){v=0;u=dK(m,f,0)|0}}if((a&2|0)!=0){do{if((u|0)==57344){v=6275}else{if((c[m+72>>2]|0)==0){v=6275;break}if((c[m+116>>2]|0)<(c[b+37092>>2]|0)){v=6275}}}while(0);if((v|0)==6275){v=0;u=b1(m,b)|0}}if((u|0)==57344){k=k+1|0}j=j+1|0;if((c[b+37072>>2]&8|0)!=0){w=c[n>>2]|0;x=u;if((u|0)<255){y=u}else{y=95}z=(y&255)<<24>>24;au(w|0,6576,(h=i,i=i+16|0,c[h>>2]=x,c[h+8>>2]=z,h)|0)|0;i=h;dj(m,e,g,o,p-g+1|0,l-o+1|0,f)}z=j;x=q;ek(z,x)|0}c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]=c[c[(c[b+108>>2]|0)+(c[b+116>>2]<<2)>>2]>>2]}cz(b+84|0)}ej(q)|0;if((c[b+37072>>2]|0)!=0){b=c[n>>2]|0;q=k;k=j;au(b|0,6488,(h=i,i=i+16|0,c[h>>2]=q,c[h+8>>2]=k,h)|0)|0;i=h}r=0;s=r;i=d;return s|0}function dT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;d=i;e=a;a=c[7036]|0;f=c[a+37052>>2]|0;g=0;h=0;j=0;if((c[a+37072>>2]|0)!=0){k=c[n>>2]|0;au(k|0,6256,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l}if((b&8|0)==0){b=0;h=0;if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){m=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{m=0}if(!m){break}b=b+1|0;c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}g=ei(b,6168)|0;if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){o=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{o=0}if(!o){break}b=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;h=h+1|0;do{if((c[b+36>>2]|0)==57344){p=6312}else{if((c[b+72>>2]|0)<=0){break}if((c[b+116>>2]|0)<97){p=6312}}}while(0);if((p|0)==6312){p=0;do{if(((c[b+12>>2]|0)-(c[b+8>>2]|0)|0)>4){if(((c[b+4>>2]|0)-(c[b>>2]|0)|0)<=1){break}m=c[(c[a+84>>2]|0)+8>>2]|0;k=1e3;q=57344;if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){r=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{r=0}if(!r){break}s=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[s+72>>2]|0)>0){t=c[s+116>>2]|0}else{t=100}u=t;L8659:do{if((s|0)==(b|0)){p=6325}else{if((c[s+36>>2]|0)==57344){p=6325;break}if((u|0)<(c[a+37092>>2]|0)){p=6325;break}do{if(((c[b+12>>2]|0)-(c[b+8>>2]|0)|0)>=5){if(((c[b+4>>2]|0)-(c[b>>2]|0)|0)<3){break}v=dJ(e,b,e,s,f)|0;if((v|0)<(k|0)){k=v;q=c[s+36>>2]|0;m=s}break L8659}}while(0)}}while(0);if((p|0)==6325){p=0}c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}if((k|0)<10){if((c[m+72>>2]|0)>0){w=c[m+116>>2]|0}else{w=97}w=w-k|0;if((w|0)<1){w=1}s=b;u=q;v=w;dy(s,u,v)|0;j=j+1|0}do{if((k|0)<50){if((c[a+37072>>2]&7|0)==0){break}v=c[n>>2]|0;u=c[b+48>>2]|0;s=c[b>>2]|0;x=c[b+8>>2]|0;y=q;if((q|0)<128){z=q}else{z=95}A=(z&255)<<24>>24;B=k;C=j;au(v|0,5976,(l=i,i=i+56|0,c[l>>2]=u,c[l+8>>2]=s,c[l+16>>2]=x,c[l+24>>2]=y,c[l+32>>2]=A,c[l+40>>2]=B,c[l+48>>2]=C,l)|0)|0;i=l;if((c[m+72>>2]|0)>0){C=c[n>>2]|0;B=c[m+116>>2]|0;au(C|0,5944,(l=i,i=i+8|0,c[l>>2]=B,l)|0)|0;i=l}do{if((c[a+37072>>2]&4|0)!=0){if((k|0)>=10){break}dl(b,m)}}while(0)}}while(0);m=h;k=g;ek(m,k)|0}}while(0)}c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}z=g;ej(z)|0}if((c[a+37072>>2]|0)==0){i=d;return 0}au(c[n>>2]|0,5888,(l=i,i=i+16|0,c[l>>2]=j,c[l+8>>2]=h,l)|0)|0;i=l;i=d;return 0}function dU(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0;e=i;i=i+2872|0;f=e|0;g=e+1320|0;h=e+2640|0;j=e+2672|0;k=e+2704|0;l=e+2768|0;m=e+2808|0;o=b;b=d;d=c[7036]|0;p=c[d+37052>>2]|0;q=100;r=k;eB(r|0,152,64)|0;if((c[d+37072>>2]|0)!=0){r=c[n>>2]|0;au(r|0,5744,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}if((b&16|0)==0){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){t=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{t=0}if(!t){break}b=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L8724:do{if((c[b+196>>2]|0)!=0){if((c[b+264+((c[b+196>>2]|0)-1<<2)>>2]|0)<9){u=6373;break}do{if((c[b+36>>2]|0)==57344){u=6377}else{if((c[b+72>>2]|0)==0){break}if((c[b+116>>2]|0)<(c[d+37092>>2]|0)){u=6377}}}while(0);do{if((u|0)==6377){u=0;if(((c[b+4>>2]|0)-(c[b>>2]|0)|0)<=5){break}if(((c[b+12>>2]|0)-(c[b+8>>2]|0)|0)<=4){break}r=c[b>>2]|0;v=c[b+4>>2]|0;w=c[b+8>>2]|0;x=c[b+12>>2]|0;q=100;y=0;z=dv(r,v,(x+w|0)/2|0,(x+w|0)/2|0,o,p)|0;A=dv(r,v,((x*3|0)+w|0)/4|0,((x*3|0)+w|0)/4|0,o,p)|0;if((A|0)<(z|0)){z=A}do{if((c[b+56>>2]|0)!=0){if((c[b+60>>2]|0)<=((c[b+56>>2]|0)+2|0)){break}B=(c[b+56>>2]|0)+1|0;while(1){if((B|0)>((c[b+60>>2]|0)-1|0)){break}if((dC(o,r+1|0,B,v-r|0,p,1,3)|0)<=(v-r-2|0)){A=dv(r,v,B,B,o,p)|0;if((A|0)<(z|0)){z=A}}B=B+1|0}}}while(0);if((z|0)<2){break L8724}if((z|0)<4){q=(q*99|0|0)/100|0}if((z|0)<3){q=(q*99|0|0)/100|0}do{if((x<<1|0)<((c[b+60>>2]|0)+(c[b+64>>2]|0)|0)){if((dv(r,v,x-1|0,x-1|0,o,p)|0)!=1){break}if((dv((r+(v<<1)|0)/3|0,(r+(v*3|0)|0)/4|0,w,x,o,p)|0)>=3){break}if((dv(((r*3|0)+v|0)/4|0,((r<<1)+v|0)/3|0,w,x,o,p)|0)>=3){break}C=dC(o,r,x-((x-w|0)/32|0)|0,v-r|0,p,0,3)|0;if((C+(dC(o,v,x-((x-w|0)/32|0)|0,v-r|0,p,0,4)|0)|0)<=((v-r+1|0)/2|0|0)){break}break L8724}}while(0);if((dv(r,v,(x+w|0)/2|0,(x+w|0)/2|0,o,p)|0)<=1){break L8724}z=m;eC(z|0,0,64)|0;if((c[d+37072>>2]&2|0)!=0){z=c[n>>2]|0;C=r;D=w;E=v-r+1|0;F=x-w+1|0;au(z|0,5672,(s=i,i=i+32|0,c[s>>2]=C,c[s+8>>2]=D,c[s+16>>2]=E,c[s+24>>2]=F,s)|0)|0;i=s;if((c[d+37072>>2]&4|0)!=0){dk(b)}}B=0;c[l>>2]=r;c[l+4>>2]=r+3;c[l+8>>2]=v;L8777:while(1){L8779:do{if((c[l+(B+1<<2)>>2]|0)>(v-3|0)){if((B|0)==0){u=6413;break L8777}B=B-1|0;c[l+(B+2<<2)>>2]=v}else{F=x;E=w;D=0;C=w;z=w;G=x;H=x;I=0;A=0;while(1){if((A|0)>=(c[b+264>>2]|0)){break}J=A-1|0;K=(A+1|0)%(c[b+264>>2]|0)|0;if((J|0)<0){J=(c[b+264>>2]|0)-1|0}do{if((c[b+296+(A<<3)>>2]|0)>(c[l+(B<<2)>>2]|0)){if((c[b+296+(A<<3)>>2]|0)>(c[l+(B+2<<2)>>2]|0)){break}if((P((c[b+296+(A<<3)>>2]|0)-(c[l+(B+1<<2)>>2]|0)|0)|0)<2){I=(c[b+296+(A<<3)+4>>2]<<1)-(c[b+296+(K<<3)+4>>2]|0)-(c[b+296+(J<<3)+4>>2]|0)|0;L=(c[b+296+(K<<3)>>2]|0)-(c[b+296+(J<<3)>>2]|0)|0;if((L|0)>0){M=I}else{M=-I|0}if((M|0)<((-(P(L|0)|0)|0)/2|0|0)){D=1}}if((c[b+296+(J<<3)>>2]|0)<=(c[l+(B+1<<2)>>2]|0)){if((c[b+296+(K<<3)>>2]|0)>=(c[l+(B+1<<2)>>2]|0)){u=6434}else{u=6432}}else{u=6432}do{if((u|0)==6432){u=0;if((c[b+296+(J<<3)>>2]|0)<(c[l+(B+1<<2)>>2]|0)){break}if((c[b+296+(K<<3)>>2]|0)<=(c[l+(B+1<<2)>>2]|0)){u=6434}}}while(0);if((u|0)==6434){u=0;if((c[b+296+(A<<3)+4>>2]|0)>(E|0)){E=c[b+296+(A<<3)+4>>2]|0}if((c[b+296+(A<<3)+4>>2]|0)<(F|0)){F=c[b+296+(A<<3)+4>>2]|0}}do{if((c[b+296+(A<<3)+4>>2]|0)>(C|0)){if((c[b+296+(A<<3)>>2]|0)>(c[l+(B+1<<2)>>2]|0)){break}C=c[b+296+(A<<3)+4>>2]|0}}while(0);do{if((c[b+296+(A<<3)+4>>2]|0)>(z|0)){if((c[b+296+(A<<3)>>2]|0)<=(c[l+(B+1<<2)>>2]|0)){break}z=c[b+296+(A<<3)+4>>2]|0}}while(0);do{if((c[b+296+(A<<3)+4>>2]|0)<(G|0)){if((c[b+296+(A<<3)>>2]|0)>(c[l+(B+1<<2)>>2]|0)){break}G=c[b+296+(A<<3)+4>>2]|0}}while(0);do{if((c[b+296+(A<<3)+4>>2]|0)<(H|0)){if((c[b+296+(A<<3)>>2]|0)<=(c[l+(B+1<<2)>>2]|0)){break}H=c[b+296+(A<<3)+4>>2]|0}}while(0)}}while(0);A=A+1|0}if((c[d+37072>>2]&2|0)!=0){K=c[n>>2]|0;J=B;L=(c[l+(B<<2)>>2]|0)-r|0;N=(c[l+(B+1<<2)>>2]|0)-r|0;O=(c[l+(B+2<<2)>>2]|0)-r|0;Q=D;R=E-F|0;S=C-G|0;T=z-H|0;au(K|0,5576,(s=i,i=i+64|0,c[s>>2]=J,c[s+8>>2]=L,c[s+16>>2]=N,c[s+24>>2]=O,c[s+32>>2]=Q,c[s+40>>2]=R,c[s+48>>2]=S,c[s+56>>2]=T,s)|0)|0;i=s}if((D|0)==0){break}if((C-G+1<<1|0)<(x-w+1|0)){break}if((z-H+1<<1|0)<(x-w+1|0)){break}if((c[d+37072>>2]&2|0)!=0){T=c[n>>2]|0;S=B;R=(c[l+(B<<2)>>2]|0)-r|0;Q=(c[l+(B+1<<2)>>2]|0)-r|0;O=I;au(T|0,5488,(s=i,i=i+32|0,c[s>>2]=S,c[s+8>>2]=R,c[s+16>>2]=Q,c[s+24>>2]=O,s)|0)|0;i=s}O=f;Q=b;eB(O|0,Q|0,1320)|0;c[f+16>>2]=c[l+(B<<2)>>2];c[f+20>>2]=w;c[f>>2]=c[l+(B<<2)>>2];c[f+4>>2]=c[l+(B+1<<2)>>2];bY(f)|0;c[f+72>>2]=0;c[j+(B<<2)>>2]=dK(f,p,0)|0;c[h+(B<<2)>>2]=dz(f,c[j+(B<<2)>>2]|0)|0;if((c[d+37072>>2]&2|0)!=0){Q=c[n>>2]|0;O=c[h+(B<<2)>>2]|0;R=c[d+37092>>2]|0;S=y;au(Q|0,5424,(s=i,i=i+24|0,c[s>>2]=O,c[s+8>>2]=R,c[s+16>>2]=S,s)|0)|0;i=s}do{if((c[h+(B<<2)>>2]|0)>=(c[d+37092>>2]|0)){if((c[h+(B<<2)>>2]|0)<(y-1|0)){break}if((et(k|0,c[j+(B<<2)>>2]|0)|0)!=0){break}S=q;A=0;while(1){if((A|0)>(B|0)){break}S=(aa(c[h+(A<<2)>>2]|0,S)|0)/100|0;A=A+1|0}do{if((S|0)>=(((c[d+37092>>2]|0)*98|0|0)/100|0|0)){if((S|0)<(y|0)){break}B=B+1|0;if((B|0)==8){u=6477;break L8777}if((B|0)==4){u=6479;break L8777}if((B+1|0)<8){c[l+(B+1<<2)>>2]=v}if((B+2|0)<8){c[l+(B+2<<2)>>2]=v}if((c[d+37072>>2]&2|0)!=0){R=c[n>>2]|0;O=B;Q=(c[l+(B<<2)>>2]|0)-r|0;T=B+1|0;N=(c[l+(B+1<<2)>>2]|0)-r|0;au(R|0,5224,(s=i,i=i+32|0,c[s>>2]=O,c[s+8>>2]=Q,c[s+16>>2]=T,c[s+24>>2]=N,s)|0)|0;i=s}N=g;T=b;eB(N|0,T|0,1320)|0;c[g+16>>2]=(c[l+(B<<2)>>2]|0)+1;c[g+20>>2]=w;c[g>>2]=(c[l+(B<<2)>>2]|0)+1;c[g+4>>2]=c[l+(B+1<<2)>>2];bY(g)|0;c[g+72>>2]=0;c[j+(B<<2)>>2]=dK(g,p,0)|0;c[h+(B<<2)>>2]=dz(g,c[j+(B<<2)>>2]|0)|0;do{if((c[h+(B<<2)>>2]|0)>=(c[d+37092>>2]|0)){if((c[h+(B<<2)>>2]|0)<(y-1|0)){break}if((et(k|0,c[j+(B<<2)>>2]|0)|0)!=0){break}if((c[d+37072>>2]&2|0)!=0){T=c[n>>2]|0;au(T|0,5144,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s;A=0;while(1){if((A|0)>(B|0)){break}T=c[n>>2]|0;N=(c[l+(A+1<<2)>>2]|0)-r|0;Q=es(c[j+(A<<2)>>2]|0,6)|0;O=c[h+(A<<2)>>2]|0;au(T|0,4992,(s=i,i=i+24|0,c[s>>2]=N,c[s+8>>2]=Q,c[s+16>>2]=O,s)|0)|0;i=s;A=A+1|0}au(c[n>>2]|0,4968,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}a[m|0]=0;S=q;A=0;while(1){if((A|0)>(B|0)){break}S=(aa(c[h+(A<<2)>>2]|0,S)|0)/100|0;do{if((B|0)>0){if((c[j+(A<<2)>>2]|0)!=110){break}if((c[j+(A-1<<2)>>2]|0)!=114){break}S=S-1|0}}while(0);at(m|0,es(c[j+(A<<2)>>2]|0,c[d+37076>>2]|0)|0,20)|0;A=A+1|0}if((S|0)>(y|0)){y=S}if(((S*99|0|0)/100|0|0)>(c[d+37092>>2]|0)){S=(S*99|0|0)/100|0}if((c[d+37072>>2]&2|0)!=0){O=c[n>>2]|0;Q=m|0;N=S;au(O|0,4904,(s=i,i=i+16|0,c[s>>2]=Q,c[s+8>>2]=N,s)|0)|0;i=s}dx(b,m|0,S)|0;a[m|0]=0;B=B-1|0;c[l+(B+2<<2)>>2]=v;break L8779}}while(0);c[l+(B+1<<2)>>2]=(c[l+(B<<2)>>2]|0)+2;break L8779}}while(0);break L8779}}while(0)}}while(0);I=l+(B+1<<2)|0;c[I>>2]=(c[I>>2]|0)+1}if((u|0)==6477){u=0}else if((u|0)==6479){u=0}else if((u|0)==6413){u=0}}}while(0)}else{u=6373}}while(0);if((u|0)==6373){u=0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)==0){i=e;return 0}au(c[n>>2]|0,4776,(s=i,i=i+8|0,c[s>>2]=c[d+37048>>2],s)|0)|0;i=s;i=e;return 0}function dV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;b=i;a=c[7036]|0;if((c[a+37072>>2]|0)!=0){d=c[n>>2]|0;au(d|0,4728,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){f=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{f=0}if(!f){break}d=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;L8941:do{if((c[d+36>>2]|0)==57344){g=c[d+8>>2]|0;h=c[d+12>>2]|0;j=h-g+1|0;k=(c[a+37032>>2]|0)+(c[d+4>>2]|0)-(c[d>>2]|0)+1<<2;do{if((j|0)>(c[a+37036>>2]<<1|0)){if((j|0)>=((c[a+37036>>2]|0)*6|0|0)){break}if((c[d+52>>2]|0)==0){break}if((g|0)>((c[d+56>>2]|0)+2|0)){break}if((g|0)<((c[d+52>>2]|0)-2|0)){break}if((h|0)<((c[d+64>>2]|0)+(c[a+37036>>2]|0)-2|0)){break}l=d;m=0;if((cy(a+84|0)|0)==0){L8953:while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){o=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{o=0}if(!o){break}l=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;L8959:do{if((c[l+36>>2]|0)==57344){do{if((c[l+4>>2]|0)>=((c[d>>2]|0)-k|0)){if((c[l>>2]|0)>((c[d+4>>2]|0)+k|0)){break}if((c[l+48>>2]|0)==(c[d+48>>2]|0)){m=m|1}if((c[l+48>>2]|0)==((c[d+48>>2]|0)+1|0)){m=m|2}if((m|0)==3){p=6552;break L8953}break L8959}}while(0)}}while(0);c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}if((p|0)==6552){p=0}cz(a+84|0)}if((m|0)!=3){break L8941}q=c[d+64>>2]|0;if((c[a+37072>>2]&2|0)!=0){r=c[n>>2]|0;s=q-g|0;au(r|0,4680,(e=i,i=i+8|0,c[e>>2]=s,e)|0)|0;i=e;if((c[a+37072>>2]&6|0)!=0){dk(d)}}s=bU(d)|0;c[s+12>>2]=q;c[d+8>>2]=q+1;q=d+48|0;c[q>>2]=(c[q>>2]|0)+1;if((c[l+48>>2]|0)==(c[d+48>>2]|0)){c[d+52>>2]=c[l+52>>2];c[d+56>>2]=c[l+56>>2];c[d+60>>2]=c[l+60>>2];c[d+64>>2]=c[l+64>>2]}c[s+44>>2]=c[a+37048>>2];if((ct(a+84|0,d,s)|0)!=0){s=c[n>>2]|0;au(s|0,4640,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0)|0;i=e}s=a+37048|0;c[s>>2]=(c[s>>2]|0)+1}}while(0)}}while(0);c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}if((c[a+37072>>2]|0)==0){i=b;return 0}au(c[n>>2]|0,4776,(e=i,i=i+8|0,c[e>>2]=c[a+37048>>2],e)|0)|0;i=e;i=b;return 0}function dW(a){a=a|0;var b=0,c=0;b=a;if((b|0)<128){c=bg(b|0)|0}else{c=0}return c|0}function dX(a){a=a|0;var b=0,c=0;b=a;if((b|0)<128){c=be(b|0)|0}else{c=0}return c|0}function dY(a){a=a|0;var b=0,c=0;b=a;if((b|0)<128){c=aX(b|0)|0}else{c=0}return c|0}function dZ(a){a=a|0;var b=0,c=0;b=a;if((b|0)<128){c=as(b|0)|0}else{c=0}return c|0}function d_(a){a=a|0;var b=0,c=0;b=a;if((b|0)<128){c=aS(b|0)|0}else{c=0}return c|0}function d$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;e=a;a=b;b=0;if((c[e+72>>2]|0)!=0){f=c[e+116>>2]|0}else{f=0}g=f;f=dz(e,a)|0;if((c[(c[7036]|0)+37072>>2]|0)!=0){if((c[e+72>>2]|0)<2){h=c[n>>2]|0;j=c[e+72>>2]|0;k=es(c[e+36>>2]|0,6)|0;l=g;g=es(a,6)|0;m=(f+101|0)/2|0;o=c[e>>2]|0;p=c[e+8>>2]|0;au(h|0,4568,(q=i,i=i+56|0,c[q>>2]=j,c[q+8>>2]=k,c[q+16>>2]=l,c[q+24>>2]=g,c[q+32>>2]=m,c[q+40>>2]=o,c[q+48>>2]=p,q)|0)|0;i=q}else{p=c[n>>2]|0;o=c[e+72>>2]|0;m=es(c[e+36>>2]|0,6)|0;g=es(c[e+80>>2]|0,6)|0;l=c[e+116>>2]|0;k=c[e+120>>2]|0;j=es(a,6)|0;h=(f+101|0)/2|0;r=c[e>>2]|0;s=c[e+8>>2]|0;au(p|0,4392,(q=i,i=i+72|0,c[q>>2]=o,c[q+8>>2]=m,c[q+16>>2]=g,c[q+24>>2]=l,c[q+32>>2]=k,c[q+40>>2]=j,c[q+48>>2]=h,c[q+56>>2]=r,c[q+64>>2]=s,q)|0)|0;i=q}}if((f|0)==0){t=b;i=d;return t|0}if((c[e+36>>2]|0)!=(a|0)){b=1;q=e;e=a;a=(f+101|0)/2|0;dy(q,e,a)|0}t=b;i=d;return t|0}function d0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=i;d=a;a=4256;e=4088;f=0;g=0;h=0;j=0;k=0;l=0;m=0;o=0;p=0;q=0;if((c[d+37072>>2]|0)!=0){r=c[n>>2]|0;au(r|0,4040,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){t=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{t=0}if(!t){break}q=p;p=o;o=m;r=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+4>>2]|0)==0){u=0}else{u=c[(c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+4>>2]|0)+8>>2]|0}m=u;if((c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]|0)==0){v=0}else{v=c[(c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]|0)+8>>2]|0}l=v;if((aC(3976,c[r+36>>2]|0)|0)!=0){f=f+1|0}else{do{if((aC(3904,c[r+36>>2]|0)|0)!=0){if((m|0)==0){w=6631;break}if((c[m+36>>2]|0)==(c[r+36>>2]|0)){w=6631;break}if((f-g|0)!=2){if((f-g|0)!=4){w=6631;break}}g=f}else{w=6631}}while(0);if((w|0)==6631){w=0;f=0;g=0}}do{if((c[r+36>>2]|0)==32){if((m|0)==0){break}if((c[m+36>>2]|0)!=32){break}f=0}}while(0);do{if((c[r+36>>2]|0)==58){if((p|0)==0){break}if((c[p+36>>2]|0)==58){break}f=0}}while(0);do{if((aC(3880,c[r+36>>2]|0)|0)!=0){if((f|0)<=5){break}h=h+(d$(r,48)|0)|0}}while(0);do{if((aC(3856,c[r+36>>2]|0)|0)!=0){if((f|0)<=5){break}h=h+(d$(r,49)|0)|0}}while(0);if((c[r+36>>2]|0)==8222){k=c[r+76>>2]|0;x=c[n>>2]|0;au(x|0,25232,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}do{if((c[r+36>>2]|0)==34){if((k|0)!=8222){break}k=0;c[r+76>>2]=8223;c[r+36>>2]=8223;if((c[d+37072>>2]|0)!=0){x=c[n>>2]|0;y=c[r+72>>2]|0;z=c[r+116>>2]|0;A=es(c[r+36>>2]|0,6)|0;B=c[r+116>>2]|0;C=c[r>>2]|0;D=c[r+8>>2]|0;au(x|0,25160,(s=i,i=i+56|0,c[s>>2]=y,c[s+8>>2]=25040,c[s+16>>2]=z,c[s+24>>2]=A,c[s+32>>2]=B,c[s+40>>2]=C,c[s+48>>2]=D,s)|0)|0;i=s}}}while(0);L9107:do{if((c[r+36>>2]|0)<=255){do{if((m|0)!=0){if((c[m+36>>2]|0)<=255){break}break L9107}}while(0);do{if((l|0)!=0){if((c[l+36>>2]|0)<=255){break}break L9107}}while(0);if((c[r+72>>2]|0)<2){break}do{if((c[r+116>>2]|0)==100){if((c[r+120>>2]|0)>=100){break}break L9107}}while(0);do{if((c[r+72>>2]|0)!=0){if((c[r+156>>2]|0)==0){break}break L9107}}while(0);do{if((aC(24992,c[r+36>>2]|0)|0)!=0){if((l|0)==0){break}if((m|0)==0){break}do{if((dY(c[l+36>>2]|0)|0)!=0){if((c[l+36>>2]|0)==105){w=6679;break}if((c[m+36>>2]|0)!=10){if((c[m+36>>2]|0)!=32){w=6679;break}if((c[o+36>>2]|0)!=46){w=6679;break}}h=h+(d$(r,73)|0)|0}else{w=6679}}while(0);if((w|0)==6679){w=0;do{if((c[r+36>>2]|0)!=49){if((aC(e|0,c[l+36>>2]|0)|0)==0){w=6682;break}if((aC(24912,c[m+36>>2]|0)|0)!=0){w=6692}else{w=6682}}else{w=6682}}while(0);L9144:do{if((w|0)==6682){w=0;L9146:do{if((m|0)!=0){do{if((o|0)!=0){if((dW(c[o+36>>2]|0)|0)!=0){break}if((aC(24888,c[o+36>>2]|0)|0)==0){break L9146}}}while(0);if((dW(c[m+36>>2]|0)|0)==0){break}if((c[r+264>>2]|0)!=4){break}if((c[r+296>>2]|0)!=(c[r>>2]|0)){break}if((c[r+304>>2]|0)!=(c[r>>2]|0)){break}if((c[r+312>>2]|0)!=(c[r+4>>2]|0)){break}if((c[r+320>>2]|0)==(c[r+4>>2]|0)){w=6692;break L9144}}}while(0);if((aC(a|0,c[l+36>>2]|0)|0)!=0){h=h+(d$(r,108)|0)|0}else{do{if((dW(c[l+36>>2]|0)|0)!=0){if((aC(24848,c[l+36>>2]|0)|0)!=0){w=6699;break}if((aC(24848,c[m+36>>2]|0)|0)!=0){w=6699;break}h=h+(d$(r,73)|0)|0}else{w=6699}}while(0);if((w|0)==6699){w=0;do{if((m|0)!=0){if((dX(c[m+36>>2]|0)|0)==0){w=6702;break}h=h+(d$(r,108)|0)|0}else{w=6702}}while(0);if((w|0)==6702){w=0;L9171:do{if((dZ(c[m+36>>2]|0)|0)!=0){w=6712}else{if((dZ(c[l+36>>2]|0)|0)!=0){w=6712;break}do{if((l|0)!=0){if((aC(24784,c[l+36>>2]|0)|0)==0){break}if((o|0)==0){break}if((c[o+36>>2]|0)!=(c[l+36>>2]|0)){break}if((m|0)==0){break}if((aC(24728,c[m+36>>2]|0)|0)!=0){w=6712;break L9171}}}while(0);if((c[l+36>>2]|0)!=79){break}if((dY(c[m+36>>2]|0)|0)==0){w=6712}}}while(0);if((w|0)==6712){w=0;h=h+(d$(r,49)|0)|0}}}}}}while(0);if((w|0)==6692){w=0;h=h+(d$(r,73)|0)|0}}}}while(0);do{if((aC(24640,c[r+36>>2]|0)|0)!=0){if((l|0)==0){w=6731;break}if((m|0)!=0){w=6731;break}do{if((dY(c[l+36>>2]|0)|0)!=0){if((c[l+36>>2]|0)==105){w=6726;break}if((aC(a|0,c[l+36>>2]|0)|0)!=0){w=6726;break}h=h+(d$(r,73)|0)|0}else{w=6726}}while(0);if((w|0)==6726){w=0;do{if((dW(c[l+36>>2]|0)|0)!=0){if((aC(24848,c[l+36>>2]|0)|0)!=0){break}h=h+(d$(r,73)|0)|0}}while(0)}}else{w=6731}}while(0);if((w|0)==6731){w=0;if((aC(3880,c[r+36>>2]|0)|0)!=0){if((m|0)!=0){if((d_(c[m+36>>2]|0)|0)!=0){w=6734}else{w=6738}}else{w=6734}do{if((w|0)==6734){w=0;if((l|0)==0){w=6738;break}if((dY(c[l+36>>2]|0)|0)==0){w=6738;break}if((dZ(c[l+36>>2]|0)|0)!=0){w=6738;break}h=h+(d$(r,79)|0)|0}}while(0);if((w|0)==6738){w=0;do{if((m|0)!=0){if((dZ(c[m+36>>2]|0)|0)!=0){w=6745;break}if((dW(c[m+36>>2]|0)|0)==0){w=6745;break}if((l|0)==0){w=6745;break}if((dZ(c[l+36>>2]|0)|0)!=0){w=6745;break}if((dW(c[l+36>>2]|0)|0)==0){w=6745;break}h=h+(d$(r,79)|0)|0}else{w=6745}}while(0);if((w|0)==6745){w=0;do{if((m|0)!=0){w=6748}else{if((l|0)==0){w=6748;break}if((dZ(c[l+36>>2]|0)|0)!=0){w=6761}else{w=6748}}}while(0);L9234:do{if((w|0)==6748){w=0;if((m|0)!=0){if((dZ(c[m+36>>2]|0)|0)!=0){w=6761;break}}do{if((m|0)!=0){if((o|0)==0){break}if((d_(c[m+36>>2]|0)|0)!=0){w=6761;break L9234}}}while(0);if((m|0)!=0){if((aC(24608,c[m+36>>2]|0)|0)!=0){w=6761;break}}if((m|0)==0){break}if((aC(24576,c[m+36>>2]|0)|0)==0){break}if((o|0)==0){break}if((l|0)==0){break}if((c[o+36>>2]|0)!=(c[l+36>>2]|0)){break}if((aC(24488,c[o+36>>2]|0)|0)!=0){w=6761}}}while(0);L9251:do{if((w|0)==6761){w=0;if((l|0)!=0){if((dZ(c[l+36>>2]|0)|0)==0){w=6763}}else{w=6763}L9255:do{if((w|0)==6763){w=0;if((l|0)!=0){if((aC(24328,c[l+36>>2]|0)|0)!=0){break}}do{if((l|0)!=0){if((aC(24576,c[l+36>>2]|0)|0)==0){break}if((o|0)==0){break}if((dZ(c[o+36>>2]|0)|0)==0){break}if((m|0)==0){break}if((aC(24488,c[m+36>>2]|0)|0)!=0){break L9255}}}while(0);if((l|0)!=0){break L9251}}}while(0);do{if((o|0)!=0){if((o|0)!=0){if((aC(24608,c[o+36>>2]|0)|0)!=0){break}}if((o|0)!=0){if((dZ(c[o+36>>2]|0)|0)!=0){break}}if((o|0)==0){break L9251}if((d_(c[o+36>>2]|0)|0)==0){break L9251}}}while(0);if((m|0)!=0){if((dZ(c[m+36>>2]|0)|0)==0){w=6781}}else{w=6781}do{if((w|0)==6781){w=0;if((o|0)!=0){if((dZ(c[o+36>>2]|0)|0)!=0){break}}if((p|0)!=0){if((dZ(c[p+36>>2]|0)|0)!=0){break}}if((l|0)==0){break L9251}if((dZ(c[l+36>>2]|0)|0)==0){break L9251}}}while(0);h=h+(d$(r,48)|0)|0}}while(0)}}}else{do{if((aC(24256,c[r+36>>2]|0)|0)!=0){if((l|0)==0){break}if((m|0)==0){break}do{if((d_(c[m+36>>2]|0)|0)!=0){if((dY(c[l+36>>2]|0)|0)==0){w=6797;break}h=h+(d$(r,83)|0)|0}else{w=6797}}while(0);if((w|0)==6797){w=0;do{if((dY(c[m+36>>2]|0)|0)!=0){if((dY(c[l+36>>2]|0)|0)==0){w=6801;break}if((dW(c[l+36>>2]|0)|0)==0){w=6801;break}h=h+(d$(r,83)|0)|0}else{w=6801}}while(0);if((w|0)==6801){w=0;if((dZ(c[m+36>>2]|0)|0)!=0){w=6803}else{if((dZ(c[l+36>>2]|0)|0)!=0){w=6803}}if((w|0)==6803){w=0;h=h+(d$(r,53)|0)|0}}}}}while(0)}}do{if((dW(c[r+36>>2]|0)|0)!=0){if((l|0)==0){break}if((m|0)==0){break}do{if((dX(c[m+36>>2]|0)|0)!=0){if((dX(c[l+36>>2]|0)|0)==0){break}if(((c[r>>2]|0)-(c[m+4>>2]|0)<<1|0)<=(((c[l>>2]|0)-(c[r+4>>2]|0)|0)*3|0|0)){break}D=bU(0)|0;c[D>>2]=(c[m+4>>2]|0)+2;c[D+4>>2]=(c[r>>2]|0)-2;c[D+8>>2]=c[r+8>>2];c[D+12>>2]=c[r+12>>2];c[D+16>>2]=(c[r>>2]|0)-1;c[D+20>>2]=c[r+8>>2];c[D+24>>2]=0;c[D+28>>2]=0;c[D+32>>2]=0;c[D+36>>2]=32;c[D+40>>2]=0;C=D;dy(C,32,99)|0;c[D+44>>2]=-1;c[D+48>>2]=c[m+48>>2];c[D+64>>2]=0;c[D+60>>2]=0;c[D+56>>2]=0;c[D+52>>2]=0;c[D+68>>2]=d+4;C=d+84|0;B=r;A=D;ct(C,B,A)|0}}while(0)}}while(0);do{if((m|0)!=0){if((l|0)==0){break}do{if((c[m+36>>2]|0)==32){if((aC(24888,c[l+36>>2]|0)|0)==0){break}if((aC(24232,c[r+36>>2]|0)|0)==0){break}if(((c[m+4>>2]|0)-(c[m>>2]|0)|0)<(c[d+37032>>2]<<1|0)){E=m;if((cw(d+84|0,E)|0)==0){A=E;bV(A)|0}if((c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+4>>2]|0)==0){F=0}else{F=c[(c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+4>>2]|0)+8>>2]|0}m=F;j=j+1|0}}}while(0)}}while(0);if((m|0)!=0){if((c[m+36>>2]|0)==96){w=6834}else{if((c[m+36>>2]|0)==39){w=6834}}do{if((w|0)==6834){w=0;if((c[r+36>>2]|0)!=96){if((c[r+36>>2]|0)!=39){break}}if(((c[m+4>>2]|0)-(c[r>>2]|0)|0)<(c[d+37032>>2]|0)){c[r+36>>2]=34;E=m;A=d+84|0;B=E;cw(A,B)|0;B=E;bV(B)|0}}}while(0)}}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((c[d+37072>>2]|0)==0){i=b;return 0}au(c[n>>2]|0,24152,(s=i,i=i+16|0,c[s>>2]=h,c[s+8>>2]=j,s)|0)|0;i=s;i=b;return 0}function d1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;d=i;e=a;a=b;b=0;f=-1;g=0;h=0;j=0;k=1023;l=0;m=0;o=1;while(1){if((o|0)>=(c[a+156>>2]|0)){break}g=g+((c[a+12456+(o<<2)>>2]|0)-(c[a+168+(o<<2)>>2]|0)+1)|0;if((k|0)>(c[a+16552+(o<<2)>>2]|0)){k=c[a+16552+(o<<2)>>2]|0}o=o+1|0}if((c[a+156>>2]|0)>1){g=(g|0)/((c[a+156>>2]|0)-1|0)|0}b=0;p=0;o=1;while(1){if((o|0)>=(c[a+156>>2]|0)){break}q=(c[a+12456+(o<<2)>>2]|0)-(c[a+168+(o<<2)>>2]|0)+1|0;do{if((q|0)>((g*120|0|0)/100|0|0)){r=6860}else{if((q|0)<((g*80|0|0)/100|0|0)){r=6860;break}p=p+q|0;b=b+1|0}}while(0);if((r|0)==6860){r=0}o=o+1|0}do{if((b|0)>0){if(((p|0)/(b|0)|0|0)<=7){break}g=(p|0)/(b|0)|0}}while(0);if((c[a+37072>>2]&1|0)!=0){p=c[n>>2]|0;q=g;au(p|0,24008,(s=i,i=i+8|0,c[s>>2]=q,s)|0)|0;i=s}if((g|0)==0){g=(((c[a+37036>>2]|0)*110|0|0)/100|0)+1|0}if((k|0)<4){k=0}b=0;if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){t=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{t=0}if(!t){break}g=0;q=0;p=0;u=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;v=0;h=0;j=0;l=cB(a+84|0,u)|0;if((c[u+48>>2]|0)>(f|0)){w=0;x=0;if((f|0)>=0){if((c[u+48>>2]|0)>1){w=(c[a+168+(c[u+48>>2]<<2)>>2]|0)-(c[a+168+((c[u+48>>2]|0)-1<<2)>>2]|0)|0}x=(c[a+12456+(c[u+48>>2]<<2)>>2]|0)-(c[a+168+(c[u+48>>2]<<2)>>2]|0)|0;if((x|0)>4){h=(w|0)/(x<<1|0)|0}if((h|0)==0){h=1}}f=c[u+48>>2]|0}if((c[u+48>>2]|0)==(f|0)){g=c[a+28840+(c[u+48>>2]<<2)>>2]|0;q=c[a+32936+(c[u+48>>2]<<2)>>2]|0;if((l|0)!=0){p=(c[u>>2]|0)-(c[l+4>>2]|0)-1|0}if((p|0)<0){p=0}if((h|0)!=0){r=6894}else{if((l|0)==0){r=6894}}if((r|0)==6894){r=0;p=(c[u>>2]|0)-k|0}if((q|0)!=0){j=(p|0)/(g|0)|0}else{j=(p<<1|0)/((c[a+37032>>2]|0)*3|0|0)|0}do{if((p|0)>=(g|0)){if((j|0)!=0){break}j=1}}while(0)}o=0;while(1){if((o|0)>=(h+j|0)){break}x=0;m=cB(a+84|0,u)|0;if((m|0)!=0){x=(c[u>>2]|0)-(c[m+4>>2]|0)+1|0}else{x=0}if((x|0)<0){x=0}l=bU(0)|0;if((j|0)!=0){y=(-x|0)+((aa(o,x)|0)/(j|0)|0)|0}else{y=0}c[l>>2]=(c[u>>2]|0)-2+y;if((j|0)!=0){z=(-x|0)+((aa(o+1|0,x)|0)/(j|0)|0)|0}else{z=0}c[l+4>>2]=(c[u>>2]|0)-2+z;c[l+8>>2]=c[u+8>>2];c[l+12>>2]=c[u+12>>2];do{if((o|0)>=(h|0)){if((m|0)==0){break}if((j|0)!=0){A=(aa(o,x)|0)/(j|0)|0}else{A=0}c[l>>2]=(c[m+4>>2]|0)+2+A}}while(0);if((o|0)<(h|0)){r=6923}else{if((m|0)==0){r=6923}}if((r|0)==6923){r=0;c[l>>2]=c[a+16552+(c[u+48>>2]<<2)>>2]}do{if((o|0)<(h|0)){if((m|0)==0){break}c[l+8>>2]=c[m+12>>2];c[l+12>>2]=c[u+8>>2]}}while(0);c[l+16>>2]=c[l>>2];c[l+20>>2]=c[u+8>>2];c[l+24>>2]=0;w=((o|0)<(h|0)?10:32)&255;v=w;c[l+36>>2]=w<<24>>24;c[l+28>>2]=0;c[l+32>>2]=0;c[l+40>>2]=0;c[l+44>>2]=-1;c[l+48>>2]=c[u+48>>2];c[l+52>>2]=c[u+52>>2];c[l+56>>2]=c[u+56>>2];c[l+60>>2]=c[u+60>>2];c[l+64>>2]=c[u+64>>2];c[l+68>>2]=e;dy(l,v<<24>>24,100)|0;ct(a+84|0,u,l)|0;if((c[a+37072>>2]&1|0)!=0){w=c[n>>2]|0;B=c[l+36>>2]|0;C=c[l>>2]|0;D=c[l+8>>2]|0;E=l;F=q;G=g;H=p;I=x;au(w|0,23888,(s=i,i=i+64|0,c[s>>2]=B,c[s+8>>2]=C,c[s+16>>2]=D,c[s+24>>2]=E,c[s+32>>2]=F,c[s+40>>2]=G,c[s+48>>2]=H,c[s+56>>2]=I,s)|0)|0;i=s}b=b+1|0;o=o+1|0}c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}if((c[a+37072>>2]&1|0)==0){i=d;return 0}au(c[n>>2]|0,23840,(s=i,i=i+8|0,c[s>>2]=b,s)|0)|0;i=s;i=d;return 0}function d2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;b=i;d=a;a=d+156|0;e=0;f=0;if((c[d+37072>>2]&1|0)!=0){g=c[n>>2]|0;au(g|0,23784,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){j=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{j=0}if(!j){break}g=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;k=1;while(1){if((k|0)>=(c[d+156>>2]|0)){break}if((c[a+4>>2]|0)!=0){l=aa(c[a+8>>2]|0,((c[g+4>>2]|0)+(c[g>>2]|0)|0)/2|0)|0;m=(l|0)/(c[a+4>>2]|0)|0}else{m=0}l=(c[a+12+(k<<2)>>2]|0)+m|0;o=(c[a+4108+(k<<2)>>2]|0)+m|0;p=(c[a+8204+(k<<2)>>2]|0)+m|0;q=(c[a+12300+(k<<2)>>2]|0)+m|0;if((q-l|0)!=0){do{if((c[g>>2]|0)>=(c[a+16396+(k<<2)>>2]|0)){if((c[g+4>>2]|0)>((c[a+20492+(k<<2)>>2]|0)+(c[d+37032>>2]|0)|0)){break}do{if((c[g+8>>2]|0)<=(q+(c[d+37036>>2]<<1)|0)){if((c[g+12>>2]|0)<(l-((c[d+37036>>2]|0)/2|0)|0)){break}if((c[g+12>>2]|0)>(q+(c[d+37036>>2]<<1)|0)){break}do{if((c[g+56>>2]|0)==0){r=6961}else{s=P((c[g+12>>2]|0)-(c[g+60>>2]|0)|0)|0;if((s|0)<=(P((c[g+12>>2]|0)-l|0)|0)){break}if((c[g+8>>2]|0)>(c[g+64>>2]|0)){r=6961}}}while(0);if((r|0)==6961){r=0;c[g+52>>2]=l;c[g+56>>2]=o;c[g+60>>2]=p;c[g+64>>2]=q;c[g+48>>2]=k}}}while(0)}}while(0)}k=k+1|0}do{if(((c[g+12>>2]|0)+2|0)<(c[g+52>>2]|0)){r=6970}else{if((c[g+8>>2]|0)<((c[g+52>>2]|0)-(((c[g+60>>2]|0)-(c[g+52>>2]|0)|0)/2|0)|0)){r=6970;break}if(((c[g+8>>2]|0)-2|0)>((c[g+64>>2]|0)+(((c[g+60>>2]|0)-(c[g+56>>2]|0)|0)/2|0)|0)){r=6970;break}if((c[g+12>>2]|0)>((c[g+60>>2]|0)+((c[g+60>>2]|0)-(c[g+52>>2]|0))|0)){r=6970;break}e=e+1|0}}while(0);if((r|0)==6970){r=0;c[g+52>>2]=0;c[g+56>>2]=0;c[g+60>>2]=0;c[g+64>>2]=0;c[g+48>>2]=0;f=f+1|0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((c[d+37072>>2]&1|0)==0){i=b;return 0}au(c[n>>2]|0,23728,(h=i,i=i+16|0,c[h>>2]=e,c[h+8>>2]=f,h)|0)|0;i=h;i=b;return 0}function d3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;do{if((c[a+48>>2]|0)>=(c[d+48>>2]|0)){if((c[a+48>>2]|0)==(c[d+48>>2]|0)){if((c[a>>2]|0)<(c[d>>2]|0)){break}}e=-1;f=e;return f|0}}while(0);e=1;f=e;return f|0}function d4(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;e=b;b=0;if((c[6834]|0)==0){b=c[e+37052>>2]|0}c[6834]=(c[6834]|0)+1;if((e|0)!=0){}else{aE(23640,24920,3039,25424);return 0}f=e+4|0;g=ei(100,23552)|0;ek(0,g)|0;h=e+28|0;j=e+4|0;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];c[h+12>>2]=c[j+12>>2];if((b|0)==0){c[e+37052>>2]=dh(c[f>>2]|0,c[f+8>>2]|0,c[f+4>>2]|0,0,0,c[f+4>>2]|0,c[f+8>>2]|0,c[e+37072>>2]&1)|0}else{b=c[f>>2]|0;j=c[f+8>>2]|0;h=c[f+4>>2]|0;k=c[f+4>>2]|0;l=c[f+8>>2]|0;m=c[e+37072>>2]&1;dh(b,j,h,0,0,k,l,m)|0}c[e+37052>>2]=di(c[f>>2]|0,c[f+8>>2]|0,c[f+4>>2]|0,0,0,c[f+4>>2]|0,c[f+8>>2]|0,c[e+37052>>2]|0)|0;if((c[e+37072>>2]|0)!=0){m=c[n>>2]|0;l=c[e+37052>>2]|0;au(m|0,23408,(o=i,i=i+8|0,c[o>>2]=l,o)|0)|0;i=o}ek(5,g)|0;ek(8,g)|0;dL(e,f)|0;if((c[e+37048>>2]|0)==0){l=c[n>>2]|0;au(l|0,23360,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o;if((c[e+37072>>2]&32|0)!=0){l=e;dn(23328,l,8)|0}p=1;q=p;i=d;return q|0}ek(10,g)|0;el(e)|0;ek(12,g)|0;bQ(e)|0;b8(e)|0;eo(e)|0;dP(f)|0;b4(e)|0;b5(f,c[e+37060>>2]|0)|0;ek(20,g)|0;d2(e)|0;if((c[e+37072>>2]&32|0)!=0){l=e;dn(23208,l,12)|0}dV(f,c[e+37060>>2]|0)|0;ep(e,f)|0;dQ(e,f)|0;eq(e)|0;cC(e+84|0,2);dN(e);if((c[e+37060>>2]&64|0)!=0){l=f;dR(l)|0}ek(30,g)|0;dS(f,c[e+37060>>2]|0)|0;ek(60,g)|0;if((b6(f,c[e+37060>>2]|0)|0)!=0){cC(e+84|0,2);l=f;m=c[e+37060>>2]|0;dS(l,m)|0}m=0;l=0;k=0;if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){r=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{r=0}if(!r){break}h=c[(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[h+36>>2]|0)==57344){k=k+1|0}if((c[h+36>>2]|0)==57345){l=l+1|0}m=m+1|0;c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}if((c[e+37072>>2]|0)!=0){r=c[n>>2]|0;h=k;k=l;l=m;au(r|0,23144,(o=i,i=i+24|0,c[o>>2]=h,c[o+8>>2]=k,c[o+16>>2]=l,o)|0)|0;i=o}if((c[e+37072>>2]&32|0)!=0){l=e;dn(23120,l,13)|0}dT(f,c[e+37060>>2]|0)|0;ek(70,g)|0;dU(f,c[e+37060>>2]|0)|0;ek(80,g)|0;if((c[e+37072>>2]&6|0)!=0){l=e;dm(l)|0}d1(f,e)|0;if((c[e+37072>>2]|0)!=0){f=c[n>>2]|0;au(f|0,23056,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o}if((c[e+37060>>2]&32|0)==0){f=e;d0(f)|0}cr(e,c[e+37060>>2]|0);ek(90,g)|0;f=22944;l=0;k=0;h=0;if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){s=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{s=0}if(!s){break}t=c[(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[t+36>>2]|0)==57344){h=h+1|0}if((c[t+36>>2]|0)==57345){k=k+1|0}do{if((c[t+36>>2]|0)>32){if((c[t+36>>2]|0)>122){break}l=l+1|0}}while(0);c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}if((c[e+37072>>2]|0)!=0){s=c[n>>2]|0;r=h;m=k;k=l;au(s|0,22760,(o=i,i=i+24|0,c[o>>2]=r,c[o+8>>2]=m,c[o+16>>2]=k,o)|0)|0;i=o}h=0;while(1){if((h|0)>=20){break}l=0;if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){u=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{u=0}if(!u){break}t=c[(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[t+36>>2]|0)==(a[f+h|0]|0)){l=l+1|0}c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}do{if((c[e+37072>>2]|0)!=0){if((l|0)<=0){break}k=c[n>>2]|0;m=a[f+h|0]|0;r=l;au(k|0,22208,(o=i,i=i+16|0,c[o>>2]=m,c[o+8>>2]=r,o)|0)|0;i=o}}while(0);h=h+1|0}if((c[e+37072>>2]|0)!=0){h=c[n>>2]|0;au(h|0,4968,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o}if((c[e+37072>>2]&32|0)!=0){o=e;dn(22040,o,6)|0}ek(100,g)|0;ej(g)|0;p=0;q=p;i=d;return q|0}function d5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b;b=d;d=e;do{if((b|0)>=0){if((d|0)<0){break}if((b|0)>=(c[f+4>>2]|0)){break}if((d|0)>=(c[f+8>>2]|0)){break}e=b+(aa(d,c[f+4>>2]|0)|0)|0;g=a[(c[f>>2]|0)+e|0]&7;h=g;return h|0}}while(0);g=0;h=g;return h|0}function d6(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=b;b=c;c=d;d=e;if((c|0)>=0){if((c|0)<=9){}else{g=7084}}else{g=7084}if((g|0)==7084){aE(7864,19664,265,25320)}if((d|0)<1024){}else{aE(15320,19664,266,25320)}if((c|0)==9){if((a[b+4|0]|0)==0){a[f+d|0]=2}else{a[f+d|0]=1}return}if((d|0)!=-1){a[f+d|0]=1}if((a[b+c|0]|0)==0){d6(f,b,c+1|0,(d<<1)+2|0);return}if((a[b+c|0]|0)==1){d6(f,b,c+1|0,(d<<1)+3|0)}else{d6(f,b,c+1|0,(d<<1)+2|0);d6(f,b,c+1|0,(d<<1)+3|0)}return}function d7(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=b;b=e;e=f;f=b+(aa(e,c[g+4>>2]|0)|0)|0;h=d[(c[g>>2]|0)+f|0]&-8;if((c[6576]|0)==0){eC(26312,0,1024)|0;f=0;while(1){if((f|0)>=6){break}d6(26312,320+(f*9|0)|0,0,-1);f=f+1|0}c[6576]=1}f=-1;do{if((e|0)==0){f=13}else{do{if((b|0)==0){i=7114}else{j=b-1+(aa(e-1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7114;break}f=(f<<1)+2|0}}while(0);if((i|0)==7114){f=(f<<1)+3|0}j=b+(aa(e-1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)!=0){f=(f<<1)+2|0}else{f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}do{if((b+1|0)==(c[g+4>>2]|0)){i=7123}else{j=b+1+(aa(e-1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7123;break}f=(f<<1)+2|0}}while(0);if((i|0)==7123){f=(f<<1)+3|0}if((a[26312+f|0]|0)!=0){break}k=h;l=k;return l|0}}while(0);do{if((b|0)==0){i=7130}else{j=b-1+(aa(e|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7130;break}f=(f<<1)+2|0}}while(0);if((i|0)==7130){f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}j=b+(aa(e|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)!=0){f=(f<<1)+2|0}else{f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}do{if((b+1|0)==(c[g+4>>2]|0)){i=7141}else{j=b+1+(aa(e|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7141;break}f=(f<<1)+2|0}}while(0);if((i|0)==7141){f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}if((e+1|0)==(c[g+8>>2]|0)){f=(f<<3)+21|0}else{do{if((b|0)==0){i=7149}else{j=b-1+(aa(e+1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7149;break}f=(f<<1)+2|0}}while(0);if((i|0)==7149){f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}j=b+(aa(e+1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)!=0){f=(f<<1)+2|0}else{f=(f<<1)+3|0}if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}do{if((b+1|0)==(c[g+4>>2]|0)){i=7160}else{j=b+1+(aa(e+1|0,c[g+4>>2]|0)|0)|0;if((d[(c[g>>2]|0)+j|0]>>7|0)==0){i=7160;break}f=(f<<1)+2|0}}while(0);if((i|0)==7160){f=(f<<1)+3|0}}if((f|0)<1024){}else{aE(15320,19664,418,25400);return 0}do{if((a[26312+f|0]|0)==0){m=1}else{if((a[26312+f|0]|0)==1){m=1;break}if((a[26312+f|0]|0)==2){m=1;break}aE(10792,19664,419,25400);return 0}}while(0);if((a[26312+f|0]|0)==0){k=h;l=k;return l|0}if((a[26312+f|0]|0)==1){k=c[(c[7036]|0)+37052>>2]|0;l=k;return l|0}else{k=0;l=k;return l|0}return 0}function d8(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=e;e=c[7036]|0;do{if((a|0)>=0){if((b|0)<0){break}if((a|0)>=(c[f+4>>2]|0)){break}if((b|0)>=(c[f+8>>2]|0)){break}if((c[e+44>>2]|0)>0){g=d7(f,a,b)|0;h=g;return h|0}else{i=a+(aa(b,c[f+4>>2]|0)|0)|0;g=(d[(c[f>>2]|0)+i|0]|0)&-8;h=g;return h|0}}}while(0);g=248;h=g;return h|0}function d9(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;i=b;b=e;e=f;if((b|0)>=(c[i+4>>2]|0)){return}if((b|0)<0){return}if((e|0)<0){return}if((e|0)>=(c[i+8>>2]|0)){return}f=b+(aa(e,c[i+4>>2]|0)|0)|0;j=b+(aa(e,c[i+4>>2]|0)|0)|0;a[(c[i>>2]|0)+j|0]=((d[(c[i>>2]|0)+f|0]|0)&g|h)&255;return}function ea(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a;a=0;while(1){if((c[8+(a<<2)>>2]|0)==0){d=7216;break}e=a6(b|0,c[8+(a<<2)>>2]|0)|0;if((e|0)!=0){f=eA(e|0)|0;if((f|0)==(eA(c[8+(a<<2)>>2]|0)|0)){d=7212;break}}a=a+2|0}if((d|0)==7212){g=c[8+(a+1<<2)>>2]|0;h=g;return h|0}else if((d|0)==7216){g=0;h=g;return h|0}return 0}function eb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=a;a=0;while(1){e=(ao(d|0)|0)&255;if((aG(d|0)|0)!=0){f=c[n>>2]|0;au(f|0,14960,(g=i,i=i+8|0,c[g>>2]=130,g)|0)|0;i=g;f=c[n>>2]|0;au(f|0,14544,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}if((am(d|0)|0)!=0){h=7224;break}if((e<<24>>24|0)==35){a=1;continue}if((a|0)==0){h=7228;break}if((e<<24>>24|0)==10){a=0}}if((h|0)==7228){i=b;return e|0}else if((h|0)==7224){au(c[n>>2]|0,14960,(g=i,i=i+8|0,c[g>>2]=131,g)|0)|0;i=g;au(c[n>>2]|0,14168,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;aO(1);return 0}return 0}function ec(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;g=i;i=i+512|0;h=g|0;j=b;b=e;e=f;f=1;do{if((c[6570]|0)==0){c[6568]=0;do{if((a[j|0]|0)==45){if((a[j+1|0]|0)!=0){k=7236;break}c[6570]=c[m>>2]}else{k=7236}}while(0);if((k|0)==7236){c[6568]=ea(j)|0;do{if((c[6568]|0)!=0){l=h|0;p=c[6568]|0;q=j;aP(l|0,12520,(r=i,i=i+16|0,c[r>>2]=p,c[r+8>>2]=q,r)|0)|0;i=r;if((e|0)!=0){q=c[n>>2]|0;p=h|0;au(q|0,12024,(r=i,i=i+8|0,c[r>>2]=p,r)|0)|0;i=r}c[6570]=ba(h|0,11392)|0;if((c[6570]|0)!=0){break}else{p=c[n>>2]|0;au(p|0,14960,(r=i,i=i+8|0,c[r>>2]=325,r)|0)|0;i=r;p=c[n>>2]|0;q=h|0;au(p|0,11024,(r=i,i=i+8|0,c[r>>2]=q,r)|0)|0;i=r;aO(1);return 0}}else{c[6570]=aA(j|0,13880)|0;if((c[6570]|0)!=0){break}else{q=c[n>>2]|0;au(q|0,14960,(r=i,i=i+8|0,c[r>>2]=311,r)|0)|0;i=r;q=c[n>>2]|0;p=j;au(q|0,13232,(r=i,i=i+8|0,c[r>>2]=p,r)|0)|0;i=r;aO(1);return 0}}}while(0)}a[26296]=(ao(c[6570]|0)|0)&255;if((aG(c[6570]|0)|0)==0){break}p=c[n>>2]|0;au(p|0,14960,(r=i,i=i+8|0,c[r>>2]=328,r)|0)|0;i=r;p=c[n>>2]|0;au(p|0,10888,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;s=-1;t=s;i=g;return t|0}}while(0);a[26288]=(ao(c[6570]|0)|0)&255;if((aG(c[6570]|0)|0)!=0){p=c[n>>2]|0;au(p|0,14960,(r=i,i=i+8|0,c[r>>2]=330,r)|0)|0;i=r;p=c[n>>2]|0;au(p|0,10888,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;s=-1;t=s;i=g;return t|0}do{if((a[26296]|0)==80){if((a[26288]|0)<49){break}if((a[26288]|0)>54){break}p=0;q=0;l=0;if((a[26288]|0)==52){k=7259}else{if((a[26288]|0)==49){k=7259}}if((k|0)==7259){p=1}u=0;while(1){if((a[26288]|0)==53){k=7263}else{if((a[26288]|0)==50){k=7263}else{k=7264}}if((k|0)==7263){k=0;if((u&7|0)<6){v=1}else{k=7264}}do{if((k|0)==7264){k=0;if((a[26288]|0)==54){k=7266}else{if((a[26288]|0)==51){k=7266}}if((k|0)==7266){k=0;if((u&7|0)<6){v=1;break}}if((a[26288]|0)==52){k=7269}else{if((a[26288]|0)==49){k=7269}else{w=0}}if((k|0)==7269){k=0;w=(u&7|0)<4}v=w}}while(0);if(!v){break}a[26296]=eb(c[6570]|0)|0;if((u&1|0)==0){if((aS(a[26296]|0)|0)==0){u=u+1|0}}if((u&1|0)==1){if((as(a[26296]|0)|0)!=0){if((u|0)==1){l=(l*10|0)+(a[26296]|0)-48|0}else{if((u|0)==3){q=(q*10|0)+(a[26296]|0)-48|0}else{if((u|0)==5){p=(p*10|0)+(a[26296]|0)-48|0}}}}else{if((aS(a[26296]|0)|0)==0){k=7279;break}u=u+1|0}}}if((k|0)==7279){x=c[n>>2]|0;au(x|0,14960,(r=i,i=i+8|0,c[r>>2]=353,r)|0)|0;i=r;x=c[n>>2]|0;au(x|0,10040,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;aO(1);return 0}if((e|0)!=0){x=c[n>>2]|0;y=a[26288]|0;z=q;A=l;B=p;C=aM(c[6570]|0)|0;au(x|0,9872,(r=i,i=i+40|0,c[r>>2]=y,c[r+8>>2]=z,c[r+16>>2]=A,c[r+24>>2]=B,c[r+32>>2]=C,r)|0)|0;i=r}do{if((a[26288]|0)==52){if((l&7|0)==0){break}if((e|0)!=0){C=c[n>>2]|0;B=l+7&-8;au(C|0,9760,(r=i,i=i+8|0,c[r>>2]=B,r)|0)|0;i=r}}}while(0);if((p>>8|0)!=0){f=2}if((p>>16|0)!=0){f=3}if((p>>24|0)!=0){f=4}az(c[o>>2]|0)|0;if(+(aa(l,q)|0)*1.0!=+(l|0)*1.0*+(q|0)){B=c[n>>2]|0;au(B|0,14960,(r=i,i=i+8|0,c[r>>2]=370,r)|0)|0;i=r;B=c[n>>2]|0;au(B|0,9640,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;aO(1);return 0}B=ev(aa(l,q)|0)|0;if((B|0)==0){C=c[n>>2]|0;au(C|0,14960,(r=i,i=i+8|0,c[r>>2]=372,r)|0)|0;i=r;C=c[n>>2]|0;au(C|0,9480,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;aO(1);return 0}C=0;while(1){if((C|0)>=(aa(l,q)|0)){break}a[B+C|0]=-1;C=C+1|0}if((a[26288]|0)==53){k=7315}else{if((a[26288]|0)==50){k=7315}}if((k|0)==7315){C=0;while(1){if((C|0)>=(aa(l,q)|0)){break}if((a[26288]|0)==53){if((f|0)!=(aW(h|0,1,f|0,c[6570]|0)|0)){k=7319;break}}else{D=0;while(1){if((D|0)>=3){break}A=h+(aa(D,f)|0)|0;ed(A,f,c[6570]|0)|0;D=D+1|0}}a[B+C|0]=a[h+(f-1)|0]|0;C=C+1|0}if((k|0)==7319){A=c[n>>2]|0;z=f;y=C;au(A|0,9360,(r=i,i=i+16|0,c[r>>2]=z,c[r+8>>2]=y,r)|0)|0;i=r}}if((a[26288]|0)==54){k=7331}else{if((a[26288]|0)==51){k=7331}}if((k|0)==7331){C=0;while(1){if((C|0)>=(aa(l,q)|0)){break}if((a[26288]|0)==54){if((f*3|0|0)!=(aW(h|0,1,f*3|0|0,c[6570]|0)|0)){k=7335;break}}else{D=0;while(1){if((D|0)>=3){break}y=h+(aa(D,f)|0)|0;ed(y,f,c[6570]|0)|0;D=D+1|0}}a[B+C|0]=(((d[h+(f-1)|0]|0)*511|0)+511>>10)+(((d[h+((f<<1)-1)|0]|0)*396|0)+511>>10)+(((d[h+((f*3|0)-1)|0]|0)*117|0)+511>>10)&255;C=C+1|0}if((k|0)==7335){y=c[n>>2]|0;z=f;A=C;au(y|0,9168,(r=i,i=i+16|0,c[r>>2]=z,c[r+8>>2]=A,r)|0)|0;i=r}}do{if((a[26288]|0)==49){C=0;D=0;u=0;p=255;while(1){if((C|0)<(aa(l,q)|0)){E=(aG(c[6570]|0)|0)!=0^1}else{E=0}if(!E){k=7356;break}a[26296]=eb(c[6570]|0)|0;if((as(a[26296]|0)|0)!=0){a[B+C|0]=((a[26296]|0)==48?255:0)&255;C=C+1|0}else{if((aS(a[26296]|0)|0)==0){k=7353;break}}}if((k|0)==7353){A=c[n>>2]|0;au(A|0,14960,(r=i,i=i+8|0,c[r>>2]=399,r)|0)|0;i=r;A=c[n>>2]|0;au(A|0,9072,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;aO(1);return 0}else if((k|0)==7356){break}}}while(0);if((a[26288]|0)==52){u=l+7&-8;if((q|0)!=(aW(B|0,u>>3|0,q|0,c[6570]|0)|0)){A=c[n>>2]|0;au(A|0,14960,(r=i,i=i+8|0,c[r>>2]=403,r)|0)|0;i=r;A=c[n>>2]|0;au(A|0,9016,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r;aO(1);return 0}A=q-1|0;while(1){if((A|0)<0){break}z=l-1|0;while(1){if((z|0)<0){break}y=(128&d[B+(z+(aa(A,u)|0)>>3)|0]<<(z&7)|0)!=0;a[B+(z+(aa(A,l)|0))|0]=(y?0:255)&255;z=z-1|0}A=A-1|0}p=255}A=255;u=0;C=0;while(1){if((C|0)>=(aa(l,q)|0)){break}if((d[B+C|0]|0)>(u|0)){u=d[B+C|0]|0}if((d[B+C|0]|0)<(A|0)){A=d[B+C|0]|0}C=C+1|0}if((e|0)!=0){C=c[n>>2]|0;p=A;z=u;au(C|0,8840,(r=i,i=i+16|0,c[r>>2]=p,c[r+8>>2]=z,r)|0)|0;i=r}c[b>>2]=B;c[b+4>>2]=l;c[b+8>>2]=q;c[b+12>>2]=1;if((e|0)!=0){z=c[n>>2]|0;au(z|0,8744,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r}a[26296]=0;a[26296]=(ao(c[6570]|0)|0)&255;do{if((aG(c[6570]|0)|0)==0){if((a[26296]|0)!=80){break}s=1;t=s;i=g;return t|0}}while(0);if((e|0)!=0){q=c[n>>2]|0;au(q|0,8664,(r=i,i=i+1|0,i=i+7&-8,c[r>>2]=0,r)|0)|0;i=r}if((a[j|0]|0)!=45){k=7387}else{if((a[j+1|0]|0)!=0){k=7387}}if((k|0)==7387){if((c[6568]|0)!=0){q=c[6570]|0;ap(q|0)|0}else{q=c[6570]|0;aq(q|0)|0}}c[6570]=0;s=0;t=s;i=g;return t|0}}while(0);k=c[n>>2]|0;j=a4(c[6570]|0)|0;e=aM(c[6570]|0)|0;au(k|0,10536,(r=i,i=i+16|0,c[r>>2]=j,c[r+8>>2]=e,r)|0)|0;i=r;e=255&a[26288];au(c[n>>2]|0,10232,(r=i,i=i+16|0,c[r>>2]=255&a[26296],c[r+8>>2]=e,r)|0)|0;i=r;if((c[6570]|0)!=0){r=c[6570]|0;aq(r|0)|0}c[6570]=0;s=-1;t=s;i=g;return t|0}function ed(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=b;b=d;d=e;e=0;while(1){if((e|0)>=(b|0)){break}a[g+e|0]=0;e=e+1|0}h=0;while(1){if(!((aG(d|0)|0)!=0^1)){j=7417;break}k=eb(d)|0;if((aS(k<<24>>24|0)|0)!=0){if((h|0)!=0){j=7408;break}continue}h=1;if((as(k<<24>>24|0)|0)==0){j=7410;break}e=0;l=0;while(1){if((e|0)>=(b|0)){break}l=((a[g+e|0]|0)*10|0)+l|0;a[g+e|0]=l&255;l=l>>8;e=e+1|0}l=g|0;a[l]=(a[l]|0)+((k<<24>>24)-48)&255}if((j|0)==7410){g=c[n>>2]|0;au(g|0,14960,(g=i,i=i+8|0,c[g>>2]=274,g)|0)|0;i=g;e=c[n>>2]|0;au(e|0,9072,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;aO(1);return 0}else if((j|0)==7417){i=f;return 0}else if((j|0)==7408){i=f;return 0}return 0}function ee(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;i=i+16|0;j=h|0;k=b;b=e;e=f;f=g;c[j>>2]=b<<1;c[j+4>>2]=e<<1;c[j+8>>2]=f<<1;if(((d[k|0]|0)+(d[k+1|0]|0)+(d[k+2|0]|0)|0)>=480){c[j>>2]=(-e|0)-f;c[j+4>>2]=(-b|0)-f;c[j+8>>2]=(-b|0)-e}e=0;while(1){if((e|0)>=3){break}if((c[j+(e<<2)>>2]|0)<0){if((d[k+e|0]|0|0)<(-(c[j+(e<<2)>>2]|0)|0)){l=d[k+e|0]|0}else{l=-(c[j+(e<<2)>>2]|0)|0}b=k+e|0;a[b]=(d[b]|0)-l&255}else{if((255-(d[k+e|0]|0)|0)<(c[j+(e<<2)>>2]|0)){m=255-(d[k+e|0]|0)|0}else{m=c[j+(e<<2)>>2]|0}b=k+e|0;a[b]=(d[b]|0)+m&255}e=e+1|0}i=h;return}function ef(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+136|0;f=e|0;g=e+8|0;h=b;b=d;d=0;j=0;if((aC(h|0,124)|0)!=0){k=-1;l=k;i=e;return l|0}if((a6(h|0,8240)|0)!=0){d=aA(h|0,8624)|0}if((d|0)==0){m=g|0;eE(m|0,8184,12)|0;m=g+11|0;o=h;eE(m|0,o|0,111)|0;a[g+123|0]=0;o=g+(eA(g|0)|0)|0;eE(o|0,17568,5)|0;d=ba(g|0,8088)|0;if((d|0)!=0){j=1}else{o=c[n>>2]|0;au(o|0,14960,(p=i,i=i+8|0,c[p>>2]=478,p)|0)|0;i=p;o=c[n>>2]|0;au(o|0,7912,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p}}if((d|0)==0){o=g|0;eE(o|0,7784,11)|0;o=g+10|0;m=h;eE(o|0,m|0,109)|0;a[g+120|0]=0;m=g+(eA(g|0)|0)|0;eE(m|0,9056,8)|0;d=ba(g|0,8088)|0;if((d|0)!=0){j=1}else{m=c[n>>2]|0;au(m|0,14960,(p=i,i=i+8|0,c[p>>2]=485,p)|0)|0;i=p;m=c[n>>2]|0;au(m|0,7680,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p}}if((d|0)==0){m=g|0;o=h;eE(m|0,o|0,113)|0;a[g+114|0]=0;o=g+(eA(g|0)|0)|0;eE(o|0,8240,5)|0;d=aA(g|0,8624)|0}if((d|0)==0){g=c[n>>2]|0;au(g|0,14960,(p=i,i=i+8|0,c[p>>2]=493,p)|0)|0;i=p;g=c[n>>2]|0;au(g|0,8592,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p;aO(1);return 0}g=c[b+8>>2]|0;au(d|0,7584,(p=i,i=i+16|0,c[p>>2]=c[b+4>>2],c[p+8>>2]=g,p)|0)|0;i=p;if((c[b+12>>2]|0)==1){g=0;while(1){if((g|0)>=(c[b+8>>2]|0)){break}o=0;while(1){if((o|0)>=(c[b+4>>2]|0)){break}m=o+(aa(g,c[b+4>>2]|0)|0)|0;h=a[(c[b>>2]|0)+m|0]|0;m=h&255&15;if((h&255|0)<160){q=(h&255&-16)>>1}else{q=195|(h&255)>>1}h=q&255;r=h;a[f+2|0]=r;a[f+1|0]=r;a[f|0]=r;if((m&1|0)==1){ee(f|0,0,0,((o+g&1)<<3)+8|0)}if((m&8|0)==8){ee(f|0,0,0,16)}if((m&6|0)==6){ee(f|0,0,0,32)}if((m&6|0)==4){ee(f|0,0,48,0)}if((m&6|0)==2){ee(f|0,32,0,0)}if(1!=(bd(f|0,3,1,d|0)|0)){s=7472;break}o=o+1|0}if((s|0)==7472){s=0;o=c[n>>2]|0;au(o|0,14960,(p=i,i=i+8|0,c[p>>2]=508,p)|0)|0;i=p;o=c[n>>2]|0;au(o|0,8408,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p;g=c[b+8>>2]|0}g=g+1|0}}if((c[b+12>>2]|0)==3){g=c[b+8>>2]|0;if((g|0)!=(bd(c[b>>2]|0,(c[b+4>>2]|0)*3|0|0,c[b+8>>2]|0,d|0)|0)){b=c[n>>2]|0;au(b|0,14960,(p=i,i=i+8|0,c[p>>2]=511,p)|0)|0;i=p;b=c[n>>2]|0;au(b|0,8408,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p}}if((j|0)!=0){j=d;ap(j|0)|0;d=0}if((d|0)!=0){j=d;aq(j|0)|0}k=0;l=k;i=e;return l|0}function eg(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0;f=i;g=b;b=e;e=(c[b+4>>2]|0)+7&-8;h=0;while(1){if((h|0)>=(c[b+8>>2]|0)){break}j=0;while(1){if((j|0)>=(c[b+4>>2]|0)){break}k=j+(aa(h,e)|0)>>3;l=7-(j&7)|0;m=j+(aa(h,c[b+4>>2]|0)|0)|0;if((c[b+12>>2]|0)==3){m=((d[(c[b>>2]|0)+(m*3|0)|0]|0)+(d[(c[b>>2]|0)+((m*3|0)+1)|0]|0)+(d[(c[b>>2]|0)+((m*3|0)+2)|0]|0)|0)/3|0}else{m=d[(c[b>>2]|0)+m|0]|0}m=(m|0)>127?0:1;a[(c[b>>2]|0)+k|0]=((d[(c[b>>2]|0)+k|0]|0)&-2<<l|m<<l)&255;j=j+1|0}h=h+1|0}h=aA(g|0,8624)|0;if((h|0)==0){g=c[n>>2]|0;au(g|0,14960,(o=i,i=i+8|0,c[o>>2]=532,o)|0)|0;i=o;g=c[n>>2]|0;au(g|0,8592,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o;aO(1);return 0}g=c[b+8>>2]|0;au(h|0,7528,(o=i,i=i+16|0,c[o>>2]=c[b+4>>2],c[o+8>>2]=g,o)|0)|0;i=o;g=c[b+8>>2]|0;if((g|0)!=(bd(c[b>>2]|0,e>>3|0,c[b+8>>2]|0,h|0)|0)){b=c[n>>2]|0;au(b|0,14960,(o=i,i=i+8|0,c[o>>2]=534,o)|0)|0;i=o;b=c[n>>2]|0;au(b|0,8408,(o=i,i=i+1|0,i=i+7&-8,c[o>>2]=0,o)|0)|0;i=o;aO(1);return 0}else{o=h;aq(o|0)|0;i=f;return 0}return 0}function eh(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=b;if((c[6844]|0)!=0){b=c[6844]|0;aq(b|0)|0;c[6844]=0}if((e|0)!=0){do{if((a[e|0]|0)!=0){b=a2(e|0)|0;if((b|0)>255){f=7515}else{if((b|0)>99){g=3}else{g=(b|0)>9?2:1}if((a[e+g|0]|0)!=0){f=7515}}if((f|0)==7515){b=-1}do{if((a[e|0]|0)==45){if((a[e+1|0]|0)!=0){f=7519;break}c[6844]=c[o>>2]}else{f=7519}}while(0);if((f|0)==7519){c[6844]=aA(e|0,6920)|0;if((c[6844]|0)==0){c[6844]=aA(e|0,19256)|0}}if((c[6844]|0)!=0){break}b=c[n>>2]|0;h=e;au(b|0,14984,(b=i,i=i+8|0,c[b>>2]=h,b)|0)|0;i=b;j=-1;k=j;i=d;return k|0}}while(0)}j=0;k=j;i=d;return k|0}function ei(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=ev(24)|0;if((d|0)!=0){c[d+16>>2]=a$(0)|0;c[d+8>>2]=a;c[d+12>>2]=0;c[d+4>>2]=-1;c[d>>2]=b;c[d+20>>2]=c[d+16>>2];e=d;f=e;return f|0}else{e=0;f=e;return f|0}return 0}function ej(a){a=a|0;var b=0;b=a;if((b|0)==0){return 0}ew(b);return 0}function ek(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;e=a;a=b;do{if((c[6844]|0)!=0){if((e-(c[a+4>>2]|0)|0)<=(c[a+12>>2]|0)){break}b=10;f=a$(0)|0;do{if(((f-(c[a+20>>2]|0)|0)*5|0|0)<(c[54]<<1|0)){if((e-(c[a+4>>2]|0)|0)<(c[a+12>>2]|0)){break}if((c[a+12>>2]|0)<1024){g=a+12|0;c[g>>2]=(c[g>>2]|0)+((c[a+12>>2]|0)+1)}}}while(0);if(((f-(c[a+20>>2]|0)|0)*3|0|0)<(c[54]<<1|0)){h=0;j=h;i=d;return j|0}if((f-(c[a+20>>2]|0)<<1|0)>((c[54]|0)*3|0|0)){g=a+12|0;c[g>>2]=c[g>>2]>>1}if((a4(c[6844]|0)|0)<3){b=13}if((e|0)!=0){g=c[6844]|0;k=c[a>>2]|0;l=e;m=c[a+8>>2]|0;n=f-(c[a+16>>2]|0)|0;o=(aa(f-(c[a+16>>2]|0)|0,c[a+8>>2]|0)|0)/(e|0)|0;p=c[a+12>>2]|0;q=b<<24>>24;au(g|0,10592,(g=i,i=i+56|0,c[g>>2]=k,c[g+8>>2]=l,c[g+16>>2]=m,c[g+24>>2]=n,c[g+32>>2]=o,c[g+40>>2]=p,c[g+48>>2]=q,g)|0)|0;i=g}g=c[6844]|0;az(g|0)|0;c[a+4>>2]=e;c[a+20>>2]=f;h=0;j=h;i=d;return j|0}}while(0);h=0;j=h;i=d;return j|0}function el(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;b=i;i=i+880|0;e=b|0;f=a;a=f+4|0;g=c[f+37072>>2]|0;h=c[f+37052>>2]|0;j=0;k=0;l=0;m=0;o=0;p=0;while(1){if((p|0)>=220){break}c[e+(p<<2)>>2]=0;p=p+1|0}if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){q=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{q=0}if(!q){break}r=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[r+196>>2]|0)!=0){o=P(c[r+200>>2]|0)|0;if(((c[r+12>>2]|0)-(c[r+8>>2]|0)+1|0)>3){j=j+1|0;l=l+((c[r+4>>2]|0)-(c[r>>2]|0)+1)|0;k=k+((c[r+12>>2]|0)-(c[r+8>>2]|0)+1)|0;m=m+o|0}if((o|0)<220){s=e+(o<<2)|0;c[s>>2]=(c[s>>2]|0)+1}}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}do{if((c[f+37064>>2]|0)<0){if((j|0)<=0){break}c[f+37064>>2]=((aa((l|0)/(j|0)|0,(k|0)/(j|0)|0)|0)+16|0)/32|0;if(((k|0)/(j|0)|0|0)<10){c[f+37064>>2]=1}if((g|0)!=0){q=c[n>>2]|0;au(q|0,6784,(t=i,i=i+1|0,i=i+7&-8,c[t>>2]=0,t)|0)|0;i=t}if((g|0)!=0){q=c[n>>2]|0;s=j;u=c[f+37064>>2]|0;v=(m|0)/(j|0)|0;w=(l|0)/(j|0)|0;x=(k|0)/(j|0)|0;au(q|0,19080,(t=i,i=i+40|0,c[t>>2]=s,c[t+8>>2]=u,c[t+16>>2]=v,c[t+24>>2]=w,c[t+32>>2]=x,t)|0)|0;i=t}y=1;L10371:while(1){if((y+3|0)>=220){break}if((g|0)!=0){x=c[n>>2]|0;w=y;v=c[e+(y<<2)>>2]|0;au(x|0,14872,(t=i,i=i+16|0,c[t>>2]=w,c[t+8>>2]=v,t)|0)|0;i=t}L10377:do{if((c[e+(y<<2)>>2]|0)<(j|0)){if((y|0)>=(c[f+37064>>2]|0)){z=7595;break L10371}do{if((y|0)<((c[f+37064>>2]|0)/16|0|0)){if((y|0)>=9){break}break L10377}}while(0);if((c[e+(y<<2)>>2]|0)==0){z=7600;break L10371}if(((c[e+(y+2<<2)>>2]|0)+(c[e+(y+3<<2)>>2]|0)|0)>=((c[e+(y<<2)>>2]|0)+(c[e+(y+1<<2)>>2]|0)|0)){z=7602;break L10371}if((c[e+(y-1<<2)>>2]|0)>(c[e+(y<<2)>>2]<<10|0)){if((c[e+(y+1<<2)>>2]<<1|0)>=(c[e+(y<<2)>>2]|0)){z=7605;break L10371}}}}while(0);y=y+1|0}if((g|0)!=0){v=c[n>>2]|0;au(v|0,10496,(t=i,i=i+1|0,i=i+7&-8,c[t>>2]=0,t)|0)|0;i=t}if((g|0)!=0){p=0;o=y+1|0;while(1){if((o|0)>=220){break}do{if((o|0)==219){z=7616}else{if((c[e+(o<<2)>>2]|0)!=(c[e+(o-1<<2)>>2]|0)){z=7616;break}if((c[e+(o<<2)>>2]|0)!=(c[e+(o+1<<2)>>2]|0)){z=7616}}}while(0);if((z|0)==7616){z=0;v=c[n>>2]|0;w=o;x=c[e+(o<<2)>>2]|0;au(v|0,14872,(t=i,i=i+16|0,c[t>>2]=w,c[t+8>>2]=x,t)|0)|0;i=t;x=p+1|0;p=x;if((x|0)>20){z=7617;break}}o=o+1|0}}c[f+37064>>2]=y-1;if((g|0)!=0){x=c[n>>2]|0;w=c[f+37064>>2]|0;v=j;u=c[f+37048>>2]|0;s=((c[f+37040>>2]|0)+((c[f+37048>>2]|0)/2|0)|0)/(c[f+37048>>2]|0)|0;q=((c[f+37044>>2]|0)+((c[f+37048>>2]|0)/2|0)|0)/(c[f+37048>>2]|0)|0;A=(l|0)/(j|0)|0;B=(k|0)/(j|0)|0;au(x|0,8952,(t=i,i=i+56|0,c[t>>2]=w,c[t+8>>2]=v,c[t+16>>2]=u,c[t+24>>2]=s,c[t+32>>2]=q,c[t+40>>2]=A,c[t+48>>2]=B,t)|0)|0;i=t}}}while(0);if((c[f+37064>>2]|0)!=0){y=0;if((g|0)!=0){j=c[n>>2]|0;k=c[f+37064>>2]|0;au(j|0,8056,(t=i,i=i+8|0,c[t>>2]=k,t)|0)|0;i=t;k=c[n>>2]|0;j=c[e+4>>2]|0;l=c[e+8>>2]|0;z=aa(c[e+4>>2]|0,c[e+4>>2]|0)|0;p=(z|0)/(aa(c[a+4>>2]|0,c[a+8>>2]|0)|0)|0;z=c[e+12>>2]|0;m=aa(c[e+4>>2]|0,c[e+4>>2]|0)|0;B=(m|0)/(aa(c[a+4>>2]|0,c[a+8>>2]|0)|0)|0;m=aa(B,c[e+4>>2]|0)|0;e=(m|0)/(aa(c[a+4>>2]|0,c[a+8>>2]|0)|0)|0;au(k|0,6848,(t=i,i=i+40|0,c[t>>2]=j,c[t+8>>2]=l,c[t+16>>2]=p,c[t+24>>2]=z,c[t+32>>2]=e,t)|0)|0;i=t}y=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){C=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{C=0}if(!C){break}r=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;D=c[r>>2]|0;E=c[r+4>>2]|0;F=c[r+8>>2]|0;G=c[r+12>>2]|0;o=P(c[r+200>>2]|0)|0;if((o|0)<=(c[f+37064>>2]|0)){e=f+37048|0;c[e>>2]=(c[e>>2]|0)-1;e=f+37040|0;c[e>>2]=(c[e>>2]|0)-(E-D+1);e=f+37044|0;c[e>>2]=(c[e>>2]|0)-(G-F+1);H=D;while(1){if((H|0)>(E|0)){break}I=F;while(1){if((I|0)>(G|0)){break}d9(a,H,I,0,248);I=I+1|0}H=H+1|0}cw(f+84|0,r)|0;bV(r)|0;y=y+1|0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((g|0)!=0){o=c[n>>2]|0;C=y;e=c[f+37048>>2]|0;au(o|0,5856,(t=i,i=i+16|0,c[t>>2]=C,c[t+8>>2]=e,t)|0)|0;i=t}}y=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){J=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{J=0}if(!J){break}r=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[r+200>>2]|0)>=0){D=c[r>>2]|0;E=c[r+4>>2]|0;F=c[r+8>>2]|0;G=c[r+12>>2]|0;do{if((E-D|0)>16){if((G-F|0)<=30){break}H=D+1|0;while(1){if((H|0)>(E-1|0)){break}I=F+1|0;while(1){if((I|0)>(G-1|0)){break}e=H+(aa(I,c[a+4>>2]|0)|0)|0;do{if((d[(c[a>>2]|0)+e|0]|0|0)>=(h|0)){C=H-1+(aa(I,c[a+4>>2]|0)|0)|0;if((d[(c[a>>2]|0)+C|0]|0|0)>=(h|0)){break}C=H+1+(aa(I,c[a+4>>2]|0)|0)|0;if((d[(c[a>>2]|0)+C|0]|0|0)>=(h|0)){break}C=H+(aa(I-1|0,c[a+4>>2]|0)|0)|0;if((d[(c[a>>2]|0)+C|0]|0|0)>=(h|0)){break}C=H+(aa(I+1|0,c[a+4>>2]|0)|0)|0;if((d[(c[a>>2]|0)+C|0]|0|0)>=(h|0)){break}d9(a,H,I,0,0);y=y+1|0}}while(0);I=I+1|0}H=H+1|0}}}while(0)}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((g|0)==0){i=b;return 0}g=c[f+37048>>2]|0;au(c[n>>2]|0,4856,(t=i,i=i+24|0,c[t>>2]=y,c[t+8>>2]=h,c[t+16>>2]=g,t)|0)|0;i=t;i=b;return 0}function em(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;if((c[d>>2]|0)>=((c[a>>2]|0)-1|0)){if((c[d>>2]|0)<=((c[a+4>>2]|0)+1|0)){e=7685}else{e=7683}}else{e=7683}do{if((e|0)==7683){if((c[d+4>>2]|0)<((c[a>>2]|0)-1|0)){break}if((c[d+4>>2]|0)<=((c[a+4>>2]|0)+1|0)){e=7685}}}while(0);do{if((e|0)==7685){if((c[d+8>>2]|0)>=((c[a+8>>2]|0)-1|0)){if((c[d+8>>2]|0)>((c[a+12>>2]|0)+1|0)){e=7687}}else{e=7687}if((e|0)==7687){if((c[d+12>>2]|0)<((c[a+8>>2]|0)-1|0)){break}if((c[d+12>>2]|0)>((c[a+12>>2]|0)+1|0)){break}}f=1;g=f;return g|0}}while(0);f=0;g=f;return g|0}function en(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;do{if((c[d>>2]|0)>=((c[a>>2]|0)-1|0)){if((c[d+4>>2]|0)>((c[a+4>>2]|0)+1|0)){break}if((c[d+8>>2]|0)<((c[a+8>>2]|0)-1|0)){break}if((c[d+12>>2]|0)>((c[a+12>>2]|0)+1|0)){break}e=1;f=e;return f|0}}while(0);e=0;f=e;return f|0}function eo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=i;d=a;a=0;e=0;f=0;if((c[d+37072>>2]|0)!=0){g=c[n>>2]|0;au(g|0,24112,(h=i,i=i+8|0,c[h>>2]=314,h)|0)|0;i=h}a=0;e=0;if((c[d+37072>>2]|0)!=0){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){j=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{j=0}if(!j){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[k+36>>2]|0)==57345){a=a+1|0}else{e=e+1|0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)!=0){j=c[n>>2]|0;g=a;l=e;m=c[d+37048>>2]|0;au(j|0,23280,(h=i,i=i+24|0,c[h>>2]=g,c[h+8>>2]=l,c[h+16>>2]=m,h)|0)|0;i=h}if((c[d+37048>>2]|0)>8){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){o=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{o=0}if(!o){break}p=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[p+36>>2]|0)==57345){if((c[p+72>>2]|0)!=0){break}if(((c[p+4>>2]|0)-(c[p>>2]|0)+1|0)<=((c[(c[p+68>>2]|0)+4>>2]|0)/2|0|0)){break}if(((c[p+12>>2]|0)-(c[p+8>>2]|0)+1|0)<=((c[(c[p+68>>2]|0)+8>>2]|0)/2|0|0)){break}a=0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){q=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{q=0}if(!q){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((k|0)!=(p|0)){if((em(k,p)|0)!=0){a=a+1|0}}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((a|0)>8){m=d+84|0;l=p;cw(m,l)|0;l=p;bV(l)|0;f=f+1|0}}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)!=0){q=c[n>>2]|0;o=f;au(q|0,21744,(h=i,i=i+8|0,c[h>>2]=o,h)|0)|0;i=h}f=0;if((c[d+37048>>2]|0)>1){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){r=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{r=0}if(!r){break}p=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L10597:do{if((c[p+36>>2]|0)==57345){do{if(((c[p+4>>2]|0)-(c[p>>2]|0)+1|0)>((c[(c[p+68>>2]|0)+4>>2]|0)/2|0|0)){if(((c[p+12>>2]|0)-(c[p+8>>2]|0)+1|0)<=((c[(c[p+68>>2]|0)+8>>2]|0)/2|0|0)){break}break L10597}}while(0);a=0;if((c[p>>2]|0)==0){a=a+1|0}if((c[p+8>>2]|0)==0){a=a+1|0}if((c[p+4>>2]|0)==((c[(c[p+68>>2]|0)+4>>2]|0)-1|0)){a=a+1|0}if((c[p+12>>2]|0)==((c[(c[p+68>>2]|0)+8>>2]|0)-1|0)){a=a+1|0}if((a|0)>2){o=c[d+37052>>2]|0;a=0;if((d8(c[p+68>>2]|0,c[p>>2]|0,c[p+8>>2]|0)|0)<(o|0)){a=a+1|0}if((d8(c[p+68>>2]|0,c[p+4>>2]|0,c[p+8>>2]|0)|0)<(o|0)){a=a+1|0}if((d8(c[p+68>>2]|0,c[p>>2]|0,c[p+12>>2]|0)|0)<(o|0)){a=a+1|0}if((d8(c[p+68>>2]|0,c[p+4>>2]|0,c[p+12>>2]|0)|0)<(o|0)){a=a+1|0}if((a|0)>2){o=d+84|0;q=p;cw(o,q)|0;q=p;bV(q)|0;f=f+1|0}}}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)!=0){r=c[n>>2]|0;q=f;au(r|0,20520,(h=i,i=i+8|0,c[h>>2]=q,h)|0)|0;i=h}f=0;a=0;e=0;if((c[d+37072>>2]|0)!=0){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){s=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{s=0}if(!s){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[k+36>>2]|0)==57345){a=a+1|0}else{e=e+1|0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)!=0){s=c[n>>2]|0;q=a;r=e;o=c[d+37048>>2]|0;au(s|0,23280,(h=i,i=i+24|0,c[h>>2]=q,c[h+8>>2]=r,c[h+16>>2]=o,h)|0)|0;i=h}a=1;while(1){if((a|0)==0){break}a=0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){t=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{t=0}if(!t){break}p=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[p+36>>2]|0)==57345){if((c[p+72>>2]|0)!=0){break}a=1;while(1){if((a|0)==0){break}a=0;k=0;if((cy(d+84|0)|0)==0){L10681:while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){u=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{u=0}if(!u){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((k|0)!=(p|0)){if((c[k+72>>2]|0)!=0){break}if((c[k+36>>2]|0)!=57345){break}if((em(k,p)|0)!=0){v=7824}else{if((em(p,k)|0)!=0){v=7824}}if((v|0)==7824){v=0;if(((c[k+4>>2]|0)-(c[k>>2]|0)+1|0)>(c[d+37032>>2]<<1|0)){v=7829;break L10681}if(((c[k+4>>2]|0)-(c[k>>2]|0)+1|0)<((c[d+37032>>2]|0)/2|0|0)){v=7829;break L10681}if(((c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0)>(c[d+37036>>2]<<1|0)){v=7829;break L10681}if(((c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0)<((c[d+37036>>2]|0)/2|0|0)){v=7829;break L10681}if((en(k,p)|0)!=0){v=7829;break L10681}}}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}if((v|0)==7829){v=0;if((c[k>>2]|0)<(c[p>>2]|0)){c[p>>2]=c[k>>2]}if((c[k+4>>2]|0)>(c[p+4>>2]|0)){c[p+4>>2]=c[k+4>>2]}if((c[k+8>>2]|0)<(c[p+8>>2]|0)){c[p+8>>2]=c[k+8>>2]}if((c[k+12>>2]|0)>(c[p+12>>2]|0)){c[p+12>>2]=c[k+12>>2]}a=1}cz(d+84|0)}do{if((a|0)!=0){if((k|0)==0){break}o=d+84|0;r=k;cw(o,r)|0;r=k;bV(r)|0;f=f+1|0}}while(0)}}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)!=0){p=c[n>>2]|0;v=f;au(p|0,19824,(h=i,i=i+8|0,c[h>>2]=v,h)|0)|0;i=h}a=0;e=0;if((c[d+37072>>2]|0)!=0){if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){w=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{w=0}if(!w){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[k+36>>2]|0)==57345){v=c[n>>2]|0;p=c[k>>2]|0;f=c[k+8>>2]|0;u=(c[k+4>>2]|0)-(c[k>>2]|0)+1|0;t=(c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0;au(v|0,19176,(h=i,i=i+32|0,c[h>>2]=p,c[h+8>>2]=f,c[h+16>>2]=u,c[h+24>>2]=t,h)|0)|0;i=h;a=a+1|0}else{e=e+1|0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}}if((c[d+37072>>2]|0)==0){i=b;return 0}k=c[d+37048>>2]|0;au(c[n>>2]|0,18456,(h=i,i=i+24|0,c[h>>2]=a,c[h+8>>2]=e,c[h+16>>2]=k,h)|0)|0;i=h;i=b;return 0}function ep(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;e=a;a=b;b=0;f=c[e+37072>>2]|0;g=c[e+37052>>2]|0;h=0;j=0;k=0;if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){l=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{l=0}if(!l){break}k=k+1|0;c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}b=ei(k,17880)|0;k=0;if((f|0)!=0){l=c[n>>2]|0;au(l|0,17536,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((cy(e+84|0)|0)==0){while(1){if((c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=0){o=(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)!=(e+96|0)}else{o=0}if(!o){break}l=c[(c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[l+36>>2]|0)==57344){p=c[l>>2]|0;q=c[l+4>>2]|0;r=c[l+8>>2]|0;s=c[l+12>>2]|0;t=p;L10779:while(1){if((t+4|0)>=(q|0)){break}t=t+(dC(a,t,r,q-p|0,g,0,3)|0)|0;u=dC(a,t,r,q-p|0,g,1,3)|0;if((t+u|0)>(q+1|0)){v=7892;break}w=dC(a,t,r+1|0,q-p|0,g,1,3)|0;if((w|0)>(u|0)){u=w}if((t+u|0)>(q+1|0)){v=7896;break}x=0;y=0;z=0;A=t;while(1){if((A|0)>=(t+u|0)){break}B=dC(a,A,r,s-r|0,g,0,2)|0;if((B<<3|0)>(s-r|0)){v=7900;break}B=B+(dC(a,A,r+B|0,s-r|0,g,1,2)|0)|0;if((B<<3|0)<=(s-r|0)){if((B<<3|0)<(s-r|0)){z=z+B|0;y=y+1|0}}A=A+1|0}if((v|0)==7900){v=0}if((y|0)==0){t=t+u|0;continue}w=r+((z+y-1|0)/(y|0)|0)+((s-r+1|0)/32|0)|0;if((f&1|0)!=0){C=c[n>>2]|0;D=p;E=r;F=t-p|0;G=u;H=w-r|0;au(C|0,17152,(m=i,i=i+40|0,c[m>>2]=D,c[m+8>>2]=E,c[m+16>>2]=F,c[m+24>>2]=G,c[m+32>>2]=H,m)|0)|0;i=m}if((dC(a,t,w,q-p|0,g,0,3)|0)<1){t=t+u|0;continue}if((dv(t,t+u|0,w,w,a,g)|0)<2){t=t+u|0;continue}if((f&1|0)!=0){H=c[n>>2]|0;au(H|0,16904,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}z=t+(dC(a,t,w,q-p|0,g,0,3)|0)|0;z=z+(dC(a,z,w,q-p|0,g,1,3)|0)|0;B=dC(a,z,w,q-p|0,g,0,3)|0;if((B|0)<2){t=t+u|0;continue}z=z+((B|0)/2|0)|0;y=z+(dC(a,z,w,q-z|0,g,0,3)|0)|0;B=z+(dC(a,z,w+1|0,q-z|0,g,0,3)|0)|0;if((B|0)>(y|0)){y=B}y=y+(dC(a,y,w,q-y|0,g,1,3)|0)|0;B=dC(a,y,w,q-y|0,g,0,3)|0;do{if((B|0)>=2){if((y|0)>=(t+u|0)){break}y=y+((B|0)/2|0)|0;if((u|0)>5){h=h+1|0;w=0;while(1){if((w|0)>=((s-r+5|0)/8|0|0)){break}d9(a,z,r+w|0,255,192);w=w+1|0}if((f&4|0)!=0){H=c[n>>2]|0;au(H|0,16464,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;dk(l);H=c[n>>2]|0;G=z-p|0;F=w;E=t-p|0;D=y-p|0;au(H|0,16088,(m=i,i=i+32|0,c[m>>2]=G,c[m+8>>2]=F,c[m+16>>2]=E,c[m+24>>2]=D,m)|0)|0;i=m}I=0;J=0;while(1){if((J|0)>=((q-p+4|0)/8|0|0)){break}B=s;do{if((c[l+60>>2]|0)>(r|0)){if((s<<1|0)<=((c[l+60>>2]|0)+(c[l+64>>2]|0)|0)){break}B=c[l+60>>2]|0}}while(0);if((dC(a,z-J|0,B,B-r|0,g,0,1)|0)>((s-r+1|0)/2|0|0)){if((dC(a,z,(r+s|0)/2|0,J+1|0,g,0,4)|0)>=(J|0)){v=7938;break}}if((dC(a,z+J|0,B,B-r|0,g,0,1)|0)>((s-r+1|0)/2|0|0)){if((dC(a,z,(r+s|0)/2|0,J+1|0,g,0,3)|0)>=(J|0)){v=7941;break}}J=J+1|0}if((v|0)==7941){v=0;I=J}else if((v|0)==7938){v=0;I=-J|0}do{if(((du(z,z,r,(r+s|0)/2|0,a,g,1)|0)<<24>>24|0)==0){if(((du(z+I|0,z+I|0,(r+s|0)/2|0,B,a,g,1)|0)<<24>>24|0)!=0){break}K=bU(l)|0;c[K+4>>2]=z-1;c[l>>2]=z+1;q=c[l+4>>2]|0;D=l;bY(D)|0;D=K;bY(D)|0;c[K+44>>2]=c[e+37048>>2];D=e+84|0;E=l;F=K;ct(D,E,F)|0;F=e+37048|0;c[F>>2]=(c[F>>2]|0)+1;j=j+1|0;if((f&4|0)!=0){F=c[n>>2]|0;au(F|0,15736,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}F=c[l>>2]|0;p=F;t=F;u=0}}while(0)}t=t+u|0;continue L10779}}while(0);t=t+u|0}if((v|0)==7892){v=0}else if((v|0)==7896){v=0}t=p;L10866:while(1){if((t|0)>=(q|0)){break}t=t+(dC(a,t,s,q-p|0,g,0,3)|0)|0;u=dC(a,t,s,q-p|0,g,1,3)|0;if((t+u|0)>(q+1|0)){v=7954;break}w=dC(a,t,s-1|0,q-p|0,g,1,3)|0;if((w|0)>(u|0)){u=w}if((t+u|0)>(q+1|0)){v=7958;break}x=0;y=0;z=0;A=t;while(1){if((A|0)>=(t+u|0)){break}B=dC(a,A,s,s-r|0,g,0,1)|0;if((B<<3|0)>(s-r|0)){v=7962;break}B=B+(dC(a,A,s-B|0,s-r|0,g,1,1)|0)|0;if((B<<3|0)<=(s-r|0)){if((B<<3|0)<(s-r|0)){z=z+B|0;y=y+1|0}}A=A+1|0}if((v|0)==7962){v=0}if((y|0)==0){t=t+u|0;continue}w=s-((z+y-1|0)/(y|0)|0)-((s-r+1|0)/32|0)|0;if((f&1|0)!=0){F=c[n>>2]|0;E=p;D=r;G=t-p|0;H=u;C=s-w|0;au(F|0,15376,(m=i,i=i+40|0,c[m>>2]=E,c[m+8>>2]=D,c[m+16>>2]=G,c[m+24>>2]=H,c[m+32>>2]=C,m)|0)|0;i=m}if((dC(a,t,w,q-p|0,g,0,3)|0)<1){t=t+u|0;continue}if((dv(t,t+u|0,w,w,a,g)|0)<2){t=t+u|0;continue}if((f&1|0)!=0){C=c[n>>2]|0;au(C|0,16904,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}z=t+(dC(a,t,w,q-p|0,g,0,3)|0)|0;z=z+(dC(a,z,w,q-p|0,g,1,3)|0)|0;B=dC(a,z,w,q-p|0,g,0,3)|0;if((B|0)<2){t=t+u|0;continue}z=z+((B|0)/2|0)|0;y=z+(dC(a,z,w,q-z|0,g,0,3)|0)|0;B=z+(dC(a,z,w-1|0,q-z|0,g,0,3)|0)|0;if((B|0)>(y|0)){y=B}y=y+(dC(a,y,w,q-y|0,g,1,3)|0)|0;B=dC(a,y,w,q-y|0,g,0,3)|0;do{if((B|0)>=2){if((y|0)>=(t+u|0)){break}y=y+((B|0)/2|0)|0;if((u|0)>5){h=h+1|0;B=0;while(1){if((B|0)>=((s-r+5|0)/8|0|0)){break}d9(a,z,s-B|0,255,192);B=B+1|0}if((f&4|0)!=0){C=c[n>>2]|0;au(C|0,16464,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;dk(l);C=c[n>>2]|0;H=z-p|0;G=w-r|0;D=t-p|0;E=y-p|0;au(C|0,16088,(m=i,i=i+32|0,c[m>>2]=H,c[m+8>>2]=G,c[m+16>>2]=D,c[m+24>>2]=E,m)|0)|0;i=m}I=0;J=0;while(1){if((J|0)>=((q-p+4|0)/8|0|0)){break}if((dC(a,z-J|0,r,s-r|0,g,0,2)|0)>((s-r+1|0)/2|0|0)){if((dC(a,z,(r+s|0)/2|0,J+1|0,g,0,4)|0)>=(J|0)){v=7997;break}}if((dC(a,z+J|0,r,s-r|0,g,0,2)|0)>((s-r+1|0)/2|0|0)){if((dC(a,z,(r+s|0)/2|0,J+1|0,g,0,3)|0)>=(J|0)){v=8e3;break}}J=J+1|0}if((v|0)==7997){v=0;I=-J|0}else if((v|0)==8e3){v=0;I=J}do{if(((du(z,z,(r+s|0)/2|0,s,a,g,1)|0)<<24>>24|0)==0){if(((du(z+I|0,z+I|0,r,(r+s|0)/2|0,a,g,1)|0)<<24>>24|0)!=0){break}K=bU(l)|0;c[K+4>>2]=z-1;c[l>>2]=z;q=c[l+4>>2]|0;E=l;bY(E)|0;E=K;bY(E)|0;c[K+44>>2]=c[e+37048>>2];E=e+84|0;D=l;G=K;ct(E,D,G)|0;G=e+37048|0;c[G>>2]=(c[G>>2]|0)+1;j=j+1|0;if((f&4|0)!=0){G=c[n>>2]|0;au(G|0,15736,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}G=c[l>>2]|0;p=G;t=G;u=0}}while(0)}t=t+u|0;continue L10866}}while(0);t=t+u|0}if((v|0)==7958){v=0}else if((v|0)==7954){v=0}t=k;k=t+1|0;ek(t,b)|0}c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]=c[c[(c[e+108>>2]|0)+(c[e+116>>2]<<2)>>2]>>2]}cz(e+84|0)}ej(b)|0;if((f|0)==0){i=d;return 0}au(c[n>>2]|0,14920,(m=i,i=i+16|0,c[m>>2]=h,c[m+8>>2]=j,m)|0)|0;i=m;i=d;return 0}function eq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;b=i;d=a;a=c[d+37072>>2]|0;e=0;f=0;g=0;h=0;if((a|0)!=0){j=c[n>>2]|0;au(j|0,14504,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){l=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{l=0}if(!l){break}m=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[m+36>>2]|0)==57344){o=c[m>>2]|0;p=c[m+4>>2]|0;q=c[m+8>>2]|0;r=c[m+12>>2]|0;j=aa(c[d+37048>>2]<<1,r-q+1|0)|0;do{if((j|0)<((c[d+37044>>2]|0)*3|0|0)){if((r|0)>=((c[(c[m+68>>2]|0)+8>>2]|0)/4|0|0)){if((q|0)<=(((c[(c[m+68>>2]|0)+8>>2]|0)*3|0|0)/4|0|0)){break}}if((c[d+37048>>2]|0)<=1){break}if((c[m+64>>2]|0)!=0){break}s=d+37048|0;c[s>>2]=(c[s>>2]|0)-1;h=h+1|0;s=d+84|0;t=m;cw(s,t)|0;t=m;bV(t)|0;if((a|0)!=0){t=c[n>>2]|0;s=o;u=q;au(t|0,14144,(k=i,i=i+16|0,c[k>>2]=s,c[k+8>>2]=u,k)|0)|0;i=k}}}while(0)}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}f=ei(c[d+112>>2]|0,13864)|0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){v=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{v=0}if(!v){break}m=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;l=e;e=l+1|0;ek(l,f)|0;L10994:do{if((c[m+36>>2]|0)!=57345){o=c[m>>2]|0;p=c[m+4>>2]|0;q=c[m+8>>2]|0;r=c[m+12>>2]|0;do{if((c[m+56>>2]|0)!=0){if((q<<2|0)<=((c[m+56>>2]|0)+((c[m+60>>2]|0)*3|0)|0)){break}if((r<<1|0)>=((c[m+60>>2]|0)+(c[m+64>>2]|0)|0)){break}break L10994}}while(0);do{if((p-o+1|0)<3){if((r-q+1|0)>=3){break}l=0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){w=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{w=0}if(!w){break}j=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L11013:do{if((l|0)!=0){x=8058}else{if((j|0)==(m|0)){x=8058;break}do{if(((c[j+4>>2]|0)-(c[j>>2]|0)+1|0)<3){if(((c[j+12>>2]|0)-(c[j+8>>2]|0)+1|0)>=3){break}break L11013}}while(0);u=P((((c[j>>2]|0)+(c[j+4>>2]|0)|0)/2|0)-(c[m>>2]|0)|0)|0;s=P((((c[j+8>>2]|0)+(c[j+12>>2]|0)|0)/2|0)-(c[m+8>>2]|0)|0)|0;do{if((u<<1|0)<(((c[j+4>>2]|0)-(c[j>>2]|0)+1|0)*3|0|0)){if((s<<1|0)>=(((c[j+12>>2]|0)-(c[j+8>>2]|0)+1|0)*3|0|0)){break}l=1}}while(0)}}while(0);if((x|0)==8058){x=0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((l|0)==0){g=g+1|0;j=d+84|0;s=m;cw(j,s)|0;s=m;bV(s)|0;if((a|0)!=0){s=c[n>>2]|0;j=o;u=q;au(s|0,13200,(k=i,i=i+16|0,c[k>>2]=j,c[k+8>>2]=u,k)|0)|0;i=k}}}}while(0)}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}ej(f)|0;if((a|0)==0){i=b;return 0}a=c[d+37048>>2]|0;au(c[n>>2]|0,12464,(k=i,i=i+24|0,c[k>>2]=h,c[k+8>>2]=g,c[k+16>>2]=a,k)|0)|0;i=k;i=b;return 0}function er(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a;a=b;L11044:do{if((e|0)==57344){f=8083}else{if((e|0)==57345){f=8083;break}do{if((e|0)>127){if((a|0)==0){break}if((a|0)==32){break}if((c[6366]|0)==0){break}b=c[n>>2]|0;g=a;h=e;au(b|0,6520,(j=i,i=i+16|0,c[j>>2]=g,c[j+8>>2]=h,j)|0)|0;i=j}}while(0);L11053:do{switch(a|0){case 39:{au(c[n>>2]|0,18864,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;f=8092;break};case 184:{h=e;if((h|0)==67){k=199;break L11044}else if((h|0)==99){k=231;break L11044}else{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,7992,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}break};case 0:case 32:{k=e;break L11044;break};case 96:{switch(e|0){case 111:{k=242;break L11044;break};case 79:{k=210;break L11044;break};case 85:{k=217;break L11044;break};case 110:{k=505;break L11044;break};case 78:{k=504;break L11044;break};case 101:{k=232;break L11044;break};case 69:{k=200;break L11044;break};case 97:{k=224;break L11044;break};case 65:{k=192;break L11044;break};case 105:{k=236;break L11044;break};case 73:{k=204;break L11044;break};case 48:{k=210;break L11044;break};case 117:{k=249;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,5792,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11053}}break};case 729:{switch(e|0){case 108:{k=105;break L11044;break};case 105:{k=105;break L11044;break};case 305:{k=105;break L11044;break};case 73:{k=304;break L11044;break};case 97:{k=551;break L11044;break};case 65:{k=550;break L11044;break};case 99:{k=267;break L11044;break};case 67:{k=266;break L11044;break};case 90:{k=379;break L11044;break};case 44:{k=59;break L11044;break};case 46:{k=58;break L11044;break};case 106:{k=106;break L11044;break};case 111:{k=559;break L11044;break};case 79:{k=558;break L11044;break};case 122:{k=380;break L11044;break};case 101:{k=279;break L11044;break};case 69:{k=278;break L11044;break};case 103:{k=289;break L11044;break};case 71:{k=288;break L11044;break};default:{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,24056,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}}break};case 180:{f=8092;break};case 34:{au(c[n>>2]|0,18864,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;f=8207;break};case 126:{switch(e|0){case 48:{k=213;break L11044;break};case 117:{k=361;break L11044;break};case 111:{k=245;break L11044;break};case 79:{k=213;break L11044;break};case 105:{k=297;break L11044;break};case 73:{k=296;break L11044;break};case 85:{k=360;break L11044;break};case 97:{k=227;break L11044;break};case 65:{k=195;break L11044;break};case 110:{k=241;break L11044;break};case 78:{k=209;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,6744,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11053}}break};case 175:{switch(e|0){case 73:{k=298;break L11044;break};case 111:{k=333;break L11044;break};case 79:{k=332;break L11044;break};case 97:{k=257;break L11044;break};case 65:{k=256;break L11044;break};case 117:{k=363;break L11044;break};case 85:{k=362;break L11044;break};case 121:{k=563;break L11044;break};case 89:{k=562;break L11044;break};case 230:{k=483;break L11044;break};case 198:{k=482;break L11044;break};case 101:{k=275;break L11044;break};case 69:{k=274;break L11044;break};case 105:{k=299;break L11044;break};case 61:{k=8801;break L11044;break};case 45:{k=61;break L11044;break};case 32:{k=713;break L11044;break};default:{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,24792,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}}break};case 94:{switch(e|0){case 87:{k=372;break L11044;break};case 121:{k=375;break L11044;break};case 89:{k=374;break L11044;break};case 117:{k=251;break L11044;break};case 85:{k=219;break L11044;break};case 119:{k=373;break L11044;break};case 65:{k=194;break L11044;break};case 99:{k=265;break L11044;break};case 67:{k=264;break L11044;break};case 105:{k=238;break L11044;break};case 73:{k=206;break L11044;break};case 106:{k=309;break L11044;break};case 101:{k=234;break L11044;break};case 69:{k=202;break L11044;break};case 103:{k=285;break L11044;break};case 74:{k=308;break L11044;break};case 111:{k=244;break L11044;break};case 79:{k=212;break L11044;break};case 97:{k=226;break L11044;break};case 71:{k=284;break L11044;break};case 104:{k=293;break L11044;break};case 72:{k=292;break L11044;break};case 48:{k=212;break L11044;break};case 115:{k=349;break L11044;break};case 83:{k=348;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,3912,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11053}}break};case 730:{h=e;if((h|0)==97){k=229;break L11044}else if((h|0)==65){k=197;break L11044}else if((h|0)==117){k=367;break L11044}else if((h|0)==85){k=366;break L11044}else{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,23216,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}break};case 101:case 69:{switch(e|0){case 97:{k=230;break L11044;break};case 65:{k=198;break L11044;break};case 111:{k=339;break L11044;break};case 79:{k=338;break L11044;break};case 48:{k=338;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,21496,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11053}}break};case 103:{switch(e|0){case 67:{k=935;break L11044;break};case 86:{k=936;break L11044;break};case 87:{k=937;break L11044;break};case 97:{k=945;break L11044;break};case 98:{k=946;break L11044;break};case 103:{k=947;break L11044;break};case 80:{k=928;break L11044;break};case 82:{k=929;break L11044;break};case 83:{k=931;break L11044;break};case 84:{k=932;break L11044;break};case 89:{k=933;break L11044;break};case 70:{k=934;break L11044;break};case 65:{k=913;break L11044;break};case 66:{k=914;break L11044;break};case 71:{k=915;break L11044;break};case 118:{k=968;break L11044;break};case 119:{k=969;break L11044;break};case 75:{k=922;break L11044;break};case 76:{k=923;break L11044;break};case 77:{k=924;break L11044;break};case 78:{k=925;break L11044;break};case 88:{k=926;break L11044;break};case 79:{k=927;break L11044;break};case 100:{k=948;break L11044;break};case 101:{k=949;break L11044;break};case 122:{k=950;break L11044;break};case 104:{k=951;break L11044;break};case 113:{k=952;break L11044;break};case 105:{k=953;break L11044;break};case 107:{k=954;break L11044;break};case 108:{k=955;break L11044;break};case 109:{k=956;break L11044;break};case 110:{k=957;break L11044;break};case 120:{k=958;break L11044;break};case 111:{k=959;break L11044;break};case 112:{k=960;break L11044;break};case 114:{k=961;break L11044;break};case 38:{k=962;break L11044;break};case 115:{k=963;break L11044;break};case 116:{k=964;break L11044;break};case 121:{k=965;break L11044;break};case 102:{k=966;break L11044;break};case 99:{k=967;break L11044;break};case 68:{k=916;break L11044;break};case 69:{k=917;break L11044;break};case 90:{k=918;break L11044;break};case 72:{k=919;break L11044;break};case 81:{k=920;break L11044;break};case 73:{k=921;break L11044;break};default:{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,20424,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}}break};case 168:{f=8207;break};case 711:{switch(e|0){case 90:{k=381;break L11044;break};case 99:{k=269;break L11044;break};case 105:{k=464;break L11044;break};case 111:{k=466;break L11044;break};case 101:{k=283;break L11044;break};case 83:{k=352;break L11044;break};case 48:{k=465;break L11044;break};case 79:{k=465;break L11044;break};case 85:{k=467;break L11044;break};case 115:{k=353;break L11044;break};case 69:{k=282;break L11044;break};case 122:{k=382;break L11044;break};case 73:{k=463;break L11044;break};case 67:{k=268;break L11044;break};case 117:{k=468;break L11044;break};case 65:{k=461;break L11044;break};case 97:{k=462;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,8896,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11053}}break};case 728:{switch(e|0){case 103:{k=287;break L11044;break};case 105:{k=301;break L11044;break};case 117:{k=365;break L11044;break};case 85:{k=364;break L11044;break};case 65:{k=258;break L11044;break};case 73:{k=300;break L11044;break};case 79:{k=334;break L11044;break};case 101:{k=277;break L11044;break};case 71:{k=286;break L11044;break};case 69:{k=276;break L11044;break};case 97:{k=259;break L11044;break};case 111:{k=335;break L11044;break};default:{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;au(h|0,10440,(j=i,i=i+8|0,c[j>>2]=g,j)|0)|0;i=j}break L11053}}break};default:{au(c[n>>2]|0,19728,(j=i,i=i+8|0,c[j>>2]=a,j)|0)|0;i=j}}}while(0);L11309:do{if((f|0)==8092){switch(e|0){case 83:{k=346;break L11044;break};case 85:{k=218;break L11044;break};case 90:{k=377;break L11044;break};case 110:{k=324;break L11044;break};case 99:{k=263;break L11044;break};case 105:{k=237;break L11044;break};case 73:{k=205;break L11044;break};case 108:{k=314;break L11044;break};case 101:{k=233;break L11044;break};case 76:{k=313;break L11044;break};case 78:{k=323;break L11044;break};case 79:{k=211;break L11044;break};case 117:{k=250;break L11044;break};case 230:{k=509;break L11044;break};case 122:{k=378;break L11044;break};case 89:{k=221;break L11044;break};case 71:{k=500;break L11044;break};case 65:{k=193;break L11044;break};case 111:{k=243;break L11044;break};case 82:{k=340;break L11044;break};case 114:{k=341;break L11044;break};case 121:{k=253;break L11044;break};case 48:{k=211;break L11044;break};case 69:{k=201;break L11044;break};case 97:{k=225;break L11044;break};case 103:{k=501;break L11044;break};case 115:{k=347;break L11044;break};case 67:{k=262;break L11044;break};case 198:{k=508;break L11044;break};default:{if((c[6366]|0)!=0){g=c[n>>2]|0;h=e;au(g|0,14752,(j=i,i=i+8|0,c[j>>2]=h,j)|0)|0;i=j}break L11309}}}else if((f|0)==8207){switch(e|0){case 73:{k=207;break L11044;break};case 111:{k=246;break L11044;break};case 65:{k=196;break L11044;break};case 101:{k=235;break L11044;break};case 79:{k=214;break L11044;break};case 48:{k=214;break L11044;break};case 69:{k=203;break L11044;break};case 105:{k=239;break L11044;break};case 117:{k=252;break L11044;break};case 85:{k=220;break L11044;break};case 121:{k=255;break L11044;break};case 89:{k=376;break L11044;break};case 97:{k=228;break L11044;break};default:{if((c[6366]|0)!=0){h=c[n>>2]|0;g=e;b=(e&255)<<24>>24;au(h|0,4792,(j=i,i=i+16|0,c[j>>2]=g,c[j+8>>2]=b,j)|0)|0;i=j}break L11309}}}}while(0);k=e}}while(0);if((f|0)==8083){k=e}i=d;return k|0}function es(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=b;c[822]=(c[822]|0)+32;if((c[822]|0)>>>0>=27648>>>0){c[822]=27392}a[(c[822]|0)+2|0]=0;a[(c[822]|0)+1|0]=0;a[c[822]|0]=0;L11374:do{switch(d|0){case 4:{aP(c[822]|0,11928,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;h=c[822]|0;break};case 6:{do{if((f|0)!=10){if((f|0)>=32){if((f|0)<=127){break}}b=f;if((b|0)==57344){h=11672;break L11374}else if((b|0)==57345){h=11672;break L11374}else{if(f>>>0>255>>>0){b=c[822]|0;j=f;aP(b|0,11456,(g=i,i=i+8|0,c[g>>2]=j,g)|0)|0;i=g}else{j=c[822]|0;b=f;aP(j|0,11400,(g=i,i=i+8|0,c[g>>2]=b,g)|0)|0;i=g}h=c[822]|0;break L11374}}}while(0);a[c[822]|0]=f&255;h=c[822]|0;break};case 0:{if((f|0)<=255){a[c[822]|0]=f&255;h=c[822]|0;break L11374}b=f;if((b|0)==8227){h=14480;break L11374}else if((b|0)==8212){h=17856;break L11374}else if((b|0)==8221){h=15720;break L11374}else if((b|0)==8231){h=19072;break L11374}else if((b|0)==8208){h=19072;break L11374}else if((b|0)==8219){h=16432;break L11374}else if((b|0)==8226){h=14480;break L11374}else if((b|0)==8223){h=16432;break L11374}else if((b|0)==8210|(b|0)==8211){h=18400;break L11374}else if((b|0)==8216){h=17512;break L11374}else if((b|0)==8224){h=14864;break L11374}else if((b|0)==8218){h=16888;break L11374}else if((b|0)==8225){h=14480;break L11374}else if((b|0)==8217){h=17128;break L11374}else if((b|0)==8220){h=16072;break L11374}else if((b|0)==8222){h=15352;break L11374}else if((b|0)==8230){h=14128;break L11374}else if((b|0)==8240){h=13840;break L11374}else if((b|0)==8249){h=13192;break L11374}else if((b|0)==8250){h=12456;break L11374}else if((b|0)==8364){h=11976;break L11374}else if((b|0)==64256){h=11344;break L11374}else if((b|0)==64257){h=11016;break L11374}else if((b|0)==64258){h=10880;break L11374}else if((b|0)==64259){h=10488;break L11374}else if((b|0)==64260){h=10160;break L11374}else if((b|0)==64261|(b|0)==64262){h=10032;break L11374}else if((b|0)==57344){h=9864;break L11374}else if((b|0)==57345){h=9864;break L11374}else{aP(c[822]|0,9744,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;h=c[822]|0;break L11374}break};case 2:{do{if((f|0)>=32){if((f|0)>126){break}switch(f|0){case 38:{h=16920;break L11374;break};case 39:{h=16896;break L11374;break};case 34:{h=16840;break L11374;break};case 60:{h=16832;break L11374;break};case 62:{h=16808;break L11374;break};default:{a[c[822]|0]=f&255;h=c[822]|0;break L11374}}}}while(0);b=f;if((b|0)==171){h=16264;break L11374}else if((b|0)==172){h=16232;break L11374}else if((b|0)==173){h=16224;break L11374}else if((b|0)==174){h=16080;break L11374}else if((b|0)==183){h=15760;break L11374}else if((b|0)==184){h=15728;break L11374}else if((b|0)==185){h=15712;break L11374}else if((b|0)==186){h=15704;break L11374}else if((b|0)==12|(b|0)==13){h=16784;break L11374}else if((b|0)==160){h=16648;break L11374}else if((b|0)==161){h=16600;break L11374}else if((b|0)==168){h=16384;break L11374}else if((b|0)==169){h=16328;break L11374}else if((b|0)==170){h=16272;break L11374}else if((b|0)==175){h=16032;break L11374}else if((b|0)==176){h=16024;break L11374}else if((b|0)==177){h=16e3;break L11374}else if((b|0)==178){h=15952;break L11374}else if((b|0)==187){h=15688;break L11374}else if((b|0)==188){h=15672;break L11374}else if((b|0)==189){h=15656;break L11374}else if((b|0)==190){h=15584;break L11374}else if((b|0)==191){h=15568;break L11374}else if((b|0)==192){h=15480;break L11374}else if((b|0)==193){h=15464;break L11374}else if((b|0)==258){h=15360;break L11374}else if((b|0)==238){h=13136;break L11374}else if((b|0)==239){h=13128;break L11374}else if((b|0)==240){h=13120;break L11374}else if((b|0)==241){h=13072;break L11374}else if((b|0)==242){h=12608;break L11374}else if((b|0)==243){h=12536;break L11374}else if((b|0)==215){h=14432;break L11374}else if((b|0)==216){h=14416;break L11374}else if((b|0)==352){h=14296;break L11374}else if((b|0)==217){h=14280;break L11374}else if((b|0)==218){h=14192;break L11374}else if((b|0)==205){h=14800;break L11374}else if((b|0)==206){h=14744;break L11374}else if((b|0)==207){h=14656;break L11374}else if((b|0)==208){h=14648;break L11374}else if((b|0)==209){h=14576;break L11374}else if((b|0)==194){h=15344;break L11374}else if((b|0)==195){h=15304;break L11374}else if((b|0)==196){h=15280;break L11374}else if((b|0)==197){h=15272;break L11374}else if((b|0)==210){h=14560;break L11374}else if((b|0)==211){h=14488;break L11374}else if((b|0)==212){h=14472;break L11374}else if((b|0)==213){h=14456;break L11374}else if((b|0)==214){h=14440;break L11374}else if((b|0)==198){h=15264;break L11374}else if((b|0)==268){h=15128;break L11374}else if((b|0)==199){h=15112;break L11374}else if((b|0)==200){h=15040;break L11374}else if((b|0)==233){h=13288;break L11374}else if((b|0)==283){h=13264;break L11374}else if((b|0)==234){h=13256;break L11374}else if((b|0)==235){h=13184;break L11374}else if((b|0)==236){h=13168;break L11374}else if((b|0)==237){h=13152;break L11374}else if((b|0)==201){h=15024;break L11374}else if((b|0)==282){h=14904;break L11374}else if((b|0)==202){h=14856;break L11374}else if((b|0)==203){h=14840;break L11374}else if((b|0)==204){h=14816;break L11374}else if((b|0)==219){h=14184;break L11374}else if((b|0)==220){h=14136;break L11374}else if((b|0)==221){h=14112;break L11374}else if((b|0)==381){h=14096;break L11374}else if((b|0)==222){h=14080;break L11374}else if((b|0)==223){h=14072;break L11374}else if((b|0)==57345){h=16792;break L11374}else if((b|0)==57344){h=9864;break L11374}else if((b|0)==10){h=16784;break L11374}else if((b|0)==228){h=13832;break L11374}else if((b|0)==229){h=13824;break L11374}else if((b|0)==230){h=13800;break L11374}else if((b|0)==269){h=13784;break L11374}else if((b|0)==231){h=13768;break L11374}else if((b|0)==232){h=13704;break L11374}else if((b|0)==162){h=16568;break L11374}else if((b|0)==163){h=16472;break L11374}else if((b|0)==164){h=16448;break L11374}else if((b|0)==244){h=12528;break L11374}else if((b|0)==245){h=12504;break L11374}else if((b|0)==246){h=12424;break L11374}else if((b|0)==247){h=12408;break L11374}else if((b|0)==248){h=12360;break L11374}else if((b|0)==353){h=12344;break L11374}else if((b|0)==179){h=15944;break L11374}else if((b|0)==180){h=15864;break L11374}else if((b|0)==181){h=15856;break L11374}else if((b|0)==182){h=15776;break L11374}else if((b|0)==165){h=16424;break L11374}else if((b|0)==166){h=16408;break L11374}else if((b|0)==167){h=16392;break L11374}else if((b|0)==249){h=12328;break L11374}else if((b|0)==250){h=12232;break L11374}else if((b|0)==251){h=12088;break L11374}else if((b|0)==252){h=12056;break L11374}else if((b|0)==253){h=12040;break L11374}else if((b|0)==254){h=12016;break L11374}else if((b|0)==255){h=11968;break L11374}else if((b|0)==382){h=11952;break L11374}else if((b|0)==8364){h=11936;break L11374}else if((b|0)==0){h=27656;break L11374}else if((b|0)==224){h=14056;break L11374}else if((b|0)==225){h=13992;break L11374}else if((b|0)==259){h=13936;break L11374}else if((b|0)==462){h=13896;break L11374}else if((b|0)==226){h=13888;break L11374}else if((b|0)==227){h=13848;break L11374}else{aP(c[822]|0,11928,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;h=c[822]|0;break L11374}break};case 3:{do{if((f|0)>=32){if((f|0)>126){break}switch(f|0){case 38:{h=16920;break L11374;break};case 39:{h=16896;break L11374;break};case 34:{h=16840;break L11374;break};case 60:{h=16832;break L11374;break};case 62:{h=16808;break L11374;break};default:{a[c[822]|0]=f&255;h=c[822]|0;break L11374}}}}while(0);b=f;if((b|0)==0){h=27656;break L11374}else if((b|0)==57345){h=16968;break L11374}else if((b|0)==57344){h=9864;break L11374}else if((b|0)==10|(b|0)==12|(b|0)==13){h=16784;break L11374}else if((b|0)==160){h=16648;break L11374}else{aP(c[822]|0,11856,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;h=c[822]|0;break L11374}break};case 1:{do{if((f|0)>=32){if((f|0)>126){break}switch(f|0){case 36:{h=9632;break L11374;break};case 38:{h=9464;break L11374;break};case 37:{h=9320;break L11374;break};case 35:{h=9160;break L11374;break};case 95:{h=9064;break L11374;break};case 123:{h=8944;break L11374;break};case 125:{h=8832;break L11374;break};case 92:{h=8728;break L11374;break};case 126:{h=8656;break L11374;break};case 94:{h=8616;break L11374;break};default:{a[c[822]|0]=f&255;h=c[822]|0;break L11374}}}}while(0);b=f;if((b|0)==248){h=20808;break L11374}else if((b|0)==219){h=24408;break L11374}else if((b|0)==224){h=23968;break L11374}else if((b|0)==8221){h=15720;break L11374}else if((b|0)==8222){h=17296;break L11374}else if((b|0)==8223){h=16432;break L11374}else if((b|0)==237){h=22728;break L11374}else if((b|0)==8734){h=17064;break L11374}else if((b|0)==0){h=27656;break L11374}else if((b|0)==57344){h=9064;break L11374}else if((b|0)==208){h=16432;break L11374}else if((b|0)==206){h=3848;break L11374}else if((b|0)==64259){h=10488;break L11374}else if((b|0)==64260){h=10160;break L11374}else if((b|0)==64261|(b|0)==64262){h=10032;break L11374}else if((b|0)==938){h=16432;break L11374}else if((b|0)==939){h=16432;break L11374}else if((b|0)==936){h=18728;break L11374}else if((b|0)==937){h=18600;break L11374}else if((b|0)==241){h=21960;break L11374}else if((b|0)==8210|(b|0)==8211){h=18400;break L11374}else if((b|0)==8212){h=17856;break L11374}else if((b|0)==245){h=21296;break L11374}else if((b|0)==940){h=16432;break L11374}else if((b|0)==941){h=16432;break L11374}else if((b|0)==239){h=22032;break L11374}else if((b|0)==225){h=23880;break L11374}else if((b|0)==251){h=20512;break L11374}else if((b|0)==218){h=24568;break L11374}else if((b|0)==253){h=20376;break L11374}else if((b|0)==230){h=23544;break L11374}else if((b|0)==216){h=24720;break L11374}else if((b|0)==382){h=20328;break L11374}else if((b|0)==950){h=18192;break L11374}else if((b|0)==951){h=18128;break L11374}else if((b|0)==944){h=16432;break L11374}else if((b|0)==945){h=18552;break L11374}else if((b|0)==932){h=19008;break L11374}else if((b|0)==933){h=18976;break L11374}else if((b|0)==948){h=18344;break L11374}else if((b|0)==949){h=18256;break L11374}else if((b|0)==246){h=21224;break L11374}else if((b|0)==249){h=20648;break L11374}else if((b|0)==229){h=23584;break L11374}else if((b|0)==921){h=19616;break L11374}else if((b|0)==922){h=19592;break L11374}else if((b|0)==217){h=24600;break L11374}else if((b|0)==269){h=23400;break L11374}else if((b|0)==8213){h=16432;break L11374}else if((b|0)==8216){h=17512;break L11374}else if((b|0)==8217){h=17128;break L11374}else if((b|0)==381){h=24224;break L11374}else if((b|0)==255){h=20352;break L11374}else if((b|0)==352){h=24632;break L11374}else if((b|0)==8227){h=17104;break L11374}else if((b|0)==8231){h=6992;break L11374}else if((b|0)==8230){h=17096;break L11374}else if((b|0)==8218){h=17312;break L11374}else if((b|0)==8219){h=16432;break L11374}else if((b|0)==8220){h=16072;break L11374}else if((b|0)==215){h=24768;break L11374}else if((b|0)==213){h=24880;break L11374}else if((b|0)==283){h=23136;break L11374}else if((b|0)==57345){h=16968;break L11374}else if((b|0)==977){h=17448;break L11374}else if((b|0)==978){h=16432;break L11374}else if((b|0)==923){h=19560;break L11374}else if((b|0)==924){h=19464;break L11374}else if((b|0)==207){h=25224;break L11374}else if((b|0)==952){h=18112;break L11374}else if((b|0)==953){h=18064;break L11374}else if((b|0)==964){h=17624;break L11374}else if((b|0)==965){h=17592;break L11374}else if((b|0)==227){h=23776;break L11374}else if((b|0)==203){h=3968;break L11374}else if((b|0)==934){h=18848;break L11374}else if((b|0)==935){h=18792;break L11374}else if((b|0)==252){h=20416;break L11374}else if((b|0)==8240){h=16432;break L11374}else if((b|0)==8249){h=17080;break L11374}else if((b|0)==8250){h=17072;break L11374}else if((b|0)==915){h=20056;break L11374}else if((b|0)==240){h=16432;break L11374}else if((b|0)==235){h=23040;break L11374}else if((b|0)==8208){h=19072;break L11374}else if((b|0)==8209){h=16432;break L11374}else if((b|0)==204){h=3896;break L11374}else if((b|0)==353){h=20760;break L11374}else if((b|0)==247){h=21160;break L11374}else if((b|0)==232){h=23272;break L11374}else if((b|0)==916){h=19952;break L11374}else if((b|0)==974){h=16432;break L11374}else if((b|0)==976){h=16432;break L11374}else if((b|0)==956){h=17920;break L11374}else if((b|0)==957){h=17864;break L11374}else if((b|0)==221){h=24248;break L11374}else if((b|0)==918){h=19816;break L11374}else if((b|0)==927){h=19264;break L11374}else if((b|0)==928){h=19160;break L11374}else if((b|0)==244){h=21336;break L11374}else if((b|0)==234){h=23112;break L11374}else if((b|0)==979){h=16432;break L11374}else if((b|0)==980){h=16432;break L11374}else if((b|0)==214){h=24840;break L11374}else if((b|0)==210){h=25024;break L11374}else if((b|0)==962){h=17736;break L11374}else if((b|0)==963){h=17656;break L11374}else if((b|0)==917){h=19904;break L11374}else if((b|0)==954){h=18008;break L11374}else if((b|0)==955){h=17936;break L11374}else if((b|0)==211){h=24984;break L11374}else if((b|0)==238){h=22200;break L11374}else if((b|0)==960){h=17768;break L11374}else if((b|0)==961){h=17752;break L11374}else if((b|0)==205){h=3872;break L11374}else if((b|0)==212){h=24904;break L11374}else if((b|0)==966){h=17576;break L11374}else if((b|0)==967){h=17520;break L11374}else if((b|0)==220){h=24320;break L11374}else if((b|0)==231){h=23352;break L11374}else if((b|0)==8224){h=17240;break L11374}else if((b|0)==8225){h=17232;break L11374}else if((b|0)==8226){h=17136;break L11374}else if((b|0)==209){h=25152;break L11374}else if((b|0)==981){h=17432;break L11374}else if((b|0)==982){h=17416;break L11374}else if((b|0)==250){h=20608;break L11374}else if((b|0)==236){h=22912;break L11374}else if((b|0)==968){h=17496;break L11374}else if((b|0)==969){h=17480;break L11374}else if((b|0)==222){h=16432;break L11374}else if((b|0)==233){h=23200;break L11374}else if((b|0)==228){h=23720;break L11374}else if((b|0)==929){h=19064;break L11374}else if((b|0)==931){h=19032;break L11374}else if((b|0)==972){h=16432;break L11374}else if((b|0)==973){h=16432;break L11374}else if((b|0)==946){h=18440;break L11374}else if((b|0)==947){h=18384;break L11374}else if((b|0)==958){h=17808;break L11374}else if((b|0)==959){h=17792;break L11374}else if((b|0)==970){h=16432;break L11374}else if((b|0)==971){h=16432;break L11374}else if((b|0)==925){h=19416;break L11374}else if((b|0)==926){h=19288;break L11374}else if((b|0)==243){h=21416;break L11374}else if((b|0)==223){h=24104;break L11374}else if((b|0)==942){h=16432;break L11374}else if((b|0)==943){h=16432;break L11374}else if((b|0)==242){h=21736;break L11374}else if((b|0)==254){h=16432;break L11374}else if((b|0)==913){h=20312;break L11374}else if((b|0)==64256){h=11344;break L11374}else if((b|0)==64257){h=11016;break L11374}else if((b|0)==64258){h=10880;break L11374}else if((b|0)==226){h=23832;break L11374}else if((b|0)==160){h=16432;break L11374}else if((b|0)==161){h=8584;break L11374}else if((b|0)==162){h=8448;break L11374}else if((b|0)==163){h=8368;break L11374}else if((b|0)==8364){h=8232;break L11374}else if((b|0)==164){h=8168;break L11374}else if((b|0)==165){h=8040;break L11374}else if((b|0)==166){h=7896;break L11374}else if((b|0)==167){h=7776;break L11374}else if((b|0)==168){h=7672;break L11374}else if((b|0)==169){h=7568;break L11374}else if((b|0)==170){h=7504;break L11374}else if((b|0)==171){h=7344;break L11374}else if((b|0)==172){h=7208;break L11374}else if((b|0)==173){h=6992;break L11374}else if((b|0)==174){h=6928;break L11374}else if((b|0)==175){h=6824;break L11374}else if((b|0)==176){h=6712;break L11374}else if((b|0)==177){h=6656;break L11374}else if((b|0)==178){h=6616;break L11374}else if((b|0)==179){h=6568;break L11374}else if((b|0)==180){h=6472;break L11374}else if((b|0)==181){h=6240;break L11374}else if((b|0)==182){h=6128;break L11374}else if((b|0)==183){h=5968;break L11374}else if((b|0)==184){h=5936;break L11374}else if((b|0)==185){h=5848;break L11374}else if((b|0)==186){h=5720;break L11374}else if((b|0)==187){h=5664;break L11374}else if((b|0)==188){h=5560;break L11374}else if((b|0)==189){h=5472;break L11374}else if((b|0)==190){h=5408;break L11374}else if((b|0)==191){h=5208;break L11374}else if((b|0)==192){h=5080;break L11374}else if((b|0)==193){h=4984;break L11374}else if((b|0)==194){h=4960;break L11374}else if((b|0)==195){h=4848;break L11374}else if((b|0)==196){h=4768;break L11374}else if((b|0)==197){h=4720;break L11374}else if((b|0)==198){h=4672;break L11374}else if((b|0)==268){h=4632;break L11374}else if((b|0)==199){h=4560;break L11374}else if((b|0)==200){h=4312;break L11374}else if((b|0)==201){h=4192;break L11374}else if((b|0)==282){h=4080;break L11374}else if((b|0)==202){h=4032;break L11374}else if((b|0)==919){h=19720;break L11374}else if((b|0)==920){h=19648;break L11374}else if((b|0)==914){h=20136;break L11374}else{aP(c[822]|0,16928,(g=i,i=i+8|0,c[g>>2]=f,g)|0)|0;i=g;h=c[822]|0;break L11374}break};default:{if((f|0)==57344){h=9864;break L11374}if((f|0)==57345){h=9864;break L11374}if((f|0)<=127){a[c[822]|0]=f&255;h=c[822]|0;break L11374}if((f|0)<=2047){a[c[822]|0]=(192|f>>6&31)&255;a[(c[822]|0)+1|0]=(128|f&63)&255;a[(c[822]|0)+2|0]=0;h=c[822]|0;break L11374}if((f|0)<=65535){a[c[822]|0]=(224|f>>12&15)&255;a[(c[822]|0)+1|0]=(128|f>>6&63)&255;a[(c[822]|0)+2|0]=(128|f&63)&255;a[(c[822]|0)+3|0]=0;h=c[822]|0;break L11374}if((f|0)<=2097151){a[c[822]|0]=(240|f>>18&7)&255;a[(c[822]|0)+1|0]=(128|f>>12&63)&255;a[(c[822]|0)+2|0]=(128|f>>6&63)&255;a[(c[822]|0)+3|0]=(128|f&63)&255;a[(c[822]|0)+4|0]=0;h=c[822]|0;break L11374}if((f|0)<=67108863){a[c[822]|0]=(248|f>>24&3)&255;a[(c[822]|0)+1|0]=(128|f>>18&63)&255;a[(c[822]|0)+2|0]=(128|f>>12&63)&255;a[(c[822]|0)+3|0]=(128|f>>6&63)&255;a[(c[822]|0)+4|0]=(128|f&63)&255;a[(c[822]|0)+5|0]=0;h=c[822]|0;break L11374}if((f|0)<=2147483647){a[c[822]|0]=(252|f>>30&1)&255;a[(c[822]|0)+1|0]=(128|f>>24&63)&255;a[(c[822]|0)+2|0]=(128|f>>18&63)&255;a[(c[822]|0)+3|0]=(128|f>>12&63)&255;a[(c[822]|0)+4|0]=(128|f>>6&63)&255;a[(c[822]|0)+5|0]=(128|f&63)&255;a[(c[822]|0)+6|0]=0;h=c[822]|0;break L11374}else{h=16432;break L11374}}}}while(0);i=e;return h|0}function et(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((b|0)==0){d=a+((eu(a)|0)<<2)|0;return d|0}else{e=a}while(1){f=c[e>>2]|0;if((f|0)==0|(f|0)==(b|0)){break}else{e=e+4|0}}d=(f|0)!=0?e:0;return d|0}function eu(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function ev(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[6918]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=27712+(h<<2)|0;j=27712+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[6918]=e&~(1<<g)}else{if(l>>>0<(c[6922]|0)>>>0){bb();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bb();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[6920]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=27712+(p<<2)|0;m=27712+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[6918]=e&~(1<<r)}else{if(l>>>0<(c[6922]|0)>>>0){bb();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bb();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[6920]|0;if((l|0)!=0){q=c[6923]|0;d=l>>>3;l=d<<1;f=27712+(l<<2)|0;k=c[6918]|0;h=1<<d;do{if((k&h|0)==0){c[6918]=k|h;s=f;t=27712+(l+2<<2)|0}else{d=27712+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[6922]|0)>>>0){s=g;t=d;break}bb();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[6920]=m;c[6923]=e;n=i;return n|0}l=c[6919]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[27976+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[6922]|0;if(r>>>0<i>>>0){bb();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bb();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bb();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bb();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bb();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bb();return 0}}}while(0);L11913:do{if((e|0)!=0){f=d+28|0;i=27976+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[6919]=c[6919]&~(1<<c[f>>2]);break L11913}else{if(e>>>0<(c[6922]|0)>>>0){bb();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L11913}}}while(0);if(v>>>0<(c[6922]|0)>>>0){bb();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[6920]|0;if((f|0)!=0){e=c[6923]|0;i=f>>>3;f=i<<1;q=27712+(f<<2)|0;k=c[6918]|0;g=1<<i;do{if((k&g|0)==0){c[6918]=k|g;y=q;z=27712+(f+2<<2)|0}else{i=27712+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[6922]|0)>>>0){y=l;z=i;break}bb();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[6920]=p;c[6923]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[6919]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[27976+(A<<2)>>2]|0;L11961:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L11961}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[27976+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[6920]|0)-g|0)>>>0){o=g;break}q=K;m=c[6922]|0;if(q>>>0<m>>>0){bb();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){bb();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){bb();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){bb();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bb();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bb();return 0}}}while(0);L12011:do{if((e|0)!=0){i=K+28|0;m=27976+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[6919]=c[6919]&~(1<<c[i>>2]);break L12011}else{if(e>>>0<(c[6922]|0)>>>0){bb();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L12011}}}while(0);if(L>>>0<(c[6922]|0)>>>0){bb();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=27712+(e<<2)|0;r=c[6918]|0;j=1<<i;do{if((r&j|0)==0){c[6918]=r|j;O=m;P=27712+(e+2<<2)|0}else{i=27712+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[6922]|0)>>>0){O=d;P=i;break}bb();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=27976+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[6919]|0;l=1<<Q;if((m&l|0)==0){c[6919]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=8965;break}else{l=l<<1;m=j}}if((T|0)==8965){if(S>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[6922]|0;if(m>>>0<i>>>0){bb();return 0}if(j>>>0<i>>>0){bb();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[6920]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[6923]|0;if(S>>>0>15>>>0){R=J;c[6923]=R+o;c[6920]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[6920]=0;c[6923]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[6921]|0;if(o>>>0<J>>>0){S=J-o|0;c[6921]=S;J=c[6924]|0;K=J;c[6924]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[6836]|0)==0){J=aT(30)|0;if((J-1&J|0)==0){c[6838]=J;c[6837]=J;c[6839]=-1;c[6840]=-1;c[6841]=0;c[7029]=0;c[6836]=(a$(0)|0)&-16^1431655768;break}else{bb();return 0}}}while(0);J=o+48|0;S=c[6838]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[7028]|0;do{if((O|0)!=0){P=c[7026]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L12103:do{if((c[7029]&4|0)==0){O=c[6924]|0;L12105:do{if((O|0)==0){T=8995}else{L=O;P=28120;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=8995;break L12105}else{P=M}}if((P|0)==0){T=8995;break}L=R-(c[6921]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=a7(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=9004}}while(0);do{if((T|0)==8995){O=a7(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[6837]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[7026]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[7028]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=a7($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=9004}}while(0);L12125:do{if((T|0)==9004){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=9015;break L12103}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[6838]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((a7(O|0)|0)==-1){a7(m|0)|0;W=Y;break L12125}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=9015;break L12103}}}while(0);c[7029]=c[7029]|4;ad=W;T=9012}else{ad=0;T=9012}}while(0);do{if((T|0)==9012){if(S>>>0>=2147483647>>>0){break}W=a7(S|0)|0;Z=a7(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=9015}}}while(0);do{if((T|0)==9015){ad=(c[7026]|0)+aa|0;c[7026]=ad;if(ad>>>0>(c[7027]|0)>>>0){c[7027]=ad}ad=c[6924]|0;L12145:do{if((ad|0)==0){S=c[6922]|0;if((S|0)==0|ab>>>0<S>>>0){c[6922]=ab}c[7030]=ab;c[7031]=aa;c[7033]=0;c[6927]=c[6836];c[6926]=-1;S=0;do{Y=S<<1;ac=27712+(Y<<2)|0;c[27712+(Y+3<<2)>>2]=ac;c[27712+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[6924]=ab+ae;c[6921]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[6925]=c[6840]}else{S=28120;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=9027;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==9027){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[6924]|0;Y=(c[6921]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[6924]=Z+ai;c[6921]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[6925]=c[6840];break L12145}}while(0);if(ab>>>0<(c[6922]|0)>>>0){c[6922]=ab}S=ab+aa|0;Y=28120;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=9037;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==9037){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[6924]|0)){J=(c[6921]|0)+K|0;c[6921]=J;c[6924]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[6923]|0)){J=(c[6920]|0)+K|0;c[6920]=J;c[6923]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L12190:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=27712+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[6922]|0)>>>0){bb();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bb();return 0}}while(0);if((Q|0)==(U|0)){c[6918]=c[6918]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[6922]|0)>>>0){bb();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}bb();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[6922]|0)>>>0){bb();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bb();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{bb();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=27976+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[6919]=c[6919]&~(1<<c[P>>2]);break L12190}else{if(m>>>0<(c[6922]|0)>>>0){bb();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L12190}}}while(0);if(an>>>0<(c[6922]|0)>>>0){bb();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=27712+(V<<2)|0;P=c[6918]|0;m=1<<J;do{if((P&m|0)==0){c[6918]=P|m;as=X;at=27712+(V+2<<2)|0}else{J=27712+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[6922]|0)>>>0){as=U;at=J;break}bb();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=27976+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[6919]|0;Q=1<<au;if((X&Q|0)==0){c[6919]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=9110;break}else{Q=Q<<1;X=m}}if((T|0)==9110){if(aw>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[6922]|0;if(X>>>0<$>>>0){bb();return 0}if(m>>>0<$>>>0){bb();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=28120;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[6924]=ab+aB;c[6921]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[6925]=c[6840];c[ac+4>>2]=27;c[W>>2]=c[7030];c[W+4>>2]=c[7031];c[W+8>>2]=c[7032];c[W+12>>2]=c[7033];c[7030]=ab;c[7031]=aa;c[7033]=0;c[7032]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=27712+(K<<2)|0;S=c[6918]|0;m=1<<W;do{if((S&m|0)==0){c[6918]=S|m;aC=Z;aD=27712+(K+2<<2)|0}else{W=27712+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[6922]|0)>>>0){aC=Q;aD=W;break}bb();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=27976+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[6919]|0;Q=1<<aE;if((Z&Q|0)==0){c[6919]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=9145;break}else{Q=Q<<1;Z=m}}if((T|0)==9145){if(aG>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[6922]|0;if(Z>>>0<m>>>0){bb();return 0}if(_>>>0<m>>>0){bb();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[6921]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[6921]=_;ad=c[6924]|0;Q=ad;c[6924]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(a9()|0)>>2]=12;n=0;return n|0}
function cL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[f>>2]|0;g=c[f+36>>2]|0;h=c[f+40>>2]|0;j=0;k=c[a>>2]|0;l=c[a+4>>2]|0;m=c[a+8>>2]|0;n=c[a+12>>2]|0;o=c[f+8>>2]|0;p=l-k+1|0;q=n-m+1|0;r=f+44|0;s=100;t=100;if((p|0)>2){u=(q|0)>3}else{u=0}L7509:do{if(u){if((c[f+108>>2]|0)>0){break}if((c[a+196>>2]|0)!=1){break}do{if((c[r>>2]|0)<=(k+((p|0)/4|0)|0)){if((c[r+4>>2]|0)>(m+((q|0)/4|0)|0)){break}do{if((c[r+16>>2]|0)<=(k+((p|0)/4|0)|0)){if((c[r+20>>2]|0)<(n-((q|0)/4|0)|0)){break}do{if((c[r+32>>2]|0)>=(l-((p|0)/4|0)|0)){if((c[r+36>>2]|0)<(n-((q|0)/4|0)|0)){break}do{if((c[r+48>>2]|0)>=(l-((p|0)/4|0)|0)){if((c[r+52>>2]|0)>(m+((q|0)/4|0)|0)){break}v=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,m,n-m|0,o,0,2)|0;if((v|0)>((q|0)/8|0|0)){break L7509}v=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,m+v|0,n-m|0,o,1,2)|0;w=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,n,n-m|0,o,0,1)|0;if((w|0)>((q|0)/8|0|0)){break L7509}w=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,n-w|0,n-m|0,o,1,1)|0;if((w|0)>((q|0)/3|0|0)){break L7509}if((v|0)<((w<<1)-((q|0)/16|0)|0)){break L7509}x=cI(a,c[r+44>>2]|0,c[r+60>>2]|0,k,m+((q<<1|0)/3|0)|0)|0;if((c[a+296+(x<<3)>>2]|0)>=(k+((p|0)/3|0)|0)){break L7509}if((c[a+296+(x<<3)+4>>2]|0)<=(m+((q|0)/2|0)|0)){break L7509}y=cI(a,x,c[r+60>>2]|0,l,m+((q<<1|0)/3|0)|0)|0;if((c[a+296+(y<<3)>>2]|0)<(l-((p|0)/8|0)-1|0)){break L7509}if((c[a+296+(y<<3)+4>>2]|0)<(m+((q|0)/2|0)-1|0)){break L7509}if((c[a+56>>2]|0)!=0){if((c[f+40>>2]|0)!=0){t=(t*98|0|0)/100|0}if((c[f+36>>2]|0)!=0){t=(t*98|0|0)/100|0}}else{t=(t*99|0|0)/100|0}z=a;A=t;dy(z,101,A)|0;if((t|0)<100){break L7509}B=101;C=B;i=b;return C|0}}while(0);break L7509}}while(0);break L7509}}while(0);break L7509}}while(0)}}while(0);s=100;t=100;if((p|0)>2){D=(q|0)>3}else{D=0}L7576:do{if(D){if((c[f+108>>2]|0)>2){break}if((c[f+108>>2]|0)!=1){t=(t*97|0|0)/100|0}if((dC(c[a+68>>2]|0,k,m+((q|0)/2|0)|0,l-k|0,o,0,3)|0)>((p|0)/3|0|0)){break}if((dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,m,n-m|0,o,0,2)|0)>((q|0)/3|0|0)){break}if((dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,n,n-m|0,o,0,1)|0)>((q|0)/3|0|0)){break}do{if((dv(k,l,m+((q|0)/4|0)|0,m+((q|0)/4|0)|0,c[a+68>>2]|0,o)|0)>2){if((dv(k,l,m+((q|0)/4|0)+1|0,m+((q|0)/4|0)+1|0,c[a+68>>2]|0,o)|0)<=2){break}break L7576}}while(0);c[d>>2]=(k+l|0)/2|0;v=dv(c[d>>2]|0,c[d>>2]|0,m,n,c[a+68>>2]|0,o)|0;if((v|0)!=3){c[d>>2]=(k+(l<<1)|0)/3|0;v=dv(c[d>>2]|0,c[d>>2]|0,m,n,c[a+68>>2]|0,o)|0}if((v|0)!=3){c[d>>2]=(k+(l*3|0)|0)/4|0;v=dv(c[d>>2]|0,c[d>>2]|0,m,n,c[a+68>>2]|0,o)|0}if((v|0)!=3){v=dv((k+(l<<1)|0)/3|0,(k+l|0)/2|0,m,n,c[a+68>>2]|0,o)|0}v=dC(c[a+68>>2]|0,k,m+((q|0)/2|0)|0,l-k|0,o,0,3)|0;if((v|0)>((p|0)/2|0|0)){break}w=dC(c[a+68>>2]|0,k,m,l-k|0,o,0,3)|0;if((w|0)<(v|0)){break}w=dC(c[a+68>>2]|0,k,n,l-k|0,o,0,3)|0;if((w|0)<(v|0)){break}v=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,m,n-m|0,o,0,2)|0;if((v|0)>((p|0)/2|0|0)){break}w=dC(c[a+68>>2]|0,l-((p|0)/3|0)|0,m,n-m|0,o,0,2)|0;if((w|0)<(v|0)){v=w}w=dC(c[a+68>>2]|0,k,m,n-m|0,o,0,2)|0;if((w|0)<(v|0)){break}w=dC(c[a+68>>2]|0,l,m,n-m|0,o,0,2)|0;if((w|0)<(v|0)){break}v=dC(c[a+68>>2]|0,k+((p|0)/2|0)|0,n,n-m|0,o,0,1)|0;if((v|0)>((p|0)/2|0|0)){break}w=dC(c[a+68>>2]|0,k,n,n-m|0,o,0,1)|0;if((w|0)<(v|0)){break}w=dC(c[a+68>>2]|0,l,n,n-m|0,o,0,1)|0;if((w|0)<(v|0)){break}u=(dC(c[a+68>>2]|0,k,(m+n|0)/2|0,l-k|0,o,0,3)|0)<<1;A=u-(dC(c[a+68>>2]|0,k,((m*3|0)+n|0)/4|0,l-k|0,o,0,3)|0)|0;w=A-(dC(c[a+68>>2]|0,k,(m+(n*3|0)|0)/4|0,l-k|0,o,0,3)|0)|0;do{if((p|0)>3){if((w|0)<((p|0)/4|0|0)){break}break L7576}}while(0);c[e>>2]=1;while(1){if((c[e>>2]|0)>=((q|0)/2|0|0)){break}if((dv(k,l,m+(c[e>>2]|0)|0,m+(c[e>>2]|0)|0,c[a+68>>2]|0,o)|0)==2){E=5579;break}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)==((q|0)/2|0|0)){break}v=0;w=k+((p|0)/4|0)|0;while(1){if((w|0)<=(l-((p|0)/4|0)|0)){F=(v|0)<=((p|0)/4|0|0)}else{F=0}if(!F){break}if((dv(w,w,m,n,c[a+68>>2]|0,o)|0)==3){v=v+1|0}w=w+1|0}do{if((p|0)>4){if((q|0)<=5){break}if((v|0)>=(((p|0)/4|0)-1|0)){if((v|0)!=0){break}}break L7576}}while(0);c[d>>2]=0;A=m+((q|0)/3|0)|0;v=A;c[e>>2]=A;while(1){if((v|0)>=(n-((q|0)/6|0)|0)){break}w=dC(c[a+68>>2]|0,l,v,n-m|0,o,0,4)|0;if((w|0)>=(c[d>>2]|0)){c[d>>2]=w;c[e>>2]=v}v=v+1|0}if((c[d>>2]|0)<((p|0)/2|0|0)){x=p;v=m+((q|0)/3|0)|0;while(1){if((v|0)>=(n-((q|0)/6|0)|0)){break}w=dC(c[a+68>>2]|0,k,v,n-m|0,o,0,3)|0;if((w|0)>((p|0)/2|0|0)){E=5607;break}w=dC(c[a+68>>2]|0,k+w|0,v,n-m|0,o,1,3)|0;if((w|0)<(x|0)){x=w}v=v+1|0}y=p;A=m+((q|0)/3|0)|0;v=A;c[e>>2]=A;while(1){if((v|0)>=(n-((q|0)/6|0)|0)){break}w=dC(c[a+68>>2]|0,l,v,n-m|0,o,0,4)|0;w=dC(c[a+68>>2]|0,l-w|0,v,n-m|0,o,1,4)|0;if((w|0)<(y|0)){y=w;c[e>>2]=v}v=v+1|0}if((y*3|0|0)>(x<<1|0)){break}c[d>>2]=dC(c[a+68>>2]|0,l,c[e>>2]|0,n-m|0,o,0,4)|0;A=dC(c[a+68>>2]|0,l-(c[d>>2]|0)|0,c[e>>2]|0,n-m|0,o,1,4)|0;c[d>>2]=(c[d>>2]|0)+A;A=dC(c[a+68>>2]|0,l-(c[d>>2]|0)|0,c[e>>2]|0,n-m|0,o,0,4)|0;c[d>>2]=(c[d>>2]|0)+A;if((y*3|0|0)>(x|0)){t=(t*99|0|0)/100|0}if((y<<1|0)>(x|0)){t=(t*99|0|0)/100|0}j=60}if((c[d>>2]|0)<((p|0)/2|0|0)){break}v=1;w=k+((p|0)/6|0)|0;while(1){if((w|0)<(l-((p|0)/6|0)|0)){G=(v|0)!=0}else{G=0}if(!G){break}if((dv(w,w,m,c[e>>2]|0,c[a+68>>2]|0,o)|0)>1){v=0}w=w+1|0}if((v|0)!=0){break}do{if((q|0)>11){if((j|0)>=50){break}if((dv(k,l,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o)|0)!=1){break L7576}else{break}}}while(0);do{if((dv(k,l-((p|0)/3|0)|0,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o)|0)!=1){if((dv(k,l-((p|0)/3|0)|0,(c[e>>2]|0)+1|0,(c[e>>2]|0)+1|0,c[a+68>>2]|0,o)|0)==1){break}break L7576}}while(0);if((c[f+108>>2]|0)==0){E=5647}else{if((c[f+136>>2]|0)>=((c[e>>2]|0)-m|0)){E=5647}}do{if((E|0)==5647){if((c[f+36>>2]|0)!=0){break L7576}w=0;v=k+((p|0)/8|0)|0;while(1){if((v|0)>=(l-1|0)){break}if(((du(v,v,m+((q|0)/4|0)|0,c[e>>2]|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==1){w=w+1|0}v=v+1|0}if((w|0)<((p<<1|0)/4|0|0)){break L7576}else{break}}}while(0);do{if((c[f+108>>2]|0)>0){if((c[f+128>>2]|0)<=((c[e>>2]|0)-m|0)){break}break L7576}}while(0);do{if((c[f+108>>2]|0)>1){if((c[f+156>>2]|0)<=((c[e>>2]|0)-m|0)){break}break L7576}}while(0);do{if((c[f+108>>2]|0)==1){if((c[f+124>>2]|0)<((p|0)/2|0|0)){break}t=(t*95|0|0)/100|0}}while(0);c[d>>2]=0;A=m+((q|0)/4|0)|0;v=A;c[e>>2]=A;while(1){if((v|0)>=(n-((q|0)/4|0)|0)){break}w=dC(c[a+68>>2]|0,k,v,l-k|0,o,0,3)|0;if((w|0)>=(c[d>>2]|0)){c[d>>2]=w;c[e>>2]=v}v=v+1|0}do{if((c[e>>2]|0)>(m+((q|0)/4|0)|0)){if((c[e>>2]|0)>=(n-((q|0)/4|0)|0)){break}if((c[d>>2]|0)<=((p|0)/2|0|0)){break}break L7576}}while(0);if((c[d>>2]|0)>((p|0)/4|0|0)){t=(t*99|0|0)/100|0}do{if((dv(k+((p|0)/2|0)|0,l,n-((q|0)/4|0)|0,n,c[a+68>>2]|0,o)|0)==0){if((dv(k+((p|0)/2|0)|0,l-1|0,n-((q|0)/4|0)|0,n,c[a+68>>2]|0,o)|0)!=0){break}if((dv(k+((p|0)/2|0)|0,l,n-((q|0)/4|0)|0,n-1|0,c[a+68>>2]|0,o)|0)!=0){break}if((c[f+40>>2]|0)!=0){break L7576}else{t=(t*99|0|0)/100|0;break}}}while(0);do{if((c[f+36>>2]|0)!=0){if((dC(c[a+68>>2]|0,l,n-((q|0)/3|0)|0,p,o,0,4)|0)>((p|0)/8|0|0)){break}c[d>>2]=dC(c[a+68>>2]|0,k,m+((q|0)/2|0)|0,p,o,0,3)|0;A=dC(c[a+68>>2]|0,k,m+((q|0)/4|0)|0,p,o,0,3)|0;do{if((A|0)<=(c[d>>2]|0)){u=dC(c[a+68>>2]|0,k,m+((q|0)/8|0)|0,p,o,0,3)|0;if((u|0)>(c[d>>2]|0)){break}break L7576}}while(0);A=dC(c[a+68>>2]|0,k,n-((q|0)/4|0)|0,p,o,0,3)|0;do{if((A|0)<=(c[d>>2]|0)){u=dC(c[a+68>>2]|0,k,n-((q|0)/8|0)|0,p,o,0,3)|0;if((u|0)>(c[d>>2]|0)){break}break L7576}}while(0)}}while(0);c[d>>2]=dC(c[f+4>>2]|0,0,q-2|0,p,o,0,3)|0;A=dC(c[f+4>>2]|0,0,q-1-((q|0)/8|0)|0,p,o,0,3)|0;do{if((A|0)>(c[d>>2]|0)){if((q|0)<=16){break}break L7576}}while(0);if((c[a+56>>2]|0)!=0){if((c[f+40>>2]|0)!=0){t=(t*99|0|0)/100|0}if((c[f+36>>2]|0)!=0){t=(t*99|0|0)/100|0}}else{t=(t*99|0|0)/100|0}dy(a,101,t)|0;if((t|0)<100){break}B=101;C=B;i=b;return C|0}}while(0);s=100;t=100;if((p|0)>2){H=(q|0)>4}else{H=0}L7826:do{if(H){if((c[f+108>>2]|0)>1){break}s=(cH(32)|0)<<1;if((c[r+56>>2]|0)>((s|0)/2|0|0)){break}if((c[r+8>>2]|0)>((s|0)/2|0|0)){break}if((c[r+24>>2]|0)>((s|0)/2|0|0)){break}if((c[r+40>>2]|0)>((s|0)/2|0|0)){break}v=c[r+28>>2]|0;while(1){if((v|0)==(c[r+44>>2]|0)){break}if((n-(c[a+296+(v<<3)+4>>2]|0)|0)>((q|0)/4|0|0)){E=5724;break}v=(v+1|0)%(c[a+264>>2]|0)|0}if((v|0)!=(c[r+44>>2]|0)){break}j=cI(a,c[r+44>>2]|0,c[r+60>>2]|0,k,n)|0;G=cI(a,j,c[r+60>>2]|0,k,m)|0;x=cI(a,j,G,l,(m+n|0)/2|0)|0;cI(a,j,x,k,((m<<1)+n|0)/3|0)|0;cI(a,x,G,k,(m+(n<<1)|0)/3|0)|0;v=cI(a,c[r+12>>2]|0,c[r+28>>2]|0,k-((p|0)/4|0)|0,(m+n|0)/2|0)|0;if((c[a+296+(v<<3)>>2]<<1|0)<((c[r>>2]|0)+(c[r+16>>2]|0)-1-((p|0)/16|0)|0)){break}if((c[a+296+(v<<3)>>2]<<1|0)<((c[r>>2]|0)+(c[r+16>>2]|0)|0)){t=(t*99|0|0)/100|0}v=1;c[e>>2]=m;while(1){if((c[e>>2]|0)<(m+((q|0)/4|0)|0)){I=(v|0)!=0}else{I=0}if(!I){break}if(((du(k+((p|0)/3|0)|0,l-((p|0)/6|0)|0,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o,2)|0)<<24>>24|0)==0){v=0}c[e>>2]=(c[e>>2]|0)+1}if((v|0)!=0){break}v=1;c[e>>2]=n;while(1){if((c[e>>2]|0)>(n-((q|0)/4|0)|0)){J=(v|0)!=0}else{J=0}if(!J){break}if(((du(k+((p|0)/6|0)|0,l-((p|0)/4|0)|0,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o,2)|0)<<24>>24|0)==0){v=0}c[e>>2]=(c[e>>2]|0)-1}if((v|0)!=0){break}v=1;c[e>>2]=m+((q|0)/3|0);while(1){if((c[e>>2]|0)<(n-((q|0)/3|0)|0)){K=(v|0)!=0}else{K=0}if(!K){break}w=dC(c[a+68>>2]|0,k,c[e>>2]|0,p,o,0,3)|0;w=dC(c[a+68>>2]|0,k+w|0,c[e>>2]|0,p,o,1,3)|0;if((w|0)>((p|0)/3|0|0)){v=0}c[e>>2]=(c[e>>2]|0)+1}if((v|0)!=0){break}c[d>>2]=l-((p|0)/3|0);c[e>>2]=m;dA(c[a+68>>2]|0,d,e,k,l,m,n,o,2,7);if((c[e>>2]|0)>(m+((q|0)/4|0)|0)){break}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,2);if((c[e>>2]|0)>(m+((q|0)/3|0)|0)){break}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,3,2);do{if((c[d>>2]|0)>(l|0)){if((c[e>>2]|0)>(m+((q|0)/2|0)|0)){break}c[d>>2]=l-((p|0)/3|0);c[e>>2]=n;dA(c[a+68>>2]|0,d,e,k,l,m,n,o,1,7);if((c[e>>2]|0)<(n-((q|0)/4|0)|0)){break L7826}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,1);if((c[e>>2]|0)<(m-((q|0)/3|0)|0)){break L7826}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,3,1);do{if((c[d>>2]|0)>(l|0)){if((c[e>>2]|0)<(m+((q|0)/2|0)|0)){break}c[d>>2]=l-((p|0)/3|0);c[e>>2]=m;dA(c[a+68>>2]|0,d,e,k,l,m,n,o,2,7);if((c[e>>2]|0)>(m+((q|0)/4|0)|0)){break L7826}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,2);if((c[e>>2]|0)>(m+((q|0)/3|0)|0)){break L7826}c[e>>2]=(c[e>>2]|0)+((q|0)/15|0);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,4,7);if((c[d>>2]|0)<(k|0)){break L7826}do{if((p|0)>15){if((c[d>>2]|0)!=(k|0)){break}t=(t*99|0|0)/100|0}}while(0);c[d>>2]=(c[d>>2]|0)+(((p|0)/15|0)+1);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,2,7);if((c[e>>2]|0)>(n-((q|0)/3|0)|0)){break L7826}if((c[f+108>>2]|0)>0){break L7826}v=dC(c[a+68>>2]|0,k,m+((q|0)/4|0)|0,p,o,0,3)|0;if((v|0)>((p|0)/2|0|0)){break L7826}w=dC(c[a+68>>2]|0,k,m+((q|0)/2|0)|0,p,o,0,3)|0;do{if((w|0)>=(v-((p|0)/4|0)|0)){if((w|0)>(v+((p|0)/8|0)|0)){break}v=w;w=dC(c[a+68>>2]|0,k,n-((q|0)/4|0)|0,p,o,0,3)|0;do{if((w|0)>=(v-((p|0)/4|0)|0)){if((w|0)>(v+((p|0)/8|0)|0)){break}w=dC(c[a+68>>2]|0,l,n-((q|0)/4|0)|0,p,o,0,4)|0;c[d>>2]=p;c[e>>2]=m+((q|0)/6|0);while(1){if((c[e>>2]|0)>=(n-((q|0)/9|0)|0)){break}v=dC(c[a+68>>2]|0,k,c[e>>2]|0,p,o,0,3)|0;do{if((v|0)>((w|0)/2|0|0)){if((t|0)<=98){break}t=(t*99|0|0)/100|0}}while(0);if((v|0)>((p|0)/4|0|0)){E=5804;break}if((v|0)<(c[d>>2]|0)){c[d>>2]=v}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)<(n-((q|0)/9|0)|0)){break L7826}do{if((q|0)>(p*3|0|0)){if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m+((q|0)/4|0)|0,n-((q|0)/4|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==0){break L7826}else{break}}}while(0);if((c[a+56>>2]|0)!=0){if((g|0)==0){t=(t*99|0|0)/100|0}if((h|0)!=0){t=(t*99|0|0)/100|0}}dy(a,69,t)|0;if((t|0)<100){break L7826}B=69;C=B;i=b;return C|0}}while(0);break L7826}}while(0);break L7826}}while(0);break L7826}}while(0)}}while(0);B=c[a+36>>2]|0;C=B;i=b;return C|0}function cM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;b=i;i=i+128|0;d=b|0;e=a;a=c[e>>2]|0;f=c[e+4>>2]|0;g=c[e+36>>2]|0;h=c[e+40>>2]|0;j=c[a>>2]|0;k=c[a+4>>2]|0;l=c[a+8>>2]|0;m=c[a+12>>2]|0;n=c[e+8>>2]|0;o=k-j+1|0;p=m-l+1|0;q=e+44|0;r=100;if((o|0)>2){s=(p|0)>5}else{s=0}if(!s){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[e+108>>2]|0)>1){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}s=(cH(32)|0)<<1;if((c[q+56>>2]|0)>((s|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[q+8>>2]|0)>(s|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}s=cI(a,c[q+12>>2]|0,c[q+28>>2]|0,j-((o|0)/2|0)|0,((l*5|0)+(m*3|0)|0)/8|0)|0;w=c[q+28>>2]|0;if((c[a+296+(w<<3)+4>>2]|0)<(m-((p|0)/8|0)|0)){w=cI(a,c[q+28>>2]|0,c[q+44>>2]|0,j,m+((p|0)/4|0)|0)|0}x=cI(a,s,w,k,m)|0;w=cI(a,c[q+28>>2]|0,c[q+44>>2]|0,k,m+((p|0)/4|0)|0)|0;y=cI(a,w,c[q+60>>2]|0,j,m)|0;z=cI(a,y,c[q+60>>2]|0,(j+k|0)/2|0,l)|0;cI(a,z,c[q+12>>2]|0,k,((l*3|0)+m|0)/4|0)|0;A=cI(a,c[q+60>>2]|0,c[q+12>>2]|0,(j+(k<<1)|0)/3|0,l-((p|0)/4|0)|0)|0;B=cI(a,y,z,k+((o|0)/4|0)|0,((l*5|0)+(m*3|0)|0)/8|0)|0;cI(a,y,B,j,((l*3|0)+m|0)/4|0)|0;cI(a,B,z,j,(l+(m*3|0)|0)/4|0)|0;if(((c[a+296+(x<<3)>>2]|0)-j|0)>((o|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}w=cI(a,c[q+12>>2]|0,x,k+(o<<1)|0,(l+m|0)/2|0)|0;if(((c[a+296+(w<<3)>>2]|0)-(c[a+296+(A<<3)>>2]|0)|0)>((o|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[a+24>>2]|0)!=0){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((p|0)<=((c[a+60>>2]|0)-(c[a+56>>2]|0)+1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}A=0;z=(((p*3|0)+4|0)/32|0)+2|0;B=z;C=z;L8030:while(1){if((B|0)>((p*5|0|0)/8|0|0)){break}w=dC(f,0,B,o,n,0,3)|0;if((B|0)>((p|0)/4|0|0)){if((w|0)>((o*5|0|0)/8|0|0)){D=5854;break}}w=dC(f,w,B,o,n,1,3)|0;if((w|0)>(A|0)){A=w;C=B}do{if((B|0)<((p*3|0|0)/4|0|0)){if((B|0)<=((p|0)/4|0|0)){break}if((dv(0,o-1|0,B,B,f,n)|0)==1){break}if((dv(0,o-1|0,B+1|0,B+1|0,f,n)|0)!=1){D=5861;break L8030}}}while(0);B=B+1|0}if((B|0)<=((p*5|0|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}B=C;w=(dC(f,(o+1|0)/2|0,0,p,n,0,2)|0)/2|0;do{if((w|0)>((p|0)/8|0|0)){if((dv(0,(o+1|0)/2|0,w,w,f,n)|0)<=0){break}if((dv((o+1|0)/2|0,o-1|0,w,w,f,n)|0)<=0){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);do{if((dC(f,(o*3|0|0)/4|0,0,p,n,0,2)|0)>((p|0)/8|0|0)){if((dC(f,((o*3|0|0)/4|0)-1|0,0,p,n,0,2)|0)<=((p|0)/8|0|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);w=(p*3|0|0)/4|0;do{if((c[a+60>>2]|0)!=0){if((w|0)<(c[a+60>>2]|0)){break}w=(c[a+60>>2]|0)-1|0}}while(0);if((dv(0,o-1|0,w,w,f,n)|0)!=1){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}s=o;x=B;C=B+1|0;while(1){if((C|0)>=(p-((p|0)/4|0)|0)){break}w=dC(f,0,C,o,n,0,3)|0;w=dC(f,w,C,o,n,1,3)|0;if((w|0)<(s|0)){s=w;x=C;if((w<<1|0)<=(A|0)){D=5882;break}}C=C+1|0}w=s;C=x;do{if((A|0)<(w<<1|0)){if((A|0)>=(o|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);if((A|0)<(w+2+((o|0)/8|0)|0)){r=(r*97|0|0)/100|0}y=cI(a,c[q+44>>2]|0,c[q+60>>2]|0,j,l)|0;c[d+112>>2]=c[a+296+(y<<3)>>2];c[d+116>>2]=c[a+296+(y<<3)+4>>2];c[d+124>>2]=y;if(((c[d+116>>2]|0)-l|0)<=((p|0)/16|0|0)){r=(r*95|0|0)/100|0}do{if(((c[q+48>>2]|0)-j|0)>((o*3|0|0)/4|0|0)){if(((c[q+52>>2]|0)-l|0)<=((p*3|0|0)/16|0|0)){break}r=(r*99|0|0)/100|0}}while(0);C=dC(f,0,(p|0)/8|0,o,n,0,3)|0;if((A<<1|0)<(o|0)){if((C|0)>((o|0)/2|0|0)){D=5898}}else{D=5898}do{if((D|0)==5898){if((A*3|0|0)<(o|0)){break}w=(p|0)/8|0;while(1){if((w|0)>=(p|0)){break}if((dC(f,0,w,o,n,0,3)|0)>(C+((o|0)/4|0)|0)){D=5903;break}w=w+1|0}if((w|0)<(p|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((dC(f,o-1|0,(p|0)/2|0,o,n,0,4)|0)<((o|0)/2|0|0)){q=(dC(f,o-1|0,(p|0)/2|0,o,n,0,4)|0)-1|0;do{if((q|0)<=(dC(f,o-1|0,B,o,n,0,4)|0)){d=dC(f,o-1|0,B-1|0,o,n,0,4)|0;if((d|0)>(dC(f,o-1|0,B,o,n,0,4)|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}q=(dC(f,0,(p|0)/2|0,o,n,0,3)|0)-1|0;if((q|0)>(dC(f,0,1,o,n,0,3)|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}w=B;C=1;do{if((dv(0,o-1|0,0,0,f,n)|0)==1){if((g|0)==0){break}do{if((dv(0,o-1|0,p-1|0,p-1|0,f,n)|0)!=1){if((dv(0,o-1|0,p-2|0,p-2|0,f,n)|0)==1){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}}while(0);B=1;while(1){if((C|0)!=0){E=(B|0)<(w|0)}else{E=0}if(!E){break}if((dv(0,o-1|0,B,B,f,n)|0)==2){C=0}B=B+1|0}if((C|0)==0){r=(r+101|0)/2|0}B=1;while(1){if((C|0)!=0){F=(B|0)<(w|0)}else{F=0}if(!F){break}A=0;L8158:while(1){if((C|0)!=0){G=(A|0)<(o|0)}else{G=0}if(!G){break}if((d8(f,A,B)|0)>=(n|0)){D=5942}else{if((o|0)<7){D=5942}}do{if((D|0)==5942){D=0;if((d8(f,A+1|0,B)|0)<(n|0)){break}if((d8(f,A,B-1|0)|0)>=(n|0)){break}if((d8(f,A+1|0,B-1|0)|0)<(n|0)){D=5945;break L8158}}}while(0);A=A+1|0}if((D|0)==5945){D=0;C=0}B=B+1|0}if((C|0)!=0){r=(r*98|0|0)/100|0}if((c[e+108>>2]|0)!=0){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}q=o;x=q;s=q;B=(p*7|0|0)/8|0;while(1){if((B|0)>=(p|0)){break}A=dC(f,0,B,o,n,0,3)|0;if((A|0)<(s|0)){s=A}A=dC(f,o-1|0,B,o,n,0,4)|0;if((A|0)<(x|0)){x=A}B=B+1|0}if((s|0)>(x+((o|0)/4|0)|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((s|0)>(x+1|0)){r=(r*96|0|0)/100|0}if((dC(f,0,(p*3|0|0)/4|0,o,n,0,3)|0)<(s-((o|0)/4|0)|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}do{if((o|0)>5){if((g|0)!=0){break}do{if((dC(f,o-1|0,(p|0)/2|0,o,n,0,4)|0)>((o*3|0|0)/4|0|0)){if((dC(f,o-1|0,p-1|0,p,n,0,1)|0)>=((o|0)/2|0|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}}while(0);if((o|0)>8){if((dC(f,0,(p<<1|0)/3|0,o,n,0,3)|0)>((o<<1|0)/3|0|0)){D=5978}else{if((dC(f,0,((p<<1|0)/3|0)-1|0,o,n,0,3)|0)>((o<<1|0)/3|0|0)){D=5978}}do{if((D|0)==5978){if((dC(f,o-1|0,(p|0)/4|0,o,n,0,4)|0)<=((o<<1|0)/3|0|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}if((g|0)==0){do{if(((du(j+((o|0)/8|0)|0,j+((o|0)/8|0)|0,l+((p|0)/4|0)|0,m-((p|0)/16|0)|0,c[a+68>>2]|0,n,2)|0)<<24>>24|0)==0){if((dv(k-((o|0)/4|0)|0,k-((o|0)/4|0)|0,l,m,c[a+68>>2]|0,n)|0)==2){break}if((dv(k-((o|0)/8|0)|0,k-((o|0)/8|0)|0,l,m,c[a+68>>2]|0,n)|0)==2){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}if((p|0)>15){do{if((dv(j,k,m-((p|0)/4|0)|0,m-((p|0)/4|0)|0,c[a+68>>2]|0,n)|0)>1){if((dv(j,k,l+((p|0)/4|0)|0,l+((p|0)/4|0)|0,c[a+68>>2]|0,n)|0)<=1){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0)}if((o|0)>4){q=dC(f,o-1|0,(p*3|0|0)/4|0,o,n,0,4)|0;do{if((q-(dC(f,0,(p*3|0|0)/4|0,o,n,0,3)|0)|0)>(((o|0)/5|0)+1|0)){if((dC(f,o-1-((o|0)/8|0)|0,p-1|0,p,n,0,1)|0)>=((p|0)/4|0|0)){break}d=dC(f,o-1|0,(p*5|0|0)/16|0,o,n,0,4)|0;if((d-(dC(f,0,(p*5|0|0)/16|0,o,n,0,3)|0)|0)>=(((o|0)/5|0)+1|0)){r=(r*98|0|0)/100|0}w=dC(f,(o|0)/8|0,0,p,n,0,2)|0;if((w|0)<((p|0)/8|0|0)){D=6e3}else{if((w|0)>((p|0)/2|0|0)){D=6e3}}if((D|0)==6e3){r=(r*98|0|0)/100|0}if((h|0)==0){r=(r*98|0|0)/100|0}}}while(0)}w=(dC(f,o-1|0,(p*3|0|0)/4|0,o,n,0,4)|0)/2|0;if((dC(f,o-1-w|0,p-1|0,(p|0)/2|0,n,0,1)|0)<((p|0)/4|0|0)){if((dC(f,0,(p*3|0|0)/4|0,o,n,0,3)|0)<((o|0)/4|0|0)){r=(r*98|0|0)/100|0}}do{if((dC(f,0,(p|0)/4|0,o,n,0,3)|0)>1){if((dC(f,0,0,(p|0)/4|0,n,0,2)|0)>=((p|0)/4|0|0)){break}r=(r*95|0|0)/100|0}}while(0);if(((du(j+((o|0)/16|0)|0,k-((o|0)/16|0)|0,l,l,c[a+68>>2]|0,n,2)|0)<<24>>24|0)==0){r=(r*98|0|0)/100|0}if((g|0)==0){r=(r*98|0|0)/100|0}do{if((c[a+64>>2]|0)>0){if((h|0)==0){break}if((r|0)>=99){break}if((c[a+12>>2]<<3|0)<(((c[a+64>>2]|0)*7|0)+(c[a+60>>2]|0)|0)){break}r=r+1|0}}while(0);dy(a,102,r)|0;t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}function cN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=100;o=100;if((l|0)>2){p=(m|0)>4}else{p=0}L8294:do{if(p){if((c[b+108>>2]|0)<2){break}q=1;r=i;while(1){if((r|0)<(j-((m|0)/2|0)|0)){s=(q|0)!=0}else{s=0}if(!s){break}if(((du(g,g+((l|0)/2|0)|0,r,r,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=0}r=r+1|0}if((q|0)==0){break}q=1;r=j-((m|0)/2|0)|0;while(1){if((r|0)<(j|0)){t=(q|0)!=0}else{t=0}if(!t){break}if(((du(g,g+((l|0)/3|0)|0,r,r,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=0}r=r+1|0}if((q|0)==0){break}if(((du(h,h,i,i,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}do{if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,j,c[a+68>>2]|0,k)|0)!=3){if((dv(h-((l|0)/3|0)|0,h-((l|0)/3|0)|0,i,j,c[a+68>>2]|0,k)|0)!=3){break L8294}else{break}}}while(0);r=dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,j,m,k,0,1)|0;if((r|0)>(((m|0)/8|0)+1|0)){break}r=r+(dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,j-r|0,m,k,1,1)|0)|0;if((r|0)>((m|0)/3|0|0)){break}r=j-r-((dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,j-r|0,m,k,0,1)|0)/2|0)|0;if((r|0)<(i+((m*3|0|0)/8|0)|0)){break}if((r|0)<(i+((m|0)/2|0)|0)){o=(o*96|0|0)/100|0}do{if((dv(0,l-1|0,r-i|0,r-i|0,d,k)|0)!=2){if((dv(0,l-1|0,r-i+1|0,r-i+1|0,d,k)|0)!=2){break L8294}else{break}}}while(0);if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){do{if((dv(0,l-1|0,((m|0)/4|0)+1|0,((m|0)/4|0)+1|0,d,k)|0)!=2){if((dv(0,l-1|0,((m|0)/4|0)-1|0,((m|0)/4|0)-1|0,d,k)|0)!=2){break L8294}else{break}}}while(0)}r=(m|0)/4|0;while(1){if((r|0)>=((m*3|0|0)/4|0|0)){break}if((dv(0,l-1|0,r,r,d,k)|0)==1){u=6102;break}r=r+1|0}if((r|0)==((m*3|0|0)/4|0|0)){break}v=dC(c[a+68>>2]|0,g,i+r|0,l,k,0,3)|0;if((v|0)>((dC(c[a+68>>2]|0,g,i+((m|0)/4|0)|0,l,k,0,3)|0)+((l|0)/32|0)|0)){do{if(((du(g,g,i,i,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){if(((du(g,g,j,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break L8294}else{break}}}while(0)}v=dC(c[a+68>>2]|0,g,i+((m|0)/4|0)|0,l,k,0,3)|0;w=dC(c[a+68>>2]|0,g,i+((m|0)/2|0)|0,l,k,0,3)|0;q=dC(c[a+68>>2]|0,g,i+((m|0)/2|0)-((m|0)/8|0)|0,l,k,0,3)|0;if((q|0)>(w|0)){w=q}q=dC(c[a+68>>2]|0,g,i+((m|0)/2|0)-((m|0)/16|0)|0,l,k,0,3)|0;if((q|0)>(w|0)){w=q}x=dC(c[a+68>>2]|0,g,j-((m|0)/4|0)|0,l,k,0,3)|0;do{if((m|0)>16){if((x|0)>=(w|0)){break}if((v+x|0)>=(w<<1|0)){break}if((x+v|0)<((w<<1)-((l|0)/16|0)|0)){o=(o*98|0|0)/100|0}if((x+v|0)<((w<<1)-((l|0)/8|0)|0)){o=(o*96|0|0)/100|0}y=dC(c[a+68>>2]|0,g,i+1|0,l,k,0,3)|0;if((y|0)>=((dC(c[a+68>>2]|0,g,i+3|0,l,k,0,3)|0)+((l|0)/32|0)|0)){y=dC(c[a+68>>2]|0,g,i|0,l,k,0,3)|0;if((y|0)>((dC(c[a+68>>2]|0,g,i+3|0,l,k,0,3)|0)+((l|0)/32|0)|0)){y=dC(c[a+68>>2]|0,g,j|0,l,k,0,3)|0;do{if((y|0)>((dC(c[a+68>>2]|0,g,j-3|0,l,k,0,3)|0)+((l|0)/32|0)|0)){z=dC(c[a+68>>2]|0,g,j-1|0,l,k,0,3)|0;if((z|0)>((dC(c[a+68>>2]|0,g,j-3|0,l,k,0,3)|0)+((l|0)/32|0)|0)){break L8294}else{break}}}while(0)}}}}while(0);if((c[b+108>>2]|0)!=2){break}do{if((c[b+128>>2]|0)<(r-1|0)){if((c[b+156>>2]|0)>=(r-1|0)){break}break L8294}}while(0);do{if((c[b+136>>2]|0)>(r+1|0)){if((c[b+164>>2]|0)<=(r+1|0)){break}break L8294}}while(0);w=l;r=(m|0)/6|0;while(1){if((r|0)>=(m-((m|0)/8|0)|0)){break}q=dC(c[a+68>>2]|0,g,i+r|0,l,k,0,3)|0;if((q|0)>(w+((l|0)/9|0)|0)){u=6144;break}if((q|0)<(w|0)){w=q}r=r+1|0}if((r|0)<(m-((m|0)/8|0)|0)){break}w=l;r=1;while(1){if((r|0)>=((m|0)/4|0|0)){break}q=dC(d,l-1|0,m-r|0,l,k,0,4)|0;if((q|0)<(w|0)){w=q}else{if((q|0)>(w|0)){u=6156;break}}r=r+1|0}if((r|0)<((m|0)/4|0|0)){break}w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;q=dC(d,0,((m|0)/2|0)-1|0,l,k,0,3)|0;if((q|0)>(w|0)){w=q}q=dC(d,0,((m|0)/2|0)+1|0,l,k,0,3)|0;if((q|0)>(w|0)){w=q}v=dC(d,0,(m|0)/8|0,l,k,0,3)|0;if((v+(dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)|0)>((w<<1)+1|0)){break}if((e|0)==0){o=(o*99|0|0)/100|0;w=dC(d,0,(m|0)/4|0,l,k,0,3)|0;if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)>(w+((l|0)/8|0)|0)){o=(o*97|0|0)/100|0}}do{if((e|0)==0){if((l|0)>10){if((m|0)>10){break}}o=(o*97|0|0)/100|0}}while(0);if((f|0)!=0){o=(o*99|0|0)/100|0}dy(a,66,o)|0}}while(0);n=100;o=100;if((l|0)>3){A=(m|0)>4}else{A=0}L8481:do{if(A){if((c[b+108>>2]|0)<1){break}r=i;while(1){if((r|0)>=(j|0)){break}if(((du(g,g+((l|0)/2|0)|0,r,r,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){u=6188;break}r=r+1|0}if((r|0)<(j-((m|0)/32|0)-1|0)){break}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,j-((m|0)/3|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/2|0)|0,h,j-((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/3|0)|0,h,i,i+((m|0)/5|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}if(((du(h-((l<<2|0)/9|0)|0,h,i+((m|0)/5|0)|0,i+((m|0)/5|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}if((dv(g,h,i+((m|0)/4|0)|0,i+((m|0)/4|0)|0,c[a+68>>2]|0,k)|0)>1){L8511:do{if((dv(g,h,i+((m|0)/4|0)-1|0,i+((m|0)/4|0)-1|0,c[a+68>>2]|0,k)|0)>1){do{if((m|0)>=16){if((dv(g,h,i+((m|0)/5|0)|0,i+((m|0)/5|0)|0,c[a+68>>2]|0,k)|0)>1){break}break L8511}}while(0);break L8481}}while(0)}n=0;q=0;r=(m|0)/2|0;while(1){if((r|0)>=(m-((m|0)/8|0)|0)){break}if((dv(0,l-1|0,r,r,d,k)|0)==2){q=q+1|0}else{n=n+1|0}r=r+1|0}if((q|0)<(n<<1|0)){break}if((c[b+108>>2]|0)!=1){break}if((c[b+128>>2]|0)<((m|0)/4|0|0)){break}if(((aa((c[b+136>>2]|0)-(c[b+128>>2]|0)+1|0,(c[b+132>>2]|0)-(c[b+124>>2]|0)+1|0)|0)<<4|0)<(aa(l,m)|0)){o=(o*90|0|0)/100|0}if((dH(g,h,i+((m|0)/4|0)|0,j,c[a+68>>2]|0,k,0)|0)!=1){break}q=dC(d,l-1|0,m-1|0,l,k,0,4)|0;n=dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0;if((n|0)>(q|0)){break}if((e|0)==0){o=(o*99|0|0)/100|0}if((f|0)!=0){o=(o*99|0|0)/100|0}dy(a,98,o)|0;if((o|0)<100){break}B=98;C=B;return C|0}}while(0);B=c[a+36>>2]|0;C=B;return C|0}function cO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=100;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}L8563:do{if(p){if((c[b+108>>2]|0)<1){break}if(((du(g,g+((l|0)/3|0)|0,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/3|0)|0,h,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(h,h,i,i+((m|0)/16|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}if(((du(h-((l|0)/2|0)|0,h,i+((m|0)/4|0)|0,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}do{if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,j,c[a+68>>2]|0,k)|0)!=2){if((dv(h-((l|0)/3|0)|0,h-((l|0)/3|0)|0,i,j,c[a+68>>2]|0,k)|0)!=2){break L8563}else{break}}}while(0);if((dv(g,h,i+((m|0)/3|0)|0,i+((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=2){break}if((dv(g,h,j-((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=2){break}if((c[b+108>>2]|0)!=1){break}if((c[b+128>>2]|0)>((m|0)/3|0|0)){break}if((c[b+136>>2]|0)<(m-1-((m|0)/3|0)|0)){break}q=0;r=(c[d+8>>2]|0)-1-((m|0)/8|0)|0;while(1){if((r|0)<((m|0)/5|0|0)){break}s=dC(d,0,r,h-g|0,k,0,3)|0;if((s+2+((l|0)/16|0)|0)<=(q|0)){t=6269;break}if((s|0)>(q|0)){q=s}r=r-1|0}if((r|0)>=((m|0)/5|0|0)){break}q=l;r=0;while(1){if((r|0)>=((m|0)/3|0|0)){break}s=dC(d,(c[d+4>>2]|0)-1|0,r,h-g|0,k,0,4)|0;if((s|0)>(q+((l|0)/16|0)|0)){t=6279;break}if((s|0)<(q|0)){q=s}r=r+1|0}if((r|0)<((m|0)/3|0|0)){break}q=l;r=(c[d+8>>2]|0)-1|0;while(1){if((r|0)<=((m<<1|0)/3|0|0)){break}s=dC(d,(c[d+4>>2]|0)-1|0,r,h-g|0,k,0,4)|0;if((s|0)>(q+((l|0)/16|0)|0)){t=6289;break}if((s|0)<(q|0)){q=s}r=r-1|0}if((r|0)>((m<<1|0)/3|0|0)){break}u=dC(d,l-1|0,m-1|0,l,k,0,4)|0;if((u|0)<=(dC(d,l-1|0,m-2-((m|0)/16|0)|0,l,k,0,4)|0)){break}r=(dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0)-1|0;if((m|0)>16){r=(r|0)/2|0}do{if((r|0)>=((m|0)/16|0|0)){r=r-((m|0)/16|0)|0;if(((du((l|0)/2|0,l-1|0,m-1-r|0,m-1-r|0,d,k,1)|0)<<24>>24|0)==1){break L8563}else{break}}}while(0);u=dC(d,0,m-1|0,m,k,0,1)|0;v=dC(d,((l|0)/16|0)+1|0,m-1|0,m,k,0,1)|0;do{if((u|0)<((m|0)/2|0|0)){if((u|0)<=((m|0)/16|0|0)){break}if((u|0)<=(v|0)){break}break L8563}}while(0);if((dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0)>((l|0)/16|0|0)){o=(o*99|0|0)/100|0}v=dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0;if((v|0)>=(dC(d,l-1|0,m-1-((m|0)/16|0)|0,l,k,0,4)|0)){o=(o*97|0|0)/100|0}v=dC(d,(l|0)/2|0,0,m,k,0,2)|0;if((v-(dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0)|0)>((m|0)/8|0|0)){o=(o*97|0|0)/100|0}do{if((dC(d,0,0,l,k,0,3)|0)>=((l|0)/2|0|0)){if((dC(d,l-1|0,m-1|0,l,k,0,4)|0)<((l|0)/2|0|0)){break}if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)>=2){break}o=(o*96|0|0)/100|0}}while(0);if((c[a+24>>2]|0)!=0){o=(o*94|0|0)/100|0}if((f|0)!=0){o=(o*99|0|0)/100|0}if((e|0)==0){o=(o*99|0|0)/100|0}dy(a,68,o)|0}}while(0);n=100;if((l|0)>2){w=(m|0)>3}else{w=0}if(!w){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}o=100;if((c[b+108>>2]|0)<1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g,g+((l|0)/2|0)|0,j-((m|0)/6|0)|0,j-((m|0)/9|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g,g+((l|0)/2|0)|0,j-((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g+((l|0)/2|0)|0,h,j-((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(h-((l|0)/4|0)|0,h,i+((m|0)/8|0)|0,i+((m|0)/8|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}do{if((m|0)>19){if(((du(g,g+((l|0)/4|0)|0,i,i+((m|0)/5|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}x=a;y=x+36|0;z=c[y>>2]|0;return z|0}}while(0);if(((du(g,g+((l|0)/4|0)|0,i,i+((m|0)/6|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g,g+((l|0)/4|0)|0,j-((m|0)/8|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if(((du(g+((l|0)/2|0)-1|0,g+((l|0)/2|0)|0,j-((m|0)/8|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}j=dC(d,(c[d+4>>2]|0)-1|0,(c[d+8>>2]|0)/4|0,h-g|0,k,0,4)|0;if((j|0)>((dC(d,(c[d+4>>2]|0)-1|0,((c[d+8>>2]|0)*3|0|0)/4|0,h-g|0,k,0,4)|0)+1|0)){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}s=((l|0)/8|0)+1|0;q=0;while(1){if((q|0)<(l|0)){A=(s|0)!=0}else{A=0}if(!A){break}if((dv(q,q,0,m-1|0,d,k)|0)==2){s=s-1|0}q=q+1|0}if((s|0)>1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if((s|0)==1){o=(o*99|0|0)/100|0}s=((m|0)/6|0)+1|0;r=(m|0)/4|0;while(1){if((r|0)<(m|0)){B=(s|0)!=0}else{B=0}if(!B){break}if((dv(0,l-1|0,r,r,d,k)|0)==2){s=s-1|0}if((dv(0,l-1|0,r,r,d,k)|0)>3){s=s+1|0}r=r+1|0}if((s|0)!=0){o=(o*98|0|0)/100|0}s=((m|0)/8|0)+1|0;r=0;while(1){if((r|0)<((m|0)/2|0|0)){C=(s|0)!=0}else{C=0}if(!C){break}if((dv(0,l-1|0,r,r,d,k)|0)==1){if((dv((l|0)/2|0,l-1|0,r,r,d,k)|0)==1){s=s-1|0}}r=r+1|0}if((s|0)!=0){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if((c[b+108>>2]|0)<1){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}do{if((c[b+108>>2]|0)>1){if((l|0)>=6){o=(o*95|0|0)/100|0;break}x=a;y=x+36|0;z=c[y>>2]|0;return z|0}}while(0);if((c[b+128>>2]|0)<((m|0)/4|0|0)){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}if((m-(c[b+136>>2]|0)|0)>(((m|0)/4|0)+1|0)){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}do{if((dv(0,l-1|0,m-1-((m|0)/4|0)|0,m-1-((m|0)/4|0)|0,d,k)|0)!=2){if((m|0)>15){x=a;y=x+36|0;z=c[y>>2]|0;return z|0}else{o=(o*96|0|0)/100|0;break}}}while(0);if((e|0)==0){o=(o*98|0|0)/100|0}if((f|0)!=0){o=(o*99|0|0)/100|0}dy(a,100,o)|0;x=a;y=x+36|0;z=c[y>>2]|0;return z|0}function cP(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=c[b+8>>2]|0;k=(c[a+4>>2]|0)-g+1|0;l=i-h+1|0;m=100;if((k|0)>2){n=(l|0)>4}else{n=0}if(!n){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if((c[b+108>>2]|0)>1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if(((du(g+((k|0)/2|0)|0,g+((k|0)/2|0)|0,h,h+((l|0)/8|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)!=1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if(((du(g,g+((k|0)/4|0)|0,i-((l|0)/4|0)|0,i-((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)!=1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if(((du(g,g+((k|0)/2|0)|0,h+((l|0)/4|0)|0,h+((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)!=1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}h=0;g=0;while(1){if((g|0)>=((l|0)/4|0|0)){break}r=dC(d,k-1|0,l-1-g|0,k,j,0,4)|0;if((r|0)<3){s=6446;break}if((r*3|0|0)<(k|0)){s=6446;break}if((r|0)>(h|0)){h=r}g=g+1|0}do{if((g|0)>=((l|0)/4|0|0)){if((h|0)<((k|0)/2|0|0)){break}i=1;g=0;while(1){if((g|0)<((l|0)/4|0|0)){t=(i|0)!=0}else{t=0}if(!t){break}r=dC(d,0,g,k,j,0,3)|0;r=dC(d,r,g,k,j,1,3)|0;if((r|0)>((k|0)/2|0|0)){i=0}g=g+1|0}if((i|0)!=0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}h=dC(d,0,l-1-((l|0)/4|0)|0,k,j,0,3)|0;h=dC(d,h,l-1-((l|0)/4|0)|0,k,j,1,3)|0;i=1;g=(l|0)/3|0;while(1){if((g|0)<(l-1-((l|0)/3|0)|0)){u=(i|0)!=0}else{u=0}if(!u){break}r=dC(d,0,g,k,j,0,3)|0;r=dC(d,r,g,k,j,1,3)|0;do{if((r|0)>((k|0)/3|0|0)){if((r|0)>(h<<1|0)){if((k|0)<=8){s=6471}}else{s=6471}if((s|0)==6471){s=0;if((r|0)<=(h+1|0)){break}}i=0}}while(0);g=g+1|0}if((i|0)!=0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}g=(l|0)/8|0;if((g|0)<1){g=1}i=1;while(1){if((g|0)>=(l-1-((l|0)/2|0)|0)){break}h=dC(d,k-1|0,g,k,j,0,4)|0;if((h|0)>=2){r=dC(d,k-h|0,g,(l|0)/4|0,j,0,1)|0;h=h+(dC(d,k-h|0,g-r+1|0,k,j,0,4)|0)|0;if((h|0)>=((k|0)/3|0|0)){s=6484;break}}g=g+1|0}if((s|0)==6484){i=0}if((i|0)!=0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}i=1;g=1;while(1){if((g|0)<=((l|0)/2|0|0)){v=(i|0)!=0}else{v=0}if(!v){break}if(((du(0,(k|0)/2|0,g,g,d,j,1)|0)<<24>>24|0)!=1){i=0}g=g+1|0}if((i|0)==0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}i=1;g=(l|0)/2|0;while(1){if((g|0)<(l|0)){w=(i|0)!=0}else{w=0}if(!w){break}if(((du(0,(k|0)/3|0,g,g,d,j,1)|0)<<24>>24|0)!=1){i=0}g=g+1|0}if((i|0)==0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}i=dC(d,k-1|0,l-1|0,k,j,0,4)|0;L8947:do{if((i|0)<=((k|0)/3|0|0)){do{if((dC(d,k-1|0,(l+4|0)/8|0,k,j,0,4)|0)<=((k|0)/8|0|0)){if((dC(d,0,l-3|0,k,j,0,3)|0)<1){break}m=(m*99|0|0)/100|0;break L8947}}while(0);o=a;p=o+36|0;q=c[p>>2]|0;return q|0}}while(0);if(((du(k-1-((k|0)/4|0)|0,k-1|0,l-1-((l|0)/4|0)|0,l-1|0,d,j,1)|0)<<24>>24|0)==1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if(((du(k-1|0,k-1|0,0,(l|0)/3|0,d,j,1)|0)<<24>>24|0)!=1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}n=dC(d,0,(c[d+8>>2]|0)/4|0,k,j,0,3)|0;if((n|0)<((dC(d,0,((c[d+8>>2]|0)*3|0|0)/4|0,k,j,0,3)|0)-1|0)){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if((c[b+108>>2]|0)>0){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}i=0;h=(k|0)/4|0;while(1){if((h|0)>=(k-1|0)){break}if((dv(h,h,0,l-2|0,d,j)|0)==2){i=i+1|0}h=h+1|0}if((i|0)<1){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if((l|0)<20){do{if(((du(1,1,1,1,d,j,1)|0)<<24>>24|0)==1){if(((du(0,0,2,2,d,j,1)|0)<<24>>24|0)!=1){break}if(((du(k-2|0,k-1|0,0,0,d,j,1)|0)<<24>>24|0)!=0){break}if(((du(0,1,0,0,d,j,1)|0)<<24>>24|0)!=0){break}if(((du(0,0,0,1,d,j,1)|0)<<24>>24|0)!=0){break}o=a;p=o+36|0;q=c[p>>2]|0;return q|0}}while(0)}i=(dC(d,0,((c[d+8>>2]|0)*3|0|0)/4|0,k,j,0,3)|0)-1|0;do{if((i|0)>=0){if((dC(d,l-1|0,i,l,j,0,1)|0)>((l*3|0|0)/4|0|0)){break}m=(m*98|0|0)/100|0}}while(0);i=dC(d,(c[d+4>>2]|0)-1|0,(c[d+8>>2]|0)/4|0,k,j,0,4)|0;if((i|0)<1){r=i+(dC(d,(c[d+4>>2]|0)-1-i|0,(c[d+8>>2]|0)/4|0,k,j,1,4)|0)|0;r=dC(d,(c[d+4>>2]|0)-1-r|0,(c[d+8>>2]|0)/4|0,(l*3|0|0)/4|0,j,0,2)|0;if((r|0)<=((l|0)/2|0|0)){i=dC(d,(c[d+4>>2]|0)-1|0,0,k,j,0,4)|0;m=(m*98|0|0)/100|0;if((i|0)>((k|0)/8|0|0)){o=a;p=o+36|0;q=c[p>>2]|0;return q|0}if((i|0)!=0){m=(m*98|0|0)/100|0}}}if((e|0)==0){if(((c[a+56>>2]|0)-(c[a+8>>2]|0)<<3|0)>=(l|0)){if((dv((k<<1|0)/3|0,(k<<1|0)/3|0,0,l-1|0,d,j)|0)<2){m=(m*90|0|0)/100|0}}}if((f|0)!=0){m=(m*99|0|0)/100|0}dy(a,70,m)|0;o=a;p=o+36|0;q=c[p>>2]|0;return q|0}}while(0);o=a;p=o+36|0;q=c[p>>2]|0;return q|0}function cQ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=57344;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)>1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}b=i+((m|0)/4|0)|0;while(1){if((b|0)>=(j-((m|0)/4|0)|0)){break}if((dv(g,h,b,b,c[a+68>>2]|0,k)|0)<2){t=6588;break}b=b+1|0}if((b|0)<(j-((m|0)/4|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du((l|0)/2|0,(l|0)/2|0,(m|0)/2|0,m-1|0,d,k,1)|0)<<24>>24|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du((l|0)/2|0,l-1|0,(m|0)/2|0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=0;u=(l*3|0|0)/8|0;while(1){if((u|0)>=(l-((l|0)/4|0)|0)){break}b=dC(d,u,0,m,k,0,2)|0;if((b|0)>(p|0)){p=b}if((b|0)<(p|0)){if((p|0)>1){t=6603;break}}u=u+1|0}if((p|0)<((m|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}u=u-1|0;if(((du(0,u,p-1|0,p-1|0,d,k,1)|0)<<24>>24|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(u,l-1|0,p-1|0,p-1|0,d,k,1)|0)<<24>>24|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=((m|0)/8|0)+2|0;b=(m|0)/8|0;while(1){if((b|0)<(m-((m+2|0)/4|0)|0)){v=(p|0)!=0}else{v=0}if(!v){break}if((b|0)>((m|0)/2|0|0)){w=(l|0)/8|0}else{w=0}x=dv(0,((l|0)/2|0)-w|0,b,b,d,k)|0;do{if((b|0)<((m|0)/2|0|0)){if((dv((l|0)/2|0,l-1|0,b,b,d,k)|0)<=1){break}p=p-1|0}}while(0);do{if((b|0)<((m|0)/2|0|0)){if((x|0)>=1){break}if((x|0)<=2){break}p=p-1|0;o=(o*90|0|0)/100|0}}while(0);do{if((b|0)>((m|0)/2|0|0)){if((x|0)==1){break}p=p-1|0;o=(o*95|0|0)/100|0}}while(0);b=b+1|0}if((p|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=((m|0)/16|0)+1|0;b=(m|0)/8|0;while(1){if((b|0)<(m-((m|0)/4|0)|0)){y=(p|0)!=0}else{y=0}if(!y){break}x=dv(l-((l|0)/2|0)|0,l-1|0,b,b,d,k)|0;do{if((b|0)>((m|0)/2|0|0)){if((x|0)>=1){break}if((x|0)<=2){break}p=p-1|0}}while(0);do{if((b|0)<((m|0)/2|0|0)){if((x|0)==1){break}p=p-1|0}}while(0);b=b+1|0}if((p|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=1;u=g+((l|0)/3|0)|0;while(1){if((u|0)<=(h-((l|0)/3|0)|0)){z=(p|0)!=0}else{z=0}if(!z){break}if(((du(u,u,i,i+((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){p=0}u=u+1|0}if((p|0)!=0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=((l|0)/4|0)+1|0;u=g+((l|0)/3|0)|0;while(1){if((u|0)<=(h-((l|0)/3|0)|0)){A=(p|0)!=0}else{A=0}if(!A){break}if(((du(u,u,i+((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,3)|0)<<24>>24|0)!=2){p=p-1|0}u=u+1|0}if((p|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=1;u=g+((l|0)/3|0)|0;while(1){if((u|0)<=(h-((l|0)/3|0)|0)){B=(p|0)!=0}else{B=0}if(!B){break}if(((du(u,u,j-((m|0)/2|0)|0,j,c[a+68>>2]|0,k,3)|0)<<24>>24|0)==2){p=0}if(((du(u,u,j-((m|0)/3|0)|0,j,c[a+68>>2]|0,k,3)|0)<<24>>24|0)==2){o=(o*98|0|0)/100|0}u=u+1|0}if((p|0)==0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((dv(0,(l|0)/2|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)==2){if((dv(l-((l|0)/2|0)|0,l-1|0,m-((m|0)/4|0)|0,m-((m|0)/4|0)|0,d,k)|0)!=1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);p=dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0;x=dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0;if((p|0)<(x|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((m|0)>15){u=dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0;if((u|0)<=((dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)+1+((l|0)/32|0)|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((e|0)!=0){if((m|0)<=7){break}do{if((dC(d,0,m-1|0,l,k,1,3)|0)==(l|0)){if((dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0)<=((l|0)/16|0|0)){break}if((dC(d,0,(m*3|0|0)/4|0,l,k,0,3)|0)<=((l|0)/16|0|0)){break}if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)<=((l|0)/16|0|0)){break}if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)<=((l|0)/16|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}}while(0);p=dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0;x=dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0;do{if((p|0)>((l|0)/4|0|0)){if((x|0)<=((l|0)/4|0|0)){break}if((p+x|0)<((l|0)/2|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);if((p+x|0)>=((l|0)/2|0|0)){o=(o*97|0|0)/100|0}if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,d,k)|0)!=2){o=(o*96|0|0)/100|0}if((dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0)>0){o=(o*98|0|0)/100|0}if((o|0)==100){o=99}n=117;if((f|0)!=0){o=(o*98|0|0)/100|0}if((e|0)!=0){n=85}if((c[a+24>>2]|0)>0){o=(o*99|0|0)/100|0}dy(a,n,o)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function cR(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[a>>2]|0;f=c[a+4>>2]|0;g=c[a+8>>2]|0;h=c[a+12>>2]|0;i=c[b+8>>2]|0;j=f-e+1|0;k=h-g+1|0;if((c[b+40>>2]|0)==0){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((c[b+36>>2]|0)!=0){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}o=100;if((j|0)>2){p=(k|0)>4}else{p=0}L9248:do{if(p){if((c[b+108>>2]|0)>1){break}q=g+((k|0)/8|0)|0;while(1){if((q|0)>=((c[a+60>>2]|0)-((k|0)/4|0)|0)){break}if((dv(e,f,q,q,c[a+68>>2]|0,i)|0)<2){r=6748;break}q=q+1|0}if((q|0)<((c[a+60>>2]|0)-((k|0)/4|0)|0)){break}if(((du((j|0)/2|0,(j|0)/2|0,(k*3|0|0)/8|0,(k*7|0|0)/8|0,d,i,1)|0)<<24>>24|0)==0){break}if(((du((j|0)/2|0,j-1|0,(k*3|0|0)/8|0,(k*7|0|0)/8|0,d,i,1)|0)<<24>>24|0)==0){break}q=(k|0)/2|0;while(1){if((q|0)>=(k|0)){break}s=dC(d,j-1|0,q,j,i,0,4)|0;if((s<<3|0)>(j*5|0|0)){r=6760;break}q=q+1|0}do{if((q|0)<(k|0)){if((q<<1|0)>((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){break}t=0;s=(j<<1|0)/8|0;while(1){if((s|0)>=(j-1-((j|0)/4|0)|0)){break}q=dC(d,s,0,k,i,0,2)|0;if((q|0)>(t|0)){t=q}if((q|0)<(t|0)){if((t|0)>1){r=6772;break}}s=s+1|0}if((t|0)<((k|0)/4|0|0)){break L9248}s=s-1|0;if(((du(0,s,t-1|0,t-1|0,d,i,1)|0)<<24>>24|0)==0){break L9248}if(((du(s,j-1|0,t-1|0,t-1|0,d,i,1)|0)<<24>>24|0)==0){break L9248}t=((k|0)/16|0)+1|0;q=(k|0)/8|0;while(1){if((q|0)<(k-((c[a+64>>2]|0)-(c[a+60>>2]|0))-((k|0)/4|0)|0)){u=(t|0)!=0}else{u=0}if(!u){break}v=dv(0,(j|0)/2|0,q,q,d,i)|0;do{if((q|0)<((k|0)/2|0|0)){if((dv((j|0)/2|0,j-1|0,q,q,d,i)|0)<=1){break}t=t-1|0}}while(0);do{if((q|0)<((k|0)/2|0|0)){if((v|0)>=1){break}if((v|0)<=2){break}t=t-1|0}}while(0);do{if((q|0)>((k|0)/2|0|0)){if((v|0)==1){break}t=t-1|0}}while(0);q=q+1|0}if((t|0)==0){break L9248}t=((k|0)/16|0)+1|0;q=(k|0)/8|0;while(1){if((q|0)<(k-((c[a+64>>2]|0)-(c[a+60>>2]|0))-((k|0)/4|0)|0)){w=(t|0)!=0}else{w=0}if(!w){break}v=dv(j-((j|0)/2|0)|0,j-1|0,q,q,d,i)|0;do{if((q|0)>((k|0)/2|0|0)){if((v|0)>=1){break}if((v|0)<=2){break}t=t-1|0}}while(0);do{if((q|0)<((k|0)/2|0|0)){if((v|0)==1){break}t=t-1|0}}while(0);q=q+1|0}if((t|0)==0){break L9248}t=1;s=e+((j|0)/3|0)|0;while(1){if((s|0)<=(f-((j|0)/3|0)|0)){x=(t|0)!=0}else{x=0}if(!x){break}if(((du(s,s,g,g+((k|0)/4|0)|0,c[a+68>>2]|0,i,1)|0)<<24>>24|0)!=1){t=0}s=s+1|0}if((t|0)!=0){break L9248}t=((j|0)/4|0)+1|0;s=e+((j|0)/3|0)|0;while(1){if((s|0)<=(f-((j|0)/3|0)|0)){y=(t|0)!=0}else{y=0}if(!y){break}if(((du(s,s,g+((k|0)/4|0)|0,h-((k|0)/2|0)|0,c[a+68>>2]|0,i,3)|0)<<24>>24|0)!=2){t=t-1|0}s=s+1|0}if((t|0)==0){break L9248}if((dv(0,(j|0)/2|0,(k|0)/4|0,(k|0)/4|0,d,i)|0)!=1){break L9248}if((dv(j-((j|0)/2|0)|0,j-1|0,k-((k|0)/2|0)|0,k-((k|0)/2|0)|0,d,i)|0)!=1){break L9248}if(((du((j+2|0)/4|0,j-1|0,k-2-((k*3|0|0)/16|0)|0,k-1|0,d,i,1)|0)<<24>>24|0)==1){break L9248}if((dv(0,(j|0)/4|0,k-1|0,k-1|0,d,i)|0)!=1){break L9248}else{z=a;A=o;dy(z,181,A)|0;break L9248}}}while(0)}}while(0);l=a;m=l+36|0;n=c[m>>2]|0;return n|0}function cS(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=57344;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)>0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}b=(dC(d,(l|0)/2|0,0,l,k,1,3)|0)+((l|0)/2|0)|0;p=(dC(d,b,0,(m+1|0)/2|0,k,0,2)|0)-1|0;do{if((b|0)<=((l*3|0|0)/4|0|0)){if((p|0)<((m|0)/4|0|0)){break}if(((du(g,g+b|0,i+p|0,i+p|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+b|0,h,i+p|0,i+p|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+b|0,g+b|0,j-((m|0)/2|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if(((du(g+b|0,g+b|0,i,i+((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){if(((du(g+b+1|0,g+b+1|0,i,i+((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(0,((l|0)/2|0)+1|0,(m|0)/8|0,(m|0)/8|0,d,k)|0)!=1){if((dv(0,((l|0)/2|0)+1|0,(m|0)/16|0,(m|0)/16|0,d,k)|0)==1){t=6870;break}if((dv(((l|0)/2|0)+1|0,l-1|0,(m|0)/8|0,(m|0)/8|0,d,k)|0)==1){t=6870}}else{t=6870}}while(0);do{if((t|0)==6870){if((dv(0,l-1|0,m-1-((m|0)/8|0)|0,m-1-((m|0)/8|0)|0,d,k)|0)>1){if((dv(0,l-1|0,m-1|0,m-1|0,d,k)|0)>1){break}}if(((du(0,(l|0)/8|0,m-1-((m|0)/6|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)==1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(l-1-((l|0)/8|0)|0,l-1|0,m-1-((m|0)/6|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)==1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((e|0)==0){u=dC(d,0,(m|0)/6|0,l,k,0,3)|0;if((u|0)<(dC(d,0,m-1-((m|0)/3|0)|0,l,k,0,3)|0)){break}if((m|0)<=6){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((e|0)!=0){u=dC(d,0,(m|0)/3|0,l,k,0,3)|0;if((u|0)<(dC(d,0,m-1-((m|0)/3|0)|0,l,k,0,3)|0)){break}u=dC(d,0,m-1-((m|0)/3|0)|0,l,k,0,3)|0;if((u|0)<(dC(d,0,m-1-((m|0)/3|0)+((m|0)/6|0)|0,l,k,0,3)|0)){break}if((m|0)<=6){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);u=dC(d,0,m-1-((m|0)/3|0)|0,l,k,0,3)|0;do{if((u|0)>(dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0)){v=dC(d,l-1|0,m-1-((m|0)/3|0)|0,l,k,0,4)|0;if((v|0)<=(dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);u=dC(d,0,m-1-((m|0)/3|0)|0,l,k,0,3)|0;do{if((u|0)>=(dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0)){v=dC(d,l-1|0,m-1-((m|0)/3|0)|0,l,k,0,4)|0;if((v|0)<(dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)){break}o=(o*99|0|0)/100|0}}while(0);do{if((e|0)==0){u=dC(d,l-1|0,(m|0)/6|0,l,k,0,4)|0;if((u|0)<(dC(d,l-1|0,m-1-((m|0)/3|0)|0,l,k,0,4)|0)){break}if((m|0)<=6){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);b=dC(d,0,m-1|0,l,k,0,3)|0;b=dC(d,b,m-1|0,l,k,1,3)|0;do{if((l|0)>14){if((b<<1|0)<=(l|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(0,(l|0)/2|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)==2){if((dv(l-((l|0)/2|0)|0,l-1|0,m-((m|0)/4|0)|0,m-((m|0)/4|0)|0,d,k)|0)!=2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);u=dC(d,0,0,l,k,0,3)|0;u=dC(d,u,0,l,k,1,3)|0;v=u;u=dC(d,0,1,l,k,0,3)|0;u=dC(d,u,1,l,k,1,3)|0;if((u|0)>(v|0)){v=u}u=dC(d,0,(m|0)/4|0,l,k,0,3)|0;u=dC(d,u,(m|0)/4|0,l,k,1,3)|0;w=u;u=dC(d,0,m,l,k,0,3)|0;u=dC(d,u,m,l,k,1,3)|0;x=u;u=dC(d,0,m-1|0,l,k,0,3)|0;u=dC(d,u,m-1|0,l,k,1,3)|0;if((u|0)>(x|0)){x=u}if((i|0)<(c[a+56>>2]|0)){do{if((v-w|0)>(((l|0)/32|0)+2|0)){if((x-w|0)<=(((l|0)/32|0)+2|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}if((i|0)<(c[a+56>>2]|0)){if((v-w|0)<(((l|0)/32|0)+2|0)){if((dv(0,l-1|0,m-1-((m|0)/4|0)|0,m-1-((m|0)/4|0)|0,d,k)|0)==1){x=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;x=dC(d,x,m-1-((m|0)/4|0)|0,l,k,1,3)|0;if((x|0)<(w+1|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((x|0)<=(w+1|0)){o=(o*99|0|0)/100|0}}}}o=(o*99|0|0)/100|0;x=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;if((x|0)>(dC(d,0,m-1|0,l,k,0,3)|0)){o=(o*96|0|0)/100|0}do{if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,d,k)|0)==1){if((dv(0,l-1|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,d,k)|0)<=1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);if((f|0)!=0){o=(o*99|0|0)/100|0}n=118;if((e|0)!=0){n=86}w=a;v=n;x=o;dy(w,v,x)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function cT(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=b+44|0;o=100;p=100;if((m|0)>3){q=(l|0)>1}else{q=0}L9532:do{if(q){do{if((c[b+108>>2]|0)>0){if((c[b+136>>2]|0)<=((m|0)/2|0|0)){if((c[b+132>>2]|0)<=((l|0)/2|0|0)){break}}break L9532}}while(0);if((m<<1|0)<((c[a+60>>2]|0)-(c[a+52>>2]|0)|0)){break}if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)<=((l|0)/8|0|0)){break}r=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;if((r|0)<=((l|0)/2|0|0)){p=(p*99|0|0)/100|0}if((dC(d,l-1-((r|0)/2|0)|0,0,m,k,0,2)|0)>((m|0)/8|0|0)){p=(p*99|0|0)/100|0}do{if((l|0)>4){if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)<=(((l|0)/8|0)+2|0)){break L9532}else{break}}}while(0);s=m-((m+20|0)/32|0)|0;t=(m<<2|0)/8|0;while(1){if((t|0)>=(s|0)){break}if((t|0)<(m-((m<<1|0)/8|0)|0)){if((dv(0,l-1|0,t,t,d,k)|0)!=1){u=6976;break}}v=dC(d,0,t,l,k,0,3)|0;if((v|0)>((l*3|0|0)/8|0|0)){u=6978;break}w=dC(d,l-1|0,t,l,k,0,4)|0;if((v|0)>(w|0)){u=6980;break}if(((v+(l-w-1)|0)/2|0|0)>=((l<<2|0)/8|0|0)){u=6982;break}t=t+1|0}if((t|0)<(s|0)){break}r=(l<<2|0)/8|0;while(1){if((r|0)>=(l-((l|0)/8|0)|0)){break}if(((du(r,r,0,(m+2|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){u=6990;break}r=r+1|0}if((r|0)<(l-((l|0)/8|0)|0)){break}do{if((dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0)>((l*5|0|0)/8|0|0)){if(((du(l-1-((l|0)/8|0)|0,l-1|0,m-1-((m|0)/4|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){break}break L9532}}while(0);do{if((dC(d,0,(m*5|0|0)/8|0,l,k,0,3)|0)<=((l|0)/8|0|0)){if((dC(d,l-1|0,(m*5|0|0)/8|0,l,k,0,4)|0)<((m*5|0|0)/8|0|0)){break}if((dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0)>((m|0)/8|0|0)){break}break L9532}}while(0);x=dC(d,0,(m*3|0|0)/8|0,l,k,0,3)|0;do{if((x|0)>((dC(d,l-1|0,(m*3|0|0)/8|0,l,k,0,4)|0)+((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)<((l|0)/8|0|0)){break L9532}else{p=(p*98|0|0)/100|0;break}}}while(0);if((dC(d,0,(m|0)/3|0,l,k,0,3)|0)>((l*3|0|0)/4|0|0)){break}do{if((dC(d,0,(m|0)/4|0,l,k,0,3)|0)>((l*3|0|0)/8|0|0)){if(((du(0,(l|0)/8|0,0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){break}break L9532}}while(0);do{if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,d,k)|0)!=1){if((dv(0,l-1|0,((m|0)/2|0)+1|0,((m|0)/2|0)+1|0,d,k)|0)==1){break}break L9532}}while(0);t=(m*3|0|0)/4|0;while(1){if((t|0)>=(m-1|0)){break}if((dv(0,l-1|0,t,t,d,k)|0)==2){if((dv(0,l-1|0,t+1+((m|0)/32|0)|0,t+1+((m|0)/32|0)|0,d,k)|0)==2){u=7018;break}}t=t+1|0}if((t|0)<(m-1|0)){break}if((dC(d,l-1-((l|0)/4|0)|0,m-1|0,l,k,0,1)|0)<((m|0)/4|0|0)){p=(p*98|0|0)/100|0}if((dv(l-1|0,l-1|0,0,(m*3|0|0)/4|0,d,k)|0)>1){p=(p*95|0|0)/100|0}do{if((dv((l|0)/2|0,(l|0)/2|0,0,m-1|0,d,k)|0)>2){if((dv(((l|0)/2|0)+1|0,((l|0)/2|0)+1|0,0,m-1|0,d,k)|0)<=2){break}break L9532}}while(0);v=cI(a,c[n+60>>2]|0,c[n+12>>2]|0,g+((l|0)/3|0)|0,i+((m|0)/4|0)|0)|0;do{if((c[a+56>>2]|0)!=0){if((c[a+8>>2]<<1|0)>((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){break}if(((c[a+12>>2]|0)*3|0|0)>((c[a+56>>2]|0)+(c[a+60>>2]<<1)|0)){break}if(((c[a+296+(v<<3)+4>>2]|0)-i|0)!=0){break}p=(p*97|0|0)/100|0}}while(0);if((c[a+24>>2]|0)!=0){p=(p*98|0|0)/100|0}if((e|0)!=0){p=(p*96|0|0)/100|0}if((f|0)!=0){p=(p*97|0|0)/100|0}dy(a,114,p)|0}}while(0);o=100;p=100;if((l|0)>2){y=(m|0)>3}else{y=0}if(!y){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if((c[b+108>>2]|0)>2){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if((dv(g,h,j-((m|0)/8|0)|0,j-((m|0)/8|0)|0,c[a+68>>2]|0,k)|0)<2){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if((dC(d,(l|0)/2|0,(m|0)/4|0,m,k,0,2)|0)>((m|0)/2|0|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}do{if((dC(d,(l|0)/2|0,0,m,k,0,2)|0)>((m|0)/8|0|0)){if((dC(d,(l|0)/2|0,(m|0)/16|0,l,k,0,3)|0)>=((l|0)/2|0|0)){break}if((m|0)<16){break}z=a;A=z+36|0;B=c[A>>2]|0;return B|0}}while(0);s=1;t=i+((m|0)/8|0)|0;while(1){if((t|0)<=(j-((m|0)/8|0)|0)){C=(s|0)!=0}else{C=0}if(!C){break}if(((du(g,g+((l|0)/2|0)|0,t,t,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){s=0}t=t+1|0}if((s|0)==0){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}s=1;r=g+((l*3|0|0)/8|0)|0;while(1){if((r|0)<=(h-((l|0)/4|0)|0)){D=(s|0)!=0}else{D=0}if(!D){break}if(((du(r,r,i,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){s=0}r=r+1|0}if((s|0)==0){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}t=0;r=g+((l|0)/4|0)|0;while(1){if((r|0)>(h-((l|0)/4|0)|0)){break}s=dC(c[a+68>>2]|0,r,j,m,k,0,1)|0;if((s|0)>0){w=dC(c[a+68>>2]|0,r-1|0,j-s-1|0,m,k,0,1)|0;if((w|0)>1){s=s+(w-1)|0}}if((s|0)>(t|0)){t=s;v=r}r=r+1|0}if((t|0)<=((m|0)/8|0|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if((t|0)<((m|0)/4|0|0)){p=(p*80|0|0)/100|0}s=1;r=g+((l|0)/3|0)|0;while(1){if((r|0)<=(h-((l|0)/8|0)|0)){E=(s|0)!=0}else{E=0}if(!E){break}if((dv(r,r,i,j,c[a+68>>2]|0,k)|0)==2){s=0}r=r+1|0}if((s|0)!=0){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}s=1;t=i;while(1){if((t|0)<=(i+((m*3|0|0)/8|0)|0)){F=(s|0)!=0}else{F=0}if(!F){break}if((dv(g,h,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}s=1;t=i+((m|0)/3|0)|0;while(1){if((t|0)<=(j-((m|0)/3|0)|0)){G=(s|0)!=0}else{G=0}if(!G){break}if((dv(g,h,t,t,c[a+68>>2]|0,k)|0)==1){s=0}t=t+1|0}if((s|0)!=0){p=(p*95|0|0)/100|0}s=1;t=j-((m|0)/4|0)|0;while(1){if((t|0)<=(j|0)){H=(s|0)!=0}else{H=0}if(!H){break}if((dv(g,h,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if(((du(h-((l|0)/3|0)|0,h,i,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}r=dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0;if((r|0)>((l|0)/2|0|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}s=r;r=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;if((r|0)<=(s|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}s=r;r=dC(d,l-1|0,(m*5|0|0)/8|0,l,k,0,4)|0;if((r|0)>(s|0)){s=r}r=dC(d,l-1|0,(m*6|0|0)/8|0,l,k,0,4)|0;if((r|0)>(s|0)){s=r}r=dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0;if((r|0)>=(s|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}v=dC(d,0,(m|0)/4|0,l,k,0,3)|0;w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;if((P(v+(dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0)-(w<<1)|0)|0)>(((l|0)/16|0)+1|0)){z=a;A=z+36|0;B=c[A>>2]|0;return B|0}if((m|0)>15){w=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((w|0)>=(dC(d,l-1|0,m-1|0,l,k,0,4)|0)){v=dC(d,l-1|0,(m*3|0|0)/16|0,l,k,0,4)|0;if((v|0)<((dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0)+((l|0)/8|0)|0)){break}z=a;A=z+36|0;B=c[A>>2]|0;return B|0}}while(0)}if((m|0)>7){w=dC(d,l-1|0,m-2|0,l,k,0,4)|0;if((w|0)>(dC(d,l-1|0,m-2-((m|0)/8|0)|0,l,k,0,4)|0)){p=(p*98|0|0)/100|0;do{if((dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0)==0){if((dC(d,l-1|0,m-2-((m|0)/8|0)|0,l,k,0,4)|0)<=0){break}z=a;A=z+36|0;B=c[A>>2]|0;return B|0}}while(0)}}l=c[b+108>>2]|0;L9833:do{if((l|0)!=1){s=dH(g,h,i,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,0)|0;if((s|0)==0){p=(p*90|0|0)/100|0}do{if((l|0)<=1){if((l|0)>(s|0)){break}break L9833}}while(0);z=a;A=z+36|0;B=c[A>>2]|0;return B|0}}while(0);if((c[b+108>>2]|0)<1){p=(p*90|0|0)/100|0}if((c[b+108>>2]|0)==1){if((c[b+136>>2]|0)>((m*3|0|0)/4|0|0)){p=(p*95|0|0)/100|0}}if((e|0)==0){p=(p*98|0|0)/100|0}if((f|0)!=0){p=(p*98|0|0)/100|0}dy(a,82,p)|0;z=a;A=z+36|0;B=c[A>>2]|0;return B|0}function cU(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=0;h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=c[b+8>>2]|0;k=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;l=i-h+1|0;m=100;if((k|0)>4){n=(l|0)>3}else{n=0}L9865:do{if(n){if((c[b+108>>2]|0)>1){break}if((c[b+108>>2]|0)>0){m=(m*96|0|0)/100|0}o=dC(d,k-1|0,(l|0)/2|0,k,j,0,4)|0;if((o*3|0|0)>(k|0)){break}p=(l|0)/2|0;q=dv(0,k-1|0,p,p,d,j)|0;if((q|0)!=3){q=dv(0,k-1|0,p+1|0,p+1|0,d,j)|0}if((dv(0,k-1|0,(l|0)/2|0,(l|0)/2|0,d,j)|0)==1){break}do{if((q|0)<3){if((q|0)<=5){break}break L9865}}while(0);if((q|0)>3){m=(m*99|0|0)/100|0}do{if((q|0)>=5){o=dC(d,0,p,k,j,0,3)|0;if((o|0)>((k|0)/4|0|0)){break L9865}o=o+(dC(d,o,p,k-o|0,j,1,3)|0)|0;if((o|0)>((k|0)/2|0|0)){break L9865}r=o;o=o+(dC(d,o,p,k-o|0,j,0,3)|0)|0;if((o|0)>((k*3|0|0)/4|0|0)){break L9865}r=o-r|0;o=o+(dC(d,o,p,k-o|0,j,1,3)|0)|0;if((o|0)>((k*6|0|0)/8|0|0)){break L9865}s=o;o=o+(dC(d,o,p,k-o|0,j,0,3)|0)|0;s=o-s|0;if((r|0)>(s<<1|0)){break L9865}else{break}}}while(0);q=0;p=l-1-((l|0)/8|0)|0;while(1){if((p|0)<=((l|0)/2|0|0)){break}q=dv(0,k-1|0,p,p,d,j)|0;if((q|0)>2){t=7229;break}p=p-1|0}if((q|0)>3){break}while(1){if((p|0)<=((l|0)/2|0|0)){break}q=dv(0,k-1|0,p,p,d,j)|0;if((q|0)!=3){t=7237;break}p=p-1|0}if((q|0)>5){break}p=p+1|0;u=p;if((p|0)>((l|0)/2|0|0)){g=10}if((p|0)>((l*3|0|0)/4|0|0)){g=60}o=dC(d,0,p,k,j,0,3)|0;if((o|0)>((k|0)/4|0|0)){break}o=o+(dC(d,o,p,k-o|0,j,1,3)|0)|0;if((o|0)>((k|0)/2|0|0)){break}r=o;o=o+(dC(d,o,p,k-o|0,j,0,3)|0)|0;if((o|0)>((k*3|0|0)/4|0|0)){break}s=o;o=o+(dC(d,o,p,k-o|0,j,1,3)|0)|0;if((o|0)>((k*6|0|0)/8|0|0)){break}v=o;o=o+(dC(d,o,p,k-o|0,j,0,3)|0)|0;if((o|0)<((k*5|0|0)/8|0|0)){break}w=o;if((o|0)>=(k|0)){break}if((P(s-r-(w-v)|0)|0)>(((s-r+(w-v)|0)/4|0)+2|0)){break}if((P(s-r-(w-v)|0)|0)>(((s-r+(w-v)|0)/8|0)+2|0)){m=(m*98|0|0)/100|0}q=dC(d,0,(l*5|0|0)/8|0,k,j,0,3)|0;q=dC(d,q,(l*5|0|0)/8|0,k,j,1,3)|0;o=dC(d,0,l-((l|0)/32|0)-1|0,k,j,0,3)|0;o=dC(d,o,l-((l|0)/32|0)-1|0,k,j,1,3)|0;if((o|0)>(q+1|0)){q=1}else{q=0}p=0;o=r;while(1){if((o|0)>=(s|0)){break}q=dC(d,o,l-1|0,l,j,0,1)|0;if((q|0)>(p|0)){p=q}o=o+1|0}do{if((p|0)>=((l|0)/4|0|0)){if((p|0)<(i-h-u-1-((l|0)/16|0)|0)){break}p=0;o=v;while(1){if((o|0)>=(w|0)){break}q=dC(d,o,l-1|0,l,j,0,1)|0;if((q|0)>(p|0)){p=q}o=o+1|0}if((p|0)<((l|0)/4|0|0)){break L9865}o=r;while(1){if((o|0)>=(w|0)){break}if((dC(d,o,0,l,j,0,2)|0)>=((l|0)/2|0|0)){t=7285;break}o=o+1|0}do{if((o|0)<(w|0)){if((g|0)>=10){break}break L9865}}while(0);do{if((s-r|0)>(w-v+((k|0)/16|0)|0)){p=0;o=(r+s|0)/2|0;while(1){if((o|0)>=(s|0)){break}q=dC(d,o,0,l,j,0,2)|0;q=dC(d,o,q,l,j,1,2)|0;if((q|0)>(p|0)){p=q}if((q<<1|0)<(p|0)){t=7297;break}o=o+1|0}if((o|0)<(s|0)){break L9865}else{break}}}while(0);if((f|0)!=0){m=(m*99|0|0)/100|0}if((e|0)!=0){m=(m*99|0|0)/100|0}do{if((dC(d,k-1|0,(l|0)/16|0,k,j,0,4)|0)<2){if((dC(d,k-1|0,(l|0)/4|0,k,j,0,4)|0)<=3){break}break L9865}}while(0);o=dC(d,k-1|0,(l|0)/2|0,k,j,0,4)|0;do{if((o|0)>2){if((dC(d,k-1-((o|0)/2|0)|0,0,l,j,0,2)|0)>=((l|0)/2|0|0)){break}break L9865}}while(0);if((dC(d,(v+w|0)/2|0,0,l,j,0,2)|0)>((l|0)/2|0|0)){break L9865}x=dC(d,1,(l|0)/4|0,k,j,0,3)|0;if((x|0)>(dC(d,0,(l*7|0|0)/8|0,k,j,0,3)|0)){x=a;y=(m*98|0|0)/100|0;dy(x,109,y)|0}do{if((g|0)<10){o=dC(d,0,(l|0)/4|0,k,j,0,3)|0;o=o+(dC(d,o,(l|0)/4|0,k,j,1,3)|0)|0;while(1){if((o|0)>=(w|0)){break}q=dC(d,o,0,l,j,0,2)|0;if((q|0)>=((l|0)/4|0|0)){m=(m*99|0|0)/100|0}if((q|0)>((l+2|0)/4|0|0)){m=(m*95|0|0)/100|0}if((q*3|0|0)>(l|0)){t=7325;break}o=o+1|0}if((o|0)<(w|0)){break L9865}else{break}}}while(0);if((c[a+24>>2]|0)!=0){m=(m*99|0|0)/100|0}dy(a,109,m)|0;if((m|0)<100){break L9865}z=109;A=z;return A|0}}while(0)}}while(0);z=c[a+36>>2]|0;A=z;return A|0}function cV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=b+44|0;m=h-g+1|0;n=j-i+1|0;o=100;p=100;if((m|0)>2){q=(n|0)>3}else{q=0}L10069:do{if(q){if((c[b+108>>2]|0)>1){break}do{if((c[a+196>>2]|0)>1){if((c[a+204>>2]<<2|0)<(c[a+200>>2]|0)){break L10069}else{p=(p*99|0|0)/100|0;break}}}while(0);r=dC(d,(m|0)/8|0,0,n,k,0,2)|0;s=dC(d,m-1-((m|0)/8|0)|0,0,n,k,0,2)|0;t=d;u=(m|0)/8|0;v=r;w=n;x=k;dC(t,u,v,w,x,1,2)|0;x=d;w=m-1-((m|0)/8|0)|0;v=s;u=n;t=k;dC(x,w,v,u,t,1,2)|0;if((P(r-s|0)|0)>=((n|0)/8|0|0)){p=(p*99|0|0)/100|0}do{if((r|0)<=((n|0)/4|0|0)){if((s|0)>((n|0)/4|0|0)){break}y=(m|0)/8|0;while(1){if((y|0)>=(m-1-((m|0)/8|0)|0)){break}z=dC(d,y,0,n,k,0,2)|0;if((z|0)>(r+((n|0)/8|0)|0)){if((z|0)>(s+((n|0)/8|0)|0)){A=7359;break}}if((z|0)<(r-((n|0)/8|0)|0)){if((z|0)<(s-((n|0)/8|0)|0)){A=7362;break}}y=y+1|0}if((y|0)<(m-1-((m|0)/8|0)|0)){break L10069}if(((du(0,m-1|0,(n|0)/2|0,(n|0)/2|0,d,k,1)|0)<<24>>24|0)!=1){break L10069}if(((du(0,(m-1|0)/8|0,(n|0)/2|0,n-1-((n|0)/8|0)|0,d,k,1)|0)<<24>>24|0)==1){break L10069}if(((du(0,(m*3|0|0)/16|0,(n|0)/2|0,n-1-((n|0)/4|0)|0,d,k,1)|0)<<24>>24|0)==1){break L10069}if(((du(m-1-((m|0)/4|0)|0,m-1|0,(n|0)/2|0,n-1-((n|0)/4|0)|0,d,k,1)|0)<<24>>24|0)==1){break L10069}t=0;B=0;while(1){if((B|0)>((n|0)/4|0|0)){break}z=dC(d,0,B,m,k,0,3)|0;C=dC(d,z,B,m,k,1,3)|0;do{if((n|0)>16){if((B|0)<=0){break}if((z+C|0)>=(m|0)){break}C=C+(dC(d,z+C|0,B-1|0,m-z-C|0,k,1,3)|0)|0}}while(0);do{if((n|0)>32){if((B|0)<=1){break}if((z+C|0)>=(m|0)){break}C=C+(dC(d,z+C|0,B-2|0,m-z-C|0,k,1,3)|0)|0}}while(0);if((C|0)>(t|0)){t=C}B=B+1|0}if((t*3|0|0)<(m|0)){break L10069}if((t<<2|0)<(m<<1|0)){p=(p*99|0|0)/100|0}if((t*5|0|0)<(m*3|0|0)){p=(p*99|0|0)/100|0}B=(n|0)/4|0;while(1){if((B|0)>=((n*3|0|0)/4|0|0)){break}z=((m|0)/4|0)+(dC(d,(m|0)/4|0,B,m,k,0,3)|0)|0;C=dC(d,z,B,m,k,1,3)|0;if((C<<1|0)>(m+1|0)){A=7400;break}if((z+C|0)>=(m|0)){A=7400;break}if((z|0)<(((m|0)/4|0)-1|0)){A=7400;break}B=B+1|0}if((B|0)<((n*3|0|0)/4|0|0)){break L10069}B=(n*3|0|0)/4|0;while(1){if((B|0)>=(n|0)){break}z=dC(d,(m|0)/4|0,B,m,k,0,3)|0;z=dC(d,z,B,m,k,1,3)|0;if((z<<2|0)>(y*3|0|0)){A=7408;break}B=B+1|0}if((B|0)<(n|0)){break L10069}z=((m|0)/4|0)+(dC(d,(m|0)/4|0,(n|0)/4|0,m,k,0,3)|0)|0;if((z|0)>((m*3|0|0)/4|0|0)){break L10069}z=z+(dC(d,z,(n|0)/4|0,m,k,1,3)|0)|0;if((z|0)>((m*3|0|0)/4|0|0)){break L10069}do{if((dv(0,m-1|0,n-1|0,n-1|0,d,k)|0)!=1){if((dv(0,m-1|0,n-2|0,n-2|0,d,k)|0)==1){break}break L10069}}while(0);do{if((dv(0,m-1|0,(n<<1|0)/3|0,(n<<1|0)/3|0,d,k)|0)!=1){if((dv(0,m-1|0,(n<<1|0)/3|0,(n<<1|0)/3|0,d,k)|0)==1){break}break L10069}}while(0);do{if((c[a+60>>2]|0)!=0){if((j<<1|0)<=((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){break}if((dC(d,0,0,(n|0)/2|0,k,0,2)|0)<((n|0)/4|0|0)){break}if((dC(d,0,n-1|0,n,k,0,1)|0)>((n|0)/2|0|0)){break}p=(p*96|0|0)/100|0}}while(0);if((f|0)!=0){p=(p*98|0|0)/100|0}if((dC(d,0,n-1|0,m,k,0,3)|0)<=((m|0)/8|0|0)){p=(p*99|0|0)/100|0}z=dC(d,0,(n|0)/2|0,m,k,0,3)|0;C=dC(d,z,(n|0)/2|0,m,k,1,3)|0;if((z<<1|0)>=(m|0)){A=7434}else{if((m-C-z<<1|0)<(z|0)){A=7434}}if((A|0)==7434){p=(p*95|0|0)/100|0}dy(a,84,p)|0;if((p|0)<100){break L10069}D=84;E=D;return E|0}}while(0)}}while(0);o=100;p=100;if((m|0)>1){F=(n|0)>=((c[a+60>>2]|0)-(c[a+56>>2]|0)-1|0)}else{F=0}L10207:do{if(F){if((c[b+108>>2]|0)>1){break}if((n|0)<=((c[a+60>>2]|0)-(c[a+56>>2]|0)+1|0)){p=(p*96|0|0)/100|0}do{if((dv(0,m-1|0,0,0,d,k)|0)!=1){if((n|0)<10){break L10207}else{p=(p*98|0|0)/100|0;break}}}while(0);do{if((dv(0,m-1|0,n-1|0,n-1|0,d,k)|0)!=1){if((n|0)<10){break L10207}else{p=(p*98|0|0)/100|0;break}}}while(0);y=0;o=((n|0)/32|0)+((n*3|0|0)/16|0)|0;B=o;C=o;q=o;L10227:while(1){if((B|0)>=((n*5|0|0)/8|0|0)){break}if((B|0)>0){z=dC(d,0,B,m,k,0,3)|0;z=dC(d,z,B,m,k,1,3)|0;if((z|0)>(y|0)){y=z;o=B;C=o;q=o}z=dv(0,m-1|0,B,B,d,k)|0;C=dv(0,m-1|0,B+1|0,B+1|0,d,k)|0;if((z|0)>2){if((C|0)>2){A=7461;break}}do{if((B|0)<((n*11|0|0)/16|0|0)){if((dv(0,m-1|0,B,B,d,k)|0)==1){break}if((dv(0,m-1|0,B+((n|0)/8|0)|0,B+((n|0)/8|0)|0,d,k)|0)!=1){A=7466;break L10227}if((n|0)<13){A=7466;break L10227}}}while(0)}B=B+1|0}if((B|0)<((n<<2|0)/8|0|0)){break}do{if((n|0)>12){if((y|0)<=4){break}if((y|0)<=((m|0)/2|0|0)){break}if((q|0)>((n+4|0)/8|0|0)){break}o=dC(d,m-1-((y*3|0|0)/4|0)|0,q,n,k,1,1)|0;do{if((o|0)<=((dC(d,m-1-((y|0)/4|0)|0,q,n,k,1,1)|0)+1|0)){if((dC(d,0,(n|0)/2|0,n,k,1,1)|0)>((m|0)/8|0|0)){break L10207}else{break}}}while(0)}}while(0);if((y|0)<((m|0)/2|0|0)){p=(p*95|0|0)/100|0}do{if((y|0)>=(m|0)){if((m*9|0|0)<(n<<3|0)){break}p=(p*99|0|0)/100|0}}while(0);z=dC(d,m-1|0,0,m,k,0,4)|0;B=0;while(1){if((B|0)>=((n|0)/4|0|0)){break}if((dv(0,m-1|0,B,B,d,k)|0)==2){if((dv(0,m-1|0,B+1|0,B+1|0,d,k)|0)==2){A=7490;break}}C=dC(d,m-1|0,B,m,k,0,4)|0;if((C-z|0)>1){A=7492;break}z=C;B=B+1|0}if((B|0)<((n|0)/4|0|0)){break}z=dC(d,m-1|0,q,m,k,0,4)|0;B=(n|0)/8|0;while(1){if((B|0)>=(q|0)){break}if((dC(d,m-1|0,B,m,k,0,4)|0)>(z|0)){A=7500;break}B=B+1|0}if((B|0)==(q|0)){break}C=dC(d,0,(n|0)/2|0,m,k,0,3)|0;C=dC(d,C,(n|0)/2|0,m,k,1,3)|0;z=C;C=dC(d,0,(n|0)/4|0,m,k,0,3)|0;C=dC(d,C,(n|0)/4|0,m,k,1,3)|0;if((C|0)<(z|0)){z=C}C=dC(d,0,(n*3|0|0)/4|0,m,k,0,3)|0;C=dC(d,C,(n*3|0|0)/4|0,m,k,1,3)|0;if((C|0)<(z|0)){z=C}if((y<<1|0)<(z*3|0|0)){break}o=(dC(d,m-1|0,(n|0)/2|0,m,k,0,4)|0)-((m|0)/8|0)|0;do{if((o|0)<=(dC(d,m-1|0,q,m,k,0,4)|0)){t=(dC(d,m-1|0,q,m,k,0,4)|0)-((m|0)/8|0)|0;if((t|0)>=(dC(d,m-1|0,(q|0)/2|0,m,k,0,4)|0)){break L10207}else{break}}}while(0);C=1;B=1;while(1){if((C|0)!=0){G=(B|0)<(q|0)}else{G=0}if(!G){break}y=0;L10318:while(1){if((C|0)!=0){H=(y|0)<(m-2|0)}else{H=0}if(!H){break}do{if((d8(d,y,B)|0)>=(k|0)){if((d8(d,y+1|0,B)|0)<(k|0)){break}if((d8(d,y,B-1|0)|0)>=(k|0)){break}if((d8(d,y+1|0,B-1|0)|0)<(k|0)){A=7527;break L10318}}}while(0);y=y+1|0}if((A|0)==7527){A=0;C=0}B=B+1|0}if((C|0)==0){break}do{if((dv(0,m-1|0,n-2|0,n-2|0,d,k)|0)==2){if((dv(0,m-1|0,n-1|0,n-1|0,d,k)|0)!=2){break}break L10207}}while(0);L10342:do{if((n|0)>=16){q=dC(d,0,(n*3|0|0)/4|0,m,k,0,3)|0;if((q|0)<(dC(d,0,n-2|0,m,k,0,3)|0)){break}q=dC(d,m-1|0,(n*3|0|0)/4|0,m,k,0,4)|0;if((q|0)>(dC(d,m-1|0,n-2|0,m,k,0,4)|0)){break}q=(dC(d,m-1|0,1,m,k,0,4)|0)+((m|0)/16|0)|0;if((q|0)>=(dC(d,m-1|0,(n*3|0|0)/16|0,m,k,0,4)|0)){break}q=dC(d,0,1,m,k,0,3)|0;do{if((q|0)<=((dC(d,0,(n*3|0|0)/16|0,m,k,0,3)|0)+((m|0)/16|0)|0)){if((dC(d,m-1|0,0,m,k,0,4)|0)==0){break}if((dC(d,m-1|0,1,m,k,0,4)|0)!=0){break L10342}}}while(0);p=(p*96|0|0)/100|0}}while(0);do{if((m|0)<8){if((n|0)<=12){break}y=dC(d,m-1|0,(n*3|0|0)/16|0,m,k,0,4)|0;if((y|0)!=0){do{if((dC(d,m-y|0,0,n,k,0,2)|0)<((n*3|0|0)/16|0|0)){q=(dC(d,0,(n*3|0|0)/4|0,m,k,0,3)|0)+1|0;if((q|0)<(dC(d,0,n-2|0,m,k,0,3)|0)){break}q=dC(d,m-1|0,(n*3|0|0)/4|0,m,k,0,4)|0;if((q|0)>(dC(d,m-1|0,n-2|0,m,k,0,4)|0)){break}break L10207}}while(0)}}}while(0);if((m|0)>7){do{if((dv(0,m-1|0,(n<<1|0)/3|0,(n<<1|0)/3|0,d,k)|0)>1){if((dv(0,(m|0)/2|0,(n<<1|0)/3|0,(n<<1|0)/3|0,d,k)|0)<=0){break}if((dv((m|0)/2|0,m-1|0,(n<<1|0)/3|0,(n<<1|0)/3|0,d,k)|0)<=0){break}do{if((c[b+108>>2]|0)>0){if((c[b+128>>2]|0)>((n|0)/4|0|0)){break L10207}else{break}}}while(0)}}while(0)}do{if((dv(0,m-1|0,(n*3|0|0)/4|0,(n*3|0|0)/4|0,d,k)|0)>=2){if((dv(0,m-1|0,((n*3|0|0)/4|0)-1|0,((n*3|0|0)/4|0)-1|0,d,k)|0)<2){break}p=(p*99|0|0)/100|0;if((dC(d,(m|0)/2|0,n-1|0,n,k,0,1)|0)>((n|0)/4|0|0)){break L10207}if((dC(d,((m|0)/2|0)+1|0,n-1|0,n,k,0,1)|0)>((n|0)/4|0|0)){break L10207}else{break}}}while(0);y=dC(d,m-1|0,(n|0)/2|0,m,k,0,4)|0;z=dC(d,m-1|0,(n|0)/8|0,m,k,0,4)|0;do{if((z|0)>(y|0)){if((dC(d,m-y|0,0,n,k,0,2)|0)<((n|0)/2|0|0)){break}p=(p*90|0|0)/100|0}}while(0);y=dC(d,0,0,m,k,0,3)|0;z=dC(d,0,1,m,k,0,3)|0;if((z|0)<(y|0)){y=z}z=dC(d,0,(n|0)/4|0,m,k,0,3)|0;if((z-y|0)>1){break}r=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,h+(m<<1)|0,(i+j|0)/2|0)|0;s=cI(a,c[l+44>>2]|0,c[l+60>>2]|0,g-(m<<1)|0,(i+j|0)/2|0)|0;do{if(((c[a+296+(r<<3)>>2]|0)-g|0)>((m*3|0|0)/4|0|0)){if(((c[a+296+(s<<3)>>2]|0)-g|0)>=((m|0)/4|0|0)){break}if(((c[a+296+(r<<3)+4>>2]|0)-i|0)<=((c[a+296+(s<<3)+4>>2]|0)-i|0)){break}break L10207}}while(0);if((c[a+56>>2]|0)==0){p=(p*99|0|0)/100|0}if((c[a+56>>2]|0)!=0){if((e|0)==0){p=(p*99|0|0)/100|0}if((i|0)>=((c[a+56>>2]|0)-(((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)/4|0)|0)){p=(p*99|0|0)/100|0}if((i|0)>=(c[a+56>>2]|0)){p=(p*99|0|0)/100|0}}if((m|0)<3){p=(p*99|0|0)/100|0;do{if((dC(d,0,0,m,k,0,3)|0)==0){if((dC(d,0,n-1|0,m,k,0,3)|0)!=0){break}if((dC(d,m-1|0,(n+1|0)/2|0,m,k,0,4)|0)!=0){break}break L10207}}while(0)}do{if((dC(d,0,0,m,k,0,3)|0)<=((m|0)/8|0|0)){if((dC(d,m-1|0,((n|0)/2|0)+1|0,m,k,0,4)|0)>((m|0)/8|0|0)){break}p=(p*98|0|0)/100|0}}while(0);if((c[b+108>>2]|0)>0){p=(p*95|0|0)/100|0}if((f|0)!=0){p=(p*99|0|0)/100|0}if((c[a+24>>2]|0)!=0){p=(p*90|0|0)/100|0}dy(a,116,p)|0}}while(0);D=c[a+36>>2]|0;E=D;return E|0}function cW(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[b+8>>2]|0;h=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;i=(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0;j=100;if((h|0)>2){k=(i|0)>3}else{k=0}if(!k){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((c[b+108>>2]|0)>1){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}do{if((dv((h|0)/2|0,(h|0)/2|0,0,i-1|0,d,g)|0)!=3){if((dv((h*6|0|0)/8|0,(h<<1|0)/8|0,0,i-1|0,d,g)|0)==3){break}if((i|0)<=4){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i|0)/2|0,(i|0)/2|0,d,g)|0)!=1){if((dv(0,h-1|0,((i|0)/2|0)-1|0,((i|0)/2|0)-1|0,d,g)|0)==1){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);k=(i+2|0)/4|0;o=dC(d,0,(i+2|0)/4|0,h,g,0,3)|0;if((o|0)>((h*3|0|0)/8|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}o=o+(dC(d,o,(i+2|0)/4|0,h,g,1,3)|0)|0;if((o|0)>((h*5|0|0)/8|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}p=dC(d,o,(i+2|0)/4|0,h,g,0,3)|0;p=(p+(o<<1)|0)/2|0;k=(i*11|0|0)/16|0;o=dC(d,h-1|0,k,h,g,0,4)|0;if((o|0)>((h|0)/4|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}o=o+(dC(d,h-1-o|0,k,h,g,1,4)|0)|0;do{if((h|0)>5){if((i|0)<=7){break}if((o|0)<=((h|0)/2|0|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((o|0)>((h*3|0|0)/4|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((o|0)>((h|0)/2|0|0)){j=(j*98|0|0)/100|0}q=dC(d,h-1-o|0,k,h,g,0,4)|0;q=h-1-((q+(o<<1)|0)/2|0)|0;r=dC(d,0,(i+2|0)/4|0,h,g,0,3)|0;k=(i|0)/4|0;while(1){if((k|0)>=((i|0)/2|0|0)){break}o=dC(d,0,k,h,g,0,3)|0;if((o|0)>(r+((h|0)/8|0)|0)){if((dC(d,o-1|0,k,h,g,0,1)|0)>(((i|0)/8|0)+1|0)){s=7643;break}}k=k+1|0}if((k|0)<((i|0)/2|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}k=((i|0)/2|0)-(dC(d,h-1|0,(i|0)/2|0,(i|0)/2|0,g,1,1)|0)|0;k=(i|0)/4|0;while(1){if((k|0)>=((i|0)/2|0|0)){break}o=dC(d,h-1|0,k,h,g,0,4)|0;if((o|0)>((h|0)/8|0|0)){s=7651;break}k=k+1|0}if((k|0)==((i|0)/2|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}k=((i|0)/2|0)+(dC(d,0,(i|0)/2|0,(i|0)/2|0,g,1,2)|0)|0;if((dB(d,0,k,q,(i*11|0|0)/16|0,g)|0)==0){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}do{if((c[b+108>>2]|0)>0){if((c[b+128>>2]|0)<=((i+2|0)/4|0|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);p=dC(d,h-1|0,i-1|0,h,g,0,4)|0;q=dC(d,h-1|0,i-2|0,h,g,0,4)|0;if((q-p|0)>=((h|0)/4|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}p=dC(d,0,0,h,g,0,3)|0;q=dC(d,0,1,h,g,0,3)|0;if((q-p|0)>=((h|0)/4|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}p=dC(d,0,(i|0)/2|0,h,g,0,3)|0;p=dC(d,p,(i|0)/2|0,h,g,1,3)|0;if((p<<2|0)>=(h*3|0|0)){j=(j*97|0|0)/100|0}p=dC(d,0,(i|0)/16|0,h,g,0,3)|0;q=dC(d,0,(i<<2|0)/16|0,h,g,0,3)|0;r=dC(d,0,(i*7|0|0)/16|0,h,g,0,3)|0;L10537:do{if(((q<<1)+((h|0)/32|0)|0)>=(p+r|0)){do{if(((q<<1)+((h|0)/32|0)|0)<=(p+r|0)){if((h|0)>9){break}p=p+(dC(d,p,(i|0)/16|0,h,g,1,3)|0)|0;q=q+(dC(d,q,(i<<2|0)/16|0,h,g,1,3)|0)|0;r=r+(dC(d,r,(i*7|0|0)/16|0,h,g,1,3)|0)|0;if(((q<<1)+((h|0)/32|0)|0)<(p+r|0)){break L10537}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);k=((i*7|0)+8|0)/16|0;while(1){if((k|0)>=(((i*5|0)+4|0)/8|0|0)){break}if((dv(0,h-1|0,k,k,d,g)|0)==2){if((dv(0,h-1|0,k+1|0,k+1|0,d,g)|0)==1){if((dv(0,(h|0)/4|0,k,k,d,g)|0)==1){s=7680;break}}}k=k+1|0}if((k|0)<((i*5|0|0)/8|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}k=dC(d,h-1|0,i-2-((i|0)/32|0)|0,h,g,0,4)|0;if((k|0)>((dC(d,0,((i|0)/32|0)+1|0,h,g,0,3)|0)+((h|0)/4|0)|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}k=115;if((f|0)!=0){j=(j*98|0|0)/100|0}f=dC(d,h-1|0,0,h,g,1,4)|0;if((f|0)>((dC(d,0,i-1|0,h,g,1,3)|0)+((h|0)/8|0)|0)){j=(j*98|0|0)/100|0}if((e|0)!=0){k=83;e=dC(d,(h*3|0|0)/4|0,0,i,g,1,2)|0;if((e|0)>(dC(d,(h|0)/4|0,i-1|0,i,g,1,1)|0)){j=(j*99|0|0)/100|0}e=dC(d,h-1|0,i-1-((i|0)/32|0)|0,h,g,0,4)|0;if((e|0)>(dC(d,0,(i|0)/32|0|0,h,g,0,3)|0)){j=(j*99|0|0)/100|0}e=dC(d,0,i-1-((i|0)/32|0)|0,h,g,0,3)|0;if((e|0)>(dC(d,h-1|0,(i|0)/32|0|0,h,g,0,4)|0)){j=(j*99|0|0)/100|0}}dy(a,k,j)|0;l=a;m=l+36|0;n=c[m>>2]|0;return n|0}function cX(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[f>>2]|0;g=c[f+4>>2]|0;h=c[f+36>>2]|0;j=c[f+40>>2]|0;k=c[a>>2]|0;l=c[a+4>>2]|0;m=c[a+8>>2]|0;n=c[a+12>>2]|0;o=c[f+8>>2]|0;p=l-k+1|0;q=n-m+1|0;r=100;s=100;if((p|0)>2){t=(q|0)>4}else{t=0}L10595:do{if(t){if((c[f+108>>2]|0)>3){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,n-((q|0)/2|0)|0,n,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(l-((p|0)/4|0)|0,l,n-((q|0)/4|0)|0,n,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,m+((q|0)/2|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}do{if((dv(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,n,c[a+68>>2]|0,o)|0)<3){if((dv(l-((p|0)/2|0)|0,l-((p|0)/2|0)|0,m,n,c[a+68>>2]|0,o)|0)<3){break L10595}else{break}}}while(0);if((c[f+108>>2]|0)<1){break}u=0;while(1){if((u|0)>=(c[f+108>>2]|0)){break}if((c[f+112+(u*28|0)+24>>2]|0)<(((q*5|0|0)/8|0)+1|0)){v=7744;break}u=u+1|0}if((u|0)==(c[f+108>>2]|0)){break}c[e>>2]=(q|0)/4|0;while(1){if((c[e>>2]|0)>=(q|0)){break}if((dv(0,p-1|0,c[e>>2]|0,c[e>>2]|0,g,o)|0)==2){v=7752;break}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)==(q|0)){break}if(((du(0,(p|0)/2|0,(q*7|0|0)/8|0,(q*7|0|0)/8|0,g,o,1)|0)<<24>>24|0)!=1){break}c[e>>2]=dC(g,(p|0)/16|0,0,q,o,0,2)|0;if((c[e>>2]|0)<=((q|0)/8|0|0)){w=dC(g,(p|0)/16|0,c[e>>2]|0,q,o,1,2)|0;c[e>>2]=(c[e>>2]|0)+w}if((c[e>>2]<<4|0)>=(q*15|0|0)){break}if((dv(l,l,(m+n|0)/2|0,n,c[a+68>>2]|0,o)|0)>1){s=(s*98|0|0)/100|0;if((dv(l,l,m,(m+n|0)/2|0,c[a+68>>2]|0,o)|0)<1){s=(s*96|0|0)/100|0}if((dv(l-1|0,l-1|0,m,(m+n|0)/2|0,c[a+68>>2]|0,o)|0)<1){s=(s*95|0|0)/100|0}}c[d>>2]=0;c[e>>2]=(q|0)/4|0;while(1){if((c[e>>2]|0)>=(q-((q|0)/4|0)|0)){break}u=dC(g,p-1|0,c[e>>2]|0,q,o,0,4)|0;if((u|0)>(c[d>>2]|0)){c[d>>2]=u}c[e>>2]=(c[e>>2]|0)+1}if((c[d>>2]|0)<((p|0)/2|0|0)){if((dv(k,l,m+((q|0)/4|0)|0,m+((q|0)/4|0)|0,c[a+68>>2]|0,o)|0)>2){v=7778}else{if((dv(k,l,m+((q|0)/8|0)|0,m+((q|0)/8|0)|0,c[a+68>>2]|0,o)|0)>2){v=7778}}if((v|0)==7778){s=(s*90|0|0)/100|0}if((dv(k,l+((p|0)/4|0)|0,n-((q|0)/4|0)|0,n-((q|0)/4|0)|0,c[a+68>>2]|0,o)|0)>2){v=7781}else{if((dv(k,l+((p|0)/4|0)|0,n-((q|0)/8|0)|0,n-((q|0)/8|0)|0,c[a+68>>2]|0,o)|0)>2){v=7781}}if((v|0)==7781){s=(s*90|0|0)/100|0}}if((dv(0,p-1|0,(q|0)/2|0,(q|0)/2|0,g,o)|0)>2){s=(s*99|0|0)/100|0}c[e>>2]=0;while(1){if((c[e>>2]|0)>=(q|0)){break}c[d>>2]=0;while(1){if((c[d>>2]|0)>=((p|0)/2|0|0)){break}w=(d8(g,c[d>>2]|0,c[e>>2]|0)|0)<(o|0)|0;if((w|0)!=((d8(g,p-1-(c[d>>2]|0)|0,c[e>>2]|0)|0)<(o|0)|0)){v=7790;break}c[d>>2]=(c[d>>2]|0)+1}if((v|0)==7790){v=0;c[e>>2]=q+1}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)==(q|0)){break}if((c[a+64>>2]|0)==0){s=(s*98|0|0)/100|0}if((h|0)!=0){s=(s*96|0|0)/100|0}if((j|0)==0){s=(s*96|0|0)/100|0}s=(s*98|0|0)/100|0;dy(a,103,s)|0}}while(0);r=100;s=100;if((p|0)>3){x=(q|0)>4}else{x=0}L10712:do{if(x){if((c[f+108>>2]|0)>1){break}if(((du(k,k+((p|0)/2|0)|0,m+((q|0)/3|0)|0,m+((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,l-((p|0)/4|0)|0,m,m+((q|0)/4|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,n-((q|0)/4|0)|0,n,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k,k+((p|0)/2|0)|0,n-((q|0)/3|0)|0,n-((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}c[e>>2]=m+((q|0)/4|0);while(1){if((c[e>>2]|0)>=(n-((q|0)/3|0)|0)){break}if(((du(l-((p|0)/2|0)|0,l,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==0){v=7821;break}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)==(n-((q|0)/3|0)|0)){break}do{if((dv(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,c[e>>2]|0,c[a+68>>2]|0,o)|0)==1){if((dv(k+((p|0)/2|0)+1|0,k+((p|0)/2|0)+1|0,m,c[e>>2]|0,c[a+68>>2]|0,o)|0)!=1){break}c[d>>2]=k;c[e>>2]=n;dA(c[a+68>>2]|0,d,e,k,l,m,n,o,1,7);if((c[e>>2]|0)<(m+((q|0)/4|0)|0)){break L10712}c[d>>2]=l;c[e>>2]=n-((q|0)/3|0);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,4,7);if((c[d>>2]|0)<(l-((p*3|0|0)/8|0)|0)){break L10712}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,4);do{if((c[d>>2]|0)<(k+((p|0)/2|0)|0)){c[d>>2]=l;c[e>>2]=n-((q|0)/4|0);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,4,7);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,4);if((c[d>>2]|0)<(k+((p|0)/2|0)|0)){break L10712}else{break}}}while(0);dA(c[a+68>>2]|0,d,e,k,l,m,n,o,3,1);if((c[d>>2]|0)<=(l|0)){break L10712}if((c[e>>2]|0)<(m+((q*3|0|0)/8|0)|0)){break L10712}if((c[e>>2]|0)>(n-((q|0)/4|0)|0)){break L10712}c[d>>2]=l-((p|0)/3|0);c[e>>2]=n;dA(c[a+68>>2]|0,d,e,k,l,m+((q|0)/4|0)|0,n,o,4,1);if((c[e>>2]|0)>(m+((q|0)/4|0)+1|0)){break L10712}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,3,1);if((c[e>>2]|0)>(m|0)){break L10712}if((c[f+108>>2]|0)>0){break L10712}do{if((p|0)>4){if((q|0)<=6){break}u=1;c[e>>2]=0;while(1){if((u|0)!=0){y=(c[e>>2]|0)<((q|0)/3|0|0)}else{y=0}if(!y){break}if((dv(0,p-1|0,c[e>>2]|0,c[e>>2]|0,g,o)|0)==2){u=0}c[e>>2]=(c[e>>2]|0)+1}if((u|0)!=0){s=(s*98|0|0)/100|0}u=1;c[e>>2]=0;while(1){if((u|0)!=0){z=(c[e>>2]|0)<((q|0)/3|0|0)}else{z=0}if(!z){break}if((dv(0,p-1|0,q-1-(c[e>>2]|0)|0,q-1-(c[e>>2]|0)|0,g,o)|0)==2){u=0}c[e>>2]=(c[e>>2]|0)+1}if((u|0)!=0){break L10712}else{break}}}while(0);u=1;c[e>>2]=(q|0)/2|0;while(1){if((u|0)!=0){A=(c[e>>2]|0)<(q|0)}else{A=0}if(!A){break}if((dv(0,p-1|0,c[e>>2]|0,c[e>>2]|0,g,o)|0)==2){u=0}c[e>>2]=(c[e>>2]|0)+1}if((u|0)!=0){break L10712}u=0;c[e>>2]=(q*3|0|0)/4|0;while(1){if((c[e>>2]|0)>=(q|0)){break}c[d>>2]=dC(g,0,c[e>>2]|0,p,o,0,3)|0;if((c[d>>2]|0)<(u-((p|0)/20|0)|0)){v=7885;break}if((c[d>>2]|0)>(u|0)){u=c[d>>2]|0}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)<(q|0)){break L10712}u=0;t=(q|0)/4|0;c[e>>2]=t;B=t;while(1){if((c[e>>2]|0)>=(q-((q|0)/4|0)|0)){break}c[d>>2]=dC(g,p-1|0,c[e>>2]|0,(p|0)/4|0,o,0,4)|0;c[d>>2]=dC(g,p-1-(c[d>>2]|0)|0,c[e>>2]|0,(p|0)/2|0,o,1,4)|0;if((c[d>>2]|0)>(u|0)){u=c[d>>2]|0;B=c[e>>2]|0}c[e>>2]=(c[e>>2]|0)+1}do{if((B|0)>((q|0)/4|0|0)){if((B|0)>=(q-((q|0)/4|0)|0)){break}c[d>>2]=dC(g,0,B,p,o,0,3)|0;t=dC(g,c[d>>2]|0,B,p-(c[d>>2]|0)|0,o,1,3)|0;c[d>>2]=(c[d>>2]|0)+t;t=dC(g,c[d>>2]|0,B,p-(c[d>>2]|0)|0,o,0,3)|0;c[d>>2]=(c[d>>2]|0)+t;if((c[d>>2]|0)>=(p|0)){s=(s*90|0|0)/100|0}u=1;c[d>>2]=(p|0)/2|0;while(1){if((c[d>>2]|0)<(p-1|0)){C=(u|0)!=0}else{C=0}if(!C){break}c[e>>2]=(q|0)/2|0;L10853:while(1){if((c[e>>2]|0)<(q-1|0)){D=(u|0)!=0}else{D=0}if(!D){break}do{if((d8(g,c[d>>2]|0,c[e>>2]|0)|0)>=(o|0)){if((d8(g,(c[d>>2]|0)+1|0,c[e>>2]|0)|0)>=(o|0)){break}if((d8(g,(c[d>>2]|0)+1|0,(c[e>>2]|0)-1|0)|0)>=(o|0)){break}if((d8(g,c[d>>2]|0,(c[e>>2]|0)-1|0)|0)<(o|0)){v=7915;break L10853}}}while(0);c[e>>2]=(c[e>>2]|0)+1}if((v|0)==7915){v=0;u=0}c[d>>2]=(c[d>>2]|0)+1}if((u|0)!=0){s=(s*95|0|0)/100|0}if((h|0)==0){s=(s*98|0|0)/100|0}if((j|0)!=0){s=(s*98|0|0)/100|0}dy(a,71,s)|0;break L10712}}while(0);break L10712}}while(0)}}while(0);r=100;s=100;if((p|0)>2){E=(q|0)>4}else{E=0}if(!E){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}if((c[f+108>>2]|0)>2){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}do{if((dv(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,n,c[a+68>>2]|0,o)|0)!=3){if((dv(k+((p|0)/4|0)|0,l-((p|0)/4|0)|0,m,n,c[a+68>>2]|0,o)|0)==3){break}F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}}while(0);c[d>>2]=0;f=m+((q|0)/2|0)|0;c[e>>2]=f;u=f;while(1){if((c[e>>2]|0)>(n-((q*3|0|0)/16|0)|0)){break}I=dC(c[a+68>>2]|0,k,c[e>>2]|0,p,o,0,3)|0;do{if((I|0)>2){if((I|0)<=((p|0)/4|0|0)){break}if((c[e>>2]|0)>=(n-3|0)){break}if((I|0)>=((p|0)/2|0|0)){break}I=I+((dC(c[a+68>>2]|0,k+I-2|0,(c[e>>2]|0)+1|0,p,o,0,3)|0)-2)|0}}while(0);if((I|0)>(c[d>>2]|0)){c[d>>2]=I;u=c[e>>2]|0}c[e>>2]=(c[e>>2]|0)+1}if((c[d>>2]|0)<((p<<2|0)/8|0|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}do{if((dv(k+((p|0)/2|0)|0,l,u,n,c[a+68>>2]|0,o)|0)!=1){if((dv(k+((p|0)/2|0)|0,l,u+1|0,n,c[a+68>>2]|0,o)|0)==1){break}F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}}while(0);if((dH(k,l,m,u+1|0,c[a+68>>2]|0,o,0)|0)!=1){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}if((dH(k,l,u-1|0,n,c[a+68>>2]|0,o,0)|0)!=0){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}do{if((dC(c[a+68>>2]|0,k,n,q,o,0,3)|0)>((p|0)/3|0|0)){if((dC(c[a+68>>2]|0,k,n-1|0,q,o,0,3)|0)<=((p|0)/3|0|0)){break}F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}}while(0);c[d>>2]=0;f=m+((q|0)/3|0)|0;c[e>>2]=f;u=f;while(1){if((c[e>>2]|0)>(n-((q|0)/3|0)|0)){break}I=dC(c[a+68>>2]|0,l,c[e>>2]|0,p,o,0,4)|0;if((I|0)>(c[d>>2]|0)){c[d>>2]=I;u=c[e>>2]|0}c[e>>2]=(c[e>>2]|0)+1}if((c[d>>2]|0)>((p|0)/2|0|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}B=dC(g,p-1|0,(q|0)/8|0,p,o,0,4)|0;if((B|0)>((p|0)/2|0|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}u=dC(g,p-1|0,q-1-((q|0)/8|0)|0,p,o,0,4)|0;I=dC(g,p-1|0,(q|0)/2|0,p,o,0,4)|0;if((B+u|0)<((I<<1)-((p|0)/8|0)|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}B=dC(g,p-1|0,(q|0)/4|0,p,o,0,4)|0;if((B|0)>((p|0)/2|0|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}u=dC(g,p-1|0,q-1-((q|0)/8|0)|0,p,o,0,4)|0;c[e>>2]=(q|0)/4|0;while(1){if((c[e>>2]|0)>=(q-1-((q|0)/4|0)|0)){break}I=dC(g,p-1|0,c[e>>2]|0,p,o,0,4)|0;if((B+u-(I<<1)|0)<(-1-((p|0)/16|0)|0)){v=7976;break}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)<(q-1-((q|0)/4|0)|0)){F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}c[d>>2]=dC(g,p-1|0,(q*6|0|0)/8|0,p,o,0,4)|0;do{if((c[d>>2]|0)>0){c[d>>2]=(c[d>>2]|0)-1;c[e>>2]=dC(g,p-(c[d>>2]|0)-1|0,q-1|0,q,o,0,1)|0;if((c[e>>2]|0)>=((q|0)/8|0|0)){break}F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}}while(0);if((dv(k,l,m+((q|0)/4|0)|0,m+((q|0)/4|0)|0,c[a+68>>2]|0,o)|0)>2){s=(s*90|0|0)/100|0}if((dv(k,l+((p|0)/4|0)|0,n-((q|0)/4|0)|0,n-((q|0)/4|0)|0,c[a+68>>2]|0,o)|0)>2){v=7989}else{if((dv(k,l+((p|0)/4|0)|0,n-((q|0)/8|0)|0,n-((q|0)/8|0)|0,c[a+68>>2]|0,o)|0)>2){v=7989}}if((v|0)==7989){s=(s*90|0|0)/100|0}if((c[a+64>>2]|0)==0){s=(s*98|0|0)/100|0}if((h|0)!=0){s=(s*96|0|0)/100|0}if((j|0)==0){if(((c[a+64>>2]|0)-(c[a+60>>2]|0)|0)>2){s=(s*96|0|0)/100|0}else{if((n|0)>(c[a+60>>2]|0)){s=(s*99|0|0)/100|0}else{s=(s*97|0|0)/100|0}}}if((s|0)>99){s=99}dy(a,103,s)|0;F=a;G=F+36|0;H=c[G>>2]|0;i=b;return H|0}function cY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;b=a;a=c[b>>2]|0;d=c[b+36>>2]|0;e=c[b+40>>2]|0;f=c[a>>2]|0;g=c[a+4>>2]|0;h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=g-f+1|0;k=i-h+1|0;l=b+44|0;m=57344;n=100;o=100;if((j|0)>2){p=(k|0)>3}else{p=0}L11011:do{if(p){if((c[b+108>>2]|0)>0){break}n=(cH(32)|0)<<1;if((c[l+8>>2]|0)>(n|0)){break}if((c[l+24>>2]|0)>(n|0)){break}if((c[l+40>>2]|0)>(n|0)){break}if((c[l+56>>2]|0)>(n|0)){break}if(((c[l+48>>2]|0)-(c[l>>2]|0)|0)<((j|0)/2|0|0)){break}if(((c[l+32>>2]|0)-(c[l+16>>2]|0)|0)<((j|0)/2|0|0)){break}if(((c[l+20>>2]|0)-(c[l+4>>2]|0)|0)<((k|0)/2|0|0)){break}if(((c[l+36>>2]|0)-(c[l+52>>2]|0)|0)<((k|0)/2|0|0)){break}do{if(((c[l+4>>2]|0)-h|0)>((k|0)/16|0|0)){if(((c[l+52>>2]|0)-h|0)<=((k|0)/16|0|0)){break}if((i-(c[l+20>>2]|0)|0)<=((k|0)/16|0|0)){break}if((i-(c[l+36>>2]|0)|0)<=((k|0)/16|0|0)){break}break L11011}}while(0);do{if(((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)>2){if((((c[l+52>>2]|0)-(c[l+4>>2]|0)|0)*3|0|0)<((c[a+56>>2]|0)-(c[a+52>>2]|0)<<1|0)){break}break L11011}}while(0);q=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,f+j|0,h+((k|0)/3|0)|0)|0;r=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,f+j|0,i-((k|0)/3|0)|0)|0;s=cI(a,q,r,f+((j|0)/4|0)|0,h+((k|0)/2|0)|0)|0;if((c[a+296+(s<<3)>>2]|0)<=(f+((j|0)/8|0)|0)){break}if((c[a+296+(s<<3)>>2]|0)<=(f+((j|0)/4|0)|0)){o=(o*98|0|0)/100|0}q=cI(a,c[l+44>>2]|0,c[l+60>>2]|0,f,h+((k|0)/3|0)|0)|0;r=cI(a,c[l+44>>2]|0,c[l+60>>2]|0,f,i-((k|0)/3|0)|0)|0;s=cI(a,q,r,g-((j|0)/4|0)|0,h+((k|0)/2|0)|0)|0;if((c[a+296+(s<<3)>>2]|0)>=(g-((j|0)/8|0)|0)){break}if((c[a+296+(s<<3)>>2]|0)>=(g-((j|0)/4|0)|0)){o=(o*98|0|0)/100|0}t=c[l+12>>2]|0;u=t;v=t;while(1){if((u|0)==(c[l+28>>2]|0)){break}if((c[a+296+(u<<3)>>2]|0)>=(c[a+296+(v<<3)>>2]|0)){v=u}u=(u+1|0)%(c[a+264>>2]|0)|0}if((v|0)==(u|0)){break}t=c[a+296+(v<<3)>>2]|0;w=c[a+296+(v<<3)+4>>2]|0;q=v;if((P((c[l>>2]|0)+(c[l+16>>2]|0)+(c[l+32>>2]|0)+(c[l+48>>2]|0)-(t<<2)|0)|0)>(j+2|0)){break}if((P((c[l+4>>2]|0)+(c[l+20>>2]|0)+(c[l+36>>2]|0)+(c[l+52>>2]|0)-(w<<2)|0)|0)>(k+2|0)){break}if(((c[l>>2]|0)+(c[l+16>>2]|0)-(t<<1)|0)>=0){break}if((c[l+16>>2]|0)>=(t|0)){break}if((c[l>>2]|0)>(t|0)){break}if((c[l>>2]|0)>=(t|0)){o=(o*99|0|0)/100|0}if((t-f|0)<((j|0)/8|0|0)){break}if((t-f|0)<((j|0)/4|0|0)){o=(o*99|0|0)/100|0}x=cG(a,c[l+12>>2]|0,v)|0;if((x|0)>((cH(256)|0)<<1|0)){break}x=cG(a,v,c[l+28>>2]|0)|0;if((x|0)>((cH(256)|0)<<1|0)){break}y=c[l+28>>2]|0;u=y;v=y;while(1){if((u|0)==(c[l+44>>2]|0)){break}if((c[a+296+(u<<3)+4>>2]|0)<=(c[a+296+(v<<3)+4>>2]|0)){v=u}u=(u+1|0)%(c[a+264>>2]|0)|0}if((v|0)==(u|0)){break}t=c[a+296+(v<<3)>>2]|0;w=c[a+296+(v<<3)+4>>2]|0;s=v;if((P((c[l>>2]|0)+(c[l+16>>2]|0)+(c[l+32>>2]|0)+(c[l+48>>2]|0)-(t<<2)|0)|0)>(j+2|0)){break}if((P((c[l+4>>2]|0)+(c[l+20>>2]|0)+(c[l+36>>2]|0)+(c[l+52>>2]|0)-(w<<2)|0)|0)>(k+2|0)){break}if(((c[l+20>>2]|0)+(c[l+36>>2]|0)-(w<<1)|0)<=0){break}x=cG(a,c[l+28>>2]|0,v)|0;if((x|0)>((cH(256)|0)<<1|0)){break}x=cG(a,v,c[l+44>>2]|0)|0;if((x|0)>((cH(256)|0)<<1|0)){break}y=c[l+44>>2]|0;u=y;v=y;while(1){if((u|0)==(c[l+60>>2]|0)){break}if((c[a+296+(u<<3)>>2]|0)<=(c[a+296+(v<<3)>>2]|0)){v=u}u=(u+1|0)%(c[a+264>>2]|0)|0}if((v|0)==(u|0)){break}t=c[a+296+(v<<3)>>2]|0;w=c[a+296+(v<<3)+4>>2]|0;r=v;if((P((c[l>>2]|0)+(c[l+16>>2]|0)+(c[l+32>>2]|0)+(c[l+48>>2]|0)-(t<<2)|0)|0)>(j+2|0)){break}if((P((c[l+4>>2]|0)+(c[l+20>>2]|0)+(c[l+36>>2]|0)+(c[l+52>>2]|0)-(w<<2)|0)|0)>(k+2|0)){break}if(((c[l+32>>2]|0)+(c[l+48>>2]|0)-(t<<1)|0)<=0){break}if((c[l+48>>2]|0)<=(t|0)){break}if((c[l+32>>2]|0)<(t|0)){break}if((c[l+32>>2]|0)<=(t|0)){o=(o*99|0|0)/100|0}if((j-(t-f)|0)<((j|0)/8|0|0)){break}if((j-(t-f)|0)<((j|0)/4|0|0)){o=(o*99|0|0)/100|0}x=cG(a,c[l+44>>2]|0,v)|0;if((x|0)>((cH(256)|0)<<1|0)){break}x=cG(a,v,c[l+60>>2]|0)|0;if((x|0)>((cH(256)|0)<<1|0)){break}s=c[l+60>>2]|0;u=s;v=s;while(1){if((u|0)==(c[l+12>>2]|0)){break}if((c[a+296+(u<<3)+4>>2]|0)>=(c[a+296+(v<<3)+4>>2]|0)){v=u}u=(u+1|0)%(c[a+264>>2]|0)|0}if((v|0)==(u|0)){break}t=c[a+296+(v<<3)>>2]|0;w=c[a+296+(v<<3)+4>>2]|0;if((P((c[l>>2]|0)+(c[l+16>>2]|0)+(c[l+32>>2]|0)+(c[l+48>>2]|0)-(t<<2)|0)|0)>(j+2|0)){break}if((P((c[l+4>>2]|0)+(c[l+20>>2]|0)+(c[l+36>>2]|0)+(c[l+52>>2]|0)-(w<<2)|0)|0)>(k+2|0)){break}if(((c[l+52>>2]|0)+(c[l+4>>2]|0)-(w<<1)|0)>=0){break}x=cG(a,c[l+60>>2]|0,v)|0;if((x|0)>((cH(256)|0)<<1|0)){break}x=cG(a,v,c[l+12>>2]|0)|0;if((x|0)>((cH(256)|0)<<1|0)){break}if(((c[a+296+(r<<3)>>2]|0)-(c[a+296+(q<<3)>>2]|0)|0)>((j|0)/2|0|0)){break}if((e|0)!=0){o=(o*99|0|0)/100|0}m=120;if((d|0)!=0){m=88}dy(a,m,o)|0}}while(0);return c[a+36>>2]|0}function cZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=c[b+8>>2]|0;k=(c[a+4>>2]|0)-g+1|0;l=i-h+1|0;m=57344;n=100;o=100;if((k|0)>2){p=(l|0)>3}else{p=0}L11211:do{if(p){if((c[b+108>>2]|0)>1){break}if((c[b+108>>2]|0)>0){o=(o*97|0|0)/100|0}do{if((dv(0,k-1|0,(l|0)/8|0,(l|0)/8|0,d,j)|0)<2){if((dv(0,k-1|0,1,1,d,j)|0)>=2){break}break L11211}}while(0);do{if((dv(0,k-1|0,l-1|0,l-1|0,d,j)|0)!=1){if((dv(0,k-1|0,l-2|0,l-2|0,d,j)|0)==1){break}break L11211}}while(0);do{if((dv(k-1|0,k-1|0,0,l-1|0,d,j)|0)!=1){if((dv(k-2|0,k-2|0,0,l-1|0,d,j)|0)==1){break}break L11211}}while(0);do{if((dv((k|0)/3|0,(k|0)/3|0,(l|0)/4|0,l-1|0,d,j)|0)!=2){if((dv((k|0)/2|0,(k|0)/2|0,(l|0)/4|0,l-1|0,d,j)|0)==2){break}break L11211}}while(0);q=0;r=0;s=(k|0)/4|0;t=s;u=s;while(1){if((t|0)>=(k-((k|0)/4|0)|0)){break}v=dC(d,t,0,l,j,0,2)|0;if((v|0)>(q|0)){s=v;q=s;r=s;u=t}t=t+1|0}do{if((q|0)<=((l*12|0|0)/16|0|0)){if((q|0)<((l*3|0|0)/8|0|0)){break}w=(l|0)/8|0;x=u-(dC(d,u,w,k,j,0,4)|0)|0;if((x|0)<0){break L11211}y=(l|0)/8|0;z=u+(dC(d,u,y,k,j,0,3)|0)|0;if((z|0)>=(k|0)){break L11211}q=(l|0)/8|0;while(1){if((q|0)>=(r-((l|0)/8|0)|0)){break}if((dv(u,k-1|0,q,q,d,j)|0)!=1){A=8195;break}if((dv(0,u,q,q,d,j)|0)<1){A=8197;break}q=q+1|0}if((q|0)<(r-((l|0)/8|0)|0)){break L11211}B=l-1-((l|0)/8|0)|0;C=k-1-(dC(d,k-1|0,B,k,j,0,4)|0)|0;if((C|0)>((k*6|0|0)/8|0|0)){o=(o*99|0|0)/100|0}if((dC(d,k-1|0,l-1|0,k,j,0,4)|0)<1){break L11211}if((dt(z,y,C,B,d,j,100)|0)<95){break L11211}m=121;do{if((f|0)!=0){if((e|0)!=0){A=8211;break}m=121}else{A=8211}}while(0);if((A|0)==8211){do{if((e|0)!=0){if((f|0)!=0){if((l|0)>=14){A=8215;break}}m=89}else{A=8215}}while(0);if((A|0)==8215){o=(o*98|0|0)/100|0}}dy(a,m,o)|0;break L11211}}while(0)}}while(0);n=100;o=100;if((k|0)>2){D=(l|0)>3}else{D=0}if(!D){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}if((c[b+108>>2]|0)>1){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}do{if(((du(g,g,i-((l|0)/8|0)|0,i,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==1){if(((du(g,g+((k<<2|0)/8|0)|0,h+((l|0)/8|0)|0,h+((l|0)/8|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==1){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}else{if(((du(g,g+((k*3|0|0)/8|0)|0,h+((l|0)/8|0)|0,h+((l|0)/8|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==1){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);do{if((dv(0,k-1|0,(l|0)/8|0,(l|0)/8|0,d,j)|0)!=2){if((dv(0,k-1|0,1,1,d,j)|0)==2){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);if((dv((k|0)/2|0,(k|0)/2|0,0,1,d,j)|0)!=0){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}do{if((dv(0,k-1|0,l-1|0,l-1|0,d,j)|0)!=1){if((dv(0,k-1|0,l-2|0,l-2|0,d,j)|0)==1){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);do{if((dv(k-1|0,k-1|0,0,l-1|0,d,j)|0)!=1){if((dv(k-2|0,k-2|0,0,l-1|0,d,j)|0)==1){break}if((dv(k-((k|0)/8|0)-1|0,k-((k|0)/8|0)-1|0,0,l-1|0,d,j)|0)==1){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);g=(dC(d,k-1|0,l-1-((l|0)/8|0)|0,k,j,0,4)|0)+((k|0)/8|0)+1|0;if((g|0)<(dC(d,0,l-1-((l|0)/8|0)|0,k,j,0,3)|0)){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}q=0;t=(k|0)/4|0;while(1){if((t|0)>=(k-((k|0)/4|0)|0)){break}v=dC(d,t,0,l,j,0,2)|0;if((v|0)>(q|0)){q=v}t=t+1|0}do{if((q|0)<=((l*10|0|0)/16|0|0)){if((q|0)<((l<<1|0)/8|0|0)){break}g=k;x=g;z=g;u=g;q=0;w=0;y=0;r=0;while(1){if((q|0)>=((l|0)/4|0|0)){break}t=dC(d,0,q,k,j,0,3)|0;if((t|0)<(x|0)){x=t;w=q}t=dC(d,k-1|0,q,k,j,0,4)|0;if((t|0)<(z|0)){z=t;y=q}q=q+1|0}if((y|0)>((l|0)/8|0|0)){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}v=k;g=(l|0)/4|0;q=g;r=g;while(1){if((q|0)>=((l*3|0|0)/4|0|0)){break}if((dv(0,k-1|0,q,q,d,j)|0)<2){A=8267;break}t=dC(d,k-1|0,q,k,j,0,4)|0;t=t+(dC(d,k-1-t|0,q,k,j,1,4)|0)|0;H=dC(d,k-1-t|0,q,k,j,0,4)|0;if((H|0)<=(v|0)){v=H;r=q;u=k-1-t-((H|0)/2|0)|0}q=q+1|0}r=r+(((l|0)/16|0)+1)|0;r=r+((dC(d,u,r,v,j,1,2)|0)/2|0)|0;x=x+((dC(d,x,w,k,j,1,3)|0)/2|0)|0;z=k-1-((dC(d,k-1|0,y,k,j,1,4)|0)/2|0)|0;B=l-1-((l|0)/8|0)|0;C=k-1-(dC(d,k-1|0,B,k,j,0,4)|0)|0;if((C|0)>((k*6|0|0)/8|0|0)){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}v=0;t=k-1|0;while(1){if((v|0)>=((l|0)/4|0|0)){break}H=dC(d,k-1|0,l-1-v|0,k,j,0,4)|0;if((H|0)>(t+((k|0)/16|0)+1|0)){A=8277;break}if((H|0)<(t|0)){t=H}v=v+1|0}if((v|0)<((l|0)/4|0|0)){C=C-((dC(d,C,B,k,j,1,4)|0)/2|0)|0}do{if((dt(x,w,u,r,d,j,100)|0)<95){if((dt(x,w,u-1|0,r,d,j,100)|0)>=95){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);do{if((dt(z,y,u,r,d,j,100)|0)<95){if((dt(z,y,u-1|0,r,d,j,100)|0)>=95){break}z=z+((dC(d,z,y,(k|0)/4|0,j,1,3)|0)-1)|0;y=y+((dC(d,z,y,(l|0)/8|0,j,1,2)|0)-1)|0;if((dt(z,y,u,r,d,j,100)|0)>=95){break}E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);if((dt(u,r,C,B,d,j,100)|0)<95){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}do{if((r|0)>=((l*5|0|0)/8|0|0)){if((f|0)!=0){break}if((dt(x,w,C,B,d,j,100)|0)>95){do{if((dt(z,y,C,B,d,j,100)|0)>95){if((k|0)>4){E=a;F=E+36|0;G=c[F>>2]|0;return G|0}else{o=(o*98|0|0)/100|0;break}}}while(0)}}}while(0);x=dC(d,0,(l|0)/8|0,k,j,0,3)|0;z=dC(d,0,(l|0)/2|0,k,j,0,3)|0;u=dC(d,0,l-1|0,k,j,0,3)|0;if((z<<1|0)<(x+u|0)){o=(o*98|0|0)/100|0}if((z<<1|0)<=(x+u|0)){o=(o*98|0|0)/100|0}if((z<<1|0)<=(x+u+1|0)){o=(o*98|0|0)/100|0}m=121;do{if((f|0)==0){if((e|0)!=0){break}o=(o*98|0|0)/100|0}}while(0);if((h|0)<((c[a+56>>2]|0)-(((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)/4|0)|0)){m=89;if((f|0)!=0){o=(o*98|0|0)/100|0}}dy(a,m,o)|0;E=a;F=E+36|0;G=c[F>>2]|0;return G|0}}while(0);E=a;F=E+36|0;G=c[F>>2]|0;return G|0}function c_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=i;i=i+40|0;d=b|0;e=a;a=c[e>>2]|0;f=c[e+36>>2]|0;g=c[e+40>>2]|0;h=c[a>>2]|0;j=c[a+4>>2]|0;k=c[a+8>>2]|0;l=c[a+12>>2]|0;m=j-h+1|0;n=l-k+1|0;o=e+44|0;p=57344;q=100;r=100;if((m|0)>3){s=(n|0)>3}else{s=0}if(!s){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[e+108>>2]|0)>0){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[a+196>>2]|0)>1){r=(r*98|0|0)/100|0}q=(cH(32)|0)<<1;if((c[o+8>>2]|0)>(q|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[o+24>>2]|0)>(q|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[o+40>>2]|0)>(q|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((c[o+56>>2]|0)>(q|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+48>>2]|0)-(c[o>>2]|0)|0)<((m|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+32>>2]|0)-(c[o+16>>2]|0)|0)<((m|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+20>>2]|0)-(c[o+4>>2]|0)|0)<((n|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+36>>2]|0)-(c[o+52>>2]|0)|0)<((n|0)/2|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+48>>2]|0)-(c[o>>2]|0)|0)<3){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+32>>2]|0)-(c[o+16>>2]|0)|0)<3){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+52>>2]|0)-k|0)>((n|0)/8|0|0)){r=(r*99|0|0)/100|0}if(((c[o+4>>2]|0)-k|0)>((n|0)/8|0|0)){r=(r*99|0|0)/100|0}e=c[a+296+((cI(a,c[o+28>>2]|0,c[o+44>>2]|0,h+((m|0)/2|0)|0,k)|0)<<3)+4>>2]|0;do{if((e|0)>=(k+((n|0)/2|0)|0)){if((e|0)<((c[o+20>>2]|0)-((n|0)/8|0)|0)){if((e|0)<((c[o+36>>2]|0)-((n|0)/8|0)|0)){break}}if((m<<1|0)<(n|0)){r=(r*99|0|0)/100|0}q=cG(a,c[o+60>>2]|0,c[o+12>>2]|0)|0;if((q|0)>((cH(256)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}s=q-((cH(1024)|0)/2|0)|0;r=(aa(100-(((s|0)/(cH(1024)|0)|0|0)/4|0)|0,r)|0)/100|0;q=cG(a,c[o+28>>2]|0,c[o+44>>2]|0)|0;if((q|0)>((cH(256)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}s=cI(a,c[o+12>>2]|0,c[o+28>>2]|0,j,k)|0;w=c[a+296+(s<<3)>>2]|0;x=c[a+296+(s<<3)+4>>2]|0;if((x-k|0)>((n*5|0|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((w-h|0)<((m*3|0|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((w-(c[o>>2]|0)|0)<=((m|0)/4|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((w-(c[o>>2]|0)|0)<=((m|0)/3|0|0)){r=(r*98|0|0)/100|0}if((w-(c[o>>2]|0)|0)<((m|0)/2|0|0)){r=(r*99|0|0)/100|0}y=cI(a,c[o+12>>2]|0,c[o+28>>2]|0,j+(m<<1)|0,(k+l|0)/2|0)|0;do{if(((c[a+296+(y<<3)+4>>2]|0)-k|0)>((n+2|0)/4|0|0)){if(((c[a+296+(y<<3)>>2]|0)-w|0)<0){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);do{if(((c[a+296+(y<<3)+4>>2]|0)-x|0)>(((n|0)/8|0)+1|0)){if(((c[a+296+(y<<3)>>2]|0)-w|0)<((-m|0)/8|0|0)){break}r=(r*98|0|0)/100|0}}while(0);do{if(((c[a+296+(y<<3)+4>>2]|0)-x|0)>(((n|0)/8|0)+1|0)){if(((c[a+296+(y<<3)>>2]|0)-w|0)<0){break}r=(r*97|0|0)/100|0}}while(0);if(((c[a+296+(y<<3)+4>>2]|0)-x|0)>(((n|0)/16|0)+1|0)){r=(r*99|0|0)/100|0}if(((c[a+296+(y<<3)>>2]|0)-(c[o>>2]|0)|0)<((c[o+48>>2]|0)-(c[a+296+(y<<3)>>2]|0)|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[a+296+(y<<3)>>2]|0)-(c[o>>2]|0)|0)<((c[o+48>>2]|0)-(c[a+296+(y<<3)>>2]|0)-1<<1|0)){r=(r*98|0|0)/100|0}z=cI(a,c[o+44>>2]|0,c[o+12>>2]|0,j+m|0,k)|0;A=cI(a,c[o+44>>2]|0,c[o+12>>2]|0,j,k-m|0)|0;B=cH((c[a+296+(A<<3)>>2]|0)-(c[a+296+(z<<3)>>2]|0)|0)|0;q=B+(cH((c[a+296+(A<<3)+4>>2]|0)-(c[a+296+(z<<3)+4>>2]|0)|0)|0)|0;if((q|0)>((cH(((m|0)/8|0)+1|0)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}do{if((q|0)>0){if((m|0)>=8){break}r=(r*99|0|0)/100|0}}while(0);do{if((q|0)>1){if((m|0)>=16){break}r=(r*98|0|0)/100|0}}while(0);y=cG(a,c[o+12>>2]|0,s)|0;q=y;c[d>>2]=y;if((q|0)>((cH(256)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}y=cG(a,s,c[o+28>>2]|0)|0;q=y;c[d+4>>2]=y;if((q|0)>((cH(256)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}y=cI(a,c[o+44>>2]|0,c[o+60>>2]|0,h,l)|0;w=c[a+296+(y<<3)>>2]|0;x=c[a+296+(y<<3)+4>>2]|0;if((x-k|0)<((n*3|0|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if((w-h|0)>((m*5|0|0)/8|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+32>>2]|0)-w|0)<=((m|0)/4|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[o+32>>2]|0)-w|0)<=((m|0)/3|0|0)){r=(r*98|0|0)/100|0}if(((c[o+32>>2]|0)-w|0)<((m|0)/2|0|0)){r=(r*99|0|0)/100|0}z=cG(a,y,c[o+60>>2]|0)|0;q=z;c[d+8>>2]=z;if((q|0)>((cH(256)|0)*3|0|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}do{if((m|0)>9){if((q|0)<=((cH(256)|0)<<1|0)){break}t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);w=cG(a,c[o+44>>2]|0,y)|0;q=w;c[d+12>>2]=w;if((q|0)>((cH(256)|0)<<1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}if(((c[a+296+(s<<3)>>2]|0)-(c[a+296+(y<<3)>>2]|0)|0)<(((m|0)/8|0)-1|0)){t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}w=c[d>>2]|0;r=(aa(100-((w|0)/(cH(256)|0)|0)|0,r)|0)/100|0;w=c[d+4>>2]|0;r=(aa(100-((w|0)/(cH(256)|0)|0)|0,r)|0)/100|0;w=c[d+8>>2]|0;r=(aa(100-((w|0)/(cH(256)|0)|0)|0,r)|0)/100|0;w=c[d+12>>2]|0;r=(aa(100-((w|0)/(cH(256)|0)|0)|0,r)|0)/100|0;if((g|0)!=0){r=(r*98|0|0)/100|0}p=122;if((f|0)!=0){p=90}w=a;x=p;z=r;dy(w,x,z)|0;t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}}while(0);t=a;u=t+36|0;v=c[u>>2]|0;i=b;return v|0}function c$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=0;h=c[b+8>>2]|0;i=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;j=(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0;k=100;l=100;if((i|0)>3){m=(j|0)>3}else{m=0}L11633:do{if(m){if((c[b+108>>2]|0)>1){break}n=(j|0)/8|0;while(1){if((n|0)>=((j|0)/2|0|0)){break}if((dv(0,i-1|0,n,n,d,h)|0)<2){o=8480;break}n=n+1|0}if((n|0)<((j|0)/2|0|0)){break}p=j-1|0;do{if((i|0)>4){n=j-1-((j|0)/16|0)|0;while(1){if((n|0)<=((j*3|0|0)/4|0|0)){break}if((dv(0,i-1|0,n,n,d,h)|0)==2){o=8489;break}n=n-1|0}if((n|0)==((j*3|0|0)/4|0|0)){break L11633}else{break}}}while(0);p=n;q=dC(d,0,(j|0)/4|0,i,h,0,3)|0;q=dC(d,q,(j|0)/4|0,i,h,1,3)|0;r=0;s=0;while(1){if((n|0)<=((j|0)/4|0|0)){break}if((dv(0,i-1|0,n,n,d,h)|0)==4){s=s+1|0}else{if((dv(0,i-1|0,n,n,d,h)|0)>=3){r=r+1|0}}n=n-1|0}do{if((s+5|0)<((j|0)/4|0|0)){if((q*7|0|0)>=(j|0)){break}break L11633}}while(0);do{if((s+r|0)==0){if((j|0)<=6){if((i|0)<=4){break}}break L11633}}while(0);L11685:do{if((s+r|0)==0){if((i|0)>4){break}q=dC(d,1,j-1|0,j,h,0,1)|0;if((P(q-(dC(d,i-2|0,j-1|0,j,h,0,1)|0)|0)|0)>(((j|0)/8|0)+1|0)){break L11633}if((dC(d,1,0,j,h,0,2)|0)>=(j-2|0)){if((dC(d,0,j-1|0,j,h,0,1)|0)<=0){o=8517}}else{o=8517}do{if((o|0)==8517){if((dC(d,i-2|0,0,j,h,0,2)|0)>=(j-2|0)){if((dC(d,i-1|0,j-1|0,j,h,0,1)|0)>0){break}}l=(l*99|0|0)/100|0;break L11685}}while(0);break L11633}}while(0);do{if((dv(0,i-1|0,1,1,d,h)|0)<2){if((dv(0,i-1|0,(j|0)/16|0,(j|0)/16|0,d,h)|0)>=2){break}break L11633}}while(0);t=dC(d,0,p,i,h,0,3)|0;u=dC(d,t,p,i,h,1,3)|0;u=t+((u|0)/2|0)|0;if((u|0)>((i|0)/2|0|0)){break}t=dC(d,i-1|0,p,i,h,0,4)|0;v=dC(d,i-1-t|0,p,i,h,1,4)|0;v=i-1-t-((v|0)/2|0)|0;if((v|0)<((i*3|0|0)/8|0|0)){break}n=0;r=u+1|0;t=r;q=r;while(1){if((t|0)>=(v|0)){break}r=dC(d,t,j-1|0,j,h,0,1)|0;s=r;if((r|0)>(n|0)){q=t;n=s}t=t+1|0}do{if((i|0)>4){if((n|0)!=0){break}break L11633}}while(0);r=j-1-n|0;n=dC(d,q,r,j,h,1,1)|0;if((n|0)!=0){n=n-1|0}if((j|0)>6){o=8541}else{if((i|0)>4){o=8541}}if((o|0)==8541){do{if((dv(0,q,r-n|0,r-n|0,d,h)|0)!=2){if((dv(0,q,r-((n|0)/2|0)|0,r-((n|0)/2|0)|0,d,h)|0)==2){break}break L11633}}while(0);do{if((dv(q,i-1|0,r-n|0,r-n|0,d,h)|0)!=2){if((dv(q,i-1|0,r-((n|0)/2|0)|0,r-((n|0)/2|0)|0,d,h)|0)==2){break}break L11633}}while(0)}r=r-((n|0)/2|0)|0;t=dC(d,0,1,i,h,0,3)|0;w=dC(d,t,1,i,h,1,3)|0;if((t+w|0)>(u|0)){w=t+((w|0)/4|0)|0}else{w=t+((w|0)/2|0)|0}t=dC(d,i-1|0,1,i,h,0,4)|0;x=dC(d,i-1-t|0,1,i,h,1,4)|0;x=i-1-t-((x|0)/2|0)|0;do{if((r|0)<((j|0)/2|0|0)){if((q|0)>=((i|0)/2|0|0)){break}l=(l*98|0|0)/100|0}}while(0);do{if((r|0)<((j|0)/2|0|0)){if((q|0)>=((i*3|0|0)/8|0|0)){break}l=(l*96|0|0)/100|0}}while(0);s=dC(d,w,1,i,h,1,3)|0;t=w;while(1){if((t|0)>=(w+s|0)){break}if((dt(t,1,u,p,d,h,100)|0)>94){o=8560;break}t=t+1|0}if((t|0)==(w+s|0)){break}do{if((dt(u,p-1|0,q,r,d,h,100)|0)<95){if((dt(u,p-1|0,q,r+((j|0)/32|0)|0,d,h,100)|0)>=95){break}if((dt(u,p-1|0,q,r+((j|0)/16|0)|0,d,h,100)|0)>=95){break}break L11633}}while(0);do{if((dt(q,r,v,p,d,h,100)|0)<95){if((dt(q+1|0,r,v,p,d,h,100)|0)>=95){break}break L11633}}while(0);do{if((dt(v,p,x,((j|0)/16|0)+1|0,d,h,100)|0)<95){if((dt(v,p,i-1|0,((j|0)/8|0)+1|0,d,h,100)|0)>=95){break}if((dt(v,p,x+((i|0)/20|0)|0,((j|0)/16|0)+1|0,d,h,100)|0)>=95){break}break L11633}}while(0);s=0;n=(j*5|0|0)/8|0;while(1){if((n|0)>=(j|0)){break}t=dC(d,i-1|0,n,i,h,0,4)|0;if((t|0)>(s|0)){s=t}if((t|0)<(s-2|0)){o=8581;break}if((t|0)<(s|0)){l=(l*98|0|0)/100|0}n=n+1|0}if((n|0)<(j|0)){break}y=(e|0)!=0?87:119;if((f|0)!=0){l=(l*98|0|0)/100|0}dy(a,y,l)|0}}while(0);k=100;l=100;if((i|0)>3){z=(j|0)>3}else{z=0}if(!z){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((c[b+108>>2]|0)>1){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,h)|0)<2){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(0,i-1|0,(j|0)/8|0,(j|0)/8|0,d,h)|0)<2){g=40}if((dv(0,i-1|0,(j|0)/4|0,(j|0)/4|0,d,h)|0)<2){g=80}s=0;n=0;while(1){if((n|0)>=(j-1|0)){break}if((dv(0,i-1|0,n,n,d,h)|0)==3){s=s+1|0}n=n+1|0}if((s|0)<=((j|0)/8|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}n=(j|0)/2|0;while(1){if((n|0)>=(j-1-((j|0)/8|0)|0)){break}if((dv(0,i-1|0,n,n,d,h)|0)==3){o=8614;break}n=n+1|0}p=n;t=dC(d,0,p,i,h,0,3)|0;t=t+(dC(d,t,p,i,h,1,3)|0)|0;if((t|0)>((i|0)/2|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}u=dC(d,t,p,i,h,0,3)|0;u=t+((u|0)/2|0)|0;if((u|0)>((i|0)/2|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}t=dC(d,i-1|0,p,i,h,0,4)|0;t=t+(dC(d,i-1-t|0,p,i,h,1,4)|0)|0;v=dC(d,i-1-t|0,p,i,h,0,4)|0;v=i-1-t-((v|0)/2|0)|0;if((v|0)<((i*3|0|0)/8|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(u,v,p,p,d,h)|0)!=1){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(u,u,p,j-1|0,d,h)|0)!=1){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(v,v,p,j-1|0,d,h)|0)!=1){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(u,u,0,p,d,h)|0)!=0){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((dv(v,v,0,p,d,h)|0)!=0){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((c[b+108>>2]|0)!=0){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}s=0;n=(j*3|0|0)/4|0;while(1){if((n|0)>=(j|0)){break}t=dC(d,i-1|0,n,i,h,0,4)|0;if((t|0)>(s|0)){s=t}if((t|0)<(s-2|0)){o=8640;break}n=n+1|0}if((n|0)<(j|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}y=(e|0)!=0?87:119;if((f|0)!=0){l=(l*98|0|0)/100|0}dy(a,y,l)|0;A=a;B=A+36|0;C=c[B>>2]|0;return C|0}function c0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=b+44|0;o=100;p=100;if((l|0)>2){q=(m|0)>3}else{q=0}L11897:do{if(q){if((c[b+108>>2]|0)>2){break}do{if(((du((l|0)/2|0,(l|0)/2|0,m-1-((m|0)/8|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)==1){if(((du(((l|0)/2|0)-1|0,((l|0)/2|0)-1|0,m-1-((m|0)/8|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){break}break L11897}}while(0);r=0;if((c[a+40>>2]|0)!=0){r=0;while(1){if((r|0)>=((m|0)/2|0|0)){break}if((dv(0,l-1|0,r,r,d,k)|0)==0){s=8677;break}r=r+1|0}}if((r|0)>=((m|0)/2|0|0)){r=0}do{if((dv(0,l-1|0,r+1|0,r+1|0,d,k)|0)!=1){if((dv(0,l-1|0,r+((m|0)/8|0)|0,r+((m|0)/8|0)|0,d,k)|0)==1){break}if((dv(0,l-1|0,r+((m|0)/16|0)|0,r+((m|0)/16|0)|0,d,k)|0)==1){break}if((dv(0,l-1|0,r+((m|0)/8|0)+1|0,r+((m|0)/8|0)+1|0,d,k)|0)==1){break}break L11897}}while(0);do{if((dv(0,l-1|0,(m*7|0|0)/8|0,(m*7|0|0)/8|0,d,k)|0)!=2){if((dv(0,l-1|0,((m*7|0|0)/8|0)-1|0,((m*7|0|0)/8|0)-1|0,d,k)|0)==2){break}break L11897}}while(0);if((dv(0,(l|0)/8|0,r+((m|0)/8|0)|0,r|0,d,k)|0)>0){break}t=r+((m|0)/8|0)|0;while(1){if((t|0)>=(r+((m|0)/2|0)|0)){break}if((dv(0,l-1|0,t,t,d,k)|0)>1){s=8696;break}t=t+1|0}if((t|0)==(r+((m|0)/2|0)|0)){break}u=t;if((m|0)>20){u=u+1|0}v=dC(d,0,u,l,k,0,3)|0;if((v|0)>((l*3|0|0)/4|0|0)){break}v=v+(dC(d,v,u,l,k,1,3)|0)|0;if((v|0)>((l*3|0|0)/4|0|0)){break}w=v;v=v+(dC(d,v,u,l,k,0,3)|0)|0;if((v|0)<((l*3|0|0)/8|0|0)){break}w=(v+w|0)/2|0;t=t+(dC(d,w,t,m,k,1,2)|0)|0;t=t+(dC(d,w,t,m,k,0,2)|0)|0;if((t|0)>((m*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((t|0)>((m*5|0|0)/6|0|0)){break}do{if((c[b+108>>2]|0)==(((c[a+40>>2]|0)==730?2:1)|0)){if(((c[b+136>>2]|0)-r|0)>=(m-1-((m|0)/4|0)|0)){break}x=0;y=0;v=(l|0)/3|0;while(1){if((v|0)>=((l<<1|0)/3|0|0)){break}y=dv(w,v,t,m-1|0,d,k)|0;if((y|0)<1){s=8722}else{if((y|0)>2){s=8722}}if((s|0)==8722){s=0;y=dv(w,v,t+((m|0)/16|0)|0,m-1|0,d,k)|0}if((y|0)<1){s=8725;break}if((y|0)>2){s=8725;break}if((y|0)==1){x=v}v=v+1|0}do{if((y|0)>=1){if((y|0)>2){break}if((x|0)==0){break}if(((du(l-1-((l|0)/4|0)|0,l-1|0,m-1-((m|0)/4|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){break L11897}u=dC(d,l-1|0,r+((m-r|0)/4|0)|0,l,k,0,4)|0;w=dC(d,l-1|0,r+((m-r|0)/2|0)|0,l,k,0,4)|0;x=dC(d,l-1|0,m-1-((m-r|0)/4|0)|0,l,k,0,4)|0;if(((w<<1)-((l|0)/8|0)|0)>(u+x|0)){p=(p*99|0|0)/100|0}do{if(((w<<1)+((l|0)/4|0)|0)>=(u+x|0)){if(((w<<1)-((l|0)/4|0)|0)>(u+x|0)){break}u=dC(d,0,r+((m-r|0)/4|0)|0,l,k,0,3)|0;w=dC(d,0,r+((m-r|0)/2|0)|0,l,k,0,3)|0;x=dC(d,0,m-1-((m-r|0)/4|0)|0,l,k,0,3)|0;if(((w<<1)-((l|0)/8|0)|0)>(u+x|0)){p=(p*98|0|0)/100|0}do{if(((w<<1)+((l|0)/4|0)|0)>=(u+x|0)){if(((w<<1)-((l|0)/4|0)|0)>(u+x|0)){break}if((u|0)<(x|0)){break}x=l;t=r+((m-r|0)/4|0)|0;while(1){if((t|0)>=((m*7|0|0)/8|0|0)){break}u=dC(d,0,t,l,k,0,3)|0;w=dC(d,l-1|0,t,l,k,0,4)|0;if((u+w|0)>(x+((l|0)/16|0)|0)){s=8750;break}if((u+12|0)<(x|0)){x=u+w|0}t=t+1|0}if((t|0)<((m*7|0|0)/8|0|0)){break L11897}z=dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0;if((z-(dC(d,0,(m|0)/2|0,l,k,0,3)|0)|0)>0){p=(p*97|0|0)/100|0}if((e|0)==0){p=(p*99|0|0)/100|0}dy(a,65,p)|0;break L11897}}while(0);break L11897}}while(0);break L11897}}while(0);break L11897}}while(0)}}while(0);o=100;p=100;if((l|0)>2){A=(m|0)>4}else{A=0}L12034:do{if(A){if((c[b+108>>2]|0)>1){break}if((c[a+196>>2]|0)!=((c[a+24>>2]|0)+2|0)){break}do{if((c[n>>2]|0)<=(g+((l|0)/4|0)|0)){if((c[n+4>>2]|0)>(i+((m|0)/4|0)|0)){break}do{if((c[n+16>>2]|0)<=(g+((l|0)/4|0)|0)){if((c[n+20>>2]|0)<(j-((m|0)/4|0)|0)){break}do{if((c[n+32>>2]|0)>=(h-((l|0)/4|0)|0)){if((c[n+36>>2]|0)<(j-((m|0)/4|0)|0)){break}do{if((c[n+48>>2]|0)>=(h-((l|0)/4|0)|0)){if((c[n+52>>2]|0)>(i+((m|0)/4|0)|0)){break}u=cI(a,c[n+12>>2]|0,c[n+28>>2]|0,h,i+((m|0)/3|0)|0)|0;do{if((c[a+296+(u<<3)>>2]|0)>(c[n>>2]|0)){if((c[a+296+(u<<3)>>2]|0)<=(c[n+16>>2]|0)){break}if((c[a+296+(u<<3)>>2]|0)<(g+((l|0)/3|0)|0)){break L12034}do{if((c[a+296+(u<<3)>>2]|0)<(h-((l|0)/3|0)|0)){B=dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,i,j-i|0,k,0,2)|0;if((B|0)>((m|0)/8|0|0)){break L12034}B=dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,i+B|0,j-i|0,k,1,2)|0;q=dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,j,j-i|0,k,0,1)|0;if((q|0)>((m|0)/8|0|0)){break L12034}q=dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,j-q|0,j-i|0,k,1,1)|0;if((q|0)>((m|0)/3|0|0)){break L12034}if((B|0)<((q<<1)-((m|0)/16|0)|0)){break L12034}else{p=(p*98|0|0)/100|0;break}}}while(0);if((c[a+296+(u<<3)+4>>2]|0)>(i+((m|0)/2|0)|0)){break L12034}w=cI(a,u,c[n+28>>2]|0,g-((l|0)/2|0)|0,i+((m|0)/2|0)|0)|0;if((c[a+296+(w<<3)>>2]|0)>(g+((l+4|0)/8|0)+1|0)){break L12034}if((c[a+296+(w<<3)+4>>2]|0)>(j-((m|0)/4|0)|0)){break L12034}B=0;while(1){if((B|0)>=(c[a+196>>2]|0)){break}if((c[a+200+(B<<2)>>2]|0)<0){s=8806;break}B=B+1|0}do{if((B|0)<(c[a+196>>2]|0)){if((B|0)<1){break}x=c[a+264+(B-1<<2)>>2]|0;y=(c[a+264+(B<<2)>>2]|0)-1|0;if((c[a+296+((cI(a,x,y,g+((l|0)/2|0)|0,i)|0)<<3)+4>>2]|0)<(i+((m|0)/3|0)|0)){break L12034}if((c[a+56>>2]|0)!=0){if((c[b+40>>2]|0)!=0){p=(p*98|0|0)/100|0}if((c[b+36>>2]|0)!=0){p=(p*98|0|0)/100|0}}else{p=(p*99|0|0)/100|0}q=a;r=p;dy(q,97,r)|0;if((p|0)<100){break L12034}C=97;D=C;return D|0}}while(0);break L12034}}while(0);break L12034}}while(0);break L12034}}while(0);break L12034}}while(0);break L12034}}while(0)}}while(0);o=100;p=100;if((l|0)>3){E=(m|0)>3}else{E=0}L12123:do{if(E){if((c[b+108>>2]|0)>2){break}if(((du(g,g+((l|0)/2|0)|0,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(h-((l|0)/2|0)|0,h,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,j-((m|0)/2|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(g+((l|0)/3|0)|0,g+((l|0)/3|0)|0,i,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}B=dC(d,(l|0)/2|0,0,m,k,0,2)|0;if((B|0)>((m|0)/4|0|0)){break}B=B+(dC(d,(l|0)/2|0,B,m,k,1,2)|0)|0;if((B|0)>((m|0)/2|0|0)){break}B=dC(d,(l|0)/2|0,B,m,k,0,2)|0;if((B|0)<((m|0)/4|0|0)){break}if(((du(g,g,j,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,j,c[a+68>>2]|0,k)|0)!=2){break}do{if((dv(g+((l|0)/3|0)|0,h-((l|0)/3|0)|0,i,i,c[a+68>>2]|0,k)|0)!=1){if((dv(g+((l|0)/3|0)|0,h-((l|0)/3|0)|0,i+1|0,i+1|0,c[a+68>>2]|0,k)|0)!=1){break L12123}else{break}}}while(0);B=dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0;if((B|0)>((m|0)/3|0|0)){break}t=B+(dC(d,(l|0)/2|0,m-1-B|0,m,k,1,1)|0)|0;if((B|0)>((m|0)/2|0|0)){break}do{if((dv(g+((l|0)/2|0)-1|0,h,j,j,c[a+68>>2]|0,k)|0)<2){if((dv(g+((l|0)/2|0)-1|0,h,j-B|0,j-B|0,c[a+68>>2]|0,k)|0)>=2){break}if((dv(g+((l|0)/2|0)-1|0,h,j-t|0,j-t|0,c[a+68>>2]|0,k)|0)>=2){break}n=dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0;if((n|0)<((dC(d,l-1|0,m-1-((m|0)/16|0)|0,l,k,0,4)|0)<<2|0)){break L12123}p=(p*98|0|0)/100|0}}while(0);do{if((dv(g,h,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k)|0)>=2){if((dv(g,h,i+((m|0)/3|0)|0,i+((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)<2){break}do{if((dv(g,g,i+((m|0)/3|0)|0,j-((m|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(g+1|0,g+1|0,i+((m|0)/3|0)|0,j-((m|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=1){break L12123}else{break}}}while(0);do{if((c[b+108>>2]|0)!=1){if((dH(g,h-2|0,i,j,c[a+68>>2]|0,k,0)|0)!=1){break L12123}else{break}}}while(0);if((dH(g,h,i+((m|0)/3|0)|0,j-1|0,c[a+68>>2]|0,k,0)|0)!=0){break L12123}n=dC(d,0,0,h-g|0,k,0,3)|0;if((n|0)<=(dC(d,0,2,h-g|0,k,0,3)|0)){break L12123}do{if((dC(d,l-1|0,m-1|0,h-g|0,k,0,4)|0)>((l|0)/4|0|0)){if((dC(d,l-1|0,m-2|0,h-g|0,k,0,4)|0)<=((l+4|0)/8|0|0)){break}p=(p*97|0|0)/100|0}}while(0);v=dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0;B=dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0;if((P(v-B|0)|0)>((l|0)/4|0|0)){break L12123}v=(l|0)/4|0;while(1){if((v|0)>=(l-((l|0)/4|0)|0)){break}B=dC(d,v,0,j-i|0,k,0,2)|0;if((B|0)>((m|0)/2|0|0)){s=8888;break}B=dC(d,v,m-1|0,j-i|0,k,0,1)|0;if((B|0)>((m|0)/2|0|0)){s=8890;break}v=v+1|0}if((v|0)<(l-((l|0)/4|0)|0)){break L12123}if((dv(g,h,j,j,c[a+68>>2]|0,k)|0)==1){if((dv(g,h,i,i,c[a+68>>2]|0,k)|0)==1){do{if((dC(d,l-1|0,0,j-i|0,k,0,2)|0)>((m|0)/4|0|0)){if((dC(d,l-1|0,m-1|0,j-i|0,k,0,1)|0)<=((m|0)/4|0|0)){break}break L12123}}while(0)}}if((dC(d,(l|0)/2|0,m-1|0,j-i|0,k,0,1)|0)>((m|0)/4|0|0)){break L12123}do{if((p|0)>99){if((dC(d,l-1|0,m-1|0,j-i|0,k,0,1)|0)<=((m|0)/32|0|0)){break}p=(p*98|0|0)/100|0}}while(0);if((e|0)!=0){p=(p*96|0|0)/100|0}if((f|0)!=0){p=(p*98|0|0)/100|0}dy(a,97,p)|0;break L12123}}while(0)}}while(0);o=100;p=100;if((l|0)>2){F=(m|0)>4}else{F=0}L12249:do{if(F){if((c[b+108>>2]|0)>2){break}if(((du((l|0)/2|0,(l|0)/2|0,m-1-((m|0)/8|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)==1){break}do{if((dv(0,l-1|0,1,1,d,k)|0)!=1){if((dv(0,l-1|0,(m|0)/8|0,(m|0)/8|0,d,k)|0)==1){break}if((dv(0,l-1|0,(m|0)/16|0,(m|0)/16|0,d,k)|0)==1){break}if((dv(0,l-1|0,((m|0)/8|0)+1|0,((m|0)/8|0)+1|0,d,k)|0)==1){break}break L12249}}while(0);if((dv(0,l-1|0,m-1|0,m-1|0,d,k)|0)!=1){break}do{if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){if((dv(0,l-1|0,(m|0)/3|0,(m|0)/3|0,d,k)|0)==2){break}break L12249}}while(0);if((dv(0,(l|0)/8|0,(m|0)/8|0,0,d,k)|0)>0){break}t=(m|0)/8|0;while(1){if((t|0)>=((m|0)/2|0|0)){break}if((dv(0,l-1|0,t,t,d,k)|0)>1){s=8935;break}t=t+1|0}if((t|0)==((m|0)/2|0|0)){break}u=t;if((m|0)>20){u=u+1|0}v=dC(d,0,u,l,k,0,3)|0;if((v|0)>((l*3|0|0)/4|0|0)){break}v=v+(dC(d,v,u,l,k,1,3)|0)|0;if((v|0)>((l*3|0|0)/4|0|0)){break}w=v;v=v+(dC(d,v,u,l,k,0,3)|0)|0;if((v|0)<((l*3|0|0)/8|0|0)){break}w=(v+w|0)/2|0;t=t+(dC(d,w,t,m,k,1,2)|0)|0;t=t+(dC(d,w,t,m,k,0,2)|0)|0;if((t|0)>((m*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((t|0)>((m*5|0|0)/6|0|0)){break}do{if((c[b+108>>2]|0)==1){if((c[b+136>>2]|0)>=(m-1-((m|0)/4|0)|0)){break}x=0;y=0;v=(l|0)/3|0;while(1){if((v|0)>=((l<<1|0)/3|0|0)){break}y=dv(w,v,t,m-1|0,d,k)|0;if((y|0)<1){s=8959}else{if((y|0)>2){s=8959}}if((s|0)==8959){s=0;y=dv(w,v,t+((m|0)/16|0)|0,m-1|0,d,k)|0}if((y|0)<1){s=8962;break}if((y|0)>2){s=8962;break}if((y|0)==1){x=v}v=v+1|0}do{if((y|0)>=1){if((y|0)>2){break}if((x|0)==0){break}if(((du(l-1-((l|0)/4|0)|0,l-1|0,m-1-((m|0)/4|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){break L12249}if((dv(0,(l|0)/8|0,(m|0)/6|0,0,d,k)|0)>0){break L12249}if((dv(l-1-((l|0)/4|0)|0,l-1|0,0,(m|0)/6|0,d,k)|0)>0){break L12249}u=dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0;w=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;x=dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0;do{if(((w<<1)+((l|0)/4|0)|0)>=(u+x|0)){if(((w<<1)-((l|0)/8|0)|0)>(u+x|0)){break}u=dC(d,0,(m|0)/4|0,l,k,0,3)|0;w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;x=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;do{if(((w<<1)+((l|0)/4|0)|0)>=(u+x|0)){if(((w<<1)-((l|0)/8|0)|0)>(u+x|0)){break}if((u|0)<(x|0)){break}x=l;t=(m|0)/4|0;while(1){if((t|0)>=((m*6|0|0)/8|0|0)){break}u=dC(d,0,t,l,k,0,3)|0;w=dC(d,l-1|0,t,l,k,0,4)|0;if((u+w|0)>(x+((l|0)/16|0)|0)){s=8987;break}if((u+12|0)<(x|0)){x=u+w|0}t=t+1|0}if((t|0)<((m*6|0|0)/8|0|0)){break L12249}if((e|0)==0){p=(p*96|0|0)/100|0}if((f|0)==0){p=(p*98|0|0)/100|0}dy(a,260,p)|0;break L12249}}while(0);break L12249}}while(0);break L12249}}while(0);break L12249}}while(0)}}while(0);C=c[a+36>>2]|0;D=C;return D|0}function c1(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=57344;o=100;if((l|0)>2){p=(m|0)>2}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)>1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g,g+((l|0)/3|0)|0,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,j-((m|0)/3|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,i+((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((dv(g,(g+h|0)/2|0,(i+j|0)/2|0,(i+j|0)/2|0,c[a+68>>2]|0,k)|0)>1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}b=i+((m|0)/4|0)|0;while(1){if((b|0)>=(i+((m*3|0|0)/4|0)|0)){break}if(((du(g+((l|0)/2|0)|0,h,b,b,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){t=9020;break}b=b+1|0}if((b|0)==(i+((m*3|0|0)/4|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=b;u=dC(d,0,(m|0)/2|0,l,k,0,3)|0;u=dC(d,u,(m|0)/2|0,l,k,1,3)|0;if((u|0)>((l|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}b=p;v=0;w=g+((l|0)/2|0)|0;while(1){if((w|0)>=(g+((l*6|0|0)/8|0)|0)){break}x=b-1+(dC(c[a+68>>2]|0,g+((l|0)/2|0)|0,p,m,k,0,2)|0)|0;if((x|0)>(v|0)){v=x}w=w+1|0}if((v|0)<(i+((m*5|0|0)/8|0)-((u|0)/2|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}y=p+1-(dC(c[a+68>>2]|0,g+((l*5|0|0)/8|0)|0,p,m,k,0,1)|0)|0;x=p+1-(dC(c[a+68>>2]|0,g+((l<<2|0)/8|0)|0,p,m,k,0,1)|0)|0;if((x|0)<(y|0)){y=x}if((y|0)>(i+((m|0)/4|0)+((u|0)/2|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}b=p;while(1){if((b|0)>=(j-((m|0)/8|0)|0)){break}if(((du(g+((l|0)/2|0)|0,h,b,b,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){t=9042;break}b=b+1|0}if((b-p|0)<((m|0)/6|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}v=b-1|0;if((dv(h-((l|0)/4|0)|0,h-((l|0)/4|0)|0,v,i,c[a+68>>2]|0,k)|0)<1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((dC(c[a+68>>2]|0,g,i+((m*3|0|0)/4|0)|0,l,k,0,3)|0)>((l|0)/16|0|0)){do{if((dv(g+((l|0)/2|0)|0,h,y,j,c[a+68>>2]|0,k)|0)<1){if((dv(g+((l|0)/2|0)|0,h,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k)|0)>=1){break}if((dv(h,h,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k)|0)>=1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}x=1;w=(l|0)/2|0;while(1){if((w|0)<(l-1|0)){z=(x|0)!=0}else{z=0}if(!z){break}b=(m|0)/2|0;L12462:while(1){if((b|0)<(m-1-((m|0)/8|0)|0)){A=(x|0)!=0}else{A=0}if(!A){break}do{if((d8(d,w,b)|0)>=(k|0)){if((d8(d,w+1|0,b)|0)>=(k|0)){break}if((d8(d,w+1|0,b-1|0)|0)>=(k|0)){break}if((d8(d,w,b-1|0)|0)<(k|0)){t=9067;break L12462}}}while(0);b=b+1|0}if((t|0)==9067){t=0;x=0}w=w+1|0}if((x|0)==0){o=(o*95|0|0)/100|0}x=dC(d,0,(m|0)/2|0,l,k,0,3)|0;b=0;while(1){if((b|0)>=(m|0)){break}if((dC(d,0,b,l,k,0,3)|0)<(x-1-((l|0)/32|0)|0)){t=9077;break}b=b+1|0}if((b|0)<(m|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}A=0;z=l;b=(m|0)/2|0;while(1){if((b|0)<((m|0)/4|0|0)){break}w=dC(d,0,b,l,k,0,3)|0;w=w+(dC(d,w,b,l,k,1,3)|0)|0;if((w|0)>(A|0)){A=w}x=dC(d,w,b,l,k,0,3)|0;if((x|0)<(z|0)){z=x}if((A|0)<(w-((l|0)/32|0)|0)){if((x|0)>(z+((l|0)/32|0)|0)){t=9090;break}}b=b-1|0}if((b|0)>=((m|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((e|0)==0){w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;w=w+(dC(d,w,(m|0)/2|0,l,k,1,3)|0)|0;b=((m|0)/2|0)-(dC(d,w,(m|0)/2|0,m,k,0,1)|0)-1|0;x=w+(dC(d,w,b,l,k,1,3)|0)|0;x=x+(dC(d,x,b,l,k,0,3)|0)|0;if((dv(w,w,1,(m|0)/2|0,d,k)|0)>1){t=9098}else{if((dv(w+1|0,w+1|0,1,(m|0)/2|0,d,k)|0)>1){t=9098}}L12518:do{if((t|0)==9098){do{if((dv(x-1|0,x-1|0,1,(m|0)/2|0,d,k)|0)<=1){if((dv(x,x,1,(m|0)/2|0,d,k)|0)>1){break}break L12518}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}do{if((m|0)>16){if((m|0)<=(l*3|0|0)){break}if((e|0)==0){break}w=dC(d,0,(m|0)/16|0,l,k,0,3)|0;w=dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0;x=(dC(d,0,(m|0)/2|0,l,k,0,3)|0)<<1;do{if((x|0)>=(w|0)){if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)>=2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}}while(0);do{if(((du(g,g,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=2){if(((du(g,h,i,i,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,h,j,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(h,h,i+1|0,j-1|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;x=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;if((x|0)<((l|0)/2|0|0)){t=9118}else{if((x|0)<3){t=9118}}do{if((t|0)==9118){if((e|0)==0){break}if((m|0)<=7){break}do{if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)>(w+((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)<=(w+((l|0)/8|0)|0)){break}j=dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0;if((j|0)<=(dC(d,l-1|0,m-1-((m|0)/16|0)|0,l,k,0,4)|0)){break}j=dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0;if((j|0)<=(dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}}while(0);do{if((e|0)!=0){if((m|0)<=15){break}if((l|0)<=7){break}if((v-i|0)>=((m*9|0|0)/16|0|0)){break}if((p-i|0)>((m|0)/4|0|0)){break}if((dC(d,(l*5|0|0)/8|0,v-i|0,m,k,0,2)|0)<=((m<<1|0)/8|0|0)){break}j=a;dy(j,71,90)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);if((e|0)!=0){x=1;w=(l|0)/2|0;while(1){if((w|0)<(l-1|0)){B=(x|0)!=0}else{B=0}if(!B){break}b=1;L12579:while(1){if((b|0)<((m|0)/4|0|0)){C=(x|0)!=0}else{C=0}if(!C){break}do{if((d8(d,w,b)|0)>=(k|0)){if((d8(d,w+1|0,b)|0)>=(k|0)){break}if((d8(d,w+1|0,b-1|0)|0)>=(k|0)){break}if((d8(d,w,b-1|0)|0)<(k|0)){t=9147;break L12579}}}while(0);b=b+1|0}if((t|0)==9147){t=0;x=0}w=w+1|0}if((x|0)!=0){o=(o*98|0|0)/100|0}if((m|0)>(l<<1|0)){o=(o*99|0|0)/100|0}}if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)<((l*6|0|0)/8|0|0)){o=(o*98|0|0)/100|0}x=dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0;w=dC(d,(l|0)/2|0,0,m,k,0,2)|0;do{if((x|0)>=((l|0)/2|0|0)){if((w|0)<=((m|0)/8|0|0)){break}if((w|0)<=2){break}if((w|0)>=((m|0)/2|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((m|0)>=(l*3|0|0)){if((m|0)<=12){break}o=(o*99|0|0)/100|0}}while(0);x=dC(d,l-1|0,m-1|0,m,k,0,1)|0;w=dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0;do{if((x|0)==0){if((w|0)<=((m|0)/8|0|0)){break}o=(o*95|0|0)/100|0}}while(0);x=dC(d,l-1|0,0,m,k,0,2)|0;w=dC(d,(l|0)/2|0,0,m,k,0,2)|0;do{if((x|0)==0){if((w|0)<=((m|0)/8|0|0)){break}o=(o*95|0|0)/100|0}}while(0);if((dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0)>=((l*3|0|0)/4|0|0)){o=(o*98|0|0)/100|0}if((dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0)>=((l+1|0)/2|0|0)){o=(o*98|0|0)/100|0}if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)>=((l|0)/2|0|0)){o=(o*98|0|0)/100|0}if((f|0)!=0){o=(o*98|0|0)/100|0}n=(e|0)!=0?67:99;dy(a,n,o)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function c2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=100;o=100;if((l|0)>2){p=(m|0)>4}else{p=0}L5:do{if(p){if((c[b+108>>2]|0)>1){break}q=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((q|0)<3){if((m|0)<=8){break}break L5}}while(0);if((q|0)<((l|0)/2|0|0)){o=(o*98|0|0)/100|0}do{if((l|0)<8){if(((dC(d,l-1|0,0,m,k,0,2)|0)*3|0|0)>(m|0)){break}break L5}}while(0);r=0;q=0;s=j-((m|0)/4|0)|0;while(1){if((s|0)>(j|0)){break}t=dC(c[a+68>>2]|0,g,s,l,k,0,3)|0;t=dC(c[a+68>>2]|0,g+t|0,s,l,k,1,3)|0;if((t|0)>(q|0)){q=t;r=s}s=s+1|0}if((q|0)<((l*3|0|0)/4|0|0)){break}r=q;q=dC(c[a+68>>2]|0,g,i+((m|0)/2|0)|0,l,k,0,3)|0;if((q|0)>((l|0)/2|0|0)){break}t=dC(c[a+68>>2]|0,g+q|0,i+((m|0)/2|0)|0,l,k,1,3)|0;if((q+t|0)>((l|0)/2|0|0)){break}u=t;do{if((dC(d,l-1|0,0,l,k,0,4)|0)<((l|0)/8|0|0)){if((dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0)<=((l|0)/2|0|0)){break}if((dC(d,0,(m*5|0|0)/8|0,l,k,0,3)|0)>=((l|0)/4|0|0)){break}if((dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0)>=((l|0)/4|0|0)){break}break L5}}while(0);q=1;s=i;while(1){if((s|0)<=(j-((m|0)/4|0)|0)){v=(q|0)!=0}else{v=0}if(!v){break}t=dC(c[a+68>>2]|0,g,s,l,k,0,3)|0;if((t|0)>(((l+2|0)/4|0)+(((aa(j-((m|0)/4|0)-s|0,l)|0)/2|0|0)/(m|0)|0)|0)){w=37;break}x=dC(c[a+68>>2]|0,g+t|0,s,l,k,1,3)|0;if((x|0)>(u+1|0)){w=40}else{if((x<<2|0)<(u*3|0|0)){w=40}else{w=41}}if((w|0)==40){w=0;if((s|0)>(i+((m|0)/8|0)|0)){w=42}else{w=41}}if((w|0)==41){w=0;if((x<<2|0)>(r*3|0|0)){w=42}}if((w|0)==42){w=0;q=0}s=s+1|0}if((w|0)==37){q=0}if((q|0)==0){break}if((dv(0,l-1-((l|0)/8|0)|0,m-1-((m|0)/2|0)|0,m-1-((m|0)/2|0)|0,d,k)|0)!=1){break}if((dv(0,l-1|0,(m|0)/3|0,(m|0)/3|0,d,k)|0)!=1){break}if((dv(0,l-1|0,(m|0)/8|0,(m|0)/8|0,d,k)|0)!=1){break}y=dC(d,0,m-1|0,l,k,0,3)|0;if((y-(dC(d,0,m-3|0,l,k,0,3)|0)|0)>(((l|0)/16|0)+1|0)){o=(o*96|0|0)/100|0}if((dC(c[a+68>>2]|0,g+((l|0)/4|0)|0,j,m,k,0,1)|0)>(((m|0)/16|0)+1|0)){o=(o*99|0|0)/100|0}y=dC(d,0,m-2|0,l,k,0,3)|0;if((y-(dC(d,0,m-1|0,l,k,0,3)|0)|0)>((l|0)/4|0|0)){break}if((f|0)!=0){o=(o*98|0|0)/100|0}if((e|0)==0){o=(o*99|0|0)/100|0}do{if((l*5|0|0)<(m<<1|0)){if((dC(c[a+68>>2]|0,g,j,l,k,0,3)|0)<=((l|0)/4|0|0)){break}o=(o*99|0|0)/100|0}}while(0);dy(a,76,o)|0}}while(0);n=100;o=100;if((m|0)>(l|0)){z=(m|0)>5}else{z=0}if(!z){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}if((c[a+24>>2]|0)>0){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}do{if((dv(0,l-1|0,(m|0)/2|0,(m|0)/2|0,d,k)|0)==1){if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=1){break}do{if((c[a+196>>2]|0)>1){if((c[a+60>>2]|0)==0){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);r=0;u=l;s=(m|0)/4|0;while(1){if((s|0)>=(m-((m|0)/4|0)|0)){break}t=dC(d,0,s,l,k,0,3)|0;t=dC(d,t,s,l,k,1,3)|0;if((t|0)>(r|0)){r=t}if((t|0)<(u|0)){u=t}s=s+1|0}if((r|0)>(u<<1|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}do{if((c[a+60>>2]|0)!=0){if((m|0)>((c[a+60>>2]|0)-(c[a+56>>2]|0)|0)){break}o=(o*94|0|0)/100|0}}while(0);do{if(((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)>1){if((i|0)<(c[a+56>>2]|0)){break}o=(o*94|0|0)/100|0}}while(0);z=0;n=0;s=0;while(1){if((s|0)>=((m|0)/4|0|0)){break}t=dC(d,0,s,l,k,0,3)|0;if((t|0)>(n|0)){n=t}t=dC(d,t,s,l,k,1,3)|0;if((t|0)>(z|0)){z=t;n=0}s=s+1|0}if((z|0)>(u<<2|0)){w=105}else{if((n*3|0|0)>(l<<1|0)){w=105}}L151:do{if((w|0)==105){do{if((dC(d,l-1|0,m-1|0,l,k,0,4)|0)<=((l*3|0|0)/8|0|0)){if((dC(d,0,m-1|0,l,k,0,3)|0)>((l*3|0|0)/8|0|0)){break}break L151}}while(0);A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);x=dC(d,0,0,l,k,0,3)|0;n=dC(d,x,0,l,k,0,3)|0;x=dC(d,0,1,l,k,0,3)|0;x=dC(d,x,1,l,k,0,3)|0;if((x|0)>(n|0)){n=x}x=dC(d,0,m-1|0,l,k,0,3)|0;z=dC(d,x,m-1|0,l,k,0,3)|0;x=dC(d,0,m-2|0,l,k,0,3)|0;x=dC(d,x,m-2|0,l,k,0,3)|0;if((x|0)>(z|0)){z=x}do{if((n|0)>(r+((l|0)/8|0)+1|0)){if((z|0)<=(r+((l|0)/8|0)+1|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);q=l;t=0;s=1;while(1){if((s|0)>=((m|0)/4|0|0)){break}x=dC(d,l-1|0,s,l,k,0,4)|0;if((x|0)>(q+1|0)){w=119;break}q=x;do{if((dv(0,l-1|0,s,s,d,k)|0)==2){if((dv(0,l-1|0,s+1+((m|0)/32|0)|0,s+1+((m|0)/32|0)|0,d,k)|0)!=2){break}t=1}}while(0);s=s+1|0}if((s|0)<((m|0)/4|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}do{if((t|0)!=0){s=(m*3|0|0)/4|0;while(1){if((s|0)>=(m|0)){break}if((dv(0,l-1|0,s,s,d,k)|0)==2){if((dv(0,l-1|0,s-1-((m|0)/32|0)|0,s-1-((m|0)/32|0)|0,d,k)|0)==2){w=132;break}}s=s+1|0}if((s|0)!=(m|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);if((l|0)>3){do{if(((du(l-1-((l|0)/8|0)|0,l-1|0,0,(m|0)/6|0,d,k,1)|0)<<24>>24|0)!=1){if(((du(l-1-((l|0)/8|0)|0,l-1|0,0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)!=1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}if(((du(l-1-((l|0)/8|0)|0,l-1|0,(m|0)/4|0,(m|0)/3|0,d,k,1)|0)<<24>>24|0)!=1){if(((du(0,(l|0)/8|0,(m|0)/4|0,(m|0)/3|0,d,k,1)|0)<<24>>24|0)!=1){if(((du(l-1-((l|0)/8|0)|0,l-1|0,0,(m|0)/8|0,d,k,1)|0)<<24>>24|0)==1){if(((du(0,(l|0)/8|0,0,(m|0)/8|0,d,k,1)|0)<<24>>24|0)==1){o=(o*97|0|0)/100|0}}}}if(((du(l-1-((l|0)/8|0)|0,l-1|0,(m|0)/2|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){if(((du(0,(l|0)/8|0,(m|0)/2|0,m-1|0,d,k,1)|0)<<24>>24|0)==1){do{if(((du(l-1-((l|0)/8|0)|0,l-1|0,0,(m|0)/3|0,d,k,1)|0)<<24>>24|0)==1){if(((du(0,(l|0)/8|0,0,(m|0)/3|0,d,k,1)|0)<<24>>24|0)!=1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}}s=1;while(1){if((s|0)>=((m*12|0|0)/16|0|0)){break}if((dv(0,l-1|0,s,s,d,k)|0)!=1){if((dv(0,l-1|0,s-1|0,s-1|0,d,k)|0)!=1){w=164;break}}s=s+1|0}if((s|0)<((m*12|0|0)/16|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}do{if((l|0)>3){s=(m|0)/2|0;while(1){if((s|0)>=(m-1|0)){break}if(((du((l|0)/4|0,l-1-((l|0)/4|0)|0,s,s,d,k,1)|0)<<24>>24|0)!=1){w=173;break}s=s+1|0}if((s|0)>=(m-1|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);x=l;s=(c[d+8>>2]|0)-1-((m*5|0|0)/16|0)|0;while(1){if((s|0)<((m|0)/5|0|0)){break}q=dC(d,(c[d+4>>2]|0)-1|0,s,h-g|0,k,0,4)|0;if((q-2-((l|0)/16|0)|0)>=(x|0)){w=182;break}if((q|0)<(x|0)){x=q}s=s-1|0}if((s|0)>=((m|0)/5|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}x=0;s=(c[d+8>>2]|0)-1-((m|0)/5|0)|0;while(1){if((s|0)<((m|0)/5|0|0)){break}q=dC(d,0,s,h-g|0,k,0,3)|0;if((q+2+((l|0)/16|0)|0)<(x|0)){w=192;break}if((q|0)>(x|0)){x=q}s=s-1|0}if((s|0)>=((m|0)/5|0|0)){A=a;B=A+36|0;C=c[B>>2]|0;return C|0}do{if((c[a+64>>2]|0)!=0){if((j|0)>=(c[a+64>>2]|0)){break}if(((du(g,h,j+1|0,(c[a+64>>2]|0)+((m|0)/8|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){o=(o*97|0|0)/100|0}}}while(0);q=dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0;t=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((q|0)>3){if((t|0)<=3){break}if(((du(l-1-((q|0)/2|0)|0,l-1-((q|0)/2|0)|0,0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)!=1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);s=(m*5|0|0)/8|0;while(1){if((s|0)>=(m|0)){break}if((dv(0,l-1|0,s,s,d,k)|0)==2){w=212;break}s=s+1|0}if((s|0)<(m|0)){q=dC(d,0,s,l,k,0,3)|0;q=q+(dC(d,q,s,l,k,1,3)|0)|0;q=q+((dC(d,q,s,l,k,0,3)|0)/2|0)|0;do{if((dv(0,q,(m*5|0|0)/8|0,(m*5|0|0)/8|0,d,k)|0)==0){if((dv(q,q,(m*5|0|0)/8|0,s,d,k)|0)!=0){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}do{if((l|0)>8){if((dC(d,0,(m*3|0|0)/4|0,l,k,0,3)|0)<((l|0)/4|0|0)){break}if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)>((l|0)/8|0|0)){break}if((dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0)>((l|0)/8|0|0)){break}if((dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0)>((l|0)/8|0|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);if((n<<1|0)>(r*5|0|0)){do{if((dC(d,0,(m|0)/4|0,l,k,0,3)|0)>((l|0)/2|0|0)){if(((du(0,(l|0)/8|0,0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}do{if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)>((l|0)/2|0|0)){if(((du((l*3|0|0)/4|0,l-1|0,(m*3|0|0)/4|0,m-1|0,d,k,1)|0)<<24>>24|0)!=1){break}if((dC(d,0,m-1|0,l,k,0,3)|0)<((l|0)/8|0|0)){o=(o*99|0|0)/100|0}if((l*5|0|0)>(m<<1|0)){o=(o*99|0|0)/100|0}if((l*5|0|0)>(m*3|0|0)){o=(o*99|0|0)/100|0}}}while(0);if((e|0)==0){do{if(((du((l|0)/4|0,(l|0)/4|0,0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)==1){if(((du((l|0)/4|0,(l|0)/4|0,(m|0)/2|0,m-1|0,d,k,1)|0)<<24>>24|0)!=0){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}do{if((l|0)>3){if((m|0)<=(l*3|0|0)){break}do{if((dC(d,(l|0)/4|0,m-1|0,m,k,0,1)|0)<((m|0)/4|0|0)){if((dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0)<((l|0)/2|0|0)){break}if((dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)>((l|0)/4|0|0)){break}o=(o*98|0|0)/100|0;if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)!=0){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}}while(0);x=0;while(1){if((x|0)>=((l|0)/2|0|0)){break}if(((du(x,x,0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)==1){w=257;break}x=x+1|0}do{if(((du(x,x+((l|0)/16|0)|0,0,(m|0)/16|0,d,k,1)|0)<<24>>24|0)==0){if(((du(x,x+((l|0)/16|0)|0,(m|0)/4|0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)!=0){break}if(((du(x,x+((l|0)/16|0)|0,(m|0)/16|0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){break}q=l;s=0;while(1){if((s|0)>=((m|0)/4|0|0)){break}x=dC(d,0,s,l,k,0,3)|0;if((x|0)>(q|0)){w=266;break}s=s+1|0}if((x|0)>=(dC(d,0,s+1|0,l,k,0,3)|0)){do{if((dC(d,0,0,m,k,0,2)|0)>1){n=dC(d,0,0,m,k,0,2)|0;if((n-(dC(d,((l|0)/16|0)+1|0,0,m,k,0,2)|0)|0)>=(((l|0)/16|0)+1|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}if((dv(0,(l|0)/2|0,s-1|0,s-1|0,d,k)|0)!=2){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);do{if((l|0)<8){if((m|0)>=12){break}q=dC(d,0,0,m,k,0,2)|0;do{if((dC(d,(l|0)/2|0,1,m,k,1,2)|0)>=(m-2|0)){if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)<2){break}if((q|0)<=1){break}if((q|0)>=((m|0)/2|0|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}}while(0);do{if(((du(h,h,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=2){if(((du(g,h,i,i,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,h,j,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,g+((l|0)/4|0)|0,i+1+((m|0)/16|0)|0,j-1-((m|0)/16|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);q=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)>=((l|0)/2|0|0)){if((q|0)>=((l|0)/2|0|0)){if((q|0)!=0){break}}if((l|0)<=1){break}o=(o*98|0|0)/100|0}}while(0);do{if(((du(g,g,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=2){if(((du(g,h,i,i,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,h,j,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(h-((l|0)/4|0)|0,h,i+1+((m|0)/16|0)|0,j-1-((m|0)/16|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);x=dC(d,0,(m|0)/2|0,l,k,0,3)|0;q=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)>(x+((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)<=(x+((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0)>=(q-((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)>=(q-((l|0)/8|0)|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);do{if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)<(x-((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)>=(x-((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0)<=(q+((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)<=(q+((l|0)/8|0)|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);q=dC(d,0,0,m,k,0,2)|0;do{if((m|0)>=12){if((q|0)<=((m|0)/8|0|0)){break}if((q|0)>=((m|0)/2|0|0)){break}n=(dC(d,l-1|0,(m*3|0|0)/16|0,l,k,0,4)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,l-1|0,q,l,k,0,4)|0)){w=316}else{n=(dC(d,l-1|0,(m*3|0|0)/16|0,l,k,0,4)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,l-1|0,q+1|0,l,k,0,4)|0)){w=316}}if((w|0)==316){n=(dC(d,l-1|0,(m<<3|0)/16|0,l,k,0,4)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,l-1|0,q,l,k,0,4)|0)){w=318}else{n=(dC(d,l-1|0,(m<<3|0)/16|0,l,k,0,4)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,l-1|0,q+1|0,l,k,0,4)|0)){w=318}}if((w|0)==318){n=(dC(d,0,(m*3|0|0)/16|0,l,k,0,3)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,0,q,l,k,0,3)|0)){w=320}else{n=(dC(d,0,(m*3|0|0)/16|0,l,k,0,3)|0)-((l|0)/8|0)|0;if((n|0)>(dC(d,0,q+1|0,l,k,0,3)|0)){w=320}}L473:do{if((w|0)==320){n=(dC(d,0,(m<<3|0)/16|0,l,k,0,3)|0)-((l|0)/8|0)|0;do{if((n|0)<=(dC(d,0,q,l,k,0,3)|0)){z=(dC(d,0,(m<<3|0)/16|0,l,k,0,3)|0)-((l|0)/8|0)|0;if((z|0)>(dC(d,0,q+1|0,l,k,0,3)|0)){break}break L473}}while(0);A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}}do{if((dC(d,0,q-1|0,l,k,0,3)|0)>1){if((l|0)>=6){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);do{if((dC(d,0,(m<<3|0)/16|0,l,k,0,3)|0)>((l|0)/8|0|0)){if((dC(d,0,q,l,k,1,3)|0)<(l-1|0)){break}if((dC(d,l-1|0,(m<<3|0)/16|0,l,k,0,4)|0)<=((l|0)/8|0|0)){break}if((dC(d,l-1|0,q-1|0,l,k,0,4)|0)<=((l|0)/8|0|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0)}}while(0);do{if((dC(d,0,1,l,k,0,3)|0)>=((l|0)/2|0|0)){if((dC(d,0,m-2|0,l,k,0,3)|0)>((l|0)/8|0|0)){if((dC(d,0,m-1|0,l,k,0,3)|0)>((l|0)/8|0|0)){break}}do{if((l|0)>1){if((dC(d,l-1|0,0,l,k,0,4)|0)>((l|0)/8|0|0)){if((dC(d,l-1|0,1,l,k,0,4)|0)>((l|0)/8|0|0)){break}}if((dC(d,l-1|0,m-2|0,l,k,0,4)|0)<((l|0)/2|0|0)){break}o=(o*98|0|0)/100|0}}while(0)}}while(0);if((e|0)!=0){if((dC(d,0,(m|0)/4|0,l,k,0,3)|0)>((l|0)/2|0|0)){w=346}}else{w=346}if((w|0)==346){q=dC(d,0,(m|0)/16|0,l,k,0,3)|0;q=dC(d,q,(m|0)/16|0,l,k,1,3)|0;t=q;q=dC(d,0,((m|0)/16|0)+1|0,l,k,0,3)|0;q=dC(d,q,((m|0)/16|0)+1|0,l,k,1,3)|0;if((q|0)>(t|0)){t=q}q=dC(d,0,((m|0)/16|0)+2|0,l,k,0,3)|0;q=dC(d,q,((m|0)/16|0)+2|0,l,k,1,3)|0;if((q|0)>(t|0)){t=q}if((t<<2|0)>=(l*3|0|0)){o=(o*98|0|0)/100|0}if((t<<3|0)>=(l*7|0|0)){o=(o*96|0|0)/100|0}}q=dC(d,0,0,m,k,0,2)|0;do{if((q*3|0|0)>(m|0)){if((q*3|0|0)>=(m<<1|0)){break}if((dC(d,l-1|0,0,m,k,0,2)|0)!=0){break}if((dC(d,l-1|0,m-1|0,m,k,0,1)|0)!=0){break}q=dC(d,0,m-1|0,m,k,0,1)|0;do{if((q*3|0|0)>(m|0)){if((q*3|0|0)>=(m<<1|0)){break}A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);o=(o*99|0|0)/100|0}}while(0);if((o|0)==100){o=o-1|0}if((e|0)==0){o=(o*99|0|0)/100|0}if((f|0)!=0){o=(o*99|0|0)/100|0}do{if((o|0)>98){if(((du(g,h,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){break}o=(o*99|0|0)/100|0}}while(0);do{if((l|0)<3){if((m|0)<=10){break}if((c[a+64>>2]|0)!=0){break}o=(o*95|0|0)/100|0}}while(0);dy(a,108,o)|0;A=a;B=A+36|0;C=c[B>>2]|0;return C|0}}while(0);A=a;B=A+36|0;C=c[B>>2]|0;return C|0}function c3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=57344;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g,g+((l|0)/2|0)|0,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(h-((l|0)/2|0)|0,h,i+((m|0)/2|0)|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,j-((m|0)/2|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,i+((m|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i+((m|0)/2|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((c[b+128>>2]|0)<=((m|0)/3|0|0)){if((c[b+136>>2]|0)<(m-1-((m|0)/3|0)|0)){break}do{if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,j,c[a+68>>2]|0,k)|0)!=2){if((dv(g+((l|0)/2|0)+1|0,g+((l|0)/2|0)+1|0,i,j,c[a+68>>2]|0,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(g+((l|0)/3|0)|0,h-((l|0)/4|0)|0,i,i,c[a+68>>2]|0,k)|0)!=1){if((dv(g+((l|0)/3|0)|0,h-((l|0)/4|0)|0,i+1|0,i+1|0,c[a+68>>2]|0,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(g+((l|0)/4|0)|0,h-((l|0)/3|0)|0,j,j,c[a+68>>2]|0,k)|0)!=1){if((dv(g+((l|0)/4|0)|0,h-((l|0)/3|0)|0,j-1|0,j-1|0,c[a+68>>2]|0,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(g,g,i+((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(g+1|0,g+1|0,i+((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(h,h,i+((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(h-1|0,h-1|0,i+((m|0)/3|0)|0,j-((m|0)/3|0)|0,c[a+68>>2]|0,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);p=dC(d,0,0,h-g|0,k,0,3)|0;if((p|0)<=(dC(d,0,2,h-g|0,k,0,3)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=dC(d,l-1|0,m-1-((m|0)/3|0)|0,h-g|0,k,0,4)|0;t=m-1-((m|0)/3|0)|0;while(1){if((t|0)>=(m|0)){break}u=dC(d,l-1|0,t,h-g|0,k,0,4)|0;if((u|0)<(p|0)){v=454;break}p=u;t=t+1|0}if((t|0)<(m|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}w=dC(d,0,(m|0)/16|0,l,k,0,3)|0;x=w+(dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0)|0;if((x|0)<=(((dC(d,0,(m|0)/2|0,l,k,0,3)|0)<<1)+((l|0)/8|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}x=(dC(d,0,((m|0)/16|0)+1|0,l,k,0,3)|0)+((l|0)/4|0)|0;if((x|0)<=(dC(d,l-1|0,((m|0)/16|0)+1|0,l,k,0,4)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0)>((l|0)/8|0|0)){if((dC(d,0,(m|0)/16|0,l,k,0,3)|0)>=((l|0)/16|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dC(d,l-1|0,m-1-((m|0)/16|0)|0,l,k,0,4)|0)>((l|0)/8|0|0)){if((dC(d,0,m-1-((m|0)/16|0)|0,l,k,0,3)|0)>=((l|0)/16|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if(((du(h-((l|0)/32|0)|0,h,i,i+((m|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){if(((du(h-((l|0)/32|0)|0,h,j-((m|0)/32|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if(((du(0,(l|0)/32|0,0,(m|0)/32|0,d,k,1)|0)<<24>>24|0)!=1){if(((du(g,g+((l|0)/32|0)|0,j-((m|0)/32|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);t=m;p=0;x=0;while(1){if((p|0)>=(l|0)){break}u=dC(d,p,m-1|0,j-i|0,k,0,1)|0;u=u+(dC(d,p,m-1-u|0,j-i|0,k,1,1)|0)|0;if((u|0)<=(t|0)){t=u;x=p}p=p+1|0}u=t;t=m-1-u|0;while(1){if((t|0)>=(m-1|0)){break}if((dv(x,l-1|0,t,t,d,k)|0)>1){o=(o*99|0|0)/100|0}t=t+1|0}t=0;while(1){if((t|0)>=(m-1-u|0)){break}if((dv(0,l-1|0,t,t,d,k)|0)>2){o=(o*98|0|0)/100|0}t=t+1|0}if((dC(d,l-1|0,m-1|0,h-g|0,k,0,4)|0)<((l|0)/8|0|0)){o=(o*98|0|0)/100|0}if((dC(d,l-1|0,0,h-g|0,k,0,4)|0)<((l|0)/8|0|0)){o=(o*98|0|0)/100|0}t=(dC(d,l-1|0,m-1-((m|0)/8|0)|0,h-g|0,k,0,4)|0)+1+((l|0)/16|0)|0;if((t|0)<(dC(d,0,m-1-((m|0)/8|0)|0,h-g|0,k,0,3)|0)){o=(o*99|0|0)/100|0}t=(dC(d,l-1|0,m-1|0,j-i|0,k,0,1)|0)+1+((m+3|0)/8|0)|0;if((t|0)<(dC(d,0,m-1|0,j-i|0,k,0,1)|0)){o=(o*98|0|0)/100|0}t=dC(d,(l|0)/2|0,0,m,k,0,2)|0;do{if((P(t-(dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0)|0)|0)>((m|0)/8|0|0)){v=505}else{if((dv(0,l-1|0,0,0,d,k)|0)>1){v=505;break}if((dv(0,l-1|0,m-1|0,m-1|0,d,k)|0)>1){v=505}}}while(0);if((v|0)==505){o=(o*98|0|0)/100|0}do{if((e|0)!=0){if((i<<1|0)>=((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){v=509;break}u=1}else{v=509}}while(0);if((v|0)==509){u=0}if((f|0)!=0){o=(o*99|0|0)/100|0}n=111;if((u|0)!=0){n=79}do{if((n|0)==79){if((o|0)<=99){break}o=99}}while(0);do{if((n|0)==111){if((e|0)!=0){break}if((i|0)>=(c[a+56>>2]|0)){break}t=a;x=(o*98|0|0)/100|0;dy(t,79,x)|0;x=a;t=(o*98|0|0)/100|0;dy(x,48,t)|0}}while(0);do{if((o|0)==100){if((n|0)!=111){break}if((c[a+56>>2]|0)==0){break}t=P((c[a+56>>2]|0)-(c[a+8>>2]|0)-((c[a+8>>2]|0)-(c[a+52>>2]|0))|0)|0;if((t|0)>(((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)/4|0|0)){break}o=(o*98|0|0)/100|0}}while(0);dy(a,n,o)|0;if((n|0)==79){t=a;x=o;dy(t,48,x)|0}if((n|0)==111){x=a;t=(o*98|0|0)/100|0;dy(x,48,t)|0}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function c4(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=57344;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)>2){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(0,(l|0)/2|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(0,(l|0)/2|0,(m|0)/2|0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)<1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du((l|0)/4|0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0;if((p|0)<((l|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((dv(h-((p*3|0|0)/4|0)|0,h-((p*3|0|0)/4|0)|0,i,j-((m*3|0|0)/16|0)|0,c[a+68>>2]|0,k)|0)!=2){do{if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,j-((m*3|0|0)/16|0)|0,c[a+68>>2]|0,k)|0)!=2){if((dv(g+((l|0)/2|0)+1|0,g+((l|0)/2|0)+1|0,i,j-((m*3|0|0)/16|0)|0,c[a+68>>2]|0,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}do{if((dv(0,l-1|0,(m*7|0|0)/8|0,(m*7|0|0)/8|0,d,k)|0)!=1){if((dv(0,l-1|0,((m*7|0|0)/8|0)-1|0,((m*7|0|0)/8|0)-1|0,d,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){if((dv(0,l-1|0,((m|0)/4|0)-1|0,((m|0)/4|0)-1|0,d,k)|0)!=3){do{if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){if((dv(0,l-1|0,((m|0)/4|0)+1|0,((m|0)/4|0)+1|0,d,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0)}}p=dC(d,0,(m|0)/2|0,l,k,0,3)|0;if((p|0)<1){p=p+1|0}do{if((dv(p-1|0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){if((dv(p-1|0,l-1|0,((m|0)/4|0)+1|0,((m|0)/4|0)+1|0,d,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);t=dC(d,0,(m*3|0|0)/8|0,l,k,0,3)|0;if((t|0)>=((l|0)/2|0|0)){o=(o*90|0|0)/100|0}u=t+(dC(d,t,(m*3|0|0)/8|0,l,k,1,3)|0)|0;t=dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0;v=t+(dC(d,t,(m*7|0|0)/8|0,l,k,1,3)|0)|0;t=(m|0)/8|0;while(1){if((t|0)>=((m*7|0|0)/8|0|0)){break}w=u+((aa((t<<3)-(m*3|0)|0,v-u|0)|0)/(m<<2|0)|0)|0;p=dC(d,0,t,l,k,0,3)|0;if((p|0)>(w+((l|0)/16|0)|0)){x=596;break}t=t+1|0}if((t|0)<((m*7|0|0)/8|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}w=0;u=(m|0)/3|0;t=u;v=u;while(1){if((t|0)>=(m-((m|0)/8|0)|0)){break}p=dC(d,l-1|0,t,l,k,0,4)|0;if((p|0)>(w|0)){w=p;v=t}if((w|0)>((l|0)/2|0|0)){x=606;break}t=t+1|0}do{if((w|0)>=((l|0)/2|0|0)){if((w|0)>=(l|0)){break}if(((du((l*3|0|0)/4|0,l-1|0,t,m-1|0,d,k,1)|0)<<24>>24|0)==1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=dH(g,h,i,j-((m|0)/5|0)|0,c[a+68>>2]|0,k,0)|0;v=c[b+108>>2]|0;do{if((v|0)!=1){if((l|0)>=8){break}o=(o*96|0|0)/100|0}}while(0);do{if((v|0)!=1){if((l|0)<8){break}o=(o*98|0|0)/100|0}}while(0);do{if((p|0)==0){if((v|0)!=0){break}o=(o*90|0|0)/100|0}}while(0);do{if((p|0)<=1){if((v|0)>1){break}if((v|0)>(p|0)){break}p=dC(d,(c[d+4>>2]|0)-1|0,(c[d+8>>2]|0)/4|0,l,k,0,4)|0;p=p+(dC(d,(c[d+4>>2]|0)-1-p|0,(c[d+8>>2]|0)/4|0,l,k,1,4)|0)|0;v=dC(d,(c[d+4>>2]|0)-1-p|0,(c[d+8>>2]|0)/4|0,(m*3|0|0)/4|0,k,0,2)|0;if((v|0)>((m|0)/2|0|0)){o=(o*80|0|0)/100|0}if((e|0)!=0){x=631}else{if((f|0)!=0){x=631}else{x=633}}do{if((x|0)==631){if((e|0)==0){break}if((f|0)!=0){x=633}}}while(0);if((x|0)==633){o=(o*95|0|0)/100|0}n=112;do{if((e|0)!=0){if((f|0)!=0){if((m|0)>=14){break}}n=80}}while(0);do{if((e|0)!=0){if((f|0)==0){break}o=(o*98|0|0)/100|0}}while(0);do{if((e|0)==0){if((f|0)!=0){break}o=(o*98|0|0)/100|0}}while(0);u=a;y=n;z=o;dy(u,y,z)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function c5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[f>>2]|0;g=c[f+4>>2]|0;h=c[f+36>>2]|0;j=c[f+40>>2]|0;k=c[a>>2]|0;l=c[a+4>>2]|0;m=c[a+8>>2]|0;n=c[a+12>>2]|0;o=c[f+8>>2]|0;p=l-k+1|0;q=n-m+1|0;r=100;s=100;if((p|0)>2){t=(q|0)>4}else{t=0}L902:do{if(t){if((c[f+108>>2]|0)>2){break}if(((du(k,k+((p|0)/3|0)|0,m+((q|0)/3|0)|0,m+((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(l-((p|0)/3|0)|0,l,m+((q|0)/3|0)|0,m+((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,n-((q|0)/3|0)|0,n,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,m+((q|0)/4|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){break}if(((du(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m+((q|0)/3|0)|0,n-((q|0)/2|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==1){break}if(((du(l,l,m,m,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==1){break}if((dv(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,n,c[a+68>>2]|0,o)|0)<2){break}do{if((dv(k+((p|0)/5|0)|0,l-((p|0)/5|0)|0,m,m,c[a+68>>2]|0,o)|0)!=1){if((dv(k+((p|0)/5|0)|0,l-((p|0)/5|0)|0,m+1|0,m+1|0,c[a+68>>2]|0,o)|0)!=1){break L902}else{break}}}while(0);do{if((dv(k,k,m+((q|0)/3|0)|0,n-((q|0)/3|0)|0,c[a+68>>2]|0,o)|0)!=1){if((dv(k+1|0,k+1|0,m+((q|0)/3|0)|0,n-((q|0)/3|0)|0,c[a+68>>2]|0,o)|0)!=1){break L902}else{break}}}while(0);if(((du(l,l,n-((q|0)/8|0)|0,n,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==0){do{if((dv(l,l,m+((q|0)/3|0)|0,n-((q|0)/3|0)|0,c[a+68>>2]|0,o)|0)!=1){if((dv(l-1|0,l-1|0,m+((q|0)/3|0)|0,n-((q|0)/3|0)|0,c[a+68>>2]|0,o)|0)!=1){break L902}else{break}}}while(0)}u=c[f+108>>2]|0;if((u|0)==0){break}do{if((u|0)!=1){if((u|0)==2){if((dH(k,l,m+((q|0)/2|0)|0,n,c[a+68>>2]|0,o,0)|0)==1){break}}break L902}}while(0);c[d>>2]=l;c[e>>2]=n;dA(c[a+68>>2]|0,d,e,k,l,m,n,o,4,7);if((c[d>>2]|0)<(l-((p|0)/2|0)|0)){break}dA(c[a+68>>2]|0,d,e,k,l,m,n,o,7,4);if((c[d>>2]|0)<(l-((p|0)/2|0)|0)){if((j|0)!=0){s=(s*98|0|0)/100|0}else{s=(s*90|0|0)/100|0}}v=dC(g,0,0,p,o,0,3)|0;if((v|0)<(dC(g,0,2,p,o,0,3)|0)){break}v=dC(g,0,((q|0)/8|0)+2|0,p,o,0,3)|0;if((v+(dC(g,p-1|0,((q|0)/8|0)+2|0,p,o,0,4)|0)|0)>((p*5|0|0)/8|0|0)){break}c[d>>2]=dC(g,p-1|0,(q*3|0|0)/8|0,q,o,0,4)|0;if((c[d>>2]|0)>((p|0)/4|0|0)){break}v=dC(g,p-1-(c[d>>2]|0)|0,0,q,o,0,2)|0;if((v|0)<=(dC(g,p-2-(c[d>>2]|0)|0,0,q,o,0,2)|0)){break}v=dC(g,p-1|0,q-2|0,p,o,0,4)|0;if((v|0)<=(dC(g,p-1|0,(q|0)/2|0,p,o,0,4)|0)){v=dC(g,1,q-1|0,q,o,0,1)|0;if((v|0)<=(dC(g,(p|0)/2|0,q-1|0,q,o,0,1)|0)){do{if((dC(g,0,q-2|0,p,o,0,3)|0)>((p|0)/2|0|0)){if((dC(g,0,0,p,o,0,3)|0)>((p|0)/2|0|0)){break L902}else{break}}}while(0)}}v=dC(g,p-1|0,(q*3|0|0)/4|0,p,o,0,4)|0;w=v+(dC(g,0,(q*3|0|0)/4|0,p,o,0,3)|0)|0;v=dC(g,p-1|0,(q<<1|0)/4|0,p,o,0,4)|0;if((w|0)<(v+(dC(g,0,(q<<1|0)/4|0,p,o,0,3)|0)|0)){s=(s*94|0|0)/100|0}if((dC(g,0,(q*3|0|0)/4|0,p,o,1,3)|0)>=(p|0)){s=(s*94|0|0)/100|0}if((dC(g,p-1|0,(q|0)/3|0,p,o,0,4)|0)>((p|0)/4|0|0)){break}x=dC(g,(p|0)/2|0,q-1|0,q,o,0,1)|0;do{if((x|0)>1){if((x|0)<=((q|0)/8|0|0)){break}if(((du(0,(p|0)/2|0,q-1-((x|0)/2|0)|0,q-1-((x|0)/2|0)|0,g,o,1)|0)<<24>>24|0)==1){if((x|0)>=5){break L902}s=(s*95|0|0)/100|0}}}while(0);u=0;c[e>>2]=0;while(1){if((c[e>>2]|0)>=((q|0)/2|0|0)){break}if((dv(0,p-1|0,c[e>>2]|0,c[e>>2]|0,g,o)|0)>2){u=u+1|0}c[e>>2]=(c[e>>2]|0)+1}if((u|0)>((q|0)/8|0|0)){break}if((u|0)>0){s=(s*99|0|0)/100|0}c[d>>2]=0;x=0;c[e>>2]=(q|0)/2|0;while(1){if((c[e>>2]|0)>=(q|0)){break}u=dC(g,p-1|0,c[e>>2]|0,p,o,0,4)|0;if((u|0)>(c[d>>2]|0)){c[d>>2]=u}if(((c[d>>2]|0)-u|0)>(x|0)){x=(c[d>>2]|0)-u|0}if((x|0)>((p|0)/16|0|0)){y=755;break}c[e>>2]=(c[e>>2]|0)+1}if((x|0)==0){break}if((x|0)<=((p|0)/16|0|0)){s=(s*98|0|0)/100|0}if((n|0)<=(c[a+60>>2]|0)){s=(s*98|0|0)/100|0}if((h|0)==0){s=(s*96|0|0)/100|0}dy(a,81,s)|0}}while(0);r=100;s=100;if((p|0)>2){z=(q|0)>3}else{z=0}if(!z){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}if((c[f+108>>2]|0)>2){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}c[e>>2]=m;while(1){if((c[e>>2]<<1|0)>(m+n|0)){break}if((dv(k,l,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o)|0)==2){y=776;break}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]<<1|0)>(m+n|0)){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}c[e>>2]=(m+n|0)/2|0;while(1){if((c[e>>2]|0)>(n|0)){break}if((dv(k,l,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o)|0)==1){if((dv(k,k+((p|0)/2|0)|0,c[e>>2]|0,c[e>>2]|0,c[a+68>>2]|0,o)|0)==0){y=785;break}}c[e>>2]=(c[e>>2]|0)+1}if((c[e>>2]|0)>(n|0)){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}c[d>>2]=0;z=m+((q|0)/3|0)|0;c[e>>2]=z;x=z;while(1){if((c[e>>2]|0)>(n-((q|0)/8|0)|0)){break}u=dC(c[a+68>>2]|0,k,c[e>>2]|0,p,o,0,3)|0;if((u|0)>(c[d>>2]|0)){c[d>>2]=u;x=c[e>>2]|0}if((c[d>>2]|0)>((p|0)/2|0|0)){y=795;break}c[e>>2]=(c[e>>2]|0)+1}do{if((c[d>>2]|0)>=((p|0)/2|0|0)){if((c[d>>2]|0)>=(p|0)){break}if((n-x+1|0)<((q|0)/4|0|0)){s=(s*96|0|0)/100|0}if((dv(k+((c[d>>2]|0)/2|0)|0,k+((c[d>>2]|0)/2|0)|0,x,n,c[a+68>>2]|0,o)|0)!=0){s=(s*96|0|0)/100|0}L1110:do{if((dC(c[a+68>>2]|0,k+((p|0)/16|0)|0,x,q,o,0,1)|0)<(((q|0)/16|0)+1|0)){s=(s*97|0|0)/100|0;do{if((h|0)==0){if((j|0)==0){break}break L1110}}while(0);A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}}while(0);if((dC(c[a+68>>2]|0,k+((p|0)/16|0)|0,x-((q|0)/32|0)-1|0,q,o,1,3)|0)>=(p-((p|0)/8|0)|0)){y=812}else{if((dC(c[a+68>>2]|0,k+((p|0)/16|0)|0,x-((q|0)/16|0)-1|0,q,o,1,3)|0)>=(p-((p|0)/8|0)|0)){y=812}}if((y|0)==812){s=(s*96|0|0)/100|0}if(((du(l-((p|0)/3|0)|0,l,m+((q|0)/3|0)|0,m+((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}if(((du(k,k+((p|0)/3|0)|0,m+((q|0)/3|0)|0,m+((q|0)/3|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)!=1){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}if(((du(k,k+((p|0)/4|0)|0,n-((q|0)/8|0)|0,n-((q|0)/9|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==1){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}if(((du(k,k+((p|0)/4|0)|0,n-((q|0)/5|0)|0,n-((q|0)/9|0)|0,c[a+68>>2]|0,o,1)|0)<<24>>24|0)==1){s=(s*99|0|0)/100|0}if((dv(k+((p|0)/2|0)|0,k+((p|0)/2|0)|0,m,x,c[a+68>>2]|0,o)|0)!=2){A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}do{if((c[f+108>>2]|0)!=1){if((p|0)<16){s=(s*98|0|0)/100|0;break}else{A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}}}while(0);do{if((dH(k,l,m,x,c[a+68>>2]|0,o,0)|0)!=1){if((p|0)<16){s=(s*98|0|0)/100|0;break}else{A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}}}while(0);do{if((dC(g,0,q-1-((q|0)/4|0)|0,p,o,0,3)|0)>((p*5|0|0)/8|0|0)){if(((du((p|0)/4|0,(p|0)/4|0,q-1-((q|0)/4|0)|0,q-1|0,g,o,1)|0)<<24>>24|0)!=1){break}A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}}while(0);if((j|0)==0){s=(s*99|0|0)/100|0}if((h|0)!=0){s=(s*99|0|0)/100|0}e=a;u=s;dy(e,113,u)|0;A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}}while(0);A=a;B=A+36|0;C=c[B>>2]|0;i=b;return C|0}function c6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=b+44|0;o=100;p=100;if((m|0)>3){q=(l|0)>0}else{q=0}L1177:do{if(q){if((c[b+108>>2]|0)>1){break}if((c[a+196>>2]|0)>2){break}r=i;s=r;t=r;if((c[a+24>>2]|0)!=1){p=(p*98|0|0)/100|0}if((c[b+108>>2]|0)>0){p=(p*96|0|0)/100|0}if((m|0)>(l*3|0|0)){u=(c[a+56>>2]|0)!=0}else{u=0}do{if(u){v=dC(d,(l|0)/2|0,m-1|0,m,k,0,1)|0;if((m-1-v|0)<((c[a+60>>2]|0)-2|0)){break}v=v+(dC(d,(l|0)/2|0,m-1-v|0,m,k,1,1)|0)|0;r=(P(m-1-v-(c[a+56>>2]|0)|0)|0)*3|0;if((r|0)>((c[a+56>>2]|0)-(c[a+52>>2]|0)|0)){break}L1203:do{if(((du(g,h,i,((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)/2|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){do{if(((du(g,h,j-v|0,j-v|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){if(((du(g,h,j-v-1|0,j-v-1|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}if(((du(g,h,j-v-2|0,j-v-2|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}break L1203}}while(0);r=a;w=p;dy(r,105,w)|0;x=105;y=x;return y|0}}while(0)}}while(0);do{if((c[a+56>>2]|0)!=0){if((i<<1|0)<((c[a+56>>2]|0)+(c[a+52>>2]|0)|0)){break}t=c[a+52>>2]|0}}while(0);if((c[a+196>>2]|0)<=1){break}do{if((c[a+204>>2]|0)>((c[a+200>>2]|0)/8|0|0)){if(((c[a+204>>2]|0)*3|0|0)>(c[a+200>>2]<<1|0)){break L1177}if(((c[a+236>>2]|0)*3|0|0)>(c[a+232>>2]<<1|0)){break L1177}z=0;A=c[a+264>>2]|0;while(1){if((A|0)<(c[a+268>>2]|0)){B=(A|0)<128}else{B=0}if(!B){break}if((t|0)>(c[a+296+(A<<3)+4>>2]|0)){t=c[a+296+(A<<3)+4>>2]|0}if((z|0)<(c[a+296+(A<<3)+4>>2]|0)){z=c[a+296+(A<<3)+4>>2]|0}A=A+1|0}do{if((c[a+56>>2]|0)!=0){if((t|0)<=((c[a+56>>2]|0)+2|0)){break}break L1177}}while(0);if((z<<1|0)>=(t+j|0)){break L1177}else{break}}}while(0);if((s*5|0|0)>=((t*3|0)+(j<<1)|0)){p=(p*99|0|0)/100|0}if((s<<1|0)>=(t+j|0)){p=(p*97|0|0)/100|0}if((s*5|0|0)>=(t+(j<<2)|0)){break}if((dC(d,l-1|0,s+((j-t+1|0)/32|0)|0,l,k,0,4)|0)>((l|0)/2|0|0)){p=(p*95|0|0)/100|0}z=j;while(1){if((z|0)<=(t|0)){break}if(((du(g,h,z,z,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){C=921;break}z=z-1|0}if((z|0)>((t+(j*3|0)|0)/4|0|0)){break}if((z|0)>((t+(j<<1)|0)/3|0|0)){p=(p*96|0|0)/100|0}z=((j-s+1|0)/2|0)+s-i|0;if((dv(0,l-1|0,z,z,d,k)|0)!=1){break}while(1){if((z|0)>(j-i|0)){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){C=933;break}z=z+1|0}D=z;while(1){if((z|0)>(j-i|0)){break}if((dv(0,l-1|0,z,z,d,k)|0)!=2){C=939;break}z=z+1|0}E=z;if((E|0)<((((j-s+1|0)*3|0|0)/4|0)+s-i|0)){break}z=((j-s+1|0)/2|0)+s-i|0;while(1){if((z|0)<=0){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){C=947;break}z=z-1|0}F=z;while(1){if((z|0)<=0){break}if((dv(0,l-1|0,z,z,d,k)|0)!=2){C=953;break}z=z-1|0}G=z;if((G|0)>(((j-s+1|0)/4|0)+s-i|0)){break}if((E|0)>(D+2|0)){H=dC(d,0,D-1|0,l,k,0,3)|0;I=dC(d,l-1|0,D-1|0,l,k,0,4)|0;w=I-(dC(d,l-1|0,D,l,k,0,4)|0)|0;do{if((w|0)>(H-(dC(d,0,D,l,k,0,3)|0)|0)){z=dC(d,l-I|0,D-1|0,m,k,0,2)|0;if((z|0)>0){v=dC(d,l-I-1|0,D-1+z-1|0,m,k,0,2)|0;if((v|0)>0){z=z+(v-1)|0}}if((D-1+z|0)<(E-1|0)){break L1177}else{break}}else{z=dC(d,(H*11|0|0)/16|0,D-1|0,m,k,0,2)|0;if((D-1+z|0)<(E-2|0)){break L1177}else{break}}}while(0)}do{if((G|0)<(F-2|0)){J=dC(d,0,F+1|0,l,k,0,3)|0;z=dC(d,J-1|0,F+1|0,m,k,0,1)|0;v=dC(d,J,F+2-z|0,m,k,0,1)|0;if((v|0)>0){z=z+(v-1)|0}if((F+1-z|0)>(G+1|0)){break L1177}else{break}}}while(0);do{if((i<<1|0)<=((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){w=(dC(d,0,0,l,k,0,3)|0)+1|0;if((w|0)>=(dC(d,0,(l|0)/2|0,l,k,0,3)|0)){break}p=(p*97|0|0)/100|0}}while(0);do{if((f|0)!=0){w=dC(d,0,(m<<1|0)/4|0,l,k,0,3)|0;if((w-(dC(d,l-1|0,(m<<1|0)/4|0,l,k,0,4)|0)|0)>((l|0)/8|0|0)){break L1177}else{break}}}while(0);if((t*3|0|0)>((c[a+52>>2]|0)+(c[a+56>>2]<<1)|0)){p=(p*90|0|0)/100|0}do{if((dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0)>((l|0)/2|0|0)){if((dC(d,l-1|0,m-1|0,l,k,0,4)|0)>=((l|0)/4|0|0)){break}break L1177}}while(0);do{if((l|0)>5){if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,t,j,c[a+68>>2]|0,k)|0)<3){break}p=(p*95|0|0)/100|0}}while(0);dy(a,105,p)|0}}while(0);o=100;p=100;if((m|0)>4){K=(l|0)>0}else{K=0}L1372:do{if(K){if((c[b+108>>2]|0)>1){break}t=i;do{if((c[a+56>>2]|0)!=0){if((i<<1|0)<((c[a+56>>2]|0)+(c[a+52>>2]|0)|0)){break}t=c[a+52>>2]|0}}while(0);z=t;while(1){if((z<<1|0)>=(t+j|0)){break}if(((du(g,h,z,z,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){C=1005;break}z=z+1|0}if((z<<1|0)>=(t+j|0)){break}t=z;do{if((c[a+56>>2]|0)!=0){if((t|0)<=((c[a+56>>2]|0)+2|0)){break}break L1372}}while(0);while(1){if((z<<1|0)>=(j+t|0)){break}if(((du(g,h,z,z,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){C=1016;break}z=z+1|0}if((z<<1|0)>=(t+j|0)){break}while(1){if((z<<1|0)>=(j+t|0)){break}if(((du(g,h,z,z,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){C=1024;break}z=z+1|0}if((z<<1|0)>=(t+j|0)){break}s=z;if((dC(d,l-1|0,z+((j-t+1|0)/32|0)|0,l,k,0,4)|0)>((l|0)/2|0|0)){break}z=(t+j|0)/2|0;while(1){if((z|0)>(j|0)){break}if(((du(g,h,z,z,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){C=1034;break}z=z+1|0}if((z|0)<=(j|0)){break}z=((j-s+1|0)/2|0)+s-i|0;if((dv(0,l-1|0,z,z,d,k)|0)>2){break}while(1){if((z|0)>(j-i|0)){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){C=1044;break}z=z+1|0}D=z;while(1){if((z|0)>(j-i|0)){break}if((dv(0,l-1|0,z,z,d,k)|0)!=2){C=1050;break}z=z+1|0}E=z;if((E|0)<((((j-s+1|0)*3|0|0)/4|0)+s-i|0)){break}z=((j-s+1|0)/2|0)+s-i|0;while(1){if((z|0)<=0){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){C=1058;break}z=z-1|0}F=z;while(1){if((z|0)<=0){break}if((dv(0,l-1|0,z,z,d,k)|0)!=2){C=1064;break}z=z-1|0}G=z;if((G|0)>(((j-s+1|0)/4|0)+s-i|0)){break}if((E|0)>(D+2|0)){H=dC(d,0,D-1|0,l,k,0,3)|0;I=dC(d,l-1|0,D-1|0,l,k,0,4)|0;B=I-(dC(d,l-1|0,D,l,k,0,4)|0)|0;do{if((B|0)>(H-(dC(d,0,D,l,k,0,3)|0)|0)){z=dC(d,l-I|0,D-1|0,m,k,0,2)|0;if((z|0)>0){v=dC(d,l-I-1|0,D-1+z-1|0,m,k,0,2)|0;if((v|0)>0){z=z+(v-1)|0}}if((D-1+z|0)<(E-1|0)){break L1372}else{break}}else{z=dC(d,(H*11|0|0)/16|0,D-1|0,m,k,0,2)|0;if((D-1+z|0)<(E-2|0)){break L1372}else{break}}}while(0)}do{if((G|0)<(F-2|0)){J=dC(d,0,F+1|0,l,k,0,3)|0;z=dC(d,J-1|0,F+1|0,m,k,0,1)|0;v=dC(d,J,F+2-z|0,m,k,0,1)|0;if((v|0)>0){z=z+(v-1)|0}if((F+1-z|0)>(G+1|0)){break L1372}else{break}}}while(0);do{if((i<<1|0)<=((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){B=(dC(d,0,0,l,k,0,3)|0)+1|0;if((B|0)>=(dC(d,0,(l|0)/2|0,l,k,0,3)|0)){break}p=(p*97|0|0)/100|0}}while(0);B=dC(d,0,m-1|0,l,k,0,3)|0;if((B-(dC(d,0,m-3|0,l,k,0,3)|0)|0)>(((l|0)/16|0)+1|0)){p=(p*96|0|0)/100|0}do{if((f|0)!=0){B=dC(d,0,(m<<1|0)/4|0,l,k,0,3)|0;if((B-(dC(d,l-1|0,(m<<1|0)/4|0,l,k,0,4)|0)|0)<=((l|0)/8|0|0)){break L1372}else{break}}}while(0);if((t*3|0|0)>((c[a+52>>2]|0)+(c[a+56>>2]<<1)|0)){p=(p*80|0|0)/100|0}if((f|0)==0){p=(p*96|0|0)/100|0}if((c[a+24>>2]|0)!=1){p=(p*98|0|0)/100|0}dy(a,106,p)|0}}while(0);o=100;p=100;do{if((m|0)>4){if((m|0)<=(l|0)){L=0;break}L=(m*5|0|0)>((c[a+60>>2]|0)-(c[a+56>>2]|0)<<2|0)}else{L=0}}while(0);L1529:do{if(L){if((c[a+24>>2]|0)==1){break}if((c[b+108>>2]|0)>1){break}J=dC(d,0,(m|0)/2|0,l,k,0,3)|0;if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)>(J+((l|0)/8|0)|0)){break}z=(m|0)/16|0;while(1){if((z|0)>=(m-1-((m|0)/16|0)|0)){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){if((dv(0,l-1|0,z+((m|0)/16|0)|0,z+((m|0)/16|0)|0,d,k)|0)!=1){C=1119;break}}z=z+1|0}if((z|0)<(m-1-((m|0)/16|0)|0)){break}J=dC(d,0,(m|0)/2|0,l,k,0,3)|0;t=dC(d,J,(m|0)/2|0,l,k,1,3)|0;z=(m|0)/4|0;while(1){if((z|0)>=((m*3|0|0)/4|0|0)){break}J=dC(d,0,z,l,k,0,3)|0;J=dC(d,J,z,l,k,1,3)|0;if((P(J-t|0)|0)>(((l|0)/8|0)+1|0)){C=1128;break}z=z+1|0}if((z|0)<((m*3|0|0)/4|0|0)){break}G=0;F=0;z=0;while(1){if((z|0)>=((m|0)/4|0|0)){break}J=dC(d,0,z,l,k,0,3)|0;J=dC(d,J,z,l,k,1,3)|0;if((J|0)>(G|0)){G=J;F=z}z=z+1|0}E=0;D=0;z=(m*3|0|0)/4|0;while(1){if((z|0)>=(m|0)){break}J=dC(d,0,z,l,k,0,3)|0;J=dC(d,J,z,l,k,1,3)|0;if((J|0)>(E|0)){E=J;D=z}z=z+1|0}if((P(E-G|0)|0)>(((l|0)/8|0)+1|0)){break}do{if((G+1|0)<(t|0)){if((e|0)!=0){break}break L1529}}while(0);J=dC(d,0,(m|0)/8|0,l,k,0,3)|0;G=J;J=J+(dC(d,J,(m|0)/8|0,l,k,1,3)|0)|0;G=(G+J-1|0)/2|0;J=dC(d,0,m-1-((m|0)/8|0)|0,l,k,0,3)|0;F=J;J=J+(dC(d,J,m-1-((m|0)/8|0)|0,l,k,1,3)|0)|0;F=(F+J-1|0)/2|0;J=dC(d,0,m-2-((m|0)/8|0)|0,l,k,0,3)|0;v=J;J=J+(dC(d,J,m-2-((m|0)/8|0)|0,l,k,1,3)|0)|0;v=(v+J-1|0)/2|0;if((v|0)>(F|0)){F=v}if((dt(G,(m|0)/8|0,F,m-1-((m|0)/8|0)|0,d,k,100)|0)<95){break}J=(G-F+4|0)/8|0;G=G+J|0;F=F-J|0;z=(m|0)/8|0;J=dC(d,G,z|0,l,k,1,4)|0;v=J;J=dC(d,G,z+1|0,l,k,1,4)|0;if((J|0)>(v|0)){v=J}J=dC(d,G,z|0,l,k,1,3)|0;A=J;J=dC(d,G,z+1|0,l,k,1,3)|0;if((J|0)>(A|0)){A=J}if((P(v-A|0)|0)>(((l|0)/8|0)+1|0)){break}J=dC(d,F,m-z-1|0,l,k,1,4)|0;A=J;J=dC(d,F,m-z-2|0,l,k,1,4)|0;if((J|0)>(A|0)){A=J}if((P(v-A|0)|0)>(((l|0)/8|0)+1|0)){break}J=dC(d,F,m-z-1|0,l,k,1,3)|0;A=J;J=dC(d,F,m-z-2|0,l,k,1,3)|0;if((J|0)>(A|0)){A=J}if((P(v-A|0)|0)>(((l|0)/8|0)+1|0)){break}do{if((m|0)>15){H=dC(d,l-1|0,(m|0)/16|0,l,k,0,4)|0;if((H|0)>((dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0)+1+((l|0)/32|0)|0)){break L1529}else{break}}}while(0);v=0;z=(m|0)/16|0;while(1){if((z|0)<((m*15|0|0)/16|0|0)){M=(v|0)<2}else{M=0}if(!M){break}if((dv(0,l-1|0,z,z,d,k)|0)!=1){v=v+1|0}z=z+1|0}if((v|0)>1){break}if((e|0)==0){do{if(((du((l|0)/4|0,(l|0)/4|0,0,(m|0)/4|0,d,k,1)|0)<<24>>24|0)==1){if(((du((l|0)/4|0,(l|0)/4|0,(m|0)/2|0,m-1|0,d,k,1)|0)<<24>>24|0)!=0){break}break L1529}}while(0);do{if((dC(d,0,(m|0)/4|0,l,k,0,3)|0)>((l|0)/4|0|0)){if((dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0)>((l|0)/4|0|0)){break}if((dC(d,1,0,m,k,0,2)|0)>((m|0)/4|0|0)){break}break L1529}}while(0)}do{if(((du(h,h,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=2){if(((du(g,h,i,i,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,h,j,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)==2){break}if(((du(g,g,i+1|0,j-1|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break}break L1529}}while(0);do{if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)<=((l|0)/8|0|0)){if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)<=((l|0)/2|0|0)){break}break L1529}}while(0);do{if((dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)>((l|0)/2|0|0)){if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)>((l|0)/8|0|0)){break}break L1529}}while(0);do{if((dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0)>((l|0)/2|0|0)){if((dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0)<=((l|0)/2|0|0)){break}if((dC(d,0,(m|0)/2|0,l,k,0,3)|0)>=((l|0)/4|0|0)){break}break L1529}}while(0);J=dC(d,0,(m|0)/2|0,l,k,0,3)|0;v=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)>(J+((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)<=(J+((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0)>=(v-((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)>=(v-((l|0)/8|0)|0)){break}break L1529}}while(0);do{if((dC(d,0,(m*7|0|0)/8|0,l,k,0,3)|0)<(J-((l|0)/8|0)|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)>=(J-((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0)<=(v+((l|0)/8|0)|0)){break}if((dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)<=(v+((l|0)/8|0)|0)){break}break L1529}}while(0);F=dC(d,0,(m|0)/8|0,l,k,0,3)|0;if((F-(l-(dC(d,l-1|0,(m*7|0|0)/8|0,l,k,0,4)|0))|0)>((l|0)/4|0|0)){break}do{if((dC(d,0,0,l,k,0,3)|0)>((l|0)/2|0|0)){if((dC(d,0,(m|0)/8|0,l,k,0,3)|0)<=((l|0)/2|0|0)){break}if((dC(d,l-1|0,m-1|0,l,k,0,4)|0)<=((l|0)/2|0|0)){break}if((dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)<=((l|0)/2|0|0)){break}p=(p*99|0|0)/100|0}}while(0);do{if((c[a+56>>2]|0)!=0){if((i*3|0|0)<=((c[a+52>>2]|0)+(c[a+56>>2]<<1)|0)){break}if(((du(g+((l|0)/8|0)|0,h-((l|0)/8|0)|0,c[a+52>>2]|0,((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)/2|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){break L1529}else{break}}}while(0);do{if((G+1|0)<(t|0)){if((e|0)!=0){break}p=(p*65|0|0)/100|0}}while(0);E=dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0;D=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;do{if((E|0)<2){C=1237}else{if((D|0)<2){C=1237;break}if(((du(h-((E|0)/4|0)|0,h-((E|0)/4|0)|0,i,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){C=1237;break}if(((du(g+((D|0)/4|0)|0,g+((D|0)/4|0)|0,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){C=1237}}}while(0);if((C|0)==1237){p=(p*99|0|0)/100|0}if((e|0)==0){p=(p*96|0|0)/100|0}do{if((c[a+64>>2]|0)!=0){if((j|0)>=(c[a+64>>2]|0)){break}if((l|0)>2){if(((du(g+1|0,h-1|0,j+1|0,c[a+64>>2]|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){C=1246}else{C=1244}}else{C=1244}do{if((C|0)==1244){if((l|0)>=3){break}if(((du(g,h,j+1|0,c[a+64>>2]|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){C=1246}}}while(0);if((C|0)==1246){p=(p*96|0|0)/100|0}}}while(0);D=0;E=l;z=0;t=0;G=0;while(1){if((z|0)>=((m|0)/4|0|0)){break}v=dC(d,l-1|0,z,l,k,0,4)|0;if((l-v-1|0)>(D|0)){D=l-1-v|0;t=z}v=v+(dC(d,l-1-v|0,z,l,k,1,4)|0)|0;if((l-v-1|0)<(E|0)){E=l-v|0;G=z}z=z+1|0}F=l;H=0;I=m-1|0;z=I;s=I;K=I;while(1){if((z|0)<=(m-1-((m|0)/4|0)|0)){break}v=dC(d,0,z,l,k,0,3)|0;if((v|0)<(F|0)){F=v;s=z}v=v+(dC(d,v,z,l,k,1,3)|0)|0;if((v|0)>(H|0)){H=v;K=z}z=z-1|0}J=((E*3|0)+F|0)/4|0;z=((G*3|0)+s|0)/4|0;v=dC(d,J,z,l,k,0,3)|0;J=((D*3|0)+H|0)/4|0;z=((t*3|0)+K|0)/4|0;A=dC(d,J,z,l,k,0,4)|0;do{if((A|0)>1){if((v<<1|0)<=(A*3|0|0)){if((v*3|0|0)>=(A<<1|0)){break}}p=(p*99|0|0)/100|0}}while(0);do{if((A|0)>1){if((v|0)<=(A<<1|0)){if((v<<1|0)>=(A|0)){break}}p=(p*97|0|0)/100|0}}while(0);v=dC(d,0,0,m,k,0,2)|0;do{if((v|0)>((m|0)/8|0|0)){if((v|0)>=((m|0)/2|0|0)){break}p=(p*99|0|0)/100|0}}while(0);K=dC(d,l-1|0,0,l,k,0,4)|0;if((K-(dC(d,0,0,l,k,0,3)|0)|0)>((l|0)/4|0|0)){p=(p*96|0|0)/100|0}K=dC(d,l-1|0,0,l,k,0,4)|0;if((K-(dC(d,0,0,l,k,0,3)|0)|0)==((l|0)/4|0|0)){p=(p*98|0|0)/100|0}do{if((p|0)>98){if(((du(g,h,i,j,c[a+68>>2]|0,k,2)|0)<<24>>24|0)!=0){break}p=(p*99|0|0)/100|0}}while(0);if((f|0)!=0){p=(p*98|0|0)/100|0}do{if((c[a+60>>2]|0)!=0){if((j<<1|0)>((c[a+56>>2]|0)+(c[a+60>>2]|0)|0)){break}p=(p*96|0|0)/100|0}}while(0);do{if((l|0)<3){if((m|0)<=10){break}if((c[a+64>>2]|0)!=0){break}p=(p*95|0|0)/100|0}}while(0);dy(a,73,p)|0}}while(0);o=100;p=100;do{if((m|0)>4){if((m|0)<(l|0)){N=0;break}N=(l|0)>2}else{N=0}}while(0);do{if(N){if((c[b+108>>2]|0)>0){break}o=(cH(32)|0)<<1;if((c[n+56>>2]|0)>(o|0)){break}v=cI(a,c[n+60>>2]|0,c[n+28>>2]|0,(g+h|0)/2|0,i)|0;f=cI(a,v,c[n+28>>2]|0,h+((l|0)/8|0)|0,j-((m|0)/8|0)|0)|0;k=cI(a,f,c[n+60>>2]|0,g-(l<<1)|0,j-((m|0)/8|0)|0)|0;d=cI(a,c[n+28>>2]|0,c[n+44>>2]|0,(g+h|0)/2|0,j)|0;z=cI(a,c[n+28>>2]|0,c[n+60>>2]|0,h,(i+(j<<1)|0)/3|0)|0;J=cI(a,c[n+44>>2]|0,c[n+60>>2]|0,(g+(h<<1)|0)/3|0,i)|0;M=cI(a,c[n+60>>2]|0,f,g,i)|0;L=cI(a,M,f,h,i)|0;v=cI(a,f,d,g,i)|0;if(((c[a+296+(v<<3)+4>>2]|0)-i|0)<((m|0)/4|0|0)){break}if(((c[a+296+(v<<3)+4>>2]|0)-i|0)<=((m|0)/2|0|0)){p=(p*97|0|0)/100|0}A=cI(a,M,L,g,j)|0;if(((c[a+296+(v<<3)+4>>2]|0)-(c[a+296+(A<<3)+4>>2]|0)|0)<=((m|0)/4|0|0)){break}if((c[a+296+(L<<3)+4>>2]|0)>(i+((m|0)/4|0)|0)){break}if(((c[a+296+(f<<3)+4>>2]|0)-(c[a+296+(L<<3)+4>>2]|0)|0)<((m|0)/2|0|0)){break}if(((c[a+296+(z<<3)+4>>2]|0)-(c[a+296+(J<<3)+4>>2]|0)|0)<((m|0)/2|0|0)){break}if((c[a+296+(L<<3)>>2]|0)<(g+((l|0)/2|0)|0)){break}if(((c[a+296+(f<<3)>>2]|0)-(c[a+296+(k<<3)>>2]|0)|0)<=((l|0)/8|0|0)){break}if(((c[a+296+(f<<3)>>2]|0)-(c[a+296+(k<<3)>>2]|0)|0)<=((l|0)/4|0|0)){p=(p*99|0|0)/100|0}if((c[a+296+(M<<3)+4>>2]|0)>(i+((m|0)/8|0)|0)){p=(p*99|0|0)/100|0}if((c[n+8>>2]|0)==0){p=(p*99|0|0)/100|0;if((c[n+24>>2]|0)==0){p=(p*98|0|0)/100|0}if((c[n+40>>2]|0)<=(c[n+56>>2]|0)){p=(p*97|0|0)/100|0}}d=k;v=d;A=d;while(1){if((v|0)==(z|0)){break}if((c[a+296+(v<<3)>>2]|0)<(c[a+296+(f<<3)>>2]|0)){C=1330;break}v=(v+1|0)%(c[a+264>>2]|0)|0}if((v|0)==(z|0)){break}d=k;v=d;A=d;while(1){if((v|0)==(z|0)){break}if((c[a+296+(v<<3)>>2]|0)>(c[a+296+(z<<3)>>2]|0)){C=1338;break}v=(v+1|0)%(c[a+264>>2]|0)|0}if((v|0)!=(z|0)){break}k=J;v=k;A=k;while(1){if((v|0)==(M|0)){break}if((c[a+296+(v<<3)+4>>2]|0)>(i+((m|0)/4|0)|0)){C=1346;break}v=(v+1|0)%(c[a+264>>2]|0)|0}if((v|0)!=(M|0)){break}k=cG(a,L,f)|0;if((k|0)>((cH(256)|0)<<1|0)){break}if((k*5|0|0)>((cH(256)|0)<<3|0)){p=(p*99|0|0)/100|0}if((k*6|0|0)>((cH(256)|0)<<3|0)){p=(p*99|0|0)/100|0}if((k*7|0|0)>((cH(256)|0)<<3|0)){p=(p*99|0|0)/100|0}if((k<<3|0)>((cH(256)|0)<<3|0)){p=(p*99|0|0)/100|0}k=cG(a,z,J)|0;if((k|0)>((cH(256)|0)<<1|0)){break}if((k*5|0|0)>((cH(256)|0)<<3|0)){p=(p*99|0|0)/100|0}if((e|0)==0){p=(p*99|0|0)/100|0}if((c[a+196>>2]|0)>1){p=(p*98|0|0)/100|0}dy(a,74,p)|0}}while(0);x=c[a+36>>2]|0;y=x;return y|0}function c7(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=a;a=c[b>>2]|0;d=0;e=c[a>>2]|0;f=c[a+4>>2]|0;g=c[a+8>>2]|0;h=c[b+8>>2]|0;i=f-e+1|0;j=(c[a+12>>2]|0)-g+1|0;k=100;if((i|0)>2){l=(j|0)>3}else{l=0}if(!l){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}if((c[b+108>>2]|0)>1){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}l=dv(0,i-1|0,(j|0)/4|0,(j|0)/4|0,c[b+4>>2]|0,h)|0;p=dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,c[b+4>>2]|0,h)|0;if((l|0)<2){q=1382}else{if((l|0)>3){q=1382}}do{if((q|0)==1382){if((p|0)==2){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);do{if((dC(c[b+4>>2]|0,(i|0)/2|0,0,j,h,0,2)|0)>((j|0)/8|0|0)){if((c[b+36>>2]|0)==0){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);p=(j*5|0|0)/8|0;do{if((dv(0,(i|0)/2|0,p,p,c[b+4>>2]|0,h)|0)!=1){if((dv(0,(i|0)/2|0,p-1|0,p-1|0,c[b+4>>2]|0,h)|0)==1){break}if((dv((i|0)/2|0,i-1|0,p,p,c[b+4>>2]|0,h)|0)>=1){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);p=dC(c[b+4>>2]|0,i-1-((i|0)/4|0)|0,0,j,h,0,2)|0;if((p|0)>((j|0)/2|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}do{if((p|0)>1){if(((du(i-1-((i|0)/4|0)|0,i-1|0,0,p-2|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)!=1){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);p=(j*3|0|0)/4|0;do{if((dv(0,(i|0)/2|0,p,p,c[b+4>>2]|0,h)|0)==1){if((dv((i|0)/2|0,i-1|0,p,p,c[b+4>>2]|0,h)|0)!=0){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);p=(j|0)/2|0;do{if((dv(0,i-1|0,((j|0)/2|0)-((j|0)/8|0)|0,((j|0)/2|0)-((j|0)/8|0)|0,c[b+4>>2]|0,h)|0)==2){if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,c[b+4>>2]|0,h)|0)!=2){q=1452;break}r=dC(c[b+4>>2]|0,0,p,i,h,0,3)|0;if((r|0)>((i|0)/4|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}r=r+(dC(c[b+4>>2]|0,r,p,i-r|0,h,1,3)|0)|0;if((r|0)>((i|0)/2|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}s=r;r=r+(dC(c[b+4>>2]|0,r,p,i-r|0,h,0,3)|0)|0;if((r|0)<((i|0)/2|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}t=r;r=r+(dC(c[b+4>>2]|0,r,p,i-r|0,h,1,3)|0)|0;if((r|0)<((i*3|0|0)/4|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}l=(j|0)/4|0;p=(j*13|0|0)/16|0;if((dv((i|0)/2|0,i-1|0,p,p,c[b+4>>2]|0,h)|0)==2){l=(j*3|0|0)/8|0}do{if((l|0)<2){if((l|0)>=((j|0)/2|0|0)){break}l=l+1|0}}while(0);r=s;while(1){if((r|0)>=(t|0)){break}if((dC(c[b+4>>2]|0,r,0,j,h,0,2)|0)>=(l|0)){q=1418;break}r=r+1|0}if((r|0)<(t|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}r=s;while(1){if((r|0)>=(t|0)){break}if((dC(c[b+4>>2]|0,r,j-1|0,j,h,0,1)|0)>((j|0)/4|0|0)){q=1426;break}r=r+1|0}if((r|0)==(t|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}p=0;r=(s+t|0)/2|0;while(1){if((r|0)>=(t|0)){break}l=dC(c[b+4>>2]|0,r,0,j,h,0,2)|0;l=dC(c[b+4>>2]|0,r,l,j,h,1,2)|0;if((l|0)>(p|0)){p=l}if((l|0)<((p|0)/2|0|0)){q=1436;break}r=r+1|0}if((r|0)<(t|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}if((j|0)>7){s=dC(c[b+4>>2]|0,i-1|0,j-1-((j|0)/8|0)|0,i,h,0,4)|0;u=s+(dC(c[b+4>>2]|0,0,j-1-((j|0)/8|0)|0,i,h,0,3)|0)-((i|0)/8|0)-1|0;s=dC(c[b+4>>2]|0,i-1|0,j-1-((j|0)/2|0)|0,i,h,0,4)|0;if((u|0)>(s+(dC(c[b+4>>2]|0,0,j-1-((j|0)/2|0)|0,i,h,0,3)|0)|0)){k=(k*90|0|0)/100|0}}do{if((j|0)>7){if((i|0)<=7){break}do{if((dC(c[b+4>>2]|0,i-1|0,(j|0)/2|0,i,h,0,4)|0)==0){if((dC(c[b+4>>2]|0,i-1|0,j-1-((j|0)/8|0)|0,i,h,0,3)|0)<=((i|0)/8|0|0)){break}k=(k*98|0|0)/100|0}}while(0)}}while(0)}else{q=1452}}while(0);do{if((q|0)==1452){do{if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,c[b+4>>2]|0,h)|0)!=3){if((dv(0,i-1|0,((j|0)/2|0)-((j|0)/8|0)|0,((j|0)/2|0)-((j|0)/8|0)|0,c[b+4>>2]|0,h)|0)==3){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);l=dC(c[b+4>>2]|0,0,((j|0)/2|0)-((j|0)/8|0)|0,i,h,0,3)|0;if((l|0)>((i|0)/4|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}l=l+(dC(c[b+4>>2]|0,l,((j|0)/2|0)-((j|0)/8|0)|0,i,h,1,3)|0)|0;if((l|0)>((i|0)/2|0|0)){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}l=l+(dC(c[b+4>>2]|0,l,((j|0)/2|0)-((j|0)/8|0)|0,i,h,0,3)|0)|0;if((dv(l,l,0,((j|0)/2|0)-((j<<1|0)/8|0)|0,c[b+4>>2]|0,h)|0)!=0){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}l=l+(dC(c[b+4>>2]|0,l,((j|0)/2|0)-((j|0)/8|0)|0,i,h,1,3)|0)|0;if((dv(l,l,((j|0)/2|0)+1|0,j-1|0,c[b+4>>2]|0,h)|0)==0){d=80;break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);l=dC(c[b+4>>2]|0,i-1|0,(j|0)/2|0,i,h,0,4)|0;do{if((l|0)>5){if(((du(i-1-((l|0)/2|0)|0,i-1-((l|0)/2|0)|0,0,(j|0)/2|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)!=1){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);l=l+(dC(c[b+4>>2]|0,i-1-l|0,(j|0)/2|0,i,h,1,4)|0)|0;if(((du(i-1-l|0,i-1-l|0,0,(j|0)/2|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)==0){m=a;n=m+36|0;o=c[n>>2]|0;return o|0}do{if(((du((i|0)/2|0,(i|0)/2|0,(j|0)/4|0,(j|0)/4|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)==0){if(((du((i|0)/2|0,i-1|0,j-2|0,j-2|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)!=0){break}if(((du((i|0)/2|0,(i|0)/2|0,(j|0)/4|0,j-2|0,c[b+4>>2]|0,h,1)|0)<<24>>24|0)!=1){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);do{if((c[a+24>>2]|0)>0){if((c[a+52>>2]|0)==0){break}L2067:do{if(((du((f+e|0)/2|0,f,c[a+52>>2]|0,g-1|0,c[a+68>>2]|0,h,1)|0)<<24>>24|0)==1){do{if((dv(0,i-1|0,0,0,c[b+4>>2]|0,h)|0)<=2){if((dv(0,i-1|0,1,1,c[b+4>>2]|0,h)|0)>2){break}break L2067}}while(0);m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0)}}while(0);l=dC(c[b+4>>2]|0,i-1|0,j-1|0,i,h,0,4)|0;if((l|0)>((i|0)/2|0|0)){l=dC(c[b+4>>2]|0,i-1|0,j-2|0,i,h,0,4)|0}r=dC(c[b+4>>2]|0,i-1|0,j-1-((j|0)/4|0)|0,i,h,0,4)|0;do{if((c[b+36>>2]|0)!=0){if((l-r|0)<=1){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);r=dC(c[b+4>>2]|0,0,j-1|0,i,h,0,4)|0;l=dC(c[b+4>>2]|0,0,j-2|0,i,h,0,4)|0;if((l|0)<(r|0)){r=l}l=dC(c[b+4>>2]|0,0,1,i,h,0,4)|0;if((l|0)<(r|0)){r=l}l=dC(c[b+4>>2]|0,0,2,i,h,0,4)|0;if((l|0)<(r|0)){r=l}do{if((c[b+36>>2]|0)!=0){if((r|0)<=0){break}m=a;n=m+36|0;o=c[n>>2]|0;return o|0}}while(0);if((dv(0,i-1|0,(j|0)/4|0,(j|0)/4|0,c[b+4>>2]|0,h)|0)>=3){k=(k*98|0|0)/100|0}if((c[b+36>>2]|0)!=0){q=1500}else{if((g<<1|0)<((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){q=1500}}if((q|0)==1500){k=(k*96|0|0)/100|0}if((c[b+40>>2]|0)!=0){k=(k*96|0|0)/100|0}if((i|0)<5){k=(k*99|0|0)/100|0;if((dv(0,i-1|0,(j|0)/8|0,(j|0)/8|0,c[b+4>>2]|0,h)|0)>=2){k=(k*97|0|0)/100|0;if((j|0)<=4){j=a;dy(j,109,97)|0}}}dy(a,110,k)|0;m=a;n=m+36|0;o=c[n>>2]|0;return o|0}function c8(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[b+8>>2]|0;h=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;i=(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0;j=100;if((h|0)>3){k=(i|0)>3}else{k=0}if(!k){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((c[b+108>>2]|0)>1){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}k=(i|0)/4|0;while(1){if((k|0)>((i*3|0|0)/4|0|0)){break}if((dv(0,h-1|0,k,k,d,g)|0)>=3){o=1547;break}k=k+1|0}do{if((k|0)>((i*3|0|0)/4|0|0)){if((h|0)<=4){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i|0)/4|0,(i|0)/4|0,d,g)|0)<2){if((dv(0,h-1|0,(i|0)/8|0,(i|0)/8|0,d,g)|0)>=2){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((dv(0,h-1|0,(i*3|0|0)/4|0,(i*3|0|0)/4|0,d,g)|0)<2){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}p=dC(d,h-1|0,i-1|0,h,g,0,4)|0;p=dC(d,h-1-p|0,i-1|0,h,g,1,4)|0;if((p|0)>((h|0)/2|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}q=dC(d,0,(i*7|0|0)/16|0,h,g,0,3)|0;if((q+(dC(d,h-1|0,(i*7|0|0)/16|0,h,g,0,4)|0)|0)>((h|0)/2|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((dC(d,0,i-1|0,h,g,0,3)|0)>((i|0)/4|0|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}if((dC(d,0,i-1|0,h,g,0,3)|0)>((i|0)/8|0|0)){j=(j*99|0|0)/100|0}do{if((i|0)>8){if((dC(d,(h|0)/4|0,i-1|0,i,g,0,1)|0)>=((i|0)/4|0|0)){break}if((dC(d,(h*3|0|0)/8|0,i-1|0,i,g,0,1)|0)>=((i|0)/4|0|0)){break}q=dC(d,0,i-1-((i|0)/8|0)|0,h,g,0,3)|0;if((q|0)>=((dC(d,0,i-1-((i|0)/16|0)|0,h,g,0,3)|0)-((h|0)/32|0)|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i|0)/2|0,(i|0)/2|0,d,g)|0)==2){if((dv(0,h-1|0,(i|0)/4|0,(i|0)/4|0,d,g)|0)<=2){break}if((dv(0,h-1|0,(i*3|0|0)/4|0,(i*3|0|0)/4|0,d,g)|0)<=2){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i*3|0|0)/4|0,(i*3|0|0)/4|0,d,g)|0)==2){if((dv((h|0)/2|0,(h|0)/2|0,(i*3|0|0)/4|0,i-1|0,d,g)|0)<=0){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);q=dC(d,(h*3|0|0)/4|0,0,i,g,0,2)|0;do{if((q|0)>(dC(d,(h<<1|0)/4|0,0,i,g,0,2)|0)){r=dC(d,(h*3|0|0)/4|0,i-1|0,i,g,0,1)|0;if((r|0)>=(dC(d,(h<<1|0)/4|0,i-1|0,i,g,0,1)|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);q=dC(d,(h*3|0|0)/4|0,(i|0)/8|0,i,g,0,2)|0;do{if((q|0)>(dC(d,(h<<1|0)/4|0,(i|0)/8|0,i,g,0,2)|0)){r=dC(d,(h*3|0|0)/4|0,i-1-((i|0)/8|0)|0,i,g,0,1)|0;if((r|0)>=(dC(d,(h<<1|0)/4|0,i-1-((i|0)/8|0)|0,i,g,0,1)|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((dv(0,h-1|0,(i|0)/2|0,(i|0)/2|0,d,g)|0)!=4){if((dv(0,h-1|0,(i|0)/2|0,(i|0)/2|0,d,g)|0)==3){k=((i|0)/2|0)+1|0;while(1){if((k|0)>=(i|0)){break}if((dv(0,h-1|0,k,k,d,g)|0)<3){o=1590;break}k=k+1|0}do{if((dv(0,h-1|0,k,k,d,g)|0)==2){p=dC(d,h-1|0,k-1|0,h,g,0,4)|0;p=p+(dC(d,h-1-p|0,k-1|0,h,g,1,4)|0)|0;p=p+(dC(d,h-1-p|0,k-1|0,h,g,0,4)|0)|0;if((dC(d,h-p|0,k-1|0,i,g,0,1)|0)<=(k-2|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0)}}q=0;r=(h|0)/2|0;p=r;s=r;while(1){if((p|0)>=(h-((h|0)/4|0)|0)){break}k=dC(d,p,0,i,g,0,2)|0;if((k|0)<=(q|0)){o=1603;break}q=k;s=p;p=p+1|0}dC(d,s,q,i-q|0,g,1,2)|0;do{if((q|0)<((i|0)/4|0|0)){if((c[b+36>>2]|0)!=0){j=(j*99|0|0)/100|0;break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((q|0)==0){if((h|0)<=8){break}if((i|0)<=12){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((c[b+108>>2]|0)!=0){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}b=dC(d,0,(i*3|0|0)/4|0,h,g,0,3)|0;b=dC(d,b,(i*3|0|0)/4|0,h,g,1,3)|0;L2245:do{if(((b+1|0)*7|0|0)<(h|0)){do{if((dv(s,h-1|0,q-1|0,q-1|0,d,g)|0)==2){if((dv(0,s,q-1|0,q-1|0,d,g)|0)!=2){break}break L2245}}while(0);l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,0,0,d,g)|0)!=2){if((dv(0,h-1|0,1,1,d,g)|0)==2){break}if((dv(0,h-1|0,2,2,d,g)|0)==2){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i|0)/4|0,(i|0)/4|0,d,g)|0)==4){if((dv(0,h-1|0,(i*3|0|0)/4|0,(i*3|0|0)/4|0,d,g)|0)!=4){break}s=dC(d,0,(i|0)/4|0,h,g,0,3)|0;s=s+(dC(d,s,(i|0)/4|0,h,g,1,3)|0)|0;s=s+(dC(d,s,(i|0)/4|0,h,g,0,3)|0)|0;q=dC(d,0,(i*3|0|0)/4|0,h,g,0,3)|0;q=q+(dC(d,q,(i*3|0|0)/4|0,h,g,1,3)|0)|0;q=q+(dC(d,q,(i*3|0|0)/4|0,h,g,0,3)|0)|0;if((s|0)>=(q|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}s=s+(dC(d,s,(i|0)/4|0,h,g,1,3)|0)|0;q=q+(dC(d,q,(i*3|0|0)/4|0,h,g,1,3)|0)|0;if((s|0)>=(q|0)){l=a;m=l+36|0;n=c[m>>2]|0;return n|0}s=s+(dC(d,s,(i|0)/4|0,h,g,0,3)|0)|0;q=q+(dC(d,q,(i*3|0|0)/4|0,h,g,0,3)|0)|0;if((s|0)>(q|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);do{if((dv(0,h-1|0,(i|0)/2|0,(i|0)/2|0,d,g)|0)==2){if((dv(0,h-1|0,(i|0)/4|0,(i|0)/4|0,d,g)|0)!=2){break}if((e|0)!=0){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((i|0)<17){if((dv(0,h-1|0,0,0,d,g)|0)<2){j=(j*99|0|0)/100|0}}if((h|0)>5){if((dv(0,h-1|0,1,1,d,g)|0)<2){j=(j*96|0|0)/100|0}}if((dv((h|0)/2|0,(h|0)/2|0,0,i-1|0,d,g)|0)!=1){j=(j*98|0|0)/100|0}do{if((h|0)<5){if((dC(d,(h|0)/2|0,0,i,g,0,2)|0)<((i*3|0|0)/8|0|0)){break}j=(j*96|0|0)/100|0}}while(0);do{if((dv(0,h-1|0,(i|0)/4|0,(i|0)/4|0,d,g)|0)<=2){if((dv(0,h-1|0,(i*3|0|0)/4|0,(i*3|0|0)/4|0,d,g)|0)>2){break}if((h|0)<=8){break}if((i|0)<=12){break}j=(j*98|0|0)/100|0;k=(i*5|0|0)/16|0;while(1){if((k|0)>=((i*5|0|0)/8|0|0)){break}if((dv(0,h-1|0,k,k,d,g)|0)==1){o=1658;break}k=k+1|0}if((k|0)<((i*5|0|0)/8|0|0)){j=(j*95|0|0)/100|0}L2316:do{if((k|0)<((i*5|0|0)/8|0|0)){do{if((dv(((h|0)/6|0)+2|0,h-3-((h|0)/6|0)|0,k-2|0,k-2|0,d,g)|0)!=0){if((dv(((h|0)/6|0)+2|0,h-3-((h|0)/6|0)|0,k-1|0,k-1|0,d,g)|0)==0){break}break L2316}}while(0);l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0)}}while(0);do{if((dC(d,(h*3|0|0)/8|0,0,i,g,0,2)|0)>((i|0)/2|0|0)){if((dC(d,(h*5|0|0)/8|0,i-1|0,i,g,0,1)|0)<=((i|0)/2|0|0)){break}j=(j*95|0|0)/100|0}}while(0);do{if((e|0)==0){j=(j*98|0|0)/100|0;k=dC(d,0,(i|0)/4|0,h,g,0,3)|0;if((k|0)>=((dC(d,0,i-1-((i|0)/8|0)|0,h,g,0,3)|0)-((h|0)/16|0)|0)){break}l=a;m=l+36|0;n=c[m>>2]|0;return n|0}}while(0);if((f|0)!=0){j=(j*98|0|0)/100|0}do{if((j|0)>99){if((h|0)>=8){break}j=(j*99|0|0)/100|0}}while(0);dy(a,77,j)|0;l=a;m=l+36|0;n=c[m>>2]|0;return n|0}function c9(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;b=i;i=i+40|0;d=b|0;e=a;a=c[e>>2]|0;f=c[e+36>>2]|0;g=c[e+40>>2]|0;h=c[a>>2]|0;j=c[a+4>>2]|0;k=c[a+8>>2]|0;l=c[a+12>>2]|0;m=j-h+1|0;n=l-k+1|0;o=e+44|0;p=100;q=100;if((m|0)>3){r=(n|0)>3}else{r=0}if(!r){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[e+108>>2]|0)>1){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[e+108>>2]|0)>0){q=(q*98|0|0)/100|0}if((m|0)<6){q=(q*99|0|0)/100|0}if((m|0)<5){q=(q*99|0|0)/100|0}p=(cH(32)|0)<<1;if((c[o+8>>2]|0)>(p|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[o+24>>2]|0)>(p|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[o+40>>2]|0)>(p|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[o+56>>2]|0)>(p|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+48>>2]|0)-(c[o>>2]|0)|0)<((m|0)/2|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+32>>2]|0)-(c[o+16>>2]|0)|0)<((m|0)/2|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+20>>2]|0)-(c[o+4>>2]|0)|0)<((n|0)/2|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+36>>2]|0)-(c[o+52>>2]|0)|0)<((n|0)/2|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+48>>2]|0)-(c[o>>2]|0)|0)<3){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[o+32>>2]|0)-(c[o+16>>2]|0)|0)<3){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[o+20>>2]|0)<=(l-((n|0)/4|0)|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((c[o+16>>2]|0)>(h+((m|0)/8|0)|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((P((c[o+52>>2]|0)-(c[o+4>>2]|0)|0)|0)>((n+2|0)/5|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((P((c[o+52>>2]|0)-(c[o+4>>2]|0)|0)|0)>((n+4|0)/8|0|0)){q=(q*98|0|0)/100|0}e=c[a+296+((cI(a,c[o+44>>2]|0,c[o+60>>2]|0,h,k+((n|0)/2|0)|0)|0)<<3)>>2]|0;do{if((e|0)>(h+((m|0)/2|0)|0)){if((e|0)<((c[o+32>>2]|0)-((m|0)/8|0)|0)){break}p=cG(a,c[o+12>>2]|0,c[o+28>>2]|0)|0;if((p|0)>((cH(256)|0)<<1|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}r=p-((cH(1024)|0)/2|0)|0;q=(aa(100-(((r|0)/(cH(1024)|0)|0|0)/4|0)|0,q)|0)/100|0;p=cG(a,c[o+44>>2]|0,c[o+60>>2]|0)|0;if((p|0)>((cH(256)|0)<<1|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}r=cI(a,c[o+28>>2]|0,c[o+44>>2]|0,h+((m|0)/8|0)|0,k)|0;e=c[a+296+(r<<3)>>2]|0;v=c[a+296+(r<<3)+4>>2]|0;if((v-k|0)>((n*5|0|0)/8|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((e-h|0)>((m*5|0|0)/8|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}w=cI(a,c[o+28>>2]|0,c[o+44>>2]|0,j,k)|0;x=cG(a,r,c[o+44>>2]|0)|0;p=x;c[d>>2]=x;x=cI(a,c[o+28>>2]|0,r,h+((m|0)/2|0)|0,l+((n|0)/2|0)|0)|0;y=cG(a,c[o+28>>2]|0,x)|0;p=y;c[d+4>>2]=y;y=a;z=x;A=r;cG(y,z,A)|0;A=c[d>>2]|0;if((A|0)>(cH(256)|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}do{if((m|0)>4){A=c[d+4>>2]|0;if((A|0)<=(cH(256)|0)){break}q=(q*97|0|0)/100|0}}while(0);do{if((m|0)>4){A=c[d+4>>2]|0;if((A|0)<=(cH(341)|0)){break}s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}}while(0);A=cI(a,c[o+60>>2]|0,c[o+12>>2]|0,j,l-((n|0)/8|0)|0)|0;e=c[a+296+(A<<3)>>2]|0;v=c[a+296+(A<<3)+4>>2]|0;if((v-k|0)<((n*3|0|0)/8|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if((e-h|0)<((m*3|0|0)/8|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}do{if(((c[a+296+(w<<3)>>2]|0)-(c[a+296+(r<<3)>>2]|0)|0)>((m|0)/4|0|0)){if(((c[a+296+(w<<3)+4>>2]|0)-(c[a+296+(r<<3)+4>>2]|0)|0)>((n|0)/8|0|0)){break}if((v|0)>(c[a+296+(r<<3)+4>>2]|0)){break}s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}}while(0);x=cI(a,A,c[o+12>>2]|0,h+((m|0)/2|0)|0,k-((n|0)/2|0)|0)|0;v=cG(a,A,x)|0;w=v+(cG(a,x,c[o+12>>2]|0)|0)|0;p=w;c[d+8>>2]=w;x=cI(a,c[o+60>>2]|0,A,h+((m|0)/2|0)|0,k-((n|0)/2|0)|0)|0;w=cG(a,c[o+60>>2]|0,x)|0;v=w+(cG(a,x,A)|0)|0;p=v;c[d+12>>2]=v;v=c[d+8>>2]|0;if((v|0)>(cH(256)|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}v=c[d+12>>2]|0;if((v|0)>(cH(256)|0)){q=(q*97|0|0)/100|0}v=c[d+12>>2]|0;if((v|0)>(cH(341)|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[a+296+(r<<3)+4>>2]|0)-k-(l-(c[a+296+(A<<3)+4>>2]|0))|0)>((n|0)/8|0|0)){q=(q*99|0|0)/100|0}if(((c[a+296+(A<<3)>>2]|0)-(c[a+296+(r<<3)>>2]|0)|0)<=((m|0)/8|0|0)){s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}if(((c[a+296+(A<<3)+4>>2]|0)-(c[a+296+(r<<3)+4>>2]|0)|0)<=((n|0)/8|0|0)){if((m|0)>8){q=(q*97|0|0)/100|0}}if(((c[a+296+(A<<3)+4>>2]|0)-(c[a+296+(r<<3)+4>>2]|0)|0)<=((n|0)/2|0|0)){q=(q*99|0|0)/100|0}v=c[d>>2]|0;w=v-((cH(1024)|0)/2|0)|0;q=(aa(100-(((w|0)/(cH(1024)|0)|0|0)/4|0)|0,q)|0)/100|0;w=c[d+4>>2]|0;v=w-((cH(1024)|0)/2|0)|0;q=(aa(100-(((v|0)/(cH(1024)|0)|0|0)/4|0)|0,q)|0)/100|0;v=c[d+8>>2]|0;w=v-((cH(1024)|0)/2|0)|0;q=(aa(100-(((w|0)/(cH(1024)|0)|0|0)/4|0)|0,q)|0)/100|0;w=c[d+12>>2]|0;v=w-((cH(1024)|0)/2|0)|0;q=(aa(100-(((v|0)/(cH(1024)|0)|0|0)/4|0)|0,q)|0)/100|0;if((f|0)==0){q=(q*99|0|0)/100|0}if((g|0)!=0){q=(q*98|0|0)/100|0}v=a;w=q;dy(v,78,w)|0;s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}}while(0);s=a;t=s+36|0;u=c[t>>2]|0;i=b;return u|0}function da(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=b+44|0;o=100;p=100;if((l|0)>2){q=(m|0)>3}else{q=0}if(!q){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((c[b+108>>2]|0)>1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}o=(cH(32)|0)<<1;if((c[n+56>>2]|0)<((o|0)/4|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((c[n+8>>2]|0)>((o|0)/2|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((c[n+24>>2]|0)>((o|0)/2|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((c[n+40>>2]|0)>((o|0)/2|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}o=c[n+12>>2]|0;q=c[n+28>>2]|0;u=q;v=q;q=c[n+44>>2]|0;n=q;w=q;q=v;x=q;y=q;while(1){if((x|0)==(w|0)){break}if((c[a+296+(x<<3)+4>>2]|0)<(c[a+296+(y<<3)+4>>2]|0)){y=x}if((c[a+296+(x<<3)+4>>2]|0)<=(i|0)){z=1846;break}x=(x+1|0)%(c[a+264>>2]|0)|0}if(((c[a+296+(y<<3)+4>>2]|0)-i|0)<((m|0)/4|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((j-(c[a+296+(y<<3)+4>>2]|0)|0)<((m|0)/4|0|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}q=cI(a,n,o,(g+h|0)/2|0,(i+j|0)/2|0)|0;q=cI(a,n,q,g,(i+j|0)/2|0)|0;u=cI(a,v,y,(g+h|0)/2|0,j)|0;w=cI(a,y,n,(g+h|0)/2|0,j)|0;if(((du(0,(l|0)/2|0,(m|0)/8|0,(m|0)/8|0,d,k,1)|0)<<24>>24|0)!=1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if(((du(0,(l|0)/2|0,(m|0)/2|0,(m|0)/2|0,d,k,1)|0)<<24>>24|0)!=1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if(((du((l|0)/2|0,l-1|0,m-1-((m|0)/3|0)|0,m-1-((m|0)/3|0)|0,d,k,1)|0)<<24>>24|0)!=1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if(((du((l|0)/2|0,(l|0)/2|0,(m|0)/5|0,m-1-((m|0)/3|0)|0,d,k,1)|0)<<24>>24|0)!=1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if(((du(l-1-((l|0)/3|0)|0,l-1|0,0,1,d,k,1)|0)<<24>>24|0)==1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if(((du(l-1-((l|0)/3|0)|0,l-1|0,1,(m|0)/6|0,d,k,1)|0)<<24>>24|0)==1){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}do{if((m|0)>18){if(((du(l-1-((l|0)/3|0)|0,l-1|0,(m|0)/6|0,(m|0)/5|0,d,k,1)|0)<<24>>24|0)!=1){break}r=a;s=r+36|0;t=c[s>>2]|0;return t|0}}while(0);if(((du(l-1-((l|0)/3|0)|0,l-1|0,m-1-((m|0)/4|0)|0,m-1|0,d,k,1)|0)<<24>>24|0)==0){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}n=g+((l|0)/3|0)|0;while(1){if((n|0)>=(h-((l|0)/3|0)|0)){break}if(((du(n,n,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){z=1874;break}n=n+1|0}if((n|0)>=(h-((l|0)/3|0)|0)){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}x=(m|0)/4|0;n=i+((m|0)/3|0)|0;while(1){if((n|0)<=(j|0)){A=(x|0)!=0}else{A=0}if(!A){break}if((dv(g,h,n,n,c[a+68>>2]|0,k)|0)==2){x=x-1|0}n=n+1|0}if((x|0)!=0){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}x=(m|0)/4|0;n=i;while(1){if((n|0)<=(i+((m|0)/2|0)|0)){B=(x|0)!=0}else{B=0}if(!B){break}if((dv(g,g+((l|0)/2|0)|0,n,n,c[a+68>>2]|0,k)|0)==1){x=x-1|0}n=n+1|0}if((x|0)!=0){r=a;s=r+36|0;t=c[s>>2]|0;return t|0}if((c[b+108>>2]|0)>0){do{if((c[b+128>>2]|0)>((m|0)/3|0|0)){if((c[b+136>>2]|0)>=(m-1-((m|0)/3|0)|0)){break}r=a;s=r+36|0;t=c[s>>2]|0;return t|0}}while(0)}n=(dC(d,l-1|0,(m|0)/3|0,l,k,0,4)|0)+((l|0)/8|0)|0;do{if((n|0)<(dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)){B=(dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)+((l|0)/8|0)|0;if((B|0)>=(dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)){break}r=a;s=r+36|0;t=c[s>>2]|0;return t|0}}while(0);x=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;do{if((x|0)>1){if((dv(g,g,i+((m|0)/8|0)+2|0,i+((m|0)/2|0)|0,c[a+68>>2]|0,k)|0)!=1){break}p=(aa(99-(1<<x)|0,p)|0)/100|0;if((dv(g,g,i,i+((m|0)/8|0)+2|0,c[a+68>>2]|0,k)|0)==0){p=(p*97|0|0)/100|0}if((dv(g+((l|0)/2|0)|0,g+((l|0)/2|0)|0,i,i+((m|0)/8|0)+2|0,c[a+68>>2]|0,k)|0)==1){p=(p*97|0|0)/100|0}if((p|0)>=1){break}r=a;s=r+36|0;t=c[s>>2]|0;return t|0}}while(0);x=dC(d,0,(m|0)/4|0,l,k,0,3)|0;x=x+((dC(d,x,(m|0)/4|0,l,k,1,3)|0)+1)|0;while(1){if((x|0)>=(l-((l|0)/3|0)|0)){break}if((dC(d,x,0,m,k,0,2)|0)>((m*5|0|0)/8|0|0)){p=(p*98|0|0)/100|0}x=x+1|0}if((dv(g,g,i+((m+3|0)/8|0)|0,j,c[a+68>>2]|0,k)|0)>1){p=(p*98|0|0)/100|0}x=dC(d,l-1|0,(m*3|0|0)/4|0,l,k,0,4)|0;do{if((x|0)>((l|0)/4|0|0)){if((dC(d,l-1-x|0,m-1|0,m,k,1,1)|0)<=((m|0)/2|0|0)){break}p=(p*94|0|0)/100|0}}while(0);x=dC(d,l-1|0,((m|0)/16|0)+1|0,l,k,0,4)|0;if((x|0)<((l|0)/4|0|0)){p=(p*98|0|0)/100|0}if((dv(l-x+1+((l|0)/8|0)|0,l-x+1+((l|0)/8|0)|0,0,((m|0)/16|0)+1|0,d,k)|0)>0){p=(p*95|0|0)/100|0}if((dC(c[a+68>>2]|0,h,i+1+((m|0)/16|0)|0,l,k,0,4)|0)<((l|0)/4|0|0)){p=(p*98|0|0)/100|0}if((dC(c[a+68>>2]|0,h,i,l,k,0,4)|0)<((l|0)/4|0|0)){z=1935}else{if((dC(c[a+68>>2]|0,h,i+1|0,l,k,0,4)|0)<((l|0)/4|0|0)){z=1935}}if((z|0)==1935){p=(p*98|0|0)/100|0}if((c[b+108>>2]|0)>0){p=(p*97|0|0)/100|0}if((c[a+56>>2]|0)!=0){if((f|0)!=0){p=(p*98|0|0)/100|0}if((e|0)==0){p=(p*97|0|0)/100|0}}else{p=(p*99|0|0)/100|0}dy(a,104,p)|0;r=a;s=r+36|0;t=c[s>>2]|0;return t|0}function db(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=100;if((l|0)>2){o=(m|0)>3}else{o=0}if(!o){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((c[b+108>>2]|0)>1){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}do{if((dv(0,l-1|0,(m|0)/4|0,(m|0)/4|0,d,k)|0)!=2){if((dv(0,l-1|0,((m|0)/4|0)-1|0,((m|0)/4|0)-1|0,d,k)|0)==2){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);do{if((dv(0,l-1|0,(m*3|0|0)/4|0,(m*3|0|0)/4|0,d,k)|0)!=2){if((dv(0,l-1|0,((m*3|0|0)/4|0)+1|0,((m*3|0|0)/4|0)+1|0,d,k)|0)==2){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);o=dC(d,0,(m|0)/8|0,l,k,0,3)|0;if((o+(dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)|0)>((l|0)/2|0|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}o=0;s=1;t=i+((m|0)/10|0)|0;while(1){if((t|0)<(j-((m|0)/10|0)|0)){u=(s|0)!=0}else{u=0}if(!u){break}v=dC(c[a+68>>2]|0,g,t,l,k,0,3)|0;w=v+(dC(c[a+68>>2]|0,h,t,l,k,0,4)|0)|0;if((w|0)>((l|0)/2|0|0)){s=0}if((w|0)>(o|0)){o=w}t=t+1|0}if((s|0)==0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;t=(m|0)/4|0;while(1){if((t|0)<(m-1-((m|0)/4|0)|0)){x=(s|0)!=0}else{x=0}if(!x){break}u=dC(d,0,t,l,k,0,3)|0;w=u+(dC(d,l-1|0,t,l,k,0,4)|0)|0;if((o-w|0)>((l|0)/5|0|0)){s=0}t=t+1|0}if((s|0)==0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=0;o=i+((m|0)/3|0)|0;t=o;x=o;while(1){if((t|0)>=(j-((m|0)/3|0)|0)){break}w=dC(c[a+68>>2]|0,g,t,l,k,0,3)|0;w=dC(c[a+68>>2]|0,g+w|0,t,l,k,1,3)|0;if((w|0)>(s|0)){s=w;x=t}t=t+1|0}if((s|0)<=((l|0)/2|0|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}x=x-i|0;do{if((dv(0,l-1|0,x,x,d,k)|0)!=1){if((dv(0,l-1|0,x+1|0,x+1|0,d,k)|0)==1){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);t=x;while(1){if((t|0)>=(m-((m|0)/4|0)|0)){break}if((dv(0,l-1|0,t,t,d,k)|0)>2){if((dv(0,l-1|0,t+1|0,t+1|0,d,k)|0)>2){x=2021;break}}t=t+1|0}if((t|0)<(m-((m|0)/4|0)|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;x=g+((l|0)/4|0)|0;while(1){if((x|0)<=(h-((l|0)/4|0)|0)){y=(s|0)!=0}else{y=0}if(!y){break}if(((du(x,x,i,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){s=0}x=x+1|0}if((s|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;x=g+((l|0)/4|0)|0;while(1){if((x|0)<=(h-((l|0)/4|0)|0)){z=(s|0)!=0}else{z=0}if(!z){break}if(((du(x,x,j-((m|0)/4|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){s=0}x=x+1|0}if((s|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;x=g+((l|0)/4|0)|0;while(1){if((x|0)<=(h-((l|0)/4|0)|0)){A=(s|0)!=0}else{A=0}if(!A){break}if((dv(x,x,i+((m|0)/8|0)|0,j-((m|0)/8|0)|0,c[a+68>>2]|0,k)|0)==1){s=0}x=x+1|0}if((s|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;t=i;while(1){if((t|0)<=(i+((m|0)/4|0)|0)){B=(s|0)!=0}else{B=0}if(!B){break}if((dv(g,h,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}s=1;t=j-((m|0)/4|0)|0;while(1){if((t|0)<=(j|0)){C=(s|0)!=0}else{C=0}if(!C){break}if((dv(g,h,t,t,c[a+68>>2]|0,k)|0)==2){s=0}t=t+1|0}if((s|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if(((du(h-((l|0)/8|0)|0,h,i,i+((m|0)/8|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if(((du(g,g+((l|0)/8|0)|0,j-((m|0)/8|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}t=dC(d,l-1|0,(m|0)/4|0,l,k,0,4)|0;if((t|0)>((l|0)/2|0|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}C=dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0;do{if((C|0)>=(t-((l|0)/4|0)|0)){if((C|0)>(t+((l|0)/8|0)|0)){break}B=dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0;do{if((B|0)>=(C-((l|0)/4|0)|0)){if((B|0)>(C+((l|0)/8|0)|0)){break}if((P(t+B-(C<<1)|0)|0)>(((l|0)/16|0)+1|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((dv(g,h,i,j,c[a+68>>2]|0,k)|0)<2){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((dv(g,h,i,(i+j|0)/2|0,c[a+68>>2]|0,k)|0)<2){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}t=dC(d,0,(m|0)/4|0,l,k,0,3)|0;t=dC(d,t,(m|0)/4|0,l,k,1,3)|0;C=dC(d,0,m-1-((m|0)/4|0)|0,l,k,0,3)|0;C=dC(d,C,m-1-((m|0)/4|0)|0,l,k,1,3)|0;B=dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0;B=dC(d,l-1-B|0,m-1-((m|0)/4|0)|0,l,k,1,4)|0;do{if((l|0)<10){if((t-C|0)<=((l|0)/4|0|0)){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);do{if((l|0)<10){if((t-C|0)<=((l|0)/8|0|0)){break}n=(n*99|0|0)/100|0}}while(0);s=dC(d,0,((m|0)/2|0)+1+((m|0)/8|0)|0,l,k,0,3)|0;s=s+(dC(d,s,((m|0)/2|0)+1+((m|0)/8|0)|0,l,k,1,3)|0)|0;s=dC(d,s,((m|0)/2|0)+1+((m|0)/8|0)|0,l,k,0,3)|0;do{if((s|0)<(((l|0)/2|0)-1|0)){if((t*5|0|0)<=(C*6|0|0)){break}if((B*5|0|0)<=(C*6|0|0)){break}if((t|0)<=(C|0)){break}if((B|0)<=(C|0)){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);if((l|0)>8){x=dC(d,l-1|0,(m*3|0|0)/8|0,l,k,0,4)|0;do{if((x-(dC(d,l-1|0,(m|0)/8|0,l,k,0,4)|0)|0)>((l|0)/4|0|0)){A=dC(d,l-1|0,(m*3|0|0)/8|0,l,k,0,4)|0;if((A-(dC(d,l-1|0,m-1-((m|0)/8|0)|0,l,k,0,4)|0)|0)<=((l|0)/4|0|0)){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0)}if((c[b+108>>2]|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((f|0)!=0){n=(n*99|0|0)/100|0}if((e|0)==0){n=(n*98|0|0)/100|0}x=a;A=n;dy(x,72,A)|0;p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);p=a;q=p+36|0;r=c[q>>2]|0;return r|0}function dc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=b+44|0;o=100;if((l|0)>2){p=(m|0)>3}else{p=0}if(!p){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[b+108>>2]|0)>1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=(cH(32)|0)<<1;if((c[n+56>>2]|0)<((p|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[n+8>>2]|0)>((p|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[n+24>>2]|0)>((p|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((c[n+40>>2]|0)>((p|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=c[n+12>>2]|0;t=p;u=p;p=c[n+28>>2]|0;v=p;w=p;p=c[n+44>>2]|0;n=w;x=n;y=n;while(1){if((x|0)==(p|0)){break}if((c[a+296+(x<<3)+4>>2]|0)<(c[a+296+(y<<3)+4>>2]|0)){y=x}if((c[a+296+(x<<3)+4>>2]|0)<=(i|0)){z=2166;break}x=(x+1|0)%(c[a+264>>2]|0)|0}if(((c[a+296+(y<<3)+4>>2]|0)-i|0)<((m|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((j-(c[a+296+(y<<3)+4>>2]|0)|0)<((m|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}n=cI(a,p,t,h,((i<<1)+j|0)/3|0)|0;cI(a,n,t,g,j)|0;v=cI(a,w,y,(g+h|0)/2|0,j)|0;x=cI(a,p,n,g-l|0,(i+(j<<1)|0)/3|0)|0;if((h-(c[a+296+(x<<3)>>2]|0)|0)<((l|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((h-(c[a+296+(x<<3)>>2]|0)|0)<((l|0)/3|0|0)){o=(o*99|0|0)/100|0}if((h-(c[a+296+(x<<3)>>2]|0)|0)<((l|0)/2|0|0)){o=(o*99|0|0)/100|0}do{if((dv(0,l-1|0,0,0,d,k)|0)!=1){if((dv(0,l-1|0,1,1,d,k)|0)==1){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((dv(0,(l*3|0|0)/4|0,(m|0)/8|0,(m|0)/8|0,d,k)|0)==1){if((dv(0,(l*3|0|0)/4|0,(m*3|0|0)/16|0,(m*3|0|0)/16|0,d,k)|0)!=1){break}do{if((dv(0,l-1|0,m-1|0,m-1|0,d,k)|0)!=2){if((dv(0,l-1|0,m-2|0,m-2|0,d,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);do{if((l|0)<8){if((dv(l-1|0,l-1|0,(m|0)/4|0,m-1|0,d,k)|0)==2){break}if((dv(l-2|0,l-2|0,(m|0)/4|0,m-1|0,d,k)|0)==2){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);u=dC(d,0,((m|0)/2|0)-((m|0)/4|0)|0,l,k,0,3)|0;w=dC(d,0,(m|0)/2|0,l,k,0,3)|0;if((w|0)>((l|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}v=dC(d,0,((m|0)/2|0)+((m|0)/4|0)|0,l,k,0,3)|0;do{if((P(u+v-(w<<1)|0)|0)<=(((l+8|0)/16|0)+1|0)){if((u|0)<(v-1|0)){break}if(((du(g,g+((l|0)/2|0)|0,i,i+((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(g+((l|0)/2|0)|0,h,j-((m|0)/3|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(h-((l|0)/4|0)|0,h,i,i+((m*3|0|0)/16|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(h-((l|0)/4|0)|0,h,i+((m|0)/4|0)|0,j-((m|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if(((du(h-((l|0)/4|0)|0,h,j-((m|0)/8|0)|0,j,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}do{if((c[b+108>>2]|0)>0){if((c[b+128>>2]|0)<=((m|0)/4|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);n=i+1|0;while(1){if((n|0)>=(i+((m|0)/2|0)|0)){break}if(((du(g,h,n,n,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){z=2214;break}n=n+1|0}if((n|0)<(i+((m|0)/2|0)|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}x=1;p=g;while(1){if((p|0)<=(g+((l|0)/2|0)|0)){A=(x|0)!=0}else{A=0}if(!A){break}if((dr(p,i,p,j,c[a+68>>2]|0,k,100)|0)>50){x=0}p=p+1|0}if((x|0)!=0){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}p=0;y=0;n=(m*5|0|0)/8|0;while(1){if((n|0)>=((m*7|0|0)/8|0|0)){break}x=dC(d,l-1|0,n,l,k,0,4)|0;if((x|0)>(p|0)){p=x;y=n}n=n+1|0}if((p+((dC(d,l-1-p|0,y,l,k,1,4)|0)/2|0)|0)<((l|0)/4|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}if((p+((dC(d,l-1-p|0,y,l,k,1,4)|0)/2|0)|0)<((l|0)/2|0|0)){o=(o*98|0|0)/100|0}p=l-1-p|0;n=y;x=dC(d,l-1|0,m-1|0,l,k,0,4)|0;if((x|0)>((l|0)/2|0|0)){x=dC(d,l-1|0,m-2|0,l,k,0,4)|0}if((x|0)>((l|0)/2|0|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}x=x+((dC(d,l-1-x|0,m-1|0,l,k,1,4)|0)/2|0)|0;if((dr(p,n,l-1-x|0,m-1|0,d,k,100)|0)<60){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}n=i+((m|0)/3|0)|0;while(1){if((n|0)>=(j|0)){break}if((dv(g,h,n,n,c[a+68>>2]|0,k)|0)==2){z=2248;break}n=n+1|0}if((n|0)==(j|0)){q=a;r=q+36|0;s=c[r>>2]|0;return s|0}L3106:do{if((c[b+108>>2]|0)>0){do{if((c[b+132>>2]|0)<=(l-1-((l|0)/4|0)|0)){if((c[b+136>>2]|0)>(m-1-((m|0)/4|0)|0)){break}if((c[b+128>>2]|0)<((m|0)/4|0|0)){break}break L3106}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);x=dC(d,0,m-1|0,l,k,0,3)|0;x=dC(d,x,m-1|0,l,k,1,3)|0;do{if((l|0)>8){if((x<<2|0)<=(l*3|0|0)){break}q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);x=dC(d,0,(m|0)/4|0,l,k,0,3)|0;do{if((x|0)>((l|0)/4|0|0)){if((x+(dC(d,x,(m|0)/4|0,l,k,1,3)|0)|0)<=((l|0)/2|0|0)){break}if((dC(d,0,0,l,k,0,3)|0)>((l|0)/4|0|0)){break}if((dC(d,l-1|0,0,l,k,0,4)|0)<((l|0)/2|0|0)){break}o=(o*90|0|0)/100|0}}while(0);if((i<<1|0)>((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){o=(o*99|0|0)/100|0}if((f|0)!=0){o=(o*99|0|0)/100|0}if((e|0)==0){o=(o*99|0|0)/100|0}dy(a,107,o)|0;q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}}while(0);q=a;r=q+36|0;s=c[r>>2]|0;return s|0}function dd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[b+40>>2]|0;g=c[a>>2]|0;h=c[a+4>>2]|0;i=c[a+8>>2]|0;j=c[a+12>>2]|0;k=c[b+8>>2]|0;l=h-g+1|0;m=j-i+1|0;n=100;if((l|0)>2){o=(m|0)>3}else{o=0}if(!o){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((c[b+108>>2]|0)>1){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}o=(m|0)/8|0;while(1){if((o|0)>=(m-((m|0)/8|0)|0)){break}if((du(0,(l|0)/2|0,o,o,d,k,1)|0)<<24>>24==0){s=2314;break}o=o+1|0}if((o|0)<(m-((m|0)/8|0)|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}t=0;u=1;v=g+((l|0)/4|0)|0;while(1){if((v|0)<=(h-((l|0)/4|0)|0)){w=(u|0)!=0}else{w=0}if(!w){break}o=dC(c[a+68>>2]|0,v,i,j-i|0,k,0,2)|0;if((o|0)>((m*3|0|0)/4|0|0)){s=2324;break}do{if((m|0)>15){if((t|0)<=((m|0)/8|0|0)){break}t=(dC(c[a+68>>2]|0,v-1|0,i+o-1|0,h-g|0,k,0,4)|0)/2|0;o=o+((dC(c[a+68>>2]|0,v-t|0,i+o-1|0,j-i|0,k,0,2)|0)-1)|0}}while(0);if((o|0)>=((m|0)/4|0|0)){u=0}v=v+1|0}if((s|0)==2324){u=1}if((u|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}o=0;v=g+((l|0)/4|0)|0;while(1){if((v|0)>(h-((l|0)/4|0)|0)){break}u=dC(c[a+68>>2]|0,v,j,m,k,0,1)|0;if((u|0)>0){s=dC(c[a+68>>2]|0,v-1|0,j-u-1|0,m,k,0,1)|0;if((s|0)>1){u=u+(s-1)|0}}if((u|0)>(o|0)){o=u;}v=v+1|0}if((o|0)<=((m|0)/8|0|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if((o|0)<((m|0)/4|0|0)){n=(n*80|0|0)/100|0}u=1;v=g+((l|0)/3|0)|0;while(1){if((v|0)<=(h-((l|0)/8|0)|0)){x=(u|0)!=0}else{x=0}if(!x){break}if((dv(v,v,i,j,c[a+68>>2]|0,k)|0)==2){u=0}v=v+1|0}if((u|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}u=1;o=i;while(1){if((o|0)<=(i+((m|0)/4|0)|0)){y=(u|0)!=0}else{y=0}if(!y){break}if((dv(g,h,o,o,c[a+68>>2]|0,k)|0)==2){u=0}o=o+1|0}if((u|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}do{if((l|0)<10){u=1;o=i+((m|0)/3|0)|0;while(1){if((o|0)<=(j-((m|0)/3|0)|0)){z=(u|0)!=0}else{z=0}if(!z){break}if((dv(g,h,o,o,c[a+68>>2]|0,k)|0)==1){u=0}o=o+1|0}if((u|0)==0){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);u=1;o=j-((m|0)/4|0)|0;while(1){if((o|0)<=(j|0)){A=(u|0)!=0}else{A=0}if(!A){break}if((dv(g,h,o,o,c[a+68>>2]|0,k)|0)==2){u=0}o=o+1|0}if((u|0)!=0){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}if(((du(h-((l|0)/3|0)|0,h,i,i+((m|0)/8|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}A=dC(d,0,(m|0)/4|0,l,k,0,3)|0;z=A+(dC(d,0,(m*3|0|0)/4|0,l,k,0,3)|0)|0;do{if((z|0)<(((dC(d,0,(m|0)/2|0,l,k,0,3)|0)<<1)-2-((l|0)/32|0)|0)){if((m|0)>=16){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}else{n=(n*98|0|0)/100|0;break}}}while(0);u=dC(c[a+68>>2]|0,h,i+((m|0)/4|0)|0,h-g+1|0,k,0,4)|0;if((u|0)>((l|0)/2|0|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}t=dC(c[a+68>>2]|0,h,i+((m|0)/2|0)|0,h-g+1|0,k,0,4)|0;v=dC(c[a+68>>2]|0,h,i+((m*3|0|0)/8|0)|0,h-g+1|0,k,0,4)|0;if((v|0)>(t|0)){t=v}if((t|0)<=(u|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}u=t;t=dC(c[a+68>>2]|0,h,j-((m|0)/4|0)|0,h-g+1|0,k,0,4)|0;if((t|0)>=(u|0)){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}t=(m|0)/4|0;g=dC(d,0,t,l,k,0,3)|0;g=g+((dC(d,g,t,l,k,1,3)|0)/2|0)|0;h=m-((m|0)/4|0)|0;j=dC(d,0,h,l,k,0,3)|0;j=j+((dC(d,j,h,l,k,1,3)|0)/2|0)|0;i=(m|0)/2|0;z=l-1-(dC(d,l-1|0,(m|0)/2|0,l,k,0,4)|0)|0;u=0;o=0;A=0;y=0;x=0;s=0;w=l;B=w;C=w;while(1){if((o|0)>=((m|0)/4|0|0)){break}v=dC(d,l-1|0,o,l,k,0,4)|0;if((v|0)<(B|0)){B=v;s=o}v=dC(d,l-1|0,m-1-o|0,l,k,0,4)|0;if((v|0)<(C|0)){C=v;y=m-1-o|0}v=dC(d,l-1|0,((m|0)/2|0)+o|0,l,k,0,4)|0;if((v|0)>(A|0)){A=v;x=((m|0)/2|0)+o|0}v=dC(d,l-1|0,((m|0)/2|0)-o|0,l,k,0,4)|0;if((v|0)>(A|0)){A=v;x=((m|0)/2|0)-o|0}v=dC(d,0,((m|0)/2|0)-o|0,l,k,0,3)|0;v=v+(dC(d,v,((m|0)/2|0)-o|0,l,k,1,3)|0)|0;v=v+(dC(d,v,((m|0)/2|0)-o|0,l,k,0,3)|0)|0;if((v|0)<(z|0)){z=v;i=((m|0)/2|0)-o|0}v=l-1-(dC(d,l-1|0,((m|0)/2|0)-o|0,l,k,0,4)|0)|0;if((v|0)<(z|0)){z=v;i=((m|0)/2|0)-o|0}o=o+1|0}B=l-1-B|0;A=l-1-A|0;C=l-1-C|0;z=z+((dC(d,z,i,l,k,1,3)|0)/4|0)|0;A=A-((dC(d,A,x,l,k,1,4)|0)/4|0)|0;B=B-((dC(d,B,s,l,k,1,4)|0)/4|0)|0;C=C-((dC(d,C,y,l,k,1,4)|0)/4|0)|0;if((dt(g,t,j,h,d,k,100)|0)<95){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}L3324:do{if((l|0)>8){do{if((A|0)<=((l*5|0|0)/8|0|0)){if((z|0)>((l*5|0|0)/8|0|0)){break}u=dC(d,z,i,z,k,1,4)|0;do{if((dt(z,i,B,s,d,k,100)|0)<95){if((dt(z-((u|0)/2|0)|0,i,B,s,d,k,100)|0)>=95){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);if((dt(A,x,C,y,d,k,100)|0)<95){p=a;q=p+36|0;r=c[q>>2]|0;return r|0}A=A+(dC(d,A,x,l,k,1,3)|0)|0;if((A|0)<(C|0)){break L3324}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);p=a;q=p+36|0;r=c[q>>2]|0;return r|0}else{do{if((m|0)<16){if((e|0)!=0){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0);do{if((dC(d,0,1,m,k,1,2)|0)<=((l*3|0|0)/4|0|0)){if((dC(d,1,1,m,k,1,2)|0)>((l*3|0|0)/4|0|0)){break}if((dC(d,2,1,m,k,1,2)|0)>((l*3|0|0)/4|0|0)){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0)}}while(0);if((dC(d,l-1|0,m-1-((m|0)/4|0)|0,l,k,0,4)|0)<=((l|0)/8|0|0)){n=(n*99|0|0)/100|0;do{if((c[b+108>>2]|0)>0){if((c[b+136>>2]|0)>=(m-1-((m|0)/3|0)|0)){break}p=a;q=p+36|0;r=c[q>>2]|0;return r|0}}while(0)}do{if((c[a+60>>2]|0)!=0){if((e|0)!=0){break}n=(n*99|0|0)/100|0}}while(0);do{if((c[a+60>>2]|0)!=0){if((f|0)==0){break}n=(n*99|0|0)/100|0}}while(0);dy(a,75,n)|0;p=a;q=p+36|0;r=c[q>>2]|0;return r|0}function de(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[b+36>>2]|0;f=c[a>>2]|0;g=c[a+4>>2]|0;h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=c[b+8>>2]|0;k=g-f+1|0;l=i-h+1|0;m=b+44|0;n=57344;o=100;p=100;if((k|0)>1){q=(l|0)>2}else{q=0}L3383:do{if(q){if((c[b+108>>2]|0)>1){break}do{if((c[b+108>>2]|0)>0){if((k|0)>=6){if((l|0)>=6){break}}break L3383}}while(0);o=(cH(32)|0)<<1;if((c[m+8>>2]|0)>(o|0)){break}if((c[m+24>>2]|0)>(o|0)){break}if(((c[m+20>>2]|0)-(c[m+4>>2]|0)|0)<((l|0)/2|0|0)){break}r=c[m+12>>2]|0;s=r;t=r;while(1){if((s|0)==(c[m+28>>2]|0)){break}if((c[a+296+(s<<3)>>2]|0)>=(c[a+296+(t<<3)>>2]|0)){t=s}s=(s+1|0)%(c[a+264>>2]|0)|0}do{if((t|0)!=(s|0)){if((t|0)==(c[m+12>>2]|0)){break}u=c[a+296+(t<<3)>>2]|0;v=c[a+296+(t<<3)+4>>2]|0;if(((u<<1)-(c[m>>2]|0)-(c[m+16>>2]|0)|0)<(k|0)){p=(p*99|0|0)/100|0}if((P((c[m+4>>2]|0)+(c[m+20>>2]|0)-(v<<1)|0)|0)>(l+2|0)){break L3383}if(((c[m>>2]|0)+(c[m+16>>2]|0)-(u<<1)|0)>=0){break L3383}r=cG(a,c[m+12>>2]|0,t)|0;o=(r|0)>(cH(256)|0)|0;if((o|0)>(cH(256)|0)){break L3383}p=p-((o*100|0|0)/(cH(1024)|0)|0)|0;w=cI(a,t,c[m+28>>2]|0,f-(k<<1)|0,i-((l|0)/8|0)-1|0)|0;o=cG(a,t,w)|0;if((o|0)>(cH(256)|0)){break L3383}p=p-((o*100|0|0)/(cH(1024)|0)|0)|0;r=c[m+28>>2]|0;s=r;x=r;w=r;while(1){if((s|0)==(c[m+12>>2]|0)){break}if((c[a+296+(s<<3)>>2]|0)>=(c[a+296+(x<<3)>>2]|0)){x=s}s=(s+1|0)%(c[a+264>>2]|0)|0}do{if((x|0)!=(s|0)){if((x|0)==(c[m+28>>2]|0)){break}u=c[a+296+(x<<3)>>2]|0;v=c[a+296+(x<<3)+4>>2]|0;if(((c[m>>2]|0)+(c[m+16>>2]|0)-(u<<1)|0)>=0){break L3383}if((P((c[m+4>>2]|0)+(c[m+20>>2]|0)-(v<<1)|0)|0)>((l+2|0)/4|0|0)){break L3383}do{if((c[m>>2]|0)<(u|0)){if((c[m+16>>2]|0)>=(u|0)){break}w=cI(a,x,c[m+12>>2]|0,f+((k|0)/4|0)|0,h-(l<<1)|0)|0;if(((c[a+296+(w<<3)>>2]|0)-f|0)>((k|0)/4|0|0)){break L3383}o=cG(a,x,w)|0;if((o|0)>(cH(256)|0)){break L3383}p=p-((o*100|0|0)/(cH(1024)|0)|0)|0;w=cI(a,c[m+28>>2]|0,x,f+((k|0)/4|0)|0,i+(l<<1)|0)|0;if(((c[a+296+(w<<3)>>2]|0)-f|0)>((k|0)/4|0|0)){break L3383}s=cI(a,c[m+28>>2]|0,x,g+(k<<1)|0,h+((l|0)/2|0)+((l|0)/8|0)|0)|0;if(((c[a+296+(s<<3)+4>>2]|0)-h|0)>(((l|0)/2|0)+((l|0)/8|0)|0)){break L3383}o=cG(a,w,s)|0;if((o|0)>(cH(256)|0)){break L3383}p=p-((o*100|0|0)/(cH(1024)|0)|0)|0;if((c[b+40>>2]|0)!=0){p=(p*98|0|0)/100|0}if((c[b+36>>2]|0)!=0){p=(p*99|0|0)/100|0}n=62;r=a;y=n;z=p;dy(r,y,z)|0;break L3383}}while(0);break L3383}}while(0);break L3383}}while(0)}}while(0);o=100;p=100;if((k|0)>3){A=(l|0)>3}else{A=0}L3478:do{if(A){if((c[b+108>>2]|0)>0){break}v=0;s=0;while(1){if((v|0)>=(l|0)){break}if((dv(0,k-1|0,v,v,d,j)|0)!=1){s=s+1|0}m=dC(d,0,v,k,j,0,3)|0;if((m+(dC(d,k-1|0,v,k,j,0,4)|0)|0)<((k*3|0|0)/8|0|0)){B=2558;break}v=v+1|0}if((v|0)<(l|0)){break}do{if((s|0)<=2){if((s|0)>0){if((l|0)<16){break}}m=k-1-(dC(d,k-1|0,(l|0)/2|0,k,j,0,4)|0)+k-1|0;q=m-(dC(d,k-1|0,((l|0)/2|0)+((l|0)%2|0)-1|0,k,j,0,4)|0)|0;m=q+(dC(d,0,(l|0)/2|0,k,j,0,3)|0)|0;x=m+(dC(d,0,((l|0)/2|0)+((l|0)%2|0)-1|0,k,j,0,3)|0)|0;if((P(x-(k<<1)|0)|0)>(((k|0)/2|0)+1|0)){break L3478}if((P(x-(k<<1)|0)|0)>((k|0)/2|0|0)){p=(p*99|0|0)/100|0}t=dC(d,k-1|0,(l|0)/16|0,k,j,0,4)|0;C=dC(d,k-1|0,l-1|0,k,j,0,4)|0;D=dC(d,0,0,k,j,0,3)|0;E=dC(d,0,l-1|0,k,j,0,3)|0;s=D;v=0;while(1){if((v|0)>=(l|0)){break}u=dC(d,0,v,k,j,0,3)|0;if((P(u-s|0)|0)>(((k|0)/6|0)+1|0)){B=2574;break}s=u;v=v+1|0}if((v|0)<(l|0)){break L3478}s=t;v=0;while(1){if((v|0)>=(l|0)){break}u=dC(d,k-1|0,v,k,j,0,4)|0;if((P(u-s|0)|0)>(((k|0)/6|0)+1|0)){B=2582;break}s=u;v=v+1|0}if((v|0)<(l|0)){break L3478}do{if((c[a+56>>2]|0)!=0){if((c[b+40>>2]|0)==0){break}p=(p*99|0|0)/100|0}}while(0);do{if((c[a+56>>2]|0)!=0){if((c[b+36>>2]|0)!=0){break}p=(p*98|0|0)/100|0}}while(0);do{if((c[a+56>>2]|0)!=0){if((l|0)>=((c[a+60>>2]|0)-(c[a+56>>2]|0)-1|0)){break}p=(p*96|0|0)/100|0}}while(0);do{if((t|0)<=((k|0)/8|0|0)){if((E|0)>((k|0)/8|0|0)){break}if((D-(k-C)|0)<((k|0)/8|0|0)){break}do{if((D|0)<=((k|0)/8|0|0)){if((C|0)>((k|0)/8|0|0)){break}break L3478}}while(0);if((D-(k-C)|0)<((k|0)/4|0|0)){p=(p*99|0|0)/100|0}m=a;n=47;q=p;dy(m,47,q)|0;break L3478}}while(0);do{if((D|0)<=((k|0)/8|0|0)){if((C|0)>((k|0)/8|0|0)){break}if((E-(k-t)|0)<((k|0)/8|0|0)){break}do{if((E|0)<=((k|0)/8|0|0)){if((t|0)>((k|0)/8|0|0)){break}break L3478}}while(0);if((E-(k-t)|0)<((k|0)/4|0|0)){p=(p*99|0|0)/100|0}q=a;n=92;m=p;dy(q,92,m)|0;break L3478}}while(0);break L3478}}while(0)}}while(0);o=100;p=100;if((k|0)>1){F=(l|0)>4}else{F=0}L3572:do{if(F){if((c[b+108>>2]|0)>1){break}v=0;s=0;while(1){if((v|0)>=(l|0)){break}if((dv(0,k-1|0,v,v,d,j)|0)!=1){s=s+1|0}A=dC(d,0,v,k,j,0,3)|0;if((A+(dC(d,k-1|0,v,k,j,0,4)|0)|0)<((k*3|0|0)/8|0|0)){B=2626;break}v=v+1|0}if((v|0)<(l|0)){break}do{if((s|0)<=2){if((s|0)>0){if((l|0)<16){break}}s=k;A=((l|0)/2|0)-((l|0)/8|0)|0;v=A;m=A;q=A;while(1){if((v|0)>(((l|0)/2|0)+((l|0)/8|0)|0)){break}w=dC(d,0,v,k,j,0,3)|0;if((w|0)==(s|0)){m=v}if((w|0)<(s|0)){A=v;q=A;m=A;s=w}w=dC(d,k-1|0,v,k,j,0,4)|0;if((w|0)==(s|0)){m=v}if((w|0)<(s|0)){A=v;q=A;m=A;s=w}v=v+1|0}v=(q+m|0)/2|0;t=dC(d,k-1|0,(l|0)/16|0,k,j,0,4)|0;x=dC(d,k-1|0,v,k,j,0,4)|0;C=dC(d,k-1|0,l-1-((l|0)/16|0)|0,k,j,0,4)|0;D=dC(d,0,(l|0)/16|0,k,j,0,3)|0;A=dC(d,0,v,k,j,0,3)|0;E=dC(d,0,l-1-((l|0)/16|0)|0,k,j,0,3)|0;if((k|0)>(l|0)){do{if((A|0)==0){if((x*3|0|0)<=(k|0)){break}if((t|0)>((k|0)/8|0|0)){break}if((C|0)>((k|0)/8|0|0)){break}z=a;n=60;dy(z,60,98)|0;break L3572}}while(0)}do{if((k|0)>2){if((k*9|0|0)<(l*5|0|0)){break}p=98;if((k|0)<8){p=(p*99|0|0)/100|0}if((k|0)<6){p=(p*96|0|0)/100|0}do{if((k<<1|0)>(c[(c[7036]|0)+37032>>2]|0)){if((k<<2|0)<=(l|0)){break}p=98}}while(0);do{if((A|0)==0){if((t|0)>(((k|0)/8|0)+1|0)){break}if((C|0)>(((k|0)/8|0)+1|0)){break}if((t+C|0)>(((k|0)/8|0)+1|0)){break}if((x|0)<((k|0)/2|0|0)){break}if((D|0)<((k*3|0|0)/4|0|0)){break}if((E|0)<((k*3|0|0)/4|0|0)){break}if((((dC(d,0,(v|0)/2|0,k,j,0,3)|0)<<1)+1+((k|0)/16|0)|0)<(D+A|0)){p=(p*95|0|0)/100|0}if((((dC(d,0,l-1-((v|0)/2|0)|0,k,j,0,3)|0)<<1)+1+((k|0)/16|0)|0)<(E+A|0)){p=(p*95|0|0)/100|0}m=a;n=60;q=p;dy(m,60,q)|0;break L3572}}while(0)}}while(0);t=dC(d,k-1|0,(l|0)/16|0,k,j,0,4)|0;x=dC(d,k-1|0,(l|0)/2|0,k,j,0,4)|0;C=dC(d,k-1|0,l-1|0,k,j,0,4)|0;D=dC(d,0,0,k,j,0,3)|0;A=dC(d,0,(l|0)/2|0,k,j,0,3)|0;E=dC(d,0,l-1|0,k,j,0,3)|0;s=(((c[a+64>>2]|0)+(c[a+60>>2]|0)|0)/2|0)-(c[a+56>>2]|0)|0;do{if((x<<1|0)<(t+C|0)){if((A<<1|0)<=(D+E|0)){break}if((k<<1|0)>=(l|0)){break}if((l|0)<(s|0)){break}q=a;n=41;dy(q,41,98)|0;break L3572}}while(0);do{if((x<<1|0)>(t+C|0)){if((A<<1|0)>=(D+E|0)){break}if((k<<1|0)>=(l|0)){break}if((l|0)<(s|0)){break}if((x<<1|0)<=(t+C+1|0)){B=2687}else{if((A<<1|0)>=(D+E-1|0)){B=2687}}if((B|0)==2687){p=(p*98|0|0)/100|0}if((x<<1|0)<=(t+C+2|0)){B=2690}else{if((A<<1|0)>=(D+E-2|0)){B=2690}}if((B|0)==2690){p=(p*98|0|0)/100|0}v=0;u=0;while(1){if((v|0)>=((l|0)/4|0|0)){break}s=dC(d,0,v,k,j,0,3)|0;if((s|0)>(u|0)){u=s}v=v+1|0}v=0;while(1){if((v|0)>=((l+2|0)/4|0|0)){break}s=dC(d,0,v+((l|0)/8|0)|0,k,j,0,3)|0;if((s|0)<(u|0)){B=2700;break}v=v+1|0}if((v|0)==((l+2|0)/4|0|0)){break L3572}if(((dC(d,0,((l|0)/2|0)+((l|0)/8|0)|0,k,j,0,3)|0)-A|0)>=(((k|0)/8|0)+1|0)){p=(p*99|0|0)/100|0}if(((dC(d,0,((l|0)/2|0)-((l|0)/8|0)|0,k,j,0,3)|0)-A|0)>=(((k|0)/8|0)+1|0)){p=(p*99|0|0)/100|0}n=40;dy(a,40,p)|0;break L3572}}while(0);break L3572}}while(0)}}while(0);o=100;p=100;do{if((k|0)>2){if((l|0)<=4){G=0;break}G=(l|0)>=(k<<1|0)}else{G=0}}while(0);L3705:do{if(G){if((c[b+108>>2]|0)>1){break}if((c[a+196>>2]|0)!=1){break}if((c[a+264>>2]|0)!=10){p=98}if((e|0)==0){p=(p*97|0|0)/100|0}v=0;while(1){if((v|0)>=(l|0)){break}if((dv(0,k-1|0,v,v,d,j)|0)!=1){B=2727;break}v=v+1|0}if((v|0)<(l|0)){break}do{if(((du(f,g,h,h,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==2){if(((du(f,g,h+1|0,h+1|0,c[a+68>>2]|0,j,2)|0)<<24>>24|0)!=2){break}break L3705}}while(0);do{if(((du(f,g,i,i,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==2){if(((du(f,g,i-1|0,i-1|0,c[a+68>>2]|0,j,2)|0)<<24>>24|0)!=2){break}break L3705}}while(0);if(((du(f,f,h,i,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==0){B=2740}else{if(((du(f+1|0,f+1|0,h,i,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==0){B=2740}}do{if((B|0)==2740){if(((du(f+((k|0)/2|0)|0,g,h+((l|0)/4|0)|0,i-((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==0){s=a;n=91;E=p;dy(s,91,E)|0;break L3705}else{break}}}while(0);if(((du(g,g,h,i,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==0){B=2745}else{if(((du(g-1|0,g-1|0,h,i,c[a+68>>2]|0,j,2)|0)<<24>>24|0)==0){B=2745}}do{if((B|0)==2745){if(((du(f,g-((k|0)/2|0)|0,h+((l|0)/4|0)|0,i-((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==0){E=a;n=93;s=p;dy(E,93,s)|0;break L3705}else{break}}}while(0)}}while(0);if((n|0)==57344){o=98;p=98;do{if((k|0)>5){if((l|0)<=7){H=0;break}H=(l<<1|0)>(k*3|0|0)}else{H=0}}while(0);do{if(H){if((c[b+108>>2]|0)>2){break}if((e|0)==0){p=(p*97|0|0)/100|0}if((dv(0,k-1|0,0,0,d,j)|0)!=1){break}if((dv(0,k-1|0,l-1|0,l-1|0,d,j)|0)!=1){break}G=dC(d,k-1|0,(l|0)/2|0,k,j,0,4)|0;if((G+(dC(d,0,(l|0)/2|0,k,j,0,3)|0)|0)<=((k|0)/4|0|0)){break}v=(l|0)/8|0;while(1){if((v|0)>=(l-((l|0)/8|0)|0)){break}if((dv(0,k,v,v,d,j)|0)!=2){B=2768;break}v=v+1|0}if((v|0)<(l-((l|0)/8|0)|0)){break}if(((du(((f*3|0)+(g*5|0)|0)/8|0,g,h+((l*3|0|0)/16|0)|0,i-((l*3|0|0)/16|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==0){G=a;n=91;s=p;dy(G,91,s)|0;break}if(((du(f,((f*5|0)+(g*3|0)|0)/8|0,h+((l*3|0|0)/16|0)|0,i-((l*3|0|0)/16|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==0){s=a;n=93;G=p;dy(s,93,G)|0;break}else{break}}}while(0)}o=99;p=99;do{if((k|0)>2){if((l|0)<=5){I=0;break}I=(l<<1|0)>(k*3|0|0)}else{I=0}}while(0);L3803:do{if(I){if((c[b+108>>2]|0)>1){break}if((e|0)==0){p=(p*97|0|0)/100|0}v=0;while(1){if((v|0)>=(l|0)){break}if((dv(0,k-1|0,v,v,d,j)|0)!=1){B=2791;break}v=v+1|0}if((v|0)<(l|0)){break}u=0;while(1){if((u|0)>=((k|0)/2|0|0)){break}if((dv(k-1-u|0,k-1-u|0,0,l-1|0,d,j)|0)!=2){B=2799;break}u=u+1|0}if((v|0)<((k|0)/2|0|0)){break}if((dv(k-1|0,k-1|0,(l|0)/4|0,l-1-((l|0)/4|0)|0,d,j)|0)!=0){break}if((dv(0,0,(l|0)/4|0,l-1-((l|0)/4|0)|0,d,j)|0)!=1){break}t=dC(d,0,(l|0)/4|0,k,j,0,3)|0;t=dC(d,t,(l|0)/4|0,k,j,1,3)|0;x=k;H=((l|0)/2|0)-1-((l|0)/16|0)|0;v=H;C=H;while(1){if((v|0)>=(((l|0)/2|0)+2+((l|0)/16|0)|0)){break}u=dC(d,0,v,k,j,0,3)|0;if((u|0)<(x|0)){x=u;C=v}v=v+1|0}x=dC(d,x,C,k,j,1,3)|0;if((x|0)<(t+((k|0)/16|0)+1|0)){break}if((dC(d,0,l-1|0,k,j,0,3)|0)>((k*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((dC(d,0,0,k,j,0,3)|0)>((k*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((dC(d,0,0,l,j,0,2)|0)<(((l|0)/2|0)-((l|0)/8|0)-1|0)){p=(p*98|0|0)/100|0}if((dC(d,0,l-1|0,l,j,0,1)|0)<(((l|0)/2|0)-((l|0)/8|0)-1|0)){p=(p*98|0|0)/100|0}if((dC(d,0,l-1|0,l,j,0,1)|0)<=((l|0)/4|0|0)){break}if((l|0)>=8){H=dC(d,k-1|0,0,k,j,0,4)|0;G=H+(dC(d,k-1|0,(l|0)/4|0,k,j,0,4)|0)|0;if((G-((dC(d,k-1|0,(l|0)/8|0,k,j,0,4)|0)<<1)|0)>=((k|0)/8|0|0)){p=(p*98|0|0)/100|0}}if((dC(d,k-2|0,l-1|0,l,j,0,1)|0)>((l|0)/4|0|0)){break}do{if(((du(f,f,h,h+((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)!=1){if(((du(f,f,i-((l|0)/4|0)|0,i,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==1){break}G=a;n=123;H=p;dy(G,123,H)|0;break L3803}}while(0)}}while(0);o=99;p=99;do{if((k|0)>2){if((l|0)<=5){J=0;break}J=(l<<1|0)>(k*3|0|0)}else{J=0}}while(0);if(!J){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}if((e|0)==0){p=(p*97|0|0)/100|0}v=0;while(1){if((v|0)>=(l|0)){break}if((dv(0,k-1|0,v,v,d,j)|0)!=1){B=2846;break}v=v+1|0}if((v|0)<(l|0)){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}u=0;while(1){if((u|0)>=((k|0)/2|0|0)){break}if((dv(u,u,0,l-1|0,d,j)|0)!=2){B=2854;break}u=u+1|0}if((v|0)<((k|0)/2|0|0)){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}if((dv(0,0,(l|0)/4|0,l-1-((l|0)/4|0)|0,d,j)|0)!=0){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}if((dv(k-1|0,k-1|0,(l|0)/4|0,l-1-((l|0)/4|0)|0,d,j)|0)!=1){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}t=dC(d,k-1|0,(l|0)/4|0,k,j,0,4)|0;t=dC(d,k-1-t|0,(l|0)/4|0,k,j,1,4)|0;x=k;B=((l|0)/2|0)-1-((l|0)/16|0)|0;v=B;C=B;while(1){if((v|0)>=(((l|0)/2|0)+2+((l|0)/16|0)|0)){break}u=dC(d,k-1|0,v,k,j,0,4)|0;if((u|0)<(x|0)){x=u;C=v}v=v+1|0}x=dC(d,k-1-x|0,C,k,j,1,4)|0;if((x|0)<(t+((k|0)/16|0)+1|0)){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}if((dC(d,k-1|0,l-1|0,k,j,0,4)|0)>((k*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((dC(d,k-1|0,0,k,j,0,4)|0)>((k*3|0|0)/4|0|0)){p=(p*99|0|0)/100|0}if((dC(d,k-1|0,0,l,j,0,2)|0)<(((l|0)/2|0)-((l|0)/8|0)-1|0)){p=(p*98|0|0)/100|0}if((dC(d,k-1|0,l-1|0,l,j,0,1)|0)<(((l|0)/2|0)-((l|0)/8|0)-1|0)){p=(p*98|0|0)/100|0}if((dC(d,k-1|0,0,l,j,0,2)|0)<=((l|0)/4|0|0)){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}if((l|0)>=8){t=dC(d,0,0,k,j,0,3)|0;x=t+(dC(d,0,(l|0)/4|0,k,j,0,3)|0)|0;if((x-((dC(d,0,(l|0)/8|0,k,j,0,3)|0)<<1)|0)>=((k|0)/8|0|0)){p=(p*98|0|0)/100|0}}if((dC(d,1,l-1|0,l,j,0,1)|0)>((l|0)/4|0|0)){K=a;L=K+36|0;M=c[L>>2]|0;return M|0}do{if(((du(g,g,h,h+((l|0)/4|0)|0,c[a+68>>2]|0,j,1)|0)<<24>>24|0)!=1){if(((du(g,g,i-((l|0)/4|0)|0,i,c[a+68>>2]|0,j,1)|0)<<24>>24|0)==1){break}d=a;n=125;k=p;dy(d,125,k)|0;K=a;L=K+36|0;M=c[L>>2]|0;return M|0}}while(0);K=a;L=K+36|0;M=c[L>>2]|0;return M|0}
function bo(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function bp(){return i|0}function bq(a){a=a|0;i=a}function br(a,b){a=a|0;b=b|0;if((r|0)==0){r=a;s=b}}function bs(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bt(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bu(a){a=a|0;E=a}function bv(a){a=a|0;F=a}function bw(a){a=a|0;G=a}function bx(a){a=a|0;H=a}function by(a){a=a|0;I=a}function bz(a){a=a|0;J=a}function bA(a){a=a|0;K=a}function bB(a){a=a|0;L=a}function bC(a){a=a|0;M=a}function bD(a){a=a|0;N=a}function bE(){}function bF(a){a=+a;var b=0.0;b=a;return+(b*b)}function bG(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0,B=0.0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+24|0;f=e|0;g=b;b=d;d=0;j=0;k=1;l=0;m=c[g>>2]|0;o=m;p=m;m=c[g+4>>2]|0;q=m;r=m;m=0;while(1){if((m|0)>=((b<<1)-1|0)){break}if((m&1|0)!=0){if((r|0)>(c[g+(m<<2)>>2]|0)){r=c[g+(m<<2)>>2]|0}if((q|0)<(c[g+(m<<2)>>2]|0)){q=c[g+(m<<2)>>2]|0}}else{if((p|0)>(c[g+(m<<2)>>2]|0)){p=c[g+(m<<2)>>2]|0}if((o|0)<(c[g+(m<<2)>>2]|0)){o=c[g+(m<<2)>>2]|0}}m=m+1|0}o=(p-r+1|0)/2|0;q=(-(p-r|0)|0)/2|0;m=0;r=0;while(1){if((m|0)>=((b<<1)-1|0)){break}if((m&1|0)!=0){s=o}else{s=q}r=r+((c[g+(m<<2)>>2]|0)+s)|0;m=m+1|0}do{if(((b-1|0)%3|0|0)==0){if((b|0)<10){break}if((r|0)<((((b-1|0)*11|0|0)/3|0)+2|0)){break}do{if((((c[g>>2]|0)+q|0)*3|0|0)>=((c[g+4>>2]|0)+o<<2|0)){if(((c[g>>2]|0)*3|0|0)<(c[g+8>>2]<<2|0)){break}if((c[g>>2]<<2|0)<(((c[g+4>>2]|0)+(c[g+8>>2]|0)|0)*3|0|0)){break}if(((c[g>>2]|0)*3|0|0)>((c[g+4>>2]|0)+(c[g+8>>2]|0)<<2|0)){break}t=+(r|0)*3.0/+(((b-1|0)*11|0)+6|0);m=ev((((b-7|0)/3|0)<<1)+1|0)|0;if((m|0)==0){u=l;v=u;i=e;return v|0}l=ev((((b-7|0)/3|0)<<1)+257|0)|0;s=0;w=0.0;p=0;x=0;while(1){if((p|0)>=((b-1|0)/3|0|0)){break}y=0;while(1){if((y|0)>=6){break}if((y&1|0)!=0){z=o}else{z=q}c[f+(y<<2)>>2]=(c[g+((p*6|0)+y<<2)>>2]|0)+z;y=y+1|0}A=1.0e8;d=107;j=0;while(1){if((j|0)>=107){break}y=0;B=0.0;while(1){if((y|0)>=6){break}B=B+ +bF(+((a[(c[3416+(j<<2)>>2]|0)+y|0]|0)-48|0)- +(c[f+(y<<2)>>2]|0)/t);y=y+1|0}if(B<A){A=B;d=j}j=j+1|0}w=w+A;if((d|0)<107){if((p|0)==0){do{if((d|0)>102){if((d|0)>=106){break}k=d-103+1|0}}while(0);s=d}do{if((p|0)>0){if((p|0)>=(((b-1|0)/3|0)-2|0)){break}s=s+(aa(d,p)|0)|0;y=0;if((k|0)>3){C=k>>2}else{C=k&3}j=C;k=k&3;D=j;if((D|0)==1){do{if((d|0)>=64){if((d|0)>=96){E=69;break}y=d-64&255}else{E=69}}while(0);if((E|0)==69){E=0;y=d+32&255}if((d|0)==101){k=1}if((d|0)==99){k=3}if((d|0)==98){k=k|8}}else if((D|0)==2){y=d+32&255;if((d|0)==100){k=2}if((d|0)==99){k=3}if((d|0)==98){k=k|4}}else if((D|0)==3){if((d|0)==101){k=1}if((d|0)==100){k=2}}do{if((j|0)==3){if((d|0)>=100){break}a[m+x|0]=((d|0)/10|0)+48&255;x=x+1|0;a[m+x|0]=((d|0)%10|0)+48&255;x=x+1|0}}while(0);if((j|0)!=3){do{if((y<<24>>24|0)>=32){if((d|0)>127){break}a[m+x|0]=y;x=x+1|0}}while(0);do{if((y<<24>>24|0)>=0){if((y<<24>>24|0)>=32){break}a[m+x|0]=94;x=x+1|0;a[m+x|0]=(y<<24>>24)+64&255;x=x+1|0}}while(0)}}}while(0);if((p|0)==(((b-1|0)/3|0)-2|0)){s=(s+103-d|0)%103|0}if((p|0)==(((b-1|0)/3|0)-1|0)){if((d|0)!=106){d=-1}}k=k&3}else{y=c[n>>2]|0;D=m;F=j;au(y|0,24752,(G=i,i=i+16|0,c[G>>2]=D,c[G+8>>2]=F,G)|0)|0;i=G}p=p+1|0}a[m+x|0]=0;if((l|0)!=0){p=l;F=x;D=m;y=s;t=w/+(b-1|0);aP(p|0,24648,(G=i,i=i+32|0,c[G>>2]=F,c[G+8>>2]=D,c[G+16>>2]=y,h[G+24>>3]=t,G)|0)|0;i=G}ew(m);u=l;v=u;i=e;return v|0}}while(0);u=0;v=u;i=e;return v|0}}while(0);u=0;v=u;i=e;return v|0}function bH(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0,E=0.0,F=0,G=0,H=0,I=0.0;e=i;f=b;b=d;g=0.0;d=0;j=0;k=c[f>>2]|0;l=k;m=k;k=c[f+4>>2]|0;n=k;o=k;k=0;while(1){if((k|0)>=((b<<1)-1|0)){break}if((k&1|0)!=0){if((o|0)>(c[f+(k<<2)>>2]|0)){o=c[f+(k<<2)>>2]|0}if((n|0)<(c[f+(k<<2)>>2]|0)){n=c[f+(k<<2)>>2]|0}}else{if((m|0)>(c[f+(k<<2)>>2]|0)){m=c[f+(k<<2)>>2]|0}if((l|0)<(c[f+(k<<2)>>2]|0)){l=c[f+(k<<2)>>2]|0}}k=k+1|0}l=(m-o|0)/2|0;n=(-(m-o|0)|0)/2|0;k=0;o=0;while(1){if((k|0)>=((b<<1)-1|0)){break}if((k&1|0)!=0){p=l}else{p=n}o=o+((c[f+(k<<2)>>2]|0)+p)|0;k=k+1|0}q=+(o|0)*2.0/+(((b-6|0)*7|0)+22|0);p=0;do{if(((b|0)%2|0|0)==0){if((b|0)<10){break}if((o|0)<((((b-6|0)*7|0|0)/2|0)+11|0)){break}if((((b-6|0)/2|0|0)%2|0|0)!=0){break}g=0.0;k=0;while(1){if((k|0)>=3){break}if((k&1|0)!=0){r=l}else{r=n}g=+bF(+((c[f+(k<<2)>>2]|0)+r|0)/q-1.0);if(g>.4){s=152;break}k=k+1|0}if((s|0)==152){t=0;u=t;i=e;return u|0}k=0;while(1){if((k|0)>=5){break}if((k&1|0)!=0){v=n}else{v=l}g=+bF(+((c[f+(k+b-3<<2)>>2]|0)+v|0)/q-1.0);if(g>.4){s=161;break}k=k+1|0}if((s|0)==161){t=0;u=t;i=e;return u|0}k=0;while(1){if((k|0)>=3){break}if((k&1|0)!=0){w=l}else{w=n}g=+bF(+((c[f+(k+(b<<1)-4<<2)>>2]|0)+w|0)/q-1.0);if(g>.4){s=170;break}k=k+1|0}if((s|0)==170){t=0;u=t;i=e;return u|0}j=ev(((b-6|0)/2|0)+1|0)|0;if((j|0)==0){t=d;u=t;i=e;return u|0}d=ev(((b-6|0)/2|0)+257|0)|0;m=0;x=0;y=3;while(1){if((y|0)>=((b<<1)-4|0)){break}if((y|0)==(b-3|0)){y=y+1|0}else{z=20;A=0;B=63;C=16.0e8;D=0;while(1){if((D|0)>=20){break}E=0.0;F=0;while(1){if((F|0)>=4){break}if((y+F&1|0)!=0){G=l}else{G=n}E=E+ +bF(+((a[(c[3304+(D<<2)>>2]|0)+F|0]|0)-48|0)- +((c[f+(y+F<<2)>>2]|0)+G|0)/q);F=F+1|0}if(E<C){C=E;z=D;B=((D|0)%10|0)+48&255;A=(D|0)/10|0}D=D+1|0}g=g+C;p=p+(aa((B<<24>>24)-48|0,(m&1|0)!=0?1:3)|0)|0;D=m;m=D+1|0;a[j+D|0]=B;if((m|0)<7){x=x<<1|A}}y=y+4|0}if((x&32|0)!=0){x=x^63}switch(x|0){case 11:{x=1;break};case 13:{x=2;break};case 14:{x=3;break};case 19:{x=4;break};case 25:{x=5;break};case 28:{x=6;break};case 21:{x=7;break};case 22:{x=8;break};case 26:{x=9;break};default:{x=0}}p=p+x|0;a[j+m|0]=0;if((d|0)!=0){y=d;D=m+1|0;z=x;F=j;H=(10-((p|0)%10|0)|0)%10|0;I=g/+(b-6<<1|0);aP(y|0,22968,(y=i,i=i+40|0,c[y>>2]=D,c[y+8>>2]=z,c[y+16>>2]=F,c[y+24>>2]=H,h[y+32>>3]=I,y)|0)|0;i=y}ew(j);t=d;u=t;i=e;return u|0}}while(0);t=0;u=t;i=e;return u|0}function bI(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0;e=i;f=b;b=d;d=(b|0)/3|0;g=0.0;j=0;k=0;l=c[f>>2]|0;m=l;n=l;l=c[f+4>>2]|0;o=l;p=l;l=0;while(1){if((l|0)>=((b<<1)-1|0)){break}if((l&1|0)!=0){if((p|0)>(c[f+(l<<2)>>2]|0)){p=c[f+(l<<2)>>2]|0}if((o|0)<(c[f+(l<<2)>>2]|0)){o=c[f+(l<<2)>>2]|0}}else{if((n|0)>(c[f+(l<<2)>>2]|0)){n=c[f+(l<<2)>>2]|0}if((m|0)<(c[f+(l<<2)>>2]|0)){m=c[f+(l<<2)>>2]|0}}l=l+1|0}m=(n-p|0)/2|0;o=(-(n-p|0)|0)/2|0;do{if((b|0)!=7){if((b|0)==16){break}q=0;r=q;i=e;return r|0}}while(0);l=0;p=0;while(1){if((l|0)>=((b<<1)-1|0)){break}p=p+(c[f+(l<<2)>>2]|0)|0;l=l+1|0}s=+(p|0)*1.0/+((d*7|0)+4+(d-1<<1)|0);g=0.0;l=0;while(1){if((l|0)>=2){break}if((l&1|0)!=0){t=m}else{t=o}g=+bF(+((c[f+(l<<2)>>2]|0)+t|0)/s-1.0);if(g>.4){u=247;break}l=l+1|0}if((u|0)==247){q=0;r=q;i=e;return r|0}if((l&1|0)!=0){v=m}else{v=o}g=+bF(+((c[f+(l<<2)>>2]|0)+v|0)*.5/s-1.0);if(g>.4){q=0;r=q;i=e;return r|0}l=1;L339:while(1){if((l|0)>=(d|0)){break}w=0;while(1){if((w|0)>=2){break}if((w&1|0)!=0){x=o}else{x=m}g=+bF(+((c[f+((l*6|0)+1+w<<2)>>2]|0)+x|0)/s-1.0);if(g>.4){u=263;break L339}w=w+1|0}l=l+1|0}if((u|0)==263){q=0;r=q;i=e;return r|0}k=ev(d+1|0)|0;if((k|0)==0){q=j;r=q;i=e;return r|0}j=ev(d+257|0)|0;d=0;w=3;while(1){if((w|0)>=((b<<1)-1|0)){break}u=20;l=63;y=16.0e8;x=0;while(1){if((x|0)>=20){break}z=0.0;v=0;while(1){if((v|0)>=4){break}if((w+v&1|0)!=0){A=m}else{A=o}z=z+ +bF(+((a[(c[3304+(x<<2)>>2]|0)+v|0]|0)-48|0)- +((c[f+(w+v<<2)>>2]|0)+A|0)/s);v=v+1|0}if(z<y){y=z;u=x;l=((x|0)%10|0)+48&255}x=x+1|0}g=g+y;x=d;d=x+1|0;a[k+x|0]=l;w=w+6|0}a[k+d|0]=0;if((j|0)!=0){w=j;A=d;d=k;s=g/+(b-6<<1|0);aP(w|0,22848,(w=i,i=i+24|0,c[w>>2]=A,c[w+8>>2]=d,h[w+16>>3]=s,w)|0)|0;i=w}ew(k);q=j;r=q;i=e;return r|0}function bJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;d=0;while(1){if((d|0)>=(b|0)){break}c[a+(d<<2)>>2]=d;d=d+1|0}f=1;while(1){if((f|0)==0){break}d=0;f=0;while(1){if((d|0)>=(b-1|0)){break}if((c[e+(c[a+(d<<2)>>2]<<2)>>2]|0)<(c[e+(c[a+(d+1<<2)>>2]<<2)>>2]|0)){f=c[a+(d<<2)>>2]|0;c[a+(d<<2)>>2]=c[a+(d+1<<2)>>2];c[a+(d+1<<2)>>2]=f;f=1}d=d+1|0}}return}function bK(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0;e=i;i=i+80|0;f=e|0;g=e+40|0;j=b;b=d;d=0;do{if(((b|0)%5|0|0)==0){if((b|0)<15){break}k=c[j>>2]|0;l=k;m=k;k=c[j+4>>2]|0;n=k;o=k;k=0;while(1){if((k|0)>=((b<<1)-1|0)){break}if((k&1|0)!=0){if((o|0)>(c[j+(k<<2)>>2]|0)){o=c[j+(k<<2)>>2]|0}if((n|0)<(c[j+(k<<2)>>2]|0)){n=c[j+(k<<2)>>2]|0}}else{if((m|0)>(c[j+(k<<2)>>2]|0)){m=c[j+(k<<2)>>2]|0}if((l|0)<(c[j+(k<<2)>>2]|0)){l=c[j+(k<<2)>>2]|0}}k=k+1|0}l=(m-o|0)/2|0;n=(-(m-o|0)|0)/2|0;k=0;p=0;while(1){if((k|0)>=((b<<1)-1|0)){break}if((k&1|0)!=0){p=p+((c[j+(k<<2)>>2]|0)+l)|0}else{p=p+((c[j+(k<<2)>>2]|0)+n)|0}k=k+1|0}q=+(p|0)*1.0/+(((b|0)/5|0)<<4|0);o=0;r=0.0;m=ev(((b|0)/5|0)+1|0)|0;if((m|0)==0){s=d;t=s;i=e;return t|0}d=ev(((b|0)/5|0)+256|0)|0;u=0;v=0;while(1){if((u|0)>=((b<<1)-3|0)){break}k=0;while(1){if((k|0)>=9){break}if((k&1|0)!=0){w=l}else{w=n}c[g+(k<<2)>>2]=(c[j+(u+k<<2)>>2]|0)+w;k=k+1|0}bJ(g|0,f|0,9);x=0.0;y=3;while(1){if((y|0)>=9){break}x=x+ +bF(+(c[g+(c[f+(y<<2)>>2]<<2)>>2]|0)/q-1.0);y=y+1|0}r=r+x;y=0;L460:while(1){if((y|0)>=44){break}do{if((a[(c[848]|0)+((y*10|0)+1+(((c[f>>2]|0)%2|0)*5|0)+((c[f>>2]|0)/2|0))|0]|0)==45){if((a[(c[848]|0)+((y*10|0)+1+(((c[f+4>>2]|0)%2|0)*5|0)+((c[f+4>>2]|0)/2|0))|0]|0)!=45){break}if((a[(c[848]|0)+((y*10|0)+1+(((c[f+8>>2]|0)%2|0)*5|0)+((c[f+8>>2]|0)/2|0))|0]|0)==45){z=356;break L460}}}while(0);y=y+1|0}if((z|0)==356){z=0}do{if((v|0)>0){if((v|0)>=(((b|0)/5|0)-2|0)){break}o=o+y|0}}while(0);A=v;v=A+1|0;a[m+A|0]=a[(c[848]|0)+(y*10|0)|0]|0;A=0;if((c[f>>2]&1|0)!=0){A=A+1|0}if((c[f+4>>2]&1|0)!=0){A=A+1|0}if((c[f+8>>2]&1|0)!=0){A=A+1|0}if((A&1|0)==0){z=369;break}u=u+10|0}if((z|0)==369){ew(m);ew(d);s=0;t=s;i=e;return t|0}a[m+v|0]=0;if((d|0)!=0){u=d;k=v;n=m;l=a[(c[848]|0)+(((o|0)%44|0)*10|0)|0]|0;q=r/+(((b|0)/5|0)*6|0|0);aP(u|0,22104,(u=i,i=i+32|0,c[u>>2]=k,c[u+8>>2]=n,c[u+16>>2]=l,h[u+24>>3]=q,u)|0)|0;i=u}ew(m);s=d;t=s;i=e;return t|0}}while(0);s=0;t=s;i=e;return t|0}function bL(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0.0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0;e=i;i=i+32|0;f=e|0;g=b;b=d;d=0;if(((b|0)%5|0|0)!=4){j=0;k=j;i=e;return k|0}l=((b-4|0)/5|0)<<1;m=ev((l*5|0)<<2)|0;if((m|0)==0){j=0;k=j;i=e;return k|0}n=ev(28)|0;if((n|0)==0){ew(m);j=0;k=j;i=e;return k|0}o=ev(l)|0;if((o|0)==0){ew(m);ew(n);j=0;k=j;i=e;return k|0}p=0;while(1){if((p|0)>=((l*5|0)+7|0)){break}if((p|0)<4){c[n+(p<<2)>>2]=c[g+(p<<2)>>2]}else{if((p|0)>((l*5|0)+3|0)){c[n+(p-(l*5|0)<<2)>>2]=c[g+(p<<2)>>2]}else{q=p-4|0;q=(((q|0)/10|0)*10|0)+(((q|0)%10|0|0)/2|0)+((q&1)*5|0)|0;c[m+(q<<2)>>2]=c[g+(p<<2)>>2]}}p=p+1|0}g=m;bJ(n,f|0,7);do{if((c[f>>2]|0)==4){if((c[n+(c[f>>2]<<2)>>2]|0)==(c[n+(c[f+4>>2]<<2)>>2]|0)){break}p=0;q=0;while(1){if((p|0)>=(l*5|0|0)){break}q=q+(c[g+(p<<2)>>2]|0)|0;p=p+1|0}r=+(q|0)*1.0/+(((b|0)/5|0)<<4|0);s=0;t=0.0;u=0;v=0;while(1){if((u|0)>=(l*5|0|0)){break}bJ(g+(u<<2)|0,f|0,5);w=0.0;x=2;while(1){if((x|0)>=5){break}w=w+ +bF(+(c[g+(u+(c[f+(x<<2)>>2]|0)<<2)>>2]|0)/r-1.0);x=x+1|0}t=t+w;x=0;while(1){if((x|0)>=10){break}if((a[(c[852]|0)+((x*6|0)+1+(c[f>>2]|0))|0]|0)==45){if((a[(c[852]|0)+((x*6|0)+1+(c[f+4>>2]|0))|0]|0)==45){y=415;break}}x=x+1|0}if((y|0)==415){y=0}z=v;v=z+1|0;a[o+z|0]=a[(c[852]|0)+(x*6|0)|0]|0;if((c[g+(u+(c[f+4>>2]|0)<<2)>>2]|0)==(c[g+(u+(c[f+8>>2]|0)<<2)>>2]|0)){y=419;break}u=u+5|0}if((y|0)==419){ew(o);ew(m);ew(n);j=0;k=j;i=e;return k|0}a[o+v|0]=0;d=ev(l+256|0)|0;if((d|0)!=0){u=d;q=v;z=o;A=a[(c[852]|0)+(((s|0)%10|0)*10|0)|0]|0;r=t/+(((b|0)/5|0)*6|0|0);aP(u|0,21840,(u=i,i=i+32|0,c[u>>2]=q,c[u+8>>2]=z,c[u+16>>2]=A,h[u+24>>3]=r,u)|0)|0;i=u}ew(m);ew(n);ew(o);j=d;k=j;i=e;return k|0}}while(0);ew(m);ew(n);j=0;k=j;i=e;return k|0}function bM(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+72|0;f=e|0;g=e+16|0;j=e+32|0;k=e+48|0;l=e+64|0;m=b;b=d;d=0;n=l;eB(n|0,3296,8)|0;n=0;if(((b|0)%4|0|0)!=0){o=0;p=o;i=e;return p|0}q=(b|0)/4|0;b=ev(q)|0;if((b|0)==0){o=n;p=o;i=e;return p|0}n=ev(q+256|0)|0;r=0;s=0;while(1){if((s|0)>=(q|0)){break}c[j>>2]=c[m+(s<<3<<2)>>2];c[j+4>>2]=c[m+((s<<3)+2<<2)>>2];c[j+8>>2]=c[m+((s<<3)+4<<2)>>2];c[j+12>>2]=c[m+((s<<3)+6<<2)>>2];c[k>>2]=c[m+((s<<3)+1<<2)>>2];c[k+4>>2]=c[m+((s<<3)+3<<2)>>2];c[k+8>>2]=c[m+((s<<3)+5<<2)>>2];bJ(j|0,f|0,4);bJ(k|0,g|0,3);if((c[j+(c[f>>2]<<2)>>2]|0)==(c[j+(c[f+12>>2]<<2)>>2]|0)){t=440;break}u=(c[j+(c[f>>2]<<2)>>2]|0)-(c[j+(c[f+4>>2]<<2)>>2]|0)|0;v=1;w=u;u=(c[j+(c[f+4>>2]<<2)>>2]|0)-(c[j+(c[f+8>>2]<<2)>>2]|0)|0;if((u|0)>(w|0)){v=2;w=u}u=(c[j+(c[f+8>>2]<<2)>>2]|0)-(c[j+(c[f+12>>2]<<2)>>2]|0)|0;if((u|0)>(w|0)){v=3;w=u}if((v|0)==2){t=446;break}u=0;while(1){if((u|0)>=7){break}a[l+u|0]=46;u=u+1|0}if((v|0)==1){if(((c[k+(c[g>>2]<<2)>>2]|0)-(c[k+(c[g+4>>2]<<2)>>2]|0)|0)>((c[k+(c[g+4>>2]<<2)>>2]|0)-(c[k+(c[g+8>>2]<<2)>>2]|0)|0)){a[l+(c[f>>2]<<1)|0]=45;a[l+((c[g>>2]<<1)+1)|0]=45}else{if((c[k+(c[g+8>>2]<<2)>>2]|0)==(c[k+(c[g+4>>2]<<2)>>2]|0)){t=455;break}a[l+(c[f>>2]<<1)|0]=45;a[l+((c[g>>2]<<1)+1)|0]=45;a[l+((c[g+4>>2]<<1)+1)|0]=45}}else{a[l+(c[g>>2]<<1)|0]=45;a[l+(c[g+4>>2]<<1)|0]=45;a[l+(c[g+8>>2]<<1)|0]=45}w=24;u=0;L598:while(1){if((u|0)>=24){break}do{if((a[(c[850]|0)+((u<<3)+1)|0]|0)==(a[l|0]|0)){if((a[(c[850]|0)+((u<<3)+2)|0]|0)!=(a[l+1|0]|0)){break}if((a[(c[850]|0)+((u<<3)+3)|0]|0)!=(a[l+2|0]|0)){break}if((a[(c[850]|0)+((u<<3)+4)|0]|0)!=(a[l+3|0]|0)){break}if((a[(c[850]|0)+((u<<3)+5)|0]|0)!=(a[l+4|0]|0)){break}if((a[(c[850]|0)+((u<<3)+6)|0]|0)!=(a[l+5|0]|0)){break}if((a[(c[850]|0)+((u<<3)+7)|0]|0)==(a[l+6|0]|0)){t=468;break L598}}}while(0);u=u+1|0}if((t|0)==468){t=0;w=u;v=r;r=v+1|0;a[b+v|0]=a[(c[850]|0)+(u<<3)|0]|0}if((w|0)==24){t=472;break}s=s+1|0}if((t|0)==440){d=658}else if((t|0)==446){d=663}else if((t|0)==455){d=671}else if((t|0)==472){d=692}if((s|0)<(q|0)){ew(n);n=0}a[b+r|0]=0;if((n|0)!=0){q=n;s=r;r=b;aP(q|0,21344,(q=i,i=i+32|0,c[q>>2]=s,c[q+8>>2]=r,c[q+16>>2]=63,h[q+24>>3]=0.0,q)|0)|0;i=q}ew(b);o=n;p=o;i=e;return p|0}function bN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0;b=i;d=a;a=c[7036]|0;e=c[a+37052>>2]|0;f=0;g=((c[d+8>>2]|0)+(c[d+12>>2]|0)|0)/2|0;h=(c[d+4>>2]|0)-(c[d>>2]|0)+1|0;j=h;k=h;h=dv(c[d>>2]|0,c[d+4>>2]|0,g,g,c[d+68>>2]|0,c[a+37052>>2]|0)|0;if((c[a+37072>>2]|0)!=0){a=c[n>>2]|0;l=h;m=j;au(a|0,21304,(a=i,i=i+16|0,c[a>>2]=l,c[a+8>>2]=m,a)|0)|0;i=a}a=ev(h<<1<<2)|0;if((a|0)==0){o=0;p=o;i=b;return p|0}m=c[d>>2]|0;m=m-(dC(c[d+68>>2]|0,m,g,8,e,1,4)|0)|0;m=m+(dC(c[d+68>>2]|0,m,g,j,e,0,3)|0)|0;l=0;while(1){if((l|0)>=(h<<1|0)){break}q=dC(c[d+68>>2]|0,m,g,k,e,1^l&1,3)|0;m=m+q|0;k=k-q|0;c[a+(l<<2)>>2]=q;l=l+1|0}c[a+((h<<1)-1<<2)>>2]=0;do{if(((h-1|0)%3|0|0)==0){if((h|0)<10){break}if((j|0)<((((h-1|0)*11|0|0)/3|0)+2|0)){break}if((f|0)==0){f=bG(a,h)|0}}}while(0);do{if(((h|0)%2|0|0)==0){if((h|0)<8){break}if((j|0)<((((h-6|0)*7|0|0)/2|0)+11|0)){break}if((((h-6|0)/2|0|0)%2|0|0)!=0){break}if((f|0)==0){f=bH(a,h)|0}}}while(0);if((h|0)==7){r=508}else{if((h|0)==16){r=508}}if((r|0)==508){if((f|0)==0){f=bI(a,h)|0}}do{if(((h|0)%5|0|0)==0){if((h|0)<=14){break}if((f|0)==0){f=bK(a,h)|0}}}while(0);do{if(((h|0)%5|0|0)==4){if((h|0)<=3){break}if((f|0)==0){f=bL(a,h)|0}}}while(0);do{if(((h|0)%4|0|0)==0){if((h|0)<=3){break}if((f|0)==0){f=bM(a,h)|0}}}while(0);ew(a);o=f;p=o;i=b;return p|0}function bO(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=b;b=e;e=f;f=e;h=c[g+776>>2]|0;eC(f|0,0,h|0)|0;h=0;while(1){if((h|0)>=((c[g+4>>2]|0)-(c[g+776>>2]|0)-(c[g+792>>2]|0)|0)){break}f=a[g+264+((d[b+h|0]|0)^(d[e|0]|0))|0]|0;if((f&255|0)!=(c[g+4>>2]|0)){i=1;while(1){if((i|0)>=(c[g+776>>2]|0)){break}j=d[g+8+(bP(g,(f&255)+(d[g+520+((c[g+776>>2]|0)-i)|0]|0)|0)|0)|0]|0;k=e+i|0;a[k]=((d[k]|0)^j)&255;i=i+1|0}}i=e|0;j=e+1|0;k=(c[g+776>>2]|0)-1|0;eD(i|0,j|0,k|0)|0;if((f&255|0)!=(c[g+4>>2]|0)){k=a[g+8+(bP(g,(f&255)+(d[g+520|0]|0)|0)|0)|0]|0;a[e+((c[g+776>>2]|0)-1)|0]=k}else{a[e+((c[g+776>>2]|0)-1)|0]=0}h=h+1|0}return}function bP(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;while(1){if((a|0)<(c[d+4>>2]|0)){break}a=a-(c[d+4>>2]|0)|0;a=(a>>c[d>>2])+(a&c[d+4>>2])|0}return a|0}function bQ(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0;e=i;i=i+320|0;f=e|0;g=e+48|0;h=e+304|0;j=b;b=0;k=0;if((c[j+37072>>2]|0)!=0){l=c[n>>2]|0;au(l|0,21232,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}l=0;o=0;p=0;q=c[j+8>>2]|0;r=c[j+12>>2]|0;s=c[j+37052>>2]|0;t=0;u=0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){v=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{v=0}if(!v){break}w=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;x=(c[w+4>>2]|0)-(c[w>>2]|0)+1|0;y=x-(dC(c[w+68>>2]|0,c[w+4>>2]|0,((c[w+8>>2]|0)+(c[w+12>>2]|0)|0)/2|0,(c[w+4>>2]|0)-(c[w>>2]|0)|0,s,0,4)|0)|0;t=y-(dC(c[w+68>>2]|0,c[w>>2]|0,((c[w+8>>2]|0)+(c[w+12>>2]|0)|0)/2|0,(c[w+4>>2]|0)-(c[w>>2]|0)|0,s,0,3)|0)|0;u=(c[w+12>>2]|0)-(c[w+8>>2]|0)+1|0;if((c[w+36>>2]|0)==57345){z=557}else{if((c[w+36>>2]|0)==57344){z=557}}if((z|0)==557){z=0;do{if((c[w+8>>2]|0)>=(l|0)){if((c[w+12>>2]|0)>(l+r|0)){break}if((c[w>>2]|0)<(o|0)){break}if((c[w+4>>2]|0)>(o+q|0)){break}if(((c[w+12>>2]|0)-(c[w+8>>2]|0)|0)<=19){break}if(((c[w+12>>2]|0)-(c[w+8>>2]|0)|0)<=(t<<3|0)){break}b=1;A=c[w>>2]|0;B=c[w+4>>2]|0;C=c[w+8>>2]|0;D=c[w+12>>2]|0;E=B-A+2|0;y=C;x=y;F=y;y=D;G=y;H=y;k=1;while(1){if((k|0)==0){break}k=0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){I=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{I=0}if(!I){break}J=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;if((w|0)!=(J|0)){if((c[J+36>>2]|0)==57345){z=573}else{if((c[J+36>>2]|0)==57344){z=573}}if((z|0)==573){z=0;L752:do{if((c[J+8>>2]|0)>=(l|0)){if((c[J+12>>2]|0)>(l+r|0)){break}if((c[J>>2]|0)<(o|0)){break}if((c[J+4>>2]|0)>(o+q|0)){break}if(((c[J+12>>2]|0)-(c[J+8>>2]|0)|0)<=19){break}if(((c[J+12>>2]|0)-(c[J+8>>2]|0)|0)<=(t<<2|0)){break}if(((c[J+4>>2]|0)-(c[J>>2]|0)|0)>=(u<<2|0)){break}if((P((c[J+8>>2]|0)-C|0)|0)<(((u|0)/16|0)+4|0)){if((P((c[J+12>>2]|0)-D|0)|0)>=((u|0)/2|0|0)){z=582}}else{z=582}L762:do{if((z|0)==582){z=0;do{if((P((c[J+8>>2]|0)-F|0)|0)<(((u|0)/16|0)+4|0)){if((P((c[J+12>>2]|0)-H|0)|0)>=((u|0)/2|0|0)){break}if((c[J>>2]|0)<=(A|0)){break L762}}}while(0);if((P((c[J+8>>2]|0)-x|0)|0)>=(((u|0)/16|0)+4|0)){break L752}if((P((c[J+12>>2]|0)-G|0)|0)>=((u|0)/2|0|0)){break L752}if((c[J>>2]|0)<(B|0)){break L752}}}while(0);if((c[J>>2]|0)<=(A-(E*12|0)|0)){break}if((c[J+4>>2]|0)>=(B+(E*12|0)|0)){break}if((c[J>>2]|0)<=(A-((u|0)/2|0)|0)){break}if((c[J+4>>2]|0)>=(B+((u|0)/2|0)|0)){break}if((c[J+4>>2]|0)<=(B|0)){if((c[J>>2]|0)>=(A|0)){break}}if((c[J>>2]|0)<(A|0)){A=c[J>>2]|0;F=c[J+8>>2]|0;H=c[J+12>>2]|0}if((c[J+4>>2]|0)>(B|0)){B=c[J+4>>2]|0;x=c[J+8>>2]|0;G=c[J+12>>2]|0}if(((c[J+12>>2]|0)-(c[J+8>>2]|0)<<2|0)>((D-C|0)*3|0|0)){if((c[J+8>>2]|0)>(C|0)){C=c[J+8>>2]|0}if((c[J+12>>2]|0)<(D|0)){D=c[J+12>>2]|0}}b=b+1|0;k=1}}while(0)}}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}}if((b|0)>5){G=0;c[w+36>>2]=57345;c[w>>2]=A;c[w+8>>2]=C;c[w+4>>2]=B;c[w+12>>2]=D;K=((c[w+8>>2]|0)+(c[w+12>>2]|0)|0)/2|0;if((c[j+37072>>2]|0)!=0){x=dv(c[w>>2]|0,c[w+4>>2]|0,K,K,c[w+68>>2]|0,c[j+37052>>2]|0)|0;H=c[n>>2]|0;F=A;y=C;L=B-A+1|0;M=D-C+1|0;N=x;O=b;au(H|0,21168,(m=i,i=i+48|0,c[m>>2]=F,c[m+8>>2]=y,c[m+16>>2]=L,c[m+24>>2]=M,c[m+32>>2]=N,c[m+40>>2]=O,m)|0)|0;i=m;if((b|0)!=(x|0)){x=c[n>>2]|0;au(x|0,21112,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}}G=bN(w)|0;if((G|0)==0){G=ev(128)|0;if((G|0)!=0){x=G;eE(x|0,20776,128)|0}}if((c[j+37072>>2]|0)!=0){x=c[n>>2]|0;O=G;au(x|0,20704,(m=i,i=i+8|0,c[m>>2]=O,m)|0)|0;i=m}O=w;x=G;dx(O,x,99)|0;ew(G);if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){Q=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{Q=0}if(!Q){break}J=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;if((w|0)!=(J|0)){if((c[J+36>>2]|0)==57345){z=630}else{if((c[J+36>>2]|0)==57344){z=630}}if((z|0)==630){z=0;do{if((P((c[J+8>>2]|0)-C|0)|0)<(((u|0)/16|0)+4|0)){if((P((c[J+12>>2]|0)-D|0)|0)>=((u|0)/2|0|0)){break}if((c[J+4>>2]|0)>(B|0)){break}if((c[J>>2]|0)<(A|0)){break}p=p+1|0;G=j+84|0;x=J;cw(G,x)|0;x=J;bV(x)|0}}while(0)}}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}if((c[j+37072>>2]|0)!=0){x=c[n>>2]|0;G=p;au(x|0,20616,(m=i,i=i+8|0,c[m>>2]=G,m)|0)|0;i=m}p=0}}}while(0)}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}k=0;c[j+37044>>2]=0;c[j+37040>>2]=0;c[j+37048>>2]=0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){R=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{R=0}if(!R){break}k=k+1|0;J=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[J+36>>2]|0)!=57345){Q=j+37048|0;c[Q>>2]=(c[Q>>2]|0)+1;Q=j+37040|0;c[Q>>2]=(c[Q>>2]|0)+((c[J+4>>2]|0)-(c[J>>2]|0)+1);Q=j+37044|0;c[Q>>2]=(c[Q>>2]|0)+((c[J+12>>2]|0)-(c[J+8>>2]|0)+1)}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}if((c[j+37072>>2]|0)!=0){R=c[n>>2]|0;Q=k;I=c[j+37048>>2]|0;au(R|0,20584,(m=i,i=i+16|0,c[m>>2]=Q,c[m+8>>2]=I,m)|0)|0;i=m}if((c[j+37072>>2]|0)!=0){I=c[n>>2]|0;au(I|0,20464,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}l=0;o=0;p=0;q=c[j+8>>2]|0;r=c[j+12>>2]|0;s=c[j+37052>>2]|0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){S=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{S=0}if(!S){break}w=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;t=(c[w+4>>2]|0)-(c[w>>2]|0)+1|0;u=(c[w+12>>2]|0)-(c[w+8>>2]|0)+1|0;L879:do{if((t|0)<10){z=669}else{if((u|0)<10){z=669;break}C=0;B=0;A=0;D=0;T=dv(c[w>>2]|0,c[w+4>>2]|0,c[w+12>>2]|0,c[w+12>>2]|0,c[w+68>>2]|0,c[j+37052>>2]|0)|0;K=dv(c[w>>2]|0,c[w>>2]|0,c[w+8>>2]|0,c[w+12>>2]|0,c[w+68>>2]|0,c[j+37052>>2]|0)|0;b=c[w+8>>2]|0;while(1){if((b|0)>(c[w+12>>2]|0)){break}U=dv(c[w>>2]|0,c[w+4>>2]|0,b,b,c[w+68>>2]|0,c[j+37052>>2]|0)|0;k=0;while(1){if((k|0)>=(U|0)){break}I=(c[w>>2]|0)+((aa(k,t)|0)/(U|0)|0)|0;Q=(d8(c[w+68>>2]|0,I+((t|0)/(U<<2|0)|0)|0,b)|0)<(s|0);if(((Q?1:0)|0)!=1){z=675;break}Q=(d8(c[w+68>>2]|0,I+((t*3|0|0)/(U<<2|0)|0)|0,b)|0)<(s|0);if(((Q?1:0)|0)!=0){z=677;break}k=k+1|0}if((z|0)==675){z=0}else if((z|0)==677){z=0}if((k|0)==(U|0)){if((U|0)>(B|0)){B=U;C=b}}b=b+1|0}b=c[w>>2]|0;while(1){if((b|0)>(c[w+4>>2]|0)){break}U=dv(b,b,c[w+8>>2]|0,c[w+12>>2]|0,c[w+68>>2]|0,c[j+37052>>2]|0)|0;k=0;while(1){if((k|0)>=(U|0)){break}Q=(c[w+8>>2]|0)+((aa(k,u)|0)/(U|0)|0)|0;I=(d8(c[w+68>>2]|0,b,Q+((u|0)/(U<<2|0)|0)|0)|0)<(s|0);if(((I?1:0)|0)!=0){z=691;break}I=(d8(c[w+68>>2]|0,b,Q+((u*3|0|0)/(U<<2|0)|0)|0)|0)<(s|0);if(((I?1:0)|0)!=1){z=693;break}k=k+1|0}if((z|0)==691){z=0}else if((z|0)==693){z=0}if((k|0)==(U|0)){if((U|0)>=(D|0)){D=U;A=b}}b=b+1|0}if((B|0)!=0){V=(t|0)/(B<<1|0)|0}else{V=1}E=V;if((D|0)!=0){W=(u|0)/(D<<1|0)|0}else{W=1}I=W;do{if((c[w+36>>2]|0)!=57345){if((c[w+36>>2]|0)==57344){break}break L879}}while(0);do{if((T|0)==1){if((K|0)!=1){break}if((B|0)>=5){if((B|0)<=13){z=725}else{z=716}}else{z=716}L941:do{if((z|0)==716){z=0;do{if((B|0)>=16){if((B|0)>26){break}if(((B|0)%2|0|0)==0){z=725;break L941}}}while(0);do{if((B|0)>=32){if((B|0)>52){break}if(((B|0)%4|0|0)==0){z=725;break L941}}}while(0);if((B|0)<60){z=726;break}if((B|0)>72){z=726;break}if(((B|0)%6|0|0)==0){z=725}else{z=726}}}while(0);if((z|0)==725){z=0;if((B|0)==(D|0)){z=738}else{z=726}}do{if((z|0)==726){z=0;if((D|0)==4){if((B|0)==9){z=738;break}}if((D|0)==6){if((B|0)==13){z=738;break}}if((D|0)==8){if((B|0)==36){z=738;break}}if((D|0)==4){if((B|0)==16){z=738;break}}if((D|0)==6){if((B|0)==18){z=738;break}}if((D|0)!=8){break}if((B|0)==24){z=738}}}while(0);do{if((z|0)==738){z=0;if((C|0)>=((c[w+8>>2]|0)+I|0)){break}if((A|0)<=((c[w+4>>2]|0)-E|0)){break}Q=1;R=1;if((B|0)>=16){Q=2}if((B|0)>=32){Q=4}if((B|0)>=60){Q=6}if((D|0)>=16){R=2}if((D|0)>=32){R=4}if((D|0)>=60){R=6}v=0;v=ev(aa(B-Q<<2,D-R|0)|0)|0;if((v|0)==0){G=c[n>>2]|0;au(G|0,20384,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;break L879}G=0;while(1){if((G|0)>=(D-R<<1|0)){break}X=0;while(1){if((X|0)>=(B-Q<<1|0)){break}T=(c[w>>2]|0)+(aa(E,X+1+(((X+2|0)/((B<<1|0)/(Q|0)|0|0)|0)<<1)|0)|0)+((E|0)/2|0)|0;K=(c[w+8>>2]|0)+(aa(I,G+1+(((G+2|0)/((D<<1|0)/(R|0)|0|0)|0)<<1)|0)|0)+((I|0)/2|0)|0;x=(d8(c[w+68>>2]|0,T,K)|0)<(s|0);a[v+((aa(G<<1,B-Q|0)|0)+X)|0]=(x?1:0)&255;X=X+1|0}G=G+1|0}if((c[j+37072>>2]|0)!=0){x=c[n>>2]|0;au(x|0,20360,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;X=0;while(1){if((X|0)>=(B<<1|0)){break}if((X|0)<=8){x=c[n>>2]|0;O=X;au(x|0,20336,(m=i,i=i+8|0,c[m>>2]=O,m)|0)|0;i=m}else{do{if((X|0)<=98){if(((X|0)%2|0|0)!=0){z=770;break}O=c[n>>2]|0;x=X;au(O|0,20320,(m=i,i=i+8|0,c[m>>2]=x,m)|0)|0;i=m}else{z=770}}while(0);if((z|0)==770){z=0;if(((X|0)%4|0|0)==0){x=c[n>>2]|0;O=X;au(x|0,20304,(m=i,i=i+8|0,c[m>>2]=O,m)|0)|0;i=m}}}X=X+1|0}G=0;while(1){if((G|0)>=(D<<1|0)){break}au(c[n>>2]|0,20120,(m=i,i=i+8|0,c[m>>2]=G,m)|0)|0;i=m;X=0;while(1){if((X|0)>=(B<<1|0)){break}O=c[n>>2]|0;x=(c[w>>2]|0)+(aa(E,X)|0)+((E|0)/2|0)|0;if((d8(c[w+68>>2]|0,x,(c[w+8>>2]|0)+(aa(I,G)|0)+((I|0)/2|0)|0)|0)<(s|0)){do{if(((X|0)%((B<<1|0)/(Q|0)|0|0)|0|0)==0){Y=1}else{if(((X|0)%((B<<1|0)/(Q|0)|0|0)|0|0)==(((B<<1|0)/(Q|0)|0)-1|0)){Y=1;break}if(((G|0)%((D<<1|0)/(R|0)|0|0)|0|0)==0){Y=1;break}Y=((G|0)%((D<<1|0)/(R|0)|0|0)|0|0)==(((D<<1|0)/(R|0)|0)-1|0)}}while(0);Z=Y?120:111}else{Z=32}au(O|0,20008,(m=i,i=i+8|0,c[m>>2]=Z,m)|0)|0;i=m;X=X+1|0}G=G+1|0}au(c[n>>2]|0,19912,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;X=0;while(1){if((X|0)>=(B-Q<<1|0)){break}if((X|0)<=8){x=c[n>>2]|0;N=X;au(x|0,20336,(m=i,i=i+8|0,c[m>>2]=N,m)|0)|0;i=m}else{do{if((X|0)<=98){if(((X|0)%2|0|0)!=0){z=798;break}N=c[n>>2]|0;x=X;au(N|0,20320,(m=i,i=i+8|0,c[m>>2]=x,m)|0)|0;i=m}else{z=798}}while(0);if((z|0)==798){z=0;if(((X|0)%4|0|0)==0){x=c[n>>2]|0;N=X;au(x|0,20304,(m=i,i=i+8|0,c[m>>2]=N,m)|0)|0;i=m}}}X=X+1|0}G=0;while(1){if((G|0)>=(D-R<<1|0)){break}au(c[n>>2]|0,20120,(m=i,i=i+8|0,c[m>>2]=G,m)|0)|0;i=m;X=0;while(1){if((X|0)>=(B-Q<<1|0)){break}N=(a[v+((aa(G<<1,B-Q|0)|0)+X)|0]|0)!=0;au(c[n>>2]|0,20008,(m=i,i=i+8|0,c[m>>2]=N?111:32,m)|0)|0;i=m;X=X+1|0}G=G+1|0}}N=0;x=0;c[w+36>>2]=57345;N=0;N=ev(((aa(B*24|0,D)|0)/8|0)+128|0)|0;if((N|0)==0){M=c[n>>2]|0;au(M|0,19872,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m;break L879}a[N|0]=0;eE(N|0,19768,128)|0;x=43;T=0;K=4;M=B-Q<<1;L=D-R<<1;y=1;b=0;L1079:while(1){if((b|0)>=((aa(B-Q|0,D-R|0)|0)/2|0|0)){break}F=0;H=2760;do{if((T|0)==0){if((K|0)!=(L|0)){break}H=3016}}while(0);do{if((T|0)==0){if((K|0)!=(L-2|0)){break}if(((M|0)%4|0|0)==0){break}H=2952}}while(0);do{if((T|0)==0){if((K|0)!=(L-2|0)){break}if(((M|0)%8|0|0)!=4){break}H=2888}}while(0);do{if((T|0)==2){if((K|0)!=(L+4|0)){break}if(((M|0)%8|0|0)!=0){break}H=2824}}while(0);k=0;while(1){if((k|0)>=8){break}X=T+(c[H+(k<<1<<2)>>2]|0)|0;G=K+(c[H+((k<<1)+1<<2)>>2]|0)|0;if((H|0)!=2760){X=(X+M|0)%(M|0)|0;G=(G+L|0)%(L|0)|0}if((G|0)<0){G=G+L|0;X=X+(4-((L+4|0)%8|0))|0}if((X|0)<0){X=X+M|0;G=G+(4-((M+4|0)%8|0))|0}X=(X+M|0)%(M|0)|0;G=(G+L|0)%(L|0)|0;F=F+(a[v+((aa(G,M)|0)+X)|0]<<k)|0;k=k+1|0}do{if((y|0)>0){if((T|0)<0){z=845;break}if((K|0)<(L|0)){z=848}else{z=845}}else{z=845}}while(0);L1118:do{if((z|0)==845){z=0;do{if((y|0)<0){if((K|0)<0){break}if((T|0)<(M|0)){z=848;break L1118}}}while(0);b=b-1|0}}while(0);if((z|0)==848){z=0;O=c[n>>2]|0;H=T;_=K;$=F;ab=F;ac=y;ad=x;au(O|0,19672,(m=i,i=i+48|0,c[m>>2]=H,c[m+8>>2]=_,c[m+16>>2]=$,c[m+24>>2]=ab,c[m+32>>2]=ac,c[m+40>>2]=ad,m)|0)|0;i=m;do{if((F|0)>=33){if((F|0)>128){z=851;break}ad=x;x=ad+1|0;a[N+ad|0]=F-1&255;ad=c[n>>2]|0;ac=F-1|0;au(ad|0,19640,(m=i,i=i+8|0,c[m>>2]=ac,m)|0)|0;i=m}else{z=851}}while(0);if((z|0)==851){z=0;do{if((F|0)>=130){if((F|0)>229){z=854;break}ac=x;x=ac+1|0;a[N+ac|0]=((((F-130|0)/10|0)&255)<<24>>24)+48&255;ac=x;x=ac+1|0;a[N+ac|0]=((((F-130|0)%10|0)&255)<<24>>24)+48&255;ac=c[n>>2]|0;ad=F-130|0;au(ac|0,19600,(m=i,i=i+8|0,c[m>>2]=ad,m)|0)|0;i=m}else{z=854}}while(0);if((z|0)==854){z=0;ad=0;if((F|0)==129){ac=c[n>>2]|0;au(ac|0,19576,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==230){ac=c[n>>2]|0;au(ac|0,19552,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==231){ac=c[n>>2]|0;au(ac|0,19448,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==232){ac=c[n>>2]|0;au(ac|0,19344,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==235){ac=c[n>>2]|0;au(ac|0,19272,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==238){ac=c[n>>2]|0;au(ac|0,19240,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==239){ac=c[n>>2]|0;au(ac|0,19152,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==240){ac=c[n>>2]|0;au(ac|0,19048,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((F|0)==254){ac=c[n>>2]|0;au(ac|0,19016,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}ac=aP(N+x|0,18992,(m=i,i=i+8|0,c[m>>2]=F,m)|0)|0;i=m;ad=ac;if((ad|0)>0){x=x+ad|0}}}}if((x|0)>(((aa(B*24|0,D)|0)/8|0)+128-10|0)){z=879;break}T=T+(y<<1)|0;K=K-(y<<1)|0;do{if((y|0)>0){if((K|0)>=0){if((T|0)<(M|0)){z=884;break}}K=K+1|0;T=T+3|0;y=y*-1|0}else{z=884}}while(0);if((z|0)==884){z=0;do{if((y|0)<0){if((T|0)>=0){if((K|0)<(L|0)){break}}T=T+1|0;K=K+3|0;y=y*-1|0}}while(0)}do{if((y|0)>0){if((T|0)<(M|0)){break}if((K|0)>=(L|0)){z=892;break L1079}}}while(0);b=b+1|0}if((z|0)==879){z=0}else if((z|0)==892){z=0}if((c[j+37072>>2]|0)!=0){L=c[n>>2]|0;M=c[w>>2]|0;y=c[w+8>>2]|0;G=t;R=u;Q=B<<1;F=D<<1;ad=E;ac=I;au(L|0,18912,(m=i,i=i+64|0,c[m>>2]=M,c[m+8>>2]=y,c[m+16>>2]=G,c[m+24>>2]=R,c[m+32>>2]=Q,c[m+40>>2]=F,c[m+48>>2]=ad,c[m+56>>2]=ac,m)|0)|0;i=m}do{if((N|0)!=0){if((x|0)>=(((aa(B<<3,D)|0)/8|0)+128-6|0)){break}ac=N+x|0;eE(ac|0,18840,6)|0}}while(0);a[N+(((aa(B<<3,D)|0)/8|0)+127)|0]=0;if((N|0)==0){N=ev(128)|0;if((N|0)!=0){x=N;eE(x|0,18752,128)|0}}if((c[j+37072>>2]|0)!=0){x=c[n>>2]|0;ac=N;au(x|0,20704,(m=i,i=i+8|0,c[m>>2]=ac,m)|0)|0;i=m}dx(w,N,99)|0;ew(N);if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){ae=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{ae=0}if(!ae){break}J=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;if((w|0)!=(J|0)){if((c[J+36>>2]|0)==57345){z=914}else{if((c[J+36>>2]|0)==57344){z=914}}if((z|0)==914){z=0;do{if((c[J+8>>2]|0)>=(c[w+8>>2]|0)){if((c[J+12>>2]|0)>(c[w+12>>2]|0)){break}if((c[J+4>>2]|0)>(c[w+4>>2]|0)){break}if((c[J>>2]|0)<(c[w>>2]|0)){break}p=p+1|0;ac=j+84|0;x=J;cw(ac,x)|0;x=J;bV(x)|0}}while(0)}}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}if((c[j+37072>>2]|0)!=0){N=c[n>>2]|0;x=p;au(N|0,20616,(m=i,i=i+8|0,c[m>>2]=x,m)|0)|0;i=m}p=0;ew(v)}}while(0);break L879}}while(0)}}while(0);if((z|0)==669){z=0}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}ae=0;D=1;B=0;E=0;u=0;t=0;b=0;X=0;Z=0;Y=0;A=0;C=0;W=0;V=0;U=0;S=0;I=0;x=0;if((c[j+37072>>2]|0)!=0){N=c[n>>2]|0;au(N|0,18648,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}N=0;while(1){if((N|0)>=4){break}af=0;while(1){if((af|0)>=40){break}if(((c[520+(af*56|0)+(N+2<<2)>>2]|0)%((c[520+(af*56|0)+((N<<1)+6<<2)>>2]|0)+(c[520+(af*56|0)+((N<<1)+7<<2)>>2]|0)|0)|0|0)!=0){ac=c[n>>2]|0;ad=af;F=N;au(ac|0,18568,(m=i,i=i+24|0,c[m>>2]=1476,c[m+8>>2]=ad,c[m+16>>2]=F,m)|0)|0;i=m}af=af+1|0}N=N+1|0}N=0;while(1){if((N|0)>=4){break}af=0;while(1){if((af|0)>=40){break}if(((c[520+(af*56|0)>>2]|0)%((c[520+(af*56|0)+((N<<1)+6<<2)>>2]|0)+(c[520+(af*56|0)+((N<<1)+7<<2)>>2]|0)|0)|0|0)!=(c[520+(af*56|0)+((N<<1)+7<<2)>>2]|0)){F=c[n>>2]|0;ad=af;ac=N;au(F|0,18568,(m=i,i=i+24|0,c[m>>2]=1481,c[m+8>>2]=ad,c[m+16>>2]=ac,m)|0)|0;i=m}af=af+1|0}N=N+1|0}l=0;o=0;p=0;q=c[j+8>>2]|0;r=c[j+12>>2]|0;s=c[j+37052>>2]|0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){ag=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{ag=0}if(!ag){break}w=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;ah=c[w>>2]|0;ai=(c[w+4>>2]|0)-ah+1|0;aj=c[w+8>>2]|0;ak=(c[w+12>>2]|0)-aj+1|0;do{if((ai|0)<7){z=960}else{if((ak|0)<7){z=960;break}if(((P(ai-ak|0)|0)<<3|0)>(ai+ak|0)){z=960;break}K=aj+((ak|0)/2|0)|0;T=dC(c[w+68>>2]|0,ah,K,ai,s,0,3)|0;if((T|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,0,3)|0)|0;if((P(T-((ai<<1|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai*5|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,0,3)|0)|0;if((P(T-((ai*6|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}K=aj+((ak|0)/14|0)|0;T=dC(c[w+68>>2]|0,ah,K,ai,s,0,3)|0;if((P(T-(0/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai*7|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}K=aj+((ak*13|0|0)/14|0)|0;T=dC(c[w+68>>2]|0,ah,K,ai,s,0,3)|0;if((P(T-(0/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai*7|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}K=aj+((ak*3|0|0)/14|0)|0;T=dC(c[w+68>>2]|0,ah,K,ai,s,0,3)|0;if((P(T-(0/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,0,3)|0)|0;if((P(T-((ai*6|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}K=aj+((ak*11|0|0)/14|0)|0;T=dC(c[w+68>>2]|0,ah,K,ai,s,0,3)|0;if((P(T-(0/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,1,3)|0)|0;if((P(T-((ai|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=T+(dC(c[w+68>>2]|0,ah+T|0,K,ai,s,0,3)|0)|0;if((P(T-((ai*6|0|0)/7|0)|0)|0)>((ai|0)/16|0|0)){break}T=ah+((ai|0)/2|0)|0;K=dC(c[w+68>>2]|0,T,aj,ak,s,0,2)|0;if((K|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,0,2)|0)|0;if((P(K-((ak<<1|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak*5|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,0,2)|0)|0;if((P(K-((ak*6|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}T=ah+((ai|0)/14|0)|0;K=dC(c[w+68>>2]|0,T,aj,ak,s,0,2)|0;if((P(K-(0/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak*7|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}T=ah+((ai*13|0|0)/14|0)|0;K=dC(c[w+68>>2]|0,T,aj,ak,s,0,2)|0;if((P(K-(0/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak*7|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}T=ah+((ai*3|0|0)/14|0)|0;K=dC(c[w+68>>2]|0,T,aj,ak,s,0,2)|0;if((P(K-(0/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,0,2)|0)|0;if((P(K-((ak*6|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}T=ah+((ai*11|0|0)/14|0)|0;K=dC(c[w+68>>2]|0,T,aj,ak,s,0,2)|0;if((P(K-(0/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,1,2)|0)|0;if((P(K-((ak|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}K=K+(dC(c[w+68>>2]|0,T,aj+K|0,ak,s,0,2)|0)|0;if((P(K-((ak*6|0|0)/7|0)|0)|0)>((ak|0)/16|0|0)){break}if((B|0)<3){c[f+(B<<4)>>2]=ah;c[f+(B<<4)+4>>2]=aj;c[f+(B<<4)+8>>2]=ai;c[f+(B<<4)+12>>2]=ak}else{E=-1}B=B+1|0}}while(0);if((z|0)==960){z=0}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}do{if((B|0)==3){if((c[f>>2]|0)<=(c[f+16>>2]|0)){break}af=c[f>>2]|0;c[f>>2]=c[f+16>>2];c[f+16>>2]=af;af=c[f+4>>2]|0;c[f+4>>2]=c[f+20>>2];c[f+20>>2]=af;af=c[f+8>>2]|0;c[f+8>>2]=c[f+24>>2];c[f+24>>2]=af;af=c[f+12>>2]|0;c[f+12>>2]=c[f+28>>2];c[f+28>>2]=af}}while(0);do{if((B|0)==3){if(((c[f>>2]|0)+(c[f+8>>2]|0)|0)>=(c[f+16>>2]|0)){break}if(((c[f+4>>2]|0)+(c[f+12>>2]|0)|0)>=(c[f+36>>2]|0)){break}s=c[f>>2]|0;ag=c[f+4>>2]|0;r=(c[f+16>>2]|0)+(c[f+24>>2]|0)-(c[f>>2]|0)|0;q=(c[f+36>>2]|0)+(c[f+44>>2]|0)-(c[f+4>>2]|0)|0;af=dv(s,s+r-1|0,ag+(((c[f+28>>2]|0)*13|0|0)/14|0)|0,ag+(((c[f+28>>2]|0)*13|0|0)/14|0)|0,c[w+68>>2]|0,c[j+37052>>2]|0)|0;af=(af-2<<1)+15|0;N=dv(s+(((c[f+24>>2]|0)*13|0|0)/14|0)|0,s+(((c[f+24>>2]|0)*13|0|0)/14|0)|0,ag,ag+q-1|0,c[w+68>>2]|0,c[j+37052>>2]|0)|0;N=(N-2<<1)+15|0;T=(r*14|0|0)/((c[f+8>>2]|0)+(c[f+24>>2]|0)|0)|0;K=(q*14|0|0)/((c[f+12>>2]|0)+(c[f+44>>2]|0)|0)|0;o=af;do{if(((af-17|0)%4|0|0)!=0){if(((N-17|0)%4|0|0)!=0){break}o=N}}while(0);I=(o-17|0)/4|0;l=o;K=l;T=l;l=28;ac=28;ad=0;af=2;while(1){if((af|0)>(I|0)){break}if((ad|0)!=0){l=((af<<2)+17-13+ad-(((ad|0)/4|0)<<1)|0)/(ad+1|0)|0}l=((l+1|0)/2|0)<<1;ac=(af<<2)+17-13-(aa(ad,l)|0)|0;if((ac+(aa(ad,l)|0)|0)>=((ad*28|0)+28|0)){ad=ad+1|0}af=af+1|0}o=(aa((I<<2)+17|0,(I<<2)+17|0)|0)-192|0;if((ad|0)>=0){al=aa((ad+1|0)*25|0,ad+1|0)|0}else{al=0}if((ad|0)>=1){am=ad*20|0}else{am=0}F=o-al-(am<<1)-((I<<2)+17-16<<1)-((I|0)<=6?0:36)-30-1|0;do{if((T|0)==(K|0)){if(((T-17|0)%4|0|0)!=0){break}if((T|0)<21){break}if((T|0)>177){break}b=ev(aa(T,K)|0)|0;if((b|0)!=0){af=0;while(1){if((af|0)>=(aa(T,K)|0)){break}o=d8(c[w+68>>2]|0,s+(((aa((af|0)%(T|0)|0,r)|0)+((r|0)/2|0)|0)/(T|0)|0)|0,ag+(((aa((af|0)/(T|0)|0,q)|0)+((q|0)/2|0)|0)/(K|0)|0)|0)|0;a[b+af|0]=((o|0)<(c[j+37052>>2]|0)?1:0)&255;af=af+1|0}E=1;af=0;while(1){if((af|0)>=(T-14|0)){break}if((a[b+((T*6|0)+(af+7))|0]&1|0)!=(af&1|0)){E=-1}if((a[b+((aa(af+7|0,T)|0)+6)|0]&1|0)!=(af&1|0)){E=-2}o=b+((T*6|0)+(af+7))|0;a[o]=(a[o]|2)&255;o=b+((aa(af+7|0,T)|0)+6)|0;a[o]=(a[o]|2)&255;af=af+1|0}if((a[b+((aa(T-7-1|0,T)|0)+8)|0]&1|0)==0){E=-3}o=b+((aa(T-7-1|0,T)|0)+8)|0;a[o]=(a[o]|2)&255;if((ac|0)!=0){af=6;while(1){if((af|0)>=(K|0)){break}N=6;while(1){if((N|0)>=(T|0)){break}do{if((af|0)<8){if((N|0)<=6){z=1077;break}if((N|0)<(T-8|0)){z=1082}else{z=1077}}else{z=1077}}while(0);L1452:do{if((z|0)==1077){z=0;do{if((N|0)<8){if((af|0)<=6){break}if((af|0)<(K-8|0)){z=1082;break L1452}}}while(0);if((af|0)<=6){break}if((N|0)>6){z=1082}}}while(0);if((z|0)==1082){z=0;v=-2;while(1){if((v|0)>=3){break}o=-2;while(1){if((o|0)>=3){break}Q=b+((aa(af+v|0,T)|0)+(N+o))|0;a[Q]=(a[Q]|2)&255;o=o+1|0}v=v+1|0}}do{if((N|0)==6){z=1094}else{if((l|0)==0){z=1094;break}an=l}}while(0);if((z|0)==1094){z=0;an=ac}N=N+an|0}do{if((af|0)==6){z=1100}else{if((l|0)==0){z=1100;break}ao=l}}while(0);if((z|0)==1100){z=0;ao=ac}af=af+ao|0}}af=0;while(1){if((af|0)>=64){break}v=b+(((af|0)%8|0)+(aa(T,(af|0)/8|0)|0))|0;a[v]=(a[v]|2)&255;v=b+(T-8+((af|0)%8|0)+(aa(T,(af|0)/8|0)|0))|0;a[v]=(a[v]|2)&255;v=b+(((af|0)%8|0)+(aa(T,T-8+((af|0)/8|0)|0)|0))|0;a[v]=(a[v]|2)&255;af=af+1|0}if((I|0)>6){af=0;while(1){if((af|0)>=18){break}v=b+(T-11+((af|0)%3|0)+(aa(T,(af|0)/3|0)|0))|0;a[v]=(a[v]|2)&255;v=b+(((af|0)%6|0)+(aa(T,T-11+((af|0)/6|0)|0)|0))|0;a[v]=(a[v]|2)&255;af=af+1|0}}af=0;while(1){if((af|0)>=15){break}v=T<<3;if((af|0)<8){ap=T-af-1|0}else{if((af|0)<9){aq=7}else{aq=14-af|0}ap=aq}Z=Z|(a[b+(v+ap)|0]&1)<<af;v=T<<3;if((af|0)<8){ar=T-af-1|0}else{if((af|0)<9){as=7}else{as=14-af|0}ar=as}o=b+(v+ar)|0;a[o]=(a[o]|2)&255;af=af+1|0}af=0;while(1){if((af|0)>=15){break}o=T;if((af|0)<6){at=af}else{if((af|0)<8){av=af+1|0}else{av=af+T-7-8|0}at=av}N=a[b+((aa(o,at)|0)+8)|0]&1;if((Z>>af&1|0)!=(N|0)){E=-4}o=T;if((af|0)<6){aw=af}else{if((af|0)<8){ax=af+1|0}else{ax=af+T-7-8|0}aw=ax}v=b+((aa(o,aw)|0)+8)|0;a[v]=(a[v]|2)&255;af=af+1|0}Z=Z^21522;af=0;while(1){if((af|0)>=15){break}af=af+1|0}S=7&Z>>10;v=0;o=31&Z>>10;o=o<<5;af=0;while(1){if((af|0)>=5){break}v=v<<1;o=o<<1;if(((v^o)&1024|0)!=0){v=v^311}af=af+1|0}o=o&31744|v&1023;x=1^3&Z>>13;af=0;while(1){if((af|0)>=(aa(T,K)|0)){break}af=af+1|0}af=0;v=0;while(1){if((v|0)>=(T|0)){break}ay=0;while(1){if((ay|0)>=(T|0)){break}o=(aa(v,T)|0)+ay|0;if((a[b+o|0]&6|0)==0){if((S|0)==0){if(((v+ay|0)%2|0|0)==0){z=1183}else{z=1169}}else{z=1169}do{if((z|0)==1169){z=0;if((S|0)==1){if(((v|0)%2|0|0)==0){z=1183;break}}if((S|0)==2){if(((ay|0)%3|0|0)==0){z=1183;break}}if((S|0)==3){if(((v+ay|0)%3|0|0)==0){z=1183;break}}if((S|0)==4){if(((((v|0)/2|0)+((ay|0)/3|0)|0)%2|0|0)==0){z=1183;break}}if((S|0)==5){if((((aa(v,ay)|0)%2|0)+((aa(v,ay)|0)%3|0)|0)==0){z=1183;break}}if((S|0)==6){if(((((aa(v,ay)|0)%2|0)+((aa(v,ay)|0)%3|0)|0)%2|0|0)==0){z=1183;break}}if((S|0)!=7){break}if(((((aa(v,ay)|0)%3|0)+((v+ay|0)%2|0)|0)%2|0|0)==0){z=1183}}}while(0);if((z|0)==1183){z=0;Q=b+o|0;a[Q]=(a[Q]^1)&255}}if((a[b+o|0]&6|0)==0){af=af+1|0}ay=ay+1|0}v=v+1|0}F=af;af=0;while(1){if((af|0)>=(aa(T,K)|0)){break}af=af+1|0}u=ev((aa(T,T)|0)/8|0)|0;A=0;Q=0;D=(c[520+((I-1|0)*56|0)+((x<<1)+6<<2)>>2]|0)+(c[520+((I-1|0)*56|0)+((x<<1)+7<<2)>>2]|0)|0;R=c[520+((I-1|0)*56|0)+(x+2<<2)>>2]|0;G=(c[520+((I-1|0)*56|0)>>2]|0)-R|0;N=-1;y=T-1|0;ay=y;v=y;if((u|0)!=0){while(1){if((ay|0)>=0){az=(v|0)>=0}else{az=0}if(!az){break}y=(aa(v,T)|0)+ay|0;M=c[520+((I-1|0)*56|0)+((x<<1)+6<<2)>>2]|0;L=c[520+((I-1|0)*56|0)+((x<<1)+7<<2)>>2]|0;if((a[b+y|0]&6|0)==0){Q=Q<<1|a[b+y|0]&1;A=A+1|0;if((A&7|0)==0){if((((A|0)/8|0)-1|0)<(G|0)){aA=((((A|0)/8|0)-1|0)/(D|0)|0)+(aa((((A|0)/8|0)-1|0)%(D|0)|0,(G|0)/(D|0)|0)|0)|0;if((aA|0)>=(aa(M,(G|0)/(D|0)|0)|0)){aA=((((A|0)/8|0)-1-M|0)/(D|0)|0)+(aa((((A|0)/8|0)-1-M|0)%(D|0)|0,((G|0)/(D|0)|0)+1|0)|0)+(aa(M,(G|0)/(D|0)|0)|0)|0}if((((A|0)/8|0)-1|0)>=(G-L|0)){aA=((((A|0)/8|0)-1|0)/(D|0)|0)+(aa((((A|0)/8|0)-1|0)%(D|0)|0,((G|0)/(D|0)|0)+1|0)|0)+(aa(M,(G|0)/(D|0)|0)|0)|0}}else{aA=((((A|0)/8|0)-G-1|0)/(D|0)|0)+(aa((((A|0)/8|0)-G-1|0)%(D|0)|0,(R|0)/(D|0)|0)|0)+G|0;if(((((A|0)/8|0)-1|0)/(D|0)|0|0)>=(((F|0)/8|0)-L|0)){aA=aA+(((F|0)/8|0)-L+((((A|0)/8|0)-1|0)%(D|0)|0))|0}}a[u+aA|0]=Q&255;if(((A|0)/8|0|0)==(G-L|0)){af=0;while(1){if((af|0)>=(M|0)){break}af=af+1|0}}Q=0}}do{if(((ay|0)%2|0|0)==(((ay|0)<6?1:0)|0)){z=1221}else{if((ay|0)==6){z=1221;break}do{if((v+N|0)>=0){if((v+N|0)>=(T|0)){z=1225;break}v=v+N|0;ay=ay+1|0}else{z=1225}}while(0);if((z|0)==1225){z=0;ay=ay-1|0;N=N*-1|0}}}while(0);if((z|0)==1221){z=0;ay=ay-1|0}}}v=0;Q=0;o=G;M=0;L=c[520+((I-1|0)*56|0)+((x<<1)+6<<2)>>2]|0;y=c[520+((I-1|0)*56|0)+((x<<1)+7<<2)>>2]|0;af=0;while(1){if((af|0)>=(L+y|0)){break}if((af|0)==0){z=1233}else{if((af|0)==(L|0)){z=1233}}if((z|0)==1233){z=0;v=(G|0)/(L+y|0)|0;if((af|0)==(L|0)){v=v+1|0}Q=(R|0)/(L+y|0)|0;bR(8,285,0,1,Q,255-v-Q|0)}bO(25472,u+M|0,g|0);N=0;while(1){if((N|0)>=(Q|0)){break}if((d[g+N|0]|0)!=(d[u+(o+N)|0]|0)){z=1239;break}N=N+1|0}if((z|0)==1239){z=0;E=-3}M=M+v|0;o=o+Q|0;af=af+1|0}if((I|0)<=40){ae=3080}if((I|0)<=26){ae=3144}if((I|0)<=9){ae=3208}Y=0;Q=0;C=0;W=0;o=0;v=1023;M=0;if((t|0)==0){t=ev(((F*3|0|0)/10|0)+1|0)|0}if((t|0)!=0){A=0;L1696:while(1){if((A|0)>=(G<<3|0)){break}o=o<<1|1&d[u+((A|0)/8|0)|0]>>7-((A|0)%8|0);Y=Y+1|0;Q=Q+1|0;do{if((U|0)==0){if((Y|0)!=4){break}U=o&15;o=0;Q=0;C=0}}while(0);do{if((C|0)==0){if((c[ae+(U<<2)>>2]|0)==0){break}if((c[ae+(U<<2)>>2]|0)!=(Y|0)){break}C=o;o=0;Q=0;v=c[456+(U<<2)>>2]|0;if((C|0)==0){U=0;Y=0}}}while(0);if((W|0)==0){a[t|0]=0}do{if((U|0)==0){z=1268}else{if((C|0)==0){z=1268;break}if((V|0)>=(C|0)){break}if((Q|0)<(v|0)){break}M=t+W|0;if((W+(c[392+(U<<2)>>2]|0)|0)>=((F*3|0|0)/10|0|0)){z=1274;break L1696}if((U|0)==8){y=((o|0)/192|0)+((o|0)%192|0)|0;if((y+33088|0)<=40956){y=y+33088|0}else{y=y+49472|0}a[t+W|0]=y>>8&255;a[t+(W+1)|0]=y&255;W=W+2|0;V=V+2|0;if((C-V|0)==1){v=8}}if((U|0)==4){a[t+W|0]=o&255;W=W+1|0;V=V+1|0}if((U|0)==2){y=((o|0)/45|0|0)%45|0;L=(o|0)%45|0;R=h;eB(R|0,3272,10)|0;if((v|0)==11){a[t+W|0]=y+48&255;a[t+(W+1)|0]=L+48&255;if((y|0)>9){a[t+W|0]=y-10+65&255}if((L|0)>9){a[t+(W+1)|0]=L-10+65&255}if((y|0)>35){a[t+W|0]=a[h+(y-36)|0]|0}if((L|0)>35){a[t+(W+1)|0]=a[h+(L-36)|0]|0}W=W+2|0;V=V+2|0;if((C-V|0)==1){v=6}}else{if((v|0)==6){a[t+W|0]=L+48&255;if((L|0)>9){a[t+W|0]=L-10+65&255}if((L|0)>35){a[t+W|0]=a[h+(L-36)|0]|0}W=W+1|0;V=V+1|0;v=0}}}if((U|0)==1){if((v|0)==10){a[t+W|0]=((o|0)/100|0)+48&255;a[t+(W+1)|0]=(((o|0)/10|0|0)%10|0)+48&255;a[t+(W+2)|0]=((o|0)%10|0)+48&255;W=W+3|0;V=V+3|0}if((v|0)==7){a[t+W|0]=((o|0)/10|0)+48&255;a[t+(W+1)|0]=((o|0)%10|0)+48&255;W=W+2|0;V=V+2|0;v=0}if((v|0)==4){a[t+W|0]=((o|0)%10|0)+48&255;W=W+1|0;V=V+1|0;v=0}if((C-V|0)==1){v=4}if((C-V|0)==2){v=7}}if((W|0)<=((F*3|0|0)/10|0|0)){a[t+W|0]=0}o=0;Q=0;if((V|0)>=(C|0)){V=0;C=0;U=0;Y=0}}}while(0);if((z|0)==1268){z=0}A=A+1|0}if((z|0)==1274){Q=c[n>>2]|0;au(Q|0,18408,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}}}else{au(c[n>>2]|0,18360,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}}}while(0);if((E|0)>0){X=ev(4e3)|0;do{if((X|0)!=0){if((t|0)==0){break}a[X|0]=95;a[X+1|0]=0;F=X;ac=I;l=W;ad=x;Q=t;aP(F|0,18272,(m=i,i=i+32|0,c[m>>2]=ac,c[m+8>>2]=l,c[m+16>>2]=ad,c[m+24>>2]=Q,m)|0)|0;i=m}}while(0)}if((E|0)<0){X=ev(128)|0;if((X|0)!=0){Q=X;eE(Q|0,18208,128)|0}}if((t|0)!=0){ew(t)}if((u|0)!=0){ew(u)}J=0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){aB=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{aB=0}if(!aB){break}w=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;ah=c[w>>2]|0;ai=(c[w+4>>2]|0)-ah+1|0;aj=c[w+8>>2]|0;ak=(c[w+12>>2]|0)-aj+1|0;do{if((ah|0)>=(s-((c[f+8>>2]|0)/14|0)|0)){if((aj|0)<(ag-((c[f+12>>2]|0)/14|0)|0)){break}if((ah+ai|0)>(s+r+((c[f+8>>2]|0)/14|0)|0)){break}if((aj+ak|0)>(ag+q+((c[f+12>>2]|0)/14|0)|0)){break}c[w+36>>2]=57345;c[w>>2]=s;c[w+8>>2]=ag;c[w+4>>2]=s+r-1;c[w+12>>2]=ag+q-1;if((J|0)!=0){p=p+1|0;Q=j+84|0;ad=w;cw(Q,ad)|0;ad=w;bV(ad)|0}else{J=w;if((X|0)!=0){ad=J;Q=X;dx(ad,Q,99)|0}}}}while(0);c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}if((X|0)!=0){ew(X)}if((c[j+37072>>2]|0)!=0){q=c[n>>2]|0;ag=p;au(q|0,20616,(m=i,i=i+8|0,c[m>>2]=ag,m)|0)|0;i=m}p=0}}while(0);k=0;c[j+37044>>2]=0;c[j+37040>>2]=0;c[j+37048>>2]=0;if((cy(j+84|0)|0)==0){while(1){if((c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=0){aC=(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)!=(j+96|0)}else{aC=0}if(!aC){break}k=k+1|0;J=c[(c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[J+36>>2]|0)!=57345){p=j+37048|0;c[p>>2]=(c[p>>2]|0)+1;p=j+37040|0;c[p>>2]=(c[p>>2]|0)+((c[J+4>>2]|0)-(c[J>>2]|0)+1);p=j+37044|0;c[p>>2]=(c[p>>2]|0)+((c[J+12>>2]|0)-(c[J+8>>2]|0)+1)}c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]=c[c[(c[j+108>>2]|0)+(c[j+116>>2]<<2)>>2]>>2]}cz(j+84|0)}if((c[j+37072>>2]|0)==0){i=e;return 0}J=c[j+37048>>2]|0;au(c[n>>2]|0,20584,(m=i,i=i+16|0,c[m>>2]=k,c[m+8>>2]=J,m)|0)|0;i=m;i=e;return 0}function bR(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;k=i;l=b;b=e;e=f;f=g;g=h;c[6368]=l;c[6369]=(1<<l)-1;c[6566]=j;c[6562]=g;a[25736]=c[6369]&255;a[25480+(c[6369]|0)|0]=0;j=1;l=0;while(1){if((l|0)>=255){break}a[25736+j|0]=l&255;a[25480+l|0]=j&255;j=j<<1;if((j|0)>=256){j=j^b}l=l+1|0}if((j|0)!=1){b=c[n>>2]|0;h=j;au(b|0,18144,(b=i,i=i+8|0,c[b>>2]=h,b)|0)|0;i=b}b=1;while(1){if(((b|0)%(f|0)|0|0)==0){break}b=b+(c[6369]|0)|0}c[6565]=(b|0)/(f|0)|0;a[25992]=1;l=0;b=aa(e,f)|0;while(1){if((l|0)>=(g|0)){break}a[l+25993|0]=1;e=l;while(1){if((e|0)<=0){break}if((d[25992+e|0]|0|0)!=0){h=d[25992+(e-1)|0]|0;a[25992+e|0]=(h^(d[25480+(bP(25472,(d[25736+(d[25992+e|0]|0)|0]|0)+b|0)|0)|0]|0))&255}else{a[25992+e|0]=a[25992+(e-1)|0]|0}e=e-1|0}a[25992]=a[25480+(bP(25472,(d[25736+(d[25992]|0)|0]|0)+b|0)|0)|0]|0;l=l+1|0;b=b+f|0}l=0;while(1){if((l|0)>(g|0)){break}a[25992+l|0]=a[25736+(d[25992+l|0]|0)|0]|0;l=l+1|0}i=k;return}function bS(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,o=0,p=0,q=0,r=0;k=i;l=b;b=d;d=e;e=f;f=g;g=h;h=j;do{if((c[g>>2]|0)!=0){if((e|0)<0){break}if((f|0)<0){break}if((aa(e,f)|0)>(h|0)){break}c[g+4>>2]=e;c[g+8>>2]=f;c[g+12>>2]=1;j=0;while(1){if((j|0)>=(f|0)){break}m=0;while(1){if((m|0)>=(e|0)){break}o=(d8(l,m+b|0,j+d|0)|0)&255;p=m+(aa(j,c[g+4>>2]|0)|0)|0;a[(c[g>>2]|0)+p|0]=o;m=m+1|0}j=j+1|0}q=0;r=q;i=k;return r|0}}while(0);au(c[n>>2]|0,18512,(g=i,i=i+32|0,c[g>>2]=b,c[g+8>>2]=d,c[g+16>>2]=e,c[g+24>>2]=f,g)|0)|0;i=g;q=1;r=q;i=k;return r|0}function bT(a){a=a|0;var b=0;b=a;a=0;while(1){if((a|0)>=(c[b+72>>2]|0)){break}if((c[b+156+(a<<2)>>2]|0)!=0){ew(c[b+156+(a<<2)>>2]|0);c[b+156+(a<<2)>>2]=0}a=a+1|0}c[b+72>>2]=0;return 0}function bU(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=a;a=ev(1320)|0;if((a|0)==0){d=0;e=d;return e|0}if((b|0)!=0){f=a;g=b;eB(f|0,g|0,1320)|0;g=0;while(1){if((g|0)>=(c[b+72>>2]|0)){break}if((c[b+156+(g<<2)>>2]|0)!=0){c[a+156+(g<<2)>>2]=ev((eA(c[b+156+(g<<2)>>2]|0)|0)+1|0)|0;f=c[a+156+(g<<2)>>2]|0;h=c[b+156+(g<<2)>>2]|0;i=(eA(c[b+156+(g<<2)>>2]|0)|0)+1|0;eB(f|0,h|0,i)|0}g=g+1|0}}else{c[a+72>>2]=0;c[a+196>>2]=0}d=a;e=d;return e|0}function bV(a){a=a|0;var b=0,c=0,d=0;b=a;if((b|0)!=0){a=b;bT(a)|0;ew(b);c=0;d=c;return d|0}else{c=0;d=c;return d|0}return 0}function bW(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0.0,j=0,k=0,l=0,m=0,o=0,p=0.0,q=0,r=0;d=i;e=a;a=1024;f=0;g=2;h=-1.0;if((b|0)!=1){b=c[n>>2]|0;au(b|0,23976,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b}b=1;j=0;while(1){if((j|0)>=(c[e+196>>2]|0)){break}while(1){if((b|0)>=((c[e+264+(j<<2)>>2]|0)-1|0)){break}k=(c[e+296+(b<<3)>>2]|0)-(c[e+296+(b-1<<3)>>2]|0)|0;l=(c[e+296+(b<<3)+4>>2]|0)-(c[e+296+(b-1<<3)+4>>2]|0)|0;m=(c[e+296+(b+1<<3)>>2]|0)-(c[e+296+(b<<3)>>2]|0)|0;o=(c[e+296+(b+1<<3)+4>>2]|0)-(c[e+296+(b<<3)+4>>2]|0)|0;p=+(aa(P((aa(k,m)|0)+(aa(l,o)|0)|0)|0,(aa(k,m)|0)+(aa(l,o)|0)|0)|0)/(+((aa(k,k)|0)+(aa(l,l)|0)|0)*1.0*+((aa(m,m)|0)+(aa(o,o)|0)|0))-1.0;if(p<0.0){p=-0.0-p}q=aa((aa(m,m)|0)+(aa(o,o)|0)|0,(aa(k,k)|0)+(aa(l,l)|0)|0)|0;if(+(q|0)*p*p*p*p<+(a|0)*h*h*h*h){r=1461}else{if(h<0.0){r=1461}}if((r|0)==1461){r=0;h=p;f=j;g=b;a=q}b=b+1|0}j=j+1|0}if((c[e+196>>2]|0)>0){b=g;while(1){if((b|0)>=((c[e+264+((c[e+196>>2]|0)-1<<2)>>2]|0)-1|0)){break}c[e+296+(b<<3)>>2]=c[e+296+(b+1<<3)>>2];c[e+296+(b<<3)+4>>2]=c[e+296+(b+1<<3)+4>>2];b=b+1|0}}j=f;while(1){if((j|0)>=(c[e+196>>2]|0)){break}f=e+264+(j<<2)|0;c[f>>2]=(c[f>>2]|0)-1;j=j+1|0}i=d;return 0}function bX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+1320|0;e=d|0;f=a;a=b;b=aa((c[a+4>>2]|0)-(c[a>>2]|0)+1|0,(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0)|0;if((b|0)>(aa((c[f+4>>2]|0)-(c[f>>2]|0)+1|0,(c[f+12>>2]|0)-(c[f+8>>2]|0)+1|0)|0)){g=a;h=f}else{g=f;h=a}do{if((c[a+8>>2]|0)>(c[f+12>>2]|0)){j=1484}else{if((c[a+12>>2]|0)<(c[f+8>>2]|0)){j=1484;break}if((c[a>>2]|0)>(c[f+4>>2]|0)){j=1484;break}if((c[a+4>>2]|0)<(c[f>>2]|0)){j=1484;break}if((c[a+28>>2]|0)>(c[f+28>>2]|0)){c[f+28>>2]=c[a+28>>2]}c[f+32>>2]=c[g+32>>2]}}while(0);if((j|0)==1484){b=f+28|0;c[b>>2]=(c[b>>2]|0)+(c[a+28>>2]|0);do{if((c[f+12>>2]<<2|0)<(((c[a+8>>2]|0)*3|0)+(c[a+12>>2]|0)|0)){if((c[f+8>>2]|0)>=(c[a+8>>2]|0)){break}b=a+24|0;c[b>>2]=(c[b>>2]|0)+1}}while(0)}b=f+24|0;c[b>>2]=(c[b>>2]|0)+(c[a+24>>2]|0);if((c[a>>2]|0)<(c[f>>2]|0)){c[f>>2]=c[a>>2]}if((c[a+4>>2]|0)>(c[f+4>>2]|0)){c[f+4>>2]=c[a+4>>2]}if((c[a+8>>2]|0)<(c[f+8>>2]|0)){c[f+8>>2]=c[a+8>>2]}if((c[a+12>>2]|0)>(c[f+12>>2]|0)){c[f+12>>2]=c[a+12>>2]}a=0;b=0;if((c[g+196>>2]|0)!=0){b=c[g+264+((c[g+196>>2]|0)-1<<2)>>2]|0}if((c[h+196>>2]|0)!=0){a=c[h+264+((c[h+196>>2]|0)-1<<2)>>2]|0}while(1){if((b+a|0)<=128){break}if((b|0)>(a|0)){k=g;bW(k,1)|0;b=b-1|0}else{k=h;bW(k,1)|0;a=a-1|0}}a=e;k=g;eB(a|0,k|0,1320)|0;k=0;a=0;while(1){if((k|0)>=(c[h+196>>2]|0)){j=1525;break}if((c[e+196>>2]|0)>=8){j=1512;break}while(1){if((a|0)>=(c[h+264+(k<<2)>>2]|0)){break}g=e+296+(b<<3)|0;l=h+296+(a<<3)|0;c[g>>2]=c[l>>2];c[g+4>>2]=c[l+4>>2];b=b+1|0;a=a+1|0}c[e+264+(c[e+196>>2]<<2)>>2]=b;c[e+200+(c[e+196>>2]<<2)>>2]=c[h+200+(k<<2)>>2];c[e+232+(c[e+196>>2]<<2)>>2]=c[h+232+(k<<2)>>2];l=e+196|0;c[l>>2]=(c[l>>2]|0)+1;if((c[e+196>>2]|0)>=8){j=1518;break}k=k+1|0}if((j|0)==1525){m=e+196|0;o=c[m>>2]|0;p=f;q=p+196|0;c[q>>2]=o;r=f;s=r+264|0;t=s;u=e+264|0;v=u;eB(t|0,v|0,32)|0;w=f;x=w+200|0;y=x;z=e+200|0;A=z;eB(y|0,A|0,32)|0;B=f;C=B+232|0;D=C;E=e+232|0;F=E;eB(D|0,F|0,32)|0;G=f;H=G+296|0;I=H;J=e+296|0;K=J;eB(I|0,K|0,1024)|0;i=d;return 0}else if((j|0)==1518){if((c[(c[7036]|0)+37072>>2]|0)!=0){k=c[n>>2]|0;au(k|0,16848,(k=i,i=i+1|0,i=i+7&-8,c[k>>2]=0,k)|0)|0;i=k}m=e+196|0;o=c[m>>2]|0;p=f;q=p+196|0;c[q>>2]=o;r=f;s=r+264|0;t=s;u=e+264|0;v=u;eB(t|0,v|0,32)|0;w=f;x=w+200|0;y=x;z=e+200|0;A=z;eB(y|0,A|0,32)|0;B=f;C=B+232|0;D=C;E=e+232|0;F=E;eB(D|0,F|0,32)|0;G=f;H=G+296|0;I=H;J=e+296|0;K=J;eB(I|0,K|0,1024)|0;i=d;return 0}else if((j|0)==1512){m=e+196|0;o=c[m>>2]|0;p=f;q=p+196|0;c[q>>2]=o;r=f;s=r+264|0;t=s;u=e+264|0;v=u;eB(t|0,v|0,32)|0;w=f;x=w+200|0;y=x;z=e+200|0;A=z;eB(y|0,A|0,32)|0;B=f;C=B+232|0;D=C;E=e+232|0;F=E;eB(D|0,F|0,32)|0;G=f;H=G+296|0;I=H;J=e+296|0;K=J;eB(I|0,K|0,1024)|0;i=d;return 0}return 0}function bY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;b=i;d=a;a=0;if((a|0)!=0){e=c[n>>2]|0;f=c[d>>2]|0;g=c[d+8>>2]|0;au(e|0,12432,(h=i,i=i+16|0,c[h>>2]=f,c[h+8>>2]=g,h)|0)|0;i=h}g=0;while(1){if((g|0)>=(c[d+196>>2]|0)){break}if((a|0)>2){f=c[n>>2]|0;e=g;au(f|0,9608,(h=i,i=i+8|0,c[h>>2]=e,h)|0)|0;i=h}c[d+232+(g<<2)>>2]=0;if((g|0)!=0){j=c[d+264+(g-1<<2)>>2]|0}else{j=0}k=j;l=c[d+264+(g<<2)>>2]|0;m=k;while(1){if((m|0)>=(l|0)){break}o=c[d+296+(m<<3)>>2]|0;p=c[d+296+(m<<3)+4>>2]|0;do{if((o|0)>=(c[d>>2]|0)){if((o|0)>(c[d+4>>2]|0)){break}if((p|0)<(c[d+8>>2]|0)){break}if((p|0)>(c[d+12>>2]|0)){break}e=d+232+(g<<2)|0;c[e>>2]=c[e>>2]|1}}while(0);do{if((o|0)<(c[d>>2]|0)){q=1547}else{if((o|0)>(c[d+4>>2]|0)){q=1547;break}if((p|0)<(c[d+8>>2]|0)){q=1547;break}if((p|0)>(c[d+12>>2]|0)){q=1547}}}while(0);if((q|0)==1547){q=0;e=d+232+(g<<2)|0;c[e>>2]=c[e>>2]|2}m=m+1|0}if((a|0)>2){e=c[n>>2]|0;f=c[d+232+(g<<2)>>2]|0;au(e|0,8568,(h=i,i=i+8|0,c[h>>2]=f,h)|0)|0;i=h}if((c[d+232+(g<<2)>>2]|0)==2){if((a|0)>1){f=c[n>>2]|0;e=g;au(f|0,7480,(h=i,i=i+8|0,c[h>>2]=e,h)|0)|0;i=h}m=k;while(1){if((m|0)>=((c[d+264+((c[d+196>>2]|0)-1<<2)>>2]|0)-(l-k)|0)){break}c[d+296+(m<<3)>>2]=c[d+296+(m+l-k<<3)>>2];c[d+296+(m<<3)+4>>2]=c[d+296+(m+l-k<<3)+4>>2];m=m+1|0}m=g;while(1){if((m|0)>=((c[d+196>>2]|0)-1|0)){break}c[d+264+(m<<2)>>2]=(c[d+264+(m+1<<2)>>2]|0)-(l-k);c[d+200+(m<<2)>>2]=c[d+200+(m+1<<2)>>2];c[d+232+(m<<2)>>2]=c[d+232+(m+1<<2)>>2];m=m+1|0}e=d+196|0;c[e>>2]=(c[e>>2]|0)-1;g=g-1|0}g=g+1|0}l=0;g=0;while(1){if((g|0)>=(c[d+196>>2]|0)){break}if((a|0)>2){j=c[n>>2]|0;e=g;au(j|0,6432,(h=i,i=i+8|0,c[h>>2]=e,h)|0)|0;i=h}o=c[d+296>>2]|0;p=c[d+300>>2]|0;do{if((o|0)<(c[d>>2]|0)){q=1574}else{if((o|0)>(c[d+4>>2]|0)){q=1574;break}if((p|0)<(c[d+8>>2]|0)){q=1574;break}if((p|0)>(c[d+12>>2]|0)){q=1574}}}while(0);if((q|0)==1574){q=0;l=1}k=0;while(1){if((k|0)>=(c[d+264+(g<<2)>>2]|0)){break}e=o;j=p;o=c[d+296+(k<<3)>>2]|0;p=c[d+296+(k<<3)+4>>2]|0;do{if((o|0)<(c[d>>2]|0)){q=1581}else{if((o|0)>(c[d+4>>2]|0)){q=1581;break}if((p|0)<(c[d+8>>2]|0)){q=1581;break}if((p|0)>(c[d+12>>2]|0)){q=1581;break}if((l|0)!=0){if((e|0)<(c[d>>2]|0)){e=c[d>>2]|0}if((e|0)>(c[d+4>>2]|0)){e=c[d+4>>2]|0}if((j|0)<(c[d+8>>2]|0)){j=c[d+8>>2]|0}if((j|0)>(c[d+12>>2]|0)){j=c[d+12>>2]|0}f=e;c[d+296+(k<<3)>>2]=f;o=f;f=j;c[d+296+(k<<3)+4>>2]=f;p=f;l=0}}}while(0);if((q|0)==1581){q=0;if((l|0)==0){if((o|0)<(c[d>>2]|0)){j=c[d>>2]|0;c[d+296+(k<<3)>>2]=j;o=j}if((o|0)>(c[d+4>>2]|0)){j=c[d+4>>2]|0;c[d+296+(k<<3)>>2]=j;o=j}if((p|0)<(c[d+8>>2]|0)){j=c[d+8>>2]|0;c[d+296+(k<<3)+4>>2]=j;p=j}if((p|0)>(c[d+12>>2]|0)){j=c[d+12>>2]|0;c[d+296+(k<<3)+4>>2]=j;p=j}}else{if((a|0)>1){j=c[n>>2]|0;e=g;f=k;r=o-(c[d>>2]|0)|0;s=p-(c[d+8>>2]|0)|0;au(j|0,5368,(h=i,i=i+32|0,c[h>>2]=e,c[h+8>>2]=f,c[h+16>>2]=r,c[h+24>>2]=s,h)|0)|0;i=h}m=k;while(1){if((m|0)>=((c[d+264+((c[d+196>>2]|0)-1<<2)>>2]|0)-1|0)){break}c[d+296+(m<<3)>>2]=c[d+296+(m+1<<3)>>2];c[d+296+(m<<3)+4>>2]=c[d+296+(m+1<<3)+4>>2];m=m+1|0}m=g;while(1){if((m|0)>=(c[d+196>>2]|0)){break}s=d+264+(m<<2)|0;c[s>>2]=(c[s>>2]|0)-1;m=m+1|0}k=k-1|0}l=l+1|0}k=k+1|0}g=g+1|0}if((a|0)<=2){i=b;return 0}au(c[n>>2]|0,4536,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h;dk(d);i=b;return 0}function bZ(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+536|0;e=d|0;f=d+264|0;g=d+528|0;h=b;b=f;eC(b|0,0,257)|0;j=b;a[j|0]=46;a[j+1|0]=47;a[j+2|0]=100;a[j+3|0]=98;a[j+4|0]=47;if((c[h+37084>>2]|0)!=0){j=f|0;b=c[h+37084>>2]|0;eE(j|0,b|0,255)|0}b=eA(f|0)|0;if((c[h+37072>>2]|0)!=0){j=c[n>>2]|0;k=f|0;l=c[h+37084>>2]|0;au(j|0,17824,(m=i,i=i+16|0,c[m>>2]=k,c[m+8>>2]=l,m)|0)|0;i=m}eE(f+b|0,23872,256-b|0)|0;a[f+256|0]=0;l=aA(f|0,16824)|0;if((l|0)==0){k=c[n>>2]|0;j=f|0;au(k|0,12384,(m=i,i=i+8|0,c[m>>2]=j,m)|0)|0;i=m;o=1;p=o;i=d;return p|0}j=0;k=0;L2198:while(1){if(!((aG(l|0)|0)!=0^1)){break}if((ax(e|0,256,l|0)|0)==0){q=1631;break}j=j+1|0;r=eA(e|0)|0;while(1){if((r|0)>0){if((a[e+(r-1)|0]|0)==13){s=1}else{s=(a[e+(r-1)|0]|0)==10}t=s}else{t=0}if(!t){break}u=r-1|0;r=u;a[e+u|0]=0}do{if((r|0)!=0){if((a[e|0]|0)==35){break}u=0;while(1){do{if((u|0)<(r|0)){if((u+b|0)>=256){v=0;break}v=(aC(9592,a[e+u|0]|0)|0)==0}else{v=0}}while(0);if(!v){break}a[f+(b+u)|0]=a[e+u|0]|0;u=u+1|0}a[f+(b+u)|0]=0;while(1){if((u|0)<(r|0)){w=(aC(8560,a[e+u|0]|0)|0)!=0}else{w=0}if(!w){break}u=u+1|0}x=ev(16)|0;if((x|0)==0){y=c[n>>2]|0;au(y|0,7448,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((ec(f|0,x,0)|0)!=0){q=1659;break L2198}y=bU(0)|0;if((y|0)==0){z=c[n>>2]|0;au(z|0,5336,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}c[y>>2]=0;c[y+4>>2]=(c[x+4>>2]|0)-1;c[y+8>>2]=0;c[y+12>>2]=(c[x+8>>2]|0)-1;c[y+16>>2]=1;c[y+20>>2]=1;c[y+24>>2]=0;c[y+36>>2]=0;c[y+40>>2]=0;c[y+156>>2]=0;c[y+76>>2]=0;c[y+116>>2]=100;c[y+72>>2]=1;if((a[e+u|0]|0)==34){r=(aQ(e+u+1|0,34)|0)-(e+u+1)|0;if((r|0)>=1){c[g>>2]=ev(r+1|0)|0;if((c[g>>2]|0)==0){z=c[n>>2]|0;au(z|0,4504,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}if((c[g>>2]|0)!=0){z=c[g>>2]|0;A=e+u+1|0;B=r;eB(z|0,A|0,B)|0;a[(c[g>>2]|0)+r|0]=0;c[y+156>>2]=c[g>>2]}}else{B=c[n>>2]|0;A=j;au(B|0,25112,(m=i,i=i+8|0,c[m>>2]=A,m)|0)|0;i=m}}else{A=a[e+u|0]|0;c[y+36>>2]=A;c[y+76>>2]=A;c[g>>2]=e+u;r=aV(e+u|0,g|0,16)|0;do{if((r|0)!=0){if((u+3|0)>256){break}if(((c[g>>2]|0)-e-u|0)<=3){break}A=r;c[y+36>>2]=A;c[y+76>>2]=A}}while(0)}c[y+44>>2]=0;c[y+48>>2]=-1;c[y+52>>2]=0;c[y+56>>2]=0;c[y+60>>2]=0;c[y+64>>2]=0;c[y+68>>2]=x;cu(h+48|0,y)|0}}while(0);k=k+1|0}if((q|0)!=1631)if((q|0)==1659){au(c[n>>2]|0,6400,(m=i,i=i+8|0,c[m>>2]=f,m)|0)|0;i=m;aO(-1|0);return 0}aq(l|0)|0;if((c[h+37072>>2]|0)!=0){h=c[n>>2]|0;l=k;au(h|0,24544,(m=i,i=i+8|0,c[m>>2]=l,m)|0)|0;i=m}o=0;p=o;i=d;return p|0}function b_(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+544|0;g=f|0;h=f+264|0;j=f+528|0;k=b;b=e;e=g;eC(e|0,0,257)|0;l=e;a[l|0]=46;a[l+1|0]=47;a[l+2|0]=100;a[l+3|0]=98;a[l+4|0]=47;if((c[b+37084>>2]|0)!=0){l=g|0;e=c[b+37084>>2]|0;eE(l|0,e|0,255)|0}e=eA(g|0)|0;do{if((c[k+72>>2]|0)!=0){if((c[k+156>>2]|0)==0){m=1689;break}o=d[c[k+156>>2]|0]|0}else{m=1689}}while(0);if((m|0)==1689){o=c[k+36>>2]|0}l=o;o=a$(0)|0;aP(h|0,23688,(p=i,i=i+16|0,c[p>>2]=l,c[p+8>>2]=o,p)|0)|0;i=p;eE(g+e|0,23872,256-e|0)|0;a[g+256|0]=0;o=aA(g|0,22840)|0;if((o|0)==0){q=c[n>>2]|0;r=g|0;au(q|0,21040,(p=i,i=i+8|0,c[p>>2]=r,p)|0)|0;i=p;s=1;t=s;i=f;return t|0}eE(g+e|0,h|0,eA(h|0)|0)|0;a[g+(e+(eA(h|0)|0))|0]=0;if((c[b+37072>>2]|0)!=0){b=c[n>>2]|0;e=h|0;r=c[k+72>>2]|0;q=l;au(b|0,20248,(p=i,i=i+24|0,c[p>>2]=e,c[p+8>>2]=r,c[p+16>>2]=q,p)|0)|0;i=p}q=(c[k+4>>2]|0)-(c[k>>2]|0)+1|0;r=(c[k+12>>2]|0)-(c[k+8>>2]|0)+1|0;c[j>>2]=ev(aa(q,r)|0)|0;if((c[j>>2]|0)==0){e=c[n>>2]|0;au(e|0,19512,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p;e=o;aq(e|0)|0;s=2;t=s;i=f;return t|0}if((bS(c[k+68>>2]|0,c[k>>2]|0,c[k+8>>2]|0,q,r,j,aa(q,r)|0)|0)!=0){r=o;aq(r|0)|0;s=-1;t=s;i=f;return t|0}eg(g|0,j)|0;ew(c[j>>2]|0);do{if((c[k+72>>2]|0)!=0){if((c[k+156>>2]|0)==0){m=1701;break}j=o;g=h|0;r=c[k+156>>2]|0;au(j|0,18824,(p=i,i=i+16|0,c[p>>2]=g,c[p+8>>2]=r,p)|0)|0;i=p}else{m=1701}}while(0);if((m|0)==1701){if((c[k+36>>2]|0)>=48){if((c[k+36>>2]|0)<=57){m=1707}else{m=1703}}else{m=1703}do{if((m|0)==1703){if((c[k+36>>2]|0)>=65){if((c[k+36>>2]|0)<=90){m=1707;break}}if((c[k+36>>2]|0)>=97){if((c[k+36>>2]|0)<=122){m=1707;break}}if((c[k+36>>2]>>16>>16|0)!=0){r=o;g=h|0;j=c[k+36>>2]|0;au(r|0,17720,(p=i,i=i+16|0,c[p>>2]=g,c[p+8>>2]=j,p)|0)|0;i=p}else{j=o;g=h|0;r=c[k+36>>2]|0;au(j|0,17400,(p=i,i=i+16|0,c[p>>2]=g,c[p+8>>2]=r,p)|0)|0;i=p}}}while(0);if((m|0)==1707){m=o;r=h|0;h=(c[k+36>>2]&255)<<24>>24;au(m|0,18104,(p=i,i=i+16|0,c[p>>2]=r,c[p+8>>2]=h,p)|0)|0;i=p}}aq(o|0)|0;s=0;t=s;i=f;return t|0}function b$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;d=i;e=a;a=c[b+37052>>2]|0;b=c[e+8>>2]|0;f=c[e+68>>2]|0;g=c[e>>2]|0;h=c[e+4>>2]|0;j=h-g+1|0;k=c[e+8>>2]|0;l=c[e+12>>2]|0;m=l-k+1|0;k=k-2|0;l=l+2|0;do{if((c[e+64>>2]|0)!=0){if((k|0)<=(c[e+52>>2]|0)){break}k=c[e+52>>2]|0}}while(0);do{if((c[e+64>>2]|0)!=0){if((l|0)>=(c[e+64>>2]|0)){break}l=c[e+64>>2]|0}}while(0);if((h-g+1|0)<52){g=g-10|0;h=h+10|0}if((h-g+1|0)<52){g=g-10|0;h=h+10|0}if((h-g+1|0)<62){g=g-5|0;h=h+5|0}if((l-k+1|0)<10){k=k-4|0;l=l+4|0}if((g|0)<0){g=0}if((h|0)>=(c[f+4>>2]|0)){h=(c[f+4>>2]|0)-1|0}if((k|0)<0){k=0}if((l|0)>=(c[f+8>>2]|0)){l=(c[f+8>>2]|0)-1|0}j=h-g+1|0;m=l-k+1|0;b=k;au(c[n>>2]|0,17032,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;h=c[e+8>>2]|0;o=(c[e+4>>2]|0)-(c[e>>2]|0)+1|0;p=(c[e+12>>2]|0)-(c[e+8>>2]|0)+1|0;q=(c[e+16>>2]|0)-(c[e>>2]|0)|0;r=(c[e+20>>2]|0)-(c[e+8>>2]|0)|0;au(c[n>>2]|0,16736,(l=i,i=i+48|0,c[l>>2]=c[e>>2],c[l+8>>2]=h,c[l+16>>2]=o,c[l+24>>2]=p,c[l+32>>2]=q,c[l+40>>2]=r,l)|0)|0;i=l;if((c[e+72>>2]|0)!=0){r=c[n>>2]|0;au(r|0,16304,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;r=0;while(1){if((r|0)<(c[e+72>>2]|0)){s=(r|0)<10}else{s=0}if(!s){break}if((c[e+156+(r<<2)>>2]|0)!=0){q=c[n>>2]|0;p=c[e+156+(r<<2)>>2]|0;o=c[e+116+(r<<2)>>2]|0;au(q|0,15896,(l=i,i=i+16|0,c[l>>2]=p,c[l+8>>2]=o,l)|0)|0;i=l}else{o=c[n>>2]|0;p=es(c[e+76+(r<<2)>>2]|0,6)|0;q=c[e+116+(r<<2)>>2]|0;au(o|0,15896,(l=i,i=i+16|0,c[l>>2]=p,c[l+8>>2]=q,l)|0)|0;i=l}r=r+1|0}}au(c[n>>2]|0,15648,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;do{if((c[e+24>>2]|0)!=0){if((c[e+56>>2]|0)==0){break}if((c[e+52>>2]|0)>=(k|0)){break}b=c[e+52>>2]|0;m=(c[e+12>>2]|0)-b+1|0}}while(0);r=((j|0)/80|0)+1|0;s=((m|0)/40|0)+1|0;au(c[n>>2]|0,15216,(l=i,i=i+48|0,c[l>>2]=g,c[l+8>>2]=k,c[l+16>>2]=j,c[l+24>>2]=m,c[l+32>>2]=r,c[l+40>>2]=s,l)|0)|0;i=l;if((j|0)<=0){i=d;return}q=b;while(1){if((q|0)>=(b+m|0)){break}p=g;while(1){if((p|0)>=(g+j|0)){break}t=46;o=q;while(1){if((o|0)<(q+s|0)){u=(o|0)<(k+m|0)}else{u=0}if(!u){break}h=p;while(1){if((h|0)<(p+r|0)){v=(h|0)<(g+j|0)}else{v=0}if(!v){break}if((d8(f,h,o)|0)<(a|0)){t=35}h=h+1|0}o=o+1|0}do{if((p+r-1|0)<(c[e>>2]|0)){w=1779}else{if((p|0)>(c[e+4>>2]|0)){w=1779;break}if((q+s-1|0)<(c[e+8>>2]|0)){w=1779;break}if((q|0)>(c[e+12>>2]|0)){w=1779}}}while(0);if((w|0)==1779){w=0;t=((t<<24>>24|0)==35?79:44)&255}au(c[n>>2]|0,14736,(l=i,i=i+8|0,c[l>>2]=t<<24>>24,l)|0)|0;i=l;p=p+r|0}p=32;t=32;if((e|0)!=0){do{if((q|0)==(c[e+52>>2]|0)){w=1787}else{if((q|0)==(c[e+56>>2]|0)){w=1787;break}if((q|0)==(c[e+60>>2]|0)){w=1787;break}if((q|0)==(c[e+64>>2]|0)){w=1787}}}while(0);if((w|0)==1787){w=0;t=60}}if((q|0)==(c[e+8>>2]|0)){w=1791}else{if((q|0)==(c[e+12>>2]|0)){w=1791}}if((w|0)==1791){w=0;p=45}au(c[n>>2]|0,14408,(l=i,i=i+16|0,c[l>>2]=t<<24>>24,c[l+8>>2]=p<<24>>24,l)|0)|0;i=l;q=q+s|0}i=d;return}function b0(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=a;a=b;b=d;d=e;e=f;f=g;g=0;i=0;j=0;k=c[a>>2]|0;l=c[a+8>>2]|0;m=c[d>>2]|0;n=c[d+8>>2]|0;o=(c[a+4>>2]|0)-(c[a>>2]|0)+1|0;p=(c[d+4>>2]|0)-(c[d>>2]|0)+1|0;if((o|0)>(p|0)){q=o}else{q=p}r=q;r=o;q=(c[a+12>>2]|0)-(c[a+8>>2]|0)+1|0;s=(c[d+12>>2]|0)-(c[d+8>>2]|0)+1|0;if((q|0)>(s|0)){t=q}else{t=s}u=t;u=q;if((P(o-p|0)|0)>(((r|0)/16|0)+1|0)){v=1806}else{if((P(q-s|0)|0)>(((u|0)/16|0)+1|0)){v=1806}}if((v|0)==1806){j=j+1|0}do{if((c[a+64>>2]|0)>0){if((c[d+64>>2]|0)<=0){break}do{if((c[a+12>>2]<<1|0)>((c[a+60>>2]|0)+(c[a+64>>2]|0)|0)){if((c[d+12>>2]<<1|0)>=((c[d+60>>2]|0)+(c[d+64>>2]|0)|0)){break}j=j+128|0}}while(0);do{if((c[a+8>>2]<<1|0)>((c[a+52>>2]|0)+(c[a+56>>2]|0)|0)){if((c[d+8>>2]<<1|0)>=((c[d+52>>2]|0)+(c[d+56>>2]|0)|0)){break}j=j+128|0}}while(0)}}while(0);d=(r|0)/16|0;if((r|0)<17){d=1}a=(u|0)/32|0;if((u|0)<33){a=1}t=0;while(1){if((t|0)>=(u|0)){break}w=0;while(1){if((w|0)>=(r|0)){break}x=(d8(h,k+((aa(w,o)|0)/(r|0)|0)|0,l+((aa(t,q)|0)/(u|0)|0)|0)|0)<(e|0);y=x?1:0;x=8;z=(d8(b,m+((aa(w,p)|0)/(r|0)|0)|0,n+((aa(t,s)|0)/(u|0)|0)|0)|0)<(e|0);A=8;if((y|0)==((z?1:0)|0)){i=i+16|0}else{y=1;j=j+4|0;y=-1;x=-1;while(1){if((x|0)>=2){break}A=-1;while(1){if((A|0)>=2){break}if((x|0)!=0){v=1832}else{if((A|0)!=0){v=1832}}if((v|0)==1832){v=0;z=(d8(h,k+((aa(w,o)|0)/(r|0)|0)+(aa(x,((o|0)/32|0)+1|0)|0)|0,l+((aa(t,q)|0)/(u|0)|0)+(aa(A,((q|0)/32|0)+1|0)|0)|0)|0)<(e|0);B=(d8(b,m+((aa(w,p)|0)/(r|0)|0)+(aa(x,((p|0)/32|0)+1|0)|0)|0,n+((aa(t,s)|0)/(u|0)|0)+(aa(A,((s|0)/32|0)+1|0)|0)|0)|0)<(e|0);if(((z?1:0)|0)!=((B?1:0)|0)){y=y+1|0}}A=A+1|0}x=x+1|0}if((y|0)>0){j=j+(y<<4)|0}}w=w+d|0}t=t+a|0}if((i+j|0)!=0){g=(j*100|0|0)/(i+j|0)|0}else{g=99}g=g+(((P((aa(o,s)|0)-(aa(p,q)|0)|0)|0)*10|0|0)/(aa(q,s)|0)|0)|0;if((g|0)>100){g=100}if((f|0)==0){C=g;return C|0}C=g;return C|0}function b1(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+200|0;g=f|0;h=b;b=e;e=1e3;j=1e3;k=57344;if((c[b+48>>2]|0)==(b+60|0)){if(!1){l=1858}}else{if(!0){l=1858}}if((l|0)==1858){o=c[(c[b+48>>2]|0)+8>>2]|0;if((c[b+37072>>2]|0)!=0){p=c[n>>2]|0;q=c[h>>2]|0;r=c[h+8>>2]|0;au(p|0,14024,(s=i,i=i+16|0,c[s>>2]=q,c[s+8>>2]=r,s)|0)|0;i=s}if((cy(b+48|0)|0)==0){while(1){if((c[(c[b+72>>2]|0)+(c[b+80>>2]<<2)>>2]|0)!=0){t=(c[(c[b+72>>2]|0)+(c[b+80>>2]<<2)>>2]|0)!=(b+60|0)}else{t=0}if(!t){break}r=c[(c[(c[b+72>>2]|0)+(c[b+80>>2]<<2)>>2]|0)+8>>2]|0;e=b0(c[r+68>>2]|0,r,c[h+68>>2]|0,h,c[b+37052>>2]|0,c[b+37072>>2]|0)|0;if((e|0)<=(j|0)){j=e;o=r;do{if((j|0)<100){if((100-j|0)<(c[b+37092>>2]|0)){break}r=0;while(1){if((r|0)>=(c[o+72>>2]|0)){break}q=(aa(100-j|0,c[o+116+(r<<2)>>2]|0)|0)/100|0;if((c[o+156+(r<<2)>>2]|0)!=0){p=h;u=c[o+156+(r<<2)>>2]|0;v=q;dx(p,u,v)|0}else{v=h;u=c[o+76+(r<<2)>>2]|0;p=q;dy(v,u,p)|0}r=r+1|0}if((c[o+72>>2]|0)!=0){k=c[o+76>>2]|0}if((c[b+37072>>2]|0)!=0){r=c[n>>2]|0;p=j;do{if((c[o+36>>2]|0)>32){if((c[o+36>>2]|0)>=127){l=1881;break}w=(c[o+36>>2]&255)<<24>>24}else{l=1881}}while(0);if((l|0)==1881){l=0;w=46}u=c[o+36>>2]|0;if((c[o+156>>2]|0)!=0){x=c[o+156>>2]|0}else{x=27648}v=c[o+116>>2]|0;au(r|0,13728,(s=i,i=i+40|0,c[s>>2]=p,c[s+8>>2]=w,c[s+16>>2]=u,c[s+24>>2]=x,c[s+32>>2]=v,s)|0)|0;i=s}}}while(0);if((e|0)<=0){if((c[o+72>>2]|0)!=0){if((c[o+156>>2]|0)!=0){l=1892;break}}if((c[o+36>>2]|0)>=128){l=1892;break}if((aC(12320,c[o+36>>2]|0)|0)==0){l=1892;break}}}c[(c[b+72>>2]|0)+(c[b+80>>2]<<2)>>2]=c[c[(c[b+72>>2]|0)+(c[b+80>>2]<<2)>>2]>>2]}cz(b+48|0)}}if((c[b+37060>>2]&128|0)==0){y=k;i=f;return y|0}if((k|0)!=57344){y=k;i=f;return y|0}o=0;b$(h,b);au(c[n>>2]|0,11688,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s;a[g|0]=0;ax(g|0,200,c[m>>2]|0)|0;e=eA(g|0)|0;if((c[b+37072>>2]|0)!=0){x=c[n>>2]|0;w=e;au(x|0,11184,(s=i,i=i+8|0,c[s>>2]=w,s)|0)|0;i=s;z=0;while(1){if((z|0)>=(e|0)){break}au(c[n>>2]|0,11e3,(s=i,i=i+8|0,c[s>>2]=d[g+z|0]|0,s)|0)|0;i=s;z=z+1|0}au(c[n>>2]|0,10768,(s=i,i=i+1|0,i=i+7&-8,c[s>>2]=0,s)|0)|0;i=s}z=0;while(1){if((z|0)>=(e|0)){break}if((d[g+z|0]|0|0)<32){l=1909;break}z=z+1|0}w=d[g+z|0]|0;if((w|0)==1){z=0;x=b+37060|0;c[x>>2]=c[x>>2]&-129}x=z;e=x;a[g+x|0]=0;do{if((e|0)==1){if((a[g|0]&128|0)!=0){break}k=d[g|0]|0;o=1}}while(0);do{if((e|0)>1){if((e|0)>=7){break}x=1<<7-e;j=255&~((1<<8-e)-1);z=1;while(1){if((z|0)>=(e|0)){break}if((a[g+z|0]&192|0)!=128){l=1922;break}z=z+1|0}do{if((z|0)==(e|0)){if(((d[g|0]|0)&(x|j)|0)!=(j|0)){break}o=1;k=(d[g|0]|0)&x-1;z=1;while(1){if((z|0)>=(e|0)){break}k=k<<6;k=k|a[g+z|0]&63;z=z+1|0}}}while(0)}}while(0);if((e|0)>0){if((o|0)==1){e=h;z=k;dy(e,z,100)|0}if((o|0)==0){k=95;o=h;z=g|0;dx(o,z,100)|0}if((w|0)!=1){z=b+48|0;o=h;cu(z,o)|0}do{if((w|0)!=1){if((w|0)==27){break}o=h;z=b;b_(o,z)|0}}while(0);if((c[b+37072>>2]|0)!=0){b=c[n>>2]|0;do{if((k|0)>32){if((k|0)>=127){l=1947;break}A=(k&255)<<24>>24}else{l=1947}}while(0);if((l|0)==1947){A=46}l=k;h=g|0;au(b|0,10392,(s=i,i=i+24|0,c[s>>2]=A,c[s+8>>2]=l,c[s+16>>2]=h,s)|0)|0;i=s}}y=k;i=f;return y|0}function b2(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0;g=i;h=b;b=d;d=e;e=f;f=c[7036]|0;j=f+156|0;if((c[j>>2]|0)==0){c[j+12300>>2]=0;c[j+8204>>2]=0;c[j+4108>>2]=0;c[j+12>>2]=0;c[j+16396>>2]=c[a+4>>2];c[j+20492>>2]=0;c[j+28684>>2]=c[f+37056>>2];c[j+32780>>2]=0;a=j|0;c[a>>2]=(c[a>>2]|0)+1}a=c[j>>2]|0;if((e|0)<4){k=0;l=k;i=g;return l|0}m=0;o=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){p=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{p=0}if(!p){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[q+36>>2]|0)!=57345){if((c[q+196>>2]|0)<=1){break}if((c[q+196>>2]|0)>=4){break}if((c[q+8>>2]|0)<(b|0)){break}if((c[q+12>>2]|0)>(b+e|0)){break}if((c[q>>2]|0)<(h|0)){break}if((c[q+4>>2]|0)>(h+d|0)){break}if((c[q+200>>2]|0)<=0){break}if((c[q+204>>2]|0)>=0){break}m=m+1|0;o=o+((c[q+12>>2]|0)-(c[q+8>>2]|0)+1)|0}}while(0);c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((m|0)==0){if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){r=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{r=0}if(!r){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[q+36>>2]|0)!=57345){if(((c[q+12>>2]|0)-(c[q+8>>2]|0)+1|0)<4){break}if((c[q+8>>2]|0)<(b|0)){break}if((c[q+12>>2]|0)>(b+e|0)){break}if((c[q>>2]|0)<(h|0)){break}if((c[q+4>>2]|0)>(h+d|0)){break}m=m+1|0;o=o+((c[q+12>>2]|0)-(c[q+8>>2]|0)+1)|0}}while(0);c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}}if((m|0)==0){k=0;l=k;i=g;return l|0}o=(o|0)/(m|0)|0;if((c[f+37072>>2]&16|0)!=0){r=c[n>>2]|0;p=h;s=b;t=d;u=e;v=m;w=o;au(r|0,16512,(x=i,i=i+48|0,c[x>>2]=p,c[x+8>>2]=s,c[x+16>>2]=t,c[x+24>>2]=u,c[x+32>>2]=v,c[x+40>>2]=w,x)|0)|0;i=x}if((o|0)<4){k=0;l=k;i=g;return l|0}w=b;v=w;u=w;w=b;while(1){if((w|0)>=(b+e|0)){break}t=b+e|0;m=0;if((c[f+37072>>2]&16|0)!=0){s=c[n>>2]|0;p=a;au(s|0,23608,(x=i,i=i+8|0,c[x>>2]=p,x)|0)|0;i=x}p=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){y=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{y=0}if(!y){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[q+48>>2]|0)>0){z=2011}else{if((c[q+36>>2]|0)==57345){z=2011;break}if((c[j+4>>2]|0)!=0){s=aa(c[j+8>>2]|0,c[q>>2]|0)|0;A=(s|0)/(c[j+4>>2]|0)|0}else{A=0}do{if((c[q+8>>2]|0)>=(w+A|0)){if((c[q+12>>2]|0)>=(b+e|0)){break}if((c[q>>2]|0)<(h|0)){break}if((c[q+4>>2]|0)>=(h+d|0)){break}if(((c[q+4>>2]|0)-(c[q>>2]|0)+1|0)<=2){break}if((c[q+36>>2]|0)==57345){break}if((c[q+28>>2]|0)>1){break}if((((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)*3|0|0)<=(o<<1|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)>=(o*3|0|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)<=4){break}if((c[q+8>>2]|0)<(t+A|0)){t=(c[q+8>>2]|0)-A|0;p=q}}}while(0)}}while(0);if((z|0)==2011){z=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((p|0)==0){z=2033;break}if((t|0)>=(b+e|0)){z=2033;break}if((c[f+37072>>2]&16|0)!=0){s=c[n>>2]|0;r=c[p>>2]|0;B=c[p+8>>2]|0;C=(c[p+4>>2]|0)-(c[p>>2]|0)|0;D=(c[p+12>>2]|0)-(c[p+8>>2]|0)|0;au(s|0,16672,(x=i,i=i+32|0,c[x>>2]=r,c[x+8>>2]=B,c[x+16>>2]=C,c[x+24>>2]=D,x)|0)|0;i=x}c[j+16396+(a<<2)>>2]=h+d-1;c[j+20492+(a<<2)>>2]=h;D=t;C=D;B=D;D=t+o|0;r=t+(o<<1)|0;m=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){E=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{E=0}if(!E){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;L2759:do{if((c[q+48>>2]|0)>0){z=2043}else{if((c[q+36>>2]|0)==57345){z=2043;break}do{if((c[q+8>>2]|0)>=(b|0)){if((c[q+12>>2]|0)>=(b+e|0)){break}if((c[q>>2]|0)<(h|0)){break}if((c[q+4>>2]|0)>=(h+d|0)){break}if((c[j+4>>2]|0)!=0){s=aa(c[j+8>>2]|0,c[q>>2]|0)|0;A=(s|0)/(c[j+4>>2]|0)|0}else{A=0}do{if((c[q+8>>2]|0)>=(w+A|0)){if((c[q+12>>2]|0)>(w+A+(o*3|0)|0)){break}if((c[q+12>>2]|0)>(B+((o<<1|0)/3|0)|0)){break}if((c[j+20492+(a<<2)>>2]|0)<(c[q+4>>2]|0)){c[j+20492+(a<<2)>>2]=c[q+4>>2]}if((c[j+16396+(a<<2)>>2]|0)>(c[q>>2]|0)){c[j+16396+(a<<2)>>2]=c[q>>2]}}}while(0);do{if(((c[q+12>>2]|0)-(c[q+8>>2]|0)+1|0)<=(o<<1|0)){if((c[q+8>>2]|0)<(w+A|0)){break}if((c[q+12>>2]|0)>=(t+A+((o|0)/4|0)|0)){break}if((c[q+8>>2]|0)>=(D+A|0)){break}D=(c[q+8>>2]|0)-A|0}}while(0);do{if((c[q+8>>2]|0)>=(w+A|0)){if((((c[q+12>>2]|0)-(c[q+8>>2]|0)+1|0)*3|0|0)<=(o<<1|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)+1|0)>=(o*3|0|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)+1|0)<=3){break}if((c[q+8>>2]|0)<(t-((o|0)/4|0)|0)){break}if((c[q+8>>2]|0)>(t+A+((o*9|0|0)/8|0)|0)){break}if((c[q+12>>2]|0)>(t+A+(o*3|0)|0)){break}if((c[q+12>>2]|0)<(t+A+((o|0)/2|0)|0)){break}if(((c[q+8>>2]|0)+(c[q+12>>2]|0)|0)>((c[p+8>>2]|0)+o<<1|0)){break}m=m+1|0;if((c[q+8>>2]|0)>(C+A|0)){C=(c[q+8>>2]|0)-A|0;if((c[f+37072>>2]&16|0)!=0){s=c[n>>2]|0;F=C;G=C-t|0;H=A;I=c[q>>2]|0;J=c[q+8>>2]|0;au(s|0,12248,(x=i,i=i+40|0,c[x>>2]=F,c[x+8>>2]=G,c[x+16>>2]=H,c[x+24>>2]=I,c[x+32>>2]=J,x)|0)|0;i=x}}do{if((c[q+12>>2]|0)>(B+A|0)){if((o|0)<=6){if((c[q+12>>2]|0)>=(r+o|0)){break}}B=(c[q+12>>2]|0)-A|0;if((c[f+37072>>2]&16|0)!=0){J=c[n>>2]|0;I=B;H=B-t|0;G=A;F=c[q>>2]|0;s=c[q+8>>2]|0;au(J|0,9512,(x=i,i=i+40|0,c[x>>2]=I,c[x+8>>2]=H,c[x+16>>2]=G,c[x+24>>2]=F,c[x+32>>2]=s,x)|0)|0;i=x}}}while(0);do{if((c[q+12>>2]|0)<(r+A|0)){if((c[q+12>>2]<<1|0)>(C+B+A|0)){if((C|0)<=(t|0)){z=2087}}else{z=2087}if((z|0)==2087){z=0;if((c[q+12>>2]<<2|0)<=(t+(B*3|0)+A|0)){break}}do{if(((du(c[q>>2]|0,c[q+4>>2]|0,(c[q+12>>2]|0)+1|0,(c[q+12>>2]|0)+((o|0)/2|0)|0,c[q+68>>2]|0,c[f+37052>>2]|0,1)|0)<<24>>24|0)==0){z=2091}else{if(((du(c[q>>2]|0,c[q+4>>2]|0,(c[q+12>>2]|0)+((o|0)/2|0)|0,(c[q+12>>2]|0)+((o|0)/2|0)|0,c[q+68>>2]|0,c[f+37052>>2]|0,1)|0)<<24>>24|0)==1){z=2091;break}if((dv(c[q>>2]|0,c[q+4>>2]|0,((c[q+8>>2]|0)+(c[q+12>>2]|0)|0)/2|0,((c[q+8>>2]|0)+(c[q+12>>2]|0)|0)/2|0,c[q+68>>2]|0,c[f+37052>>2]|0)|0)>2){z=2091}}}while(0);if((z|0)==2091){z=0;r=(c[q+12>>2]|0)-A|0;if((c[f+37072>>2]&16|0)!=0){s=c[n>>2]|0;F=r;G=r-t|0;H=A;I=c[q>>2]|0;J=c[q+8>>2]|0;au(s|0,8496,(x=i,i=i+40|0,c[x>>2]=F,c[x+8>>2]=G,c[x+16>>2]=H,c[x+24>>2]=I,c[x+32>>2]=J,x)|0)|0;i=x}}}}while(0);do{if(((c[q+8>>2]|0)+(c[q+12>>2]|0)|0)>(r+A<<1|0)){if((c[q+12>>2]|0)>=(B+A-((o|0)/4|0)-1|0)){break}if((c[q+12>>2]|0)<((C+B|0)/2|0|0)){break}if((C|0)<=(t|0)){break}r=(c[q+12>>2]|0)-A|0;if((c[f+37072>>2]&16|0)!=0){J=c[n>>2]|0;I=r;H=r-t|0;G=A;F=c[q>>2]|0;s=c[q+8>>2]|0;au(J|0,7384,(x=i,i=i+40|0,c[x>>2]=I,c[x+8>>2]=H,c[x+16>>2]=G,c[x+24>>2]=F,c[x+32>>2]=s,x)|0)|0;i=x}}}while(0)}}while(0);break L2759}}while(0)}}while(0);if((z|0)==2043){z=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}do{if((r|0)==(B|0)){if((a|0)<=1){break}if((r-t|0)==((c[j+8204+(a-1<<2)>>2]|0)-(c[j+12+(a-1<<2)>>2]|0)|0)){B=t+(c[j+12300+(a-1<<2)>>2]|0)-(c[j+12+(a-1<<2)>>2]|0)|0}}}while(0);do{if((t|0)==(C|0)){if((a|0)<=1){break}if((r-t|0)==((c[j+8204+(a-1<<2)>>2]|0)-(c[j+12+(a-1<<2)>>2]|0)|0)){C=t+(c[j+4108+(a-1<<2)>>2]|0)-(c[j+12+(a-1<<2)>>2]|0)|0}}}while(0);if((c[f+37072>>2]&16|0)!=0){p=c[n>>2]|0;s=a;F=w;G=t;H=C-t|0;I=r-t|0;J=B-t|0;K=c[j+16396+(a<<2)>>2]|0;L=(c[j+20492+(a<<2)>>2]|0)-(c[j+16396+(a<<2)>>2]|0)|0;M=o;N=m;au(p|0,6312,(x=i,i=i+80|0,c[x>>2]=s,c[x+8>>2]=F,c[x+16>>2]=G,c[x+24>>2]=H,c[x+32>>2]=I,c[x+40>>2]=J,c[x+48>>2]=K,c[x+56>>2]=L,c[x+64>>2]=M,c[x+72>>2]=N,x)|0)|0;i=x}if((r|0)==(t|0)){z=2119;break}m=0;N=0;M=0;L=0;K=0;J=0;I=0;H=0;G=0;if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){O=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{O=0}if(!O){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[q+48>>2]|0)>0){z=2127}else{if((c[q+36>>2]|0)==57345){z=2127;break}if((c[j+4>>2]|0)!=0){F=aa(c[j+8>>2]|0,c[q>>2]|0)|0;A=(F|0)/(c[j+4>>2]|0)|0}else{A=0}do{if((c[q+8>>2]|0)>=(w+A|0)){if((c[q+12>>2]|0)>=(b+e|0)){break}if((c[q>>2]|0)<(h|0)){break}if((c[q+4>>2]|0)>=(h+d|0)){break}if((c[q+36>>2]|0)==57345){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)<<1|0)<=(o|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)>=(o<<2|0)){break}do{if(((c[q+8>>2]|0)-A|0)>=(t-((o|0)/4|0)|0)){if(((c[q+8>>2]|0)-A|0)>(C+((o|0)/4|0)|0)){break}if(((c[q+12>>2]|0)-A|0)<(r-((o|0)/4|0)|0)){break}if(((c[q+12>>2]|0)-A|0)>(B+((o|0)/4|0)|0)){break}F=P((c[q+8>>2]|0)-A-t|0)|0;if((F|0)<=(P((c[q+8>>2]|0)-A-C|0)|0)){K=K+1|0;G=G+((c[q+8>>2]|0)-A)|0}else{L=L+1|0;H=H+((c[q+8>>2]|0)-A)|0}F=P((c[q+12>>2]|0)-A-r|0)|0;if((F|0)<(P((c[q+12>>2]|0)-A-B|0)|0)){M=M+1|0;I=I+((c[q+12>>2]|0)-A)|0}else{N=N+1|0;J=J+((c[q+12>>2]|0)-A)|0}if((c[q+4>>2]|0)>(c[j+20492+(a<<2)>>2]|0)){c[j+20492+(a<<2)>>2]=c[q+4>>2]}if((c[q>>2]|0)<(c[j+16396+(a<<2)>>2]|0)){c[j+16396+(a<<2)>>2]=c[q>>2]}}}while(0)}}while(0)}}while(0);if((z|0)==2127){z=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((K|0)!=0){t=(G+((K|0)/2|0)|0)/(K|0)|0}if((L|0)!=0){C=(H+((L|0)/2|0)|0)/(L|0)|0}if((M|0)!=0){r=(I+M-1|0)/(M|0)|0}if((N|0)!=0){B=(J+N-1|0)/(N|0)|0}if((cy(f+84|0)|0)==0){while(1){if((c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=0){Q=(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)!=(f+96|0)}else{Q=0}if(!Q){break}q=c[(c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[q+48>>2]|0)>0){z=2172}else{if((c[q+36>>2]|0)==57345){z=2172;break}if((c[j+4>>2]|0)!=0){F=aa(c[j+8>>2]|0,c[q>>2]|0)|0;A=(F|0)/(c[j+4>>2]|0)|0}else{A=0}do{if((c[q>>2]|0)>=(h|0)){if((c[q+4>>2]|0)>=(h+d|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)>(((B-t|0)*3|0|0)/2|0|0)){break}if((c[q+36>>2]|0)==57345){break}if((c[q+8>>2]|0)<(t-((B-t+4|0)/4|0)|0)){break}if((c[q+8>>2]|0)>(B+2|0)){break}if((c[q+12>>2]|0)<(t-1|0)){break}if((c[q+12>>2]|0)>(B+((B-t+4|0)/4|0)|0)){break}if((c[q+4>>2]|0)>(c[j+20492+(a<<2)>>2]|0)){c[j+20492+(a<<2)>>2]=c[q+4>>2]}if((c[q>>2]|0)<(c[j+16396+(a<<2)>>2]|0)){c[j+16396+(a<<2)>>2]=c[q>>2]}}}while(0)}}while(0);if((z|0)==2172){z=0}c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]=c[c[(c[f+108>>2]|0)+(c[f+116>>2]<<2)>>2]>>2]}cz(f+84|0)}if((c[f+37072>>2]&16|0)!=0){J=c[n>>2]|0;I=a;H=w;G=t;F=C-t|0;s=r-t|0;p=B-t|0;R=c[j+16396+(a<<2)>>2]|0;S=(c[j+20492+(a<<2)>>2]|0)-(c[j+16396+(a<<2)>>2]|0)|0;au(J|0,5264,(x=i,i=i+64|0,c[x>>2]=I,c[x+8>>2]=H,c[x+16>>2]=G,c[x+24>>2]=F,c[x+32>>2]=s,c[x+40>>2]=p,c[x+48>>2]=R,c[x+56>>2]=S,x)|0)|0;i=x}if((B|0)==(t|0)){if((r+B|0)>(w<<1|0)){w=(B+r|0)/2|0}}else{m=0;c[j+24588+(a<<2)>>2]=100;if(((C-t+1|0)*5|0|0)<(r-C|0)){z=2200}else{if((C-t|0)<2){z=2200}}if((z|0)==2200){z=0;m=m|1}if(((B-r+1|0)*5|0|0)<(r-C|0)){z=2203}else{if((B-r|0)<1){z=2203}}if((z|0)==2203){z=0;m=m|2}if((m&1|0)!=0){c[j+24588+(a<<2)>>2]=((c[j+24588+(a<<2)>>2]|0)*75|0|0)/100|0}if((m&2|0)!=0){c[j+24588+(a<<2)>>2]=((c[j+24588+(a<<2)>>2]|0)*75|0|0)/100|0}do{if((m|0)>0){if((c[f+37072>>2]|0)==0){break}S=c[n>>2]|0;R=a;p=c[j+24588+(a<<2)>>2]|0;s=w;F=t;G=C-t|0;H=r-t|0;I=B-t|0;au(S|0,4448,(x=i,i=i+56|0,c[x>>2]=R,c[x+8>>2]=p,c[x+16>>2]=s,c[x+24>>2]=F,c[x+32>>2]=G,c[x+40>>2]=H,c[x+48>>2]=I,x)|0)|0;i=x;I=c[n>>2]|0;H=a;G=w;F=K;s=L;p=M;R=N;au(I|0,25048,(x=i,i=i+48|0,c[x>>2]=H,c[x+8>>2]=G,c[x+16>>2]=F,c[x+24>>2]=s,c[x+32>>2]=p,c[x+40>>2]=R,x)|0)|0;i=x;if((m|0)==3){R=c[n>>2]|0;p=D-t|0;au(R|0,24496,(x=i,i=i+8|0,c[x>>2]=p,x)|0)|0;i=x}if((m|0)==1){p=c[n>>2]|0;au(p|0,23648,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0)|0;i=x}if((m|0)==2){p=c[n>>2]|0;au(p|0,22800,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0)|0;i=x}}}while(0);if((D|0)<(t-(B-t)|0)){D=0}do{if((m|0)==3){if((B-t|0)<(o|0)){break}m=0;C=t+((o|0)/5|0)+1|0;B=r+((o|0)/5|0)+1|0}}while(0);do{if((m|0)==3){if((D|0)<=0){break}if((D|0)>=(t|0)){break}if((D|0)<=(u|0)){break}m=2;t=D}}while(0);do{if((m|0)==1){if((C-((r-C|0)/4|0)|0)<=(v|0)){break}if((t-u|0)<(B-t|0)){t=(C+u|0)/2|0}else{t=C-((r-C|0)/4|0)|0}}}while(0);if((m|0)==3){C=t+((r-t|0)/4|0)+1|0}if((C-t|0)<2){C=t+2|0}if((m&2|0)!=0){B=r+((B-t|0)/4|0)+1|0}do{if((m|0)>0){if((c[f+37072>>2]&16|0)==0){break}D=c[n>>2]|0;N=a;M=m;L=w;K=t;p=C-t|0;R=r-t|0;s=B-t|0;F=o;au(D|0,20984,(x=i,i=i+64|0,c[x>>2]=N,c[x+8>>2]=M,c[x+16>>2]=L,c[x+24>>2]=K,c[x+32>>2]=p,c[x+40>>2]=R,c[x+48>>2]=s,c[x+56>>2]=F,x)|0)|0;i=x}}while(0);c[j+12300+(a<<2)>>2]=B;c[j+8204+(a<<2)>>2]=r;c[j+4108+(a<<2)>>2]=C;c[j+12+(a<<2)>>2]=t;c[j+28684+(a<<2)>>2]=c[f+37056>>2];c[j+32780+(a<<2)>>2]=0;if((c[f+37072>>2]&16|0)!=0){F=c[n>>2]|0;s=a;R=w;p=t;K=C-t|0;L=r-t|0;M=B-t|0;N=c[j+16396+(a<<2)>>2]|0;D=(c[j+20492+(a<<2)>>2]|0)-(c[j+16396+(a<<2)>>2]|0)|0;G=c[j+24588+(a<<2)>>2]|0;au(F|0,20176,(x=i,i=i+72|0,c[x>>2]=s,c[x+8>>2]=R,c[x+16>>2]=p,c[x+24>>2]=K,c[x+32>>2]=L,c[x+40>>2]=M,c[x+48>>2]=N,c[x+56>>2]=D,c[x+64>>2]=G,x)|0)|0;i=x}do{if((a|0)<1024){if((B-t|0)<=4){break}a=a+1|0}}while(0);if((a|0)>=1024){z=2248;break}if((r+B|0)>(w<<1|0)){w=(r+B|0)/2|0}if((r|0)>(v|0)){v=r}else{r=b}if((B|0)>(u|0)){u=B}else{B=b}}w=w+1|0}if((z|0)!=2033)if((z|0)!=2119)if((z|0)==2248){au(c[n>>2]|0,19480,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0)|0;i=x}c[j>>2]=a;if((c[f+37072>>2]|0)!=0){f=c[n>>2]|0;a=(c[j>>2]|0)-1|0;au(f|0,18808,(x=i,i=i+8|0,c[x>>2]=a,x)|0)|0;i=x}k=0;l=k;i=g;return l|0}function b3(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;g=c[7036]|0;do{if((d|0)>0){if((e|0)<=0){break}do{if((b+e|0)<((c[j+8>>2]|0)/128|0|0)){if((b|0)!=0){break}k=0;l=k;i=h;return l|0}}while(0);do{if((b|0)>((c[j+8>>2]|0)-((c[j+8>>2]|0)/128|0)|0)){if((b+e|0)!=(c[j+8>>2]|0)){break}k=0;l=k;i=h;return l|0}}while(0);if((f|0)>1e3){k=-1;l=k;i=h;return l|0}if((c[g+37072>>2]|0)!=0){m=c[n>>2]|0;o=f;au(m|0,18088,(p=i,i=i+8|0,c[p>>2]=o,p)|0)|0;i=p}o=0;m=0;q=0;r=a+d-1|0;s=b+e-1|0;t=a;u=b;if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){v=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{v=0}if(!v){break}w=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[w+8>>2]|0)>=(b|0)){if((c[w+12>>2]|0)>=(b+e|0)){break}if((c[w>>2]|0)<(a|0)){break}if((c[w+4>>2]|0)>=(a+d|0)){break}if((c[w+4>>2]|0)>(t|0)){t=c[w+4>>2]|0}if((c[w>>2]|0)<(r|0)){r=c[w>>2]|0}if((c[w+12>>2]|0)>(u|0)){u=c[w+12>>2]|0}if((c[w+8>>2]|0)<(s|0)){s=c[w+8>>2]|0}if((c[w+36>>2]|0)!=57345){if(((c[w+12>>2]|0)-(c[w+8>>2]|0)|0)>4){o=o+1|0;q=q+((c[w+4>>2]|0)-(c[w>>2]|0)+1)|0;m=m+((c[w+12>>2]|0)-(c[w+8>>2]|0)+1)|0}}}}while(0);c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}a=r;d=t-r+1|0;b=s;e=u-s+1|0;do{if((o|0)!=0){if((d|0)<=0){break}if((e|0)<=0){break}q=(q|0)/(o|0)|0;m=(m|0)/(o|0)|0;do{if((f|0)<8){x=0;y=0;u=0;s=0;x=0;x=0;t=0;r=0;if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){z=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{z=0}if(!z){break}A=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[A+36>>2]|0)!=57345){do{if((c[A+8>>2]|0)>=(b|0)){if((c[A+12>>2]|0)>=(b+e|0)){break}if((c[A>>2]|0)<(a|0)){break}if((c[A+4>>2]|0)>=(a+d|0)){break}if(((c[A+12>>2]|0)-(c[A+8>>2]|0)|0)<=((m|0)/2|0|0)){break}y=b+e-1|0;x=a+d-1|0;if((cy(g+84|0)|0)==0){while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){B=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{B=0}if(!B){break}w=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;if((w|0)!=(A|0)){do{if((c[w+8>>2]|0)>=(b|0)){if((c[w+12>>2]|0)>=(b+e|0)){break}do{if((c[w>>2]|0)>=(a|0)){if((c[w+4>>2]|0)>=(a+d|0)){break}if((c[w+36>>2]|0)!=57345){if(((c[w+12>>2]|0)-(c[w+8>>2]|0)|0)>((m|0)/2|0|0)){C=c[w>>2]|0;D=c[w+4>>2]|0;E=c[w+8>>2]|0;do{if((c[w+12>>2]|0)>(c[A+12>>2]|0)){if((E|0)>=(y|0)){break}y=E-1|0}}while(0);do{if((D|0)>(c[A+4>>2]|0)){if((C|0)>=(x|0)){break}x=C-1|0}}while(0)}}}}while(0)}}while(0)}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}if((y-(c[A+12>>2]|0)|0)>(u|0)){u=y-(c[A+12>>2]|0)|0;s=(y+(c[A+12>>2]|0)|0)/2|0}if((x-(c[A+4>>2]|0)|0)>(t|0)){t=x-(c[A+4>>2]|0)|0;r=(x+(c[A+4>>2]|0)|0)/2|0}}}while(0)}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}cz(g+84|0)}o=0;if((t|0)>0){F=2358}else{if((u|0)>0){F=2358}}if((F|0)==2358){do{if((t|0)>(q|0)){if((t|0)<=(u<<1|0)){F=2364;break}if((e|0)<=(t*5|0|0)){if((t|0)<=(u*10|0|0)){F=2364;break}if((u|0)<=0){F=2364;break}}o=1}else{F=2364}}while(0);if((F|0)==2364){do{if((d|0)>(u*5|0|0)){if((u|0)<=(m|0)){break}o=2}}while(0)}}if((cy(g+84|0)|0)==0){L3208:while(1){if((c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=0){G=(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)!=(g+96|0)}else{G=0}if(!G){break}A=c[(c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[A+36>>2]|0)==57345){do{if((c[A+8>>2]|0)>=(b|0)){if((c[A+12>>2]|0)>=(b+e|0)){break}if((c[A>>2]|0)<(a|0)){break}if((c[A+4>>2]|0)>=(a+d|0)){break}if(((c[A+4>>2]|0)-(c[A>>2]|0)+4|0)>(d|0)){if(((c[A+12>>2]|0)+4|0)<(b+e|0)){F=2381;break L3208}}if(((c[A+4>>2]|0)-(c[A>>2]|0)+4|0)>(d|0)){if(((c[A+8>>2]|0)-4|0)>(b|0)){F=2384;break L3208}}if(((c[A+12>>2]|0)-(c[A+8>>2]|0)+4|0)>(e|0)){if(((c[A+4>>2]|0)+4|0)<(a+d|0)){F=2387;break L3208}}if(((c[A+12>>2]|0)-(c[A+8>>2]|0)+4|0)>(e|0)){if(((c[A>>2]|0)-4|0)>(a|0)){F=2390;break L3208}}}}while(0)}c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]=c[c[(c[g+108>>2]|0)+(c[g+116>>2]<<2)>>2]>>2]}if((F|0)==2381){u=1;s=(c[A+12>>2]|0)+1|0;o=2}else if((F|0)==2384){u=1;s=(c[A+8>>2]|0)-1|0;o=2}else if((F|0)==2387){t=1;r=(c[A+4>>2]|0)+1|0;o=1}else if((F|0)==2390){t=1;r=(c[A>>2]|0)-1|0;o=1}cz(g+84|0)}if((c[g+37072>>2]|0)!=0){x=c[n>>2]|0;y=o;au(x|0,17712,(p=i,i=i+8|0,c[p>>2]=y,p)|0)|0;i=p}do{if((c[g+37072>>2]|0)!=0){if((o|0)==0){break}y=c[n>>2]|0;if((o|0)!=0){H=(o|0)==1?17024:16728}else{H=16296}x=r;C=s;D=t;E=u;au(y|0,17360,(p=i,i=i+40|0,c[p>>2]=H,c[p+8>>2]=x,c[p+16>>2]=C,c[p+24>>2]=D,c[p+32>>2]=E,p)|0)|0;i=p}}while(0);if((o|0)==1){E=j;D=a;C=b;x=r-a+1|0;y=e;I=f+1|0;b3(E,D,C,x,y,I)|0;k=b3(j,r,b,a+d-r+1|0,e,f+1|0)|0;l=k;i=h;return l|0}if((o|0)!=2){break}I=j;y=a;x=b;C=d;D=s-b+1|0;E=f+1|0;b3(I,y,x,C,D,E)|0;k=b3(j,a,s,d,b+e-s+1|0,f+1|0)|0;l=k;i=h;return l|0}}while(0);if((c[g+37072>>2]|0)!=0){if((d|0)<5){F=2412}else{if((e|0)<7){F=2412}}if((F|0)==2412){E=c[n>>2]|0;au(E|0,15880,(p=i,i=i+1|0,i=i+7&-8,c[p>>2]=0,p)|0)|0;i=p}}do{if((d|0)>=5){if((e|0)<7){break}if((c[g+37072>>2]|0)!=0){E=c[n>>2]|0;D=a;C=b;x=d;y=e;au(E|0,15608,(p=i,i=i+32|0,c[p>>2]=D,c[p+8>>2]=C,c[p+16>>2]=x,c[p+24>>2]=y,p)|0)|0;i=p}if((c[g+28>>2]|0)!=0){o=0;while(1){if((o|0)>=(d|0)){break}d9(g+28|0,a+o|0,b,255,16);o=o+1|0}o=0;while(1){if((o|0)>=(d|0)){break}d9(g+28|0,a+o|0,b+e-1|0,255,16);o=o+1|0}o=0;while(1){if((o|0)>=(e|0)){break}d9(g+28|0,a,b+o|0,255,16);o=o+1|0}o=0;while(1){if((o|0)>=(e|0)){break}d9(g+28|0,a+d-1|0,b+o|0,255,16);o=o+1|0}}k=b2(j,a|0,b|0,d|0,e|0)|0;l=k;i=h;return l|0}}while(0);k=0;l=k;i=h;return l|0}}while(0);k=0;l=k;i=h;return l|0}}while(0);k=0;l=k;i=h;return l|0}function b4(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;b=i;i=i+64|0;d=b|0;e=b+16|0;f=b+32|0;g=b+48|0;h=a;a=0;j=0;k=0;l=d;eC(l|0,0,16)|0;l=e;eC(l|0,0,16)|0;l=f;eC(l|0,0,16)|0;l=g;c[l>>2]=c[94];c[l+4>>2]=c[95];c[l+8>>2]=c[96];c[l+12>>2]=c[97];a=1024;j=0;l=0;while(1){if((l|0)>=4){break}if((cy(h+84|0)|0)==0){while(1){if((c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)!=0){m=(c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)!=(h+96|0)}else{m=0}if(!m){break}o=c[(c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)+8>>2]|0;do{if((c[o+36>>2]|0)!=57345){if(((c[o+12>>2]|0)-(c[o+8>>2]|0)|0)<4){break}p=o;q=aa(c[h+8>>2]|0,c[h+8>>2]|0)|0;r=q+(aa(c[h+12>>2]|0,c[h+12>>2]|0)|0)|0;q=((c[o>>2]|0)+(c[o+4>>2]|0)|0)/2|0;s=((c[o+8>>2]|0)+(c[o+12>>2]|0)|0)/2|0;k=0;if((cy(h+84|0)|0)==0){while(1){if((c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)!=0){t=(c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)!=(h+96|0)}else{t=0}if(!t){break}u=c[(c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]|0)+8>>2]|0;L3333:do{if((c[u+36>>2]|0)==57345){v=2466}else{if((u|0)==(o|0)){v=2466;break}w=((c[u>>2]|0)+(c[u+4>>2]|0)|0)/2|0;x=((c[u+8>>2]|0)+(c[u+12>>2]|0)|0)/2|0;if((w|0)<(q|0)){break}do{if((l|0)>0){y=+(w-q|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(x-s|0,c[f+(l-1<<2)>>2]|0)|0);z=y*(+(w-q|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(x-s|0,c[f+(l-1<<2)>>2]|0)|0))*1024.0;y=+((aa(w-q|0,w-q|0)|0)+(aa(x-s|0,x-s|0)|0)|0)*1.0;k=~~(z/(y*(+(c[e+(l-1<<2)>>2]|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(c[f+(l-1<<2)>>2]|0,c[f+(l-1<<2)>>2]|0)|0))));if((1024-k|0)>(c[g+(l-1<<2)>>2]|0)){break L3333}else{break}}}while(0);if((((c[u+12>>2]|0)-(c[u+8>>2]|0)+4|0)*3|0|0)<((c[o+12>>2]|0)-(c[o+8>>2]|0)+1<<1|0)){break}if(((c[u+12>>2]|0)-(c[u+8>>2]|0)+1<<1|0)>(((c[o+12>>2]|0)-(c[o+8>>2]|0)+4|0)*3|0|0)){break}if(((c[u+4>>2]|0)-(c[u>>2]|0)+1<<1|0)>(((c[o+4>>2]|0)-(c[o>>2]|0)+4|0)*5|0|0)){break}if((((c[u+4>>2]|0)-(c[u>>2]|0)+4|0)*5|0|0)<((c[o+4>>2]|0)-(c[o>>2]|0)+1<<1|0)){break}do{if((w|0)<((c[o+4>>2]|0)-1|0)){if((w|0)<=((c[o>>2]|0)+1|0)){break}if((x|0)>=((c[o+12>>2]|0)-1|0)){break}if((x|0)<=((c[o+8>>2]|0)+1|0)){break}break L3333}}while(0);A=P(w-q|0)|0;if((A|0)>((c[o+4>>2]|0)-(c[o>>2]|0)+(c[u+4>>2]|0)-(c[u>>2]|0)+2<<1|0)){break}A=P(x-s|0)|0;if((A|0)>((c[o+4>>2]|0)-(c[o>>2]|0)+(c[u+4>>2]|0)-(c[u>>2]|0)+2|0)){break}B=(aa(x-s|0,x-s|0)|0)+(aa(w-q|0,w-q|0)|0)|0;if((B|0)<9){break}if((B|0)<(r|0)){r=B;p=u}}}while(0);if((v|0)==2466){v=0}c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]=c[c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]>>2]}cz(h+84|0)}if((p|0)==(o|0)){break}u=p;B=r;w=((c[u>>2]|0)+(c[u+4>>2]|0)|0)/2|0;x=((c[u+8>>2]|0)+(c[u+12>>2]|0)|0)/2|0;q=((c[o>>2]|0)+(c[o+4>>2]|0)|0)/2|0;s=((c[o+8>>2]|0)+(c[o+12>>2]|0)|0)/2|0;do{if((l|0)>0){A=(P(c[f+(l-1<<2)>>2]|0)|0)<<4;if((A|0)>=(c[e+(l-1<<2)>>2]|0)){break}A=P((c[o+12>>2]|0)-(c[o+8>>2]|0)-(c[u+12>>2]|0)+(c[u+8>>2]|0)|0)|0;if((A|0)>(((c[o+12>>2]|0)-(c[o+8>>2]|0)|0)/8|0|0)){if((P((c[o+12>>2]|0)-(c[u+12>>2]|0)|0)|0)<(P(x-s|0)|0)){s=c[o+12>>2]|0;x=c[u+12>>2]|0}if((P((c[o+8>>2]|0)-(c[u+8>>2]|0)|0)|0)<(P(x-s|0)|0)){s=c[o+8>>2]|0;x=c[u+8>>2]|0}}}}while(0);if((P(w-q|0)|0)<4){break}r=e+(l<<2)|0;c[r>>2]=(c[r>>2]|0)+(w-q<<10);r=f+(l<<2)|0;c[r>>2]=(c[r>>2]|0)+(x-s<<10);r=d+(l<<2)|0;c[r>>2]=(c[r>>2]|0)+1;if((l|0)>0){y=+(w-q|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(x-s|0,c[f+(l-1<<2)>>2]|0)|0);z=y*(+(w-q|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(x-s|0,c[f+(l-1<<2)>>2]|0)|0))*1024.0;y=+(w-q|0)*1.0*+(w-q|0)+ +(aa(x-s|0,x-s|0)|0);k=1024-~~(z/(y*(+(c[e+(l-1<<2)>>2]|0)*1.0*+(c[e+(l-1<<2)>>2]|0)+ +(aa(c[f+(l-1<<2)>>2]|0,c[f+(l-1<<2)>>2]|0)|0))))|0;r=g+(l<<2)|0;c[r>>2]=(c[r>>2]|0)+k}}}while(0);c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]=c[c[(c[h+108>>2]|0)+(c[h+116>>2]<<2)>>2]>>2]}cz(h+84|0)}if((c[d+(l<<2)>>2]|0)==0){v=2516;break}if((c[d+(l<<2)>>2]|0)!=0){o=e+(l<<2)|0;r=(c[o>>2]|0)/(c[d+(l<<2)>>2]|0)|0;c[o>>2]=r;a=r;r=f+(l<<2)|0;o=(c[r>>2]|0)/(c[d+(l<<2)>>2]|0)|0;c[r>>2]=o;j=o;if((l|0)>0){o=g+(l<<2)|0;c[o>>2]=(c[o>>2]|0)/(c[d+(l<<2)>>2]|0)|0}}if((c[h+37072>>2]|0)!=0){o=c[n>>2]|0;r=a;p=j;A=c[g+(l<<2)>>2]|0;C=c[d+(l<<2)>>2]|0;D=l+1|0;au(o|0,15152,(E=i,i=i+40|0,c[E>>2]=r,c[E+8>>2]=p,c[E+16>>2]=A,c[E+24>>2]=C,c[E+32>>2]=D,E)|0)|0;i=E}l=l+1|0}if((P(j*100|0|0)|0)<=(P(a*50|0|0)|0)){F=a;G=h;H=G+84|0;I=H+72|0;J=I+4|0;c[J>>2]=F;K=j;L=h;M=L+84|0;N=M+72|0;O=N+8|0;c[O>>2]=K;i=b;return 0}au(c[n>>2]|0,14672,(E=i,i=i+1|0,i=i+7&-8,c[E>>2]=0,E)|0)|0;i=E;F=a;G=h;H=G+84|0;I=H+72|0;J=I+4|0;c[J>>2]=F;K=j;L=h;M=L+84|0;N=M+72|0;O=N+8|0;c[O>>2]=K;i=b;return 0}function b5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=c[(c[7036]|0)+37072>>2]|0;if((a|0)!=0){f=c[n>>2]|0;au(f|0,14352,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}if((b&4|0)!=0){if((a|0)!=0){b=c[n>>2]|0;au(b|0,14008,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}b=e;f=c[e+4>>2]|0;h=c[e+8>>2]|0;b3(b,0,0,f,h,0)|0}else{h=e;f=c[e+4>>2]|0;b=c[e+8>>2]|0;b2(h,0,0,f,b)|0}if((a|0)==0){i=d;return 0}au(c[n>>2]|0,13720,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g;i=d;return 0}function b6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=i;a=c[7036]|0;d=0;e=c[a+156>>2]|0;f=e;if((e|0)<2){g=0;h=g;i=b;return h|0}if((c[a+37072>>2]|0)!=0){e=c[n>>2]|0;au(e|0,13088,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j}e=ev(f<<4<<2)|0;if((e|0)==0){k=c[n>>2]|0;au(k|0,12304,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j;g=0;h=g;i=b;return h|0}k=0;while(1){if((k|0)>=(f<<4|0)){break}c[e+(k<<2)>>2]=0;k=k+1|0}l=c[a+164>>2]|0;m=c[a+160>>2]|0;if((m|0)!=0){if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){o=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{o=0}if(!o){break}p=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;L3465:do{if((c[p+48>>2]|0)>0){if((c[p+72>>2]|0)<1){break}if((c[p+116>>2]|0)<98){break}do{if((c[p+56>>2]|0)!=0){if((c[p+12>>2]|0)<(c[p+56>>2]|0)){break}do{if((c[p+60>>2]|0)!=4){if((c[p+8>>2]|0)>(c[p+60>>2]|0)){break}q=(c[p+8>>2]|0)-((aa(c[p+4>>2]|0,l)|0)/(m|0)|0)|0;r=(c[p+12>>2]|0)-((aa(c[p+4>>2]|0,l)|0)/(m|0)|0)|0;if((aC(11680,(c[p+76>>2]&255)<<24>>24|0)|0)!=0){s=e+((c[p+48>>2]<<4)+1<<2)|0;c[s>>2]=(c[s>>2]|0)+q;s=e+((c[p+48>>2]<<4)+5<<2)|0;c[s>>2]=(c[s>>2]|0)+1;s=e+((c[p+48>>2]<<4)+2<<2)|0;c[s>>2]=(c[s>>2]|0)+r;s=e+((c[p+48>>2]<<4)+6<<2)|0;c[s>>2]=(c[s>>2]|0)+1;if((c[e+((c[p+48>>2]<<4)+9<<2)>>2]|0)>(q|0)){c[e+((c[p+48>>2]<<4)+9<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+13<<2)>>2]|0)<(q|0)){c[e+((c[p+48>>2]<<4)+13<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+10<<2)>>2]|0)>(r|0)){c[e+((c[p+48>>2]<<4)+10<<2)>>2]=r}if((c[e+((c[p+48>>2]<<4)+14<<2)>>2]|0)<(r|0)){c[e+((c[p+48>>2]<<4)+14<<2)>>2]=r}}if((aC(11152,(c[p+76>>2]&255)<<24>>24|0)|0)!=0){s=e+(c[p+48>>2]<<4<<2)|0;c[s>>2]=(c[s>>2]|0)+q;s=e+((c[p+48>>2]<<4)+4<<2)|0;c[s>>2]=(c[s>>2]|0)+1;s=e+((c[p+48>>2]<<4)+2<<2)|0;c[s>>2]=(c[s>>2]|0)+r;s=e+((c[p+48>>2]<<4)+6<<2)|0;c[s>>2]=(c[s>>2]|0)+1;if((c[e+((c[p+48>>2]<<4)+8<<2)>>2]|0)>(q|0)){c[e+((c[p+48>>2]<<4)+8<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+12<<2)>>2]|0)<(q|0)){c[e+((c[p+48>>2]<<4)+12<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+10<<2)>>2]|0)>(r|0)){c[e+((c[p+48>>2]<<4)+10<<2)>>2]=r}if((c[e+((c[p+48>>2]<<4)+14<<2)>>2]|0)<(r|0)){c[e+((c[p+48>>2]<<4)+14<<2)>>2]=r}}if((aC(10992,(c[p+76>>2]&255)<<24>>24|0)|0)!=0){s=e+((c[p+48>>2]<<4)+1<<2)|0;c[s>>2]=(c[s>>2]|0)+q;s=e+((c[p+48>>2]<<4)+5<<2)|0;c[s>>2]=(c[s>>2]|0)+1;s=e+((c[p+48>>2]<<4)+3<<2)|0;c[s>>2]=(c[s>>2]|0)+r;s=e+((c[p+48>>2]<<4)+7<<2)|0;c[s>>2]=(c[s>>2]|0)+1;if((c[e+((c[p+48>>2]<<4)+9<<2)>>2]|0)>(q|0)){c[e+((c[p+48>>2]<<4)+9<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+13<<2)>>2]|0)<(q|0)){c[e+((c[p+48>>2]<<4)+13<<2)>>2]=q}if((c[e+((c[p+48>>2]<<4)+11<<2)>>2]|0)>(r|0)){c[e+((c[p+48>>2]<<4)+11<<2)>>2]=r}if((c[e+((c[p+48>>2]<<4)+15<<2)>>2]|0)<(r|0)){c[e+((c[p+48>>2]<<4)+15<<2)>>2]=r}}break L3465}}while(0);break L3465}}while(0)}}while(0);c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}}k=1;while(1){if((k|0)>=(f|0)){break}d=0;if((c[e+((k<<4)+4<<2)>>2]|0)!=0){d=d+(P((c[a+168+(k<<2)>>2]|0)-((c[e+(k<<4<<2)>>2]|0)/(c[e+((k<<4)+4<<2)>>2]|0)|0)|0)|0)|0}if((c[e+((k<<4)+5<<2)>>2]|0)!=0){d=d+(P((c[a+4264+(k<<2)>>2]|0)-((c[e+((k<<4)+1<<2)>>2]|0)/(c[e+((k<<4)+5<<2)>>2]|0)|0)|0)|0)|0}if((c[e+((k<<4)+6<<2)>>2]|0)!=0){d=d+(P((c[a+8360+(k<<2)>>2]|0)-((c[e+((k<<4)+2<<2)>>2]|0)/(c[e+((k<<4)+6<<2)>>2]|0)|0)|0)|0)|0}if((c[e+((k<<4)+7<<2)>>2]|0)!=0){d=d+(P((c[a+12456+(k<<2)>>2]|0)-((c[e+((k<<4)+3<<2)>>2]|0)/(c[e+((k<<4)+7<<2)>>2]|0)|0)|0)|0)|0}o=aa(c[e+((k<<4)+4<<2)>>2]|0,c[e+((k<<4)+5<<2)>>2]|0)|0;r=aa(o,c[e+((k<<4)+6<<2)>>2]|0)|0;if((aa(r,c[e+((k<<4)+7<<2)>>2]|0)|0)>0){c[a+24744+(k<<2)>>2]=((c[a+24744+(k<<2)>>2]|0)+100|0)/2|0}else{c[a+24744+(k<<2)>>2]=((c[a+24744+(k<<2)>>2]|0)*90|0|0)/100|0}if((c[e+((k<<4)+4<<2)>>2]|0)!=0){c[a+168+(k<<2)>>2]=((c[e+(k<<4<<2)>>2]|0)+((c[e+((k<<4)+4<<2)>>2]|0)/2|0)|0)/(c[e+((k<<4)+4<<2)>>2]|0)|0}if((c[e+((k<<4)+5<<2)>>2]|0)!=0){c[a+4264+(k<<2)>>2]=((c[e+((k<<4)+1<<2)>>2]|0)+((c[e+((k<<4)+5<<2)>>2]|0)/2|0)|0)/(c[e+((k<<4)+5<<2)>>2]|0)|0}if((c[e+((k<<4)+6<<2)>>2]|0)!=0){c[a+8360+(k<<2)>>2]=((c[e+((k<<4)+2<<2)>>2]|0)+((c[e+((k<<4)+6<<2)>>2]|0)/2|0)|0)/(c[e+((k<<4)+6<<2)>>2]|0)|0}if((c[e+((k<<4)+7<<2)>>2]|0)!=0){c[a+12456+(k<<2)>>2]=((c[e+((k<<4)+3<<2)>>2]|0)+((c[e+((k<<4)+7<<2)>>2]|0)/2|0)|0)/(c[e+((k<<4)+7<<2)>>2]|0)|0}do{if(((c[a+4264+(k<<2)>>2]|0)-(c[a+168+(k<<2)>>2]|0)|0)<=1){if((c[e+((k<<4)+5<<2)>>2]|0)!=0){break}if((c[e+((k<<4)+4<<2)>>2]|0)==0){break}c[a+4264+(k<<2)>>2]=(c[a+168+(k<<2)>>2]|0)+2}}while(0);do{if(((c[a+4264+(k<<2)>>2]|0)-(c[a+168+(k<<2)>>2]|0)|0)<=1){if((c[e+((k<<4)+4<<2)>>2]|0)!=0){break}if((c[e+((k<<4)+5<<2)>>2]|0)==0){break}c[a+168+(k<<2)>>2]=(c[a+4264+(k<<2)>>2]|0)-2}}while(0);do{if(((c[a+12456+(k<<2)>>2]|0)-(c[a+8360+(k<<2)>>2]|0)|0)<=1){if((c[e+((k<<4)+7<<2)>>2]|0)!=0){break}if((c[e+((k<<4)+6<<2)>>2]|0)==0){break}c[a+12456+(k<<2)>>2]=(c[a+8360+(k<<2)>>2]|0)+2}}while(0);do{if(((c[a+12456+(k<<2)>>2]|0)-(c[a+8360+(k<<2)>>2]|0)|0)<=1){if((c[e+((k<<4)+6<<2)>>2]|0)!=0){break}if((c[e+((k<<4)+7<<2)>>2]|0)==0){break}c[a+8360+(k<<2)>>2]=(c[a+12456+(k<<2)>>2]|0)-2}}while(0);do{if((c[e+((k<<4)+7<<2)>>2]|0)<1){if((c[a+12456+(k<<2)>>2]|0)>((c[a+8360+(k<<2)>>2]|0)+(((c[a+8360+(k<<2)>>2]|0)-(c[a+4264+(k<<2)>>2]|0)|0)/4|0)|0)){break}c[a+12456+(k<<2)>>2]=(c[a+8360+(k<<2)>>2]|0)+(((c[a+8360+(k<<2)>>2]|0)-(c[a+4264+(k<<2)>>2]|0)|0)/4|0)}}while(0);do{if((c[e+((k<<4)+7<<2)>>2]|0)<1){if((c[e+((k<<4)+14<<2)>>2]|0)<=0){break}if((c[a+12456+(k<<2)>>2]|0)>=((c[e+((k<<4)+14<<2)>>2]<<1)-(c[a+8360+(k<<2)>>2]|0)+2|0)){break}c[a+12456+(k<<2)>>2]=(c[e+((k<<4)+14<<2)>>2]<<1)-(c[a+8360+(k<<2)>>2]|0)+2}}while(0);if((c[a+12456+(k<<2)>>2]|0)<=(c[a+8360+(k<<2)>>2]|0)){c[a+12456+(k<<2)>>2]=(c[a+8360+(k<<2)>>2]|0)+1}if((c[a+37072>>2]&17|0)!=0){r=c[n>>2]|0;o=k;q=c[a+168+(k<<2)>>2]|0;s=(c[a+4264+(k<<2)>>2]|0)-(c[a+168+(k<<2)>>2]|0)|0;t=(c[a+8360+(k<<2)>>2]|0)-(c[a+168+(k<<2)>>2]|0)|0;u=(c[a+12456+(k<<2)>>2]|0)-(c[a+168+(k<<2)>>2]|0)|0;v=c[e+((k<<4)+4<<2)>>2]|0;w=c[e+((k<<4)+5<<2)>>2]|0;x=c[e+((k<<4)+6<<2)>>2]|0;y=c[e+((k<<4)+7<<2)>>2]|0;z=c[a+24744+(k<<2)>>2]|0;A=d;au(r|0,10688,(j=i,i=i+88|0,c[j>>2]=o,c[j+8>>2]=q,c[j+16>>2]=s,c[j+24>>2]=t,c[j+32>>2]=u,c[j+40>>2]=v,c[j+48>>2]=w,c[j+56>>2]=x,c[j+64>>2]=y,c[j+72>>2]=z,c[j+80>>2]=A,j)|0)|0;i=j}k=k+1|0}d=0;if((m|0)!=0){if((cy(a+84|0)|0)==0){while(1){if((c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=0){B=(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)!=(a+96|0)}else{B=0}if(!B){break}p=c[(c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]|0)+8>>2]|0;if((c[p+48>>2]|0)>0){if((c[p+8>>2]<<1|0)<((c[a+168+(c[p+48>>2]<<2)>>2]<<1)-(c[a+12456+(c[p+48>>2]<<2)>>2]|0)+(c[a+168+(c[p+48>>2]<<2)>>2]|0)|0)){c[p+48>>2]=0}if((c[p+12>>2]<<1|0)>((c[a+12456+(c[p+48>>2]<<2)>>2]<<1)+(c[a+12456+(c[p+48>>2]<<2)>>2]|0)-(c[a+168+(c[p+48>>2]<<2)>>2]|0)|0)){c[p+48>>2]=0}do{if((c[p+72>>2]|0)>0){if((c[p+72>>2]|0)<=31){break}if((c[p+76>>2]|0)>=127){break}if((aC(10368,(c[p+76>>2]&255)<<24>>24|0)|0)==0){break}k=(c[p+8>>2]|0)-((aa(c[p+4>>2]|0,l)|0)/(m|0)|0)|0;do{if((k|0)<(((c[a+168+(c[p+48>>2]<<2)>>2]|0)+(c[a+4264+(c[p+48>>2]<<2)>>2]|0)|0)/2|0|0)){if((be(c[p+76>>2]|0)|0)==0){break}f=p;A=av((c[p+76>>2]&255)<<24>>24|0)|0;z=((c[p+116>>2]|0)+101|0)/2|0;dy(f,A,z)|0;d=d+1|0}}while(0);k=(c[p+8>>2]|0)-((aa(c[p+4>>2]|0,l)|0)/(m|0)|0)|0;do{if((k|0)>(((c[a+168+(c[p+48>>2]<<2)>>2]|0)+(c[a+4264+(c[p+48>>2]<<2)>>2]|0)+1|0)/2|0|0)){if((bg(c[p+76>>2]|0)|0)==0){break}z=p;A=eF((c[p+76>>2]&255)<<24>>24|0)|0;f=((c[p+116>>2]|0)+101|0)/2|0;dy(z,A,f)|0;d=d+1|0}}while(0)}}while(0);c[p+52>>2]=(c[a+168+(c[p+48>>2]<<2)>>2]|0)+((aa(c[p+4>>2]|0,l)|0)/(m|0)|0);c[p+56>>2]=(c[a+4264+(c[p+48>>2]<<2)>>2]|0)+((aa(c[p+4>>2]|0,l)|0)/(m|0)|0);c[p+60>>2]=(c[a+8360+(c[p+48>>2]<<2)>>2]|0)+((aa(c[p+4>>2]|0,l)|0)/(m|0)|0);c[p+64>>2]=(c[a+12456+(c[p+48>>2]<<2)>>2]|0)+((aa(c[p+4>>2]|0,l)|0)/(m|0)|0)}c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]=c[c[(c[a+108>>2]|0)+(c[a+116>>2]<<2)>>2]>>2]}cz(a+84|0)}}ew(e);if((c[a+37072>>2]|0)!=0){a=c[n>>2]|0;e=d;au(a|0,10128,(j=i,i=i+8|0,c[j>>2]=e,j)|0)|0;i=j}g=d;h=g;i=b;return h|0}function b7(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;a=i;b=0;d=c[7036]|0;c[d+37048>>2]=0;c[d+37044>>2]=0;c[d+37040>>2]=0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){e=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{e=0}if(!e){break}f=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L3649:do{if((c[f+36>>2]|0)!=57345){g=c[f>>2]|0;h=c[f+4>>2]|0;j=c[f+8>>2]|0;k=c[f+12>>2]|0;b=b+1|0;L3651:do{if((aa(c[d+37032>>2]|0,c[d+37036>>2]|0)|0)>0){do{if((h-g+1|0)>(c[d+37032>>2]<<2|0)){if((k-j+1|0)<=(c[d+37036>>2]<<2|0)){break}break L3649}}while(0);do{if((k-j+1<<2|0)>=(c[d+37036>>2]|0)){if((k-j|0)<2){break}break L3651}}while(0);break L3649}}while(0);do{if((h-g+1|0)<4){if((k-j+1|0)>=6){break}break L3649}}while(0);l=d+37040|0;c[l>>2]=(c[l>>2]|0)+(h-g+1);l=d+37044|0;c[l>>2]=(c[l>>2]|0)+(k-j+1);l=d+37048|0;c[l>>2]=(c[l>>2]|0)+1;m=2706}else{m=2706}}while(0);if((m|0)==2706){m=0}c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((c[d+37048>>2]|0)!=0){c[d+37036>>2]=((c[d+37044>>2]|0)+((c[d+37048>>2]|0)/2|0)|0)/(c[d+37048>>2]|0)|0;c[d+37032>>2]=((c[d+37040>>2]|0)+((c[d+37048>>2]|0)/2|0)|0)/(c[d+37048>>2]|0)|0}if((c[d+37072>>2]|0)==0){i=a;return 0}m=c[d+37036>>2]|0;e=c[d+37048>>2]|0;au(c[n>>2]|0,9984,(f=i,i=i+32|0,c[f>>2]=c[d+37032>>2],c[f+8>>2]=m,c[f+16>>2]=e,c[f+24>>2]=b,f)|0)|0;i=f;i=a;return 0}function b8(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0;b=i;d=a;a=0;if((c[d+37048>>2]|0)==0){if((c[d+37072>>2]|0)!=0){e=c[n>>2]|0;au(e|0,9808,(f=i,i=i+8|0,c[f>>2]=958,f)|0)|0;i=f}g=-1;h=g;i=b;return h|0}c[d+37036>>2]=((c[d+37044>>2]|0)+((c[d+37048>>2]|0)/2|0)|0)/(c[d+37048>>2]|0)|0;c[d+37032>>2]=((c[d+37040>>2]|0)+((c[d+37048>>2]|0)/2|0)|0)/(c[d+37048>>2]|0)|0;if((c[d+37072>>2]|0)!=0){e=c[n>>2]|0;j=c[d+37032>>2]|0;k=c[d+37036>>2]|0;au(e|0,9680,(f=i,i=i+24|0,c[f>>2]=967,c[f+8>>2]=j,c[f+16>>2]=k,f)|0)|0;i=f}if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){l=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{l=0}if(!l){break}k=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L3697:do{if((c[k+36>>2]|0)!=57345){j=c[k+8>>2]|0;e=c[k+12>>2]|0;if(((c[k+4>>2]|0)-(c[k>>2]|0)+1|0)>(c[d+37032>>2]<<2|0)){m=2731}else{if((e-j+1|0)>(c[d+37036>>2]<<2|0)){m=2731}}do{if((m|0)==2731){m=0;o=0;if((cy(d+84|0)|0)==0){while(1){if((c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=0){p=(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)!=(d+96|0)}else{p=0}if(!p){break}q=c[(c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]|0)+8>>2]|0;L3712:do{if((c[q+36>>2]|0)!=57345){if(((c[q+12>>2]|0)-(c[q+8>>2]|0)|0)>(e-j<<1|0)){break}if(((c[q+12>>2]|0)-(c[q+8>>2]|0)<<1|0)<(e-j|0)){break}do{if((c[q+8>>2]|0)<=(j+((e-j+1|0)/2|0)|0)){if((c[q+8>>2]|0)<(j-((e-j+1|0)/2|0)|0)){break}if((c[q+12>>2]|0)>(e+((e-j+1|0)/2|0)|0)){break}if((c[q+12>>2]|0)<(e-((e-j+1|0)/2|0)|0)){break}o=o+1|0;break L3712}}while(0)}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((o|0)>4){break L3697}else{c[k+36>>2]=57345;a=a+1|0;break}}}while(0)}}while(0);c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]=c[c[(c[d+108>>2]|0)+(c[d+116>>2]<<2)>>2]>>2]}cz(d+84|0)}if((c[d+37072>>2]|0)!=0){p=c[n>>2]|0;m=a;l=(c[d+37048>>2]|0)-a|0;au(p|0,9568,(f=i,i=i+16|0,c[f>>2]=m,c[f+8>>2]=l,f)|0)|0;i=f}b7()|0;g=0;h=g;i=b;return h|0}function b9(a){a=a|0;var b=0,d=0,e=0;b=a;a=0;if((b|0)!=0){}else{aE(14848,23256,320,25384)}a=0;d=a;a=d+1|0;e=cm(b+120|0,d)|0;while(1){if((e|0)==0){break}aL(e|0,c[o>>2]|0)|0;if((c[b+37076>>2]|0)==2){d=c[o>>2]|0;aL(16440,d|0)|0}if((c[b+37076>>2]|0)!=3){d=c[o>>2]|0;aD(10,d|0)|0}d=a;a=d+1|0;e=cm(b+120|0,d)|0}cn(b+120|0);return}function ca(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+37104|0;e=d|0;f=1;c[7036]=e;g=e;bi(c[o>>2]|0,0,2,0)|0;ci(g);cb(g,a,b);if((c[g+37060>>2]&2|0)!=0){b=g;bZ(b)|0}while(1){if((f|0)!=1){break}cj(g);cc(g);f=cd(g)|0;if((f|0)<0){b=2777;break}d4(g)|0;ce(g);b9(g);cl(g)}if((f|0)<0){h=f;i=d;return h|0}else{h=0;i=d;return h|0}return 0}function cb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=b;b=d;d=e;if((g|0)!=0){}else{aE(14848,23256,127,25360)}if((b|0)<=1){cg(1);aO(0)}e=1;while(1){if((e|0)>=(b|0)){break}if((bh(c[d+(e<<2)>>2]|0,19472)|0)==0){ch()}do{if((a[c[d+(e<<2)>>2]|0]|0)==45){if((a[(c[d+(e<<2)>>2]|0)+1|0]|0)==0){h=2850;break}j=27664;if((e+1|0)<(b|0)){j=c[d+(e+1<<2)>>2]|0}switch(a[(c[d+(e<<2)>>2]|0)+1|0]|0){case 104:{ch();break};case 100:{c[g+37064>>2]=a2(j|0)|0;e=e+1|0;break};case 108:{c[g+37052>>2]=a2(j|0)|0;e=e+1|0;break};case 115:{c[g+37056>>2]=a2(j|0)|0;e=e+1|0;break};case 117:{c[g+37096>>2]=j;e=e+1|0;break};case 105:{c[g>>2]=j;e=e+1|0;break};case 99:{c[g+37080>>2]=j;e=e+1|0;break};case 67:{c[g+37088>>2]=j;e=e+1|0;break};case 118:{k=g+37072|0;c[k>>2]=a2(j|0)|0|c[k>>2];e=e+1|0;break};case 109:{k=g+37060|0;c[k>>2]=a2(j|0)|0|c[k>>2];e=e+1|0;break};case 101:{do{if((a[j|0]|0)==45){if((a[j+1|0]|0)!=0){h=2803;break}aY(2,3)|0}else{h=2803}}while(0);if((h|0)==2803){h=0;if((ar(j|0,18080,c[n>>2]|0)|0)==0){k=c[n>>2]|0;l=j;au(k|0,17672,(m=i,i=i+8|0,c[m>>2]=l,m)|0)|0;i=m}}e=e+1|0;break};case 112:{c[g+37084>>2]=j;e=e+1|0;break};case 111:{do{if((a[j|0]|0)==45){if((a[j+1|0]|0)!=0){h=2811;break}}else{h=2811}}while(0);if((h|0)==2811){h=0;if((ar(j|0,18080,c[o>>2]|0)|0)==0){l=c[n>>2]|0;k=j;au(l|0,17320,(m=i,i=i+8|0,c[m>>2]=k,m)|0)|0;i=m}}e=e+1|0;break};case 102:{if((bh(j|0,17008)|0)==0){c[g+37076>>2]=0}else{if((bh(j|0,16664)|0)==0){c[g+37076>>2]=1}else{if((bh(j|0,16288)|0)==0){c[g+37076>>2]=2}else{if((bh(j|0,15872)|0)==0){c[g+37076>>2]=3}else{if((bh(j|0,15600)|0)==0){c[g+37076>>2]=4}else{if((bh(j|0,15144)|0)==0){c[g+37076>>2]=5}else{if((bh(j|0,14664)|0)==0){c[g+37076>>2]=6}else{k=c[n>>2]|0;l=j;au(k|0,14312,(m=i,i=i+8|0,c[m>>2]=l,m)|0)|0;i=m}}}}}}}e=e+1|0;break};case 110:{c[g+37068>>2]=a2(j|0)|0;e=e+1|0;break};case 120:{eh(j)|0;e=e+1|0;break};case 97:{c[g+37092>>2]=a2(j|0)|0;e=e+1|0;break};default:{au(c[n>>2]|0,13952,(m=i,i=i+1|0,i=i+7&-8,c[m>>2]=0,m)|0)|0;i=m}}}else{h=2850}}while(0);if((h|0)==2850){h=0;if((a[c[d+(e<<2)>>2]|0]|0)!=45){h=2852}else{if((a[(c[d+(e<<2)>>2]|0)+1|0]|0)==0){h=2852}}if((h|0)==2852){h=0;c[g>>2]=c[d+(e<<2)>>2]}}e=e+1|0}i=f;return}function cc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;d=a;if((d|0)!=0){}else{aE(14848,23256,247,25432)}if((c[d+37072>>2]|0)==0){i=b;return}cg(0);au(c[n>>2]|0,8464,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;au(c[n>>2]|0,7352,(a=i,i=i+8|0,c[a>>2]=4,a)|0)|0;i=a;au(c[n>>2]|0,6248,(a=i,i=i+8|0,c[a>>2]=2,a)|0)|0;i=a;au(c[n>>2]|0,5216,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;au(c[n>>2]|0,4320,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;au(c[n>>2]|0,25032,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=c[d+37056>>2]|0;f=c[d+37072>>2]|0;g=c[d+37080>>2]|0;h=c[d+37060>>2]|0;j=c[d+37064>>2]|0;k=c[d+37068>>2]|0;l=c[d+37092>>2]|0;m=c[d+37088>>2]|0;au(c[n>>2]|0,24416,(a=i,i=i+72|0,c[a>>2]=c[d+37052>>2],c[a+8>>2]=e,c[a+16>>2]=f,c[a+24>>2]=g,c[a+32>>2]=h,c[a+40>>2]=j,c[a+48>>2]=k,c[a+56>>2]=l,c[a+64>>2]=m,a)|0)|0;i=a;au(c[n>>2]|0,23592,(a=i,i=i+8|0,c[a>>2]=c[d>>2],a)|0)|0;i=a;au(c[n>>2]|0,22736,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;a1(d+20|0,0)|0;i=b;return}function cd(a){a=a|0;var b=0,d=0;b=a;a=0;if((b|0)!=0){}else{aE(14848,23256,306,25344);return 0}if((a6(c[b>>2]|0,9472)|0)!=0){dq(c[b>>2]|0,b+4|0,c[b+37072>>2]|0);d=a;return d|0}else{a=ec(c[b>>2]|0,b+4|0,c[b+37072>>2]|0)|0;d=a;return d|0}return 0}function ce(a){a=a|0;var b=0,d=0,e=0,f=0,g=0.0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;if((f|0)!=0){}else{aE(14848,23256,290,25448)}if((c[f+37072>>2]|0)==0){i=b;return}a1(d|0,0)|0;cf(e,d,f+20|0)|0;f=(c[e>>2]|0)%60|0;g=+(c[e+4>>2]|0)/1.0e3;au(c[n>>2]|0,11984,(d=i,i=i+24|0,c[d>>2]=(c[e>>2]|0)/60|0,c[d+8>>2]=f,h[d+16>>3]=g,d)|0)|0;i=d;i=b;return}function cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;if((c[a+4>>2]|0)<(c[b+4>>2]|0)){d=(((c[b+4>>2]|0)-(c[a+4>>2]|0)|0)/1e6|0)+1|0;f=b+4|0;c[f>>2]=(c[f>>2]|0)-(d*1e6|0);f=b|0;c[f>>2]=(c[f>>2]|0)+d}if(((c[a+4>>2]|0)-(c[b+4>>2]|0)|0)>1e6){d=((c[a+4>>2]|0)-(c[b+4>>2]|0)|0)/1e6|0;f=b+4|0;c[f>>2]=(c[f>>2]|0)+(d*1e6|0);f=b|0;c[f>>2]=(c[f>>2]|0)-d}c[e>>2]=(c[a>>2]|0)-(c[b>>2]|0);c[e+4>>2]=(c[a+4>>2]|0)-(c[b+4>>2]|0);return(c[a>>2]|0)<(c[b>>2]|0)|0}function cg(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;au(c[n>>2]|0,20816,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;if((d|0)!=0){e=c[n>>2]|0;au(e|0,20144,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a}if((d&2|0)!=0){aO(1)}else{i=b;return}}function ch(){var a=0,b=0;a=i;cg(0);au(c[n>>2]|0,13304,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;au(c[n>>2]|0,12624,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;au(c[n>>2]|0,12096,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;au(c[n>>2]|0,11472,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;au(c[n>>2]|0,11088,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;au(c[n>>2]|0,10936,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0)|0;i=b;aO(0);i=a;return}function ci(a){a=a|0;var b=0;b=a;c[b>>2]=13224;cs(b+48|0);c[b+37052>>2]=0;c[b+37056>>2]=0;c[b+37060>>2]=0;c[b+37064>>2]=-1;c[b+37068>>2]=0;c[b+37072>>2]=0;c[b+37076>>2]=5;c[b+37080>>2]=23048;c[b+37084>>2]=0;c[b+37088>>2]=0;c[b+37092>>2]=95;c[b+37096>>2]=23048;return}function cj(a){a=a|0;var b=0;b=a;c[b+4>>2]=0;cs(b+84|0);cs(b+120|0);c[b+37032>>2]=5;c[b+37036>>2]=8;c[b+37040>>2]=0;c[b+37044>>2]=0;c[b+37048>>2]=0;c[b+164>>2]=0;c[b+156>>2]=0;c[b+44>>2]=0;c[b+28>>2]=0;c[b+32>>2]=0;c[b+36>>2]=0;return}function ck(a){a=a|0;bV(a)|0;return}function cl(a){a=a|0;var b=0;b=a;if((c[b+28>>2]|0)==(c[b+4>>2]|0)){c[b+28>>2]=0}cD(b+84|0,2)|0;if((c[b+4>>2]|0)!=0){ew(c[b+4>>2]|0);c[b+4>>2]=0}if((c[b+28>>2]|0)==0){return}ew(c[b+28>>2]|0);c[b+28>>2]=0;return}function cm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;do{if((a|0)>=0){if((a|0)>(c[d+28>>2]|0)){break}b=0;e=c[d>>2]|0;while(1){if((b|0)<(a|0)){f=(e|0)!=0}else{f=0}if(!f){break}e=c[e>>2]|0;b=b+1|0}if((e|0)!=0){g=c[e+8>>2]|0;h=g;return h|0}else{g=0;h=g;return h|0}}}while(0);g=0;h=g;return h|0}function cn(a){a=a|0;var b=0,d=0,e=0;b=a;if((cy(b)|0)!=0){d=b;cx(d);return}while(1){if((c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]|0)!=0){e=(c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]|0)!=(b+12|0)}else{e=0}if(!e){break}if((c[(c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]|0)+8>>2]|0)!=0){ew(c[(c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]|0)+8>>2]|0)}c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]=c[c[(c[b+24>>2]|0)+(c[b+32>>2]<<2)>>2]>>2]}cz(b);d=b;cx(d);return}function co(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0;f=i;g=b;b=d;d=e;e=0;do{if((b|0)!=0){if((a[b|0]|0)==0){break}if((c[d>>2]|0)>0){e=eA(g|0)|0}h=eA(b|0)|0;do{if((e+h+1|0)>=(c[d>>2]|0)){j=d;c[j>>2]=(c[j>>2]|0)+((h+1>>9)+1<<9);k=ex(g,c[d>>2]|0)|0;if((k|0)!=0){g=k;break}else{j=c[n>>2]|0;au(j|0,22920,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;j=d;c[j>>2]=(c[j>>2]|0)-((h+1>>9)+1<<9);m=g;o=m;i=f;return o|0}}}while(0);k=g+e|0;j=k;p=b;q=h+1|0;eB(j|0,p|0,q)|0;m=g;o=m;i=f;return o|0}}while(0);au(c[n>>2]|0,12552,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0)|0;i=l;m=g;o=m;i=f;return o|0}function cp(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+4096|0;d=b|0;e=a;if((c[e>>2]|0)<2){f=0;g=f;i=b;return g|0}a=0;while(1){if((a|0)>=((c[e>>2]|0)-1|0)){break}c[d+(a<<2)>>2]=(c[e+4108+(a+1<<2)>>2]|0)-(c[e+8204+(a<<2)>>2]|0);a=a+1|0}aI(d|0,(c[e>>2]|0)-1|0,4,4);f=c[d+((((c[e>>2]|0)-1|0)/2|0)<<2)>>2]|0;g=f;i=b;return g|0}function cq(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;f=i;g=a;a=b;b=d;d=e;e=2147483647;if((d|0)!=0){h=c[n>>2]|0;j=a;k=b;au(h|0,16336,(l=i,i=i+16|0,c[l>>2]=j,c[l+8>>2]=k,l)|0)|0;i=l}if((cy(g)|0)==0){while(1){if((c[(c[g+24>>2]|0)+(c[g+32>>2]<<2)>>2]|0)!=0){m=(c[(c[g+24>>2]|0)+(c[g+32>>2]<<2)>>2]|0)!=(g+12|0)}else{m=0}if(!m){break}k=c[(c[(c[g+24>>2]|0)+(c[g+32>>2]<<2)>>2]|0)+8>>2]|0;if((c[k+44>>2]|0)!=-1){j=c[k>>2]|0;if((a|0)!=0){j=j+((aa(c[k+8>>2]|0,b)|0)/(a|0)|0)|0}if((j|0)<(e|0)){e=j;do{if((b|0)!=0){if((d|0)==0){break}h=c[n>>2]|0;o=c[k+48>>2]|0;p=c[k>>2]|0;q=c[k+8>>2]|0;r=j;au(h|0,11872,(l=i,i=i+32|0,c[l>>2]=o,c[l+8>>2]=p,c[l+16>>2]=q,c[l+24>>2]=r,l)|0)|0;i=l}}while(0)}}c[(c[g+24>>2]|0)+(c[g+32>>2]<<2)>>2]=c[c[(c[g+24>>2]|0)+(c[g+32>>2]<<2)>>2]>>2]}cz(g)}if((d|0)==0){s=e;i=f;return s|0}au(c[n>>2]|0,9416,(l=i,i=i+8|0,c[l>>2]=e,l)|0)|0;i=l;s=e;i=f;return s|0}function cr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;d=i;i=i+38424|0;e=d|0;f=d+8|0;g=d+36888|0;h=d+37144|0;j=d+37400|0;k=d+37656|0;l=d+37912|0;m=d+38168|0;o=b;b=0;p=0;c[e>>2]=1024;q=0;r=0;s=-1;t=0;u=0;v=ev(c[e>>2]|0)|0;if((v|0)==0){w=c[n>>2]|0;au(w|0,8424,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0)|0;i=x;i=d;return}a[v]=0;if((c[o+37072>>2]&1|0)!=0){w=c[n>>2]|0;au(w|0,7304,(x=i,i=i+1|0,i=i+7&-8,c[x>>2]=0,x)|0)|0;i=x}q=cp(o+156|0)|0;if((q|0)<=0){if((c[o+37072>>2]&1|0)!=0){w=c[n>>2]|0;y=q;au(w|0,6184,(x=i,i=i+8|0,c[x>>2]=y,x)|0)|0;i=x}q=8;r=12}else{r=(q*7|0|0)/4|0}y=cq(o+84|0,c[o+160>>2]|0,c[o+164>>2]|0,c[o+37072>>2]|0)|0;if((c[o+37076>>2]|0)==3){w=g|0;aP(w|0,5160,(x=i,i=i+32|0,c[x>>2]=0,c[x+8>>2]=0,c[x+16>>2]=0,c[x+24>>2]=0,x)|0)|0;i=x;v=co(v,g|0,e)|0;w=g|0;aP(w|0,4264,(x=i,i=i+32|0,c[x>>2]=0,c[x+8>>2]=0,c[x+16>>2]=0,c[x+24>>2]=0,x)|0)|0;i=x;v=co(v,g|0,e)|0}if((cy(o+84|0)|0)==0){while(1){if((c[(c[o+108>>2]|0)+(c[o+116>>2]<<2)>>2]|0)!=0){z=(c[(c[o+108>>2]|0)+(c[o+116>>2]<<2)>>2]|0)!=(o+96|0)}else{z=0}if(!z){break}g=c[(c[(c[o+108>>2]|0)+(c[o+116>>2]<<2)>>2]|0)+8>>2]|0;w=c[g+48>>2]|0;A=f;B=o+156|0;eB(A|0,B|0,36876)|0;do{if((c[g+72>>2]|0)!=0){if((c[g+116>>2]|0)>=(c[o+37092>>2]|0)){break}c[g+36>>2]=57344}}while(0);if((w|0)!=(s|0)){do{if((c[o+37076>>2]|0)==3){if((s|0)<=-1){break}v=co(v,25e3,e)|0;B=o+120|0;A=aR(v|0)|0;cu(B,A)|0;A=v;B=c[e>>2]|0;eC(A|0,0,B|0)|0;p=0}}while(0);if((c[o+37076>>2]|0)==3){B=h|0;A=c[f+16396+(w<<2)>>2]|0;C=c[f+12+(w<<2)>>2]|0;D=(c[f+20492+(w<<2)>>2]|0)-(c[f+16396+(w<<2)>>2]|0)+1|0;E=(c[f+12300+(w<<2)>>2]|0)-(c[f+12+(w<<2)>>2]|0)|0;F=w;aP(B|0,24344,(x=i,i=i+40|0,c[x>>2]=A,c[x+8>>2]=C,c[x+16>>2]=D,c[x+24>>2]=E,c[x+32>>2]=F,x)|0)|0;i=x;v=co(v,h|0,e)|0}s=w}do{if((c[g+36>>2]|0)>32){if((c[g+36>>2]|0)>122){break}t=t+1|0}}while(0);if((c[g+36>>2]|0)==10){if((c[o+37076>>2]|0)!=3){F=f;E=o+156|0;eB(F|0,E|0,36876)|0;w=c[g+48>>2]|0;if((w|0)>0){E=(c[f+4108+(w<<2)>>2]|0)-(c[f+8204+(w-1<<2)>>2]|0)|0;E=E-r|0;while(1){if((E|0)<=0){break}v=co(v,23568,e)|0;p=p+1|0;E=E-q|0}}E=o+120|0;w=aR(v|0)|0;cu(E,w)|0;w=v;E=c[e>>2]|0;eC(w|0,0,E|0)|0;p=0}}if((c[g+36>>2]|0)==32){if((c[o+37032>>2]|0)!=0){if((c[o+37076>>2]|0)==3){E=j|0;w=c[g>>2]|0;F=c[g+8>>2]|0;D=(c[g+4>>2]|0)-(c[g>>2]|0)+1|0;C=(c[g+12>>2]|0)-(c[g+8>>2]|0)+1|0;aP(E|0,22224,(x=i,i=i+32|0,c[x>>2]=w,c[x+8>>2]=F,c[x+16>>2]=D,c[x+24>>2]=C,x)|0)|0;i=x;v=co(v,j|0,e)|0}else{v=co(v,20768,e)|0;p=p+1|0}}}else{if((c[g+36>>2]|0)!=10){do{if((p|0)==0){if((c[o+37032>>2]|0)==0){break}C=(c[g>>2]|0)-(c[o+16552+(c[g+48>>2]<<2)>>2]|0)|0;if((c[o+160>>2]|0)!=0){D=aa(c[g+8>>2]|0,c[o+164>>2]|0)|0;C=C+((D|0)/(c[o+160>>2]|0)|0)|0}C=C-y|0;if((c[o+37076>>2]|0)==3){D=k|0;F=c[g>>2]|0;w=c[g+8>>2]|0;E=(c[g+4>>2]|0)-(c[g>>2]|0)+1|0;A=(c[g+12>>2]|0)-(c[g+8>>2]|0)+1|0;aP(D|0,22224,(x=i,i=i+32|0,c[x>>2]=F,c[x+8>>2]=w,c[x+16>>2]=E,c[x+24>>2]=A,x)|0)|0;i=x;v=co(v,k|0,e)|0}else{b=(C|0)/(c[o+37032>>2]|0)|0;while(1){if((b|0)<=0){break}v=co(v,20768,e)|0;p=p+1|0;b=b-1|0}}}}while(0);if((c[o+37076>>2]|0)==3){C=l|0;A=c[g>>2]|0;E=c[g+8>>2]|0;w=(c[g+4>>2]|0)-(c[g>>2]|0)+1|0;F=(c[g+12>>2]|0)-(c[g+8>>2]|0)+1|0;aP(C|0,20072,(x=i,i=i+32|0,c[x>>2]=A,c[x+8>>2]=E,c[x+16>>2]=w,c[x+24>>2]=F,x)|0)|0;i=x;v=co(v,l|0,e)|0;}do{if((c[g+36>>2]|0)!=57344){if((c[g+36>>2]|0)==0){G=3049;break}v=co(v,es(c[g+36>>2]|0,c[o+37076>>2]|0)|0,e)|0;do{if((c[g+36>>2]|0)>32){if((c[g+36>>2]|0)>122){break}u=u+1|0}}while(0)}else{G=3049}}while(0);if((G|0)==3049){G=0;do{if((c[g+72>>2]|0)>0){if((c[g+156>>2]|0)==0){break}if((a[c[g+156>>2]|0]|0)==60){break}v=co(v,c[g+156>>2]|0,e)|0;p=p+(eA(c[g+156>>2]|0)|0)|0}}while(0);if((c[g+72>>2]|0)==0){G=3055}else{if((c[g+36>>2]|0)==57344){G=3055}}if((G|0)==3055){G=0;if((a[c[o+37096>>2]|0]|0)!=0){v=co(v,c[o+37096>>2]|0,e)|0}}}if((c[o+37076>>2]|0)==3){if((c[g+72>>2]|0)>0){F=m|0;w=c[g+72>>2]|0;aP(F|0,19424,(x=i,i=i+8|0,c[x>>2]=w,x)|0)|0;i=x;v=co(v,m|0,e)|0;w=0;while(1){if((w|0)>=(c[g+72>>2]|0)){break}aP(m|0,18744,(x=i,i=i+8|0,c[x>>2]=c[g+116+(w<<2)>>2],x)|0)|0;i=x;v=co(v,m|0,e)|0;if((w+1|0)<(c[g+72>>2]|0)){v=co(v,18056,e)|0}w=w+1|0}if((c[g+72>>2]|0)>1){v=co(v,17640,e)|0}w=1;while(1){if((w|0)>=(c[g+72>>2]|0)){break}do{if((c[g+156+(w<<2)>>2]|0)!=0){if((a[c[g+156+(w<<2)>>2]|0]|0)==60){G=3074;break}v=co(v,c[g+156+(w<<2)>>2]|0,e)|0}else{G=3074}}while(0);if((G|0)==3074){G=0;v=co(v,es(c[g+76+(w<<2)>>2]|0,c[o+37076>>2]|0)|0,e)|0}if((w+1|0)<(c[g+72>>2]|0)){v=co(v,18056,e)|0}w=w+1|0}}v=co(v,17304,e)|0}do{if((c[g+72>>2]|0)!=0){if((c[g+156>>2]|0)==0){break}if((a[c[g+156>>2]|0]|0)==60){v=co(v,c[g+156>>2]|0,e)|0;if((c[o+37076>>2]|0)==3){v=co(v,23568,e)|0}p=p+(eA(c[g+156>>2]|0)|0)|0}}}while(0);p=p+1|0}}b=b+1|0;c[(c[o+108>>2]|0)+(c[o+116>>2]<<2)>>2]=c[c[(c[o+108>>2]|0)+(c[o+116>>2]<<2)>>2]>>2]}cz(o+84|0)}do{if((c[o+37076>>2]|0)==3){if((s|0)<=-1){break}v=co(v,25e3,e)|0}}while(0);if((c[o+37076>>2]|0)==3){v=co(v,16984,e)|0}cu(o+120|0,aR(v|0)|0)|0;ew(v);if((c[o+37072>>2]&1|0)==0){i=d;return}au(c[n>>2]|0,16608,(x=i,i=i+24|0,c[x>>2]=b,c[x+8>>2]=t,c[x+16>>2]=u,x)|0)|0;i=x;i=d;return}function cs(a){a=a|0;var b=0;b=a;if((b|0)!=0){c[b>>2]=b+12;c[b+16>>2]=b;c[b+12>>2]=0;c[b+4>>2]=0;c[b+20>>2]=0;c[b+8>>2]=0;c[b+24>>2]=0;c[b+32>>2]=-1;c[b+28>>2]=0;return}else{return}}function ct(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;do{if((e|0)!=0){if((b|0)==0){break}do{if((a|0)!=0){if((c[e+28>>2]|0)==0){break}d=cv(e,a)|0;f=d;if((d|0)==0){g=1;h=g;return h|0}d=ev(12)|0;i=d;if((d|0)!=0){c[i+8>>2]=b;c[i>>2]=f;c[i+4>>2]=c[f+4>>2];c[c[f+4>>2]>>2]=i;c[f+4>>2]=i;i=e+28|0;c[i>>2]=(c[i>>2]|0)+1;g=0;h=g;return h|0}else{g=1;h=g;return h|0}}}while(0);g=cu(e,b)|0;h=g;return h|0}}while(0);g=1;h=g;return h|0}function cu(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;do{if((d|0)!=0){if((a|0)==0){break}b=ev(12)|0;e=b;if((b|0)!=0){c[e+8>>2]=a;c[e+4>>2]=c[d+16>>2];c[e>>2]=c[c[d+16>>2]>>2];c[c[d+16>>2]>>2]=e;c[d+16>>2]=e;e=d+28|0;c[e>>2]=(c[e>>2]|0)+1;f=0;g=f;return g|0}else{f=1;g=f;return g|0}}}while(0);f=1;g=f;return g|0}function cv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;do{if((d|0)!=0){if((a|0)==0){break}if((c[d+28>>2]|0)==0){break}b=c[d>>2]|0;while(1){if((c[b+8>>2]|0)==(a|0)){e=3147;break}if((b|0)==0){e=3145;break}if((b|0)==(d+12|0)){e=3145;break}b=c[b>>2]|0}if((e|0)==3145){f=0;g=f;return g|0}else if((e|0)==3147){f=b;g=f;return g|0}}}while(0);f=0;g=f;return g|0}function cw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((a|0)==0){e=1;f=e;return f|0}b=cv(d,a)|0;a=b;if((b|0)==0){e=1;f=e;return f|0}b=c[d+32>>2]|0;while(1){if((b|0)<0){break}if((c[(c[d+24>>2]|0)+(b<<2)>>2]|0)==(a|0)){c[(c[d+24>>2]|0)+(b<<2)>>2]=c[a+4>>2]}b=b-1|0}c[c[a+4>>2]>>2]=c[a>>2];c[(c[a>>2]|0)+4>>2]=c[a+4>>2];c[a>>2]=0;c[a+4>>2]=0;ew(a);a=d+28|0;c[a>>2]=(c[a>>2]|0)-1;e=0;f=e;return f|0}function cx(a){a=a|0;var b=0,d=0,e=0;b=a;do{if((b|0)!=0){if((c[b+28>>2]|0)==0){break}if((c[b+24>>2]|0)!=0){ew(c[b+24>>2]|0)}c[b+24>>2]=0;a=c[b>>2]|0;while(1){if((a|0)!=0){d=(a|0)!=(b+12|0)}else{d=0}if(!d){break}e=c[a>>2]|0;ew(a);a=e}c[b>>2]=b+12;c[b+16>>2]=b;return}}while(0);return}function cy(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=a;if((d|0)==0){e=1;f=e;i=b;return f|0}a=ex(c[d+24>>2]|0,(c[d+32>>2]|0)+2<<2)|0;if((a|0)!=0){c[d+24>>2]=a;g=d+32|0;c[g>>2]=(c[g>>2]|0)+1;c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]=c[d>>2]}if((a|0)!=0){e=0;f=e;i=b;return f|0}else{a=c[n>>2]|0;au(a|0,11248,(a=i,i=i+1|0,i=i+7&-8,c[a>>2]=0,a)|0)|0;i=a;e=1;f=e;i=b;return f|0}return 0}function cz(a){a=a|0;var b=0;b=a;if((b|0)==0){return}if((c[b+32>>2]|0)!=0){c[b+24>>2]=ex(c[b+24>>2]|0,c[b+32>>2]<<2)|0}else{ew(c[b+24>>2]|0);c[b+24>>2]=0}a=b+32|0;c[a>>2]=(c[a>>2]|0)-1;return}function cA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;do{if((d|0)!=0){a=cv(d,b)|0;e=a;if((a|0)==0){break}if((c[e>>2]|0)!=0){f=c[(c[e>>2]|0)+8>>2]|0;g=f;return g|0}else{f=0;g=f;return g|0}}}while(0);f=0;g=f;return g|0}function cB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;do{if((d|0)!=0){a=cv(d,b)|0;e=a;if((a|0)==0){break}if((c[e+4>>2]|0)!=0){f=c[(c[e+4>>2]|0)+8>>2]|0;g=f;return g|0}else{f=0;g=f;return g|0}}}while(0);f=0;g=f;return g|0}function cC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=0;if((d|0)==0){return}b=ei(c[d+28>>2]|0,22080)|0;e=0;while(1){if((e|0)>=(c[d+28>>2]|0)){break}f=1;g=c[c[d>>2]>>2]|0;while(1){if((g|0)!=0){h=(g|0)!=(d+12|0)}else{h=0}if(!h){break}if((c[g+4>>2]|0)!=(d|0)){if((bm[a&7](c[(c[g+4>>2]|0)+8>>2]|0,c[g+8>>2]|0)|0)>0){f=0;i=c[g+4>>2]|0;c[c[i+4>>2]>>2]=g;c[(c[g>>2]|0)+4>>2]=i;c[g+4>>2]=c[i+4>>2];c[i>>2]=c[g>>2];c[i+4>>2]=g;c[g>>2]=i;g=i}}g=c[g>>2]|0}if((f|0)!=0){g=3236;break}ek(e,b)|0;e=e+1|0}ej(b)|0;return}function cD(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;if((d|0)==0){e=0;f=e;return f|0}if((a|0)==0){e=1;f=e;return f|0}if((cy(d)|0)==0){while(1){if((c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]|0)!=0){g=(c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]|0)!=(d+12|0)}else{g=0}if(!g){break}b=c[(c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]|0)+8>>2]|0;if((b|0)!=0){bn[a&3](b)}c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]=c[c[(c[d+24>>2]|0)+(c[d+32>>2]<<2)>>2]>>2]}cz(d)}cx(d);e=0;f=e;return f|0}function cE(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;b=a;a=c[b>>2]|0;d=c[b+4>>2]|0;e=c[a>>2]|0;f=c[a+4>>2]|0;g=c[a+8>>2]|0;h=c[a+12>>2]|0;i=f-e+1|0;j=h-g+1|0;k=c[b+8>>2]|0;l=b+44|0;m=57344;n=0;o=c[b+36>>2]|0;p=c[b+40>>2]|0;q=c[a+24>>2]|0;r=100;n=100;if((i|0)>2){s=(j|0)>4}else{s=0}L4379:do{if(s){if((c[b+108>>2]|0)>1){break}do{if((dv((i|0)/2|0,(i|0)/2|0,0,j-1|0,d,k)|0)!=3){if((dv((i*6|0|0)/8|0,(i<<1|0)/8|0,0,j-1|0,d,k)|0)==3){break}break L4379}}while(0);t=dC(d,i-1|0,j-1|0,i,k,0,4)|0;u=dC(d,i-1|0,j-2|0,i,k,0,4)|0;if((u-t|0)>=((i|0)/4|0|0)){break}do{if((i|0)<13){if((j|0)>=17){break}t=dC(d,0,0,i,k,0,3)|0;u=dC(d,0,1,i,k,0,3)|0;v=dC(d,i-1|0,0,i,k,0,4)|0;do{if((t|0)>(u|0)){if((v|0)<=0){break}n=(n*98|0|0)/100|0}}while(0)}}while(0);w=(i*5|0|0)/8|0;x=dC(d,w,0,j,k,0,2)|0;if((x|0)>((j|0)/8|0|0)){break}x=x+(dC(d,w,x,j,k,1,2)|0)|0;if((x|0)>((j+2|0)/4|0|0)){break}t=(dC(d,w,x,j,k,0,2)|0)+x|0;if((t|0)>((j*5|0|0)/8|0|0)){break}y=(x+t|0)/2|0;x=y;v=y;w=dC(d,0,x,i,k,0,3)|0;if((w|0)>((i<<2|0)/8|0|0)){break}w=w+(dC(d,w,x,i,k,1,3)|0)|0;if((w|0)>((i*5|0|0)/8|0|0)){break}t=dC(d,w,x,i,k,0,3)|0;t=(t+(w<<1)|0)/2|0;x=(j*11|0|0)/16|0;w=dC(d,i-1|0,x,i,k,0,4)|0;if((w|0)>((i|0)/4|0|0)){break}w=w+(dC(d,i-1-w|0,x,i,k,1,4)|0)|0;if((w|0)>((i|0)/2|0|0)){break}u=dC(d,i-1-w|0,x,i,k,0,4)|0;u=i-1-((u+(w<<1)|0)/2|0)|0;x=dC(d,t,0,j,k,0,2)|0;x=x+(dC(d,t,x,j,k,1,2)|0)|0;x=((x*3|0)+v|0)/4|0;if((dv(t,i-1|0,x,x,d,k)|0)>0){x=dC(d,t,v,j,k,0,2)|0;z=dC(d,t-1|0,v,j,k,0,2)|0;if((x|0)>(z|0)){n=(n*99|0|0)/100|0}x=dC(d,t,v,j,k,0,1)|0;z=dC(d,t+1|0,v,j,k,0,1)|0;if((z|0)<(x|0)){n=(n*99|0|0)/100|0}w=dC(d,i-1|0,0,i,k,0,4)|0;z=dC(d,i-1|0,1,i,k,0,4)|0;if((w|0)>(z|0)){n=(n*99|0|0)/100|0}do{if((dv(0,(i|0)/2|0,j-1|0,j-1|0,d,k)|0)>1){if((dv((i|0)/2|0,i-1|0,0,0,d,k)|0)<=1){break}n=(n*98|0|0)/100|0}}while(0);if((dC(d,0,j-1|0,i,k,0,3)|0)==0){n=(n*98|0|0)/100|0}n=(n*99|0|0)/100|0}x=(j|0)/5|0;while(1){if((x|0)>=((j*3|0|0)/4|0|0)){break}if((dv(t,i-1|0,x,x,d,k)|0)==0){A=3309;break}x=x+1|0}if((x|0)==((j*3|0|0)/4|0|0)){break}x=(j|0)/4|0;while(1){if((x|0)>((j*11|0|0)/16|0|0)){break}if((dv(0,u,x,x,d,k)|0)==0){A=3317;break}x=x+1|0}if((x|0)>((j*11|0|0)/16|0|0)){break}if((c[b+108>>2]|0)>0){break}w=i;y=(j|0)/4|0;x=y;z=y;while(1){if((x|0)>=((j|0)/2|0|0)){break}B=dC(d,0,x,i,k,0,3)|0;if((B|0)<(w|0)){w=B;z=x}x=x+1|0}x=z;t=dC(d,0,(j|0)/16|0,i,k,0,3)|0;u=dC(d,0,(x+((j|0)/16|0)|0)/2|0,i,k,0,3)|0;z=dC(d,0,((x+((j|0)/16|0)|0)/2|0)+1|0,i,k,0,3)|0;if((z|0)>(u|0)){u=z}v=dC(d,0,x,i,k,0,3)|0;z=dC(d,0,x-1|0,i,k,0,3)|0;if((z|0)<(v|0)){v=z}if(((u<<1)+((i|0)/16|0)|0)<(t+v|0)){n=(n*99|0|0)/100|0}if(((u<<1)+1+((i|0)/16|0)|0)<(t+v|0)){break}do{if((j|0)>=20){if((i|0)>=16){break}y=dC(d,0,(j|0)/5|0,i,k,0,3)|0;do{if((y|0)==(dC(d,0,(j|0)/4|0,i,k,0,3)|0)){C=dC(d,0,(j|0)/10|0,i,k,0,3)|0;if((C|0)<=(dC(d,0,(j|0)/4|0,i,k,0,3)|0)){break}C=dC(d,0,1,i,k,0,3)|0;if((C|0)<=((dC(d,0,(j|0)/4|0,i,k,0,3)|0)+1|0)){break}C=dC(d,i-1|0,0,i,k,0,4)|0;if((C|0)<=(dC(d,i-1|0,1,i,k,0,4)|0)){break}break L4379}}while(0)}}while(0);do{if((j|0)>=30){if((i|0)<=15){break}if((dC(d,(i|0)/4|0,(j*3|0|0)/10|0,j,k,1,2)|0)>0){do{if((dC(d,i-2|0,(j*3|0|0)/4|0,j,k,1,1)|0)>0){if((dv((i|0)/4|0,i-2|0,(j*3|0|0)/10|0,(j*3|0|0)/4|0,d,k)|0)==1){break L4379}else{break}}}while(0)}}}while(0);if((dv((i|0)/8|0,i-1-((i|0)/8|0)|0,(j*3|0|0)/10|0,(j*3|0|0)/4|0,d,k)|0)==1){n=(n*98|0|0)/100|0}do{if((j|0)>17){if((i|0)<=9){break}if((dC(d,0,(j|0)/2|0,i,k,0,3)|0)<((i|0)/2|0|0)){A=3361}else{if((dC(d,0,((j|0)/2|0)-1|0,i,k,0,3)|0)<((i|0)/2|0|0)){A=3361}}if((A|0)==3361){if((dC(d,(i|0)/4|0,(j*3|0|0)/10|0,j,k,1,2)|0)>0){if((dC(d,i-2|0,(j<<1|0)/3|0,j,k,1,1)|0)>0){y=dC(d,0,(j|0)/16|0,i,k,0,3)|0;if((y|0)>=(dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0)){n=(n*98|0|0)/100|0}}}}}}while(0);y=dC(d,(i*3|0|0)/4|0,0,j,k,1,2)|0;do{if((y|0)<(dC(d,(i|0)/4|0,j-1|0,j,k,1,1)|0)){C=dC(d,((i*3|0|0)/4|0)-1|0,0,j,k,0,2)|0;if((C|0)>=(dC(d,((i|0)/4|0)+1|0,j-1|0,j,k,0,1)|0)){break}n=(n*98|0|0)/100|0}}while(0);if((p|0)!=0){n=(n*99|0|0)/100|0}if((o|0)==0){n=(n*98|0|0)/100|0}do{if((c[a+56>>2]|0)!=0){if((g|0)<(c[a+56>>2]|0)){break}if((n|0)>=100){break}if((n|0)<=96){break}n=96}}while(0);dy(a,53,n)|0;if((n|0)!=100){break}D=53;E=D;return E|0}}while(0);r=100;n=100;do{if((j|0)>4){if((j|0)<=(i|0)){F=0;break}F=(j<<1|0)>((c[a+60>>2]|0)-(c[a+56>>2]|0)|0)}else{F=0}}while(0);L4554:do{if(F){if((q|0)==1){break}if((c[b+108>>2]|0)>1){break}do{if((dv(0,i-1|0,0,0,d,k)|0)!=1){if((dv(0,i-1|0,1,1,d,k)|0)==1){break}break L4554}}while(0);if((dv(0,i-1|0,(j|0)/2|0,(j|0)/2|0,d,k)|0)!=1){break}do{if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)!=1){if((dv(0,i-1|0,j-2|0,j-2|0,d,k)|0)==1){break}break L4554}}while(0);s=0;do{if((dv(0,i-1|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)!=2){x=1;while(1){if((x|0)>=((j|0)/2|0|0)){break}if((dv(0,i-1|0,x,x,d,k)|0)==2){A=3405;break}x=x+1|0}if((x|0)>=((j|0)/2|0|0)){if((i|0)>6){n=(n*98|0|0)/100|0}else{n=(n*99|0|0)/100|0}}z=(j|0)/8|0;x=(j*7|0|0)/16|0;while(1){if((x|0)<(j-1|0)){G=(z|0)!=0}else{G=0}if(!G){break}if((dv(0,i-1|0,x,x,d,k)|0)!=1){z=z-1|0}x=x+1|0}do{if((j|0)>8){if((z|0)!=0){break}break L4554}}while(0)}else{z=dC(d,(i|0)/2|0,0,j,k,0,2)|0;if((dC(d,(i|0)/2|0,z,j,k,1,2)|0)<(j-1|0)){break L4554}z=dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0;if((dC(d,i-z-1|0,j-1-((j|0)/16|0)|0,i,k,1,4)|0)<(i-1|0)){break L4554}z=dC(d,0,(j|0)/16|0,i,k,0,3)|0;if((dC(d,z,(j|0)/16|0,i,k,1,3)|0)<((i|0)/2|0|0)){break L4554}else{s=1;break}}}while(0);do{if((dv(0,i-1|0,0,0,d,k)|0)>1){if((dv(0,i-1|0,1,1,d,k)|0)<=1){break}break L4554}}while(0);w=dC(d,0,((j*7|0|0)/8|0)-1|0,i,k,0,3)|0;u=w;w=w+((dC(d,w,((j*7|0|0)/8|0)-1|0,i,k,1,3)|0)-1)|0;u=(u+w|0)/2|0;t=dC(d,i-1|0,(0/4|0)+1|0,i,k,0,4)|0;t=i-1-t-((w-u|0)/2|0)|0;w=(t-u+4|0)/8|0;t=t+w|0;u=u-w|0;do{if((dt(t,0,u,j-1|0,d,k,100)|0)<95){t=dC(d,i-1|0,(0/4|0)+1|0,i,k,0,4)|0;t=i-1-t|0;if((dt(t,0,u,j-1|0,d,k,100)|0)<95){break L4554}else{break}}}while(0);w=dC(d,(t+u|0)/2|0,(j|0)/2|0,i,k,1,3)|0;z=w;v=0;x=0;while(1){if((x|0)>=((j*7|0|0)/8|0|0)){break}if(((dC(d,t+((aa(x,u-t|0)|0)/(j|0)|0)|0,x,i,k,1,3)|0)-z|0)>(((i|0)/8|0)+1|0)){A=3442;break}x=x+1|0}if((x|0)<((j*7|0|0)/8|0|0)){n=(n*98|0|0)/100|0}if((x|0)<((j*6|0|0)/8|0|0)){n=(n*99|0|0)/100|0}if((x|0)<((j<<2|0)/8|0|0)){break}w=dC(d,u,j-1|0,i,k,1,4)|0;B=w;w=dC(d,u,j-2|0,i,k,1,4)|0;if((w|0)>(B|0)){B=w}z=B;w=dC(d,u,j-1|0,i,k,1,3)|0;B=w;w=dC(d,u,j-2|0,i,k,1,3)|0;if((w|0)>(B|0)){B=w}if((P(z-B|0)|0)>(((i|0)/8|0)+1|0)){v=v|1}if((v|0)!=0){break}z=i;x=0;B=0;while(1){if((x|0)>=((j*7|0|0)/16|0|0)){break}w=dC(d,0,x,i,k,0,3)|0;if((w|0)<(z|0)){z=w;B=x}x=x+1|0}if((t-z|0)<((i*7|0|0)/16|0|0)){n=(n*98|0|0)/100|0}if((t-z|0)<((i*6|0|0)/16|0|0)){n=(n*98|0|0)/100|0}if((t-z|0)<((i<<2|0)/16|0|0)){break}w=dC(d,0,(j|0)/2|0,i,k,0,3)|0;B=dC(d,w,(j|0)/2|0,i,k,1,3)|0;if((B|0)>(w+((j+16|0)/32|0)|0)){n=(n*98|0|0)/100|0}w=dC(d,0,0,i,k,0,3)|0;B=dC(d,0,1,i,k,0,3)|0;if((B|0)>(w|0)){if((j|0)>9){break}if((n|0)>99){n=(n*99|0|0)/100|0}}if((w|0)==(B|0)){B=dC(d,0,(j|0)/8|0,i,k,0,3)|0}do{if((B|0)>(w|0)){if((x|0)<=9){break}if((s|0)!=0){break}break L4554}}while(0);do{if((B|0)>(w|0)){if((s|0)!=0){break}if((n|0)<=99){break}n=(n*99|0|0)/100|0}}while(0);if((w|0)==(B|0)){if((dC(d,0,(j|0)/4|0,i,k,0,3)|0)>(w|0)){do{if((dC(d,i-1|0,(j|0)/8|0,i,k,0,4)|0)<=((i|0)/4|0|0)){if((dC(d,0,(j*3|0|0)/4|0,i,k,1,3)|0)>=(i-1|0)){break}n=(n*97|0|0)/100|0}}while(0)}}w=B;do{if((o|0)==0){s=(dC(d,i-1|0,1,i,k,0,4)|0)-((j|0)/6|0)|0;if((s|0)>(dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0)){break L4554}else{break}}}while(0);do{if((dC(d,i-1|0,(j*3|0|0)/4|0,i,k,0,4)|0)>((i|0)/2|0|0)){if(((du(f-((i|0)/4|0)|0,f,h-1|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}break L4554}}while(0);z=dC(d,(i|0)/8|0,0,j,k,0,2)|0;x=j;w=(i|0)/2|0;while(1){if((w|0)>=((i*3|0|0)/4|0|0)){break}B=dC(d,w,0,j,k,0,2)|0;if((B|0)<(x|0)){x=B}w=w+1|0}do{if((x|0)<((j|0)/2|0|0)){if((x+((j|0)/16|0)|0)<(z|0)){break}n=(n*98|0|0)/100|0}}while(0);s=dC(d,0,(j|0)/8|0,i,k,0,3)|0;if((s-(i-(dC(d,i-1|0,(j*7|0|0)/8|0,i,k,0,4)|0))|0)>((i|0)/4|0|0)){break}z=dC(d,0,0,j,k,0,2)|0;L4734:do{if((j|0)>=12){if((z|0)<=((j|0)/8|0|0)){break}if((z|0)>=((j|0)/2|0|0)){break}s=(dC(d,i-1|0,(j*3|0|0)/16|0,i,k,0,4)|0)-((i|0)/8|0)|0;do{if((s|0)<=(dC(d,i-1|0,z,i,k,0,4)|0)){y=(dC(d,i-1|0,(j*3|0|0)/16|0,i,k,0,4)|0)-((i|0)/8|0)|0;if((y|0)>(dC(d,i-1|0,z+1|0,i,k,0,4)|0)){break}z=dC(d,0,j-1-((j|0)/32|0)|0,i,k,0,3)|0;w=dC(d,0,j-2-((j|0)/32|0)|0,i,k,0,3)|0;if((z|0)<(w|0)){w=z}do{if((w-(dC(d,0,(j*3|0|0)/4|0,i,k,0,3)|0)|0)>((i|0)/8|0|0)){y=(dC(d,i-1|0,(j*3|0|0)/4|0,i,k,0,4)|0)-((i|0)/8|0)|0;if((y|0)<=(dC(d,i-1|0,j-1-((j|0)/32|0)|0,i,k,0,4)|0)){break}break L4554}}while(0);do{if((dC(d,0,z-1|0,i,k,0,3)|0)>1){if((i|0)>=6){break}n=(n*99|0|0)/100|0;if((dC(d,i-1|0,z-1|0,i,k,0,4)|0)>1){break L4554}else{break}}}while(0);break L4734}}while(0);break L4554}}while(0);if((i|0)>8){s=dC(d,0,(j*3|0|0)/4|0,i,k,0,3)|0;if((s-(dC(d,0,((j|0)/2|0)-1|0,i,k,0,3)|0)|0)>((i|0)/4|0|0)){n=(n*95|0|0)/100|0}s=dC(d,i-1|0,((j|0)/2|0)-1|0,i,k,0,4)|0;if((s-(dC(d,i-1|0,(j*3|0|0)/4|0,i,k,0,4)|0)|0)>((i|0)/8|0|0)){n=(n*99|0|0)/100|0}do{if((dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0)<((i|0)/3|0|0)){s=dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0;if((s-(dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0)|0)<=((i|0)/8|0|0)){break}n=(n*95|0|0)/100|0}}while(0)}z=dC(d,i-1-((i|0)/8|0)|0,j-1|0,j,k,0,1)|0;if((z|0)<=((j|0)/4|0|0)){z=z+(dC(d,i-1-((i|0)/8|0)|0,j-1-z|0,j,k,1,1)|0)|0;if((z|0)<=((j|0)/4|0|0)){z=dC(d,i-1-((i|0)/8|0)|0,j-1-z|0,i,k,0,4)|0;if((dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0)<((i|0)/2|0|0)){do{if((z<<1|0)>=(i|0)){if((dC(d,(i|0)/4|0,0,j,k,0,2)|0)>=((j|0)/2|0|0)){break}if((i|0)<17){n=(n*98|0|0)/100|0}if((i|0)<9){n=(n*97|0|0)/100|0}}}while(0)}}}do{if((i|0)<3){if((j|0)<=7){break}if((c[a+64>>2]|0)!=0){break}n=(n*96|0|0)/100|0}}while(0);u=0;z=i;x=0;while(1){if((x|0)>=((j|0)/2|0|0)){break}B=dC(d,0,x,i,k,0,3)|0;if((B|0)<(z|0)){z=B}if((B|0)>(z+((i|0)/8|0)|0)){A=3564;break}x=x+1|0}if((x|0)>=((j|0)/2|0|0)){n=(n*95|0|0)/100|0}if((c[b+108>>2]|0)>0){break}do{if((c[a+60>>2]|0)!=0){A=3574}else{if((n|0)<=98){A=3574;break}n=98}}while(0);if((A|0)==3574){if((o|0)==0){n=(n*99|0|0)/100|0}if((c[a+8>>2]|0)>(c[a+56>>2]|0)){n=(n*98|0|0)/100|0}if((c[a+12>>2]|0)<(((c[a+56>>2]|0)+((c[a+60>>2]|0)*3|0)|0)/4|0|0)){n=(n*98|0|0)/100|0}if(((c[a+12>>2]|0)-(c[a+8>>2]|0)|0)<(((c[a+60>>2]|0)-(c[a+52>>2]|0)|0)/2|0|0)){n=(n*98|0|0)/100|0}if((p|0)!=0){n=(n*99|0|0)/100|0}}dy(a,49,n)|0}}while(0);r=100;n=100;if((i|0)>2){H=(j|0)>4}else{H=0}do{if(H){if((c[b+108>>2]|0)>0){break}r=(cF(32)|0)<<1;if((c[l+24>>2]|0)>((r|0)/4|0|0)){break}if((c[l+40>>2]|0)>((r|0)/2|0|0)){break}if((c[l+8>>2]|0)>((r|0)/1|0|0)){break}if((c[l+56>>2]|0)>((r|0)/1|0|0)){break}G=dC(d,i-1|0,0,i,k,0,4)|0;if((G|0)<((dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0)-((i|0)/8|0)|0)){break}z=(c[a+264>>2]|0)-1|0;G=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,f+i|0,g+((j|0)/4|0)|0)|0;q=cI(a,c[l+12>>2]|0,G,e-i|0,(g+h|0)/2|0)|0;F=c[l+28>>2]|0;s=cI(a,c[l+44>>2]|0,c[l+60>>2]|0,e,h)|0;y=cI(a,c[l+28>>2]|0,s,f+i|0,h)|0;C=s;z=s;L4857:while(1){if((z|0)==(c[l+12>>2]|0)){break}if((c[a+296+(z<<3)>>2]|0)>(c[a+296+(C<<3)>>2]|0)){C=z}do{if((c[a+296+(z<<3)>>2]|0)<(e+((i|0)/3|0)|0)){if((c[a+296+(z<<3)+4>>2]|0)>=(g+((j|0)/3|0)|0)){break}if((c[a+296+(C<<3)>>2]|0)>(e+((i|0)/2|0)|0)){A=3609;break L4857}}}while(0);z=(z+1|0)%(c[a+264>>2]|0)|0}I=cI(a,G,F,e-((i|0)/8|0)|0,(g+h|0)/2|0)|0;do{if((c[a+296+(I<<3)>>2]|0)<=(e+((i|0)/4|0)|0)){if((c[a+296+(I<<3)+4>>2]|0)>(g+((j<<1|0)/3|0)|0)){A=3615;break}}else{A=3615}}while(0);if((A|0)==3615){do{if((c[l+48>>2]|0)>=(f-((i|0)/8|0)|0)){if((c[l+52>>2]|0)>=(g+((j|0)/8|0)|0)){break}n=(n*99|0|0)/100|0}}while(0);do{if((c[l>>2]|0)<=(e+((i|0)/8|0)|0)){if((c[l+4>>2]|0)>=(g+((j|0)/8|0)|0)){break}n=(n*99|0|0)/100|0}}while(0);if((c[l+56>>2]|0)<=(c[l+24>>2]|0)){n=(n*97|0|0)/100|0}}if((s|0)==(C|0)){break}if(((c[a+296+(s<<3)+4>>2]|0)-(c[a+296+(C<<3)+4>>2]|0)|0)<((j|0)/4|0|0)){break}if((c[a+296+(q<<3)+4>>2]|0)>(g+((j|0)/2|0)|0)){break}if((c[a+296+(q<<3)>>2]|0)>(e+((i|0)/8|0)+((i|0)/16|0)|0)){break}if((c[a+296+(G<<3)+4>>2]|0)>((g+h|0)/2|0|0)){break}if((c[a+296+(G<<3)+4>>2]|0)>(((g*5|0)+(h*3|0)|0)/8|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(G<<3)>>2]|0)<((e+f+1|0)/2|0|0)){break}if((c[a+296+(G<<3)>>2]|0)<((e+(f<<1)|0)/3|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(F<<3)>>2]|0)>(((e*3|0)+f|0)/4|0|0)){break}if((c[a+296+(F<<3)>>2]|0)>(((e*7|0)+f|0)/8|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(F<<3)+4>>2]|0)<((g+(h*3|0)|0)/4|0|0)){break}if((c[a+296+(F<<3)+4>>2]|0)<((g+(h*7|0)|0)/8|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(s<<3)>>2]|0)>((e+(f<<1)|0)/3|0|0)){break}if((c[a+296+(s<<3)>>2]|0)>((e+f|0)/2|0|0)){n=(n*98|0|0)/100|0}if((c[a+296+(s<<3)>>2]|0)>(((e<<1)+2+f|0)/3|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(s<<3)+4>>2]|0)<(((g*3|0)+(h*5|0)|0)/8|0|0)){break}if((c[a+296+(s<<3)+4>>2]|0)<((g+(h*3|0)|0)/4|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(C<<3)+4>>2]|0)>((g+(h<<1)|0)/3|0|0)){break}if((c[a+296+(C<<3)+4>>2]|0)>((g+h|0)/2|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(C<<3)>>2]|0)<((e+(f*3|0)|0)/4|0|0)){break}if((c[a+296+(C<<3)>>2]|0)<((e+(f*7|0)|0)/8|0|0)){n=(n*99|0|0)/100|0}I=cG(a,F,y)|0;if((I|0)>((cF(256)|0)<<1|0)){break}if((I|0)>(cF(256)|0)){n=(n*99|0|0)/100|0}if((c[a+60>>2]|0)!=0){if((o|0)==0){n=(n*99|0|0)/100|0}if((p|0)!=0){n=(n*99|0|0)/100|0}}else{if((n|0)==100){n=99}}dy(a,50,n)|0;if((n|0)!=100){break}D=50;E=D;return E|0}}while(0);r=100;n=100;if((i|0)>3){J=(j|0)>4}else{J=0}L4979:do{if(J){if((c[b+108>>2]|0)>1){break}if((c[b+108>>2]|0)>0){n=(n*98|0|0)/100|0}if((i<<2|0)<(j|0)){n=(n*98|0|0)/100|0}r=(cF(32)|0)<<1;if((c[l+24>>2]|0)>((r|0)/1|0|0)){break}if((c[l+40>>2]|0)>((r|0)/1|0|0)){break}if((c[l+8>>2]|0)>((r|0)/1|0|0)){break}if((c[l+56>>2]|0)>((r|0)/1|0|0)){break}H=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,f,g+((j*3|0|0)/16|0)|0)|0;I=cI(a,c[l+12>>2]|0,c[l+28>>2]|0,f,h-((j|0)/4|0)|0)|0;K=cI(a,H,I,e,g+((j|0)/2|0)|0)|0;L=cI(a,c[l+12>>2]|0,H,e-i|0,(g+h|0)/2|0)|0;M=c[l+28>>2]|0;N=c[l+44>>2]|0;do{if((c[a+296+((cI(a,N,c[l+60>>2]|0,e,g+((j|0)/2|0)|0)|0)<<3)>>2]|0)>=(f-((i|0)/4|0)|0)){if((c[a+296+(N<<3)>>2]|0)<(f-((i|0)/8|0)|0)){A=3704;break}if((c[a+296+(N<<3)+4>>2]|0)<(h-((j|0)/8|0)|0)){A=3704;break}}else{A=3704}}while(0);if(((c[a+296+(H<<3)>>2]|0)-(c[a+296+(K<<3)>>2]|0)|0)<((i|0)/4|0|0)){break}if(((c[a+296+(I<<3)>>2]|0)-(c[a+296+(K<<3)>>2]|0)|0)<((i|0)/4|0|0)){break}if(((c[a+296+(I<<3)>>2]|0)-(c[a+296+(M<<3)>>2]|0)|0)<((i|0)/2|0|0)){break}if(((c[a+296+(H<<3)>>2]|0)-(c[a+296+(L<<3)>>2]|0)|0)<((i|0)/2|0|0)){break}if((c[a+296+(L<<3)+4>>2]|0)>(g+((j|0)/2|0)|0)){break}if((c[a+296+(L<<3)>>2]|0)>(e+((i|0)/4|0)+((i|0)/16|0)|0)){break}if((c[a+296+(M<<3)+4>>2]|0)<(h-((j|0)/2|0)|0)){break}if((c[a+296+(M<<3)>>2]|0)>(e+((i|0)/4|0)|0)){break}if(((du((i|0)/2|0,(i|0)/2|0,0,(j|0)/6|0,d,k,1)|0)<<24>>24|0)==0){break}if(((du((i|0)/2|0,i-1|0,(j|0)/6|0,(j|0)/6|0,d,k,1)|0)<<24>>24|0)==0){break}if(((du((i|0)/2|0,(i|0)/2|0,j-1-((j|0)/8|0)|0,j-1|0,d,k,1)|0)<<24>>24|0)==0){break}do{if((dv((i|0)/2|0,(i|0)/2|0,0,j-1|0,d,k)|0)<2){if((dv((i|0)/3|0,(i|0)/3|0,0,j-1|0,d,k)|0)>=2){break}break L4979}}while(0);if((dv((i|0)/4|0,(i|0)/4|0,j-1-((j|0)/2|0)|0,j-1|0,d,k)|0)==0){break}if((dC(d,(i|0)/2|0,0,j,k,0,2)|0)>((j|0)/4|0|0)){break}if((dC(d,(i|0)/2|0,j-1|0,j,k,0,1)|0)>((j|0)/4|0|0)){break}do{if((dC(d,i-1|0,(j|0)/3|0,j,k,0,4)|0)>((j|0)/4|0|0)){if((dC(d,i-1|0,(j|0)/8|0,j,k,0,4)|0)<=((j|0)/4|0|0)){break}if((dC(d,(i|0)/4|0,(j|0)/8|0,j,k,1,3)|0)>=((j|0)/2|0|0)){break}break L4979}}while(0);if((dC(d,i-1|0,(j<<1|0)/3|0,j,k,0,4)|0)>((j|0)/4|0|0)){break}if((dC(d,i-1|0,(j*3|0|0)/4|0,j,k,0,4)|0)>((j|0)/2|0|0)){break}if((dC(d,i-1|0,(j*7|0|0)/8|0,j,k,0,4)|0)>((j|0)/2|0|0)){break}w=0;K=0;M=(j|0)/5|0;x=M;L=M;while(1){if((x|0)>=((j|0)/2|0|0)){break}z=dC(d,0,x,i,k,0,3)|0;if((z|0)>(w|0)){M=z;w=M;K=M;L=x}x=x+1|0}K=K-1|0;if((dC(d,K,L,1,k,0,1)|0)==1){L=L-1|0;K=K+((dC(d,K,L,i,k,0,3)|0)-1)|0}do{if((K|0)<((i|0)/3|0|0)){if((K+1+(dC(d,K+1|0,L,i,k,1,3)|0)|0)>=((i*3|0|0)/4|0|0)){break}break L4979}}while(0);if((dC(d,i-1|0,L,i,k,0,4)|0)>(((i|0)/8|0)+1|0)){n=(n*99|0|0)/100|0}w=0;I=0;M=j-1-((j|0)/8|0)|0;x=M;H=M;while(1){if((x|0)<((j|0)/2|0|0)){break}z=dC(d,0,x,i,k,0,3)|0;if((z|0)>(w|0)){M=z;w=M;I=M;H=x}x=x-1|0}I=I-1|0;do{if((I|0)<((i|0)/3|0|0)){if((I+1+(dC(d,I+1|0,H,i,k,1,3)|0)|0)>=((i*3|0|0)/4|0|0)){break}break L4979}}while(0);if((dC(d,i-1|0,H,i,k,0,4)|0)>(((i|0)/8|0)+1|0)){n=(n*99|0|0)/100|0}M=0;w=0;N=(j|0)/4|0;x=N;y=N;while(1){if((x|0)>=((j*3|0|0)/4|0|0)){break}z=dC(d,i-1|0,x,i,k,0,4)|0;if((z|0)>=(M|0)){M=z;y=x;w=M+(dC(d,i-1-M|0,x,i,k,1,4)|0)|0}x=x+1|0}if((j|0)>(i*3|0|0)){do{if((M|0)<2){if((w-M|0)>=((i|0)/2|0|0)){break}break L4979}}while(0)}do{if((M|0)>(((i|0)/8|0)+1|0)){if((M|0)>(dC(d,i-1|0,H,i,k,0,4)|0)){break}n=(n*99|0|0)/100|0}}while(0);do{if((M|0)>(((i|0)/8|0)+1|0)){if((M|0)>(dC(d,i-1|0,L,i,k,0,4)|0)){break}n=(n*99|0|0)/100|0}}while(0);if(((du(K,K,L,H,d,k,1)|0)<<24>>24|0)!=1){break}if(((du(I,I,L,H,d,k,1)|0)<<24>>24|0)!=1){break}if(((du(K,K,0,L,d,k,1)|0)<<24>>24|0)!=1){break}if(((du(I,I,H,j-1|0,d,k,1)|0)<<24>>24|0)!=1){break}L5137:do{if((c[b+108>>2]|0)>0){do{if((c[b+132>>2]|0)<((i|0)/2|0|0)){if((c[b+136>>2]|0)>=((j|0)/2|0|0)){break}break L5137}}while(0);break L4979}}while(0);dy(a,51,n)|0;if((n|0)!=100){break}D=51;E=D;return E|0}}while(0);r=100;n=100;if((j|0)>3){O=(i|0)>2}else{O=0}L5153:do{if(O){if((c[b+108>>2]|0)>1){break}r=(cF(32)|0)<<1;if((c[l+24>>2]|0)<((r|0)/16|0|0)){break}z=(c[a+264>>2]|0)-1|0;J=cI(a,0,z,e,g-j|0)|0;H=cI(a,0,z,e-(i<<1)|0,(g+(h*7|0)|0)/8|0)|0;I=cI(a,0,z,e-(i<<1)|0,((g*5|0)+(h*3|0)|0)/8|0)|0;L=cI(a,0,z,(e+(f<<1)|0)/3|0,h+j|0)|0;K=cI(a,H,L,f,((g*3|0)+h|0)/4|0)|0;M=L;z=L;while(1){if((z|0)==(H|0)){break}if((c[a+296+(z<<3)+4>>2]|0)<(c[a+296+(M<<3)+4>>2]|0)){M=z}if((c[a+296+(z<<3)+4>>2]|0)>((c[a+296+(M<<3)+4>>2]|0)+1|0)){A=3816;break}if((c[a+296+(z<<3)>>2]|0)<(e+((i|0)/4|0)|0)){A=3818;break}z=(z+1|0)%(c[a+264>>2]|0)|0}if((c[a+196>>2]|0)>1){z=(c[a+264>>2]|0)-1|0;B=(c[a+268>>2]|0)-1|0;if((c[a+196>>2]|0)>2){B=(c[a+272>>2]|0)-1|0;n=(n*99|0|0)/100|0}Q=cI(a,z+1|0,B,f,h)|0;R=cI(a,z+1|0,B,e,h)|0;if(((c[a+296+(J<<3)>>2]|0)-(c[a+296+(H<<3)>>2]|0)|0)<(((i|0)/4|0)+1|0)){n=(n*96|0|0)/100|0}z=cI(a,z+1|0,B,e,g)|0;do{if(((c[a+296+(z<<3)>>2]|0)-e|0)<(((i|0)/4|0)+1|0)){if(((c[a+296+(z<<3)+4>>2]|0)-g|0)>=(((j|0)/4|0)+1|0)){break}if((i|0)<=7){break}n=(n*97|0|0)/100|0}}while(0)}else{Q=cI(a,M,J,(e+(f*3|0)|0)/4|0,h-((j|0)/8|0)|0)|0;R=cI(a,M,J,e,h-((j|0)/8|0)|0)|0;if(((c[a+296+(Q<<3)+4>>2]|0)-g|0)>((j*3|0|0)/4|0|0)){A=3833}else{if(((c[a+296+(R<<3)+4>>2]|0)-g|0)>((j*3|0|0)/4|0|0)){A=3833}}if((A|0)==3833){n=(n*96|0|0)/100|0}}if((M|0)==(Q|0)){break}if((c[a+296+(J<<3)+4>>2]|0)>(g+((j|0)/8|0)|0)){break}if(((c[a+296+(H<<3)+4>>2]|0)-(c[a+296+(J<<3)+4>>2]|0)|0)<((j|0)/2|0|0)){break}if(((c[a+296+(K<<3)>>2]|0)-(c[a+296+(H<<3)>>2]|0)|0)<((i|0)/4|0|0)){break}if((P((c[a+296+(K<<3)+4>>2]|0)-(c[a+296+(H<<3)+4>>2]|0)|0)|0)>((j|0)/4|0|0)){break}if((c[a+296+(H<<3)>>2]|0)>(e+((i|0)/8|0)|0)){break}if((c[a+296+(H<<3)+4>>2]|0)>(h-((j|0)/8|0)|0)){break}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(H<<3)+4>>2]|0)|0)<((j|0)/8|0|0)){break}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(H<<3)+4>>2]|0)|0)<((j|0)/6|0|0)){n=(n*99|0|0)/100|0}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(K<<3)+4>>2]|0)|0)<(((j|0)/16|0)+1|0)){break}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(K<<3)+4>>2]|0)<<1|0)<=((c[a+296+(K<<3)+4>>2]|0)-(c[a+296+(Q<<3)+4>>2]|0)|0)){break}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(K<<3)+4>>2]|0)|0)<((c[a+296+(K<<3)+4>>2]|0)-(c[a+296+(Q<<3)+4>>2]|0)|0)){n=(n*99|0|0)/100|0}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(K<<3)+4>>2]|0)|0)<((j|0)/6|0|0)){n=(n*99|0|0)/100|0}if(((c[a+296+(L<<3)+4>>2]|0)-(c[a+296+(K<<3)+4>>2]|0)|0)<((j|0)/8|0|0)){n=(n*99|0|0)/100|0}if((c[a+296+(L<<3)+4>>2]|0)<(h-1-((j|0)/8|0)|0)){break}if((c[a+296+(K<<3)>>2]|0)<(e+((i|0)/4|0)|0)){break}if((c[a+296+(K<<3)>>2]|0)<(e+((i|0)/2|0)|0)){n=(n*98|0|0)/100|0}if((c[a+296+(K<<3)+4>>2]|0)>(h-1|0)){break}if((c[a+296+(K<<3)+4>>2]|0)>(h-((j|0)/16|0)|0)){break}if((c[a+296+(K<<3)+4>>2]|0)>=(h|0)){break}if((c[a+296+(M<<3)>>2]|0)<(e+((i|0)/3|0)|0)){break}if((c[a+296+(M<<3)+4>>2]|0)>(g+((j<<1|0)/3|0)|0)){break}if(((c[a+296+(Q<<3)+4>>2]|0)-(c[a+296+(M<<3)+4>>2]|0)|0)<(((j|0)/16|0)+1|0)){break}if((c[a+296+(Q<<3)>>2]|0)<(e+((i|0)/3|0)|0)){break}if((c[a+296+(R<<3)>>2]|0)>(e+((i|0)/2|0)|0)){break}if((c[a+296+(R<<3)>>2]|0)>(e+((i|0)/3|0)|0)){n=(n*99|0|0)/100|0}if((c[a+296+(Q<<3)+4>>2]|0)<(g+((j|0)/3|0)|0)){break}if((c[a+296+(Q<<3)>>2]|0)<(e+((i|0)/2|0)|0)){n=(n*96|0|0)/100|0}do{if((c[a+296+(Q<<3)>>2]|0)<((c[l+32>>2]|0)-((i|0)/2|0)|0)){if((c[l+36>>2]|0)<(h-1-((j|0)/8|0)|0)){break}n=(n*96|0|0)/100|0}}while(0);if((c[a+296+(R<<3)+4>>2]|0)<(g+((j|0)/3|0)|0)){break}if((P((c[a+296+(K<<3)+4>>2]|0)-(c[a+296+(H<<3)+4>>2]|0)|0)|0)>((j|0)/4|0|0)){break}y=cG(a,J,I)|0;if((y|0)>((cF(256)|0)<<1|0)){break}if((H|0)!=(I|0)){y=cG(a,I,H)|0}else{y=0}if((y|0)>((cF(256)|0)<<1|0)){break}y=cG(a,H,K)|0;if((y|0)>(cF(256)|0)){break}y=cG(a,K,L)|0;if((y|0)>(cF(256)|0)){break}y=cG(a,Q,R)|0;if((y|0)>((cF(256)|0)<<1|0)){break}do{if((c[b+108>>2]|0)==1){if(((c[a+296+(M<<3)>>2]|0)-(c[a+296+(J<<3)>>2]|0)|0)<=((i|0)/4|0|0)){break}break L5153}}while(0);if((o|0)==0){n=(n*99|0|0)/100|0}dy(a,52,n)|0}}while(0);r=100;n=100;if((i|0)>3){S=(j|0)>4}else{S=0}L5319:do{if(S){if((c[b+108>>2]|0)>2){break}do{if((dC(d,0,(j|0)/4|0,i,k,0,3)|0)>((i|0)/2|0|0)){if((dC(d,i-1|0,0,j,k,0,2)|0)<=((j|0)/4|0|0)){break}break L5319}}while(0);if((dC(d,0,(j|0)/2|0,i,k,0,3)|0)>((i|0)/4|0|0)){break}if((dC(d,0,(j*3|0|0)/4|0,i,k,0,3)|0)>((i|0)/4|0|0)){break}if((dC(d,i-1|0,(j*3|0|0)/4|0,i,k,0,4)|0)>((i|0)/2|0|0)){break}do{if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h,c[a+68>>2]|0,k)|0)!=3){if((dv(e+((i*5|0|0)/8|0)|0,e+((i*5|0|0)/8|0)|0,g,h,c[a+68>>2]|0,k)|0)==3){A=3940;break}do{if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/4|0)|0,h,c[a+68>>2]|0,k)|0)!=2){if((dv(e+((i*5|0|0)/8|0)|0,e+((i*5|0|0)/8|0)|0,g+((j|0)/4|0)|0,h,c[a+68>>2]|0,k)|0)==2){break}break L5319}}while(0);if((dC(c[a+68>>2]|0,(e+f|0)/2|0,g,j,k,0,2)|0)<((j|0)/2|0|0)){break L5319}else{n=(n*99|0|0)/100|0;break}}else{A=3940}}while(0);if((A|0)==3940){do{if((dC(c[a+68>>2]|0,e+((i|0)/2|0)|0,g,i,k,0,2)|0)>((j|0)/8|0|0)){if((dC(c[a+68>>2]|0,f-((i|0)/4|0)|0,g,i,k,0,2)|0)<=((j|0)/8|0|0)){break}break L5319}}while(0)}if((dv(e,f,h-((j|0)/4|0)|0,h-((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=2){break}x=g+((j|0)/6|0)|0;while(1){if((x|0)>=(g+((j|0)/2|0)|0)){break}w=dC(c[a+68>>2]|0,f,x,i,k,0,4)|0;if((w|0)>((i|0)/2|0|0)){A=3949;break}w=w+(dC(c[a+68>>2]|0,f-w+1|0,x-1|0,i,k,0,4)|0)|0;if((w|0)>((i|0)/2|0|0)){A=3951;break}x=x+1|0}if((x|0)>=(g+((j|0)/2|0)|0)){break}if((dC(c[a+68>>2]|0,e,h-((j|0)/3|0)|0,i,k,0,3)|0)>((i|0)/4|0|0)){break}if((dC(c[a+68>>2]|0,f,h-((j|0)/3|0)|0,i,k,0,4)|0)>((i|0)/4|0|0)){break}if((c[b+108>>2]|0)!=1){break}if((c[b+136>>2]|0)<((j|0)/2|0|0)){n=(n*95|0|0)/100|0}if((c[b+128>>2]|0)<((j|0)/4|0|0)){break}do{if((c[b+124>>2]|0)<1){if((i-1-(c[b+132>>2]|0)|0)<=2){break}n=(n*99|0|0)/100|0}}while(0);do{if((dC(c[a+68>>2]|0,e,g+((j|0)/2|0)|0,i,k,0,3)|0)>0){if((dC(c[a+68>>2]|0,e,g+((j|0)/4|0)|0,i,k,0,3)|0)!=0){break}if((dC(c[a+68>>2]|0,e,h-((j|0)/4|0)|0,i,k,0,3)|0)!=0){break}n=(n*97|0|0)/100|0}}while(0);t=dC(d,0,(j|0)/8|0,i,k,0,3)|0;v=dC(d,0,j-1-((j|0)/8|0)|0,i,k,0,3)|0;u=dC(d,0,(j|0)/2|0,i,k,0,3)|0;do{if((t+v-(u<<1)|0)<(-2-((i|0)/16|0)|0)){if((t+u+v|0)<=0){break}break L5319}}while(0);do{if((t+v-(u<<1)|0)<1){if((t+u+v|0)<=0){break}n=(n*99|0|0)/100|0}}while(0);w=i;x=0;while(1){if((x|0)>=((j|0)/4|0|0)){break}t=dC(d,0,x,i,k,0,3)|0;u=dC(d,t,x,i,k,1,3)|0;if((u+t|0)>((i|0)/2|0|0)){if((u|0)>((i|0)/4|0|0)){A=3983;break}}if((t|0)<(w|0)){w=t}else{if((t|0)>(w|0)){A=3987;break}}x=x+1|0}do{if((x|0)<((j|0)/4|0|0)){if((t+u|0)>((i|0)/2|0|0)){break}break L5319}}while(0);z=0;x=(j|0)/2|0;while(1){if((x|0)>=(j|0)){break}if((dv((i|0)/2|0,i-1|0,x,x,d,k)|0)>1){z=z+1|0}if((z|0)>((j|0)/8|0|0)){A=3999;break}x=x+1|0}if((x|0)<(j|0)){break}if((p|0)!=0){n=(n*99|0|0)/100|0}if((o|0)==0){n=(n*98|0|0)/100|0}if((c[a+24>>2]|0)!=0){n=(n*98|0|0)/100|0}dy(a,54,n)|0;m=54}}while(0);r=100;n=100;if((i|0)>2){T=(j|0)>4}else{T=0}L5450:do{if(T){if((c[b+108>>2]|0)>1){break}if((dC(d,(i|0)/2|0,0,j,k,0,2)|0)>((j|0)/8|0|0)){break}if((dv(0,i-1|0,(j*3|0|0)/4|0,(j*3|0|0)/4|0,d,k)|0)!=1){break}x=0;m=0;S=0;while(1){if((x|0)>=((j|0)/2|0|0)){break}B=dC(d,0,x,i,k,0,3)|0;if((m|0)>0){if((B|0)>((i|0)/4|0|0)){A=4025;break}}B=dC(d,B,x,i,k,1,3)|0;if((B|0)>(m|0)){m=B;S=x}x=x+1|0}do{if((m|0)>=((i|0)/4|0|0)){if((x|0)==((j|0)/2|0|0)){break}B=dC(d,0,(j|0)/2|0,i,k,0,3)|0;B=dC(d,B,(j|0)/2|0,i,k,1,3)|0;if((m|0)<(B<<1|0)){break L5450}w=0;x=x+((j|0)/16|0)|0;while(1){if((x|0)>=(j|0)){break}if((dv(0,i-1|0,x,x,d,k)|0)!=1){A=4038;break}B=dC(d,i-1|0,x,i,k,0,4)|0;if((B|0)<(w|0)){A=4040;break}if((B-1|0)>(w|0)){w=B-1|0}x=x+1|0}do{if((x|0)>=(j|0)){if((w|0)<((i|0)/3|0|0)){break}B=dC(d,i-1|0,0,j,k,0,2)|0;B=B+((dC(d,i-1|0,B,j,k,1,2)|0)+((j|0)/16|0))|0;z=dC(d,i-1|0,B,i,k,0,4)|0;if((B|0)<((j|0)/2|0|0)){if((z|0)>(B|0)){break L5450}B=dC(d,0,B,i,k,0,3)|0;do{if((B|0)>((i|0)/4|0|0)){if((B|0)>(z+((i|0)/16|0)|0)){break}break L5450}}while(0)}S=dC(d,0,(j*3|0|0)/8|0,i,k,0,3)|0;if((S|0)<=((dC(d,i-1|0,(j*3|0|0)/8|0,i,k,0,4)|0)+((i|0)/8|0)|0)){n=(n*98|0|0)/100|0}do{if((dv(0,i-1|0,(j|0)/4|0,(j|0)/4|0,d,k)|0)==1){if((dC(d,0,(j|0)/4|0,i,k,0,3)|0)>=((i|0)/2|0|0)){break}n=(n*96|0|0)/100|0}}while(0);do{if((c[a+60>>2]|0)!=0){if((j|0)>=((c[a+60>>2]|0)-(c[a+56>>2]|0)|0)){break}n=(n*99|0|0)/100|0}}while(0);do{if((c[a+60>>2]|0)!=0){if((j<<1|0)>=((c[a+60>>2]|0)-(c[a+56>>2]|0)|0)){break}n=(n*96|0|0)/100|0}}while(0);if((j|0)>(i*3|0|0)){n=(n*99|0|0)/100|0}if((p|0)!=0){n=(n*99|0|0)/100|0}if((o|0)==0){n=(n*99|0|0)/100|0}S=a;R=n;dy(S,55,R)|0;break L5450}}while(0);break L5450}}while(0)}}while(0);r=100;n=100;if((i|0)>2){U=(j|0)>4}else{U=0}L5537:do{if(U){if((c[b+108>>2]|0)!=2){break}if((dv(e,f,g+((j|0)/4|0)|0,g+((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=2){break}do{if((dv(e,f,h-((j|0)/4|0)|0,h-((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=2){if((dv(e,f,h-((j*3|0|0)/8|0)|0,h-((j*3|0|0)/8|0)|0,c[a+68>>2]|0,k)|0)==2){break}break L5537}}while(0);if(((du(e,e+((i|0)/4|0)|0,h-((j|0)/4|0)|0,h-((j|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}if(((du(e,e+((i|0)/2|0)|0,g+((j|0)/4|0)|0,g+((j|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/4|0)|0,h-((j|0)/4|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){break}w=0;t=0;u=0;T=g+((j|0)/3|0)|0;x=T;z=T;while(1){if((x|0)>(h-((j|0)/3|0)|0)){break}B=dC(c[a+68>>2]|0,e,x,i,k,0,3)|0;do{if((B|0)>(w|0)){A=4095}else{if((P(B-w|0)|0)>((i|0)/8|0|0)){break}T=dC(c[a+68>>2]|0,e+B|0,x,i,k,1,3)|0;t=T;if((T|0)>((i|0)/2|0|0)){A=4095}}}while(0);if((A|0)==4095){A=0;if((B|0)>(w|0)){w=B}z=x;if((t|0)>(u|0)){u=t}}x=x+1|0}do{if((z|0)<(h-((j|0)/3|0)|0)){if((w|0)<((i|0)/8|0|0)){if((u|0)<=((i|0)/2|0|0)){break}}if((w|0)>((i|0)/2|0|0)){break}if((w|0)<((i|0)/4|0|0)){n=(n*99|0|0)/100|0}if((w|0)<=((i|0)/8|0|0)){n=(n*98|0|0)/100|0}B=dC(c[a+68>>2]|0,f,h-((j|0)/4|0)|0,i,k,0,4)|0;do{if((B|0)>(dC(c[a+68>>2]|0,f,h-((j|0)/5|0)|0,i,k,0,4)|0)){if((B|0)<=(dC(c[a+68>>2]|0,f,h-((j<<1|0)/5|0)|0,i,k,0,4)|0)){break}break L5537}}while(0);B=0;while(1){if((B|0)>=(c[b+108>>2]|0)){break}if((c[b+112+(B*28|0)+24>>2]|0)<(z-g+1|0)){A=4117;break}if((c[b+112+(B*28|0)+24>>2]|0)<(z-g+((j|0)/8|0)|0)){A=4119;break}B=B+1|0}if((B|0)==(c[b+108>>2]|0)){break L5537}B=0;while(1){if((B|0)>=(c[b+108>>2]|0)){break}if((c[b+112+(B*28|0)+16>>2]|0)>(z-g-1|0)){A=4127;break}B=B+1|0}if((B|0)==(c[b+108>>2]|0)){break L5537}t=z;w=0;T=g+((j|0)/3|0)|0;x=T;z=T;u=T;while(1){if((x|0)>(h-((j|0)/3|0)|0)){break}B=dC(c[a+68>>2]|0,f,x,i,k,0,4)|0;if((B|0)>=(w|0)){u=x}do{if((B|0)>(w|0)){A=4139}else{if((P(B-w|0)|0)>((i+4|0)/8|0|0)){break}if((dC(c[a+68>>2]|0,f-B|0,x,i,k,1,4)|0)>((i|0)/2|0|0)){A=4139}}}while(0);if((A|0)==4139){A=0;if((B|0)>(w|0)){w=B}z=x}x=x+1|0}if((z|0)>(g+((j|0)/2|0)+((j|0)/10|0)|0)){break L5537}if((w|0)>((i|0)/2|0|0)){break L5537}do{if((dv(e,f,z,z,c[a+68>>2]|0,k)|0)!=1){if((dv(e,f,z+1|0,z+1|0,c[a+68>>2]|0,k)|0)==1){break}if((dv(e,f,(z+u|0)/2|0,(z+u|0)/2|0,c[a+68>>2]|0,k)|0)==1){break}break L5537}}while(0);if((P(t-z|0)|0)>((j+5|0)/10|0|0)){n=(n*99|0|0)/100|0}if((P(t-z|0)|0)>((j+4|0)/8|0|0)){n=(n*99|0|0)/100|0}if((P(t-z|0)|0)>((j+2|0)/4|0|0)){break L5537}z=i;x=0;while(1){if((x|0)>=(((j|0)/8|0)+2|0)){break}B=dC(d,0,x,i,k,0,3)|0;if((B|0)<(z|0)){z=B}if((B|0)>(z+((i|0)/16|0)|0)){A=4163;break}x=x+1|0}if((x|0)<(((j|0)/8|0)+2|0)){break L5537}z=i;x=0;while(1){if((x|0)>=(((j|0)/8|0)+2|0)){break}B=dC(d,0,j-1-x|0,i,k,0,3)|0;if((B|0)<(z|0)){z=B}if((B|0)>(z+((i|0)/16|0)|0)){A=4173;break}x=x+1|0}if((x|0)<(((j|0)/8|0)+2|0)){break L5537}do{if((j|0)>16){if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)<=1){break}if((dC(d,0,j-1|0,i,k,0,3)|0)>=(((i|0)/8|0)+1|0)){break}break L5537}}while(0);z=0;x=(j|0)/2|0;while(1){if((x|0)>=(j|0)){break}if((dv(0,i-1|0,x,x,d,k)|0)>2){z=z+1|0}if((z|0)>((j|0)/8|0|0)){A=4187;break}x=x+1|0}if((x|0)<(j|0)){break L5537}if((dC(d,i-1|0,0,i,k,0,4)|0)==0){n=(n*99|0|0)/100|0}if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)>1){n=(n*98|0|0)/100|0}if((dv(i-1|0,i-1|0,(j|0)/2|0,j-1|0,d,k)|0)>1){n=(n*98|0|0)/100|0}if((dv(0,i-1|0,0,0,d,k)|0)>1){n=(n*98|0|0)/100|0}if((j|0)>15){if((dv(0,i-1|0,1,1,d,k)|0)>1){n=(n*98|0|0)/100|0}}if((o|0)==0){if(((c[a+56>>2]|0)-(c[a+8>>2]|0)<<3|0)>=(j|0)){n=(n*98|0|0)/100|0}else{n=(n*99|0|0)/100|0}}do{if((p|0)!=0){if(((c[a+12>>2]|0)-(c[a+60>>2]|0)<<3|0)<(j|0)){break}n=(n*99|0|0)/100|0}}while(0);dy(a,56,n)|0;break L5537}}while(0)}}while(0);r=100;n=100;if((i|0)>2){V=(j|0)>4}else{V=0}L5734:do{if(V){if((c[b+108>>2]|0)>1){break}do{if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h-((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=2){if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h,c[a+68>>2]|0,k)|0)==3){break}if((dv(e+((i*3|0|0)/8|0)|0,e+((i*3|0|0)/8|0)|0,g,h,c[a+68>>2]|0,k)|0)==3){break}if((dv(e+((i|0)/4|0)|0,f-((i|0)/4|0)|0,g,h,c[a+68>>2]|0,k)|0)==3){break}break L5734}}while(0);if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,g+((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)<1){break}if((dv(e+((i|0)/2|0)|0,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k)|0)<1){break}do{if((dv(e,f,g+((j|0)/4|0)|0,g+((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)!=2){if((dv(e,f,g+((j*3|0|0)/8|0)|0,g+((j*3|0|0)/8|0)|0,c[a+68>>2]|0,k)|0)==2){break}break L5734}}while(0);if((dv(f-((i|0)/8|0)|0,f,g+((j|0)/4|0)|0,g+((j|0)/4|0)|0,c[a+68>>2]|0,k)|0)==0){n=(n*97|0|0)/100|0}w=0;U=g+((j|0)/2|0)|0;x=U;z=U;while(1){if((x|0)>(h-((j|0)/4|0)|0)){break}B=dC(c[a+68>>2]|0,e,x,i,k,0,3)|0;if((B|0)>(w|0)){w=B;z=x}x=x+1|0}do{if((w|0)>=1){if((w|0)<((i|0)/8|0|0)){break}x=z;do{if((w|0)<((i|0)/2|0|0)){B=(dC(c[a+68>>2]|0,e+w-1|0,x,((j|0)/8|0)+1|0,k,0,2)|0)/2|0;U=x+B|0;z=U;x=U;B=dC(c[a+68>>2]|0,e+w-1|0,x,(i|0)/2|0,k,0,3)|0;w=w+B|0;if((w|0)<((i|0)/2|0|0)){break L5734}else{break}}}while(0);if((i|0)>5){do{if((dv(e+((i|0)/2|0)|0,f,z,h,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/2|0)|0,f,z,h-((j|0)/8|0)|0,c[a+68>>2]|0,k)|0)==1){break}break L5734}}while(0)}if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,z,h,c[a+68>>2]|0,k)|0)>1){break L5734}if((dv(e+((i|0)/2|0)|0,f,z,z,c[a+68>>2]|0,k)|0)!=1){break L5734}if((c[b+108>>2]|0)<1){if((i|0)>=8){break L5734}n=(n*98|0|0)/100|0}else{if((c[b+136>>2]|0)>=(z+1|0)){break L5734}if((c[b+128>>2]|0)>(z-1|0)){break L5734}do{if((c[b+108>>2]|0)>1){if((c[b+156>>2]|0)>(z-1|0)){break L5734}else{break}}}while(0)}L5808:do{if((dC(c[a+68>>2]|0,e,h,j,k,0,3)|0)>((i|0)/3|0|0)){if((dC(c[a+68>>2]|0,e,h-1|0,j,k,0,3)|0)<=((i|0)/3|0|0)){break}do{if((c[a+60>>2]|0)!=0){if((c[a+60>>2]|0)==0){break L5808}if((o|0)==0){break}if((p|0)==0){break L5808}}}while(0);n=(n*98|0|0)/100|0}}while(0);w=0;U=g+((j|0)/3|0)|0;x=U;z=U;while(1){if((x|0)>(h-((j|0)/3|0)|0)){break}B=dC(c[a+68>>2]|0,f,x,i,k,0,4)|0;if((B|0)>(w|0)){w=B;z=x}x=x+1|0}if((w|0)>((i|0)/2|0|0)){break L5734}t=dC(d,i-1|0,(j|0)/8|0,i,k,0,4)|0;if((t|0)>((i|0)/2|0|0)){break L5734}v=dC(d,i-1|0,j-1-((j|0)/8|0)|0,i,k,0,4)|0;u=dC(d,i-1|0,(j|0)/2|0,i,k,0,4)|0;if((t+v-(u<<1)|0)<(-1-((i|0)/16|0)|0)){break L5734}t=dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0;if((t|0)>((i|0)/2|0|0)){break L5734}v=dC(d,i-1|0,j-1-((j|0)/8|0)|0,i,k,0,4)|0;x=(j|0)/4|0;while(1){if((x|0)>=(j-1-((j|0)/4|0)|0)){break}u=dC(d,i-1|0,x,i,k,0,4)|0;if((u|0)>(t+((aa(v-t|0,(x<<1)-((j|0)/2|0)|0)|0)/(j|0)|0)+((i|0)/16|0)|0)){A=4293;break}x=x+1|0}if((x|0)<(j-1-((j|0)/4|0)|0)){break L5734}w=dC(d,i-1|0,(j*6|0|0)/8|0,i,k,0,4)|0;do{if((w|0)>0){w=w-1|0;x=dC(d,i-w-1|0,j-1|0,j,k,0,1)|0;if((x|0)<((j|0)/8|0|0)){break L5734}else{break}}}while(0);do{if((j|0)>=16){if((i|0)<=9){break}U=dC(d,0,(j|0)/4|0,i,k,0,3)|0;if((U-(dC(d,0,(j|0)/16|0,i,k,0,3)|0)|0)<=((i|0)/6|0|0)){break}U=dC(d,i-1|0,(j|0)/4|0,i,k,0,4)|0;if((U-(dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0)|0)<=((i|0)/6|0|0)){break}break L5734}}while(0);if((c[a+60>>2]|0)!=0){if((p|0)!=0){n=(n*99|0|0)/100|0}do{if((c[a+56>>2]|0)!=0){if((p|0)!=0){break}if((h|0)<=(c[a+60>>2]|0)){break}n=(n*99|0|0)/100|0;if(((c[a+64>>2]|0)-(c[a+60>>2]|0)|0)<3){n=(n*99|0|0)/100|0}}}while(0);if((o|0)==0){n=(n*99|0|0)/100|0}}else{if((n|0)==100){n=99}}dy(a,57,n)|0;break L5734}}while(0)}}while(0);n=100;r=100;if((i|0)>2){W=(j|0)>3}else{W=0}L5887:do{if(W){if((c[b+108>>2]|0)>1){break}if(((du(e,e+((i|0)/3|0)|0,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(f-((i|0)/3|0)|0,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=3){n=99}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,h-((j|0)/3|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,g+((j|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h,c[a+68>>2]|0,k)|0)!=2){break}do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g,g,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g+1|0,g+1|0,c[a+68>>2]|0,k)|0)!=1){break L5887}else{break}}}while(0);do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h,h,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h-1|0,h-1|0,c[a+68>>2]|0,k)|0)!=1){break L5887}else{break}}}while(0);do{if((dv(e,e,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(e+1|0,e+1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L5887}else{break}}}while(0);do{if((dv(f,f,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(f-1|0,f-1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L5887}else{break}}}while(0);if((c[b+108>>2]|0)!=1){break}r=dC(d,0,0,f-e|0,k,0,3)|0;z=r-(dC(d,0,2,f-e|0,k,0,3)|0)|0;if((z|0)<0){break}if((z|0)==0){r=dC(d,i-1|0,0,f-e|0,k,0,4)|0;if((r|0)>(dC(d,i-1|0,2,f-e|0,k,0,4)|0)){n=(n*98|0|0)/100|0}n=(n*99|0|0)/100|0}w=dC(d,i-1|0,j-1-((j|0)/3|0)|0,f-e|0,k,0,4)|0;x=j-1-((j|0)/3|0)|0;while(1){if((x|0)>=(j|0)){break}z=dC(d,i-1|0,x,f-e|0,k,0,4)|0;if((z|0)<(w-((i|0)/16|0)-1|0)){A=4370;break}if((z|0)>(w|0)){w=z}x=x+1|0}if((x|0)<(j|0)){break}r=dC(d,0,(j|0)/16|0,i,k,0,3)|0;t=r+(dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)|0;z=t-((dC(d,0,(j|0)/2|0,i,k,0,3)|0)<<1)|0;t=dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0;r=t+(dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0)|0;B=(r|0)<=((dC(d,i-1|0,(j|0)/2|0,i,k,0,4)|0)<<1|0)|0;do{if((z|0)>=((-i|0)/8|0|0)){if((z+((i|0)/8|0)|0)<(B|0)){break}do{if((dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,(j|0)/16|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L5887}else{break}}}while(0);do{if((dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L5887}else{break}}}while(0);do{if(((du(f-((i|0)/32|0)|0,f,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){if(((du(f-((i|0)/32|0)|0,f,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if(((du(e,e+((i|0)/32|0)|0,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){if(((du(e,e+((i|0)/32|0)|0,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}}if((i|0)>=32){break L5887}n=(n*99|0|0)/100|0}}while(0);x=j;w=0;B=0;while(1){if((w|0)>=(i|0)){break}z=dC(d,w,j-1|0,h-g|0,k,0,1)|0;z=z+(dC(d,w,j-1-z|0,h-g|0,k,1,1)|0)|0;if((z|0)<=(x|0)){x=z;B=w}w=w+1|0}z=x;x=j-1-z|0;while(1){if((x|0)>=(j-1|0)){break}if((dv(B,i-1|0,x,x,d,k)|0)>1){n=(n*99|0|0)/100|0}x=x+1|0}if((dC(d,0,0,f-e|0,k,0,3)|0)>=((i|0)/8|0|0)){if((dC(d,i-1|0,j-1|0,f-e|0,k,0,4)|0)<((i|0)/8|0|0)){n=(n*98|0|0)/100|0}if((dC(d,i-1|0,0,f-e|0,k,0,4)|0)<((i|0)/8|0|0)){n=(n*98|0|0)/100|0}}r=dC(d,(i|0)/2|0,0,j,k,0,2)|0;do{if((P(r-(dC(d,(i|0)/2|0,j-1|0,j,k,0,1)|0)|0)|0)>((j|0)/8|0|0)){A=4417}else{if((dv(0,i-1|0,0,0,d,k)|0)>1){A=4417;break}if((dv(0,i-1|0,j-1|0,j-1|0,d,k)|0)>1){A=4417}}}while(0);if((A|0)==4417){n=(n*98|0|0)/100|0}if((c[a+60>>2]|0)!=0){if((o|0)!=0){if((p|0)!=0){n=(n*99|0|0)/100|0}}else{n=(n*98|0|0)/100|0}}else{if((n|0)==100){n=99}}if((n|0)>98){n=98}dy(a,48,n)|0;break L5887}}while(0)}}while(0);n=100;if((i|0)>4){X=(j|0)>5}else{X=0}L6043:do{if(X){if((c[b+108>>2]|0)>3){break}if((c[b+108>>2]|0)<1){break}if((c[b+108>>2]|0)!=2){n=(n*95|0|0)/100|0}if(((du(e,e+((i|0)/2|0)|0,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(f-((i|0)/2|0)|0,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,h-((j|0)/2|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h,c[a+68>>2]|0,k)|0)!=3){break}do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g,g,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g+1|0,g+1|0,c[a+68>>2]|0,k)|0)!=1){break L6043}else{break}}}while(0);do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h,h,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h-1|0,h-1|0,c[a+68>>2]|0,k)|0)!=1){break L6043}else{break}}}while(0);do{if((dv(e,e,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(e+1|0,e+1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L6043}else{break}}}while(0);do{if((dv(f,f,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(f-1|0,f-1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L6043}else{break}}}while(0);if((c[b+108>>2]|0)!=2){n=(n*85|0|0)/100|0}p=dC(d,0,0,f-e|0,k,0,3)|0;if((p|0)<=(dC(d,0,((j|0)/32|0)+2|0,f-e|0,k,0,3)|0)){break}w=dC(d,0,(j|0)/2|0,f-e|0,k,0,3)|0;z=dC(d,0,((j|0)/2|0)-1|0,f-e|0,k,0,3)|0;if((z|0)>(w|0)){w=z}z=dC(d,0,((j|0)/2|0)-2|0,f-e|0,k,0,3)|0;do{if((z|0)>(w|0)){if((j|0)<=8){break}w=z}}while(0);if((dC(d,0,(j|0)/4|0,f-e|0,k,0,3)|0)<(w|0)){break}w=dC(d,i-1|0,(j|0)/2|0,f-e|0,k,0,4)|0;z=dC(d,i-1|0,((j|0)/2|0)-1|0,f-e|0,k,0,4)|0;if((z|0)>(w|0)){w=z}z=dC(d,i-1|0,((j|0)/2|0)-1|0,f-e|0,k,0,4)|0;do{if((z|0)>(w|0)){if((j|0)<=8){break}w=z}}while(0);if((dC(d,i-1|0,(j*3|0|0)/4|0,f-e|0,k,0,4)|0)<(w|0)){break}w=dC(d,i-1|0,j-1-((j|0)/3|0)|0,f-e|0,k,0,4)|0;x=j-1-((j|0)/3|0)|0;while(1){if((x|0)>=(j|0)){break}z=dC(d,i-1|0,x,f-e|0,k,0,4)|0;if((z|0)<(w-((i|0)/16|0)|0)){A=4490;break}if((z|0)>(w|0)){w=z}x=x+1|0}if((x|0)<(j|0)){break}x=dC(d,(i|0)/2|0,j-1|0,h-g|0,k,0,1)|0;if((x|0)>((j|0)/4|0|0)){break}x=x+(dC(d,(i|0)/2|0,j-1-x|0,h-g|0,k,1,1)|0)|0;if((x|0)>((j|0)/3|0|0)){break}if((x|0)>((j|0)/4|0|0)){n=(n*99|0|0)/100|0}x=x+(dC(d,(i|0)/2|0,j-1-x|0,h-g|0,k,0,1)|0)|0;if((x*3|0|0)>(j<<1|0)){break}w=dC(d,(i|0)/2|0,j-x|0,(i|0)/2|0,k,0,3)|0;if((w|0)==0){break}if((dC(d,((i|0)/2|0)+w-1-((i|0)/16|0)|0,j-x|0,h-g|0,k,0,1)|0)==0){break}z=0;x=(j|0)/4|0;while(1){if((x|0)>=(j-((j|0)/4|0)-1|0)){break}if((dC(d,0,x,i-1|0,k,0,3)|0)>((i|0)/4|0|0)){A=4513;break}if((dC(d,i-1|0,x,i-1|0,k,0,4)|0)>((i|0)/4|0|0)){A=4513;break}x=x+1|0}if((x|0)<(j-((j|0)/4|0)-1|0)){break}p=dC(d,0,(j|0)/16|0,i,k,0,3)|0;B=p+(dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)|0;if((B|0)<=(((dC(d,0,(j|0)/2|0,i,k,0,3)|0)<<1)+((i|0)/8|0)|0)){break}do{if((dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,(j|0)/16|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L6043}else{break}}}while(0);do{if((dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L6043}else{break}}}while(0);do{if(((du(f-((i|0)/32|0)|0,f,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){if(((du(f-((i|0)/32|0)|0,f,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if(((du(e,e+((i|0)/32|0)|0,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){if(((du(e,e+((i|0)/32|0)|0,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}}break L6043}}while(0);if((i|0)<16){if((dv(e,e,g,h,c[a+68>>2]|0,k)|0)!=1){n=(n*98|0|0)/100|0}}z=0;x=(j*6|0|0)/8|0;while(1){if((x|0)>=(j-((j|0)/16|0)|0)){break}if((dv(0,i-1|0,x,x,d,k)|0)>2){z=z+1|0}else{z=z-1|0}x=x+1|0}if((z|0)>0){n=(n*98|0|0)/100|0}if((o|0)==0){n=(n*90|0|0)/100|0}dy(a,48,n)|0}}while(0);n=100;if((i|0)>4){Y=(j|0)>5}else{Y=0}L6214:do{if(Y){if((c[b+108>>2]|0)!=1){break}if((c[(c[b>>2]|0)+196>>2]|0)!=3){n=(n*85|0|0)/100|0}if(((du(e,e+((i|0)/2|0)|0,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(f-((i|0)/2|0)|0,f,g+((j|0)/2|0)|0,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,h-((j|0)/2|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,g+((j|0)/2|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if(((du(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}if((dv(e+((i|0)/2|0)|0,e+((i|0)/2|0)|0,g,h,c[a+68>>2]|0,k)|0)!=3){break}do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g,g,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,g+1|0,g+1|0,c[a+68>>2]|0,k)|0)!=1){break L6214}else{break}}}while(0);do{if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h,h,c[a+68>>2]|0,k)|0)!=1){if((dv(e+((i|0)/3|0)|0,f-((i|0)/3|0)|0,h-1|0,h-1|0,c[a+68>>2]|0,k)|0)!=1){break L6214}else{break}}}while(0);do{if((dv(e,e,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(e+1|0,e+1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L6214}else{break}}}while(0);do{if((dv(f,f,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){if((dv(f-1|0,f-1|0,g+((j|0)/3|0)|0,h-((j|0)/3|0)|0,c[a+68>>2]|0,k)|0)!=1){break L6214}else{break}}}while(0);X=dC(d,0,0,f-e|0,k,0,3)|0;if((X|0)<=(dC(d,0,((j|0)/32|0)+2|0,f-e|0,k,0,3)|0)){break}w=dC(d,0,(j|0)/2|0,f-e|0,k,0,3)|0;z=dC(d,0,((j|0)/2|0)-1|0,f-e|0,k,0,3)|0;if((z|0)>(w|0)){w=z}z=dC(d,0,((j|0)/2|0)-2|0,f-e|0,k,0,3)|0;do{if((z|0)>(w|0)){if((j|0)<=8){break}w=z}}while(0);if((dC(d,0,(j|0)/4|0,f-e|0,k,0,3)|0)<(w|0)){break}w=dC(d,i-1|0,(j|0)/2|0,f-e|0,k,0,4)|0;z=dC(d,i-1|0,((j|0)/2|0)-1|0,f-e|0,k,0,4)|0;if((z|0)>(w|0)){w=z}z=dC(d,i-1|0,((j|0)/2|0)-1|0,f-e|0,k,0,4)|0;do{if((z|0)>(w|0)){if((j|0)<=8){break}w=z}}while(0);if((dC(d,i-1|0,(j*3|0|0)/4|0,f-e|0,k,0,4)|0)<(w|0)){break}w=dC(d,i-1|0,j-1-((j|0)/3|0)|0,f-e|0,k,0,4)|0;x=j-1-((j|0)/3|0)|0;while(1){if((x|0)>=(j|0)){break}z=dC(d,i-1|0,x,f-e|0,k,0,4)|0;if((z|0)<(w-((i|0)/16|0)|0)){A=4604;break}if((z|0)>(w|0)){w=z}x=x+1|0}if((x|0)<(j|0)){break}x=dC(d,(i|0)/2|0,j-1|0,h-g|0,k,0,1)|0;if((x|0)>((j|0)/4|0|0)){break}x=x+(dC(d,(i|0)/2|0,j-1-x|0,h-g|0,k,1,1)|0)|0;if((x|0)>((j|0)/3|0|0)){break}if((x|0)>((j|0)/4|0|0)){n=(n*99|0|0)/100|0}x=x+(dC(d,(i|0)/2|0,j-1-x|0,h-g|0,k,0,1)|0)|0;if((x*3|0|0)>(j<<1|0)){break}w=dC(d,(i|0)/2|0,j-x|0,(i|0)/2|0,k,0,3)|0;if((w|0)==0){break}if((dC(d,((i|0)/2|0)+w-1-((i|0)/16|0)|0,j-x|0,h-g|0,k,0,1)|0)==0){break}z=0;x=(j|0)/4|0;while(1){if((x|0)>=(j-((j|0)/4|0)-1|0)){break}if((dC(d,0,x,i-1|0,k,0,3)|0)>((i|0)/4|0|0)){A=4627;break}if((dC(d,i-1|0,x,i-1|0,k,0,4)|0)>((i|0)/4|0|0)){A=4627;break}x=x+1|0}if((x|0)<(j-((j|0)/4|0)-1|0)){break}X=dC(d,0,(j|0)/16|0,i,k,0,3)|0;B=X+(dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)|0;if((B|0)<=(((dC(d,0,(j|0)/2|0,i,k,0,3)|0)<<1)+((i|0)/8|0)|0)){break}do{if((dC(d,i-1|0,(j|0)/16|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,(j|0)/16|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L6214}else{break}}}while(0);do{if((dC(d,i-1|0,j-1-((j|0)/16|0)|0,i,k,0,4)|0)>((i|0)/8|0|0)){if((dC(d,0,j-1-((j|0)/16|0)|0,i,k,0,3)|0)<((i|0)/16|0|0)){break L6214}else{break}}}while(0);do{if(((du(f-((i|0)/32|0)|0,f,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)==0){if(((du(f-((i|0)/32|0)|0,f,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=0){break}if(((du(e,e+((i|0)/32|0)|0,g,g+((j|0)/32|0)|0,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){if(((du(e,e+((i|0)/32|0)|0,h-((j|0)/32|0)|0,h,c[a+68>>2]|0,k,1)|0)<<24>>24|0)!=1){break}}break L6214}}while(0);if((i|0)<16){if((dv(e,e,g,h,c[a+68>>2]|0,k)|0)!=1){n=(n*98|0|0)/100|0}}z=0;x=(j*6|0|0)/8|0;while(1){if((x|0)>=(j-((j|0)/16|0)|0)){break}if((dv(0,i-1|0,x,x,d,k)|0)>2){z=z+1|0}else{z=z-1|0}x=x+1|0}if((z|0)>0){n=(n*98|0|0)/100|0}if((o|0)==0){n=(n*90|0|0)/100|0}dy(a,48,n)|0}}while(0);D=c[a+36>>2]|0;E=D;return E|0}function cF(a){a=a|0;var b=0;b=a;return aa(b,b)|0}function cG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=i;f=a;a=b;b=d;d=0;g=c[f+296+(a<<3)>>2]|0;h=c[f+296+(a<<3)+4>>2]|0;j=c[f+296+(b<<3)>>2]|0;k=c[f+296+(b<<3)+4>>2]|0;if((c[f+196>>2]|0)==0){l=-1;m=l;i=e;return m|0}do{if((a|0)>=0){if((a|0)>(c[f+264+((c[f+196>>2]|0)-1<<2)>>2]|0)){break}if((b|0)<0){break}if((b|0)>(c[f+264+((c[f+196>>2]|0)-1<<2)>>2]|0)){break}o=0;while(1){if((o|0)>=(c[f+196>>2]|0)){break}if((b|0)<(c[f+264+(o<<2)>>2]|0)){p=4680;break}o=o+1|0}p=o;o=a;while(1){if((o|0)>=(c[f+264+(p<<2)>>2]|0)){if((p|0)!=0){q=c[f+264+(p-1<<2)>>2]|0}else{q=0}o=q}if((o|0)==(b|0)){break}r=c[f+296+(o<<3)>>2]|0;s=c[f+296+(o<<3)+4>>2]|0;t=cH(j-g|0)|0;u=t+(cH(k-h|0)|0)|0;if((u|0)==0){v=-1024}else{v=(-((aa(g+j-(r<<1)|0,j-g|0)|0)+(aa(h+k-(s<<1)|0,k-h|0)|0)|0)<<10|0)/(u|0)|0}if((v|0)<=-1024){w=g;x=h}else{if((v|0)>=1024){w=j;x=k}else{w=((g+j+1|0)/2|0)+((aa(v,j-g|0)|0)/2048|0)|0;x=((h+k+1|0)/2|0)+((aa(v,k-h|0)|0)/2048|0)|0}}u=cH((w-r<<10|0)/((c[f+4>>2]|0)-(c[f>>2]|0)+1|0)|0)|0;r=u+(cH((x-s<<10|0)/((c[f+12>>2]|0)-(c[f+8>>2]|0)+1|0)|0)|0)|0;if((r|0)>(d|0)){d=r}o=o+1|0}l=d;m=l;i=e;return m|0}}while(0);au(c[n>>2]|0,10840,(d=i,i=i+8|0,c[d>>2]=132,d)|0)|0;i=d;l=-1;m=l;i=e;return m|0}function cH(a){a=a|0;var b=0;b=a;return aa(b,b)|0}function cI(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+16|0;h=g|0;j=a;a=b;b=d;d=e;e=f;f=0;if((c[j+196>>2]|0)==0){k=-1;l=k;i=g;return l|0}do{if((a|0)>=0){if((a|0)>(c[j+264+((c[j+196>>2]|0)-1<<2)>>2]|0)){break}if((b|0)<0){break}if((b|0)>(c[j+264+((c[j+196>>2]|0)-1<<2)>>2]|0)){break}m=c[j+296+(b<<3)>>2]|0;o=m;c[h>>2]=m;m=c[j+296+(b<<3)+4>>2]|0;p=m;c[h+4>>2]=m;m=cH(o-d|0)|0;q=m+(cH(p-e|0)|0)<<1;m=q;c[h+8>>2]=q;c[h+12>>2]=b;q=0;while(1){if((q|0)>=(c[j+196>>2]|0)){break}if((b|0)<(c[j+264+(q<<2)>>2]|0)){r=4720;break}q=q+1|0}f=q;q=a;while(1){if((q|0)>=(c[j+264+(f<<2)>>2]|0)){if((f|0)!=0){s=c[j+264+(f-1<<2)>>2]|0}else{s=0}q=s}o=c[j+296+(q<<3)>>2]|0;p=c[j+296+(q<<3)+4>>2]|0;r=cH(o-d|0)|0;m=r+(cH(p-e|0)|0)|0;if((m|0)<(c[h+8>>2]|0)){c[h>>2]=o;c[h+4>>2]=p;c[h+8>>2]=m;c[h+12>>2]=q}if((q|0)==(b|0)){break}q=q+1|0}k=c[h+12>>2]|0;l=k;i=g;return l|0}}while(0);au(c[n>>2]|0,21912,(h=i,i=i+24|0,c[h>>2]=216,c[h+8>>2]=a,c[h+16>>2]=b,h)|0)|0;i=h;dk(j);k=-1;l=k;i=g;return l|0}function cJ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f=a;a=b;b=d;d=e;e=0;if((c[f+196>>2]|0)<1){g=0;h=g;return h|0}if((c[f+196>>2]|0)==2){do{if((c[f+8>>2]|0)>(c[f+52>>2]|0)){i=P((c[f+200>>2]|0)-(c[f+204>>2]|0)|0)|0;if((i|0)>((P((c[f+200>>2]|0)+(c[f+204>>2]|0)|0)|0)/8|0|0)){break}g=0;h=g;return h|0}}while(0)}i=0;j=c[f>>2]|0;k=c[f+4>>2]|0;l=k-j+1|0;m=c[f+8>>2]|0;n=c[f+12>>2]|0;o=c[f+52>>2]|0;p=c[f+56>>2]|0;q=c[f+60>>2]|0;r=j;s=k;t=m;u=t;v=t;do{if((n-m+1|0)>=5){if((m<<2|0)>((p*3|0)+q|0)){break}do{if((m|0)>=(p|0)){if((n|0)<(q|0)){break}g=0;h=g;return h|0}}while(0);if((n<<1|0)>(o+p|0)){w=m;while(1){if((w<<1|0)>=(m+n|0)){break}if(((du(r,s,w,w,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4757;break}w=w+1|0}if((w<<1|0)<(m+n|0)){u=w;while(1){if(((du(r,s,w,w,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){y=(w<<1|0)<=(m+n|0)}else{y=0}if(!y){break}w=w+1|0}}}if((v|0)>=(u|0)){if((b|0)!=0){c[f+24>>2]=0}g=0;h=g;return h|0}if(((du(r-1|0,r-1|0,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){while(1){if(((du(r,r,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){z=(r<<1|0)<(j+k|0)}else{z=0}if(!z){break}r=r+1|0}}while(1){if((r|0)>=(k|0)){break}if(((du(r,r,v,u,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){x=4782;break}r=r+1|0}while(1){if((s|0)<=(r|0)){break}if(((du(s,s,v,u,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){x=4788;break}s=s-1|0}if((u-1|0)>(v|0)){w=v;if(((du(r,k+1|0,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){i=0}else{if(((du(r,r,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4796}else{if(((du(r-1|0,r-1|0,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4796}}if((x|0)==4796){if(((du(s,s,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4798}else{if(((du(s+1|0,s+1|0,v,u-1|0,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4798}}if((x|0)==4798){i=1;t=v;while(1){if((t|0)>=(u|0)){break}if(((du(r,s,t,t,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){x=4801;break}t=t+1|0}while(1){if((t|0)>=(u|0)){break}if(((du(r,s,t,t,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4807;break}t=t+1|0}A=r;while(1){if((A|0)>=(s|0)){break}if(((du(A,A,v,t,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){x=4813;break}A=A+1|0}while(1){if((A|0)>=(s|0)){break}if(((du(A,A,v,t,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){x=4819;break}A=A+1|0}B=A;while(1){if((B|0)>=(s|0)){break}if(((du(B,B,v,t,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==1){x=4825;break}B=B+1|0}do{if((A|0)<(s|0)){if((B|0)>=(s|0)){break}if((A|0)>=(B|0)){break}if((s-r|0)<=2){break}if((dI(r,s,v,u-1|0,c[f+68>>2]|0,a)|0)<2){break}if((dv(r,s,v+((u-v|0)/4|0)|0,v+((u-v|0)/4|0)|0,c[f+68>>2]|0,a)|0)!=2){break}if((dv(r,s,u-1-((u-v|0)/2|0)|0,u-1-((u-v|0)/2|0)|0,c[f+68>>2]|0,a)|0)!=2){break}while(1){if(((du(r,s,u,u,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){C=(u<<1|0)<(m+n|0)}else{C=0}if(!C){break}u=u+1|0}i=2;e=168}}while(0);do{if((b&2|0)!=0){if((c[f+8>>2]|0)==(u|0)){break}c[f+8>>2]=u}}while(0)}}}if((i|0)==0){while(1){if(((du(j,k,v,v,c[f+68>>2]|0,a,1)|0)<<24>>24|0)==0){D=(v<<1|0)<(m+n|0)}else{D=0}if(!D){break}v=v+1|0}if((b|0)!=0){c[f+8>>2]=v}}if((i|0)==1){u=u-1|0;B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;A=B-(dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0)|0;B=dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0;if((A|0)>(B-(dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)+1|0)){e=180}do{if((s-r+1|0)>((u-v+1|0)*3|0|0)){if(((du(r,s,v,u,c[f+68>>2]|0,a,2)|0)<<24>>24|0)!=0){break}e=175}}while(0);B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;A=B-(dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0)|0;B=dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0;if((A|0)<(B-(dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-1|0)){e=96}do{if((s-r+1|0)<((u-v+1<<1)+2|0)){if(((s-r+1<<1)+2|0)<=(u-v+1|0)){break}B=dC(c[f+68>>2]|0,r,(v+u|0)/2|0,s-r+1|0,a,0,3)|0;B=dC(c[f+68>>2]|0,r+B|0,(v+u|0)/2|0,s-r+1|0,a,1,3)|0;A=dC(c[f+68>>2]|0,(r+s|0)/2|0,v,u-v+1|0,a,0,2)|0;A=dC(c[f+68>>2]|0,(r+s|0)/2|0,v+A|0,u-v+1|0,a,1,2)|0;t=0;while(1){if((t|0)<(s-r+1|0)){E=(t|0)<(u-v+1|0)}else{E=0}if(!E){break}if((d8(c[f+68>>2]|0,r+t|0,v+t|0)|0)<(a|0)){x=4871;break}t=t+1|0}F=t;while(1){if((t|0)<(s-r+1|0)){G=(t|0)<(u-v+1|0)}else{G=0}if(!G){break}if((d8(c[f+68>>2]|0,r+t|0,v+t|0)|0)>=(a|0)){x=4879;break}t=t+1|0}F=t-F|0;t=0;while(1){if((t|0)<(s-r+1|0)){H=(t|0)<(u-v+1|0)}else{H=0}if(!H){break}if((d8(c[f+68>>2]|0,s-t|0,v+t|0)|0)<(a|0)){x=4887;break}t=t+1|0}I=t;while(1){if((t|0)<(s-r+1|0)){J=(t|0)<(u-v+1|0)}else{J=0}if(!J){break}if((d8(c[f+68>>2]|0,s-t|0,v+t|0)|0)>=(a|0)){x=4895;break}t=t+1|0}I=t-I|0;if((s-r|0)<5){if((u-v|0)<8){x=4906}else{x=4900}}else{x=4900}do{if((x|0)==4900){if((B|0)<(((s-r+1|0)/2|0)+2|0)){break}if((A|0)<(((u-v+1|0)/2|0)+2|0)){break}if((P(F-I|0)|0)>(((B|0)/4|0)+2|0)){break}if((P(B-A|0)|0)>(((B|0)/4|0)+2|0)){break}if((P(F-B|0)|0)>(((B|0)/4|0)+4|0)){break}if((P(I-A|0)|0)<=(((B|0)/4|0)+4|0)){x=4906}}}while(0);if((x|0)==4906){e=729}}}while(0);B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;if((B|0)>((dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)-((l|0)/8|0)|0)){x=4910}else{B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;if((B|0)>((dC(c[f+68>>2]|0,r,u-1|0,s-r|0,a,0,3)|0)-((l|0)/8|0)|0)){x=4910}}do{if((x|0)==4910){B=dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0;if((B|0)<=((dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-((l|0)/8|0)|0)){B=dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0;if((B|0)<=((dC(c[f+68>>2]|0,s,u-1|0,s-r|0,a,0,4)|0)-((l|0)/8|0)|0)){break}}if((dv(r,s,v,v,c[f+68>>2]|0,a)|0)!=1){break}if((dv(r,s,u,u,c[f+68>>2]|0,a)|0)!=2){if((dv(r,s,u-1|0,u-1|0,c[f+68>>2]|0,a)|0)!=2){break}}e=94}}while(0);B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;if((B|0)<((dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)-((l|0)/10|0)|0)){x=4918}else{B=dC(c[f+68>>2]|0,r,v+1|0,s-r|0,a,0,3)|0;if((B|0)<((dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)-((l|0)/10|0)|0)){x=4918}}do{if((x|0)==4918){B=dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0;if((B|0)>=((dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-((l|0)/10|0)|0)){B=dC(c[f+68>>2]|0,s,v+1|0,s-r|0,a,0,4)|0;if((B|0)>=((dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-((l|0)/10|0)|0)){break}}if((dv(r,s,v,v,c[f+68>>2]|0,a)|0)!=2){if((dv(r,s,v+1|0,v+1|0,c[f+68>>2]|0,a)|0)!=2){break}}if((dv(r,s,u,u,c[f+68>>2]|0,a)|0)!=1){break}e=711}}while(0);B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;A=B+(dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)|0;do{if((A-((dC(c[f+68>>2]|0,r,(u+v|0)/2|0,s-r|0,a,0,3)|0)<<1)|0)>(((l|0)/16|0)+1|0)){if((s-r|0)<=10){break}B=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;if((B|0)<((dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)-((l|0)/10|0)|0)){x=4928}else{B=dC(c[f+68>>2]|0,r,v+1|0,s-r|0,a,0,3)|0;if((B|0)<((dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)-((l|0)/10|0)|0)){x=4928}}do{if((x|0)==4928){B=dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0;if((B|0)>=((dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-((l|0)/10|0)|0)){B=dC(c[f+68>>2]|0,s,v+1|0,s-r|0,a,0,4)|0;if((B|0)>=((dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)-((l|0)/10|0)|0)){break}}if((dv(r,s,v,v,c[f+68>>2]|0,a)|0)!=2){if((dv(r,s,v+1|0,v+1|0,c[f+68>>2]|0,a)|0)!=2){break}}if((dv(r,s,u,u,c[f+68>>2]|0,a)|0)!=1){break}e=728}}while(0)}}while(0);do{if((s-r|0)>3){if((u-v|0)<=1){break}A=dC(c[f+68>>2]|0,r,v,s-r|0,a,0,3)|0;do{if((A|0)>(dC(c[f+68>>2]|0,r,u,s-r|0,a,0,3)|0)){B=dC(c[f+68>>2]|0,s,v,s-r|0,a,0,4)|0;if((B|0)>=(dC(c[f+68>>2]|0,s,u,s-r|0,a,0,4)|0)){break}if((dv(r,s,v,v,c[f+68>>2]|0,a)|0)!=2){break}if((dv(r,s,u,u,c[f+68>>2]|0,a)|0)!=2){break}e=126}}while(0)}}while(0);do{if((s-r|0)>2){if((u-v|0)<=2){break}if((dv(r,s,(v+u|0)/2|0,(v+u|0)/2|0,c[f+68>>2]|0,a)|0)>1){if((dv((r+s|0)/2|0,(r+s|0)/2|0,v,u,c[f+68>>2]|0,a)|0)>1){if((dH(r,s,v,u,c[f+68>>2]|0,a,0)|0)==1){e=730}}}}}while(0)}if((b|0)!=0){c[f+24>>2]=i}if((b|0)!=0){c[f+40>>2]=e}}if((d|0)!=0){c[d>>2]=e}g=i;h=g;return h|0}}while(0);g=0;h=g;return h|0}function cK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;e=i;i=i+264|0;f=e|0;g=e+64|0;h=a;a=b;b=d;d=c[h>>2]|0;j=c[h+4>>2]|0;k=c[h+8>>2]|0;l=c[h+12>>2]|0;m=j-d+1|0;o=l-k+1|0;p=57344;q=32;c[g>>2]=h;c[g+4>>2]=a;c[g+8>>2]=b;r=0;if((k|0)<((c[h+56>>2]|0)-(((c[h+56>>2]|0)-(c[h+52>>2]|0)|0)/2|0)|0)){r=1}s=0;if((l|0)>((c[h+60>>2]|0)+(((c[h+64>>2]|0)-(c[h+60>>2]|0)|0)/2|0)|0)){s=1}do{if((k|0)<(c[h+56>>2]|0)){if((l|0)<=(c[h+60>>2]|0)){break}if((l<<1|0)>=((c[h+60>>2]|0)+(c[h+64>>2]|0)|0)){break}if((k-(l-(c[h+60>>2]|0))<<1|0)<=((c[h+56>>2]<<1)-((c[h+56>>2]|0)-(c[h+52>>2]|0))|0)){r=1}}}while(0);c[g+36>>2]=r;c[g+40>>2]=s;r=(d+j|0)/2|0;c[f+48>>2]=r;c[f+32>>2]=r;c[f+16>>2]=r;c[f>>2]=r;r=(k+l|0)/2|0;c[f+52>>2]=r;c[f+36>>2]=r;c[f+20>>2]=r;c[f+4>>2]=r;r=(cH(128)|0)<<1;c[f+56>>2]=r;c[f+40>>2]=r;c[f+24>>2]=r;c[f+8>>2]=r;c[f+60>>2]=0;c[f+44>>2]=0;c[f+28>>2]=0;c[f+12>>2]=0;r=0;while(1){if((r|0)>=(c[h+264>>2]|0)){break}t=c[h+296+(r<<3)>>2]|0;u=c[h+296+(r<<3)+4>>2]|0;v=0;w=cH((t-d<<7|0)/(m|0)|0)|0;x=w+(cH((u-k<<7|0)/(o|0)|0)|0)|0;if((x|0)<(c[f+(v<<4)+8>>2]|0)){c[f+(v<<4)>>2]=t;c[f+(v<<4)+4>>2]=u;c[f+(v<<4)+8>>2]=x;c[f+(v<<4)+12>>2]=r}v=1;w=cH((t-d<<7|0)/(m|0)|0)|0;x=w+(cH((u-l<<7|0)/(o|0)|0)|0)|0;if((x|0)<(c[f+(v<<4)+8>>2]|0)){c[f+(v<<4)>>2]=t;c[f+(v<<4)+4>>2]=u;c[f+(v<<4)+8>>2]=x;c[f+(v<<4)+12>>2]=r}v=2;w=cH((t-j<<7|0)/(m|0)|0)|0;x=w+(cH((u-l<<7|0)/(o|0)|0)|0)|0;if((x|0)<(c[f+(v<<4)+8>>2]|0)){c[f+(v<<4)>>2]=t;c[f+(v<<4)+4>>2]=u;c[f+(v<<4)+8>>2]=x;c[f+(v<<4)+12>>2]=r}v=3;w=cH((t-j<<7|0)/(m|0)|0)|0;x=w+(cH((u-k<<7|0)/(o|0)|0)|0)|0;if((x|0)<(c[f+(v<<4)+8>>2]|0)){c[f+(v<<4)>>2]=t;c[f+(v<<4)+4>>2]=u;c[f+(v<<4)+8>>2]=x;c[f+(v<<4)+12>>2]=r}r=r+1|0}r=0;while(1){if((r|0)>=16){break}c[g+44+(((r|0)/4|0)<<4)+(((r|0)%4|0)<<2)>>2]=c[f+(((r|0)/4|0)<<4)+(((r|0)%4|0)<<2)>>2];r=r+1|0}c[g+108>>2]=0;if((c[h+196>>2]|0)>0){f=d;v=j;w=k;y=l;z=c[h+68>>2]|0;A=b;B=g+108|0;dH(f,v,w,y,z,A,B)|0}if((k<<1|0)<((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){do{if((c[h+64>>2]|0)>(c[h+60>>2]|0)){if((c[h+12>>2]<<1|0)<=((c[h+64>>2]|0)+(c[h+60>>2]|0)|0)){break}u=((c[h+60>>2]|0)+(c[h+56>>2]|0)|0)/2|0;while(1){if((u<<1|0)>=((c[h+60>>2]|0)+(c[h+64>>2]|0)|0)){break}if(((du(d,j,u,u,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5002;break}u=u+1|0}if((u<<1|0)<((c[h+60>>2]|0)+(c[h+64>>2]|0)|0)){if(((du((d+j|0)/2|0,(d+j|0)/2|0,u,c[h+64>>2]|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){if((u|0)>(k|0)){B=u;c[h+12>>2]=B;l=B}}}}}while(0)}B=100;do{if((o<<1|0)<((c[h+60>>2]|0)-(c[h+56>>2]|0)|0)){if((m*3|0|0)<(o<<2|0)){D=0;break}D=(m|0)>2}else{D=0}}while(0);L6846:do{if(D){if(((du(d+((m|0)/8|0)+1|0,j-((m|0)/8|0)-1|0,k+((o|0)/8|0)+((o|0)>2?1:0)|0,l-((o|0)/8|0)-((o|0)>2?1:0)|0,c[h+68>>2]|0,b,2)|0)<<24>>24|0)==2){break}if((c[h+24>>2]|0)!=0){A=h;dy(A,61,97)|0;break}if((m|0)<=(o<<1|0)){B=(B*98|0|0)/100|0}if((m|0)<=(o*3|0|0)){B=(B*99|0|0)/100|0}do{if((c[h+64>>2]|0)!=0){if((l|0)<(c[h+60>>2]|0)){break}if((m|0)<(o<<1|0)){B=(B*98|0|0)/100|0}if((m<<1|0)<(o*3|0|0)){B=(B*98|0|0)/100|0}A=h;z=B;dy(A,95,z)|0;break L6846}else{B=(B*96|0|0)/100|0}}while(0);z=h;A=B;dy(z,45,A)|0;if((B|0)<100){break}E=45;F=E;i=e;return F|0}}while(0);B=100;if((o|0)>2){G=(m|0)>2}else{G=0}do{if(G){if((c[h+196>>2]|0)!=2){break}u=k;while(1){if((u|0)>=(l|0)){break}if(((du(d+((m|0)/10|0)|0,j-((m|0)/10|0)|0,u,u,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==1){C=5047;break}u=u+1|0}if(((du(d+((m|0)/10|0)|0,j-((m|0)/10|0)|0,u,u,c[h+68>>2]|0,b,2)|0)<<24>>24|0)==2){break}if(((du(d,j,(u+l|0)/2|0,(u+l|0)/2|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==1){break}if(((du(d+((m|0)/10|0)|0,j-((m|0)/10|0)|0,l,l,c[h+68>>2]|0,b,2)|0)<<24>>24|0)==2){break}if((m<<1|0)<(o|0)){break}if((m<<2|0)<(o*3|0|0)){B=(B*99|0|0)/100|0}dy(h,61,B)|0;E=61;F=E;i=e;return F|0}}while(0);B=100;if((o|0)>2){H=(o|0)>=(m<<1|0)}else{H=0}L6916:do{if(H){do{if((c[h+28>>2]|0)==2){if((c[h+32>>2]|0)!=0){break}I=(o|0)/16|0;while(1){if((I|0)>=((o|0)/2|0|0)){break}if(((du(d+((m|0)/8|0)|0,j-((m|0)/8|0)|0,k+I|0,k+I|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5071;break}I=I+1|0}if((I|0)>=((o|0)/2|0|0)){break L6916}J=(o|0)/16|0;while(1){if((J|0)>=((o|0)/2|0|0)){break}if(((du(d+((m|0)/8|0)|0,j-((m|0)/8|0)|0,l-J|0,l-J|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5079;break}J=J+1|0}if((J|0)>=((o|0)/2|0|0)){break L6916}do{if((c[h+60>>2]|0)!=0){if((l|0)<=(c[h+60>>2]|0)){break}B=(B*98|0|0)/100|0}}while(0);do{if((c[h+60>>2]|0)!=0){if((k<<1|0)<=((c[h+56>>2]|0)+(c[h+52>>2]|0)|0)){break}B=(B*98|0|0)/100|0}}while(0);if((s|0)!=0){B=(B*99|0|0)/100|0}B=B-(((P(I-J|0)|0)/(o|0)|0)*20|0)|0;if((P(I-m|0)|0)>((o|0)/4|0|0)){break L6916}if((P(I-m|0)|0)>((o|0)/8|0|0)){B=(B*98|0|0)/100|0}if((P(J-m|0)|0)>((o|0)/4|0|0)){break L6916}if((P(J-m|0)|0)>((o|0)/8|0|0)){B=(B*98|0|0)/100|0}if((c[h+24>>2]|0)!=1){B=(B*96|0|0)/100|0}dy(h,58,B)|0;if((B|0)<100){break L6916}E=58;F=E;i=e;return F|0}}while(0)}}while(0);if((k<<1|0)>((c[h+56>>2]|0)+(c[h+52>>2]|0)|0)){if((l<<2|0)>=(((c[h+60>>2]|0)*3|0)+(c[h+56>>2]|0)|0)){if((c[h+196>>2]|0)==2){B=100;do{if((o|0)>5){if((m|0)<=1){K=0;break}K=(o<<1|0)>(m*3|0|0)}else{K=0}}while(0);do{if(K){I=0;while(1){if((I|0)>=((o|0)/2|0|0)){break}if(((du(d,j,k+I|0,k+I|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5116;break}I=I+1|0}if((I|0)>=((o|0)/2|0|0)){break}J=0;while(1){if((J|0)>=((o|0)/2|0|0)){break}if(((du(d,j,l-J|0,l-J|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5124;break}J=J+1|0}if((J|0)<(I|0)){break}u=0;while(1){if((u|0)>=(o|0)){break}t=0;while(1){if((t|0)>=((m|0)/2|0|0)){break}s=(d8(a,t,u)|0)<(b|0)|0;if((s|0)!=((d8(a,m-1-t|0,u)|0)<(b|0)|0)){C=5134;break}t=t+1|0}if((C|0)==5134){C=0;u=o+1|0}u=u+1|0}if((u|0)==(o|0)){B=(B*96|0|0)/100|0}do{if((J|0)==(I|0)){if((l|0)>(c[h+60>>2]|0)){break}B=(B*97|0|0)/100|0}}while(0);if((J-I|0)<((o|0)/8|0|0)){B=(B*99|0|0)/100|0}dy(h,59,B)|0;if((B|0)<100){break}E=59;F=E;i=e;return F|0}}while(0)}}}do{if((o*3|0|0)<((c[h+64>>2]|0)-(c[h+52>>2]|0)|0)){if((P(m-o|0)|0)>=(((m+o|0)/4|0)+2|0)){break}if((l*3|0|0)<((c[h+60>>2]<<1)+(c[h+56>>2]|0)|0)){break}if((k*5|0|0)<(((c[h+60>>2]|0)*3|0)+(c[h+56>>2]<<1)|0)){break}x=0;I=60;J=140;B=99;t=d;while(1){if((t|0)>(j|0)){break}u=k;while(1){if((u|0)>(l|0)){break}K=(((t<<1)-(d+j)|0)*100|0|0)/(m|0)|0;s=(((u<<1)-(k+l)|0)*100|0|0)/(o|0)|0;if(((aa(K,K)|0)+(aa(s,s)|0)|0)<(aa(I,I)|0)){if((d8(c[h+68>>2]|0,t,u)|0)>=(b|0)){x=x+1|0;t=j+1|0;u=l+1|0}}if(((aa(K,K)|0)+(aa(s,s)|0)|0)>(aa(J,J)|0)){if((d8(c[h+68>>2]|0,t,u)|0)<(b|0)){x=x+1|0;t=j+1|0;u=l+1|0}}u=u+1|0}t=t+1|0}if((dC(c[h+68>>2]|0,d,k+((o|0)/2|0)|0,j-d|0,b,0,3)|0)>((m|0)/8|0|0)){B=(B*98|0|0)/100|0;if((dC(c[h+68>>2]|0,d,l,j-d|0,b,0,3)|0)<=((m|0)/8|0|0)){B=(B*98|0|0)/100|0}}if((x|0)==0){J=dC(c[h+68>>2]|0,d,k,j-d|0,b,0,3)|0;if((J|0)<=(dC(c[h+68>>2]|0,d,l,j-d|0,b,0,3)|0)){C=5179}else{J=dC(c[h+68>>2]|0,j,k,j-d|0,b,0,4)|0;if((J|0)>=(dC(c[h+68>>2]|0,j,l,j-d|0,b,0,4)|0)){C=5179}}if((C|0)==5179){p=46;if((c[h+24>>2]|0)!=0){J=h;I=B;dy(J,58,I)|0;B=(B*98|0|0)/100|0}I=h;J=p;s=B;dy(I,J,s)|0}}}}while(0);do{if((o*3|0|0)<((c[h+64>>2]|0)-(c[h+52>>2]|0)<<1|0)){if((k<<1|0)<=((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){break}if((m<<1|0)>=(o*3|0|0)){if(((du(0,(m|0)/2|0,(o|0)/2|0,o-1|0,a,b,1)|0)<<24>>24|0)!=0){break}}if((c[h+24>>2]|0)!=0){break}B=100;p=44;do{if((o|0)==1){if((m|0)!=1){break}B=(B*98|0|0)/100|0}}while(0);do{if((o|0)==2){if((m|0)!=1){break}B=(B*99|0|0)/100|0}}while(0);if((m|0)>=(o|0)){B=(B*99|0|0)/100|0}if((o<<1|0)>=((c[h+64>>2]|0)-(c[h+52>>2]|0)|0)){B=(B*98|0|0)/100|0}x=dC(c[h+68>>2]|0,d,k,j-d|0,b,0,3)|0;do{if((x|0)>(dC(c[h+68>>2]|0,d,l,j-d|0,b,0,3)|0)){t=dC(c[h+68>>2]|0,j,k,j-d|0,b,0,4)|0;if((t|0)>=(dC(c[h+68>>2]|0,j,l,j-d|0,b,0,4)|0)){C=5202;break}B=(B*99|0|0)/100|0}else{C=5202}}while(0);if((C|0)==5202){if((dC(c[h+68>>2]|0,d,(k+l+1|0)/2|0,j-d|0,b,0,3)|0)<((m|0)/2|0|0)){B=(B*98|0|0)/100|0}if((dC(c[h+68>>2]|0,j,l,j-d|0,b,0,4)|0)<((m|0)/2|0|0)){B=(B*99|0|0)/100|0}}x=h;t=p;s=B;dy(x,t,s)|0}}while(0);do{if((o|0)<((c[h+60>>2]|0)-(c[h+56>>2]|0)|0)){if((k<<1|0)>=((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){break}if((l*3|0|0)>=((c[h+56>>2]|0)+(c[h+60>>2]<<1)+2|0)){break}B=100;p=39;if((l*3|0|0)>=((c[h+56>>2]|0)+(c[h+60>>2]<<1)|0)){B=(B*96|0|0)/100|0}if((l<<1|0)>=((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){B=(B*99|0|0)/100|0}if((c[h+196>>2]|0)>1){if((l<<1|0)>=((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){B=(B*96|0|0)/100|0}if((l*3|0|0)>=((c[h+56>>2]<<1)+(c[h+60>>2]|0)|0)){B=(B*96|0|0)/100|0}if(((du(d,j,((c[h+56>>2]|0)+((c[h+60>>2]|0)*3|0)|0)/4|0,c[h+64>>2]|0,c[h+68>>2]|0,b,1)|0)<<24>>24|0)!=0){B=(B*98|0|0)/100|0}}do{if((m|0)>4){if((dv(d,j,(k+(l*3|0)|0)/4|0,(k+(l*3|0)|0)/4|0,c[h+68>>2]|0,b)|0)!=2){C=5228;break}p=34;if(((du((d+j|0)/2|0,(d+j|0)/2|0,k,l,c[h+68>>2]|0,b,1)|0)<<24>>24|0)!=0){B=(B*96|0|0)/100|0}}else{C=5228}}while(0);if((C|0)==5228){if((dv(d,j,k,k,c[h+68>>2]|0,b)|0)!=1){B=(B*96|0|0)/100|0}if((dv(d,j,(k+l|0)/2|0,(k+l|0)/2|0,c[h+68>>2]|0,b)|0)!=1){B=(B*98|0|0)/100|0}if((m|0)>(o|0)){B=(B*96|0|0)/100|0}}do{if((dv(j,j,k,l,c[h+68>>2]|0,b)|0)!=1){if((dv(d,d,k,l,c[h+68>>2]|0,b)|0)==1){break}B=(B*99|0|0)/100|0}}while(0);if((dv(d,j,k+((o|0)/4|0)|0,k+((o|0)/4|0)|0,c[h+68>>2]|0,b)|0)>2){B=(B*97|0|0)/100|0}if((dv(d,j,l-((o|0)/4|0)|0,l-((o|0)/4|0)|0,c[h+68>>2]|0,b)|0)>2){B=(B*97|0|0)/100|0}do{if((dC(c[h+68>>2]|0,d,k,m,b,0,3)|0)==0){if((dC(c[h+68>>2]|0,d,l,m,b,0,3)|0)<=0){break}if((dC(c[h+68>>2]|0,j,k,m,b,0,4)|0)<=0){break}if((dC(c[h+68>>2]|0,j,l,m,b,0,4)|0)!=0){break}p=96}}while(0);if((k<<1|0)>((c[h+52>>2]|0)+(c[h+56>>2]|0)|0)){B=(B*99|0|0)/100|0}a=h;s=p;t=B;dy(a,s,t)|0;if((B|0)<100){break}E=p;F=E;i=e;return F|0}}while(0);do{if((o<<1|0)<((c[h+64>>2]|0)-(c[h+52>>2]|0)+1|0)){if((k<<1|0)<((c[h+56>>2]|0)+(c[h+60>>2]|0)|0)){break}if((l|0)>((c[h+64>>2]|0)+1|0)){break}if((c[h+196>>2]|0)!=2){break}if((c[h+28>>2]|0)!=2){break}if((c[h+32>>2]|0)!=0){break}if((c[g+108>>2]|0)!=0){break}B=100;p=34;if((l<<1|0)>=(c[h+64>>2]|0)){B=(B*98|0|0)/100|0}if((k<<2|0)<=((c[h+56>>2]|0)+((c[h+60>>2]|0)*3|0)|0)){B=(B*99|0|0)/100|0}if((dv(d,j,(k+(l*3|0)|0)/4|0,(k+(l*3|0)|0)/4|0,c[h+68>>2]|0,b)|0)!=2){B=(B*90|0|0)/100|0}if((dv(j,j,k,l,c[h+68>>2]|0,b)|0)!=1){B=(B*99|0|0)/100|0}if((dv(d,j,k+((o|0)/4|0)|0,k+((o|0)/4|0)|0,c[h+68>>2]|0,b)|0)>2){B=(B*97|0|0)/100|0}if((dv(d,j,l-((o|0)/4|0)|0,l-((o|0)/4|0)|0,c[h+68>>2]|0,b)|0)>2){B=(B*97|0|0)/100|0}if((l<<1|0)>((c[h+60>>2]|0)+(c[h+64>>2]|0)|0)){B=(B*99|0|0)/100|0}t=h;s=B;dy(t,8222,s)|0;if((B|0)<100){break}E=p;F=E;i=e;return F|0}}while(0);do{if((o<<1|0)<((c[h+64>>2]|0)-(c[h+52>>2]|0)|0)){if((m|0)<(o|0)){break}if((m|0)<=3){break}if((o|0)<=1){break}if((k<<1|0)>=((c[h+52>>2]|0)+(c[h+56>>2]|0)|0)){break}if((l*3|0|0)>=((c[h+56>>2]<<1)+(c[h+60>>2]|0)|0)){break}B=dC(c[h+68>>2]|0,d,k,m,b,0,3)|0;do{if((B|0)>(dC(c[h+68>>2]|0,d,l,m,b,0,3)|0)){s=dC(c[h+68>>2]|0,j,k,m,b,0,4)|0;if((s|0)>=(dC(c[h+68>>2]|0,j,l,m,b,0,4)|0)){break}if((dv(d,j,k,k,c[h+68>>2]|0,b)|0)!=2){break}if((dv(d,j,l,l,c[h+68>>2]|0,b)|0)!=2){break}p=126;s=h;t=p;dy(s,t,99)|0}}while(0)}}while(0);do{if((o<<1|0)<((c[h+64>>2]|0)-(c[h+52>>2]|0)|0)){if((m|0)<(o|0)){break}if((m|0)<=2){break}if((o|0)<=1){break}if((k<<1|0)>=((c[h+52>>2]|0)+(c[h+56>>2]|0)|0)){break}if((l*3|0|0)>=((c[h+56>>2]<<1)+(c[h+60>>2]|0)|0)){break}if((c[h+196>>2]|0)!=1){break}if((c[h+28>>2]|0)!=1){break}if((c[h+32>>2]|0)!=0){break}if((c[g+108>>2]|0)!=0){break}B=dC(c[h+68>>2]|0,d,k,m,b,0,3)|0;if((B|0)>((dC(c[h+68>>2]|0,d,l,m,b,0,3)|0)-((m|0)/8|0)|0)){C=5300}else{B=dC(c[h+68>>2]|0,d,k,m,b,0,3)|0;if((B|0)>((dC(c[h+68>>2]|0,d,l-1|0,m,b,0,3)|0)-((m|0)/8|0)|0)){C=5300}}do{if((C|0)==5300){B=dC(c[h+68>>2]|0,j,k,m,b,0,4)|0;if((B|0)<=((dC(c[h+68>>2]|0,j,l,m,b,0,4)|0)-((m|0)/8|0)|0)){B=dC(c[h+68>>2]|0,j,k,m,b,0,4)|0;if((B|0)<=((dC(c[h+68>>2]|0,j,l-1|0,m,b,0,4)|0)-((m|0)/8|0)|0)){break}}if((dv(d,j,k,k,c[h+68>>2]|0,b)|0)!=1){break}if((dv(d,j,l,l,c[h+68>>2]|0,b)|0)!=2){if((dv(d,j,l-1|0,l-1|0,c[h+68>>2]|0,b)|0)!=2){break}}p=94;B=h;t=p;dy(B,t,99)|0}}while(0)}}while(0);q=c[h+40>>2]|0;if((q|0)==168){u=l;while(1){if((u|0)<=(k|0)){break}if(((du(d,j,u,u,c[h+68>>2]|0,b,1)|0)<<24>>24|0)==0){C=5311;break}u=u-1|0}if((C|0)==5311){k=u;o=l-k+1|0}}if((c[(c[7036]|0)+37068>>2]|0)!=0){E=cE(g)|0;F=E;i=e;return F|0}do{if((p|0)!=57344){if((c[h+72>>2]|0)<=0){break}if((c[h+116>>2]|0)!=100){break}E=p;F=E;i=e;return F|0}}while(0);do{if((p|0)==57344){C=5324}else{if((c[h+72>>2]|0)==0){C=5324;break}if((c[h+116>>2]|0)<100){C=5324}}}while(0);if((C|0)==5324){p=cL(g)|0}do{if((p|0)==57344){C=5328}else{if((c[h+72>>2]|0)==0){C=5328;break}if((c[h+116>>2]|0)<100){C=5328}}}while(0);if((C|0)==5328){p=cM(g)|0}do{if((p|0)==57344){C=5332}else{if((c[h+72>>2]|0)==0){C=5332;break}if((c[h+116>>2]|0)<100){C=5332}}}while(0);if((C|0)==5332){p=cN(g)|0}do{if((p|0)==57344){C=5336}else{if((c[h+72>>2]|0)==0){C=5336;break}if((c[h+116>>2]|0)<100){C=5336}}}while(0);if((C|0)==5336){p=cO(g)|0}do{if((p|0)==57344){C=5340}else{if((c[h+72>>2]|0)==0){C=5340;break}if((c[h+116>>2]|0)<100){C=5340}}}while(0);if((C|0)==5340){p=cP(g)|0}do{if((p|0)==57344){C=5344}else{if((c[h+72>>2]|0)==0){C=5344;break}if((c[h+116>>2]|0)<100){C=5344}}}while(0);if((C|0)==5344){p=cQ(g)|0}do{if((p|0)==57344){C=5348}else{if((c[h+72>>2]|0)==0){C=5348;break}if((c[h+116>>2]|0)<100){C=5348}}}while(0);if((C|0)==5348){p=cR(g)|0}do{if((p|0)==57344){C=5352}else{if((c[h+72>>2]|0)==0){C=5352;break}if((c[h+116>>2]|0)<100){C=5352}}}while(0);if((C|0)==5352){p=cS(g)|0}do{if((p|0)==57344){C=5356}else{if((c[h+72>>2]|0)==0){C=5356;break}if((c[h+116>>2]|0)<100){C=5356}}}while(0);if((C|0)==5356){p=cT(g)|0}do{if((p|0)==57344){C=5360}else{if((c[h+72>>2]|0)==0){C=5360;break}if((c[h+116>>2]|0)<100){C=5360}}}while(0);if((C|0)==5360){p=cU(g)|0}do{if((p|0)==57344){C=5364}else{if((c[h+72>>2]|0)==0){C=5364;break}if((c[h+116>>2]|0)<100){C=5364}}}while(0);if((C|0)==5364){p=cV(g)|0}do{if((p|0)==57344){C=5368}else{if((c[h+72>>2]|0)==0){C=5368;break}if((c[h+116>>2]|0)<100){C=5368}}}while(0);if((C|0)==5368){p=cW(g)|0}do{if((p|0)==57344){C=5372}else{if((c[h+72>>2]|0)==0){C=5372;break}if((c[h+116>>2]|0)<100){C=5372}}}while(0);if((C|0)==5372){p=cX(g)|0}do{if((p|0)==57344){C=5376}else{if((c[h+72>>2]|0)==0){C=5376;break}if((c[h+116>>2]|0)<100){C=5376}}}while(0);if((C|0)==5376){p=cY(g)|0}do{if((p|0)==57344){C=5380}else{if((c[h+72>>2]|0)==0){C=5380;break}if((c[h+116>>2]|0)<100){C=5380}}}while(0);if((C|0)==5380){p=cZ(g)|0}do{if((p|0)==57344){C=5384}else{if((c[h+72>>2]|0)==0){C=5384;break}if((c[h+116>>2]|0)<100){C=5384}}}while(0);if((C|0)==5384){p=c_(g)|0}do{if((p|0)==57344){C=5388}else{if((c[h+72>>2]|0)==0){C=5388;break}if((c[h+116>>2]|0)<100){C=5388}}}while(0);if((C|0)==5388){p=c$(g)|0}do{if((p|0)==57344){C=5392}else{if((c[h+72>>2]|0)==0){C=5392;break}if((c[h+116>>2]|0)<100){C=5392}}}while(0);if((C|0)==5392){p=c0(g)|0}do{if((p|0)==57344){C=5396}else{if((c[h+72>>2]|0)==0){C=5396;break}if((c[h+116>>2]|0)<100){C=5396}}}while(0);if((C|0)==5396){p=c1(g)|0}do{if((p|0)==57344){C=5400}else{if((c[h+72>>2]|0)==0){C=5400;break}if((c[h+116>>2]|0)<100){C=5400}}}while(0);if((C|0)==5400){p=c2(g)|0}do{if((p|0)==57344){C=5404}else{if((c[h+72>>2]|0)==0){C=5404;break}if((c[h+116>>2]|0)<100){C=5404}}}while(0);if((C|0)==5404){p=c3(g)|0}do{if((p|0)==57344){C=5408}else{if((c[h+72>>2]|0)==0){C=5408;break}if((c[h+116>>2]|0)<100){C=5408}}}while(0);if((C|0)==5408){p=c4(g)|0}do{if((p|0)==57344){C=5412}else{if((c[h+72>>2]|0)==0){C=5412;break}if((c[h+116>>2]|0)<100){C=5412}}}while(0);if((C|0)==5412){p=c5(g)|0}do{if((p|0)==57344){C=5416}else{if((c[h+72>>2]|0)==0){C=5416;break}if((c[h+116>>2]|0)<100){C=5416}}}while(0);if((C|0)==5416){p=c6(g)|0}do{if((p|0)==57344){C=5420}else{if((c[h+72>>2]|0)==0){C=5420;break}if((c[h+116>>2]|0)<100){C=5420}}}while(0);if((C|0)==5420){p=c7(g)|0}do{if((p|0)==57344){C=5424}else{if((c[h+72>>2]|0)==0){C=5424;break}if((c[h+116>>2]|0)<100){C=5424}}}while(0);if((C|0)==5424){p=c8(g)|0}do{if((p|0)==57344){C=5428}else{if((c[h+72>>2]|0)==0){C=5428;break}if((c[h+116>>2]|0)<100){C=5428}}}while(0);if((C|0)==5428){p=c9(g)|0}do{if((p|0)==57344){C=5432}else{if((c[h+72>>2]|0)==0){C=5432;break}if((c[h+116>>2]|0)<100){C=5432}}}while(0);if((C|0)==5432){p=da(g)|0}do{if((p|0)==57344){C=5436}else{if((c[h+72>>2]|0)==0){C=5436;break}if((c[h+116>>2]|0)<100){C=5436}}}while(0);if((C|0)==5436){p=db(g)|0}do{if((p|0)==57344){C=5440}else{if((c[h+72>>2]|0)==0){C=5440;break}if((c[h+116>>2]|0)<100){C=5440}}}while(0);if((C|0)==5440){p=dc(g)|0}do{if((p|0)==57344){C=5444}else{if((c[h+72>>2]|0)==0){C=5444;break}if((c[h+116>>2]|0)<100){C=5444}}}while(0);if((C|0)==5444){p=dd(g)|0}do{if((p|0)==57344){C=5448}else{if((c[h+72>>2]|0)==0){C=5448;break}if((c[h+116>>2]|0)<100){C=5448}}}while(0);if((C|0)==5448){p=cE(g)|0}do{if((p|0)==57344){C=5452}else{if((c[h+72>>2]|0)==0){C=5452;break}if((c[h+116>>2]|0)<100){C=5452}}}while(0);if((C|0)==5452){p=de(g)|0}do{if((p|0)==57344){C=5456}else{if((c[h+72>>2]|0)==0){C=5456;break}if((c[h+116>>2]|0)<100){C=5456}}}while(0);if((C|0)==5456){p=df(g)|0}do{if((p|0)==57344){C=5460}else{if((c[h+72>>2]|0)==0){C=5460;break}if((c[h+116>>2]|0)<100){C=5460}}}while(0);if((C|0)==5460){p=dg(g)|0}do{if((c[h+72>>2]|0)==0){if((p|0)==57344){break}g=c[n>>2]|0;au(g|0,16200,(g=i,i=i+1|0,i=i+7&-8,c[g>>2]=0,g)|0)|0;i=g}}while(0);do{if((c[h+72>>2]|0)>0){if((c[h+116>>2]|0)<=95){break}g=c[h+76>>2]|0;p=g;c[h+36>>2]=g}}while(0);r=0;while(1){if((r|0)>=(c[h+72>>2]|0)){break}if((c[h+76+(r<<2)>>2]|0)==(p|0)){p=c[h+76>>2]|0}r=r+1|0}E=p;F=E;i=e;return F|0}
function ew(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[6922]|0;if(b>>>0<e>>>0){bb()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bb()}h=f&-8;i=a+(h-8)|0;j=i;L12362:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bb()}if((n|0)==(c[6923]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[6920]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=27712+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bb()}if((c[k+12>>2]|0)==(n|0)){break}bb()}}while(0);if((s|0)==(k|0)){c[6918]=c[6918]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bb()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bb()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bb()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){bb()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bb()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bb()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=27976+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[6919]=c[6919]&~(1<<c[v>>2]);q=n;r=o;break L12362}else{if(p>>>0<(c[6922]|0)>>>0){bb()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L12362}}}while(0);if(A>>>0<(c[6922]|0)>>>0){bb()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[6922]|0)>>>0){bb()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[6922]|0)>>>0){bb()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bb()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){bb()}do{if((e&2|0)==0){if((j|0)==(c[6924]|0)){B=(c[6921]|0)+r|0;c[6921]=B;c[6924]=q;c[q+4>>2]=B|1;if((q|0)!=(c[6923]|0)){return}c[6923]=0;c[6920]=0;return}if((j|0)==(c[6923]|0)){B=(c[6920]|0)+r|0;c[6920]=B;c[6923]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L12464:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=27712+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[6922]|0)>>>0){bb()}if((c[u+12>>2]|0)==(j|0)){break}bb()}}while(0);if((g|0)==(u|0)){c[6918]=c[6918]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[6922]|0)>>>0){bb()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}bb()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[6922]|0)>>>0){bb()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[6922]|0)>>>0){bb()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){bb()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{bb()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=27976+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[6919]=c[6919]&~(1<<c[t>>2]);break L12464}else{if(f>>>0<(c[6922]|0)>>>0){bb()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L12464}}}while(0);if(E>>>0<(c[6922]|0)>>>0){bb()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[6922]|0)>>>0){bb()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[6922]|0)>>>0){bb()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[6923]|0)){H=B;break}c[6920]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=27712+(d<<2)|0;A=c[6918]|0;E=1<<r;do{if((A&E|0)==0){c[6918]=A|E;I=e;J=27712+(d+2<<2)|0}else{r=27712+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[6922]|0)>>>0){I=h;J=r;break}bb()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=27976+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[6919]|0;d=1<<K;do{if((r&d|0)==0){c[6919]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=9322;break}else{A=A<<1;J=E}}if((N|0)==9322){if(M>>>0<(c[6922]|0)>>>0){bb()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[6922]|0;if(J>>>0<E>>>0){bb()}if(B>>>0<E>>>0){bb()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[6926]|0)-1|0;c[6926]=q;if((q|0)==0){O=28128}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[6926]=-1;return}function ex(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=ev(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(a9()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=ey(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=ev(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;eB(f|0,a|0,e)|0;ew(a);d=f;return d|0}function ey(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[6922]|0;if(g>>>0<j>>>0){bb();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){bb();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){bb();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[6838]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;ez(g+b|0,k);n=a;return n|0}if((i|0)==(c[6924]|0)){k=(c[6921]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[6924]=g+b;c[6921]=l;n=a;return n|0}if((i|0)==(c[6923]|0)){l=(c[6920]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[6920]=q;c[6923]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L12651:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=27712+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){bb();return 0}if((c[l+12>>2]|0)==(i|0)){break}bb();return 0}}while(0);if((k|0)==(l|0)){c[6918]=c[6918]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){bb();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}bb();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){bb();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){bb();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){bb();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{bb();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=27976+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[6919]=c[6919]&~(1<<c[t>>2]);break L12651}else{if(s>>>0<(c[6922]|0)>>>0){bb();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L12651}}}while(0);if(y>>>0<(c[6922]|0)>>>0){bb();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[6922]|0)>>>0){bb();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;ez(g+b|0,q);n=a;return n|0}return 0}function ez(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L12727:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[6922]|0;if(i>>>0<l>>>0){bb()}if((j|0)==(c[6923]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[6920]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=27712+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bb()}if((c[p+12>>2]|0)==(j|0)){break}bb()}}while(0);if((q|0)==(p|0)){c[6918]=c[6918]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bb()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bb()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){bb()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){bb()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bb()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{bb()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=27976+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[6919]=c[6919]&~(1<<c[t>>2]);n=j;o=k;break L12727}else{if(m>>>0<(c[6922]|0)>>>0){bb()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L12727}}}while(0);if(y>>>0<(c[6922]|0)>>>0){bb()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[6922]|0)>>>0){bb()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[6922]|0)>>>0){bb()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[6922]|0;if(e>>>0<a>>>0){bb()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[6924]|0)){A=(c[6921]|0)+o|0;c[6921]=A;c[6924]=n;c[n+4>>2]=A|1;if((n|0)!=(c[6923]|0)){return}c[6923]=0;c[6920]=0;return}if((f|0)==(c[6923]|0)){A=(c[6920]|0)+o|0;c[6920]=A;c[6923]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L12827:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=27712+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bb()}if((c[g+12>>2]|0)==(f|0)){break}bb()}}while(0);if((t|0)==(g|0)){c[6918]=c[6918]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){bb()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}bb()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){bb()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){bb()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bb()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{bb()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=27976+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[6919]=c[6919]&~(1<<c[l>>2]);break L12827}else{if(m>>>0<(c[6922]|0)>>>0){bb()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L12827}}}while(0);if(C>>>0<(c[6922]|0)>>>0){bb()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[6922]|0)>>>0){bb()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[6922]|0)>>>0){bb()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[6923]|0)){F=A;break}c[6920]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=27712+(z<<2)|0;C=c[6918]|0;b=1<<o;do{if((C&b|0)==0){c[6918]=C|b;G=y;H=27712+(z+2<<2)|0}else{o=27712+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[6922]|0)>>>0){G=d;H=o;break}bb()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=27976+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[6919]|0;z=1<<I;if((o&z|0)==0){c[6919]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=9602;break}else{I=I<<1;J=G}}if((L|0)==9602){if(K>>>0<(c[6922]|0)>>>0){bb()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[6922]|0;if(J>>>0<I>>>0){bb()}if(L>>>0<I>>>0){bb()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function eA(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function eB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function eC(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function eD(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{eB(b,c,d)|0}return b|0}function eE(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function eF(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function eG(a,b){a=a|0;b=b|0;return bk[a&1](b|0)|0}function eH(a){a=a|0;bl[a&1]()}function eI(a,b,c){a=a|0;b=b|0;c=c|0;return bm[a&7](b|0,c|0)|0}function eJ(a,b){a=a|0;b=b|0;bn[a&3](b|0)}function eK(a){a=a|0;ab(0);return 0}function eL(){ab(1)}function eM(a,b){a=a|0;b=b|0;ab(2);return 0}function eN(a){a=a|0;ab(3)}
// EMSCRIPTEN_END_FUNCS
var bk=[eK,eK];var bl=[eL,eL];var bm=[eM,eM,d3,eM,dM,eM,eM,eM];var bn=[eN,eN,ck,eN];return{_strlen:eA,_free:ew,_main:ca,_realloc:ex,_strncpy:eE,_memmove:eD,_tolower:eF,_memset:eC,_malloc:ev,_memcpy:eB,runPostSets:bE,stackAlloc:bo,stackSave:bp,stackRestore:bq,setThrew:br,setTempRet0:bu,setTempRet1:bv,setTempRet2:bw,setTempRet3:bx,setTempRet4:by,setTempRet5:bz,setTempRet6:bA,setTempRet7:bB,setTempRet8:bC,setTempRet9:bD,dynCall_ii:eG,dynCall_v:eH,dynCall_iii:eI,dynCall_vi:eJ}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_strncmp": _strncmp, "_lseek": _lseek, "_ferror": _ferror, "_snprintf": _snprintf, "_fgetc": _fgetc, "_pclose": _pclose, "_fclose": _fclose, "_freopen": _freopen, "_isdigit": _isdigit, "_strncat": _strncat, "_fprintf": _fprintf, "_toupper": _toupper, "_close": _close, "_fgets": _fgets, "_pread": _pread, "_fflush": _fflush, "_fopen": _fopen, "_open": _open, "_strchr": _strchr, "_fputc": _fputc, "___assert_fail": ___assert_fail, "___setErrNo": ___setErrNo, "_feof": _feof, "_fseek": _fseek, "_qsort": _qsort, "_send": _send, "_write": _write, "_fputs": _fputs, "_ftell": _ftell, "_abs": _abs, "_exit": _exit, "_sprintf": _sprintf, "_strrchr": _strrchr, "_strdup": _strdup, "_isspace": _isspace, "_sysconf": _sysconf, "_fcntl": _fcntl, "_strtol": _strtol, "_fread": _fread, "_isalpha": _isalpha, "_dup2": _dup2, "_read": _read, "__reallyNegative": __reallyNegative, "_time": _time, "__formatString": __formatString, "_gettimeofday": _gettimeofday, "_atoi": _atoi, "_recv": _recv, "_fileno": _fileno, "_pwrite": _pwrite, "_strstr": _strstr, "_sbrk": _sbrk, "_fsync": _fsync, "___errno_location": ___errno_location, "_popen": _popen, "_abort": _abort, "__parseInt": __parseInt, "_fwrite": _fwrite, "_islower": _islower, "__exit": __exit, "_isupper": _isupper, "_strcmp": _strcmp, "_setvbuf": _setvbuf, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "_stderr": _stderr, "_stdout": _stdout }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
	return recognizedText
}
