<?php
/**
 * Color Option
 *
 * @package sports_accessories
 */

// Primary Color.
$wp_customize->add_setting(
	'sports_accessories_primary_color',
	array(
		'default'           => '#860000',
		'sanitize_callback' => 'sanitize_hex_color',
	)
);

$wp_customize->add_control(
	new WP_Customize_Color_Control(
		$wp_customize,
		'sports_accessories_primary_color',
		array(
			'label'    => __( 'Primary Color', 'sports-accessories' ),
			'section'  => 'colors',
			'priority' => 5,
		)
	)
);
