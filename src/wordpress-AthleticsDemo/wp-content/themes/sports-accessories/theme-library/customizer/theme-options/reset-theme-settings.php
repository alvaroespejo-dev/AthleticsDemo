<?php
/**
 * Reset Theme Settings
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_reset_theme_options',
	array(
		'panel' => 'sports_accessories_theme_options',
		'title' => esc_html__( 'Reset Theme Settings', 'sports-accessories' ),
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_reset_theme_separators', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_reset_theme_separators', array(
	'label' => __( 'Reset Theme', 'sports-accessories' ),
	'section' => 'sports_accessories_reset_theme_options',
	'settings' => 'sports_accessories_reset_theme_separators',
)));

//Reset Demo Import
$wp_customize->add_setting( 'sports_accessories_reset_demo_import_settings', array(
    'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control('sports_accessories_reset_demo_import_settings',array(
        'label'   => __( 'Reset Demo Import', 'sports-accessories' ),
        'section' => 'sports_accessories_reset_theme_options',
        'type'    => 'button',
        'input_attrs' => array(
            'onclick' => 'ResetDemoSettings()',
        ),
));

//Reset Global Color
$wp_customize->add_setting('sports_accessories_reset_color', array(
    'default'           => '',
    'sanitize_callback' => 'sanitize_text_field',
));

$wp_customize->add_control('sports_accessories_reset_color', array(
    'type'    => 'button',
    'label'   => __('Reset Global Color', 'sports-accessories'),
    'section' => 'sports_accessories_reset_theme_options',
    'input_attrs' => array(
        'onclick' => 'ResetGlobalColor()',
    ),
));