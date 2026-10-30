<?php
/**
 * Render homepage sections.
 */
function sports_accessories_homepage_sections() {
	$sports_accessories_homepage_sections = array_keys( sports_accessories_get_homepage_sections() );

	foreach ( $sports_accessories_homepage_sections as $sports_accessories_section ) {
		require get_template_directory() . '/sections/' . $sports_accessories_section . '.php';
	}
}