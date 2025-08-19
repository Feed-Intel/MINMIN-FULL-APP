var __BUNDLE_START_TIME__=globalThis.nativePerformanceNow?nativePerformanceNow():Date.now(),__DEV__=false,process=globalThis.process||{},__METRO_GLOBAL_PREFIX__='';
(function (global) {
  "use strict";

  global.__r = metroRequire;
  global[`${__METRO_GLOBAL_PREFIX__}__d`] = define;
  global.__c = clear;
  global.__registerSegment = registerSegment;
  var modules = clear();
  const EMPTY = {};
  const CYCLE_DETECTED = {};
  const {
    hasOwnProperty
  } = {};
  function clear() {
    modules = new Map();
    return modules;
  }
  function define(factory, moduleId, dependencyMap) {
    if (modules.has(moduleId)) {
      return;
    }
    const mod = {
      dependencyMap,
      factory,
      hasError: false,
      importedAll: EMPTY,
      importedDefault: EMPTY,
      isInitialized: false,
      publicModule: {
        exports: {}
      }
    };
    modules.set(moduleId, mod);
  }
  function metroRequire(moduleId, maybeNameForDev) {
    if (moduleId === null) {
      throw new Error("Cannot find module");
    }
    const moduleIdReallyIsNumber = moduleId;
    const module = modules.get(moduleIdReallyIsNumber);
    return module && module.isInitialized ? module.publicModule.exports : guardedLoadModule(moduleIdReallyIsNumber, module);
  }
  function metroImportDefault(moduleId) {
    const moduleIdReallyIsNumber = moduleId;
    const maybeInitializedModule = modules.get(moduleIdReallyIsNumber);
    if (maybeInitializedModule && maybeInitializedModule.importedDefault !== EMPTY) {
      return maybeInitializedModule.importedDefault;
    }
    const exports = metroRequire(moduleIdReallyIsNumber);
    const importedDefault = exports && exports.__esModule ? exports.default : exports;
    const initializedModule = modules.get(moduleIdReallyIsNumber);
    return initializedModule.importedDefault = importedDefault;
  }
  metroRequire.importDefault = metroImportDefault;
  function metroImportAll(moduleId) {
    const moduleIdReallyIsNumber = moduleId;
    const maybeInitializedModule = modules.get(moduleIdReallyIsNumber);
    if (maybeInitializedModule && maybeInitializedModule.importedAll !== EMPTY) {
      return maybeInitializedModule.importedAll;
    }
    const exports = metroRequire(moduleIdReallyIsNumber);
    let importedAll;
    if (exports && exports.__esModule) {
      importedAll = exports;
    } else {
      importedAll = {};
      if (exports) {
        for (const key in exports) {
          if (hasOwnProperty.call(exports, key)) {
            importedAll[key] = exports[key];
          }
        }
      }
      importedAll.default = exports;
    }
    const initializedModule = modules.get(moduleIdReallyIsNumber);
    return initializedModule.importedAll = importedAll;
  }
  metroRequire.importAll = metroImportAll;
  metroRequire.context = function fallbackRequireContext() {
    throw new Error("The experimental Metro feature `require.context` is not enabled in your project.");
  };
  metroRequire.resolveWeak = function fallbackRequireResolveWeak() {
    throw new Error("require.resolveWeak cannot be called dynamically.");
  };
  let inGuard = false;
  function guardedLoadModule(moduleId, module) {
    if (!inGuard && global.ErrorUtils) {
      inGuard = true;
      let returnValue;
      try {
        returnValue = loadModuleImplementation(moduleId, module);
      } catch (e) {
        global.ErrorUtils.reportFatalError(e);
      }
      inGuard = false;
      return returnValue;
    } else {
      return loadModuleImplementation(moduleId, module);
    }
  }
  const ID_MASK_SHIFT = 16;
  const LOCAL_ID_MASK = 65535;
  function unpackModuleId(moduleId) {
    const segmentId = moduleId >>> ID_MASK_SHIFT;
    const localId = moduleId & LOCAL_ID_MASK;
    return {
      segmentId,
      localId
    };
  }
  metroRequire.unpackModuleId = unpackModuleId;
  function packModuleId(value) {
    return (value.segmentId << ID_MASK_SHIFT) + value.localId;
  }
  metroRequire.packModuleId = packModuleId;
  const moduleDefinersBySegmentID = [];
  const definingSegmentByModuleID = new Map();
  function registerSegment(segmentId, moduleDefiner, moduleIds) {
    moduleDefinersBySegmentID[segmentId] = moduleDefiner;
    if (moduleIds) {
      moduleIds.forEach(moduleId => {
        if (!modules.has(moduleId) && !definingSegmentByModuleID.has(moduleId)) {
          definingSegmentByModuleID.set(moduleId, segmentId);
        }
      });
    }
  }
  function loadModuleImplementation(moduleId, module) {
    if (!module && moduleDefinersBySegmentID.length > 0) {
      const segmentId = definingSegmentByModuleID.get(moduleId) ?? 0;
      const definer = moduleDefinersBySegmentID[segmentId];
      if (definer != null) {
        definer(moduleId);
        module = modules.get(moduleId);
        definingSegmentByModuleID.delete(moduleId);
      }
    }
    const nativeRequire = global.nativeRequire;
    if (!module && nativeRequire) {
      const {
        segmentId,
        localId
      } = unpackModuleId(moduleId);
      nativeRequire(localId, segmentId);
      module = modules.get(moduleId);
    }
    if (!module) {
      throw unknownModuleError(moduleId);
    }
    if (module.hasError) {
      throw module.error;
    }
    module.isInitialized = true;
    const {
      factory,
      dependencyMap
    } = module;
    try {
      const moduleObject = module.publicModule;
      moduleObject.id = moduleId;
      factory(global, metroRequire, metroImportDefault, metroImportAll, moduleObject, moduleObject.exports, dependencyMap);
      {
        module.factory = undefined;
        module.dependencyMap = undefined;
      }
      return moduleObject.exports;
    } catch (e) {
      module.hasError = true;
      module.error = e;
      module.isInitialized = false;
      module.publicModule.exports = undefined;
      throw e;
    } finally {}
  }
  function unknownModuleError(id) {
    let message = 'Requiring unknown module "' + id + '".';
    return Error(message);
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);
(function (global) {
  global.$$require_external = typeof require !== "undefined" ? require : () => null;
})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);
(function (global) {})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);
(function (global) {
  let _inGuard = 0;
  let _globalHandler = global.RN$useAlwaysAvailableJSErrorHandling === true ? global.RN$handleException : (e, isFatal) => {
    throw e;
  };
  const ErrorUtils = {
    setGlobalHandler(fun) {
      _globalHandler = fun;
    },
    getGlobalHandler() {
      return _globalHandler;
    },
    reportError(error) {
      _globalHandler && _globalHandler(error, false);
    },
    reportFatalError(error) {
      _globalHandler && _globalHandler(error, true);
    },
    applyWithGuard(fun, context, args, unused_onError, unused_name) {
      try {
        _inGuard++;
        return fun.apply(context, args);
      } catch (e) {
        ErrorUtils.reportError(e);
      } finally {
        _inGuard--;
      }
      return null;
    },
    applyWithGuardIfNeeded(fun, context, args) {
      if (ErrorUtils.inGuard()) {
        return fun.apply(context, args);
      } else {
        ErrorUtils.applyWithGuard(fun, context, args);
      }
      return null;
    },
    inGuard() {
      return !!_inGuard;
    },
    guard(fun, name, context) {
      if (typeof fun !== 'function') {
        console.warn('A function must be passed to ErrorUtils.guard, got ', fun);
        return null;
      }
      const guardName = name ?? fun.name ?? '<generated guard>';
      function guarded(...args) {
        return ErrorUtils.applyWithGuard(fun, context ?? this, args, null, guardName);
      }
      return guarded;
    }
  };
  global.ErrorUtils = ErrorUtils;
})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.REFRESH_TOKEN_MAX_AGE = exports.REFRESH_TOKEN_EXPIRY = exports.REFRESH_COOKIE_OPTIONS = exports.REFRESH_COOKIE_NAME = exports.REFRESH_BEFORE_EXPIRY_SEC = exports.JWT_SECRET = exports.JWT_EXPIRATION_TIME = exports.GOOGLE_REDIRECT_URI = exports.GOOGLE_CLIENT_SECRET = exports.GOOGLE_CLIENT_ID = exports.GOOGLE_AUTH_URL = exports.FACEBOOK_REDIRECT_URI = exports.FACEBOOK_CLIENT_SECRET = exports.FACEBOOK_CLIENT_ID = exports.FACEBOOK_AUTH_URL = exports.DOMAIN = exports.COOKIE_OPTIONS = exports.COOKIE_NAME = exports.COOKIE_MAX_AGE = exports.BASE_URL = exports.APP_SCHEME = exports.APPLE_REDIRECT_URI = exports.APPLE_CLIENT_SECRET = exports.APPLE_CLIENT_ID = exports.APPLE_AUTH_URL = exports.API_KEY = undefined;
  /**
   * Application Constants
   *
   * This file centralizes all constants used across the application.
   * Import from this file instead of defining constants in individual files.
   */

  // Authentication Constants
  const COOKIE_NAME = exports.COOKIE_NAME = "auth_token";
  const REFRESH_COOKIE_NAME = exports.REFRESH_COOKIE_NAME = "refresh_token";
  const COOKIE_MAX_AGE = exports.COOKIE_MAX_AGE = 20; // 20 seconds
  const DOMAIN = exports.DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
  const JWT_EXPIRATION_TIME = exports.JWT_EXPIRATION_TIME = "20s"; // 20 seconds
  const REFRESH_TOKEN_EXPIRY = exports.REFRESH_TOKEN_EXPIRY = "30d"; // 30 days
  const REFRESH_TOKEN_MAX_AGE = exports.REFRESH_TOKEN_MAX_AGE = 2592000; // 30 days in seconds
  const API_KEY = exports.API_KEY = process.env.EXPO_PUBLIC_API_KEY;

  // Refresh Token Constants
  const REFRESH_BEFORE_EXPIRY_SEC = exports.REFRESH_BEFORE_EXPIRY_SEC = 60; // Refresh token 1 minute before expiry

  // Google OAuth Constants
  const GOOGLE_CLIENT_ID = exports.GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = exports.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = exports.GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback`;
  const GOOGLE_AUTH_URL = exports.GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

  // Apple OAuth Constants
  const APPLE_CLIENT_ID = exports.APPLE_CLIENT_ID = "com.beto.expoauthexample.web";
  const APPLE_CLIENT_SECRET = exports.APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET;
  const APPLE_REDIRECT_URI = exports.APPLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/apple/callback`;
  const APPLE_AUTH_URL = exports.APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";

  // Facebook OAuth Constants
  const FACEBOOK_CLIENT_ID = exports.FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
  const FACEBOOK_CLIENT_SECRET = exports.FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
  const FACEBOOK_REDIRECT_URI = exports.FACEBOOK_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/facebook/callback`;
  const FACEBOOK_AUTH_URL = exports.FACEBOOK_AUTH_URL = "https://www.facebook.com/v11.0/dialog/oauth";

  // Environment Constants
  // Ensure BASE_URL always has a valid HTTP/HTTPS scheme so that
  // authentication sessions opened in the iOS web browser do not crash
  // with "unsupported scheme" errors.
  const rawBaseUrl = process.env.EXPO_PUBLIC_BASE_URL || "https://customer.feed-intel.com";
  const BASE_URL = exports.BASE_URL = rawBaseUrl.startsWith("https://") ? rawBaseUrl : rawBaseUrl.startsWith("http://") ? rawBaseUrl.replace("http://", "https://") : `https://${rawBaseUrl}`;
  const APP_SCHEME = exports.APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME;
  const JWT_SECRET = exports.JWT_SECRET = process.env.JWT_SECRET;

  // Cookie Settings
  const COOKIE_OPTIONS = exports.COOKIE_OPTIONS = {
    httpOnly: true,
    domain: DOMAIN,
    secure: true,
    sameSite: "None",
    path: "/"
  };
  const REFRESH_COOKIE_OPTIONS = exports.REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    domain: DOMAIN,
    sameSite: "None",
    path: "/",
    // Restrict to refresh endpoint only
    maxAge: REFRESH_TOKEN_MAX_AGE
  };
},1221,[]);
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.POST = POST;
  var _constants = require(_dependencyMap[0]);
  async function POST(request) {
    const body = await request.formData();
    const code = body.get("code");
    if (!code) {
      return Response.json({
        error: "Missing authorization code"
      }, {
        status: 400
      });
    }
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: _constants.GOOGLE_CLIENT_ID,
        client_secret: _constants.GOOGLE_CLIENT_SECRET,
        redirect_uri: _constants.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code: code
      })
    });
    const data = await response.json();
    if (!data.id_token) {
      return Response.json({
        error: "Missing required parameters"
      }, {
        status: 400
      });
    }
    const resp = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/social/google/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": _constants.API_KEY
      },
      body: JSON.stringify({
        id_token: data.id_token
      })
    });
    const respData = await resp.json();

    // Create access token (short-lived)
    const accessToken = respData.access_token;

    // Create refresh token (long-lived)
    const refreshToken = respData.refresh_token;
    if (data.error) {
      return Response.json({
        error: data.error,
        error_description: data.error_description,
        message: "OAuth validation error - please ensure the app complies with Google's OAuth 2.0 policy"
      }, {
        status: 400
      });
    }

    // For native platforms, return both tokens in the response body
    return Response.json({
      accessToken,
      refreshToken
    });
  }
},3065,[1221]);
module.exports = __r(3065);