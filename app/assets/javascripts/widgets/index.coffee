# Internet: Widgets are small code snippets that are executed on DOM elements
# to provides new behaviors or decorates the element with new markup.
#
# The `__widgets__` object stores the widgets registered using the
# `widgets.define` method.
__widgets__ = {}

# Internal: The `__instances__` object stores the returned instances of the
# various widgets, stored by widget type and then mapped with their target DOM
# element as key.
__instances__ = {}

# Public: The `widgets` module is in fact a function you can use to register
# the widgets to use in a page.
#
# For instance, the following snippet:
#
# ```coffeescript
# widgets 'checkbox', 'input[type=checkbox]', on: 'load'
# ```
#
# Will call `widgets.checkbox` with each node matching the selector
# `input[type=checkbox]` on the `load` event.
#
# You can also pass a function as the last argument that will be called
# for every elements handled by the defined widget after its handling by
# the widget function.
widgets = (name, selector, options={}, block) ->
  unless __widgets__[name]?
    throw new Error "Unable to find widget '#{name}'"

  # The options specific to the widget registration and activation are
  # extracted from the `options object.
  events = options.on ? 'init'
  if_condition = options.if
  unless_condition = options.unless
  media_condition = options.media

  delete options.on
  delete options.if
  delete options.unless
  delete options.media

  # Events can be passed as a string with event names separated with spaces.
  events = events.split /\s+/g if typeof events is 'string'

  # The widgets instances are stored in a Hash with the DOM element they
  # target as key. The instances hashes are stored per widget type.
  instances = __instances__[name] ||= new widgets.Hash

  # This method execute a test condition for the given element. The condition
  # can be either a function or a value converted to boolean.
  test_condition = (condition, element) ->
    if typeof condition is 'function'
      !!condition(element)
    else
      !!condition

  # The DOM elements handled by a widget will receive a `*-handled` class
  # to differenciate them from unhandled elements.
  handled_class = "#{name}-handled"

  # This method will test if an element can be handled by the current widget.
  # It will test for both the handled class presence and the widget
  # conditions. Note that if both the `if` and `unless` conditions
  # are passed in the options object they will be tested as both part
  # of a single `&&` condition.
  can_be_handled = (element) ->
    res = element.className.indexOf(handled_class) is -1
    res &&= test_condition(if_condition, element) if if_condition?
    res &&= not test_condition(unless_condition, element) if unless_condition?
    res

  # If a media condition have been specified, the widget activation will be
  # conditionned based on the result of this condition. The condition is
  # verified each time the `resize` event is triggered.
  if media_condition?

    # The media condition can be either a boolean value, a function, or,
    # to simplify the setup, an object with `min` and `max` property containing
    # the minimal and maximal window width where the widget is activated.
    if typeof media_condition is 'object'
      {min, max} = media_condition

      media_condition = ->
        res = true
        res = res and window.innerWidth >= min if min?
        res = res and window.innerWidth <= max if max?
        res

      # The media handler is registered on the `resize` event
      # of the `window` object.
      media_handler = (name) ->
        return unless name?

        condition_matched = test_condition(media_condition)
        if condition_matched
          widgets.activate(name)
        else
          widgets.deactivate(name)

      $(window).on 'resize', -> media_handler name

  # The `handler` function is the function registered on specified events and
  # will proceed to the creation of the widgets if the conditions are met.
  handler = ->
    $elements = $(selector)
    Array::forEach.call $elements, (element) ->
      return unless can_be_handled element

      res = __widgets__[name] element, Object.create(options), $elements
      $(element).addClass handled_class
      instances.set element, res if res?

      # An event is then dispatched.
      $(document).trigger("#{name}:handled", element, res, options)

      # And the passed-in block is called with the element and its widget.
      # Note that the block is called before the activation of the widget.
      block?.call element, element, res, options

    if media_condition?
      media_handler(name)
    else
      widgets.activate(name)

  # For each event specified, the handler is registered as listener.
  # A special case is the `init` event that simply mean to trigger the
  # handler as soon a the function is called.
  events.forEach (event) ->
    switch event
      when 'init' then handler()
      when 'load', 'resize'
        $(window).on event, handler
      else
        $(document).on event, handler

# Public: Creates a new widget usable through the `widgets` method.
# Basically, a widget is defined using a `name`, and a `block` function
# that will be called for each DOM elements targeted by the widget.
# The `block` function should have the following signature:
#
# ```coffee
# (element, options={}, block=->) ->
# ```
#
# The `options` object will contains all the options passed to the `widgets`
# method except the `on`, `if`, `unless` and `media` ones.
widgets.define = (name, options={}, block=->) ->
  [block, options] = [options, {}] if typeof options is 'function'

  has_proto = options.proto?
  has_mixins = options.mixins?

  if has_proto or has_mixins
    block.prototype = options.proto if has_proto
    options.mixins.forEach((mixin) -> block.include(mixin)) if has_mixins

    factory = (element) -> new block(element)

    __widgets__[name] = factory
  else
    __widgets__[name] = block

# A shorthand method to register a jQuery widget.
# When triggered, if a method of the specified `name` exists on the jQuery
# object it will called with the constructed options.
# The passed-in block acts as a jquery plugin function with some additional
# parameters, it will be called with the jQuery object as `this` and will
# receive the same arguments as a normal widget's block.
widgets.$define = (name, base_options={}, block) ->
  if typeof base_options is 'function'
    [base_options, block] = [{}, base_options]

  __widgets__[name] = (element, options={}) ->
    options[k] = v for k,v of base_options when not options[k]?

    $element = $(element)
    res = $element[name]?(options)
    block?.call($element, element, res, options)

# The `widgets.release` method can be used to completely remove the widgets
# of the given `name` from the page.
# It's the widget responsibility to clean up its dependencies during
# the `dispose` call.
widgets.release = (name) ->
  __instances__[name].each (value) -> value?.dispose?()

# Activates all the widgets instances of type `name`.
widgets.activate = (name) ->
  __instances__[name].each (value) ->
    return unless value?
    value.activate?() unless value.active

# Deactivates all the widgets instances of type `name`.
widgets.deactivate = (name) ->
  __instances__[name].each (value) ->
    return unless value?
    value.deactivate?() if not value.active? or value.active

# The `deprecated` method serve to flag a function as deprecated. The
# `deprecated` method creates a new error and gets its stack trace in order
# to track the line and the files where the deprecated method was called.
#
# ```coffee
# myFunc = ->
#   widgets.deprecated '''
#     myFunc is deprecated and may be removed in later version.
#     Use myOtherFunc instead.
#   '''
# ```
widgets.deprecated = (message) ->
  parseLine = (line) ->
    if line.indexOf('@') > 0
      if line.indexOf('</') > 0
        [m, o, f] = /<\/([^@]+)@(.)+$/.exec line
      else
        [m, f] = /@(.)+$/.exec line
    else
      if line.indexOf('(') > 0
        [m, o, f] = /at\s+([^\s]+)\s*\(([^\)])+/.exec line
      else
        [m, f] = /at\s+([^\s]+)/.exec line

    [o,f]

  e = new Error()
  caller = ''
  if e.stack?
    s = e.stack.split('\n')
    [callerName, callerFile] = parseLine s[3]

    caller = if callerName
      " (called from #{ callerName } at #{ callerFile })"
    else
       "(called from #{ callerFile })"

  console.log "DEPRECATION WARNING: #{ message }#{ caller }"

widgets.get_instances = (name) ->
  if name?
    __instances__[name].values
  else
    results = []
    results = results.concat(h.values) for k,h of __instances__
    results

widgets.uregister_all = ->
  __widgets__ = {}

widgets.destroy_all = (name) ->
  destroy = (n) ->
    widgets.deactivate(n)
    __instances__[n] = new widgets.Hash

  if name?
    destroy(name)
  else
    destroy(name) for name of __instances__

# The module version is stored in the module.
widgets.version = '0.0.1'

# Finally the `widgets` module is added on global using various aliases..
window.widgets = widgets
window.widget = widgets
window.$w = widgets
