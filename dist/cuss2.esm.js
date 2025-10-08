var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../Library/Caches/deno/deno_esbuild/registry.npmjs.org/events@3.3.0/node_modules/events/events.js
var require_events = __commonJS({
  "../../../Library/Caches/deno/deno_esbuild/registry.npmjs.org/events@3.3.0/node_modules/events/events.js"(exports, module) {
    "use strict";
    var R = typeof Reflect === "object" ? Reflect : null;
    var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
      return Function.prototype.apply.call(target, receiver, args);
    };
    var ReflectOwnKeys;
    if (R && typeof R.ownKeys === "function") {
      ReflectOwnKeys = R.ownKeys;
    } else if (Object.getOwnPropertySymbols) {
      ReflectOwnKeys = function ReflectOwnKeys2(target) {
        return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
      };
    } else {
      ReflectOwnKeys = function ReflectOwnKeys2(target) {
        return Object.getOwnPropertyNames(target);
      };
    }
    function ProcessEmitWarning(warning) {
      if (console && console.warn)
        console.warn(warning);
    }
    var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
      return value !== value;
    };
    function EventEmitter5() {
      EventEmitter5.init.call(this);
    }
    module.exports = EventEmitter5;
    module.exports.once = once;
    EventEmitter5.EventEmitter = EventEmitter5;
    EventEmitter5.prototype._events = void 0;
    EventEmitter5.prototype._eventsCount = 0;
    EventEmitter5.prototype._maxListeners = void 0;
    var defaultMaxListeners = 10;
    function checkListener(listener) {
      if (typeof listener !== "function") {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
    }
    Object.defineProperty(EventEmitter5, "defaultMaxListeners", {
      enumerable: true,
      get: function() {
        return defaultMaxListeners;
      },
      set: function(arg) {
        if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
        }
        defaultMaxListeners = arg;
      }
    });
    EventEmitter5.init = function() {
      if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
        this._events = /* @__PURE__ */ Object.create(null);
        this._eventsCount = 0;
      }
      this._maxListeners = this._maxListeners || void 0;
    };
    EventEmitter5.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
      }
      this._maxListeners = n;
      return this;
    };
    function _getMaxListeners(that) {
      if (that._maxListeners === void 0)
        return EventEmitter5.defaultMaxListeners;
      return that._maxListeners;
    }
    EventEmitter5.prototype.getMaxListeners = function getMaxListeners() {
      return _getMaxListeners(this);
    };
    EventEmitter5.prototype.emit = function emit(type) {
      var args = [];
      for (var i = 1; i < arguments.length; i++)
        args.push(arguments[i]);
      var doError = type === "error";
      var events = this._events;
      if (events !== void 0)
        doError = doError && events.error === void 0;
      else if (!doError)
        return false;
      if (doError) {
        var er;
        if (args.length > 0)
          er = args[0];
        if (er instanceof Error) {
          throw er;
        }
        var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
        err.context = er;
        throw err;
      }
      var handler = events[type];
      if (handler === void 0)
        return false;
      if (typeof handler === "function") {
        ReflectApply(handler, this, args);
      } else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          ReflectApply(listeners[i], this, args);
      }
      return true;
    };
    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;
      checkListener(listener);
      events = target._events;
      if (events === void 0) {
        events = target._events = /* @__PURE__ */ Object.create(null);
        target._eventsCount = 0;
      } else {
        if (events.newListener !== void 0) {
          target.emit(
            "newListener",
            type,
            listener.listener ? listener.listener : listener
          );
          events = target._events;
        }
        existing = events[type];
      }
      if (existing === void 0) {
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === "function") {
          existing = events[type] = prepend ? [listener, existing] : [existing, listener];
        } else if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
        m = _getMaxListeners(target);
        if (m > 0 && existing.length > m && !existing.warned) {
          existing.warned = true;
          var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          w.name = "MaxListenersExceededWarning";
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          ProcessEmitWarning(w);
        }
      }
      return target;
    }
    EventEmitter5.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };
    EventEmitter5.prototype.on = EventEmitter5.prototype.addListener;
    EventEmitter5.prototype.prependListener = function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };
    function onceWrapper() {
      if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0)
          return this.listener.call(this.target);
        return this.listener.apply(this.target, arguments);
      }
    }
    function _onceWrap(target, type, listener) {
      var state = { fired: false, wrapFn: void 0, target, type, listener };
      var wrapped = onceWrapper.bind(state);
      wrapped.listener = listener;
      state.wrapFn = wrapped;
      return wrapped;
    }
    EventEmitter5.prototype.once = function once2(type, listener) {
      checkListener(listener);
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };
    EventEmitter5.prototype.prependOnceListener = function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };
    EventEmitter5.prototype.removeListener = function removeListener(type, listener) {
      var list, events, position, i, originalListener;
      checkListener(listener);
      events = this._events;
      if (events === void 0)
        return this;
      list = events[type];
      if (list === void 0)
        return this;
      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = /* @__PURE__ */ Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit("removeListener", type, list.listener || listener);
        }
      } else if (typeof list !== "function") {
        position = -1;
        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }
        if (position < 0)
          return this;
        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }
        if (list.length === 1)
          events[type] = list[0];
        if (events.removeListener !== void 0)
          this.emit("removeListener", type, originalListener || listener);
      }
      return this;
    };
    EventEmitter5.prototype.off = EventEmitter5.prototype.removeListener;
    EventEmitter5.prototype.removeAllListeners = function removeAllListeners(type) {
      var listeners, events, i;
      events = this._events;
      if (events === void 0)
        return this;
      if (events.removeListener === void 0) {
        if (arguments.length === 0) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== void 0) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else
            delete events[type];
        }
        return this;
      }
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === "removeListener")
            continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners("removeListener");
        this._events = /* @__PURE__ */ Object.create(null);
        this._eventsCount = 0;
        return this;
      }
      listeners = events[type];
      if (typeof listeners === "function") {
        this.removeListener(type, listeners);
      } else if (listeners !== void 0) {
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }
      return this;
    };
    function _listeners(target, type, unwrap) {
      var events = target._events;
      if (events === void 0)
        return [];
      var evlistener = events[type];
      if (evlistener === void 0)
        return [];
      if (typeof evlistener === "function")
        return unwrap ? [evlistener.listener || evlistener] : [evlistener];
      return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
    }
    EventEmitter5.prototype.listeners = function listeners(type) {
      return _listeners(this, type, true);
    };
    EventEmitter5.prototype.rawListeners = function rawListeners(type) {
      return _listeners(this, type, false);
    };
    EventEmitter5.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === "function") {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };
    EventEmitter5.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;
      if (events !== void 0) {
        var evlistener = events[type];
        if (typeof evlistener === "function") {
          return 1;
        } else if (evlistener !== void 0) {
          return evlistener.length;
        }
      }
      return 0;
    }
    EventEmitter5.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
    };
    function arrayClone(arr, n) {
      var copy = new Array(n);
      for (var i = 0; i < n; ++i)
        copy[i] = arr[i];
      return copy;
    }
    function spliceOne(list, index) {
      for (; index + 1 < list.length; index++)
        list[index] = list[index + 1];
      list.pop();
    }
    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }
    function once(emitter, name) {
      return new Promise(function(resolve, reject) {
        function errorListener(err) {
          emitter.removeListener(name, resolver);
          reject(err);
        }
        function resolver() {
          if (typeof emitter.removeListener === "function") {
            emitter.removeListener("error", errorListener);
          }
          resolve([].slice.call(arguments));
        }
        ;
        eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
        if (name !== "error") {
          addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
        }
      });
    }
    function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
      if (typeof emitter.on === "function") {
        eventTargetAgnosticAddListener(emitter, "error", handler, flags);
      }
    }
    function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
      if (typeof emitter.on === "function") {
        if (flags.once) {
          emitter.once(name, listener);
        } else {
          emitter.on(name, listener);
        }
      } else if (typeof emitter.addEventListener === "function") {
        emitter.addEventListener(name, function wrapListener(arg) {
          if (flags.once) {
            emitter.removeEventListener(name, wrapListener);
          }
          listener(arg);
        });
      } else {
        throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
      }
    }
  }
});

// https://jsr.io/@cuss/cuss2-typescript-models/2.0.1/mod.ts
var mod_exports = {};
__export(mod_exports, {
  AckCodes: () => AckCodes,
  ApplicationStateChangeReasonCodes: () => ApplicationStateChangeReasonCodes,
  ApplicationStateCodes: () => ApplicationStateCodes,
  BiometricProviderMessageType: () => BiometricProviderMessageType,
  BiometricsCharacteristics: () => BiometricsCharacteristics,
  CardBrand: () => CardBrand,
  CharacteristicsDocumentType: () => CharacteristicsDocumentType,
  ComponentState: () => ComponentState,
  ComponentTypes: () => ComponentTypes,
  CussDataTypes: () => CussDataTypes,
  DataStatus: () => DataStatus,
  DeviceTypes: () => DeviceTypes,
  EventCategories: () => EventCategories,
  EventModes: () => EventModes,
  EventTypes: () => EventTypes,
  MediaType: () => MediaType,
  MediaTypes: () => MediaTypes,
  MessageCodes: () => MessageCodes,
  NavigationTypes: () => NavigationTypes,
  OperationDocumentType: () => OperationDocumentType,
  PaymentsCharacteristics: () => PaymentsCharacteristics,
  PlatformDirectives: () => PlatformDirectives,
  SupportedColors: () => SupportedColors,
  TransactionDocumentType: () => TransactionDocumentType
});

// https://jsr.io/@cuss/cuss2-typescript-models/2.0.1/src/types.gen.ts
var BiometricProviderMessageType = /* @__PURE__ */ ((BiometricProviderMessageType2) => {
  BiometricProviderMessageType2["NONE"] = "NONE";
  BiometricProviderMessageType2["REQUEST"] = "REQUEST";
  BiometricProviderMessageType2["REQUEST_DATA"] = "REQUEST_DATA";
  BiometricProviderMessageType2["RESPONSE"] = "RESPONSE";
  return BiometricProviderMessageType2;
})(BiometricProviderMessageType || {});
var CharacteristicsDocumentType = /* @__PURE__ */ ((CharacteristicsDocumentType2) => {
  CharacteristicsDocumentType2["NONE"] = "NONE";
  CharacteristicsDocumentType2["REQUEST"] = "REQUEST";
  CharacteristicsDocumentType2["RESPONSE"] = "RESPONSE";
  return CharacteristicsDocumentType2;
})(CharacteristicsDocumentType || {});
var CardBrand = /* @__PURE__ */ ((CardBrand2) => {
  CardBrand2["AMEX"] = "AMEX";
  CardBrand2["CART_BLANCHE"] = "CART_BLANCHE";
  CardBrand2["DISCOVER"] = "DISCOVER";
  CardBrand2["JCB"] = "JCB";
  CardBrand2["MAESTRO"] = "MAESTRO";
  CardBrand2["MASTERCARD"] = "MASTERCARD";
  CardBrand2["SWITCH"] = "SWITCH";
  CardBrand2["VISA"] = "VISA";
  return CardBrand2;
})(CardBrand || {});
var MediaType = /* @__PURE__ */ ((MediaType2) => {
  MediaType2["ICC"] = "ICC";
  MediaType2["NFC"] = "NFC";
  MediaType2["RFID"] = "RFID";
  return MediaType2;
})(MediaType || {});
var OperationDocumentType = /* @__PURE__ */ ((OperationDocumentType2) => {
  OperationDocumentType2["REQUEST"] = "REQUEST";
  OperationDocumentType2["RESPONSE"] = "RESPONSE";
  return OperationDocumentType2;
})(OperationDocumentType || {});
var TransactionDocumentType = /* @__PURE__ */ ((TransactionDocumentType2) => {
  TransactionDocumentType2["NONE"] = "NONE";
  TransactionDocumentType2["REQUEST"] = "REQUEST";
  TransactionDocumentType2["RESPONSE"] = "RESPONSE";
  TransactionDocumentType2["ACK"] = "ACK";
  return TransactionDocumentType2;
})(TransactionDocumentType || {});
var AckCodes = /* @__PURE__ */ ((AckCodes2) => {
  AckCodes2["ACK_OK"] = "ACK_OK";
  AckCodes2["ACK_ERROR"] = "ACK_ERROR";
  AckCodes2["ACK_OAUTH_ERROR"] = "ACK_OAUTH_ERROR";
  AckCodes2["ACK_PARAMETER"] = "ACK_PARAMETER";
  return AckCodes2;
})(AckCodes || {});
var ApplicationStateChangeReasonCodes = /* @__PURE__ */ ((ApplicationStateChangeReasonCodes2) => {
  ApplicationStateChangeReasonCodes2["NOT_APPLICABLE"] = "NOT_APPLICABLE";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_HOURS"] = "OUT_OF_SERVICE_HOURS";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_HARDWARE"] = "OUT_OF_SERVICE_HARDWARE";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_BHS"] = "OUT_OF_SERVICE_BHS";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_CONSUMABLES"] = "OUT_OF_SERVICE_CONSUMABLES";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_INTERNAL"] = "OUT_OF_SERVICE_INTERNAL";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_DCS"] = "OUT_OF_SERVICE_DCS";
  ApplicationStateChangeReasonCodes2["OUT_OF_SERVICE_BACKEND"] = "OUT_OF_SERVICE_BACKEND";
  ApplicationStateChangeReasonCodes2["ABANDONED_BAG"] = "ABANDONED_BAG";
  return ApplicationStateChangeReasonCodes2;
})(ApplicationStateChangeReasonCodes || {});
var ApplicationStateCodes = /* @__PURE__ */ ((ApplicationStateCodes2) => {
  ApplicationStateCodes2["INITIALIZE"] = "INITIALIZE";
  ApplicationStateCodes2["UNAVAILABLE"] = "UNAVAILABLE";
  ApplicationStateCodes2["AVAILABLE"] = "AVAILABLE";
  ApplicationStateCodes2["ACTIVE"] = "ACTIVE";
  ApplicationStateCodes2["STOPPED"] = "STOPPED";
  ApplicationStateCodes2["RELOAD"] = "RELOAD";
  ApplicationStateCodes2["SUSPENDED"] = "SUSPENDED";
  ApplicationStateCodes2["DISABLED"] = "DISABLED";
  return ApplicationStateCodes2;
})(ApplicationStateCodes || {});
var BiometricsCharacteristics = /* @__PURE__ */ ((BiometricsCharacteristics2) => {
  BiometricsCharacteristics2["ASSOCIATE"] = "ASSOCIATE";
  BiometricsCharacteristics2["DISASSOCIATE"] = "DISASSOCIATE";
  BiometricsCharacteristics2["ENROLL"] = "ENROLL";
  BiometricsCharacteristics2["GET_ASSOCIATIONS"] = "GET_ASSOCIATIONS";
  BiometricsCharacteristics2["IDENTIFY"] = "IDENTIFY";
  BiometricsCharacteristics2["PREVIEW"] = "PREVIEW";
  BiometricsCharacteristics2["PURGE"] = "PURGE";
  BiometricsCharacteristics2["VERIFY"] = "VERIFY";
  BiometricsCharacteristics2["FACE"] = "FACE";
  BiometricsCharacteristics2["FINGER"] = "FINGER";
  BiometricsCharacteristics2["IRIS"] = "IRIS";
  BiometricsCharacteristics2["PALM"] = "PALM";
  return BiometricsCharacteristics2;
})(BiometricsCharacteristics || {});
var CussDataTypes = /* @__PURE__ */ ((CussDataTypes3) => {
  CussDataTypes3["DS_TYPES_ISO"] = "DS_TYPES_ISO";
  CussDataTypes3["DS_TYPES_VING"] = "DS_TYPES_VING";
  CussDataTypes3["DS_TYPES_TESSA"] = "DS_TYPES_TESSA";
  CussDataTypes3["DS_TYPES_SAFLOK"] = "DS_TYPES_SAFLOK";
  CussDataTypes3["DS_TYPES_TIMELOX"] = "DS_TYPES_TIMELOX";
  CussDataTypes3["DS_TYPES_KABA_ILCO"] = "DS_TYPES_KABA_ILCO";
  CussDataTypes3["DS_TYPES_KABA_ILCO_FOLIO"] = "DS_TYPES_KABA_ILCO_FOLIO";
  CussDataTypes3["DS_TYPES_IMAGE_IR"] = "DS_TYPES_IMAGE_IR";
  CussDataTypes3["DS_TYPES_IMAGE_VIS"] = "DS_TYPES_IMAGE_VIS";
  CussDataTypes3["DS_TYPES_IMAGE_UV"] = "DS_TYPES_IMAGE_UV";
  CussDataTypes3["DS_TYPES_IMAGE_PHOTO"] = "DS_TYPES_IMAGE_PHOTO";
  CussDataTypes3["DS_TYPES_IMAGE_COAX"] = "DS_TYPES_IMAGE_COAX";
  CussDataTypes3["DS_TYPES_IMAGE_RED"] = "DS_TYPES_IMAGE_RED";
  CussDataTypes3["DS_TYPES_IMAGE_GREEN"] = "DS_TYPES_IMAGE_GREEN";
  CussDataTypes3["DS_TYPES_IMAGE_BLUE"] = "DS_TYPES_IMAGE_BLUE";
  CussDataTypes3["DS_TYPES_IMAGE_GS"] = "DS_TYPES_IMAGE_GS";
  CussDataTypes3["DS_TYPES_IMAGE_BW"] = "DS_TYPES_IMAGE_BW";
  CussDataTypes3["DS_TYPES_IMAGE_BMP"] = "DS_TYPES_IMAGE_BMP";
  CussDataTypes3["DS_TYPES_IMAGE_GIF"] = "DS_TYPES_IMAGE_GIF";
  CussDataTypes3["DS_TYPES_IMAGE_TIF"] = "DS_TYPES_IMAGE_TIF";
  CussDataTypes3["DS_TYPES_IMAGE_PNG"] = "DS_TYPES_IMAGE_PNG";
  CussDataTypes3["DS_TYPES_IMAGE_JPG"] = "DS_TYPES_IMAGE_JPG";
  CussDataTypes3["DS_TYPES_IMAGE_XBM"] = "DS_TYPES_IMAGE_XBM";
  CussDataTypes3["DS_TYPES_IMAGE_XPM"] = "DS_TYPES_IMAGE_XPM";
  CussDataTypes3["DS_TYPES_IMAGE_PPM"] = "DS_TYPES_IMAGE_PPM";
  CussDataTypes3["DS_TYPES_VIDEO_AVI"] = "DS_TYPES_VIDEO_AVI";
  CussDataTypes3["DS_TYPES_VIDEO_MP4"] = "DS_TYPES_VIDEO_MP4";
  CussDataTypes3["DS_TYPES_VIDEO_MOV"] = "DS_TYPES_VIDEO_MOV";
  CussDataTypes3["DS_TYPES_VIDEO_MKV"] = "DS_TYPES_VIDEO_MKV";
  CussDataTypes3["DS_TYPES_VIDEO_WMV"] = "DS_TYPES_VIDEO_WMV";
  CussDataTypes3["DS_TYPES_CODELINE"] = "DS_TYPES_CODELINE";
  CussDataTypes3["DS_TYPES_BARCODE"] = "DS_TYPES_BARCODE";
  CussDataTypes3["DS_TYPES_MIWA"] = "DS_TYPES_MIWA";
  CussDataTypes3["DS_TYPES_SCAN_PDF417"] = "DS_TYPES_SCAN_PDF417";
  CussDataTypes3["DS_TYPES_SCAN_AZTEC"] = "DS_TYPES_SCAN_AZTEC";
  CussDataTypes3["DS_TYPES_SCAN_DMATRIX"] = "DS_TYPES_SCAN_DMATRIX";
  CussDataTypes3["DS_TYPES_SCAN_QR"] = "DS_TYPES_SCAN_QR";
  CussDataTypes3["DS_TYPES_SCAN_CODE39"] = "DS_TYPES_SCAN_CODE39";
  CussDataTypes3["DS_TYPES_SCAN_CODE128"] = "DS_TYPES_SCAN_CODE128";
  CussDataTypes3["DS_TYPES_SCAN_CODE2OF5"] = "DS_TYPES_SCAN_CODE2OF5";
  CussDataTypes3["DS_TYPES_ISO7816"] = "DS_TYPES_ISO7816";
  CussDataTypes3["DS_TYPES_PRINT_2S_PAGE"] = "DS_TYPES_PRINT_2S_PAGE";
  CussDataTypes3["DS_TYPES_PRINT_2S_MULTI"] = "DS_TYPES_PRINT_2S_MULTI";
  CussDataTypes3["DS_TYPES_PRINT_PDF"] = "DS_TYPES_PRINT_PDF";
  CussDataTypes3["DS_TYPES_MIFARE"] = "DS_TYPES_MIFARE";
  CussDataTypes3["DS_TYPES_SUICA"] = "DS_TYPES_SUICA";
  CussDataTypes3["DS_TYPES_ISO15961"] = "DS_TYPES_ISO15961";
  CussDataTypes3["DS_TYPES_RP1745"] = "DS_TYPES_RP1745";
  CussDataTypes3["DS_TYPES_WEIGHT"] = "DS_TYPES_WEIGHT";
  CussDataTypes3["DS_TYPES_DIMENSION"] = "DS_TYPES_DIMENSION";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG1"] = "DS_TYPES_EPASSPORT_DG1";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG2"] = "DS_TYPES_EPASSPORT_DG2";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG3"] = "DS_TYPES_EPASSPORT_DG3";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG4"] = "DS_TYPES_EPASSPORT_DG4";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG5"] = "DS_TYPES_EPASSPORT_DG5";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG6"] = "DS_TYPES_EPASSPORT_DG6";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG7"] = "DS_TYPES_EPASSPORT_DG7";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG8"] = "DS_TYPES_EPASSPORT_DG8";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG9"] = "DS_TYPES_EPASSPORT_DG9";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG10"] = "DS_TYPES_EPASSPORT_DG10";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG11"] = "DS_TYPES_EPASSPORT_DG11";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG12"] = "DS_TYPES_EPASSPORT_DG12";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG13"] = "DS_TYPES_EPASSPORT_DG13";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG14"] = "DS_TYPES_EPASSPORT_DG14";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG15"] = "DS_TYPES_EPASSPORT_DG15";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG16"] = "DS_TYPES_EPASSPORT_DG16";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG17"] = "DS_TYPES_EPASSPORT_DG17";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG18"] = "DS_TYPES_EPASSPORT_DG18";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG19"] = "DS_TYPES_EPASSPORT_DG19";
  CussDataTypes3["DS_TYPES_EPASSPORT_DG20"] = "DS_TYPES_EPASSPORT_DG20";
  CussDataTypes3["DS_TYPES_EPAYMENT"] = "DS_TYPES_EPAYMENT";
  CussDataTypes3["DS_TYPES_ILLUMINATION"] = "DS_TYPES_ILLUMINATION";
  CussDataTypes3["DS_TYPES_SSML"] = "DS_TYPES_SSML";
  CussDataTypes3["DS_TYPES_KEY"] = "DS_TYPES_KEY";
  CussDataTypes3["DS_TYPES_KEY_UP"] = "DS_TYPES_KEY_UP";
  CussDataTypes3["DS_TYPES_KEY_DOWN"] = "DS_TYPES_KEY_DOWN";
  CussDataTypes3["DS_TYPES_BIOMETRIC"] = "DS_TYPES_BIOMETRIC";
  CussDataTypes3["DS_TYPES_PRINT_SVG"] = "DS_TYPES_PRINT_SVG";
  CussDataTypes3["DS_TYPES_ITPS"] = "DS_TYPES_ITPS";
  return CussDataTypes3;
})(CussDataTypes || {});
var ComponentState = /* @__PURE__ */ ((ComponentState2) => {
  ComponentState2["READY"] = "READY";
  ComponentState2["BUSY"] = "BUSY";
  ComponentState2["UNAVAILABLE"] = "UNAVAILABLE";
  return ComponentState2;
})(ComponentState || {});
var ComponentTypes = /* @__PURE__ */ ((ComponentTypes2) => {
  ComponentTypes2["CAPTURE"] = "CAPTURE";
  ComponentTypes2["DISPENSER"] = "DISPENSER";
  ComponentTypes2["FEEDER"] = "FEEDER";
  ComponentTypes2["DATA_INPUT"] = "DATA_INPUT";
  ComponentTypes2["DATA_OUTPUT"] = "DATA_OUTPUT";
  ComponentTypes2["USER_INPUT"] = "USER_INPUT";
  ComponentTypes2["USER_OUTPUT"] = "USER_OUTPUT";
  ComponentTypes2["MEDIA_INPUT"] = "MEDIA_INPUT";
  ComponentTypes2["MEDIA_OUTPUT"] = "MEDIA_OUTPUT";
  ComponentTypes2["STORAGE"] = "STORAGE";
  ComponentTypes2["DISPLAY"] = "DISPLAY";
  ComponentTypes2["NETWORK"] = "NETWORK";
  ComponentTypes2["BAGGAGE_SCALE"] = "BAGGAGE_SCALE";
  ComponentTypes2["INSERTION_BELT"] = "INSERTION_BELT";
  ComponentTypes2["VERIFICATION_BELT"] = "VERIFICATION_BELT";
  ComponentTypes2["PARKING_BELT"] = "PARKING_BELT";
  ComponentTypes2["ANNOUNCEMENT"] = "ANNOUNCEMENT";
  ComponentTypes2["APPLICATION"] = "APPLICATION";
  return ComponentTypes2;
})(ComponentTypes || {});
var DataStatus = /* @__PURE__ */ ((DataStatus2) => {
  DataStatus2["DS_OK"] = "DS_OK";
  DataStatus2["DS_CORRUPTED"] = "DS_CORRUPTED";
  DataStatus2["DS_INCOMPLETE"] = "DS_INCOMPLETE";
  DataStatus2["DS_ZEROLENGTH"] = "DS_ZEROLENGTH";
  DataStatus2["DS_DOCUMENT_AUTHENTICATION_FAILED"] = "DS_DOCUMENT_AUTHENTICATION_FAILED";
  DataStatus2["DS_INVALID"] = "DS_INVALID";
  DataStatus2["DS_MISMATCH"] = "DS_MISMATCH";
  return DataStatus2;
})(DataStatus || {});
var DeviceTypes = /* @__PURE__ */ ((DeviceTypes2) => {
  DeviceTypes2["NON_APPLICABLE_DEVICE_TYPE"] = "NON_APPLICABLE_DEVICE_TYPE";
  DeviceTypes2["PRINT"] = "PRINT";
  DeviceTypes2["READ"] = "READ";
  DeviceTypes2["MOTORIZED"] = "MOTORIZED";
  DeviceTypes2["DIP"] = "DIP";
  DeviceTypes2["SWIPE"] = "SWIPE";
  DeviceTypes2["CONTACTLESS"] = "CONTACTLESS";
  DeviceTypes2["HANDHELD"] = "HANDHELD";
  DeviceTypes2["INSERT"] = "INSERT";
  DeviceTypes2["DISPENSE"] = "DISPENSE";
  DeviceTypes2["CAPTURE"] = "CAPTURE";
  DeviceTypes2["CONVEYOR"] = "CONVEYOR";
  DeviceTypes2["SCALE"] = "SCALE";
  DeviceTypes2["CAMERA"] = "CAMERA";
  DeviceTypes2["FLATBED"] = "FLATBED";
  DeviceTypes2["CHIP_AND_PIN"] = "CHIP_AND_PIN";
  DeviceTypes2["EXTERNAL"] = "EXTERNAL";
  DeviceTypes2["BIOMETRICS"] = "BIOMETRICS";
  DeviceTypes2["ASSISTIVE"] = "ASSISTIVE";
  DeviceTypes2["ILLUMINATION"] = "ILLUMINATION";
  DeviceTypes2["DISPLAY"] = "DISPLAY";
  return DeviceTypes2;
})(DeviceTypes || {});
var EventCategories = /* @__PURE__ */ ((EventCategories2) => {
  EventCategories2["ALARM"] = "ALARM";
  EventCategories2["WARNING"] = "WARNING";
  EventCategories2["NORMAL"] = "NORMAL";
  return EventCategories2;
})(EventCategories || {});
var EventModes = /* @__PURE__ */ ((EventModes2) => {
  EventModes2["SOLICITED"] = "SOLICITED";
  EventModes2["UNSOLICITED"] = "UNSOLICITED";
  return EventModes2;
})(EventModes || {});
var EventTypes = /* @__PURE__ */ ((EventTypes2) => {
  EventTypes2["PRIVATE"] = "PRIVATE";
  EventTypes2["PUBLIC"] = "PUBLIC";
  EventTypes2["PLATFORM"] = "PLATFORM";
  return EventTypes2;
})(EventTypes || {});
var MediaTypes = /* @__PURE__ */ ((MediaTypes3) => {
  MediaTypes3["CARD"] = "CARD";
  MediaTypes3["CHIP"] = "CHIP";
  MediaTypes3["BARCODE"] = "BARCODE";
  MediaTypes3["TICKET"] = "TICKET";
  MediaTypes3["RECEIPT"] = "RECEIPT";
  MediaTypes3["BOARDINGPASS"] = "BOARDINGPASS";
  MediaTypes3["BAGGAGETAG"] = "BAGGAGETAG";
  MediaTypes3["HEAVYTAG"] = "HEAVYTAG";
  MediaTypes3["RFID_BAGGAGETAG"] = "RFID_BAGGAGETAG";
  MediaTypes3["BAGGAGE"] = "BAGGAGE";
  MediaTypes3["PASSPORT"] = "PASSPORT";
  MediaTypes3["IDCARD"] = "IDCARD";
  MediaTypes3["VISA"] = "VISA";
  MediaTypes3["DRIVERLICENSE"] = "DRIVERLICENSE";
  MediaTypes3["RFID"] = "RFID";
  MediaTypes3["NFC"] = "NFC";
  MediaTypes3["OCR"] = "OCR";
  MediaTypes3["IMAGE"] = "IMAGE";
  MediaTypes3["PRINTED"] = "PRINTED";
  MediaTypes3["AUDIO"] = "AUDIO";
  MediaTypes3["VISUAL"] = "VISUAL";
  MediaTypes3["TOUCH"] = "TOUCH";
  MediaTypes3["DATASTRUCTURE"] = "DATASTRUCTURE";
  return MediaTypes3;
})(MediaTypes || {});
var MessageCodes = /* @__PURE__ */ ((MessageCodes2) => {
  MessageCodes2["OK"] = "OK";
  MessageCodes2["CANCELLED"] = "CANCELLED";
  MessageCodes2["WRONG_SYSTEM_STATE"] = "WRONG_SYSTEM_STATE";
  MessageCodes2["WRONG_APPLICATION_STATE"] = "WRONG_APPLICATION_STATE";
  MessageCodes2["OUT_OF_SEQUENCE"] = "OUT_OF_SEQUENCE";
  MessageCodes2["TIMEOUT"] = "TIMEOUT";
  MessageCodes2["FORMAT_ERROR"] = "FORMAT_ERROR";
  MessageCodes2["LENGTH_ERROR"] = "LENGTH_ERROR";
  MessageCodes2["THRESHOLD_ERROR"] = "THRESHOLD_ERROR";
  MessageCodes2["THRESHOLD_USAGE"] = "THRESHOLD_USAGE";
  MessageCodes2["DATA_MISSING"] = "DATA_MISSING";
  MessageCodes2["DATA_PRESENT"] = "DATA_PRESENT";
  MessageCodes2["SOFTWARE_ERROR"] = "SOFTWARE_ERROR";
  MessageCodes2["CRITICAL_SOFTWARE_ERROR"] = "CRITICAL_SOFTWARE_ERROR";
  MessageCodes2["HARDWARE_ERROR"] = "HARDWARE_ERROR";
  MessageCodes2["NOT_REACHABLE"] = "NOT_REACHABLE";
  MessageCodes2["NOT_RESPONDING"] = "NOT_RESPONDING";
  MessageCodes2["SESSION_TIMEOUT"] = "SESSION_TIMEOUT";
  MessageCodes2["KILL_TIMEOUT"] = "KILL_TIMEOUT";
  MessageCodes2["TRANSFER_REQUEST"] = "TRANSFER_REQUEST";
  MessageCodes2["SYSTEM_REQUEST"] = "SYSTEM_REQUEST";
  MessageCodes2["SYSTEM_SHUTDOWN"] = "SYSTEM_SHUTDOWN";
  MessageCodes2["DEVICE_REQUEST"] = "DEVICE_REQUEST";
  MessageCodes2["MEDIA_JAMMED"] = "MEDIA_JAMMED";
  MessageCodes2["MEDIA_MISPLACED"] = "MEDIA_MISPLACED";
  MessageCodes2["MEDIA_PRESENT"] = "MEDIA_PRESENT";
  MessageCodes2["MEDIA_ABSENT"] = "MEDIA_ABSENT";
  MessageCodes2["MEDIA_EMPTY"] = "MEDIA_EMPTY";
  MessageCodes2["MEDIA_DAMAGED"] = "MEDIA_DAMAGED";
  MessageCodes2["MEDIA_INCOMPLETELY_INSERTED"] = "MEDIA_INCOMPLETELY_INSERTED";
  MessageCodes2["MEDIA_HIGH"] = "MEDIA_HIGH";
  MessageCodes2["MEDIA_FULL"] = "MEDIA_FULL";
  MessageCodes2["MEDIA_LOW"] = "MEDIA_LOW";
  MessageCodes2["BAGGAGE_FULL"] = "BAGGAGE_FULL";
  MessageCodes2["BAGGAGE_UNDETECTED"] = "BAGGAGE_UNDETECTED";
  MessageCodes2["BAGGAGE_PRESENT"] = "BAGGAGE_PRESENT";
  MessageCodes2["BAGGAGE_ABSENT"] = "BAGGAGE_ABSENT";
  MessageCodes2["BAGGAGE_OVERSIZED"] = "BAGGAGE_OVERSIZED";
  MessageCodes2["BAGGAGE_TOO_MANY_BAGS"] = "BAGGAGE_TOO_MANY_BAGS";
  MessageCodes2["BAGGAGE_UNEXPECTED_BAG"] = "BAGGAGE_UNEXPECTED_BAG";
  MessageCodes2["BAGGAGE_TOO_HIGH"] = "BAGGAGE_TOO_HIGH";
  MessageCodes2["BAGGAGE_TOO_LONG"] = "BAGGAGE_TOO_LONG";
  MessageCodes2["BAGGAGE_TOO_FLAT"] = "BAGGAGE_TOO_FLAT";
  MessageCodes2["BAGGAGE_TOO_SHORT"] = "BAGGAGE_TOO_SHORT";
  MessageCodes2["BAGGAGE_TOO_WIDE"] = "BAGGAGE_TOO_WIDE";
  MessageCodes2["BAGGAGE_TOO_SMALL"] = "BAGGAGE_TOO_SMALL";
  MessageCodes2["BAGGAGE_INVALID_DATA"] = "BAGGAGE_INVALID_DATA";
  MessageCodes2["BAGGAGE_WEIGHT_OUT_OF_RANGE"] = "BAGGAGE_WEIGHT_OUT_OF_RANGE";
  MessageCodes2["BAGGAGE_JAMMED"] = "BAGGAGE_JAMMED";
  MessageCodes2["BAGGAGE_WRONG_INSERTED"] = "BAGGAGE_WRONG_INSERTED";
  MessageCodes2["BAGGAGE_EMERGENCY_STOP"] = "BAGGAGE_EMERGENCY_STOP";
  MessageCodes2["BAGGAGE_RESTLESS"] = "BAGGAGE_RESTLESS";
  MessageCodes2["BAGGAGE_TRANSPORT_BUSY"] = "BAGGAGE_TRANSPORT_BUSY";
  MessageCodes2["BAGGAGE_MISTRACKED"] = "BAGGAGE_MISTRACKED";
  MessageCodes2["BAGGAGE_FORWARD_FAILED"] = "BAGGAGE_FORWARD_FAILED";
  MessageCodes2["BAGGAGE_BACKWARD_FAILED"] = "BAGGAGE_BACKWARD_FAILED";
  MessageCodes2["BAGGAGE_UNEXPECTED_CHANGE"] = "BAGGAGE_UNEXPECTED_CHANGE";
  MessageCodes2["BAGGAGE_ACCEPTED"] = "BAGGAGE_ACCEPTED";
  MessageCodes2["BAGGAGE_DELIVERED"] = "BAGGAGE_DELIVERED";
  MessageCodes2["BAGGAGE_INTERFERENCE_USER"] = "BAGGAGE_INTERFERENCE_USER";
  MessageCodes2["BAGGAGE_INTRUSION_SAFETY"] = "BAGGAGE_INTRUSION_SAFETY";
  MessageCodes2["BAGGAGE_NOT_CONVEYABLE"] = "BAGGAGE_NOT_CONVEYABLE";
  MessageCodes2["BAGGAGE_IRREGULAR_BAG"] = "BAGGAGE_IRREGULAR_BAG";
  MessageCodes2["BAGGAGE_BAG_WITH_STRAPS"] = "BAGGAGE_BAG_WITH_STRAPS";
  MessageCodes2["BAGGAGE_UPRIGHT_BAG"] = "BAGGAGE_UPRIGHT_BAG";
  MessageCodes2["BAGGAGE_HANDLE_EXTENDED"] = "BAGGAGE_HANDLE_EXTENDED";
  MessageCodes2["BAGGAGE_MULTIPLE_BAGS"] = "BAGGAGE_MULTIPLE_BAGS";
  MessageCodes2["BAGGAGE_SLOPED_BAG"] = "BAGGAGE_SLOPED_BAG";
  MessageCodes2["BAGGAGE_VOLUME_NOT_DETERMINABLE"] = "BAGGAGE_VOLUME_NOT_DETERMINABLE";
  MessageCodes2["BAGGAGE_TUB_REQUIRED"] = "BAGGAGE_TUB_REQUIRED";
  MessageCodes2["BAGGAGE_OVERFLOW_TUB"] = "BAGGAGE_OVERFLOW_TUB";
  MessageCodes2["BAGGAGE_XRAY_SUSPICIOUS"] = "BAGGAGE_XRAY_SUSPICIOUS";
  MessageCodes2["BAGGAGE_MAINTENANCE_MODE"] = "BAGGAGE_MAINTENANCE_MODE";
  MessageCodes2["BAGGAGE_FORCEBAG_MODE"] = "BAGGAGE_FORCEBAG_MODE";
  MessageCodes2["BAGGAGE_MANUAL_MODE"] = "BAGGAGE_MANUAL_MODE";
  MessageCodes2["BAGGAGE_OFFBHS_MODE"] = "BAGGAGE_OFFBHS_MODE";
  MessageCodes2["BAGGAGE_SUSPENDED_MODE"] = "BAGGAGE_SUSPENDED_MODE";
  MessageCodes2["BAGGAGE_OPERATIONAL_STOP"] = "BAGGAGE_OPERATIONAL_STOP";
  return MessageCodes2;
})(MessageCodes || {});
var NavigationTypes = /* @__PURE__ */ ((NavigationTypes2) => {
  NavigationTypes2["NON_APPLICABLE_NAVIGATION_TYPE"] = "NON_APPLICABLE_NAVIGATION_TYPE";
  NavigationTypes2["NAVPAD_5_KEY"] = "NAVPAD_5_KEY";
  NavigationTypes2["NAVPAD_8_KEY"] = "NAVPAD_8_KEY";
  NavigationTypes2["AUDIONAV_6_KEY"] = "AUDIONAV_6_KEY";
  NavigationTypes2["AUDIONAV_6_KEY_BAR"] = "AUDIONAV_6_KEY_BAR";
  return NavigationTypes2;
})(NavigationTypes || {});
var PaymentsCharacteristics = /* @__PURE__ */ ((PaymentsCharacteristics2) => {
  PaymentsCharacteristics2["DEBIT"] = "DEBIT";
  PaymentsCharacteristics2["CREDIT"] = "CREDIT";
  PaymentsCharacteristics2["NFC"] = "NFC";
  PaymentsCharacteristics2["AMEX"] = "AMEX";
  PaymentsCharacteristics2["CART_BLANCHE"] = "CART_BLANCHE";
  PaymentsCharacteristics2["DISCOVER"] = "DISCOVER";
  PaymentsCharacteristics2["JCB"] = "JCB";
  PaymentsCharacteristics2["MAESTRO"] = "MAESTRO";
  PaymentsCharacteristics2["MASTERCARD"] = "MASTERCARD";
  PaymentsCharacteristics2["SWITCH"] = "SWITCH";
  PaymentsCharacteristics2["VISA"] = "VISA";
  return PaymentsCharacteristics2;
})(PaymentsCharacteristics || {});
var PlatformDirectives = /* @__PURE__ */ ((PlatformDirectives2) => {
  PlatformDirectives2["PLATFORM_ENVIRONMENT"] = "platform_environment";
  PlatformDirectives2["PLATFORM_COMPONENTS"] = "platform_components";
  PlatformDirectives2["PLATFORM_APPLICATIONS_STATEREQUEST"] = "platform_applications_staterequest";
  PlatformDirectives2["PLATFORM_APPLICATIONS_TRANSFERREQUEST"] = "platform_applications_transferrequest";
  PlatformDirectives2["PLATFORM_APPLICATIONS_ACKNOWLEDGE_ACCESSIBLE"] = "platform_applications_acknowledge_accessible";
  PlatformDirectives2["PERIPHERALS_ANNOUNCEMENT_PLAY"] = "peripherals_announcement_play";
  PlatformDirectives2["PERIPHERALS_ANNOUNCEMENT_PAUSE"] = "peripherals_announcement_pause";
  PlatformDirectives2["PERIPHERALS_ANNOUNCEMENT_RESUME"] = "peripherals_announcement_resume";
  PlatformDirectives2["PERIPHERALS_ANNOUNCEMENT_STOP"] = "peripherals_announcement_stop";
  PlatformDirectives2["PERIPHERALS_CANCEL"] = "peripherals_cancel";
  PlatformDirectives2["PERIPHERALS_QUERY"] = "peripherals_query";
  PlatformDirectives2["PERIPHERALS_SEND"] = "peripherals_send";
  PlatformDirectives2["PERIPHERALS_SETUP"] = "peripherals_setup";
  PlatformDirectives2["PERIPHERALS_USERPRESENT_ENABLE"] = "peripherals_userpresent_enable";
  PlatformDirectives2["PERIPHERALS_USERPRESENT_DISABLE"] = "peripherals_userpresent_disable";
  PlatformDirectives2["PERIPHERALS_USERPRESENT_OFFER"] = "peripherals_userpresent_offer";
  PlatformDirectives2["PERIPHERALS_CONVEYORS_FORWARD"] = "peripherals_conveyors_forward";
  PlatformDirectives2["PERIPHERALS_CONVEYORS_BACKWARD"] = "peripherals_conveyors_backward";
  PlatformDirectives2["PERIPHERALS_CONVEYORS_PROCESS"] = "peripherals_conveyors_process";
  return PlatformDirectives2;
})(PlatformDirectives || {});
var SupportedColors = /* @__PURE__ */ ((SupportedColors2) => {
  SupportedColors2["CLR_RGB"] = "CLR_RGB";
  SupportedColors2["CLR_ON"] = "CLR_ON";
  SupportedColors2["CLR_OFF"] = "CLR_OFF";
  SupportedColors2["CLR_RED"] = "CLR_RED";
  SupportedColors2["CLR_GREEN"] = "CLR_GREEN";
  SupportedColors2["CLR_BLUE"] = "CLR_BLUE";
  SupportedColors2["CLR_DARKRED"] = "CLR_DARKRED";
  SupportedColors2["CLR_DARKGREEN"] = "CLR_DARKGREEN";
  SupportedColors2["CLR_DARKBLUE"] = "CLR_DARKBLUE";
  SupportedColors2["CLR_YELLOW"] = "CLR_YELLOW";
  SupportedColors2["CLR_MAGENTA"] = "CLR_MAGENTA";
  SupportedColors2["CLR_CYAN"] = "CLR_CYAN";
  SupportedColors2["CLR_AMBER"] = "CLR_AMBER";
  SupportedColors2["CLR_PURPLE"] = "CLR_PURPLE";
  SupportedColors2["CLR_SPRINGGREEN"] = "CLR_SPRINGGREEN";
  SupportedColors2["CLR_WHITE"] = "CLR_WHITE";
  return SupportedColors2;
})(SupportedColors || {});

// src/helper.ts
var import_events = __toESM(require_events());
var LogMessage = class {
  action;
  data;
  level;
  constructor(level, action, data) {
    this.action = action;
    this.level = level;
    this.data = data;
  }
};
var logger = new import_events.EventEmitter();
var log = (level, action, data) => {
  logger.emit("log", new LogMessage(level, action, data));
};
var helpers = {
  splitAndFilter: (text, delimiter1 = "#") => {
    return text.split(delimiter1).filter((p) => !!p);
  },
  split_every: (text, n) => {
    if (!text)
      return [];
    return text.match(new RegExp(".{1," + n + "}", "g"));
  },
  deserializeDictionary: (text, delimiter1 = "#", delimiter2 = "=") => {
    const out = {};
    helpers.splitAndFilter(text, delimiter1).forEach((p) => {
      const [k, v] = p.split(delimiter2);
      if (v && k)
        out[k] = v;
    });
    return out;
  },
  isNonCritical: (messageCode) => {
    return !criticalErrors.some((s) => s === messageCode);
  }
};
var criticalErrors = [
  "CANCELLED" /* CANCELLED */,
  "WRONG_APPLICATION_STATE" /* WRONG_APPLICATION_STATE */,
  "OUT_OF_SEQUENCE" /* OUT_OF_SEQUENCE */,
  "TIMEOUT" /* TIMEOUT */,
  "SESSION_TIMEOUT" /* SESSION_TIMEOUT */,
  "KILL_TIMEOUT" /* KILL_TIMEOUT */,
  "SOFTWARE_ERROR" /* SOFTWARE_ERROR */,
  "CRITICAL_SOFTWARE_ERROR" /* CRITICAL_SOFTWARE_ERROR */,
  "FORMAT_ERROR" /* FORMAT_ERROR */,
  "LENGTH_ERROR" /* LENGTH_ERROR */,
  "DATA_MISSING" /* DATA_MISSING */,
  "THRESHOLD_ERROR" /* THRESHOLD_ERROR */,
  "THRESHOLD_USAGE" /* THRESHOLD_USAGE */,
  "HARDWARE_ERROR" /* HARDWARE_ERROR */,
  "NOT_REACHABLE" /* NOT_REACHABLE */,
  "NOT_RESPONDING" /* NOT_RESPONDING */,
  "BAGGAGE_FULL" /* BAGGAGE_FULL */,
  "BAGGAGE_UNDETECTED" /* BAGGAGE_UNDETECTED */,
  "BAGGAGE_OVERSIZED" /* BAGGAGE_OVERSIZED */,
  "BAGGAGE_TOO_MANY_BAGS" /* BAGGAGE_TOO_MANY_BAGS */,
  "BAGGAGE_UNEXPECTED_BAG" /* BAGGAGE_UNEXPECTED_BAG */,
  "BAGGAGE_TOO_HIGH" /* BAGGAGE_TOO_HIGH */,
  "BAGGAGE_TOO_LONG" /* BAGGAGE_TOO_LONG */,
  "BAGGAGE_TOO_FLAT" /* BAGGAGE_TOO_FLAT */,
  "BAGGAGE_TOO_SHORT" /* BAGGAGE_TOO_SHORT */,
  "BAGGAGE_INVALID_DATA" /* BAGGAGE_INVALID_DATA */,
  "BAGGAGE_WEIGHT_OUT_OF_RANGE" /* BAGGAGE_WEIGHT_OUT_OF_RANGE */,
  "BAGGAGE_JAMMED" /* BAGGAGE_JAMMED */,
  "BAGGAGE_EMERGENCY_STOP" /* BAGGAGE_EMERGENCY_STOP */,
  "BAGGAGE_RESTLESS" /* BAGGAGE_RESTLESS */,
  "BAGGAGE_TRANSPORT_BUSY" /* BAGGAGE_TRANSPORT_BUSY */,
  "BAGGAGE_MISTRACKED" /* BAGGAGE_MISTRACKED */,
  "BAGGAGE_UNEXPECTED_CHANGE" /* BAGGAGE_UNEXPECTED_CHANGE */,
  "BAGGAGE_INTERFERENCE_USER" /* BAGGAGE_INTERFERENCE_USER */,
  "BAGGAGE_INTRUSION_SAFETY" /* BAGGAGE_INTRUSION_SAFETY */,
  "BAGGAGE_NOT_CONVEYABLE" /* BAGGAGE_NOT_CONVEYABLE */,
  "BAGGAGE_IRREGULAR_BAG" /* BAGGAGE_IRREGULAR_BAG */,
  "BAGGAGE_VOLUME_NOT_DETERMINABLE" /* BAGGAGE_VOLUME_NOT_DETERMINABLE */,
  "BAGGAGE_OVERFLOW_TUB" /* BAGGAGE_OVERFLOW_TUB */
];
var isDataRecord = (dataRecordObject) => {
  return Array.isArray(dataRecordObject) && dataRecordObject.length > 0 && "data" in dataRecordObject[0];
};
var Build = {
  applicationData: (directive, options = {}) => {
    const {
      componentID,
      deviceID = "00000000-0000-0000-0000-000000000000",
      dataObj
    } = options;
    const meta = {};
    meta.requestID = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    meta.directive = directive;
    if (componentID !== void 0) {
      meta.componentID = componentID;
    }
    meta.deviceID = deviceID;
    const payload = {};
    if (dataObj && "applicationStateCode" in dataObj) {
      payload.applicationState = dataObj;
    }
    if (dataObj && "targetApplicationID" in dataObj) {
      payload.applicationTransfer = dataObj;
    }
    if (isDataRecord(dataObj)) {
      payload.dataRecords = dataObj;
    }
    if (dataObj && "vertical" in dataObj) {
      payload.screenResolution = dataObj;
    }
    if (dataObj && "lightColor" in dataObj) {
      payload.illuminationData = dataObj;
    }
    if (dataObj && "baggageMeasurements" in dataObj) {
      payload.bagdropData = dataObj;
    }
    if (dataObj && "ePaymentMessage" in dataObj) {
      payload.paymentData = dataObj;
    }
    if (dataObj && "biometricProviderMessage" in dataObj) {
      payload.biometricData = dataObj;
    }
    return { meta, payload };
  },
  stateChange: (desiredState, reasonCode, reason, brand = void 0) => {
    return Build.applicationData(
      "platform_applications_staterequest" /* PLATFORM_APPLICATIONS_STATEREQUEST */,
      {
        dataObj: {
          applicationStateCode: desiredState,
          applicationStateChangeReasonCode: reasonCode,
          applicationStateChangeReason: reason,
          applicationBrand: brand
        }
      }
    );
  }
};

// src/models/EventEmitter.ts
var import_events2 = __toESM(require_events());
var EventEmitter2 = class _EventEmitter extends import_events2.EventEmitter {
  waitFor(event, errorEvents = ["error"]) {
    return new Promise((resolve, reject) => {
      const eventMappings = [];
      const cleanup = () => {
        for (const mapping of eventMappings) {
          mapping.source.off(mapping.event, mapping.handler);
        }
      };
      const resolver = (e) => {
        cleanup();
        resolve(e);
      };
      const catcher = (e) => {
        cleanup();
        reject(e);
      };
      const attachEvent = (eventString, handler) => {
        const dotIndex = eventString.indexOf(".");
        if (dotIndex > 0) {
          const propertyName = eventString.substring(0, dotIndex);
          const eventName = eventString.substring(dotIndex + 1);
          const property = this[propertyName];
          if (property && property instanceof _EventEmitter) {
            property.once(eventName, handler);
            eventMappings.push({ source: property, event: eventName, handler });
            return;
          }
        }
        this.once(eventString, handler);
        eventMappings.push({ source: this, event: eventString, handler });
      };
      attachEvent(event, resolver);
      for (const errorEvent of errorEvents) {
        attachEvent(errorEvent, catcher);
      }
    });
  }
};

// src/models/Component.ts
var import_events3 = __toESM(require_events());

// src/models/deviceType.ts
var DeviceType = {
  UNKNOWN: "UNKNOWN",
  BAG_TAG_PRINTER: "BAG_TAG_PRINTER",
  BAG_TAG_FEEDER: "BAG_TAG_FEEDER",
  BAG_TAG_DISPENSER: "BAG_TAG_DISPENSER",
  BOARDING_PASS_PRINTER: "BOARDING_PASS_PRINTER",
  BOARDING_PASS_FEEDER: "BOARDING_PASS_FEEDER",
  BOARDING_PASS_DISPENSER: "BOARDING_PASS_DISPENSER",
  BARCODE_READER: "BARCODE_READER",
  PASSPORT_READER: "PASSPORT_READER",
  MSR_READER: "MSR_READER",
  KEY_PAD: "KEY_PAD",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  FEEDER: "FEEDER",
  DISPENSER: "DISPENSER",
  ILLUMINATION: "ILLUMINATION",
  HEADSET: "HEADSET",
  BIOMETRIC: "BIOMETRIC",
  SCALE: "SCALE",
  CAMERA: "CAMERA",
  INSERTION_BELT: "INSERTION_BELT",
  VERIFICATION_BELT: "VERIFICATION_BELT",
  PARKING_BELT: "PARKING_BELT",
  RFID: "RFID",
  AEASBD: "AEASBD",
  BHS: "BHS"
};

// src/models/Component.ts
var Component = class extends import_events3.EventEmitter {
  _component;
  id;
  api;
  // Using definite assignment assertion
  required = false;
  _status = "OK" /* OK */;
  _componentState = "UNAVAILABLE" /* UNAVAILABLE */;
  deviceType;
  pendingCalls = 0;
  enabled = false;
  pollingInterval = 1e4;
  _poller;
  parent;
  subcomponents = [];
  get ready() {
    return this._componentState === "READY" /* READY */;
  }
  get pending() {
    return this.pendingCalls > 0;
  }
  get status() {
    return this._status;
  }
  constructor(component, cuss2, _type = DeviceType.UNKNOWN) {
    super();
    this._component = component;
    this.id = Number(component.componentID);
    this.deviceType = _type;
    this.parent = null;
    Object.defineProperty(this, "api", {
      get: () => cuss2.api,
      enumerable: false
    });
    cuss2.on("message", (data) => {
      if (data?.meta?.componentID === this.id) {
        this.handleMessage(data);
      }
    });
    cuss2.on("deactivated", () => {
      this.enabled = false;
    });
    if (component.linkedComponentIDs?.length) {
      const name = this.deviceType;
      const parentId = Math.min(
        this.id,
        ...component.linkedComponentIDs
      );
      if (parentId !== this.id) {
        this.parent = cuss2.components?.[parentId];
        if (this.parent) {
          this.parent.subcomponents.push(this);
          this.parent[name] = this;
        }
      }
    }
  }
  stateIsDifferent(msg) {
    return this.status !== msg.meta.messageCode || this._componentState !== msg.meta.componentState;
  }
  updateState(msg) {
    const { meta } = msg;
    if (meta.componentState !== this._componentState) {
      this._componentState = meta.componentState ?? "UNAVAILABLE" /* UNAVAILABLE */;
      if (meta.componentState !== "READY" /* READY */) {
        this.enabled = false;
      }
      this.emit("readyStateChange", meta.componentState === "READY" /* READY */);
    }
    if (!this.ready && this.required && !this._poller && this.pollingInterval > 0) {
      this.pollUntilReady();
    }
    if (this.status !== meta.messageCode) {
      this._status = meta.messageCode;
      this.emit("statusChange", meta.messageCode);
    }
  }
  pollUntilReady(requireOK = false, pollingInterval = this.pollingInterval) {
    if (this._poller)
      return;
    const poll = () => {
      if (this.ready && (!requireOK || this.status === "OK" /* OK */)) {
        return this._poller = void 0;
      }
      this._poller = setTimeout(() => {
        this.query().catch(Object).finally(poll);
      }, pollingInterval);
    };
    poll();
  }
  handleMessage(data) {
    this.emit("message", data);
  }
  async _call(action) {
    this.pendingCalls++;
    try {
      return await action();
    } catch (e) {
      return await Promise.reject(e);
    } finally {
      this.pendingCalls--;
    }
  }
  async enable() {
    const r = await this._call(() => this.api.enable(this.id));
    this.enabled = true;
    return r;
  }
  async disable() {
    try {
      const r = await this._call(() => this.api.disable(this.id));
      this.enabled = false;
      return r;
    } catch (e) {
      const pd = e;
      if (pd.meta.messageCode === "OUT_OF_SEQUENCE" /* OUT_OF_SEQUENCE */) {
        this.enabled = false;
        return pd;
      }
      return Promise.reject(e);
    }
  }
  async cancel() {
    return await this._call(() => this.api.cancel(this.id));
  }
  async query() {
    return await this._call(() => this.api.getStatus(this.id));
  }
  async setup(dataObj) {
    return await this._call(() => this.api.setup(this.id, dataObj));
  }
  async send(dataObj) {
    return await this._call(() => this.api.send(this.id, dataObj));
  }
};

// src/models/base/BaseComponent.ts
var import_events4 = __toESM(require_events());
var BaseComponent = class extends import_events4.EventEmitter {
  _component;
  id;
  api;
  required = false;
  _status = "OK" /* OK */;
  _componentState = "UNAVAILABLE" /* UNAVAILABLE */;
  deviceType;
  pendingCalls = 0;
  pollingInterval = 1e4;
  _poller;
  parent;
  subcomponents = [];
  get ready() {
    return this._componentState === "READY" /* READY */;
  }
  get pending() {
    return this.pendingCalls > 0;
  }
  get status() {
    return this._status;
  }
  get componentState() {
    return this._componentState;
  }
  constructor(component, cuss2, _type = DeviceType.UNKNOWN) {
    super();
    this.deviceType = _type;
    this._component = component;
    this.id = Number(component.componentID);
    this.api = cuss2.api;
    this.parent = null;
    const characteristics = component.componentCharacteristics?.[0];
    this.required = characteristics?.required || false;
    this._componentState = "UNAVAILABLE" /* UNAVAILABLE */;
    this._status = "OK" /* OK */;
    this.setupEventListeners(cuss2);
  }
  setupEventListeners(cuss2) {
    cuss2.on("message", (data) => {
      if (data?.meta?.componentID === this.id) {
        this.handleMessage(data);
        this.updateState(data);
      }
    });
    cuss2.on("deactivated", () => {
    });
  }
  handleMessage(data) {
    this.emit("message", data);
  }
  stateIsDifferent(msg) {
    return this.status !== msg.meta.messageCode || this._componentState !== msg.meta.componentState;
  }
  updateState(msg) {
    if (msg?.meta?.componentState) {
      this._componentState = msg.meta.componentState;
      this.emit("readyStateChange", this._componentState);
    }
    if (msg?.meta?.messageCode) {
      this._status = msg.meta.messageCode;
      this.emit("statusChange", this._status);
    }
  }
  /**
   * Query the current state/status of the component
   * Available to ALL component types
   */
  async query() {
    this.pendingCalls++;
    return await this.api.getStatus(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Cancel all currently executed and queued directives
   * Available to ALL components except APPLICATION
   */
  async cancel() {
    this.pendingCalls++;
    return await this.api.cancel(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Setup/configure the component
   * Available to ALL components except APPLICATION
   */
  async setup(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.setup(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
  startPolling() {
    if (!this._poller) {
      this._poller = setInterval(async () => {
        await this.query();
      }, this.pollingInterval);
    }
  }
  stopPolling() {
    if (this._poller) {
      clearInterval(this._poller);
      this._poller = void 0;
    }
  }
  pollUntilReady(requireOK = false, pollingInterval = this.pollingInterval) {
    if (this._poller)
      return;
    const poll = () => {
      if (this.ready && (!requireOK || this.status === "OK" /* OK */)) {
        this._poller = void 0;
        return;
      }
      this._poller = setTimeout(() => {
        this.query().catch(Object).finally(poll);
      }, pollingInterval);
    };
    poll();
  }
};

// src/models/base/InteractiveComponent.ts
var InteractiveComponent = class extends BaseComponent {
  enabled = false;
  /**
   * Enable the component for user interaction
   * Available to: DISPENSER, USER_INPUT, USER_OUTPUT, MEDIA_INPUT,
   *               MEDIA_OUTPUT, DISPLAY, BAGGAGE_SCALE, INSERTION_BELT, ANNOUNCEMENT
   */
  async enable() {
    this.pendingCalls++;
    const pd = await this.api.enable(this.id).finally(() => this.pendingCalls--);
    this.updateState(pd);
    this.enabled = true;
    return pd;
  }
  /**
   * Disable the component from user interaction
   * Available to: DISPENSER, USER_INPUT, USER_OUTPUT, MEDIA_INPUT,
   *               MEDIA_OUTPUT, DISPLAY, BAGGAGE_SCALE, INSERTION_BELT, ANNOUNCEMENT
   */
  async disable() {
    this.pendingCalls++;
    const pd = await this.api.disable(this.id).finally(() => this.pendingCalls--);
    this.updateState(pd);
    this.enabled = false;
    return pd;
  }
};

// src/models/base/DataInputComponent.ts
var DataInputComponent = class extends BaseComponent {
  previousData = [];
  handleMessage(data) {
    super.handleMessage(data);
    if (data?.meta?.messageCode === "DATA_PRESENT" /* DATA_PRESENT */ && data?.payload?.dataRecords?.length) {
      this.previousData = data?.payload?.dataRecords?.map((dr) => dr?.data || "");
      this.emit("data", this.previousData);
    }
  }
  /**
   * Read data with timeout (no enable/disable for data components)
   */
  read(ms = 3e4) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off("data", dataHandler);
        reject(new Error(`Timeout of ${ms}ms exceeded`));
      }, ms);
      const dataHandler = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };
      this.once("data", dataHandler);
    });
  }
};

// src/models/base/DataOutputComponent.ts
var DataOutputComponent = class extends BaseComponent {
  /**
   * Send data to the component
   * Available to: DATA_OUTPUT components
   */
  async send(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
};

// src/models/base/UserInputComponent.ts
var UserInputComponent = class extends InteractiveComponent {
  // User input components can be enabled/disabled but cannot send
  // They receive input from users
};

// src/models/base/UserOutputComponent.ts
var UserOutputComponent = class extends InteractiveComponent {
  /**
   * Send data to the component
   * Available to: USER_OUTPUT components
   */
  async send(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
};

// src/models/base/MediaInputComponent.ts
var MediaInputComponent = class extends InteractiveComponent {
  previousData = [];
  handleMessage(data) {
    super.handleMessage(data);
    if (data?.meta?.messageCode === "DATA_PRESENT" /* DATA_PRESENT */ && data?.payload?.dataRecords?.length) {
      this.previousData = data?.payload?.dataRecords?.map((dr) => dr?.data || "");
      this.emit("data", this.previousData);
    }
  }
  /**
   * Convenience method to read data with timeout
   */
  async read(ms = 3e4) {
    await this.enable();
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off("data", dataHandler);
        reject(new Error(`Timeout of ${ms}ms exceeded`));
      }, ms);
      const dataHandler = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };
      this.once("data", dataHandler);
    }).finally(() => this.disable());
  }
};

// src/models/base/MediaOutputComponent.ts
var MediaOutputComponent = class extends InteractiveComponent {
  /**
   * Send data to the component (print jobs, etc.)
   * Available to: MEDIA_OUTPUT components
   */
  async send(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
};

// src/models/base/BaggageScaleComponent.ts
var BaggageScaleComponent = class extends InteractiveComponent {
  previousData = [];
  handleMessage(data) {
    super.handleMessage(data);
    if (data?.meta?.messageCode === "DATA_PRESENT" /* DATA_PRESENT */ && data?.payload?.dataRecords?.length) {
      this.previousData = data?.payload?.dataRecords?.map((dr) => dr?.data || "");
      this.emit("data", this.previousData);
    }
  }
  /**
   * Read weight data with timeout
   */
  async read(ms = 3e4) {
    await this.enable();
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off("data", dataHandler);
        reject(new Error(`Timeout of ${ms}ms exceeded`));
      }, ms);
      const dataHandler = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };
      this.once("data", dataHandler);
    }).finally(() => this.disable());
  }
};

// src/models/base/AnnouncementComponent.ts
var AnnouncementComponent = class extends InteractiveComponent {
  /**
   * Play SSML formatted audio
   */
  async play(xml) {
    this.pendingCalls++;
    return await this.api.announcement.play(this.id, xml).finally(() => this.pendingCalls--);
  }
  /**
   * Pause current playback
   */
  async pause() {
    this.pendingCalls++;
    return await this.api.announcement.pause(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Resume paused playback
   */
  async resume() {
    this.pendingCalls++;
    return await this.api.announcement.resume(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Stop current playback
   */
  async stop() {
    this.pendingCalls++;
    return await this.api.announcement.stop(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Convenience method for text-to-speech
   */
  say(text, lang = "en-US") {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xml:lang="${lang}">${text}</speak>`;
    return this.play(xml);
  }
};

// src/models/base/ConveyorComponent.ts
var ConveyorComponent = class extends BaseComponent {
  /**
   * Send baggage data to the component
   */
  async send(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
  /**
   * Move bag to next position or airport collector belt
   */
  forward() {
    return Promise.reject(new Error("Conveyor forward operation not yet implemented"));
  }
  /**
   * Move bag back to previous position or user
   */
  backward() {
    return Promise.reject(new Error("Conveyor backward operation not yet implemented"));
  }
  /**
   * Process/examine bag for weight, dimensions, LPNs, RFID
   */
  process() {
    return Promise.reject(new Error("Conveyor process operation not yet implemented"));
  }
};

// src/models/base/InsertionBeltComponent.ts
var InsertionBeltComponent = class extends InteractiveComponent {
  /**
   * Send baggage data to the component
   */
  async send(dataObj) {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
  /**
   * Offer the bag to the next component/user
   */
  async offer() {
    this.pendingCalls++;
    return await this.api.offer(this.id).finally(() => this.pendingCalls--);
  }
  /**
   * Move bag to next position
   */
  forward() {
    return Promise.reject(new Error("Conveyor forward operation not yet implemented"));
  }
  /**
   * Move bag back to user
   */
  backward() {
    return Promise.reject(new Error("Conveyor backward operation not yet implemented"));
  }
  /**
   * Process/examine bag
   */
  process() {
    return Promise.reject(new Error("Conveyor process operation not yet implemented"));
  }
};

// src/models/base/DispenserComponent.ts
var DispenserComponent = class extends InteractiveComponent {
  _mediaPresent = false;
  get mediaPresent() {
    return this._mediaPresent;
  }
  set mediaPresent(value) {
    this._mediaPresent = value;
  }
  handleMessage(data) {
    super.handleMessage(data);
    if (data?.meta?.messageCode === "MEDIA_PRESENT" /* MEDIA_PRESENT */) {
      this._mediaPresent = true;
      this.emit("mediaPresent", true);
    } else if (data?.meta?.messageCode === "MEDIA_EMPTY" /* MEDIA_EMPTY */) {
      this._mediaPresent = false;
      this.emit("mediaPresent", false);
    }
  }
  /**
   * Offer document to user
   */
  async offer() {
    this.pendingCalls++;
    const pd = await this.api.offer(this.id).finally(() => this.pendingCalls--);
    if (pd?.meta?.messageCode === "OK" /* OK */) {
      this._mediaPresent = false;
    }
    return pd;
  }
};

// src/models/base/FeederComponent.ts
var FeederComponent = class extends BaseComponent {
  /**
   * Offer media from feeder
   */
  async offer() {
    this.pendingCalls++;
    return await this.api.offer(this.id).finally(() => this.pendingCalls--);
  }
};

// src/models/BarcodeReader.ts
var BarcodeReader = class extends MediaInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.BARCODE_READER);
  }
};

// src/models/DocumentReader.ts
var DocumentReader = class extends MediaInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.PASSPORT_READER);
  }
};

// src/models/CardReader.ts
var CardReader = class extends MediaInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.MSR_READER);
  }
  async enablePayment(yes) {
    await this.setup([{
      data: "",
      dsTypes: [
        yes ? "DS_TYPES_PAYMENT_ISO" : "DS_TYPES_ISO" /* DS_TYPES_ISO */
      ]
    }]);
  }
  async readPayment(ms = 3e4) {
    await this.enablePayment(true);
    await this.read(ms);
    await this.enablePayment(false);
  }
};

// src/models/Scale.ts
var Scale = class extends BaggageScaleComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.SCALE);
  }
};

// src/models/RFID.ts
var RFID = class extends MediaInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.RFID);
  }
};

// src/models/Camera.ts
var Camera = class extends MediaInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.CAMERA);
  }
};

// src/models/AEASBD.ts
var AEASBD = class extends MediaOutputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.AEASBD);
  }
  // AEA Self Bag Drop - similar to printer, uses ITPS commands
};

// src/models/BHS.ts
var BHS = class extends DataInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.BHS);
  }
};

// src/models/Feeder.ts
var Feeder = class extends FeederComponent {
  printer;
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.FEEDER);
  }
  // offer() method inherited from FeederComponent
};

// src/models/Dispenser.ts
var Dispenser = class extends DispenserComponent {
  printer;
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.DISPENSER);
    this.on("statusChange", (status) => {
      if (status === "MEDIA_PRESENT" /* MEDIA_PRESENT */) {
        this.pollUntilReady(true, 2e3);
        if (!this.mediaPresent) {
          this.mediaPresent = true;
          this.emit("mediaPresent", true);
        }
      } else {
        if (this.mediaPresent) {
          this.mediaPresent = false;
          this.emit("mediaPresent", false);
        }
      }
    });
  }
};

// src/models/platformResponseError.ts
var PlatformResponseError = class extends Error {
  constructor(pd) {
    super("Platform returned status code: " + pd.meta.messageCode);
    this.componentID = pd.meta.componentID;
    this.componentState = pd.meta.componentState;
    this.requestID = pd.meta.requestID;
    this.messageCode = pd.meta.messageCode || "SOFTWARE_ERROR" /* SOFTWARE_ERROR */;
  }
  componentID;
  componentState;
  requestID;
  messageCode;
};

// src/models/Printer.ts
var Printer = class extends MediaOutputComponent {
  constructor(component, cuss2, _type) {
    super(component, cuss2, _type);
    const missingLink = (msg) => {
      throw new Error(msg);
    };
    const linked = component.linkedComponentIDs?.map((id) => cuss2.components?.[id]) || [];
    this.feeder = linked.find((c) => c instanceof Feeder) || missingLink("Feeder not found for Printer " + this.id);
    this.subcomponents.push(this.feeder);
    const d = linked.find((c) => c instanceof Dispenser);
    this.dispenser = d || missingLink("Dispenser not found for Printer " + this.id);
    this.subcomponents.push(this.dispenser);
  }
  feeder;
  dispenser;
  get mediaPresent() {
    return this.dispenser.mediaPresent;
  }
  updateState(msg) {
    if (msg.meta.platformDirective === "peripherals_send" /* PERIPHERALS_SEND */ && msg.meta.messageCode === "TIMEOUT" /* TIMEOUT */ && msg.meta.componentState === "UNAVAILABLE" /* UNAVAILABLE */) {
      msg.meta.componentState = "READY" /* READY */;
    }
    if (!this.ready && msg.meta.componentState === "READY" /* READY */) {
      this.feeder.query().catch(console.error);
      this.dispenser.query().catch(console.error);
    } else if (msg.meta.messageCode === "MEDIA_PRESENT" /* MEDIA_PRESENT */) {
      this.dispenser.emit("mediaPresent", true);
      this.dispenser.query().catch(console.error);
    }
    super.updateState(msg);
  }
  async setupITPS(commands) {
    const dataRecords = commands.map((command) => ({
      data: command,
      dsTypes: ["DS_TYPES_ITPS" /* DS_TYPES_ITPS */]
    }));
    return await this.api.setup(this.id, dataRecords);
  }
  async sendITPS(commands) {
    const dataRecords = commands.map((command) => ({
      data: command,
      dsTypes: ["DS_TYPES_ITPS" /* DS_TYPES_ITPS */]
    }));
    return await this.api.send(this.id, dataRecords);
  }
  async sendITPSCommand(cmd) {
    const pd = await this.setupITPS([cmd]);
    const records = pd.payload;
    if (!records || records.length === 0) {
      throw new PlatformResponseError(pd);
    }
    return records[0].data || "";
  }
  async getEnvironment() {
    const es = await this.sendITPSCommand("ES");
    return helpers.deserializeDictionary(es);
  }
  async getPairedResponse(cmd, n = 2) {
    const response = await this.sendITPSCommand(cmd);
    return helpers.split_every(response.substr(response.indexOf("OK") + 2), n) || [];
  }
  logos = {
    clear: async (id = "") => {
      const response = await this.sendITPSCommand("LC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async () => {
      return await this.getPairedResponse("LS");
    }
  };
  pectabs = {
    clear: async (id = "") => {
      const response = await this.sendITPSCommand("PC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async () => {
      return await this.getPairedResponse("PS");
    }
  };
};

// src/models/BagTagPrinter.ts
var BagTagPrinter = class extends Printer {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.BAG_TAG_PRINTER);
  }
  pectabs = {
    clear: async (id = "") => {
      const response = await this.sendITPSCommand("PC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async () => {
      return await this.getPairedResponse("PS", 4);
    }
  };
};

// src/models/BoardingPassPrinter.ts
var BoardingPassPrinter = class extends Printer {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.BOARDING_PASS_PRINTER);
  }
  templates = {
    clear: async (id = "") => {
      const response = await this.sendITPSCommand("TC" + id);
      return !!response && response.indexOf("OK") > -1;
    },
    query: async () => {
      return await this.getPairedResponse("TA");
    }
  };
};

// src/models/Keypad.ts
var Keypad = class extends UserInputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.KEY_PAD);
  }
  handleMessage(message) {
    super.handleMessage(message);
    if (message.meta.componentID !== this.id)
      return;
    const dataRecords = message.payload?.dataRecords;
    if (dataRecords?.length) {
      const data = dataRecords.map((dr) => dr.data);
      const keypadData = {
        UP: data.includes("NAVUP"),
        DOWN: data.includes("NAVDOWN"),
        PREVIOUS: data.includes("NAVPREVIOUS"),
        NEXT: data.includes("NAVNEXT"),
        ENTER: data.includes("NAVENTER"),
        HOME: data.includes("NAVHOME"),
        END: data.includes("NAVEND"),
        HELP: data.includes("NAVHELP"),
        VOLUMEUP: data.includes("VOLUMEUP"),
        VOLUMEDOWN: data.includes("VOLUMEDOWN")
      };
      this.emit("keypadData", keypadData);
    }
  }
};

// src/models/Announcement.ts
var Announcement = class extends AnnouncementComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.ANNOUNCEMENT);
  }
  // All methods inherited from AnnouncementComponent
};

// src/models/Illumination.ts
var LightColorNameEnum = /* @__PURE__ */ ((LightColorNameEnum2) => {
  LightColorNameEnum2["Red"] = "red";
  LightColorNameEnum2["Green"] = "green";
  LightColorNameEnum2["Blue"] = "blue";
  LightColorNameEnum2["Yellow"] = "yellow";
  LightColorNameEnum2["White"] = "white";
  return LightColorNameEnum2;
})(LightColorNameEnum || {});
var Illumination = class extends DataOutputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.ILLUMINATION);
  }
  /**
   * Convenience method to control the illumination
   * Note: Illumination is DATA_OUTPUT - no enable/disable per CUSS spec
   */
  async illuminate(duration = 0, color, blink) {
    const name = typeof color === "string" ? LightColorNameEnum[color] || void 0 : void 0;
    const rgb = Array.isArray(color) && color.length === 3 ? { red: color[0], green: color[1], blue: color[2] } : void 0;
    const blinkRate = Array.isArray(blink) && blink.length === 2 ? { durationOn: blink[0], durationOff: blink[1] } : void 0;
    const illuminationData = {
      duration,
      lightColor: { name, rgb },
      blinkRate
    };
    const dataRecords = [{
      data: JSON.stringify(illuminationData),
      dsTypes: ["DS_TYPES_DATASTRUCTURE"]
    }];
    return await this.send(dataRecords);
  }
  /**
   * Turn off illumination
   */
  async turnOff() {
    return await this.illuminate(0);
  }
};

// src/models/Headset.ts
var Headset = class extends UserOutputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.HEADSET);
  }
};

// src/models/Biometric.ts
var Biometric = class extends UserOutputComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.BIOMETRIC);
  }
  // Can send CommonUseBiometricMessage via inherited send() method
};

// src/models/InsertionBelt.ts
var InsertionBelt = class extends InsertionBeltComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.INSERTION_BELT);
  }
};

// src/models/VerificationBelt.ts
var VerificationBelt = class extends ConveyorComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.VERIFICATION_BELT);
  }
  // Cannot be enabled/disabled - only ConveyorComponent methods
};

// src/models/ParkingBelt.ts
var ParkingBelt = class extends ConveyorComponent {
  constructor(component, cuss2) {
    super(component, cuss2, DeviceType.PARKING_BELT);
  }
  // Cannot be enabled/disabled - only ConveyorComponent methods
};

// src/models/Errors.ts
var Cuss2Error = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};
var AuthenticationError = class extends Cuss2Error {
  status;
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
};

// https://jsr.io/@std/async/1.0.15/_util.ts
function exponentialBackoffWithJitter(cap, base, attempt, multiplier, jitter) {
  const exp = Math.min(cap, base * multiplier ** attempt);
  return (1 - jitter * Math.random()) * exp;
}

// https://jsr.io/@std/async/1.0.15/retry.ts
var RetryError = class extends Error {
  /**
   * Constructs a new {@linkcode RetryError} instance.
   *
   * @param cause the cause for this error.
   * @param attempts the number of retry attempts made.
   */
  constructor(cause, attempts) {
    super(`Retrying exceeded the maxAttempts (${attempts}).`);
    this.name = "RetryError";
    this.cause = cause;
  }
};
async function retry(fn, options) {
  const {
    multiplier = 2,
    maxTimeout = 6e4,
    maxAttempts = 5,
    minTimeout = 1e3,
    jitter = 1
  } = options ?? {};
  if (maxTimeout <= 0) {
    throw new TypeError(
      `Cannot retry as 'maxTimeout' must be positive: current value is ${maxTimeout}`
    );
  }
  if (minTimeout > maxTimeout) {
    throw new TypeError(
      `Cannot retry as 'minTimeout' must be <= 'maxTimeout': current values 'minTimeout=${minTimeout}', 'maxTimeout=${maxTimeout}'`
    );
  }
  if (jitter > 1) {
    throw new TypeError(
      `Cannot retry as 'jitter' must be <= 1: current value is ${jitter}`
    );
  }
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt + 1 >= maxAttempts) {
        throw new RetryError(error, maxAttempts);
      }
      const timeout = exponentialBackoffWithJitter(
        maxTimeout,
        minTimeout,
        attempt,
        multiplier,
        jitter
      );
      await new Promise((r) => setTimeout(r, timeout));
    }
    attempt++;
  }
}

// src/connection.ts
var log2 = (..._args) => {
};
var global = {
  get WebSocket() {
    return globalThis.WebSocket;
  },
  fetch: globalThis.fetch.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setTimeout: globalThis.setTimeout.bind(globalThis)
};
var Connection = class _Connection extends EventEmitter2 {
  _auth;
  _baseURL;
  _socketURL;
  _socket;
  _refresher = null;
  deviceID;
  access_token = "";
  _retryOptions;
  get isOpen() {
    return !!this._socket && this._socket.readyState === 1;
  }
  constructor(baseURL, client_id, client_secret, deviceID, tokenURL, retryOptions) {
    super();
    this.deviceID = deviceID;
    this.setMaxListeners(0);
    this._validateURL(baseURL, "Base URL");
    if (tokenURL) {
      this._validateURL(tokenURL, "Token URL");
    }
    this._baseURL = this._cleanBaseURL(baseURL);
    const oauthUrl = tokenURL ? this._convertToHttpProtocol(tokenURL) : `${this._convertToHttpProtocol(this._baseURL)}/oauth/token`;
    this._auth = {
      url: oauthUrl,
      client_id,
      client_secret
    };
    this._socketURL = this._buildWebSocketURL(this._baseURL);
    this._retryOptions = {
      maxAttempts: 99,
      minTimeout: 1e3,
      //ms
      maxTimeout: 64e3,
      //ms
      multiplier: 2,
      jitter: 0.25,
      ...retryOptions
    };
  }
  async authorize() {
    log2("info", `Authorizing client '${this._auth.client_id}'`, this._auth.url);
    const params = new URLSearchParams();
    params.append("client_id", this._auth.client_id);
    params.append("client_secret", this._auth.client_secret);
    params.append("grant_type", "client_credentials");
    let attempts = 0;
    const result = await retry(async () => {
      log2("info", `Retrying client '${this._auth.client_id}'`);
      this.emit("authenticating", ++attempts);
      const response = await global.fetch(this._auth.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        redirect: "follow",
        body: params.toString()
        // Form-encoded data
      });
      if (response.status === 401) {
        return new AuthenticationError("Invalid Credentials", 401);
      }
      if (response.status >= 400) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const auth = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type
      };
      this.emit("authenticated", auth);
      return auth;
    }, this._retryOptions);
    if (result instanceof AuthenticationError) {
      this.emit("authenticationError", result);
      throw result;
    }
    attempts = 0;
    return result;
  }
  static connect(baseURL, client_id, client_secret, deviceID, tokenURL, retryOptions) {
    using connection = new _Connection(
      baseURL,
      client_id,
      client_secret,
      deviceID,
      tokenURL,
      retryOptions
    );
    connection.once("authenticated", () => connection._createWebSocketAndAttachEventHandlers());
    setTimeout(() => connection._authenticateAndQueueTokenRefresh(), 10);
    return connection;
  }
  _validateURL(url, urlType) {
    const ALLOWED_PROTOCOLS = ["http:", "https:", "ws:", "wss:"];
    try {
      const parsedUrl = new URL(url);
      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        throw new Error(
          `${urlType} uses unsupported protocol '${parsedUrl.protocol}'. Only ${ALLOWED_PROTOCOLS.map((p) => p.replace(":", "://")).join(", ")} are supported.`
        );
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`${urlType} is not a valid URL: ${url}`);
      }
      throw error;
    }
  }
  _cleanBaseURL(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.origin;
    } catch {
      const parts = url.split("?");
      const cleanURL = parts[0];
      return cleanURL.endsWith("/") ? cleanURL.slice(0, -1) : cleanURL;
    }
  }
  _convertToHttpProtocol(url) {
    if (url.startsWith("ws://")) {
      return url.replace(/^ws:/, "http:");
    } else if (url.startsWith("wss://")) {
      return url.replace(/^wss:/, "https:");
    }
    return url;
  }
  _buildWebSocketURL(baseURL) {
    if (baseURL.startsWith("ws://") || baseURL.startsWith("wss://")) {
      return `${baseURL}/platform/subscribe`;
    }
    if (baseURL.startsWith("https://")) {
      const wsBase = baseURL.replace(/^https:\/\//, "");
      return `wss://${wsBase}/platform/subscribe`;
    } else if (baseURL.startsWith("http://")) {
      const wsBase = baseURL.replace(/^http:\/\//, "");
      return `ws://${wsBase}/platform/subscribe`;
    }
    throw new Error(`Unable to build WebSocket URL from base URL: ${baseURL}`);
  }
  async _authenticateAndQueueTokenRefresh() {
    log2("info", "Getting access_token");
    if (this._refresher) {
      global.clearTimeout(this._refresher);
      this._refresher = null;
    }
    try {
      const access_data = await this.authorize();
      this.access_token = access_data.access_token;
      const expires = Math.max(0, access_data.expires_in);
      if (expires > 0) {
        log2("info", `access_token expires in ${expires} seconds`);
        this._refresher = global.setTimeout(() => this._authenticateAndQueueTokenRefresh(), (expires - 1) * 1e3);
      }
    } catch (error) {
      log2("error", "Authentication failed:", error);
    }
  }
  _createWebSocketAndAttachEventHandlers() {
    let attempts = 0;
    retry(() => new Promise((resolve, reject) => {
      if (this.isOpen) {
        return resolve(true);
      }
      this.emit("connecting", ++attempts);
      let options = void 0;
      if (typeof Deno !== "undefined") {
        const origin = this._baseURL.startsWith("http") ? this._baseURL : `http://${this._baseURL}`;
        options = { headers: { Origin: origin } };
      }
      const socket = new global.WebSocket(this._socketURL, void 0, options);
      socket.onopen = () => {
        log2("info", "Socket opened: ", this._socketURL);
        this._socket = socket;
        attempts = 0;
        resolve(true);
        this.emit("open");
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.ping) {
            socket.send(`{ "pong": ${Date.now()} }`);
            this.emit("ping", data);
            return;
          }
          if (data.ackCode) {
            this.emit("ack", data);
            return;
          }
          log2("socket.onmessage", event);
          const platformData = data;
          this.emit("message", platformData);
          if (platformData?.meta?.requestID) {
            this.emit(String(platformData.meta.requestID), platformData);
          }
        } catch (error) {
          log2("error", "Error processing message:", error);
          this.emit("messageError", error);
        }
      };
      socket.onclose = (e) => {
        log2("Websocket Close:", e.reason);
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        this.emit("close", e);
        if (e.code === 1e3)
          return;
        if (attempts > 0) {
          reject(e);
        }
      };
      socket.onerror = (e) => {
        log2("Websocket Error:", e);
        this.emit("socketError", e);
      };
    }), this._retryOptions);
  }
  send(data) {
    if (!this.isOpen) {
      throw new Error("WebSocket connection not established");
    }
    if (data instanceof Object && !data.meta?.oauthToken) {
      data.meta.oauthToken = this.access_token;
    }
    if (data instanceof Object && !data.meta?.deviceID) {
      data.meta.deviceID = this.deviceID;
    }
    this.json(data);
  }
  json(obj) {
    this._socket?.send(JSON.stringify(obj));
  }
  async sendAndGetResponse(applicationData) {
    if (!this.isOpen) {
      throw new Error("WebSocket connection not established");
    }
    const meta = applicationData.meta;
    const reqId = meta.requestID;
    meta.oauthToken = this.access_token;
    if ((meta.deviceID === null || meta.deviceID === "00000000-0000-0000-0000-000000000000") && this.deviceID !== null) {
      meta.deviceID = this.deviceID;
    }
    const promise = this.waitFor(reqId, ["messageError", "socketError", "close"]);
    this._socket?.send(JSON.stringify(applicationData));
    const message = await promise;
    const messageCode = message.meta?.messageCode;
    if (messageCode && helpers.isNonCritical(messageCode)) {
      return message;
    } else {
      throw new PlatformResponseError(message);
    }
  }
  close(code, reason) {
    if (this._refresher) {
      global.clearTimeout(this._refresher);
      this._refresher = null;
    }
    this._socket?.close(code, reason);
  }
  [Symbol.dispose]() {
    if (this._refresher) {
      clearTimeout(this._refresher);
    }
  }
};

// src/models/stateChange.ts
var StateChange = class {
  previous;
  current;
  constructor(previous, current) {
    this.previous = previous;
    this.current = current;
  }
};

// src/types/modelExtensions.ts
var MediaTypes2 = MediaTypes;
var CussDataTypes2 = CussDataTypes;

// src/componentInterrogation.ts
var dsTypesHas = (charac0, type) => {
  return charac0?.dsTypesList?.find((d) => d === type);
};
var mediaTypesHas = (mediaTypes, type) => {
  return mediaTypes?.find((m) => m === type);
};
var deviceTypesHas = (deviceTypes, type) => {
  return deviceTypes?.find((m) => m === type);
};
var ComponentInterrogation = class {
  static isAnnouncement = (component) => {
    return component.componentType === "ANNOUNCEMENT" /* ANNOUNCEMENT */;
  };
  static isFeeder = (component) => {
    return component.componentType === "FEEDER" /* FEEDER */;
  };
  static isDispenser = (component) => {
    return component.componentType === "DISPENSER" /* DISPENSER */;
  };
  static isBagTagPrinter = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, "PRINT" /* PRINT */) && mediaTypesHas(mediaTypes, MediaTypes2.BAGGAGETAG);
  };
  static isBoardingPassPrinter = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, "PRINT" /* PRINT */) && mediaTypesHas(mediaTypes, MediaTypes2.BOARDINGPASS);
  };
  static isDocumentReader = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return mediaTypesHas(mediaTypes, MediaTypes2.PASSPORT);
  };
  static isBarcodeReader = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    return dsTypesHas(charac0, CussDataTypes2.DS_TYPES_BARCODE);
  };
  static isCardReader = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return mediaTypesHas(mediaTypes, "MAGCARD");
  };
  static isKeypad = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    return dsTypesHas(charac0, CussDataTypes2.DS_TYPES_KEY) || dsTypesHas(charac0, CussDataTypes2.DS_TYPES_KEY_UP) || dsTypesHas(charac0, CussDataTypes2.DS_TYPES_KEY_DOWN);
  };
  static isIllumination = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    return deviceTypesHas(charac0.deviceTypesList, "ILLUMINATION" /* ILLUMINATION */);
  };
  static isHeadset = (component) => {
    if (component.componentType !== "MEDIA_INPUT" /* MEDIA_INPUT */)
      return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, "ASSISTIVE" /* ASSISTIVE */) && mediaTypesHas(mediaTypes, MediaTypes2.AUDIO);
  };
  static isScale = (component) => {
    if (component.componentType !== "DATA_INPUT" /* DATA_INPUT */)
      return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    return deviceTypesHas(charac0.deviceTypesList, "SCALE" /* SCALE */);
  };
  static isBiometric = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    return dsTypesHas(charac0, CussDataTypes2.DS_TYPES_BIOMETRIC);
  };
  static isCamera = (component) => {
    if (component.componentType !== "DATA_INPUT" /* DATA_INPUT */)
      return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, "CAMERA" /* CAMERA */) && mediaTypesHas(mediaTypes, MediaTypes2.IMAGE);
  };
  static isRFIDReader = (component) => {
    if (component.componentType !== "DATA_INPUT" /* DATA_INPUT */)
      return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!deviceTypesHas(charac0.deviceTypesList, "CONTACTLESS" /* CONTACTLESS */) && !!mediaTypesHas(mediaTypes, MediaTypes2.RFID);
  };
  static isInsertionBelt = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    return component.componentType === "INSERTION_BELT" /* INSERTION_BELT */;
  };
  static isVerificationBelt = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    return component.componentType === "VERIFICATION_BELT" /* VERIFICATION_BELT */;
  };
  static isParkingBelt = (component) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    return component.componentType === "PARKING_BELT" /* PARKING_BELT */;
  };
  static isAEASBD = (component) => {
    if (component.componentType !== "USER_OUTPUT" /* USER_OUTPUT */)
      return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    return !!dsTypesHas(charac0, "SBDAEA");
  };
  static isBHS = (component) => {
    if (component.componentType !== "DATA_OUTPUT" /* DATA_OUTPUT */)
      return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0)
      return false;
    return !!dsTypesHas(charac0, CussDataTypes2.DS_TYPES_RP1745);
  };
};

// src/cuss2.ts
var {
  isAnnouncement,
  isFeeder,
  isDispenser,
  isBagTagPrinter,
  isBoardingPassPrinter,
  isDocumentReader,
  isBarcodeReader,
  isCardReader,
  isBiometric,
  isKeypad,
  isIllumination,
  isHeadset,
  isScale,
  isCamera,
  isInsertionBelt,
  isParkingBelt,
  isRFIDReader,
  isVerificationBelt,
  isAEASBD,
  isBHS
} = ComponentInterrogation;
function validateComponentId(componentID) {
  if (typeof componentID !== "number") {
    throw new TypeError("Invalid componentID: " + componentID);
  }
}
var Cuss2 = class _Cuss2 extends EventEmitter2 {
  connection;
  environment = {};
  components = void 0;
  // State management
  _currentState = new StateChange("STOPPED" /* STOPPED */, "STOPPED" /* STOPPED */);
  /**
   * How much gold the party starts with.
   */
  bagTagPrinter;
  boardingPassPrinter;
  documentReader;
  barcodeReader;
  illumination;
  announcement;
  keypad;
  cardReader;
  biometric;
  scale;
  insertionBelt;
  verificationBelt;
  parkingBelt;
  rfid;
  headset;
  camera;
  bhs;
  aeasbd;
  pendingStateChange;
  multiTenant;
  accessibleMode = false;
  language;
  get state() {
    return this._currentState.current;
  }
  get connected() {
    if (this.connection.isOpen && this.components) {
      return Promise.resolve();
    }
    return this.waitFor("connected", ["connection.authenticationError", "connection.close"]);
  }
  constructor(connection) {
    super();
    this.connection = connection;
    this.setMaxListeners(100);
    connection.on("message", (e) => this._handleWebSocketMessage(e));
    connection.on("open", () => this._initialize().catch((e) => {
      log("error", "Initialization failed", e);
      connection.emit("error", new Error("Initialization failed: " + e.message));
    }));
  }
  static connect(client_id, client_secret, wss = "https://localhost:22222", deviceID = "00000000-0000-0000-0000-000000000000", tokenURL) {
    using connection = Connection.connect(wss, client_id, client_secret, deviceID, tokenURL);
    return new _Cuss2(connection);
  }
  _ensureConnected() {
    if (!this.connection.isOpen) {
      throw new Error("Connection not established. Please await cuss2.connected before making API calls.");
    }
  }
  async _initialize() {
    log("info", "Getting Environment Information");
    const environment = await this.api.getEnvironment();
    const deviceID = this.connection.deviceID;
    if (deviceID === "00000000-0000-0000-0000-000000000000" || deviceID === null) {
      this.connection.deviceID = environment.deviceID;
    }
    if (!this.state) {
      throw new Error("Platform in abnormal state.");
    }
    if (this.state === "SUSPENDED" /* SUSPENDED */ || this.state === "DISABLED" /* DISABLED */) {
      throw new Error(`Platform has ${this.state} the application`);
    }
    log("info", "Getting Component List");
    await this.api.getComponents();
    await this.queryComponents().catch((e) => {
      log("error", "error querying components", e);
      super.emit("queryError", e);
    });
    this.emit("connected", this);
  }
  async _handleWebSocketMessage(platformData) {
    if (!platformData)
      return;
    const { meta, payload } = platformData;
    log("verbose", "[event.currentApplicationState]", meta.currentApplicationState);
    const unsolicited = !meta.platformDirective;
    const currentState = meta.currentApplicationState.applicationStateCode;
    if (meta.messageCode === "SESSION_TIMEOUT" /* SESSION_TIMEOUT */) {
      super.emit("sessionTimeout", meta.messageCode);
    }
    if (!currentState) {
      this.connection._socket?.close();
      throw new Error("Platform in invalid state. Cannot continue.");
    }
    if (currentState !== this.state) {
      const prevState = this.state;
      log("verbose", `[state changed] old:${prevState} new:${currentState}`);
      this._currentState = new StateChange(prevState, currentState);
      super.emit("stateChange", this._currentState);
      if (currentState === "UNAVAILABLE" /* UNAVAILABLE */) {
        await this.queryComponents().catch((e) => {
          log("error", "error querying components", e);
          super.emit("queryError", e);
        });
        if (this._online) {
          this.checkRequiredComponentsAndSyncState();
        }
      } else if (currentState === "ACTIVE" /* ACTIVE */) {
        this.multiTenant = payload?.applicationActivation?.executionMode === "MAM";
        this.accessibleMode = payload?.applicationActivation?.accessibleMode || false;
        this.language = payload?.applicationActivation?.languageID || "en-US";
        super.emit("activated", payload?.applicationActivation);
      }
      if (prevState === "ACTIVE" /* ACTIVE */) {
        super.emit("deactivated", currentState);
      }
    }
    if (typeof meta.componentID === "number" && this.components) {
      const component = this.components[meta.componentID];
      if (component && component.stateIsDifferent(platformData)) {
        component.updateState(platformData);
        super.emit("componentStateChange", component);
        if (this._online && (unsolicited || meta.platformDirective === "peripherals_query" /* PERIPHERALS_QUERY */)) {
          this.checkRequiredComponentsAndSyncState();
        }
      }
    }
    log("verbose", "[socket.onmessage]", platformData);
    super.emit("message", platformData);
  }
  api = {
    getEnvironment: async () => {
      this._ensureConnected();
      const ad = Build.applicationData("platform_environment" /* PLATFORM_ENVIRONMENT */);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[getEnvironment()] response", response);
      this.environment = response.payload?.environmentLevel;
      return this.environment;
    },
    getComponents: async () => {
      this._ensureConnected();
      const ad = Build.applicationData("platform_components" /* PLATFORM_COMPONENTS */);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[getComponents()] response", response);
      const componentList = response.payload?.componentList;
      if (this.components)
        return componentList;
      const components = this.components = {};
      componentList.forEach((component) => {
        const id = String(component.componentID);
        let instance;
        if (isFeeder(component))
          instance = new Feeder(component, this);
        else if (isDispenser(component)) {
          instance = new Dispenser(component, this);
        } else
          return;
        return components[id] = instance;
      });
      componentList.forEach((component) => {
        const id = String(component.componentID);
        let instance;
        if (isAnnouncement(component)) {
          instance = this.announcement = new Announcement(component, this);
        } else if (isBagTagPrinter(component)) {
          instance = this.bagTagPrinter = new BagTagPrinter(component, this);
        } else if (isBoardingPassPrinter(component)) {
          instance = this.boardingPassPrinter = new BoardingPassPrinter(
            component,
            this
          );
        } else if (isDocumentReader(component)) {
          instance = this.documentReader = new DocumentReader(component, this);
        } else if (isBarcodeReader(component)) {
          instance = this.barcodeReader = new BarcodeReader(component, this);
        } else if (isCardReader(component)) {
          instance = this.cardReader = new CardReader(component, this);
        } else if (isKeypad(component)) {
          instance = this.keypad = new Keypad(component, this);
        } else if (isBiometric(component)) {
          instance = this.biometric = new Biometric(component, this);
        } else if (isScale(component)) {
          instance = this.scale = new Scale(component, this);
        } else if (isCamera(component)) {
          instance = this.camera = new Camera(component, this);
        } else if (isInsertionBelt(component)) {
          instance = this.insertionBelt = new InsertionBelt(component, this);
        } else if (isVerificationBelt(component)) {
          instance = this.verificationBelt = new VerificationBelt(
            component,
            this
          );
        } else if (isParkingBelt(component)) {
          instance = this.parkingBelt = new ParkingBelt(component, this);
        } else if (isRFIDReader(component)) {
          instance = this.rfid = new RFID(component, this);
        } else if (isBHS(component)) {
          instance = this.bhs = new BHS(component, this);
        } else if (isAEASBD(component)) {
          instance = this.aeasbd = new AEASBD(component, this);
        } else if (isFeeder(component))
          return;
        else if (isDispenser(component))
          return;
        else if (isIllumination(component)) {
          instance = this.illumination = new Illumination(component, this);
        } else if (isHeadset(component)) {
          instance = this.headset = new Headset(component, this);
        } else
          instance = new Component(component, this);
        return components[id] = instance;
      });
      return componentList;
    },
    getStatus: async (componentID) => {
      this._ensureConnected();
      log("verbose", `[getStatus()] querying component with ID: ${componentID}`);
      const ad = Build.applicationData("peripherals_query" /* PERIPHERALS_QUERY */, {
        componentID
      });
      log("verbose", "[getStatus()] applicationData built:", ad);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[queryDevice()] response", response);
      return response;
    },
    send: async (componentID, dataObj) => {
      this._ensureConnected();
      const ad = Build.applicationData("peripherals_send" /* PERIPHERALS_SEND */, {
        componentID,
        dataObj
      });
      return await this.connection.sendAndGetResponse(ad);
    },
    setup: async (componentID, dataObj) => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData("peripherals_setup" /* PERIPHERALS_SETUP */, {
        componentID,
        dataObj
      });
      return await this.connection.sendAndGetResponse(ad);
    },
    cancel: async (componentID) => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData("peripherals_cancel" /* PERIPHERALS_CANCEL */, {
        componentID
      });
      return await this.connection.sendAndGetResponse(ad);
    },
    enable: async (componentID) => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        "peripherals_userpresent_enable" /* PERIPHERALS_USERPRESENT_ENABLE */,
        { componentID }
      );
      return await this.connection.sendAndGetResponse(ad);
    },
    disable: async (componentID) => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        "peripherals_userpresent_disable" /* PERIPHERALS_USERPRESENT_DISABLE */,
        { componentID }
      );
      return await this.connection.sendAndGetResponse(ad);
    },
    offer: async (componentID) => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        "peripherals_userpresent_offer" /* PERIPHERALS_USERPRESENT_OFFER */,
        { componentID }
      );
      return await this.connection.sendAndGetResponse(ad);
    },
    staterequest: async (state, reasonCode = "NOT_APPLICABLE" /* NOT_APPLICABLE */, reason = "") => {
      this._ensureConnected();
      if (this.pendingStateChange) {
        return Promise.resolve(void 0);
      }
      log("info", `Requesting ${state} state`);
      this.pendingStateChange = state;
      let response;
      try {
        const ad = Build.stateChange(state, reasonCode, reason);
        response = await this.connection.sendAndGetResponse(ad);
        return response;
      } finally {
        this.pendingStateChange = void 0;
      }
    },
    announcement: {
      play: async (componentID, rawData) => {
        this._ensureConnected();
        validateComponentId(componentID);
        const dataObj = [{
          data: rawData,
          dsTypes: ["DS_TYPES_SSML" /* DS_TYPES_SSML */]
        }];
        const ad = Build.applicationData(
          "peripherals_announcement_play" /* PERIPHERALS_ANNOUNCEMENT_PLAY */,
          {
            componentID,
            dataObj
          }
        );
        return await this.connection.sendAndGetResponse(ad);
      },
      pause: async (componentID) => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          "peripherals_announcement_pause" /* PERIPHERALS_ANNOUNCEMENT_PAUSE */,
          { componentID }
        );
        return await this.connection.sendAndGetResponse(ad);
      },
      resume: async (componentID) => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          "peripherals_announcement_resume" /* PERIPHERALS_ANNOUNCEMENT_RESUME */,
          { componentID }
        );
        return await this.connection.sendAndGetResponse(ad);
      },
      stop: async (componentID) => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          "peripherals_announcement_stop" /* PERIPHERALS_ANNOUNCEMENT_STOP */,
          { componentID }
        );
        return await this.connection.sendAndGetResponse(ad);
      }
    }
  };
  async _disableAllComponents() {
    if (this.components) {
      const componentList = Object.values(this.components);
      for await (const component of componentList) {
        if (component.enabled) {
          await component.disable();
        }
      }
    }
  }
  async requestInitializeState() {
    this._ensureConnected();
    const okToChange = this.state === "STOPPED" /* STOPPED */;
    return okToChange ? await this.api.staterequest("INITIALIZE" /* INITIALIZE */) : Promise.resolve(void 0);
  }
  async requestUnavailableState() {
    this._ensureConnected();
    const okToChange = this.state === "INITIALIZE" /* INITIALIZE */ || this.state === "AVAILABLE" /* AVAILABLE */ || this.state === "ACTIVE" /* ACTIVE */;
    if (okToChange && this.state === "ACTIVE" /* ACTIVE */) {
      await this._disableAllComponents();
    }
    return okToChange ? this.api.staterequest("UNAVAILABLE" /* UNAVAILABLE */) : Promise.resolve(void 0);
  }
  async requestAvailableState() {
    this._ensureConnected();
    const okToChange = this.state === "UNAVAILABLE" /* UNAVAILABLE */ || this.state === "ACTIVE" /* ACTIVE */;
    if (okToChange && this.state === "ACTIVE" /* ACTIVE */) {
      await this._disableAllComponents();
    }
    return okToChange ? this.api.staterequest("AVAILABLE" /* AVAILABLE */) : Promise.resolve(void 0);
  }
  async requestActiveState() {
    this._ensureConnected();
    const okToChange = this.state === "AVAILABLE" /* AVAILABLE */ || this.state === "ACTIVE" /* ACTIVE */;
    return await (okToChange ? this.api.staterequest("ACTIVE" /* ACTIVE */) : Promise.resolve(void 0));
  }
  async requestStoppedState() {
    this._ensureConnected();
    return await this.api.staterequest("STOPPED" /* STOPPED */);
  }
  async requestReload() {
    this._ensureConnected();
    const okToChange = !this.state || this.state === "UNAVAILABLE" /* UNAVAILABLE */ || this.state === "AVAILABLE" /* AVAILABLE */ || this.state === "ACTIVE" /* ACTIVE */;
    if (!okToChange) {
      return Promise.resolve(false);
    }
    await this.api.staterequest("RELOAD" /* RELOAD */);
    this.connection._socket?.close(1001, "Reloading");
    return true;
  }
  async queryComponents() {
    if (!this.components) {
      return false;
    }
    const componentList = Object.values(this.components);
    await Promise.all(
      componentList.map(
        (c) => c.query().catch((e) => e)
      )
      //it rejects statusCodes that are not "OK" - but here we just need to know what it is, so ignore
    );
    return true;
  }
  get unavailableComponents() {
    const components = Object.values(this.components || {});
    return components.filter((c) => !c.ready);
  }
  get unavailableRequiredComponents() {
    return this.unavailableComponents.filter((c) => c.required);
  }
  checkRequiredComponentsAndSyncState() {
    if (this.pendingStateChange)
      return;
    if (this._online) {
      const inactiveRequiredComponents = this.unavailableRequiredComponents;
      if (!inactiveRequiredComponents.length) {
        if (this.state === "UNAVAILABLE" /* UNAVAILABLE */) {
          log(
            "verbose",
            "[checkRequiredComponentsAndSyncState] All required components OK \u2705. Ready for AVAILABLE state."
          );
          this.requestAvailableState();
        }
      } else {
        log(
          "verbose",
          "[checkRequiredComponentsAndSyncState] Required components UNAVAILABLE:",
          inactiveRequiredComponents.map((c) => c.constructor.name)
        );
        this.requestUnavailableState();
      }
    } else if (this.components) {
      this.requestUnavailableState();
    }
  }
  _online = false;
  get applicationOnline() {
    return this._online;
  }
  set applicationOnline(online) {
    this._online = online;
    this.checkRequiredComponentsAndSyncState();
  }
};
export {
  Build,
  Cuss2,
  LogMessage,
  mod_exports as Models,
  StateChange,
  helpers,
  log,
  logger
};
