function removeKDTree() {
    d3.select("#body svg").remove();
}

function drawKDTree(data, kdTree, width, height, step) {
    removeKDTree();

    var m = [0, 0, 0, 0],
        w = 700 - m[1] - m[3],
        h = 600 - m[0] - m[2],
        i = 0,
        root;

    var tree = d3.layout.tree()
        .size([h, w]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var vis = d3.select("#body").append("svg:svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .append("svg:g")
        .attr("transform", "rotate(90, " + (w + m[1] + m[3])/2 + "," + (h + m[0] + m[2])/2 + ") translate(100, 0)");

    function update(source) {
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 40; });

        // Update the nodes…
        var node = vis.selectAll("g.tree-node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "tree-node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", function(d) { toggle(d); update(d); })
            .on("mouseover", function(d) {
                d3.select("#kdtree svg").append("rect")
                    .attr("class", "highlight")
                    .attr("x", d.node.range[0][0])
                    .attr("y", d.node.range[0][1])
                    .attr("width", d.node.range[1][0] - d.node.range[0][0])
                    .attr("height", d.node.range[1][1] - d.node.range[0][1]);

                if(d.node.point) {
                    d3.select("#kdtree svg").append("circle")
                        .attr("class", "highlight")
                        .attr("cx", d.node.point[0])
                        .attr("cy", d.node.point[1])
                        .attr("r", 4);
                }
            })
            .on("mouseout", function(d) {
                d3.select("#kdtree svg").selectAll(".highlight").remove();
            });

        function isFound(point) {
            return point.found && (step === undefined || point.found_time === undefined || point.found_time <= step);
        }

        function isScanned(point) {
            return point.scanned && (step === undefined || point.scan_time === undefined || point.scan_time <= step);
        }

        function isReported(node) {
            return node.report && (step === undefined || node.report === undefined || node.report_time <= step);
        }

        function isDone(node) {
            return node.done && (step === undefined || node.done_time <= step);
        }

        function nodeColor(d) {
            if (d.node.highlight) {
                return "blue";
            }

            else if (isReported(d.node)) {
                return "black";
            }
            else if(d._children) {
                return "lightsteelblue";
            } else if (d.node.point) {
                if(isFound(d.node.point)) {
                    return "#f00";
                }
                else if (isScanned(d.node.point)) {
                    return "orange";
                }
                else {
                    return "#0f0";
                }
            } else if(isDone(d.node)) {
                return "ddd";
            } else {
                return "#fff";
            }
        }

        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", nodeColor);

        nodeEnter.append("svg:text")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node
            //.transition()
            //.duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", nodeColor);

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit()
            //.transition()
            //.duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = vis.selectAll("path.link")
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            //.transition()
            //.duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link
            //.transition()
            //.duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit()
            //.transition()
            //.duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

// Toggle children.
    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }


    function canAdd(kdNode) {
        return kdNode && (kdNode.time == null || kdNode == undefined || step == undefined || kdNode.time <= step);
    }

    function createTree(kdNode) {
        if(kdNode.point) {
            return {name: "", node: kdNode};
        }

        var children = []

        if(canAdd(kdNode.right)) {
            children.push(createTree(kdNode.right));
        }
        if(canAdd(kdNode.left)) {
            children.push(createTree(kdNode.left));
        }

        return {
            name: "",
            node: kdNode,
            children: children
        }
    }

    function renderTree() {
        root = createTree(kdTree);
        root.x0 = h / 2;
        root.y0 = 0;

        function toggleAll(d) {
            if (d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
            }
        }

        update(root);
    }

    renderTree();
}