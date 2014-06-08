require 'colors'

express = require 'express'
path = require 'path'
app = express()
env = process.env['NODE_ENV'] ? 'dev'
root = path.join(__dirname, env)

app.use(express.static root)

app.get '/css/fonts/*', (req, res) -> res.sendfile 'fonts/' + req.params[0], {root}
app.get '/*', (req, res) ->
  p = req.params[0] ? 'index.html'
  res.sendfile p, {root}

app.listen 3456
console.log 'Server listening on port 3456'.cyan
