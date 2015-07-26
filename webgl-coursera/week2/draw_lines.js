"use strict";

var canvas;
var gl;
var redColour = 128.0;
var greenColour = 128.0;
var blueColour = 128.0;

// Each value stores the starting index
// in the array of we are to start accessing points
var startPoints = [];

// Stores how many points there are per line
var numPoints = [];

var drawEnabled = false;

// Define total number of vertices
var maxNumVertices = 100000;

// Keeps track of how many points there are for the current line
var count = 0;

var totalCount = 0; // Total number of points so far

// To have access to the vertex buffer
var vBuffer;

// For colour buffer
var cBuffer;


function addPoint(event)
{
    // Convert to clip coordinates
    var vertexCurrent = vec2(event.clientX, event.clientY);
    var t = vec2(2*vertexCurrent[0]/canvas.width-1,
                 2*(canvas.height-vertexCurrent[1])/canvas.height-1);

    // Put vertex buffer into focus
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

    // Add the points to the buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*totalCount, flatten(t));

    // Put colour buffer into focus
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    // Add colours to buffer
    t = vec4(redColour/255.0, greenColour/255.0, blueColour/255.0, 1.0);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*totalCount, flatten(t));

    count++; // Increment number of points on the line
    numPoints[numPoints.length-1]++;
    totalCount++; // Increment total # of points
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    drawEnabled = false;

    // Set up event handlers
    // For the red slider - When red slider changes,
    // the text box for the red value should also change
    // We also update the colour preview window updating the
    // red colour
    document.getElementById("sliderred").onchange = function(event) {
        redColour = event.target.value;
        var textbox = document.getElementById("textred");
        textbox.value = redColour;
        textbox = document.getElementById("colourpreview");
        textbox.style.backgroundColor = 'rgb(' + redColour + ',' + greenColour + ',' + blueColour + ')';
    };

    // Same for the green
    document.getElementById("slidergreen").onchange = function(event) {
        greenColour = event.target.value;
        var textbox = document.getElementById("textgreen");
        textbox.value = greenColour;
        textbox = document.getElementById("colourpreview");
        textbox.style.backgroundColor = 'rgb(' + redColour + ',' + greenColour + ',' + blueColour + ')';
    };

    // Same for the blue
    document.getElementById("sliderblue").onchange = function(event) {
        blueColour = event.target.value;
        var textbox = document.getElementById("textblue");
        textbox.value = blueColour;
        textbox = document.getElementById("colourpreview");
        textbox.style.backgroundColor = 'rgb(' + redColour + ',' + greenColour + ',' + blueColour + ')';
    };

    // Reset the canvas
    document.getElementById("reset").onclick = function(event) {

        drawEnabled = false;

        // Clear all buffers
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW );

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

        startPoints = [];
        numPoints = [];
        count = 0;
        totalCount = 0;
    };

    // When mouse is down, enable drawing
    canvas.addEventListener("mousedown", function(event) {
        drawEnabled = true;
        // Add index of where we first happened to click
        // in index array
        startPoints.push(totalCount);
        count = 0;
        numPoints.push(0);

        // This is currently the previous point
        addPoint(event);
    } );

    // When mouse up, disable drawing
    canvas.addEventListener("mouseup", function(event) {
        drawEnabled = false;
    } );

    // When moving the mouse when drawing is enabled
    canvas.addEventListener("mousemove", function(event) {
        // Add a point
        if (drawEnabled)
            addPoint(event);
    } );


    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Initialize vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Initialize colour buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );

    // Cycle through each set of lines and draw accordingly
    if (totalCount != 0) {
        for (var i = 0; i < numPoints.length; i++) {
            if (numPoints[i] != 0)
                gl.drawArrays( gl.LINE_STRIP, startPoints[i], numPoints[i] );
        }

    }

    // Make sure we update the screen every so often
    window.requestAnimFrame(render);

}
