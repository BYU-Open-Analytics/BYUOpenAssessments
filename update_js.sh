#!/bin/bash
cd client && webpack --config webpack.release.js --progress --colors
bundle exec rake assets:precompile
rails s
