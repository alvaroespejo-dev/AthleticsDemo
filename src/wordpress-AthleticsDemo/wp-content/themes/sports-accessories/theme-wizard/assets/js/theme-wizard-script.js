var Whizzie = (function ($) {
  var current_step = '', step_pointer = '';

  var callbacks = {
    do_next_step: function (btn) {
      do_next_step(btn);
    },
    install_widgets: function (btn) {
      var widgets = new WidgetManager();
      widgets.init(btn);
    },
    install_content: function (btn) {
      var content = new ContentManager();
      content.init(btn);
    },
  };

  function window_loaded() {
    var maxHeight = 0;
    $('.whizzie-menu li.step').each(function () {
      $(this).attr('data-height', $(this).innerHeight());
      maxHeight = Math.max(maxHeight, $(this).innerHeight());
    });

    $('.whizzie-menu li .detail').each(function () {
      $(this).attr('data-height', $(this).innerHeight()).addClass('scale-down');
    });

    $('.whizzie-menu li.step').css('height', '100%');
    $('.whizzie-menu li.step:first-child, .whizzie-nav li:first-child').addClass('active-step');
    $('.whizzie-wrap').addClass('loaded');

    $('.do-it').on('click', function (e) {
      e.preventDefault();
      step_pointer = $(this).data('step');
      current_step = $('.step-' + step_pointer);
      $('.whizzie-wrap').addClass('spinning');
      var callback = $(this).data('callback');
      if (callback && callbacks[callback]) {
        callbacks[callback](this);
      } else {
        loading_content();
      }
    });

    $('.more-info').on('click', function (e) {
      e.preventDefault();
      toggleDetail($(this).closest('.step'), maxHeight);
    }).trigger('click');
  }

  function toggleDetail(parent, maxHeight) {
    parent.toggleClass('show-detail');
    var detail = parent.find('.detail');
    if (parent.hasClass('show-detail')) {
      parent.animate({ height: parent.data('height') + detail.data('height') }, 500, function () {
        detail.toggleClass('scale-down');
      }).css('overflow', 'visible');
    } else {
      parent.animate({ height: maxHeight }, 500, function () {
        detail.toggleClass('scale-down');
      }).css('overflow', 'visible');
    }
  }

  function do_next_step() {
    current_step.removeClass('active-step').addClass('done-step').fadeOut(500, function () {
      current_step = current_step.next();
      step_pointer = current_step.data('step');
      current_step.fadeIn().addClass('active-step');
      $('.nav-step-' + step_pointer).addClass('active-step');
      $('.whizzie-wrap').removeClass('spinning');
    });
  }

  function WidgetManager() {
    function import_widgets() {
      jQuery.post(sports_accessories_whizzie_params.ajaxurl, {
        action: 'setup_widgets',
        wpnonce: sports_accessories_whizzie_params.wpnonce
      }, complete);
    }

    return {
      init: function () {
        complete = function () { do_next_step(); };
        import_widgets();
      }
    };
  }

  function ContentManager() {
    var complete, current_item = '', $current_node;

    function ajax_callback(response) {
      if (response && response.message) {
        $current_node.find('span').text(response.message);
        if (response.url) {
          jQuery.post(response.url, response, ajax_callback)
            .fail(function () {
              $current_node.find('span').text("Error during AJAX call.");
            });
        }
      } else {
        console.error('Unexpected response format', response);
      }
    }

    return {
      init: function (btn) {
        complete = function () {
          loading_content();
          window.location.href = btn.href;
        };
        find_next();
      }
    };
  }

  return {
    init: function () {
      $(window_loaded);
    }
  };

})(jQuery);

Whizzie.init();

// Tab content functionality
function openCity(evt, cityName) {
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  var tablinks = document.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}

// jQuery DOM ready function for setup navigation
jQuery(document).ready(function () {
  jQuery('#at-demo-setup-guid .at-setup-menu').attr("checked", "checked");

  jQuery('#at-setup-menu').click(function () {
    jQuery('#at-demo-setup-guid .at-setup-menu').show();
    jQuery('#at-demo-setup-guid .at-setup-contact, #at-demo-setup-guid .at-setup-widget').hide();
  });

  jQuery('#at-setup-contact').click(function () {
    jQuery('#at-demo-setup-guid .at-setup-contact').show();
    jQuery('#at-demo-setup-guid .at-setup-menu, #at-demo-setup-guid .at-setup-widget').hide();
  });

  jQuery('#at-setup-widget').click(function () {
    jQuery('#at-demo-setup-guid .at-setup-widget').show();
    jQuery('#at-demo-setup-guid .at-setup-menu, #at-demo-setup-guid .at-setup-contact').hide();
  });
});