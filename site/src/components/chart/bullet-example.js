var chartData = [
    { measures: [75, 20], markers: [80, 40], bands: [95, 65, 35] },
    { measures: [85, 34], markers: [90, 50, 30], bands: [70] },
    { measures: [50], markers: [40], bands: [30] }
];

var chart = fc.chart.bullet()
    .scales([d3.scale.linear()])
    .domains([[0, 115], [10, 110], [10, 70]])
    .decorate(function(container) {
        var bandColours = function(d, i) { return ['#EEE', '#DDD', '#CCC', '#BBB', '#AAA'][i]; };
        var measureColours = function(d, i) { return ['lightsteelblue', 'steelblue'][i]; };

        container.selectAll('line.marker')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        container.selectAll('rect.measure')
            .attr('fill', measureColours)
            .attr('stroke', measureColours);

        container.selectAll('rect.band')
            .attr('fill', bandColours)
            .attr('stroke', bandColours);
    });

d3.select('#chart')
    .datum(chartData)
    .call(chart);
