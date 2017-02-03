// Some code

var vis = {}

vis.dropHandler = function (event) {
  event.preventDefault();
  var dataTransfer = event.dataTransfer;

  if (dataTransfer.items && dataTransfer.items[0].kind == 'file') {
    var file = dataTransfer.items[0].getAsFile();
    console.log('got file: ' + file.name);
    var content = null;
    
    var fileUrl = window.URL.createObjectURL(file);
    vis.drawGraph(fileUrl, event.x, event.y);    
    var overlay = document.getElementById('drop-zone');
    overlay.classList.remove("target");
    console.log(event.clientX, event.clientY);
  }

}

vis.dragOverHandler = function (event) {
  event.preventDefault();
  var overlay = document.getElementById('drop-zone');
  overlay.classList.add("target");
}

vis.dragEndHandler = function (event) {
  event.preventDefault();
  var overlay = document.getElementById('drop-zone');
  overlay.classList.remove("target");
}

vis.processData = function (data) {
  var similarity = function (person1, person2) {
    var interestColumns = data.columns.slice(2, data.columns.length);
    var similarCount = 0;
    interestColumns.forEach(function (interest) {
      if (person1[interest] == 'y' && person2[interest] == 'y') similarCount++;
    });

    return similarCount;
  };

  var processedData = {
    "links": [],
    "nodes": []
  }

  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data.length; j++) {
      if (i === j) break;
      var sameness = similarity(data[i], data[j]);
      if (sameness > 1) {
        processedData.links.push({
          "source": data[i].name,
          "target": data[j].name,
          "value": sameness
        });
      }
    }
  }

  for (var i = 0; i  < data.length; i++) {
    processedData.nodes.push({
      id: data[i].name,
      datum: data[i],
      group: 1
    });
  }

  return processedData;
}

vis.drawGraph = function (csvUrl, centerX, centerY) {
  d3.csv(csvUrl, function (data) {
    var DATA = vis.processData(data);
    console.log(DATA);

    var color = d3.scaleLinear().domain([0, DATA.nodes.length])
      .range([
          d3.rgb(128, 201, 210),
          d3.rgb(106, 37, 105)
      ])

    var svg = d3.select('svg'),
        width = +svg.attr('width'),
        height = +svg.attr('height');

    var cx = centerX - document.getElementsByTagName('svg')[0].getBoundingClientRect().left;
    var cy = centerY - document.getElementsByTagName('svg')[0].getBoundingClientRect().top;
    
    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(cx, cy));

    var hoverHandler = function (d, i) {
      d3.select(this)
        .attr('fill', d3.rgb(247, 143, 49))
        .attr('r', 7);

      console.log(d);
      d3.select('svg')
        .append('text')
        .attr('id', 'label')
        .attr('x', 16)
        .attr('y', 16)
        .text(d.datum.name + " " + d.datum.company);
    }

    var hoverEndHandler = function (d, i) {
      d3.select(this)
        .attr('fill', color(i))
        .attr('r', 5);

      d3.select('#label').remove();
    }

    var link = svg.append('g').attr('class', 'links')
      .selectAll('line')
      .data(DATA.links)
      .enter()
      .append('line')
      .attr('stroke-width', function (d) { return Math.sqrt(d.value) + 1; });

    var node = svg.append('g').attr('class', 'nodes')
      .selectAll('circle')
      .data(DATA.nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', function (d, i) { return color(i); })
      .on("mouseover", hoverHandler)
      .on("mouseout", hoverEndHandler);

    node.append('title').text(function (d) { return d.id });

    simulation.nodes(DATA.nodes).on('tick', function () {
      var dx = (cx - (width / 2))/10, dy = (cy - (height / 2))/10;
      simulation.force("center", d3.forceCenter(cx -= dx, cy -= dy));
      link
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });

      node
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    });

    simulation.force('link').links(DATA.links);
  });
}

document.addEventListener("DOMContentLoaded", function (event) {
  document.addEventListener("dragover", vis.dragOverHandler, false);
  document.addEventListener("dragend", vis.dragEndHandler, false);
  document.addEventListener("dragleave", vis.dragEndHandler, false);
  var landingZone = document.getElementById("drop-zone");
  landingZone.addEventListener("drop", vis.dropHandler, false);
});

