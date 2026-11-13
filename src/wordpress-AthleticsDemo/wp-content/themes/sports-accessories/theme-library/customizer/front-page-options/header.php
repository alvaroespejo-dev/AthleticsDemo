<?php
/**
 * Header Section Settings
 *
 * @package sports_accessories
 */

// ---------------------------------------- HEADER OPTIONS ----------------------------------------------------

$wp_customize->add_section(
	'sports_accessories_header_options',
	array(
		'panel' => 'sports_accessories_front_page_options',
		'title' => esc_html__( 'Header Options', 'sports-accessories' ),
        'priority' => 1,
	)
);

// Add setting for sticky header
$wp_customize->add_setting(
	'sports_accessories_enable_sticky_header',
	array(
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
		'default'           => false,
	)
);

// Add control for sticky header setting
$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_sticky_header',
		array(
			'label'   => esc_html__( 'Enable Sticky Header', 'sports-accessories' ),
			'section' => 'sports_accessories_header_options',
		)
	)
);

// Banner Section - Enable Section.
$wp_customize->add_setting(
	'sports_accessories_enable_header_search_section',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_header_search_section',
		array(
			'label'    => esc_html__( 'Enable Search Section', 'sports-accessories' ),
			'section'  => 'sports_accessories_header_options',
			'settings' => 'sports_accessories_enable_header_search_section',
		)
	)
);

// Banner Section - Button Label.
$wp_customize->add_setting(
	'sports_accessories_header_button_label_',
	array(
		'default'           => '',
		'sanitize_callback' => 'sanitize_text_field',
	)
);

$wp_customize->add_control(
	'sports_accessories_header_button_label_',
	array(
		'label'           => esc_html__( 'Button Label', 'sports-accessories'  ),
		'section'         => 'sports_accessories_header_options',
		'settings'        => 'sports_accessories_header_button_label_',
		'type'            => 'text',
	)
);

// Banner Section - Button Link.
$wp_customize->add_setting(
	'sports_accessories_banner_button_link_',
	array(
		'default'           => '',
		'sanitize_callback' => 'esc_url_raw',
	)
);

$wp_customize->add_control(
	'sports_accessories_banner_button_link_',
	array(
		'label'           => esc_html__( 'Button Link', 'sports-accessories' ),
		'section'         => 'sports_accessories_header_options',
		'settings'        => 'sports_accessories_banner_button_link_',
		'type'            => 'url',
	)
);

// Add Separator Custom Control
$wp_customize->add_setting( 'sports_accessories_menu_separator', array(
	'sanitize_callback' => 'sanitize_text_field',
) );

$wp_customize->add_control( new Sports_Accessories_Separator_Custom_Control( $wp_customize, 'sports_accessories_menu_separator', array(
	'label' => __( 'Menu Settings', 'sports-accessories' ),
	'section' => 'sports_accessories_header_options',
	'settings' => 'sports_accessories_menu_separator',
))); 

$wp_customize->add_setting( 'sports_accessories_menu_font_size', array(
    'default'           => 16,
    'sanitize_callback' => 'absint',
) );

// Add control for site title size
$wp_customize->add_control( 'sports_accessories_menu_font_size', array(
    'type'        => 'number',
    'section'     => 'sports_accessories_header_options',
    'label'       => __( 'Menu Font Size ', 'sports-accessories' ),
    'input_attrs' => array(
        'min'  => 10,
        'max'  => 100,
        'step' => 1,
    ),
));

// Add setting for menu font weight
$wp_customize->add_setting('sports_accessories_menu_font_weight', array(
    'default'           => '600',
    'sanitize_callback' => 'sanitize_text_field',
));

// Add control for menu font weight
$wp_customize->add_control('sports_accessories_menu_font_weight', array(
    'type'     => 'select',
    'section'  => 'sports_accessories_header_options', 
    'label'    => __('Menu Font Weight', 'sports-accessories'),
    'choices'  => array(
		'100' => __('100','sports-accessories'),
		'200' => __('200','sports-accessories'),
		'300' => __('300','sports-accessories'),
		'400' => __('400','sports-accessories'),
		'500' => __('500','sports-accessories'),
		'600' => __('600','sports-accessories'),
		'700' => __('700','sports-accessories'),
		'800' => __('800','sports-accessories'),
		'900' => __('900','sports-accessories'),
    ),
));

$wp_customize->add_setting( 'sports_accessories_menu_text_transform', array(
    'default'           => 'capitalize', // Default value for text transform
    'sanitize_callback' => 'sanitize_text_field',
) );

// Add control for menu text transform
$wp_customize->add_control( 'sports_accessories_menu_text_transform', array(
    'type'     => 'select',
    'section'  => 'sports_accessories_header_options', // Adjust the section as needed
    'label'    => __( 'Menu Text Transform', 'sports-accessories' ),
    'choices'  => array(
        'none'       => __( 'None', 'sports-accessories' ),
        'capitalize' => __( 'Capitalize', 'sports-accessories' ),
        'uppercase'  => __( 'Uppercase', 'sports-accessories' ),
        'lowercase'  => __( 'Lowercase', 'sports-accessories' ),
    ),
) );

// Menu Text Color 
$wp_customize->add_setting(
	'sports_accessories_menu_text_color', 
	array(
		'default' => '',
		'sanitize_callback' => 'sanitize_hex_color',
	)
);

$wp_customize->add_control(
	new WP_Customize_Color_Control(
		$wp_customize, 
		'sports_accessories_menu_text_color', 
		array(
			'label' => __('Menu Color', 'sports-accessories'),
			'section' => 'sports_accessories_header_options',
		)
	)
);

// Sub Menu Text Color 
$wp_customize->add_setting(
	'sports_accessories_sub_menu_text_color', 
	array(
		'default' => '',
		'sanitize_callback' => 'sanitize_hex_color',
	)
);

$wp_customize->add_control(
	new WP_Customize_Color_Control(
		$wp_customize, 
		'sports_accessories_sub_menu_text_color', 
		array(
			'label' => __('Sub Menu Color', 'sports-accessories'),
			'section' => 'sports_accessories_header_options',
		)
	)
);

$wp_customize->add_setting( 
	'sports_accessories_header_settings_upgraded_features',
	array(
		'sanitize_callback' => 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_header_settings_upgraded_features', 
	array(
		'type'=> 'hidden',
		'description' => "
			<div class='customizer-upgraded-features'>
				<i class='fas fa-info-circle'></i>
				<span class='pro-text'>
					Unlock Premium <strong>Features</strong> ?<br>
					<a target='_blank' href='". esc_url(SPORTS_ACCESSORIES_PREMIUM_PAGE) ." '>Upgrade Pro</a>
				</div>
			</div>
		",
		'section' => 'sports_accessories_header_options'
	)
);