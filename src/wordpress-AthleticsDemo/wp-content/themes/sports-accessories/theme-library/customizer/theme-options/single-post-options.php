<?php
/**
 * Single Post Options
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_single_post_options',
	array(
		'title' => esc_html__( 'Single Post Options', 'sports-accessories' ),
		'panel' => 'sports_accessories_theme_options',
	)
);

// Post Options - Show / Hide Date.
$wp_customize->add_setting(
	'sports_accessories_single_post_hide_date',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_single_post_hide_date',
		array(
			'label'   => esc_html__( 'Show / Hide Date', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Show / Hide Author.
$wp_customize->add_setting(
	'sports_accessories_single_post_hide_author',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_single_post_hide_author',
		array(
			'label'   => esc_html__( 'Show / Hide Author', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Show / Hide Comments.
$wp_customize->add_setting(
	'sports_accessories_single_post_hide_comments',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_single_post_hide_comments',
		array(
			'label'   => esc_html__( 'Show / Hide Comments', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Show / Hide Time.
$wp_customize->add_setting(
	'sports_accessories_single_post_hide_time',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_single_post_hide_time',
		array(
			'label'   => esc_html__( 'Show / Hide Time', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Show / Hide Category.
$wp_customize->add_setting(
	'sports_accessories_single_post_hide_category',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_single_post_hide_category',
		array(
			'label'   => esc_html__( 'Show / Hide Category', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Show / Hide Tag.
$wp_customize->add_setting(
	'sports_accessories_post_hide_tags',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_tags',
		array(
			'label'   => esc_html__( 'Show / Hide Tag', 'sports-accessories' ),
			'section' => 'sports_accessories_single_post_options',
		)
	)
);

// Post Options - Comment Title.
$wp_customize->add_setting(
	'sports_accessories_blog_post_comment_title',
	array(
		'default'=> 'Leave a Reply',
		'sanitize_callback'	=> 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_blog_post_comment_title',
	array(
		'label'	=> __('Comment Title','sports-accessories'),
		'input_attrs' => array(
			'placeholder' => __( 'Leave a Reply', 'sports-accessories' ),
		),
		'section'=> 'sports_accessories_single_post_options',
		'type'=> 'text'
	)
);