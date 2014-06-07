(function() {
  var BUILDS, DEFAULT_UNGLOBALIZABLE, addClassSuperMethod, addPrototypeSuperMethod, build, exports, findCaller, i, isCommonJS, j, mixins, registerSuper,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  isCommonJS = typeof module !== "undefined";

  if (isCommonJS) {
    exports = module.exports || {};
  } else {
    exports = window.mixins = {};
  }

  mixins = exports;

  mixins.version = '1.0.1';

  mixins.CAMEL_CASE = 'camel';

  mixins.SNAKE_CASE = 'snake';

  mixins.deprecated = function(message) {
    var caller, deprecatedMethodCallerFile, deprecatedMethodCallerName, e, parseLine, s, _ref;
    parseLine = function(line) {
      var f, m, o, _ref, _ref1, _ref2, _ref3;
      if (line.indexOf('@') > 0) {
        if (line.indexOf('</') > 0) {
          _ref = /<\/([^@]+)@(.)+$/.exec(line), m = _ref[0], o = _ref[1], f = _ref[2];
        } else {
          _ref1 = /@(.)+$/.exec(line), m = _ref1[0], f = _ref1[1];
        }
      } else {
        if (line.indexOf('(') > 0) {
          _ref2 = /at\s+([^\s]+)\s*\(([^\)])+/.exec(line), m = _ref2[0], o = _ref2[1], f = _ref2[2];
        } else {
          _ref3 = /at\s+([^\s]+)/.exec(line), m = _ref3[0], f = _ref3[1];
        }
      }
      return [o, f];
    };
    e = new Error();
    caller = '';
    if (e.stack != null) {
      s = e.stack.split('\n');
      _ref = parseLine(s[3]), deprecatedMethodCallerName = _ref[0], deprecatedMethodCallerFile = _ref[1];
      caller = deprecatedMethodCallerName ? " (called from " + deprecatedMethodCallerName + " at " + deprecatedMethodCallerFile + ")" : "(called from " + deprecatedMethodCallerFile + ")";
    }
    return console.log("DEPRECATION WARNING: " + message + caller);
  };

  mixins.deprecated._name = 'deprecated';

  if (Object.getPropertyDescriptor == null) {
    if ((Object.getPrototypeOf != null) && (Object.getOwnPropertyDescriptor != null)) {
      Object.getPropertyDescriptor = function(o, name) {
        var descriptor, proto;
        proto = o;
        descriptor = void 0;
        while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, name))) {
          proto = (typeof Object.getPrototypeOf === "function" ? Object.getPrototypeOf(proto) : void 0) || proto.__proto__;
        }
        return descriptor;
      };
    } else {
      Object.getPropertyDescriptor = function() {
        return void 0;
      };
    }
  }

  Function.prototype.accessor = function(name, options) {
    var oldDescriptor;
    oldDescriptor = Object.getPropertyDescriptor(this.prototype, name);
    if (oldDescriptor != null) {
      options.get || (options.get = oldDescriptor.get);
    }
    if (oldDescriptor != null) {
      options.set || (options.set = oldDescriptor.set);
    }
    Object.defineProperty(this.prototype, name, {
      get: options.get,
      set: options.set,
      configurable: true,
      enumerable: true
    });
    return this;
  };

  Function.prototype.getter = function(name, block) {
    return this.accessor(name, {
      get: block
    });
  };

  Function.prototype.setter = function(name, block) {
    return this.accessor(name, {
      set: block
    });
  };

  registerSuper = function(key, value, klass, sup, mixin) {
    if ((value.__included__ != null) && __indexOf.call(value.__included__, klass) >= 0) {
      return;
    }
    value.__super__ || (value.__super__ = []);
    value.__super__.push(sup);
    value.__included__ || (value.__included__ = []);
    value.__included__.push(klass);
    return value.__name__ = sup.__name__ = "" + mixin.name + "::" + key;
  };

  findCaller = function(caller, proto) {
    var descriptor, k, keys, _i, _len;
    keys = Object.keys(proto);
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      k = keys[_i];
      descriptor = Object.getPropertyDescriptor(proto, k);
      if (descriptor != null) {
        if (descriptor.value === caller) {
          return {
            key: k,
            descriptor: descriptor,
            kind: 'value'
          };
        }
        if (descriptor.get === caller) {
          return {
            key: k,
            descriptor: descriptor,
            kind: 'get'
          };
        }
        if (descriptor.set === caller) {
          return {
            key: k,
            descriptor: descriptor,
            kind: 'set'
          };
        }
      } else {
        if (proto[k] === caller) {
          return {
            key: k
          };
        }
      }
    }
    return {};
  };

  addPrototypeSuperMethod = function(target) {
    if (target["super"] == null) {
      return target["super"] = function() {
        var args, caller, desc, key, kind, value, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        caller = arguments.caller || this["super"].caller;
        if (caller != null) {
          if (caller.__super__ != null) {
            value = caller.__super__[caller.__included__.indexOf(this.constructor)];
            if (value != null) {
              if (typeof value === 'function') {
                return value.apply(this, args);
              } else {
                throw new Error("The super for " + caller._name + " isn't a function");
              }
            } else {
              throw new Error("No super method for " + caller._name);
            }
          } else {
            _ref = findCaller(caller, this.constructor.prototype), key = _ref.key, kind = _ref.kind;
            if (key != null) {
              desc = Object.getPropertyDescriptor(this.constructor.__super__, key);
              if (desc != null) {
                value = desc[kind].apply(this, args);
              } else {
                value = this.constructor.__super__[key].apply(this, args);
              }
              return value;
            } else {
              throw new Error("No super method for " + (caller.name || caller._name));
            }
          }
        } else {
          throw new Error("Super called with a caller");
        }
      };
    }
  };

  addClassSuperMethod = function(o) {
    if (o["super"] == null) {
      return o["super"] = function() {
        var args, caller, desc, key, kind, m, mixin, reverseMixins, value, _i, _j, _len, _len1, _ref, _ref1;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        caller = arguments.caller || this["super"].caller;
        if (caller != null) {
          if (caller.__super__ != null) {
            value = caller.__super__[caller.__included__.indexOf(this)];
            if (value != null) {
              if (typeof value === 'function') {
                return value.apply(this, args);
              } else {
                throw new Error("The super for " + caller._name + " isn't a function");
              }
            } else {
              throw new Error("No super method for " + caller._name);
            }
          } else {
            _ref = findCaller(caller, this), key = _ref.key, kind = _ref.kind;
            reverseMixins = [];
            _ref1 = this.__mixins__;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              m = _ref1[_i];
              reverseMixins.unshift(m);
            }
            if (key != null) {
              for (_j = 0, _len1 = reverseMixins.length; _j < _len1; _j++) {
                m = reverseMixins[_j];
                if (m[key] != null) {
                  mixin = m;
                }
              }
              desc = Object.getPropertyDescriptor(mixin, key);
              if (desc != null) {
                value = desc[kind].apply(this, args);
              } else {
                value = mixin[key].apply(this, args);
              }
              return value;
            } else {
              throw new Error("No super method for " + (caller.name || caller._name));
            }
          }
        } else {
          throw new Error("Super called with a caller");
        }
      };
    }
  };

  Function.prototype.include = function() {
    var bothHaveGet, bothHaveSet, bothHaveValue, excl, excluded, k, keys, mixin, mixins, newDescriptor, newHasAccessor, oldDescriptor, oldHasAccessor, _i, _j, _len, _len1;
    mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    excluded = ['constructor', 'excluded', 'super'];
    this.__mixins__ || (this.__mixins__ = []);
    this.__super__ || (this.__super__ = {});
    this.__super__ = Object.create(this.__super__);
    for (_i = 0, _len = mixins.length; _i < _len; _i++) {
      mixin = mixins[_i];
      this.__mixins__.push(mixin);
      excl = excluded.concat();
      if (mixin.prototype.excluded != null) {
        excl = excl.concat(mixin.prototype.excluded);
      }
      addPrototypeSuperMethod(this.prototype);
      keys = Object.keys(mixin.prototype);
      for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
        k = keys[_j];
        if (__indexOf.call(excl, k) < 0) {
          oldDescriptor = Object.getPropertyDescriptor(this.prototype, k);
          newDescriptor = Object.getPropertyDescriptor(mixin.prototype, k);
          if ((oldDescriptor != null) && (newDescriptor != null)) {
            oldHasAccessor = (oldDescriptor.get != null) || (oldDescriptor.set != null);
            newHasAccessor = (newDescriptor.get != null) || (newDescriptor.set != null);
            bothHaveGet = (oldDescriptor.get != null) && (newDescriptor.get != null);
            bothHaveSet = (oldDescriptor.set != null) && (newDescriptor.set != null);
            bothHaveValue = (oldDescriptor.value != null) && (newDescriptor.value != null);
            if (oldHasAccessor && newHasAccessor) {
              if (bothHaveGet) {
                registerSuper(k, newDescriptor.get, this, oldDescriptor.get, mixin);
              }
              if (bothHaveSet) {
                registerSuper(k, newDescriptor.set, this, oldDescriptor.set, mixin);
              }
              newDescriptor.get || (newDescriptor.get = oldDescriptor.get);
              newDescriptor.set || (newDescriptor.set = oldDescriptor.set);
            } else if (bothHaveValue) {
              registerSuper(k, newDescriptor.value, this, oldDescriptor.value, mixin);
            } else {
              throw new Error("Can't mix accessors and plain values inheritance");
            }
            Object.defineProperty(this.__super__, k, newDescriptor);
          } else if (newDescriptor != null) {
            this.__super__[k] = mixin[k];
          } else if (oldDescriptor != null) {
            Object.defineProperty(this.__super__, k, newDescriptor);
          } else if (this.prototype[k] != null) {
            registerSuper(k, mixin[k], this, this.prototype[k], mixin);
            this.__super__[k] = mixin[k];
          }
          if (newDescriptor != null) {
            Object.defineProperty(this.prototype, k, newDescriptor);
          } else {
            this.prototype[k] = mixin.prototype[k];
          }
        }
      }
      if (typeof mixin.included === "function") {
        mixin.included(this);
      }
    }
    return this;
  };

  Function.prototype.extend = function() {
    var bothHaveGet, bothHaveSet, bothHaveValue, excl, excluded, k, keys, mixin, mixins, newDescriptor, newHasAccessor, oldDescriptor, oldHasAccessor, _i, _j, _len, _len1;
    mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    excluded = ['extended', 'excluded', 'included'];
    this.__mixins__ || (this.__mixins__ = []);
    for (_i = 0, _len = mixins.length; _i < _len; _i++) {
      mixin = mixins[_i];
      this.__mixins__.push(mixin);
      excl = excluded.concat();
      if (mixin.excluded != null) {
        excl = excl.concat(mixin.excluded);
      }
      addClassSuperMethod(this);
      keys = Object.keys(mixin);
      for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
        k = keys[_j];
        if (__indexOf.call(excl, k) < 0) {
          oldDescriptor = Object.getPropertyDescriptor(this, k);
          newDescriptor = Object.getPropertyDescriptor(mixin, k);
          if ((oldDescriptor != null) && (newDescriptor != null)) {
            oldHasAccessor = (oldDescriptor.get != null) || (oldDescriptor.set != null);
            newHasAccessor = (newDescriptor.get != null) || (newDescriptor.set != null);
            bothHaveGet = (oldDescriptor.get != null) && (newDescriptor.get != null);
            bothHaveSet = (oldDescriptor.set != null) && (newDescriptor.set != null);
            bothHaveValue = (oldDescriptor.value != null) && (newDescriptor.value != null);
            if (oldHasAccessor && newHasAccessor) {
              if (bothHaveGet) {
                registerSuper(k, newDescriptor.get, this, oldDescriptor.get, mixin);
              }
              if (bothHaveSet) {
                registerSuper(k, newDescriptor.set, this, oldDescriptor.set, mixin);
              }
              newDescriptor.get || (newDescriptor.get = oldDescriptor.get);
              newDescriptor.set || (newDescriptor.set = oldDescriptor.set);
            } else if (bothHaveValue) {
              registerSuper(k, newDescriptor.value, this, oldDescriptor.value, mixin);
            } else {
              throw new Error("Can't mix accessors and plain values inheritance");
            }
          }
          if (newDescriptor != null) {
            Object.defineProperty(this, k, newDescriptor);
          } else {
            this[k] = mixin[k];
          }
        }
      }
      if (typeof mixin.extended === "function") {
        mixin.extended(this);
      }
    }
    return this;
  };

  Function.prototype.concern = function() {
    var mixins;
    mixins = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.include.apply(this, mixins);
    return this.extend.apply(this, mixins);
  };

  mixins.Aliasable = (function() {
    function Aliasable() {}

    Aliasable.alias = function() {
      var alias, aliases, desc, source, _i, _j, _len, _len1, _results, _results1;
      source = arguments[0], aliases = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      desc = Object.getPropertyDescriptor(this.prototype, source);
      if (desc != null) {
        _results = [];
        for (_i = 0, _len = aliases.length; _i < _len; _i++) {
          alias = aliases[_i];
          _results.push(Object.defineProperty(this.prototype, alias, desc));
        }
        return _results;
      } else {
        if (this.prototype[source] != null) {
          _results1 = [];
          for (_j = 0, _len1 = aliases.length; _j < _len1; _j++) {
            alias = aliases[_j];
            _results1.push(this.prototype[alias] = this.prototype[source]);
          }
          return _results1;
        }
      }
    };

    return Aliasable;

  })();

  mixins.AlternateCase = (function() {
    function AlternateCase() {}

    AlternateCase.toSnakeCase = function(str) {
      return str.replace(/([a-z])([A-Z])/g, "$1_$2").split(/_+/g).join('_').toLowerCase();
    };

    AlternateCase.toCamelCase = function(str) {
      var a, s, w, _i, _len;
      a = str.toLowerCase().split(/[_\s-]/);
      s = a.shift();
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        w = a[_i];
        s = "" + s + (utils.capitalize(w));
      }
      return s;
    };

    AlternateCase.convert = function(alternateCase) {
      var alternate, descriptor, key, value, _ref, _results;
      _ref = this.prototype;
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        alternate = this[alternateCase](key);
        descriptor = Object.getPropertyDescriptor(this.prototype, key);
        if (descriptor != null) {
          _results.push(Object.defineProperty(this.prototype, alternate, descriptor));
        } else {
          _results.push(this.prototype[alternate] = value);
        }
      }
      return _results;
    };

    AlternateCase.snakify = function() {
      return this.convert('toSnakeCase');
    };

    AlternateCase.camelize = function() {
      return this.convert('toCamelCase');
    };

    return AlternateCase;

  })();

  BUILDS = (function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; _i <= 24; i = ++_i) {
      _results.push(new Function("return new arguments[0](" + (((function() {
        var _j, _results1;
        _results1 = [];
        for (j = _j = 0; 0 <= i ? _j <= i : _j >= i; j = 0 <= i ? ++_j : --_j) {
          if (j !== 0) {
            _results1.push("arguments[1][" + (j - 1) + "]");
          }
        }
        return _results1;
      })()).join(",")) + ");"));
    }
    return _results;
  })();

  build = function(klass, args) {
    var f;
    f = BUILDS[args != null ? args.length : 0];
    return f(klass, args);
  };

  mixins.Cloneable = function() {
    var ConcreteCloneable, properties;
    properties = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ConcreteCloneable = (function() {
      function ConcreteCloneable() {}

      if (properties.length === 0) {
        ConcreteCloneable.included = function(klass) {
          return klass.prototype.clone = function() {
            return new klass(this);
          };
        };
      } else {
        ConcreteCloneable.included = function(klass) {
          return klass.prototype.clone = function() {
            var _this = this;
            return build(klass, properties.map(function(p) {
              return _this[p];
            }));
          };
        };
      }

      return ConcreteCloneable;

    })();
  };

  mixins.Cloneable._name = 'Cloneable';

  mixins.Delegation = (function() {
    function Delegation() {}

    Delegation.delegate = function() {
      var delegated, options, prefixed, properties, _case, _i,
        _this = this;
      properties = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), options = arguments[_i++];
      if (options == null) {
        options = {};
      }
      delegated = options.to;
      prefixed = options.prefix;
      _case = options["case"] || mixins.CAMEL_CASE;
      return properties.forEach(function(property) {
        var localAlias;
        localAlias = property;
        if (prefixed) {
          switch (_case) {
            case mixins.SNAKE_CASE:
              localAlias = delegated + '_' + property;
              break;
            case mixins.CAMEL_CASE:
              localAlias = delegated + property.replace(/^./, function(m) {
                return m.toUpperCase();
              });
          }
        }
        return Object.defineProperty(_this.prototype, localAlias, {
          enumerable: true,
          configurable: true,
          get: function() {
            return this[delegated][property];
          },
          set: function(value) {
            return this[delegated][property] = value;
          }
        });
      });
    };

    return Delegation;

  })();

  mixins.Equatable = function() {
    var ConcreteEquatable, properties;
    properties = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ConcreteEquatable = (function() {
      function ConcreteEquatable() {}

      ConcreteEquatable.prototype.equals = function(o) {
        var _this = this;
        return (o != null) && properties.every(function(p) {
          if (_this[p].equals != null) {
            return _this[p].equals(o[p]);
          } else {
            return o[p] === _this[p];
          }
        });
      };

      return ConcreteEquatable;

    })();
  };

  mixins.Equatable._name = 'Equatable';

  mixins.Formattable = function() {
    var ConcretFormattable, classname, properties;
    classname = arguments[0], properties = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return ConcretFormattable = (function() {
      function ConcretFormattable() {}

      if (properties.length === 0) {
        ConcretFormattable.prototype.toString = function() {
          return "[" + classname + "]";
        };
      } else {
        ConcretFormattable.prototype.toString = function() {
          var formattedProperties, p;
          formattedProperties = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = properties.length; _i < _len; _i++) {
              p = properties[_i];
              _results.push("" + p + "=" + this[p]);
            }
            return _results;
          }).call(this);
          return "[" + classname + "(" + (formattedProperties.join(', ')) + ")]";
        };
      }

      ConcretFormattable.prototype.classname = function() {
        return classname;
      };

      return ConcretFormattable;

    })();
  };

  mixins.Formattable._name = 'Formattable';

  DEFAULT_UNGLOBALIZABLE = ['globalizable', 'unglobalizable', 'globalized', 'globalize', 'unglobalize', 'globalizeMember', 'unglobalizeMember', 'keepContext', 'previousValues', 'previousDescriptors'];

  mixins.Globalizable = function(global, keepContext) {
    var ConcreteGlobalizable;
    if (keepContext == null) {
      keepContext = true;
    }
    return ConcreteGlobalizable = (function() {
      function ConcreteGlobalizable() {}

      ConcreteGlobalizable.unglobalizable = DEFAULT_UNGLOBALIZABLE.concat();

      ConcreteGlobalizable.prototype.keepContext = keepContext;

      ConcreteGlobalizable.prototype.globalize = function() {
        var _this = this;
        if (this.globalized) {
          return;
        }
        this.previousValues = {};
        this.previousDescriptors = {};
        this.globalizable.forEach(function(k) {
          if (__indexOf.call(_this.constructor.unglobalizable || ConcreteGlobalizable.unglobalizable, k) < 0) {
            return _this.globalizeMember(k);
          }
        });
        return this.globalized = true;
      };

      ConcreteGlobalizable.prototype.unglobalize = function() {
        var _this = this;
        if (!this.globalized) {
          return;
        }
        this.globalizable.forEach(function(k) {
          if (__indexOf.call(_this.constructor.unglobalizable || ConcreteGlobalizable.unglobalizable, k) < 0) {
            return _this.unglobalizeMember(k);
          }
        });
        this.previousValues = null;
        this.previousDescriptors = null;
        return this.globalized = false;
      };

      ConcreteGlobalizable.prototype.globalizeMember = function(key) {
        var oldDescriptor, selfDescriptor, value, _ref, _ref1;
        oldDescriptor = Object.getPropertyDescriptor(global, key);
        selfDescriptor = Object.getPropertyDescriptor(this, key);
        if (oldDescriptor != null) {
          this.previousDescriptors[key] = oldDescriptor;
        } else if (this[key] != null) {
          if (global[key] != null) {
            this.previousValues[key] = global;
          }
        }
        if (selfDescriptor != null) {
          if (keepContext) {
            if ((selfDescriptor.get != null) || (selfDescriptor.set != null)) {
              selfDescriptor.get = (_ref = selfDescriptor.get) != null ? _ref.bind(this) : void 0;
              selfDescriptor.set = (_ref1 = selfDescriptor.set) != null ? _ref1.bind(this) : void 0;
            } else if (typeof selfDescriptor.value === 'function') {
              selfDescriptor.value = selfDescriptor.value.bind(this);
            }
          }
          return Object.defineProperty(global, key, selfDescriptor);
        } else {
          value = this[key];
          if (typeof value === 'function' && keepContext) {
            value = value.bind(this);
          }
          return Object.defineProperty(global, key, {
            value: value,
            enumerable: true,
            writable: true,
            configurable: true
          });
        }
      };

      ConcreteGlobalizable.prototype.unglobalizeMember = function(key) {
        if (this.previousDescriptors[key] != null) {
          return Object.defineProperty(global, key, this.previousDescriptors[key]);
        } else if (this.previousValues[key] != null) {
          return global[key] = this.previousValues[key];
        } else {
          return global[key] = void 0;
        }
      };

      return ConcreteGlobalizable;

    })();
  };

  mixins.Globalizable._name = 'Globalizable';

  mixins.HasAncestors = function(options) {
    var ConcreteHasAncestors, through;
    if (options == null) {
      options = {};
    }
    through = options.through || 'parent';
    return ConcreteHasAncestors = (function() {
      function ConcreteHasAncestors() {}

      ConcreteHasAncestors.getter('ancestors', function() {
        var ancestors, parent;
        ancestors = [];
        parent = this[through];
        while (parent != null) {
          ancestors.push(parent);
          parent = parent[through];
        }
        return ancestors;
      });

      ConcreteHasAncestors.getter('selfAndAncestors', function() {
        return [this].concat(this.ancestors);
      });

      ConcreteHasAncestors.ancestorsScope = function(name, block) {
        return this.getter(name, function() {
          return this.ancestors.filter(block, this);
        });
      };

      return ConcreteHasAncestors;

    })();
  };

  mixins.HasAncestors._name = 'HasAncestors';

  mixins.HasCollection = function(plural, singular) {
    var ConcreteHasCollection, pluralPostfix, singularPostfix;
    pluralPostfix = plural.replace(/^./, function(s) {
      return s.toUpperCase();
    });
    singularPostfix = singular.replace(/^./, function(s) {
      return s.toUpperCase();
    });
    return ConcreteHasCollection = (function() {
      function ConcreteHasCollection() {}

      ConcreteHasCollection.extend(mixins.Aliasable);

      ConcreteHasCollection["" + plural + "Scope"] = function(name, block) {
        return this.getter(name, function() {
          return this[plural].filter(block, this);
        });
      };

      ConcreteHasCollection.getter("" + plural + "Size", function() {
        return this[plural].length;
      });

      ConcreteHasCollection.alias("" + plural + "Size", "" + plural + "Length", "" + plural + "Count");

      ConcreteHasCollection.prototype["has" + singularPostfix] = function(item) {
        return __indexOf.call(this[plural], item) >= 0;
      };

      ConcreteHasCollection.alias("has" + singularPostfix, "contains" + singularPostfix);

      ConcreteHasCollection.getter("has" + pluralPostfix, function() {
        return this[plural].length > 0;
      });

      ConcreteHasCollection.prototype["add" + singularPostfix] = function(item) {
        if (!this["has" + singularPostfix](item)) {
          return this[plural].push(item);
        }
      };

      ConcreteHasCollection.prototype["remove" + singularPostfix] = function(item) {
        if (this["has" + singularPostfix](item)) {
          return this[plural].splice(this["find" + singularPostfix](item), 1);
        }
      };

      ConcreteHasCollection.prototype["find" + singularPostfix] = function(item) {
        return this[plural].indexOf(item);
      };

      ConcreteHasCollection.alias("find" + singularPostfix, "indexOf" + singularPostfix);

      return ConcreteHasCollection;

    })();
  };

  mixins.HasCollection._name = 'HasCollection';

  mixins.HasNestedCollection = function(name, options) {
    var ConcreteHasNestedCollection, through;
    if (options == null) {
      options = {};
    }
    through = options.through;
    if (through == null) {
      throw new Error('missing through option');
    }
    return ConcreteHasNestedCollection = (function() {
      function ConcreteHasNestedCollection() {}

      ConcreteHasNestedCollection["" + name + "Scope"] = function(scopeName, block) {
        return this.getter(scopeName, function() {
          return this[name].filter(block, this);
        });
      };

      ConcreteHasNestedCollection.getter(name, function() {
        var items;
        items = [];
        this[through].forEach(function(item) {
          items.push(item);
          if (item[name] != null) {
            return items = items.concat(item[name]);
          }
        });
        return items;
      });

      return ConcreteHasNestedCollection;

    })();
  };

  mixins.HasNestedCollection._name = 'HasNestedCollection';

  mixins.Memoizable = (function() {
    function Memoizable() {}

    Memoizable.prototype.memoized = function(prop) {
      var _ref;
      if (this.memoizationKey() === this.__memoizationKey__) {
        return ((_ref = this.__memo__) != null ? _ref[prop] : void 0) != null;
      } else {
        this.__memo__ = {};
        return false;
      }
    };

    Memoizable.prototype.memoFor = function(prop) {
      return this.__memo__[prop];
    };

    Memoizable.prototype.memoize = function(prop, value) {
      this.__memo__ || (this.__memo__ = {});
      this.__memoizationKey__ = this.memoizationKey();
      return this.__memo__[prop] = value;
    };

    Memoizable.prototype.memoizationKey = function() {
      return this.toString();
    };

    return Memoizable;

  })();

  mixins.Parameterizable = function(method, parameters, allowPartial) {
    var ConcreteParameterizable;
    if (allowPartial == null) {
      allowPartial = false;
    }
    return ConcreteParameterizable = (function() {
      function ConcreteParameterizable() {}

      ConcreteParameterizable.included = function(klass) {
        var f;
        f = function() {
          var args, firstArgumentIsObject, k, keys, n, o, output, strict, v, value, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), strict = arguments[_i++];
          if (typeof strict === 'number') {
            args.push(strict);
            strict = false;
          }
          output = {};
          o = arguments[0];
          n = 0;
          firstArgumentIsObject = (o != null) && typeof o === 'object';
          for (k in parameters) {
            v = parameters[k];
            value = firstArgumentIsObject ? o[k] : arguments[n++];
            output[k] = parseFloat(value);
            if (isNaN(output[k])) {
              if (strict) {
                keys = ((function() {
                  var _j, _len, _results;
                  _results = [];
                  for (_j = 0, _len = parameters.length; _j < _len; _j++) {
                    k = parameters[_j];
                    _results.push(k);
                  }
                  return _results;
                })()).join(', ');
                throw new Error("" + output + " doesn't match pattern {" + keys + "}");
              }
              if (allowPartial) {
                delete output[k];
              } else {
                output[k] = v;
              }
            }
          }
          return output;
        };
        klass[method] = f;
        return klass.prototype[method] = f;
      };

      return ConcreteParameterizable;

    })();
  };

  mixins.Parameterizable._name = 'Parameterizable';

  mixins.Poolable = (function() {
    function Poolable() {}

    Poolable.extended = function(klass) {
      klass.usedInstances = [];
      return klass.unusedInstances = [];
    };

    Poolable.get = function(options) {
      var instance;
      if (options == null) {
        options = {};
      }
      if (this.unusedInstances.length > 0) {
        instance = this.unusedInstances.shift();
      } else {
        instance = new this;
      }
      this.usedInstances.push(instance);
      instance.init(options);
      return instance;
    };

    Poolable.release = function(instance) {
      var index;
      if (__indexOf.call(this.usedInstances, instance) < 0) {
        throw new Error("Can't release an unused instance");
      }
      index = this.usedInstances.indexOf(instance);
      this.usedInstances.splice(index, 1);
      return this.unusedInstances.push(instance);
    };

    Poolable.prototype.init = function(options) {
      var k, v, _results;
      if (options == null) {
        options = {};
      }
      _results = [];
      for (k in options) {
        v = options[k];
        _results.push(this[k] = v);
      }
      return _results;
    };

    Poolable.prototype.dispose = function() {
      return this.constructor.release(this);
    };

    return Poolable;

  })();

  mixins.Sourcable = function() {
    var ConcreteSourcable, name, signature;
    name = arguments[0], signature = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return ConcreteSourcable = (function() {
      var sourceFor;

      function ConcreteSourcable() {}

      sourceFor = function(value) {
        var isArray;
        switch (typeof value) {
          case 'object':
            isArray = Object.prototype.toString.call(value).indexOf('Array') !== -1;
            if (isArray) {
              return "[" + (value.map(function(el) {
                return sourceFor(el);
              })) + "]";
            } else {
              if (value.toSource != null) {
                return value.toSource();
              } else {
                return value;
              }
            }
            break;
          case 'string':
            return "'" + (value.replace("'", "\\'")) + "'";
          default:
            return value;
        }
      };

      ConcreteSourcable.prototype.toSource = function() {
        var arg, args;
        args = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = signature.length; _i < _len; _i++) {
            arg = signature[_i];
            _results.push(this[arg]);
          }
          return _results;
        }).call(this)).map(function(o) {
          return sourceFor(o);
        });
        return "new " + name + "(" + (args.join(',')) + ")";
      };

      return ConcreteSourcable;

    })();
  };

  mixins.Sourcable._name = 'Sourcable';

}).call(this);

/*
//@ sourceMappingURL=mixins.js.map
*/