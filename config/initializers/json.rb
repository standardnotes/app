# fix for JSON deprecation warnings. See: https://github.com/flori/json/issues/399#issuecomment-734863279

module JSON
  module_function

  def parse(source, opts = {})
    Parser.new(source, **opts).parse
  end
end
