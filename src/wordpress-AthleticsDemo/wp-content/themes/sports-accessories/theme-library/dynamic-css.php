<?php
/**
 * Dynamic CSS
 */
function sports_accessories_dynamic_css() {
	$sports_accessories_primary_color = get_theme_mod( 'sports_accessories_primary_color', '#860000' );

	$sports_accessories_site_title_font       = get_theme_mod( 'sports_accessories_site_title_font', 'Arvo' );
	$sports_accessories_site_description_font = get_theme_mod( 'sports_accessories_site_description_font', 'Open Sans' );
	$sports_accessories_header_font           = get_theme_mod( 'sports_accessories_header_font', 'Arvo' );
	$sports_accessories_content_font          = get_theme_mod( 'sports_accessories_content_font', 'Open Sans' );

	// Enqueue Google Fonts
	$sports_accessories_fonts_url = sports_accessories_get_fonts_url();
	if ( ! empty( $sports_accessories_fonts_url ) ) {
		wp_enqueue_style( 'sports-accessories-google-fonts', esc_url( $sports_accessories_fonts_url ), array(), null );
	}

	$sports_accessories_custom_css  = '';
	$sports_accessories_custom_css .= '
    /* Color */
    :root {
        --primary-color: ' . esc_attr( $sports_accessories_primary_color ) . ';
        --header-text-color: ' . esc_attr( '#' . get_header_textcolor() ) . ';
    }
    ';

	$sports_accessories_custom_css .= '
    /* Typography */
    :root {
        --font-heading: "' . esc_attr( $sports_accessories_header_font ) . '", serif;
        --font-main: -apple-system, BlinkMacSystemFont, "' . esc_attr( $sports_accessories_content_font ) . '", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }

    body,
	button, input, select, optgroup, textarea, p {
        font-family: "' . esc_attr( $sports_accessories_content_font ) . '", serif;
	}

	.site-identity p.site-title, h1.site-title a, h1.site-title, p.site-title a, .site-branding h1.site-title a {
        font-family: "' . esc_attr( $sports_accessories_site_title_font ) . '", serif;
	}
    
	p.site-description {
        font-family: "' . esc_attr( $sports_accessories_site_description_font ) . '", serif !important;
	}
    ';

	wp_add_inline_style( 'sports-accessories-style', $sports_accessories_custom_css );
}
add_action( 'wp_enqueue_scripts', 'sports_accessories_dynamic_css', 99 );