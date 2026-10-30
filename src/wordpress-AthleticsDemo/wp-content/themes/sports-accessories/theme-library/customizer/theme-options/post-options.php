<?php
/**
 * Post Options
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_post_options',
	array(
		'title' => esc_html__( 'Post Options', 'sports-accessories' ),
		'panel' => 'sports_accessories_theme_options',
	)
);

// Post Options - Add Post Date Icon
$wp_customize->add_setting(
    'sports_accessories_post_date_icon',
    array(
        'default' => 'far fa-clock', 
        'sanitize_callback' => 'sanitize_text_field',
        'capability' => 'edit_theme_options',
    )
);

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control(
    $wp_customize, 
    'sports_accessories_post_date_icon',
    array(
        'label'    => __('Add Date Icon','sports-accessories'),
        'section'  => 'sports_accessories_post_options',
        'iconset'  => 'fa',
    )
));

// Post Options - Show / Hide Date.
$wp_customize->add_setting(
	'sports_accessories_post_hide_date',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_date',
		array(
			'label'   => esc_html__( 'Show / Hide Date', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Add Post Author Icon
$wp_customize->add_setting(
    'sports_accessories_post_author_icon',
    array(
        'default' => 'fas fa-user', 
        'sanitize_callback' => 'sanitize_text_field',
        'capability' => 'edit_theme_options',
    )
);

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control(
    $wp_customize, 
    'sports_accessories_post_author_icon',
    array(
        'label'    => __('Add Author Icon','sports-accessories'),
        'section'  => 'sports_accessories_post_options',
        'iconset'  => 'fa',
    )
));

// Post Options - Show / Hide Author.
$wp_customize->add_setting(
	'sports_accessories_post_hide_author',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_author',
		array(
			'label'   => esc_html__( 'Show / Hide Author', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Add Post Comments Icon
$wp_customize->add_setting(
    'sports_accessories_post_comments_icon',
    array(
        'default' => 'fas fa-comments', 
        'sanitize_callback' => 'sanitize_text_field',
        'capability' => 'edit_theme_options',
    )
);

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control(
    $wp_customize, 
    'sports_accessories_post_comments_icon',
    array(
        'label'    => __('Add Comments Icon','sports-accessories'),
        'section'  => 'sports_accessories_post_options',
        'iconset'  => 'fa',
    )
));

// Post Options - Show / Hide Comments.
$wp_customize->add_setting(
	'sports_accessories_post_hide_comments',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_comments',
		array(
			'label'   => esc_html__( 'Show / Hide Comments', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Add Post Time Icon
$wp_customize->add_setting(
    'sports_accessories_post_time_icon',
    array(
        'default' => 'fas fa-clock', 
        'sanitize_callback' => 'sanitize_text_field',
        'capability' => 'edit_theme_options',
    )
);

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control(
    $wp_customize, 
    'sports_accessories_post_time_icon',
    array(
        'label'    => __('Add Time Icon','sports-accessories'),
        'section'  => 'sports_accessories_post_options',
        'iconset'  => 'fa',
    )
));

// Post Options - Show / Hide Time.
$wp_customize->add_setting(
	'sports_accessories_post_hide_time',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_time',
		array(
			'label'   => esc_html__( 'Show / Hide Time', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Show / Hide Category.
$wp_customize->add_setting(
	'sports_accessories_post_hide_category',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_category',
		array(
			'label'   => esc_html__( 'Show / Hide Category', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Show / Hide Feature Image.
$wp_customize->add_setting(
	'sports_accessories_post_hide_feature_image',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_feature_image',
		array(
			'label'   => esc_html__( 'Show / Hide Featured Image', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Show / Hide Post Heading.
$wp_customize->add_setting(
	'sports_accessories_post_hide_post_heading',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_post_heading',
		array(
			'label'   => esc_html__( 'Show / Hide Post Heading', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// Post Options - Show / Hide Post Content.
$wp_customize->add_setting(
	'sports_accessories_post_hide_post_content',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_hide_post_content',
		array(
			'label'   => esc_html__( 'Show / Hide Post Content', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

// ---------------------------------------- Post layout ----------------------------------------------------

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_archive_layuout_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_archive_layuout_separator', array(
	'label' => __( 'Archive/Blogs Layout Setting', 'sports-accessories' ),
	'section' => 'sports_accessories_post_options',
	'settings' => 'sports_accessories_archive_layuout_separator',
)));


// Archive Layout - Column Layout.
$wp_customize->add_setting(
	'sports_accessories_archive_column_layout',
	array(
		'default'           => 'column-1',
		'sanitize_callback' => 'sports_accessories_sanitize_select',
	)
);

$wp_customize->add_control(
	'sports_accessories_archive_column_layout',
	array(
		'label'   => esc_html__( 'Select Posts Layout', 'sports-accessories' ),
		'section' => 'sports_accessories_post_options',
		'type'    => 'select',
		'choices' => array(
			'column-1' => __( 'Column 1', 'sports-accessories' ),
			'column-2' => __( 'Column 2', 'sports-accessories' ),
			'column-3' => __( 'Column 3', 'sports-accessories' ),
			'column-4' => __( 'Column 4', 'sports-accessories' ),
		),
	)
);

$wp_customize->add_setting('sports_accessories_blog_layout_option_setting',array(
	'default' => 'Left',
	'sanitize_callback' => 'sports_accessories_sanitize_choices'
  ));
  $wp_customize->add_control(new Sports_Accessories_Image_Radio_Control($wp_customize, 'sports_accessories_blog_layout_option_setting', array(
	'type' => 'select',
	'label' => __('Blog Content Alignment','sports-accessories'),
	'section' => 'sports_accessories_post_options',
	'choices' => array(
		'Left' => esc_url(get_template_directory_uri()).'/resource/img/layout-2.png',
		'Default' => esc_url(get_template_directory_uri()).'/resource/img/layout-1.png',
		'Right' => esc_url(get_template_directory_uri()).'/resource/img/layout-3.png',
))));

// ---------------------------------------- PAGINATION ----------------------------------------------------

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_pagination_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_pagination_separator', array(
	'label' => __( 'Enable / Disable Pagination Section', 'sports-accessories' ),
	'section' => 'sports_accessories_post_options',
	'settings' => 'sports_accessories_pagination_separator',
) ) );

// Pagination - Enable Pagination.
$wp_customize->add_setting(
	'sports_accessories_enable_pagination',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_pagination',
		array(
			'label'    => esc_html__( 'Enable Pagination', 'sports-accessories' ),
			'section'  => 'sports_accessories_post_options',
			'settings' => 'sports_accessories_enable_pagination',
			'type'     => 'checkbox',
		)
	)
);

// Pagination - Pagination Type.
$wp_customize->add_setting(
	'sports_accessories_pagination_type',
	array(
		'default'           => 'default',
		'sanitize_callback' => 'sports_accessories_sanitize_select',
	)
);

$wp_customize->add_control(
	'sports_accessories_pagination_type',
	array(
		'label'           => esc_html__( 'Pagination Type', 'sports-accessories' ),
		'section'         => 'sports_accessories_post_options',
		'settings'        => 'sports_accessories_pagination_type',
		'active_callback' => 'sports_accessories_is_pagination_enabled',
		'type'            => 'select',
		'choices'         => array(
			'default' => __( 'Default (Older/Newer)', 'sports-accessories' ),
			'numeric' => __( 'Numeric', 'sports-accessories' ),
		),
	)
);

// ---------------------------------------- Read More ----------------------------------------------------

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_readmore_separators', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_readmore_separators', array(
	'label' => __( 'Read More Button Settings', 'sports-accessories' ),
	'section' => 'sports_accessories_post_options',
	'settings' => 'sports_accessories_readmore_separators',
)));


// Post Options - Show / Hide Read More Button.
$wp_customize->add_setting(
	'sports_accessories_post_readmore_button',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_post_readmore_button',
		array(
			'label'   => esc_html__( 'Show / Hide Read More Button', 'sports-accessories' ),
			'section' => 'sports_accessories_post_options',
		)
	)
);

$wp_customize->add_setting(
    'sports_accessories_readmore_btn_icon',
    array(
        'default' => 'fas fa-chevron-right', // Set default icon here
        'sanitize_callback' => 'sanitize_text_field',
        'capability' => 'edit_theme_options',
    )
);

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control(
    $wp_customize, 
    'sports_accessories_readmore_btn_icon',
    array(
        'label'    => __('Read More Icon','sports-accessories'),
        'section'  => 'sports_accessories_post_options',
        'iconset'  => 'fa',
    )
));

$wp_customize->add_setting(
	'sports_accessories_readmore_button_text',
	array(
		'default'           => 'Read More',
		'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control(
	'sports_accessories_readmore_button_text',
	array(
		'label'           => esc_html__( 'Read More Button Text', 'sports-accessories' ),
		'section'         => 'sports_accessories_post_options',
		'settings'        => 'sports_accessories_readmore_button_text',
		'type'            => 'text',
	)
);

// Featured Image Dimension
$wp_customize->add_setting(
	'sports_accessories_blog_post_featured_image_dimension',
	array(
		'default' => 'default',
		'sanitize_callback' => 'sports_accessories_sanitize_choices'
	)
);

$wp_customize->add_control(
	'sports_accessories_blog_post_featured_image_dimension', 
	array(
		'type' => 'select',
		'label' => __('Featured Image Dimension','sports-accessories'),
		'section' => 'sports_accessories_post_options',
		'choices' => array(
			'default' => __('Default','sports-accessories'),
			'custom' => __('Custom Image Size','sports-accessories'),
		),
		'description' => __('Note: If you select "Custom Image Size", you can set a custom width and height up to 950px.', 'sports-accessories')
	)
);
 
// Featured Image Custom Width
$wp_customize->add_setting(
	'sports_accessories_blog_post_featured_image_custom_width',
	array(
		'default'=> '',
		'sanitize_callback'	=> 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_blog_post_featured_image_custom_width',
	array(
		'label'	=> __('Featured Image Custom Width','sports-accessories'),
		'section'=> 'sports_accessories_post_options',
		'type'=> 'text',
		'input_attrs' => array(
			'placeholder' => __( '300', 'sports-accessories' ),
		),
		'active_callback' => 'sports_accessories_blog_post_featured_image_dimension'
	)
);

// Featured Image Custom Height
$wp_customize->add_setting(
	'sports_accessories_blog_post_featured_image_custom_height',
	array(
		'default'=> '',
		'sanitize_callback'	=> 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_blog_post_featured_image_custom_height',
	array(
		'label'	=> __('Featured Image Custom Height','sports-accessories'),
		'section'=> 'sports_accessories_post_options',
		'type'=> 'text',
		'input_attrs' => array(
			'placeholder' => __( '300', 'sports-accessories' ),
		),
		'active_callback' => 'sports_accessories_blog_post_featured_image_dimension'
	)
);

// Featured Image Border Radius
$wp_customize->add_setting( 
	'sports_accessories_featured_image_border_radius', 
	array(
		'default'           => 10,
		'transport'         => 'refresh',
		'sanitize_callback' => 'sports_accessories_sanitize_range_value',
	) 
);

$wp_customize->add_control( 
	'sports_accessories_featured_image_border_radius', 
	array(
		'label'       => esc_html__( 'Featured Image Border Radius', 'sports-accessories' ),
		'section'     => 'sports_accessories_post_options',
		'type'        => 'range',
		'input_attrs' => array(
			'step' => 1,
			'min'  => 0,
			'max'  => 150,
		),
	) 
);

$wp_customize->add_setting('sports_accessories_show_first_caps', array(
	'default'           => false,
	'transport'         => 'refresh',
	'sanitize_callback' => 'sports_accessories_sanitize_switch',
));

$wp_customize->add_control(new Sports_Accessories_Toggle_Switch_Custom_Control(
	$wp_customize,
	'sports_accessories_show_first_caps',
	array(
		'label'   => esc_html__('First Cap (First Capital Letter)', 'sports-accessories'),
		'section' => 'sports_accessories_post_options',
	)
));