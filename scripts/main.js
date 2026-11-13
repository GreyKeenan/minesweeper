
const EASY = {
	size: 64, // 81&10 in remake vs 64&10 originally
	percent: 10/64,
};
const MEDIUM = {
	size: 256,
	percent: 5/32,
};
const HARD = {
	size: 480,
	percent: 99/480,
};
const DIFFICULTIES = [ EASY, MEDIUM, HARD ];

function drawField(drawSprite, field, w,h, hideDecorations, reveal) {
	var here;
	for (var i = 0; i < w; i += 1) {
		for (var j = 0; j < h; j += 1) {
			here = field(i,j);
			if (!(here & DUG)) {
				//if (reveal && (here & MINE)) {
					//drawSprite(11,i,j,1,1); // mine
					//drawSprite(14,i,j,1,1); // X
					//continue
				//}
				if ((here & FLAG) && !hideDecorations) {
					if (reveal && !(here & MINE)) {
						drawSprite(14,i,j,1,1); // X
					} else {
						drawSprite(13,i,j,1,1); // flag
					}
					continue;
				}
				drawSprite(12,i,j,1,1); // undug
			} else if (here & MINE) {
				drawSprite(11,i,j,1,1); // mine
			} else { // dug non-mine
				if (hideDecorations || ((here & COUNT) == 0) ) {
					drawSprite(10,i,j,1,1);
				} else {
					drawSprite(here & COUNT,i,j,1,1);
				}
			}
		}
	}
}

function findRatio(w,h, size) {
	if (w <= h) {
		const viewratio = h/w;
		var width = 0;
		var difference = 0;
		const maxTest = Math.floor(Math.sqrt(size));
		for (var i = 1; i <= maxTest; i += 1) {
			var check = i * Math.floor(i * viewratio);
			var diffnow = Math.abs(check - size);
			if (diffnow < difference || difference == 0) {
				width = i;
				difference = diffnow;
			}
		}
		return [width, Math.floor(width * viewratio)];
	}

	const viewratio = w/h;
	var height = 0;
	var difference = 0;
	const maxTest = Math.floor(Math.sqrt(size));
	for (var i = 1; i <= maxTest; i += 1) {
		var check = i * Math.floor(i * viewratio);
		var diffnow = Math.abs(check - size);
		if (diffnow < difference || difference == 0) {
			height = i;
			difference = diffnow;
		}
	}
	return [Math.floor(height * viewratio), height];
}

function game(view, inp, difficulty) {
	inp.reset();
	inp.watch("pointerdown");

	view.backgroundColor("#324056");

	const [W,H] = findRatio(view.div.clientWidth, view.div.clientHeight, DIFFICULTIES[difficulty].size);
	const M = Math.round((W*H*DIFFICULTIES[difficulty].percent));
	console.log(W, "x", H, "-", M);

	const DBL_TIMEOUT = 300; //milliseconds

	const drawSprite = view.rnd.createSpritesheet(document.getElementById("banana"), 8,8, 4,4);

	view.fit(W + 0.5, H + 0.5);
	view.focus(W/2,H/2);

	const field = fieldOn2dArray(null, W,H);

	// rendering flags
	var hideDecorations = false;
	var reveal = false;

	var done = false;
	var lt = 0;
	var lx = 0;
	var ly = 0;
	var x = 0;
	var y = 0;
	var t = 0;
	var fieldIsPopulated = false;
	var totalDug = 0;
	var totalHit = 0;
	function run() {
		var dbl = false;
		while ((e = inp.get()) != undefined) {

			if (done) {
				switchToMenu(view, inp, "difficultySelect");
				return;
			}

			lt = t;
			lx = x;
			ly = y;
			t = e.timeStamp; // milliseconds
			x = Math.floor(e.jglX);
			y = Math.floor(e.jglY);

			if (
				(t - lt < DBL_TIMEOUT)
				&& (x == lx && y == ly)
			) { dbl = true; }

			if ( x < 0 || y < 0 || x >= W || y >= H) { continue; }

			if (!fieldIsPopulated) {
				layMines(field, W,H,M, x,y);
				fieldIsPopulated = true;
				dbl = true;
			}

			if ( dbl || (field(x,y) & DUG)) {
				var [dug,hit] = dig(field, x,y);
				//console.log(dug, hit);
				totalDug += dug;
				totalHit += hit;
				if (totalHit) {
					reveal = true;
					done = true;
				} else if (totalDug >= W*H - M) {
					hideDecorations = true;
					done = true;
				}
				//console.log(totalDug, totalHit, W*H-M, hideDecorations, reveal, done);
			} else {
				flag(field, x,y);
			}

		}


		drawField(drawSprite, field, W,H, hideDecorations, reveal);
		view.rnd.render();

		requestAnimationFrame(run);
	}
	run();
}

function switchToMenu(view, inp, home) {
	startController(listMenu,
		view, inp, exampleListMenu,
		{
			backgroundColor:"#324056",
			buttonColor:"#557185",
			textColor:"#ffd079",
			home:home,
		}
	).then((exitStatus)=>{
		game(view, inp, exitStatus);
	});
}


function main(divid) {
	const div = document.getElementById(divid);
	const view = new LayeredView(div);
	const inp = new InputQueue(div, view.rnd.space);

	switchToMenu(view, inp, "home");

}

