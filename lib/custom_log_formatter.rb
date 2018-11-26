class CustomLogFormatter < ActiveSupport::Logger::SimpleFormatter
  SEVERITY_TO_COLOR_MAP = {'DEBUG'=>'0;37', 'INFO'=>'32', 'WARN'=>'33', 'ERROR'=>'31', 'FATAL'=>'31', 'UNKNOWN'=>'37'}

  IPRegexp = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/
  FilteredString = '**FILTERED**'

  def call(severity, time, progname, msg)
    formatted_severity = sprintf("%-5s","#{severity}")
    formatted_time = time.strftime("%Y-%m-%d %H:%M:%S.") << time.usec.to_s[0..2].rjust(3)
    color = SEVERITY_TO_COLOR_MAP[severity]

    "\033[0;37m#{formatted_time}\033[0m [\033[#{color}m#{formatted_severity}\033[0m] #{filter_ip(msg.strip)} (pid:#{$$})\n"
  end

  def filter_ip(msg)
    msg.gsub(IPRegexp, FilteredString)
  end
end
