var geo = {
    kdtree: {
        GuiState: {
            POINTS_GENERATED: 0,
            TREE_CREATED: 1,
            CREATION_HISTORY: 2,
            FOUND: 3,
            FIND_HISTORY: 4
        }
    }
}

function main() {
    var width = 700,
        height = 300;

    var points;
    var root;
    var brushExtent;

    setCallback(function(extent) {
        var isBrushNonEmpty = (extent[0][0] == extent[1][0] && extent[0][1] == extent[1][1]);
        $("#perform-search").prop("disabled", isBrushNonEmpty);
        brushExtent = extent;
    });

    function setGuiState(newState) {
        if(newState == geo.kdtree.GuiState.POINTS_GENERATED) {
            hideBrush();
            $("#history-navigator").hide();
            $("#perform-search").prop("disabled", true);
            $("#generate-points").removeClass("btn-primary").addClass("btn-default");
            $("#generate-kd-tree").removeClass("btn-default").addClass("btn-primary");
            $("#perform-search").removeClass("btn-default").addClass("btn-primary");
            unloadHistory(root);
        }
        else if(newState == geo.kdtree.GuiState.TREE_CREATED) {
            hideBrush();
            $("#history-navigator").hide();
            $("#perform-search").prop("disabled", false);
            $("#generate-points").removeClass("btn-default").addClass("btn-primary");
            $("#generate-kd-tree").removeClass("btn-primary").addClass("btn-default");
            $("#perform-search").removeClass("btn-default").addClass("btn-primary");
            unloadHistory(root);
        }
        else if(newState == geo.kdtree.GuiState.CREATION_HISTORY) {
            hideBrush();
            $("#history-navigator").show();
            $("#perform-search").prop("disabled", true);
            $("#generate-points").removeClass("btn-default").addClass("btn-primary");
            $("#generate-kd-tree").removeClass("btn-primary").addClass("btn-default");
            $("#perform-search").removeClass("btn-default").addClass("btn-primary");
        }
        else if(newState == geo.kdtree.GuiState.FIND_HISTORY) {
            showBrush();
            $("#history-navigator").show();
            $("#generate-kd-tree").removeClass("btn-default").addClass("btn-primary");
            $("#generate-points").removeClass("btn-default").addClass("btn-primary");
            $("#perform-search").prop("disabled", false);
            $("#perform-search").removeClass("btn-primary").addClass("btn-default");
        }
        else if(newState == geo.kdtree.GuiState.FOUND) {
            showBrush();
            $("#history-navigator").hide();
            $("#generate-kd-tree").removeClass("btn-default").addClass("btn-primary");
            $("#generate-points").removeClass("btn-default").addClass("btn-primary");
            $("#perform-search").prop("disabled", false);
            $("#perform-search").removeClass("btn-primary").addClass("btn-default");
            unloadHistory(root);
        }

    }

    function regeneratePoints() {
        points = generatePoints(width, height);
        displayPoints(points, width, height);
        root = null;
        setGuiState(geo.kdtree.GuiState.POINTS_GENERATED);
    }

    function createTree() {
        var describer = createDescriber();
        deleteTimestampFromTree(root);
        root = createKDTree(points, 0, [[-1, -1], [width+1, height+1]], describer);

        var stepByStep = $("#step-by-step").prop("checked");
        if(stepByStep) {
            setGuiState(geo.kdtree.GuiState.CREATION_HISTORY);
            loadHistory(describer, points, root, width, height);
            d3.select("#finish-steps").on("click", finishCreationSteps);
        }
        else {
            setGuiState(geo.kdtree.GuiState.TREE_CREATED);
            renderKD(points, root, width, height);
        }
    }

    function deleteTimestampFromTree(root) {
        if(root) {
            root.time = null;
            root.done_time = null;
            root.done = null;
            deleteTimestampFromTree(root.left);
            deleteTimestampFromTree(root.right);
        }
    }

    function deleteReportStampFromTree(root) {
        if(root) {
            root.report = null;
            deleteReportStampFromTree(root.left);
            deleteReportStampFromTree(root.right);
        }
    }

    function finishCreationSteps() {
        unloadHistory(root);
        setGuiState(geo.kdtree.GuiState.TREE_CREATED);
        renderKD(points, root, width, height);
    }

    function finishSearchSteps() {
        unloadHistory(root);
        deleteReportStampFromTree(root);
        setGuiState(geo.kdtree.GuiState.FOUND);
        renderKD(points, root, width, height);
    }

    function performSearch() {
        showBrush();
        renderKD(points, root, width, height);

        var svg = d3.select("#kdtree svg");
        var point = svg.selectAll(".point").each(function(d) { d.scanned = d.found = false; });
        deleteReportStampFromTree(root);
        deleteTimestampFromTree(root);

        var describer = createDescriber();
        var result = search(root, brushExtent, describer);

        var stepByStep = $("#step-by-step").prop("checked");
        if(stepByStep) {
            setGuiState(geo.kdtree.GuiState.FIND_HISTORY);
            loadHistory(describer, points, root, width, height);
            d3.select("#finish-steps").on("click", finishSearchSteps);
        }
        else {
            setGuiState(geo.kdtree.GuiState.FOUND);
            renderKD(points, root, width, height);
        }
    }

    d3.select("#generate-points").on("click", regeneratePoints);
    d3.select("#generate-kd-tree").on("click", createTree);
    d3.select("#perform-search").on("click", performSearch);

    regeneratePoints();
}

/**
 * Points generation
 */

function generatePoints(width, height) {
    var pointsNumber = $("#points-number").val();

    return d3.range(pointsNumber).map(function() {
        return [Math.random() * width, Math.random() * height];
    });
}

main();