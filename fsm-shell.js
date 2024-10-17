(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FSMShell = {}));
}(this, (function (exports) { 'use strict';

  var SHELL_EVENTS = {
      Version1: {
          REQUIRE_CONTEXT: 'V1.REQUIRE_CONTEXT',
          REQUIRE_AUTHENTICATION: 'V1.REQUIRE_AUTHENTICATION',
          CLOSE: 'V1.CLOSE',
          REQUIRE_PERMISSIONS: 'V1.REQUIRE_PERMISSIONS',
          GET_PERMISSIONS: 'V1.GET_PERMISSIONS',
          GET_SETTINGS: 'V1.GET_SETTINGS',
          GET_STORAGE_ITEM: 'V1.GET_STORAGE_ITEM',
          SET_STORAGE_ITEM: 'V1.SET_STORAGE_ITEM',
          SET_VIEW_STATE: 'V1.SET_VIEW_STATE',
          SET_TITLE: 'V1.SET_TITLE',
          RESTORE_TITLE: 'V1.RESTORE_TITLE',
          TO_APP: 'V1.TO_APP',
          GET_FEATURE_FLAG: 'V1.GET_FEATURE_FLAG',
          PRIVATE: {
              GET_ACCOUNT_SETTINGS: 'V1.PRIVATE.GET_ACCOUNT_SETTINGS',
          },
          OUTLET: {
              ADD_PLUGIN: 'V1.OUTLET.ADD_PLUGIN',
              REMOVE_PLUGIN: 'V1.OUTLET.REMOVE_PLUGIN',
              REQUEST_CONTEXT: 'V1.OUTLET.REQUEST_CONTEXT',
              REQUEST_DYNAMIC_CONTEXT: 'V1.OUTLET.REQUEST_DYNAMIC_CONTEXT',
              LOADING_SUCCESS: 'V1.OUTLET.LOADING_SUCCESS',
              LOADING_FAIL: 'V1.OUTLET.LOADING_FAIL',
          },
          MODAL: {
              OPEN: 'V1.MODAL.OPEN',
              CLOSE: 'V1.MODAL.CLOSE',
          },
      },
      Version2: {
          GET_STORAGE_ITEM: 'V2.GET_STORAGE_ITEM',
          GET_PERMISSIONS: 'V2.GET_PERMISSIONS',
          MODAL: {
              OPEN: 'V2.MODAL.OPEN',
          },
          REQUIRE_PERMISSIONS: 'V2.REQUIRE_PERMISSIONS',
      },
      Version3: {
          GET_PERMISSIONS: 'V3.GET_PERMISSIONS',
      },
      ERROR: 'ERROR',
  };
  exports.ErrorType = void 0;
  (function (ErrorType) {
      ErrorType["OUTLET_TIMEOUT"] = "OUTLET_TIMEOUT";
      ErrorType["OUTLET_MAXIMUM_DEPTH"] = "OUTLET_MAXIMUM_DEPTH";
      ErrorType["OUTLET_HTTPS_ERROR"] = "OUTLET_HTTPS_ERROR";
      ErrorType["INVALID_EXTENSION"] = "INVALID_EXTENSION";
  })(exports.ErrorType || (exports.ErrorType = {}));
  var getKeyValues = function (source, initial) {
      if (initial === void 0) { initial = []; }
      var result = initial.slice();
      for (var key in source) {
          if (typeof source[key] === 'string') {
              result.push(source[key]);
          }
          else if (typeof source[key] === 'object') {
              result = getKeyValues(source[key], result);
          }
      }
      return result;
  };
  var ALL_SHELL_EVENTS_ARRAY = getKeyValues(SHELL_EVENTS);

  // THE FILE SHELLVERSIONINFO.TS IS AUTOMATICALLY GENERATED DURING BUILD PROCESS
  // MANUAL CHANGES TO THIS FILE WILL BE OVERWRITTEN !!!
  var SHELL_VERSION_INFO = {
      VERSION: '1.19.0',
      BUILD_TS: '2023-09-04T13:53:53.274Z'
  };

  var MessageLogger = /** @class */ (function () {
      function MessageLogger() {
          this.messages = [];
      }
      MessageLogger.prototype.push = function (event, debugId) {
          var action;
          if (event.direction === 'incoming') {
              if (event.handled === 'yes') {
                  action = 'received and handled';
              }
              else {
                  action = 'received and skipped';
              }
          }
          else {
              action = 'sending';
          }
          console.log(debugId + " " + action + " message: ", event);
          this.messages.push(event);
      };
      MessageLogger.prototype.all = function () {
          return this.messages;
      };
      MessageLogger.prototype.allTable = function () {
          console.table(this.all());
      };
      MessageLogger.prototype.filter = function (options) {
          return this.messages.filter(function (message) {
              if (options.type) {
                  if (Array.isArray(options.type) && !options.type.some(function (type) { return new RegExp(type).test(message.type); })) {
                      return false;
                  }
                  else if (typeof options.type === 'string' && !RegExp(options.type).test(message.type)) {
                      return false;
                  }
              }
              if (options.component) {
                  if (Array.isArray(options.component) && !options.component.some(function (it) { return it === message.component; })) {
                      return false;
                  }
                  else if (options.component !== message.component) {
                      return false;
                  }
              }
              if (options.direction && options.direction !== message.direction) {
                  return false;
              }
              if (options.direction &&
                  options.direction === 'incoming' &&
                  typeof options.handled !== 'undefined' &&
                  options.handled !== (message.handled === 'yes')) {
                  return false;
              }
              if (options.from && options.from > message.timestamp) {
                  return false;
              }
              if (options.to && options.to < message.timestamp) {
                  return false;
              }
              return true;
          });
      };
      MessageLogger.prototype.filterTable = function (options) {
          console.table(this.filter(options));
      };
      return MessageLogger;
  }());

  var FSM_SHELL_DEBUG_KEY = 'cs.fsm-shell.debug';
  var Debugger = /** @class */ (function () {
      function Debugger(winRef, debugId) {
          this.winRef = winRef;
          this.debugId = debugId;
          this.debugMode = false;
          if (this.debugId) {
              var win = this.winRef;
              var localStorageValue = win.localStorage.getItem(FSM_SHELL_DEBUG_KEY);
              if (!!localStorageValue && localStorageValue.split(',').some(function (it) { return it === debugId; })) {
                  this.debugMode = true;
              }
          }
      }
      Debugger.prototype.traceEvent = function (direction, type, payload, routing, hasHandler) {
          if (this.debugMode && ALL_SHELL_EVENTS_ARRAY.some(function (it) { return it === type; })) {
              var debugEvent = {
                  timestamp: new Date(),
                  component: this.debugId,
                  direction: direction,
                  type: type,
                  handled: direction === 'incoming' ? (hasHandler ? 'yes' : 'no') : 'n/a',
                  to: routing.to,
                  from: routing.from,
                  payload: payload
              };
              this.logEvent(debugEvent);
          }
      };
      Debugger.prototype.logEvent = function (debugEvent) {
          var win = this.winRef;
          if (!win.fsmShellMessageLogger) {
              win.fsmShellMessageLogger = new MessageLogger();
          }
          win.fsmShellMessageLogger.push(debugEvent, this.debugId);
      };
      return Debugger;
  }());

  var authRequest_v1_schema = {
      type: 'object',
      properties: {
          response_type: {
              type: 'string',
              enum: ['token', 'code'],
          },
      },
      required: ['response_type'],
  };

  var authResponse_v1_schema = {
      type: 'object',
      properties: {
          access_token: {
              type: 'string',
          },
          expires_in: {
              type: 'number',
          },
          token_type: {
              type: 'string',
          },
      },
      required: ['access_token', 'expires_in', 'token_type'],
  };

  var requireContextRequest_v1_schema = {
      type: 'object',
      properties: {
          clientIdentifier: {
              type: 'string',
          },
          clientSecret: {
              type: 'string',
          },
          cloudStorageKeys: {
              type: 'array',
              items: {
                  type: 'string',
              },
          },
          auth: authRequest_v1_schema,
          targetOutletName: {
              type: 'string',
          },
      },
      required: ['clientIdentifier', 'clientSecret'],
  };

  var getItemRequest_v1_schema = {
      type: 'string',
  };

  var getItemRequest_v2_schema = {
      type: 'string',
  };

  var getItemResponse_v1_schema = {};

  var getItemResponse_v2_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {},
      },
      required: ['key', 'value'],
  };

  var setItemRequest_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {},
      },
      required: ['key', 'value'],
  };

  var getFeatureFlagRequest_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          defaultValue: {
              type: 'boolean',
          },
      },
      required: ['key', 'defaultValue'],
  };

  var getFeatureFlagResponse_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {
              type: 'boolean',
          },
      },
      required: ['key', 'value'],
  };

  var setTitleRequest_v1_schema = {
      type: 'object',
      properties: {
          title: {
              type: 'string',
          },
      },
      required: ['title'],
  };

  var modalOpenRequest_v1_schema = {
      type: 'object',
      properties: {
          url: {
              type: 'string',
          },
          modalSettings: {
              type: 'object',
              properties: {
                  title: {
                      type: 'string',
                  },
                  size: {
                      type: 'string',
                      enum: ['l', 'm', 's'],
                  },
                  backdropClickCloseable: {
                      type: 'boolean',
                  },
                  isScrollbarHidden: {
                      type: 'boolean',
                  },
              },
          },
      },
      data: {
          type: 'object',
      },
      required: ['url'],
  };

  var modalOpenRequest_v2_schema = {
      type: 'object',
      properties: {
          url: {
              type: 'string',
          },
          modalSettings: {
              type: 'object',
              properties: {
                  title: {
                      type: 'string',
                  },
                  showTitleHeader: {
                      type: 'boolean',
                  },
                  hasBackdrop: {
                      type: 'boolean',
                  },
                  backdropClickCloseable: {
                      type: 'boolean',
                  },
                  escKeyCloseable: {
                      type: 'boolean',
                  },
                  focusTrapped: {
                      type: 'boolean',
                  },
                  fullScreen: {
                      type: 'boolean',
                  },
                  mobile: {
                      type: 'boolean',
                  },
                  mobileOuterSpacing: {
                      type: 'boolean',
                  },
                  draggable: {
                      type: 'boolean',
                  },
                  resizable: {
                      type: 'boolean',
                  },
                  width: {
                      type: 'string',
                  },
                  height: {
                      type: 'string',
                  },
                  minHeight: {
                      type: 'string',
                  },
                  maxHeight: {
                      type: 'string',
                  },
                  minWidth: {
                      type: 'string',
                  },
                  maxWidth: {
                      type: 'string',
                  },
                  isScrollbarHidden: {
                      type: 'boolean',
                  },
              },
          },
      },
      data: {
          type: 'object',
      },
      required: ['url'],
  };

  var modalCloseRequest_v1_schema = {
      type: 'object',
  };

  var getPermissionsRequest_v1_schema = {
      type: 'object',
      properties: {
          objectName: {
              type: 'string',
          },
          owners: {
              type: 'array',
              items: {
                  type: 'string',
              },
          },
      },
      required: ['objectName'],
  };

  var getPermissionsRequest_v2_schema = {
      type: 'object',
      properties: {
          objectName: {
              type: 'string',
          },
          owners: {
              type: 'array',
              items: {
                  type: 'string',
              },
          },
      },
      required: ['objectName'],
  };

  var getPermissionsRequest_v3_schema = {
      type: 'object',
      properties: {
          objectName: {
              type: 'string',
          },
      },
      required: ['objectName'],
  };

  var getPermissionsResponse_v1_schema = {
      type: 'object',
      properties: {
          CREATE: {
              type: 'boolean',
          },
          READ: {
              type: 'boolean',
          },
          UPDATE: {
              type: 'boolean',
          },
          DELETE: {
              type: 'boolean',
          },
          UI_PERMISSIONS: {
              type: 'array',
              items: {
                  type: 'number',
              },
          },
      },
      required: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'UI_PERMISSIONS'],
  };

  var getPermissionsResponse_v2_schema = {
      type: 'object',
      properties: {
          objectName: {
              type: 'string',
          },
          owners: {
              type: 'array',
              items: {
                  type: 'string',
              },
          },
          permission: getPermissionsResponse_v1_schema,
      },
      required: ['objectName', 'permission'],
  };

  var getPermissionsResponse_v3_schema = {
      type: 'object',
      properties: {
          objectName: {
              type: 'string',
          },
          permission: getPermissionsResponse_v1_schema,
      },
      required: ['objectName', 'permission'],
  };

  var getSettingsRequest_v1_schema = {
      type: 'string',
  };

  var getSettingsResponse_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {},
      },
      required: ['key', 'value'],
  };

  var setViewStateRequest_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {},
      },
      required: ['key', 'value'],
  };

  var setViewStateResponse_v1_schema = {
      type: 'object',
      properties: {
          key: {
              type: 'string',
          },
          value: {},
      },
      required: ['key', 'value'],
  };

  var outletsRequestContextRequest_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
          assignmentId: {
              type: 'string',
          },
          showMocks: {
              type: 'boolean',
          },
          outletSettings: {},
      },
      required: ['target'],
  };

  var outletsRequestContextResponse_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
          isRootNodeHttps: {
              type: 'boolean',
          },
          isConfigurationMode: {
              type: 'boolean',
          },
          isPreviewActive: {
              type: 'boolean',
          },
          plugin: {},
      },
      required: ['isConfigurationMode'],
  };

  var outletsAddPluginRequest_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
      },
      required: ['target'],
  };

  var outletsRemovePluginRequest_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
      },
      required: ['target'],
  };

  var outletsRequestDynamicContextRequest_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
          outletSettings: {},
      },
      required: ['target'],
  };

  var outletsRequestDynamicContextResponse_v1_schema = {
      type: 'object',
      properties: {
          target: {
              type: 'string',
          },
          isRootNodeHttps: {
              type: 'boolean',
          },
          isConfigurationMode: {
              type: 'boolean',
          },
          areDynamicOutletsEnabled: {
              type: 'boolean',
          },
          isPreviewActive: {
              type: 'boolean',
          },
          plugins: [],
      },
      required: [],
  };

  var getEventValidationConfiguration = function () {
      var _a;
      return (_a = {},
          _a[SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION] = {
              request: {
                  schema: authRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: authResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.REQUIRE_CONTEXT] = {
              request: {
                  schema: requireContextRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.GET_STORAGE_ITEM] = {
              request: {
                  schema: getItemRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getItemResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version2.GET_STORAGE_ITEM] = {
              request: {
                  schema: getItemRequest_v2_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getItemResponse_v2_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.SET_STORAGE_ITEM] = {
              request: {
                  schema: setItemRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.GET_FEATURE_FLAG] = {
              request: {
                  schema: getFeatureFlagRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getFeatureFlagResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.SET_TITLE] = {
              request: {
                  schema: setTitleRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.MODAL.OPEN] = {
              request: {
                  schema: modalOpenRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version2.MODAL.OPEN] = {
              request: {
                  schema: modalOpenRequest_v2_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.MODAL.CLOSE] = {
              request: {
                  schema: modalCloseRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.GET_PERMISSIONS] = {
              request: {
                  schema: getPermissionsRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getPermissionsResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version2.GET_PERMISSIONS] = {
              request: {
                  schema: getPermissionsRequest_v2_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getPermissionsResponse_v2_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version3.GET_PERMISSIONS] = {
              request: {
                  schema: getPermissionsRequest_v3_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getPermissionsResponse_v3_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.GET_SETTINGS] = {
              request: {
                  schema: getSettingsRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: getSettingsResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.SET_VIEW_STATE] = {
              request: {
                  schema: setViewStateRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: setViewStateResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.OUTLET.REQUEST_CONTEXT] = {
              request: {
                  schema: outletsRequestContextRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: outletsRequestContextResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.OUTLET.REQUEST_DYNAMIC_CONTEXT] = {
              request: {
                  schema: outletsRequestDynamicContextRequest_v1_schema,
                  validationFunction: null,
              },
              response: {
                  schema: outletsRequestDynamicContextResponse_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.OUTLET.ADD_PLUGIN] = {
              request: {
                  schema: outletsAddPluginRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a[SHELL_EVENTS.Version1.OUTLET.REMOVE_PLUGIN] = {
              request: {
                  schema: outletsRemovePluginRequest_v1_schema,
                  validationFunction: null,
              },
          },
          _a);
  };

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var PayloadValidationError = /** @class */ (function (_super) {
      __extends(PayloadValidationError, _super);
      function PayloadValidationError(message, detail) {
          var _this = _super.call(this, message) || this;
          _this.name = 'PayloadValidationError';
          _this.detail = detail;
          return _this;
      }
      return PayloadValidationError;
  }(Error));

  // tslint:disable
  function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0;
          var v = c == 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
      });
  }
  // tslint:enable
  var DEFAULT_MAXIMUM_DEPTH = 1;
  var ShellSdk = /** @class */ (function () {
      function ShellSdk(target, origin, winRef, debugId, outletMaximumDepth) {
          var _this = this;
          this.target = target;
          this.origin = origin;
          this.winRef = winRef;
          this.outletMaximumDepth = outletMaximumDepth;
          this.validator = null;
          this.validationMode = 'client';
          this.allowedOrigins = [];
          this.ignoredOrigins = [];
          // tslint:disable-next-line
          this.on = function (type, subscriber) {
              if (!_this.subscribersMap.has(type)) {
                  _this.subscribersMap.set(type, []);
              }
              // tslint:disable-next-line
              var subscribers = _this.subscribersMap.get(type);
              subscribers.push(subscriber);
              return function () {
                  _this.removeSubscriber(type, subscriber);
              };
          };
          // tslint:disable-next-line
          this.onViewState = function (key, subscriber) {
              if (!_this.subscribersViewStateMap.has(key)) {
                  _this.subscribersViewStateMap.set(key, []);
              }
              // tslint:disable-next-line
              var subscribers = _this.subscribersViewStateMap.get(key);
              subscribers.push(subscriber);
              return function () {
                  _this.removeViewStateSubscriber(key, subscriber);
              };
          };
          // tslint:disable-next-line
          this.off = function (type, subscriber) {
              _this.removeSubscriber(type, subscriber);
          };
          // tslint:disable-next-line
          this.offViewState = function (key, subscriber) {
              _this.removeViewStateSubscriber(key, subscriber);
          };
          /*
            Message handler, generic for all ShellSDK instances but have different behaviours if root of not.
        
            - If root, we handle all messages to subscribers
            - If not root, and receive a message from an iframe registered as outlet, we send to parent node
            and add node's id to allow return if needed.
            - If not root and receive SET_VIEW_STATE, we set new value on local node and propagate to outlets
            - If not root and receive TO_APP, we handle locally and do not propagate to outlets
            - If not root and receive any message with `to` value, we remove our id and send to destination
        
            Also define a new event for REQUIRE_CONTEXT which now contains ViewState. To use ViewState binding
            and avoid duplicate key we first provide REQUIRE_CONTEXT to init currrent node, then propagate each
            key of ViewState individualy to match potential subscriptions. To avoid UI glitch after this we
            send an empty REQUIRE_CONTEXT_DONE to eventually adjust UI if needed.
          */
          this.onMessage = function (event) {
              if (!event.data || typeof event.data.type !== 'string') {
                  return;
              }
              if (event.source !== window.parent &&
                  _this.ignoredOrigins &&
                  Array.isArray(_this.ignoredOrigins) &&
                  _this.ignoredOrigins.length !== 0 &&
                  _this.ignoredOrigins.indexOf(event.origin) !== -1) {
                  return;
              }
              if (event.source !== window.parent &&
                  _this.allowedOrigins &&
                  Array.isArray(_this.allowedOrigins) &&
                  _this.allowedOrigins.length !== 0 &&
                  _this.allowedOrigins.indexOf(event.origin) === -1) {
                  console.error(event.origin + " is not in the list of known origins");
                  return;
              }
              var payload = event.data;
              // we ignore LOADING SUCCESS as it is handled by the outlet component itself
              if (payload.type === SHELL_EVENTS.Version1.OUTLET.LOADING_SUCCESS) {
                  return;
              }
              // If current instance is not root, we act as middleman node to propagate
              if (!_this.isRoot) {
                  // Message come from a registered outlet, we send to parent (this.target) with a `from` value
                  var source_1 = event.source;
                  if (source_1) {
                      // If has a source, we look if it come from one of our HTMLIFrameElement
                      var iFrameElement = Array.from(_this.outletsMap.keys()).find(function (frame) { return frame.contentWindow === source_1; });
                      if (iFrameElement && iFrameElement.src) {
                          var iFrameOrigin = new URL(iFrameElement.src).origin;
                          if (iFrameOrigin !== event.origin) {
                              // If it comes from unregistered iFrame we ignore it
                              // in order to prevent unauthorized access to the data
                              _this.debugger.traceEvent('blocked', payload.type, payload.value, { from: payload.from }, false);
                              return;
                          }
                          var from = payload.from || [];
                          // If it come from an outlet
                          if (payload.type === SHELL_EVENTS.Version1.SET_VIEW_STATE) {
                              console.warn('[ShellSDk] A plugin tried to update viewState using SetViewState which is not allowed for security reason.');
                              return;
                          }
                          else if ((payload.type === SHELL_EVENTS.Version1.MODAL.OPEN ||
                              payload.type === SHELL_EVENTS.Version2.MODAL.OPEN) &&
                              from.length === 0 &&
                              !_this.allowedOrigins.some(function (o) { return payload.value.url.startsWith(o); })) {
                              // If we are not root and first to receive OPEN, we block request opening a modal which has a different
                              // origin than the one allowed by the outlet
                              console.warn('[ShellSDk] MODAL OPEN url is not in allowedList.');
                              return;
                          }
                          // If ShellSdk receives from outlet REQUEST_CONTEXT or from dynamic outlet REQUEST_DYNAMIC_CONTEXT
                          // to fetch plugin(s) from target, return LOADING_FAIL if too many depth exchanges.
                          if ((payload.type === SHELL_EVENTS.Version1.OUTLET.REQUEST_CONTEXT ||
                              payload.type ===
                                  SHELL_EVENTS.Version1.OUTLET.REQUEST_DYNAMIC_CONTEXT) &&
                              from.length >= _this.outletMaximumDepth) {
                              source_1.postMessage({
                                  type: SHELL_EVENTS.Version1.OUTLET.LOADING_FAIL,
                                  value: {
                                      target: payload.value.target,
                                      error: exports.ErrorType.OUTLET_MAXIMUM_DEPTH,
                                  },
                                  to: from,
                              }, _this.origin);
                          }
                          else {
                              var outlet = _this.outletsMap.get(iFrameElement);
                              if (outlet && outlet.uuid) {
                                  if (payload.type === SHELL_EVENTS.Version1.REQUIRE_CONTEXT &&
                                      from.length === 0 &&
                                      outlet.name !== undefined) {
                                      payload.value.targetOutletName = outlet.name;
                                  }
                                  // this is the uuid outlet used for routing of source object
                                  from = from.concat([outlet.uuid]);
                                  _this.debugger.traceEvent('outgoing', payload.type, payload.value, { from: from }, true);
                                  _this.target.postMessage({ type: payload.type, value: payload.value, from: from }, _this.origin);
                              }
                          }
                          return;
                      }
                      else if (source_1 !== _this.target) {
                          // ShellSdk now ignore messages from outlets if it has no outlet registered
                          return;
                      }
                  }
                  // Propagate SET_VIEW_STATE to childrens's outlet andset value to current subscribers
                  if (payload.type === SHELL_EVENTS.Version1.SET_VIEW_STATE) {
                      _this.outletsMap.forEach(function (value, key) {
                          if (key.contentWindow) {
                              key.contentWindow.postMessage({ type: payload.type, value: payload.value }, _this.origin);
                          }
                      });
                      var thisSubscribers = _this.subscribersViewStateMap.get(payload.value.key);
                      _this.debugger.traceEvent('incoming', payload.type, payload.value, {}, !!thisSubscribers);
                      if (!!thisSubscribers) {
                          for (var _i = 0, thisSubscribers_1 = thisSubscribers; _i < thisSubscribers_1.length; _i++) {
                              var subscriber = thisSubscribers_1[_i];
                              subscriber(payload.value.value);
                          }
                      }
                      return;
                  }
                  // If ShellSdk receive OUTLET.REQUEST_CONTEXT with only `isConfigurationMode` we propagate to all outlets
                  // If ShellSdk receive OUTLET.REQUEST_DYNAMIC_CONTEXT with only `areDynamicOutletsEnabled` we propagate to all outlets
                  if ((payload.type === SHELL_EVENTS.Version1.OUTLET.REQUEST_CONTEXT &&
                      payload.value.hasOwnProperty('isConfigurationMode') &&
                      !payload.value.hasOwnProperty('target') &&
                      !payload.value.hasOwnProperty('plugin')) ||
                      (payload.type ===
                          SHELL_EVENTS.Version1.OUTLET.REQUEST_DYNAMIC_CONTEXT &&
                          payload.value.hasOwnProperty('areDynamicOutletsEnabled') &&
                          !payload.value.hasOwnProperty('target') &&
                          !payload.value.hasOwnProperty('plugins'))) {
                      _this.outletsMap.forEach(function (value, key) {
                          if (key.contentWindow) {
                              key.contentWindow.postMessage({ type: payload.type, value: payload.value }, _this.origin);
                          }
                      });
                  }
                  // Message has a `to` value, send to an outlet as one to one communication
                  if (payload.to &&
                      payload.to.length !== 0 &&
                      payload.type !== SHELL_EVENTS.Version1.TO_APP) {
                      _this.debugger.traceEvent('outgoing', payload.type, payload.value, { to: payload.to }, true);
                      _this.outletsMap.forEach(function (value, key) {
                          if (payload.to &&
                              payload.to.indexOf(value.uuid) !== -1 &&
                              key.contentWindow) {
                              key.contentWindow.postMessage({
                                  type: payload.type,
                                  value: payload.value,
                                  to: payload.to.filter(function (id) { return id !== value.uuid; }),
                              }, _this.origin);
                          }
                      });
                      return;
                  }
              }
              // If isRoot or message is for me, we send to subscribers/handlers
              var subscribers = _this.subscribersMap.get(payload.type);
              _this.debugger.traceEvent('incoming', payload.type, payload.value, { from: payload.from }, !!subscribers);
              var context = null;
              if (!_this.isRoot &&
                  payload.type === SHELL_EVENTS.Version1.REQUIRE_CONTEXT) {
                  context =
                      typeof payload.value === 'string'
                          ? JSON.parse(payload.value)
                          : payload.value;
                  _this.isInsideModal = !!context.isInsideShellModal;
              }
              if (!!subscribers) {
                  for (var _a = 0, subscribers_1 = subscribers; _a < subscribers_1.length; _a++) {
                      var subscriber = subscribers_1[_a];
                      subscriber(payload.value, event.origin, payload.type === SHELL_EVENTS.Version1.SET_VIEW_STATE
                          ? null
                          : payload.from, event);
                  }
              }
              // On REQUIRE_CONTEXT, we split and propagate viewState
              // Need to be done AFTER REQUIRE_CONTEXT event in case of plugin need auth or context.
              if (!_this.isRoot &&
                  payload.type === SHELL_EVENTS.Version1.REQUIRE_CONTEXT) {
                  var viewState = context.viewState;
                  if (viewState) {
                      for (var _b = 0, _c = Object.keys(viewState); _b < _c.length; _b++) {
                          var key = _c[_b];
                          var thisSubscribers = _this.subscribersViewStateMap.get("" + key);
                          if (!!thisSubscribers) {
                              for (var _d = 0, thisSubscribers_2 = thisSubscribers; _d < thisSubscribers_2.length; _d++) {
                                  var subscriber = thisSubscribers_2[_d];
                                  subscriber(viewState[key]);
                              }
                          }
                      }
                  }
                  _this.target.postMessage({ type: SHELL_EVENTS.Version1.OUTLET.LOADING_SUCCESS }, _this.origin);
              }
          };
          this.subscribersMap = new Map();
          this.subscribersViewStateMap = new Map();
          this.outletsMap = new Map();
          this.initMessageApi();
          this.debugger = new Debugger(winRef, debugId);
          this.isRoot = target == null;
          this.isInsideModal = false;
          this.eventValidationConfiguration = getEventValidationConfiguration();
      }
      ShellSdk.init = function (target, origin, winRef, debugId, outletMaximumDepth) {
          if (winRef === void 0) { winRef = window; }
          if (debugId === void 0) { debugId = ''; }
          if (outletMaximumDepth === void 0) { outletMaximumDepth = DEFAULT_MAXIMUM_DEPTH; }
          ShellSdk._instance = new ShellSdk(target, origin, winRef, debugId, outletMaximumDepth);
          return ShellSdk._instance;
      };
      Object.defineProperty(ShellSdk, "instance", {
          get: function () {
              if (!ShellSdk._instance) {
                  throw new Error("ShellSdk wasn't initialized.");
              }
              return ShellSdk._instance;
          },
          enumerable: true,
          configurable: true
      });
      ShellSdk.isInsideShell = function () {
          // using local variable for window reference below needed to fix issue when running tests
          // for applications which use fsm-shell in cypress
          // cypress may replace `window.self !== window.top` with `window.self !== window.self`
          // what makes isInsideShell method returning wrong value
          var winRef = window;
          return winRef.self !== winRef.top;
      };
      ShellSdk.prototype.isInsideShellModal = function () {
          return this.isInsideModal;
      };
      ShellSdk.prototype.setAllowedOrigins = function (allowedOrigins) {
          if (allowedOrigins === void 0) { allowedOrigins = []; }
          this.allowedOrigins = allowedOrigins === '*' ? [] : allowedOrigins;
      };
      ShellSdk.prototype.addAllowedOrigin = function (url) {
          var urlObj;
          try {
              urlObj = new URL(url);
          }
          catch (_a) {
              return;
          }
          this.allowedOrigins.push(urlObj.origin);
      };
      ShellSdk.prototype.removeAllowedOrigin = function (url) {
          var urlObj;
          try {
              urlObj = new URL(url);
          }
          catch (_a) {
              return;
          }
          var idxToRemove = this.allowedOrigins.findIndex(function (allowedOrigin) { return allowedOrigin === urlObj.origin; });
          this.allowedOrigins = this.allowedOrigins.filter(function (_allowedOrigin, originIdx) { return originIdx !== idxToRemove; });
      };
      ShellSdk.prototype.isOriginAllowed = function (url) {
          var urlObj;
          try {
              urlObj = new URL(url);
          }
          catch (_a) {
              return false;
          }
          return this.allowedOrigins.some(function (allowedOrigin) { return allowedOrigin === urlObj.origin; });
      };
      ShellSdk.prototype.setIgnoredOrigins = function (ignoredOrigins) {
          if (ignoredOrigins === void 0) { ignoredOrigins = []; }
          this.ignoredOrigins = ignoredOrigins;
      };
      ShellSdk.prototype.addIgnoredOrigin = function (url) {
          var urlObj;
          try {
              urlObj = new URL(url);
          }
          catch (_a) {
              return;
          }
          this.ignoredOrigins.push(urlObj.origin);
      };
      ShellSdk.prototype.removeIgnoredOrigin = function (url) {
          var urlObj;
          try {
              urlObj = new URL(url);
          }
          catch (_a) {
              return;
          }
          var idxToRemove = this.ignoredOrigins.findIndex(function (ignoredOrigins) { return ignoredOrigins === urlObj.origin; });
          this.ignoredOrigins = this.ignoredOrigins.filter(function (_ignoredOrigins, originIdx) { return originIdx !== idxToRemove; });
      };
      ShellSdk.prototype.setValidator = function (validator, validationMode) {
          if (validationMode === void 0) { validationMode = 'client'; }
          this.validator = validator;
          this.validationMode = validationMode;
      };
      // Called by outlet component to assign an generated uuid to an iframe. This is key
      // to allow one to one communication between a pluging and shell-host
      ShellSdk.prototype.registerOutlet = function (frame, _name) {
          this.outletsMap.set(frame, {
              uuid: uuidv4(),
              name: _name,
          });
      };
      ShellSdk.prototype.unregisterOutlet = function (frame) {
          this.outletsMap.delete(frame);
      };
      ShellSdk.prototype.getTarget = function () {
          return this.target;
      };
      ShellSdk.prototype.setTarget = function (target, origin) {
          var targetChanged = this.target !== target || this.origin !== origin;
          if (targetChanged) {
              this.target = target;
              this.origin = origin;
          }
      };
      ShellSdk.prototype.emit = function (type, value, to) {
          if (!this.postMessageHandler) {
              throw new Error("ShellSdk wasn't initialized, message handler not set.");
          }
          if (!!this.validator && !!this.eventValidationConfiguration[type]) {
              var validationConfig = this.validationMode === 'client'
                  ? this.eventValidationConfiguration[type].request
                  : this.eventValidationConfiguration[type].response;
              if (!!validationConfig) {
                  if (!validationConfig.validationFunction) {
                      validationConfig.validationFunction =
                          this.validator.getValidationFunction(validationConfig.schema);
                  }
                  var validationResult = validationConfig.validationFunction(value);
                  if (!validationResult.isValid) {
                      throw new PayloadValidationError('Payload validation failed', validationResult.error);
                  }
              }
          }
          // Only root can send a message to a specific node
          this.postMessageHandler(type, value, this.isRoot ? to : undefined);
      };
      ShellSdk.prototype.setViewState = function (key, value) {
          if (!this.postMessageHandler) {
              throw new Error("ShellSdk wasn't initialized, message handler not set.");
          }
          this.postMessageHandler(SHELL_EVENTS.Version1.SET_VIEW_STATE, {
              key: key,
              value: value,
          });
      };
      // tslint:disable-next-line
      ShellSdk.prototype.removeSubscriber = function (type, subscriber) {
          var subscribers = this.subscribersMap.get(type);
          if (!!subscribers) {
              this.subscribersMap.set(type, subscribers.filter(function (it) { return it !== subscriber; }));
          }
      };
      // tslint:disable-next-line
      ShellSdk.prototype.removeViewStateSubscriber = function (type, subscriber) {
          var subscribers = this.subscribersViewStateMap.get(type);
          if (!!subscribers) {
              this.subscribersViewStateMap.set(type, subscribers.filter(function (it) { return it !== subscriber; }));
          }
      };
      ShellSdk.prototype.initMessageApi = function () {
          var _this = this;
          this.postMessageHandler = function (type, value, to) {
              if (!_this.target) {
                  throw new Error("ShellSdk wasn't initialized, target is missing.");
              }
              if (!_this.origin) {
                  throw new Error("ShellSdk wasn't initialized, origin is missing.");
              }
              _this.debugger.traceEvent('outgoing', type, value, { to: to }, true);
              _this.target.postMessage({ type: type, value: value, to: to }, _this.origin);
          };
          this.winRef.addEventListener('message', this.onMessage);
      };
      ShellSdk.VERSION = SHELL_VERSION_INFO.VERSION;
      ShellSdk.BUILD_TS = SHELL_VERSION_INFO.BUILD_TS;
      return ShellSdk;
  }());

  exports.PayloadValidationError = PayloadValidationError;
  exports.SHELL_EVENTS = SHELL_EVENTS;
  exports.ShellSdk = ShellSdk;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=fsm-shell-client.js.map
