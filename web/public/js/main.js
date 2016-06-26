/**
 * 定时刷新
 **/
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

/**
 * 手动触发
 **/
(function ($) {

  var triggerDialog = $('#form-trigger');
  var confirmButton = $('#form-trigger .btn-primary');
  var paramsInput = $('#form-trigger .params');

  paramsInput.on('input', function (event) {
    paramsInput.removeClass('danger');
    paramsInput.attr('title', '');
    confirmButton.attr('title', '');
  });

  confirmButton.on('click', function (event) {
    var params = paramsInput.val() || '{}';
    try {
      params = JSON.parse(params);
    } catch (err) {
      paramsInput.attr('title', err.message);
      confirmButton.attr('title', err.message);
      return paramsInput.addClass('danger');
    }
    var url = location.href.split('?')[0];
    $.post(url + '/trigger?_t=' + Date.now(), params, function (res) {
      $('#panel-center .list-group .list-group-item.active').click();
      triggerDialog.modal('hide');
    });
  });

})(jQuery);