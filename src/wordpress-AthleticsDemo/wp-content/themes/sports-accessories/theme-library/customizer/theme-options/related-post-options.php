<?php
/**
 * Related Post Options
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_related_post_options',
	array(
		'title' => esc_html__( 'Related Post Options', 'sports-accessories' ),
		'panel' => 'sports_accessories_theme_options',
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_related_post_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_related_post_separator', array(
	'label' => __( 'Enable / Disable Related Post Section', 'sports-accessories' ),
	'section' => 'sports_accessories_related_post_options',
	'settings' => 'sports_accessories_related_post_separator',
) ) );

// Post Options - Show / Hide Related Posts.
$wp_customize->add_setting(
	'sports_accessories_post_hide_related_posts',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_related_posts',
		array(
			'label'   => esc_html__( 'Show / Hide Related Posts', 'sports-accessories' ),
			'section' => 'sports_accessories_related_post_options',
		)
	)
);

// Register setting for number of related posts
$wp_customize->add_setting(
    'sports_accessories_related_posts_count',
    array(
        'default'           => 3,
        'sanitize_callback' => 'absint', // Ensure it's an integer
    )
);

// Add control for number of related posts
$wp_customize->add_control(
    'sports_accessories_related_posts_count',
    array(
        'type'        => 'number',
        'label'       => esc_html__( 'Number of Related Posts to Display', 'sports-accessories' ),
        'section'     => 'sports_accessories_related_post_options',
        'input_attrs' => array(
            'min'  => 1,
            'max'  => 3, // Adjust maximum based on your preference
            'step' => 1,
        ),
    )
);

// Post Options - Related Post Label.
$wp_customize->add_setting(
	'sports_accessories_post_related_post_label',
	array(
		'default'           => __( 'Related Posts', 'sports-accessories' ),
		'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control(
	'sports_accessories_post_related_post_label',
	array(
		'label'    => esc_html__( 'Related Posts Label', 'sports-accessories' ),
		'section'  => 'sports_accessories_related_post_options',
		'settings' => 'sports_accessories_post_related_post_label',
		'type'     => 'text',
	)
);