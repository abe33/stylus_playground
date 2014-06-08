widgets.define 'modal', mixins: [
  widgets.Activable
], class Modal
  @overlay: null
  @active_modals: []

  @last_active_modal: -> @active_modals[0]

  @show_overlay: ->
    @overlay.addClass 'visible'

  @hide_overlay: ->
    @overlay.removeClass 'visible'

  # That method is mainly for development purpose.
  @close_all: ->
    for modal in @active_modals
      modal.hide()
      modal.unbind_overlay()

    @active_modals = []
    @hide_overlay()

  constructor: (trigger) ->
    @constructor.overlay ||= $('.overlay')

    @trigger = $(trigger)
    @target = $(@trigger.data('target'))
    @modal_class = @trigger.data('class')
    @no_button = @trigger.data('confirm')

  on_activate: ->
    @trigger.click (e) =>
      e.preventDefault()
      e.stopImmediatePropagation()

      @open()

  on_deactivate: ->
    @trigger.off()

  open: ->
    if @constructor.active_modals.length > 0
      @constructor.last_active_modal().unbind_overlay()
      @constructor.last_active_modal().hide()
    else
      @constructor.show_overlay()

    @init_close_button()
    @show()
    @bind_overlay()
    @constructor.active_modals.unshift(this)

  close: ->
    @constructor.active_modals.shift()

    @hide()
    @unbind_overlay()

    if @constructor.active_modals.length > 0
      @constructor.last_active_modal().bind_overlay()
      @constructor.last_active_modal().show()
    else
      @constructor.hide_overlay()

  show: ->
    @constructor.overlay.addClass('visible')
    html2canvas document.body, {
      allowTaint: true
      background: 'grey'
      onrendered: (@canvas) =>
        id = 'foo'
        @canvas.id = id
        @target.prepend(@canvas)
        @target.addClass('visible')
        @target.addClass(@modal_class) if @modal_class?
        @target.trigger('modal:opened')

        $(@canvas).css {
          top: '-' + @target.offset().top + 'px'
          left: '-' + @target.offset().left + 'px'
        }
        stackBlurCanvasRGB(id, 0, 0, @canvas.width, @canvas.height, 60)
    }

  hide: ->
    @target.removeClass('visible')
    @target.removeClass(@modal_class) if @modal_class?
    @constructor.overlay.removeClass('visible')
    @target.find('canvas').remove()
    @close_button.off()

  bind_overlay: ->
    @constructor.overlay.bind 'click', => @close()

  unbind_overlay: ->
    @constructor.overlay.unbind 'click'

  init_close_button: ->
    unless @close_button?
      @close_button = @target.find('.modal-close-button')

      if @close_button.length is 0
        @close_button = $('<button class="modal-close-button"><i class="fa fa-times"/></div>')
        @target.prepend @close_button

    unless @no_button
      @close_button.show()
      @close_button.click (e) =>
        e.preventDefault()
        e.stopImmediatePropagation()

        @close()
    else
      @close_button.hide()
