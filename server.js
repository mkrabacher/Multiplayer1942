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
    heroes: {
        'steve':{x:200, y:300},
        'joe':{x:150, y:100}
    },
    enemies: [],
    bigEnemies: [],
    bullets: [],
    communityScore: 0,

}
//end variables

//functions
function moveEnemies() {
    for (i = 0; i < enemies.length; i++) {
        enemies[i].y += 1;
        if (enemies[i].y > 550) {
            score -= 10;
            enemies[i] = 'remove'
        }
    }
    for (i = 0; i < bigEnemies.length; i++) {
        bigEnemies[i].y += 1.5;
        if (bigEnemies[i].y > 550) {
            score -= 10;
            bigEnemies[i] = 'remove'
        }
    }
}

function moveBullets() {
    if (bullets.length > 0) {
        for (i = 0; i < bullets.length; i++) {
            bullets[i].y -= 15;
            if (bullets[i].y < -10) {
                bullets[i] = 'remove';
            } else {
                for (j = 0; j < enemies.length; j++) {
                    var yDiff = bullets[i].y - enemies[j].y,
                        xDiff = bullets[i].x - enemies[j].x;
                    if (xDiff < 30 && xDiff > -30 && yDiff < 10 && yDiff > -10) {
                        io.emit('explode', enemies[j].x, enemies[j].y);
                        bullets[i] = 'remove';
                        enemies[j] = 'remove';
                        score += 10;
                    }
                }
                for (j = 0; j < bigEnemies.length; j++) {
                    var yDiff = bullets[i].y - bigEnemies[j].y,
                        xDiff = bullets[i].x - bigEnemies[j].x;
                    if (xDiff < 60 && xDiff > -30 && yDiff < 40 && yDiff > -10) {
                        io.emit('explode', bigEnemies[j].x, bigEnemies[j].y);
                        bullets[i] = 'remove';
                        bigEnemies[j] = 'remove';
                        score += 10;
                    }
                }
            }
        }
    }
}

function shootBullet(x,y) {
    bullets.push(x,y);
}

function remove() {
    bullets = bullets.filter(function (element) {
        return element !== 'remove';
    });

    enemies = enemies.filter(function (element) {
        return element !== 'remove';
    });

    bigEnemies = bigEnemies.filter(function (element) {
        return element !== 'remove';
    });

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
    socket.on('updatePlayer', function (data) {
        //sends in individual info that needs to be added to the gameObject
        switch(data.key){
            case 'up':
                //update specific player's vertical pos skyward
                heroes[data.name].y -= 5
                break;
            case 'right':
                //update specific player's horizontal pos right
                heroes[data.name].x += 5
                break;
            case 'down':
                //update specific player's vertical pos down
                heroes[data.name].y += 5
                break;
            case 'left':
                //update specific player's horizontal pos left
                heroes[data.name].x -= 5
                break;
            case 'space':
                //create bullet based hero x and y
                shootBullet(heroes[data.name].x, heroes[data.name].y)
                io.emit('shootNoise')
                heroes[data.name].y
                break;
            
        }
    })
    socket.on('playerJoin', function (data) {
        //sends in player name and triggers event to add a new player to the heroes array with given name.
        heroes[data.name] = {x:150, y:250}
    })
    setInterval(function() {
        // gameLoop()
        io.emit('updateGame', {resposne:gameObject})
        // console.log('.')
    }, 50)
})
//end sockets