import Phaser, { LEFT, RIGHT } from 'phaser'
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
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

var ballspd = 3;

var scores = [0, 0];
var scoreText;
var timer = 60;
var timerText;
var aidifficulty = 0.1; //difficulty is from 0 to 1. 0 = low difficulty, 1 = impossible
var aiText;
var gameSpeed = 1;
var gSpeedText;

var timedEvent;
var tglpflash = [false, false]; //player flash triggers  (VFX)

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

    for (var i = 0; i < 6; i++) {
        balls[i] = this.physics.add.image(145 + 100 * i, 300, 'sqr');
        balls[i].scaleX = 30;
        balls[i].scaleY = 30;
        balls[i].tint = 0xff0000;
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

    initMovement(); //sets ball directions evenly

    // ui initialization
    scoreText = this.add.text(12, 12, 'S: P10|P20', { fontSize: '12px', fill: '#fff' });
    timerText = this.add.text(12, 24, 'T: 60', { fontSize: '12px', fill: '#fff' });
    aiText = this.add.text(12, 36, 'D: 0.1', { fontSize: '12px', fill: '#00bfff' });
    gSpeedText = this.add.text(12, 48, 'GS: 1', { fontSize: '12px', fill: '#00bfff' })


    //10hz timer
    timedEvent = this.time.addEvent({ delay: 100, callback: onEvent, callbackScope: this, loop: true });

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
        ballV[playerPos[1]] *= -1;
        tglpflash[1] = true;
        players[1].tint = 0xffffff;
    }
    //difficulty toggling
    if (Phaser.Input.Keyboard.JustDown(tgldiff)) {
        if (aidifficulty < 0.9) {
            aidifficulty += 0.1;
        }
        else {
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

    //controlling AI via greedy
    playerPos[0] = AIControl();

    //moving players on the board
    for (var i = 0; i < 2; i++) {
        players[i].x = 145 + 100 * playerPos[i];
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
        if (balls[i].y - 75 < mindist && ballV[i] == -1) {
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
        players[0].tint = 0xffffff;
    }


    return mindx;

}
function moveBalls() {
    for (var i = 0; i < 6; i++) {

        if (balls[i].y >= 525) {
            ballV[i] = -1;
            scores[0] += 1;
        }
        else if (balls[i].y <= 75) {
            ballV[i] = 1;
            scores[1] += 1;
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
        players[0].tint = 0xffff00;
        tglpflash[0] = false;
    }
}

function uiUpdate() {
    scoreText.setText("S " + scores[1] + "|" + scores[0]);
    timerText.setText("T " + timer.toFixed(1) + "s");
    aiText.setText("D<Q>: " + aidifficulty.toFixed(1));
    gSpeedText.setText("spd<E>: " + gameSpeed.toFixed(2));
}

function update() {
    moveBalls();
    drawPlayer();
    uiUpdate();
}

