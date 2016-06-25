(function ($) {

  var interval = 2500;

  function _fetchOut() {
    var console = $('.console');
    var spinner = $('.fa-spinner');
    if (!console || console.length < 1 || !spinner || spinner.length < 1) {
      return fetchOut();
    }
    var url = location.href.split('?')[0];
    $.get(url + '/console?_t=' + Date.now(), function (data) {
      if (console.text() != data) {
        console.text(data);
        console.prop('scrollTop', console.prop('scrollHeight'));
      }
      return fetchOut();
    });
  }
  function fetchOut() {
    return setTimeout(_fetchOut, interval);
  }
  fetchOut();

})(jQuery);