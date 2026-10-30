<?php
/**
 * Banner Section
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_banner_section',
	array(
		'panel'    => 'sports_accessories_front_page_options',
		'title'    => esc_html__( 'Banner Section', 'sports-accessories' ),
		'priority' => 10,
	)
);

// Banner Section - Enable Section.
$wp_customize->add_setting(
	'sports_accessories_enable_banner_section',
	array(
		'default'           => false,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_banner_section',
		array(
			'label'    => esc_html__( 'Enable Banner Section', 'sports-accessories' ),
			'section'  => 'sports_accessories_banner_section',
			'settings' => 'sports_accessories_enable_banner_section',
		)
	)
);

if ( isset( $wp_customize->selective_refresh ) ) {
	$wp_customize->selective_refresh->add_partial(
		'sports_accessories_enable_banner_section',
		array(
			'selector' => '#sports_accessories_banner_section .section-link',
			'settings' => 'sports_accessories_enable_banner_section',
		)
	);
}


// Banner Section - Banner Slider Content Type.
$wp_customize->add_setting(
	'sports_accessories_banner_slider_content_type',
	array(
		'default'           => 'post',
		'sanitize_callback' => 'sports_accessories_sanitize_select',
	)
);

$wp_customize->add_control(
	'sports_accessories_banner_slider_content_type',
	array(
		'label'           => esc_html__( 'Select Banner Slider Content Type', 'sports-accessories' ),
		'section'         => 'sports_accessories_banner_section',
		'settings'        => 'sports_accessories_banner_slider_content_type',
		'type'            => 'select',
		'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		'choices'         => array(
			'page' => esc_html__( 'Page', 'sports-accessories' ),
			'post' => esc_html__( 'Post', 'sports-accessories' ),
		),
	)
);

// Banner Slider Category Setting.
$wp_customize->add_setting('sports_accessories_banner_slider_category', array(
	'default'           => 'slider',
	'sanitize_callback' => 'sanitize_text_field',
));

// Add custom control for Banner Slider Category with conditional visibility.
$wp_customize->add_control(new Sports_Accessories_Customize_Category_Dropdown_Control($wp_customize, 'sports_accessories_banner_slider_category', array(
	'label'    => __('Select Banner Category', 'sports-accessories'),
	'section'  => 'sports_accessories_banner_section',
	'settings' => 'sports_accessories_banner_slider_category',
	'active_callback' => function() use ($wp_customize) {
		return $wp_customize->get_setting('sports_accessories_banner_slider_content_type')->value() === 'post';
	},
)));

for ( $sports_accessories_i = 1; $sports_accessories_i <= 3; $sports_accessories_i++ ) {

	// Banner Section - Select Banner Post.
	$wp_customize->add_setting(
		'sports_accessories_banner_slider_content_post_' . $sports_accessories_i,
		array(
			'sanitize_callback' => 'absint',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_banner_slider_content_post_' . $sports_accessories_i,
		array(
			/* translators: %d: Posts Count. */
			'label'           => sprintf( esc_html__( 'Select Post %d', 'sports-accessories' ), $sports_accessories_i ),
			'description'     => sprintf( esc_html__( 'Kindly :- Select a Post based on the category selected in the upper settings', 'sports-accessories' ), $sports_accessories_i ),
			'section'         => 'sports_accessories_banner_section',
			'settings'        => 'sports_accessories_banner_slider_content_post_' . $sports_accessories_i,
			'active_callback' => 'sports_accessories_is_banner_slider_section_and_content_type_post_enabled',
			'type'            => 'select',
			'choices'         => sports_accessories_get_post_choices(),
		)
	);

	// Banner Section - Select Banner Page.
	$wp_customize->add_setting(
		'sports_accessories_banner_slider_content_page_' . $sports_accessories_i,
		array(
			'sanitize_callback' => 'absint',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_banner_slider_content_page_' . $sports_accessories_i,
		array(
			/* translators: %d: Pages Count. */
			'label'           => sprintf( esc_html__( 'Select Page %d', 'sports-accessories' ), $sports_accessories_i ),
			'section'         => 'sports_accessories_banner_section',
			'settings'        => 'sports_accessories_banner_slider_content_page_' . $sports_accessories_i,
			'active_callback' => 'sports_accessories_is_banner_slider_section_and_content_type_page_enabled',
			'type'            => 'select',
			'choices'         => sports_accessories_get_page_choices(),
		)
	);

	// Service Section - Services Icons.
	$wp_customize->add_setting(
		'sports_accessories_about_left_image_1' . $sports_accessories_i,
		array(
			'sanitize_callback' => 'sports_accessories_sanitize_image',
		)
	);

	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'sports_accessories_about_left_image_1' . $sports_accessories_i,
			array(
				/* translators: %d: Banner Image Count. */
				'label'           => sprintf( esc_html__( 'Banner Image %d', 'sports-accessories' ), $sports_accessories_i ),
				'section'         => 'sports_accessories_banner_section',
				'settings'        => 'sports_accessories_about_left_image_1' . $sports_accessories_i,
				'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
			)
		)
	);

	// Banner Section - Short Label.
	$wp_customize->add_setting(
		'sports_accessories_banner_short_heading' . $sports_accessories_i,
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_banner_short_heading' . $sports_accessories_i,
		array(
			'label'           => esc_html__( 'Banner Extra Heading', 'sports-accessories' ),
			'section'         => 'sports_accessories_banner_section',
			'settings'        => 'sports_accessories_banner_short_heading' . $sports_accessories_i,
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
			'type'            => 'text',
		)
	);

	// Banner Section - Button Label.
	$wp_customize->add_setting(
		'sports_accessories_banner_button_label_' . $sports_accessories_i,
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_banner_button_label_' . $sports_accessories_i,
		array(
			/* translators: %d: Button Label Count. */
			'label'           => sprintf( esc_html__( 'Button Label %d', 'sports-accessories' ), $sports_accessories_i ),
			'section'         => 'sports_accessories_banner_section',
			'settings'        => 'sports_accessories_banner_button_label_' . $sports_accessories_i,
			'type'            => 'text',
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		)
	);

	// Banner Section - Button Link.
	$wp_customize->add_setting(
		'sports_accessories_banner_button_link_' . $sports_accessories_i,
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',	
		)
	);

	$wp_customize->add_control(
		'sports_accessories_banner_button_link_' . $sports_accessories_i,
		array(
			/* translators: %d: Button Link Count. */
			'label'           => sprintf( esc_html__( 'Button Link %d', 'sports-accessories' ), $sports_accessories_i ),
			'section'         => 'sports_accessories_banner_section',
			'settings'        => 'sports_accessories_banner_button_link_' . $sports_accessories_i,
			'type'            => 'url',
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		)
	);
}

// Enable Social Icons.
$wp_customize->add_setting(
	'sports_accessories_enable_social',
	array(
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
		'default'           => true,
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_enable_social',
		array(
			'label'   => esc_html__( 'Enable Social', 'sports-accessories' ),
			'description' => esc_html__( 'If you want to add a social icon you need to go to Dashboard = Appearance = Menus then create a new menu now add Custom Links then add proper links then choose Social then click Create Menu.', 'sports-accessories' ),
			'section' => 'sports_accessories_banner_section',
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		)
	)
);

// Banner Button Label Color
$wp_customize->add_setting(
	'sports_accessories_banner_btn_color',
	array(
		'default' => '',
		'sanitize_callback' => 'sanitize_hex_color',
	)
);
$wp_customize->add_control(new WP_Customize_Color_Control($wp_customize,'sports_accessories_banner_btn_color',array(
			'label' => __('Banner Button Label Color','sports-accessories'),
			'section' => 'sports_accessories_banner_section',
			'settings' => 'sports_accessories_banner_btn_color',
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		)
	)
);

// Banner Button Background Color
$wp_customize->add_setting('sports_accessories_banner_btn_bg_color',array(
		'default' => '',
		'sanitize_callback' => 'sanitize_hex_color',
	)
);
$wp_customize->add_control(new WP_Customize_Color_Control($wp_customize,'sports_accessories_banner_btn_bg_color',array(
			'label' => __('Banner Button Background Color','sports-accessories'),
			'section' => 'sports_accessories_banner_section',
			'settings' => 'sports_accessories_banner_btn_bg_color',
			'active_callback' => 'sports_accessories_is_banner_slider_section_enabled',
		)
	)
);

$wp_customize->add_setting( 
	'sports_accessories_banner_settings_upgraded_features',
	array(
		'sanitize_callback' => 'sanitize_text_field'
	)
);

$wp_customize->add_control(
	'sports_accessories_banner_settings_upgraded_features', 
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
		'section' => 'sports_accessories_banner_section'
	)
);