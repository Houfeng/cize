(function ($) {

  /**
   * 可点击的元素(模拟 a)
   **/
  $(document).on('click', '.clickable', function (event) {
    var link = $(this);
    var href = link.attr('href');
    var target = link.attr('target');
    if (!href) return;
    window.open(href, target);
  });

})(jQuery);