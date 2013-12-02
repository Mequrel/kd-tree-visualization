/**
 * KD Tree generation
 */

function kdTreeNode() {
    return {
        left: null,
        right: null,
        axis: null,
        value: null,
        point: null,
        range: null
    };
}

function createKDTree(points, axis, range, describer) {
    var node = kdTreeNode();
    node.axis = axis;
    node.range = range;
    describer.nextStep()
        .write("Create a node for analyzed 2D interval.")
        .createNode(node)
        .setCurrentNode(node);

    describer.write("Is there more than one point?");
    if (points.length == 1) {
        describer.nextStep()
            .highlightPoints(points[0])
            .markAsDone(node)
            .write("No. Nothing more to do here.");

        node.value = points[0][axis];
        node.point = points[0];
        return node;
    }

    describer.nextStep()
        .write("Yes. Find a median according to " + axis + " axis");

    var medianValue = d3.median(points, function(point) {
        return +point[axis];
    });
    node.value = medianValue;

    describer.nextStep()
        .showDivision(medianValue, axis, range)
        .write("Points are divided with found median value: " + medianValue);


    var left = points.filter(function(point) {
        return +point[axis] <= medianValue;
    });

    var leftRange = [range[0].slice(), range[1].slice()];
    leftRange[1][axis] = medianValue;

    describer.nextStep()
        .write("Computing left/up range and left/up points")
        .showDivision(medianValue, axis, range)
        .highlightPoints(left)
        .highlightRange(leftRange);

    var right = points.filter(function(point) {
        return +point[axis] > medianValue;
    });

    var rightRange = [range[0].slice(), range[1].slice()];
    rightRange[0][axis] = medianValue;

    describer.nextStep()
        .write("Computing right/down range and right/down points")
        .showDivision(medianValue, axis, range)
        .highlightPoints(right)
        .highlightRange(rightRange);

    var nextAxis = (axis + 1) % 2;
    describer.nextStep()
        .showDivision(medianValue, axis, range)
        .write("Next axis will be " + nextAxis + " axis. ")
        .write("Calling recursively for left/up part.");
    node.left = createKDTree(left, nextAxis, leftRange, describer);

    describer.nextStep()
        .setCurrentNode(node)
        .write("left/up part finished. Calling recursively for right/down part.");

    node.right = createKDTree(right, nextAxis, rightRange, describer);
    describer.nextStep()
        .setCurrentNode(node)
        .markAsDone(node)
        .write("right/down part finished. Nothing more to do.");

    return node;
}


function search(kdTree, range, describer) {
    describer.nextStep()
        .setCurrentNode(kdTree)
        .write("Is current node a leaf?");

    if(kdTree.point) {
        describer.nextStep()
            .write("Yes. Checking if the sole point is in our range.")
            .markAsScanned(kdTree.point);

        if(isInRange(kdTree.point, range)) {
            describer.nextStep()
                .write("Point is in range. Returning it as a solution.")
                .markAsFound(kdTree.point);

            return [kdTree.point];
        } else {
            describer.nextStep()
                .write("Point is not in range. Discarding the point.");
            return [];
        }
    }

    describer.nextStep()
        .write("No. Does our range fully contains left/up part?")
        .highlightRange(kdTree.left.range);

    var result = []

    if(fullyContains(range, kdTree.left.range)) {
        var leftResult = reportSubtree(kdTree.left);

        describer.nextStep()
            .write("Yes. Adding the whole subtree as a solution")
            .highlightSubtree(kdTree.left);


        describer.markAllAsFound(leftResult);
        describer.markAllAsScanned(leftResult);

        result = result.concat(leftResult);
    }
    else {
        describer.nextStep()
            .write("No. So maybe at least our range intersects left/up part?")
            .highlightRange(kdTree.left.range);

        if(intersects(range, kdTree.left.range)) {
            describer.nextStep()
                .write("Yes. Calling itself recursively for left/up part.")
                .highlightRange(kdTree.left.range);

            var leftResult = search(kdTree.left, range, describer);
            result = result.concat(leftResult);

            describer.nextStep()
                .write("Finished recursion for left/up part.")
                .setCurrentNode(kdTree)
                .highlightRange(kdTree.left.range);
        }
        else {
            describer.nextStep()
                .write("No.")
                .highlightRange(kdTree.left.range);
        }
    }

    describer.nextStep()
        .write(" Does our range fully contains right/down part?")
        .highlightRange(kdTree.right.range);

    if(fullyContains(range, kdTree.right.range)) {
        var rightResult = reportSubtree(kdTree.right);

        describer.nextStep()
            .write("Yes. Adding the whole subtree as a solution")
            .highlightSubtree(kdTree.right);

        describer.markAllAsFound(rightResult);
        describer.markAllAsScanned(rightResult);

        result = result.concat(rightResult);
    }
    else {
        describer.nextStep()
            .write("No. So maybe at least our range intersects right/down part?")
            .highlightRange(kdTree.right.range);

        if(intersects(range, kdTree.right.range)) {
            describer.nextStep()
                .write("Yes. Calling itself recursively for right/down part.")
                .highlightRange(kdTree.right.range);

            var rightResult = search(kdTree.right, range, describer);
            result = result.concat(rightResult);

            describer.nextStep()
                .write("Finished recursion for right/down part.")
                .setCurrentNode(kdTree)
                .highlightRange(kdTree.right.range);
        } else {
            describer.nextStep()
                .write("No.")
                .highlightRange(kdTree.right.range);
        }
    }

    describer.nextStep()
        .markAsDone(kdTree)
        .write("Finished for current range. Returning result.");


    return result;


    function fullyContains(containing, contained) {
        return containing[0][0] <= contained[0][0] && contained[1][0] <= containing[1][0]
            && containing[0][1] <= contained[0][1] && contained[1][1] <= containing[1][1];
    }

    function intersects(range, range2) {
        return intersectsX(range, range2) && intersectsY(range, range2);
    }

    function intersectsX(range1, range2) {
        var width1 = range1[1][0] - range1[0][0];
        var width2 = range2[1][0] - range2[0][0];
        var unionWidth = Math.max(range1[1][0], range2[1][0]) - Math.min(range1[0][0], range2[0][0]);

        return (width1 + width2 >= unionWidth);
    }

    function intersectsY(range1, range2) {
        var height1 = range1[1][1] - range1[0][1];
        var height2 = range2[1][1] - range2[0][1];
        var unionHeight = Math.max(range1[1][1], range2[1][1]) - Math.min(range1[0][1], range2[0][1]);

        return (height1 + height2 >= unionHeight);
    }

    function isInRange(point, range) {
        return range[0][0] < point[0] && point[0] <= range[1][0]
            && range[0][1] < point[1] && point[1] <= range[1][1];
    }

    function reportSubtree(root) {
        if(root.point) {
            return [root.point];
        }
        else {
            var left = reportSubtree(root.left);
            var right = reportSubtree(root.right);
            return left.concat(right);
        }
    }

}