import 'svg-innerhtml';
import d3 from 'd3';
import axis from '../series/axis';
import '../layout/layout';
import dataJoin from '../util/dataJoin';
import expandRect from '../util/expandRect';
import {noop} from '../util/fn';
import {rebindAll, rebind} from '../util/rebind';
import {isOrdinal, range, setRange} from '../util/scale';

export default function() {

    var margin = { top: 0, right: 15, bottom: 30, left: 15 },
        barHeight = 0.5, // percentage
        axisLabels = [],
        chartLabels = [],
        decorate = noop,
        scales = [],
        domains = [];

    var chartDataJoin = dataJoin()
        .selector('g.bullet-chart')
        .element('g')
        .attr('class', 'bullet-chart');

    var bullet = function(selection) {

        selection.each(function(data) {
            var container = d3.select(this);

            var svg = container.selectAll('svg')
                .data([data]);
            svg.enter()
                .append('svg')
                .layout('flex', 1);

            container.layout();

            var chartContainer = chartDataJoin(svg, data);
            var multipleHeight = svg.layout('height') / data.length;

            chartContainer.attr('transform', function(d, i) {
                return 'translate(0, ' + (i * multipleHeight) + ')';
            }).layout({ height: multipleHeight, width: svg.layout('width') });

            container.layout();

            chartContainer.call(plotBullet);
        });
    };

    function plotBullet(selection) {

        selection.each(function(data, index) {

            var container = d3.select(this);

            container.html(
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

            var xScale = d3.scale.linear()
                .domain(domains[index])
                .range([0, container.layout('width')]);

            var xAxis = axis()
                .orient('bottom')
                .xScale(xScale)
                .yScale(d3.scale.identity());

            var expandedMargin = expandRect(margin);

            container.select('.plot-area-container')
                .layout({
                    position: 'absolute',
                    top: expandedMargin.top,
                    left: expandedMargin.left,
                    bottom: expandedMargin.bottom,
                    right: expandedMargin.right
                });

            container.select('.title')
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

            // update the label text
            container.select('.title .label')
                .text(chartLabels[index]);

            container.select('.x-axis.label-container .label')
                .text(axisLabels[index]);

            var plotAreaContainer = container.select('.plot-area');

            xAxis.baseline(function() { return plotAreaContainer.layout('height'); });

            container.select('.axes-container .x-axis')
                .call(xAxis);

            var bands = plotAreaContainer.selectAll('rect.band')
                .data(data.bands);

            bands.enter()
                .append('rect')
                .attr('class', 'band')
                .attr('width', xScale)
                .attr('height', plotAreaContainer.layout('height'));

            var measures = plotAreaContainer.selectAll('rect.measure')
                .data(data.measures);

            measures.enter()
                .append('rect')
                .attr('class', 'measure')
                .attr('y', plotAreaContainer.layout('height') * (barHeight / 2))
                .attr('width', xScale)
                .attr('height', plotAreaContainer.layout('height') * barHeight);

            var markers = plotAreaContainer.selectAll('line.marker')
                .data(data.markers);

            markers.enter()
                .append('line')
                .attr('class', 'marker')
                .attr('x1', xScale)
                .attr('x2', xScale)
                .attr('y1', function() {
                    return plotAreaContainer.layout('height') * (barHeight / 2);
                })
                .attr('y2', function() {
                    return plotAreaContainer.layout('height') * (barHeight * 1.5);
                });

            decorate(container, data, index);
        });
    }

    bullet.axisLabels = function(x) {
        if (!arguments.length) {
            return axisLabels;
        }
        axisLabels = x;
        return bullet;
    };

    bullet.chartLabels = function(x) {
        if (!arguments.length) {
            return chartLabels;
        }
        chartLabels = x;
        return bullet;
    };

    bullet.margin = function(x) {
        if (!arguments.length) {
            return margin;
        }
        margin = x;
        return bullet;
    };

    bullet.decorate = function(x) {
        if (!arguments.length) {
            return decorate;
        }
        decorate = x;
        return bullet;
    };

    bullet.barHeight = function(x) {
        if (!arguments.length) {
            return barHeight;
        }
        barHeight = x;
        return bullet;
    };

    bullet.scales = function(x) {
        if (!arguments.length) {
            return scales;
        }
        scales = x;
        return bullet;
    };

    bullet.domains = function(x) {
        if (!arguments.length) {
            return domains;
        }
        domains = x;
        return bullet;
    };

    return bullet;
}
