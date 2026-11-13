<?php
require get_template_directory() . '/theme-library/customizer/tgm/class-tgm-plugin-activation.php';
/**
 * Recommended plugins.
 */
function sports_accessories_register_recommended_plugins_set() {
	$plugins = array(
		array(
			'name'             => __( 'WooCommerce', 'sports-accessories' ),
			'slug'             => 'woocommerce',
			'source'           => '',
			'required'         => false,
			'force_activation' => false,
		),
	);
	$config = array();
	tgmpa( $plugins, $config );
}
add_action( 'tgmpa_register', 'sports_accessories_register_recommended_plugins_set' );