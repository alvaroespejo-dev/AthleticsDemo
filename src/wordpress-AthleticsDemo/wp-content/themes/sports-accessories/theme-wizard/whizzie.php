<?php
/**
* Wizard
* @package Whizzie
* @since 1.0.0
*/

class Whizzie {
	protected $version = '1.1.0';
	protected $theme_name = '';
	protected $theme_title = '';
	protected $page_slug = '';
	protected $page_title = '';
	protected $config_steps = array();
	public $parent_slug;
	
	/**
	 * Constructor
	 * @param $config Configuration parameters
	 */
	public function __construct( $config ) {
		$this->set_vars( $config );
		$this->init();
	}

	/**
	 * Set variables based on configuration
	 * @param $config Configuration parameters
	 */
	public function set_vars( $config ) {
		if ( isset( $config['page_slug'] ) ) {
			$this->page_slug = esc_attr( $config['page_slug'] );
		}
		if ( isset( $config['page_title'] ) ) {
			$this->page_title = esc_attr( $config['page_title'] );
		}
		if ( isset( $config['steps'] ) ) {
			$this->config_steps = $config['steps'];
		}

		$current_theme = wp_get_theme();
		$this->theme_title = $current_theme->get( 'Name' );
		$this->theme_name = strtolower( preg_replace( '#[^a-zA-Z]#', '', $current_theme->get( 'Name' ) ) );
		$this->page_slug = apply_filters( $this->theme_name . '_theme_setup_wizard_page_slug', $this->theme_name . '-wizard' );
		$this->parent_slug = apply_filters( $this->theme_name . '_theme_setup_wizard_parent_slug', '' );
	}

	/*** Initialize hooks and actions ***/
	public function init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_menu', array( $this, 'menu_page' ) );
		add_action( 'wp_ajax_setup_widgets', array( $this, 'setup_widgets' ) );
		add_action( 'admin_init', array( $this, 'ensure_woocommerce_installed' ) );
	}
	
	public function enqueue_scripts() {
		wp_enqueue_style( 'theme-wizard-style', get_template_directory_uri() . '/theme-wizard/assets/css/theme-wizard-style.css');
		wp_register_script( 'theme-wizard-script', get_template_directory_uri() . '/theme-wizard/assets/js/theme-wizard-script.js', array( 'jquery' ));
		wp_localize_script(
			'theme-wizard-script',
			'sports_accessories_whizzie_params',
			array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'verify_text' => esc_html( 'verifying', 'sports-accessories' )
			)
		);
		wp_enqueue_script( 'theme-wizard-script' );
	}

	public function menu_page() {
		add_theme_page( esc_html( $this->page_title ), esc_html( $this->page_title ), 'manage_options', $this->page_slug, array( $this, 'sports_accessories_setup_wizard' ) );
	}

	/*** Display the wizard page content ***/
	public function wizard_page() { ?>
		<div class="main-wrap">
			<div class="card whizzie-wrap">
				<ul class="whizzie-menu">
					<?php foreach ( $this->get_steps() as $step ) : ?>
						<li data-step="<?php echo esc_attr( $step['id'] ); ?>" class="step step-<?php echo esc_attr( $step['id'] ); ?>">

							<h2><?php echo esc_html( $step['title'] ); ?></h2>

							<?php
							$content = call_user_func( array( $this, $step['view'] ) );
							?>

							<?php if ( isset( $content['summary'] ) ) : ?>
								<div class="summary">
									<?php echo wp_kses_post( $content['summary'] ); ?>
								</div>
							<?php endif; ?>

							<?php if ( isset( $content['detail'] ) ) : ?>
								<p>
									<a href="#" class="more-info">
										<?php esc_html_e( 'More Info', 'sports-accessories' ); ?>
									</a>
								</p>
								<div class="detail">
									<?php echo wp_kses_post( $content['detail'] ); ?>
								</div>
							<?php endif; ?>

							<?php if ( ! empty( $step['button_text'] ) ) : ?>
								<div class="button-wrap">

									<?php if ( ! get_option( 'is-demo-imported-' . get_stylesheet() ) ) : ?>

										<a href="#"
										class="button button-primary do-it"
										data-callback="<?php echo esc_attr( $step['callback'] ); ?>"
										data-step="<?php echo esc_attr( $step['id'] ); ?>">
											<?php echo esc_html( $step['button_text'] ); ?>
										</a>

									<?php else : ?>

										<a target="_blank"
										href="<?php echo esc_url( home_url() ); ?>"
										class="button button-primary"
										style="font-size:20px;font-weight:600;">
											<?php esc_html_e( 'Visit Site', 'sports-accessories' ); ?>
										</a>

									<?php endif; ?>

								</div>
							<?php endif; ?>

						</li>
					<?php endforeach; ?>
				</ul>
				<div class="step-loading">
					<span class="spinner"></span>
				</div>
			</div>
		</div>
	<?php }

	/*** Setup wizard page content and options ***/
	public function sports_accessories_setup_wizard() { ?>
		<div class="wrapper-info get-stared-page-wrap">
			<div class="tab-sec theme-option-tab">
				<div id="demo_offer" class="tabcontent">
					<?php $this->wizard_page(); ?>
				</div>
			</div>
		</div>
	<?php }

	/**
	 * Get the steps for the wizard
	 * @return array
	 */
	public function get_steps() {
		$steps = array(
			'intro' => array(
				'id' => 'intro',
				'title' => __( 'Welcome to ', 'sports-accessories' ) . $this->theme_title,
				'view' => 'get_step_intro',
				'callback' => 'do_next_step',
				'button_text' => __( 'Start Now', 'sports-accessories' ),
				'can_skip' => false
			),
			'widgets' => array(
				'id' => 'widgets',
				'title' => __( 'Demo Importer', 'sports-accessories' ),
				'view' => 'get_step_widgets',
				'callback' => 'install_widgets',
				'button_text' => __( 'Import Demo', 'sports-accessories' ),
				'can_skip' => true
			),
			'done' => array(
				'id' => 'done',
				'title' => __( 'All Done', 'sports-accessories' ),
				'view' => 'get_step_done'
			)
		);

		return $steps;
	}

	/*** Display the content for the intro step ***/
	public function get_step_intro() { ?>
		<div class="summary">
			<p style="text-align: center;"><?php esc_html_e( 'Thank you for choosing our theme! We are excited to help you get started with your new website.', 'sports-accessories' ); ?></p>
			<p style="text-align: center;"><?php esc_html_e( 'To ensure you make the most of our theme, we recommend following the setup steps outlined here. This process will help you configure the theme to best suit your needs and preferences. Click on the "Start Now" button to begin the setup.', 'sports-accessories' ); ?></p>
		</div>
	<?php }

	/*** Display the content for the widgets step ***/
	public function get_step_widgets() { ?>
		<div class="summary">
			<p><?php esc_html_e('To get started, use the button below to import demo content and add widgets to your site. After installation, you can manage settings and customize your site using the Customizer. Enjoy your new theme!', 'sports-accessories'); ?></p>
		</div>
	<?php }

	/*** Display the content for the final step ***/
	public function get_step_done() { ?>
		<div id="aster-demo-setup-guid">
			<div class="aster-setup-menu">
				<h3><?php esc_html_e('Setup Navigation Menu','sports-accessories'); ?></h3>
				<p><?php esc_html_e('Follow the following Steps to Setup Menu','sports-accessories'); ?></p>
				<h4><?php esc_html_e('A) Create Pages','sports-accessories'); ?></h4>
				<ol>
					<li><?php esc_html_e('Go to Dashboard >> Pages >> Add New','sports-accessories'); ?></li>
					<li><?php esc_html_e('Enter Page Details And Save Changes','sports-accessories'); ?></li>
				</ol>
				<h4><?php esc_html_e('B) Add Pages To Menu','sports-accessories'); ?></h4>
				<ol>
					<li><?php esc_html_e('Go to Dashboard >> Appearance >> Menu','sports-accessories'); ?></li>
					<li><?php esc_html_e('Click On The Create Menu Option','sports-accessories'); ?></li>
					<li><?php esc_html_e('Select The Pages And Click On The Add to Menu Button','sports-accessories'); ?></li>
					<li><?php esc_html_e('Select Primary Menu From The Menu Setting','sports-accessories'); ?></li>
					<li><?php esc_html_e('Click On The Save Menu Button','sports-accessories'); ?></li>
				</ol>
			</div>
			<div class="aster-setup-widget">
				<h3><?php esc_html_e('Setup Footer Widgets','sports-accessories'); ?></h3>
				<p><?php esc_html_e('Follow the following Steps to Setup Footer Widgets','sports-accessories'); ?></p>
				<ol>
					<li><?php esc_html_e('Go to Dashboard >> Appearance >> Widgets','sports-accessories'); ?></li>
					<li><?php esc_html_e('Drag And Add The Widgets In The Footer Columns','sports-accessories'); ?></li>
				</ol>
			</div>
			<div style="display:flex; justify-content: center; margin-top: 20px; gap:20px">
				<div class="aster-setup-finish">
					<a target="_blank" href="<?php echo esc_url(home_url()); ?>" class="button button-primary">Visit Site</a>
				</div>
				<div class="aster-setup-finish">
					<a target="_blank" href="<?php echo esc_url( admin_url('customize.php') ); ?>" class="button button-primary">Customize Your Demo</a>
				</div>
				<div class="aster-setup-finish">
					<a target="_blank" href="<?php echo esc_url( admin_url('themes.php?page=sports-accessories-getting-started') ); ?>" class="button button-primary">Dashboard</a>
				</div>
			</div>
		</div>
	<?php }

	public function ensure_woocommerce_installed() {
		if (!is_plugin_active('woocommerce/woocommerce.php')) {
			// Install the plugin if it doesn't exist
			$sports_accessories_plugin_slug = 'woocommerce';
			$sports_accessories_plugin_file = 'woocommerce/woocommerce.php';

			// Check if plugin is installed
			$sports_accessories_installed_plugins = get_plugins();
			if (!isset($sports_accessories_installed_plugins[$sports_accessories_plugin_file])) {
				include_once(ABSPATH . 'wp-admin/includes/plugin-install.php');
				include_once(ABSPATH . 'wp-admin/includes/file.php');
				include_once(ABSPATH . 'wp-admin/includes/misc.php');
				include_once(ABSPATH . 'wp-admin/includes/class-wp-upgrader.php');

				// Install the plugin
				$sports_accessories_upgrader = new Plugin_Upgrader();
				$sports_accessories_upgrader->install('https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip');
			}
			// Activate the plugin
			activate_plugin($sports_accessories_plugin_file);
		}
	}

	//                      ------------- MENUS -----------------                    //

	public function sports_accessories_customizer_primary_menu(){
		// ------- Create Primary Menu --------
		$sports_accessories_themename = 'Sports Accessories'; // Ensure the theme name is set
		$sports_accessories_menuname = $sports_accessories_themename . ' Primary Menu';
		$sports_accessories_bpmenulocation = 'primary';
		$sports_accessories_menu_exists = wp_get_nav_menu_object($sports_accessories_menuname);
	
		if( !$sports_accessories_menu_exists ) {
			$sports_accessories_menu_id = wp_create_nav_menu($sports_accessories_menuname);
			
			// Home
			wp_update_nav_menu_item($sports_accessories_menu_id, 0, array(
				'menu-item-title' => __('Home', 'sports-accessories'),
				'menu-item-classes' => 'home',
				'menu-item-url' => home_url('/'),
				'menu-item-status' => 'publish'
			));
	
			// About Us
			$page_about = get_page_by_path('about'); // Preferred over get_page_by_title()
			if($page_about){
				wp_update_nav_menu_item($sports_accessories_menu_id, 0, array(
					'menu-item-title' => __('About Us', 'sports-accessories'),
					'menu-item-classes' => 'about',
					'menu-item-url' => get_permalink($page_about),
					'menu-item-status' => 'publish'
				));
			}
	
			// Our Team
			$page_team = get_page_by_path('team');
			if($page_team){
				wp_update_nav_menu_item($sports_accessories_menu_id, 0, array(
					'menu-item-title' => __('Our Team', 'sports-accessories'),
					'menu-item-classes' => 'team',
					'menu-item-url' => get_permalink($page_team),
					'menu-item-status' => 'publish'
				));
			}

			// Contact Us
			$page_contact = get_page_by_path('contact');
			if($page_contact){
				wp_update_nav_menu_item($sports_accessories_menu_id, 0, array(
					'menu-item-title' => __('Contact Us', 'sports-accessories'),
					'menu-item-classes' => 'contact',
					'menu-item-url' => get_permalink($page_contact),
					'menu-item-status' => 'publish'
				));
			}
	
			// Blogs
			$page_blog = get_page_by_path('blog');
			if($page_blog){
				wp_update_nav_menu_item($sports_accessories_menu_id, 0, array(
					'menu-item-title' => __('Blogs', 'sports-accessories'),
					'menu-item-classes' => 'blog',
					'menu-item-url' => get_permalink($page_blog),
					'menu-item-status' => 'publish'
				));
			}
	
			// Assign menu to location if not set
			if( !has_nav_menu($sports_accessories_bpmenulocation) ){
				$locations = get_theme_mod('nav_menu_locations');
				$locations[$sports_accessories_bpmenulocation] = $sports_accessories_menu_id;
				set_theme_mod('nav_menu_locations', $locations);
			}
		}
	}

	public function sports_accessories_customizer_socail_nav_menu() {

		// ------- Create Social Menu --------
		$sports_accessories_menuname = 'Social Menu';
		$sports_accessories_bpmenulocation = 'social';
		$sports_accessories_menu_exists = wp_get_nav_menu_object( $sports_accessories_menuname );

		if( !$sports_accessories_menu_exists){
			$sports_accessories_menu_id = wp_create_nav_menu($sports_accessories_menuname);

			wp_update_nav_menu_item( $sports_accessories_menu_id, 0, array(
				'menu-item-title'  => __( 'Facebook', 'sports-accessories' ),
				'menu-item-url'    => 'https://www.facebook.com',
				'menu-item-status' => 'publish',
			) );
	
			wp_update_nav_menu_item( $sports_accessories_menu_id, 0, array(
				'menu-item-title'  => __( 'Twitter', 'sports-accessories' ),
				'menu-item-url'    => 'https://www.twitter.com',
				'menu-item-status' => 'publish',
			) );
	
			wp_update_nav_menu_item( $sports_accessories_menu_id, 0, array(
				'menu-item-title'  => __( 'Instagram', 'sports-accessories' ),
				'menu-item-url'    => 'https://www.instagram.com',
				'menu-item-status' => 'publish',
			) );
	
			wp_update_nav_menu_item( $sports_accessories_menu_id, 0, array(
				'menu-item-title'  => __( 'Youtube', 'sports-accessories' ),
				'menu-item-url'    => 'https://www.youtube.com',
				'menu-item-status' => 'publish',
			) );
			

			if( !has_nav_menu( $sports_accessories_bpmenulocation ) ){
					$locations = get_theme_mod('nav_menu_locations');
					$locations[$sports_accessories_bpmenulocation] = $sports_accessories_menu_id;
					set_theme_mod( 'nav_menu_locations', $locations );
			}
		}
	}


	//                      ------------- /*** Imports demo content ***/ -----------------                    //

	public function setup_widgets() {

		// Create a front page and assign the template
		$sports_accessories_home_title = 'Home';
		$sports_accessories_home_check = get_page_by_path('home');
		if (!$sports_accessories_home_check) {
			$sports_accessories_home = array(
				'post_type'    => 'page',
				'post_title'   => $sports_accessories_home_title,
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_name'    => 'home' // Unique slug for the home page
			);
			$sports_accessories_home_id = wp_insert_post($sports_accessories_home);

			// Set the static front page
			if (!is_wp_error($sports_accessories_home_id)) {
				update_option('page_on_front', $sports_accessories_home_id);
				update_option('show_on_front', 'page');
			}
		}

		// Create a posts page and assign the template
		$sports_accessories_blog_title = 'Blogs';
		$sports_accessories_blog_check = get_page_by_path('blog');
		if (!$sports_accessories_blog_check) {
			$sports_accessories_blog = array(
				'post_type'    => 'page',
				'post_title'   => $sports_accessories_blog_title,
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_name'    => 'blog' // Unique slug for the blog page
			);
			$sports_accessories_blog_id = wp_insert_post($sports_accessories_blog);

			// Set the posts page
			if (!is_wp_error($sports_accessories_blog_id)) {
				update_option('page_for_posts', $sports_accessories_blog_id);
			}
		}

		// Create a About Us page and assign the template
		$sports_accessories_about_title = 'About Us';
		$sports_accessories_about_check = get_page_by_path('about');
		if (!$sports_accessories_about_check) {
			$sports_accessories_about = array(
				'post_type'    => 'page',
				'post_title'   => $sports_accessories_about_title,
				'post_content' => '<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960 with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>',
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_name'    => 'about' // Unique slug for the About Us page
			);
			wp_insert_post($sports_accessories_about);
		}

		// Create a Our Team page and assign the template
		$sports_accessories_team_title = 'Our Team';
		$sports_accessories_team_check = get_page_by_path('team');
		if (!$sports_accessories_team_check) {
			$sports_accessories_team = array(
				'post_type'    => 'page',
				'post_title'   => $sports_accessories_team_title,
				'post_content' => '<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960 with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>',
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_name'    => 'team' // Unique slug for the Our Team page
			);
			wp_insert_post($sports_accessories_team);
		}

		// Create a Contact Us page and assign the template
		$sports_accessories_contact_title = 'Contact Us';
		$sports_accessories_contact_check = get_page_by_path('contact');
		if (!$sports_accessories_contact_check) {
			$sports_accessories_contact = array(
				'post_type'    => 'page',
				'post_title'   => $sports_accessories_contact_title,
				'post_content' => '<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960 with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>',
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_name'    => 'contact' // Unique slug for the Contact Us page
			);
			wp_insert_post($sports_accessories_contact);
		}


		/*----------------------------------------- Header Button --------------------------------------------------*/

			set_theme_mod( 'sports_accessories_header_button_label_','CONTACT US');
			set_theme_mod( 'sports_accessories_header_button_link_','#');


		// ------------------------------------------ Blogs for Sections --------------------------------------

		// Create categories if not already created
		$sports_accessories_category_slider = wp_create_category('Slider');
		$sports_accessories_category_about = wp_create_category('About');

		// Array of categories to assign to each set of posts
		$sports_accessories_categories = array($sports_accessories_category_slider, $sports_accessories_category_about);

		// Loop to create posts
		for ($i = 1; $i <= 4; $i++) {
			$title = array(
				'GEARUPX',
				'VELOCITY',
				'MOMENTUM',
				'Your Game, Your Gear – Seamless Shopping for Unstoppable Performance.'
			);

			$content = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled';

			// Determine category and post index to use for title
			$category_index = ($i <= 3) ? 0 : 1; // First 3 for Slider, next 3 for Blog
			$post_title = $title[$i - 1]; // Adjust for zero-based index in title array

			// Create post object
			$my_post = array(
				'post_title'    => wp_strip_all_tags($post_title),
				'post_content'  => $content,
				'post_status'   => 'publish',
				'post_type'     => 'post',
				'post_category' => array($sports_accessories_categories[$category_index]), // Assign Slider to first 3, Blog to next 3
			);

			// Insert the post into the database
			$post_id = wp_insert_post($my_post);

			// Determine the category and set image URLs based on category
			if ($category_index === 0) { // Slider category
				$slider_index = $i % 3 + 1; // Cycles through 1, 2, 3
				$sports_accessories_image_url = get_template_directory_uri() . "/resource/img/banner{$slider_index}.png";
				$sports_accessories_image_name = "slider{$slider_index}.png";
			} else { // Blog category
				$sports_accessories_image_url = get_template_directory_uri() . '/resource/img/default.png';
				$sports_accessories_image_name = 'default.png';
			}

			$sports_accessories_upload_dir = wp_upload_dir();
			$sports_accessories_image_data = file_get_contents($sports_accessories_image_url);
			$sports_accessories_unique_file_name = wp_unique_filename($sports_accessories_upload_dir['path'], $sports_accessories_image_name);
			$filename = basename($sports_accessories_unique_file_name);

			if (wp_mkdir_p($sports_accessories_upload_dir['path'])) {
				$file = $sports_accessories_upload_dir['path'] . '/' . $filename;
			} else {
				$file = $sports_accessories_upload_dir['basedir'] . '/' . $filename;
			}

			if ( ! function_exists( 'WP_Filesystem' ) ) {
				require_once( ABSPATH . 'wp-admin/includes/file.php' );
			}
			
			WP_Filesystem();
			global $wp_filesystem;
			
			if ( ! $wp_filesystem->put_contents( $file, $sports_accessories_image_data, FS_CHMOD_FILE ) ) {
				wp_die( 'Error saving file!' );
			}

			$wp_filetype = wp_check_filetype($filename, null);
			$attachment = array(
				'post_mime_type' => $wp_filetype['type'],
				'post_title'     => sanitize_file_name($filename),
				'post_content'   => '',
				'post_status'    => 'inherit'
			);

			$sports_accessories_attach_id = wp_insert_attachment($attachment, $file, $post_id);

			require_once(ABSPATH . 'wp-admin/includes/image.php');

			$sports_accessories_attach_data = wp_generate_attachment_metadata($sports_accessories_attach_id, $file);
			wp_update_attachment_metadata($sports_accessories_attach_id, $sports_accessories_attach_data);
			set_post_thumbnail($post_id, $sports_accessories_attach_id);
		}
		
		// ---------------------------------------- Slider --------------------------------------------------- //
			set_theme_mod('sports_accessories_enable_header_search_section',true);
			set_theme_mod('sports_accessories_enable_banner_section',true);
			for($i=1; $i<=3; $i++) {
				set_theme_mod('sports_accessories_banner_button_label_'.$i,'EXPLORE');
				set_theme_mod('sports_accessories_banner_button_link_'.$i,'');
				set_theme_mod('sports_accessories_banner_short_heading'.$i,'BUILD TO PERFORM');
				set_theme_mod( 'sports_accessories_about_left_image_1'.$i,get_template_directory_uri().'/resource/img/slider'.$i.'.png');
			}

		// ---------------------------------------- About --------------------------------------------------- //

		set_theme_mod('sports_accessories_about_button_label_','Read More');
		set_theme_mod('sports_accessories_enable_about_section',true);

		set_theme_mod( 'sports_accessories_custom_image_setting_1',get_template_directory_uri().'/resource/img/about1.png');
		set_theme_mod( 'sports_accessories_custom_image_setting_2',get_template_directory_uri().'/resource/img/about2.png');
		set_theme_mod( 'sports_accessories_custom_image_setting_3',get_template_directory_uri().'/resource/img/about3.png');

		// ---------------------------------------- Footer section --------------------------------------------------- //	
		
			set_theme_mod('sports_accessories_footer_background_color_setting','#000000');
			
		// ---------------------------------------- Related post_tag --------------------------------------------------- //	
		
			set_theme_mod('sports_accessories_post_related_post_label','Related Posts');
			set_theme_mod('sports_accessories_related_posts_count','3');


		$this->sports_accessories_customizer_primary_menu();
		$this->sports_accessories_customizer_socail_nav_menu	();
		update_option( 'is-demo-imported-' . get_stylesheet(), true );
	}
}