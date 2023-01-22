"use strict"

//canvases
const main= document.getElementById('clickCanvas');
const ratio= document.getElementById('ratioCanvas');

const bernsteinOrigin= document.getElementById('bernsteinOriginCanvas');
const bernsteinVector= document.getElementById('bernsteinVectorCanvas');

const derivative= document.getElementById('derivativeCanvas');
const clearButton= document.getElementById('clearButton');

let canvases= [main, ratio, bernsteinOrigin, bernsteinVector];

//click listeners
main.addEventListener('click', addPoint)
clearButton.addEventListener('click', reset)

//holds the ratio of each point at each t values
let ratios= [[],[],[],[]];

//holds the ratio of the derivative of the ratio function at each point
let derivativeRatios= [[],[],[],[]];

//4 control points
let points= [];
//101 points to draw the curve
let drawPoints= [];

//how far into the curve has been drawn thus far
let curveIndex= 1;

let timer= null;

//has the curve drawing animation completed
let drawnCurve= false;

//sliders
var slider= document.getElementById("curveRange");
var slider2= document.getElementById("curveRange2");
var slider3= document.getElementById("curveRange3");
var slider4= document.getElementById("curveRange4");

let sliders= [slider, slider2, slider3, slider4];

//current slider value
let currentValue= slider.value;

//slider inputs
slider.oninput = function() 
{ 
    currentValue = this.value;
    sliderInput();
}

slider2.oninput = function() 
{ 
    currentValue = this.value;
    sliderInput();
}

slider3.oninput = function() 
{ 
    currentValue = this.value;
    sliderInput();
}

slider4.oninput = function()
{ 
    currentValue = this.value;
    sliderInput();
}

//resets canvases and points
function reset()
{
    stopTick();
    clearAll();

    points= [];
    drawPoints= [];
    curveIndex= 1;
    drawnCurve= false;
    displayWeightedSumGraph();
}

//clear an individual canvas
function clear(canvas)
{
    let context = canvas.getContext("2d");

    context.fillStyle = "rgb(14, 3, 48)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

//clear all canvases
function clearAll() { for (let i= 0; i < canvases.length; i++) { clear(canvases[i]); } } //simple for loop to clear all the canvases

//uses slider values to update all canvases
function sliderInput()
{
    //keep all sliders in sync
    for(let i= 0; i < sliders.length; i++)
    {
        sliders[i].value= currentValue; 
    }
    //if the curve drawing animation is complete
    if(drawnCurve)
    {
        //Main Canvas
        //clear the canvas
        clear(main);
        //draw the curve
        redrawCurve(main);
        //draw the point on the curve
        drawPoint(main, drawPoints[currentValue].x*(main.width/2)+ main.width/2, main.height/2-drawPoints[currentValue].y*(main.height/2), '#ffffff');

        //Weighted Sum Canvas
        //clear the canvas and plots the functions
        plotWeightedSums();

        //Vector Canvas
        //clear the canvas
        clear(bernsteinOrigin);
        //draw the vectors originating at the origin
        drawVectors();
        //draw the curve
        redrawCurve(bernsteinOrigin);
        //draw the point at the origin
        drawPoint(bernsteinOrigin, bernsteinOrigin.width/2, bernsteinOrigin.height/2, 'white');
        
        //Vector Addition Canvas
        //clear the canvas
        clear(bernsteinVector);
        //draw the curve
        redrawCurve(bernsteinVector);
        //draw the point at the origin
        drawPoint(bernsteinVector, bernsteinVector.width/2, bernsteinVector.height/2, 'white');
        //draw the point on the curve
        drawPoint(bernsteinVector, drawPoints[currentValue].x*(bernsteinVector.width/2)+ bernsteinVector.width/2, bernsteinVector.height/2-drawPoints[currentValue].y*(bernsteinVector.height/2), '#ffffff');
        //draw the component vectors adding to each other
        drawPointComponents();

        //Velocity Canvas
        //clear the canvas
        clear(derivative);
        //draw the curve
        redrawCurve(derivative);
        //draw the point on the curve
        drawPoint(derivative, drawPoints[currentValue].x*(main.width/2)+ main.width/2, main.height/2-drawPoints[currentValue].y*(main.height/2), '#ffffff');
        displayDerivative(derivative, drawPoints[currentValue].x, drawPoints[currentValue].y);
    }
}

function displayDerivative(canvas, x, y)
{
    
    let vector= 
    {
        x: (derivativeRatios[0][currentValue] * points[0].x) + (derivativeRatios[1][currentValue] * points[1].x) + (derivativeRatios[2][currentValue] * points[2].x) + (derivativeRatios[3][currentValue] * points[3].x) ,
        y: (derivativeRatios[0][currentValue] * points[0].y) + (derivativeRatios[1][currentValue] * points[1].y) + (derivativeRatios[2][currentValue] * points[2].y) + (derivativeRatios[3][currentValue] * points[3].y)
    };
    let mag= Math.pow((Math.pow(vector.x, 2) + Math.pow(vector.y, 2)), .5) * 4;
    vector.x= vector.x/mag;
    vector.y= vector.y/mag;

    //console.log(vector);

    let ctx= canvas.getContext('2d');

    ctx.strokeStyle= 'orange';
    ctx.lineWidth= 2;
    ctx.beginPath();
    ctx.moveTo(x*(canvas.width/2)+ canvas.width/2, canvas.height/2-y*(canvas.height/2));
    ctx.lineTo((x + vector.x)*(canvas.width/2)+ canvas.width/2, canvas.height/2-(y+ vector.y)*(canvas.height/2));
    ctx.stroke();

    let temp=
    {
        x: -1 * vector.y,
        y: vector.x
    };
    vector= temp;

    ctx.strokeStyle= 'magenta';
    ctx.lineWidth= 2;
    ctx.beginPath();
    ctx.moveTo(x*(canvas.width/2)+ canvas.width/2, canvas.height/2-y*(canvas.height/2));
    ctx.lineTo((x + vector.x)*(canvas.width/2)+ canvas.width/2, canvas.height/2-(y+ vector.y)*(canvas.height/2));
    ctx.stroke();
}

function drawVectors()
{
    let ctx= bernsteinOrigin.getContext('2d');
    
    let colors= ['red', 'cyan', 'green', 'yellow'];
    for (let i= 0; i < 4; i++)
    {
        //find the canavas location of the point with the weight applied
        let point= 
        {
            x: (points[i].x  * bernsteinOrigin.width/2) * ratios[i][currentValue] + bernsteinOrigin.width/2,
            y: bernsteinOrigin.height - ((points[i].y * ratios[i][currentValue] * bernsteinOrigin.height/2) + bernsteinOrigin.height/2)
        };

        //draw the vector
        ctx.strokeStyle= colors[i];
        ctx.lineWidth= 2;
        ctx.beginPath();
        ctx.moveTo(bernsteinOrigin.width/2, bernsteinOrigin.height/2);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
}

function drawPointComponents()
{
    let ctx= bernsteinVector.getContext('2d');

    let colors= ['red', 'cyan', 'green', 'yellow'];

    let vectors= [];

    //loop to find the points in cartesian space with the weight applied
    for (let i= 0; i < 4; i++)
    {
        let point= 
        {
            x: points[i].x * ratios[i][currentValue],
            y: points[i].y * ratios[i][currentValue]
        };
        vectors.push(point);
    }

    let finals= [{x:bernsteinVector.width/2, y:bernsteinVector.height/2}];

    //loop to create an array with the vectors added to one another
    for(let i= 0; i < vectors.length; i++)
    {
        let point= {x:0, y:0};
        for(let j= 0; j < i+1; j++)
        {
            point.x+= vectors[j].x;
            point.y+= vectors[j].y;
        }

        point.x*= bernsteinVector.width/2;
        point.x+= bernsteinVector.width/2;

        point.y*= bernsteinVector.height/2;
        point.y+= bernsteinVector.height/2;
        point.y= bernsteinVector.height - point.y;

        finals.push(point);
    }

    //draw the vectors
    for (let i= 1; i < finals.length; i++)
    {
        ctx.strokeStyle= colors[i-1];
        ctx.lineWidth= 3;
        ctx.beginPath();
        ctx.moveTo(finals[i-1].x, finals[i-1].y);
        ctx.lineTo(finals[i].x, finals[i].y);
        ctx.stroke();
    }
}

function redrawCurve(canvas)
{
    let ctx= canvas.getContext('2d');
    //draw the connections
    for (let i= 1; i < 4; i++)
    {
        ctx.lineWidth= 2;
        ctx.strokeStyle= '#ffffff';
        ctx.beginPath();
        ctx.moveTo(points[i-1].x*(canvas.width/2)+ canvas.width/2, canvas.height/2-points[i-1].y*(canvas.height/2));

        ctx.lineTo(points[i].x*(canvas.width/2)+ canvas.width/2, canvas.height/2-points[i].y*(canvas.height/2));
        ctx.stroke();
    }
    //draw the curve
    for (let i= 1; i <= 100; i++)
    {
        ctx.lineWidth= 2;
        ctx.strokeStyle= '#ffffff';
        ctx.beginPath();
        ctx.moveTo(drawPoints[i-1].x*(canvas.width/2)+ canvas.width/2, canvas.height/2-drawPoints[i-1].y*(canvas.height/2)); 
        ctx.lineTo(drawPoints[i].x*(canvas.width/2)+ canvas.width/2, canvas.height/2-drawPoints[i].y*(canvas.height/2));
        ctx.stroke();
    }

    //clear and draw the 4 points
    clearPoint(canvas, points[0].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[0].y*(canvas.height/2));
    drawPoint(canvas, points[0].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[0].y*(canvas.height/2), 'red');
    clearPoint(canvas, points[1].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[1].y*(canvas.height/2));
    drawPoint(canvas, points[1].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[1].y*(canvas.height/2), 'cyan');
    clearPoint(canvas, points[2].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[2].y*(canvas.height/2));
    drawPoint(canvas, points[2].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[2].y*(canvas.height/2), 'green');
    clearPoint(canvas, points[3].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[3].y*(canvas.height/2));
    drawPoint(canvas, points[3].x*(canvas.width/2) + canvas.width/2, canvas.height/2-points[3].y*(canvas.height/2), 'yellow');
}

//draw a point at (x, y)
function drawPoint(canvas, x, y, color)
{
    let ctx= canvas.getContext('2d');

    ctx.strokeStyle= color;
    ctx.lineWidth= 3;
    ctx.fillStyle= 'rgb(14, 3, 48)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.stroke();
}

//clear a circle at (x, y)
function clearPoint(canvas, x, y)
{
    let ctx= canvas.getContext('2d');

    ctx.strokeStyle= 'rgb(14, 3, 48)';
    ctx.lineWidth= 3;
    ctx.fillStyle= 'rgb(14, 3, 48)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.stroke();
}

//prepare the values for the ratios across the curve
function prepareWeightedSum()
{
    for(let i= 0; i <= 100; i++)
    {
        let t= i/100;
        ratios[0].push(-1*Math.pow(t,3) + 3*Math.pow(t,2) - 3*t + 1);
        ratios[1].push(3*Math.pow(t,3) - 6*Math.pow(t,2) + 3*t);
        ratios[2].push(-3*Math.pow(t,3) + 3*Math.pow(t,2));
        ratios[3].push(Math.pow(t,3));
    }
}

function prepareDerivatives()
{
    for (let i= 0; i <= 100; i++)
    {
        let t= i/100;
        derivativeRatios[0].push(-3*Math.pow(t,2) + 6*t - 3);
        derivativeRatios[1].push(9*Math.pow(t,2) - 12*t + 3);
        derivativeRatios[2].push(-9*Math.pow(t,2) + 6*t);
        derivativeRatios[3].push(3*Math.pow(t,2));
    }
}

function displayWeightedSumGraph()
{
    let ctx= ratio.getContext('2d');

    ctx.lineWidth= 2;
    //loop through and draw the ratio functions
    for(let i= 1; i <= 100; i++)
    {
        ctx.strokeStyle= 'red';
        ctx.beginPath();
        ctx.moveTo((i-1)*3, 300- 300 * ratios[0][i-1]);
        ctx.lineTo((i)*3, 300- 300 * ratios[0][i]);
        ctx.stroke();

        ctx.strokeStyle= 'cyan';
        ctx.beginPath();
        ctx.moveTo((i-1)*3, 300- 300 * ratios[1][i-1]);
        ctx.lineTo((i)*3, 300- 300 * ratios[1][i]);
        ctx.stroke();

        ctx.strokeStyle= 'green';
        ctx.beginPath();
        ctx.moveTo((i-1)*3, 300- 300 * ratios[2][i-1]);
        ctx.lineTo((i)*3, 300- 300 * ratios[2][i]);
        ctx.stroke();

        ctx.strokeStyle= 'yellow';
        ctx.beginPath();
        ctx.moveTo((i-1)*3, 300- 300 * ratios[3][i-1]);
        ctx.lineTo((i)*3, 300- 300 * ratios[3][i]);
        ctx.stroke();
    }
}

//draw the points on each function 
function plotWeightedSums()
{
    clear(ratio);
    displayWeightedSumGraph();

    drawPoint(ratio,currentValue*ratio.width/100, ratio.height-ratio.height*ratios[0][currentValue], '#ffffff');
    drawPoint(ratio,currentValue*ratio.width/100, ratio.height-ratio.height*ratios[1][currentValue], '#ffffff');
    drawPoint(ratio,currentValue*ratio.width/100, ratio.height-ratio.height*ratios[2][currentValue], '#ffffff');
    drawPoint(ratio,currentValue*ratio.width/100, ratio.height-ratio.height*ratios[3][currentValue], '#ffffff');
}

function addPoint(evnt)
{
    let ctx= main.getContext('2d');

    if (points.length < 4)
    {
        //get the point coordinates in cartesian space
        let point= 
        {
            x: (evnt.offsetX- main.width/2) / (main.width/2),
            y: (main.height- evnt.offsetY- main.height/2) / (main.height/2)
        };

        points.push(point);
        
        if(points.length > 1)
        {
            //draw the connection between te new point and the previous point
            ctx.lineWidth= 3;
            ctx.strokeStyle= '#ffffff';
            ctx.beginPath();
            ctx.moveTo(points[points.length-1].x*(main.width/2)+ main.width/2, main.height/2-points[points.length-1].y*(main.height/2));

            ctx.lineTo(points[points.length-2].x*(main.width/2)+ main.width/2, main.height/2-points[points.length-2].y*(main.height/2));
            ctx.stroke();

            clearPoint(main, points[points.length-2].x*(main.width/2) + main.width/2, main.height/2-points[points.length-2].y*(main.height/2));
            drawPoint(main, points[points.length-2].x*(main.width/2) + main.width/2, main.height/2-points[points.length-2].y*(main.height/2), '#ffffff');
        }
        
        //draw the point
        drawPoint(main, points[points.length-1].x*(main.width/2) + main.width/2, main.height/2-points[points.length-1].y*(main.height/2), '#ffffff');
    }

    if (points.length >= 4)
    {
        //do the curve math
        cubicBezier();
        //start the curve drawing animation
        startTick();
    }
}

function cubicBezier()
{
    for (let i= 0; i <= 100; i++)
    {
        //get the resulting point from the sum of the control points with the weights applied
        let p= 
        {
            x: points[0].x * ratios[0][i] +  points[1].x * ratios[1][i] + points[2].x * ratios[2][i] +  points[3].x * ratios[3][i],
            y: points[0].y * ratios[0][i] +  points[1].y * ratios[1][i] + points[2].y * ratios[2][i] +  points[3].y * ratios[3][i]
        }
        drawPoints.push(p);
    }
}

//draw a portion of the curve from cubicIndex to cubicIndex-1
function drawCubic(canvas)
{
    let ctx= canvas.getContext('2d');

    ctx.lineWidth= 2;
    ctx.strokeStyle= '#ffffff';
    ctx.beginPath();
    ctx.moveTo(drawPoints[curveIndex].x*(main.width/2)+ main.width/2, main.height/2-drawPoints[curveIndex].y*(main.height/2)); 
    ctx.lineTo(drawPoints[curveIndex-1].x*(main.width/2)+ main.width/2, main.height/2-drawPoints[curveIndex-1].y*(main.height/2));
    ctx.stroke();
}

function canvasTicks()
{
    if (curveIndex < 100)
    {
        //draw the current portion of the curve
        drawCubic(main);
        curveIndex++;
    }
    else
    {
        //redraw the first point
        clearPoint(main, points[0].x*(main.width/2) + main.width/2, main.height/2-points[0].y*(main.height/2));
        drawPoint(main, points[0].x*(main.width/2) + main.width/2, main.height/2-points[0].y*(main.height/2), '#ffffff');
        drawnCurve= true;
        stopTick();
    }
}

function startTick()
{
    if(timer == null)
    {
        timer= setInterval(canvasTicks, 10);
    }
}

function stopTick()
{
    if(timer != null)
    {
        clearInterval(timer);
        timer= null;
        sliderInput();
    }
}


//preparation functions
prepareWeightedSum();
displayWeightedSumGraph();
prepareDerivatives();