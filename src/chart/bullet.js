import d3 from 'd3';
import axis from '../series/axis';
import '../layout/layout';
import dataJoin from '../util/dataJoin';
import expandRect from '../util/expandRect';
import {noop} from '../util/fn';
import {rebindAll, rebind} from '../util/rebind';
import {isOrdinal, range, setRange} from '../util/scale';

export default function(xScale) {

    xScale = xScale || d3.scale.linear();

    var margin = { right: 5, bottom: 20, left: 5 },
        barHeight = 0.33, // percentage
        decorate = noop,
        bands = [],
        markers = [],
        bandColors = d3.scale.category20c(),
        chartLabel = '',
        xLabel = '';

    var xAxis = axis()
        .orient('bottom');

    var containerDataJoin = dataJoin()
        .selector('svg.bullet-chart')
        .element('svg')
        .attr({'class': 'bullet-chart', 'layout-style': 'flex: 1'});

    var bullet = function(selection) {

        selection.each(function(data, index) {

            var container = d3.select(this);

            var svg = containerDataJoin(container, [data]);
            svg.enter().html(
                '<g class="plot-area-container"> \
                    <rect class="background" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"/> \
                    <g class="axes-container" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"> \
                        <g class="x-axis" layout-style="height: 0; width: 0"/> \
                    </g> \
                    <svg class="plot-area" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"/> \
                </g> \
                <g class="x-axis label-container"> \
                    <g layout-style="height: 0; width: 0"> \
                        <text class="label"/> \
                    </g> \
                </g> \
                <g class="title label-container"> \
                    <g layout-style="height: 0; width: 0"> \
                        <text class="label"/> \
                    </g> \
                </g>');

            var expandedMargin = expandRect(margin);

            svg.select('.plot-area-container')
                .layout({
                    position: 'absolute',
                    top: expandedMargin.top,
                    left: expandedMargin.left,
                    bottom: expandedMargin.bottom,
                    right: expandedMargin.right
                });

            svg.select('.title')
                .layout({
                    position: 'absolute',
                    top: 0,
                    alignItems: 'center',
                    left: expandedMargin.left,
                    right: expandedMargin.right
                });

            var xAxisLayout = {
                position: 'absolute',
                left: expandedMargin.left,
                right: expandedMargin.right,
                alignItems: 'center'
            };
            xAxisLayout[xAxis.orient()] = 0;
            container.select('.x-axis.label-container')
                .attr('class', 'x-axis label-container ' + xAxis.orient())
                .layout(xAxisLayout);

            // perform the flexbox / css layout
            container.layout();

            svg.select('.title .label')
                .text(chartLabel);

            svg.select('.x-axis.label-container .label')
                .text(xLabel);

            // set the axis ranges
            var plotAreaContainer = svg.select('.plot-area');
            setRange(xScale, [0, plotAreaContainer.layout('width')]);

            // render the axes
            xAxis.xScale(xScale)
                .yScale(d3.scale.identity())
                .baseline(function() { return plotAreaContainer.layout('height'); });

            svg.select('.axes-container .x-axis')
                .call(xAxis);

            // render the plot area
            var containerHeight = plotAreaContainer.layout('height'),
                barHeightPx = barHeight * containerHeight,
                itemBaseline = (containerHeight - barHeightPx) / 2;
                colors = function(d, i) { return bandColors(i); };

            var band = plotAreaContainer.selectAll('rect.band')
                .data(bands);

            band.enter()
                .append('rect')
                .attr({ class: 'band', width: xScale, height: containerHeight, fill: colors, stroke: colors });

            var measure = plotAreaContainer.selectAll('rect.measure')
                .data([data]);

            measure.enter()
                .append('rect')
                .attr({class: 'measure', y: itemBaseline, width: xScale, height: barHeightPx });

            var marker = plotAreaContainer.selectAll('line.marker')
                .data(markers);

            marker.enter()
                .append('line')
                .attr({ class: 'marker', x1: xScale, x2: xScale, y1: itemBaseline, y2: itemBaseline + barHeightPx });

            decorate(svg, data, index);
        });
    };

    function rebindScale(scale, prefix) {
        var scaleExclusions = [
            /range\w*/,   // the scale range is set via the component layout
            /tickFormat/  // use axis.tickFormat instead (only present on linear scales)
        ];

        // The scale ticks method is a stateless method that returns (roughly) the number of ticks
        // requested. This is subtly different from the axis ticks methods that simply stores the given arguments
        // for invocation of the scale method at some point in the future.
        // Here we expose the underlying scale ticks method in case the user want to generate their own ticks.
        if (!isOrdinal(scale)) {
            scaleExclusions.push('ticks');
            var mappings = {};
            mappings[prefix + 'ScaleTicks'] = 'ticks';
            rebind(bullet, scale, mappings);
        }

        rebindAll(bullet, scale, prefix, scaleExclusions);
    }

    rebindScale(xScale, 'x');

    var axisExclusions = [
        'baseline',         // the axis baseline is adapted so is not exposed directly
        'xScale' // set by components
    ];
    rebindAll(bullet, xAxis, 'x', axisExclusions);

    bullet.bands = function(x) {
        if (!arguments.length) {
            return bands;
        }
        bands = x;
        return bullet;
    };

    bullet.markers = function(x) {
        if (!arguments.length) {
            return markers;
        }
        markers = x;
        return bullet;
    };

    bullet.chartLabel = function(x) {
        if (!arguments.length) {
            return chartLabel;
        }
        chartLabel = x;
        return bullet;
    };

    bullet.xLabel = function(x) {
        if (!arguments.length) {
            return xLabel;
        }
        xLabel = x;
        return bullet;
    };

    bullet.decorate = function(x) {
        if (!arguments.length) {
            return decorate;
        }
        decorate = x;
        return bullet;
    };

    return bullet;
}
