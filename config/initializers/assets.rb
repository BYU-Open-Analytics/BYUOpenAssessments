# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )

Rails.application.config.assets.precompile += %w( html5shiv.js open_comm.js evaluations.js app_admin_wp_bundle.js app_wp_bundle.js styles_wp_bundle.js)
Rails.application.config.assets.precompile += %w( app_admin_wp_bundle.css retina.png bare.css themes/* )