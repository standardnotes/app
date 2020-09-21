class StandardNotesFormatter < ActiveSupport::Logger::SimpleFormatter
  def call(severity, timestamp, _progname, message)
    {
      level: severity,
      time: timestamp,
      message: message,
      ddsource: ['ruby'],
    }.to_json + "\n"
  end
end
