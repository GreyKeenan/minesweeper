
const EASY = {
	size: 81,
	percent: 10/81,
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

function drawField(rnd, field, w,h, drawSprite) {
	var here;
	for (var i = 0; i < w; i += 1) {
		for (var j = 0; j < h; j += 1) {
			here = field(i,j);
			if (!(here & DUG)) {
				if ((here & FLAG) != 0) {
					drawSprite(13,i,j,1,1);
					continue;
				}
				drawSprite(12,i,j,1,1);
			} else if (here & MINE) {
				drawSprite(11,i,j,1,1);
			} else {
				if ((here & COUNT) == 0) {
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

	view.backgroundColor("black");

	const [W,H] = findRatio(view.div.clientWidth, view.div.clientHeight, DIFFICULTIES[difficulty].size);
	const M = Math.round((W*H*DIFFICULTIES[difficulty].percent));
	console.log(W, "x", H, "-", M);

	const DBL_TIMEOUT = 300; //milliseconds

	const drawSprite = view.rnd.createSpritesheet(document.getElementById("banana"), 8,8, 4,4);

	view.fit(W + 0.5, H + 0.5);
	view.focus(W/2,H/2);

	const field = fieldOn2dArray(null, W,H);

	var lt = 0;
	var lx = 0;
	var ly = 0;
	var x = 0;
	var y = 0;
	var t = 0;
	var fieldIsPopulated = false;
	function run() {
		var dbl = false;
		while ((e = inp.get()) != undefined) {
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
				dig(field, x,y);
			}

			if ( dbl || (field(x,y) & DUG)) {
				dig(field, x,y);
			} else {
				flag(field, x,y);
			}

		}

		drawField(view.rnd, field, W,H, drawSprite);
		view.rnd.render();

		requestAnimationFrame(run);
	}
	run();
}

/*
const menujson = `{
	"home": {
		"buttons": [
			{ "label":"play", "exit":0 }
			, { "label":"placeholder", "link":"" }
		]
	}
}`
*/


function main(divid) {
	const div = document.getElementById(divid);
	const view = new LayeredView(div);
	const inp = new InputQueue(div, view.rnd.space);

	startController(listMenu,
		view, inp, exampleListMenu,
		{
			backgroundColor:"black",
			//buttonColor:"white",
			//textColor:"black",
		}
	).then((exitStatus)=>{
		game(view, inp, exitStatus);
	});

}

