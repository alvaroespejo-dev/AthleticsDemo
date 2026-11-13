<?php
/**
 * No Results page
 *
 * @package sports_accessories
 */

/*=========================================
No Results Page
=========================================*/
$wp_customize->add_section(
	'no_results_pg_options', array(
		'title' => esc_html__( 'No Results Page', 'sports-accessories' ),
		'panel' => 'sports_accessories_theme_options',
	)
);

//  Title // 
$wp_customize->add_setting(
	'sports_accessories_pg_no_results_ttl',
	array(
        'default'			=> __('Nothing Found','sports-accessories'),
		'capability'     	=> 'edit_theme_options',
		'sanitize_callback' => 'sports_accessories_sanitize_html',
	)
);	

$wp_customize->add_control( 
	'sports_accessories_pg_no_results_ttl',
	array(
	    'label'   => __('No Results Title','sports-accessories'),
	    'section' => 'no_results_pg_options',
		'type'           => 'text',
	)  
);

//  Text // 
$wp_customize->add_setting(
	'sports_accessories_pg_no_results_text',
	array(
        'default'			=> __('Sorry, but nothing matched your search terms. Please try again with some different keywords.','sports-accessories'),
		'capability'     	=> 'edit_theme_options',
		'sanitize_callback' => 'sports_accessories_sanitize_html',
	)
);	

$wp_customize->add_control( 
	'sports_accessories_pg_no_results_text',
	array(
	    'label'   => __('No Results Text','sports-accessories'),
	    'section' => 'no_results_pg_options',
		'type'           => 'text',
	)  
);