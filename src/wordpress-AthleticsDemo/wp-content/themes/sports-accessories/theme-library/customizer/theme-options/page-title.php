<?php
/**
 * Pige Title Options
 *
 * @package sports_accessories
 */



$wp_customize->add_section(
	'sports_accessories_page_title_options',
	array(
		'panel' => 'sports_accessories_theme_options',
		'title' => esc_html__( 'Page Title', 'sports-accessories' ),
	)
);

$wp_customize->add_setting(
    'sports_accessories_page_header_visibility',
    array(
        'default'           => 'all-devices',
        'sanitize_callback' => 'sports_accessories_sanitize_select',
    )
);

$wp_customize->add_control(
    new WP_Customize_Control(
        $wp_customize,
        'sports_accessories_page_header_visibility',
        array(
            'label'    => esc_html__( 'Page Header Visibility', 'sports-accessories' ),
            'type'     => 'select',
            'section'  => 'sports_accessories_page_title_options',
            'settings' => 'sports_accessories_page_header_visibility',
            'priority' => 10,
            'choices'  => array(
                'all-devices'        => esc_html__( 'Show on all devices', 'sports-accessories' ),
                'hide-tablet'        => esc_html__( 'Hide on Tablet', 'sports-accessories' ),
                'hide-mobile'        => esc_html__( 'Hide on Mobile', 'sports-accessories' ),
                'hide-tablet-mobile' => esc_html__( 'Hide on Tablet & Mobile', 'sports-accessories' ),
                'hide-all-devices'   => esc_html__( 'Hide on all devices', 'sports-accessories' ),
            ),
        )
    )
);


$wp_customize->add_setting( 'sports_accessories_page_title_background_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_page_title_background_separator', array(
	'label' => __( 'Page Title BG Image & Color Setting', 'sports-accessories' ),
	'section' => 'sports_accessories_page_title_options',
	'settings' => 'sports_accessories_page_title_background_separator',
)));


$wp_customize->add_setting(
	'sports_accessories_page_header_style',
	array(
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
		'default'           => False,
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_page_header_style',
		array(
			'label'   => esc_html__('Page Title Background Image', 'sports-accessories'),
			'section' => 'sports_accessories_page_title_options',
		)
	)
);

$wp_customize->add_setting( 'sports_accessories_page_header_background_image', array(
    'default' => '',
    'sanitize_callback' => 'esc_url_raw',
) );

$wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'sports_accessories_page_header_background_image', array(
    'label'    => __( 'Background Image', 'sports-accessories' ),
    'section'  => 'sports_accessories_page_title_options',
	'description' => __('Choose either a background image or a color. If a background image is selected, the background color will not be visible.', 'sports-accessories'),
    'settings' => 'sports_accessories_page_header_background_image',
	'active_callback' => 'sports_accessories_is_pagetitle_bcakground_image_enabled',
)));


$wp_customize->add_setting('sports_accessories_page_header_image_height', array(
	'default'           => 200,
	'sanitize_callback' => 'sports_accessories_sanitize_range_value',
));

$wp_customize->add_control(new Sports_Accessories_Customize_Range_Control($wp_customize, 'sports_accessories_page_header_image_height', array(
		'label'       => __('Image Height', 'sports-accessories'),
		'section'     => 'sports_accessories_page_title_options',
		'settings'    => 'sports_accessories_page_header_image_height',
		'active_callback' => 'sports_accessories_is_pagetitle_bcakground_image_enabled',
		'input_attrs' => array(
			'min'  => 0,
			'max'  => 1000,
			'step' => 5,
		),
)));


$wp_customize->add_setting('sports_accessories_page_title_background_color_setting', array(
    'default' => '',
    'sanitize_callback' => 'sanitize_hex_color',
));

$wp_customize->add_control(new WP_Customize_Color_Control($wp_customize, 'sports_accessories_page_title_background_color_setting', array(
    'label' => __('Page Title Background Color', 'sports-accessories'),
    'section' => 'sports_accessories_page_title_options',
)));

$wp_customize->add_setting('sports_accessories_pagetitle_height', array(
    'default'           => 50,
    'sanitize_callback' => 'sports_accessories_sanitize_range_value',
));

$wp_customize->add_control(new Sports_Accessories_Customize_Range_Control($wp_customize, 'sports_accessories_pagetitle_height', array(
    'label'       => __('Set Height', 'sports-accessories'),
    'description' => __('This setting controls the page title height when no background image is set. If a background image is set, this setting will not apply.', 'sports-accessories'),
    'section'     => 'sports_accessories_page_title_options',
    'settings'    => 'sports_accessories_pagetitle_height',
    'input_attrs' => array(
        'min'  => 0,
        'max'  => 300,
        'step' => 5,
    ),
)));


$wp_customize->add_setting( 'sports_accessories_page_title_style_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_page_title_style_separator', array(
	'label' => __( 'Page Title Styling Setting', 'sports-accessories' ),
	'section' => 'sports_accessories_page_title_options',
	'settings' => 'sports_accessories_page_title_style_separator',
)));

$wp_customize->add_setting( 'sports_accessories_page_header_heading_tag', array(
	'default'   => 'h1',
	'sanitize_callback' => 'sports_accessories_sanitize_select',
) );

$wp_customize->add_control( 'sports_accessories_page_header_heading_tag', array(
	'label'   => __( 'Page Title Heading Tag', 'sports-accessories' ),
	'section' => 'sports_accessories_page_title_options',
	'type'    => 'select',
	'choices' => array(
		'h1' => __( 'H1', 'sports-accessories' ),
		'h2' => __( 'H2', 'sports-accessories' ),
		'h3' => __( 'H3', 'sports-accessories' ),
		'h4' => __( 'H4', 'sports-accessories' ),
		'h5' => __( 'H5', 'sports-accessories' ),
		'h6' => __( 'H6', 'sports-accessories' ),
		'p' => __( 'p', 'sports-accessories' ),
		'a' => __( 'a', 'sports-accessories' ),
		'div' => __( 'div', 'sports-accessories' ),
		'span' => __( 'span', 'sports-accessories' ),
	),
) );

$wp_customize->add_setting('sports_accessories_page_header_layout', array(
	'default' => 'left',
	'sanitize_callback' => 'sanitize_text_field',
));

$wp_customize->add_control('sports_accessories_page_header_layout', array(
	'label' => __('Style', 'sports-accessories'),
	'section' => 'sports_accessories_page_title_options',
	'description' => __('"Flex Layout Style" wont work below 600px (mobile media)', 'sports-accessories'),
	'settings' => 'sports_accessories_page_header_layout',
	'type' => 'radio',
	'choices' => array(
		'left' => __('Classic', 'sports-accessories'),
		'right' => __('Aligned Right', 'sports-accessories'),
		'center' => __('Centered Focus', 'sports-accessories'),
		'flex' => __('Flex Layout', 'sports-accessories'),
	),
));