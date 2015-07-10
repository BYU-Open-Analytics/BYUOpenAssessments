
if ENV["RAILS_ENV"] == "development"

  worker_processes 1
  timeout 7200

else

  # Use this unicorn configuration for zero downtime deployment to other services (ie AWS)
  # See http://unicorn.bogomips.org/Unicorn/Configurator.html for complete documentation.

   env = ENV["RAILS_ENV"] || "development" # Set environment to development unless something else is specified
  
   worker_processes 4
  
   preload_app true # Preload our app for more speed
  
   timeout 1800 # nuke workers after 30 seconds instead of 60 seconds (the default)
  
   pid "/tmp/unicorn.byuopenassessments.pid"
  
   if env == "production" || env == 'staging'
     listen "/tmp/unicorn.byuopenassessments.sock", :backlog => 64
  
     # working_directory "/u/apps/byuopenassessments/current"
     working_directory "/home/ec2-user/BYUOpenAssessments"

     user 'ec2-user', 'ec2-user'
  
     shared_path = "/home/ec2-user/BYUOpenAssessmentsShared"# feel free to point this anywhere accessible on the filesystem
  
     stderr_path "/home/ec2-user/BYUOpenAssessmentsShared/log/unicorn.stderr.log"
     stdout_path "/home/ec2-user/BYUOpenAssessmentsShared/log/unicorn.stdout.log"
  
     before_exec do |server|
       ENV["BUNDLE_GEMFILE"] = "/home/ec2-user/BYUOpenAssessments/Gemfile"
     end
   end
  
   before_fork do |server, worker|
     # The following is highly recomended for Rails + "preload_app true".
     # There's no need for the master process to hold a connection.
     if defined?(ActiveRecord::Base)
       ActiveRecord::Base.connection.disconnect!
     end
  
     # Before forking, kill the master process that belongs to the .oldbin PID.
     # This enables 0 downtime deploys.
     old_pid = "/tmp/unicorn.byuopenassessments.pid.oldbin"
     if File.exists?(old_pid) && server.pid != old_pid
       begin
         Process.kill("QUIT", File.read(old_pid).to_i)
       rescue Errno::ENOENT, Errno::ESRCH
         # someone else did our job for us
       end
     end
   end
  
   after_fork do |server, worker|
     # The following is *required* for Rails + "preload_app true",
     if defined?(ActiveRecord::Base)
       ActiveRecord::Base.establish_connection
     end
   end

end
