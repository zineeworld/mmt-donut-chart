/*!
 * mmt-donut-chart.js
 * Version: 1.0.0
 *
 * Copyright 2015 MyMusicTaste
 * Released under the MIT license
 * https://github.com/MyMusicTaste/mmt-donut-chart/blob/master/LICENSE
 */

function mmtDonutChart(chartName, percent, parameters, touchFunction, drawFunction) {
	// PE add a parameter drawFunction..callback for canvas render step

	if(parameters==undefined){
		parameters = '';
	}

	var animationStep 		= parameters.animationStep || 100,
		bgColor			= parameters.bgColor || '#000',
		chartColor			= parameters.chartColor || '#0bbaba',
		cutOut 				= parameters.cutOut || 98,
		dotColor 			= parameters.dotColor || chartColor,
		doughnutPadding	= parameters.doughnutPadding || 5,
		outerCanvasSize 	= parameters.outerCanvasSize || 230,
		pointSize 			= parameters.pointSize || 5;

	if(parameters.pointSize==0){	// dot remove
		pointSize = 0;
	}
	
	var outerCanvasContext,
		statusGrid,
		stepSize = percent / animationStep, // PE the incremental increase in value per canvas render step (x100)
		drawStepProgress = 1; // PE start at 1%

	var data = [
		{
			value: percent,
			color: chartColor
		},{
			value: 100-percent,
			color: bgColor
		}
	];

	var options = {
		segmentShowStroke : false,
		percentageInnerCutout : cutOut,
		animationSteps : animationStep,
		animationEasing : "linear",
		animateRotate : true,
		showTooltips: false
	};

	var doughnutCanvas;
	var helpers = Chart.helpers;

	Chart.types.Doughnut.extend({
		name: "extendDonutChart",

		// Check if we need to extend the scale
		initialize: function(data) {
			this.options.onAnimationProgress = function() {
				if (statusGrid !== undefined) {
					this.drawPoint();
				}
				// PE output the current canvas render progress to caller draw function, if exists
				if (drawFunction !== undefined) {
					drawStepProgress += stepSize;
					drawFunction(drawStepProgress);
				}
			};
			this.options.onAnimationComplete = function() {
				//touchFunction(statusGrid);	// HJ commented
			};

			Chart.types.Doughnut.prototype.initialize.apply(this, arguments);
		},

		// Draw the line on clear
		clear: function(data) {
			Chart.types.Doughnut.prototype.clear.apply(this, arguments);
			outerCanvasContext.clearRect(0, 0, outerCanvasSize, outerCanvasSize);
		},

		draw : function(easeDecimal) {
			var animDecimal = (easeDecimal) ? easeDecimal : 1;
			this.clear();

			helpers.each(this.segments,function(segment,index) {
				//segment of two data
				//index if index == 1 don't draw
				if(index == 1) {
					segment.endAngle = Math.PI * 1.5;
					segment.draw();	// whole chart bg
					return;
				}
				else {
					//console.log("angle: "+ segment.startAngle + " "+ segment.endAngle)
					if(segment.endAngle !== undefined) {
						var x = segment.x + segment.outerRadius * Math.cos(segment.endAngle);
						var y = segment.y + segment.outerRadius * Math.sin(segment.endAngle);
						statusGrid = { x: x, y: y };
						//console.log(statusGrid);
					}
				}
				segment.transition({
					circumference : this.calculateCircumference(segment.value),
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				}, animDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;
				segment.draw();	// valid part

				if (index === 0) {
					segment.startAngle = Math.PI * 1.5;
				}
				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length-1) {
					this.segments[index+1].startAngle = segment.endAngle;
				} else {
					//if last, update x,y
				}
			}, this);

			outerCanvasContext.drawImage(doughnutCanvas,doughnutPadding,doughnutPadding);
		},

		drawPoint: function() {
			outerCanvasContext.beginPath();
			outerCanvasContext.arc(statusGrid.x+doughnutPadding, statusGrid.y+doughnutPadding, pointSize, 0, 2 * Math.PI, false);
			outerCanvasContext.fillStyle = dotColor;
			outerCanvasContext.fill();
		}
	});
	
	window.devicePixelRatio = 1;	// HJ for mobile issue
	var size = outerCanvasSize - doughnutPadding * 2;
	doughnutCanvas = document.createElement("canvas");
	doughnutCanvas.width = size;
	doughnutCanvas.height = size;
	doughnutCanvas.style.visibility = 'hidden'; 
	doughnutCanvas.style.position = 'absolute';
	doughnutCanvas.style.top = doughnutPadding+'px';
	doughnutCanvas.style.left = doughnutPadding+'px';
	document.getElementById(chartName).parentNode.style.position = 'relative';
	document.getElementById(chartName).parentNode.appendChild(doughnutCanvas);

	outerCanvasContext = document.getElementById(chartName).getContext("2d");
	outerCanvasContext.canvas.height = outerCanvasSize;
	outerCanvasContext.canvas.width = outerCanvasSize;
	var ctx = doughnutCanvas.getContext("2d");
	var myDoughnutChart = new Chart(ctx).extendDonutChart(data, options);
};

function progressCounter(labelName, percent){
	var i=0;
	var timer = 500/percent
	var label;

	setInterval(function(){
		if(i<=percent){
			label = $('#'+labelName).text(i);
			i++;
		}
	}, timer);
}