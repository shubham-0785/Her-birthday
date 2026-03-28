(function(window) {

    function random(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function bezier(cp, t) {
        var p1 = cp[0].mul((1 - t) * (1 - t));
        var p2 = cp[1].mul(2 * t * (1 - t));
        var p3 = cp[2].mul(t * t);
        return p1.add(p2).add(p3);
    }

    function inheart(x, y, r) {
        var z = ((x/r)*(x/r)+(y/r)*(y/r)-1)*((x/r)*(x/r)+(y/r)*(y/r)-1)*((x/r)*(x/r)+(y/r)*(y/r)-1)-(x/r)*(x/r)*(y/r)*(y/r)*(y/r);
        return z < 0;
    }

    Point = function(x, y) { this.x = x || 0; this.y = y || 0; }
    Point.prototype = {
        clone: function() { return new Point(this.x, this.y); },
        add: function(o) { p = this.clone(); p.x += o.x; p.y += o.y; return p; },
        sub: function(o) { p = this.clone(); p.x -= o.x; p.y -= o.y; return p; },
        div: function(n) { p = this.clone(); p.x /= n; p.y /= n; return p; },
        mul: function(n) { p = this.clone(); p.x *= n; p.y *= n; return p; }
    }

    Heart = function() {
        var points = [], x, y, t;
        for (var i = 10; i < 30; i += 0.2) {
            t = i / Math.PI;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            points.push(new Point(x, y));
        }
        this.points = points;
        this.length = points.length;
    }
    Heart.prototype = {
        get: function(i, scale) { return this.points[i].mul(scale || 1); }
    }

    Seed = function(tree, point, scale, color) {
        this.tree = tree;
        var scale = scale || 1;
        var color = '#FFC0CB';
        this.heart = { point: point, scale: scale, color: color, figure: new Heart() };
        this.cirle = { point: point, scale: scale, color: color, radius: 5 };
    }
    Seed.prototype = {
        draw: function() { this.drawHeart(); this.drawText(); },
        addPosition: function(x, y) { this.cirle.point = this.cirle.point.add(new Point(x, y)); },
        canMove: function() { return this.cirle.point.y < (this.tree.height + 20); },
        move: function(x, y) { this.clear(); this.drawCirle(); this.addPosition(x, y); },
        canScale: function() { return this.heart.scale > 0.2; },
        setHeartScale: function(scale) { this.heart.scale *= scale; },
        scale: function(scale) { this.clear(); this.drawCirle(); this.drawHeart(); this.setHeartScale(scale); },
        drawHeart: function() {
            var ctx = this.tree.ctx, heart = this.heart;
            var point = heart.point, color = heart.color, scale = heart.scale;
            ctx.save();
            ctx.fillStyle = color;
            ctx.translate(point.x, point.y);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (var i = 0; i < heart.figure.length; i++) {
                var p = heart.figure.get(i, scale);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawCirle: function() {
            var ctx = this.tree.ctx, cirle = this.cirle;
            var point = cirle.point, color = cirle.color, scale = cirle.scale, radius = cirle.radius;
            ctx.save();
            ctx.fillStyle = color;
            ctx.translate(point.x, point.y);
            ctx.scale(scale, scale);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawText: function() {
            var ctx = this.tree.ctx, heart = this.heart;
            var point = heart.point, color = heart.color, scale = heart.scale;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.translate(point.x, point.y);
            ctx.scale(scale, scale);
            ctx.moveTo(0, 0);
            ctx.lineTo(15, 15);
            ctx.lineTo(130, 15);
            ctx.stroke();
            ctx.moveTo(0, 0);
            ctx.scale(0.75, 0.75);
            // FIX: corrected font syntax (comma -> space)
            ctx.font = "12px Verdana";
            ctx.fillText("Click Me:) ", 30, -5);
            ctx.fillText("Birthday Queen !", 28, 10);
            ctx.restore();
        },
        clear: function() {
            var ctx = this.tree.ctx, cirle = this.cirle;
            var point = cirle.point, scale = cirle.scale, radius = 26;
            var w = h = (radius * scale);
            ctx.clearRect(point.x - w, point.y - h, 4 * w, 4 * h);
        },
        hover: function(x, y) {
            var ctx = this.tree.ctx;
            var pixel = ctx.getImageData(x, y, 1, 1);
            return pixel.data[3] == 255;
        }
    }

    Footer = function(tree, width, height, speed) {
        this.tree = tree;
        this.point = new Point(tree.seed.heart.point.x, tree.height - height / 2);
        this.width = width;
        this.height = height;
        this.speed = speed || 2;
        this.length = 0;
    }
    Footer.prototype = {
        draw: function() {
            var ctx = this.tree.ctx, point = this.point;
            var len = this.length / 2;
            ctx.save();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = this.height;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.translate(point.x, point.y);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(len, 0);
            ctx.lineTo(-len, 0);
            ctx.stroke();
            ctx.restore();
            if (this.length < this.width) { this.length += this.speed; }
        }
    }

    Tree = function(canvas, width, height, opt) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.opt = opt || {};
        this.record = {};
        this.initSeed();
        this.initFooter();
        this.initBranch();
        this.initBloom();
    }
    Tree.prototype = {
        initSeed: function() {
            var seed = this.opt.seed || {};
            var x = seed.x || this.width / 2;
            var y = seed.y || this.height / 2;
            this.seed = new Seed(this, new Point(x, y), seed.scale || 1, seed.color || '#FF0000');
        },
        initFooter: function() {
            var footer = this.opt.footer || {};
            this.footer = new Footer(this, footer.width || this.width, footer.height || 5, footer.speed || 2);
        },
        initBranch: function() {
            this.branchs = [];
            this.addBranchs(this.opt.branch || []);
        },
        initBloom: function() {
            var bloom = this.opt.bloom || {};
            var cache = [], num = bloom.num || 500,
                width = bloom.width || this.width,
                height = bloom.height || this.height,
                figure = this.seed.heart.figure;
            for (var i = 0; i < num; i++) {
                cache.push(this.createBloom(width, height, 240, figure));
            }
            this.blooms = [];
            this.bloomsCache = cache;
        },
        toDataURL: function(type) { return this.canvas.toDataURL(type); },
        draw: function(k) {
            var rec = this.record[k];
            if (!rec) return;
            this.ctx.save();
            this.ctx.putImageData(rec.image, rec.point.x, rec.point.y);
            this.ctx.restore();
        },
        addBranch: function(branch) { this.branchs.push(branch); },
        addBranchs: function(branchs) {
            for (var i = 0; i < branchs.length; i++) {
                var b = branchs[i];
                this.addBranch(new Branch(this, new Point(b[0],b[1]), new Point(b[2],b[3]), new Point(b[4],b[5]), b[6], b[7], b[8]));
            }
        },
        removeBranch: function(branch) {
            for (var i = 0; i < this.branchs.length; i++) {
                if (this.branchs[i] === branch) { this.branchs.splice(i, 1); }
            }
        },
        canGrow: function() { return !!this.branchs.length; },
        grow: function() {
            for (var i = 0; i < this.branchs.length; i++) {
                if (this.branchs[i]) this.branchs[i].grow();
            }
        },
        addBloom: function(bloom) { this.blooms.push(bloom); },
        removeBloom: function(bloom) {
            for (var i = 0; i < this.blooms.length; i++) {
                if (this.blooms[i] === bloom) { this.blooms.splice(i, 1); }
            }
        },
        createBloom: function(width, height, radius, figure, color, alpha, angle, scale, place, speed) {
            var x, y;
            while (true) {
                x = random(20, width - 20);
                y = random(20, height - 20);
                if (inheart(x - width/2, height - (height-40)/2 - y, radius)) {
                    return new Bloom(this, new Point(x, y), figure, color, alpha, angle, scale, place, speed);
                }
            }
        },
        canFlower: function() { return !!this.blooms.length; },
        flower: function(num) {
            var s = this, blooms = s.bloomsCache.splice(0, num);
            for (var i = 0; i < blooms.length; i++) s.addBloom(blooms[i]);
            for (var j = 0; j < s.blooms.length; j++) s.blooms[j].flower();
        },
        snapshot: function(k, x, y, width, height) {
            var image = this.ctx.getImageData(x, y, width, height);
            this.record[k] = { image: image, point: new Point(x, y), width: width, height: height };
        },
        setSpeed: function(k, speed) { this.record[k || "move"].speed = speed; },
        move: function(k, x, y) {
            var rec = this.record[k || "move"];
            var point = rec.point, speed = rec.speed || 10;
            var i = point.x + speed < x ? point.x + speed : x;
            var j = point.y + speed < y ? point.y + speed : y;
            this.ctx.save();
            this.ctx.clearRect(point.x, point.y, rec.width, rec.height);
            this.ctx.putImageData(rec.image, i, j);
            this.ctx.restore();
            rec.point = new Point(i, j);
            rec.speed = Math.max(speed * 0.95, 2);
            return i < x || j < y;
        },
        jump: function() {
            var s = this, blooms = s.blooms;
            if (blooms.length) { for (var i = 0; i < blooms.length; i++) blooms[i].jump(); }
            if ((blooms.length && blooms.length < 3) || !blooms.length) {
                var bloom = this.opt.bloom || {}, width = bloom.width || this.width, height = bloom.height || this.height;
                for (var i = 0; i < random(1,2); i++) {
                    blooms.push(this.createBloom(width/2+width, height, 240, this.seed.heart.figure, null, 1, null, 1, new Point(random(-100,600), 720), random(200,300)));
                }
            }
        }
    }

    Branch = function(tree, point1, point2, point3, radius, length, branchs) {
        this.tree = tree;
        this.point1 = point1; this.point2 = point2; this.point3 = point3;
        this.radius = radius;
        this.length = length || 100;
        this.len = 0;
        this.t = 1 / (this.length - 1);
        this.branchs = branchs || [];
    }
    Branch.prototype = {
        grow: function() {
            if (this.len <= this.length) {
                var p = bezier([this.point1, this.point2, this.point3], this.len * this.t);
                this.draw(p);
                this.len += 1;
                this.radius *= 0.97;
            } else {
                this.tree.removeBranch(this);
                this.tree.addBranchs(this.branchs);
            }
        },
        draw: function(p) {
            var ctx = this.tree.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = '#FFC0CB';
            ctx.shadowBlur = 2;
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, this.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            // FIX: ctx.restore() was commented out — now restored to prevent canvas state leak
            ctx.restore();
        }
    }

    Bloom = function(tree, point, figure, color, alpha, angle, scale, place, speed) {
        this.tree = tree;
        this.point = point;
        this.color = color || 'rgb(255,' + random(0,255) + ',' + random(0,255) + ')';
        this.alpha = alpha || random(0.3, 1);
        this.angle = angle || random(0, 360);
        this.scale = scale || 0.1;
        this.place = place;
        this.speed = speed;
        this.figure = figure;
    }
    Bloom.prototype = {
        setFigure: function(figure) { this.figure = figure; },
        flower: function() {
            this.draw();
            this.scale += 0.1;
            if (this.scale > 1) this.tree.removeBloom(this);
        },
        draw: function() {
            var s = this, ctx = s.tree.ctx, figure = s.figure;
            ctx.save();
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.translate(s.point.x, s.point.y);
            ctx.scale(s.scale, s.scale);
            ctx.rotate(s.angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (var i = 0; i < figure.length; i++) {
                var p = figure.get(i);
                ctx.lineTo(p.x, -p.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        jump: function() {
            var s = this, height = s.tree.height;
            if (s.point.x < -20 || s.point.y > height + 20) {
                s.tree.removeBloom(s);
            } else {
                s.draw();
                s.point = s.place.sub(s.point).div(s.speed).add(s.point);
                s.angle += 0.05;
                s.speed -= 1;
            }
        }
    }

    window.random = random;
    window.bezier = bezier;
    window.Point = Point;
    window.Tree = Tree;

})(window);
