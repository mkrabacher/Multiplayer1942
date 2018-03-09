//server setup
// require express
var express = require("express");
// path module -- try to figure out where and why we use this
var path = require("path");
// create the express app
var session = require('express-session');
var app = express();
app.use(session({ secret: 'codingdojorocks' }));
var bodyParser = require('body-parser');
// use it!
app.use(bodyParser.urlencoded({ extended: true }));
// static content
app.use(express.static(path.join(__dirname, "./static")));
// setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
//end server setup

//variables
var gameObject = {
    heroes: {},
    enemies: [],
    bigEnemies: [],
    bullets: [],
    communityScore: 0,
}
//end variables

//functions
function checkHeroes(){
    for(hero = 0; hero < gameObject.heroes.length; hero++){
        for(i = 0; i < gameObject.enemies.length; i++) {
            var xDiff = heroes[hero].x - gameObject.enemies[i].x,
                yDiff = heroes[hero].y - gameObject.enemies[i].y;
            if(xDiff < 20 && xDiff > -20 && yDiff < 20 && yDiff > -20) {
                io.emit('explode', gameObject.heroes[hero].x, gameObject.heroes[hero].y);
                gameObject.enemies[i] = 'remove'
                gameObject.communityScore -= 500;
            }
        }
        
        for(i = 0; i < gameObject.bigEnemies.length; i++) {
            var xDiff = hero.x - gameObject.bigEnemies[i].x,
                yDiff = hero.y - gameObject.bigEnemies[i].y;
            if(xDiff < 20 && xDiff > -20 && yDiff < 20 && yDiff > -20) {
                io.emit('explode', gameObject.heroes[hero].x, gameObject.heroes[hero].y);
                gameObject.bigEnemies[i] = 'remove'
                gameObject.communityScore -= 500;
            }
        }
    }
}

function moveEnemies() {
    if(gameObject.enemies.length < 7) {
        var xPos = (Math.random() * 900) + 50;
        if(gameObject.enemiesAdded % 15 == 0) {
            gameObject.bigEnemies.push({x: xPos, y: -10})
        } else {
            gameObject.enemies.push({x: xPos, y: -10})
        }
    gameObject.enemiesAdded += 1;
    }
    for (i = 0; i < gameObject.enemies.length; i++) {
        gameObject.enemies[i].y += 1;
        if (gameObject.enemies[i].y > 550) {
            gameObject.communityScore -= 10;
            gameObject.enemies[i] = 'remove'
        }
    }
    for (i = 0; i < gameObject.bigEnemies.length; i++) {
        gameObject.bigEnemies[i].y += 1.5;
        if (gameObject.bigEnemies[i].y > 550) {
            gameObject.communityScore -= 10;
            gameObject.bigEnemies[i] = 'remove'
        }
    }
}

function moveBullets() {
    console.log(gameObject.bullets)
    if (gameObject.bullets.length > 0) {
        for (i = 0; i < gameObject.bullets.length; i++) {
            gameObject.bullets[i].y -= 15;
            if (gameObject.bullets[i].y < -10) {
                gameObject.bullets[i] = 'remove';
            } else {
                for (j = 0; j < gameObject.enemies.length; j++) {
                    var yDiff = gameObject.bullets[i].y - gameObject.enemies[j].y,
                        xDiff = gameObject.bullets[i].x - gameObject.enemies[j].x;
                    if (xDiff < 30 && xDiff > -30 && yDiff < 10 && yDiff > -10) {
                        io.emit('explode', gameObject.enemies[j].x, gameObject.enemies[j].y);
                        gameObject.bullets[i] = 'remove';
                        gameObject.enemies[j] = 'remove';
                        gameObject.communityScore += 10;
                    }
                }
                for (j = 0; j < gameObject.bigEnemies.length; j++) {
                    var yDiff = gameObject.bullets[i].y - gameObject.bigEnemies[j].y,
                        xDiff = gameObject.bullets[i].x - gameObject.bigEnemies[j].x;
                    if (xDiff < 60 && xDiff > -30 && yDiff < 40 && yDiff > -10) {
                        io.emit('explode', gameObject.bigEnemies[j].x, gameObject.bigEnemies[j].y);
                        gameObject.bullets[i] = 'remove';
                        gameObject.bigEnemies[j] = 'remove';
                        gameObject.communityScore += 10;
                    }
                }
            }
        }
    }
}

function shootBullet(x,y) {
    gameObject.bullets.push({'y':y, 'x':x});
}

function remove() {
    gameObject.bullets = gameObject.bullets.filter(function (element) {
        return element !== 'remove';
    });

    gameObject.enemies = gameObject.enemies.filter(function (element) {
        return element !== 'remove';
    });

    gameObject.bigEnemies = gameObject.bigEnemies.filter(function (element) {
        return element !== 'remove';
    });

}

function gameLoop(){
    //moveHeroes()
    checkHeroes()
    moveEnemies()
    moveBullets()
    remove()
}
//end functions


//routes
// root route to render the index.ejs view
app.get('/', function (req, res) {
    res.render("index");
})
// post route for adding a user
//end routes


// tell the express app to listen on port 8000
var server = app.listen(8000, function () {
    console.log("listening on port 8000");
});
//sockets
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    let localName;
    socket.on('updatePlayer', function (data) {
        //sends in individual info that needs to be added to the gameObject
        switch(data.key){
            case 'up':
            //update specific player's vertical pos skyward
                gameObject.heroes[data.name].x -= 5
                break;
            case 'right':
                //update specific player's horizontal pos right
                gameObject.heroes[data.name].y += 5
                break;
            case 'down':
                //update specific player's vertical pos down
                gameObject.heroes[data.name].x += 5
                break;
            case 'left':
                //update specific player's horizontal pos left
                gameObject.heroes[data.name].y -= 5
                break;
            case 'space':
                //create bullet based hero x and y
                shootBullet(gameObject.heroes[data.name].y, gameObject.heroes[data.name].x)
                console.log(gameObject.heroes[data.name].y, gameObject.heroes[data.name].x)
                io.emit('shootNoise')
                gameObject.heroes[data.name].y
                break;
            
        }
    })
    socket.on('playerJoin', function (data) {
        //sends in player name and triggers event to add a new player to the heroes array with given name.
        localName = data.name;
        gameObject.heroes[data.name] = {x:150, y:250}
    })
    socket.on("disconnect", function() {
        gameObject.heroes[localName] = undefined;
    })
    setInterval(function() {
        gameLoop()
        io.emit('updateGame', {response:gameObject})
        // console.log('.')
    }, 50)
})
//end sockets