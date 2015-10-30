( function( $ ) {

  'use strict';

  var arraySingleton = ( function arraySingleton() {
    var _stack;
    var stack = [];

    return {
      getStack: function() {
        if ( !_stack ) {
          _stack = init();
        }

        return _stack;
      }
    };

    function init() {
      return {
        pop: function() {
          stack.pop();
        },
        push: function( item ) {
          stack.push( item );
        },
        length: function() {
          return stack.length;
        },
        top: function() {
          return stack.slice( -1 ).pop();
        }
      };
    }
  })();

  // adapted from https://developer.mozilla.org/en-US/docs/Web/Events/resize
  var optimizedResize = ( function optimizedResize() {
    var callbacks = [];
    var running = false;

    // fired on resize event
    function resize() {
      if ( !running ) {
        running = true;

        if ( window.requestAnimationFrame ) {
          window.requestAnimationFrame( runCallbacks );
        } else {
          setTimeout( runCallbacks, 66 );
        }
      }
    }

    // run the actual callbacks
    function runCallbacks() {
      callbacks.forEach( function runCallbackOnResize( callback ) {
        callback();
      });

      running = false;
    }

    // adds callback to loop
    function addCallback( callback ) {
      if ( callback ) {
        callbacks.push( callback );
      }
    }

    return function( callback ) {
      window.addEventListener( 'resize', resize );
      addCallback( callback );
    };
  }());


  $.fn.responsiveMenu = function( opts ) {

    // `this` is a container for the menus
    // opts should contain keys for `main` and `mobile` that are selectors to be found inside of `this`

    var settings = $.extend({
      main: '.main-menu',
      mainItem: '> li',
      mobile: '.mobile-menu',
      mobileItem: '> li',
      stickyClass: '.sticky',
      tablet: 720,
      desktop: 1024,
      headerMargins: 38,
      initCallback: function() {},
      desktopCallback: function() {},
      tabletCallback: function() {},
      mobileCallback: function() {}
    }, opts );

    var header = this;

    var main = this.find( settings.main );
    var mobile = this.find( settings.mobile );

    settings.initCallback.call( header );

    respond();
    optimizedResize( respond );

    function respond() {
      var headerWidth = header.innerWidth();
      var logoWidth = settings.logo ? header.find( settings.logo ).outerWidth( true ) : 0;

      var headerAdjustedWidth = ( headerWidth - settings.headerMargins - logoWidth );
      var menuWidth = main.width();

      var width = viewport( 'width' );

      var mainLength = main.find( settings.mainItem ).length;
      var mobileLength = mobile.find( settings.mobileItem ).length;

      var stack;

      // desktop
      if ( width > settings.desktop ) {

        // hide the mobile menu
        mobileDisplay( false );

        // if we have any items in the mobile menu, move them to the main menu
        if ( mobileLength ) {
          organizeRecursively( true );
        }

        settings.desktopCallback.call( header );

      // mobile
      } else if ( width <= settings.tablet ) {

        // show the mobile menu
        mobileDisplay( true );

        // if we have any items in main menu, move them to the mobile menu
        if ( mainLength ) {
          organizeRecursively();
        }

        settings.mobileCallback.call( header );

      // tablet
      } else {

        stack = arraySingleton.getStack();

        // show the mobile menu
        mobileDisplay( true );

        // if we have items in the stack and they can fit in the main menu
        if ( stack.length() && headerAdjustedWidth > stack.top()) {
          organizeRecursively( true );
        // otherwise if the menu is wider than the available space
        } else if ( menuWidth > headerAdjustedWidth ) {
          organizeRecursively();
        }

        settings.tabletCallback.call( header );

      }
    }

    function mobileDisplay( show ) {
      var current = show ? 'none' : 'inline-block';
      var future = show ? 'inline-block' : 'none';

      if ( mobile.css( 'display' ) === current ) {
        mobile.css( 'display', future );
      }
    }

    function organizeRecursively( toDesktop ) {
      organizeMenu( toDesktop );
      respond();
    }

    function organizeMenu( toDesktop ) {
      var src = toDesktop ? mobile : main;
      var dest = toDesktop ? main : mobile;

      var placement = toDesktop ? 'append' : 'prepend';
      var selection = toDesktop ? 'first' : 'last';

      var children = settings.stickyClass ? 'li:not(' + settings.stickyClass + ')' : 'li';

      var item = src.children( children )[selection]();
      var itemToMove = item.clone( true, true );

      var stack = arraySingleton.getStack();

      if ( toDesktop ) {
        stack.pop();
      } else {
        if ( !stack.length() || stack.top() > main.width()) {
          stack.push( main.width());
        }
      }

      item.remove();

      dest[placement]( itemToMove );
    }

    function viewport( dir ) {
      var e = window;
      var a = 'inner';
      var dimensions;

      if ( !( 'innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
      }

      dimensions = {
        width: e[a + 'Width'],
        height: e[a + 'Height']
      };

      return dimensions[dir];
    }

    return this;

  };

}( jQuery ));
