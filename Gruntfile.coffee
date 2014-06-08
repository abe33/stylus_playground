{spawn} = require 'child_process'
{print} = require 'util'
Q = require 'q'
CSON = require('cson')

run = (command) ->
  defer = Q.defer()
  [command, args...] = command.split(/\s+/g)
  exe = spawn command, args
  exe.stdout.on 'data', (data) -> print data
  exe.stderr.on 'data', (data) -> print data
  exe.on 'exit', (status) ->
    if status is 0 then defer.resolve(status) else defer.reject(status)
  defer.promise

merge = (a,b) ->
  o = {}
  o[k] = v for k,v of a
  o[k] = v for k,v of b
  o

process_output_names = (paths, from, to, ext) ->
  output = {}
  for p in paths
    new_path = p.replace(from, to)
    [new_path] = new_path.split('.')
    output["#{new_path}.#{ext}"] = p

  output

module.exports = (grunt) ->

  COFFEESCRIPT_PATHS = [
    'app/assets/javascripts/widgets/index.coffee'
    'app/assets/javascripts/widgets/hash.coffee'
    'app/assets/javascripts/widgets/mixins/*.coffee'
    'app/assets/javascripts/widgets/widgets/*.coffee'
    'app/assets/javascripts/boot.coffee'
  ]
  STYLESHEETS_PARTIALS = [
    'app/assets/stylesheets/imports'
  ]
  STYLESHEETS_PATHS = [
    'app/assets/stylesheets/main.styl'
  ]

  JADE_PATHS = [
    'app/views/index.jade'
    'app/views/alerts.jade'
    'app/views/buttons.jade'
    'app/views/check_boxes.jade'
    'app/views/grid.jade'
    'app/views/icon_owners.jade'
    'app/views/input_groups.jade'
    'app/views/inputs.jade'
    'app/views/modals.jade'
    'app/views/navbar.jade'
  ]

  DEFAULT_JADE_DATA = merge(
    CSON.parseFileSync('./data/navigation.cson'),
    CSON.parseFileSync('./data/config.cson')
  )

  grunt.initConfig

    #    ##      ##    ###    ########  ######  ##     ##
    #    ##  ##  ##   ## ##      ##    ##    ## ##     ##
    #    ##  ##  ##  ##   ##     ##    ##       ##     ##
    #    ##  ##  ## ##     ##    ##    ##       #########
    #    ##  ##  ## #########    ##    ##       ##     ##
    #    ##  ##  ## ##     ##    ##    ##    ## ##     ##
    #     ###  ###  ##     ##    ##     ######  ##     ##
    watch:
      config:
        files: ['Gruntfile.coffee']
        options:
          reload: true

      views:
        files: ['app/views/**/*.jade']
        tasks: ['jade']
        options:
          livereload: true
          livereloadOnError: false

      templates:
        files: ['app/assets/javascripts/templates/**/*.jade']
        tasks: ['jade']
        options:
          livereload: true
          livereloadOnError: false

      stylesheets:
        files: ['app/assets/stylesheets/**/*.styl']
        tasks: ['stylus']
        options:
          livereload: true
          livereloadOnError: false

      scripts:
        files: ['app/assets/javascripts/**/*.coffee']
        tasks: ['compile']
        options:
          livereload: true
          livereloadOnError: false

      csons:
        files: ['app/data/**/*.cson', 'config/**/*.cson']
        tasks: ['cson', 'jade']
        options:
          livereload: true
          livereloadOnError: false



    #     ######   #######  ######## ######## ######## ########
    #    ##    ## ##     ## ##       ##       ##       ##
    #    ##       ##     ## ##       ##       ##       ##
    #    ##       ##     ## ######   ######   ######   ######
    #    ##       ##     ## ##       ##       ##       ##
    #    ##    ## ##     ## ##       ##       ##       ##
    #     ######   #######  ##       ##       ######## ########

    # Lint
    coffeelint:
      src: ['app/assets/javascripts/*.coffee']
      options:
        no_backticks:
          level: 'ignore'
        no_empty_param_list:
          level: 'error'
        max_line_length:
          level: 'ignore'

    # Compilation
    coffee:
      options:
        bare: true
        join: true

      dev:
        files:
          'dev/js/main.js': COFFEESCRIPT_PATHS

      build:
        files:
          'build/js/main.js': COFFEESCRIPT_PATHS

    # Copy Files
    copy:
      dev:
        files:
          'dev/js/jquery.js': 'vendor/js/jquery-2.1.1.js'
          'dev/js/html2canvas.js': 'vendor/js/html2canvas.js'
          'dev/js/StackBlur.js': 'vendor/js/StackBlur.js'
          'dev/js/mixins.js': 'vendor/js/mixins.js'

      build:
        files:
          'build/js/jquery.js': 'vendor/js/jquery-2.1.1.min.js'
          'build/js/html2canvas.js': 'vendor/js/html2canvas.js'
          'build/js/StackBlur.js': 'vendor/js/StackBlur.js'
          'build/js/mixins.js': 'vendor/js/mixins.js'

    # Uglification
    uglify:
      build:
        files:
          'build/js/main.js': 'build/js/main.js'
          'build/js/html2canvas.js': 'vendor/js/html2canvas.js'
          'build/js/StackBlur.js': 'vendor/js/StackBlur.js'

    # CSON Files Compilation
    cson:
      dev:
        options:
            pretty: true
        files: {}

      build:
        options:
          pretty: false
        files: {}

    #          ##    ###    ########  ########
    #          ##   ## ##   ##     ## ##
    #          ##  ##   ##  ##     ## ##
    #          ## ##     ## ##     ## ######
    #    ##    ## ######### ##     ## ##
    #    ##    ## ##     ## ##     ## ##
    #     ######  ##     ## ########  ########
    jade:
      dev:
        options:
          pretty: true
          compiledDebug: true
          data: -> merge(DEFAULT_JADE_DATA, debug: true)

        files: process_output_names(JADE_PATHS, 'app/views', 'dev', 'html')

      build:
        options:
          pretty: false
          compiledDebug: false
          data: -> merge(DEFAULT_JADE_DATA, debug: false)

        files: process_output_names(JADE_PATHS, 'app/views', 'build', 'html')

    #     ######  ######## ##    ## ##       ##     ##  ######
    #    ##    ##    ##     ##  ##  ##       ##     ## ##    ##
    #    ##          ##      ####   ##       ##     ## ##
    #     ######     ##       ##    ##       ##     ##  ######
    #          ##    ##       ##    ##       ##     ##       ##
    #    ##    ##    ##       ##    ##       ##     ## ##    ##
    #     ######     ##       ##    ########  #######   ######
    stylus:
      dev:
        options:
          debug: true
          linenos: true
          compress: false
          paths: STYLESHEETS_PARTIALS
        files:
          'dev/css/main.css': STYLESHEETS_PATHS

      build:
        options:
          compress: true
          paths: STYLESHEETS_PARTIALS
        files:
          'build/css/main.css': STYLESHEETS_PATHS

  #    ########    ###     ######  ##    ##  ######
  #       ##      ## ##   ##    ## ##   ##  ##    ##
  #       ##     ##   ##  ##       ##  ##   ##
  #       ##    ##     ##  ######  #####     ######
  #       ##    #########       ## ##  ##         ##
  #       ##    ##     ## ##    ## ##   ##  ##    ##
  #       ##    ##     ##  ######  ##    ##  ######

  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-jade')
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-coffeelint')
  grunt.loadNpmTasks('grunt-react')

  grunt.registerMultiTask 'copy', ->
    for dest,src of @data.files
      run("cp -R #{src} #{dest}")
      .then ->
        console.log "Copied #{src.cyan} --> #{dest.cyan}"
      .fail (reason) ->
        console.log reason.toString().red

  grunt.registerMultiTask 'cson', ->
    for dest,src of @data.files
      data = CSON.parseFileSync(src)
      if @data.options.pretty
        grunt.file.write(dest, JSON.stringify(data, null, ' '))
      else
        grunt.file.write(dest, JSON.stringify(data))
      console.log "Compiled #{src.cyan} --> #{dest.cyan}"

  grunt.registerTask('compile:dev', [
    'coffeelint'
    'coffee:dev'
  ])

  grunt.registerTask('compile:build', [
    'coffeelint'
    'coffee:build'
    'uglify:build'
  ])

  grunt.registerTask('dev', [
    'stylus:dev'
    'compile:dev'
    'cson:dev'
    'copy:dev'
    'jade:dev'
  ])

  grunt.registerTask('build', [
    'stylus:build'
    'compile:build'
    'cson:build'
    'copy:build'
    'jade:build'
  ])

  grunt.registerTask('compile', ['compile:dev','compile:build'])
  grunt.registerTask('default', ['dev', 'build'])
