
function drawField(rnd, field, w,h) {
	var here;
	for (var i = 0; i < w; i += 1) {
		for (var j = 0; j < h; j += 1) {
			here = field(i,j);
			if (!(here & DUG)) {
				rnd.setColor("forestgreen");
				rnd.fillRect(i,j, 0.9,0.9);
				// draw rlags
				if ((here & FLAG) != 0) {
					rnd.setColor("black");
					rnd.setFont( "monospace", 0.5 );
					rnd.write("f", i + 0.1, j + 0.6, 0.9);
				}
			} else if (here & MINE) {
				rnd.setColor("red");
				rnd.fillRect(i,j, 0.9,0.9);
			} else {
				rnd.setColor("tan");
				rnd.fillRect(i,j, 0.9,0.9);
				// draw number
				if ((here & COUNT) != 0) {
					rnd.setColor("black");
					rnd.setFont( "monospace", 0.5 );
					rnd.write(String(here & COUNT), i + 0.1, j + 0.6, 0.9);
				}
			}
		}
	}
}

function game(view, inp) {
	inp.reset();
	inp.watch("pointerdown");

	view.backgroundColor("black");

	const W = 8;
	const H = 8;
	const DBL_TIMEOUT = 300; //milliseconds

	view.fit(W + 0.5, H + 0.5);
	view.focus(4,4);

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

			if (!fieldIsPopulated) {
				layMines(field, W,H,8, x,y);
				fieldIsPopulated = true;
				dig(field, x,y);
			}

			if ( dbl || (field(x,y) & DUG)) {
				dig(field, x,y);
			} else {
				flag(field, x,y);
			}

		}

		drawField(view.rnd, field, W,H);
		view.rnd.render();

		requestAnimationFrame(run);
	}
	run();
}

const menujson = `{
	"home": {
		"buttons": [
			{ "label":"play", "exit":0 }
			, { "label":"placeholder", "link":"" }
		]
	}
}`


function main(divid) {
	const div = document.getElementById(divid);
	const view = new LayeredView(div);
	const inp = new InputQueue(div, view.rnd.space);

	startController(listMenu,
		view, inp, menujson,
		{
			backgroundColor:"black",
			//buttonColor:"white",
			//textColor:"black",
		}
	).then((exitStatus)=>{
		game(view, inp);
	});

}

