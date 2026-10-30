<?php
/**
 * Active Callbacks
 *
 * @package sports_accessories
 */

// Theme Options.
function sports_accessories_is_pagination_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_enable_pagination' )->value() );
}
function sports_accessories_is_breadcrumb_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_enable_breadcrumb' )->value() );
}
function sports_accessories_is_layout_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_website_layout' )->value() );
}
function sports_accessories_is_pagetitle_bcakground_image_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_page_header_style' )->value() );
}
function sports_accessories_is_preloader_style( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_enable_preloader' )->value() );
}

// Banner Slider Section.
function sports_accessories_is_banner_slider_section_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_enable_banner_section' )->value() );
}
function sports_accessories_is_banner_slider_section_and_content_type_post_enabled( $sports_accessories_control ) {
	$sports_accessories_content_type = $sports_accessories_control->manager->get_setting( 'sports_accessories_banner_slider_content_type' )->value();
	return ( sports_accessories_is_banner_slider_section_enabled( $sports_accessories_control ) && ( 'post' === $sports_accessories_content_type ) );
}
function sports_accessories_is_banner_slider_section_and_content_type_page_enabled( $sports_accessories_control ) {
	$sports_accessories_content_type = $sports_accessories_control->manager->get_setting( 'sports_accessories_banner_slider_content_type' )->value();
	return ( sports_accessories_is_banner_slider_section_enabled( $sports_accessories_control ) && ( 'page' === $sports_accessories_content_type ) );
}

// Service section.
function sports_accessories_is_about_section_enabled( $sports_accessories_control ) {
	return ( $sports_accessories_control->manager->get_setting( 'sports_accessories_enable_about_section' )->value() );
}
function sports_accessories_is_about_section_and_content_type_post_enabled( $sports_accessories_control ) {
	$sports_accessories_content_type = $sports_accessories_control->manager->get_setting( 'sports_accessories_about_content_type' )->value();
	return ( sports_accessories_is_about_section_enabled( $sports_accessories_control ) && ( 'post' === $sports_accessories_content_type ) );
}
function sports_accessories_is_about_section_and_content_type_page_enabled( $sports_accessories_control ) {
	$sports_accessories_content_type = $sports_accessories_control->manager->get_setting( 'sports_accessories_about_content_type' )->value();
	return ( sports_accessories_is_about_section_enabled( $sports_accessories_control ) && ( 'page' === $sports_accessories_content_type ) );
}