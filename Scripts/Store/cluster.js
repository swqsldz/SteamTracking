
function Cluster( args )
{
	this.nCurCap = 0;
	this.bInScroll = false;
	this.bSuppressScrolling = true;
	this.bUseActiveClass = false;
	this.rgCapsToLoad = [];
	this.onChangeCB = null;

	this.cCapCount = args.cCapCount;
	this.nCapWidth = args.nCapWidth;

	if ( args.bUseActiveClass ) {
		this.bUseActiveClass = true;
	}

	this.nCapsulesToPreload = args.nCapsulesToPreload || 1;

	this.elClusterArea = $JFromIDOrElement( args.elClusterArea );
	this.elScrollArea = args.elScrollArea ? $JFromIDOrElement( args.elScrollArea ) : this.elClusterArea.find('.cluster_scroll_area');
	this.elScrollLeftBtn = args.elScrollLeftBtn ? $JFromIDOrElement( args.elScrollLeftBtn ) : this.elClusterArea.find('.cluster_control_left');
	this.elScrollRightBtn = args.elScrollRightBtn ? $JFromIDOrElement( args.elScrollRightBtn ) : this.elClusterArea.find('.cluster_control_right');
	this.onChangeCB = args.onChangeCB;

	this.elSlider = $JFromIDOrElement( args.elSlider );
	this.elHandle = args.elHandle ? $JFromIDOrElement( args.elHandle ) : this.elSlider.find('.handle');

	var _this = this;
	this.elScrollLeftBtn.on( 'click', function( event ) { _this.scrollLeft( event ); } );
	this.elScrollRightBtn.on( 'click', function( event ) { _this.scrollRight( event, false ); } );

	this.elClusterArea.on( 'mouseenter', function( event ) { _this.mouseOver( event ); } );
	this.elClusterArea.on( 'mouseleave', function( event ) { _this.mouseOut( event ); } );

	this.rgCapsToLoad = $J(this.elScrollArea).find('.cluster_capsule');

	this.initSlider();
	this.ensureImagesLoaded();
	this.onCapsuleFullyVisible();

	if ( $J('html' ).hasClass('responsive') )
	{
		var nLastCapWidth;
		// need to listen for resize
		$J(window ).on('resize.Cluster', function() {
			var nNewCapWidth = Math.min( _this.elClusterArea.width(), 616 ) + 4;
			if ( nNewCapWidth && nNewCapWidth != nLastCapWidth )
			{
				var $Capsules = _this.elScrollArea.find('.cluster_capsule');
				$Capsules.css('width', ( nNewCapWidth - 4 ) + 'px' );

				_this.nCapWidth = nLastCapWidth = nNewCapWidth;

				_this.elScrollArea.stop();
				_this.elScrollArea.css('width', _this.nCapWidth * ( _this.cCapCount + 1 ) + 2 /* to handle any rounding issues */);
				_this.elScrollArea.css('height', $Capsules.height() );

				var nNewOffset = _this.nCurCap * _this.nCapWidth;
				_this.slider.SetRange( 0, _this.nCapWidth * (_this.cCapCount - 1 ), nNewOffset );
				_this.sliderOnChange( nNewOffset, true );
			}

		} ).trigger('resize.Cluster');

		// ideally we would use scrolling, but implementing our own touch/drag events
		// 	requires rewriting less of this other stuff
		this.elScrollArea.on('touchstart.Cluster', function(event) {

			var fnGetPageX = function( event )
			{
				var TouchEvent = event.originalEvent;
				var rgTouches = TouchEvent ? TouchEvent.touches : null;
				if ( !rgTouches || rgTouches.length < 1 )
					return event.pageX || 0;	//probably wrong
				return rgTouches[0].pageX || 0;
			}


			var nSliderValue = _this.slider.GetValue();
			var nStartDragX = fnGetPageX( event );
			var tsDragStart = $J.now();
			var nDelta = 0;
			_this.bSuppressScrolling = true;

			$J(document ).on('touchmove.ClusterDrag', function( event ) {
				nDelta = fnGetPageX( event ) - nStartDragX;

				_this.slider.SetValue( nSliderValue - nDelta );	// will clamp
				_this.sliderOnChange( _this.slider.GetValue(), true );
			});
			$J(document ).on('touchend.ClusterDrag', function(event) {
				$J(document ).off('.ClusterDrag');

				// if the user swiped quickly, then we'll just jump to the next guy even if we'd normally stop.
				var tsDragEnd = $J.now();
				var nRatePerSecond = Math.abs( nDelta ) / ( tsDragEnd - tsDragStart ) * 1000;
				if ( nRatePerSecond > _this.nCapWidth && Math.abs( nDelta ) < _this.nCapWidth / 2 )
				{
					// it was quick, so jump to the next guy
					_this.slider.SetValue( nSliderValue + _this.nCapWidth * ( nDelta > 0 ? -1 : 1 ) );
				}

				_this.sliderOnChange( _this.slider.GetValue(), false );

				_this.bSuppressScrolling = false;
				_this.startTimer();
			});
		});
	}

	$J( function() { _this.startTimer(); } );
}

Cluster.prototype.setCaps = function( cCapCount, rgImageURLs )
{
	this.cCapCount = cCapCount;
	this.rgCapsToLoad = $J(this.elScrollArea).find('.cluster_capsule');
	this.slider.SetRange( 0, this.nCapWidth * ( this.cCapCount - 1 ), 0 );
	this.sliderOnChange( 0, true );	// force back to the start

	if ( $J('html').hasClass('responsive') )
		$J(window).trigger('resize.Cluster');
};

Cluster.prototype.initSlider = function()
{
	var _this = this;
	this.slider = new CSlider( this.elSlider, this.elHandle, {
		min: 0,
		max: this.nCapWidth * ( this.cCapCount - 1 ),
		value: 0,
		fnOnChange: function( value, bInDrag ) { _this.sliderOnChange( value, bInDrag ); }
	});
}

Cluster.prototype.startTimer = function()
{
	this.clearInterval();
	var _this = this;
	this.interval = window.setInterval( function() { _this.scrollRight( null, true ); }, 5000 );
}

Cluster.prototype.clearInterval = function()
{
	if ( this.interval )
	{
		window.clearInterval( this.interval );
		this.interval = false;
	}
}

Cluster.prototype.mouseOver = function( event )
{
	this.bSuppressScrolling = true;
	this.clearInterval();
}

Cluster.prototype.mouseOut = function( event )
{
	this.bSuppressScrolling = false;
	this.startTimer();
}

Cluster.prototype.scrollToOffset = function( nXOffset, nDuration, fnOnComplete )
{
	if ( nDuration )
	{
		this.elScrollArea.animate( { left: '-' + nXOffset + 'px' }, nDuration, null, fnOnComplete );
	}
	else
	{
		this.elScrollArea.css( 'left', '-' + nXOffset + 'px' );
		fnOnComplete && fnOnComplete();
	}
},

Cluster.prototype.scrollRight = function( event, bAutoScroll )
{
	if ( this.bSuppressScrolling && bAutoScroll )
		return;
	this.nCurCap++;
	this.bInScroll = true;
	var nDuration = 400;
	var bWrappedAround = false;

	var _this = this;
	this.elScrollArea.stop();
	if ( this.nCurCap < this.cCapCount )
	{
		var cb = function() { _this.onCapsuleFullyVisible() };
		this.scrollToOffset( this.nCurCap * this.nCapWidth, nDuration, cb );
	}
	else
	{
		this.nCurCap = 0;
		bWrappedAround = true;
		var cb = function() { _this.scrollToOffset(0); _this.onCapsuleFullyVisible() };
		this.scrollToOffset( this.cCapCount * this.nCapWidth, nDuration, cb );
	}
	this.slider.SetValue( this.nCurCap * this.nCapWidth, bWrappedAround ? 0 : nDuration );
	this.ensureImagesLoaded();
	this.bInScroll = false;
}

Cluster.prototype.scrollLeft = function()
{
	this.nCurCap--;
	this.bInScroll = true;
	var nDuration = 400;
	var bWrappedAround = false;

	var _this = this;
	this.elScrollArea.stop();
	if ( this.nCurCap >= 0 )
	{
		var cb = function() { _this.onCapsuleFullyVisible() };
		this.scrollToOffset( this.nCurCap * this.nCapWidth, nDuration, cb );
	}
	else
	{
		this.nCurCap = this.cCapCount - 1;
		bWrappedAround = true;
		this.scrollToOffset( this.cCapCount * this.nCapWidth );
		var cb = function() { _this.onCapsuleFullyVisible() };
		this.scrollToOffset(  ( this.cCapCount - 1 ) * this.nCapWidth, nDuration, cb );
	}
	this.slider.SetValue( this.nCurCap * this.nCapWidth, bWrappedAround ? 0 : nDuration );
	this.ensureImagesLoaded();
	this.bInScroll = false;
}

Cluster.prototype.sliderOnChange = function( value, bInDrag )
{
	if ( bInDrag )
	{
		this.nCurCap = Math.round( value / this.nCapWidth );
		this.ensureImagesLoaded();

		this.elScrollArea.stop();
		this.scrollToOffset( Math.round(value) );
	}
	else if ( !this.bInScroll )
	{
		this.nCurCap = Math.round( value / this.nCapWidth );
		var nSnapValue = this.nCurCap * this.nCapWidth;

		var nTravelDist = Math.abs( nSnapValue + parseInt( this.elScrollArea.css('left') ) );
		var nAnimationSpeed = Math.min( 0.8, Math.max( 0.2, nTravelDist / 2500 ) ) * 1000;

		if ( nSnapValue != value )
		{
			this.slider.SetValue( nSnapValue, nAnimationSpeed );
		}
		if ( nTravelDist )
		{
			this.ensureImagesLoaded();
			var _this = this;
			var cb = function() { _this.onCapsuleFullyVisible() };
			this.elScrollArea.animate( { left: '-' + nSnapValue + 'px' },  nAnimationSpeed, null, cb );
		}
	}
}

Cluster.prototype.ensureImagesLoaded = function()
{
	for ( var i = 0; i <= this.nCurCap + this.nCapsulesToPreload &&  i < this.rgCapsToLoad.length; i++ )
	{
		var elCap = this.rgCapsToLoad[i];
		if ( elCap )
		{
			var _this = this;
			$J(elCap).find( 'img[data-image-url]').each( function() {
				$J(this).on( 'load', function() {
					_this.elScrollArea.css('height', _this.elScrollArea.find('.cluster_capsule').height() )
				} ).attr('src', $J(this).data('imageUrl' ) );
			});
			this.rgCapsToLoad[i] = null;
		}
	}
}

Cluster.prototype.onCapsuleFullyVisible = function()
{
	if ( this.onChangeCB )
	{
		this.onChangeCB( this );
	}
}

Cluster.BuildClusterElements = function ( $ClusterCtn, rgMainCaps, strFeatureOverride )
{
	$ClusterCtn.empty();

	var cMainCaps = rgMainCaps.length;	// record the real number before we add a dupe to the end

	var $FirstCap = null;
	for ( var i = 0; i < rgMainCaps.length; i++ )
	{
		var oItem = rgMainCaps[i];
		var rgData =  oItem.appid ? GStoreItemData.rgAppData[ oItem.appid] : GStoreItemData.rgPackageData[ oItem.packageid ];

		var strStatus = '';
		if ( oItem.recommended )
			strStatus = 'Recommended For You';
		else if ( oItem.status_string )
			strStatus = oItem.status_string;
		else if ( rgData && rgData.early_access )
			strStatus = 'Early Access Now Available'
		else if ( oItem.new_on_steam )
			strStatus = 'New On Steam';
		else if ( oItem.top_seller )
			strStatus = 'Top Seller';
		else if ( rgData && rgData.coming_soon )
			strStatus = 'Pre-Purchase Now'
		else if ( rgData && rgData.video )
			strStatus = 'Now Available to Watch'
		else
			strStatus = 'Now Available'

		// navigation metrics feature
		var strFeature = 'main_cluster';
		if ( !strFeatureOverride )
		{
			if ( oItem.recommended )
				strFeature = 'main_cluster_recommended';
			else if ( oItem.top_seller )
				strFeature = 'main_cluster_topseller';
			else if ( oItem.new_on_steam )
				strFeature = 'main_cluster_newonsteam';
		}
		else
		{
			strFeature = strFeatureOverride;
		}

		var $CapCtn = Cluster.BuildClusterCapsule( oItem.appid, oItem.packageid, strStatus, strFeature, i );
		if ( $CapCtn )
		{
			$ClusterCtn.append( $CapCtn );
			if ( !$FirstCap )
				$FirstCap = $CapCtn;
		}
		else
			cMainCaps--;
	}

	if ( $FirstCap )
		$ClusterCtn.append( $FirstCap.clone( true ) );


	$ClusterCtn.append( $J('<div/>', {'style': 'clear: left;'} ) );
	$ClusterCtn.InstrumentLinks();
	GDynamicStore.DecorateDynamicItems( $ClusterCtn );

	return cMainCaps;
};

Cluster.BuildClusterCapsule = function( unAppID, unPackageID, strStatus, strFeature, nDepth )
{
	var params = { 'class': 'cluster_capsule' };
	var rgItemData = GStoreItemData.GetCapParams( strFeature, unAppID, unPackageID, params, nDepth );
	if ( !rgItemData )
		return null;

	var $CapCtn = $J('<a/>', params );

	if ( rgItemData.main_capsule )
	{
		$CapCtn.append( $J('<img/>', {'class': 'cluster_capsule_image', src: 'https://steamstore-a.akamaihd.net/public/images/v6/home/maincap_placeholder_616x353.gif', 'data-image-url': rgItemData.main_capsule } ) );
	}
	else
	{
		var strImageURL = rgItemData.header ? rgItemData.header : rgItemData.package_header;
		if ( strImageURL )
		{
			$CapCtn.append( $J('<div/>', {'class': 'cluster_maincap_fill ' + (rgItemData.package_header ? 'package' : '') } )
					.append(
					$J('<img/>', {'class': 'cluster_maincap_fill_placeholder', src: 'https://steamstore-a.akamaihd.net/public/images/v6/home/maincap_placeholder_616x353.gif' } ),
					$J('<img/>', {'class': 'cluster_capsule_image cluster_maincap_fill_bg', src: 'https://steamstore-a.akamaihd.net/public/images/blank.gif', 'data-image-url': strImageURL } ),
					$J('<img/>', {'class': 'cluster_maincap_fill_header', src: 'https://steamstore-a.akamaihd.net/public/images/blank.gif', 'data-image-url': strImageURL } )
				)
			);
		}
		else
		{
			// no image to display!
			return null;
		}
	}

	if ( rgItemData.discount_block )
		$CapCtn.append( $J(rgItemData.discount_block).addClass( 'discount_block_large main_cap_discount' ) );
	$CapCtn.append( $J('<div/>', {'class': 'main_cap_desc'})
			.append( $J('<div/>', {'class': 'main_cap_content'})
				.append( $J('<div/>', {'class': 'main_cap_platform_area platform_area'}).html( GStoreItemData.BuildSupportedPlatformIcon( rgItemData ) ) )
				.append( $J('<div/>', {'class': 'main_cap_status ellipsis'}).text( strStatus ) )
		)
	);

	return $CapCtn;
};


