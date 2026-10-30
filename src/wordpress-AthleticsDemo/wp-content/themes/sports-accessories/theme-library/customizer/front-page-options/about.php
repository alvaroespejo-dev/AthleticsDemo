<?php
/**
 * About Section
 *
 * @package sports_accessories
 */

	$wp_customize->add_section(
		'sports_accessories_about_section',
		array(
			'panel'    => 'sports_accessories_front_page_options',
			'title'    => esc_html__( 'About Section', 'sports-accessories' ),
			'priority' => 11,
		)
	);

	// About Section - Enable Section.
	$wp_customize->add_setting(
		'sports_accessories_enable_about_section',
		array(
			'default'           => false,
			'sanitize_callback' => 'sports_accessories_sanitize_switch',
		)
	);

	$wp_customize->add_control(
		new Sports_Accessories_Toggle_Switch_Custom_Control(
			$wp_customize,
			'sports_accessories_enable_about_section',
			array(
				'label'    => esc_html__( 'Enable About Section', 'sports-accessories' ),
				'section'  => 'sports_accessories_about_section',
				'settings' => 'sports_accessories_enable_about_section',
			)
		)
	);

	if ( isset( $wp_customize->selective_refresh ) ) {
		$wp_customize->selective_refresh->add_partial(
			'sports_accessories_enable_about_section',
			array(
				'selector' => '#sports_accessories_about_section .section-link',
				'settings' => 'sports_accessories_enable_about_section',
			)
		);
	}

	// About Section - About Content Type.
	$wp_customize->add_setting(
		'sports_accessories_about_content_type',
		array(
			'default'           => 'post',
			'sanitize_callback' => 'sports_accessories_sanitize_select',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_content_type',
		array(
			'label'           => esc_html__( 'Select About Content Type', 'sports-accessories' ),
			'section'         => 'sports_accessories_about_section',
			'settings'        => 'sports_accessories_about_content_type',
			'type'            => 'select',
			'active_callback' => 'sports_accessories_is_about_section_enabled',
			'choices'         => array(
				'page' => esc_html__( 'Page', 'sports-accessories' ),
				'post' => esc_html__( 'Post', 'sports-accessories' ),
			),
		)
	);

	// Services Category Setting.
	$wp_customize->add_setting('sports_accessories_about_category', array(
		'default'           => 'about',
		'sanitize_callback' => 'sanitize_text_field',
	));

	// Add custom control for Services Category with conditional visibility.
	$wp_customize->add_control(new Sports_Accessories_Customize_Category_Dropdown_Control($wp_customize, 'sports_accessories_about_category', array(
		'label'    => __('Select Services Category', 'sports-accessories'),
		'section'  => 'sports_accessories_about_section',
		'settings' => 'sports_accessories_about_category',
		'active_callback' => function() use ($wp_customize) {
			return $wp_customize->get_setting('sports_accessories_about_content_type')->value() === 'post';
		},
	)));

	// Service Section - Select Post.
	$wp_customize->add_setting(
		'sports_accessories_about_content_post_',
		array(
			'sanitize_callback' => 'absint',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_content_post_',
		array(
			'label'           => esc_html__( 'Select Post ', 'sports-accessories' ),
			'description'     => sprintf( esc_html__( 'Kindly :- Select a Post based on the category selected in the upper settings', 'sports-accessories' ), ),
			'section'         => 'sports_accessories_about_section',
			'settings'        => 'sports_accessories_about_content_post_',
			'active_callback' => 'sports_accessories_is_about_section_and_content_type_post_enabled',
			'type'            => 'select',
			'choices'         => sports_accessories_get_post_choices(),
		)
	);
	// About Section - Select About Page.
	$wp_customize->add_setting(
		'sports_accessories_about_content_page_',
		array(
			'sanitize_callback' => 'absint',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_content_page_',
		array(
			'label'           => esc_html__( 'Select Page', 'sports-accessories' ),
			'section'         => 'sports_accessories_about_section',
			'settings'        => 'sports_accessories_about_content_page_',
			'active_callback' => 'sports_accessories_is_about_section_and_content_type_page_enabled',
			'type'            => 'select',
			'choices'         => sports_accessories_get_page_choices(),
		)
	);

	// About Section - Button Label.
	$wp_customize->add_setting(
		'sports_accessories_about_button_label_',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_button_label_',
		array(
			'label'           => esc_html__( 'Button Label', 'sports-accessories' ),
			'section'         => 'sports_accessories_about_section',
			'settings'        => 'sports_accessories_about_button_label_',
			'type'            => 'text',
			'active_callback' => 'sports_accessories_is_about_section_enabled',
		)
	);

	// About Section - Button Link.
	$wp_customize->add_setting(
		'sports_accessories_about_button_link_',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_button_link_',
		array(
			'label'           => esc_html__( 'Button Link', 'sports-accessories' ),
			'section'         => 'sports_accessories_about_section',
			'settings'        => 'sports_accessories_about_button_link_',
			'type'            => 'url',
			'active_callback' => 'sports_accessories_is_about_section_enabled',
		)
	);

	$wp_customize->add_setting('sports_accessories_custom_image_setting_1', array(
		'default'           => '',
		'transport'         => 'refresh',
		'sanitize_callback' => 'sanitize_text_field', // Sanitization callback function
	));

	// Image control 1
	$wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'custom_image_setting_control_1', array(
		'label'    => __('About Us Image 1', 'sports-accessories'),
		'section'  => 'sports_accessories_about_section',
		'settings' => 'sports_accessories_custom_image_setting_1',
		'active_callback' => 'sports_accessories_is_about_section_enabled',
	)));

	// Image setting 2
	$wp_customize->add_setting('sports_accessories_custom_image_setting_2', array(
		'default'           => '',
		'transport'         => 'refresh',
		'sanitize_callback' => 'esc_url_raw', // Sanitization callback function
	));
	// Image control 2
	$wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'custom_image_setting_control_2', array(
		'label'    => __('About Us Image 2', 'sports-accessories'),
		'section'  => 'sports_accessories_about_section',
		'settings' => 'sports_accessories_custom_image_setting_2',
		'active_callback' => 'sports_accessories_is_about_section_enabled',
	)));

	// Image setting 3
	$wp_customize->add_setting('sports_accessories_custom_image_setting_3', array(
		'default'           => '',
		'transport'         => 'refresh',
		'sanitize_callback' => 'esc_url_raw', // Sanitization callback function
	));

	// Image control 3
	$wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'custom_image_setting_control_3', array(
		'label'    => __('About Us Image 3', 'sports-accessories'),
		'section'  => 'sports_accessories_about_section',
		'settings' => 'sports_accessories_custom_image_setting_3',
		'active_callback' => 'sports_accessories_is_about_section_enabled',
	)));

	$wp_customize->add_setting( 
		'sports_accessories_about_settings_upgraded_features',
		array(
			'sanitize_callback' => 'sanitize_text_field'
		)
	);

	$wp_customize->add_control(
		'sports_accessories_about_settings_upgraded_features', 
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
			'section' => 'sports_accessories_about_section'
		)
	);