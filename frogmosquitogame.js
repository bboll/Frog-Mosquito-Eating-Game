var game = "";

    document.addEventListener("DOMContentLoaded", function(event) {
        var parent = document.getElementById("bannerright");
        var cwidth = parent.offsetWidth;
        var canvas = document.createElement('canvas');

        setTimeout(1000);
        canvas.id = "myCanvas";
        canvas.width = 540;
        canvas.height = 210;
        canvas.style.zIndex = "8";
        canvas.style.position = "relative";
        canvas.style.left = "-100px";
        canvas.style.border = "1px solid";

        parent.appendChild(canvas);
    });


	//Script for random frog blinking intervals; half-closed state
	function reset_animation() {
	  var els = document.getElementById("EyesHalf").getElementsByTagName("path");
	  Array.prototype.forEach.call( els, function(el){
	    var elm = el;
	    var newone = elm.cloneNode(true);
	    elm.parentNode.replaceChild(newone, elm);
	  });
	  
	  setTimeout(100);
	
	//Fully closed state
	  var els2 = document.getElementById("EyesFull").getElementsByTagName("path");
	  Array.prototype.forEach.call( els2, function(el2){
	    var elm2 = el2;
	    var newone2 = elm2.cloneNode(true);
	    elm2.parentNode.replaceChild(newone2, elm2);
	  });
	}
	
	//Click the frog to start the game
	document.getElementById("frogbody").onclick = function () {
	    reset_animation();
	    flygame();
	};

	/* blinking frog */	    
    var interval = 5000; // initial condition
    var run = setInterval(request , interval); // start setInterval as "run"

    function request() {

        clearInterval(run); // stop the setInterval()
        reset_animation();

        /* 1000 for milliseconds */
        interval = Math.floor(Math.random() * 1000)+1;
        interval = interval * 10;

        run = setInterval(request, interval); // start the setInterval()

    }
		    
	/*game*/
	function flygame() {
        game = "fly";
		
		//Hide pre-game CSS animations and place frog below enemies
        document.getElementById("thoughtbubble").style.visibility = "hidden";
        document.getElementById("frog").style.zIndex = "0";
		
        var canvas = document.getElementById("myCanvas");
        var startpos = canvas.width - 48;
        var ctx = canvas.getContext("2d");
		
		//Hero image is part of the game, tails is a CSS animation state of that image; run animation on game start
        var elements = document.getElementById("hero-image-wrapper");
        var newone = elements.cloneNode(true);
        elements.parentNode.replaceChild(newone, elements);
        newone.classList.add("tails");

        /* Create enemy mosquitoes */
        var enemies = [];
        var enemyIDsToDestroy = [];
        var enemyCount = 10;

        var enemy,
            enemyImage;

        function gameLoop() {

            window.requestAnimationFrame(gameLoop);

            for(var i=0; i<enemies.length; i++) {
                enemies[i].update();
                enemies[i].render();
                enemies[i].moveEnemy();

                //If offscreen, destroy
                if (enemies[i].posX < -200) {
					//TODO: Take damage, show reaction animations, destroy enemy
                    enemyIDsToDestroy.push(enemies[i].id);
                    enemies[i].destroyEnemy();
                }

            }
        }

        function getMousePos (canvas, evt) {
            var rect = canvas.getBoundingClientRect();

            return { x: (evt.clientX - rect.left)/rect.width, y: (evt.clientY - rect.top)/rect.height};
        }

        var segment, segmentWidth, segmentHeight;

        function shootTongue (mousePos) {
            var endPosX = mousePos.x;
            var endPosY = mousePos.y;
            var tongueWidth = 6;

            //TODO: implement pause between tongueShoot and remove this
            ctx.clearRect(0, 0, canvas.width, canvas.height);

			//Style the tongue
            ctx.strokeStyle = "#eeb4b4";
            ctx.lineWidth = tongueWidth;
            ctx.lineCap = "round";

            function Line(x, y, dx, dy) {
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
            }

			//Start line at frog's mouth
            var line = new Line(tongueInitialX, tongueInitialY, endPosX, endPosY);

            var numberOfFrames = 15, lineCount = 0, removeCounter = numberOfFrames, frameCounter = 0;
            var clearRectPerSegment;

			//Calculate slope
            var deltaX = line.dx - line.x;
            var deltaY = line.dy - line.y;

			//Find length of a segment
            var segmentLength = (Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) / numberOfFrames);

            var radians = Math.atan2(deltaY, deltaX);

            segmentWidth = (segmentLength * Math.cos(radians));
            segmentHeight = (segmentLength * Math.sin(radians));

            //Distance formula divided by length of line segment gives number of rectangles per line segment
            //No such thing as too many boxes, creating half of a box isn't a thing
            clearRectPerSegment = Math.ceil((segmentLength / Math.sqrt((tongueWidth*tongueWidth)+(tongueWidth*tongueWidth))));

            window.requestAnimationFrame(render);

            function render() {
                //numberOfFrames in a tongue shoot = number of lines drawn = divide length by numberOfFrames

                //1. Calculate distance between the two points
                //2. Draw first line 1/numberOfFrames of that distance, draw second line 2/numberOfFrames the distance, etc
                //3. Clear each segment sequentially on tongue retraction
                // x = x1, dx = x2, y = y1, dy = y2
                // sqrt( (x2-x1)^2 + (y2-y2)^2 )

                if(lineCount <= numberOfFrames) {
                    segment = new Line(tongueInitialX, tongueInitialY, (segmentWidth * lineCount) + tongueInitialX,  tongueInitialY + (segmentHeight * lineCount));

                    ctx.beginPath();
                    ctx.moveTo(segment.x, segment.y);
                    ctx.lineTo(segment.dx, segment.dy);
                    ctx.stroke();

                    lineCount++;
                    frameCounter++;

                    for(var j=0; j<enemies.length; j++) {

                        //If offscreen, destroy
                        ctx.beginPath();
                        ctx.rect(enemies[j].posX, enemies[j].posY, enemies[j].width / numberOfFrames, enemies[j].height);
                        ctx.closePath();

                        if (ctx.isPointInPath(segment.dx, segment.dy))
                        {
                            enemies[j].notEaten = false;
                            if(!enemies[j].notEaten) { console.log("EATEN"); }
                            enemyIDsToDestroy.push(enemies[j].id);
                            console.log("HIT!");
                        }

                    }

                    //Request to animate frame at next re-paint
                    window.requestAnimationFrame(render);
					
                } else if (removeCounter > 0) {
                    segment = new Line(line.dx, line.dy, (segmentWidth * removeCounter) + line.x, (segmentHeight * removeCounter) + line.y);

                    for(var i=0; i<=clearRectPerSegment; i++)
                    {
                        // (x,y) = x1 + k(x2-x1), y1 + k(y2-y1)
                        segment.x = segment.dx - ((i/clearRectPerSegment) * segmentWidth);
                        segment.y = segment.dy - ((i/clearRectPerSegment) * segmentHeight);

                        //Offset origin by tongueWidth
                        ctx.clearRect(segment.x-tongueWidth, segment.y-tongueWidth, tongueWidth*2, tongueWidth*2);
                    }

                    removeCounter--;
                    frameCounter++;


                    //TODO: If removeCounter == 0, set flag to allow another mousedown event
					//Frog shouldn't be able to shoot its tongue again before it retracts it

                    //Request to animate frame at next re-paint
                    window.requestAnimationFrame(render);

                }
            }
        }

        canvas.addEventListener("mousedown", function (evt) {
            //TODO: Check for flag indicating last tongueShoot animation has finished
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var mousePos = getMousePos(canvas, evt);

            mousePos.x *= canvas.width;
            mousePos.y *= canvas.height;

            shootTongue(mousePos);

        }, false);

        function sprite(options) {

            var that = {},
                frameIndex = 0,
                tickCount = 0,
                ticksPerFrame = options.ticksPerFrame || 0,
                numberOfFrames = options.numberOfFrames || 1;

            that.id = options.id;
            that.context = options.context;
            that.width = options.width;
            that.height = options.height;
            that.image = options.image;
            that.posX = options.posX;
            that.posY = options.posY;
            that.prevposX = that.posX;
            that.prevposY = that.posY;
            that.notEaten = true;


            that.update = function () {

                tickCount += 1;

                if (tickCount > ticksPerFrame) {

                    tickCount = 0;

                    // If the current frame index is in range
                    if (frameIndex < numberOfFrames - 1) {
                        // Go to the next frame
                        frameIndex += 1;
                    } else {
                        frameIndex = 0;
                    }
                }
            };

            that.render = function () {
                //Clear the canvas rectangle around mosquito to clean up junk bits
                //Store previous spot where mosquito just was for later cleanup; moving target
                that.context.clearRect(that.prevposX, that.prevposY, that.width / numberOfFrames, that.height);

                //Draw the animation
                that.context.drawImage(
                    that.image,
                    frameIndex * that.width / numberOfFrames,
                    0,
                    that.width / numberOfFrames,
                    that.height,
                    that.posX,
                    that.posY,
                    that.width / numberOfFrames,
                    that.height);

            };

            that.moveEnemy = function() {
                //Save previous position for cleanup
                that.prevposX = that.posX;
                that.prevposY = that.posY;

                if (that.notEaten) {

					//TODO: Make enemy speed a variable
                    //Enemy speed
                    that.posX = that.posX - 5;

					//TODO: Define erratic value instead of hardcoded
                    //Enemy flight variance after appearing on canvas
                    if (that.posX < 500) {
                        that.posY = that.posY + ((Math.floor(Math.random() * 6) - 2));
                    }
                    else {
                        that.posY = 0;
                    }
                }
                else {
                    that.posX -= segmentWidth;
                    that.posY -= segmentHeight;
                }

            };

            that.destroyEnemy = function() {
                for (var i = 0; i < enemies.length; i += 1) {
                    if (enemyIDsToDestroy.includes(that.id)) {
                        ctx.clearRect(enemyIDsToDestroy[i].posX, enemyIDsToDestroy[i].posY, 6, 6);
                        enemies[i] = null;
                        enemies.splice(i, 1);
                        break;
                    }
                }
            };

            return that;
        }

        // Get canvas
        canvas = document.getElementById("myCanvas");

		// Frog's mouth location on the canvas
        var tongueInitialX = 117;
        var tongueInitialY = 210;

        // Create sprite sheet
        enemyImage = new Image();

        var prevPos = 0;

        // Create enemy sprite
        for(var i = 0; i<enemyCount; i++) {
            var pos = startpos;
            pos += Math.floor(Math.random() * 200) + prevPos;
            prevPos = pos;

            enemy = sprite({
                context: canvas.getContext("2d"),
                id: i,
                width: 288,
                height: 48,
                image: enemyImage,
                posX: pos,
                posY: 0,
                numberOfFrames: 6,
                ticksPerFrame: 0
            });

            enemies.push(enemy);
        }

        // Load sprite sheet
        enemyImage.addEventListener("load", gameLoop);
        enemyImage.src = "MosquitoSpriteSheet.png";

    }