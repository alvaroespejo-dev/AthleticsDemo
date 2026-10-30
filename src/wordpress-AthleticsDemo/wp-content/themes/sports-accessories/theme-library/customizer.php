<?php
/**
 * Sports Accessories Theme Customizer
 *
 * @package sports_accessories
 */

// Sanitize callback.
require get_template_directory() . '/theme-library/customizer/sanitize-callback.php';

// Active Callback.
require get_template_directory() . '/theme-library/customizer/active-callback.php';

// Custom Controls.
require get_template_directory() . '/theme-library/customizer/custom-controls/custom-controls.php';
// Icon Controls.
require get_template_directory() . '/theme-library/customizer/custom-controls/icon-control.php';

function sports_accessories_customize_register( $wp_customize ) {
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'blogname',
			array(
				'selector'        => '.site-title a',
				'render_callback' => 'sports_accessories_customize_partial_blogname',
			)
		);
		$wp_customize->selective_refresh->add_partial(
			'blogdescription',
			array(
				'selector'        => '.site-description',
				'render_callback' => 'sports_accessories_customize_partial_blogdescription',
			)
		);
	}

	// Upsell Section.
	$wp_customize->add_section(
		new Sports_Accessories_Upsell_Section(
			$wp_customize,
			'upsell_section',
			array(
				'title'            => __( 'Sports Accessories Pro', 'sports-accessories' ),
				'button_text'      => __( 'Buy Pro', 'sports-accessories' ),
				'url'              => 'https://asterthemes.com/products/sports-store-wordpress-theme',
				'background_color' => '#860000',
				'text_color'       => '#fff',
				'priority'         => 0,
			)
		)
	);

	// Doc Section.
	$wp_customize->add_section(
		new Sports_Accessories_Upsell_Section(
			$wp_customize,
			'doc_section',
			array(
				'title'            => __( 'Documentation', 'sports-accessories' ),
				'button_text'      => __( 'Free Doc', 'sports-accessories' ),
				'url'              => 'https://demo.asterthemes.com/docs/sports-accessories-free/',
				'background_color' => '#860000',
				'text_color'       => '#fff',
				'priority'         => 1,
			)
		)
	);

	// Theme Options.
	require get_template_directory() . '/theme-library/customizer/theme-options.php';

	// Front Page Options.
	require get_template_directory() . '/theme-library/customizer/front-page-options.php';

	// Colors.
	require get_template_directory() . '/theme-library/customizer/colors.php';

}
add_action( 'customize_register', 'sports_accessories_customize_register' );

function sports_accessories_customize_partial_blogname() {
	bloginfo( 'name' );
}

function sports_accessories_customize_partial_blogdescription() {
	bloginfo( 'description' );
}

function sports_accessories_customize_preview_js() {
	$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

	wp_enqueue_script( 'sports-accessories-customizer', get_template_directory_uri() . '/resource/js/customizer' . $min . '.js', array( 'customize-preview' ), SPORTS_ACCESSORIES_VERSION, true );
}
add_action( 'customize_preview_init', 'sports_accessories_customize_preview_js' );

function sports_accessories_custom_control_scripts() {

	wp_enqueue_style( 'sports-accessories-custom-controls-css', get_template_directory_uri() . '/resource/css/custom-controls.css', array(), '1.0', 'all' );

	wp_enqueue_script( 'sports-accessories-custom-controls-js', get_template_directory_uri() . '/resource/js/custom-controls.js', array( 'jquery', 'jquery-ui-core', 'jquery-ui-sortable' ), '1.0', true );
}
add_action( 'customize_controls_enqueue_scripts', 'sports_accessories_custom_control_scripts' );