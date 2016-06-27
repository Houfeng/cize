/**
 * 定时刷新
 **/
(function ($) {

  var LONG_INTERVAL = 7500;
  var SHORT_INTERVAL = 2500;

  function _fetchOut(interval) {
    var console = $('.console');
    var spinner = $('.fa-spinner');
    var inConsole = console && console.length > 0;
    var isRuning = spinner && spinner.length > 0;
    if (!inConsole) {
      $('#panel-center .list-group .list-group-item.active').click();
      return fetchOut(LONG_INTERVAL);
    }
    if (!isRuning) {
      return fetchOut(LONG_INTERVAL);
    }
    var url = location.href.split('?')[0];
    $.get(url + '/console?_t=' + Date.now(), function (data) {
      if (console.text() != data) {
        console.text(data);
        console.prop('scrollTop', console.prop('scrollHeight'));
      }
      return fetchOut(SHORT_INTERVAL);
    });
  }
  function fetchOut(interval) {
    return setTimeout(_fetchOut, interval);
  }
  fetchOut(SHORT_INTERVAL);

})(jQuery);

/**
 * 手动触发
 **/
(function ($) {

  var triggerDialog = $('#trigger');
  var confirmButton = $('#trigger .btn-primary');
  var paramsInput = $('#trigger .params');

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

/**
 * 重新运行
 **/
(function ($) {
  $(document).on('click', '[data-rerun]', function (event) {
    var url = $(this).attr('data-rerun');
    $.post(url + '?_t=' + Date.now(), function (res) {
      $('#panel-center .list-group .list-group-item.active').click();
    });
    return false;
  });
})(jQuery);

/**
 * 生成一个新的 token
 **/
(function ($) {
  var generteButton = $('#setting .generate');
  var maxAgeInput = $('#setting .max-age');
  var tokenArea = $('#setting .token');

  maxAgeInput.on('input', function (event) {
    var val = maxAgeInput.val();
    if (isNaN(val)) {
      maxAgeInput.addClass('danger');
    } else {
      maxAgeInput.removeClass('danger');
    }
  });

  generteButton.on('click', function () {
    var val = maxAgeInput.val();
    if (!val || isNaN(val)) {
      return maxAgeInput.addClass('danger');
    }
    $.post('/setting/token', {
      maxAge: 60 * 60 * Number(val)
    }, function (token) {
      tokenArea.text(token);
    });
  });

})(jQuery);