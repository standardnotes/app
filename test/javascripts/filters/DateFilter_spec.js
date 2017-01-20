describe("date filter", function() {
  beforeEach(module('app.frontend'));
  var $filter;

  beforeEach(inject(function(_$filter_){
    $filter = _$filter_;
  }));

  it('returns a defined time', function() {
    var date = $filter('appDate');
    expect(date(Date())).toBeDefined();
  });

  it('returns time', function() {
    var dateTime = $filter('appDateTime');
    expect(dateTime(Date())).toBeDefined();
  });

});
