<?php
/**
 * Sports Accessories functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package sports_accessories
 */

if ( ! defined( 'SPORTS_ACCESSORIES_VERSION' ) ) {
	define( 'SPORTS_ACCESSORIES_VERSION', '1.0.0' );
}

$sports_accessories_theme_data = wp_get_theme();

if( ! defined( 'SPORTS_ACCESSORIES_THEME_VERSION' ) ) define ( 'SPORTS_ACCESSORIES_THEME_VERSION', $sports_accessories_theme_data->get( 'Version' ) );
if( ! defined( 'SPORTS_ACCESSORIES_THEME_NAME' ) ) define( 'SPORTS_ACCESSORIES_THEME_NAME', $sports_accessories_theme_data->get( 'Name' ) );
if( ! defined( 'SPORTS_ACCESSORIES_THEME_TEXTDOMAIN' ) ) define( 'SPORTS_ACCESSORIES_THEME_TEXTDOMAIN', $sports_accessories_theme_data->get( 'TextDomain' ) );

if ( ! function_exists( 'sports_accessories_setup' ) ) :
	
	function sports_accessories_setup() {
		
		load_theme_textdomain( 'sports-accessories', get_template_directory() . '/languages' );

		add_theme_support( 'woocommerce' );

		add_theme_support( 'automatic-feed-links' );
		
		add_theme_support( 'title-tag' );

		add_theme_support( 'post-thumbnails' );

		register_nav_menus(
			array(
				'primary' => esc_html__( 'Primary', 'sports-accessories' ),
				'social'  => esc_html__( 'Social', 'sports-accessories' ),
			)
		);

		add_theme_support(
			'html5',
			array(
				'search-form',
				'comment-form',
				'comment-list',
				'gallery',
				'caption',
				'style',
				'script',
				'woocommerce',
			)
		);

		add_theme_support( 'post-formats', array(
			'image',
			'video',
			'gallery',
			'audio', 
		) );

		add_theme_support(
			'custom-background',
			apply_filters(
				'sports_accessories_custom_background_args',
				array(
					'default-color' => 'ffffff',
					'default-image' => '',
				)
			)
		);

		add_theme_support( 'customize-selective-refresh-widgets' );

		add_theme_support(
			'custom-logo',
			array(
				'height'      => 250,
				'width'       => 250,
				'flex-width'  => true,
				'flex-height' => true,
			)
		);

		add_theme_support( 'align-wide' );

		add_theme_support( 'responsive-embeds' );

		/*
		* This theme styles the visual editor to resemble the theme style,
		* specifically font, colors, icons, and column width.
		*/
		add_editor_style( '/resource/css/editor-style.css' );
	}
endif;
add_action( 'after_setup_theme', 'sports_accessories_setup' );

function sports_accessories_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'sports_accessories_content_width', 640 );
}
add_action( 'after_setup_theme', 'sports_accessories_content_width', 0 );

function sports_accessories_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'sports-accessories' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'sports-accessories' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title"><span>',
			'after_title'   => '</span></h2>',
		)
	);

	// Regsiter 4 footer widgets.
	$sports_accessories_footer_widget_column = get_theme_mod('sports_accessories_footer_widget_column','4');
	for ($sports_accessories_i=1; $sports_accessories_i<=$sports_accessories_footer_widget_column; $sports_accessories_i++) {
		register_sidebar( array(
			'name' => __( 'Footer  ', 'sports-accessories' )  . $sports_accessories_i,
			'id' => 'sports-accessories-footer-widget-' . $sports_accessories_i,
			'description' => __( 'The Footer Widget Area', 'sports-accessories' )  . $sports_accessories_i,
			'before_widget' => '<aside id="%1$s" class="widget %2$s">',
			'after_widget' => '</aside>',
			'before_title' => '<div class="widget-header"><h4 class="widget-title">',
			'after_title' => '</h4></div>',
		) );
	}
}
add_action( 'widgets_init', 'sports_accessories_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function sports_accessories_scripts() {
	// Append .min if SCRIPT_DEBUG is false.
	$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

	// Slick style.
	wp_enqueue_style( 'sports-accessories-slick-style', get_template_directory_uri() . '/resource/css/slick' . $min . '.css', array(), '1.8.1' );

	// Fontawesome style.
	wp_enqueue_style( 'sports-accessories-font-awesome-css', esc_url(get_template_directory_uri())."/resource/css/fontawesome-all.css" );

	// Main style.
	wp_enqueue_style( 'sports-accessories-style', get_template_directory_uri() . '/style.css', array(), SPORTS_ACCESSORIES_VERSION );

	// RTL style.
	wp_style_add_data('sports-accessories-style', 'rtl', 'replace');

	if (get_theme_mod('sports_accessories_enable_animation', true) == true){
		// Animate CSS
		wp_enqueue_style( 'animate-style', get_template_directory_uri() . '/resource/css/animate.css' );
		// Wow script.
		wp_enqueue_script( 'wow-jquery', get_template_directory_uri() . '/resource/js/wow.js', array('jquery'),'' ,true );
	}

	// Navigation script.
	wp_enqueue_script( 'sports-accessories-navigation-script', get_template_directory_uri() . '/resource/js/navigation.js', array(), SPORTS_ACCESSORIES_VERSION, true );

	// Slick script.
	wp_enqueue_script( 'sports-accessories-slick-script', get_template_directory_uri() . '/resource/js/slick' . $min . '.js', array( 'jquery' ), '1.8.1', true );


	// Custom script.
	wp_enqueue_script( 'sports-accessories-custom-script', get_template_directory_uri() . '/resource/js/custom.js', array( 'jquery' ), SPORTS_ACCESSORIES_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

	// Include the file.
	require_once get_theme_file_path( 'theme-library/function-files/wptt-webfont-loader.php' );

	// Load the webfont.
	wp_enqueue_style(
		'Arvo',
		Sports_Accessories_wptt_get_webfont_url( 'https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet' ),
		array(),
		'1.0'
	);

	// Load the webfont.
	wp_enqueue_style(
		'Open Sans',
		Sports_Accessories_wptt_get_webfont_url( 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap' ),
		array(),
		'1.0'
	);

}
add_action( 'wp_enqueue_scripts', 'sports_accessories_scripts' );

//Change number of products per page 
add_filter( 'loop_shop_per_page', 'sports_accessories_products_per_page' );
function sports_accessories_products_per_page( $cols ) {
  	return  get_theme_mod( 'sports_accessories_products_per_page',9);
}

// Change number or products per row 
add_filter('loop_shop_columns', 'sports_accessories_loop_columns');
	if (!function_exists('sports_accessories_loop_columns')) {
	function sports_accessories_loop_columns() {
		return get_theme_mod( 'sports_accessories_products_per_row', 3 );
	}
}

/**
 * Include wptt webfont loader.
 */
require_once get_theme_file_path( 'theme-library/function-files/wptt-webfont-loader.php' );

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/theme-library/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/theme-library/function-files/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/theme-library/function-files/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/theme-library/customizer.php';

/**
 * Google Fonts
 */
require get_template_directory() . '/theme-library/function-files/google-fonts.php';

/**
 * Dynamic CSS
 */
require get_template_directory() . '/theme-library/dynamic-css.php';

/* Demo Import. */
add_action( 'init', 'sports_accessories_load_theme_wizard' );
function sports_accessories_load_theme_wizard() {
    require get_parent_theme_file_path( '/theme-wizard/config.php' );
}

/**
 * Breadcrumb
 */
require get_template_directory() . '/theme-library/function-files/class-breadcrumb-trail.php';

/**
 * Customizer Settings Functions
*/
require get_template_directory() . '/theme-library/function-files/customizer-settings-functions.php';

/**
 * Getting Started
*/
require get_template_directory() . '/theme-library/getting-started/getting-started.php';

/**
 * Load TGM.
 */
require get_template_directory() . '/theme-library/customizer/tgm/tgm.php';

function sports_accessories_links_setup() {
	if ( ! defined( 'SPORTS_ACCESSORIES_PREMIUM_PAGE' ) ) {
	define('SPORTS_ACCESSORIES_PREMIUM_PAGE',__('https://asterthemes.com/products/sports-store-wordpress-theme','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_THEME_PAGE' ) ) {
		define('SPORTS_ACCESSORIES_THEME_PAGE',__('https://asterthemes.com/products/sports-accessories','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_SUPPORT' ) ) {
	define('SPORTS_ACCESSORIES_SUPPORT',__('https://wordpress.org/support/theme/sports-accessories/','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_REVIEW' ) ) {
	define('SPORTS_ACCESSORIES_REVIEW',__('https://wordpress.org/support/theme/sports-accessories/reviews/','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_PRO_DEMO' ) ) {
	define('SPORTS_ACCESSORIES_PRO_DEMO',__('https://demo.asterthemes.com/sports-accessories/','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_THEME_DOCUMENTATION' ) ) {
	define('SPORTS_ACCESSORIES_THEME_DOCUMENTATION',__('https://demo.asterthemes.com/docs/sports-accessories-free/','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_PREMIUM_DOCUMENTATION' ) ) {
	define('SPORTS_ACCESSORIES_PREMIUM_DOCUMENTATION',__('https://demo.asterthemes.com/docs/sports-accessories-pro/','sports-accessories'));
	}
	if ( ! defined( 'SPORTS_ACCESSORIES_BUNDLE_PAGE' ) ) {
		define('SPORTS_ACCESSORIES_BUNDLE_PAGE',__('https://asterthemes.com/products/wp-theme-bundle','sports-accessories'));
	}
}
add_action('after_setup_theme', 'sports_accessories_links_setup');

// Enqueue Customizer live preview script
function sports_accessories_customizer_live_preview() {
    wp_enqueue_script(
        'sports-accessories-customizer',
        get_template_directory_uri() . '/resource/js/customizer.js',
        array('jquery', 'customize-preview'),
        '',
        true
    );
}
add_action('customize_preview_init', 'sports_accessories_customizer_live_preview');

// Featured Image Dimension
function sports_accessories_blog_post_featured_image_dimension(){
	if(get_theme_mod('sports_accessories_blog_post_featured_image_dimension') == 'custom' ) {
		return true;
	}
	return false;
}

add_filter( 'woocommerce_enable_setup_wizard', '__return_false' );

// Reset all theme settings
function sports_accessories_reset_demo_import_settings() {
    if (current_user_can('manage_options')) {
        // List only demo import-related settings to reset
		remove_theme_mod('sports_accessories_header_button_label_');
		remove_theme_mod('sports_accessories_header_button_link_');
		remove_theme_mod('sports_accessories_enable_header_search_section');
		remove_theme_mod('sports_accessories_enable_banner_section');
		remove_theme_mod('sports_accessories_banner_button_label_');
		remove_theme_mod('sports_accessories_banner_button_link_');
		remove_theme_mod('sports_accessories_banner_short_heading');
		remove_theme_mod('sports_accessories_about_left_image_1');
		remove_theme_mod('sports_accessories_about_button_label_');
		remove_theme_mod('sports_accessories_enable_about_section');
		remove_theme_mod('sports_accessories_custom_image_setting_1');
		remove_theme_mod('sports_accessories_custom_image_setting_2');
		remove_theme_mod('sports_accessories_custom_image_setting_3');

        wp_send_json_success(array('message' => __('Demo import settings have been reset.', 'sports-accessories')));
    } else {
        wp_send_json_error(array('message' => __('Permission denied.', 'sports-accessories')));
    }
}
add_action('wp_ajax_sports_accessories_reset_demo_import_settings', 'sports_accessories_reset_demo_import_settings'); 