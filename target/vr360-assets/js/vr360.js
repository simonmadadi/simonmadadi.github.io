'use strict';

(function () {
	angular.module('fca.pageLayout', ['matchmedia-ng']).run(["$rootScope", "FCA_MQ_LAYOUT", "FCA_MQ_IMAGES", "MEDIAQUERIES", function ($rootScope, FCA_MQ_LAYOUT, FCA_MQ_IMAGES, MEDIAQUERIES) {
		$rootScope.FCA_MQ_LAYOUT = FCA_MQ_LAYOUT;
		$rootScope.FCA_MQ_IMAGES = FCA_MQ_IMAGES;

		// Deprecated: these are used in DAA
		$rootScope.FCA_MQ_JELLY = FCA_MQ_IMAGES;
		$rootScope.FCA_MEDIAQUERIES = MEDIAQUERIES;
	}]);
})();
'use strict';

(function () {
	angular.module('fca.legalNotes', []).run(["$log", function ($log) {
		'ngInject';

		console.log('running fca.legalNotes');
	}]);
})();
'use strict';

(function () {
	configCompileProvider.$inject = ["$compileProvider"];
	configLocationProvider.$inject = ["$locationProvider"];
	configGtmAnalyticsProvider.$inject = ["gtmAnalyticsProvider"];
	gtmAnalyticsProvider.$inject = ["$analyticsProvider"];
	configTranslateProvider.$inject = ["$translateProvider"];
	angular.module('fca.static360', [
	/*
  * ----- Core modules -----
  *
  * Shared modules and third-party modules.
  * Usage: These modules likely break the application if removed.
  */
	'fca.core.main', 'fca.brandTemplates', 'fca.pageLayout', 'pascalprecht.translate', 'bhResponsiveImages', 'slick', 'ngDialog', 'ngTouch', 'matchmedia-ng', 'puElasticInput', 'angular-bind-html-compile', 'angulartics']).config(configCompileProvider).config(configLocationProvider).config(configGtmAnalyticsProvider).provider('gtmAnalytics', gtmAnalyticsProvider).run(['$window', function ($window) {
		'ngInject';

		detectUserAgent();

		$window.onload = function () {
			var windowLoadedEvent = new Event('fca.static360.windowOnload');
			$window.dispatchEvent(windowLoadedEvent);
		};

		angular.element('html').removeClass('no-js');
	}]);

	function configCompileProvider($compileProvider) {
		$compileProvider.debugInfoEnabled(false);
	}

	function configLocationProvider($locationProvider) {
		'ngInject';

		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false,
			rewriteLinks: false
		});
	}

	function configTranslateProvider($translateProvider) {
		'ngInject';

		$translateProvider.useSanitizeValueStrategy('sanitizeParameters');

		// https://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
		$translateProvider.useUrlLoader(window.BRANDS_CONFIG.messagesPath);

		$translateProvider.preferredLanguage(window.BRANDS_CONFIG.preferredLanguage);
	}

	function configGtmAnalyticsProvider(gtmAnalyticsProvider) {
		'ngInject';

		/**
   * Load GA config
   */

		var options = window.BRANDS_GA;

		// console.log('options : ', options)

		// Clean-up options and remove null values
		for (var p in options) {
			if (options[p] === null || options[p] === 'null' || options[p] === '') {
				options[p] = undefined;
			}
		}

		// Extend gtmAnalytics page options
		gtmAnalyticsProvider.options = angular.extend({}, gtmAnalyticsProvider.options, options);

		/**
   * Disabled automatic tracking
   */
		gtmAnalyticsProvider.disabledDefaultTracking();

		// console.log("gtmAnalyticsProvider.options ", gtmAnalyticsProvider.options);
	}

	function gtmAnalyticsProvider($analyticsProvider) {
		'ngInject';
		/* eslint-disable no-invalid-this */

		var _this = this;

		this.options = {};

		this.eventPrefix = 'gaevent';

		gtmAnalyticsProvider.eventPrefix = this.eventPrefix;

		this.$get = ["$analytics", "matchmedia", "$location", "$window", function ($analytics, matchmedia, $location, $window) {
			'ngInject';

			return {
				trackPage: function trackPage() {
					var pOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
					var disabledTracking = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

					// console.log('pOtions : ', pOptions);
					// console.log('trackPage dataLayer : ', window.dataLayer);

					// Additional options
					var opts = angular.extend({}, pOptions);
					// Device type
					var device = 'desktop';

					if (!matchmedia.isDesktop()) {
						opts.mobileorientation = 'portrait';

						if (matchmedia.isLandscape()) {
							opts.mobileorientation = 'landscape';
						}

						device = 'tablet';

						if (matchmedia.isPhone()) {
							device = 'mobile';
						}
					}

					// Set device type
					opts.device = device;

					if (!disabledTracking) {
						var url = '' + $window.location.pathname;
						var hash = $window.location.hash;
						if (hash.substr(-1) !== '/') {
							url += '' + hash;
						}

						// console.log('opts : ', opts);

						$analytics.pageTrack(url, opts);
					}
				},

				trackEvent: function trackEvent(event) {
					var pOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

					$analytics.eventTrack(event, pOptions);
				}
			};
		}];

		/**
   * [description]
   * @return {[type]} [description]
   */
		this.disabledDefaultTracking = function () {
			// Virtual page view
			$analyticsProvider.virtualPageviews(false);
			// Automatic first page tracking
			$analyticsProvider.firstPageview(false);

			return _this;
		};

		$analyticsProvider.registerPageTrack(function (path, pOptions) {
			var dataLayer = window.dataLayer = window.dataLayer || [];

			var gtmOptions = angular.extend({
				'event': 'content-view',
				'content-name': path,
				'pageurl': window.location.href.replace(window.location.search, '')
			}, _this.options, pOptions);

			dataLayer.push(gtmOptions);
			window.dataLayer = dataLayer;

			// console.log('registerPageTrack dataLayer : ', window.dataLayer);

			// console.log('Push to dataLayer - Page track', dataLayer, gtmOptions);
		});

		$analyticsProvider.registerEventTrack(function (action) {
			var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			var dataLayer = window.dataLayer = window.dataLayer || [];
			var params = {
				event: 'gaevent',
				eventAction: window.location.href.replace(window.location.search, '')
			};

			// Update the key sent to the data layer
			//		category -> eventCategory
			//		label ->eventLabel
			var newKeyMappings = {
				category: 'eventCategory',
				label: 'eventLabel',
				action: 'eventAction',
				trigger: 'eventTrigger'
			};

			var mapped = Object.keys(properties).map(function (oldKey) {
				var result = {};

				if (['category', 'label', 'action', 'trigger'].indexOf(oldKey) >= 0) {
					var newKey = newKeyMappings[oldKey];
					result[newKey] = properties[oldKey];

					if (oldKey === 'action') {
						delete params['eventAction'];
					}
				} else {
					result[oldKey] = properties[oldKey];
				}

				return result;
			});

			var newFormatPropertiesObj = mapped.reduce(function (result, item) {
				var key = Object.keys(item)[0];
				result[key] = item[key];
				return result;
			}, {});

			var gtmOptions = angular.extend(params, newFormatPropertiesObj);
			dataLayer.push(gtmOptions);

			// console.log('Push to dataLayer', dataLayer, gtmOptions);
		});
	}

	function detectUserAgent() {
		'ngInject';

		var agent = window.navigator.userAgent;
		var msi = agent.indexOf('MSIE');

		if (msi > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
			$('body').addClass('is-ie');
		}

		if (agent.toLowerCase().indexOf('firefox') > -1) {
			$('body').addClass('is-firefox');
		}
	}
})();
'use strict';

(function () {
				angular.module('fca.pageLayout').constant('FCA_MQ_LAYOUT', {
								/* Mediaquery values used by matchmedia */
								// note mediaqueries in the styles should correspond to these values
								TINY_PLUS: 'only screen and (min-width: 0)',
								XSMALL_PLUS: 'only screen and (min-width: 320px)',
								SMALL_PLUS: 'only screen and (min-width: 667px)',
								MEDIUM_PLUS: 'only screen and (min-width: 768px)',
								LARGE_PLUS: 'only screen and (min-width: 1024px)',
								XLARGE_PLUS: 'only screen and (min-width: 1248px)',

								MOBILE: 'only screen and (min-width: 0) and (max-width: 666px)',
								MOBILE_LANDSCAPE: 'only screen and (min-width: 667px) and (max-width: 767px)',
								TABLET: 'only screen and (min-width: 768px) and (max-width: 1024px)',
								DESKTOP: 'only screen and (min-width: 1025px)',

								DESKTOP_SMALL: 'only screen and (min-width: 1025px) and (max-width: 1247px)',
								DESKTOP_LARGE: 'only screen and (min-width: 1248px)',

								RETINA: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)',

								NOT_MOBILE: 'only screen and (min-width: 768px)',
								NOT_DESKTOP: 'only screen and (max-width: 1024px)'
				}).constant('FCA_MQ_IMAGES', {
								/* Mediaquery values used for responsive images */
								MOBILE: '(min-width: 1px)',
								MOBILE_RETINA: '(min-width: 1px) and (-webkit-min-device-pixel-ratio: 2),' + '(min-width: 1px) and (min--moz-device-pixel-ratio: 2),' + '(min-width: 1px) and (-o-min-device-pixel-ratio: 2/1),' + '(min-width: 1px) and (min-device-pixel-ratio: 2),' + '(min-width: 1px) and (min-resolution: 192dpi),' + '(min-width: 1px) and (min-resolution: 2dppx)',
								TABLET: '(min-width: 768px)',
								TABLET_RETINA: '(min-width: 768px) and (-webkit-min-device-pixel-ratio: 2),' + '(min-width: 768px) and (min--moz-device-pixel-ratio: 2),' + '(min-width: 768px) and (-o-min-device-pixel-ratio: 2/1),' + '(min-width: 768px) and (min-device-pixel-ratio: 2),' + '(min-width: 768px) and (min-resolution: 192dpi),' + '(min-width: 768px) and (min-resolution: 2dppx)',
								DESKTOP: '(min-width: 1025px)',
								DESKTOP_RETINA: '(min-width: 1025px) and (-webkit-min-device-pixel-ratio: 2),' + '(min-width: 1025px) and (min--moz-device-pixel-ratio: 2),' + '(min-width: 1025px) and (-o-min-device-pixel-ratio: 2/1),' + '(min-width: 1025px) and (min-device-pixel-ratio: 2),' + '(min-width: 1025px) and (min-resolution: 192dpi),' + '(min-width: 1025px) and (min-resolution: 2dppx)',

								NOT_RETINA: 'not screen and (-webkit-min-device-pixel-ratio: 2),' + 'not screen and (min--moz-device-pixel-ratio: 2),' + 'not screen and (-o-min-device-pixel-ratio: 2/1),' + 'not screen and (min-device-pixel-ratio: 2),' + 'not screen and (min-resolution: 192dpi),' + 'not screen and (min-resolution: 2dppx)',
								RETINA: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
				}).constant('MEDIAQUERIES', {
								/* Deprecated: Use MQ_LAYOUT instead */
								/* Mediaqueries used on DAA, still needed in brands site for header and footer */
								MOBILE_SMALL: 'only screen and (max-width: 374px)',
								MOBILE: 'only screen and (min-width: 375px) and (max-width: 767px)',
								TABLET: 'only screen and (min-width: 768px) and (max-width: 991px)',
								DESKTOP: 'only screen and (min-width: 992px)',
								DESKTOP_LARGE: 'only screen and (min-width: 1280px)',

								RETINA: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)',

								NOT_MOBILE: 'only screen and (min-width: 768px)',
								NOT_DESKTOP: 'only screen and (max-width: 991px)',
								NOT_DESKTOP_LARGE: 'only screen and (max-width: 1279px)',
								NOT_MOBILE_OR_DESKTOP_LARGE: 'only screen and (min-width: 768px) and (max-width: 1279px)', // eslint-disable-line max-len

								MOBILE_RETINA: 'only screen and (-webkit-min-device-pixel-ratio: 2) and (max-width: 768px),' + // eslint-disable-line max-len
								'only screen and (min--moz-device-pixel-ratio: 2) and (max-width: 768px),' + 'only screen and (-o-min-device-pixel-ratio: 2/1) and (max-width: 768px),' + 'only screen and (min-device-pixel-ratio: 2) and (max-width: 768px),' + 'only screen and (min-resolution: 192dpi) and (max-width: 768px),' + 'only screen and (min-resolution: 2dppx) and (max-width: 768px)'
				});
})();
'use strict';

/**
 * Directive to expose mediaquery states to the UI
 */
(function () {
	angular.module('fca.pageLayout').directive('fcaLayoutTransformer', fcaLayoutTransformer);

	function fcaLayoutTransformer() {
		FcaLayoutTransformerController.$inject = ["matchmedia", "FCA_MQ_LAYOUT"];
		return {
			restrict: 'A',
			controllerAs: 'transformer',
			controller: FcaLayoutTransformerController
		};

		function FcaLayoutTransformerController(matchmedia, FCA_MQ_LAYOUT) {
			'ngInject';

			var vm = {
				isTinyPlus: false,
				isXSmallPlus: false,
				isSmallPlus: false,
				isMediumPlus: false,
				isLargePlus: false,
				isXLargePlus: false,

				isMobile: false,
				isMobileLandscape: false,
				isTablet: false,
				isDesktop: false,

				isDesktopSmall: false,
				isDesktopLarge: false,

				isNotMobile: false,
				isNotDesktop: false,

				isRetina: false
			};

			matchmedia.on(FCA_MQ_LAYOUT.TINY_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isTinyPlus = true;
				} else {
					vm.isTinyPlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.XSMALL_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isXSmallPlus = true;
				} else {
					vm.isXSmallPlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.SMALL_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isSmallPlus = true;
				} else {
					vm.isSmallPlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.MEDIUM_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isMediumPlus = true;
				} else {
					vm.isMediumPlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.LARGE_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isLargePlus = true;
				} else {
					vm.isLargePlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.XLARGE_PLUS, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isXLargePlus = true;
				} else {
					vm.isXLargePlus = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.MOBILE, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isMobile = true;
				} else {
					vm.isMobile = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.MOBILE_LANDSCAPE, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isMobileLandscape = true;
				} else {
					vm.isMobileLandscape = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.TABLET, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isTablet = true;
				} else {
					vm.isTablet = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.DESKTOP, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isDesktop = true;
				} else {
					vm.isDesktop = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.DESKTOP_SMALL, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isDesktopSmall = true;
				} else {
					vm.isDesktopSmall = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.DESKTOP_LARGE, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isDesktopLarge = true;
				} else {
					vm.isDesktopLarge = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.NOT_MOBILE, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isNotMobile = true;
				} else {
					vm.isNotMobile = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.NOT_DESKTOP, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isNotDesktop = true;
				} else {
					vm.isNotDesktop = false;
				}
			});

			matchmedia.on(FCA_MQ_LAYOUT.RETINA, function (mediaQueryList) {
				if (mediaQueryList.matches) {
					vm.isRetina = true;
				} else {
					vm.isRetina = false;
				}
			});

			return vm;
		}
	}
})();
'use strict';

(function () {
	LegalNotes.$inject = ["$log"];
	angular.module('fca.legalNotes').service('LegalNotes', LegalNotes);

	function LegalNotes($log) {
		'ngInject';

		var _this = this;

		var groupsDefs = [{
			name: 'disclaimer',
			range: buildNumArray(200) // allowing up to 200 unique disclaimers
		}, {
			name: 'legal',
			range: 'abcdefghijklmnopqrstuvwxyz'.split('')

		}];

		this.legalNotes = {};

		this.addLegalNote = function (group, key, content) {
			var groupIndex = void 0;

			for (var i = 0; i < groupsDefs.length; i++) {
				if (groupsDefs[i].name === group) {
					groupIndex = groupsDefs[i];
					break;
				}
			}

			/* Make sure group exists */
			if (groupIndex.length < 0) {
				$log.debug('Cannot find group definition for group ' + group);
				return;
			} else if (groupIndex.range.indexOf(key) < 0) {
				$log.debug('Key ' + key + ' is out of range in group ' + group);
				return;
			}

			/* Add legal note group collection if does not already exists */
			if (!_this.legalNotes[group]) {
				_this.legalNotes[group] = {};
			}

			/* Don't add notes a second time */
			if (_this.legalNotes[group][key]) {
				return;
			}

			var name = groupIndex.name;

			_this.legalNotes[name] = addItemToCollection(_this.legalNotes[name], key, content);
		};

		function buildNumArray(num) {
			var i = 0;
			var arr = [];

			while (i < num) {
				arr.push('' + (i + 1));
				i++;
			}

			return arr;
		}

		function addItemToCollection(collection, key, content) {
			/* Do not show if no content */
			if (content.length > 0) {
				collection[key] = content;
			}

			/* Sort the object */
			var orderedKeys = Object.keys(collection).sort();
			var orderedObject = {};

			orderedKeys.forEach(function (i) {
				orderedObject[i] = collection[i];
			});

			return orderedObject;
		}
	}
})();
'use strict';

(function () {
	FcaDisclaimersListController.$inject = ["$location"];
	angular.module('fca.legalNotes').component('fcaDisclaimersList', {
		transclude: true,
		template: '<div ng-if="$ctrl.showDisclaimers"><ng-transclude/></div>',
		controller: FcaDisclaimersListController
	});

	function FcaDisclaimersListController($location) {
		'ngInject';

		var _this = this;

		this.$onInit = function () {
			var urlParams = $location.search();

			_this.showDisclaimers = urlParams.source && urlParams.source === 'ad';
		};
	}
})();
'use strict';

(function () {
	FcaLegalTooltipController.$inject = ["$element", "$timeout"];
	angular.module('fca.legalNotes').component('fcaLegalTooltip', {
		bindings: {
			label: '@',
			type: '@',
			value: '@?',
			key: '@',
			options: '<?'
		},
		transclude: true,
		template: getTemplate(),
		controller: FcaLegalTooltipController
	});

	function FcaLegalTooltipController($element, $timeout) {
		'ngInject';

		var _this = this;

		this.$postLink = function () {
			angular.element(document).ready(function () {
				var contentNode = $element[0].querySelectorAll('.content')[0];

				/* Harvest legal mention content from DOM */
				if (_this.value) {
					angular.element('ng-transclude', $element[0]).html(_this.value);
				}

				/*
     * Get the parent module box for each disclaimer trigger
     * Cannot append to body for all disclaimer tooltips
     * this is due to complex z-index scenarios caused by scrolling animation
     */
				var $parentDiv = $($element[0]).parents('.layout-module');

				if ($parentDiv.length <= 0) {
					$parentDiv = $('body');
				}

				var isNormalPlacement = true;

				// Condition for disclaimers in panos. they need to be placed to the side to avoid popping under the the header (cannot be fixed with z-index)
				if ($parentDiv[0].dataset && $parentDiv[0].dataset.groupId && $parentDiv[0].dataset.groupId === 'stacked-anim-group-0') {
					isNormalPlacement = false;
					$parentDiv = $parentDiv.find('[data-tooltip-container]');
				}

				var options = angular.extend({
					position: isNormalPlacement ? 'top' : 'right',
					trigger: 'click',
					html: contentNode,
					theme: 'fcatooltips',
					arrow: true,
					appendTo: $parentDiv[0]
					// more options: https://atomiks.github.io/tippyjs/#all-settings
				}, _this.options);

				var tippyInst = tippy($element[0], options); // eslint-disable-line new-cap

				// Store reference to the tippy popup on the trigger (needed by pano carousel)
				$element[0].dataset.tippyPopper = tippyInst.store[0].popper.id;
			});
		};
	}

	function getTemplate() {
		return '<span class="legal-tooltip" \n\t\t\t\t\tdata-ng-class="{\'legal-ibubble-container\': $ctrl.type == \'ibubble\'}">\n\t\t\t\t\t<a ng-if="$ctrl.type != \'ibubble\'" \n\t\t\t\t\t\tclass="legal-tooltip-label is-{{::$ctrl.type}}" \n\t\t\t\t\t\tdata-analytics-on \n\t\t\t\t\t\tdata-analytics-event="legalnote" \n\t\t\t\t\t\tdata-analytics-legalnote="legal note">\n\t\t\t\t\t\t<span>{{::$ctrl.label}}</span>\n\t\t\t\t\t</a>\n\n\t\t\t\t\t<a ng-if="$ctrl.type == \'ibubble\'" \n\t\t\t\t\t\tclass="legal-tooltip-label is-ibubble">\n\t\t\t\t\t\t<span class="fcaicon fcaicon-ibubble"></span>\n\t\t\t\t\t</a>\n\n\t\t\t\t\t<data class="legal-tooltip-content" style="display: none;" aria-hidden="true">\n\t\t\t\t\t\t<div class="content">\n\t\t\t\t\t\t\t<ng-transclude></ng-transclude>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</data>\n\t\t\t\t</span>';
	}
})();
'use strict';

(function () {
	angular.module('fca.static360').directive('fcaVr360Hotspot', fcaVr360Hotspot);

	function fcaVr360Hotspot() {
		FcaVr360HotspotController.$inject = ["$scope"];
		return {
			restrict: 'A',
			scope: true,
			bindToController: {
				id: '@',
				lang: '@',
				hotspotImage: '@',
				hotspotTitle: '@',
				hotspotCopy: '@',
				hotspotIndex: '@', // TODO change to <
				prevLabel: '@',
				prevIndex: '@',
				nextLabel: '@',
				nextIndex: '@'
			},
			controllerAs: 'vr360Hotspot',
			controller: FcaVr360HotspotController,
			templateUrl: '/panels/vr360/fca-vr360-hotspot.html'
		};

		function FcaVr360HotspotController($scope) {
			'ngInject';

			$scope.index = 0; // TODO remove $scope and use this instead
		}
	}
})();
'use strict';

(function () {
	angular.module('fca.static360').directive('fcaVr360Ui', fcaVr360Ui);

	function fcaVr360Ui() {
		return {
			restrict: 'A',
			scope: true,
			bindToController: {
				modelShown: '@',
				fullscreenNavTitle: '@'
			},
			controllerAs: 'vr360ui',
			controller: FcaVr360UiController,
			templateUrl: '/panels/vr360/fca-vr360-ui.html'
		};

		function FcaVr360UiController() {
			this.$onInit = function () {};
		}
	}
})();
'use strict';

(function () {
	FcaVr360Controller.$inject = ["$scope", "$compile", "$element", "$timeout", "$document", "$window", "gtmAnalytics"];
	angular.module('fca.static360').component('fcaVr360', {
		templateUrl: '/panels/vr360/fca-vr360.html',
		bindings: {
			object: '<',
			brand: '@',
			brandLogoPath: '@',
			containerId: '@',
			iconReset: '@',
			iconPause: '@',
			contextId: '@',
			groupId: '@',
			nameplate: '@',
			caption: '@',
			customText: '<',
			selectedIndex: '<',
			activateCta: '@',
			analyticsLabel: '@',
			fullscreenMode: '<',
			galleryItemId: '@'
		},
		controllerAs: 'vr360',
		controller: FcaVr360Controller
	});

	function FcaVr360Controller($scope, $compile, $element, $timeout, $document, $window, gtmAnalytics) {
		'ngInject';

		var vm = this;
		vm.isGallery = false;
		vm.selected360 = 0;
		vm.modalId = 0;
		vm.isPSVActive = false;
		vm.$container;
		vm.trims = [];

		var PSV = '';
		var obj360 = '';
		var customText = '';

		vm.$onInit = function () {
			vm.$container = $element.find('.vr360-module360-container');
			customText = vm.customText;
			vm.selected360 = vm.selectedIndex;
			vm.defaultObject = vm.object[vm.selected360];

			$scope.$on('galleryPage.triggerActiveSlideContent', vm.triggerActiveSlideContent);
			$scope.$on('galleryPage.collapse', vm.destroy360);
		};

		vm.$onChanges = function (changes) {
			if (changes.fullscreenMode && changes.fullscreenMode.currentValue != changes.fullscreenMode.previousValue) {
				if (vm.$container && vm.isPSVActive) {
					if (vm.fullscreenMode) {
						vm.enterFullscreen();
					} else {
						vm.exitFullscreen();
					}
				}
			}
		};

		vm.init360 = function () {
			obj360 = vm.object[vm.selected360];

			// override the default players control icons with custom ones
			PhotoSphereViewer.ICONS['zoom-in.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M42.1,21.9h-9.6c-0.2,0-0.3-0.1-0.3-0.3v0V12c0-0.4-0.3-0.7-0.7-0.7h-2.9c-0.4,0-0.7,0.3-0.7,0.7v9.6 c0,0.2-0.1,0.3-0.3,0.3h-9.6c-0.4,0-0.7,0.3-0.7,0.7v2.9c0,0.4,0.3,0.7,0.7,0.7h9.6c0.2,0,0.3,0.1,0.3,0.3v9.6 c0,0.4,0.3,0.7,0.6,0.7c0,0,0,0,0,0h2.9c0.4,0,0.7-0.3,0.7-0.7l0,0v-9.6c0-0.2,0.1-0.3,0.3-0.3l0,0h9.6c0.4,0,0.7-0.3,0.7-0.7v-2.9 C42.7,22.3,42.5,22,42.1,21.9C42.1,21.9,42.1,21.9,42.1,21.9z"/></svg>';
			PhotoSphereViewer.ICONS['zoom-out.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M17.9,21.9h24.2c0.4,0,0.7,0.3,0.7,0.7v2.9c0,0.4-0.3,0.7-0.7,0.7H17.9c-0.4,0-0.7-0.3-0.7-0.7v-2.9 C17.2,22.2,17.5,21.9,17.9,21.9z"/></svg>';
			PhotoSphereViewer.ICONS['zoom-out.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M17.9,21.9h24.2c0.4,0,0.7,0.3,0.7,0.7v2.9c0,0.4-0.3,0.7-0.7,0.7H17.9c-0.4,0-0.7-0.3-0.7-0.7v-2.9 C17.2,22.2,17.5,21.9,17.9,21.9z"/></svg>';
			PhotoSphereViewer.ICONS['play.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><path class="st0" d="M40,22.3L22,11.9c-1-0.6-2.2-0.2-2.7,0.7c-0.2,0.3-0.3,0.6-0.3,1v20.8c0,1.1,0.9,2,2,2c0.3,0,0.7-0.1,1-0.3 l18-10.4c0.9-0.6,1.2-1.8,0.7-2.7C40.5,22.7,40.3,22.5,40,22.3z"/></svg>';
			PhotoSphereViewer.ICONS['fullscreen-in.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><path class="st0" d="M29.7,27.1l-5.5,5.5l2.4,2.4c0.2,0.2,0.3,0.4,0.3,0.8c0,0.6-0.5,1-1,1h-7.5c-0.6,0-1-0.5-1-1v-7.5 c0-0.6,0.5-1,1-1c0.3,0,0.5,0.1,0.8,0.3l2.4,2.4l5.4-5.5c0.1-0.1,0.3-0.2,0.3-0.2c0.1,0,0.3,0.1,0.3,0.2l1.9,1.9 c0.1,0.1,0.2,0.3,0.2,0.3C29.8,26.9,29.8,27,29.7,27.1z M42.8,19.8c0,0.6-0.5,1-1,1c-0.3,0-0.5-0.1-0.8-0.3l-2.4-2.4l-5.5,5.5 c-0.1,0.1-0.3,0.2-0.3,0.2s-0.3-0.1-0.3-0.2l-2-1.9c-0.1-0.1-0.2-0.3-0.2-0.4c0-0.2,0.1-0.3,0.2-0.3l5.5-5.5l-2.4-2.4 c-0.2-0.2-0.3-0.4-0.3-0.8c0-0.6,0.5-1,1-1h7.5c0.6,0,1,0.5,1,1V19.8z"/></g></svg>';
			PhotoSphereViewer.ICONS['fullscreen-out.svg'] = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 60 48.1" style="enable-background:new 0 0 60 48.1;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><path class="st0" d="M42.5,14.1l-5.4,5.4l2.4,2.4c0.2,0.2,0.3,0.4,0.3,0.8c0,0.6-0.5,1-1,1h-7.3c-0.6,0-1-0.5-1-1v-7.3 c0-0.6,0.5-1,1-1c0.3,0,0.5,0.1,0.8,0.3l2.4,2.4l5.4-5.4c0.1-0.1,0.3-0.2,0.3-0.2c0.1,0,0.3,0.1,0.3,0.2l1.9,1.9 c0.1,0.1,0.2,0.3,0.2,0.3C42.8,14,42.6,14.1,42.5,14.1z"/><path class="st0" d="M29.7,32.8c0,0.6-0.5,1-1,1c-0.3,0-0.5-0.1-0.8-0.3l-2.4-2.4l-5.4,5.4c-0.1,0.1-0.3,0.2-0.3,0.2 c-0.2,0-0.3-0.1-0.3-0.2l-1.9-1.9c-0.1-0.1-0.2-0.3-0.2-0.4s0.1-0.3,0.2-0.3l5.4-5.4l-2.4-2.4c-0.2-0.2-0.3-0.4-0.3-0.8 c0-0.6,0.5-1,1-1h7.3c0.6,0,1,0.5,1,1L29.7,32.8L29.7,32.8z"/></g></svg>';

			// initialize 360
			PSV = new PhotoSphereViewer({
				container: vm.$container.get(0),
				loading_img: vm.brandLogoPath,
				panorama: obj360['image'],
				autorotate: false,
				anim_speed: '1rpm',
				gyroscope: false,
				move_speed: 1,
				caption: vm.caption,
				min_fov: obj360['maxZoom'],
				default_fov: obj360['defaultZoom'],
				navbar: [{
					title: 'disclaimer',
					className: 'navbar-caption-disclaimer',
					content: obj360['disclaimer']
				}, 'zoom', {
					title: 'Reset',
					className: 'custom-button-reset-rotation tooltip360',
					content: '<img src="' + vm.iconReset + '"><span class="tooltiptext">' + customText.reset + '</span>',
					onClick: function () {
						return function () {
							PSV.animate({
								x: obj360['defaultX'],
								y: obj360['defaultY']
							}, 2000);
							PSV.zoom(obj360['resetZoom']);
						};
					}()
				}, 'autorotate', {
					title: '',
					className: 'custom-button-pause-rotation tooltip360',
					content: '<img src="' + vm.iconPause + '"><span class="tooltiptext">' + customText.pause + '</span>',
					onClick: function () {
						return function () {
							PSV.stopAutorotate();
						};
					}()
				}, 'fullscreen'],
				markers: vm.addMarkers(obj360)
			});

			// enter/exit fullscreen triggered
			PSV.on('fullscreen-updated', function (enabled) {
				// we need to re-attach the tooltip to the fullscreen icon
				if (enabled) {
					obj360.fullScreen = true;
					setCustomText(customText.exitscreen, '.psv-fullscreen-button');
				} else {
					obj360.fullScreen = false;
					setCustomText(customText.fullscreen, '.psv-fullscreen-button');
				}

				var currentMarker = PSV.getCurrentMarker();

				if (currentMarker) {
					vm.$container.find('.module360Modals').css('top', (vm.$container.find('.psv-hud').height() - vm.$container.find('.module360Modals').height()) / 2 + 'px');
				}

				// recalculate size (fixes bug in safari)
				$window.dispatchEvent(new Event('resize'));
			});

			// hide/show the pause/play button interchangely
			PSV.on('autorotate', function (enabled) {
				if (enabled) {
					PSV.zoom(10);
					vm.$container.find('.psv-autorotate-button').hide();
					vm.$container.find('.custom-button-pause-rotation').show();
				} else {
					vm.$container.find('.psv-autorotate-button').show();
					vm.$container.find('.custom-button-pause-rotation').hide();
				}
			});

			vm.populateHotspots(obj360['hotspots']);

			PSV.on('select-marker', function (marker) {
				showModal(marker.id, '');
			});

			// 360 loaded and ready for any DOM injections/manipulations
			PSV.on('ready', function () {
				var vr360Buttons = vm.$container.find('.psv-autorotate-button, .psv-fullscreen-button, .psv-zoom-button-minus, .psv-zoom-button-plus, .psv-zoom-button-handle, .custom-button-reset-rotation, .custom-button-pause-rotation');

				PSV.stopAutorotate();

				vm.$container.find('.custom-button-pause-rotation').hide();
				vm.$container.find('.modalBackground').hide();

				// inject tooltip to custom buttons
				setCustomText(customText.play, '.psv-autorotate-button');
				setCustomText(customText.fullscreen, '.psv-fullscreen-button');
				setCustomText(customText.zoomout, '.psv-zoom-button-minus');
				setCustomText(customText.zoomin, '.psv-zoom-button-plus');
				setCustomText(customText.zoom, '.psv-zoom-button-handle');
				setCustomText(customText.reset, '.custom-button-reset-rotation');

				// Set data analytics values on UI buttons
				vm.$container.find('.psv-autorotate-button').attr({ 'data-analytics-label': 'automatic rotation', 'data-analytics-call': '' });
				vm.$container.find('.psv-zoom-button-minus').attr({ 'data-analytics-label': 'zoom out', 'data-analytics-call': '' });
				vm.$container.find('.psv-zoom-button-plus').attr({ 'data-analytics-label': 'zoom in', 'data-analytics-call': '' });
				vm.$container.find('.psv-zoom-button-handle').attr({ 'data-analytics-label': 'zoom', 'data-analytics-call': '' });
				vm.$container.find('.custom-button-reset-rotation').attr({ 'data-analytics-label': 'reset', 'data-analytics-call': '' });
				vm.$container.find('.custom-button-pause-rotation').attr({ 'data-analytics-label': 'pause', 'data-analytics-call': '' });
				vm.$container.find('.psv-fullscreen-button').attr({ 'data-analytics-label': 'toggle full screen', 'data-analytics-call': '' });

				vr360Buttons.on('click', $element, function (e) {
					var targetLabel = angular.element(e.currentTarget).attr('data-analytics-label');

					var eventObject = {
						category: vm.contextId + ' ' + vm.groupId,
						label: vm.analyticsLabel + ' - ' + targetLabel
					};

					gtmAnalytics.trackEvent('event', eventObject);
				});

				// navigate to the default position
				if (obj360['defaultX'] > 0 && obj360['defaultY'] > 0) {
					PSV.animate({
						x: obj360['defaultX'],
						y: obj360['defaultY']
					}, 2000);
				}

				if (vm.modalId > 0) {
					showModal(vm.modalId, '');
				}

				vm.$container.find('.dd360').css('display', 'block');

				// force redraw to match container size
				$window.dispatchEvent(new Event('resize'));
			});

			vm.isPSVActive = true;

			if (vm.fullscreenMode) {
				vm.enterFullscreen();
			}
		};

		vm.showHotSpot = function (hotspotID, direction) {
			showModal(hotspotID, direction);
		};

		vm.addMarkers = function (obj360) {

			var a = [];

			Object.keys(obj360['hotspots']).forEach(function (key) {
				a.push({
					id: obj360['hotspots'][key]['id'],
					name: obj360['hotspots'][key]['title'],
					x: obj360['hotspots'][key]['x'],
					y: obj360['hotspots'][key]['y'],
					width: 20,
					height: 20,
					image: '/vr360-assets/images/ui/fca-pulse-empty.gif'
				});
			});

			return a;
		};

		vm.showDropdown = function (mode) {
			var dd360 = vm.$container.find('.dd360');

			if (mode) {
				dd360.addClass('activeModule360');
			} else {
				dd360.removeClass('activeModule360');
			}
		};

		// populate hotspots and model dropdown dynamically on the fly
		vm.populateHotspots = function (hotspotsObj) {
			var object = vm.object;
			var uiHTML = '<div class="vr360-inst-wrapper">';

			if (vm.object.length > 1) {
				var keys = Object.keys(object);

				if (keys.length !== vm.trims.length) {
					// make sure duplicate trims not added to dropdown
					keys.forEach(function (key, index) {
						vm.trims.push(object[key].name);
					});
				}
			}

			uiHTML += '\n\t\t\t\t<div fca-vr360-ui\n\t\t\t\t\t data-fullscreen-nav-title="' + customText.interior360 + '"\n\t\t\t\t\t data-model-shown="' + obj360.name + '"\n\t\t\t\t>\n\t\t\t\t</div>\n\t\t\t';

			uiHTML += '<div class="module360Modals">';

			Object.keys(hotspotsObj).forEach(function (key, index) {
				var modalAnalTitle = hotspotsObj[key]['title'].replace(/"/g, '\\\"');
				var defaultLL = '';
				var defaultRR = '';
				var prevIndex = '';
				var nextIndex = '';

				if (key > 0) {
					defaultLL = hotspotsObj[index - 1]['title'];
					prevIndex = hotspotsObj[index - 1]['id'];
				} else {
					defaultLL = hotspotsObj[hotspotsObj.length - 1]['title'];
					prevIndex = hotspotsObj[hotspotsObj.length - 1]['id'];
				}

				if (key != hotspotsObj.length - 1) {
					defaultRR = hotspotsObj[index + 1]['title'];
					nextIndex = hotspotsObj[index + 1]['id'];
				} else {
					defaultRR = hotspotsObj[0]['title'];
					nextIndex = hotspotsObj[0]['id'];
				}

				uiHTML += '\n\t\t\t\t\t<div fca-vr360-hotspot\n\t\t\t\t\t\t id="hotspot-' + hotspotsObj[key]['id'] + '"\n\t\t\t\t\t\t lang="' + modalAnalTitle + '"\n\t\t\t\t\t\t class="module360Modal"\n\t\t\t\t\t\t style="display:none"\n\t\t\t\t\t\t data-hotspot-image=\'' + hotspotsObj[key]['image'] + '\'\n\t\t\t\t\t\t data-hotspot-title=\'' + hotspotsObj[key]["title"] + '\'\n\t\t\t\t\t\t data-hotspot-copy=\'' + hotspotsObj[key]["copy"] + '\'\n\t\t\t\t\t\t data-hotspot-index=\'' + index + '\'\n\t\t\t\t\t\t data-prev-label=\'' + defaultLL + '\'\n\t\t\t\t\t\t data-prev-index=\'' + prevIndex + '\'\n\t\t\t\t\t\t data-next-label=\'' + defaultRR + '\'\n\t\t\t\t\t\t data-next-index=\'' + nextIndex + '\'\n\t\t\t\t\t\t data-obj-length=\'' + object.length + '\'\n\t\t\t\t\t></div>\n\t\t\t\t';
			});

			uiHTML += '</div></div>';

			var angularObject = angular.element($compile(uiHTML)($scope));
			vm.$container.find('.psv-container').append(angularObject);
		};

		// set custom controls tooltip text
		function setCustomText(str, targ) {
			vm.$container.find(targ).addClass('tooltip360');
			vm.$container.find(targ).append('<span class="tooltiptext">' + str + '</span>');
		};

		// close hotspot
		vm.close360Modals = function () {
			vm.$container.find('.modalBackground').hide(500);
			vm.$container.find('.psv-canvas-container').removeClass('blur');
			vm.$container.find('.psv-marker').removeClass('blur');
			vm.$container.find('.module360Modal').fadeOut(500);
			vm.$container.find('.psv-navbar').show();
			vm.$container.find('.wrapper360-demo').show();
			vm.modalId = 0;
		};
		// Method recreated from the delete marker from photo sphere lib.
		// The original method was not working in IE.
		vm.deleteMarkers = function () {
			try {
				PSV.clearMarkers();
			} catch (exception) {
				console.log('clear marker error', exception.message);
			}
		};

		// destroy 360 and release from memory
		vm.destroy360 = function () {
			if (!vm.isPSVActive) {
				return;
			}

			vm.deleteMarkers();
			PSV.destroy();
			PSV = '';

			vm.$container.empty().html();
			vm.exitFullscreen();
			vm.isPSVActive = false;

			gtmAnalytics.trackEvent('event', {
				category: vm.contextId + ' ' + vm.groupId,
				label: vm.analyticsLabel + ' - close'
			});
		};

		vm.select360trim = function (e) {
			vm.close360Modals();
			vm.selected360 = e.$index;
			vm.selectedIndex = e.$index;

			obj360 = vm.object[vm.selected360];

			vm.deleteMarkers();

			var markerObj = vm.addMarkers(obj360);

			markerObj.forEach(function (key) {
				try {
					PSV.addMarker(key);
				} catch (exception) {
					console.log('add marker error', exception.message);
				}
			});

			var label = obj360['name'];

			gtmAnalytics.trackEvent('event', {
				category: vm.contextId + ' ' + vm.groupId,
				label: vm.analyticsLabel + ' - ' + label
			});

			vm.$container.find('.vr360-inst-wrapper').remove();
			vm.$container.find('.modalBackground').remove();
			vm.$container.find('.wrapper360-demo').remove();
			vm.$container.find('.fullscreenTopnav').remove();
			vm.$container.find('.psv-loader').css('color', '#ccc');
			vm.$container.find('.act-bar-name').html(obj360['name']);

			vm.populateHotspots(obj360['hotspots']);

			try {
				PSV.setPanorama(obj360['image'], true).then(function () {
					try {
						PSV.zoom(obj360['resetZoom']);
					} catch (exception) {
						console.log('error on zoom', exception.message);
					}

					try {
						PSV.animate({
							x: obj360['defaultX'],
							y: obj360['defaultY']
						}, 2000);
					} catch (exception) {
						console.log('animate error', exception.message);
					}

					vm.$container.find('.navbar-caption-disclaimer').html(obj360['disclaimer']);

					try {
						PSV.render();
					} catch (exception) {
						console.log('render error', exception.message);
					}

					vm.$container.find('.module360bullet').remove();
					vm.$container.find('.module360List-' + e).prepend('<span class="module360bullet">&bullet; </span>');
				});
			} catch (exception) {
				console.log('panorama and then error', exception);
			}
		};

		// show hotspot
		function showModal(hotspotID, direction) {
			vm.modalId = hotspotID;
			vm.$container.find('.module360Modal').fadeOut(500);

			PSV.gotoMarker(vm.modalId, 750);

			var label = null;

			// Find the label
			var vr360 = vm.object[vm.selected360];
			var hotspotIndex = vm.modalId - 1;
			var vr360Count = vr360.hotspots.length;

			// If there are hotspot and the index is there
			if (vr360.hotspots && hotspotIndex > -1 && hotspotIndex < vr360Count) {
				var hotspot = vr360.hotspots[hotspotIndex];
				// If the hotspot isnt null
				if (hotspot) {
					// Get the analytics prop
					label = hotspot.analyticsLabel;
				}
			}

			if (!label) {
				label = '';
			}

			if (direction !== "") {
				gtmAnalytics.trackEvent('event', {
					category: vm.contextId + ' ' + vm.groupId,
					label: 'hotspot slider - ' + vm.analyticsLabel + ' - ' + label
				});
			} else {
				gtmAnalytics.trackEvent('event', {
					category: vm.contextId + ' ' + vm.groupId,
					label: vm.analyticsLabel + ' - ' + label
				});
			}

			$timeout(function () {
				vm.$container.find('.wrapper360-demo').hide();
				vm.$container.find('.modalBackground').show();
				vm.$container.find('.psv-canvas-container').addClass('blur');
				vm.$container.find('.psv-marker').addClass('blur');
				vm.$container.find('#hotspot-' + vm.modalId).fadeIn(500).css('display', 'inline-block');
				vm.$container.find('.psv-navbar').hide();
				vm.$container.find('.module360Modals').css('top', (vm.$container.find('.psv-hud').height() - vm.$container.find('.module360Modals').height()) / 2 + 'px');
			}, 700);
		}

		vm.enterFullscreen = function () {
			vm.$container.addClass('force-fullscreen');
			$document.get(0).body.append(vm.$container.get(0));
			$window.dispatchEvent(new Event('resize'));
		};

		vm.exitFullscreen = function () {
			vm.$container.removeClass('force-fullscreen');
			$element.prepend(vm.$container.get(0));
			$window.dispatchEvent(new Event('resize'));
		};

		vm.triggerActiveSlideContent = function (event, galleryItemId) {
			if (vm.galleryItemId && galleryItemId != vm.galleryItemId) {
				return;
			}
			vm.init360();
		};
	}
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZjYS5sYXlvdXQubW9kdWxlLmpzIiwiZmNhLmxlZ2FsLW5vdGVzLm1vZHVsZS5qcyIsImFwcC5tb2R1bGUuanMiLCJmY2EubGF5b3V0LmNvbnN0YW50cy5qcyIsImZjYS1sYXlvdXQtdHJhbnNmb3JtZXIvZmNhLWxheW91dC10cmFuc2Zvcm1lci5kaXJlY3RpdmUuanMiLCJmY2EubGVnYWwtbm90ZXMuc2VydmljZS5qcyIsImZjYS1kaXNjbGFpbWVycy1saXN0L2ZjYS1kaXNjbGFpbWVycy1saXN0LmNvbXBvbmVudC5qcyIsImZjYS1sZWdhbC10b29sdGlwL2ZjYS1sZWdhbC10b29sdGlwLmNvbXBvbmVudC5qcyIsInBhbmVscy92cjM2MC9mY2EtdnIzNjAtaG90c3BvdC5kaXJlY3RpdmUuanMiLCJwYW5lbHMvdnIzNjAvZmNhLXZyMzYwLXVpLmRpcmVjdGl2ZS5qcyIsInBhbmVscy92cjM2MC9mY2EtdnIzNjAuZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJydW4iLCIkcm9vdFNjb3BlIiwiRkNBX01RX0xBWU9VVCIsIkZDQV9NUV9JTUFHRVMiLCJNRURJQVFVRVJJRVMiLCJGQ0FfTVFfSkVMTFkiLCJGQ0FfTUVESUFRVUVSSUVTIiwiJGxvZyIsImNvbnNvbGUiLCJsb2ciLCJjb25maWciLCJjb25maWdDb21waWxlUHJvdmlkZXIiLCJjb25maWdMb2NhdGlvblByb3ZpZGVyIiwiY29uZmlnR3RtQW5hbHl0aWNzUHJvdmlkZXIiLCJwcm92aWRlciIsImd0bUFuYWx5dGljc1Byb3ZpZGVyIiwiJHdpbmRvdyIsImRldGVjdFVzZXJBZ2VudCIsIm9ubG9hZCIsIndpbmRvd0xvYWRlZEV2ZW50IiwiRXZlbnQiLCJkaXNwYXRjaEV2ZW50IiwiZWxlbWVudCIsInJlbW92ZUNsYXNzIiwiJGNvbXBpbGVQcm92aWRlciIsImRlYnVnSW5mb0VuYWJsZWQiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsImVuYWJsZWQiLCJyZXF1aXJlQmFzZSIsInJld3JpdGVMaW5rcyIsImNvbmZpZ1RyYW5zbGF0ZVByb3ZpZGVyIiwiJHRyYW5zbGF0ZVByb3ZpZGVyIiwidXNlU2FuaXRpemVWYWx1ZVN0cmF0ZWd5IiwidXNlVXJsTG9hZGVyIiwid2luZG93IiwiQlJBTkRTX0NPTkZJRyIsIm1lc3NhZ2VzUGF0aCIsInByZWZlcnJlZExhbmd1YWdlIiwib3B0aW9ucyIsIkJSQU5EU19HQSIsInAiLCJ1bmRlZmluZWQiLCJleHRlbmQiLCJkaXNhYmxlZERlZmF1bHRUcmFja2luZyIsIiRhbmFseXRpY3NQcm92aWRlciIsImV2ZW50UHJlZml4IiwiJGdldCIsIiRhbmFseXRpY3MiLCJtYXRjaG1lZGlhIiwiJGxvY2F0aW9uIiwidHJhY2tQYWdlIiwicE9wdGlvbnMiLCJkaXNhYmxlZFRyYWNraW5nIiwib3B0cyIsImRldmljZSIsImlzRGVza3RvcCIsIm1vYmlsZW9yaWVudGF0aW9uIiwiaXNMYW5kc2NhcGUiLCJpc1Bob25lIiwidXJsIiwibG9jYXRpb24iLCJwYXRobmFtZSIsImhhc2giLCJzdWJzdHIiLCJwYWdlVHJhY2siLCJ0cmFja0V2ZW50IiwiZXZlbnQiLCJldmVudFRyYWNrIiwidmlydHVhbFBhZ2V2aWV3cyIsImZpcnN0UGFnZXZpZXciLCJyZWdpc3RlclBhZ2VUcmFjayIsInBhdGgiLCJkYXRhTGF5ZXIiLCJndG1PcHRpb25zIiwiaHJlZiIsInJlcGxhY2UiLCJzZWFyY2giLCJwdXNoIiwicmVnaXN0ZXJFdmVudFRyYWNrIiwiYWN0aW9uIiwicHJvcGVydGllcyIsInBhcmFtcyIsImV2ZW50QWN0aW9uIiwibmV3S2V5TWFwcGluZ3MiLCJjYXRlZ29yeSIsImxhYmVsIiwidHJpZ2dlciIsIm1hcHBlZCIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJvbGRLZXkiLCJyZXN1bHQiLCJpbmRleE9mIiwibmV3S2V5IiwibmV3Rm9ybWF0UHJvcGVydGllc09iaiIsInJlZHVjZSIsIml0ZW0iLCJrZXkiLCJhZ2VudCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIm1zaSIsIm1hdGNoIiwiJCIsImFkZENsYXNzIiwidG9Mb3dlckNhc2UiLCJjb25zdGFudCIsIlRJTllfUExVUyIsIlhTTUFMTF9QTFVTIiwiU01BTExfUExVUyIsIk1FRElVTV9QTFVTIiwiTEFSR0VfUExVUyIsIlhMQVJHRV9QTFVTIiwiTU9CSUxFIiwiTU9CSUxFX0xBTkRTQ0FQRSIsIlRBQkxFVCIsIkRFU0tUT1AiLCJERVNLVE9QX1NNQUxMIiwiREVTS1RPUF9MQVJHRSIsIlJFVElOQSIsIk5PVF9NT0JJTEUiLCJOT1RfREVTS1RPUCIsIk1PQklMRV9SRVRJTkEiLCJUQUJMRVRfUkVUSU5BIiwiREVTS1RPUF9SRVRJTkEiLCJOT1RfUkVUSU5BIiwiTU9CSUxFX1NNQUxMIiwiTk9UX0RFU0tUT1BfTEFSR0UiLCJOT1RfTU9CSUxFX09SX0RFU0tUT1BfTEFSR0UiLCJkaXJlY3RpdmUiLCJmY2FMYXlvdXRUcmFuc2Zvcm1lciIsInJlc3RyaWN0IiwiY29udHJvbGxlckFzIiwiY29udHJvbGxlciIsIkZjYUxheW91dFRyYW5zZm9ybWVyQ29udHJvbGxlciIsInZtIiwiaXNUaW55UGx1cyIsImlzWFNtYWxsUGx1cyIsImlzU21hbGxQbHVzIiwiaXNNZWRpdW1QbHVzIiwiaXNMYXJnZVBsdXMiLCJpc1hMYXJnZVBsdXMiLCJpc01vYmlsZSIsImlzTW9iaWxlTGFuZHNjYXBlIiwiaXNUYWJsZXQiLCJpc0Rlc2t0b3BTbWFsbCIsImlzRGVza3RvcExhcmdlIiwiaXNOb3RNb2JpbGUiLCJpc05vdERlc2t0b3AiLCJpc1JldGluYSIsIm9uIiwibWVkaWFRdWVyeUxpc3QiLCJtYXRjaGVzIiwic2VydmljZSIsIkxlZ2FsTm90ZXMiLCJncm91cHNEZWZzIiwibmFtZSIsInJhbmdlIiwiYnVpbGROdW1BcnJheSIsInNwbGl0IiwibGVnYWxOb3RlcyIsImFkZExlZ2FsTm90ZSIsImdyb3VwIiwiY29udGVudCIsImdyb3VwSW5kZXgiLCJpIiwibGVuZ3RoIiwiZGVidWciLCJhZGRJdGVtVG9Db2xsZWN0aW9uIiwibnVtIiwiYXJyIiwiY29sbGVjdGlvbiIsIm9yZGVyZWRLZXlzIiwic29ydCIsIm9yZGVyZWRPYmplY3QiLCJmb3JFYWNoIiwiY29tcG9uZW50IiwidHJhbnNjbHVkZSIsInRlbXBsYXRlIiwiRmNhRGlzY2xhaW1lcnNMaXN0Q29udHJvbGxlciIsIiRvbkluaXQiLCJ1cmxQYXJhbXMiLCJzaG93RGlzY2xhaW1lcnMiLCJzb3VyY2UiLCJiaW5kaW5ncyIsInR5cGUiLCJ2YWx1ZSIsImdldFRlbXBsYXRlIiwiRmNhTGVnYWxUb29sdGlwQ29udHJvbGxlciIsIiRlbGVtZW50IiwiJHRpbWVvdXQiLCIkcG9zdExpbmsiLCJkb2N1bWVudCIsInJlYWR5IiwiY29udGVudE5vZGUiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaHRtbCIsIiRwYXJlbnREaXYiLCJwYXJlbnRzIiwiaXNOb3JtYWxQbGFjZW1lbnQiLCJkYXRhc2V0IiwiZ3JvdXBJZCIsImZpbmQiLCJwb3NpdGlvbiIsInRoZW1lIiwiYXJyb3ciLCJhcHBlbmRUbyIsInRpcHB5SW5zdCIsInRpcHB5IiwidGlwcHlQb3BwZXIiLCJzdG9yZSIsInBvcHBlciIsImlkIiwiZmNhVnIzNjBIb3RzcG90Iiwic2NvcGUiLCJiaW5kVG9Db250cm9sbGVyIiwibGFuZyIsImhvdHNwb3RJbWFnZSIsImhvdHNwb3RUaXRsZSIsImhvdHNwb3RDb3B5IiwiaG90c3BvdEluZGV4IiwicHJldkxhYmVsIiwicHJldkluZGV4IiwibmV4dExhYmVsIiwibmV4dEluZGV4IiwiRmNhVnIzNjBIb3RzcG90Q29udHJvbGxlciIsInRlbXBsYXRlVXJsIiwiJHNjb3BlIiwiaW5kZXgiLCJmY2FWcjM2MFVpIiwibW9kZWxTaG93biIsImZ1bGxzY3JlZW5OYXZUaXRsZSIsIkZjYVZyMzYwVWlDb250cm9sbGVyIiwib2JqZWN0IiwiYnJhbmQiLCJicmFuZExvZ29QYXRoIiwiY29udGFpbmVySWQiLCJpY29uUmVzZXQiLCJpY29uUGF1c2UiLCJjb250ZXh0SWQiLCJuYW1lcGxhdGUiLCJjYXB0aW9uIiwiY3VzdG9tVGV4dCIsInNlbGVjdGVkSW5kZXgiLCJhY3RpdmF0ZUN0YSIsImFuYWx5dGljc0xhYmVsIiwiZnVsbHNjcmVlbk1vZGUiLCJnYWxsZXJ5SXRlbUlkIiwiRmNhVnIzNjBDb250cm9sbGVyIiwiJGNvbXBpbGUiLCIkZG9jdW1lbnQiLCJndG1BbmFseXRpY3MiLCJpc0dhbGxlcnkiLCJzZWxlY3RlZDM2MCIsIm1vZGFsSWQiLCJpc1BTVkFjdGl2ZSIsIiRjb250YWluZXIiLCJ0cmltcyIsIlBTViIsIm9iajM2MCIsImRlZmF1bHRPYmplY3QiLCIkb24iLCJ0cmlnZ2VyQWN0aXZlU2xpZGVDb250ZW50IiwiZGVzdHJveTM2MCIsIiRvbkNoYW5nZXMiLCJjaGFuZ2VzIiwiY3VycmVudFZhbHVlIiwicHJldmlvdXNWYWx1ZSIsImVudGVyRnVsbHNjcmVlbiIsImV4aXRGdWxsc2NyZWVuIiwiaW5pdDM2MCIsIlBob3RvU3BoZXJlVmlld2VyIiwiSUNPTlMiLCJjb250YWluZXIiLCJnZXQiLCJsb2FkaW5nX2ltZyIsInBhbm9yYW1hIiwiYXV0b3JvdGF0ZSIsImFuaW1fc3BlZWQiLCJneXJvc2NvcGUiLCJtb3ZlX3NwZWVkIiwibWluX2ZvdiIsImRlZmF1bHRfZm92IiwibmF2YmFyIiwidGl0bGUiLCJjbGFzc05hbWUiLCJyZXNldCIsIm9uQ2xpY2siLCJhbmltYXRlIiwieCIsInkiLCJ6b29tIiwicGF1c2UiLCJzdG9wQXV0b3JvdGF0ZSIsIm1hcmtlcnMiLCJhZGRNYXJrZXJzIiwiZnVsbFNjcmVlbiIsInNldEN1c3RvbVRleHQiLCJleGl0c2NyZWVuIiwiZnVsbHNjcmVlbiIsImN1cnJlbnRNYXJrZXIiLCJnZXRDdXJyZW50TWFya2VyIiwiY3NzIiwiaGVpZ2h0IiwiaGlkZSIsInNob3ciLCJwb3B1bGF0ZUhvdHNwb3RzIiwibWFya2VyIiwic2hvd01vZGFsIiwidnIzNjBCdXR0b25zIiwicGxheSIsInpvb21vdXQiLCJ6b29taW4iLCJhdHRyIiwiZSIsInRhcmdldExhYmVsIiwiY3VycmVudFRhcmdldCIsImV2ZW50T2JqZWN0Iiwic2hvd0hvdFNwb3QiLCJob3RzcG90SUQiLCJkaXJlY3Rpb24iLCJhIiwid2lkdGgiLCJpbWFnZSIsInNob3dEcm9wZG93biIsIm1vZGUiLCJkZDM2MCIsImhvdHNwb3RzT2JqIiwidWlIVE1MIiwiaW50ZXJpb3IzNjAiLCJtb2RhbEFuYWxUaXRsZSIsImRlZmF1bHRMTCIsImRlZmF1bHRSUiIsImFuZ3VsYXJPYmplY3QiLCJhcHBlbmQiLCJzdHIiLCJ0YXJnIiwiY2xvc2UzNjBNb2RhbHMiLCJmYWRlT3V0IiwiZGVsZXRlTWFya2VycyIsImNsZWFyTWFya2VycyIsImV4Y2VwdGlvbiIsIm1lc3NhZ2UiLCJkZXN0cm95IiwiZW1wdHkiLCJzZWxlY3QzNjB0cmltIiwiJGluZGV4IiwibWFya2VyT2JqIiwiYWRkTWFya2VyIiwicmVtb3ZlIiwic2V0UGFub3JhbWEiLCJ0aGVuIiwicmVuZGVyIiwicHJlcGVuZCIsImdvdG9NYXJrZXIiLCJ2cjM2MCIsInZyMzYwQ291bnQiLCJob3RzcG90cyIsImhvdHNwb3QiLCJmYWRlSW4iLCJib2R5Il0sIm1hcHBpbmdzIjoiQUFBQTs7QUFBQSxDQUFDLFlBQVc7Q0FDWEEsUUFDRUMsT0FBTyxrQkFBa0IsQ0FDekIsa0JBRUFDLHFFQUFJLFVBQVNDLFlBQVlDLGVBQWVDLGVBQWVDLGNBQWM7RUFDckVILFdBQVdDLGdCQUFnQkE7RUFDM0JELFdBQVdFLGdCQUFnQkE7OztFQUczQkYsV0FBV0ksZUFBZUY7RUFDMUJGLFdBQVdLLG1CQUFtQkY7O0tBWGpDO0FDQUE7O0FBQUEsQ0FBQyxZQUFXO0NBQ1hOLFFBQ0VDLE9BQU8sa0JBQWtCLElBQ3pCQyxhQUFJLFVBQVNPLE1BQU07RUFDbkI7O0VBRUFDLFFBQVFDLElBQUk7O0tBTmY7QUNBQTs7Ozs7OzsyREFBQSxDQUFDLFlBQVc7Q0FDWFgsUUFDRUMsT0FBTyxpQkFBaUI7Ozs7Ozs7Q0FPeEIsaUJBQ0Esc0JBQ0Esa0JBQ0EsMEJBQ0Esc0JBQ0EsU0FD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R0FBR3VILFNBQVN5RyxPQUFPLEtBQUt6RCxJQUFJLFdBQVc7SUFDeEV2SyxHQUFHeUgsV0FBV3RELEtBQUssZUFBZXNHO0lBQ2xDekssR0FBR3lILFdBQVd0RCxLQUFLLG9CQUFvQm9HLElBQUksT0FDM0MsQ0FBQ3ZLLEdBQUd5SCxXQUFXdEQsS0FBSyxZQUFZcUcsV0FBV3hLLEdBQUd5SCxXQUFXdEQsS0FBSyxvQkFBb0JxRyxZQUFZLElBQUk7TUFDaEc7OztFQUdKeEssR0FBR3FJLGtCQUFrQixZQUFXO0dBQy9CckksR0FBR3lILFdBQVd4SixTQUFTO0dBQ3ZCa0osVUFBVXdCLElBQUksR0FBR3NGLEtBQUsxQixPQUFPdk0sR0FBR3lILFdBQVdrQixJQUFJO0dBQy9DcFEsUUFBUUssY0FBYyxJQUFJRCxNQUFNOzs7RUFHakNxSCxHQUFHc0ksaUJBQWlCLFlBQVc7R0FDOUJ0SSxHQUFHeUgsV0FBVzNPLFlBQVk7R0FDMUJ3SyxTQUFTb0ssUUFBUTFOLEdBQUd5SCxXQUFXa0IsSUFBSTtHQUNuQ3BRLFFBQVFLLGNBQWMsSUFBSUQsTUFBTTs7O0VBR2pDcUgsR0FBRytILDRCQUE0QixVQUFTck0sT0FBT3NMLGVBQWU7R0FDN0QsSUFBSWhILEdBQUdnSCxpQkFBaUJBLGlCQUFpQmhILEdBQUdnSCxlQUFlO0lBQzFEOztHQUVEaEgsR0FBR3VJOzs7S0FqZ0JOIiwiZmlsZSI6ImpzL3ZyMzYwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnZmNhLnBhZ2VMYXlvdXQnLCBbXG5cdFx0XHQnbWF0Y2htZWRpYS1uZydcblx0XHRdKVxuXHRcdC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgRkNBX01RX0xBWU9VVCwgRkNBX01RX0lNQUdFUywgTUVESUFRVUVSSUVTKSB7XG5cdFx0XHQkcm9vdFNjb3BlLkZDQV9NUV9MQVlPVVQgPSBGQ0FfTVFfTEFZT1VUO1xuXHRcdFx0JHJvb3RTY29wZS5GQ0FfTVFfSU1BR0VTID0gRkNBX01RX0lNQUdFUztcblxuXHRcdFx0Ly8gRGVwcmVjYXRlZDogdGhlc2UgYXJlIHVzZWQgaW4gREFBXG5cdFx0XHQkcm9vdFNjb3BlLkZDQV9NUV9KRUxMWSA9IEZDQV9NUV9JTUFHRVM7XG5cdFx0XHQkcm9vdFNjb3BlLkZDQV9NRURJQVFVRVJJRVMgPSBNRURJQVFVRVJJRVM7XG5cdFx0fSk7XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnZmNhLmxlZ2FsTm90ZXMnLCBbXSlcblx0XHQucnVuKGZ1bmN0aW9uKCRsb2cpIHtcblx0XHRcdCduZ0luamVjdCc7XG5cblx0XHRcdGNvbnNvbGUubG9nKCdydW5uaW5nIGZjYS5sZWdhbE5vdGVzJyk7XG5cdFx0fSk7XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnZmNhLnN0YXRpYzM2MCcsIFtcblx0XHRcdC8qXG5cdFx0XHQgKiAtLS0tLSBDb3JlIG1vZHVsZXMgLS0tLS1cblx0XHRcdCAqXG5cdFx0XHQgKiBTaGFyZWQgbW9kdWxlcyBhbmQgdGhpcmQtcGFydHkgbW9kdWxlcy5cblx0XHRcdCAqIFVzYWdlOiBUaGVzZSBtb2R1bGVzIGxpa2VseSBicmVhayB0aGUgYXBwbGljYXRpb24gaWYgcmVtb3ZlZC5cblx0XHRcdCAqL1xuXHRcdFx0J2ZjYS5jb3JlLm1haW4nLFxuXHRcdFx0J2ZjYS5icmFuZFRlbXBsYXRlcycsXG5cdFx0XHQnZmNhLnBhZ2VMYXlvdXQnLFxuXHRcdFx0J3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuXHRcdFx0J2JoUmVzcG9uc2l2ZUltYWdlcycsXG5cdFx0XHQnc2xpY2snLFxuXHRcdFx0J25nRGlhbG9nJyxcblx0XHRcdCduZ1RvdWNoJyxcblx0XHRcdCdtYXRjaG1lZGlhLW5nJyxcblx0XHRcdCdwdUVsYXN0aWNJbnB1dCcsXG5cdFx0XHQnYW5ndWxhci1iaW5kLWh0bWwtY29tcGlsZScsXG5cdFx0XHQnYW5ndWxhcnRpY3MnXG5cdFx0XSlcblx0XHQuY29uZmlnKGNvbmZpZ0NvbXBpbGVQcm92aWRlcilcblx0XHQuY29uZmlnKGNvbmZpZ0xvY2F0aW9uUHJvdmlkZXIpXG5cdFx0LmNvbmZpZyhjb25maWdHdG1BbmFseXRpY3NQcm92aWRlcilcbi5wcm92aWRlcignZ3RtQW5hbHl0aWNzJywgZ3RtQW5hbHl0aWNzUHJvdmlkZXIpXG5cdFx0LnJ1bihbJyR3aW5kb3cnLCAoJHdpbmRvdykgPT4ge1xuXHRcdFx0J25nSW5qZWN0JztcblxuXHRkZXRlY3RVc2VyQWdlbnQoKTtcblxuXHQkd2luZG93Lm9ubG9hZCA9ICgpID0+IHtcblx0XHRsZXQgd2luZG93TG9hZGVkRXZlbnQgPSBuZXcgRXZlbnQoJ2ZjYS5zdGF0aWMzNjAud2luZG93T25sb2FkJyk7XG5cdFx0JHdpbmRvdy5kaXNwYXRjaEV2ZW50KHdpbmRvd0xvYWRlZEV2ZW50KTtcblx0fTtcblxuXHRhbmd1bGFyLmVsZW1lbnQoJ2h0bWwnKS5yZW1vdmVDbGFzcygnbm8tanMnKTtcbn1dKTtcblxuXHRmdW5jdGlvbiBjb25maWdDb21waWxlUHJvdmlkZXIoJGNvbXBpbGVQcm92aWRlcikge1xuXHRcdCRjb21waWxlUHJvdmlkZXIuZGVidWdJbmZvRW5hYmxlZChmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb25maWdMb2NhdGlvblByb3ZpZGVyKCRsb2NhdGlvblByb3ZpZGVyKSB7XG5cdFx0J25nSW5qZWN0JztcblxuXHRcdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh7XG5cdFx0XHRlbmFibGVkOiB0cnVlLFxuXHRcdFx0cmVxdWlyZUJhc2U6IGZhbHNlLFxuXHRcdFx0cmV3cml0ZUxpbmtzOiBmYWxzZVxuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29uZmlnVHJhbnNsYXRlUHJvdmlkZXIoJHRyYW5zbGF0ZVByb3ZpZGVyKSB7XG5cdFx0J25nSW5qZWN0JztcblxuXHRcdCR0cmFuc2xhdGVQcm92aWRlci51c2VTYW5pdGl6ZVZhbHVlU3RyYXRlZ3koJ3Nhbml0aXplUGFyYW1ldGVycycpO1xuXG5cdFx0Ly8gaHR0cHM6Ly9hbmd1bGFyLXRyYW5zbGF0ZS5naXRodWIuaW8vZG9jcy8jL2d1aWRlLzEyX2FzeW5jaHJvbm91cy1sb2FkaW5nXG5cdFx0JHRyYW5zbGF0ZVByb3ZpZGVyLnVzZVVybExvYWRlcih3aW5kb3cuQlJBTkRTX0NPTkZJRy5tZXNzYWdlc1BhdGgpO1xuXG5cdFx0JHRyYW5zbGF0ZVByb3ZpZGVyLnByZWZlcnJlZExhbmd1YWdlKHdpbmRvdy5CUkFORFNfQ09ORklHLnByZWZlcnJlZExhbmd1YWdlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbmZpZ0d0bUFuYWx5dGljc1Byb3ZpZGVyKGd0bUFuYWx5dGljc1Byb3ZpZGVyKSB7XG5cdFx0J25nSW5qZWN0JztcblxuXHRcdC8qKlxuXHRcdCAqIExvYWQgR0EgY29uZmlnXG5cdFx0ICovXG5cdFx0bGV0IG9wdGlvbnMgPSB3aW5kb3cuQlJBTkRTX0dBO1xuXG5cdFx0Ly8gY29uc29sZS5sb2coJ29wdGlvbnMgOiAnLCBvcHRpb25zKVxuXG5cdFx0Ly8gQ2xlYW4tdXAgb3B0aW9ucyBhbmQgcmVtb3ZlIG51bGwgdmFsdWVzXG5cdFx0Zm9yIChsZXQgcCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAob3B0aW9uc1twXSA9PT0gbnVsbCB8fCBvcHRpb25zW3BdID09PSAnbnVsbCcgfHwgb3B0aW9uc1twXSA9PT0gJycpIHtcblx0XHRcdFx0b3B0aW9uc1twXSA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBFeHRlbmQgZ3RtQW5hbHl0aWNzIHBhZ2Ugb3B0aW9uc1xuXHRcdGd0bUFuYWx5dGljc1Byb3ZpZGVyLm9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgZ3RtQW5hbHl0aWNzUHJvdmlkZXIub3B0aW9ucywgb3B0aW9ucyk7XG5cblx0XHQvKipcblx0XHQgKiBEaXNhYmxlZCBhdXRvbWF0aWMgdHJhY2tpbmdcblx0XHQgKi9cblx0XHRndG1BbmFseXRpY3NQcm92aWRlci5kaXNhYmxlZERlZmF1bHRUcmFja2luZygpO1xuXG5cdFx0Ly8gY29uc29sZS5sb2coXCJndG1BbmFseXRpY3NQcm92aWRlci5vcHRpb25zIFwiLCBndG1BbmFseXRpY3NQcm92aWRlci5vcHRpb25zKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGd0bUFuYWx5dGljc1Byb3ZpZGVyKCRhbmFseXRpY3NQcm92aWRlcikge1xuXHRcdCduZ0luamVjdCc7XG5cdFx0LyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXG5cblx0XHR0aGlzLm9wdGlvbnMgPSB7fTtcblxuXHRcdHRoaXMuZXZlbnRQcmVmaXggPSAnZ2FldmVudCc7XG5cblx0XHRndG1BbmFseXRpY3NQcm92aWRlci5ldmVudFByZWZpeCA9IHRoaXMuZXZlbnRQcmVmaXg7XG5cblx0XHR0aGlzLiRnZXQgPSAoJGFuYWx5dGljcywgbWF0Y2htZWRpYSwgJGxvY2F0aW9uLCAkd2luZG93KSA9PiB7XG5cdFx0XHQnbmdJbmplY3QnO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0cmFja1BhZ2U6IGZ1bmN0aW9uKHBPcHRpb25zID0ge30sIGRpc2FibGVkVHJhY2tpbmcgPSBmYWxzZSkge1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCdwT3Rpb25zIDogJywgcE9wdGlvbnMpO1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKCd0cmFja1BhZ2UgZGF0YUxheWVyIDogJywgd2luZG93LmRhdGFMYXllcik7XG5cblx0XHRcdFx0XHQvLyBBZGRpdGlvbmFsIG9wdGlvbnNcblx0XHRcdFx0XHRsZXQgb3B0cyA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCBwT3B0aW9ucyk7XG5cdFx0XHRcdFx0Ly8gRGV2aWNlIHR5cGVcblx0XHRcdFx0XHRsZXQgZGV2aWNlID0gJ2Rlc2t0b3AnO1xuXG5cdFx0XHRcdFx0aWYgKCFtYXRjaG1lZGlhLmlzRGVza3RvcCgpKSB7XG5cdFx0XHRcdFx0XHRvcHRzLm1vYmlsZW9yaWVudGF0aW9uID0gJ3BvcnRyYWl0JztcblxuXHRcdFx0XHRcdFx0aWYgKG1hdGNobWVkaWEuaXNMYW5kc2NhcGUoKSkge1xuXHRcdFx0XHRcdFx0XHRvcHRzLm1vYmlsZW9yaWVudGF0aW9uID0gJ2xhbmRzY2FwZSc7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGRldmljZSA9ICd0YWJsZXQnO1xuXG5cdFx0XHRcdFx0XHRpZiAobWF0Y2htZWRpYS5pc1Bob25lKCkpIHtcblx0XHRcdFx0XHRcdFx0ZGV2aWNlID0gJ21vYmlsZSc7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gU2V0IGRldmljZSB0eXBlXG5cdFx0XHRcdFx0b3B0cy5kZXZpY2UgPSBkZXZpY2U7XG5cblx0XHRcdFx0XHRpZiAoIWRpc2FibGVkVHJhY2tpbmcpIHtcblx0XHRcdFx0XHRcdGxldCB1cmwgPSBgJHskd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lfWA7XG5cdFx0XHRcdFx0XHRsZXQgaGFzaCA9ICR3aW5kb3cubG9jYXRpb24uaGFzaDtcblx0XHRcdFx0XHRcdGlmIChoYXNoLnN1YnN0cigtMSkgIT09ICcvJykge1xuXHRcdFx0XHRcdFx0XHR1cmwgKz0gYCR7aGFzaH1gO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnb3B0cyA6ICcsIG9wdHMpO1xuXG5cdFx0XHRcdFx0XHQkYW5hbHl0aWNzLnBhZ2VUcmFjayh1cmwsIG9wdHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblxuXHRcdFx0XHR0cmFja0V2ZW50OiBmdW5jdGlvbihldmVudCwgcE9wdGlvbnMgPSB7fSkge1xuXHRcdFx0XHRcdCRhbmFseXRpY3MuZXZlbnRUcmFjayhldmVudCwgcE9wdGlvbnMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBbZGVzY3JpcHRpb25dXG5cdFx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdFx0ICovXG5cdFx0dGhpcy5kaXNhYmxlZERlZmF1bHRUcmFja2luZyA9ICgpID0+IHtcblx0XHRcdC8vIFZpcnR1YWwgcGFnZSB2aWV3XG5cdFx0XHQkYW5hbHl0aWNzUHJvdmlkZXIudmlydHVhbFBhZ2V2aWV3cyhmYWxzZSk7XG5cdFx0XHQvLyBBdXRvbWF0aWMgZmlyc3QgcGFnZSB0cmFja2luZ1xuXHRcdFx0JGFuYWx5dGljc1Byb3ZpZGVyLmZpcnN0UGFnZXZpZXcoZmFsc2UpO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0JGFuYWx5dGljc1Byb3ZpZGVyLnJlZ2lzdGVyUGFnZVRyYWNrKChwYXRoLCBwT3B0aW9ucykgPT4ge1xuXHRcdFx0bGV0IGRhdGFMYXllciA9IHdpbmRvdy5kYXRhTGF5ZXIgPSB3aW5kb3cuZGF0YUxheWVyIHx8IFtdO1xuXG5cdFx0bGV0IGd0bU9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7XG5cdFx0XHQnZXZlbnQnOiAnY29udGVudC12aWV3Jyxcblx0XHRcdCdjb250ZW50LW5hbWUnOiBwYXRoLFxuXHRcdFx0J3BhZ2V1cmwnOiB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gsICcnKVxuXHRcdH0sIHRoaXMub3B0aW9ucywgcE9wdGlvbnMpO1xuXG5cdFx0ZGF0YUxheWVyLnB1c2goZ3RtT3B0aW9ucyk7XG5cdFx0d2luZG93LmRhdGFMYXllciA9IGRhdGFMYXllcjtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCdyZWdpc3RlclBhZ2VUcmFjayBkYXRhTGF5ZXIgOiAnLCB3aW5kb3cuZGF0YUxheWVyKTtcblxuXHRcdC8vIGNvbnNvbGUubG9nKCdQdXNoIHRvIGRhdGFMYXllciAtIFBhZ2UgdHJhY2snLCBkYXRhTGF5ZXIsIGd0bU9wdGlvbnMpO1xuXHR9KTtcblxuXHRcdCRhbmFseXRpY3NQcm92aWRlci5yZWdpc3RlckV2ZW50VHJhY2soKGFjdGlvbiwgcHJvcGVydGllcyA9IHt9KSA9PiB7XG5cdFx0XHRsZXQgZGF0YUxheWVyID0gd2luZG93LmRhdGFMYXllciA9IHdpbmRvdy5kYXRhTGF5ZXIgfHwgW107XG5cdFx0XHRsZXQgcGFyYW1zID0ge1xuXHRcdFx0XHRldmVudDogJ2dhZXZlbnQnLFxuXHRcdFx0XHRldmVudEFjdGlvbjogd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uc2VhcmNoLCAnJylcblx0XHRcdH07XG5cblx0XHRcdC8vIFVwZGF0ZSB0aGUga2V5IHNlbnQgdG8gdGhlIGRhdGEgbGF5ZXJcblx0XHRcdC8vXHRcdGNhdGVnb3J5IC0+IGV2ZW50Q2F0ZWdvcnlcblx0XHRcdC8vXHRcdGxhYmVsIC0+ZXZlbnRMYWJlbFxuXHRcdFx0bGV0IG5ld0tleU1hcHBpbmdzID0ge1xuXHRcdFx0XHRjYXRlZ29yeTogJ2V2ZW50Q2F0ZWdvcnknLFxuXHRcdFx0XHRsYWJlbDogJ2V2ZW50TGFiZWwnLFxuXHRcdFx0XHRhY3Rpb246ICdldmVudEFjdGlvbicsXG5cdFx0XHRcdHRyaWdnZXI6ICdldmVudFRyaWdnZXInXG5cdFx0XHR9O1xuXG5cdFx0XHRsZXQgbWFwcGVkID0gT2JqZWN0LmtleXMocHJvcGVydGllcykubWFwKChvbGRLZXkpID0+IHtcblx0XHRcdFx0bGV0IHJlc3VsdCA9IHt9O1xuXG5cdFx0XHRpZihbJ2NhdGVnb3J5JywgJ2xhYmVsJywgJ2FjdGlvbicsICd0cmlnZ2VyJ10uaW5kZXhPZihvbGRLZXkpID49IDApIHtcblx0XHRcdFx0bGV0IG5ld0tleSA9IG5ld0tleU1hcHBpbmdzW29sZEtleV07XG5cdFx0XHRcdHJlc3VsdFtuZXdLZXldID0gcHJvcGVydGllc1tvbGRLZXldO1xuXG5cdFx0XHRcdGlmIChvbGRLZXkgPT09ICdhY3Rpb24nKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIHBhcmFtc1snZXZlbnRBY3Rpb24nXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmVzdWx0W29sZEtleV0gPSBwcm9wZXJ0aWVzW29sZEtleV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSk7XG5cblx0XHRcdGxldCBuZXdGb3JtYXRQcm9wZXJ0aWVzT2JqID0gbWFwcGVkLnJlZHVjZSgocmVzdWx0LCBpdGVtKSA9PiB7XG5cdFx0XHRcdGxldCBrZXkgPSBPYmplY3Qua2V5cyhpdGVtKVswXTtcblx0XHRcdHJlc3VsdFtrZXldID0gaXRlbVtrZXldO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9LCB7fSk7XG5cblxuXHRcdFx0bGV0IGd0bU9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZChwYXJhbXMsIG5ld0Zvcm1hdFByb3BlcnRpZXNPYmopO1xuXHRcdFx0ZGF0YUxheWVyLnB1c2goZ3RtT3B0aW9ucyk7XG5cblx0XHRcdC8vIGNvbnNvbGUubG9nKCdQdXNoIHRvIGRhdGFMYXllcicsIGRhdGFMYXllciwgZ3RtT3B0aW9ucyk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBkZXRlY3RVc2VyQWdlbnQoKSB7XG5cdFx0J25nSW5qZWN0JztcblxuXHRcdGxldCBhZ2VudCA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuXHRcdGxldCBtc2kgPSBhZ2VudC5pbmRleE9mKCdNU0lFJyk7XG5cblx0XHRpZiAobXNpID4gMCB8fCAhIW5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1RyaWRlbnQuKnJ2XFw6MTFcXC4vKSkge1xuXHRcdFx0JCgnYm9keScpLmFkZENsYXNzKCdpcy1pZScpO1xuXHRcdH1cblxuXHRcdGlmIChhZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xKSB7XG5cdFx0XHQkKCdib2R5JykuYWRkQ2xhc3MoJ2lzLWZpcmVmb3gnKTtcblx0XHR9XG5cdH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdmY2EucGFnZUxheW91dCcpXG5cdFx0LmNvbnN0YW50KCdGQ0FfTVFfTEFZT1VUJywge1xuXHRcdFx0LyogTWVkaWFxdWVyeSB2YWx1ZXMgdXNlZCBieSBtYXRjaG1lZGlhICovXG5cdFx0XHQvLyBub3RlIG1lZGlhcXVlcmllcyBpbiB0aGUgc3R5bGVzIHNob3VsZCBjb3JyZXNwb25kIHRvIHRoZXNlIHZhbHVlc1xuXHRcdFx0VElOWV9QTFVTOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDApJyxcblx0XHRcdFhTTUFMTF9QTFVTOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDMyMHB4KScsXG5cdFx0XHRTTUFMTF9QTFVTOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDY2N3B4KScsXG5cdFx0XHRNRURJVU1fUExVUzogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjhweCknLFxuXHRcdFx0TEFSR0VfUExVUzogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI0cHgpJyxcblx0XHRcdFhMQVJHRV9QTFVTOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEyNDhweCknLFxuXG5cdFx0XHRNT0JJTEU6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMCkgYW5kIChtYXgtd2lkdGg6IDY2NnB4KScsXG5cdFx0XHRNT0JJTEVfTEFORFNDQVBFOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDY2N3B4KSBhbmQgKG1heC13aWR0aDogNzY3cHgpJyxcblx0XHRcdFRBQkxFVDogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjhweCkgYW5kIChtYXgtd2lkdGg6IDEwMjRweCknLFxuXHRcdFx0REVTS1RPUDogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI1cHgpJyxcblxuXHRcdFx0REVTS1RPUF9TTUFMTDogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDI1cHgpIGFuZCAobWF4LXdpZHRoOiAxMjQ3cHgpJyxcblx0XHRcdERFU0tUT1BfTEFSR0U6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTI0OHB4KScsXG5cblx0XHRcdFJFVElOQTogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdCdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KScsXG5cblx0XHRcdE5PVF9NT0JJTEU6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY4cHgpJyxcblx0XHRcdE5PVF9ERVNLVE9QOiAnb25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDEwMjRweCknXG5cdFx0fSlcblx0XHQuY29uc3RhbnQoJ0ZDQV9NUV9JTUFHRVMnLCB7XG5cdFx0XHQvKiBNZWRpYXF1ZXJ5IHZhbHVlcyB1c2VkIGZvciByZXNwb25zaXZlIGltYWdlcyAqL1xuXHRcdFx0TU9CSUxFOiAnKG1pbi13aWR0aDogMXB4KScsXG5cdFx0XHRNT0JJTEVfUkVUSU5BOiAnKG1pbi13aWR0aDogMXB4KSBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG5cdFx0XHRcdFx0XHRcdCcobWluLXdpZHRoOiAxcHgpIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDFweCkgYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogMXB4KSBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogMXB4KSBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogMXB4KSBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknLFxuXHRcdFx0VEFCTEVUOiAnKG1pbi13aWR0aDogNzY4cHgpJyxcblx0XHRcdFRBQkxFVF9SRVRJTkE6ICcobWluLXdpZHRoOiA3NjhweCkgYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogNzY4cHgpIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDc2OHB4KSBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG5cdFx0XHRcdFx0XHRcdCcobWluLXdpZHRoOiA3NjhweCkgYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDc2OHB4KSBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogNzY4cHgpIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KScsXG5cdFx0XHRERVNLVE9QOiAnKG1pbi13aWR0aDogMTAyNXB4KScsXG5cdFx0XHRERVNLVE9QX1JFVElOQTogJyhtaW4td2lkdGg6IDEwMjVweCkgYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdFx0XHQnKG1pbi13aWR0aDogMTAyNXB4KSBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG5cdFx0XHRcdFx0XHRcdCcobWluLXdpZHRoOiAxMDI1cHgpIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDEwMjVweCkgYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDEwMjVweCkgYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcblx0XHRcdFx0XHRcdFx0JyhtaW4td2lkdGg6IDEwMjVweCkgYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJyxcblxuXHRcdFx0Tk9UX1JFVElOQTogJ25vdCBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdFx0J25vdCBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdFx0J25vdCBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuXHRcdFx0XHRcdFx0J25vdCBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHRcdCdub3Qgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG5cdFx0XHRcdFx0XHQnbm90IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknLFxuXHRcdFx0UkVUSU5BOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdCdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcblx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcblx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xuXHRcdH0pXG5cdFx0LmNvbnN0YW50KCdNRURJQVFVRVJJRVMnLCB7XG5cdFx0XHQvKiBEZXByZWNhdGVkOiBVc2UgTVFfTEFZT1VUIGluc3RlYWQgKi9cblx0XHRcdC8qIE1lZGlhcXVlcmllcyB1c2VkIG9uIERBQSwgc3RpbGwgbmVlZGVkIGluIGJyYW5kcyBzaXRlIGZvciBoZWFkZXIgYW5kIGZvb3RlciAqL1xuXHRcdFx0TU9CSUxFX1NNQUxMOiAnb25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDM3NHB4KScsXG5cdFx0XHRNT0JJTEU6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMzc1cHgpIGFuZCAobWF4LXdpZHRoOiA3NjdweCknLFxuXHRcdFx0VEFCTEVUOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OHB4KSBhbmQgKG1heC13aWR0aDogOTkxcHgpJyxcblx0XHRcdERFU0tUT1A6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogOTkycHgpJyxcblx0XHRcdERFU0tUT1BfTEFSR0U6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTI4MHB4KScsXG5cblx0XHRcdFJFVElOQTogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcblx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuXHRcdFx0XHRcdCdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG5cdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KScsXG5cblx0XHRcdE5PVF9NT0JJTEU6ICdvbmx5IHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY4cHgpJyxcblx0XHRcdE5PVF9ERVNLVE9QOiAnb25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5MXB4KScsXG5cdFx0XHROT1RfREVTS1RPUF9MQVJHRTogJ29ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMjc5cHgpJyxcblx0XHRcdE5PVF9NT0JJTEVfT1JfREVTS1RPUF9MQVJHRTogJ29ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjhweCkgYW5kIChtYXgtd2lkdGg6IDEyNzlweCknLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cblxuXHRcdFx0TU9CSUxFX1JFVElOQTogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSBhbmQgKG1heC13aWR0aDogNzY4cHgpLCcgKyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG5cdFx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpIGFuZCAobWF4LXdpZHRoOiA3NjhweCksJyArXG5cdFx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpIGFuZCAobWF4LXdpZHRoOiA3NjhweCksJyArXG5cdFx0XHRcdFx0XHQnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSBhbmQgKG1heC13aWR0aDogNzY4cHgpLCcgK1xuXHRcdFx0XHRcdFx0J29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSkgYW5kIChtYXgtd2lkdGg6IDc2OHB4KSwnICtcblx0XHRcdFx0XHRcdCdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCkgYW5kIChtYXgtd2lkdGg6IDc2OHB4KSdcblx0XHR9KTtcbn0pKCk7XG4iLCIvKipcbiAqIERpcmVjdGl2ZSB0byBleHBvc2UgbWVkaWFxdWVyeSBzdGF0ZXMgdG8gdGhlIFVJXG4gKi9cbihmdW5jdGlvbigpIHtcblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ2ZjYS5wYWdlTGF5b3V0Jylcblx0XHQuZGlyZWN0aXZlKCdmY2FMYXlvdXRUcmFuc2Zvcm1lcicsIGZjYUxheW91dFRyYW5zZm9ybWVyKTtcblxuXHRmdW5jdGlvbiBmY2FMYXlvdXRUcmFuc2Zvcm1lcigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRcdGNvbnRyb2xsZXJBczogJ3RyYW5zZm9ybWVyJyxcblx0XHRcdGNvbnRyb2xsZXI6IEZjYUxheW91dFRyYW5zZm9ybWVyQ29udHJvbGxlclxuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBGY2FMYXlvdXRUcmFuc2Zvcm1lckNvbnRyb2xsZXIobWF0Y2htZWRpYSwgRkNBX01RX0xBWU9VVCkge1xuXHRcdFx0J25nSW5qZWN0JztcblxuXHRcdFx0bGV0IHZtID0ge1xuXHRcdFx0XHRpc1RpbnlQbHVzOiBmYWxzZSxcblx0XHRcdFx0aXNYU21hbGxQbHVzOiBmYWxzZSxcblx0XHRcdFx0aXNTbWFsbFBsdXM6IGZhbHNlLFxuXHRcdFx0XHRpc01lZGl1bVBsdXM6IGZhbHNlLFxuXHRcdFx0XHRpc0xhcmdlUGx1czogZmFsc2UsXG5cdFx0XHRcdGlzWExhcmdlUGx1czogZmFsc2UsXG5cblx0XHRcdFx0aXNNb2JpbGU6IGZhbHNlLFxuXHRcdFx0XHRpc01vYmlsZUxhbmRzY2FwZTogZmFsc2UsXG5cdFx0XHRcdGlzVGFibGV0OiBmYWxzZSxcblx0XHRcdFx0aXNEZXNrdG9wOiBmYWxzZSxcblxuXHRcdFx0XHRpc0Rlc2t0b3BTbWFsbDogZmFsc2UsXG5cdFx0XHRcdGlzRGVza3RvcExhcmdlOiBmYWxzZSxcblxuXHRcdFx0XHRpc05vdE1vYmlsZTogZmFsc2UsXG5cdFx0XHRcdGlzTm90RGVza3RvcDogZmFsc2UsXG5cblx0XHRcdFx0aXNSZXRpbmE6IGZhbHNlXG5cdFx0XHR9O1xuXG5cdFx0XHRtYXRjaG1lZGlhLm9uKEZDQV9NUV9MQVlPVVQuVElOWV9QTFVTLCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzVGlueVBsdXMgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzVGlueVBsdXMgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdG1hdGNobWVkaWEub24oRkNBX01RX0xBWU9VVC5YU01BTExfUExVUywgZnVuY3Rpb24obWVkaWFRdWVyeUxpc3QpIHtcblx0XHRcdFx0aWYgKG1lZGlhUXVlcnlMaXN0Lm1hdGNoZXMpIHtcblx0XHRcdFx0XHR2bS5pc1hTbWFsbFBsdXMgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzWFNtYWxsUGx1cyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULlNNQUxMX1BMVVMsIGZ1bmN0aW9uKG1lZGlhUXVlcnlMaXN0KSB7XG5cdFx0XHRcdGlmIChtZWRpYVF1ZXJ5TGlzdC5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0dm0uaXNTbWFsbFBsdXMgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzU21hbGxQbHVzID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRtYXRjaG1lZGlhLm9uKEZDQV9NUV9MQVlPVVQuTUVESVVNX1BMVVMsIGZ1bmN0aW9uKG1lZGlhUXVlcnlMaXN0KSB7XG5cdFx0XHRcdGlmIChtZWRpYVF1ZXJ5TGlzdC5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0dm0uaXNNZWRpdW1QbHVzID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc01lZGl1bVBsdXMgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdG1hdGNobWVkaWEub24oRkNBX01RX0xBWU9VVC5MQVJHRV9QTFVTLCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzTGFyZ2VQbHVzID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc0xhcmdlUGx1cyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULlhMQVJHRV9QTFVTLCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzWExhcmdlUGx1cyA9IHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dm0uaXNYTGFyZ2VQbHVzID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRtYXRjaG1lZGlhLm9uKEZDQV9NUV9MQVlPVVQuTU9CSUxFLCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzTW9iaWxlID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc01vYmlsZSA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULk1PQklMRV9MQU5EU0NBUEUsIGZ1bmN0aW9uKG1lZGlhUXVlcnlMaXN0KSB7XG5cdFx0XHRcdGlmIChtZWRpYVF1ZXJ5TGlzdC5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0dm0uaXNNb2JpbGVMYW5kc2NhcGUgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzTW9iaWxlTGFuZHNjYXBlID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRtYXRjaG1lZGlhLm9uKEZDQV9NUV9MQVlPVVQuVEFCTEVULCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzVGFibGV0ID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc1RhYmxldCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULkRFU0tUT1AsIGZ1bmN0aW9uKG1lZGlhUXVlcnlMaXN0KSB7XG5cdFx0XHRcdGlmIChtZWRpYVF1ZXJ5TGlzdC5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0dm0uaXNEZXNrdG9wID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc0Rlc2t0b3AgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdG1hdGNobWVkaWEub24oRkNBX01RX0xBWU9VVC5ERVNLVE9QX1NNQUxMLCBmdW5jdGlvbihtZWRpYVF1ZXJ5TGlzdCkge1xuXHRcdFx0XHRpZiAobWVkaWFRdWVyeUxpc3QubWF0Y2hlcykge1xuXHRcdFx0XHRcdHZtLmlzRGVza3RvcFNtYWxsID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS5pc0Rlc2t0b3BTbWFsbCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULkRFU0tUT1BfTEFSR0UsIGZ1bmN0aW9uKG1lZGlhUXVlcnlMaXN0KSB7XG5cdFx0XHRcdGlmIChtZWRpYVF1ZXJ5TGlzdC5tYXRjaGVzKSB7XG5cdFx0XHRcdFx0dm0uaXNEZXNrdG9wTGFyZ2UgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzRGVza3RvcExhcmdlID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRtYXRjaG1lZGlhLm9uKEZDQV9NUV9MQVlPVVQuTk9UX01PQklMRSwgZnVuY3Rpb24obWVkaWFRdWVyeUxpc3QpIHtcblx0XHRcdFx0aWYgKG1lZGlhUXVlcnlMaXN0Lm1hdGNoZXMpIHtcblx0XHRcdFx0XHR2bS5pc05vdE1vYmlsZSA9IHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dm0uaXNOb3RNb2JpbGUgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdG1hdGNobWVkaWEub24oRkNBX01RX0xBWU9VVC5OT1RfREVTS1RPUCwgZnVuY3Rpb24obWVkaWFRdWVyeUxpc3QpIHtcblx0XHRcdFx0aWYgKG1lZGlhUXVlcnlMaXN0Lm1hdGNoZXMpIHtcblx0XHRcdFx0XHR2bS5pc05vdERlc2t0b3AgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZtLmlzTm90RGVza3RvcCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bWF0Y2htZWRpYS5vbihGQ0FfTVFfTEFZT1VULlJFVElOQSwgZnVuY3Rpb24obWVkaWFRdWVyeUxpc3QpIHtcblx0XHRcdFx0aWYgKG1lZGlhUXVlcnlMaXN0Lm1hdGNoZXMpIHtcblx0XHRcdFx0XHR2bS5pc1JldGluYSA9IHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dm0uaXNSZXRpbmEgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB2bTtcblx0XHR9XG5cdH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdmY2EubGVnYWxOb3RlcycpXG5cdFx0LnNlcnZpY2UoJ0xlZ2FsTm90ZXMnLCBMZWdhbE5vdGVzKTtcblxuXHRmdW5jdGlvbiBMZWdhbE5vdGVzKCRsb2cpIHtcblx0XHQnbmdJbmplY3QnO1xuXG5cdFx0Y29uc3QgZ3JvdXBzRGVmcyA9IFt7XG5cdFx0XHRuYW1lOiAnZGlzY2xhaW1lcicsXG5cdFx0XHRyYW5nZTogYnVpbGROdW1BcnJheSgyMDApIC8vIGFsbG93aW5nIHVwIHRvIDIwMCB1bmlxdWUgZGlzY2xhaW1lcnNcblx0XHR9LCB7XG5cdFx0XHRuYW1lOiAnbGVnYWwnLFxuXHRcdFx0cmFuZ2U6ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoJycpXG5cblx0XHR9XTtcblxuXHRcdHRoaXMubGVnYWxOb3RlcyA9IHt9O1xuXG5cdFx0dGhpcy5hZGRMZWdhbE5vdGUgPSAoZ3JvdXAsIGtleSwgY29udGVudCkgPT4ge1xuXHRcdFx0bGV0IGdyb3VwSW5kZXg7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXBzRGVmcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAoZ3JvdXBzRGVmc1tpXS5uYW1lID09PSBncm91cCkge1xuXHRcdFx0XHRcdGdyb3VwSW5kZXggPSBncm91cHNEZWZzW2ldO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qIE1ha2Ugc3VyZSBncm91cCBleGlzdHMgKi9cblx0XHRcdGlmIChncm91cEluZGV4Lmxlbmd0aCA8IDApIHtcblx0XHRcdFx0JGxvZy5kZWJ1ZyhgQ2Fubm90IGZpbmQgZ3JvdXAgZGVmaW5pdGlvbiBmb3IgZ3JvdXAgJHtncm91cH1gKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBlbHNlIGlmIChncm91cEluZGV4LnJhbmdlLmluZGV4T2Yoa2V5KSA8IDApIHtcblx0XHRcdFx0JGxvZy5kZWJ1ZyhgS2V5ICR7a2V5fSBpcyBvdXQgb2YgcmFuZ2UgaW4gZ3JvdXAgJHtncm91cH1gKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBBZGQgbGVnYWwgbm90ZSBncm91cCBjb2xsZWN0aW9uIGlmIGRvZXMgbm90IGFscmVhZHkgZXhpc3RzICovXG5cdFx0XHRpZiAoIXRoaXMubGVnYWxOb3Rlc1tncm91cF0pIHtcblx0XHRcdFx0dGhpcy5sZWdhbE5vdGVzW2dyb3VwXSA9IHt9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBEb24ndCBhZGQgbm90ZXMgYSBzZWNvbmQgdGltZSAqL1xuXHRcdFx0aWYgKHRoaXMubGVnYWxOb3Rlc1tncm91cF1ba2V5XSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGxldCBuYW1lID0gZ3JvdXBJbmRleC5uYW1lO1xuXG5cdFx0XHR0aGlzLmxlZ2FsTm90ZXNbbmFtZV0gPSBhZGRJdGVtVG9Db2xsZWN0aW9uKHRoaXMubGVnYWxOb3Rlc1tuYW1lXSwga2V5LCBjb250ZW50KTtcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gYnVpbGROdW1BcnJheShudW0pIHtcblx0XHRcdGxldCBpID0gMDtcblx0XHRcdGxldCBhcnIgPSBbXTtcblxuXHRcdFx0d2hpbGUgKGkgPCBudW0pIHtcblx0XHRcdFx0YXJyLnB1c2goYCR7aSArIDF9YCk7XG5cdFx0XHRcdGkrKztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGFycjtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBhZGRJdGVtVG9Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIGtleSwgY29udGVudCkge1xuXHRcdFx0LyogRG8gbm90IHNob3cgaWYgbm8gY29udGVudCAqL1xuXHRcdFx0aWYgKGNvbnRlbnQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjb2xsZWN0aW9uW2tleV0gPSBjb250ZW50O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBTb3J0IHRoZSBvYmplY3QgKi9cblx0XHRcdGxldCBvcmRlcmVkS2V5cyA9IE9iamVjdC5rZXlzKGNvbGxlY3Rpb24pLnNvcnQoKTtcblx0XHRcdGxldCBvcmRlcmVkT2JqZWN0ID0ge307XG5cblx0XHRcdG9yZGVyZWRLZXlzLmZvckVhY2goKGkpID0+IHtcblx0XHRcdFx0b3JkZXJlZE9iamVjdFtpXSA9IGNvbGxlY3Rpb25baV07XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIG9yZGVyZWRPYmplY3Q7XG5cdFx0fVxuXHR9XG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHRhbmd1bGFyXG5cdFx0Lm1vZHVsZSgnZmNhLmxlZ2FsTm90ZXMnKVxuXHRcdC5jb21wb25lbnQoJ2ZjYURpc2NsYWltZXJzTGlzdCcsIHtcblx0XHRcdHRyYW5zY2x1ZGU6IHRydWUsXG5cdFx0XHR0ZW1wbGF0ZTogJzxkaXYgbmctaWY9XCIkY3RybC5zaG93RGlzY2xhaW1lcnNcIj48bmctdHJhbnNjbHVkZS8+PC9kaXY+Jyxcblx0XHRcdGNvbnRyb2xsZXI6IEZjYURpc2NsYWltZXJzTGlzdENvbnRyb2xsZXJcblx0XHR9KTtcblxuXHRmdW5jdGlvbiBGY2FEaXNjbGFpbWVyc0xpc3RDb250cm9sbGVyKCRsb2NhdGlvbikge1xuXHRcdCduZ0luamVjdCc7XG5cblx0XHR0aGlzLiRvbkluaXQgPSAoKSA9PiB7XG5cdFx0XHRsZXQgdXJsUGFyYW1zID0gJGxvY2F0aW9uLnNlYXJjaCgpO1xuXG5cdFx0XHR0aGlzLnNob3dEaXNjbGFpbWVycyA9ICh1cmxQYXJhbXMuc291cmNlKSAmJiAodXJsUGFyYW1zLnNvdXJjZSA9PT0gJ2FkJyk7XG5cdFx0fTtcblx0fVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ2ZjYS5sZWdhbE5vdGVzJylcblx0XHQuY29tcG9uZW50KCdmY2FMZWdhbFRvb2x0aXAnLCB7XG5cdFx0XHRiaW5kaW5nczoge1xuXHRcdFx0XHRsYWJlbDogJ0AnLFxuXHRcdFx0XHR0eXBlOiAnQCcsXG5cdFx0XHRcdHZhbHVlOiAnQD8nLFxuXHRcdFx0XHRrZXk6ICdAJyxcblx0XHRcdFx0b3B0aW9uczogJzw/J1xuXHRcdFx0fSxcblx0XHRcdHRyYW5zY2x1ZGU6IHRydWUsXG5cdFx0XHR0ZW1wbGF0ZTogZ2V0VGVtcGxhdGUoKSxcblx0XHRcdGNvbnRyb2xsZXI6IEZjYUxlZ2FsVG9vbHRpcENvbnRyb2xsZXJcblx0XHR9KTtcblxuXHRmdW5jdGlvbiBGY2FMZWdhbFRvb2x0aXBDb250cm9sbGVyKCRlbGVtZW50LCAkdGltZW91dCkge1xuXHRcdCduZ0luamVjdCc7XG5cblx0XHR0aGlzLiRwb3N0TGluayA9ICgpID0+IHtcblx0XHRcdGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRcdFx0XHRsZXQgY29udGVudE5vZGUgPSAkZWxlbWVudFswXS5xdWVyeVNlbGVjdG9yQWxsKCcuY29udGVudCcpWzBdO1xuXG5cdFx0XHRcdC8qIEhhcnZlc3QgbGVnYWwgbWVudGlvbiBjb250ZW50IGZyb20gRE9NICovXG5cdFx0XHRcdGlmICh0aGlzLnZhbHVlKSB7XG5cdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KCduZy10cmFuc2NsdWRlJywgJGVsZW1lbnRbMF0pLmh0bWwodGhpcy52YWx1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKlxuXHRcdFx0XHQgKiBHZXQgdGhlIHBhcmVudCBtb2R1bGUgYm94IGZvciBlYWNoIGRpc2NsYWltZXIgdHJpZ2dlclxuXHRcdFx0XHQgKiBDYW5ub3QgYXBwZW5kIHRvIGJvZHkgZm9yIGFsbCBkaXNjbGFpbWVyIHRvb2x0aXBzXG5cdFx0XHRcdCAqIHRoaXMgaXMgZHVlIHRvIGNvbXBsZXggei1pbmRleCBzY2VuYXJpb3MgY2F1c2VkIGJ5IHNjcm9sbGluZyBhbmltYXRpb25cblx0XHRcdFx0ICovXG5cdFx0XHRcdGxldCAkcGFyZW50RGl2ID0gJCgkZWxlbWVudFswXSkucGFyZW50cygnLmxheW91dC1tb2R1bGUnKTtcblxuXHRcdFx0XHRpZiAoJHBhcmVudERpdi5sZW5ndGggPD0gMCkge1xuXHRcdFx0XHRcdCRwYXJlbnREaXYgPSAkKCdib2R5Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgaXNOb3JtYWxQbGFjZW1lbnQgPSB0cnVlO1xuXG5cdFx0XHRcdC8vIENvbmRpdGlvbiBmb3IgZGlzY2xhaW1lcnMgaW4gcGFub3MuIHRoZXkgbmVlZCB0byBiZSBwbGFjZWQgdG8gdGhlIHNpZGUgdG8gYXZvaWQgcG9wcGluZyB1bmRlciB0aGUgdGhlIGhlYWRlciAoY2Fubm90IGJlIGZpeGVkIHdpdGggei1pbmRleClcblx0XHRcdFx0aWYgKCRwYXJlbnREaXZbMF0uZGF0YXNldCAmJlxuXHRcdFx0XHRcdCRwYXJlbnREaXZbMF0uZGF0YXNldC5ncm91cElkICYmXG5cdFx0XHRcdFx0JHBhcmVudERpdlswXS5kYXRhc2V0Lmdyb3VwSWQgPT09ICdzdGFja2VkLWFuaW0tZ3JvdXAtMCcpIHtcblx0XHRcdFx0XHRpc05vcm1hbFBsYWNlbWVudCA9IGZhbHNlO1xuXHRcdFx0XHRcdCRwYXJlbnREaXYgPSAkcGFyZW50RGl2LmZpbmQoJ1tkYXRhLXRvb2x0aXAtY29udGFpbmVyXScpO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRsZXQgb3B0aW9ucyA9IGFuZ3VsYXIuZXh0ZW5kKHtcblx0XHRcdFx0XHRwb3NpdGlvbjogaXNOb3JtYWxQbGFjZW1lbnQgPyAndG9wJyA6ICdyaWdodCcsXG5cdFx0XHRcdFx0dHJpZ2dlcjogJ2NsaWNrJyxcblx0XHRcdFx0XHRodG1sOiBjb250ZW50Tm9kZSxcblx0XHRcdFx0XHR0aGVtZTogJ2ZjYXRvb2x0aXBzJyxcblx0XHRcdFx0XHRhcnJvdzogdHJ1ZSxcblx0XHRcdFx0XHRhcHBlbmRUbzogJHBhcmVudERpdlswXVxuXHRcdFx0XHRcdC8vIG1vcmUgb3B0aW9uczogaHR0cHM6Ly9hdG9taWtzLmdpdGh1Yi5pby90aXBweWpzLyNhbGwtc2V0dGluZ3Ncblx0XHRcdFx0fSwgdGhpcy5vcHRpb25zKTtcblxuXHRcdFx0XHRsZXQgdGlwcHlJbnN0ID0gdGlwcHkoJGVsZW1lbnRbMF0sIG9wdGlvbnMpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcblxuXHRcdFx0XHQvLyBTdG9yZSByZWZlcmVuY2UgdG8gdGhlIHRpcHB5IHBvcHVwIG9uIHRoZSB0cmlnZ2VyIChuZWVkZWQgYnkgcGFubyBjYXJvdXNlbClcblx0XHRcdFx0JGVsZW1lbnRbMF0uZGF0YXNldC50aXBweVBvcHBlciA9IHRpcHB5SW5zdC5zdG9yZVswXS5wb3BwZXIuaWQ7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoKSB7XG5cdFx0cmV0dXJuIGA8c3BhbiBjbGFzcz1cImxlZ2FsLXRvb2x0aXBcIiBcblx0XHRcdFx0XHRkYXRhLW5nLWNsYXNzPVwieydsZWdhbC1pYnViYmxlLWNvbnRhaW5lcic6ICRjdHJsLnR5cGUgPT0gJ2lidWJibGUnfVwiPlxuXHRcdFx0XHRcdDxhIG5nLWlmPVwiJGN0cmwudHlwZSAhPSAnaWJ1YmJsZSdcIiBcblx0XHRcdFx0XHRcdGNsYXNzPVwibGVnYWwtdG9vbHRpcC1sYWJlbCBpcy17ezo6JGN0cmwudHlwZX19XCIgXG5cdFx0XHRcdFx0XHRkYXRhLWFuYWx5dGljcy1vbiBcblx0XHRcdFx0XHRcdGRhdGEtYW5hbHl0aWNzLWV2ZW50PVwibGVnYWxub3RlXCIgXG5cdFx0XHRcdFx0XHRkYXRhLWFuYWx5dGljcy1sZWdhbG5vdGU9XCJsZWdhbCBub3RlXCI+XG5cdFx0XHRcdFx0XHQ8c3Bhbj57ezo6JGN0cmwubGFiZWx9fTwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cblx0XHRcdFx0XHQ8YSBuZy1pZj1cIiRjdHJsLnR5cGUgPT0gJ2lidWJibGUnXCIgXG5cdFx0XHRcdFx0XHRjbGFzcz1cImxlZ2FsLXRvb2x0aXAtbGFiZWwgaXMtaWJ1YmJsZVwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3M9XCJmY2FpY29uIGZjYWljb24taWJ1YmJsZVwiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8L2E+XG5cblx0XHRcdFx0XHQ8ZGF0YSBjbGFzcz1cImxlZ2FsLXRvb2x0aXAtY29udGVudFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG5cdFx0XHRcdFx0XHRcdDxuZy10cmFuc2NsdWRlPjwvbmctdHJhbnNjbHVkZT5cblx0XHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDwvZGF0YT5cblx0XHRcdFx0PC9zcGFuPmA7XG5cdH1cbn0pKCk7XG5cbiIsIihmdW5jdGlvbigpIHtcblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ2ZjYS5zdGF0aWMzNjAnKVxuXHRcdC5kaXJlY3RpdmUoJ2ZjYVZyMzYwSG90c3BvdCcsIGZjYVZyMzYwSG90c3BvdCk7XG5cblxuXHRmdW5jdGlvbiBmY2FWcjM2MEhvdHNwb3QoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0XHRzY29wZTogdHJ1ZSxcblx0XHRcdGJpbmRUb0NvbnRyb2xsZXI6IHtcblx0XHRcdFx0aWQ6ICdAJyxcblx0XHRcdFx0bGFuZzogJ0AnLFxuXHRcdFx0XHRob3RzcG90SW1hZ2U6ICdAJyxcblx0XHRcdFx0aG90c3BvdFRpdGxlOiAnQCcsXG5cdFx0XHRcdGhvdHNwb3RDb3B5OiAnQCcsXG5cdFx0XHRcdGhvdHNwb3RJbmRleDogJ0AnLCAvLyBUT0RPIGNoYW5nZSB0byA8XG5cdFx0XHRcdHByZXZMYWJlbDogJ0AnLFxuXHRcdFx0XHRwcmV2SW5kZXg6ICdAJyxcblx0XHRcdFx0bmV4dExhYmVsOiAnQCcsXG5cdFx0XHRcdG5leHRJbmRleDogJ0AnXG5cdFx0XHR9LFxuXHRcdFx0Y29udHJvbGxlckFzOiAndnIzNjBIb3RzcG90Jyxcblx0XHRcdGNvbnRyb2xsZXI6IEZjYVZyMzYwSG90c3BvdENvbnRyb2xsZXIsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJy9wYW5lbHMvdnIzNjAvZmNhLXZyMzYwLWhvdHNwb3QuaHRtbCdcblx0XHR9O1xuXG5cdFx0ZnVuY3Rpb24gRmNhVnIzNjBIb3RzcG90Q29udHJvbGxlcigkc2NvcGUpIHtcblx0XHRcdCduZ0luamVjdCc7XG5cblx0XHRcdCRzY29wZS5pbmRleCA9IDA7IC8vIFRPRE8gcmVtb3ZlICRzY29wZSBhbmQgdXNlIHRoaXMgaW5zdGVhZFxuXHRcdH1cblx0fVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcblx0YW5ndWxhclxuXHRcdC5tb2R1bGUoJ2ZjYS5zdGF0aWMzNjAnKVxuXHRcdC5kaXJlY3RpdmUoJ2ZjYVZyMzYwVWknLCBmY2FWcjM2MFVpKTtcblxuXHRmdW5jdGlvbiBmY2FWcjM2MFVpKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdFx0c2NvcGU6IHRydWUsXG5cdFx0XHRiaW5kVG9Db250cm9sbGVyOiB7XG5cdFx0XHRcdG1vZGVsU2hvd246ICdAJyxcblx0XHRcdFx0ZnVsbHNjcmVlbk5hdlRpdGxlOiAnQCdcblx0XHRcdH0sXG5cdFx0XHRjb250cm9sbGVyQXM6ICd2cjM2MHVpJyxcblx0XHRcdGNvbnRyb2xsZXI6IEZjYVZyMzYwVWlDb250cm9sbGVyLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICcvcGFuZWxzL3ZyMzYwL2ZjYS12cjM2MC11aS5odG1sJ1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBGY2FWcjM2MFVpQ29udHJvbGxlcigpIHtcblx0XHRcdHRoaXMuJG9uSW5pdCA9ICgpID0+IHtcblxuXHRcdFx0fTtcblx0XHR9XG5cdH1cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cdGFuZ3VsYXJcblx0XHQubW9kdWxlKCdmY2Euc3RhdGljMzYwJylcblx0XHQuY29tcG9uZW50KCdmY2FWcjM2MCcsXHR7XG5cdFx0XHR0ZW1wbGF0ZVVybDogJy9wYW5lbHMvdnIzNjAvZmNhLXZyMzYwLmh0bWwnLFxuXHRcdFx0YmluZGluZ3M6IHtcblx0XHRcdFx0b2JqZWN0OiAnPCcsXG5cdFx0XHRcdGJyYW5kOiAnQCcsXG5cdFx0XHRcdGJyYW5kTG9nb1BhdGg6ICdAJyxcblx0XHRcdFx0Y29udGFpbmVySWQ6ICdAJyxcblx0XHRcdFx0aWNvblJlc2V0OiAnQCcsXG5cdFx0XHRcdGljb25QYXVzZTogJ0AnLFxuXHRcdFx0XHRjb250ZXh0SWQ6ICdAJyxcblx0XHRcdFx0Z3JvdXBJZDogJ0AnLFxuXHRcdFx0XHRuYW1lcGxhdGU6ICdAJyxcblx0XHRcdFx0Y2FwdGlvbjogJ0AnLFxuXHRcdFx0XHRjdXN0b21UZXh0OiAnPCcsXG5cdFx0XHRcdHNlbGVjdGVkSW5kZXg6ICc8Jyxcblx0XHRcdFx0YWN0aXZhdGVDdGE6ICdAJyxcblx0XHRcdFx0YW5hbHl0aWNzTGFiZWw6ICdAJyxcblx0XHRcdFx0ZnVsbHNjcmVlbk1vZGU6ICc8Jyxcblx0XHRcdFx0Z2FsbGVyeUl0ZW1JZDogJ0AnXG5cdFx0XHR9LFxuXHRcdFx0Y29udHJvbGxlckFzOiAndnIzNjAnLFxuXHRcdFx0Y29udHJvbGxlcjogRmNhVnIzNjBDb250cm9sbGVyXG5cdFx0fSk7XG5cblx0ZnVuY3Rpb24gRmNhVnIzNjBDb250cm9sbGVyKCRzY29wZSwgJGNvbXBpbGUsICRlbGVtZW50LCAkdGltZW91dCwgJGRvY3VtZW50LCAkd2luZG93LCBndG1BbmFseXRpY3MpIHtcblx0XHQnbmdJbmplY3QnO1xuXG5cdFx0bGV0IHZtID0gdGhpcztcblx0XHR2bS5pc0dhbGxlcnkgPSBmYWxzZTtcblx0XHR2bS5zZWxlY3RlZDM2MCA9IDA7XG5cdFx0dm0ubW9kYWxJZCA9IDA7XG5cdFx0dm0uaXNQU1ZBY3RpdmUgPSBmYWxzZTtcblx0XHR2bS4kY29udGFpbmVyO1xuXHRcdHZtLnRyaW1zID0gW107XG5cblx0XHRsZXQgUFNWID0gJyc7XG5cdFx0bGV0IG9iajM2MCA9ICcnO1xuXHRcdGxldCBjdXN0b21UZXh0ID0gJyc7XG5cblx0XHR2bS4kb25Jbml0ID0gKCkgPT4ge1xuXHRcdFx0dm0uJGNvbnRhaW5lciA9ICRlbGVtZW50LmZpbmQoJy52cjM2MC1tb2R1bGUzNjAtY29udGFpbmVyJyk7XG5cdFx0XHRjdXN0b21UZXh0ID0gdm0uY3VzdG9tVGV4dDtcblx0XHRcdHZtLnNlbGVjdGVkMzYwID0gdm0uc2VsZWN0ZWRJbmRleDtcblx0XHRcdHZtLmRlZmF1bHRPYmplY3QgPSB2bS5vYmplY3Rbdm0uc2VsZWN0ZWQzNjBdO1xuXG5cdFx0XHQkc2NvcGUuJG9uKCdnYWxsZXJ5UGFnZS50cmlnZ2VyQWN0aXZlU2xpZGVDb250ZW50Jywgdm0udHJpZ2dlckFjdGl2ZVNsaWRlQ29udGVudCk7XG5cdFx0XHQkc2NvcGUuJG9uKCdnYWxsZXJ5UGFnZS5jb2xsYXBzZScsIHZtLmRlc3Ryb3kzNjApO1xuXHRcdH07XG5cblx0XHR2bS4kb25DaGFuZ2VzID0gZnVuY3Rpb24oY2hhbmdlcykge1xuXHRcdFx0aWYgKGNoYW5nZXMuZnVsbHNjcmVlbk1vZGUgJiYgY2hhbmdlcy5mdWxsc2NyZWVuTW9kZS5jdXJyZW50VmFsdWUgIT0gY2hhbmdlcy5mdWxsc2NyZWVuTW9kZS5wcmV2aW91c1ZhbHVlKSB7XG5cdFx0XHRcdGlmICh2bS4kY29udGFpbmVyICYmIHZtLmlzUFNWQWN0aXZlKSB7XG5cdFx0XHRcdFx0aWYgKHZtLmZ1bGxzY3JlZW5Nb2RlKSB7XG5cdFx0XHRcdFx0XHR2bS5lbnRlckZ1bGxzY3JlZW4oKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dm0uZXhpdEZ1bGxzY3JlZW4oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dm0uaW5pdDM2MCA9ICgpID0+IHtcblx0XHRcdG9iajM2MCA9IHZtLm9iamVjdFt2bS5zZWxlY3RlZDM2MF07XG5cblx0XHRcdC8vIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHBsYXllcnMgY29udHJvbCBpY29ucyB3aXRoIGN1c3RvbSBvbmVzXG5cdFx0XHRQaG90b1NwaGVyZVZpZXdlci5JQ09OU1snem9vbS1pbi5zdmcnXSA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJ1dGYtOFwiPz48c3ZnIHZlcnNpb249XCIxLjFcIiBpZD1cIkxheWVyXzFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeD1cIjBweFwiIHk9XCIwcHhcIiB2aWV3Qm94PVwiMCAwIDYwIDQ4LjFcIiBzdHlsZT1cImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjAgNDguMTtcIiB4bWw6c3BhY2U9XCJwcmVzZXJ2ZVwiPjxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj4uc3Qwe2ZpbGw6I0ZGRkZGRjt9PC9zdHlsZT48cGF0aCBjbGFzcz1cInN0MFwiIGQ9XCJNNDIuMSwyMS45aC05LjZjLTAuMiwwLTAuMy0wLjEtMC4zLTAuM3YwVjEyYzAtMC40LTAuMy0wLjctMC43LTAuN2gtMi45Yy0wLjQsMC0wLjcsMC4zLTAuNywwLjd2OS42IGMwLDAuMi0wLjEsMC4zLTAuMywwLjNoLTkuNmMtMC40LDAtMC43LDAuMy0wLjcsMC43djIuOWMwLDAuNCwwLjMsMC43LDAuNywwLjdoOS42YzAuMiwwLDAuMywwLjEsMC4zLDAuM3Y5LjYgYzAsMC40LDAuMywwLjcsMC42LDAuN2MwLDAsMCwwLDAsMGgyLjljMC40LDAsMC43LTAuMywwLjctMC43bDAsMHYtOS42YzAtMC4yLDAuMS0wLjMsMC4zLTAuM2wwLDBoOS42YzAuNCwwLDAuNy0wLjMsMC43LTAuN3YtMi45IEM0Mi43LDIyLjMsNDIuNSwyMiw0Mi4xLDIxLjlDNDIuMSwyMS45LDQyLjEsMjEuOSw0Mi4xLDIxLjl6XCIvPjwvc3ZnPic7XG5cdFx0XHRQaG90b1NwaGVyZVZpZXdlci5JQ09OU1snem9vbS1vdXQuc3ZnJ10gPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwidXRmLThcIj8+PHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCA2MCA0OC4xXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYwIDQ4LjE7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnN0MHtmaWxsOiNGRkZGRkY7fTwvc3R5bGU+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTE3LjksMjEuOWgyNC4yYzAuNCwwLDAuNywwLjMsMC43LDAuN3YyLjljMCwwLjQtMC4zLDAuNy0wLjcsMC43SDE3LjljLTAuNCwwLTAuNy0wLjMtMC43LTAuN3YtMi45IEMxNy4yLDIyLjIsMTcuNSwyMS45LDE3LjksMjEuOXpcIi8+PC9zdmc+Jztcblx0XHRcdFBob3RvU3BoZXJlVmlld2VyLklDT05TWyd6b29tLW91dC5zdmcnXSA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJ1dGYtOFwiPz48c3ZnIHZlcnNpb249XCIxLjFcIiBpZD1cIkxheWVyXzFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeD1cIjBweFwiIHk9XCIwcHhcIiB2aWV3Qm94PVwiMCAwIDYwIDQ4LjFcIiBzdHlsZT1cImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjAgNDguMTtcIiB4bWw6c3BhY2U9XCJwcmVzZXJ2ZVwiPjxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj4uc3Qwe2ZpbGw6I0ZGRkZGRjt9PC9zdHlsZT48cGF0aCBjbGFzcz1cInN0MFwiIGQ9XCJNMTcuOSwyMS45aDI0LjJjMC40LDAsMC43LDAuMywwLjcsMC43djIuOWMwLDAuNC0wLjMsMC43LTAuNywwLjdIMTcuOWMtMC40LDAtMC43LTAuMy0wLjctMC43di0yLjkgQzE3LjIsMjIuMiwxNy41LDIxLjksMTcuOSwyMS45elwiLz48L3N2Zz4nO1xuXHRcdFx0UGhvdG9TcGhlcmVWaWV3ZXIuSUNPTlNbJ3BsYXkuc3ZnJ10gPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwidXRmLThcIj8+PHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCA2MCA0OC4xXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYwIDQ4LjE7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnN0MHtmaWxsOiNGRkZGRkY7fTwvc3R5bGU+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTQwLDIyLjNMMjIsMTEuOWMtMS0wLjYtMi4yLTAuMi0yLjcsMC43Yy0wLjIsMC4zLTAuMywwLjYtMC4zLDF2MjAuOGMwLDEuMSwwLjksMiwyLDJjMC4zLDAsMC43LTAuMSwxLTAuMyBsMTgtMTAuNGMwLjktMC42LDEuMi0xLjgsMC43LTIuN0M0MC41LDIyLjcsNDAuMywyMi41LDQwLDIyLjN6XCIvPjwvc3ZnPic7XG5cdFx0XHRQaG90b1NwaGVyZVZpZXdlci5JQ09OU1snZnVsbHNjcmVlbi1pbi5zdmcnXSA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJ1dGYtOFwiPz48c3ZnIHZlcnNpb249XCIxLjFcIiBpZD1cIkxheWVyXzFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgeD1cIjBweFwiIHk9XCIwcHhcIiB2aWV3Qm94PVwiMCAwIDYwIDQ4LjFcIiBzdHlsZT1cImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjAgNDguMTtcIiB4bWw6c3BhY2U9XCJwcmVzZXJ2ZVwiPjxzdHlsZSB0eXBlPVwidGV4dC9jc3NcIj4uc3Qwe2ZpbGw6I0ZGRkZGRjt9PC9zdHlsZT48Zz48cGF0aCBjbGFzcz1cInN0MFwiIGQ9XCJNMjkuNywyNy4xbC01LjUsNS41bDIuNCwyLjRjMC4yLDAuMiwwLjMsMC40LDAuMywwLjhjMCwwLjYtMC41LDEtMSwxaC03LjVjLTAuNiwwLTEtMC41LTEtMXYtNy41IGMwLTAuNiwwLjUtMSwxLTFjMC4zLDAsMC41LDAuMSwwLjgsMC4zbDIuNCwyLjRsNS40LTUuNWMwLjEtMC4xLDAuMy0wLjIsMC4zLTAuMmMwLjEsMCwwLjMsMC4xLDAuMywwLjJsMS45LDEuOSBjMC4xLDAuMSwwLjIsMC4zLDAuMiwwLjNDMjkuOCwyNi45LDI5LjgsMjcsMjkuNywyNy4xeiBNNDIuOCwxOS44YzAsMC42LTAuNSwxLTEsMWMtMC4zLDAtMC41LTAuMS0wLjgtMC4zbC0yLjQtMi40bC01LjUsNS41IGMtMC4xLDAuMS0wLjMsMC4yLTAuMywwLjJzLTAuMy0wLjEtMC4zLTAuMmwtMi0xLjljLTAuMS0wLjEtMC4yLTAuMy0wLjItMC40YzAtMC4yLDAuMS0wLjMsMC4yLTAuM2w1LjUtNS41bC0yLjQtMi40IGMtMC4yLTAuMi0wLjMtMC40LTAuMy0wLjhjMC0wLjYsMC41LTEsMS0xaDcuNWMwLjYsMCwxLDAuNSwxLDFWMTkuOHpcIi8+PC9nPjwvc3ZnPic7XG5cdFx0XHRQaG90b1NwaGVyZVZpZXdlci5JQ09OU1snZnVsbHNjcmVlbi1vdXQuc3ZnJ10gPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwidXRmLThcIj8+PHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCA2MCA0OC4xXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYwIDQ4LjE7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+LnN0MHtmaWxsOiNGRkZGRkY7fTwvc3R5bGU+PGc+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTQyLjUsMTQuMWwtNS40LDUuNGwyLjQsMi40YzAuMiwwLjIsMC4zLDAuNCwwLjMsMC44YzAsMC42LTAuNSwxLTEsMWgtNy4zYy0wLjYsMC0xLTAuNS0xLTF2LTcuMyBjMC0wLjYsMC41LTEsMS0xYzAuMywwLDAuNSwwLjEsMC44LDAuM2wyLjQsMi40bDUuNC01LjRjMC4xLTAuMSwwLjMtMC4yLDAuMy0wLjJjMC4xLDAsMC4zLDAuMSwwLjMsMC4ybDEuOSwxLjkgYzAuMSwwLjEsMC4yLDAuMywwLjIsMC4zQzQyLjgsMTQsNDIuNiwxNC4xLDQyLjUsMTQuMXpcIi8+PHBhdGggY2xhc3M9XCJzdDBcIiBkPVwiTTI5LjcsMzIuOGMwLDAuNi0wLjUsMS0xLDFjLTAuMywwLTAuNS0wLjEtMC44LTAuM2wtMi40LTIuNGwtNS40LDUuNGMtMC4xLDAuMS0wLjMsMC4yLTAuMywwLjIgYy0wLjIsMC0wLjMtMC4xLTAuMy0wLjJsLTEuOS0xLjljLTAuMS0wLjEtMC4yLTAuMy0wLjItMC40czAuMS0wLjMsMC4yLTAuM2w1LjQtNS40bC0yLjQtMi40Yy0wLjItMC4yLTAuMy0wLjQtMC4zLTAuOCBjMC0wLjYsMC41LTEsMS0xaDcuM2MwLjYsMCwxLDAuNSwxLDFMMjkuNywzMi44TDI5LjcsMzIuOHpcIi8+PC9nPjwvc3ZnPic7XG5cblx0XHRcdC8vIGluaXRpYWxpemUgMzYwXG5cdFx0XHRQU1YgPSBuZXcgUGhvdG9TcGhlcmVWaWV3ZXIoe1xuXHRcdFx0XHRjb250YWluZXI6IHZtLiRjb250YWluZXIuZ2V0KDApLFxuXHRcdFx0XHRsb2FkaW5nX2ltZzogdm0uYnJhbmRMb2dvUGF0aCxcblx0XHRcdFx0cGFub3JhbWE6IG9iajM2MFsnaW1hZ2UnXSxcblx0XHRcdFx0YXV0b3JvdGF0ZTogZmFsc2UsXG5cdFx0XHRcdGFuaW1fc3BlZWQgOiAnMXJwbScsXG5cdFx0XHRcdGd5cm9zY29wZTogZmFsc2UsXG5cdFx0XHRcdG1vdmVfc3BlZWQ6IDEsXG5cdFx0XHRcdGNhcHRpb246IHZtLmNhcHRpb24sXG5cdFx0XHRcdG1pbl9mb3Y6IG9iajM2MFsnbWF4Wm9vbSddLFxuXHRcdFx0XHRkZWZhdWx0X2Zvdjogb2JqMzYwWydkZWZhdWx0Wm9vbSddLFxuXHRcdFx0XHRuYXZiYXI6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aXRsZTogJ2Rpc2NsYWltZXInLFxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lOiAnbmF2YmFyLWNhcHRpb24tZGlzY2xhaW1lcicsXG5cdFx0XHRcdFx0XHRjb250ZW50OiBvYmozNjBbJ2Rpc2NsYWltZXInXVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0J3pvb20nLCB7XG5cdFx0XHRcdFx0XHR0aXRsZTogJ1Jlc2V0Jyxcblx0XHRcdFx0XHRcdGNsYXNzTmFtZTogJ2N1c3RvbS1idXR0b24tcmVzZXQtcm90YXRpb24gdG9vbHRpcDM2MCcsXG5cdFx0XHRcdFx0XHRjb250ZW50OiAnPGltZyBzcmM9XCInK3ZtLmljb25SZXNldCsnXCI+PHNwYW4gY2xhc3M9XCJ0b29sdGlwdGV4dFwiPicrY3VzdG9tVGV4dC5yZXNldCsnPC9zcGFuPicsXG5cdFx0XHRcdFx0XHRvbkNsaWNrOiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRQU1YuYW5pbWF0ZSh7XG5cdFx0XHRcdFx0XHRcdFx0XHR4OiBvYmozNjBbJ2RlZmF1bHRYJ10sXG5cdFx0XHRcdFx0XHRcdFx0XHR5OiBvYmozNjBbJ2RlZmF1bHRZJ11cblx0XHRcdFx0XHRcdFx0XHR9LCAyMDAwKTtcblx0XHRcdFx0XHRcdFx0XHRQU1Yuem9vbShvYmozNjBbJ3Jlc2V0Wm9vbSddKTtcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH0oKSlcblx0XHRcdFx0XHR9LCAnYXV0b3JvdGF0ZScsIHtcblx0XHRcdFx0XHRcdHRpdGxlOiAnJyxcblx0XHRcdFx0XHRcdGNsYXNzTmFtZTogJ2N1c3RvbS1idXR0b24tcGF1c2Utcm90YXRpb24gdG9vbHRpcDM2MCcsXG5cdFx0XHRcdFx0XHRjb250ZW50OiAnPGltZyBzcmM9XCInK3ZtLmljb25QYXVzZSsnXCI+PHNwYW4gY2xhc3M9XCJ0b29sdGlwdGV4dFwiPicrY3VzdG9tVGV4dC5wYXVzZSsnPC9zcGFuPicsXG5cdFx0XHRcdFx0XHRvbkNsaWNrOiAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRQU1Yuc3RvcEF1dG9yb3RhdGUoKTtcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH0oKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdmdWxsc2NyZWVuJ1xuXHRcdFx0XHRdLFxuXHRcdFx0XHRtYXJrZXJzOiB2bS5hZGRNYXJrZXJzKG9iajM2MClcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBlbnRlci9leGl0IGZ1bGxzY3JlZW4gdHJpZ2dlcmVkXG5cdFx0XHRQU1Yub24oJ2Z1bGxzY3JlZW4tdXBkYXRlZCcsIGZ1bmN0aW9uKGVuYWJsZWQpIHtcblx0XHRcdFx0Ly8gd2UgbmVlZCB0byByZS1hdHRhY2ggdGhlIHRvb2x0aXAgdG8gdGhlIGZ1bGxzY3JlZW4gaWNvblxuXHRcdFx0XHRpZiAoZW5hYmxlZCkge1xuXHRcdFx0XHRcdG9iajM2MC5mdWxsU2NyZWVuID0gdHJ1ZTtcblx0XHRcdFx0XHRzZXRDdXN0b21UZXh0KGN1c3RvbVRleHQuZXhpdHNjcmVlbiwgJy5wc3YtZnVsbHNjcmVlbi1idXR0b24nKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmozNjAuZnVsbFNjcmVlbiA9IGZhbHNlO1xuXHRcdFx0XHRcdHNldEN1c3RvbVRleHQoY3VzdG9tVGV4dC5mdWxsc2NyZWVuLCAnLnBzdi1mdWxsc2NyZWVuLWJ1dHRvbicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGN1cnJlbnRNYXJrZXIgPSBQU1YuZ2V0Q3VycmVudE1hcmtlcigpO1xuXG5cdFx0XHRcdGlmIChjdXJyZW50TWFya2VyKSB7XG5cdFx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcubW9kdWxlMzYwTW9kYWxzJykuY3NzKCd0b3AnLCAodm0uJGNvbnRhaW5lci5maW5kKCcucHN2LWh1ZCcpLmhlaWdodCgpIC0gdm0uJGNvbnRhaW5lci5maW5kKCcubW9kdWxlMzYwTW9kYWxzJykuaGVpZ2h0KCkpIC8gMiArICdweCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gcmVjYWxjdWxhdGUgc2l6ZSAoZml4ZXMgYnVnIGluIHNhZmFyaSlcblx0XHRcdFx0JHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgncmVzaXplJykpO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIGhpZGUvc2hvdyB0aGUgcGF1c2UvcGxheSBidXR0b24gaW50ZXJjaGFuZ2VseVxuXHRcdFx0UFNWLm9uKCdhdXRvcm90YXRlJywgZnVuY3Rpb24oZW5hYmxlZCkge1xuXHRcdFx0XHRpZiAoZW5hYmxlZCkge1xuXHRcdFx0XHRcdFBTVi56b29tKDEwKTtcblx0XHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtYXV0b3JvdGF0ZS1idXR0b24nKS5oaWRlKCk7XG5cdFx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcuY3VzdG9tLWJ1dHRvbi1wYXVzZS1yb3RhdGlvbicpLnNob3coKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtYXV0b3JvdGF0ZS1idXR0b24nKS5zaG93KCk7XG5cdFx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcuY3VzdG9tLWJ1dHRvbi1wYXVzZS1yb3RhdGlvbicpLmhpZGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHZtLnBvcHVsYXRlSG90c3BvdHMob2JqMzYwWydob3RzcG90cyddKTtcblxuXHRcdFx0UFNWLm9uKCdzZWxlY3QtbWFya2VyJywgZnVuY3Rpb24obWFya2VyKSB7XG5cdFx0XHRcdHNob3dNb2RhbChtYXJrZXIuaWQsICcnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyAzNjAgbG9hZGVkIGFuZCByZWFkeSBmb3IgYW55IERPTSBpbmplY3Rpb25zL21hbmlwdWxhdGlvbnNcblx0XHRcdFBTVi5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0bGV0IHZyMzYwQnV0dG9ucyA9IHZtLiRjb250YWluZXIuZmluZCgnLnBzdi1hdXRvcm90YXRlLWJ1dHRvbiwgLnBzdi1mdWxsc2NyZWVuLWJ1dHRvbiwgLnBzdi16b29tLWJ1dHRvbi1taW51cywgLnBzdi16b29tLWJ1dHRvbi1wbHVzLCAucHN2LXpvb20tYnV0dG9uLWhhbmRsZSwgLmN1c3RvbS1idXR0b24tcmVzZXQtcm90YXRpb24sIC5jdXN0b20tYnV0dG9uLXBhdXNlLXJvdGF0aW9uJyk7XG5cblx0XHRcdFx0UFNWLnN0b3BBdXRvcm90YXRlKCk7XG5cblx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcuY3VzdG9tLWJ1dHRvbi1wYXVzZS1yb3RhdGlvbicpLmhpZGUoKTtcblx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcubW9kYWxCYWNrZ3JvdW5kJykuaGlkZSgpO1xuXG5cdFx0XHRcdC8vIGluamVjdCB0b29sdGlwIHRvIGN1c3RvbSBidXR0b25zXG5cdFx0XHRcdHNldEN1c3RvbVRleHQoY3VzdG9tVGV4dC5wbGF5LCAnLnBzdi1hdXRvcm90YXRlLWJ1dHRvbicpO1xuXHRcdFx0XHRzZXRDdXN0b21UZXh0KGN1c3RvbVRleHQuZnVsbHNjcmVlbiwgJy5wc3YtZnVsbHNjcmVlbi1idXR0b24nKTtcblx0XHRcdFx0c2V0Q3VzdG9tVGV4dChjdXN0b21UZXh0Lnpvb21vdXQsICcucHN2LXpvb20tYnV0dG9uLW1pbnVzJyk7XG5cdFx0XHRcdHNldEN1c3RvbVRleHQoY3VzdG9tVGV4dC56b29taW4sICcucHN2LXpvb20tYnV0dG9uLXBsdXMnKTtcblx0XHRcdFx0c2V0Q3VzdG9tVGV4dChjdXN0b21UZXh0Lnpvb20sICcucHN2LXpvb20tYnV0dG9uLWhhbmRsZScpO1xuXHRcdFx0XHRzZXRDdXN0b21UZXh0KGN1c3RvbVRleHQucmVzZXQsICcuY3VzdG9tLWJ1dHRvbi1yZXNldC1yb3RhdGlvbicpO1xuXG5cdFx0XHRcdC8vIFNldCBkYXRhIGFuYWx5dGljcyB2YWx1ZXMgb24gVUkgYnV0dG9uc1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtYXV0b3JvdGF0ZS1idXR0b24nKS5hdHRyKHsnZGF0YS1hbmFseXRpY3MtbGFiZWwnOiAnYXV0b21hdGljIHJvdGF0aW9uJywgJ2RhdGEtYW5hbHl0aWNzLWNhbGwnOiAnJ30pO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3Ytem9vbS1idXR0b24tbWludXMnKS5hdHRyKHsnZGF0YS1hbmFseXRpY3MtbGFiZWwnOiAnem9vbSBvdXQnLCAnZGF0YS1hbmFseXRpY3MtY2FsbCc6ICcnfSk7XG5cdFx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLnBzdi16b29tLWJ1dHRvbi1wbHVzJykuYXR0cih7J2RhdGEtYW5hbHl0aWNzLWxhYmVsJzonem9vbSBpbicsICdkYXRhLWFuYWx5dGljcy1jYWxsJzogJyd9KTtcblx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcucHN2LXpvb20tYnV0dG9uLWhhbmRsZScpLmF0dHIoeydkYXRhLWFuYWx5dGljcy1sYWJlbCc6ICd6b29tJywgJ2RhdGEtYW5hbHl0aWNzLWNhbGwnOiAnJ30pO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5jdXN0b20tYnV0dG9uLXJlc2V0LXJvdGF0aW9uJykuYXR0cih7J2RhdGEtYW5hbHl0aWNzLWxhYmVsJzogJ3Jlc2V0JywgJ2RhdGEtYW5hbHl0aWNzLWNhbGwnOiAnJ30pO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5jdXN0b20tYnV0dG9uLXBhdXNlLXJvdGF0aW9uJykuYXR0cih7J2RhdGEtYW5hbHl0aWNzLWxhYmVsJzogJ3BhdXNlJywgJ2RhdGEtYW5hbHl0aWNzLWNhbGwnOiAnJ30pO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtZnVsbHNjcmVlbi1idXR0b24nKS5hdHRyKHsnZGF0YS1hbmFseXRpY3MtbGFiZWwnOiAndG9nZ2xlIGZ1bGwgc2NyZWVuJywgJ2RhdGEtYW5hbHl0aWNzLWNhbGwnOiAnJ30pO1xuXG5cdFx0XHRcdHZyMzYwQnV0dG9ucy5vbignY2xpY2snLCAkZWxlbWVudCwgKGUpID0+IHtcblx0XHRcdFx0XHRsZXQgdGFyZ2V0TGFiZWwgPSBhbmd1bGFyLmVsZW1lbnQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLWFuYWx5dGljcy1sYWJlbCcpO1xuXG5cdFx0XHRcdFx0bGV0IGV2ZW50T2JqZWN0ID0ge1xuXHRcdFx0XHRcdFx0Y2F0ZWdvcnk6IGAke3ZtLmNvbnRleHRJZH0gJHt2bS5ncm91cElkfWAsXG5cdFx0XHRcdFx0XHRsYWJlbDogYCR7dm0uYW5hbHl0aWNzTGFiZWx9IC0gJHt0YXJnZXRMYWJlbH1gXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGd0bUFuYWx5dGljcy50cmFja0V2ZW50KCdldmVudCcsIGV2ZW50T2JqZWN0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Ly8gbmF2aWdhdGUgdG8gdGhlIGRlZmF1bHQgcG9zaXRpb25cblx0XHRcdFx0aWYgKG9iajM2MFsnZGVmYXVsdFgnXSA+IDAgJiYgb2JqMzYwWydkZWZhdWx0WSddID4gMCkge1xuXHRcdFx0XHRcdFBTVi5hbmltYXRlKHtcblx0XHRcdFx0XHRcdHg6IG9iajM2MFsnZGVmYXVsdFgnXSxcblx0XHRcdFx0XHRcdHk6IG9iajM2MFsnZGVmYXVsdFknXSxcblx0XHRcdFx0XHR9LCAyMDAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh2bS5tb2RhbElkID4gMCkge1xuXHRcdFx0XHRcdHNob3dNb2RhbCh2bS5tb2RhbElkLCAnJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5kZDM2MCcpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuXG5cdFx0XHRcdC8vIGZvcmNlIHJlZHJhdyB0byBtYXRjaCBjb250YWluZXIgc2l6ZVxuXHRcdFx0XHQkd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdyZXNpemUnKSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dm0uaXNQU1ZBY3RpdmUgPSB0cnVlO1xuXG5cdFx0XHRpZiAodm0uZnVsbHNjcmVlbk1vZGUpIHtcblx0XHRcdFx0dm0uZW50ZXJGdWxsc2NyZWVuKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZtLnNob3dIb3RTcG90ID0gKGhvdHNwb3RJRCwgZGlyZWN0aW9uKSA9PiB7XG5cdFx0XHRzaG93TW9kYWwoaG90c3BvdElELCBkaXJlY3Rpb24pO1xuXHRcdH07XG5cblx0XHR2bS5hZGRNYXJrZXJzID0gKG9iajM2MCkgPT4ge1xuXG5cdFx0XHRsZXQgYSA9IFtdO1xuXG5cdFx0XHRPYmplY3Qua2V5cyhvYmozNjBbJ2hvdHNwb3RzJ10pLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdGEucHVzaCh7XG5cdFx0XHRcdFx0aWQ6IG9iajM2MFsnaG90c3BvdHMnXVtrZXldWydpZCddLFxuXHRcdFx0XHRcdG5hbWU6IG9iajM2MFsnaG90c3BvdHMnXVtrZXldWyd0aXRsZSddLFxuXHRcdFx0XHRcdHg6IG9iajM2MFsnaG90c3BvdHMnXVtrZXldWyd4J10sXG5cdFx0XHRcdFx0eTogb2JqMzYwWydob3RzcG90cyddW2tleV1bJ3knXSxcblx0XHRcdFx0XHR3aWR0aDogMjAsXG5cdFx0XHRcdFx0aGVpZ2h0OiAyMCxcblx0XHRcdFx0XHRpbWFnZTogJy92cjM2MC1hc3NldHMvaW1hZ2VzL3VpL2ZjYS1wdWxzZS1lbXB0eS5naWYnXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH07XG5cblx0XHR2bS5zaG93RHJvcGRvd24gPSAobW9kZSkgPT4ge1xuXHRcdFx0bGV0IGRkMzYwID0gdm0uJGNvbnRhaW5lci5maW5kKCcuZGQzNjAnKTtcblxuXHRcdFx0aWYgKG1vZGUpIHtcblx0XHRcdFx0ZGQzNjAuYWRkQ2xhc3MoJ2FjdGl2ZU1vZHVsZTM2MCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGQzNjAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZU1vZHVsZTM2MCcpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBwb3B1bGF0ZSBob3RzcG90cyBhbmQgbW9kZWwgZHJvcGRvd24gZHluYW1pY2FsbHkgb24gdGhlIGZseVxuXHRcdHZtLnBvcHVsYXRlSG90c3BvdHMgPSAoaG90c3BvdHNPYmopID0+IHtcblx0XHRcdGxldCBvYmplY3QgPSB2bS5vYmplY3Q7XG5cdFx0XHRsZXQgdWlIVE1MID0gJzxkaXYgY2xhc3M9XCJ2cjM2MC1pbnN0LXdyYXBwZXJcIj4nO1xuXG5cdFx0XHRpZiAodm0ub2JqZWN0Lmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0bGV0IGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuXG5cdFx0XHRcdGlmIChrZXlzLmxlbmd0aCAhPT0gdm0udHJpbXMubGVuZ3RoKSB7IC8vIG1ha2Ugc3VyZSBkdXBsaWNhdGUgdHJpbXMgbm90IGFkZGVkIHRvIGRyb3Bkb3duXG5cdFx0XHRcdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgaW5kZXgpIHtcblx0XHRcdFx0XHRcdHZtLnRyaW1zLnB1c2gob2JqZWN0W2tleV0ubmFtZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dWlIVE1MICs9IGBcblx0XHRcdFx0PGRpdiBmY2EtdnIzNjAtdWlcblx0XHRcdFx0XHQgZGF0YS1mdWxsc2NyZWVuLW5hdi10aXRsZT1cIiR7Y3VzdG9tVGV4dC5pbnRlcmlvcjM2MH1cIlxuXHRcdFx0XHRcdCBkYXRhLW1vZGVsLXNob3duPVwiJHtvYmozNjAubmFtZX1cIlxuXHRcdFx0XHQ+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0YDtcblxuXHRcdFx0dWlIVE1MICs9ICc8ZGl2IGNsYXNzPVwibW9kdWxlMzYwTW9kYWxzXCI+JztcblxuXHRcdFx0T2JqZWN0LmtleXMoaG90c3BvdHNPYmopLmZvckVhY2goZnVuY3Rpb24oa2V5LCBpbmRleCkge1xuXHRcdFx0XHRsZXQgbW9kYWxBbmFsVGl0bGUgPSBob3RzcG90c09ialtrZXldWyd0aXRsZSddLnJlcGxhY2UoL1wiL2csICdcXFxcXFxcIicpO1xuXHRcdFx0XHRsZXQgZGVmYXVsdExMID0gJyc7XG5cdFx0XHRcdGxldCBkZWZhdWx0UlIgPSAnJztcblx0XHRcdFx0bGV0IHByZXZJbmRleCA9ICcnO1xuXHRcdFx0XHRsZXQgbmV4dEluZGV4ID0gJyc7XG5cblx0XHRcdFx0aWYgKGtleSA+IDApIHtcblx0XHRcdFx0XHRkZWZhdWx0TEwgPSBob3RzcG90c09ialtpbmRleC0xXVsndGl0bGUnXTtcblx0XHRcdFx0XHRwcmV2SW5kZXggPSBob3RzcG90c09ialtpbmRleC0xXVsnaWQnXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWZhdWx0TEwgPSBob3RzcG90c09ialsoaG90c3BvdHNPYmoubGVuZ3RoIC0xKV1bJ3RpdGxlJ107XG5cdFx0XHRcdFx0cHJldkluZGV4ID0gaG90c3BvdHNPYmpbKGhvdHNwb3RzT2JqLmxlbmd0aCAtMSldWydpZCddO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGtleSAhPSBob3RzcG90c09iai5sZW5ndGgtMSkge1xuXHRcdFx0XHRcdGRlZmF1bHRSUiA9IGhvdHNwb3RzT2JqW2luZGV4KzFdWyd0aXRsZSddO1xuXHRcdFx0XHRcdG5leHRJbmRleCA9IGhvdHNwb3RzT2JqW2luZGV4KzFdWydpZCddO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlZmF1bHRSUiA9IGhvdHNwb3RzT2JqWzBdWyd0aXRsZSddO1xuXHRcdFx0XHRcdG5leHRJbmRleCA9IGhvdHNwb3RzT2JqWzBdWydpZCddO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dWlIVE1MICs9IGBcblx0XHRcdFx0XHQ8ZGl2IGZjYS12cjM2MC1ob3RzcG90XG5cdFx0XHRcdFx0XHQgaWQ9XCJob3RzcG90LSR7aG90c3BvdHNPYmpba2V5XVsnaWQnXX1cIlxuXHRcdFx0XHRcdFx0IGxhbmc9XCIke21vZGFsQW5hbFRpdGxlfVwiXG5cdFx0XHRcdFx0XHQgY2xhc3M9XCJtb2R1bGUzNjBNb2RhbFwiXG5cdFx0XHRcdFx0XHQgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIlxuXHRcdFx0XHRcdFx0IGRhdGEtaG90c3BvdC1pbWFnZT0nJHtob3RzcG90c09ialtrZXldWydpbWFnZSddfSdcblx0XHRcdFx0XHRcdCBkYXRhLWhvdHNwb3QtdGl0bGU9JyR7aG90c3BvdHNPYmpba2V5XVtcInRpdGxlXCJdfSdcblx0XHRcdFx0XHRcdCBkYXRhLWhvdHNwb3QtY29weT0nJHtob3RzcG90c09ialtrZXldW1wiY29weVwiXX0nXG5cdFx0XHRcdFx0XHQgZGF0YS1ob3RzcG90LWluZGV4PScke2luZGV4fSdcblx0XHRcdFx0XHRcdCBkYXRhLXByZXYtbGFiZWw9JyR7ZGVmYXVsdExMfSdcblx0XHRcdFx0XHRcdCBkYXRhLXByZXYtaW5kZXg9JyR7cHJldkluZGV4fSdcblx0XHRcdFx0XHRcdCBkYXRhLW5leHQtbGFiZWw9JyR7ZGVmYXVsdFJSfSdcblx0XHRcdFx0XHRcdCBkYXRhLW5leHQtaW5kZXg9JyR7bmV4dEluZGV4fSdcblx0XHRcdFx0XHRcdCBkYXRhLW9iai1sZW5ndGg9JyR7b2JqZWN0Lmxlbmd0aH0nXG5cdFx0XHRcdFx0PjwvZGl2PlxuXHRcdFx0XHRgO1xuXHRcdFx0fSk7XG5cblx0XHRcdHVpSFRNTCArPSAnPC9kaXY+PC9kaXY+JztcblxuXHRcdFx0dmFyIGFuZ3VsYXJPYmplY3QgPSBhbmd1bGFyLmVsZW1lbnQoJGNvbXBpbGUodWlIVE1MKSgkc2NvcGUpKTtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLnBzdi1jb250YWluZXInKS5hcHBlbmQoYW5ndWxhck9iamVjdCk7XG5cdFx0fTtcblxuXHRcdC8vIHNldCBjdXN0b20gY29udHJvbHMgdG9vbHRpcCB0ZXh0XG5cdFx0ZnVuY3Rpb24gc2V0Q3VzdG9tVGV4dChzdHIsIHRhcmcpIHtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCh0YXJnKS5hZGRDbGFzcygndG9vbHRpcDM2MCcpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKHRhcmcpLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCJ0b29sdGlwdGV4dFwiPicrc3RyKyc8L3NwYW4+Jyk7XG5cdFx0fTtcblxuXHRcdC8vIGNsb3NlIGhvdHNwb3Rcblx0XHR2bS5jbG9zZTM2ME1vZGFscyA9ICgpID0+IHtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLm1vZGFsQmFja2dyb3VuZCcpLmhpZGUoNTAwKTtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLnBzdi1jYW52YXMtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2JsdXInKTtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLnBzdi1tYXJrZXInKS5yZW1vdmVDbGFzcygnYmx1cicpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcubW9kdWxlMzYwTW9kYWwnKS5mYWRlT3V0KDUwMCk7XG5cdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtbmF2YmFyJykuc2hvdygpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcud3JhcHBlcjM2MC1kZW1vJykuc2hvdygpO1xuXHRcdFx0dm0ubW9kYWxJZCA9IDA7XG5cdFx0fTtcblx0XHQvLyBNZXRob2QgcmVjcmVhdGVkIGZyb20gdGhlIGRlbGV0ZSBtYXJrZXIgZnJvbSBwaG90byBzcGhlcmUgbGliLlxuXHRcdC8vIFRoZSBvcmlnaW5hbCBtZXRob2Qgd2FzIG5vdCB3b3JraW5nIGluIElFLlxuXHRcdHZtLmRlbGV0ZU1hcmtlcnMgPSAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRQU1YuY2xlYXJNYXJrZXJzKCk7XG5cdFx0XHR9IGNhdGNoKGV4Y2VwdGlvbikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnY2xlYXIgbWFya2VyIGVycm9yJywgZXhjZXB0aW9uLm1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBkZXN0cm95IDM2MCBhbmQgcmVsZWFzZSBmcm9tIG1lbW9yeVxuXHRcdHZtLmRlc3Ryb3kzNjAgPSAoKSA9PiB7XG5cdFx0XHRpZiAoIXZtLmlzUFNWQWN0aXZlKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dm0uZGVsZXRlTWFya2VycygpO1xuXHRcdFx0UFNWLmRlc3Ryb3koKTtcblx0XHRcdFBTViA9ICcnO1xuXG5cdFx0XHR2bS4kY29udGFpbmVyLmVtcHR5KCkuaHRtbCgpO1xuXHRcdFx0dm0uZXhpdEZ1bGxzY3JlZW4oKTtcblx0XHRcdHZtLmlzUFNWQWN0aXZlID0gZmFsc2U7XG5cblx0XHRcdGd0bUFuYWx5dGljcy50cmFja0V2ZW50KCdldmVudCcsIHtcblx0XHRcdFx0Y2F0ZWdvcnk6IGAke3ZtLmNvbnRleHRJZH0gJHt2bS5ncm91cElkfWAsXG5cdFx0XHRcdGxhYmVsOiBgJHt2bS5hbmFseXRpY3NMYWJlbH0gLSBjbG9zZWBcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHR2bS5zZWxlY3QzNjB0cmltID0gKGUpID0+IHtcblx0XHRcdHZtLmNsb3NlMzYwTW9kYWxzKCk7XG5cdFx0XHR2bS5zZWxlY3RlZDM2MCA9IGUuJGluZGV4O1xuXHRcdFx0dm0uc2VsZWN0ZWRJbmRleCA9IGUuJGluZGV4O1xuXG5cdFx0XHRvYmozNjAgPSB2bS5vYmplY3Rbdm0uc2VsZWN0ZWQzNjBdO1xuXG5cdFx0XHR2bS5kZWxldGVNYXJrZXJzKCk7XG5cblx0XHRcdGxldCBtYXJrZXJPYmogPSB2bS5hZGRNYXJrZXJzKG9iajM2MCk7XG5cblx0XHRcdG1hcmtlck9iai5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFBTVi5hZGRNYXJrZXIoa2V5KTtcblx0XHRcdFx0fSBjYXRjaChleGNlcHRpb24pIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYWRkIG1hcmtlciBlcnJvcicsIGV4Y2VwdGlvbi5tZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGxldCBsYWJlbCA9IG9iajM2MFsnbmFtZSddO1xuXG5cdFx0XHRndG1BbmFseXRpY3MudHJhY2tFdmVudCgnZXZlbnQnLCB7XG5cdFx0XHRcdGNhdGVnb3J5OiBgJHt2bS5jb250ZXh0SWR9ICR7dm0uZ3JvdXBJZH1gLFxuXHRcdFx0XHRsYWJlbDogYCR7dm0uYW5hbHl0aWNzTGFiZWx9IC0gJHtsYWJlbH1gXG5cdFx0XHR9KTtcblxuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcudnIzNjAtaW5zdC13cmFwcGVyJykucmVtb3ZlKCk7XG5cdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5tb2RhbEJhY2tncm91bmQnKS5yZW1vdmUoKTtcblx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLndyYXBwZXIzNjAtZGVtbycpLnJlbW92ZSgpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcuZnVsbHNjcmVlblRvcG5hdicpLnJlbW92ZSgpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcucHN2LWxvYWRlcicpLmNzcygnY29sb3InLCAnI2NjYycpO1xuXHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcuYWN0LWJhci1uYW1lJykuaHRtbChvYmozNjBbJ25hbWUnXSk7XG5cblx0XHRcdHZtLnBvcHVsYXRlSG90c3BvdHMob2JqMzYwWydob3RzcG90cyddKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0UFNWLnNldFBhbm9yYW1hKG9iajM2MFsnaW1hZ2UnXSwgdHJ1ZSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFBTVi56b29tKG9iajM2MFsncmVzZXRab29tJ10pO1xuXHRcdFx0XHRcdFx0fSBjYXRjaChleGNlcHRpb24pIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIG9uIHpvb20nLCBleGNlcHRpb24ubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFBTVi5hbmltYXRlKHtcblx0XHRcdFx0XHRcdFx0XHR4OiBvYmozNjBbJ2RlZmF1bHRYJ10sXG5cdFx0XHRcdFx0XHRcdFx0eTogb2JqMzYwWydkZWZhdWx0WSddXG5cdFx0XHRcdFx0XHRcdH0sIDIwMDApO1xuXHRcdFx0XHRcdFx0fSBjYXRjaChleGNlcHRpb24pIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FuaW1hdGUgZXJyb3InLCBleGNlcHRpb24ubWVzc2FnZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLm5hdmJhci1jYXB0aW9uLWRpc2NsYWltZXInKS5odG1sKG9iajM2MFsnZGlzY2xhaW1lciddKTtcblxuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0UFNWLnJlbmRlcigpO1xuXHRcdFx0XHRcdFx0fSBjYXRjaChleGNlcHRpb24pIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3JlbmRlciBlcnJvcicsIGV4Y2VwdGlvbi5tZXNzYWdlKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcubW9kdWxlMzYwYnVsbGV0JykucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5tb2R1bGUzNjBMaXN0LScrZSkucHJlcGVuZCgnPHNwYW4gY2xhc3M9XCJtb2R1bGUzNjBidWxsZXRcIj4mYnVsbGV0OyA8L3NwYW4+Jyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoKGV4Y2VwdGlvbikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygncGFub3JhbWEgYW5kIHRoZW4gZXJyb3InLCBleGNlcHRpb24pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBzaG93IGhvdHNwb3Rcblx0XHRmdW5jdGlvbiBzaG93TW9kYWwoaG90c3BvdElELCBkaXJlY3Rpb24pIHtcblx0XHRcdHZtLm1vZGFsSWQgPSBob3RzcG90SUQ7XG5cdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5tb2R1bGUzNjBNb2RhbCcpLmZhZGVPdXQoNTAwKTtcblxuXHRcdFx0UFNWLmdvdG9NYXJrZXIodm0ubW9kYWxJZCwgNzUwKTtcblxuXHRcdFx0bGV0IGxhYmVsID0gbnVsbDtcblxuXHRcdFx0Ly8gRmluZCB0aGUgbGFiZWxcblx0XHRcdGxldCB2cjM2MCA9IHZtLm9iamVjdFt2bS5zZWxlY3RlZDM2MF07XG5cdFx0XHRsZXQgaG90c3BvdEluZGV4ID0gdm0ubW9kYWxJZCAtIDE7XG5cdFx0XHRsZXQgdnIzNjBDb3VudCA9IHZyMzYwLmhvdHNwb3RzLmxlbmd0aDtcblxuXHRcdFx0Ly8gSWYgdGhlcmUgYXJlIGhvdHNwb3QgYW5kIHRoZSBpbmRleCBpcyB0aGVyZVxuXHRcdFx0aWYgKHZyMzYwLmhvdHNwb3RzXG5cdFx0XHRcdCYmIChob3RzcG90SW5kZXggPiAtMSlcblx0XHRcdFx0JiYgKGhvdHNwb3RJbmRleCA8IHZyMzYwQ291bnQpKSB7XG5cdFx0XHRcdGxldCBob3RzcG90ID0gdnIzNjAuaG90c3BvdHNbaG90c3BvdEluZGV4XTtcblx0XHRcdFx0Ly8gSWYgdGhlIGhvdHNwb3QgaXNudCBudWxsXG5cdFx0XHRcdGlmIChob3RzcG90KSB7XG5cdFx0XHRcdFx0Ly8gR2V0IHRoZSBhbmFseXRpY3MgcHJvcFxuXHRcdFx0XHRcdGxhYmVsID0gaG90c3BvdC5hbmFseXRpY3NMYWJlbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWxhYmVsKSB7XG5cdFx0XHRcdGxhYmVsID0gJyc7XG5cdFx0XHR9XG5cblx0XHRcdGlmKGRpcmVjdGlvbiAhPT0gXCJcIikge1xuXHRcdFx0XHRndG1BbmFseXRpY3MudHJhY2tFdmVudCgnZXZlbnQnLCB7XG5cdFx0XHRcdFx0Y2F0ZWdvcnk6IGAke3ZtLmNvbnRleHRJZH0gJHt2bS5ncm91cElkfWAsXG5cdFx0XHRcdFx0bGFiZWw6IGBob3RzcG90IHNsaWRlciAtICR7dm0uYW5hbHl0aWNzTGFiZWx9IC0gJHtsYWJlbH1gXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z3RtQW5hbHl0aWNzLnRyYWNrRXZlbnQoJ2V2ZW50Jywge1xuXHRcdFx0XHRcdGNhdGVnb3J5OiBgJHt2bS5jb250ZXh0SWR9ICR7dm0uZ3JvdXBJZH1gLFxuXHRcdFx0XHRcdGxhYmVsOiBgJHt2bS5hbmFseXRpY3NMYWJlbH0gLSAke2xhYmVsfWBcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy53cmFwcGVyMzYwLWRlbW8nKS5oaWRlKCk7XG5cdFx0XHRcdHZtLiRjb250YWluZXIuZmluZCgnLm1vZGFsQmFja2dyb3VuZCcpLnNob3coKTtcblx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcucHN2LWNhbnZhcy1jb250YWluZXInKS5hZGRDbGFzcygnYmx1cicpO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtbWFya2VyJykuYWRkQ2xhc3MoJ2JsdXInKTtcblx0XHRcdFx0dm0uJGNvbnRhaW5lci5maW5kKCcjaG90c3BvdC0nICsgdm0ubW9kYWxJZCkuZmFkZUluKDUwMCkuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtbmF2YmFyJykuaGlkZSgpO1xuXHRcdFx0XHR2bS4kY29udGFpbmVyLmZpbmQoJy5tb2R1bGUzNjBNb2RhbHMnKS5jc3MoJ3RvcCcsXG5cdFx0XHRcdCh2bS4kY29udGFpbmVyLmZpbmQoJy5wc3YtaHVkJykuaGVpZ2h0KCkgLSB2bS4kY29udGFpbmVyLmZpbmQoJy5tb2R1bGUzNjBNb2RhbHMnKS5oZWlnaHQoKSkgLyAyICsgJ3B4Jyk7XG5cdFx0XHR9LCA3MDApO1xuXHRcdH1cblxuXHRcdHZtLmVudGVyRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dm0uJGNvbnRhaW5lci5hZGRDbGFzcygnZm9yY2UtZnVsbHNjcmVlbicpO1xuXHRcdFx0JGRvY3VtZW50LmdldCgwKS5ib2R5LmFwcGVuZCh2bS4kY29udGFpbmVyLmdldCgwKSk7XG5cdFx0XHQkd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdyZXNpemUnKSk7XG5cdFx0fTtcblxuXHRcdHZtLmV4aXRGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2bS4kY29udGFpbmVyLnJlbW92ZUNsYXNzKCdmb3JjZS1mdWxsc2NyZWVuJyk7XG5cdFx0XHQkZWxlbWVudC5wcmVwZW5kKHZtLiRjb250YWluZXIuZ2V0KDApKTtcblx0XHRcdCR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ3Jlc2l6ZScpKTtcblx0XHR9O1xuXG5cdFx0dm0udHJpZ2dlckFjdGl2ZVNsaWRlQ29udGVudCA9IGZ1bmN0aW9uKGV2ZW50LCBnYWxsZXJ5SXRlbUlkKSB7XG5cdFx0XHRpZiAodm0uZ2FsbGVyeUl0ZW1JZCAmJiBnYWxsZXJ5SXRlbUlkICE9IHZtLmdhbGxlcnlJdGVtSWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dm0uaW5pdDM2MCgpO1xuXHRcdH07XG5cdH1cbn0pKCk7XG4iXX0=
