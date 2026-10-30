<?php
/**
 * Theme Options
 *
 * @package sports_accessories
 */

$wp_customize->add_panel(
	'sports_accessories_theme_options',
	array(
		'title'    => esc_html__( 'Theme Options', 'sports-accessories' ),
		'priority' => 10,
	)
);

// Theme Options.
require get_template_directory() . '/theme-library/customizer/theme-options/theme-options.php';

// typography-setting.
require get_template_directory() . '/theme-library/customizer/theme-options/typography-setting.php';

// Page Title.
require get_template_directory() . '/theme-library/customizer/theme-options/page-title.php';

// Excerpt.
require get_template_directory() . '/theme-library/customizer/theme-options/excerpt.php';

// Sidebar Position.
require get_template_directory() . '/theme-library/customizer/theme-options/sidebar-position.php';

// Post Options.
require get_template_directory() . '/theme-library/customizer/theme-options/post-options.php';

// Single Post Options.
require get_template_directory() . '/theme-library/customizer/theme-options/single-post-options.php';

// Related Post Options.
require get_template_directory() . '/theme-library/customizer/theme-options/related-post-options.php';

// Footer Options.
require get_template_directory() . '/theme-library/customizer/theme-options/footer-options.php';

// Footer Social Icons.
require get_template_directory() . '/theme-library/customizer/theme-options/footer-social.php';

// 404 page option.
require get_template_directory() . '/theme-library/customizer/theme-options/404page-customize-setting.php';

// No Result page option.
require get_template_directory() . '/theme-library/customizer/theme-options/no-results-customize-setting.php';

// Reset Demo Options.
require get_template_directory() . '/theme-library/customizer/theme-options/reset-theme-settings.php';

// WooCommerce setting.
require get_template_directory() . '/theme-library/customizer/theme-options/woocommerce-setting.php';