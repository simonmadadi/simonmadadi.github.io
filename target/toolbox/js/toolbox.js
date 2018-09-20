/**
 * Copyright (c) 2007-2015 Ariel Flesler - aflesler<a>gmail<d>com | http://flesler.blogspot.com
 * Licensed under MIT
 * @author Ariel Flesler
 * @version 2.1.2
 */
;(function(f){"use strict";"function"===typeof define&&define.amd?define(["jquery"],f):"undefined"!==typeof module&&module.exports?module.exports=f(require("jquery")):f(jQuery)})(function($){"use strict";function n(a){return!a.nodeName||-1!==$.inArray(a.nodeName.toLowerCase(),["iframe","#document","html","body"])}function h(a){return $.isFunction(a)||$.isPlainObject(a)?a:{top:a,left:a}}var p=$.scrollTo=function(a,d,b){return $(window).scrollTo(a,d,b)};p.defaults={axis:"xy",duration:0,limit:!0};$.fn.scrollTo=function(a,d,b){"object"=== typeof d&&(b=d,d=0);"function"===typeof b&&(b={onAfter:b});"max"===a&&(a=9E9);b=$.extend({},p.defaults,b);d=d||b.duration;var u=b.queue&&1<b.axis.length;u&&(d/=2);b.offset=h(b.offset);b.over=h(b.over);return this.each(function(){function k(a){var k=$.extend({},b,{queue:!0,duration:d,complete:a&&function(){a.call(q,e,b)}});r.animate(f,k)}if(null!==a){var l=n(this),q=l?this.contentWindow||window:this,r=$(q),e=a,f={},t;switch(typeof e){case "number":case "string":if(/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(e)){e= h(e);break}e=l?$(e):$(e,q);case "object":if(e.length===0)return;if(e.is||e.style)t=(e=$(e)).offset()}var v=$.isFunction(b.offset)&&b.offset(q,e)||b.offset;$.each(b.axis.split(""),function(a,c){var d="x"===c?"Left":"Top",m=d.toLowerCase(),g="scroll"+d,h=r[g](),n=p.max(q,c);t?(f[g]=t[m]+(l?0:h-r.offset()[m]),b.margin&&(f[g]-=parseInt(e.css("margin"+d),10)||0,f[g]-=parseInt(e.css("border"+d+"Width"),10)||0),f[g]+=v[m]||0,b.over[m]&&(f[g]+=e["x"===c?"width":"height"]()*b.over[m])):(d=e[m],f[g]=d.slice&& "%"===d.slice(-1)?parseFloat(d)/100*n:d);b.limit&&/^\d+$/.test(f[g])&&(f[g]=0>=f[g]?0:Math.min(f[g],n));!a&&1<b.axis.length&&(h===f[g]?f={}:u&&(k(b.onAfterFirst),f={}))});k(b.onAfter)}})};p.max=function(a,d){var b="x"===d?"Width":"Height",h="scroll"+b;if(!n(a))return a[h]-$(a)[b.toLowerCase()]();var b="client"+b,k=a.ownerDocument||a.document,l=k.documentElement,k=k.body;return Math.max(l[h],k[h])-Math.min(l[b],k[b])};$.Tween.propHooks.scrollLeft=$.Tween.propHooks.scrollTop={get:function(a){return $(a.elem)[a.prop]()}, set:function(a){var d=this.get(a);if(a.options.interrupt&&a._last&&a._last!==d)return $(a.elem).stop();var b=Math.round(a.now);d!==b&&($(a.elem)[a.prop](b),a._last=this.get(a))}};return p});
(function() {
	'use strict';

	angular.module('Toolbox', [
		'fca.static360'
	])
	.run(function() {
		console.log('running Brands Toolbox');
	});
})();

(function(ng){
	'use strict';

	ng.module('Toolbox')
		.directive('scrollTo', function($window){
			return {
				restrict: 'A',
				link: function($scope, $element, $attrs){
					var target = $element.data('target'),
						$target = $($attrs.target),
						$targetCheckbox = $target.find('input[type="checkbox"]'),
						$targetParentLink = $element.parents('.has-submenu').find('a')[0],
						$sections = $('.toolbox-section-container'),
						defaultSpeed = 200,
						speed = $element.data('speed') || 200,
						$$w = $($window);

					$element.on('click', function($evt){

						if ($targetParentLink != undefined) {
							var parentToOpen = $($targetParentLink).data('target');
							var parentCheckbox = $(parentToOpen).find('input[type="checkbox"]');

							openDrawer(parentCheckbox);
						}

						$evt.preventDefault();
						if(target && $target.length > 0) {
							$$w.scrollTo(target, getSpeed());
						} else {
							$$w.scrollTo(0, speed);
						}
						openDrawer($targetCheckbox);

						return false;
					});

					function getSpeed(){
						var index = 1;
						for(var i = 0, l = $sections.length; i < l; i++) {
							var $el = $($sections[i]);
							if('#' + $el.attr('id') === target) {
								index = (i+1);
								break;
							}
						}

						return defaultSpeed*index;
					}

					function openDrawer($checkbox) {
						if ($checkbox.not(':checked')) {
							$checkbox.prop('checked', true);
						}
					}
				}
			};
		});
})(angular);

(function() {
	angular
		.module('Toolbox')
		.directive('typography', typography);

	function typography() {
		return {
			restrict: 'A',
			scope: true,
			bindToController: {},
			controllerAs: 'typography',
			controller: typographyController
		};

		function typographyController($scope, $element) {
			'ngInject';
			/* eslint-disable no-invalid-this */

			this.font = {
				family: [
					{value: '', label: 'Default'},
					{value: 'brand-font', label: '$brand-font'}
				],
				size: [
					// {value: 'all', label: 'Show All'},
					{value: 'font-size-small', label: '$font-size-small'},
					{value: 'font-size-normal', label: '$font-size-normal'},
					{value: 'font-size-large', label: '$font-size-large'},
					{value: 'font-size-xlarge', label: '$font-size-xlarge'},
					{value: 'font-size-title-small', label: '$font-size-title-small'},
					{value: 'font-size-title-normal', label: '$font-size-title-normal'},
					{value: 'font-size-title-large', label: '$font-size-title-large'}
				],
				weight: [
					// {value: 'all', label: 'Show All'},
					{value: 'brand-font-weight-thin', label: '$brand-font-weight-thin'},
					{value: 'brand-font-weight-extra-light', label: '$brand-font-weight-extra-light'},
					{value: 'brand-font-weight-light', label: '$brand-font-weight-light'},
					{value: 'brand-font-weight-normal', label: '$brand-font-weight-normal'},
					{value: 'brand-font-weight-medium', label: '$brand-font-weight-medium'},
					{value: 'brand-font-weight-semi-bold', label: '$brand-font-weight-semi-bold'},
					{value: 'brand-font-weight-bold', label: '$brand-font-weight-bold'},
					{value: 'brand-font-weight-extra-bold', label: '$brand-font-weight-extra-bold'},
					{value: 'brand-font-weight-black', label: '$brand-font-weight-black'}
				]
			};
			this.fontFamily = '';
			this.fontSize = '';
			this.fontWeight = '';
			this.upper = '';

			
		}
	}
})();
