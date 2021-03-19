import Phaser, {
    LEFT,
    RIGHT
} from 'phaser'
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0
            },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: "gameDiv",

};

var game = new Phaser.Game(config);
var balls = []; //holds sprites
var cursors; //holds cursor inputs
var gamecols = []; //holds sprites
var players = []; //holds sprites
var ballV = []; //ball velocities
var playerPos = [];

var left;
var right;
var space;
var tgldiff;
var tglgspeed;
var tglpspeed;

var ballspd = 3;

var scores = [0, 0];
var scoreText;
var timer = 60;
var timerText;
var aidifficulty = 0.1; //difficulty is from 0 to 1. 0 = low difficulty, 1 = impossible
var aiText;
var gameSpeed = 0.5;
var gSpeedText;
var pSpeedText;
var n_plr_speed = 0.05; //normalized speed of player. 0 = stopped, 1 = instant

var timedEvent;
var tglpflash = [false, false]; //player flash triggers  (VFX)

var isPoisonedItem = [0, 0, 0, 0, 0, 0];

function preload() {
    this.load.image('sqr', 'assets/pxl.png');
    this.load.crossOrigin = 'anonymous';

}

function create() {
    // var imgsqr  = this.add.image(400, 300, 'sqr');

    for (var i = 0; i < 6; i++) {
        gamecols[i] = this.physics.add.image(145 + 100 * i, 300, 'sqr');
        gamecols[i].scaleX = 45;
        gamecols[i].scaleY = 450;
    }

    //initialize item valence
    flipRandomItem();
    flipRandomItem();

    for (var i = 0; i < 6; i++) {
        balls[i] = this.physics.add.image(145 + 100 * i, 300, 'sqr');
        balls[i].scaleX = 30;
        balls[i].scaleY = 30;

        if (isPoisonedItem[i]) balls[i].tint = 0xff0000;
        else balls[i].tint = 0x11ff33

    }

    //players [0] is AI controller
    players[0] = this.physics.add.image(345, 25, 'sqr');
    players[0].scaleX = 30;
    players[0].scaleY = 30;
    players[0].tint = 0xffff00;

    //players [1] is player controller
    players[1] = this.physics.add.image(445, 575, 'sqr');
    players[1].scaleX = 30;
    players[1].scaleY = 30;

    players[1].tint = 0xff00ff;
    playerPos[0] = 3;
    playerPos[1] = 4;
    // cursors = this.input.keyboard.createCursorKeys();
    left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    tgldiff = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    tglgspeed = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    tglpspeed = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);


    initMovement(); //sets ball directions evenly


    // ui initialization
    scoreText = this.add.text(12, 12, 'S: P10|P20', {
        fontSize: '12px',
        fill: '#fff'
    });
    timerText = this.add.text(12, 24, 'T: 60', {
        fontSize: '12px',
        fill: '#fff'
    });
    aiText = this.add.text(12, 36, 'D: 0.1', {
        fontSize: '12px',
        fill: '#00bfff'
    });
    gSpeedText = this.add.text(12, 48, 'GS: 1', {
        fontSize: '12px',
        fill: '#00bfff'
    })
    pSpeedText = this.add.text(12, 60, 'PS: 1', {
        fontSize: '12px',
        fill: '#00bfff'
    })

    //10hz timer
    timedEvent = this.time.addEvent({
        delay: 100,
        callback: onEvent,
        callbackScope: this,
        loop: true
    });

}

function initMovement() {
    for (var i = 0; i < 6; i++) {
        ballV[i] = Math.random() < 0.5 ? 1 : -1;
    }
}

function drawPlayer() {
    //player kb control
    if (Phaser.Input.Keyboard.JustDown(left)) {
        if (playerPos[1] > 0) {
            playerPos[1]--;
        }
    }
    if (Phaser.Input.Keyboard.JustDown(right)) {
        if (playerPos[1] < 5) {
            playerPos[1]++;
        }
    }
    if (Phaser.Input.Keyboard.JustDown(space)) {
        if (checkPlayerAlignment()) {
            ballV[playerPos[1]] *= -1;
            tglpflash[1] = true;
            players[1].tint = 0xff00ff;
        }
    }
    //difficulty toggling
    if (Phaser.Input.Keyboard.JustDown(tgldiff)) {
        if (aidifficulty < 0.9) {
            aidifficulty += 0.1;
        } else {
            aidifficulty = 0.1;
        }
    }
    //gamespeed toggling
    if (Phaser.Input.Keyboard.JustDown(tglgspeed)) {
        if (gameSpeed < 3) {
            gameSpeed += 0.25;
        } else {
            gameSpeed = 0.25;
        }
    }
    if (Phaser.Input.Keyboard.JustDown(tglpspeed)) {
        //increment by 0.1 and cycle arond to 0.1
        n_plr_speed = (((n_plr_speed * 20) + 1) % 20) / 20;
    }

    //color setting
    if (!checkPlayerAlignment()) players[1].tint = 0xff0000;
    else players[1].tint = 0x0000ff;
    if (tglpflash[1]) players[1].tint = 0xffffff;

    //controlling AI via greedy
    playerPos[0] = AIControl();

    //moving players on the board
    for (var i = 0; i < 2; i++) {

        //computing delta
        let tgtx = 145 + 100 * playerPos[i]; //tiles are one apart
        let delta = tgtx - players[i].x;
        if (Math.abs(delta) > 0.01) { //could do sgn(delta) * 100/speeddiv -> speeddiv = 1 means move 1 row per tick
            //decaying exponential displacement (feels better!)
            players[i].x += delta * n_plr_speed; //if n_plr_speed == 1, instant adjust. 

            //linear displacement (more realistic)
            //going to need to round this it doesn't work on a tick-basis
            // players[i].x += Math.sign(delta) * 20 * n_plr_speed; 
        }
    }
}

function AIControl() {
    //perfect greedy
    // var tgtrow;
    //foreach
    var mindist = 999;
    var mindx = 0;
    for (var i = 0; i < 6; i++) {
        //check direction and minimize distance
        if (isPoisonedItem[i] && balls[i].y - 75 < mindist && ballV[i] == -1) {
            mindist = balls[i].y - 75;
            mindx = i;
        }
    }

    //hit the ball - distance is important:
    //mindist threshold (mindist < threshold) is equivalent to reaction time
    //aidifficulty is equivalent to misschance - ratio should be Th, 1/Th
    if (mindist < aidifficulty * 50 && Math.random() < 0.1 * aidifficulty) {
        ballV[mindx] *= -1;
        tglpflash[0] = true;
        players[0].tint = 0xff99ff;
    }
    return mindx;
}

function moveBalls() {
    for (var i = 0; i < 6; i++) {

        if (balls[i].y >= 525) {

            ballV[i] = -1;
            //parsing valence
            //if it is poisoned, subtract one from player scores
            if (isPoisonedItem[i]) {
                scores[1] -= 1;
                isPoisonedItem[i] = 0;
                flipRandomItem();
            } else {
                //if not poisoned, don't change things

                scores[1] += 1;
            }


        } else if (balls[i].y <= 75) {

            ballV[i] = 1;
            scores[1] += 1;

            //if it is poisoned, subtract one from player scores
            if (isPoisonedItem[i]) {
                scores[0] -= 1;
                isPoisonedItem[i] = 0;
                flipRandomItem();
            } else {
                //if not poisoned, don't change things
                scores[0] += 1;
            }
        }
        balls[i].y += ballV[i] * ballspd * gameSpeed;
    }
}

function onEvent() {
    timer -= 0.1;

    //flashvfx toggle
    if (tglpflash[1] && Math.random() < 0.5) {
        players[1].tint = 0xff00ff;
        tglpflash[1] = false;
    }
    if (tglpflash[0] && Math.random() < 0.5) {
        players[0].tint = 0xee33ff;
        tglpflash[0] = false;
    }
}

function uiUpdate() {
    scoreText.setText("S " + scores[1] + "|" + scores[0]);
    timerText.setText("T " + timer.toFixed(1) + "s");
    aiText.setText("D<Q>: " + aidifficulty.toFixed(1));
    gSpeedText.setText("game spd<E>: " + gameSpeed.toFixed(2));
    pSpeedText.setText("mvt spd<X>: " + n_plr_speed.toFixed(2));
}

function update() {
    moveBalls();
    drawBalls();
    drawPlayer();
    uiUpdate();
}

//returns true if player is at the targeted lane 
function checkPlayerAlignment() {
    let tgtx = 145 + 100 * playerPos[1];
    let delta = tgtx - players[1].x;
    if (Math.abs(delta) < 20) return true;
    return false;
}

function flipRandomItem() {
    //item setup -> generate random
    var choice = Math.floor(Math.random() * isPoisonedItem.length);
    while (1) {
        if (isPoisonedItem[choice] == 0) {
            isPoisonedItem[choice] = 1;
            break;
        }
        choice = Math.floor(Math.random() * isPoisonedItem.length)
    }
    console.log(isPoisonedItem);
}

//sets colour of balls based on valence
function drawBalls() {
    for (var i = 0; i < 6; i++) {
        if (isPoisonedItem[i]) balls[i].tint = 0xff0000;
        else balls[i].tint = 0x11ff33
    }
}