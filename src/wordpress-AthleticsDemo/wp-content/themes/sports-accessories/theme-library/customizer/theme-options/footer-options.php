<?php
/**
 * Footer Options
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_footer_options',
	array(
		'panel' => 'sports_accessories_theme_options',
		'title' => esc_html__( 'Footer Options', 'sports-accessories' ),
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_footer_separators', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_footer_separators', array(
	'label' => __( 'Footer Settings', 'sports-accessories' ),
	'section' => 'sports_accessories_footer_options',
	'settings' => 'sports_accessories_footer_separators',
)));

// Footer Section - Enable Section.
$wp_customize->add_setting(
	'sports_accessories_enable_footer_section',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_footer_section',
		array(
			'label'    => esc_html__( 'Show / Hide Footer', 'sports-accessories' ),
			'section'  => 'sports_accessories_footer_options',
			'settings' => 'sports_accessories_enable_footer_section',
		)
	)
);

// column // 
$wp_customize->add_setting(
	'sports_accessories_footer_widget_column',
	array(
        'default'			=> '4',
		'capability'     	=> 'edit_theme_options',
		'sanitize_callback' => 'sports_accessories_sanitize_select',
		
	)
);	

$wp_customize->add_control(
	'sports_accessories_footer_widget_column',
	array(
	    'label'   		=> __('Select Widget Column','sports-accessories'),
		'description' => __('Note: Default footer widgets are shown. Add your preferred widgets in (Appearance > Widgets > Footer) to see changes.', 'sports-accessories'),
	    'section' 		=> 'sports_accessories_footer_options',
		'type'			=> 'select',
		'choices'        => 
		array(
			'' => __( 'None', 'sports-accessories' ),
			'1' => __( '1 Column', 'sports-accessories' ),
			'2' => __( '2 Column', 'sports-accessories' ),
			'3' => __( '3 Column', 'sports-accessories' ),
			'4' => __( '4 Column', 'sports-accessories' )
		) 
	) 
);

//  BG Color // 
$wp_customize->add_setting('footer_background_color_setting', array(
    'default' => '#000',
    'sanitize_callback' => 'sanitize_hex_color',
));

$wp_customize->add_control(new WP_Customize_Color_Control($wp_customize, 'footer_background_color_setting', array(
    'label' => __('Footer Background Color', 'sports-accessories'),
    'section' => 'sports_accessories_footer_options',
)));

// Footer Background Image Setting
$wp_customize->add_setting('footer_background_image_setting', array(
    'default' => '',
    'sanitize_callback' => 'esc_url_raw',
));

$wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'footer_background_image_setting', array(
    'label' => __('Footer Background Image', 'sports-accessories'),
    'section' => 'sports_accessories_footer_options',
)));

// Footer Background Attachment
$wp_customize->add_setting(
	'sports_accessories_footer_image_attachment_setting',
	array(
		'default'=> 'scroll',
		'sanitize_callback' => 'sports_accessories_sanitize_choices'
	)
);

$wp_customize->add_control(
	'sports_accessories_footer_image_attachment_setting',
	array(
		'type' => 'select',
		'label' => __('Footer Background Attatchment','sports-accessories'),
		'choices' => array(
			'fixed' => __('fixed','sports-accessories'),
			'scroll' => __('scroll','sports-accessories'),
		),
		'section'=> 'sports_accessories_footer_options',
  	)
);

//Footer Image Position
$wp_customize->add_setting(
	'sports_accessories_footer_img_position_setting',
	array(
        'default'			=> 'center center',
		'capability'     	=> 'edit_theme_options',
		'sanitize_callback' => 'sports_accessories_sanitize_choices',
		
	)
);	

$wp_customize->add_control(
	'sports_accessories_footer_img_position_setting',
	array(
		'label'   		=> __('Footer Image Position','sports-accessories'),
	    'section' 		=> 'sports_accessories_footer_options',
		'type'			=> 'select',
		'choices'       => 
		array(
			'center center'   => __( 'Center', 'sports-accessories' ),
			'center top'   	  => __( 'Top', 'sports-accessories' ),
			'center bottom'   => __( 'Bottom', 'sports-accessories' ),
		) 
	) 
);

$wp_customize->add_setting('footer_text_transform', array(
    'default' => 'none',
    'sanitize_callback' => 'sanitize_text_field',
));

// Add Footer Text Transform Control
$wp_customize->add_control('footer_text_transform', array(
    'label' => __('Footer Heading Text Transform', 'sports-accessories'),
    'section' => 'sports_accessories_footer_options',
    'settings' => 'footer_text_transform',
    'type' => 'select',
    'choices' => array(
        'none' => __('None', 'sports-accessories'),
        'capitalize' => __('Capitalize', 'sports-accessories'),
        'uppercase' => __('Uppercase', 'sports-accessories'),
        'lowercase' => __('Lowercase', 'sports-accessories'),
    ),
));

// Footer Heading Alignment
$wp_customize->add_setting(
	'sports_accessories_footer_header_align',
	array(
		'default' 			=> 'left',
		'sanitize_callback' => 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_footer_header_align',
	array(
		'label' => __('Footer Heading Alignment ','sports-accessories'),
		'section' => 'sports_accessories_footer_options',
		'type'			=> 'select',
		'choices' => 
		array(
			'left' => __('Left','sports-accessories'),
			'right' => __('Right','sports-accessories'),
			'center' => __('Center','sports-accessories'),
		),
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_copyright_separators', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_copyright_separators', array(
	'label' => __( 'Copyright Settings', 'sports-accessories' ),
	'section' => 'sports_accessories_footer_options',
	'settings' => 'sports_accessories_copyright_separators',
)));

// Copyright Section - Enable Section.
$wp_customize->add_setting(
	'sports_accessories_enable_copyright_section',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_copyright_section',
		array(
			'label'    => esc_html__( 'Show / Hide Copyright', 'sports-accessories' ),
			'section'  => 'sports_accessories_footer_options',
			'settings' => 'sports_accessories_enable_copyright_section',
		)
	)
);

$wp_customize->add_setting(
	'sports_accessories_footer_copyright_text',
	array(
		'default'           => '',
		'sanitize_callback' => 'wp_kses_post',
		'transport'         => 'refresh',
	)
);

$wp_customize->add_control(
	'sports_accessories_footer_copyright_text',
	array(
		'label'    => esc_html__( 'Copyright Text', 'sports-accessories' ),
		'section'  => 'sports_accessories_footer_options',
		'settings' => 'sports_accessories_footer_copyright_text',
		'type'     => 'textarea',
	)
);

//Copyright Alignment
$wp_customize->add_setting(
	'sports_accessories_footer_bottom_align',
	array(
		'default' 			=> 'center',
		'sanitize_callback' => 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_footer_bottom_align',
	array(
		'label' => __('Copyright Alignment ','sports-accessories'),
		'section' => 'sports_accessories_footer_options',
		'type'			=> 'select',
		'choices' => 
		array(
			'left' => __('Left','sports-accessories'),
			'right' => __('Right','sports-accessories'),
			'center' => __('Center','sports-accessories'),
		),
	)
);

//Copyright Font Size
$wp_customize->add_setting( 
	'sports_accessories_copyright_font_size', 
	array(
		'default'           => 16,
		'sanitize_callback' => 'absint',
	)
);

$wp_customize->add_control( 'sports_accessories_copyright_font_size', 
	array(
		'type'        => 'number',
		'section'     => 'sports_accessories_footer_options',
		'label'       => __( 'Copyright Font Size ', 'sports-accessories' ),
		'input_attrs' => 
		array(
			'min'  => 10,
			'max'  => 100,
			'step' => 1,
		),
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_scroll_separators', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_scroll_separators', array(
	'label' => __( 'Scroll Top Settings', 'sports-accessories' ),
	'section' => 'sports_accessories_footer_options',
	'settings' => 'sports_accessories_scroll_separators',
)));

// Footer Options - Scroll Top.
$wp_customize->add_setting(
	'sports_accessories_scroll_top',
	array(
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
		'default'           => true,
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_scroll_top',
		array(
			'label'   => esc_html__( 'Enable Scroll Top Button', 'sports-accessories' ),
			'section' => 'sports_accessories_footer_options',
		)
	)
);
// icon // 
$wp_customize->add_setting(
	'sports_accessories_scroll_btn_icon',
	array(
        'default' => 'fas fa-chevron-up',
		'sanitize_callback' => 'sanitize_text_field',
		'capability' => 'edit_theme_options',
		
	)
);	

$wp_customize->add_control(new Sports_Accessories_Change_Icon_Control($wp_customize, 
	'sports_accessories_scroll_btn_icon',
	array(
	    'label'   		=> __('Scroll Top Icon','sports-accessories'),
	    'section' 		=> 'sports_accessories_footer_options',
		'iconset' => 'fa',
	))  
);


$wp_customize->add_setting( 'sports_accessories_scroll_top_position', array(
    'default'           => 'bottom-right',
    'sanitize_callback' => 'sports_accessories_sanitize_scroll_top_position',
) );

// Add control for Scroll Top Button Position
$wp_customize->add_control( 'sports_accessories_scroll_top_position', array(
    'label'    => __( 'Scroll Top Button Position', 'sports-accessories' ),
    'section'  => 'sports_accessories_footer_options',
    'settings' => 'sports_accessories_scroll_top_position',
    'type'     => 'select',
    'choices'  => array(
        'bottom-right' => __( 'Bottom Right', 'sports-accessories' ),
        'bottom-left'  => __( 'Bottom Left', 'sports-accessories' ),
        'bottom-center'=> __( 'Bottom Center', 'sports-accessories' ),
    ),
) );

$wp_customize->add_setting( 'sports_accessories_scroll_top_shape', array(
    'default'           => 'box',
    'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( 'sports_accessories_scroll_top_shape', array(
    'label'    => __( 'Scroll to Top Button Shape', 'sports-accessories' ),
    'section'  => 'sports_accessories_footer_options',
    'settings' => 'sports_accessories_scroll_top_shape',
    'type'     => 'radio',
    'choices'  => array(
        'box'        => __( 'Box', 'sports-accessories' ),
        'curved-box' => __( 'Curved Box', 'sports-accessories' ),
        'circle'     => __( 'Circle', 'sports-accessories' ),
    ),
) );