<?php
function sports_accessories_get_all_google_fonts() {
    $sports_accessories_webfonts_json = get_template_directory() . '/theme-library/google-webfonts.json';
    if ( ! file_exists( $sports_accessories_webfonts_json ) ) {
        return array();
    }

    $sports_accessories_fonts_json_data = file_get_contents( $sports_accessories_webfonts_json );
    if ( false === $sports_accessories_fonts_json_data ) {
        return array();
    }

    $sports_accessories_all_fonts = json_decode( $sports_accessories_fonts_json_data, true );
    if ( json_last_error() !== JSON_ERROR_NONE ) {
        return array();
    }

    $sports_accessories_google_fonts = array();
    foreach ( $sports_accessories_all_fonts as $sports_accessories_font ) {
        $sports_accessories_google_fonts[ $sports_accessories_font['family'] ] = array(
            'family'   => $sports_accessories_font['family'],
            'variants' => $sports_accessories_font['variants'],
        );
    }
    return $sports_accessories_google_fonts;
}


function sports_accessories_get_all_google_font_families() {
    $sports_accessories_google_fonts  = sports_accessories_get_all_google_fonts();
    $sports_accessories_font_families = array();
    foreach ( $sports_accessories_google_fonts as $sports_accessories_font ) {
        $sports_accessories_font_families[ $sports_accessories_font['family'] ] = $sports_accessories_font['family'];
    }
    return $sports_accessories_font_families;
}

function sports_accessories_get_fonts_url() {
    $sports_accessories_fonts_url = '';
    $sports_accessories_fonts     = array();

    $sports_accessories_all_fonts = sports_accessories_get_all_google_fonts();

    if ( ! empty( get_theme_mod( 'sports_accessories_site_title_font', 'Arvo' ) ) ) {
        $sports_accessories_fonts[] = get_theme_mod( 'sports_accessories_site_title_font', 'Arvo' );
    }

    if ( ! empty( get_theme_mod( 'sports_accessories_site_description_font', 'Open Sans' ) ) ) {
        $sports_accessories_fonts[] = get_theme_mod( 'sports_accessories_site_description_font', 'Open Sans' );
    }

    if ( ! empty( get_theme_mod( 'sports_accessories_header_font', 'Arvo' ) ) ) {
        $sports_accessories_fonts[] = get_theme_mod( 'sports_accessories_header_font', 'Arvo' );
    }

    if ( ! empty( get_theme_mod( 'sports_accessories_content_font', 'Open Sans' ) ) ) {
        $sports_accessories_fonts[] = get_theme_mod( 'sports_accessories_content_font', 'Open Sans' );
    }

    $sports_accessories_fonts = array_unique( $sports_accessories_fonts );

    foreach ( $sports_accessories_fonts as $sports_accessories_font ) {
        $sports_accessories_variants      = $sports_accessories_all_fonts[ $sports_accessories_font ]['variants'];
        $sports_accessories_font_family[] = $sports_accessories_font . ':' . implode( ',', $sports_accessories_variants );
    }

    $sports_accessories_query_args = array(
        'family' => urlencode( implode( '|', $sports_accessories_font_family ) ),
    );

    if ( ! empty( $sports_accessories_font_family ) ) {
        $sports_accessories_fonts_url = add_query_arg( $sports_accessories_query_args, 'https://fonts.googleapis.com/css' );
    }

    return $sports_accessories_fonts_url;
}