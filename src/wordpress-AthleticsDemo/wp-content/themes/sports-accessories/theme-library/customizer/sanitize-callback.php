<?php
function sports_accessories_sanitize_select( $sports_accessories_input, $sports_accessories_setting ) {
	$sports_accessories_input = sanitize_key( $sports_accessories_input );
	$sports_accessories_choices = $sports_accessories_setting->manager->get_control( $sports_accessories_setting->id )->choices;
	return ( array_key_exists( $sports_accessories_input, $sports_accessories_choices ) ? $sports_accessories_input : $sports_accessories_setting->default );
}

function sports_accessories_sanitize_switch( $sports_accessories_input ) {
	if ( true === $sports_accessories_input ) {
		return true;
	} else {
		return false;
	}
}

function sports_accessories_sanitize_google_fonts( $sports_accessories_input, $sports_accessories_setting ) {
	$sports_accessories_choices = $sports_accessories_setting->manager->get_control( $sports_accessories_setting->id )->choices;
	return ( array_key_exists( $sports_accessories_input, $sports_accessories_choices ) ? $sports_accessories_input : $sports_accessories_setting->default );
}
/**
 * Sanitize HTML input.
 *
 * @param string $sports_accessories_input HTML input to sanitize.
 * @return string Sanitized HTML.
 */
function sports_accessories_sanitize_html( $sports_accessories_input ) {
    return wp_kses_post( $sports_accessories_input );
}

/**
 * Sanitize URL input.
 *
 * @param string $sports_accessories_input URL input to sanitize.
 * @return string Sanitized URL.
 */
function sports_accessories_sanitize_url( $sports_accessories_input ) {
    return esc_url_raw( $sports_accessories_input );
}

// Sanitize Scroll Top Position
function sports_accessories_sanitize_scroll_top_position( $sports_accessories_input ) {
    $valid_positions = array( 'bottom-right', 'bottom-left', 'bottom-center' );
    if ( in_array( $sports_accessories_input, $valid_positions ) ) {
        return $sports_accessories_input;
    } else {
        return 'bottom-right'; // Default to bottom-right if invalid value
    }
}

function sports_accessories_sanitize_image( $image, $setting ) {
	/*
	* Array of valid image file types.
	*
	* The array includes image mime types that are included in wp_get_mime_types()
	*/
	$mimes = array(
		'jpg|jpeg|jpe' => 'image/jpeg',
		'gif'          => 'image/gif',
		'png'          => 'image/png',
		'bmp'          => 'image/bmp',
		'tif|tiff'     => 'image/tiff',
		'ico'          => 'image/x-icon',
		'svg'          => 'image/svg+xml',
	);
	// Return an array with file extension and mime_type.
	$file = wp_check_filetype( $image, $mimes );
	// If $image has a valid mime_type, return it; otherwise, return the default.
	return ( $file['ext'] ? $image : $setting->default );
}

function sports_accessories_sanitize_choices( $sports_accessories_input, $sports_accessories_setting ) {
	global $wp_customize; 
	$control = $wp_customize->get_control( $sports_accessories_setting->id ); 
	if ( array_key_exists( $sports_accessories_input, $control->choices ) ) {
		return $sports_accessories_input;
	} else {
		return $sports_accessories_setting->default;
	}
}

function sports_accessories_sanitize_range_value( $sports_accessories_number, $sports_accessories_setting ) {

	// Ensure input is an absolute integer.
	$sports_accessories_number = absint( $sports_accessories_number );

	// Get the input attributes associated with the setting.
	$sports_accessories_atts = $sports_accessories_setting->manager->get_control( $sports_accessories_setting->id )->input_attrs;

	// Get minimum number in the range.
	$sports_accessories_min = ( isset( $sports_accessories_atts['min'] ) ? $sports_accessories_atts['min'] : $sports_accessories_number );

	// Get maximum number in the range.
	$sports_accessories_max = ( isset( $sports_accessories_atts['max'] ) ? $sports_accessories_atts['max'] : $sports_accessories_number );

	// Get step.
	$sports_accessories_step = ( isset( $sports_accessories_atts['step'] ) ? $sports_accessories_atts['step'] : 1 );

	// If the number is within the valid range, return it; otherwise, return the default.
	return ( $sports_accessories_min <= $sports_accessories_number && $sports_accessories_number <= $sports_accessories_max && is_int( $sports_accessories_number / $sports_accessories_step ) ? $sports_accessories_number : $sports_accessories_setting->default );
}