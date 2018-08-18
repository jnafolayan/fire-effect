(function() {

    function Sketch(opts) {
        this.width = opts.size[0];
        this.height = opts.size[1];
        this.context = null;
        this.canvas = null;

        this.rnd = new Sketch.Random();

        for (let k in opts) {
            if (typeof opts[k] == 'function') {
                this[k] = opts[k];
            }
        }

        // setTimeout(() => {
            this.initialize();
        // }, 1000);
    }

    Sketch.prototype = {
        initialize: function() {
            const { width, height } = this;
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            document.body.appendChild(canvas);

            // Rendering
            this.context = canvas.getContext('2d');
            this.canvas = canvas;

            this.initializeLoop();
        },

        add: function(ent) {
            this.entities.push(ent);
        },

        getContext: function() {
            return this.context;
        },

        initializeLoop: function() {
            let _this = this;
            let hasCalledSetup = false;

            function loop() {
                if (!hasCalledSetup) {
                    _this.setup();
                    hasCalledSetup = true;
                }
                
                if (_this.render)
                    _this.render();
                    
                requestAnimationFrame(loop);
            }

            requestAnimationFrame(loop);
        },

        setBackground: function(color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.width, this.height);
        },

        setFill: function(color) {
            this.context.fillStyle = color;
        },

        setAlpha: function(a) {
            this.context.globalAlpha = a;
        },

        rect: function(x, y, w, h) {
            this.context.fillRect(x, y, w, h);
        },

        circle: function(x, y, r) {
            this.context.beginPath();
            this.context.arc(x, y, r, 0, 2 * Math.PI, false);
        },

        fill: function() {
            this.context.fill();
        },

        clamp: function(x, min, max) {
            return x < min ? min : x > max ? max : x;
        }
    };

    window.Sketch = Sketch;

    Sketch.Random = function() {
    };

    Sketch.Random.prototype = {
        random: function(a, b) {
            if (!b) {
                b = a;
                a = 0;
            }
            return a + Math.random() * (b - a);
        },

        pick: function(arr) {
            let r = this.random(0, arr.length) >> 0;
            return arr[r];
        },

        weightedRandom: function(opts) {
            let total = opts.reduce((a, b) => a + b.prob, 0);
            let prob = this.random(0, total + 1) >> 0;

            for (let i = 0; i < opts.length; i++) {
                let opt = opts[i];
                if (prob < opt.prob) {
                    return opt.value;
                }
                prob -= opt.prob;
            }

            return this.pick(opts).value;
        }
    };

    Sketch.ParticleEmitter = function(x, y, opts) {
        this.x = x;
        this.y = y;
        this.particles = [];

        for (let k in opts) {
            if (typeof opts[k] == 'function') {
                this[k] = opts[k];
            }
        }
    };

    Sketch.ParticleEmitter.prototype = {
        size: function() {
            return this.particles.length;
        },

        add: function(p) {
            this.particles.push(p);
            return p;
        }
    };

})();

(function() {

    let sketch = new Sketch({
        size: [Math.min(640, window.innerWidth), Math.min(480, window.innerHeight)],

        setup: function() {
            let { rnd } = this;
            this.particles = [];
            let t = 0;
            for (let x = this.width * 0.2; x < this.width; x += this.width * 0.2)
            {
                let ps = new Sketch.ParticleEmitter(x, this.height / 2 + Math.sin(t / 10) * 40, {
                    create: function(opts) {
                        opts.alive = true;
                        return this.add(opts);
                    },
                    
                    render: function(sk) {
                        sk.context.save();
                        sk.context.translate(this.x, this.baseY + 50);
                        sk.context.scale(1, 0.3);
                        sk.setAlpha(1);
                        sk.circle(0, 0, 40 + Math.sin(this.tick / 20) * 5, 0, 2 * Math.PI);
                        sk.setFill(`hsla(${this.baseHue},100%,55%,0.15)`);
                        sk.fill();
                        sk.circle(0, 0, 10 + Math.sin(this.tick / 20) * 5, 0, 2 * Math.PI);
                        sk.setFill(`hsla(${this.baseHue},100%,75%,0.45)`);
                        sk.fill();
                        sk.context.restore();

                        this.y = this.baseY + Math.sin(this.tick / 20) * 20;
                        
                        for (let p of this.particles)
                        {
                            p.hue = this.baseHue + (1 - p.alpha) * 50;
                            sk.setFill(`hsla(${p.hue},100%,55%,${p.alpha * 0.5})`);
                            sk.circle(p.x + this.x, p.y + this.y, p.radius);
                            sk.fill();
                        }
                    },

                    update: function(sketch) {
                        for (let p of this.particles)
                        {
                            p.x += p.vx;
                            p.y += p.vy;
                            p.alpha -= p.decay;
                            p.radius -= p.decay * 11;

                            if (p.radius < 0 || p.alpha < 0) {
                                p.alive = false;
                            }
                        }

                        this.particles = this.particles.filter(function(p) {
                            return p.alive;
                        });
                    }
                });

                ps.baseHue = (x - this.width * 0.2) / this.width * 360;
                ps.tick = rnd.random(0, 60) >> 0;
                ps.baseY = ps.y;
                this.particles.push(ps);

                t += 10;
            }

            this.setBackground('rgb(0,0,0)');

            this.tick = 0;
        },

        render: function() {
            this.particles.forEach(ps => ps.update(this));

            // draw
            let { context: ctx, walker, hue, width, height } = this;

            this.setBackground('#000');

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            this.tick++;

            this.setFill('#fff');
            ctx.font = '28px consolas';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';
            ctx.fillText('Fire Effect', width / 2, 30);

            ctx.fillRect(width * 0.4, 80, width * 0.2, 1);

            ctx.font = '14px consolas';
            this.setFill('#ddd');
            ctx.fillText('Created by John Afolayan ©2018', width / 2, height - 30);
            
            this.particles.forEach(ps => ps.render(this));

            for (let ps of this.particles)
            {
                if (ps.size() < 100)
                {
                    ps.create({
                        x: this.rnd.random(-15, 15) * 0,
                        y: this.rnd.random(0, -40) * 0,
                        radius: this.rnd.random(10, 15),
                        alpha: 1,
                        decay: this.rnd.random(0.01, 0.06),
                        vx: Math.sin(ps.tick++ / 30) * this.rnd.random(0.6, 0.12),
                        vy: this.rnd.random(-0.5, -1.5)
                    });
                }
            }

            ctx.restore();
        },

        getWalkerStep: function({ opts }) {
            return this.rnd.weightedRandom(opts);
        }
    });

})();