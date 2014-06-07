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
    @constructor.overlay ||= $('#overlay')

    @trigger = $(trigger)
    @target = $(@trigger.data('target'))

    @trigger.click (e) =>
      e.preventDefault()
      e.stopImmediatePropagation()

      @open()

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
    html2canvas document.body, {
      allowTaint: true
      background: 'grey'
      onrendered: (@canvas) =>
        id = 'foo'
        @canvas.id = id
        @target.prepend(@canvas).addClass('visible')
        $(@canvas).css {
          top: '-' + @target.offset().top + 'px'
          left: '-' + @target.offset().left + 'px'
        }
        stackBlurCanvasRGB(id, 0, 0, @canvas.width, @canvas.height, 50)
    }

  hide: ->
    @target.find('#canvas').remove()

  bind_overlay: ->
    @constructor.overlay.bind 'click', => @close_button.click()

  unbind_overlay: ->
    @constructor.overlay.unbind 'click'

  init_close_button: ->
    unless @close_button?
      @close_button = @target.find('.modal-close-button')

      if @close_button.length is 0
        @close_button = $('<button class="modal-close-button"><i class="icon-close"/></div>')
        @target.prepend @close_button

      @close_button.click (e) =>
        e.preventDefault()
        e.stopImmediatePropagation()

        @constructor.close_all()
