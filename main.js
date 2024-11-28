let context = undefined;

const fps = 30.0;
const isSoundOn = false;
const backgroundColor = "#efe";

let minX = 0;
let maxX = 10000;
let minY = 0;
let maxY = 10000;

const elements = [];
const bits = [];

function beep() {
    if (isSoundOn)
    {
        var snd = new Audio("data:audio/wav;base64,UklGRnwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAAAAEsAKQFlAooD+wMhA5cAZvwY98rx/+1r7Y/xZ/sUC7wfgTfIT5NlBXbcftx+BXaTZchPgTe8HxQLZ/uP8Wvt/+3K8Rj3ZvyXACED+wOKA2UCKQFLAAAA");  
        snd.play();
    }
}

function pointIsOutBounds(x, y, threshold)
{
    return x < minX - threshold || x > maxX + threshold ||
        y < minY - threshold || y > maxY + threshold; 
}

window.onload = (ev) => {
    const canvas = document.getElementById('canvas');

    maxX = canvas.width = window.innerWidth;
    maxY = canvas.height = window.innerHeight;
    canvas.style.backgroundColor = backgroundColor;

    context = canvas.getContext('2d');

    for (let x = 100; x <= window.innerWidth - 100; x = x + 30)
    {
        for (let y = 100; y <= window.innerHeight - 100; y = y + 30)
        {
            var element = new Element(x, y, Math.random() < 0.9);
            if (!element.isFake)
                elements.push(element);
        }
    }

    for (let i = 0; i < 50; )
    {
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;
        const xVelocity = Math.random() * 20.0 - 10.0;
        const yVelocity = Math.random() * 20.0 - 10.0;
        var bit = new Bit(x, y, xVelocity, yVelocity, 0)
        
        collided = false;
        for (let j = 0; j < elements.length && !collided; j++)
        {
            collided = elements[j].checkCollision(bit);
        }
        for (let j = 0; j < bits.length && !collided; j++)
        {
            collided = bits[j].checkCollision(bit);
        }

        if (collided)
        {
            continue;
        }
        
        bits.push(bit);
        i++;
    }

    function delayRender()
    {
        setTimeout(function()
        {
            doPhysics(); 
            render(context);
            delayRender();
        }, 
        1000 / fps / 3.0);
    };

    render(context);
    delayRender();
};

function render(context)
{
    var elementsToRemove = [];
    for (let i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        if (element.wasCollided)
        {
            element.redraw(context);
        }

        if (element.wasDisposed)
        {
            element.undraw(context);
            elementsToRemove.push(element);
        }
    }

    for (let i = 0; i < elementsToRemove.length; i++)
    {
        var index = elements.findIndex(e => e == elementsToRemove[i]);
        elements.splice(index, 1);
    }

    for (let i = 0; i < bits.length; i++)
    {
        bits[i].redraw(context);        
    }
}

function doPhysics()
{
    var bitsToDelete = [];
    for (let i = 0; i < bits.length; i++)
    {
        bits[i].move();
        if (pointIsOutBounds(bits[i].x, bits[i].y, bits[i].radius))
        {
            bitsToDelete.push(bits[i]);
        }
    }

    for (let i = 0; i < bitsToDelete.length; i++)
    {
        var index = bits.findIndex(e => e == bitsToDelete[i]);
        bits.splice(index, 1);
    }

    var bitsToAdd = [];
    for (let i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        element.wasCollided = false;

        let collidedBit = undefined
        for (let j = 0; j < bits.length && !collidedBit; j++)
        {
            if (element.checkCollision(bits[j]))
            {
                collidedBit = bits[j];;
            }
        }

        if (!element.isFake && !element.wasDisposed && collidedBit)
        {
            var newBits = element.emitBits(collidedBit);
            bitsToAdd.push(...newBits);
            element.wasDisposed = true;
            
            beep();
        }
    }

    bits.push(...bitsToAdd);
}

class Element {
    constructor(x, y, isFake) {
        this.x = x;
        this.y = y;
        this.isFake = isFake;
    }

    radius = 5;
    wasCollided = true;
    wasDisposed = false;

    undraw = function(context) { };

    redraw(context)
    {
        this.undraw(context);
        this.draw(context);
    }

    draw(context){

        if (this.wasDisposed)
            return;

        context.beginPath();

        if (this.isFake)
        {
            context.strokeStyle = "#008";
            context.lineWidth = 1;
            context.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2.0, false);
            context.stroke();
        }
        else
        {
            context.fillStyle = "#008";
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2.0, false);
            context.fill();
        }
        
        context.closePath();

        this.undraw = 
        function(context)
        {
            context.beginPath();
    
            if (this.isFake)
            {
                context.strokeStyle = backgroundColor;
                context.lineWidth = 1;
                context.arc(this.x, this.y, this.radius, 0, Math.PI * 2.0, false);
                context.stroke();
            }
            else
            {
                context.fillStyle = backgroundColor;
                context.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2.0, false);
                context.fill();
            }
    
            context.closePath();
        };
    }   

    checkCollision(other)
    {
        var result = Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)) < this.radius + other.radius + 1;
        if (result) this.wasCollided = true;
        return result;
    }

    emitBits(sourceBit)
    {
        const vX = this.x - sourceBit.x;
        const vY = this.y - sourceBit.y;
        const leftVelocityX = vX*0.867 - vY*0.5;
        const leftVelocityY = vX*0.5 + vY*0.867;
        const rightVelocityX = vX*0.867 + vY*0.5;
        const rightVelocityY = -vX*0.5 + vY*0.867;

        return [
            new Bit(this.x, this.y, leftVelocityX * 1.33, leftVelocityY  * 1.33, 0),
            new Bit(this.x, this.y, rightVelocityX * 0.67, rightVelocityY * 0.67, 0)
        ];
    }
}

class Bit {
    constructor(x, y, xVelocity, yVelocity, slowdownFactor) {
        this.x = x;
        this.xVelocity = xVelocity;
        this.y = y;
        this.yVelocity = yVelocity;
        this.slowdownFactor = slowdownFactor;
    }

    radius = 3;

    undraw = function(context) { };

    redraw(context)
    {
        this.undraw(context);
        this.draw(context);
    }

    draw(context){
        context.beginPath();
        context.lineWidth = 0;
        context.fillStyle = "#880";
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2.0, false);
        context.fill();

        context.strokeStyle = "#800";
        context.lineWidth = 1;
        context.moveTo(this.x, this.y);
        context.lineTo(this.x + this.xVelocity, this.y + this.yVelocity);
        context.stroke();

        context.closePath();

        this.undraw = 
            function(context)
            {
                const old = this;

                context.beginPath();
                context.lineWidth = 0;
                context.fillStyle = backgroundColor;
                context.arc(old.x, old.y, old.radius + 1, 0, Math.PI * 2.0, false);
                context.fill();
       
                context.strokeStyle = backgroundColor;
                context.moveTo(old.x, old.y);
                context.lineTo(old.x + old.xVelocity, old.y + old.yVelocity);
                context.stroke();        
                context.closePath();
            };
    }

    

    checkCollision(other)
    {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)) < this.radius + other.radius + 1;
    }

    move()
    {
        this.x = this.x + this.xVelocity / fps;
        this.y = this.y + this.yVelocity / fps;
        this.xVelocity = this.xVelocity * (1 - this.slowdownFactor);
        this.yVelocity = this.yVelocity * (1 - this.slowdownFactor);
    }
}