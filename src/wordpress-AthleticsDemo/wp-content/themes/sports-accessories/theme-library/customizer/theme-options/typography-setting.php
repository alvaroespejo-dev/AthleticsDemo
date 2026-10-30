<?php
/**
 * Typography Setting
 *
 * @package sports_accessories
 */

// Typography Setting
$wp_customize->add_section(
    'sports_accessories_typography_setting',
    array(
        'panel' => 'sports_accessories_theme_options',
        'title' => esc_html__( 'Typography Setting', 'sports-accessories' ),
    )
);

$wp_customize->add_setting(
    'sports_accessories_site_title_font',
    array(
        'default'           => 'Arvo',
        'sanitize_callback' => 'sports_accessories_sanitize_google_fonts',
    )
);

$wp_customize->add_control(
    'sports_accessories_site_title_font',
    array(
        'label'    => esc_html__( 'Site Title Font Family', 'sports-accessories' ),
        'section'  => 'sports_accessories_typography_setting',
        'settings' => 'sports_accessories_site_title_font',
        'type'     => 'select',
        'choices'  => sports_accessories_get_all_google_font_families(),
    )
);

// Typography - Site Description Font.
$wp_customize->add_setting(
	'sports_accessories_site_description_font',
	array(
		'default'           => 'Open Sans',
		'sanitize_callback' => 'sports_accessories_sanitize_google_fonts',
	)
);

$wp_customize->add_control(
	'sports_accessories_site_description_font',
	array(
		'label'    => esc_html__( 'Site Description Font Family', 'sports-accessories' ),
		'section'  => 'sports_accessories_typography_setting',
		'settings' => 'sports_accessories_site_description_font',
		'type'     => 'select',
		'choices'  => sports_accessories_get_all_google_font_families(),
	)
);

// Typography - Header Font.
$wp_customize->add_setting(
	'sports_accessories_header_font',
	array(
		'default'           => 'Arvo',
		'sanitize_callback' => 'sports_accessories_sanitize_google_fonts',
	)
);

$wp_customize->add_control(
	'sports_accessories_header_font',
	array(
		'label'    => esc_html__( 'Heading Font Family', 'sports-accessories' ),
		'section'  => 'sports_accessories_typography_setting',
		'settings' => 'sports_accessories_header_font',
		'type'     => 'select',
		'choices'  => sports_accessories_get_all_google_font_families(),
	)
);

// Typography - Body Font.
$wp_customize->add_setting(
	'sports_accessories_content_font',
	array(
		'default'           => 'Open Sans',
		'sanitize_callback' => 'sports_accessories_sanitize_google_fonts',
	)
);

$wp_customize->add_control(
	'sports_accessories_content_font',
	array(
		'label'    => esc_html__( 'Content Font Family', 'sports-accessories' ),
		'section'  => 'sports_accessories_typography_setting',
		'settings' => 'sports_accessories_content_font',
		'type'     => 'select',
		'choices'  => sports_accessories_get_all_google_font_families(),
	)
);
