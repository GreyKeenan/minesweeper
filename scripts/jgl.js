
function timeloop(t0, f) { // t is in milliseconds
	requestAnimationFrame((t) => { f(t, t - t0) });
}

async function startController(controlFunction, ...args) {
	return await new Promise( (resolve, reject) => {
		controlFunction(resolve, reject, ...args);
	});
}

//*
class iSpace {
	f(x, y) { return new Error("unimplemented"); } // -> [x, y]
	g(x, y) { return new Error("unimplemented"); } // -> [x, y]
}
class iIndependentSpace extends iSpace {
	fx(x) { return new Error("unimplemented"); } // -> x
	fy(y) { return new Error("unimplemented"); } // -> y
	gx(x) { return new Error("unimplemented"); } // -> x
	gy(y) { return new Error("unimplemented"); } // -> y
	f(x, y) { return [this.fx(x), this.fy(y)]; }
	g(x, y) { return [this.gx(x), this.gy(y)]; }
}
class Homothety extends iIndependentSpace { // 0 inner, 1 outer
	constructor() {
		super();
		this.x0 = 0;
		this.y0 = 0;
		this.scale0 = 1;
		this.scale1 = 1;
	}
	fx(x0) { return (x0 - this.x0) * this.scale1; }
	fy(y0) { return (y0 - this.y0) * this.scale1; }
	gx(x1) { return x1 * this.scale0 + this.x0; }
	gy(y1) { return y1 * this.scale0 + this.y0; }

	fs(s0) { return s0 * this.scale1; }
	gs(s1) { return s1 * this.scale0; }

	/* focus(x0, y0) {
		this.x0 = x0;
		this.y0 = y0;
	} */
	focusBox(x0,y0, w1,h1) {
		// xy are coords to focus on
		// wh are dimensions of window
		console.log(x0,y0, w1,h1);
		this.x0 = x0 - this.gs(w1/2);
		this.y0 = y0 - this.gs(h1/2);
	}

	fit(w0,h0, w1,h1) { // fit 1 inside of 0
		// none zero obv too
		if (w0 == null || w1 == null) {
			if (h0 == null || h1 == null) { return; }
			this.scale1 = h1/h0;
			this.scale0 = h0/h1;
			return;
		}
		if (h0 == null || h1 == null) {
			this.scale1 = w1/w0;
			this.scale0 = w0/w1;
			return;
		}
		const wratio = w1/w0;
		const hratio = h1/h0;
		if (wratio >= hratio) {
			this.scale1 = hratio;
			this.scale0 = h0/h1;
			return;
		}
		this.scale1 = wratio;
		this.scale0 = w0/w1;
		return;
	}

}


class LayeredRenderer { // manages the canvases
	constructor(canvas, layers=1) {
		this.canvas = canvas;
		this.space = new Homothety();

		this.ctx = this.canvas.getContext("2d");
		this.configureContext(this.ctx);

		const createOffscreen = (z) => {
			const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
			const ctx = offscreen.getContext("2d");
			this.configureContext(ctx);

			return [offscreen, ctx];
		}

		this.offscreens = [];
		this.contexts = [];
		if (layers < 1) { throw new Error("layers < 1"); }
		for (var i = 0; i < layers; i += 1) {
			[this.offscreens[i], this.contexts[i]] = createOffscreen(i);
		}
	}

	configureContext(ctx) {
		ctx.imageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
	}

	render(z = null) {
		if (z == null) {
			for (var i = 0; i < this.offscreens.length; i += 1) {
				this.render(i);
			}
			return;
		}
		this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(
			this.offscreens[z],
			0,0, // this.onscreen.width, this.onscreen.height,
		);
		this.contexts[z].clearRect(0,0, this.offscreens[z].width, this.offscreens[z].height);
	}

	// ===

	// TODO these get reset on resize
	setColor(color, z=0) {
		this.contexts[z].fillStyle = color;
	}
	setFont(font, size, z=0) {
		this.contexts[z].font = String(this.space.fs(size)) + "px " + font;
	}

	drawImage(image, x,y,w,h, z=0) {
		this.contexts[z].drawImage(
			image,
			Math.floor(this.space.fx(x)),
			Math.floor(this.space.fy(y)),
			Math.ceil(this.space.fs(w)),
			Math.ceil(this.space.fs(h)),
		);
	}
	drawCrop(image, sx,sy,sw,sh, x,y,w,h, z=0) {
		this.contexts[z].drawImage(
			image,
			sx,sy,sw,sh, // crop dimensions
			Math.floor(this.space.fx(x)),
			Math.floor(this.space.fy(y)),
			Math.ceil(this.space.fs(w)),
			Math.ceil(this.space.fs(h)),
		);
	}
	fillRect(x,y,w,h, z=0) {
		this.contexts[z].fillRect(
			Math.floor(this.space.fx(x)),
			Math.floor(this.space.fy(y)),
			Math.ceil(this.space.fs(w)),
			Math.ceil(this.space.fs(h)),
		);
	}
	write(text, x,y, maxWidth, z=0) {
		this.contexts[z].fillText(
			text,
			this.space.fx(x), this.space.fy(y),
			this.space.fs(maxWidth),
		);
	}

	createSpritesheet(image, sw,sh, w,h) { //sprite width/height, sprites per w/h
		if (image == null) { throw new Error("null image given"); }
		return (i, ...args) => {
			const x = i % w;
			const y = Math.floor(i / w);

			this.drawCrop(
				image,
				x * sw, y * sh, sw,sh,
				...args,
			);
		};
	}

}

// responding to window resize should be managed by separate object

class LayeredResizeManager { // manages the resizing events
	constructor(div, rnd) {
		this.div = div;
		this.rnd = rnd;

		this.fitx = 100;
		this.fity = 100;
		this.focusx = 0;
		this.focusy = 0;

		this.onResize = () => {
			if (this.width == 0 || this.height == 0) {
				throw new Error("containing div has zero dimensions!");
			}

			this.refitfocus();

			for (var i = 0; i < this.rnd.offscreens.length; i += 1) {
				// TODO look into "window.devicePixelRatio"
				this.rnd.canvas.width = this.div.clientWidth;
				this.rnd.canvas.height = this.div.clientHeight;
				this.rnd.offscreens[i].width = this.div.clientWidth;
				this.rnd.offscreens[i].height = this.div.clientHeight;
				// setting these parameters will clear the canvas
				// it also resets ALL PARAMETERS
				this.rnd.configureContext(this.rnd.ctx);
				this.rnd.configureContext(this.rnd.contexts[i]);
			}
		}

		this.resizeObserver = new ResizeObserver( this.onResize );
		this.resizeObserver.observe(this.div);
		this.onResize();

	}

	refitfocus() {
		this.rnd.space.fit(this.fitx, this.fity, this.div.clientWidth, this.div.clientHeight);
		this.rnd.space.focusBox(this.focusx, this.focusy, this.div.clientWidth, this.div.clientHeight);
	}
}

class LayeredView {
	constructor(div, ...args) {

		this.div = div;

		const canvas = document.createElement("canvas");
		canvas.style.pointerEvents = "none";
			// allows inputs to be detected from lower z index
			// JglInput relies on this being set as such
		this.div.appendChild(canvas);

		this.rnd = new LayeredRenderer(canvas, ...args);
		this.rem = new LayeredResizeManager(div, this.rnd);

		this.backgroundColor();

	}

	fit(w,h) {
		this.rem.fitx = w;
		this.rem.fity = h;
		this.rnd.space.fit(w,h, this.div.clientWidth, this.div.clientHeight);
	}
	focus(x,y) {
		this.rem.focusx = x;
		this.rem.focusy = y;
		this.rnd.space.focusBox(x,y, this.div.clientWidth, this.div.clientHeight);
	}

	backgroundColor(color = "#000000") {
		this.div.style.backgroundColor = color;
	}

}

class InputQueue {
	constructor(div, space) {
		this.div = div;
		this.space = space; // iSpace
		this.div.style.touchAction = "none"; // "manipulation" keeps scroll & pinch-zoom
		this.div.style.userSelect = "none";
		this.div.style.msUserSelect = "none";
		this.div.style.webkitUserSelect = "none";
		this.div.style.webkitTapHighlightColor = "none";
			// disable double-tap zoom
			// this.canvas.style.overscrollBehavior = "none"
		this.q = [];
		this.watchlist = [];

		this.recieve = (e) => {
			[e.jglX, e.jglY] = this.space.g(e.clientX, e.clientY);
			this.q.push(e);
		}

	}

	get() { return this.q.shift(); }
	flush() { this.q = []; }
	reset() {
		for (let i = 0; i < this.watchlist.length; i += 1) {
			this.unwatch(this.watchlist[i]);
		}
		this.watchlist = [];
		this.q = [];
	}

	/*
	By function pointer, duplicate addEventListeners will be a single one.

	https://w3c.github.io/pointerevents/

	pointerup, pointermove, pointerdown,
	keydown, keyup, keypress,
	scroll, scrollend,
	*/
	watch(eventName) { // MUST UNWATCH LATER OR LEAK
		this.div.addEventListener(eventName, this.recieve);
		this.watchlist.push(eventName);
	}
	unwatch(eventName) {
		this.div.removeEventListener(eventName, this.recieve);
			// dont rly need to clear the watchlist but would be nice
	}

}

class PointerTracker {
	constructor(div, space) {
		this.div = div;
		this.space = space; //iSpace

		this.state = {
			x1:0, y1:0, // current pointer position
			pressed:false,
			sincex1:0, sincey1:0, // where was last pressed/released
		}

		this.watchPointerDown = (e) => {
			this.state.pressed = true;
			this.state.x1 = e.clientX;
			this.state.y1 = e.clientY;
			this.state.sincex1 = e.clientX;
			this.state.sincey1 = e.clientY;
		};
		this.watchPointerMove = (e) => {
			this.state.x1 = e.clientX;
			this.state.y1 = e.clientY;
			// e.movementX is change in x since last
		};
		this.watchPointerUp = (e) => {
			this.state.pressed = false;
			this.state.x1 = e.clientX;
			this.state.y1 = e.clientY;
			this.state.sincex1 = e.clientX;
			this.state.sincey1 = e.clientY;
		};

	}

	enable_MUST_DISABLE_LATER() {
		this.div.addEventListener("pointerDown", this.watchPointerDown);
		this.div.addEventListener("poinermove", this.watchPointerMove);
		this.div.addEventListener("pointerUp", this.watchPointerUp);
	}
	disable() { // MUST BE CALLED BEFORE DELETING THIS OBJ OR MEM LEAK
		this.div.removeEventListener("pointerDown", this.watchPointerDown);
		this.div.removeEventListener("poinermove", this.watchPointerMove);
		this.div.removeEventListener("pointerUp", this.watchPointerUp);
	}

	query() {
		const [x0,y0] = this.space.g(this.state.x1, this.state.y1);
		const [sx0,sy0] = this.space.g(this.state.sincex1, this.state.sincey1);
		return {
			x: x0,
			y: y0,
			pressed: this.state.pressed,
			x0: sx0,
			y0: sy0,
		}
	}

}

