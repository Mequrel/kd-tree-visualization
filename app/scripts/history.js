function createDescriber() {
    var currentStep = 0;
    var steps = [[{
        name: "write",
        message: "Start algorithm."
    }]];

    function addStep(name, args) {
        args["name"] = name;
        steps[currentStep].push(args);
    }

    function nextStep() {
        steps.push([]);
        return currentStep++;
    }

    return {
        nextStep: function() {
            nextStep();
            return this;
        },
        createNode: function(node) {
            node.time = currentStep;
            addStep("createNode", {});
            return this;
        },
        highlightPoints: function(points) {
            addStep("highlightPoints", {
                points: points
            });
            return this;
        },
        write : function(message) {
            addStep("write", {
                message: message
            });
            return this;
        },
        showDivision: function(value, axis, range) {
            addStep("showDivision", {
                value: value,
                axis: axis,
                range: range
            });
            return this;
        },
        highlightRange: function(range) {
            addStep("highlightRange", {
                range: range
            });
            return this;
        },
        markAsScanned: function(point) {
            addStep("markAsScanned", {});
            point.scan_time = currentStep;
            point.scanned = true;
            return this;
        },
        markAsFound: function(point) {
            addStep("markAsFound", {});
            point.found_time = currentStep;
            point.found = true;
            return this;
        },
        markAllAsScanned: function(points) {
            addStep("markAllAsScanned", {});
            var describer = this;
            $.each(points, function(i, point) {
                point.scan_time = currentStep;
                point.scanned = true;
            })
            return this;
        },
        markAllAsFound: function(points) {
            addStep("markAllAsFound", {});
            var describer = this;
            $.each(points, function(i, point) {
                point.found_time = currentStep;
                point.found = true;
            })
            return this;
        },
        highlightSubtree: function(root) {
            addStep("highlightSubtree", {});
            root.report = true;
            root.report_time = currentStep;
            return this;
        },
        markAsDone: function(root) {
            addStep("markAsDone", {});
            root.done_time = currentStep;
            root.done = true;
            return this;
        },
        setCurrentNode: function(node) {
            addStep("setCurrentNode", {
                node: node
            });
            return this;
        },

        getSteps: function() {
            return steps;
        }
    }
}

function unloadHistory(root) {
    d3.select("#next-step").attr("onclick", null);
    d3.select("#previous-step").attr("onclick", null);
    d3.select("#rewind-steps").attr("onclick", null);
    d3.select("#forward-steps").attr("onclick", null);
    d3.select("body").attr("keydown", null);

    d3.select("div.well").text("");
    d3.select("#kdtree svg").selectAll(".node-highlight2").remove()
    d3.select("#kdtree svg").selectAll(".circle-highlight2").remove()

    removeCurrentNodeHighlight(root);
}


function removeCurrentNodeHighlight(node) {
    if(node) {
        node.highlight = false;
        removeCurrentNodeHighlight(node.left);
        removeCurrentNodeHighlight(node.right);
    }
}

function loadHistory(describer, points, root, width, height) {
    var steps = describer.getSteps();
    var step = 0;

    refreshStep(step);

    d3.select("#next-step").on("click", function() {
        if(step == (steps.length - 1)) {
            return;
        }

        step++;
        refreshStep(step);
    });


    d3.select("#previous-step").on("click", function() {
        if(step == 0) {
            return;
        }
        step--;
        refreshStep(step);
    });


    d3.select("#rewind-steps").on("click", function() {
        step = 0;
        refreshStep(step);
    });


    d3.select("#forward-steps").on("click", function() {
        step = steps.length - 1;
        refreshStep(step);
    });


    d3.select("body").on("keydown", function(event) {
        if(37 == d3.event.keyCode) {
            if(step == 0) {
                return;
            }
            step--;
            refreshStep(step);
        }
        else if(39 == d3.event.keyCode) {
            if(step == (steps.length - 1)) {
                return;
            }

            step++;
            refreshStep(step);
        }
    });


    function findCurrentNode(step_number) {
        while(step_number >= 0) {
            for (var step_i in steps[step_number]) {
                var step = steps[step_number][step_i];

                if (step.name == "setCurrentNode") {
                    return step.node;
                }
            }

            step_number--;
        }

        return null;
    }

    function refreshStep(step_number) {
        d3.select("#current-step").text((step_number+1) + " / " + steps.length);

        d3.select("div.well").text("");
        d3.select("#kdtree svg").selectAll(".node-highlight2").remove()
        d3.select("#kdtree svg").selectAll(".circle-highlight2").remove()
        removeCurrentNodeHighlight(root);
        var currentNode = findCurrentNode(step_number);
        if(currentNode != null) {
            currentNode.highlight = true;
        }

        renderKD(points, root, width, height, step_number);

        for (var step_i in steps[step_number]) {
            var step = steps[step_number][step_i];

            if(step.name == "write") {
                var previousText = d3.select("div.well").text();
                d3.select("div.well").text(previousText + step.message);
            }

            if(step.name == "showDivision") {
                if (step.axis == 0) {
                    d3.select("#kdtree svg").append("line")
                        .attr("class", "division")
                        .attr("x1", step.value )
                        .attr("y1", step.range[0][1])
                        .attr("x2", step.value )
                        .attr("y2", step.range[1][1]);
                } else {
                    d3.select("#kdtree svg").append("line")
                        .attr("class", "division")
                        .attr("y1", step.value )
                        .attr("x1", step.range[0][0])
                        .attr("y2", step.value )
                        .attr("x2", step.range[1][0]);
                }
            }

            if(step.name == "highlightRange") {
                d3.select("#kdtree").select("svg").append("rect")
                    .attr("class", "node-highlight2")
                    .attr("x", step.range[0][0])
                    .attr("y", step.range[0][1])
                    .attr("width", step.range[1][0] - step.range[0][0])
                    .attr("height", step.range[1][1] - step.range[0][1]);
            }
            if(step.name == "highlightPoints") {
                $.each(step.points, function(_, point) {
                    d3.select("#kdtree svg").append("circle")
                        .attr("class", "circle-highlight2")
                        .attr("cx", point[0])
                        .attr("cy", point[1])
                        .attr("r", 4);
                });

            }

        }
    }
}
