<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package sports_accessories
 */


// Output inline CSS based on Customizer setting
function sports_accessories_customizer_css() {
    $sports_accessories_enable_breadcrumb = get_theme_mod('sports_accessories_enable_breadcrumb', true);
    ?>
    <style type="text/css">
        <?php if (!$sports_accessories_enable_breadcrumb) : ?>
            nav.woocommerce-breadcrumb {
                display: none;
            }
        <?php endif; ?>
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_customizer_css');

// Retrieve the slider visibility setting
$sports_accessories_slider = get_theme_mod('sports_accessories_enable_banner_section', false);

// Function to output custom CSS directly in the head section
function sports_accessories_custom_css() {
    global $sports_accessories_slider;
    if ($sports_accessories_slider == true) {
        echo '<style type="text/css">
            .home header.site-header .header-main-wrapper .bottom-header-outer-wrapper .bottom-header-part {
                position: absolute;
	            border-bottom: none !important;
                background: transparent;
                top:0px;
            }
        </style>';
    }
}

// Hook the function into the wp_head action
add_action('wp_head', 'sports_accessories_custom_css');

function sports_accessories_customize_css() {
    ?>
    <style type="text/css">
        :root {
            --primary-color: <?php echo esc_html( get_theme_mod( 'sports_accessories_primary_color', '#860000' ) ); ?>;
        }
    </style>
    <?php
}
add_action( 'wp_head', 'sports_accessories_customize_css' );


function sports_accessories_enqueue_selected_fonts() {
    $sports_accessories_fonts_url = sports_accessories_get_fonts_url();
    if (!empty($sports_accessories_fonts_url)) {
        wp_enqueue_style('sports-accessories-google-fonts', $sports_accessories_fonts_url, array(), null);
    }
}
add_action('wp_enqueue_scripts', 'sports_accessories_enqueue_selected_fonts');

function sports_accessories_layout_customizer_css() {
    $sports_accessories_margin = get_theme_mod('sports_accessories_layout_width_margin', 50);
    ?>
    <style type="text/css">
        body.site-boxed--layout #page  {
            margin: 0 <?php echo esc_attr($sports_accessories_margin); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_layout_customizer_css');

function sports_accessories_blog_layout_customizer_css() {
    // Retrieve the blog layout option
    $sports_accessories_blog_layout_option = get_theme_mod('sports_accessories_blog_layout_option_setting', 'Left');

    // Initialize custom CSS variable
    $sports_accessories_custom_css = '';

    // Generate custom CSS based on the layout option
    if ($sports_accessories_blog_layout_option === 'Default') {
        $sports_accessories_custom_css .= '.mag-post-detail { text-align: center; }';
    } elseif ($sports_accessories_blog_layout_option === 'Left') {
        $sports_accessories_custom_css .= '.mag-post-detail { text-align: left; }';
    } elseif ($sports_accessories_blog_layout_option === 'Right') {
        $sports_accessories_custom_css .= '.mag-post-detail { text-align: right; }';
    }

    // Output the combined CSS
    ?>
    <style type="text/css">
        <?php echo wp_kses($sports_accessories_custom_css, array( 'style' => array(), 'text-align' => array() )); ?>
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_blog_layout_customizer_css');

function sports_accessories_sidebar_width_customizer_css() {
    $sports_accessories_sidebar_width = get_theme_mod('sports_accessories_sidebar_width', '30');
    ?>
    <style type="text/css">
        .right-sidebar .asterthemes-wrapper .asterthemes-page {
            grid-template-columns: auto <?php echo esc_attr($sports_accessories_sidebar_width); ?>%;
        }
        .left-sidebar .asterthemes-wrapper .asterthemes-page {
            grid-template-columns: <?php echo esc_attr($sports_accessories_sidebar_width); ?>% auto;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_sidebar_width_customizer_css');

if ( ! function_exists( 'sports_accessories_get_page_title' ) ) {
    function sports_accessories_get_page_title() {
        $sports_accessories_title = '';

        if (is_404()) {
            $sports_accessories_title = esc_html__('Page Not Found', 'sports-accessories');
        } elseif (is_search()) {
            $sports_accessories_title = esc_html__('Search Results for: ', 'sports-accessories') . esc_html(get_search_query());
        } elseif (is_home() && !is_front_page()) {
            $sports_accessories_title = esc_html__('Blogs', 'sports-accessories');
        } elseif (function_exists('is_shop') && is_shop()) {
            $sports_accessories_title = esc_html__('Shop', 'sports-accessories');
        } elseif (is_page()) {
            $sports_accessories_title = get_the_title();
        } elseif (is_single()) {
            $sports_accessories_title = get_the_title();
        } elseif (is_archive()) {
            $sports_accessories_title = get_the_archive_title();
        } else {
            $sports_accessories_title = get_the_archive_title();
        }

        return apply_filters('sports_accessories_page_title', $sports_accessories_title);
    }
}

if ( ! function_exists( 'sports_accessories_has_page_header' ) ) {
    function sports_accessories_has_page_header() {
        // Default to true (display header)
        $sports_accessories_return = true;

        // Custom conditions for disabling the header
        if ('hide-all-devices' === get_theme_mod('sports_accessories_page_header_visibility', 'all-devices')) {
            $sports_accessories_return = false;
        }

        // Apply filters and return
        return apply_filters('sports_accessories_display_page_header', $sports_accessories_return);
    }
}

if ( ! function_exists( 'sports_accessories_page_header_style' ) ) {
    function sports_accessories_page_header_style() {
        $sports_accessories_style = get_theme_mod('sports_accessories_page_header_style', 'default');
        return apply_filters('sports_accessories_page_header_style', $sports_accessories_style);
    }
}

function sports_accessories_page_title_customizer_css() {
    $sports_accessories_layout_option = get_theme_mod('sports_accessories_page_header_layout', 'left');
    ?>
    <style type="text/css">
        .asterthemes-wrapper.page-header-inner {
            <?php if ($sports_accessories_layout_option === 'flex') : ?>
                display: flex;
                justify-content: space-between;
                align-items: center;
            <?php else : ?>
                text-align: <?php echo esc_attr($sports_accessories_layout_option); ?>;
            <?php endif; ?>
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_page_title_customizer_css');

function sports_accessories_pagetitle_height_css() {
    $sports_accessories_height = get_theme_mod('sports_accessories_pagetitle_height', 50);
    ?>
    <style type="text/css">
        header.page-header {
            padding: <?php echo esc_attr($sports_accessories_height); ?>px 0;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_pagetitle_height_css');

function sports_accessories_site_logo_width() {
    $sports_accessories_site_logo_width = get_theme_mod('sports_accessories_site_logo_width', 200);
    ?>
    <style type="text/css">
        .site-logo img {
            max-width: <?php echo esc_attr($sports_accessories_site_logo_width); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_site_logo_width');

function sports_accessories_menu_font_size_css() {
    $sports_accessories_menu_font_size = get_theme_mod('sports_accessories_menu_font_size', 14);
    ?>
    <style type="text/css">
        .main-navigation a {
            font-size: <?php echo esc_attr($sports_accessories_menu_font_size); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_menu_font_size_css');

//Menu Font Weight
function sports_accessories_menu_font_weight_css() {
	$sports_accessories_font_weight = get_theme_mod( 'sports_accessories_menu_font_weight', 600);
	$sports_accessories_custom_css = "
		.main-navigation a {
		    font-weight: {$sports_accessories_font_weight};
		}
	";

	wp_add_inline_style( 'sports-accessories-style', $sports_accessories_custom_css );
}
add_action( 'wp_enqueue_scripts', 'sports_accessories_menu_font_weight_css' );

function sports_accessories_menu_text_transform_css() {
    $menu_text_transform = get_theme_mod('sports_accessories_menu_text_transform', 'uppercase');
    ?>
    <style type="text/css">
        .main-navigation a {
            text-transform: <?php echo esc_attr($menu_text_transform); ?>;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_menu_text_transform_css');

// Featured Image Dimension
function sports_accessories_custom_featured_image_css() {
    $sports_accessories_dimension = get_theme_mod('sports_accessories_blog_post_featured_image_dimension', 'default');
    $sports_accessories_width = get_theme_mod('sports_accessories_blog_post_featured_image_custom_width', '');
    $sports_accessories_height = get_theme_mod('sports_accessories_blog_post_featured_image_custom_height', '');
    
    if ($sports_accessories_dimension === 'custom' && $sports_accessories_width && $sports_accessories_height) {
        $sports_accessories_custom_css = "body:not(.single-post) .mag-post-single .mag-post-img img { width: {$sports_accessories_width}px !important; height: {$sports_accessories_height}px !important; }";
        wp_add_inline_style('sports-accessories-style', $sports_accessories_custom_css);
    }
}
add_action('wp_enqueue_scripts', 'sports_accessories_custom_featured_image_css');

// Featured Image Border Radius
function sports_accessories_featured_image_border_radius_css() {
    $sports_accessories_featured_image_border_radius = get_theme_mod('sports_accessories_featured_image_border_radius', 10);
    ?>
    <style type="text/css">  
        .mag-post-single img {
            border-radius: <?php echo esc_attr($sports_accessories_featured_image_border_radius); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_featured_image_border_radius_css');

function sports_accessories_sidebar_widget_font_size_css() {
    $sports_accessories_sidebar_widget_font_size = get_theme_mod('sports_accessories_sidebar_widget_font_size', 24);
    ?>
    <style type="text/css">
        h2.wp-block-heading,aside#secondary .widgettitle,aside#secondary .widget-title {
            font-size: <?php echo esc_attr($sports_accessories_sidebar_widget_font_size); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_sidebar_widget_font_size_css');

// Woocommerce Related Products Settings
function sports_accessories_related_product_css() {
    $sports_accessories_related_product_show_hide = get_theme_mod('sports_accessories_related_product_show_hide', true);

    if ( $sports_accessories_related_product_show_hide != true) {
        ?>
        <style type="text/css">
            .related.products {
                display: none;
            }
        </style>
        <?php
    }
}
add_action('wp_head', 'sports_accessories_related_product_css');

// Woocommerce Product Sale Position 
function sports_accessories_product_sale_position_customizer_css() {
    $sports_accessories_layout_option = get_theme_mod('sports_accessories_product_sale_position', 'left');
    ?>
    <style type="text/css">
        .woocommerce ul.products li.product .onsale {
            <?php if ($sports_accessories_layout_option === 'left') : ?>
                right: auto;
                left: 0px;
            <?php else : ?>
                left: auto;
                right: 0px;
            <?php endif; ?>
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_product_sale_position_customizer_css');  

// Preloader Background Color Setting
function sports_accessories_preloader_background_colors_css() {
    $sports_accessories_preloader_background_color_setting = get_theme_mod('sports_accessories_preloader_background_color_setting', '');
        // Only output CSS if a color is set
        if (empty($sports_accessories_preloader_background_color_setting)) {
            return;
        }
    ?>
    <style type="text/css">
        #loader {
            background-color: <?php echo esc_attr($sports_accessories_preloader_background_color_setting); ?>;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_preloader_background_colors_css');

// Preloader Background Image Setting
function sports_accessories_preloader_background_image_css() {
    $sports_accessories_preloader_background_image_setting = get_theme_mod('sports_accessories_preloader_background_image_setting', '');
        // Only output CSS if the background image is set
        if (empty($sports_accessories_preloader_background_image_setting)) {
            return;
        }
    ?>
    <style type="text/css">
        #loader {
            background-image: url('<?php echo esc_url($sports_accessories_preloader_background_image_setting); ?>');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_preloader_background_image_css');

//Footer Social Icon Alignment
function sports_accessories_footer_icons_alignment_css() {
    $sports_accessories_footer_social_align = get_theme_mod( 'sports_accessories_footer_social_align', 'center' );   
    ?>
    <style type="text/css">
        .socialicons {
            text-align: <?php echo esc_attr( $sports_accessories_footer_social_align ); ?> 
        }

        /* Mobile Specific */
        @media screen and (max-width: 575px) {
            .socialicons {
                text-align: center;
            }
        }
    </style>
    <?php
}
add_action( 'wp_head', 'sports_accessories_footer_icons_alignment_css' );

//Copyright Alignment
function sports_accessories_footer_copyright_alignment_css() {
    $sports_accessories_footer_bottom_align = get_theme_mod( 'sports_accessories_footer_bottom_align', 'center' );   
    ?>
    <style type="text/css">
        .site-footer .site-footer-bottom .site-footer-bottom-wrapper {
            justify-content: <?php echo esc_attr( $sports_accessories_footer_bottom_align ); ?> 
        }

        /* Mobile Specific */
        @media screen and (max-width: 575px) {
            .site-footer .site-footer-bottom .site-footer-bottom-wrapper {
                justify-content: center;
                text-align:center;
            }
        }
    </style>
    <?php
}
add_action( 'wp_head', 'sports_accessories_footer_copyright_alignment_css' );

//Copyright Font Size
function sports_accessories_copyright_font_size_css() {
    $sports_accessories_copyright_font_size = get_theme_mod('sports_accessories_copyright_font_size', 16);
    ?>
    <style type="text/css">
        .site-footer-bottom .site-info span {
            font-size: <?php echo esc_attr($sports_accessories_copyright_font_size); ?>px;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_copyright_font_size_css');

//Footer Heading Alignment
function sports_accessories_footer_heading_alignment_css() {
    $sports_accessories_footer_header_align = get_theme_mod( 'sports_accessories_footer_header_align', 'left' );   
    ?>
    <style type="text/css">
        .site-footer h4, footer#colophon h2.wp-block-heading, footer#colophon .widgettitle, footer#colophon .widget-title {
            text-align: <?php echo esc_attr( $sports_accessories_footer_header_align ); ?> 
        }
    </style>
    <?php
}
add_action( 'wp_head', 'sports_accessories_footer_heading_alignment_css' );

//First Capital Letter
function sports_accessories_show_first_caps() {
	$sports_accessories_first_caps = get_theme_mod('sports_accessories_show_first_caps', false);
	$sports_accessories_css = '';
	if ( $sports_accessories_first_caps ) {
	$sports_accessories_css .= '
		.mag-post-single .mag-post-detail .mag-post-excerpt p:first-of-type::first-letter {
		    font-size: 55px;
			font-weight: 600;
			margin-right: 6px;
			line-height: 1;
			display: inline-block;
			vertical-align: baseline;
		}';
	} else {
		$sports_accessories_css .= '
		.mag-post-single .mag-post-detail .mag-post-excerpt p:first-of-type::first-letter {
			display: none;
		}';
	}
	wp_add_inline_style( 'sports-accessories-style', $sports_accessories_css );
}
add_action( 'wp_enqueue_scripts', 'sports_accessories_show_first_caps' );

// Banner Button Color
function sports_accessories_banner_button_color_css() {
    $btn_color = get_theme_mod('sports_accessories_banner_btn_color');
	$btn_bg_color = get_theme_mod('sports_accessories_banner_btn_bg_color');

	$custom_css = '';
    if ( !empty($btn_color) ) {
		$custom_css .= "
		.banner-slider-btn a.asterthemes-button{
			color: {$btn_color};
		}";
	}

	if ( !empty($btn_bg_color) ) {
		$custom_css .= "
		.banner-slider-btn a.asterthemes-button{
			background-color: {$btn_bg_color};
		}";
	}

	wp_add_inline_style('sports-accessories-style', $custom_css);
}
add_action('wp_enqueue_scripts','sports_accessories_banner_button_color_css');
