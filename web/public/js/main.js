/**
 * 公共函数
 **/
(function ($, $$) {

  $$.ajax = function (url, options, data, callback) {
    if (arguments.length == 3) {
      callback = data;
      data = options;
      options = null;
    } else if (arguments.length == 2) {
      callback = options;
      data = null;
      options = null;
    }
    options = options || {};
    callback = callback || function () { };
    data = data || options.data;
    return $.ajax({
      url: url + '?_t=' + Date.now(),
      type: options.type || 'POST',
      contentType: options.contentType || "application/json",
      dataType: options.dataType || 'json',
      data: data ? JSON.stringify(data) : data,
      success: function (rs) {
        callback(null, rs);
      },
      error: function (xhr) {
        callback(new Error('Ajax Error: ' + xhr.status), xhr);
      }
    });
  };

  $$.get = function (url, callback) {
    return $$.ajax(url, {
      type: 'GET'
    }, null, callback);
  };

  $$.post = function (url, data, callback) {
    return $$.ajax(url, null, data, callback);
  };

})(jQuery, this.$$ = {});

/**
 * 定时刷新
 **/
(function ($) {

  var LONG_INTERVAL = 7500;
  var SHORT_INTERVAL = 2500;

  function _refresh(interval) {
    var console = $('.console-wraper .console');
    var spinner = $('.console-wraper .fa-spinner');
    var inConsole = console && console.length > 0;
    var isRuning = spinner && spinner.length > 0;
    if (!inConsole) {
      $('#panel-center .list-group .list-group-item.active').click();
      return refresh(LONG_INTERVAL);
    }
    var scrollToButtom = function () {
      console.prop('scrollTop', console.prop('scrollHeight'));
    };
    if (!isRuning) {
      $('.console-wraper .list-group-item').click();
      return refresh(LONG_INTERVAL);
    }
    var url = '/api' + location.pathname + '/console';
    $$.get(url, function (err, rs) {
      if (err) return console.error(err);
      if (console.html() != rs.out) {
        console.html(rs.out);
        scrollToButtom();
      }
      if (rs.status != 100) {
        $('.console-wraper .list-group-item').click();
      }
      return refresh(SHORT_INTERVAL);
    });
  }
  function refresh(interval) {
    return setTimeout(_refresh, interval);
  }
  refresh(SHORT_INTERVAL);

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
      try {
        params = jsyaml.load(params);
      } catch (err) {
        paramsInput.attr('title', err.message);
        confirmButton.attr('title', err.message);
        return paramsInput.addClass('danger');
      }
    }
    var triggerButton = $('#btn-trigger');
    var url = triggerButton.attr('data-trigger');
    $$.post(url, params, function (err) {
      if (err) return paramsInput.addClass('danger');
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
    $$.post(url, function (err) {
      if (err) return $(this).addClass('danger');;
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
    $$.post('/api/token', {
      maxAge: 60 * 60 * Number(val)
    }, function (err, rs) {
      if (err) return consoel.error(err);
      tokenArea.text(rs.token);
    });
  });

})(jQuery);