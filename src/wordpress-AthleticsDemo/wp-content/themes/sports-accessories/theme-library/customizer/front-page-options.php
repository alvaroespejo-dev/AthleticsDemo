<?php
/**
 * Front Page Options
 *
 * @package Sports Accessories
 */

$wp_customize->add_panel(
	'sports_accessories_front_page_options',
	array(
		'title'    => esc_html__( 'Front Page Options', 'sports-accessories' ),
		'priority' => 20,
	)
);

// Header Section.
require get_template_directory() . '/theme-library/customizer/front-page-options/header.php';

// Banner Section.
require get_template_directory() . '/theme-library/customizer/front-page-options/banner.php';

// Tranding Product Section.
require get_template_directory() . '/theme-library/customizer/front-page-options/about.php';