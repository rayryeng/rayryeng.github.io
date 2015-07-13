"use strict";

var canvas;
var gl;
var theta = 10;

var points = [];
var direction = true; // CCW - true, CW - false

var bufferId;
var vPosition;
var NumTimesToSubdivide = 2;
var scaleFactor = 1;
var fillFlag = false; // true - fill triangles, false - don't fill

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Twist
    //

    // First, initialize the corners of our twist with the
    // vertices of a triangle
    // Ensure that we don't go to the outer limits of the
    // canvas to allow for rotation

    /*
        a   ab  b

         ac    bc

            c
    */

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    // Get a link to the attribute in the shader
    vPosition = gl.getAttribLocation( program, "vPosition" );

    // Render the triangles
    render();
};


// Function to rotate a vertex based on the twist idea
function rotateVertex(input, d, angle)
{
    var rad = radians(angle);
    return vec2(input[0]*Math.cos(d*rad) - input[1]*Math.sin(d*rad),
                input[0]*Math.sin(d*rad) + input[1]*Math.cos(d*rad));
}

// Function that determines the vertices of the tesselated
// triangle
function applyTwist( a, b, c, count )
{
    // check for end of recursion
    if ( count <= 0 ) {
        // Push onto list if we're at the limit
        var arotate = rotateVertex(a, scaleFactor*Math.sqrt(a[0]*a[0] + a[1]*a[1]), theta);
        var brotate = rotateVertex(b, scaleFactor*Math.sqrt(b[0]*b[0] + b[1]*b[1]), theta);
        var crotate = rotateVertex(c, scaleFactor*Math.sqrt(c[0]*c[0] + c[1]*c[1]), theta);
        if (!fillFlag) {
            points.push(arotate, brotate, brotate, crotate, crotate, arotate);
        }
        else {
            points.push(arotate, brotate, crotate);
        }
    }
    else {

        //bisect the sides
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // four new triangles
        // only difference between gasket and
        // twist is that we include the triangle
        // that was excluded

       /*
            a   ab  b

             ac    bc

                c
        */
        applyTwist( a, ab, ac, count );
        applyTwist( ab, b, bc, count );
        applyTwist( ac, c, bc, count );
        applyTwist( ab, bc, ac, count )
    }
}

function rotateTrianglePoints() {
    for (var i = 0; i < points.length; i++) {
        var a = points[i];
        points[i] = rotateVertex(a, scaleFactor*Math.sqrt(a[0]*a[0] + a[1]*a[1]), theta);
    }
}

// Function that checks to see if the input is numeric
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// Function that sets the number of subdivisions
// once you enter it in in the textbox
function setSubDivide(ele) {
    if(event.keyCode == 13) {
        var oldValue = NumTimesToSubdivide;
        console.log(ele.value);
        if (isNumeric(ele.value)) {
            if (ele.value >= 0) {
                NumTimesToSubdivide = ele.value;
                render();
            }
            else {
                var textbox = document.getElementById('numsubdivide');
                textbox.value = oldValue;
            }
        }
        else {
            var textbox = document.getElementById('numsubdivide');
            textbox.value = oldValue;
        }
    }
}

// Function that sets the scale d in the twist equation
// once you enter it into the textbox
function setScaleFactor(ele) {
    if(event.keyCode == 13) {
        var oldValue = scaleFactor;
        if (isNumeric(ele.value)) {
            if (ele.value >= 0) {
                scaleFactor = ele.value;
                render();
            }
            else {
                var textbox = document.getElementById('scalefactor');
                textbox.value = oldValue;
            }
        }
        else {
            var textbox = document.getElementById('scalefactor');
            textbox.value = oldValue;
        }
    }
}

// Function that sets the rotation angle for the twist equation
function setRotAngle(ele) {
    if(event.keyCode == 13) {
        var oldTheta = theta;
        // Check if we put in a valid angle
        // if yes, then set it
        if (isNumeric(ele.value)) {
            if (ele.value >= 0 && ele.value < 360) {
                // Make sure you set the right direction
                if (!direction) {
                    theta = -ele.value;
                }
                else {
                    theta = ele.value;
                }
                render();
            }
            // If not, set back to old angle
            else {
                var textbox = document.getElementById('rotangle');
                textbox.value = oldTheta;
            }
        }
        else {
            var textbox = document.getElementById('rotangle');
            textbox.value = oldTheta;
        }
    }
}

// Sets the direction - counter-clockwise or clockwise
function setDirection(ele) {
    direction = ele;
    theta = Math.abs(theta);
    if (!direction) {
        theta = -theta;
    }
    render();
}

// Sets the filling of the triangles
function setFill(ele) {
    fillFlag = ele;
    render();
}

// Renders the triangles
function render()
{
    var vertices = [
        vec2( -0.7, 0.7 ), // a
        vec2(  0.7,  0.7 ), // b
        vec2(  0, -0.7 )  // c
    ];

    // Find the triangle points in the tessellation and
    // rotate them when they're all found and add them
    // to the point buffer
    applyTwist( vertices[0], vertices[1], vertices[2],
                    NumTimesToSubdivide);

    // Load the point buffer into the GPU
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    // Set up the properties of the attribute
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Clear the screen and draw the triangles
    gl.clear( gl.COLOR_BUFFER_BIT );
    if (!fillFlag) {
        gl.drawArrays( gl.LINES, 0, points.length );
    }
    else {
     gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }

    // Reset for next event
    points = [];
}
