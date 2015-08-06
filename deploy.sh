#!/bin/bash
cd client && time webpack --config webpack.release.js --progress --colors
time bundle exec rake db:migrate RAILS_ENV=production
time bundle exec rake assets:clobber assets:precompile
sudo service unicorn restart
sudo service nginx restart
