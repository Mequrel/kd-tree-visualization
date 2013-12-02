/**
 * KD Graph drawing
 */

var displayBrush = false;
var brushCallback = function(extent) {};

function showBrush() {
    displayBrush = true;
}

function hideBrush() {
    displayBrush = false;
}

var lastBrush = [[100, 100], [200, 200]];

function setCallback(callback) {
    brushCallback = callback;
}

function displayPoints(points, width, height) {
    d3.select("#kdtree svg").remove()
    var svg = d3.select("#kdtree").append("svg")
        .attr("width", width)
        .attr("height", height);

    var point = svg.selectAll(".point")
        .data(points)
        .enter().append("circle")
        .attr("class", "point")
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; })
        .attr("r", 4);

    removeKDTree();
}

function renderKD(data, kdTree, width, height, step) {
    drawKDGraph(data, kdTree, width, height, step);
    drawKDTree(data, kdTree, width, height, step);
}

function drawKDGraph(data, kdTree, width, height, step) {
    // Collapse the kdtree into an array of rectangles.
    function nodes(kdNode) {
        if (!kdNode) {
            return []
        }

        var node = {
            x: kdNode.range[0][0],
            y: kdNode.range[0][1],
            width: kdNode.range[1][0] - kdNode.range[0][0],
            height: kdNode.range[1][1] - kdNode.range[0][1],
            node: kdNode
        };

        var nodesLeft = nodes(kdNode.left);
        var nodesRight = nodes(kdNode.right);

        var ret = nodesLeft.concat(nodesRight);
        if(step === undefined || kdNode.time === undefined || kdNode.time <= step) {
            ret.push(node);
        }
        return ret;
    }

    d3.select("#kdtree svg").remove()
    var svg = d3.select("#kdtree").append("svg")
        .attr("width", width)
        .attr("height", height);

    function isReported(node) {
        return node.report && (step === undefined || node.report === undefined || node.report_time <= step);
    }

    function isDone(node) {
        return node.done && (step === undefined || node.done_time <= step);
    }

    svg.selectAll(".node")
        .data(nodes(kdTree))
        .enter().append("rect")
        .attr("class", "node")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d) { return d.width; })
        .attr("height", function(d) { return d.height; })
        .classed("node-highlight", function(d) { return d.node.highlight == true; })
        .classed("reported-fully", function(d) { return isReported(d.node); })
        .classed("done", function(d) { return d.node.point && isDone(d.node); });


    var point = svg.selectAll(".point")
        .data(data)
        .enter().append("circle")
        .attr("class", "point")
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; })
        .attr("r", 4);

    point.classed("scanned", function(d) { return d.scanned && (step === undefined || d.scan_time === undefined || d.scan_time <= step); });
    point.classed("selected", function(d) { return d.found && (step === undefined || d.found_time === undefined || d.found_time <= step); });

    if(displayBrush) {
        var brush = d3.svg.brush()
            .x(d3.scale.identity().domain([0, width]))
            .y(d3.scale.identity().domain([0, height]))
            .extent(lastBrush)
            .on("brush", function() {
                lastBrush = brush.extent();
                brushCallback(brush.extent());
        });
        brushCallback(brush.extent());

        svg.append("g")
            .attr("class", "brush")
            .call(brush);
    }
}

