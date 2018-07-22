describe("date filter", function() {
  beforeEach(module('app'));
  var $filter;

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('returns time', function() {
    var dateTime = $filter('appDateTime');
    expect(dateTime(Date())).toBeDefined();
  });

});
