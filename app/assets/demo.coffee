transit_to = ($button, icon) ->
  $button.find('i').addClass('out').on 'webkitAnimationEnd oanimationend msAnimationEnd animationend', ->
    $button.find('.out').remove()
    $button.removeClass('swap-icons').find('.in').removeClass('in')

  $button.append "<i class='fa fa-#{icon} in'></i>"
  $button.addClass 'swap-icons'

$('button').on 'click', ->
  $button = $(this)
  transit_to $button, 'cog'
  setTimeout ->
    transit_to $button, 'check'
  , 1000
