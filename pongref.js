var WINDOW_HEIGHT = 400,
    WINDOW_WIDTH = 600,
    SPEED = 300;

var mainState = {
    
    preload: function() {      
        game.load.crossOrigin = 'anonymous';
        
        game.load.image('wall', 'https://i.imgur.com/WQUKFVC.png');
        game.load.image('ball', 'https://i.imgur.com/xtFdsIU.png');
    },
    
    create: function() {
        // Game key input
        // Arrows
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        game.physics.arcade.checkCollision.right = false;
        game.physics.arcade.checkCollision.left = false;
        
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, 
                                          Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT]);
        this.cursor = game.input.keyboard.createCursorKeys();
        
        // WASD
        this.wasd = {
            up: game.input.keyboard.addKey(Phaser.Keyboard.W),
            down: game.input.keyboard.addKey(Phaser.Keyboard.S)
        };
        
        // Load player
        this.player = game.add.sprite(30, game.world.centerY, 'wall');
        this.player.anchor.setTo(0.5, 0.5);
        this.player.scale.x = 0.55;
        this.player.scale.y = 0.25;
        game.physics.arcade.enable(this.player);
        this.player.body.collideWorldBounds = true;
        this.player.body.immovable = true;
        
        // Load enemy 
        this.enemy = game.add.sprite(WINDOW_WIDTH - 30, game.world.centerY, 'wall');
        this.enemy.anchor.setTo(0.5, 0.5);
        this.enemy.scale.x = 0.55;
        this.enemy.scale.y = 0.25;
        game.physics.arcade.enable(this.enemy);
        this.enemy.body.collideWorldBounds = true;
        this.enemy.body.immovable = true;
        
        this.ball = game.add.sprite(game.world.centerX, game.world.centerY, 'ball');
        game.physics.arcade.enable(this.ball);
        this.ball.body.velocity.set(-200, 0);
        this.ball.onPaddlePlayer = false;
        this.ball.onPaddleEnemy = false;
        this.ball.body.bounce.set(1);
        this.ball.body.collideWorldBounds = true;
        //this.ball.anchor.setTo(0.5, 0.5);
    },
    
    update: function() {
        
        // Check for keyboard input, either arrows for player, wasd for enemy
        this.movePlayer();
        this.moveEnemy();
        this.ballCollision();
        
        if (this.ball.onPaddlePlayer) {
            this.ball.body.velocity.y = ((Math.random() * 50) + this.player.body.velocity.y);
            this.ball.body.velocity.x += (0.1) * this.ball.body.velocity.x;
            this.ball.onPaddlePlayer = false;
        }
        else if (this.ball.onPaddleEnemy) {
            this.ball.body.velocity.y = ((Math.random() * 50) + this.enemy.body.velocity.y);
            this.ball.body.velocity.x += (0.1) * this.ball.body.velocity.x;
            this.ball.onPaddleEnemy = false;
        }
        
        if (this.ball.x >= game.width) {
            this.ballLost();
        }
        else if (this.ball.x <= 0) {
            this.ballLost();
        }
        
    },
    
    movePlayer: function() {
        if (this.wasd.up.isDown) {
            this.player.body.velocity.y = -1 * SPEED;
        }
        else if (this.wasd.down.isDown) {
            this.player.body.velocity.y = SPEED;
        }
        else {
            this.player.body.velocity.y = 0;
        }
    },
    
    moveEnemy: function() {
        if (this.cursor.up.isDown) {
            this.enemy.body.velocity.y = -SPEED;
        }
        else if (this.cursor.down.isDown) {
            this.enemy.body.velocity.y = SPEED;
        }
        else {
            this.enemy.body.velocity.y = 0;
        }
    },
    
    ballCollision: function() {
        this.ball.onPaddlePlayer = this.ball.onPaddleEnemy = false;
        game.physics.arcade.collide(this.player, this.ball, function() { this.ball.onPaddlePlayer = true; }, null, this);
        game.physics.arcade.collide(this.enemy, this.ball, function() { this.ball.onPaddleEnemy = true; }, null, this);
    },
    
    ballLost: function() {
        this.ball.reset(game.world.centerX, game.world.centerY);
        game.time.events.add(2000, function() { this.ball.body.velocity.set(-200,0); }, this);
    }
};

var game = new Phaser.Game(WINDOW_WIDTH, WINDOW_HEIGHT, Phaser.AUTO, 'gameDiv', mainState);