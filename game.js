(function (window, $, undefined) {

	var canvasElement, canvas, CANVAS_WIDTH, CANVAS_HEIGHT;

	window.Game = {
		init: function (id) {
			canvasElement = document.getElementById(id);
			canvas = canvasElement.getContext('2d');
			CANVAS_WIDTH = canvasElement.width = $(window).width();
			CANVAS_HEIGHT = canvasElement.height = $(window).height();

			$(document).bind("mousedown", function() {
				player.shoot();
			});

			$(window).resize(function() {
				Game.init('canvas');
			});
		}
	}


	var playerBullets = [];
	var enemies = [];
	var score = 0;

	var background = new Image(), 
		bgX = 0,
		bgY = 0,
		bgY2 = -CANVAS_WIDTH;

	background.src = 'images/starfield.jpg';
	var pattern;
	background.onload = function () {
		pattern = canvas.createPattern(background, 'repeat');
	}


	/*===== Classes =====*/
	var player = {
		color: "#00A",
		x: 220,
		y: 270,
		width: 32,
		height: 32,
		sprite: Sprite("player"),
		speed: 4,
		active: true,
		draw: function() {
			this.sprite.draw(canvas, this.x, this.y);
		},
		explode: function() {
			this.active = false;
		},
		shoot: function() {
			var angle = angleToTarget();

			playerBullets.push(Bullet({
				speed: 6,
				radian: angle,
				x: this.x,
				y: this.y
			}));
		},
		midpoint: function() {
			return {
				x: this.x + this.width / 2,
				y: this.y + this.height / 2
			};
		}
	};


	function Enemy(I) {
		I = I || {};

		I.active = true;
		I.age = Math.floor(Math.random() * 128);

		I.sprite = Sprite("enemy");

		I.x = CANVAS_WIDTH / 4 + Math.random() * CANVAS_WIDTH / 2;
		I.y = 0;
		I.xVelocity = 0;
		I.yVelocity = 2;

		I.width = 32;
		I.height = 32;

		I.explode = function() {
			this.active = false;
		};

		I.inBounds = function() {
			return I.x >= 0 && I.x <= CANVAS_WIDTH && I.y >= 0 && I.y <= CANVAS_HEIGHT;
		};

		I.draw = function() {
			this.sprite.draw(canvas, this.x, this.y);
		};

		I.update = function() {
			I.x += I.xVelocity;
			I.y += I.yVelocity;

			I.xVelocity = 3 * Math.sin(I.age * Math.PI / 64);

			I.age++;

			I.active = I.active && I.inBounds();
		};

		return I;
	}


	function Bullet(I) {
		I.active = true;

		I.xVelocity = I.speed * Math.cos(I.radian);
		I.yVelocity = I.speed * Math.sin(I.radian);
		I.width = 3;
		I.height = 3;
		I.color = "#FFF";

		I.inBounds = function() {
			return I.x >= 0 && I.x <= CANVAS_WIDTH && I.y >= 0 && I.y <= CANVAS_HEIGHT;
		};

		I.draw = function() {
			canvas.fillStyle = this.color;
			canvas.fillRect(this.x, this.y, this.width, this.height);
		};

		I.update = function() {
			I.x += I.xVelocity;
			I.y += I.yVelocity;

			I.active = I.active && I.inBounds();
		};

		return I;
	}


	/*===== Other Functions =====*/

	function handleCollisions() {
		playerBullets.forEach(function(bullet) {
			enemies.forEach(function(enemy) {
				if (collides(bullet, enemy)) {
					enemy.explode();
					bullet.active = false;
					score += 1;
				}
			});
		});

		enemies.forEach(function(enemy) {
			if (collides(enemy, player)) {
				enemy.explode();
				player.explode();
			}
		});
	}


	function drawBackground() {
		canvas.fillStyle = pattern;
		canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		canvas.fillStyle = 'white';
		canvas.font = '80pt Arial';
		canvas.textAlign = 'right';
		canvas.fillText(score, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 30);
		/*
		canvas.drawImage(background, bgX, bgY);
		canvas.drawImage(background, bgX, bgY2);

		if (bgY > CANVAS_HEIGHT) {
			bgY = -CANVAS_HEIGHT + 1;
		}
		if (bgY2 > CANVAS_HEIGHT) {
			bgY2 = -CANVAS_HEIGHT + 1;
		}
		bgY += 1;
		bgY2 += 1;
		*/
	}


	/*===== Physics =====*/

	function collides(a, b) {
		return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
	}

	function angleToTarget() {
		var origin = player.midpoint();
		var mouseX = event.clientX;
		var mouseY = event.clientY;

		return Math.atan2(mouseY - origin.y, mouseX - origin.x);
	}


	/*===== Game Loop =====*/
	var FPS = 30;
	var gameOver = setInterval(function() {
		update();
		draw();
	}, 1000 / FPS);


	function update() {
		if (!player.active) {
			clearInterval(gameOver);
		} else {
			if (keydown.left) {
				player.x -= player.speed;
			}
			if (keydown.right) {
				player.x += player.speed;
			}
			if (keydown.up) {
				player.y -= player.speed;
			}
			if (keydown.down) {
				player.y += player.speed;
			}

			player.x = player.x.clamp(0, CANVAS_WIDTH - player.width);
			player.y = player.y.clamp(0, CANVAS_HEIGHT - player.height);

			playerBullets.forEach(function(bullet) {
				bullet.update();
			});

			playerBullets = playerBullets.filter(function(bullet) {
				return bullet.active;
			});

			enemies.forEach(function(enemy) {
				enemy.update();
			});

			enemies = enemies.filter(function(enemy) {
				return enemy.active;
			});

			if (Math.random() < 0.05) {
				enemies.push(Enemy());
			}

			handleCollisions();
		}
	}

	function draw() {
		canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		drawBackground();
		playerBullets.forEach(function(bullet) {
			bullet.draw();
		});
		player.draw();
		enemies.forEach(function(enemy) {
			enemy.draw();
		});

		if (!player.active) {
			canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			drawBackground();
			canvas.fillStyle = 'white';
			canvas.textAlign = 'center';
			canvas.fillText("dead", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

})(window, jQuery);