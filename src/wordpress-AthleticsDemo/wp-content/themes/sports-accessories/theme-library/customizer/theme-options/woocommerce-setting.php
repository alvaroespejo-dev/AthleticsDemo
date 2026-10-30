<?php
/**
 * WooCommerce Settings
 *
 * @package sports_accessories
 */

$wp_customize->add_section(
	'sports_accessories_woocommerce_settings',
	array(
		'panel' => 'sports_accessories_theme_options',
		'title' => esc_html__( 'WooCommerce Settings', 'sports-accessories' ),
	)
);

//WooCommerce - Products per page.
$wp_customize->add_setting( 'sports_accessories_products_per_page', array(
    'default'           => 9,
    'sanitize_callback' => 'absint',
));

$wp_customize->add_control( 'sports_accessories_products_per_page', array(
    'type'        => 'number',
    'section'     => 'sports_accessories_woocommerce_settings',
    'label'       => __( 'Products Per Page', 'sports-accessories' ),
    'input_attrs' => array(
        'min'  => 0,
        'max'  => 50,
        'step' => 1,
    ),
));

//WooCommerce - Products per row.
$wp_customize->add_setting( 'sports_accessories_products_per_row', array(
    'default'           => '3',
    'sanitize_callback' => 'sports_accessories_sanitize_choices',
) );

$wp_customize->add_control( 'sports_accessories_products_per_row', array(
    'label'    => __( 'Products Per Row', 'sports-accessories' ),
    'section'  => 'sports_accessories_woocommerce_settings',
    'settings' => 'sports_accessories_products_per_row',
    'type'     => 'select',
    'choices'  => array(
        '2' => '2',
		'3' => '3',
		'4' => '4',
    ),
) );

//WooCommerce - Show / Hide Related Product.
$wp_customize->add_setting(
	'sports_accessories_related_product_show_hide',
	array(
		'default'           => true,
		'sanitize_callback' => 'sports_accessories_sanitize_switch',
	)
);

$wp_customize->add_control(
	new Sports_Accessories_Toggle_Switch_Custom_Control(
		$wp_customize,
		'sports_accessories_related_product_show_hide',
		array(
			'label'   => esc_html__( 'Show / Hide Related product', 'sports-accessories' ),
			'section' => 'sports_accessories_woocommerce_settings',
		)
	)
);

// WooCommerce - Product Sale Position.
$wp_customize->add_setting(
	'sports_accessories_product_sale_position', 
	array(
		'default' => 'left',
		'sanitize_callback' => 'sanitize_text_field',
));

$wp_customize->add_control(
	'sports_accessories_product_sale_position', 
	array(
		'label' => __('Product Sale Position', 'sports-accessories'),
		'section' => 'sports_accessories_woocommerce_settings',
		'settings' => 'sports_accessories_product_sale_position',
		'type' => 'radio',
		'choices' => 
	array(
		'left' => __('Left', 'sports-accessories'),
		'right' => __('Right', 'sports-accessories'),
	),
));