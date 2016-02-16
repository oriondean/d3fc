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

    var margin = { right: 10, bottom: 20, left: 10 },
        barHeight = 0.33, // percentage
        decorate = noop,
        qualitativeRanges = [],
        comparativeMeasures = [],
        qualitativeRangeColors = function(d, i) { return d3.rgb('#E4E4E4').darker([i]); },
        featureMeasureColors = d3.scale.category20c(),
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
                    top: expandedMargin.top,
                    bottom: expandedMargin.bottom
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

            var qualitativeRange = plotAreaContainer.selectAll('rect.qualitative-ranges')
                .data(qualitativeRanges);

            qualitativeRange.enter()
                .append('rect')
                .attr({ class: 'qualitative-range', width: xScale, height: containerHeight,
                    fill: qualitativeRangeColors, stroke: qualitativeRangeColors });

            var featuredMeasure = plotAreaContainer.selectAll('rect.featured-measure')
                .data(data);

            featuredMeasure.enter()
                .append('rect')
                .attr({class: 'featured-measure', y: itemBaseline, width: xScale, height: barHeightPx,
                    fill: featureMeasureColors, stroke: featureMeasureColors });

            var comparativeMeasure = plotAreaContainer.selectAll('line.comparative-measure')
                .data(comparativeMeasures);

            comparativeMeasure.enter()
                .append('line')
                .attr({ class: 'comparative-measure', x1: xScale, x2: xScale, y1: itemBaseline, y2: itemBaseline + barHeightPx,
                    stroke: 'black' });

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

    bullet.qualitativeRanges = function(x) {
        if (!arguments.length) {
            return qualitativeRanges;
        }
        qualitativeRanges = x.sort(d3.descending);
        return bullet;
    };
    bullet.comparativeMeasures = function(x) {
        if (!arguments.length) {
            return comparativeMeasures;
        }
        comparativeMeasures = x.sort(d3.descending);
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
    bullet.margin = function(x) {
        if (!arguments.length) {
            return margin;
        }
        margin = x;
        return bullet;
    };

    return bullet;
}
