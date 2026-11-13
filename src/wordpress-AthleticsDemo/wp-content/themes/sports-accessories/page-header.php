<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! sports_accessories_has_page_header() ) {
    return;
}

$sports_accessories_classes = array( 'page-header' );
$sports_accessories_style = sports_accessories_page_header_style();

if ( $sports_accessories_style ) {
    $sports_accessories_classes[] = $sports_accessories_style . '-page-header';
}

$sports_accessories_visibility = get_theme_mod( 'sports_accessories_page_header_visibility', 'all-devices' );

if ( 'hide-all-devices' === $sports_accessories_visibility ) {
    // Don't show the header at all
    return;
}

if ( 'hide-tablet' === $sports_accessories_visibility ) {
    $sports_accessories_classes[] = 'hide-on-tablet';
} elseif ( 'hide-mobile' === $sports_accessories_visibility ) {
    $sports_accessories_classes[] = 'hide-on-mobile';
} elseif ( 'hide-tablet-mobile' === $sports_accessories_visibility ) {
    $sports_accessories_classes[] = 'hide-on-tablet-mobile';
}

$sports_accessories_PAGE_TITLE_background_color = get_theme_mod('sports_accessories_page_title_background_color_setting', '');

// Get the toggle switch value
$sports_accessories_background_image_enabled = get_theme_mod('sports_accessories_page_header_style', true);

// Add background image to the header if enabled
$sports_accessories_background_image = get_theme_mod( 'sports_accessories_page_header_background_image', '' );
$sports_accessories_background_height = get_theme_mod( 'sports_accessories_page_header_image_height', '200' );
$sports_accessories_inline_style = '';

if ( $sports_accessories_background_image_enabled && ! empty( $sports_accessories_background_image ) ) {
    $sports_accessories_inline_style .= 'background-image: url(' . esc_url( $sports_accessories_background_image ) . '); ';
    $sports_accessories_inline_style .= 'height: ' . esc_attr( $sports_accessories_background_height ) . 'px; ';
    $sports_accessories_inline_style .= 'background-size: cover; ';
    $sports_accessories_inline_style .= 'background-position: center center; ';

    // Add the unique class if the background image is set
    $sports_accessories_classes[] = 'has-background-image';
}

$sports_accessories_classes = implode( ' ', $sports_accessories_classes );
$sports_accessories_heading = get_theme_mod( 'sports_accessories_page_header_heading_tag', 'h1' );
$sports_accessories_heading = apply_filters( 'sports_accessories_page_header_heading', $sports_accessories_heading );

?>

<?php do_action( 'sports_accessories_before_page_header' ); ?>

<header class="<?php echo esc_attr( $sports_accessories_classes ); ?>" style="<?php echo esc_attr( $sports_accessories_inline_style ); ?> background-color: <?php echo esc_attr($sports_accessories_PAGE_TITLE_background_color); ?>;">

    <?php do_action( 'sports_accessories_before_page_header_inner' ); ?>

    <div class="asterthemes-wrapper page-header-inner">

        <?php if ( sports_accessories_has_page_header() ) : ?>

            <<?php echo esc_attr( $sports_accessories_heading ); ?> class="page-header-title">
                <?php echo wp_kses_post( sports_accessories_get_page_title() ); ?>
            </<?php echo esc_attr( $sports_accessories_heading ); ?>>

        <?php endif; ?>

        <?php if ( function_exists( 'sports_accessories_breadcrumb' ) ) : ?>
            <?php sports_accessories_breadcrumb(); ?>
        <?php endif; ?>

    </div><!-- .page-header-inner -->

    <?php do_action( 'sports_accessories_after_page_header_inner' ); ?>

</header><!-- .page-header -->

<?php do_action( 'sports_accessories_after_page_header' ); ?>