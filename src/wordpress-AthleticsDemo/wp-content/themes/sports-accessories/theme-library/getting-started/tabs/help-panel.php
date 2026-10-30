<?php
/**
 * Help Panel.
 *
 * @package sports_accessories
 */
?>

<div id="help-panel" class="panel-left visible">
    <div id="#help-panel" class="steps">  
        <h4 class="c">
            <?php esc_html_e( 'Quick Setup for Home Page', 'sports-accessories' ); ?>
            <a href="<?php echo esc_url( SPORTS_ACCESSORIES_THEME_DOCUMENTATION ); ?>" class="button button-primary" style="margin-left: 5px; margin-right: 10px;" target="_blank"><?php esc_html_e( 'Free Theme Documentation', 'sports-accessories' ); ?></a>
        </h4>
        <hr class="quick-set">
        <p><?php esc_html_e( '1) Go to the Dashboard. navigate to pages, add a new one, and label it "home" or whatever else you like.The page has now been created.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '2) Go back to the Dashboard and then select Settings.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '3) Then Go to readings in the setting.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '4) There are 2 options your latest post or static page.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '5) Select static page and select from the dropdown you wish to use as your home page, save changes.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '6) You can set the home page in this manner.', 'sports-accessories' ); ?></p> 
        <br>
        <h4><?php esc_html_e( 'Setup Banner Section', 'sports-accessories' ); ?></h4>
        <hr class="quick-set">
        <p><?php esc_html_e( '1) Go to Dashboard > Go to Appereance > then Go to Customizer.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '2) In Customizer > Go to Front Page Options > Go to Banner Section.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '3) For Setup Banner Section you have to create post in dashbord first.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '4) In Banner Section > Enable the Toggle button > and fill the following details.', 'sports-accessories' ); ?></p>
        <p><?php esc_html_e( '5) In this way you can set Banner Section.', 'sports-accessories' ); ?></p>
        <br>
        <h4><?php esc_html_e( 'Setup About Section', 'sports-accessories' ); ?></h4>
        <hr class="quick-set">
         <p><?php esc_html_e( '1) Go to dashboard > Go to Page or Post > add new Page or Post .', 'sports-accessories' ); ?></p>
         <p><?php esc_html_e( '2) In Customizer > Go to Front Page Options > Go to About Section.', 'sports-accessories' ); ?></p>
         <p><?php esc_html_e( '3) In About Section > Enable the Toggle button and give heading and set button text and select pages or post which you want.', 'sports-accessories' ); ?></p>
         <p><?php esc_html_e( '4) In this way you can set About Section.', 'sports-accessories' ); ?></p>
        <br>
    </div>
    <div class="custom-setting">
        <h4><?php esc_html_e( 'Quick Customizer Settings', 'sports-accessories' ); ?></h4>
        <span><a href="<?php echo esc_url( admin_url( 'customize.php' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a></span>
    </div>
    <hr>
   <div class="setting-box">
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img1.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Site Logo', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[control]=custom_logo' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img2.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Color Picker', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[control]=sports_accessories_primary_color' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img3.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Theme Options', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[panel]=sports_accessories_theme_options' ) ); ?>"target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
    </div>
    <div class="setting-box">
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img4.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Header Image ', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[control]=header_image' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img5.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Footer Option ', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[control]=sports_accessories_footer_copyright_text' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
        <div class="custom-links">
            <div class="icon-box">
                <img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/img6.png'; ?>" />
            </div>
            <h5><?php esc_html_e( 'Front Page Option', 'sports-accessories' ); ?></h5>
            <a href="<?php echo esc_url( admin_url( 'customize.php?autofocus[panel]=sports_accessories_front_page_options' ) ); ?>" target="_blank" class=""><?php esc_html_e( 'Customize', 'sports-accessories' ); ?></a>
            
        </div>
    </div>
</div>