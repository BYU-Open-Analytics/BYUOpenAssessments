#!/bin/bash
cd client && webpack --config webpack.release.js --progress
bundle exec rake assets:precompile
rails s
