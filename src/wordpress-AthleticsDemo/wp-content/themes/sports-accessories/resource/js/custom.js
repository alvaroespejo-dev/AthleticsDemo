jQuery(function($) {

    /* -----------------------------------------
    Preloader
    ----------------------------------------- */
    $('#preloader').delay(1000).fadeOut();
    $('#loader').delay(1000).fadeOut("slow");

    /* -----------------------------------------
    Navigation
    ----------------------------------------- */
    $('.menu-toggle').click(function() {
        $(this).toggleClass('open');
    });

    /* -----------------------------------------
    Keyboard Navigation
    ----------------------------------------- */
    $(window).on('load resize', sports_accessories_navigation)

    function sports_accessories_navigation(event) {
        if ($(window).width() < 1200) {
            $('.main-navigation').find("li").last().bind('keydown', function(e) {
                if (e.shiftKey && e.which === 9) {
                    if ($(this).hasClass('focus')) {
                    }

                } else if (e.which === 9) {
                    e.preventDefault();
                    $('#masthead').find('.menu-toggle').focus();
                }                
            })
        } else {
            $('.main-navigation').find("li").unbind('keydown')
        }
    }

    sports_accessories_navigation()

    var sports_accessories_primary_menu_toggle = $('#masthead .menu-toggle');
    sports_accessories_primary_menu_toggle.on('keydown', function(e) {
        var tabKey = e.keyCode === 9;
        var shiftKey = e.shiftKey;

        if (sports_accessories_primary_menu_toggle.hasClass('open')) {
            if (shiftKey && tabKey) {
                e.preventDefault();
                const $the_last_li = $('.main-navigation').find("li").last()
                $the_last_li.find('a').focus()
                if (!$the_last_li.hasClass('focus')) {

                    const $is_parent_on_top = true
                    let $the_parent_ul = $the_last_li.closest('ul.sub-menu')

                    let count = 0

                    while (!!$the_parent_ul.length) {
                        ++count

                        const $the_parent_li = $the_parent_ul.closest('li')

                        if (!!$the_parent_li.length) {
                            $the_parent_li.addClass('focus')
                            $the_parent_ul = $the_parent_li.closest('ul.sub-menu')

                            // Blur the cross
                            $(this).blur()
                            $the_last_li.addClass('focus')
                        }

                        if (!$the_parent_ul.length) {
                            break;
                        }
                    }

                }

            };
        }
    })

    /* -----------------------------------------
    Main Slider
    ----------------------------------------- */

    // Determine if the document is RTL
    var isRtl = $('html').attr('dir') === 'rtl';
    
    $('.banner-slider').slick({
        autoplaySpeed: 3000,
        dots: false,
        arrows: true,
        nextArrow: '<button class="fas fa-angle-right slick-next"></button>',
        prevArrow: '<button class="fas fa-angle-left slick-prev"></button>',
        rtl: isRtl, // Set the rtl option
        responsive: [{
            
            breakpoint: 1025,
            settings: {
                dots: true,
                arrows: false,
            }
        },
        {
            breakpoint: 480,
            settings: {
                dots: true,
                arrows: false,
            }
        }]
    });

    /* -----------------------------------------
    Scroll Top
    ----------------------------------------- */
    var sports_accessories_scrollToTopBtn = $('.sports-accessories-scroll-to-top');

    $(window).scroll(function() {
        if ($(window).scrollTop() > 400) {
            sports_accessories_scrollToTopBtn.addClass('show');
        } else {
            sports_accessories_scrollToTopBtn.removeClass('show');
        }
    });

    sports_accessories_scrollToTopBtn.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: 0
        }, '300');
    });

    //search js

    $(".input").focus(function() {
      $(".form").addClass("move");
    });
    $(".input").focusout(function() {
      $(".form").removeClass("move");
      $(".input").val("");
    });

    $(".fa-search").click(function() {
      $(".input").toggleClass("active");
      $(".form").toggleClass("active");
    });
    
});

document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('.sticky-header');
  if (header) { // Check if header exists
    window.addEventListener('scroll', function() {
      if (window.scrollY > 0) {
        header.classList.add('is-sticky');
      } else {
        header.classList.remove('is-sticky');
      }
    });
  }
});

jQuery(".banner-section.banner-style-1 .banner-single .banner-caption .banner-catption-wrapper .banner-caption-title a").html(function(){
  var text2 = jQuery(this).text().trim();
  var lastLetter = text2.slice(-1);
  
  if (text2.length > 1) {
      var updatedText = text2.slice(0, -1) + `<span class='last_slide_head'>${lastLetter}</span>`;
      return updatedText;
  } else if (text2.length == 1) {
      var updatedText = `<span class='last_slide_head'>${text2}</span>`;
      return updatedText;
  } else {
      return text2;
  }
});