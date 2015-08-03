#!/bin/bash
cd client && time webpack --config webpack.release.js --progress --colors
time bundle exec rake assets:precompile
rails s
