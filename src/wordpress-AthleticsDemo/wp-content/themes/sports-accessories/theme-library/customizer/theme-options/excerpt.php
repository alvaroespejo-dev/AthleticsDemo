<?php
/**
 * Excerpt
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_excerpt_options',
	array(
		'panel' => 'sports_accessories_theme_options',
		'title' => esc_html__( 'Excerpt', 'sports-accessories' ),
	)
);

// Excerpt - Excerpt Length.
$wp_customize->add_setting(
	'sports_accessories_excerpt_length',
	array(
		'default'           => 20,
		'sanitize_callback' => 'absint',
		'transport'         => 'refresh',
	)
);

$wp_customize->add_control(
	'sports_accessories_excerpt_length',
	array(
		'label'       => esc_html__( 'Excerpt Length (no. of words)', 'sports-accessories' ),
		'section'     => 'sports_accessories_excerpt_options',
		'settings'    => 'sports_accessories_excerpt_length',
		'type'        => 'number',
		'input_attrs' => array(
			'min'  => 10,
			'max'  => 200,
			'step' => 1,
		),
	)
);