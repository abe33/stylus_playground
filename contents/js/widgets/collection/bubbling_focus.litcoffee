This widgets decorates all the dom path until the current element with
a `focus` class when the element have the focus.

    widgets.$define 'bubbling_focus', ->
      $element = this
      blur = -> $('.focus').removeClass('focus')

      $element.on 'blur', -> blur()
      $element.on 'focus', ->
        blur()
        $element.parents().addClass('focus')
