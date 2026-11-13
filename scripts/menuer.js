
const exampleListMenu = `{
	"home": {
		"buttons": [
			{ "label":"play", "menu":"difficultySelect" }
			, { "label":"help", "link":"https://minesweepergame.com/strategy/patterns.php" }
		]
	}
	, "difficultySelect": {
		"buttons": [
			{ "label":"easy", "exit":0 }
			, { "label":"medium", "exit":1 }
			, { "label":"hard", "exit":2 }
			, { "label":"back", "menu":"home" }
		]
	}
}`

function listMenu(
	resolve, reject,
	view, // assumes LayeredView
	inp, // InputQueue
	menujson,
	{
		backgroundColor="#333333",
		buttonColor="#dddddd",
		textColor=null,
		font="monospace",
		home="home",
	}={}
) {
	if (textColor == null) { textColor = backgroundColor; }

	const rnd = view.rnd; // TODO

	const W = 100;
	const H = 141;
	const OUTPAD = W * 0.05;
	const BW = W - 2 * OUTPAD;
	const INPAD = BW * 0.05;

	const menudata = JSON.parse(menujson);
	view.backgroundColor(backgroundColor);
	inp.reset();
	inp.watch("pointerdown");
	view.fit(W, H);
	view.focus(W/2, H/2);

	var buttons;
	var bh;
	var em;
	const configure = () => {
		if (menudata[home] == null) {
			throw new Error("menu (", home, ") does not exist.");
		}
		buttons = menudata[home].buttons;
		bh = (H - OUTPAD) / buttons.length - OUTPAD;
		em = bh/2;

	};
	configure();

	const trigger = (i) => {
		const newmenu = buttons[i].menu;
		const link = buttons[i].link;
		const exit = buttons[i].exit;
		if (link != undefined) {
			window.open(link, '_blank');
		}
		if (exit != undefined) {
			resolve(exit);
			return true;
		}
		if (newmenu != undefined) {
			home = newmenu;
			configure();
		}
		return false;
	};

	const maintain = () => {

		var e;
		while ((e = inp.get()) != undefined) {
			for (let i = 0; i < buttons.length; i += 1) {
				if (OUTPAD < e.jglX
					&& e.jglX < OUTPAD + BW
					&& OUTPAD + i * (bh + OUTPAD) < e.jglY
					&& e.jglY < bh + OUTPAD + i * (bh + OUTPAD)
				) {
					if (trigger(i)) return;
					inp.flush();
					break;
				}
			}
		}

		for (let i = 0; i < buttons.length; i += 1) {
			rnd.setColor(buttonColor);
			rnd.fillRect(
				OUTPAD,
				OUTPAD + i * ( bh + OUTPAD ),
				BW,
				bh
			);
			rnd.setColor(textColor);
			rnd.setFont( font, em );
			rnd.write(
				buttons[i].label,
				OUTPAD + INPAD,
				OUTPAD + i * (bh + OUTPAD) + bh*2/3,
				BW - 2*INPAD,
			);
		}
		rnd.render();

		requestAnimationFrame(maintain);
	}
	maintain();

}
